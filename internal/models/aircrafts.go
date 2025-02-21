package models

import (
	"fmt"
)

// GetAircraftsInLogbook returns already recorded aircrafts
func (m *DBModel) GetAircraftsInLogbook(condition int) (aircrafts map[string]string, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
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
	ctx, cancel := m.ContextWithDefaultTimeout()
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
	ctx, cancel := m.ContextWithDefaultTimeout()
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

func (m *DBModel) GenerateAircraftTable() (err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `INSERT INTO aircrafts (reg_name, aircraft_model)
		SELECT lv.reg_name, lv.aircraft_model
		FROM logbook_view lv
		WHERE lv.aircraft_model <> ''
		AND lv.reg_name NOT IN (
			SELECT a.reg_name 
			FROM aircrafts a
		)
		GROUP BY lv.aircraft_model, lv.reg_name`
	_, err = m.DB.ExecContext(ctx, query)
	return err
}

func (m *DBModel) GenerateAircraftCategoriesTable() (err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `INSERT INTO aircraft_categories (model, categories)
		SELECT lv.aircraft_model, ''
		FROM logbook_view lv
		WHERE lv.aircraft_model <> ''
		AND lv.aircraft_model NOT IN (
			SELECT ac.model
			FROM aircraft_categories ac
		)
		GROUP BY lv.aircraft_model`
	_, err = m.DB.ExecContext(ctx, query)
	return err
}

func (m *DBModel) GetAircraftModelsCategories() (categories []Category, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `SELECT model, categories FROM aircraft_categories ORDER BY model`
	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return categories, err
	}
	defer rows.Close()

	for rows.Next() {
		var cat Category
		if err = rows.Scan(&cat.Model, &cat.Category); err != nil {
			return categories, err
		}
		categories = append(categories, cat)
	}

	return categories, nil
}

func (m *DBModel) GetAircrafts() (aircrafts []Aircraft, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `SELECT 
				reg_name, aircraft_model, categories
			FROM aircrafts_view av`
	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return aircrafts, err
	}
	defer rows.Close()

	for rows.Next() {
		var ac Aircraft
		if err = rows.Scan(&ac.Reg, &ac.Model, &ac.Category); err != nil {
			return aircrafts, err
		}
		aircrafts = append(aircrafts, ac)
	}

	return aircrafts, nil
}

func (m *DBModel) UpdateAircraftModelsCategories(category Category) (err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `UPDATE aircraft_categories
		SET categories = ?
		WHERE model = ?`
	_, err = m.DB.ExecContext(ctx, query, category.Category, category.Model)

	return nil
}
