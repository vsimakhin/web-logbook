package models

import (
	"context"
	"database/sql"
	"time"
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

// jsonResponse is a type for post data handlers response
type JSONResponse struct {
	OK          bool   `json:"ok"`
	Message     string `json:"message,omitempty"`
	RedirectURL string `json:"redirect_url,omitempty"`
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
}

func (m *DBModel) GetFlightRecordByID(uuid string) (FlightRecord, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var fr FlightRecord

	row := m.DB.QueryRowContext(ctx, `
		SELECT
			uuid, date, m_date, departure_place, departure_time,
			arrival_place, arrival_time, aircraft_model, reg_name,
			se_time, me_time, mcc_time, total_time, day_landings, night_landings,
			night_time, ifr_time, pic_time, co_pilot_time, dual_time, instructor_time,
			sim_type, sim_time, pic_name, remarks
		FROM logbook_view
		WHERE uuid = ?`, uuid)

	err := row.Scan(&fr.UUID, &fr.Date, &fr.MDate, &fr.Departure.Place, &fr.Departure.Time,
		&fr.Arrival.Place, &fr.Arrival.Time, &fr.Aircraft.Model, &fr.Aircraft.Reg,
		&fr.Time.SE, &fr.Time.ME, &fr.Time.MCC, &fr.Time.Total, &fr.Landings.Day, &fr.Landings.Night,
		&fr.Time.Night, &fr.Time.IFR, &fr.Time.PIC, &fr.Time.CoPilot, &fr.Time.Dual, &fr.Time.Instructor,
		&fr.SIM.Type, &fr.SIM.Time, &fr.PIC, &fr.Remarks)

	if err != nil {
		return fr, err
	}

	return fr, nil
}

// UpdateFlightRecord updates the flight records in the logbook table
func (m *DBModel) UpdateFlightRecord(fr FlightRecord) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := m.DB.ExecContext(ctx, `
		UPDATE logbook
		SET
			date = ?, departure_place = ?, departure_time = ?,
			arrival_place = ?, arrival_time = ?, aircraft_model = ?, reg_name = ?,
			se_time = ?, me_time = ?, mcc_time = ?, total_time = ?, day_landings = ?, night_landings = ?,
			night_time = ?, ifr_time = ?, pic_time = ?, co_pilot_time = ?, dual_time = ?, instructor_time = ?,
			sim_type = ?, sim_time = ?, pic_name = ?, remarks = ?
		WHERE uuid = ?`,
		fr.Date, fr.Departure.Place, fr.Departure.Time,
		fr.Arrival.Place, fr.Arrival.Time, fr.Aircraft.Model, fr.Aircraft.Reg,
		fr.Time.SE, fr.Time.ME, fr.Time.MCC, fr.Time.Total, fr.Landings.Day, fr.Landings.Night,
		fr.Time.Night, fr.Time.IFR, fr.Time.PIC, fr.Time.CoPilot, fr.Time.Dual, fr.Time.Instructor,
		fr.SIM.Type, fr.SIM.Time, fr.PIC, fr.Remarks, fr.UUID,
	)

	if err != nil {
		return err
	}

	return nil
}

// InsertFlightRecord add a new flight record to the logbook table
func (m *DBModel) InsertFlightRecord(fr FlightRecord) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := m.DB.ExecContext(ctx, `
		INSERT INTO logbook
			(uuid, date, departure_place, departure_time,
			arrival_place, arrival_time, aircraft_model, reg_name,
			se_time, me_time, mcc_time, total_time, day_landings, night_landings,
			night_time, ifr_time, pic_time, co_pilot_time, dual_time, instructor_time,
			sim_type, sim_time, pic_name, remarks)
		VALUES (?, ?, ?, ?,
			?, ?, ?, ?,
			?, ?, ?, ?, ?, ?,
			?, ?, ?, ?, ?, ?,
			?, ?, ?, ?)`,
		fr.UUID, fr.Date, fr.Departure.Place, fr.Departure.Time,
		fr.Arrival.Place, fr.Arrival.Time, fr.Aircraft.Model, fr.Aircraft.Reg,
		fr.Time.SE, fr.Time.ME, fr.Time.MCC, fr.Time.Total, fr.Landings.Day, fr.Landings.Night,
		fr.Time.Night, fr.Time.IFR, fr.Time.PIC, fr.Time.CoPilot, fr.Time.Dual, fr.Time.Instructor,
		fr.SIM.Type, fr.SIM.Time, fr.PIC, fr.Remarks,
	)

	if err != nil {
		return err
	}

	return nil
}

// DeleteFlightRecord deletes a flight record by UUID
func (m *DBModel) DeleteFlightRecord(uuid string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := m.DB.ExecContext(ctx, `
		DELETE FROM logbook
		WHERE
			uuid = ?`, uuid,
	)

	if err != nil {
		return err
	}

	return nil
}

// GetFlightRecords returns the flight records in the logbook table
func (m *DBModel) GetFlightRecords() ([]FlightRecord, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var fr FlightRecord
	var flightRecords []FlightRecord

	rows, err := m.DB.QueryContext(ctx, `
		SELECT
			uuid, date, m_date, departure_place, departure_time,
			arrival_place, arrival_time, aircraft_model, reg_name,
			se_time, me_time, mcc_time, total_time, day_landings, night_landings,
			night_time, ifr_time, pic_time, co_pilot_time, dual_time, instructor_time,
			sim_type, sim_time, pic_name, remarks
		FROM logbook_view
		ORDER BY m_date desc`)

	if err != nil {
		return flightRecords, err
	}
	defer rows.Close()

	for rows.Next() {
		err = rows.Scan(&fr.UUID, &fr.Date, &fr.MDate, &fr.Departure.Place, &fr.Departure.Time,
			&fr.Arrival.Place, &fr.Arrival.Time, &fr.Aircraft.Model, &fr.Aircraft.Reg,
			&fr.Time.SE, &fr.Time.ME, &fr.Time.MCC, &fr.Time.Total, &fr.Landings.Day, &fr.Landings.Night,
			&fr.Time.Night, &fr.Time.IFR, &fr.Time.PIC, &fr.Time.CoPilot, &fr.Time.Dual, &fr.Time.Instructor,
			&fr.SIM.Type, &fr.SIM.Time, &fr.PIC, &fr.Remarks)

		if err != nil {
			return flightRecords, err
		}
		flightRecords = append(flightRecords, fr)
	}

	return flightRecords, nil
}

// GetAircraftRegs returns all already recorded aircraft registrations
func (m *DBModel) GetAircraftRegs() ([]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var reg string
	var allRegs []string

	rows, err := m.DB.QueryContext(ctx, `
		SELECT
			reg_name
		FROM logbook_view
		GROUP BY reg_name
		ORDER BY reg_name`)

	if err != nil {
		return allRegs, err
	}
	defer rows.Close()

	for rows.Next() {
		err = rows.Scan(&reg)

		if err != nil {
			return allRegs, err
		}
		allRegs = append(allRegs, reg)
	}

	return allRegs, nil
}

// GetAircraftModels returns all already recorded aircraft models
func (m *DBModel) GetAircraftModels() ([]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var aircraftModel string
	var allModels []string

	rows, err := m.DB.QueryContext(ctx, `
		SELECT
			aircraft_model
		FROM logbook_view
		GROUP BY aircraft_model
		ORDER BY aircraft_model`)

	if err != nil {
		return allModels, err
	}
	defer rows.Close()

	for rows.Next() {
		err = rows.Scan(&aircraftModel)

		if err != nil {
			return allModels, err
		}
		allModels = append(allModels, aircraftModel)
	}

	return allModels, nil
}
