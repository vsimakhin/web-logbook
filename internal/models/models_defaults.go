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

// default values for headers for logbook table
var standardFieldsHeaders = ColumnsHeader{
	Date:      "Date",
	Departure: "Departure",
	Arrival:   "Arrival",
	Aircraft:  "Aircraft",
	SPT:       "Single Pilot",
	MCC:       "MCC",
	Total:     "Total",
	PICName:   "PIC Name",
	Landings:  "Landings",
	OCT:       "Operational Condition Time",
	PFT:       "Pilot Function Time",
	FSTD:      "FSTD Session",
	Remarks:   "Remarks",
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
	Dual:      "Dual",
	Instr:     "Instr",
	SimType:   "Type",
	SimTime:   "Time",
	Tags:      "Tags",
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

var pdfA4TableColumns = []string{
	"date", "dep_place", "dep_time", "arr_place", "arr_time", "model", "reg", "se",
	"me", "mcc", "total", "pic_name", "land_day", "land_night", "night", "ifr",
	"pic", "cop", "dual", "instr", "sim_type", "sim_time", "remarks",
}

var pdfA5TableColumns = []string{
	"date", "dep_place", "dep_time", "arr_place", "arr_time", "model", "reg", "se",
	"me", "mcc", "total", "pic_name", "land_day", "land_night", "PAGE_DIVIDER", "night", "ifr",
	"pic", "cop", "dual", "instr", "sim_type", "sim_time", "remarks",
}

var pdfA4TableColumnWidth = map[string]float64{
	"date":       12.2,
	"dep_place":  8.25,
	"dep_time":   8.25,
	"arr_place":  8.25,
	"arr_time":   8.25,
	"model":      10.0,
	"reg":        12.9,
	"se":         11.2,
	"me":         11.2,
	"mcc":        11.2,
	"total":      11.2,
	"pic_name":   22.86,
	"land_day":   8.38,
	"land_night": 8.38,
	"night":      11.2,
	"ifr":        11.2,
	"pic":        11.2,
	"cop":        11.2,
	"dual":       11.2,
	"instr":      11.2,
	"sim_type":   11.2,
	"sim_time":   11.2,
	"remarks":    33.8,
}

var pdfA5TableColumnWidth = map[string]float64{
	"date":       15.5,
	"dep_place":  12.25,
	"dep_time":   8.25,
	"arr_place":  12.25,
	"arr_time":   8.25,
	"model":      10.0,
	"reg":        15.4,
	"se":         12.2,
	"me":         12.2,
	"mcc":        12.2,
	"total":      12.2,
	"pic_name":   41.86,
	"land_day":   8.38,
	"land_night": 8.38,
	"night":      12.2,
	"ifr":        12.2,
	"pic":        12.2,
	"cop":        12.2,
	"dual":       12.2,
	"instr":      12.2,
	"sim_type":   24.2,
	"sim_time":   12.2,
	"remarks":    79.8,
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
		s.ExportA4.TableProfile.TableColumns = pdfA4TableColumns
		s.ExportA4.TableProfile.TableHiddenColumns = []string{}
		s.ExportA4.TableProfile.TableColumnWidths = pdfA4TableColumnWidth

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

	if s.StandardFieldsHeaders.Date == "" {
		s.StandardFieldsHeaders = standardFieldsHeaders
		applyDefaults = true
	}

	// check and migrate pdf export values
	if len(s.ExportA4.TableProfile.TableColumns) == 0 {
		s.ExportA4.TableProfile.TableColumns = pdfA4TableColumns
		s.ExportA4.TableProfile.TableHiddenColumns = []string{}
		s.ExportA4.TableProfile.TableColumnWidths = pdfA4TableColumnWidth
		applyDefaults = true
	}

	if len(s.ExportA5.TableProfile.TableColumns) == 0 {
		s.ExportA5.TableProfile.TableColumns = pdfA5TableColumns
		s.ExportA5.TableProfile.TableHiddenColumns = []string{}
		s.ExportA5.TableProfile.TableColumnWidths = pdfA5TableColumnWidth
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
