package models

import (
	"context"
	"time"
)

// GetAttachments returns attachments array for a specific record_id
func (m *DBModel) GetAttachments(recordID string) ([]Attachment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var att Attachment
	var attachments []Attachment

	query := "SELECT uuid, record_id, document_name FROM attachments WHERE record_id = ?"
	rows, err := m.DB.QueryContext(ctx, query, recordID)

	if err != nil {
		return attachments, err
	}
	defer rows.Close()

	for rows.Next() {
		err = rows.Scan(&att.UUID, &att.RecordID, &att.DocumentName)

		if err != nil {
			return attachments, err
		}
		attachments = append(attachments, att)
	}

	return attachments, nil
}

// GetAllAttachments returns list of attachments without document body
func (m *DBModel) GetAllAttachments() ([]Attachment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var att Attachment
	var attachments []Attachment

	query := "SELECT uuid, record_id, document_name FROM attachments"
	rows, err := m.DB.QueryContext(ctx, query)

	if err != nil {
		return attachments, err
	}
	defer rows.Close()

	for rows.Next() {
		err = rows.Scan(&att.UUID, &att.RecordID, &att.DocumentName)

		if err != nil {
			return attachments, err
		}
		attachments = append(attachments, att)
	}

	return attachments, nil
}

// InsertLicenseRecord add a new license record to the licensing table
func (m *DBModel) InsertAttachmentRecord(att Attachment) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := "INSERT INTO attachments (uuid, record_id, document_name, document) VALUES (?, ?, ?, ?)"
	_, err := m.DB.ExecContext(ctx, query, att.UUID, att.RecordID, att.DocumentName, att.Document)

	if err != nil {
		return err
	}

	return nil
}

// DeleteAttachment removes attachment record
func (m *DBModel) DeleteAttachment(uuid string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := "DELETE FROM attachments WHERE uuid = ?"
	_, err := m.DB.ExecContext(ctx, query, uuid)

	if err != nil {
		return err
	}

	query = "INSERT INTO deleted_items (uuid, table_name, delete_time) VALUES (?,?,?)"
	_, err = m.DB.ExecContext(ctx, query, uuid, "attachments", time.Now().Unix())
	if err != nil {
		return err
	}

	return nil
}

func (m *DBModel) DeleteAttachmentsForFlightRecord(uuid string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := "SELECT uuid FROM attachments WHERE record_id = ?"
	rows, err := m.DB.QueryContext(ctx, query, uuid)

	if err != nil {
		return err
	}
	defer rows.Close()

	var id string
	for rows.Next() {

		err = rows.Scan(&id)

		if err != nil {
			return err
		}
		m.DeleteAttachment(id)
	}

	return nil
}

// GetAttachmentByID returns attachment record
func (m *DBModel) GetAttachmentByID(uuid string) (Attachment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var att Attachment

	query := "SELECT uuid, record_id, document_name, document FROM attachments WHERE uuid = ?"
	row := m.DB.QueryRowContext(ctx, query, uuid)

	err := row.Scan(&att.UUID, &att.RecordID, &att.DocumentName, &att.Document)

	if err != nil {
		return att, err
	}

	return att, nil
}
