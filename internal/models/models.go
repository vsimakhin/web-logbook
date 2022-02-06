package models

import (
	"database/sql"

	"github.com/DATA-DOG/go-sqlmock"
)

// DBModel is a type for database connections
type DBModel struct {
	DB *sql.DB
}

// Models is a wraper for DBModel
type Models struct {
	DB DBModel
}

// NewMdels returns a model type with db connection pool
func NewModels(db *sql.DB) Models {
	return Models{
		DB: DBModel{DB: db},
	}
}

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

	// any order of the queries
	mock.MatchExpectationsInOrder(false)
}
