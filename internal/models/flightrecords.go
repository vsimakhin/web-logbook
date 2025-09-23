package models

import (
	"database/sql"
	"fmt"
	"strings"
	"time"
)

// atod converts formatted string to time.Duration
func atod(value string) time.Duration {
	if value == "" {
		value = "0:0"
	}

	strTime := fmt.Sprintf("%sm", strings.ReplaceAll(value, ":", "h"))

	duration, err := time.ParseDuration(strTime)
	if err != nil {
		fmt.Printf("Error parsing time %s\n", strTime)
		return 0
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
	}
	return fmt.Sprintf("%01d:%02d", h, m)
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

func (m *DBModel) GetFlightRecordNextAndPrevUUID(uuid string) (prevUUID string, nextUUID string) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `
		WITH numbered AS (
			SELECT
				uuid,
				ROW_NUMBER() OVER (ORDER BY m_date, departure_time) AS rn
			FROM logbook_view
		),
		current AS (
			SELECT rn FROM numbered WHERE uuid = ?
		)
		SELECT
			(SELECT uuid FROM numbered WHERE rn = current.rn - 1) AS prev_uuid,
			(SELECT uuid FROM numbered WHERE rn = current.rn + 1) AS next_uuid
		FROM current
		`
	var prev, next sql.NullString
	row := m.DB.QueryRowContext(ctx, query, uuid)

	err := row.Scan(&prev, &next)
	if err != nil {
		return prevUUID, nextUUID
	}

	if prev.Valid {
		prevUUID = prev.String
	}
	if next.Valid {
		nextUUID = next.String
	}
	return prevUUID, nextUUID
}

// GetFlightRecordByID returns flight record by UUID
func (m *DBModel) GetFlightRecordByID(uuid string) (fr FlightRecord, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `
		SELECT 
			uuid, date, m_date, departure_place, departure_time,
			arrival_place, arrival_time, aircraft_model, reg_name,
			se_time, me_time, mcc_time, total_time, day_landings, night_landings,
			night_time, ifr_time, pic_time, co_pilot_time, dual_time, instructor_time,
			sim_type, sim_time, pic_name, remarks, distance, track, custom_fields
		FROM logbook_view 
		WHERE uuid = ?`
	row := m.DB.QueryRowContext(ctx, query, uuid)

	err = row.Scan(
		&fr.UUID, &fr.Date, &fr.MDate, &fr.Departure.Place, &fr.Departure.Time,
		&fr.Arrival.Place, &fr.Arrival.Time, &fr.Aircraft.Model, &fr.Aircraft.Reg,
		&fr.Time.SE, &fr.Time.ME, &fr.Time.MCC, &fr.Time.Total, &fr.Landings.Day, &fr.Landings.Night,
		&fr.Time.Night, &fr.Time.IFR, &fr.Time.PIC, &fr.Time.CoPilot, &fr.Time.Dual, &fr.Time.Instructor,
		&fr.SIM.Type, &fr.SIM.Time, &fr.PIC, &fr.Remarks, &fr.Distance, &fr.Track, &fr.CustomFields,
	)
	if err != nil {
		return fr, err
	}
	// process flight record
	m.processFlightrecord(&fr)

	// get previous and next records uuid
	fr.PrevUUID, fr.NextUUID = m.GetFlightRecordNextAndPrevUUID(uuid)

	return fr, nil
}

