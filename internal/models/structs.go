package models

import (
	"database/sql"
)

const AllAircrafts = 0
const LastAircrafts = 1

// DBModel is a type for database connections
type DBModel struct {
	DB *sql.DB
}

// jsonResponse is a type for post data handlers response
type JSONResponse struct {
	OK          bool   `json:"ok"`
	Message     string `json:"message,omitempty"`
	RedirectURL string `json:"redirect_url,omitempty"`
	Data        string `json:"data,omitempty"`
}

// FlightRecord is a type for logbook flight records
type FlightRecord struct {
	UUID      string `json:"uuid"`
	Date      string `json:"date"`
	MDate     string `json:"m_date"`
	Departure struct {
		Place string `json:"place"`
		Time  string `json:"time"`
	} `json:"departure"`
	Arrival struct {
		Place string `json:"place"`
		Time  string `json:"time"`
	} `json:"arrival"`
	Aircraft struct {
		Model string `json:"model"`
		Reg   string `json:"reg_name"`
	} `json:"aircraft"`
	Time struct {
		SE         string `json:"se_time"`
		ME         string `json:"me_time"`
		MCC        string `json:"mcc_time"`
		Total      string `json:"total_time"`
		Night      string `json:"night_time"`
		IFR        string `json:"ifr_time"`
		PIC        string `json:"pic_time"`
		CoPilot    string `json:"co_pilot_time"`
		Dual       string `json:"dual_time"`
		Instructor string `json:"instructor_time"`

		// calculated
		CrossCountry string `json:"cc_time,omitempty"`
	} `json:"time"`
	Landings struct {
		Day   int `json:"day"`
		Night int `json:"night"`
	} `json:"landings"`
	SIM struct {
		Type string `json:"type"`
		Time string `json:"time"`
	} `json:"sim"`
	PIC     string `json:"pic_name"`
	Remarks string `json:"remarks"`

	Distance float64 `json:"distance"`
	Track    []byte  `json:"track"`

	CustomFields string `json:"custom_fields"`

	// calculated
	PrevUUID         string `json:"prev_uuid"`
	NextUUID         string `json:"next_uuid"`
	HasTrack         int    `json:"has_track"`
	AttachmentsCount int    `json:"attachments_count"`
}

// Airpot is a structure for airport record
type Airport struct {
	ICAO      string  `json:"icao"`
	IATA      string  `json:"iata"`
	Name      string  `json:"name"`
	City      string  `json:"city"`
	Country   string  `json:"country"`
	Elevation int     `json:"elevation"`
	Lat       float64 `json:"lat"`
	Lon       float64 `json:"lon"`
}

// Person is a structure for person records
type Person struct {
	UUID       string `json:"uuid"`
	FirstName  string `json:"first_name"`
	MiddleName string `json:"middle_name"`
	LastName   string `json:"last_name"`
}

type PersonToLog struct {
	UUID       string `json:"uuid"`
	PersonUUID string `json:"person_uuid"`
	LogUUID    string `json:"log_uuid"`
	Role       string `json:"role"`
}

type PersonForLog struct {
	Person
	Role string `json:"role"`
}

type FlightRecordForPerson struct {
	LogUUID   string `json:"log_uuid"`
	Role      string `json:"role"`
	Date      string `json:"date"`
	MDate     string `json:"m_date"`
	Departure string `json:"departure"`
	Arrival   string `json:"arrival"`
	Aircraft  struct {
		Model string `json:"model"`
		Reg   string `json:"reg_name"`
	} `json:"aircraft"`
	SimType string `json:"sim_type"`
}

type ColumnsWidth struct {
	Col1  float64 `json:"col1"`
	Col2  float64 `json:"col2"`
	Col3  float64 `json:"col3"`
	Col4  float64 `json:"col4"`
	Col5  float64 `json:"col5"`
	Col6  float64 `json:"col6"`
	Col7  float64 `json:"col7"`
	Col8  float64 `json:"col8"`
	Col9  float64 `json:"col9"`
	Col10 float64 `json:"col10"`
	Col11 float64 `json:"col11"`
	Col12 float64 `json:"col12"`
	Col13 float64 `json:"col13"`
	Col14 float64 `json:"col14"`
	Col15 float64 `json:"col15"`
	Col16 float64 `json:"col16"`
	Col17 float64 `json:"col17"`
	Col18 float64 `json:"col18"`
	Col19 float64 `json:"col19"`
	Col20 float64 `json:"col20"`
	Col21 float64 `json:"col21"`
	Col22 float64 `json:"col22"`
	Col23 float64 `json:"col23"`
}

