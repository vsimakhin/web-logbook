package models

import (
	"database/sql"
	"errors"
)

// GetFlightRecordAttachments returns attachments array for a specific record_id
func (m *DBModel) GetFlightRecordAttachments(recordID string) (attachments []Attachment, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `SELECT 
				uuid, record_id, document_name, document_size
			FROM attachments_view
			WHERE record_id = ?`
	rows, err := m.DB.QueryContext(ctx, query, recordID)
	if err != nil {
		return attachments, err
	}
	defer rows.Close()

	for rows.Next() {
		var att Attachment
		if err = rows.Scan(&att.UUID, &att.RecordID, &att.DocumentName, &att.DocumentSize); err != nil {
			return attachments, err
		}
		attachments = append(attachments, att)
	}

	return attachments, nil
}

// GetAttachments returns list of attachments without document body
func (m *DBModel) GetAttachments() (attachments []Attachment, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `SELECT
				uuid, record_id, document_name, document_size,
				flight_date, flight_info
			FROM attachments_view
			ORDER by flight_date DESC`
	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return attachments, err
	}
	defer rows.Close()

	for rows.Next() {
		var att Attachment
		if err = rows.Scan(&att.UUID, &att.RecordID, &att.DocumentName, &att.DocumentSize,
			&att.FlightDate, &att.FlightInfo); err != nil {
			return attachments, err
		}
		attachments = append(attachments, att)
	}

	return attachments, nil
}

// InsertLicenseRecord add a new license record to the licensing table
func (m *DBModel) InsertAttachmentRecord(att Attachment) (err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "INSERT INTO attachments (uuid, record_id, document_name, document) VALUES (?, ?, ?, ?)"
	_, err = m.DB.ExecContext(ctx, query, att.UUID, att.RecordID, att.DocumentName, att.Document)

	return err
}

// DeleteAttachment removes attachment record
func (m *DBModel) DeleteAttachment(uuid string) (err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "DELETE FROM attachments WHERE uuid = ?"
	_, err = m.DB.ExecContext(ctx, query, uuid)

	return err
}

func (m *DBModel) DeleteAttachmentsForFlightRecord(uuid string) (err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "DELETE FROM attachments WHERE record_id = ?"
	_, err = m.DB.ExecContext(ctx, query, uuid)
	return err
}

// GetAttachmentByID returns attachment record
func (m *DBModel) GetAttachmentByID(uuid string) (att Attachment, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `SELECT
				uuid, record_id, document_name, document,
				document_size, flight_date, flight_info
			FROM attachments_view
			WHERE uuid = ?`
	row := m.DB.QueryRowContext(ctx, query, uuid)
	err = row.Scan(&att.UUID, &att.RecordID, &att.DocumentName, &att.Document,
		&att.DocumentSize, &att.FlightDate, &att.FlightInfo)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return att, nil
		}
	}
	return att, err
}
