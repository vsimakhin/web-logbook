package driver

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"
)

const (
	oldDateFormat = "02/01/2006"
	dateFormat    = "2006-01-02"
)

type flightRecordUpdate struct {
	uuid         string
	date         string
	times        [11]int
	customFields string
}

type currencyUpdate struct {
	uuid string
	date string
}

func convertDate(value string) (string, error) {
	t, err := time.Parse(oldDateFormat, value)
	if err != nil {
		return "", err
	}

	return t.Format(dateFormat), nil
}

func parseTimeToMinutes(timeStr string) int {
	if timeStr == "" {
		return 0
	}

	if n, err := strconv.Atoi(timeStr); err == nil {
		return n
	}

	parts := strings.Split(timeStr, ":")
	if len(parts) != 2 {
		return 0
	}
	hours, err1 := strconv.Atoi(parts[0])
	minutes, err2 := strconv.Atoi(parts[1])
	if err1 != nil || err2 != nil {
		return 0
	}
	return hours*60 + minutes
}

func getDurationFields(ctx context.Context, tx *sql.Tx) (map[string]bool, error) {
	rows, err := tx.QueryContext(ctx, `SELECT uuid FROM custom_fields WHERE type = 'duration'`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	fields := make(map[string]bool)

	for rows.Next() {
		var uuid string

		if err := rows.Scan(&uuid); err != nil {
			return nil, err
		}

		fields[uuid] = true
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return fields, nil
}

func migrateCustomFields(raw string, durationFields map[string]bool) string {
	if raw == "" || raw == "{}" {
		return raw
	}

	var fields map[string]any
	if err := json.Unmarshal([]byte(raw), &fields); err != nil {
		return raw
	}

	updated := false

	for uuid := range durationFields {
		value, ok := fields[uuid]
		if !ok {
			continue
		}

		valueString, ok := value.(string)
		if !ok || valueString == "" {
			continue
		}

		fields[uuid] = parseTimeToMinutes(valueString)
		updated = true
	}

	if !updated {
		return raw
	}

	data, err := json.Marshal(fields)
	if err != nil {
		return raw
	}

	return string(data)
}

func readFlightRecordUpdates(ctx context.Context, tx *sql.Tx, durationFields map[string]bool) ([]flightRecordUpdate, error) {
	rows, err := tx.QueryContext(ctx, `
        SELECT uuid, date,
            se_time, me_time, mcc_time, total_time, night_time,
            ifr_time, pic_time, co_pilot_time, dual_time, instructor_time, sim_time,
            custom_fields
        FROM logbook
    `)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var updates []flightRecordUpdate

	for rows.Next() {
		var record flightRecordUpdate
		var rawTimes [11]sql.NullString
		var rawCF sql.NullString
		var date string

		if err := rows.Scan(
			&record.uuid, &date,
			&rawTimes[0], &rawTimes[1], &rawTimes[2], &rawTimes[3], &rawTimes[4],
			&rawTimes[5], &rawTimes[6], &rawTimes[7], &rawTimes[8], &rawTimes[9], &rawTimes[10],
			&rawCF,
		); err != nil {
			return nil, err
		}

		convertedDate, err := convertDate(date)
		if err != nil {
			return nil, fmt.Errorf("invalid flight date %q for %s: %w", date, record.uuid, err)
		}

		record.date = convertedDate
		record.customFields = rawCF.String

		for i := range rawTimes {
			if rawTimes[i].Valid {
				record.times[i] = parseTimeToMinutes(rawTimes[i].String)
			}
		}

		if len(durationFields) > 0 && rawCF.Valid {
			record.customFields = migrateCustomFields(rawCF.String, durationFields)
		}

		updates = append(updates, record)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return updates, nil
}

func migrateFlightRecords(ctx context.Context, tx *sql.Tx, durationFields map[string]bool) error {
	fmt.Println("Updating flight records...")

	updates, err := readFlightRecordUpdates(ctx, tx, durationFields)
	if err != nil {
		return err
	}

	stmt, err := tx.PrepareContext(ctx, `
        UPDATE logbook SET
            date = ?,
            se_time = ?,
            me_time = ?,
            mcc_time = ?,
            total_time = ?,
            night_time = ?,
            ifr_time = ?,
            pic_time = ?,
            co_pilot_time = ?,
            dual_time = ?,
            instructor_time = ?,
            sim_time = ?,
            custom_fields = ?
        WHERE uuid = ?
    `)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, record := range updates {
		_, err := stmt.ExecContext(ctx,
			record.date,
			record.times[0],
			record.times[1],
			record.times[2],
			record.times[3],
			record.times[4],
			record.times[5],
			record.times[6],
			record.times[7],
			record.times[8],
			record.times[9],
			record.times[10],
			record.customFields,
			record.uuid,
		)
		if err != nil {
			return fmt.Errorf("updating flight record %s: %w", record.uuid, err)
		}
	}

	return nil
}

func migratePreviousExperience(ctx context.Context, tx *sql.Tx) error {
	fmt.Println("Updating previous experience...")

	var rawSettings string

	err := tx.QueryRowContext(ctx, "SELECT settings FROM settings2 WHERE id = 0").Scan(&rawSettings)
	if err == sql.ErrNoRows || rawSettings == "" {
		return nil
	}

	if err != nil {
		return err
	}

	var settings map[string]any

	if err := json.Unmarshal([]byte(rawSettings), &settings); err != nil {
		return fmt.Errorf("invalid settings JSON: %w", err)
	}

	previousExperience, ok := settings["previous_experience"].(map[string]any)
	if !ok {
		return nil
	}

	timeFields := []string{
		"total_time",
		"se_time",
		"me_time",
		"mcc_time",
		"night_time",
		"ifr_time",
		"pic_time",
		"co_pilot_time",
		"dual_time",
		"instructor_time",
		"me_total_time",
		"cc_time",
		"sim_time",
	}

	for _, field := range timeFields {
		value, exists := previousExperience[field]

		if !exists {
			previousExperience[field] = 0
			continue
		}

		if stringValue, ok := value.(string); ok {
			previousExperience[field] = parseTimeToMinutes(stringValue)
		}
	}

	settings["previous_experience"] = previousExperience

	updatedJSON, err := json.Marshal(settings)
	if err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx, "UPDATE settings2 SET settings = ? WHERE id = 0", string(updatedJSON))

	return err
}

func migrateCurrencyDates(ctx context.Context, tx *sql.Tx) error {
	fmt.Println("Updating currency dates...")

	rows, err := tx.QueryContext(ctx, `SELECT uuid, time_frame_since FROM currency WHERE time_frame_unit = 'since'`)
	if err != nil {
		return err
	}
	defer rows.Close()

	var updates []currencyUpdate

	for rows.Next() {
		var update currencyUpdate

		if err := rows.Scan(&update.uuid, &update.date); err != nil {
			return err
		}

		date, err := convertDate(update.date)
		if err != nil {
			return fmt.Errorf("invalid currency date %q for %s: %w", update.date, update.uuid, err)
		}

		update.date = date
		updates = append(updates, update)
	}

	if err := rows.Err(); err != nil {
		return err
	}

	for _, update := range updates {
		_, err := tx.ExecContext(ctx, `UPDATE currency SET time_frame_since = ? WHERE uuid = ?`, update.date, update.uuid)

		if err != nil {
			return fmt.Errorf("updating currency %s: %w", update.uuid, err)
		}
	}

	return nil
}

func migrateLogbookTimeColumns(ctx context.Context, tx *sql.Tx) error {
	fmt.Println("Updating MySQL time column types...")

	_, err := tx.ExecContext(ctx, `
        ALTER TABLE logbook
        MODIFY se_time INT NOT NULL DEFAULT 0,
        MODIFY me_time INT NOT NULL DEFAULT 0,
        MODIFY mcc_time INT NOT NULL DEFAULT 0,
        MODIFY total_time INT NOT NULL DEFAULT 0,
        MODIFY night_time INT NOT NULL DEFAULT 0,
        MODIFY ifr_time INT NOT NULL DEFAULT 0,
        MODIFY pic_time INT NOT NULL DEFAULT 0,
        MODIFY co_pilot_time INT NOT NULL DEFAULT 0,
        MODIFY dual_time INT NOT NULL DEFAULT 0,
        MODIFY instructor_time INT NOT NULL DEFAULT 0,
        MODIFY sim_time INT NOT NULL DEFAULT 0
    `)

	return err
}

func dataOverhaulMigration(db *sql.DB, engine string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 300*time.Second)
	defer cancel()

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	fmt.Println("Starting data overhaul...")

	durationFields, err := getDurationFields(ctx, tx)
	if err != nil {
		return err
	}

	if err := migrateFlightRecords(ctx, tx, durationFields); err != nil {
		return err
	}

	if err := migratePreviousExperience(ctx, tx); err != nil {
		return err
	}

	if err := migrateCurrencyDates(ctx, tx); err != nil {
		return err
	}

	if engine == MySQL {
		if err := migrateLogbookTimeColumns(ctx, tx); err != nil {
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	fmt.Println("Data overhaul completed.")

	return nil
}
