package models

import (
	"context"
	"fmt"
	"time"
)

// GetAircrafts returns already recorded aircrafts
func (m *DBModel) GetAircrafts(condition int) (aircrafts map[string]string, err error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	aircrafts = make(map[string]string)

	var query string
	if condition == LastAircrafts {
		query = "SELECT DISTINCT aircraft_model, reg_name FROM " +
			"(SELECT aircraft_model, reg_name FROM logbook_view " +
			"WHERE aircraft_model <> '' ORDER BY m_date DESC LIMIT 100) AS T1 " +
			"ORDER BY aircraft_model "
	} else {
		query = "SELECT aircraft_model, reg_name FROM logbook_view WHERE aircraft_model <> '' " +
			"GROUP BY aircraft_model, reg_name ORDER BY aircraft_model"
	}

	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return aircrafts, err
	}
	defer rows.Close()

	var aircraftModel, regName string
	for rows.Next() {
		if err = rows.Scan(&aircraftModel, &regName); err != nil {
			return aircrafts, err
		}
		aircrafts[regName] = aircraftModel
	}

	return aircrafts, nil
}

// GetAircraftModels returns the list of the recorded aircraft models/types
func (m *DBModel) GetAircraftModels() (models []string, err error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `SELECT DISTINCT aircraft_model 
		FROM logbook_view 
		WHERE aircraft_model <> '' 
		ORDER BY aircraft_model`
	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return models, err
	}
	defer rows.Close()

	for rows.Next() {
		var model string
		if err = rows.Scan(&model); err != nil {
			return models, err
		}
		models = append(models, model)
	}

	return models, nil
}

// GetAircraftRegs returns the list of the recorded aircraft registrations
func (m *DBModel) GetAircraftRegs(records int) (regs []string, err error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `SELECT DISTINCT reg_name
		FROM logbook_view
		WHERE reg_name <> ""
		ORDER BY reg_name`
	if records > 0 {
		query = `SELECT DISTINCT reg_name
			FROM (
				SELECT reg_name
				FROM logbook_view
				WHERE reg_name <> ""
				ORDER BY m_date DESC
				LIMIT ` + fmt.Sprintf("%d", records) +
			`) subquery
			ORDER BY reg_name;`
	}

	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return regs, err
	}
	defer rows.Close()

	for rows.Next() {
		var reg string
		if err = rows.Scan(&reg); err != nil {
			return regs, err
		}
		regs = append(regs, reg)
	}

	return regs, nil
}

// GetAircraftClasses returns aircraft clasess
func (m *DBModel) GetAircraftClasses() (map[string]string, error) {

	settings, err := m.GetSettings()
	if err != nil {
		return nil, err
	}
	return settings.AircraftClasses, err
}
