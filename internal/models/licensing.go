package models

import (
	"context"
	"time"
)

// GetFlightRecords returns the flight records in the logbook table
func (m *DBModel) GetLicenses() ([]License, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var lic License
	var licenses []License

	rows, err := m.DB.QueryContext(ctx, `
		SELECT
			uuid, category, name, number, issued,
			valid_from, valid_until, document_name, document
		FROM licensing
		ORDER BY category, name`)

	if err != nil {
		return licenses, err
	}
	defer rows.Close()

	for rows.Next() {
		err = rows.Scan(&lic.UUID, &lic.Category, &lic.Name, &lic.Number, &lic.Issued,
			&lic.ValidFrom, &lic.ValidUntil, &lic.DocumentName, &lic.Document)

		if err != nil {
			return licenses, err
		}
		licenses = append(licenses, lic)
	}

	return licenses, nil
}

// GetFlightRecordByID returns flight record by UUID
func (m *DBModel) GetLicenseRecordByID(uuid string) (License, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var lic License

	row := m.DB.QueryRowContext(ctx, `
		SELECT
			uuid, category, name, number, issued,
			valid_from, valid_until, document_name, document
		FROM licensing
		WHERE uuid = ?`, uuid)

	err := row.Scan(&lic.UUID, &lic.Category, &lic.Name, &lic.Number, &lic.Issued,
		&lic.ValidFrom, &lic.ValidUntil, &lic.DocumentName, &lic.Document)

	if err != nil {
		return lic, err
	}

	return lic, nil
}

// GetLicensesCategory returns all already recorded categories
func (m *DBModel) GetLicensesCategory() ([]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var category string
	var categories []string

	rows, err := m.DB.QueryContext(ctx, `
		SELECT category
		FROM licensing
		GROUP BY category
		ORDER BY category;`)

	if err != nil {
		return categories, err
	}
	defer rows.Close()

	for rows.Next() {
		err = rows.Scan(&category)

		if err != nil {
			return categories, err
		}
		categories = append(categories, category)
	}

	return categories, nil
}

// UpdateLicenseRecord updates the license records in the licensing table
func (m *DBModel) UpdateLicenseRecord(lic License) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var err error

	if lic.DocumentName != "" {
		_, err = m.DB.ExecContext(ctx, `
		UPDATE licensing
		SET
			category = ?, name = ?, number = ?,
			issued = ?, valid_from = ?, valid_until = ?,
			document_name = ?, document = ?
		WHERE uuid = ?`,
			lic.Category, lic.Name, lic.Number,
			lic.Issued, lic.ValidFrom, lic.ValidUntil,
			lic.DocumentName, lic.Document,
			lic.UUID,
		)
	} else {
		_, err = m.DB.ExecContext(ctx, `
		UPDATE licensing
		SET
			category = ?, name = ?, number = ?,
			issued = ?, valid_from = ?, valid_until = ?
		WHERE uuid = ?`,
			lic.Category, lic.Name, lic.Number,
			lic.Issued, lic.ValidFrom, lic.ValidUntil,
			lic.UUID,
		)
	}

	if err != nil {
		return err
	}

	return nil
}

// InsertLicenseRecord add a new license record to the licensing table
func (m *DBModel) InsertLicenseRecord(lic License) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := m.DB.ExecContext(ctx, `
		INSERT INTO licensing
			(uuid, category, name, number,
			issued, valid_from, valid_until,
			document_name, document)
		VALUES (?, ?, ?, ?,
			?, ?, ?,
			?, ?)`,
		lic.UUID, lic.Category, lic.Name, lic.Number,
		lic.Issued, lic.ValidFrom, lic.ValidUntil,
		lic.DocumentName, lic.Document,
	)

	if err != nil {
		return err
	}

	return nil
}

// DeleteLicenseRecord deletes a license record by UUID
func (m *DBModel) DeleteLicenseRecord(uuid string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := m.DB.ExecContext(ctx, `
		DELETE FROM licensing
		WHERE
			uuid = ?`, uuid,
	)

	if err != nil {
		return err
	}

	return nil
}
