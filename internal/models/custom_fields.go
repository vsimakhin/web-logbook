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