type ColumnsHeader struct {
	Date      string `json:"date"`
	Departure string `json:"departure"`
	Arrival   string `json:"arrival"`
	Aircraft  string `json:"aircraft"`
	SPT       string `json:"spt"`
	MCC       string `json:"mcc"`
	Total     string `json:"total"`
	PICName   string `json:"pic_name"`
	Landings  string `json:"landings"`
	OCT       string `json:"oct"`
	PFT       string `json:"pft"`
	FSTD      string `json:"fstd"`
	Remarks   string `json:"remarks"`
	DepPlace  string `json:"dep_place"`
	DepTime   string `json:"dep_time"`
	ArrPlace  string `json:"arr_place"`
	ArrTime   string `json:"arr_time"`
	Model     string `json:"model"`
	Reg       string `json:"reg"`
	SE        string `json:"se"`
	ME        string `json:"me"`
	LandDay   string `json:"land_day"`
	LandNight string `json:"land_night"`
	Night     string `json:"night"`
	IFR       string `json:"ifr"`
	PIC       string `json:"pic"`
	COP       string `json:"cop"`
	Dual      string `json:"dual"`
	Instr     string `json:"instr"`
	SimType   string `json:"sim_type"`
	SimTime   string `json:"sim_time"`
}

type ExportPDF struct {
	LogbookRows          int           `json:"logbook_rows"`
	Fill                 int           `json:"fill"`
	LeftMargin           float64       `json:"left_margin"`
	LeftMarginA          float64       `json:"left_margin_a"`
	LeftMarginB          float64       `json:"left_margin_b"`
	TopMargin            float64       `json:"top_margin"`
	BodyRow              float64       `json:"body_row_height"`
	FooterRow            float64       `json:"footer_row_height"`
	PageBreaks           string        `json:"page_breaks"`
	Columns              ColumnsWidth  `json:"columns"`
	Headers              ColumnsHeader `json:"headers"`
	ReplaceSPTime        bool          `json:"replace_sp_time"`
	IncludeSignature     bool          `json:"include_signature"`
	IsExtended           bool          `json:"is_extended"`
	TimeFieldsAutoFormat byte          `json:"time_fields_auto_format"`
	CustomTitle          string        `json:"custom_title"`
	CustomTitleBlob      []byte
}

// Settings is a type for settings
type Settings struct {
	OwnerName       string            `json:"owner_name"`
	LicenseNumber   string            `json:"license_number"`
	Address         string            `json:"address"`
	SignatureText   string            `json:"signature_text"`
	SignatureImage  string            `json:"signature_image"`
	AircraftClasses map[string]string `json:"aircraft_classes"`

	AuthEnabled bool   `json:"auth_enabled"`
	Login       string `json:"login"`
	Password    string `json:"password"`
	Hash        string `json:"hash"`
	SecretKey   string `json:"secret_key"`

	ExportA4 ExportPDF `json:"export_a4"`
	ExportA5 ExportPDF `json:"export_a5"`

	LogbookPagination     string        `json:"logbook_pagination"`
	PersonRoles           string        `json:"person_roles"`
	TimeFieldsAutoFormat  byte          `json:"time_fields_auto_format"`
	EnableCustomNames     bool          `json:"enable_custom_names"`
	StandardFieldsHeaders ColumnsHeader `json:"standard_fields_headers"`

	LicensesExpiration struct {
		ShowExpired   bool `json:"show_expired"`
		ShowWarning   bool `json:"show_warning"`
		WarningPeriod int  `json:"warning_period"`
	} `json:"licenses_expiration"`

	AirportDBSource string `json:"airports_db_source"`
	NoICAOFilter    bool   `json:"no_icao_filter"`
}

// License is a type for licesing
type License struct {
	UUID         string `json:"uuid"`
	Category     string `json:"category"`
	Name         string `json:"name"`
	Number       string `json:"number"`
	Issued       string `json:"issued"`
	ValidFrom    string `json:"valid_from"`
	ValidUntil   string `json:"valid_until"`
	Remarks      string `json:"remarks"`
	DocumentName string `json:"document_name"`
	Document     []byte `json:"document"`
}

// Attachment is a type for attachments
type Attachment struct {
	UUID         string `json:"uuid"`
	RecordID     string `json:"record_id"`
	DocumentName string `json:"document_name"`
	Document     []byte `json:"document"`
}

// Aircraft is a type for aircrafts
type Aircraft struct {
	Reg            string `json:"reg"`
	Model          string `json:"model"`
	Category       string `json:"category"`
	ModelCategory  string `json:"model_category"`
	CustomCategory string `json:"custom_category"`
}

type Category struct {
	Model    string `json:"model"`
	Category string `json:"category"`
}

// Currency is a type for tracking pilot currencies
type Currency struct {
	UUID        string `json:"uuid"`
	Name        string `json:"name"`
	Metric      string `json:"metric"`
	TargetValue int    `json:"target_value"`
	TimeFrame   struct {
		Unit  string `json:"unit"`
		Value int    `json:"value"`
		Since string `json:"since"`
	} `json:"time_frame"`
	Comparison string `json:"comparison"`
	Filters    string `json:"filters"`
}

// CustomField is a type for custom fields
type CustomField struct {
	UUID          string `json:"uuid"`
	Name          string `json:"name"`
	Description   string `json:"description"`
	Category      string `json:"category"`
	Type          string `json:"type"`
	StatsFunction string `json:"stats_function"`
	SizeXs        int    `json:"size_xs"`
	SizeMd        int    `json:"size_md"`
	SizeLg        int    `json:"size_lg"`
	DisplayOrder  int    `json:"display_order"`
}
