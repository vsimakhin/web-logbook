package models

import (
	"context"
	"time"
)

// GetAirportByID return airport record by ID (ICAO or IATA)
func (m *DBModel) GetAirportByID(id string) (Airport, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var airport Airport

	row := m.DB.QueryRowContext(ctx, `
		SELECT
			icao, iata, name, city,
			country, elevation, lat, lon
		FROM airports
		WHERE icao = ? or iata = ?`, id, id)

	err := row.Scan(&airport.ICAO, &airport.IATA, &airport.Name, &airport.City,
		&airport.Country, &airport.Elevation, &airport.Lat, &airport.Lon)

	if err != nil {
		return airport, err
	}

	return airport, nil
}

func (m *DBModel) UpdateAirportDB(airports []Airport) (int, error) {
	var err error

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	records := 0

	_, err = m.DB.ExecContext(ctx, `DROP INDEX airports_icao;`)
	if err != nil {
		return records, err
	}

	_, err = m.DB.ExecContext(ctx, `DELETE FROM airports;`)
	if err != nil {
		return records, err
	}

	_, err = m.DB.ExecContext(ctx, `BEGIN TRANSACTION;`)
	if err != nil {
		return records, err
	}

	for _, airport := range airports {

		_, err = m.DB.ExecContext(ctx, `
		INSERT INTO airports
			(icao, iata, name, city,
			country, elevation, lat, lon)
		VALUES (?, ?, ?, ?,
			?, ?, ?, ?)`,
			airport.ICAO, airport.IATA, airport.Name, airport.City,
			airport.Country, airport.Elevation, airport.Lat, airport.Lon,
		)

		if err != nil {
			return records, err
		}
	}

	_, err = m.DB.ExecContext(ctx, `COMMIT;`)
	if err != nil {
		return records, err
	}

	_, err = m.DB.ExecContext(ctx, `CREATE UNIQUE INDEX IF NOT EXISTS airports_icao ON airports(icao);`)
	if err != nil {
		return records, err
	}

	records, err = m.GetAirportCount()
	if err != nil {
		return records, err
	}

	return records, err
}

func (m *DBModel) GetAirportCount() (int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	records := 0

	row := m.DB.QueryRowContext(ctx, `SELECT COUNT(*) FROM airports;`)

	err := row.Scan(&records)

	if err != nil {
		return records, err
	}

	return records, nil
}
