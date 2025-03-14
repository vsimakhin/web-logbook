package models

// default values for headers for pdf format
var pdfDefaultHeaders = ColumnsHeader{
	Date:      "DATE",
	Departure: "DEPARTURE",
	Arrival:   "ARRIVAL",
	Aircraft:  "AIRCRAFT",
	SPT:       "SINGLE PILOT TIME",
	MCC:       "MULTI PILOT TIME",
	Total:     "TOTAL TIME",
	PICName:   "PIC NAME",
	Landings:  "LANDINGS",
	OCT:       "OPERATIONAL CONDITION TIME",
	PFT:       "PILOT FUNCTION TIME",
	FSTD:      "FSTD SESSION",
	Remarks:   "REMARKS AND ENDORSEMENTS",
	DepPlace:  "Place",
	DepTime:   "Time",
	ArrPlace:  "Place",
	ArrTime:   "Time",
	Model:     "Type",
	Reg:       "Reg",
	SE:        "SE",
	ME:        "ME",
	LandDay:   "Day",
	LandNight: "Night",
	Night:     "Night",
	IFR:       "IFR",
	PIC:       "PIC",
	COP:       "COP",
	Dual:      "DUAL",
	Instr:     "INSTR",
	SimType:   "Type",
	SimTime:   "Time",
}

// default columns width for A4 format
var pdfA4DefaultColumns = ColumnsWidth{
	Col1:  12.2,
	Col2:  8.25,
	Col3:  8.25,
	Col4:  8.25,
	Col5:  8.25,
	Col6:  10.0,
	Col7:  12.9,
	Col8:  11.2,
	Col9:  11.2,
	Col10: 11.2,
	Col11: 11.2,
	Col12: 22.86,
	Col13: 8.38,
	Col14: 8.38,
	Col15: 11.2,
	Col16: 11.2,
	Col17: 11.2,
	Col18: 11.2,
	Col19: 11.2,
	Col20: 11.2,
	Col21: 11.2,
	Col22: 11.2,
	Col23: 33.8,
}

// default columns width for A5 format
var pdfA5DefaultColumns = ColumnsWidth{
	Col1:  15.5,
	Col2:  12.25,
	Col3:  8.25,
	Col4:  12.25,
	Col5:  8.25,
	Col6:  10.0,
	Col7:  15.4,
	Col8:  12.2,
	Col9:  12.2,
	Col10: 12.2,
	Col11: 12.2,
	Col12: 41.86,
	Col13: 8.38,
	Col14: 8.38,
	Col15: 12.2,
	Col16: 12.2,
	Col17: 12.2,
	Col18: 12.2,
	Col19: 12.2,
	Col20: 12.2,
	Col21: 24.2,
	Col22: 12.2,
	Col23: 79.8,
}

// common defaults for A4 format
var pdfA4Defaults = ExportPDF{
	LogbookRows: 23,
	Fill:        3,
	LeftMargin:  10.0,
	TopMargin:   30.0,
	BodyRow:     5.0,
	FooterRow:   6.0,
}

// common defaults for A5 format
var pdfA5Defaults = ExportPDF{
	LogbookRows: 20,
	Fill:        3,
	LeftMarginA: 6.0,
	LeftMarginB: 14.0,
	TopMargin:   9.0,
	BodyRow:     5.0,
	FooterRow:   5.0,
}

// CheckDefaultValues checks if some certain settings parameters are empty and
// fills them in with the default values
func (m *DBModel) CheckDefaultValues() error {
	applyDefaults := false

	// get current settings
	s, err := m.GetSettings()
	if err != nil {
		return err
	}

	// check A4
	// if it's a first run, the value will be 0
	// it also doesn't make sence to have 0 for logbook rows
	if s.ExportA4.LogbookRows == 0 {
		s.ExportA4 = pdfA4Defaults
		s.ExportA4.Columns = pdfA4DefaultColumns
		s.ExportA4.Headers = pdfDefaultHeaders
		applyDefaults = true
	}

	// the same for pdfA5
	if s.ExportA5.LogbookRows == 0 {
		s.ExportA5 = pdfA5Defaults
		s.ExportA5.Columns = pdfA5DefaultColumns
		s.ExportA5.Headers = pdfDefaultHeaders
		applyDefaults = true
	}

	if s.AirportDBSource == "" {
		s.AirportDBSource = "https://github.com/vsimakhin/Airports/raw/master/airports.json"
		s.NoICAOFilter = false
		applyDefaults = true
	}

	if applyDefaults {
		err = m.UpdateSettings(s)
		if err != nil {
			return err
		}
	}

	return nil
}
