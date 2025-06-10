package models

func (m *DBModel) GetCustomFields() (fields []CustomField, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `SELECT
				uuid, name, description, type, stats_function,
				size_xs, size_md, size_lg, display_order
			FROM custom_fields
			ORDER BY display_order`
	rows, err := m.DB.QueryContext(ctx, query)

	if err != nil {
		return fields, err
	}
	defer rows.Close()

	for rows.Next() {
		var f CustomField
		if err = rows.Scan(&f.UUID, &f.Name, &f.Description, &f.Type, &f.StatsFunction,
			&f.SizeXs, &f.SizeMd, &f.SizeLg, &f.DisplayOrder); err != nil {
			return fields, err
		}
		fields = append(fields, f)
	}
	return fields, nil
}

func (m *DBModel) GetCustomField(uuid string) (field CustomField, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `SELECT
				uuid, name, description, type, stats_function,
				size_xs, size_md, size_lg, display_order
			FROM custom_fields
			WHERE uuid = ?`
	row := m.DB.QueryRowContext(ctx, query, uuid)

	if err = row.Scan(&field.UUID, &field.Name, &field.Description, &field.Type, &field.StatsFunction,
		&field.SizeXs, &field.SizeMd, &field.SizeLg, &field.DisplayOrder); err != nil {
		return field, err
	}
	return field, nil
}

func (m *DBModel) InsertCustomField(f CustomField) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `INSERT INTO custom_fields
				(uuid, name, description, type, stats_function,
				size_xs, size_md, size_lg, display_order)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	_, err := m.DB.ExecContext(ctx, query,
		f.UUID, f.Name, f.Description, f.Type, f.StatsFunction,
		f.SizeXs, f.SizeMd, f.SizeLg, f.DisplayOrder)

	return err
}

func (m *DBModel) UpdateCustomField(f CustomField) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `UPDATE custom_fields
				SET name = ?, description = ?, type = ?, stats_function = ?,
					size_xs = ?, size_md = ?, size_lg = ?, display_order = ?
				WHERE uuid = ?`
	_, err := m.DB.ExecContext(ctx, query,
		f.Name, f.Description, f.Type, f.StatsFunction,
		f.SizeXs, f.SizeMd, f.SizeLg, f.DisplayOrder, f.UUID)

	return err
}

func (m *DBModel) DeleteCustomField(uuid string) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `DELETE FROM custom_fields WHERE uuid = ?`
	_, err := m.DB.ExecContext(ctx, query, uuid)

	return err
}
