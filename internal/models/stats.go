package models

import (
	"context"
	"fmt"
	"time"
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
		dep := ""
		arr := ""

		err := rows.Scan(&dep, &arr)

		if err != nil {
			return
		}

		m.distance(dep, arr)
	}
}

// GetTotals calculates totals
func (m *DBModel) GetTotals(days int) (FlightRecord, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var fr FlightRecord
	var totals FlightRecord
	var condition string

	sqlQuery := "SELECT se_time, me_time, mcc_time, total_time, " +
		"day_landings, night_landings, " +
		"night_time, ifr_time, pic_time, co_pilot_time, " +
		"dual_time, instructor_time, sim_time, departure_place, arrival_place " +
		"FROM logbook_view"

	if days == AllTotals {
		// all totals
		condition = ""
	} else {
		if days == ThisYear {
			condition = fmt.Sprintf(`WHERE SUBSTR(m_date,0,5) = "%s";`, time.Now().UTC().Format("2006"))
		} else if days == ThisMonth {
			condition = fmt.Sprintf(`WHERE SUBSTR(m_date,0,7) = "%s";`, time.Now().UTC().Format("200601"))
		} else {
			condition = fmt.Sprintf(`WHERE m_date>="%s"`, time.Now().AddDate(0, 0, -1*days).UTC().Format("20060102"))
		}
	}

	rows, err := m.DB.QueryContext(ctx, fmt.Sprintf("%s %s", sqlQuery, condition))

	if err != nil {
		return totals, err
	}
	defer rows.Close()

	for rows.Next() {
		err := rows.Scan(&fr.Time.SE, &fr.Time.ME, &fr.Time.MCC, &fr.Time.Total,
			&fr.Landings.Day, &fr.Landings.Night,
			&fr.Time.Night, &fr.Time.IFR, &fr.Time.PIC, &fr.Time.CoPilot,
			&fr.Time.Dual, &fr.Time.Instructor, &fr.SIM.Time, &fr.Departure.Place, &fr.Arrival.Place)

		if err != nil {
			return fr, err
		}

		fr.Distance = m.distance(fr.Departure.Place, fr.Arrival.Place)

		totals = CalculateTotals(totals, fr)

	}

	return totals, nil

}

// GetTotalsByYear calculates totals by year
func (m *DBModel) GetTotalsByYear() (map[string]FlightRecord, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var fr, emptyone FlightRecord
	totals := make(map[string]FlightRecord)

	query := "SELECT SUBSTR(m_date,0,5), se_time, me_time, mcc_time, total_time, " +
		"day_landings, night_landings, night_time, ifr_time, pic_time, co_pilot_time, " +
		"dual_time, instructor_time, sim_time, departure_place, arrival_place " +
		"FROM logbook_view ORDER BY m_date"
	rows, err := m.DB.QueryContext(ctx, query)

	if err != nil {
		return totals, err
	}
	defer rows.Close()

	for rows.Next() {
		err := rows.Scan(&fr.MDate, &fr.Time.SE, &fr.Time.ME, &fr.Time.MCC, &fr.Time.Total,
			&fr.Landings.Day, &fr.Landings.Night,
			&fr.Time.Night, &fr.Time.IFR, &fr.Time.PIC, &fr.Time.CoPilot,
			&fr.Time.Dual, &fr.Time.Instructor, &fr.SIM.Time, &fr.Departure.Place, &fr.Arrival.Place)

		if err != nil {
			return totals, err
		}

		if _, ok := totals[fr.MDate]; !ok {
			totals[fr.MDate] = emptyone
		}

		fr.Distance = m.distance(fr.Departure.Place, fr.Arrival.Place)

		totals[fr.MDate] = CalculateTotals(totals[fr.MDate], fr)
	}

	return totals, nil
}

// GetTotalsByAircraftType calculates totals by aircraft type
func (m *DBModel) GetTotalsByAircraftType() (map[string]FlightRecord, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var fr, emptyone FlightRecord
	totals := make(map[string]FlightRecord)

	query := "SELECT aircraft_model, se_time, me_time, mcc_time, total_time, " +
		"day_landings, night_landings, night_time, ifr_time, pic_time, co_pilot_time, " +
		"dual_time, instructor_time, sim_time, departure_place, arrival_place " +
		"FROM logbook_view ORDER BY m_date"
	rows, err := m.DB.QueryContext(ctx, query)

	if err != nil {
		return totals, err
	}
	defer rows.Close()

	for rows.Next() {
		err := rows.Scan(&fr.Aircraft.Model, &fr.Time.SE, &fr.Time.ME, &fr.Time.MCC, &fr.Time.Total,
			&fr.Landings.Day, &fr.Landings.Night,
			&fr.Time.Night, &fr.Time.IFR, &fr.Time.PIC, &fr.Time.CoPilot,
			&fr.Time.Dual, &fr.Time.Instructor, &fr.SIM.Time, &fr.Departure.Place, &fr.Arrival.Place)

		if err != nil {
			return totals, err
		}

		if fr.Aircraft.Model == "" {
			// looks like it's a simulator record
			fr.Aircraft.Model = "SIM"
		}

		if _, ok := totals[fr.Aircraft.Model]; !ok {
			totals[fr.Aircraft.Model] = emptyone
		}

		fr.Distance = m.distance(fr.Departure.Place, fr.Arrival.Place)

		totals[fr.Aircraft.Model] = CalculateTotals(totals[fr.Aircraft.Model], fr)
	}

	return totals, nil
}

// GetTotalsByAircraftClass calculates totals by aircraft class
func (m *DBModel) GetTotalsByAircraftClass() (map[string]FlightRecord, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var fr, emptyone FlightRecord
	totals := make(map[string]FlightRecord)

	settings, err := m.GetSettings()
	if err != nil {
		return totals, err
	}

	query := "SELECT aircraft_model, se_time, me_time, mcc_time, total_time, " +
		"day_landings, night_landings, night_time, ifr_time, pic_time, co_pilot_time, " +
		"dual_time, instructor_time, sim_time, departure_place, arrival_place " +
		"FROM logbook_view ORDER BY m_date"
	rows, err := m.DB.QueryContext(ctx, query)

	if err != nil {
		return totals, err
	}
	defer rows.Close()

	for rows.Next() {
		err := rows.Scan(&fr.Aircraft.Model, &fr.Time.SE, &fr.Time.ME, &fr.Time.MCC, &fr.Time.Total,
			&fr.Landings.Day, &fr.Landings.Night,
			&fr.Time.Night, &fr.Time.IFR, &fr.Time.PIC, &fr.Time.CoPilot,
			&fr.Time.Dual, &fr.Time.Instructor, &fr.SIM.Time, &fr.Departure.Place, &fr.Arrival.Place)

		if err != nil {
			return totals, err
		}

		if fr.Aircraft.Model == "" {
			// looks like it's a simulator record
			fr.Aircraft.Model = "SIM"
		}

		classes := getClassesForModel(settings.AircraftClasses, fr.Aircraft.Model)
		fr.Distance = m.distance(fr.Departure.Place, fr.Arrival.Place)

		for _, class := range classes {
			if _, ok := totals[class]; !ok {
				totals[class] = emptyone
			}

			totals[class] = CalculateTotals(totals[class], fr)
		}

	}

	return totals, nil
}