// IsFlightRecordExists checks if the flight record already exists
func (m *DBModel) IsFlightRecordExists(fr FlightRecord) bool {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	n := 0
	query := ""
	var row *sql.Row

	if fr.Departure.Place != "" && fr.Arrival.Place != "" {
		// normal flight
		query = `SELECT count(uuid)
				FROM logbook_view
				WHERE date = ?
					AND departure_place = ?
					AND departure_time = ?
					AND arrival_place = ?
					AND arrival_time = ?
					AND aircraft_model = ?
					AND reg_name = ?`
		row = m.DB.QueryRowContext(ctx, query, fr.Date, fr.Departure.Place, fr.Departure.Time,
			fr.Arrival.Place, fr.Arrival.Time, fr.Aircraft.Model, fr.Aircraft.Reg)
	} else if fr.SIM.Type != "" && fr.SIM.Time != "" {
		// simulator record
		query = `SELECT count(uuid)
				FROM logbook_view
				WHERE date = ?
					AND sim_type = ?
					AND sim_time = ?
					AND remarks = ?`
		row = m.DB.QueryRowContext(ctx, query, fr.Date, fr.SIM.Type, fr.SIM.Time, fr.Remarks)
	} else {
		return false
	}

	err := row.Scan(&n)

	if err != nil || n == 0 {
		return false
	}

	return true
}

// UpdateFlightRecord updates the flight records in the logbook table
func (m *DBModel) UpdateFlightRecord(fr FlightRecord) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `
		UPDATE logbook SET 
			date = ?, departure_place = ?, departure_time = ?,
			arrival_place = ?, arrival_time = ?, aircraft_model = ?, reg_name = ?,
			se_time = ?, me_time = ?, mcc_time = ?, total_time = ?, day_landings = ?, night_landings = ?,
			night_time = ?, ifr_time = ?, pic_time = ?, co_pilot_time = ?, dual_time = ?, instructor_time = ?,
			sim_type = ?, sim_time = ?, pic_name = ?, remarks = ?, distance = ?, custom_fields = ?
		WHERE uuid = ?`
	_, err := m.DB.ExecContext(ctx, query,
		fr.Date, fr.Departure.Place, fr.Departure.Time,
		fr.Arrival.Place, fr.Arrival.Time, fr.Aircraft.Model, fr.Aircraft.Reg,
		fr.Time.SE, fr.Time.ME, fr.Time.MCC, fr.Time.Total, fr.Landings.Day, fr.Landings.Night,
		fr.Time.Night, fr.Time.IFR, fr.Time.PIC, fr.Time.CoPilot, fr.Time.Dual, fr.Time.Instructor,
		fr.SIM.Type, fr.SIM.Time, fr.PIC, fr.Remarks, fr.Distance, fr.CustomFields,
		fr.UUID,
	)
	return err
}

// InsertFlightRecord add a new flight record to the logbook table
func (m *DBModel) InsertFlightRecord(fr FlightRecord) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	fr.Distance = m.Distance(fr.Departure.Place, fr.Arrival.Place)

	query := `
		INSERT INTO logbook 
			(uuid, date, departure_place, departure_time,
			arrival_place, arrival_time, aircraft_model, reg_name,
			se_time, me_time, mcc_time, total_time, day_landings, night_landings,
			night_time, ifr_time, pic_time, co_pilot_time, dual_time, instructor_time,
			sim_type, sim_time, pic_name, remarks, distance, custom_fields)
		VALUES (?, ?, ?, ?,
		?, ?, ?, ?,
		?, ?, ?, ?, ?, ?,
		?, ?, ?, ?, ?, ?,
		?, ?, ?, ?, ?, ?)`
	_, err := m.DB.ExecContext(ctx, query,
		fr.UUID, fr.Date, fr.Departure.Place, fr.Departure.Time,
		fr.Arrival.Place, fr.Arrival.Time, fr.Aircraft.Model, fr.Aircraft.Reg,
		fr.Time.SE, fr.Time.ME, fr.Time.MCC, fr.Time.Total, fr.Landings.Day, fr.Landings.Night,
		fr.Time.Night, fr.Time.IFR, fr.Time.PIC, fr.Time.CoPilot, fr.Time.Dual, fr.Time.Instructor,
		fr.SIM.Type, fr.SIM.Time, fr.PIC, fr.Remarks, fr.Distance, fr.CustomFields,
	)
	return err
}

// DeleteFlightRecord deletes a flight record by UUID
func (m *DBModel) DeleteFlightRecord(uuid string) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	_, err := m.DB.ExecContext(ctx, "DELETE FROM logbook WHERE uuid = ?", uuid)
	return err
}

