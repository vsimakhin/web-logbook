package models

import (
	"encoding/json"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

// GetSettings returns settings parameters
func (m *DBModel) GetSettings() (settings Settings, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	var raw string

	query := "SELECT settings FROM settings2 WHERE id=0"
	row := m.DB.QueryRowContext(ctx, query)
	if err = row.Scan(&raw); err != nil {
		return settings, err
	}

	if err = json.Unmarshal([]byte(raw), &settings); err != nil {
		return settings, err
	}

	return settings, nil
}

// UpdateSettings writes new settings values
func (m *DBModel) UpdateSettings(settings Settings) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	// check password field
	pwd := strings.TrimSpace(settings.Password)
	if pwd != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(pwd), 12)
		if err != nil {
			return err
		}

		settings.Hash = string(hash)
		settings.Password = ""
	} else {
		// keep old hash
		oldSettings, err := m.GetSettings()
		if err != nil {
			return err
		}
		settings.Hash = oldSettings.Hash
	}

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

func (m *DBModel) GetPdfDefaults(format string) (pdfDefaults ExportPDF) {
	if format == "A4" {
		pdfDefaults = pdfA4Defaults
		pdfDefaults.Columns = pdfA4DefaultColumns
	} else if format == "A5" {
		pdfDefaults = pdfA5Defaults
		pdfDefaults.Columns = pdfA5DefaultColumns
	}
	pdfDefaults.Headers = pdfDefaultHeaders

	return pdfDefaults
}

func (m *DBModel) RestorePDFSettingsDefaults(format string, section string) error {
	s, err := m.GetSettings()
	if err != nil {
		return err
	}

	if format == "A4" {
		if section == "page" {
			s.ExportA4.LogbookRows = pdfA4Defaults.LogbookRows
			s.ExportA4.Fill = pdfA4Defaults.Fill
			s.ExportA4.LeftMargin = pdfA4Defaults.LeftMargin
			s.ExportA4.TopMargin = pdfA4Defaults.TopMargin
			s.ExportA4.BodyRow = pdfA4Defaults.BodyRow
			s.ExportA4.FooterRow = pdfA4Defaults.FooterRow
		} else if section == "headers" {
			s.ExportA4.Headers = pdfDefaultHeaders
		} else if section == "columns" {
			s.ExportA4.Columns = pdfA4DefaultColumns
		}
	} else if format == "A5" {
		if section == "page" {
			s.ExportA5.LogbookRows = pdfA5Defaults.LogbookRows
			s.ExportA5.Fill = pdfA5Defaults.Fill
			s.ExportA5.LeftMarginA = pdfA5Defaults.LeftMarginA
			s.ExportA5.LeftMarginB = pdfA5Defaults.LeftMarginB
			s.ExportA5.TopMargin = pdfA5Defaults.TopMargin
			s.ExportA5.BodyRow = pdfA5Defaults.BodyRow
			s.ExportA5.FooterRow = pdfA5Defaults.FooterRow
		} else if section == "headers" {
			s.ExportA5.Headers = pdfDefaultHeaders
		} else if section == "columns" {
			s.ExportA5.Columns = pdfA5DefaultColumns
		}
	}

	err = m.UpdateSettings(s)
	return err
}
