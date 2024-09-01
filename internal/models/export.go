package models

import "fmt"

// UpdateDefaults updates export settings to the default values
func (m *DBModel) UpdateDefaults(param string) error {
	s, err := m.GetSettings()
	if err != nil {
		return err
	}

	switch param {
	case "a4common":
		s.ExportA4.LogbookRows = pdfA4Defaults.LogbookRows
		s.ExportA4.Fill = pdfA4Defaults.Fill
		s.ExportA4.LeftMargin = pdfA4Defaults.LeftMargin
		s.ExportA4.TopMargin = pdfA4Defaults.TopMargin
		s.ExportA4.BodyRow = pdfA4Defaults.BodyRow
		s.ExportA4.FooterRow = pdfA4Defaults.FooterRow
	case "a4headers":
		s.ExportA4.Headers = pdfDefaultHeaders
	case "a4columns":
		s.ExportA4.Columns = pdfA4DefaultColumns
	case "a5common":
		s.ExportA5.LogbookRows = pdfA5Defaults.LogbookRows
		s.ExportA5.Fill = pdfA5Defaults.Fill
		s.ExportA5.LeftMarginA = pdfA5Defaults.LeftMarginA
		s.ExportA5.LeftMarginB = pdfA5Defaults.LeftMarginB
		s.ExportA5.TopMargin = pdfA5Defaults.TopMargin
		s.ExportA5.BodyRow = pdfA5Defaults.BodyRow
		s.ExportA5.FooterRow = pdfA5Defaults.FooterRow
	case "a5headers":
		s.ExportA5.Headers = pdfDefaultHeaders
	case "a5columns":
		s.ExportA5.Columns = pdfA5DefaultColumns
	default:
		return fmt.Errorf("wrong parameter name '%s'", param)
	}

	err = m.UpdateSettings(s)
	return err
}
