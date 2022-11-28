package models

import (
	"database/sql/driver"

	"github.com/DATA-DOG/go-sqlmock"
)

// InitMock is a common sqlmock init function
// which is used by tests in package models and main
func InitMock(mock sqlmock.Sqlmock) {
	// mock GetFlightRecords
	mock.ExpectQuery("SELECT (.+) FROM logbook_view ORDER BY m_date desc, departure_time desc").
		WillReturnRows(
			mock.NewRows([]string{
				"uuid", "date", "m_date", "departure_place", "departure_time",
				"arrival_place", "arrival_time", "aircraft_model", "reg_name",
				"se_time", "me_time", "mcc_time", "total_time", "day_landings", "night_landings",
				"night_time", "ifr_time", "pic_time", "co_pilot_time", "dual_time", "instructor_time",
				"sim_type", "sim_time", "pic_name", "remarks",
			}).
				AddRow(
					"uuid", "01/02/2022", "20220201", "LKPR", "1000",
					"EDDM", "1200", "C152", "OK-XXX",
					"2:00", "2:00", "2:00", "2:00", 1, 2,
					"2:00", "2:00", "2:00", "2:00", "2:00", "2:00",
					"SIM", "2:00", "Self", "Remarks",
				),
		)
	// mock GetAircrafts (last)
	mock.ExpectQuery("SELECT (.+) FROM \\(SELECT aircraft_model, reg_name FROM logbook_view WHERE aircraft_model <> '' ORDER BY m_date DESC LIMIT 100\\)").
		WillReturnRows(
			mock.NewRows([]string{"aircraft_model", "reg_name"}).AddRow("MODEL", "REG"),
		)

	// mock GetAircrafts (all)
	mock.ExpectQuery("SELECT (.+) FROM logbook_view WHERE aircraft_model <> '' " +
		"GROUP BY aircraft_model, reg_name ORDER BY aircraft_model").
		WillReturnRows(
			mock.NewRows([]string{"aircraft_model", "reg_name"}).AddRow("MODEL", "REG"),
		)

	// mock DeleteFlightRecord
	mock.ExpectExec("DELETE FROM logbook WHERE uuid = ?").WithArgs("uuid").WillReturnResult(sqlmock.NewResult(0, 1))

	// mock InsertFlightrecord
	mock.ExpectExec("INSERT INTO logbook \\(uuid, date, departure_place, departure_time, "+
		"arrival_place, arrival_time, aircraft_model, reg_name, se_time, me_time, mcc_time, "+
		"total_time, day_landings, night_landings, night_time, ifr_time, pic_time, co_pilot_time, "+
		"dual_time, instructor_time, sim_type, sim_time, pic_name, remarks\\)").
		WithArgs(
			"uuid", "01/02/2022", "LKPR", "1000",
			"EDDM", "1200", "C152", "OK-XXX",
			"2:00", "2:00", "2:00", "2:00", 1, 2,
			"2:00", "2:00", "2:00", "2:00", "2:00", "2:00",
			"SIM", "2:00", "Self", "Remarks",
		).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// mock UpdateFlightRecord
	mock.ExpectExec("UPDATE logbook SET").
		WithArgs(
			"01/02/2022", "LKPR", "1000",
			"EDDM", "1200", "C152", "OK-XXX",
			"2:00", "2:00", "2:00", "2:00", 1, 2,
			"2:00", "2:00", "2:00", "2:00", "2:00", "2:00",
			"SIM", "2:00", "Self", "Remarks", "uuid",
		).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// mock GetFlightRecordByID
	mock.ExpectQuery("SELECT (.+) FROM logbook_view WHERE uuid = ?").WithArgs("uuid").
		WillReturnRows(
			mock.NewRows([]string{
				"uuid", "date", "m_date", "departure_place", "departure_time",
				"arrival_place", "arrival_time", "aircraft_model", "reg_name",
				"se_time", "me_time", "mcc_time", "total_time", "day_landings", "night_landings",
				"night_time", "ifr_time", "pic_time", "co_pilot_time", "dual_time", "instructor_time",
				"sim_type", "sim_time", "pic_name", "remarks",
			}).
				AddRow(
					"uuid", "01/02/2022", "20220201", "LKPR", "1000",
					"EDDM", "1200", "C152", "OK-XXX",
					"2:00", "2:00", "2:00", "2:00", 1, 2,
					"2:00", "2:00", "2:00", "2:00", "2:00", "2:00",
					"SIM", "2:00", "Self", "Remarks",
				),
		)

	// mock GetSettings
	mock.ExpectQuery("SELECT (.+) FROM settings2 WHERE id=0").WithArgs().
		WillReturnRows(
			mock.NewRows([]string{
				"settings",
			}).
				AddRow(`{"owner_name":"Owner Name","signature_text":"I certify that the entries in this log are true.","aircraft_classes":null,"auth_enabled":false,"login":"","password":"","hash":"","enable_flightrecord_help":false,"export_a4":{"logbook_rows":0,"fill":0,"left_margin":0,"left_margin_a":0,"left_margin_b":0,"top_margin":0,"body_row_height":0,"footer_row_height":0,"page_breaks":"","columns":{"col1":0,"col2":0,"col3":0,"col4":0,"col5":0,"col6":0,"col7":0,"col8":0,"col9":0,"col10":0,"col11":0,"col12":0,"col13":0,"col14":0,"col15":0,"col16":0,"col17":0,"col18":0,"col19":0,"col20":0,"col21":0,"col22":0,"col23":0}},"export_a5":{"logbook_rows":0,"fill":0,"left_margin":0,"left_margin_a":0,"left_margin_b":0,"top_margin":0,"body_row_height":0,"footer_row_height":0,"page_breaks":"","columns":{"col1":0,"col2":0,"col3":0,"col4":0,"col5":0,"col6":0,"col7":0,"col8":0,"col9":0,"col10":0,"col11":0,"col12":0,"col13":0,"col14":0,"col15":0,"col16":0,"col17":0,"col18":0,"col19":0,"col20":0,"col21":0,"col22":0,"col23":0}},"export_xls":{"convert_time":false},"export_csv":{"delimeter":"","crlf":false}}`),
		)

	// mock UpdateSettings
	mock.ExpectExec("UPDATE settings2 SET").
		WithArgs(`{"owner_name":"Owner Name","signature_text":"I certify that the entries in this log are true.","aircraft_classes":null,"auth_enabled":false,"login":"","password":"","hash":"","enable_flightrecord_help":false,"export_a4":{"logbook_rows":0,"fill":0,"left_margin":0,"left_margin_a":0,"left_margin_b":0,"top_margin":0,"body_row_height":0,"footer_row_height":0,"page_breaks":"","columns":{"col1":0,"col2":0,"col3":0,"col4":0,"col5":0,"col6":0,"col7":0,"col8":0,"col9":0,"col10":0,"col11":0,"col12":0,"col13":0,"col14":0,"col15":0,"col16":0,"col17":0,"col18":0,"col19":0,"col20":0,"col21":0,"col22":0,"col23":0}},"export_a5":{"logbook_rows":0,"fill":0,"left_margin":0,"left_margin_a":0,"left_margin_b":0,"top_margin":0,"body_row_height":0,"footer_row_height":0,"page_breaks":"","columns":{"col1":0,"col2":0,"col3":0,"col4":0,"col5":0,"col6":0,"col7":0,"col8":0,"col9":0,"col10":0,"col11":0,"col12":0,"col13":0,"col14":0,"col15":0,"col16":0,"col17":0,"col18":0,"col19":0,"col20":0,"col21":0,"col22":0,"col23":0}},"export_xls":{"convert_time":false},"export_csv":{"delimeter":"","crlf":false}}`).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// mock GetTotals (several mocks due to several requests)
	for i := range []int{1, 2, 3, 4, 5} {
		mock.ExpectQuery("SELECT (.+) FROM logbook_view").WithArgs().
			WillReturnRows(
				mock.NewRows([]string{
					"m_date", "se_time", "me_time", "mcc_time", "total_time",
					"day_landings", "night_landings",
					"night_time", "ifr_time", "pic_time", "co_pilot_time",
					"dual_time", "instructor_time", "sim_time", "departure_place", "arrival_place",
				}).AddRow(
					"20220101", "2:00", "2:00", "2:00", "2:00",
					i, i,
					"2:00", "2:00", "2:00", "2:00",
					"2:00", "2:00", "2:00", "ZZZZ", "XXXX",
				),
			)
	}

	// mock GetTotalsByYear
	mock.ExpectQuery("SELECT SUBSTR(.+) arrival_place FROM logbook_view ORDER BY m_date").WithArgs().
		WillReturnRows(
			mock.NewRows([]string{
				"year", "se_time", "me_time", "mcc_time", "total_time",
				"day_landings", "night_landings",
				"night_time", "ifr_time", "pic_time", "co_pilot_time",
				"dual_time", "instructor_time", "sim_time", "departure_place", "arrival_place",
			}).AddRow(
				"2022", "2:00", "2:00", "2:00", "2:00",
				1, 2,
				"2:00", "2:00", "2:00", "2:00",
				"2:00", "2:00", "2:00", "ZZZZ", "XXXX",
			),
		)

	// mock GetTotalsByAircraftType
	mock.ExpectQuery("SELECT m_date, aircraft_model(.+) FROM logbook_view").WithArgs().
		WillReturnRows(
			mock.NewRows([]string{
				"m_date", "aircraft_model", "se_time", "me_time", "mcc_time", "total_time",
				"day_landings", "night_landings",
				"night_time", "ifr_time", "pic_time", "co_pilot_time",
				"dual_time", "instructor_time", "sim_time", "departure_place", "arrival_place",
			}).AddRow(
				"20220101", "C172", "2:00", "2:00", "2:00", "2:00",
				1, 2,
				"2:00", "2:00", "2:00", "2:00",
				"2:00", "2:00", "2:00", "ZZZZ", "XXXX",
			),
		)

	// mock GetTotalsByAircraftClass
	mock.ExpectQuery("SELECT m_date, aircraft_model(.+) arrival_place FROM logbook_view").WithArgs().
		WillReturnRows(
			mock.NewRows([]string{
				"m_date", "aircraft_model", "se_time", "me_time", "mcc_time", "total_time",
				"day_landings", "night_landings",
				"night_time", "ifr_time", "pic_time", "co_pilot_time",
				"dual_time", "instructor_time", "sim_time", "departure_place", "arrival_place",
			}).AddRow(
				"20220101", "C172", "2:00", "2:00", "2:00", "2:00",
				1, 2,
				"2:00", "2:00", "2:00", "2:00",
				"2:00", "2:00", "2:00", "ZZZZ", "XXXX",
			),
		)

	// mock GetAirportByID
	mock.ExpectQuery("SELECT (.+) FROM airports WHERE").WithArgs("XXXX", "XXXX").
		WillReturnRows(
			mock.NewRows([]string{
				"icao", "iata", "name", "city", "country", "elevation", "lat", "lon",
			}).AddRow(
				"XXXX", "XXX", "Airport", "City", "Country", 100, 55.5, 44.4,
			),
		)

	// mock GetAirportCount
	mock.ExpectQuery("SELECT COUNT(.+) FROM airports").
		WillReturnRows(
			mock.NewRows([]string{
				"count",
			}).AddRow(
				100,
			),
		)

	// mock GetAirports
	mock.ExpectQuery("SELECT (.+) FROM airports").
		WillReturnRows(
			mock.NewRows([]string{
				"icao", "iata", "name", "city", "country", "elevation", "lat", "lon",
			}).AddRow(
				"XXXX", "XXX", "Airport", "City", "Country", 100, 55.5, 44.4,
			),
		)

	// any order of the queries
	mock.MatchExpectationsInOrder(false)
}

