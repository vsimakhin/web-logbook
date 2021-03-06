package models

import (
	"context"
	"regexp"
	"strings"
	"time"
)

// GetAirportByID return airport record by ID (ICAO or IATA)
func (m *DBModel) GetAirportByID(id string) (Airport, error) {
	// check airport id in cache first
	if value, ok := acache[id]; ok {
		return value, nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var airport Airport

	id = strings.Trim(id, " ")

	query := "SELECT icao, iata, name, city, country, elevation, lat, lon " +
		"FROM airports WHERE icao = ? or iata = ?"
	row := m.DB.QueryRowContext(ctx, query, id, id)

	err := row.Scan(&airport.ICAO, &airport.IATA, &airport.Name, &airport.City,
		&airport.Country, &airport.Elevation, &airport.Lat, &airport.Lon)

	if err != nil {
		return airport, err
	}

	// add to cache
	acache[id] = airport

	return airport, nil
}

// GetAirports generates Airports DB for rendering maps
func (m *DBModel) GetAirports() (map[string]Airport, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	airports := make(map[string]Airport)
	var airport Airport

	query := "SELECT icao, iata, name, city, country, elevation, lat, lon FROM airports"
	rows, err := m.DB.QueryContext(ctx, query)

	if err != nil {
		return airports, err
	}
	defer rows.Close()

	for rows.Next() {
		err := rows.Scan(&airport.ICAO, &airport.IATA, &airport.Name, &airport.City,
			&airport.Country, &airport.Elevation, &airport.Lat, &airport.Lon)

		if err != nil {
			return airports, err
		}

		airports[airport.ICAO] = airport
		airports[airport.IATA] = airport
	}

	return airports, nil
}

// UpdateAirportDB updates airports table
func (m *DBModel) UpdateAirportDB(airports []Airport) (int, error) {
	var err error

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	records := 0

	// drop index since we completely recreate all records in the table
	_, err = m.DB.ExecContext(ctx, "DROP INDEX airports_icao;")
	if err != nil {
		return records, err
	}
	_, err = m.DB.ExecContext(ctx, "DROP INDEX airports_iata;")
	if err != nil {
		return records, err
	}

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
		if isAlpha(airport.ICAO) { // check for valid ICAO codes only
			query := "INSERT INTO airports (icao, iata, name, city, country, elevation, lat, lon) " +
				"VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
			_, err := tx.ExecContext(ctx, query,
				airport.ICAO, airport.IATA, airport.Name, airport.City,
				airport.Country, airport.Elevation, airport.Lat, airport.Lon,
			)

			if err != nil {
				return records, err
			}
		}
	}

	// commit transaction
	err = tx.Commit()
	if err != nil {
		return records, err
	}

	// finally new fresh index
	_, err = m.DB.ExecContext(ctx, "CREATE UNIQUE INDEX IF NOT EXISTS airports_icao ON airports(icao);")
	if err != nil {
		return records, err
	}
	_, err = m.DB.ExecContext(ctx, "CREATE INDEX IF NOT EXISTS airports_iata ON airports(iata);")
	if err != nil {
		return records, err
	}

	records, err = m.GetAirportCount()
	if err != nil {
		return records, err
	}

	return records, err
}

// GetAirportCount returns amount of records in the airports table
func (m *DBModel) GetAirportCount() (int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	records := 0

	row := m.DB.QueryRowContext(ctx, "SELECT COUNT(*) FROM airports")

	err := row.Scan(&records)

	if err != nil {
		return records, err
	}

	return records, nil
}
