package models

import "encoding/json"

func (m *DBModel) GetCurrencies() (currencies []Currency, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `SELECT  
			uuid, name, metric, target_value, time_frame_unit, time_frame_value,
			comparison, filters
		FROM currency`
	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return currencies, err
	}
	defer rows.Close()

	for rows.Next() {
		var c Currency
		var filters string
		if err = rows.Scan(&c.UUID, &c.Name, &c.Metric, &c.TargetValue,
			&c.TimeFrame.Unit, &c.TimeFrame.Value, &c.Comparison, &filters); err != nil {
			return currencies, err
		}
		if filters != "" {
			if err = json.Unmarshal([]byte(filters), &c.Filters); err != nil {
				return currencies, err
			}
		} else {
			c.Filters = make(map[string]string)
		}
		currencies = append(currencies, c)
	}

	return currencies, nil
}

func (m *DBModel) GetCurrency(uuid string) (c Currency, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `SELECT  
			uuid, name, metric, target_value, time_frame_unit, time_frame_value,
			comparison, filters
		FROM currency WHERE uuid = ?`
	row := m.DB.QueryRowContext(ctx, query, uuid)
	var filters string
	if err = row.Scan(&c.UUID, &c.Name, &c.Metric, &c.TargetValue,
		&c.TimeFrame.Unit, &c.TimeFrame.Value, &c.Comparison, &filters); err != nil {
		return c, err
	}
	if filters != "" {
		if err = json.Unmarshal([]byte(filters), &c.Filters); err != nil {
			return c, err
		}
	} else {
		c.Filters = make(map[string]string)
	}

	return c, nil
}

func (m *DBModel) UpdateCurrency(c Currency) (err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	// convert filters to JSON
	filters, err := json.Marshal(c.Filters)
	if err != nil {
		return err
	}

	query := `UPDATE currency SET 
			name = ?, metric = ?, target_value = ?, time_frame_unit = ?, time_frame_value = ?,
			comparison = ?, filters = ?
		WHERE uuid = ?`
	_, err = m.DB.ExecContext(ctx, query, c.Name, c.Metric, c.TargetValue,
		c.TimeFrame.Unit, c.TimeFrame.Value, c.Comparison, string(filters), c.UUID)
	return err
}

func (m *DBModel) InsertCurrency(c Currency) (err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	// convert filters to JSON
	filters, err := json.Marshal(c.Filters)
	if err != nil {
		return err
	}

	query := `INSERT INTO currency (uuid, name, metric, target_value, time_frame_unit, time_frame_value,
			comparison, filters)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	_, err = m.DB.ExecContext(ctx, query, c.UUID, c.Name, c.Metric, c.TargetValue,
		c.TimeFrame.Unit, c.TimeFrame.Value, c.Comparison, string(filters))
	return err
}

func (m *DBModel) DeleteCurrency(uuid string) (err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `DELETE FROM currency WHERE uuid = ?`
	_, err = m.DB.ExecContext(ctx, query, uuid)
	return err
}