var SQLMock = make(map[string]Mock)

func InitSQLMockValues() {
	// GetSettings
	SQLMock["GetSettings"] = Mock{
		Query:  "SELECT (.+) FROM settings2 WHERE id=0",
		Rows:   []string{"settings"},
		Values: []driver.Value{`{"owner_name":"Owner Name","signature_text":"I certify that the entries in this log are true.","aircraft_classes":null,"auth_enabled":false,"login":"login","hash":"$2a$12$s.Q59ZzbJDEGp0QuWIs.R.bpHu.hLFnkfwpQlo2QrJYGVbXEcGM2m","enable_flightrecord_help":false,"export_a4":{"logbook_rows":0,"fill":0,"left_margin":0,"left_margin_a":0,"left_margin_b":0,"top_margin":0,"body_row_height":0,"footer_row_height":0,"page_breaks":"","columns":{"col1":0,"col2":0,"col3":0,"col4":0,"col5":0,"col6":0,"col7":0,"col8":0,"col9":0,"col10":0,"col11":0,"col12":0,"col13":0,"col14":0,"col15":0,"col16":0,"col17":0,"col18":0,"col19":0,"col20":0,"col21":0,"col22":0,"col23":0}},"export_a5":{"logbook_rows":0,"fill":0,"left_margin":0,"left_margin_a":0,"left_margin_b":0,"top_margin":0,"body_row_height":0,"footer_row_height":0,"page_breaks":"","columns":{"col1":0,"col2":0,"col3":0,"col4":0,"col5":0,"col6":0,"col7":0,"col8":0,"col9":0,"col10":0,"col11":0,"col12":0,"col13":0,"col14":0,"col15":0,"col16":0,"col17":0,"col18":0,"col19":0,"col20":0,"col21":0,"col22":0,"col23":0}},"export_xls":{"convert_time":false},"export_csv":{"delimeter":"","crlf":false}}`},
	}

	// UpdateSettings
	SQLMock["UpdateSettings"] = Mock{
		Query: "UPDATE settings2 SET settings",
	}

	// GetTotals
	SQLMock["GetTotals"] = Mock{
		Query: "SELECT (.+) FROM logbook_view",
		Rows: []string{
			"m_date", "se_time", "me_time", "mcc_time", "total_time",
			"day_landings", "night_landings",
			"night_time", "ifr_time", "pic_time", "co_pilot_time",
			"dual_time", "instructor_time", "sim_time", "departure_place", "arrival_place",
		},
		Values: []driver.Value{
			"20220101", "2:00", "2:00", "2:00", "2:00",
			1, 1,
			"2:00", "2:00", "2:00", "2:00",
			"2:00", "2:00", "2:00", "ZZZZ", "XXXX",
		},
	}

	// GetTotals by Class or Type
	SQLMock["GetTotalsClassType"] = Mock{
		Query: "SELECT (.+) FROM logbook_view",
		Rows: []string{
			"m_date", "aircraft_model", "se_time", "me_time", "mcc_time", "total_time",
			"day_landings", "night_landings",
			"night_time", "ifr_time", "pic_time", "co_pilot_time",
			"dual_time", "instructor_time", "sim_time", "departure_place", "arrival_place",
		},
		Values: []driver.Value{
			"20220101", "MODEL", "2:00", "2:00", "2:00", "2:00",
			1, 1,
			"2:00", "2:00", "2:00", "2:00",
			"2:00", "2:00", "2:00", "ZZZZ", "XXXX",
		},
	}

	// GetTotals by Year
	SQLMock["GetTotalsYear"] = Mock{
		Query: "SELECT SUBSTR(.+) FROM logbook_view ORDER BY m_date",
		Rows: []string{
			"m_date", "se_time", "me_time", "mcc_time", "total_time",
			"day_landings", "night_landings",
			"night_time", "ifr_time", "pic_time", "co_pilot_time",
			"dual_time", "instructor_time", "sim_time", "departure_place", "arrival_place",
		},
		Values: []driver.Value{
			"2022", "2:00", "2:00", "2:00", "2:00",
			1, 1,
			"2:00", "2:00", "2:00", "2:00",
			"2:00", "2:00", "2:00", "ZZZZ", "XXXX",
		},
	}

	// GetAircrafts
	SQLMock["GetAircraftsLast"] = Mock{
		Query: "SELECT (.+) FROM \\(SELECT aircraft_model, reg_name FROM logbook_view WHERE aircraft_model <> '' ORDER BY m_date DESC LIMIT 100\\)",
		Rows: []string{
			"aircraft_model", "reg_name",
		},
		Values: []driver.Value{
			"MODEL", "REG",
		},
	}

	SQLMock["GetAircraftsAll"] = Mock{
		Query: "SELECT (.+) FROM logbook_view WHERE aircraft_model <> '' GROUP BY aircraft_model, reg_name ORDER BY aircraft_model",
		Rows: []string{
			"aircraft_model", "reg_name",
		},
		Values: []driver.Value{
			"MODEL", "REG",
		},
	}

	// GetAirportByID
	SQLMock["GetAirportByID"] = Mock{
		Query: "SELECT (.+) FROM airports WHERE",
		Rows: []string{
			"icao", "iata", "name", "city", "country", "elevation", "lat", "lon",
		},
		Values: []driver.Value{
			"XXXX", "XXX", "Airport", "City", "Country", 100, 55.5, 44.4,
		},
		Args: []driver.Value{
			"XXXX", "XXXX",
		},
	}

	// GetAirportCount
	SQLMock["GetAirportCount"] = Mock{
		Query: "SELECT COUNT(.+) FROM airports",
		Rows: []string{
			"count",
		},
		Values: []driver.Value{
			100,
		},
	}

	// GetAirports
	SQLMock["GetAirports"] = Mock{
		Query: "SELECT (.+) FROM airports",
		Rows: []string{
			"icao", "iata", "name", "city", "country", "elevation", "lat", "lon",
		},
		Values: []driver.Value{
			"XXXX", "XXX", "Airport", "City", "Country", 100, 55.5, 44.4,
		},
	}

	// GetAttachments
	SQLMock["GetAttachments"] = Mock{
		Query: "SELECT (.+) FROM attachments WHERE record_id",
		Rows: []string{
			"uuid", "record_id", "document_name",
		},
		Values: []driver.Value{
			"UUID", "RECORDID", "ATTACHMENT_NAME",
		},
		Args: []driver.Value{
			"RECORDID",
		},
	}

	// GetAttachmentByID
	SQLMock["GetAttachmentByID"] = Mock{
		Query: "SELECT (.+) FROM attachments WHERE uuid",
		Rows: []string{
			"uuid", "record_id", "document_name", "document",
		},
		Values: []driver.Value{
			"UUID", "RECORDID", "ATTACHMENT_NAME", "DOC",
		},
		Args: []driver.Value{
			"UUID",
		},
	}

	// InsertAttachment
	SQLMock["InsertAttachment"] = Mock{
		Query: "INSERT INTO attachments (.+) VALUES",
	}

	// DeleteAttachment
	SQLMock["DeleteAttachment"] = Mock{
		Query: "DELETE FROM attachments WHERE",
	}

	// DeleteAttachmentsForFlightRecord
	SQLMock["DeleteAttachmentsForFlightRecord"] = Mock{
		Query: "DELETE FROM attachments WHERE record_id",
	}
}

func AddMock(mock sqlmock.Sqlmock, item string) {
	if len(SQLMock[item].Rows) == 0 {
		mock.ExpectExec(SQLMock[item].Query).WithArgs().WillReturnResult(sqlmock.NewResult(1, 1))

	} else if len(SQLMock[item].Args) == 0 {
		mock.ExpectQuery(SQLMock[item].Query).WithArgs().
			WillReturnRows(mock.NewRows(SQLMock[item].Rows).
				AddRow(SQLMock[item].Values...))

	} else {
		mock.ExpectQuery(SQLMock[item].Query).WithArgs(SQLMock[item].Args...).
			WillReturnRows(mock.NewRows(SQLMock[item].Rows).
				AddRow(SQLMock[item].Values...))

	}
}
