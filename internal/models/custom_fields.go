package models

func (m *DBModel) GetCustomFields() (fields []CustomField, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `
		SELECT
			uuid, name, description, category, type, stats_function, IFNULL(pdf_header,"") as pdf_header
		FROM custom_fields`
	rows, err := m.DB.QueryContext(ctx, query)

	if err != nil {
		return fields, err
	}
	defer rows.Close()

	for rows.Next() {
		var f CustomField
		if err = rows.Scan(&f.UUID, &f.Name, &f.Description, &f.Category, &f.Type, &f.StatsFunction, &f.PDFHeader); err != nil {
			return fields, err
		}
		fields = append(fields, f)
	}
	if err = rows.Err(); err != nil {
		return fields, err
	}
	return fields, nil
}

func (m *DBModel) GetCustomField(uuid string) (f CustomField, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `
		SELECT
			uuid, name, description, category, type, stats_function, IFNULL(pdf_header,"") as pdf_header
		FROM custom_fields
		WHERE uuid = ?`
	row := m.DB.QueryRowContext(ctx, query, uuid)

	if err = row.Scan(&f.UUID, &f.Name, &f.Description, &f.Category, &f.Type, &f.StatsFunction, &f.PDFHeader); err != nil {
		return f, err
	}
	return f, nil
}

func (m *DBModel) InsertCustomField(f CustomField) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `
		INSERT INTO custom_fields
			(uuid, name, description, category, type, stats_function, pdf_header)
		VALUES (?, ?, ?, ?, ?, ?, ?)`
	_, err := m.DB.ExecContext(ctx, query,
		f.UUID, f.Name, f.Description, f.Category, f.Type, f.StatsFunction, f.PDFHeader)

	return err
}

func (m *DBModel) UpdateCustomField(f CustomField) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `
		UPDATE custom_fields
			SET name = ?, description = ?, category = ?, type = ?, stats_function = ?, pdf_header = ?
		WHERE uuid = ?`
	_, err := m.DB.ExecContext(ctx, query,
		f.Name, f.Description, f.Category, f.Type, f.StatsFunction, f.PDFHeader,
		f.UUID)

	return err
}

func (m *DBModel) DeleteCustomField(uuid string) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `DELETE FROM custom_fields WHERE uuid = ?`
	_, err := m.DB.ExecContext(ctx, query, uuid)

	return err
}
