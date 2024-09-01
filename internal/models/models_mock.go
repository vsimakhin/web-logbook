package models

import (
	"github.com/DATA-DOG/go-sqlmock"
)

var SQLMock = make(map[string]Mock)

func InitMock(mock sqlmock.Sqlmock, item string) {
	switch item {
	case "DeleteLicenseRecord":
		mock.ExpectExec("DELETE FROM licensing WHERE uuid = ?").
			WithArgs("uuid").
			WillReturnResult(sqlmock.NewResult(0, 1))

	case "UpdateLicenseRecord":
		mock.ExpectExec("UPDATE licensing SET category = ?").
			WithArgs("category", "name", "number", "issued", "valid_from", "valid_until", "remarks", "uuid").
			WillReturnResult(sqlmock.NewResult(0, 1))

	case "InsertLicenseRecord":
		mock.ExpectExec("INSERT INTO licensing").
			WithArgs("uuid", "category", "name", "number", "issued", "valid_from", "valid_until", "remarks", "document_name", []byte("0")).
			WillReturnResult(sqlmock.NewResult(0, 1))

	case "UpdateFlightRecord":
		mock.ExpectExec("UPDATE logbook SET date").
			WithArgs("01/02/2022", "LKPR", "1000", "EDDM", "1200", "C152", "OK-XXX", "2:00", "2:00", "2:00", "2:00", 1, 2,
				"2:00", "2:00", "2:00", "2:00", "2:00", "2:00", "SIM", "2:00", "Self", "Remarks", "uuid").
			WillReturnResult(sqlmock.NewResult(0, 1))

	case "InsertFlightRecord":
		mock.ExpectExec("INSERT INTO logbook").
			WithArgs("uuid", "01/02/2022", "LKPR", "1000", "EDDM", "1200", "C152", "OK-XXX", "2:00", "2:00", "2:00", "2:00", 1, 2,
				"2:00", "2:00", "2:00", "2:00", "2:00", "2:00", "SIM", "2:00", "Self", "Remarks").
			WillReturnResult(sqlmock.NewResult(0, 1))

	case "DeleteFlightRecord":
		mock.ExpectExec("DELETE FROM logbook WHERE uuid = ?").
			WithArgs("uuid").
			WillReturnResult(sqlmock.NewResult(0, 1))

	case "DeleteAttachment":
		mock.ExpectExec("DELETE FROM attachments WHERE uuid").
			WithArgs("uuid").
			WillReturnResult(sqlmock.NewResult(0, 1))

	case "InsertAttachment":
		mock.ExpectExec("INSERT INTO attachments").
			WithArgs("uuid", "record_id", "document_name", []byte("doc")).
			WillReturnResult(sqlmock.NewResult(0, 1))

	case "GetAttachments":
		mock.ExpectQuery("SELECT (.+) FROM attachments WHERE record_id").
			WithArgs("RECORDID").
			WillReturnRows(mock.NewRows([]string{"uuid", "record_id", "document_name"}).
				AddRow("UUID", "RECORDID", "ATTACHMENT_NAME"))

	case "GetAttachmentByID":
		mock.ExpectQuery("SELECT (.+) FROM attachments WHERE uuid").
			WithArgs("UUID").
			WillReturnRows(mock.NewRows([]string{"uuid", "record_id", "document_name", "document"}).
				AddRow("UUID", "RECORDID", "ATTACHMENT_NAME", "DOC"))

	case "GetAttachments2":
		mock.ExpectQuery("SELECT uuid FROM attachments WHERE record_id").
			WithArgs("uuid").
			WillReturnRows(mock.NewRows([]string{"uuid"}).
				AddRow("uuid"))

	case "DeleteAttachmentsForFlightRecord":
		mock.ExpectExec("DELETE FROM at1tachments WHERE uuid").
			WithArgs("uuid").
			WillReturnResult(sqlmock.NewResult(0, 1))

	case "GetAircraftsLast":
		mock.ExpectQuery("SELECT (.+) FROM \\(SELECT aircraft_model, reg_name FROM logbook_view WHERE aircraft_model <> '' ORDER BY m_date DESC LIMIT 100\\)").
			WillReturnRows(mock.NewRows([]string{"aircraft_model", "reg_name"}).
				AddRow("MODEL", "REG"))

	case "GetAircraftsAll":
		mock.ExpectQuery("SELECT (.+) FROM logbook_view WHERE aircraft_model <> '' GROUP BY aircraft_model, reg_name ORDER BY aircraft_model").
			WillReturnRows(mock.NewRows([]string{"aircraft_model", "reg_name"}).
				AddRow("MODEL", "REG"))

	case "GetSettings":
		mock.ExpectQuery("SELECT (.+) FROM settings2 WHERE id=0").
			WillReturnRows(mock.NewRows([]string{"settings"}).
				AddRow(`{"owner_name":"Owner Name","signature_text":"I certify that the entries in this log are true.","aircraft_classes":{"class":"model1,model2"},"auth_enabled":false,"login":"login","hash":"$2a$12$s.Q59ZzbJDEGp0QuWIs.R.bpHu.hLFnkfwpQlo2QrJYGVbXEcGM2m","disable_flightrecord_help":false,"export_a4":{"logbook_rows":0,"fill":0,"left_margin":0,"left_margin_a":0,"left_margin_b":0,"top_margin":0,"body_row_height":0,"footer_row_height":0,"page_breaks":"","columns":{"col1":0,"col2":0,"col3":0,"col4":0,"col5":0,"col6":0,"col7":0,"col8":0,"col9":0,"col10":0,"col11":0,"col12":0,"col13":0,"col14":0,"col15":0,"col16":0,"col17":0,"col18":0,"col19":0,"col20":0,"col21":0,"col22":0,"col23":0}},"export_a5":{"logbook_rows":0,"fill":0,"left_margin":0,"left_margin_a":0,"left_margin_b":0,"top_margin":0,"body_row_height":0,"footer_row_height":0,"page_breaks":"","columns":{"col1":0,"col2":0,"col3":0,"col4":0,"col5":0,"col6":0,"col7":0,"col8":0,"col9":0,"col10":0,"col11":0,"col12":0,"col13":0,"col14":0,"col15":0,"col16":0,"col17":0,"col18":0,"col19":0,"col20":0,"col21":0,"col22":0,"col23":0}},"export_xls":{"convert_time":false},"export_csv":{"delimeter":"","crlf":false}}`))

	case "GetAirportByID":
		mock.ExpectQuery("SELECT (.+) FROM airports_view WHERE").
			WithArgs("XXXX", "XXXX").
			WillReturnRows(mock.NewRows([]string{"icao", "iata", "name", "city", "country", "elevation", "lat", "lon"}).
				AddRow("XXXX", "XXX", "Airport", "City", "Country", 100, 55.5, 44.4))

	case "GetAirports":
		mock.ExpectQuery("SELECT (.+) FROM airports_view").
			WillReturnRows(mock.NewRows([]string{"icao", "iata", "name", "city", "country", "elevation", "lat", "lon"}).
				AddRow("XXXX", "XXX", "Airport", "City", "Country", 100, 55.5, 44.4))

	case "GetAirportCount":
		mock.ExpectQuery("SELECT COUNT(.+) FROM airports").
			WillReturnRows(mock.NewRows([]string{"count"}).
				AddRow(100))

	case "GetFlightRecords":
		mock.ExpectQuery("SELECT (.+) FROM logbook_view ORDER BY m_date desc, departure_time desc").
			WillReturnRows(mock.NewRows([]string{
				"uuid", "date", "m_date", "departure_place", "departure_time",
				"arrival_place", "arrival_time", "aircraft_model", "reg_name",
				"se_time", "me_time", "mcc_time", "total_time", "day_landings", "night_landings",
				"night_time", "ifr_time", "pic_time", "co_pilot_time", "dual_time", "instructor_time",
				"sim_type", "sim_time", "pic_name", "remarks",
			}).
				AddRow("uuid", "01/02/2022", "20220201", "XXXX", "1000",
					"XXXX", "1200", "C152", "OK-XXX",
					"2:00", "2:00", "2:00", "2:00", 1, 2,
					"2:00", "2:00", "2:00", "2:00", "2:00", "2:00",
					"SIM", "2:00", "Self", "Remarks"))

	case "GetFlightRecordByID":
		mock.ExpectQuery("SELECT (.+) FROM logbook_view WHERE uuid").
			WithArgs("uuid").
			WillReturnRows(mock.NewRows([]string{
				"uuid", "date", "m_date", "departure_place", "departure_time",
				"arrival_place", "arrival_time", "aircraft_model", "reg_name",
				"se_time", "me_time", "mcc_time", "total_time", "day_landings", "night_landings",
				"night_time", "ifr_time", "pic_time", "co_pilot_time", "dual_time", "instructor_time",
				"sim_type", "sim_time", "pic_name", "remarks",
			}).
				AddRow("uuid", "01/02/2022", "20220201", "XXXX", "1000",
					"XXXX", "1200", "C152", "OK-XXX",
					"2:00", "2:00", "2:00", "2:00", 1, 2,
					"2:00", "2:00", "2:00", "2:00", "2:00", "2:00",
					"SIM", "2:00", "Self", "Remarks"))

	case "GetLicenses":
		mock.ExpectQuery("SELECT (.+) FROM licensing ORDER BY category, name").
			WillReturnRows(mock.NewRows([]string{
				"uuid", "category", "name", "number", "issued",
				"valid_from", "valid_until", "document_name", "document",
			}).
				AddRow("uuid", "category", "name", "number", "issued",
					"01/01/2022", "01/01/2022", "document_name", "document"))

	case "GetLicenseRecordByID":
		mock.ExpectQuery("SELECT (.+) FROM licensing WHERE uuid").
			WithArgs("uuid").
			WillReturnRows(mock.NewRows([]string{
				"uuid", "category", "name", "number", "issued",
				"valid_from", "valid_until", "remarks", "document_name", "document",
			}).
				AddRow("uuid", "category", "name", "number", "issued",
					"01/01/2022", "01/01/2023", "remarks", "document_name", "document"))

	case "GetLicensesCategory":
		mock.ExpectQuery("SELECT category FROM licensing GROUP BY category ORDER BY category").
			WillReturnRows(mock.NewRows([]string{"category"}).
				AddRow("category"))

	case "GetTotals":
		mock.ExpectQuery("SELECT (.+) FROM logbook_view").
			WillReturnRows(mock.NewRows([]string{
				"m_date", "se_time", "me_time", "mcc_time", "total_time",
				"day_landings", "night_landings",
				"night_time", "ifr_time", "pic_time", "co_pilot_time",
				"dual_time", "instructor_time", "sim_time", "departure_place", "arrival_place",
			}).
				AddRow("20220101", "2:00", "2:00", "2:00", "2:00",
					1, 1,
					"2:00", "2:00", "2:00", "2:00",
					"2:00", "2:00", "2:00", "ZZZZ", "XXXX"))

	case "GetTotalsClassType":
		mock.ExpectQuery("SELECT (.+) FROM logbook_view").
			WillReturnRows(mock.NewRows([]string{
				"m_date", "aircraft_model", "se_time", "me_time", "mcc_time", "total_time",
				"day_landings", "night_landings",
				"night_time", "ifr_time", "pic_time", "co_pilot_time",
				"dual_time", "instructor_time", "sim_time", "departure_place", "arrival_place",
			}).
				AddRow("20220101", "MODEL", "2:00", "2:00", "2:00", "2:00",
					1, 1,
					"2:00", "2:00", "2:00", "2:00",
					"2:00", "2:00", "2:00", "ZZZZ", "XXXX"))

	case "GetTotalsYear":
		mock.ExpectQuery("SELECT (.+) FROM logbook_view ORDER BY m_date").
			WillReturnRows(mock.NewRows([]string{
				"m_date", "se_time", "me_time", "mcc_time", "total_time",
				"day_landings", "night_landings",
				"night_time", "ifr_time", "pic_time", "co_pilot_time",
				"dual_time", "instructor_time", "sim_time", "departure_place", "arrival_place",
			}).
				AddRow("2022", "2:00", "2:00", "2:00", "2:00",
					1, 1,
					"2:00", "2:00", "2:00", "2:00",
					"2:00", "2:00", "2:00", "ZZZZ", "XXXX"))

	case "GetAircraftsModels":
		mock.ExpectQuery("SELECT (.+) FROM logbook_view WHERE aircraft_model <> '' GROUP BY aircraft_model ORDER BY aircraft_model").
			WillReturnRows(mock.NewRows([]string{"aircraft_model"}).
				AddRow("MODEL"))

	case "GetAircraftsRegs":
		mock.ExpectQuery("SELECT (.+) FROM logbook_view WHERE reg_name <> '' GROUP BY reg_name ORDER BY reg_name").
			WillReturnRows(mock.NewRows([]string{"reg_name"}).
				AddRow("REG"))
	}
}
