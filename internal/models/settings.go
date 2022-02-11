package models

import (
	"context"
	"time"
)

// GetSettings returns settings parameters
func (m *DBModel) GetSettings() (Settings, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var settings Settings

	query := "SELECT id, owner_name, signature_text, page_breaks FROM settings WHERE id=1"
	row := m.DB.QueryRowContext(ctx, query)

	err := row.Scan(&settings.ID, &settings.OwnerName, &settings.SignatureText, &settings.PageBreaks)
	if err != nil {
		return settings, err
	}

	return settings, nil
}

// UpdateSettings writes new settings values
func (m *DBModel) UpdateSettings(settings Settings) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := "UPDATE settings SET owner_name = ?, signature_text = ?, page_breaks = ? WHERE id = 1"
	_, err := m.DB.ExecContext(ctx, query, settings.OwnerName, settings.SignatureText, settings.PageBreaks)

	if err != nil {
		return err
	}

	return nil
}
