package models

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"
)

// atod converts formatted string to time.Duration
func atod(value string) time.Duration {
	strTime := value

	if strTime == "" {
		strTime = "0:0"
	}

	strTime = fmt.Sprintf("%sm", strings.ReplaceAll(strTime, ":", "h"))

	duration, err := time.ParseDuration(strTime)
	if err != nil {
		fmt.Printf("Error parsing time %s\n", strTime)
		duration, _ = time.ParseDuration("0h0m")
	}

	return duration
}

// exported dtoa function
func (m *DBModel) DtoA(value time.Duration) string {
	return dtoa(value)
}

// dtoa converts time.Duration to formatted string
func dtoa(value time.Duration) string {

	d := value.Round(time.Minute)
	h := d / time.Hour
	d -= h * time.Hour
	m := d / time.Minute

	if h == 0 && m == 0 {
		return "0:00"
	} else {
		return fmt.Sprintf("%01d:%02d", h, m)
	}
}

// calculateTotals calculates totals for page footer
func CalculateTotals(totals FlightRecord, record FlightRecord) FlightRecord {

	totals.Time.SE = dtoa(atod(totals.Time.SE) + atod(record.Time.SE))
	totals.Time.ME = dtoa(atod(totals.Time.ME) + atod(record.Time.ME))
	totals.Time.MCC = dtoa(atod(totals.Time.MCC) + atod(record.Time.MCC))
	totals.Time.Night = dtoa(atod(totals.Time.Night) + atod(record.Time.Night))
	totals.Time.IFR = dtoa(atod(totals.Time.IFR) + atod(record.Time.IFR))
	totals.Time.PIC = dtoa(atod(totals.Time.PIC) + atod(record.Time.PIC))
	totals.Time.CoPilot = dtoa(atod(totals.Time.CoPilot) + atod(record.Time.CoPilot))
	totals.Time.Dual = dtoa(atod(totals.Time.Dual) + atod(record.Time.Dual))
	totals.Time.Instructor = dtoa(atod(totals.Time.Instructor) + atod(record.Time.Instructor))
	totals.Time.Total = dtoa(atod(totals.Time.Total) + atod(record.Time.Total))
	totals.SIM.Time = dtoa(atod(totals.SIM.Time) + atod(record.SIM.Time))
	totals.Landings.Day += record.Landings.Day
	totals.Landings.Night += record.Landings.Night

	totals.Distance += record.Distance
	totals.Time.CrossCountry = dtoa(atod(totals.Time.CrossCountry) + atod(record.Time.CrossCountry))

	return totals
}

// GetFlightRecordNextAndPrevUUID parse through all records with additional lag and lead functions
// to get previous and next records ids for pagination on the flight record page
func (m *DBModel) GetFlightRecordNextAndPrevUUID(uuid string) (prevUUID string, nextUUID string) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := "SELECT uuid, " +
		"lag(uuid, 1,0) over (order by m_date, departure_time) as prev_uuid, " +
		"lead(uuid,1,0) over (order by m_date, departure_time) as next_uuid " +
		"FROM logbook_view order by m_date, departure_time"

	rows, err := m.DB.QueryContext(ctx, query)

	if err != nil {
		return "0", "0"
	}
	defer rows.Close()

	record_uuid := ""

	for rows.Next() {
		err = rows.Scan(&record_uuid, &prevUUID, &nextUUID)

		if err != nil {
			return "0", "0"
		}

		if record_uuid == uuid {
			return prevUUID, nextUUID
		}
	}

	// rare case if uuid is not found
	return "0", "0"
}