// GetFlightRecords returns the flight records in the logbook table
func (m *DBModel) GetFlightRecords() (flightRecords []FlightRecord, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	rows, err := m.DB.QueryContext(ctx, `
		SELECT
			uuid, date, m_date, departure_place, departure_time,
			arrival_place, arrival_time, aircraft_model, reg_name,
			se_time, me_time, mcc_time, total_time, day_landings, night_landings,
			night_time, ifr_time, pic_time, co_pilot_time, dual_time, instructor_time,
			sim_type, sim_time, pic_name, remarks, distance, custom_fields,
			has_track, attachments_count
		FROM logbook_view
		ORDER BY m_date desc, departure_time desc`)

	if err != nil {
		return flightRecords, err
	}
	defer rows.Close()

	for rows.Next() {
		var fr FlightRecord
		err = rows.Scan(&fr.UUID, &fr.Date, &fr.MDate, &fr.Departure.Place, &fr.Departure.Time,
			&fr.Arrival.Place, &fr.Arrival.Time, &fr.Aircraft.Model, &fr.Aircraft.Reg,
			&fr.Time.SE, &fr.Time.ME, &fr.Time.MCC, &fr.Time.Total, &fr.Landings.Day, &fr.Landings.Night,
			&fr.Time.Night, &fr.Time.IFR, &fr.Time.PIC, &fr.Time.CoPilot, &fr.Time.Dual, &fr.Time.Instructor,
			&fr.SIM.Type, &fr.SIM.Time, &fr.PIC, &fr.Remarks, &fr.Distance, &fr.CustomFields,
			&fr.HasTrack, &fr.AttachmentsCount,
		)
		if err != nil {
			return flightRecords, err
		}
		m.processFlightrecord(&fr)
		flightRecords = append(flightRecords, fr)
	}

	return flightRecords, nil
}

func (m *DBModel) UpdateFlightRecordTrack(uuid string, distance float64, track []byte) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "UPDATE logbook SET distance = ?, track = ? WHERE uuid = ?"
	_, err := m.DB.ExecContext(ctx, query, distance, track, uuid)
	if err != nil {
		return err
	}

	return nil
}

func (m *DBModel) GetFlightRecordsForMap() (flightRecords []FlightRecord, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	rows, err := m.DB.QueryContext(ctx, `
		SELECT
			uuid, date, m_date, departure_place, departure_time,
			arrival_place, arrival_time, aircraft_model, reg_name,
			se_time, me_time, mcc_time, total_time, day_landings, night_landings,
			night_time, ifr_time, pic_time, co_pilot_time, dual_time, instructor_time,
			sim_type, sim_time, pic_name, remarks, distance, track, custom_fields
		FROM logbook_view
		ORDER BY m_date desc, departure_time desc`)

	if err != nil {
		return flightRecords, err
	}
	defer rows.Close()

	for rows.Next() {
		var fr FlightRecord
		err = rows.Scan(&fr.UUID, &fr.Date, &fr.MDate, &fr.Departure.Place, &fr.Departure.Time,
			&fr.Arrival.Place, &fr.Arrival.Time, &fr.Aircraft.Model, &fr.Aircraft.Reg,
			&fr.Time.SE, &fr.Time.ME, &fr.Time.MCC, &fr.Time.Total, &fr.Landings.Day, &fr.Landings.Night,
			&fr.Time.Night, &fr.Time.IFR, &fr.Time.PIC, &fr.Time.CoPilot, &fr.Time.Dual, &fr.Time.Instructor,
			&fr.SIM.Type, &fr.SIM.Time, &fr.PIC, &fr.Remarks, &fr.Distance, &fr.Track, &fr.CustomFields,
		)
		if err != nil {
			return flightRecords, err
		}
		m.processFlightrecord(&fr)
		flightRecords = append(flightRecords, fr)
	}

	return flightRecords, nil
}
