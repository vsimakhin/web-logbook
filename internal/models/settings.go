package models

import (
	"context"
	"encoding/json"
	"time"
)

// GetSettings returns settings parameters
func (m *DBModel) GetSettings() (Settings, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var settings Settings
	var raw string

	query := "SELECT settings FROM settings2 WHERE id=0"
	row := m.DB.QueryRowContext(ctx, query)

	err := row.Scan(&raw)
	if err != nil {
		return settings, err
	}

	err = json.Unmarshal([]byte(raw), &settings)
	if err != nil {
		return settings, err
	}

	return settings, nil
}

// UpdateSettings writes new settings values
func (m *DBModel) UpdateSettings(settings Settings) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	out, err := json.Marshal(settings)
	if err != nil {
		return err
	}

	query := "UPDATE settings2 SET settings = ? WHERE id = 0"
	_, err = m.DB.ExecContext(ctx, query, string(out))
	if err != nil {
		return err
	}

	return nil
}
