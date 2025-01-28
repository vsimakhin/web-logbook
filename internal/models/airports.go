package models

import (
	"context"
	"database/sql"
	"regexp"
	"strings"
	"sync"
	"time"
)

var airportCache sync.Map

// GetAirportByID return airport record by ID (ICAO or IATA)
func (m *DBModel) GetAirportByID(id string) (airport Airport, err error) {
	// check airport id in cache first
	id = strings.TrimSpace(id)
	if cachedAirport, ok := airportCache.Load(id); ok {
		return cachedAirport.(Airport), nil
	}

	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "SELECT icao, iata, name, city, country, elevation, lat, lon " +
		"FROM airports_view WHERE icao = ? or iata = ?"
	row := m.DB.QueryRowContext(ctx, query, id, id)
	err = row.Scan(&airport.ICAO, &airport.IATA, &airport.Name, &airport.City,
		&airport.Country, &airport.Elevation, &airport.Lat, &airport.Lon)

	if err != nil {
		if err == sql.ErrNoRows {
			return airport, nil
		}
		return airport, err
	}

	// add to cache
	airportCache.Store(id, airport)

	return airport, nil
}

// GetAirports generates Airports DB for rendering maps
func (m *DBModel) GetAirports() (airports map[string]Airport, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	airports = make(map[string]Airport)

	query := "SELECT icao, iata, name, city, country, elevation, lat, lon FROM airports_view"
	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return airports, err
	}
	defer rows.Close()

	for rows.Next() {
		var airport Airport
		if err = rows.Scan(&airport.ICAO, &airport.IATA, &airport.Name, &airport.City,
			&airport.Country, &airport.Elevation, &airport.Lat, &airport.Lon); err != nil {
			return airports, err
		}

		airports[airport.ICAO] = airport
		airports[airport.IATA] = airport
	}

	return airports, nil
}

// UpdateAirportDB updates airports table
func (m *DBModel) UpdateAirportDB(airports []Airport, noICAOFilter bool) (records int, err error) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	records = 0

	_, err = m.DB.ExecContext(ctx, "DELETE FROM airports;")
	if err != nil {
		return records, err
	}

	// let's make it in transaction
	tx, err := m.DB.Begin()
	if err != nil {
		return records, err
	}

	isAlpha := regexp.MustCompile(`^[A-Z]+$`).MatchString
	for _, airport := range airports {
		if !noICAOFilter && (!isAlpha(airport.ICAO) || len(airport.ICAO) != 4) {
			// Skip invalid ICAO codes
			continue
		}

		query := "INSERT INTO airports (icao, iata, name, city, country, elevation, lat, lon) " +
			"VALUES (?, ?, ?, ?, ?, ?, ?, ?)"

		if _, err = tx.ExecContext(ctx, query,
			airport.ICAO, airport.IATA, airport.Name, airport.City,
			airport.Country, airport.Elevation, airport.Lat, airport.Lon); err != nil {
			tx.Rollback()
			return records, err
		}
	}

	// commit transaction
	if err = tx.Commit(); err != nil {
		return records, err
	}

	records, err = m.GetAirportCount()
	if err != nil {
		return records, err
	}

	return records, err
}

// GetAirportCount returns amount of records in the airports table
func (m *DBModel) GetAirportCount() (records int, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	row := m.DB.QueryRowContext(ctx, "SELECT COUNT(*) FROM airports")
	if err = row.Scan(&records); err != nil {
		return 0, err
	}

	return records, nil
}

// fetchAirports is a helper function to fetch airports based on a query and a scan function
func (m *DBModel) fetchAirports(query string) (airports []Airport, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var airport Airport
		if err = rows.Scan(&airport.ICAO, &airport.IATA, &airport.Name, &airport.City,
			&airport.Country, &airport.Elevation, &airport.Lat, &airport.Lon); err != nil {
			return airports, err
		}
		airports = append(airports, airport)
	}

	return airports, nil
}

// GetAllAirports returns all airports
func (m *DBModel) GetAllAirports() (airports []Airport, err error) {
	query := "SELECT icao, iata, name, city, country, elevation, lat, lon FROM airports_view"
	return m.fetchAirports(query)
}

// GetStandardAirports returns a list of Standard Airports
func (m *DBModel) GetStandardAirports() (airports []Airport, err error) {
	query := "SELECT icao, iata, name, city, country, elevation, lat, lon FROM airports"
	return m.fetchAirports(query)
}

// GetCustomAirports returns a list of Custom Airports
func (m *DBModel) GetCustomAirports() (airports []Airport, err error) {
	query := "SELECT name as icao, name as iata, name, city, country, elevation, lat, lon FROM airports_custom"
	return m.fetchAirports(query)
}

// AddCustomAirport adds new custom/user airport
func (m *DBModel) AddCustomAirport(arpt Airport) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "INSERT INTO airports_custom " +
		"(name, city, country, elevation, lat, lon) " +
		"VALUES (?, ?, ?, ?, ?, ?)"
	_, err := m.DB.ExecContext(ctx, query,
		arpt.Name, arpt.City, arpt.Country, arpt.Elevation, arpt.Lat, arpt.Lon,
	)

	if err != nil {
		return err
	}

	return nil
}

// RemoveCustomAirport removes custom/user airport
func (m *DBModel) RemoveCustomAirport(airport string) (err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	_, err = m.DB.ExecContext(ctx, "DELETE FROM airports_custom WHERE name = ?", airport)
	return err
}
