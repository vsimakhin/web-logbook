package models

import (
	"context"
	"time"

	"golang.org/x/exp/slices"
)

// distance calculates distance between 2 airports
func (m *DBModel) distance(departure, arrival string) int {
	if departure == arrival {
		return 0
	}

	distID := ""
	if departure > arrival {
		distID = departure + arrival
	} else {
		distID = arrival + departure
	}

	if value, ok := dcache[distID]; ok {
		return value
	} else {
		dep, err := m.GetAirportByID(departure)
		if err != nil {
			dcache[distID] = 0
			return 0
		}

		arr, err := m.GetAirportByID(arrival)
		if err != nil {
			dcache[distID] = 0
			return 0
		}

		d := int(dist(dep.Lat, dep.Lon, arr.Lat, arr.Lon))
		dcache[distID] = d
		return d
	}
}

func (m *DBModel) processFlightrecord(fr *FlightRecord) {
	// calculate distance
	fr.Distance = m.distance(fr.Departure.Place, fr.Arrival.Place)

	// check for cross country flights
	if fr.Departure.Place != fr.Arrival.Place {
		fr.Time.CrossCountry = fr.Time.Total
	} else {
		fr.Time.CrossCountry = "0:00"
	}
}

// CreateDistanceCache fills cache map with calculated distances
func (m *DBModel) CreateDistanceCache() {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	query := "SELECT departure_place, arrival_place FROM logbook_view GROUP BY departure_place, arrival_place"
	rows, err := m.DB.QueryContext(ctx, query)

	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var dep, arr string
		if err := rows.Scan(&dep, &arr); err != nil {
			return
		}

		m.distance(dep, arr)
	}
}

// GetTotals calculates totals
// startDate and endDate are in the format 20060102
func (m *DBModel) GetTotals(startDate string, endDate string) (FlightRecord, error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	totals := initZeroFlightRecord()

	sqlQuery := "SELECT m_date, se_time, me_time, mcc_time, total_time, " +
		"day_landings, night_landings, " +
		"night_time, ifr_time, pic_time, co_pilot_time, " +
		"dual_time, instructor_time, sim_time, departure_place, arrival_place " +
		"FROM logbook_view"

	rows, err := m.DB.QueryContext(ctx, sqlQuery)
	if err != nil {
		return totals, err
	}
	defer rows.Close()

	for rows.Next() {
		var fr FlightRecord
		if err := rows.Scan(&fr.MDate, &fr.Time.SE, &fr.Time.ME, &fr.Time.MCC, &fr.Time.Total,
			&fr.Landings.Day, &fr.Landings.Night,
			&fr.Time.Night, &fr.Time.IFR, &fr.Time.PIC, &fr.Time.CoPilot,
			&fr.Time.Dual, &fr.Time.Instructor, &fr.SIM.Time, &fr.Departure.Place, &fr.Arrival.Place); err != nil {
			return totals, err
		}

		if (startDate <= fr.MDate) && (fr.MDate <= endDate) {
			m.processFlightrecord(&fr)
			totals = CalculateTotals(totals, fr)
		}
	}

	return totals, nil

}

// GenerateFlightRecordMap generates a map of flight records based on the given start and end time.
// The flight records are grouped either by month or by day, depending on the value of the groupByMonth parameter.
// The generated map contains flight records with their corresponding time format as the key.
// The flight records are initialized with zero values.
func (m *DBModel) GenerateFlightRecordMap(start time.Time, end time.Time, groupByMonth bool) map[string]FlightRecord {
	totals := make(map[string]FlightRecord)
	var increment func(time.Time) time.Time
	var timeFormat string

	if groupByMonth {
		timeFormat = "01/2006"
		increment = func(d time.Time) time.Time { return d.AddDate(0, 1, 0) }
	} else {
		timeFormat = "02/01/2006"
		increment = func(d time.Time) time.Time { return d.AddDate(0, 0, 1) }
	}

	for d := start; d.Before(end) || d.Equal(end); d = increment(d) {
		totals[d.Format(timeFormat)] = initZeroFlightRecord()
	}

	return totals
}

