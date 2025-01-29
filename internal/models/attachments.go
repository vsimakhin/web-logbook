package models

// GetAttachments returns attachments array for a specific record_id
func (m *DBModel) GetAttachments(recordID string) (attachments []Attachment, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "SELECT uuid, record_id, document_name FROM attachments WHERE record_id = ?"
	rows, err := m.DB.QueryContext(ctx, query, recordID)
	if err != nil {
		return attachments, err
	}
	defer rows.Close()

	for rows.Next() {
		var att Attachment
		if err = rows.Scan(&att.UUID, &att.RecordID, &att.DocumentName); err != nil {
			return attachments, err
		}
		attachments = append(attachments, att)
	}

	return attachments, nil
}

// GetAllAttachments returns list of attachments without document body
func (m *DBModel) GetAllAttachments() (attachments []Attachment, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "SELECT uuid, record_id, document_name FROM attachments"
	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return attachments, err
	}
	defer rows.Close()

	for rows.Next() {
		var att Attachment
		if err = rows.Scan(&att.UUID, &att.RecordID, &att.DocumentName); err != nil {
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

	query := "SELECT uuid FROM attachments WHERE record_id = ?"
	rows, err := m.DB.QueryContext(ctx, query, uuid)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var id string
		if err = rows.Scan(&id); err != nil {
			return err
		}
		m.DeleteAttachment(id)
	}

	return nil
}

// GetAttachmentByID returns attachment record
func (m *DBModel) GetAttachmentByID(uuid string) (att Attachment, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "SELECT uuid, record_id, document_name, document FROM attachments WHERE uuid = ?"
	row := m.DB.QueryRowContext(ctx, query, uuid)
	err = row.Scan(&att.UUID, &att.RecordID, &att.DocumentName, &att.Document)
	return att, err
}
