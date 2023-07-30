package models

import (
	"database/sql/driver"

	"github.com/DATA-DOG/go-sqlmock"
)

var SQLMock = make(map[string]Mock)

func InitSQLMockValues() {
	// GetSettings
	SQLMock["GetSettings"] = Mock{
		Query:  "SELECT (.+) FROM settings2 WHERE id=0",
		Rows:   []string{"settings"},
		Values: []driver.Value{`{"owner_name":"Owner Name","signature_text":"I certify that the entries in this log are true.","aircraft_classes":{"class":"model1,model2"},"auth_enabled":false,"login":"login","hash":"$2a$12$s.Q59ZzbJDEGp0QuWIs.R.bpHu.hLFnkfwpQlo2QrJYGVbXEcGM2m","disable_flightrecord_help":false,"export_a4":{"logbook_rows":0,"fill":0,"left_margin":0,"left_margin_a":0,"left_margin_b":0,"top_margin":0,"body_row_height":0,"footer_row_height":0,"page_breaks":"","columns":{"col1":0,"col2":0,"col3":0,"col4":0,"col5":0,"col6":0,"col7":0,"col8":0,"col9":0,"col10":0,"col11":0,"col12":0,"col13":0,"col14":0,"col15":0,"col16":0,"col17":0,"col18":0,"col19":0,"col20":0,"col21":0,"col22":0,"col23":0}},"export_a5":{"logbook_rows":0,"fill":0,"left_margin":0,"left_margin_a":0,"left_margin_b":0,"top_margin":0,"body_row_height":0,"footer_row_height":0,"page_breaks":"","columns":{"col1":0,"col2":0,"col3":0,"col4":0,"col5":0,"col6":0,"col7":0,"col8":0,"col9":0,"col10":0,"col11":0,"col12":0,"col13":0,"col14":0,"col15":0,"col16":0,"col17":0,"col18":0,"col19":0,"col20":0,"col21":0,"col22":0,"col23":0}},"export_xls":{"convert_time":false},"export_csv":{"delimeter":"","crlf":false}}`},
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
		Query: "SELECT (.+) FROM airports_view WHERE",
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
		Query: "SELECT (.+) FROM airports_view",
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

	SQLMock["GetAttachments2"] = Mock{
		Query: "SELECT uuid FROM attachments WHERE record_id",
		Rows: []string{
			"uuid",
		},
		Values: []driver.Value{
			"UUID",
		},
		Args: []driver.Value{
			"UUID",
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

	// GetFlightRecords
	SQLMock["GetFlightRecords"] = Mock{
		Query: "SELECT (.+) FROM logbook_view ORDER BY m_date desc, departure_time desc",
		Rows: []string{
			"uuid", "date", "m_date", "departure_place", "departure_time",
			"arrival_place", "arrival_time", "aircraft_model", "reg_name",
			"se_time", "me_time", "mcc_time", "total_time", "day_landings", "night_landings",
			"night_time", "ifr_time", "pic_time", "co_pilot_time", "dual_time", "instructor_time",
			"sim_type", "sim_time", "pic_name", "remarks", "update_time",
		},
		Values: []driver.Value{
			"uuid", "01/02/2022", "20220201", "XXXX", "1000",
			"XXXX", "1200", "C152", "OK-XXX",
			"2:00", "2:00", "2:00", "2:00", 1, 2,
			"2:00", "2:00", "2:00", "2:00", "2:00", "2:00",
			"SIM", "2:00", "Self", "Remarks", 1234567890,
		},
	}

	// GetFlightRecordByID
	SQLMock["GetFlightRecordByID"] = Mock{
		Query: "SELECT (.+) FROM logbook_view WHERE uuid",
		Rows: []string{
			"uuid", "date", "m_date", "departure_place", "departure_time",
			"arrival_place", "arrival_time", "aircraft_model", "reg_name",
			"se_time", "me_time", "mcc_time", "total_time", "day_landings", "night_landings",
			"night_time", "ifr_time", "pic_time", "co_pilot_time", "dual_time", "instructor_time",
			"sim_type", "sim_time", "pic_name", "remarks", "update_time",
		},
		Values: []driver.Value{
			"uuid", "01/02/2022", "20220201", "XXXX", "1000",
			"XXXX", "1200", "C152", "OK-XXX",
			"2:00", "2:00", "2:00", "2:00", 1, 2,
			"2:00", "2:00", "2:00", "2:00", "2:00", "2:00",
			"SIM", "2:00", "Self", "Remarks", 1234567890,
		},
		Args: []driver.Value{
			"uuid",
		},
	}

	// UpdateFlightRecord
	SQLMock["UpdateFlightRecord"] = Mock{
		Query: "UPDATE logbook SET",
	}

	// InsertFlightRecord
	SQLMock["InsertFlightRecord"] = Mock{
		Query: "INSERT INTO logbook \\(uuid, date, departure_place, departure_time, " +
			"arrival_place, arrival_time, aircraft_model, reg_name, se_time, me_time, mcc_time, " +
			"total_time, day_landings, night_landings, night_time, ifr_time, pic_time, co_pilot_time, " +
			"dual_time, instructor_time, sim_type, sim_time, pic_name, remarks, update_time\\)",
	}

	// DeleteFlightRecord
	SQLMock["DeleteFlightRecord"] = Mock{
		Query: "DELETE FROM logbook WHERE uuid",
	}

	// GetLicenses
	SQLMock["GetLicenses"] = Mock{
		Query: "SELECT (.+) FROM licensing ORDER BY category, name",
		Rows: []string{
			"uuid", "category", "name", "number", "issued",
			"valid_from", "valid_until", "document_name",
		},
		Values: []driver.Value{
			"uuid", "category", "name", "number", "issued",
			"01/01/2022", "01/01/2022", "document_name",
		},
	}

	// GetLicenseRecordByID
	SQLMock["GetLicenseRecordByID"] = Mock{
		Query: "SELECT (.+) FROM licensing WHERE uuid",
		Rows: []string{
			"uuid", "category", "name", "number", "issued",
			"valid_from", "valid_until", "remarks", "document_name", "document",
		},
		Values: []driver.Value{
			"uuid", "category", "name", "number", "issued",
			"01/01/2022", "01/01/2023", "remarks", "document_name", "document",
		},
		Args: []driver.Value{
			"uuid",
		},
	}

	// GetLicensesCategory
	SQLMock["GetLicensesCategory"] = Mock{
		Query: "SELECT category FROM licensing GROUP BY category ORDER BY category",
		Rows: []string{
			"category",
		},
		Values: []driver.Value{
			"category",
		},
	}

	// UpdateLicenseRecord
	SQLMock["UpdateLicenseRecord"] = Mock{
		Query: "UPDATE licensing SET",
	}

	// InsertLicenseRecord
	SQLMock["InsertLicenseRecord"] = Mock{
		Query: "INSERT INTO licensing",
	}

	// DeleteLicenseRecord
	SQLMock["DeleteLicenseRecord"] = Mock{
		Query: "DELETE FROM licensing WHERE uuid",
	}

	// DeleteLicenseAttachment
	SQLMock["DeleteLicenseAttachment"] = Mock{
		Query: "UPDATE licensing SET document_name",
	}

	// InsertDeletedItem
	SQLMock["InsertDeletedItem"] = Mock{
		Query: "INSERT INTO deleted_items \\(uuid, table_name, delete_time\\)",
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
