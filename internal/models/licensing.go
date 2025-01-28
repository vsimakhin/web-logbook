package models

import (
	"time"
)

// GetFlightRecords returns the flight records in the logbook table
func (m *DBModel) GetLicenses() (licenses []License, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `SELECT 
				uuid, category, name, number, issued, 
				valid_from, valid_until, document_name
			FROM licensing 
			ORDER BY category, name`
	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return licenses, err
	}
	defer rows.Close()

	for rows.Next() {
		var lic License
		if err = rows.Scan(&lic.UUID, &lic.Category, &lic.Name, &lic.Number, &lic.Issued,
			&lic.ValidFrom, &lic.ValidUntil, &lic.DocumentName); err != nil {
			return licenses, err
		}
		licenses = append(licenses, lic)
	}

	return licenses, nil
}

// GetFlightRecordByID returns flight record by UUID
func (m *DBModel) GetLicenseRecordByID(uuid string) (lic License, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `SELECT 
				uuid, category, name, number, issued,
				valid_from, valid_until, remarks, document_name, document
			FROM licensing 
			WHERE uuid = ?`
	row := m.DB.QueryRowContext(ctx, query, uuid)

	if err := row.Scan(&lic.UUID, &lic.Category, &lic.Name, &lic.Number, &lic.Issued,
		&lic.ValidFrom, &lic.ValidUntil, &lic.Remarks, &lic.DocumentName, &lic.Document); err != nil {
		return lic, err
	}

	return lic, nil
}

// GetLicensesCategory returns all already recorded categories
func (m *DBModel) GetLicensesCategory() (categories []string, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "SELECT category FROM licensing GROUP BY category ORDER BY category"
	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return categories, err
	}
	defer rows.Close()

	for rows.Next() {
		var category string
		if err = rows.Scan(&category); err != nil {
			return categories, err
		}
		categories = append(categories, category)
	}

	return categories, nil
}

// UpdateLicenseRecord updates the license records in the licensing table
func (m *DBModel) UpdateLicenseRecord(lic License) (err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	if lic.DocumentName != "" {
		query := "UPDATE licensing SET " +
			"category = ?, name = ?, number = ?, " +
			"issued = ?, valid_from = ?, valid_until = ?, " +
			"remarks = ?, document_name = ?, document = ? " +
			"WHERE uuid = ?"
		_, err = m.DB.ExecContext(ctx, query,
			lic.Category, lic.Name, lic.Number,
			lic.Issued, lic.ValidFrom, lic.ValidUntil,
			lic.Remarks, lic.DocumentName, lic.Document,
			lic.UUID,
		)
	} else {
		query := "UPDATE licensing SET " +
			"category = ?, name = ?, number = ?, " +
			"issued = ?, valid_from = ?, valid_until = ?, remarks = ? " +
			"WHERE uuid = ?"
		_, err = m.DB.ExecContext(ctx, query,
			lic.Category, lic.Name, lic.Number,
			lic.Issued, lic.ValidFrom, lic.ValidUntil, lic.Remarks,
			lic.UUID,
		)
	}

	return err
}

// InsertLicenseRecord add a new license record to the licensing table
func (m *DBModel) InsertLicenseRecord(lic License) (err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "INSERT INTO licensing " +
		"(uuid, category, name, number, issued, valid_from, valid_until, remarks, document_name, document) " +
		"VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ? )"
	_, err = m.DB.ExecContext(ctx, query,
		lic.UUID, lic.Category, lic.Name, lic.Number,
		lic.Issued, lic.ValidFrom, lic.ValidUntil, lic.Remarks,
		lic.DocumentName, lic.Document,
	)

	return err
}

// DeleteLicenseRecord deletes a license record by UUID
func (m *DBModel) DeleteLicenseRecord(uuid string) (err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	_, err = m.DB.ExecContext(ctx, "DELETE FROM licensing WHERE uuid = ?", uuid)
	return err
}

// DeleteLicenseAttachment drops license attachment
func (m *DBModel) DeleteLicenseAttachment(uuid string) (err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `UPDATE licensing SET document_name = "", document = null WHERE uuid = ?`
	_, err = m.DB.ExecContext(ctx, query, uuid)
	return err
}

// CheckLicenseExpiration returns the number of expired and expiring (warning) licenses
func (m *DBModel) CheckLicenseExpiration() (int, int) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	expired, warning := 0, 0
	now := time.Now()
	expiredDate := now
	warningDate := now.AddDate(0, 1, 0)

	query := "SELECT valid_until FROM licensing where valid_until <> ''"
	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return expired, warning
	}
	defer rows.Close()

	for rows.Next() {
		var date string
		if err := rows.Scan(&date); err != nil {
			continue
		}
		parsedDate, err := time.Parse("02/01/2006", date)
		if err != nil {
			continue
		}
		if parsedDate.Before(expiredDate) {
			expired++
		} else if parsedDate.Before(warningDate) {
			warning++
		}
	}

	return expired, warning
}
