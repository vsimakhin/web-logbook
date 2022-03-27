package models

import "github.com/DATA-DOG/go-sqlmock"

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

	// mock GetAircraftRegs
	mock.ExpectQuery("SELECT (.+) FROM \\(SELECT reg_name FROM logbook_view ORDER BY m_date DESC LIMIT 300\\)").
		WillReturnRows(
			mock.NewRows([]string{"reg_name"}).AddRow("REG1"),
		)

	// mock GetAircraftModels
	mock.ExpectQuery("SELECT (.+) FROM \\(SELECT aircraft_model FROM logbook_view ORDER BY m_date DESC LIMIT 300\\)").
		WillReturnRows(
			mock.NewRows([]string{"aircraft_model"}).AddRow("MODEL1"),
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
				AddRow(`{"owner_name":"Owner Name","signature_text":"I certify that the entries in this log are true.","page_breaks_a4":"","page_breaks_a5":"","aircraft_classes":null,"auth_enabled":false,"login":"","password":"","hash":""}`),
		)

	// mock UpdateSettings
	mock.ExpectExec("UPDATE settings2 SET").
		WithArgs(`{"owner_name":"Owner Name","signature_text":"I certify that the entries in this log are true.","page_breaks_a4":"","page_breaks_a5":"","aircraft_classes":null,"auth_enabled":false,"login":"","password":"","hash":""}`).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// mock GetTotals
	mock.ExpectQuery("SELECT (.+) FROM logbook_view WHERE").WithArgs().
		WillReturnRows(
			mock.NewRows([]string{
				"se_time", "me_time", "mcc_time", "total_time",
				"day_landings", "night_landings",
				"night_time", "ifr_time", "pic_time", "co_pilot_time",
				"dual_time", "instructor_time", "sim_time", "departure_place", "arrival_place",
			}).AddRow(
				"2:00", "2:00", "2:00", "2:00",
				1, 2,
				"2:00", "2:00", "2:00", "2:00",
				"2:00", "2:00", "2:00", "ZZZZ", "XXXX",
			),
		)

	// mock GetTotals without params
	mock.ExpectQuery("SELECT (.+) arrival_place FROM logbook_view ").WithArgs().
		WillReturnRows(
			mock.NewRows([]string{
				"se_time", "me_time", "mcc_time", "total_time",
				"day_landings", "night_landings",
				"night_time", "ifr_time", "pic_time", "co_pilot_time",
				"dual_time", "instructor_time", "sim_time", "departure_place", "arrival_place",
			}).AddRow(
				"2:00", "2:00", "2:00", "2:00",
				1, 2,
				"2:00", "2:00", "2:00", "2:00",
				"2:00", "2:00", "2:00", "ZZZZ", "XXXX",
			),
		)

	// mock GetTotals with WHERE m_date
	mock.ExpectQuery("SELECT (.+) FROM logbook_view WHERE m_date").WithArgs().
		WillReturnRows(
			mock.NewRows([]string{
				"se_time", "me_time", "mcc_time", "total_time",
				"day_landings", "night_landings",
				"night_time", "ifr_time", "pic_time", "co_pilot_time",
				"dual_time", "instructor_time", "sim_time", "departure_place", "arrival_place",
			}).AddRow(
				"2:00", "2:00", "2:00", "2:00",
				1, 2,
				"2:00", "2:00", "2:00", "2:00",
				"2:00", "2:00", "2:00", "ZZZZ", "XXXX",
			),
		)

	// mock GetTotals with WHERE SUBSTR (need it 2 times for stats page)
	for i := 1; i <= 2; i++ {
		mock.ExpectQuery("SELECT (.+) FROM logbook_view WHERE SUBSTR").WithArgs().
			WillReturnRows(
				mock.NewRows([]string{
					"se_time", "me_time", "mcc_time", "total_time",
					"day_landings", "night_landings",
					"night_time", "ifr_time", "pic_time", "co_pilot_time",
					"dual_time", "instructor_time", "sim_time", "departure_place", "arrival_place",
				}).AddRow(
					"2:00", "2:00", "2:00", "2:00",
					1, 2,
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
	mock.ExpectQuery("SELECT aircraft_model(.+) arrival_place FROM logbook_view ORDER BY m_date").WithArgs().
		WillReturnRows(
			mock.NewRows([]string{
				"aircraft_model", "se_time", "me_time", "mcc_time", "total_time",
				"day_landings", "night_landings",
				"night_time", "ifr_time", "pic_time", "co_pilot_time",
				"dual_time", "instructor_time", "sim_time", "departure_place", "arrival_place",
			}).AddRow(
				"C172", "2:00", "2:00", "2:00", "2:00",
				1, 2,
				"2:00", "2:00", "2:00", "2:00",
				"2:00", "2:00", "2:00", "ZZZZ", "XXXX",
			),
		)

	// mock GetTotalsByAircraftClass
	mock.ExpectQuery("SELECT aircraft_model(.+) arrival_place FROM logbook_view ORDER BY m_date").WithArgs().
		WillReturnRows(
			mock.NewRows([]string{
				"aircraft_model", "se_time", "me_time", "mcc_time", "total_time",
				"day_landings", "night_landings",
				"night_time", "ifr_time", "pic_time", "co_pilot_time",
				"dual_time", "instructor_time", "sim_time", "departure_place", "arrival_place",
			}).AddRow(
				"C172", "2:00", "2:00", "2:00", "2:00",
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
