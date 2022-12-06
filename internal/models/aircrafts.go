package models

import (
	"context"
	"time"
)

// GetAircrafts returns already recorded aircrafts
func (m *DBModel) GetAircrafts(condition int) (map[string]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	aircrafts := make(map[string]string)

	var query string
	var aircraftModel string
	var regName string

	if condition == LastAircrafts {
		query = "SELECT aircraft_model, reg_name FROM " +
			"(SELECT aircraft_model, reg_name FROM logbook_view WHERE aircraft_model <> '' ORDER BY m_date DESC LIMIT 100) " +
			"GROUP BY aircraft_model, reg_name ORDER BY aircraft_model "
	} else {
		query = "SELECT aircraft_model, reg_name FROM logbook_view WHERE aircraft_model <> '' " +
			"GROUP BY aircraft_model, reg_name ORDER BY aircraft_model"
	}
	rows, err := m.DB.QueryContext(ctx, query)

	if err != nil {
		return aircrafts, err
	}
	defer rows.Close()

	for rows.Next() {
		err = rows.Scan(&aircraftModel, &regName)

		if err != nil {
			return aircrafts, err
		}
		aircrafts[regName] = aircraftModel
	}

	return aircrafts, nil
}

// GetAircraftClasses returns aircraft clasess
func (m *DBModel) GetAircraftClasses() (map[string]string, error) {

	settings, err := m.GetSettings()
	return settings.AircraftClasses, err
}