// GetDetailedTotals retrieves detailed flight records from the database and calculates totals based on the specified date range.
// It takes a start date, end date, a flag indicating whether to group by month, and a map to store the calculated totals.
// The function returns the updated totals map and an error, if any.
func (m *DBModel) GetDetailedTotals(startDate string, endDate string, groupByMonth bool, totals map[string]FlightRecord) (map[string]FlightRecord, error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	sqlQuery := "SELECT date, m_date, se_time, me_time, mcc_time, total_time, " +
		"day_landings, night_landings, " +
		"night_time, ifr_time, pic_time, co_pilot_time, " +
		"dual_time, instructor_time, sim_time, departure_place, arrival_place " +
		"FROM logbook_view"

	rows, err := m.DB.QueryContext(ctx, sqlQuery)
	if err != nil {
		return totals, err
	}
	defer rows.Close()

	for rows.Next() {
		var fr FlightRecord
		if err := rows.Scan(&fr.Date, &fr.MDate, &fr.Time.SE, &fr.Time.ME, &fr.Time.MCC, &fr.Time.Total,
			&fr.Landings.Day, &fr.Landings.Night,
			&fr.Time.Night, &fr.Time.IFR, &fr.Time.PIC, &fr.Time.CoPilot,
			&fr.Time.Dual, &fr.Time.Instructor, &fr.SIM.Time, &fr.Departure.Place, &fr.Arrival.Place); err != nil {
			return totals, err
		}

		if (startDate <= fr.MDate) && (fr.MDate <= endDate) {
			m.processFlightrecord(&fr)
			key := fr.Date
			if groupByMonth {
				key = fr.Date[3:]
			}
			totals[key] = CalculateTotals(totals[key], fr)
		}
	}

	return totals, nil
}

// GetYears returns a slice of strings representing the distinct years present in the logbook_view table.
// If there are no records, the current year is returned.
func (m *DBModel) GetYears() (years []string, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "SELECT DISTINCT m_date FROM logbook_view ORDER BY m_date DESC"
	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return years, err
	}
	defer rows.Close()

	for rows.Next() {
		var date string
		if err := rows.Scan(&date); err != nil {
			return years, err
		}

		year := date[:4]
		if !slices.Contains(years, year) {
			years = append(years, year)
		}
	}

	// if there are no records, return current year
	if len(years) == 0 {
		years = append(years, time.Now().UTC().Format("2006"))
	}

	return years, nil
}

// GetTotalsByYear calculates totals by year
func (m *DBModel) GetTotalsByYear() (map[string]FlightRecord, error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	totals := make(map[string]FlightRecord)

	query := "SELECT m_date, se_time, me_time, mcc_time, total_time, " +
		"day_landings, night_landings, night_time, ifr_time, pic_time, co_pilot_time, " +
		"dual_time, instructor_time, sim_time, departure_place, arrival_place " +
		"FROM logbook_view ORDER BY m_date"
	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return totals, err
	}
	defer rows.Close()

	for rows.Next() {
		var fr FlightRecord
		err := rows.Scan(&fr.MDate, &fr.Time.SE, &fr.Time.ME, &fr.Time.MCC, &fr.Time.Total,
			&fr.Landings.Day, &fr.Landings.Night,
			&fr.Time.Night, &fr.Time.IFR, &fr.Time.PIC, &fr.Time.CoPilot,
			&fr.Time.Dual, &fr.Time.Instructor, &fr.SIM.Time, &fr.Departure.Place, &fr.Arrival.Place)

		fr.MDate = fr.MDate[:4] //take just a year part

		if err != nil {
			return totals, err
		}

		if _, ok := totals[fr.MDate]; !ok {
			totals[fr.MDate] = initZeroFlightRecord()
		}

		m.processFlightrecord(&fr)
		totals[fr.MDate] = CalculateTotals(totals[fr.MDate], fr)
	}

	return totals, nil
}

