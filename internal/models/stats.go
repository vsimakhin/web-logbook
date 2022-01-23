package models

import (
	"context"
	"fmt"
	"time"
)

func (m *DBModel) GetTotals(days int) (FlightRecord, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var fr FlightRecord
	var totals FlightRecord
	var condition string

	sqlQuery := `
		SELECT
			se_time, me_time, mcc_time, total_time,
			day_landings, night_landings,
			night_time, ifr_time, pic_time, co_pilot_time,
			dual_time, instructor_time, sim_time
	   	FROM logbook_view
	`

	if days == AllTotals {
		// all totals
		condition = ""
	} else {
		if days == ThisYear {
			condition = fmt.Sprintf(`WHERE SUBSTR(m_date,0,5) = "%s";`, time.Now().UTC().Format("2006"))
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
			&fr.Time.Dual, &fr.Time.Instructor, &fr.SIM.Time)

		if err != nil {
			return fr, err
		}

		totals = CalculateTotals(totals, fr)

	}

	return totals, nil

}

func (m *DBModel) GetTotalsByYear() (map[string]FlightRecord, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var fr, emptyone FlightRecord
	totals := make(map[string]FlightRecord)

	rows, err := m.DB.QueryContext(ctx, `
		SELECT
			SUBSTR(m_date,0,5), se_time, me_time, mcc_time, total_time,
			day_landings, night_landings,
			night_time, ifr_time, pic_time, co_pilot_time,
			dual_time, instructor_time, sim_time
		FROM logbook_view
		ORDER BY m_date;`)

	if err != nil {
		return totals, err
	}
	defer rows.Close()

	for rows.Next() {
		err := rows.Scan(&fr.MDate, &fr.Time.SE, &fr.Time.ME, &fr.Time.MCC, &fr.Time.Total,
			&fr.Landings.Day, &fr.Landings.Night,
			&fr.Time.Night, &fr.Time.IFR, &fr.Time.PIC, &fr.Time.CoPilot,
			&fr.Time.Dual, &fr.Time.Instructor, &fr.SIM.Time)

		if err != nil {
			return totals, err
		}

		if _, ok := totals[fr.MDate]; !ok {
			totals[fr.MDate] = emptyone
		}

		totals[fr.MDate] = CalculateTotals(totals[fr.MDate], fr)

	}

	return totals, nil

}