// GetFlightRecordByID returns flight record by UUID
func (m *DBModel) GetFlightRecordByID(uuid string) (FlightRecord, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var fr FlightRecord

	query := "SELECT uuid, date, m_date, departure_place, departure_time, " +
		"arrival_place, arrival_time, aircraft_model, reg_name, " +
		"se_time, me_time, mcc_time, total_time, day_landings, night_landings, " +
		"night_time, ifr_time, pic_time, co_pilot_time, dual_time, instructor_time, " +
		"sim_type, sim_time, pic_name, remarks " +
		"FROM logbook_view WHERE uuid = ?"
	row := m.DB.QueryRowContext(ctx, query, uuid)

	err := row.Scan(&fr.UUID, &fr.Date, &fr.MDate, &fr.Departure.Place, &fr.Departure.Time,
		&fr.Arrival.Place, &fr.Arrival.Time, &fr.Aircraft.Model, &fr.Aircraft.Reg,
		&fr.Time.SE, &fr.Time.ME, &fr.Time.MCC, &fr.Time.Total, &fr.Landings.Day, &fr.Landings.Night,
		&fr.Time.Night, &fr.Time.IFR, &fr.Time.PIC, &fr.Time.CoPilot, &fr.Time.Dual, &fr.Time.Instructor,
		&fr.SIM.Type, &fr.SIM.Time, &fr.PIC, &fr.Remarks)

	if err != nil {
		return fr, err
	}

	// get previous and next records uuid
	fr.PrevUUID, fr.NextUUID = m.GetFlightRecordNextAndPrevUUID(uuid)

	return fr, nil
}

// IsFlightRecordExists checks if the flight record already exists
func (m *DBModel) IsFlightRecordExists(fr FlightRecord) bool {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	n := 0
	query := ""
	var row *sql.Row

	if fr.Departure.Place != "" && fr.Arrival.Place != "" {
		// normal flight
		query = "SELECT count(uuid) FROM logbook_view " +
			"WHERE date = ? AND departure_place = ? AND departure_time = ? AND " +
			"arrival_place = ? and arrival_time = ?"
		row = m.DB.QueryRowContext(ctx, query, fr.Date, fr.Departure.Place, fr.Departure.Time,
			fr.Arrival.Place, fr.Arrival.Time)

	} else {
		// simulator record
		query = "SELECT count(uuid) FROM logbook_view " +
			"WHERE date = ? AND sim_type = ? AND sim_time = ? AND remarks = ?"
		row = m.DB.QueryRowContext(ctx, query, fr.Date, fr.SIM.Type, fr.SIM.Time, fr.Remarks)
	}

	err := row.Scan(&n)

	if err != nil || n == 0 {
		return false
	}

	return true
}

// UpdateFlightRecord updates the flight records in the logbook table
func (m *DBModel) UpdateFlightRecord(fr FlightRecord) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := "UPDATE logbook SET " +
		"date = ?, departure_place = ?, departure_time = ?, " +
		"arrival_place = ?, arrival_time = ?, aircraft_model = ?, reg_name = ?, " +
		"se_time = ?, me_time = ?, mcc_time = ?, total_time = ?, day_landings = ?, night_landings = ?, " +
		"night_time = ?, ifr_time = ?, pic_time = ?, co_pilot_time = ?, dual_time = ?, instructor_time = ?, " +
		"sim_type = ?, sim_time = ?, pic_name = ?, remarks = ? " +
		"WHERE uuid = ?"
	_, err := m.DB.ExecContext(ctx, query,
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

	query := "INSERT INTO logbook " +
		"(uuid, date, departure_place, departure_time, " +
		"arrival_place, arrival_time, aircraft_model, reg_name, " +
		"se_time, me_time, mcc_time, total_time, day_landings, night_landings, " +
		"night_time, ifr_time, pic_time, co_pilot_time, dual_time, instructor_time, " +
		"sim_type, sim_time, pic_name, remarks) " +
		"VALUES (?, ?, ?, ?, " +
		"?, ?, ?, ?, " +
		"?, ?, ?, ?, ?, ?, " +
		"?, ?, ?, ?, ?, ?, " +
		"?, ?, ?, ?)"
	_, err := m.DB.ExecContext(ctx, query,
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

	_, err := m.DB.ExecContext(ctx, "DELETE FROM logbook WHERE uuid = ?", uuid)
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
		ORDER BY m_date desc, departure_time desc`)

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