// GetTotalsByAircraftType calculates totals by aircraft type
// startDate and endDate are in the format 20060102
func (m *DBModel) GetTotalsByAircraftType(startDate string, endDate string) (map[string]FlightRecord, error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	totals := make(map[string]FlightRecord)
	query := "SELECT m_date, aircraft_model, se_time, me_time, mcc_time, total_time, " +
		"day_landings, night_landings, night_time, ifr_time, pic_time, co_pilot_time, " +
		"dual_time, instructor_time, sim_time, departure_place, arrival_place " +
		"FROM logbook_view"
	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return totals, err
	}
	defer rows.Close()

	for rows.Next() {
		var fr FlightRecord
		err := rows.Scan(&fr.MDate, &fr.Aircraft.Model, &fr.Time.SE, &fr.Time.ME, &fr.Time.MCC, &fr.Time.Total,
			&fr.Landings.Day, &fr.Landings.Night,
			&fr.Time.Night, &fr.Time.IFR, &fr.Time.PIC, &fr.Time.CoPilot,
			&fr.Time.Dual, &fr.Time.Instructor, &fr.SIM.Time, &fr.Departure.Place, &fr.Arrival.Place)
		if err != nil {
			return totals, err
		}

		if (startDate <= fr.MDate) && (fr.MDate <= endDate) {
			if fr.Aircraft.Model == "" {
				// looks like it's a simulator record
				fr.Aircraft.Model = "SIM"
			}

			if _, ok := totals[fr.Aircraft.Model]; !ok {
				totals[fr.Aircraft.Model] = initZeroFlightRecord()
			}

			m.processFlightrecord(&fr)
			totals[fr.Aircraft.Model] = CalculateTotals(totals[fr.Aircraft.Model], fr)
		}
	}

	return totals, nil
}

// GetTotalsByAircraftClass calculates totals by aircraft class
// startDate and endDate are in the format 20060102
func (m *DBModel) GetTotalsByAircraftClass(startDate string, endDate string) (map[string]FlightRecord, error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	totals := make(map[string]FlightRecord)

	settings, err := m.GetSettings()
	if err != nil {
		return totals, err
	}

	query := "SELECT m_date, aircraft_model, se_time, me_time, mcc_time, total_time, " +
		"day_landings, night_landings, night_time, ifr_time, pic_time, co_pilot_time, " +
		"dual_time, instructor_time, sim_time, departure_place, arrival_place " +
		"FROM logbook_view"
	rows, err := m.DB.QueryContext(ctx, query)

	if err != nil {
		return totals, err
	}
	defer rows.Close()

	for rows.Next() {
		var fr FlightRecord
		err := rows.Scan(&fr.MDate, &fr.Aircraft.Model, &fr.Time.SE, &fr.Time.ME, &fr.Time.MCC, &fr.Time.Total,
			&fr.Landings.Day, &fr.Landings.Night,
			&fr.Time.Night, &fr.Time.IFR, &fr.Time.PIC, &fr.Time.CoPilot,
			&fr.Time.Dual, &fr.Time.Instructor, &fr.SIM.Time, &fr.Departure.Place, &fr.Arrival.Place)

		if err != nil {
			return totals, err
		}

		if (startDate <= fr.MDate) && (fr.MDate <= endDate) {
			if fr.Aircraft.Model == "" {
				// looks like it's a simulator record
				fr.Aircraft.Model = "SIM"
			}

			classes := getClassesForModel(settings.AircraftClasses, fr.Aircraft.Model)
			m.processFlightrecord(&fr)

			for _, class := range classes {
				if _, ok := totals[class]; !ok {
					totals[class] = initZeroFlightRecord()
				}

				totals[class] = CalculateTotals(totals[class], fr)
			}
		}

	}

	return totals, nil
}
