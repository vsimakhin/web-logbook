package driver

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	_ "embed"

	_ "github.com/go-sql-driver/mysql"
	"github.com/vsimakhin/web-logbook/internal/models"
	_ "modernc.org/sqlite"
)

const (
	DefaultOwnerName     = "Owner Name"
	DefaultSignatureText = "I certify that the entries in this log are true."
)

func OpenDB(engine string, dsn string) (*sql.DB, error) {
	db, err := sql.Open(engine, dsn)
	if err != nil {
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		return nil, err
	}

	err = validateDB(db, engine)
	if err != nil {
		return nil, err
	}

	return db, nil
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

func dataOverhaulMigration(db *sql.DB, engine string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 300*time.Second)
	defer cancel()

	type recordUpdate struct {
		uuid         string
		times        [11]int // converted minutes
		customFields string
	}
	var updates []recordUpdate

	// 1. db transaction
	fmt.Println("Preparing data migration...")
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 2. Fetch custom fields of type "duration"
	fmt.Println("Fetching custom fields...")
	durationFields := make(map[string]bool)
	cfRows, err := tx.QueryContext(ctx, "SELECT uuid FROM custom_fields WHERE type = 'duration'")
	if err != nil {
		return err
	}
	defer cfRows.Close()
	for cfRows.Next() {
		var fieldUUID string
		if err := cfRows.Scan(&fieldUUID); err != nil {
			return err
		}
		durationFields[fieldUUID] = true
	}
	cfRows.Close()
	if err := cfRows.Err(); err != nil {
		return err
	}

	// 3. Fetch flight records
	fmt.Println("Fetching flight records...")
	rows, err := tx.QueryContext(ctx, `
		SELECT uuid, 
			se_time, me_time, mcc_time, total_time, night_time,
			ifr_time, pic_time, co_pilot_time, dual_time, instructor_time, sim_time,
			custom_fields
		FROM logbook`)
	if err != nil {
		return err
	}
	defer rows.Close()

	// 4. Process each flight record
	fmt.Println("Processing flight records...")
	for rows.Next() {
		var rec recordUpdate
		var rawTimes [11]sql.NullString
		var rawCF sql.NullString

		err := rows.Scan(
			&rec.uuid,
			&rawTimes[0], &rawTimes[1], &rawTimes[2], &rawTimes[3], &rawTimes[4],
			&rawTimes[5], &rawTimes[6], &rawTimes[7], &rawTimes[8], &rawTimes[9], &rawTimes[10],
			&rawCF,
		)
		if err != nil {
			return err
		}
		for i := range 11 {
			if rawTimes[i].Valid {
				rec.times[i] = parseTimeToMinutes(rawTimes[i].String)
			}
		}

		rec.customFields = rawCF.String
		if len(durationFields) > 0 && rawCF.Valid && rawCF.String != "" && rawCF.String != "{}" {
			var cfMap map[string]any
			if err := json.Unmarshal([]byte(rawCF.String), &cfMap); err == nil {
				updated := false
				for fieldUUID := range durationFields {
					if val, ok := cfMap[fieldUUID]; ok {
						switch v := val.(type) {
						case string:
							if v != "" {
								cfMap[fieldUUID] = parseTimeToMinutes(v)
								updated = true
							}
						}
					}
				}
				if updated {
					if newBytes, err := json.Marshal(cfMap); err == nil {
						rec.customFields = string(newBytes)
					}
				}
			}
		}
		updates = append(updates, rec)
	}
	if err := rows.Err(); err != nil {
		return err
	}
	rows.Close()

	// 5. Update flight records with converted times and custom fields
	fmt.Println("Updating flight records...")
	stmt, err := tx.PrepareContext(ctx, `
		UPDATE logbook SET
			se_time = ?, me_time = ?, mcc_time = ?, total_time = ?, night_time = ?,
			ifr_time = ?, pic_time = ?, co_pilot_time = ?, dual_time = ?, instructor_time = ?, sim_time = ?,
			custom_fields = ?
		WHERE uuid = ?`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, u := range updates {
		_, err = stmt.ExecContext(ctx,
			u.times[0], u.times[1], u.times[2], u.times[3], u.times[4],
			u.times[5], u.times[6], u.times[7], u.times[8], u.times[9], u.times[10],
			u.customFields,
			u.uuid,
		)
		if err != nil {
			return err
		}
	}

	if engine == MySQL {
		alterQuery := `
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
			MODIFY sim_time INT NOT NULL DEFAULT 0`
		if _, err := tx.ExecContext(ctx, alterQuery); err != nil {
			return err
		}
	}

	// 6. Migrate settings2: convert previous_experience time strings to integer minutes
	fmt.Println("Updating previous experience in settings...")
	var rawSettings string
	err = tx.QueryRowContext(ctx, "SELECT settings FROM settings2 WHERE id = 0").Scan(&rawSettings)
	if err == nil && rawSettings != "" {
		var settingsMap map[string]any
		if err := json.Unmarshal([]byte(rawSettings), &settingsMap); err == nil {
			if peRaw, ok := settingsMap["previous_experience"]; ok {
				if peMap, ok := peRaw.(map[string]any); ok {
					// The 13 time fields in previous_experience
					timeFields := []string{
						"total_time", "se_time", "me_time", "mcc_time",
						"night_time", "ifr_time", "pic_time", "co_pilot_time",
						"dual_time", "instructor_time", "me_total_time",
						"cc_time", "sim_time",
					}
					for _, tf := range timeFields {
						if val, exists := peMap[tf]; exists {
							if strVal, isStr := val.(string); isStr {
								peMap[tf] = parseTimeToMinutes(strVal)
							}
						} else {
							peMap[tf] = 0
						}
					}
					settingsMap["previous_experience"] = peMap
					// Write the clean JSON back to settings2
					if updatedJSON, err := json.Marshal(settingsMap); err == nil {
						_, err = tx.ExecContext(ctx, "UPDATE settings2 SET settings = ? WHERE id = 0", string(updatedJSON))
						if err != nil {
							return fmt.Errorf("failed updating settings: %w", err)
						}
					}
				}
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}

// validateDB creates db structure in case it's a first run and the schema is empty
func validateDB(db *sql.DB, engine string) error {
	metadataTable.initTable(db, engine)
	version := getSchemaVersion(db)

	if version != "unknown" {
		versionInt, err := strconv.Atoi(version)
		if err == nil && versionInt < 100 {
			dataOverhaulMigration(db, engine)
		}
	}

	if version == "unknown" || version != schemaVersion {
		fmt.Printf("Initializing version %s...\n", schemaVersion)

		// check tables
		tables := []*Table{logbookTable, airportsTable, customAirportsTable,
			settingsTable, licensingTable, attachmentsTable, tokensTable,
			aircraftsTable, aircraftCategoriesTable, currencyTable,
			customFieldsTable, personsTable, personToLogTable,
		}

		for _, table := range tables {
			if err := table.initTable(db, engine); err != nil {
				return err
			}
		}

		// check views
		views := []*View{logbookView, airportsView, aircraftsView, logbookStatsView, attachmentsView}
		for _, view := range views {
			if err := view.initView(db, engine); err != nil {
				return err
			}
		}

		// check settings table it's not empty
		err := checkSettingsTable(db)
		if err != nil {
			return err
		}

		// update schema version
		err = updateSchemaVersion(db)
		if err != nil {
			return err
		}
	}

	return nil
}

func getSchemaVersion(db *sql.DB) (version string) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	query := "SELECT version FROM metadata ORDER BY created_at DESC LIMIT 1"
	err := db.QueryRowContext(ctx, query).Scan(&version)
	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Println("No rows found in 'metadata'")
			return "unknown"
		}
		fmt.Println(err)
		return "unknown"
	}

	if version != schemaVersion {
		fmt.Printf("Schema version (%s) mismatch\n", version)
		return version
	}

	return version
}

func updateSchemaVersion(db *sql.DB) error {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	query := "INSERT INTO metadata (version, created_at) VALUES (?,?)"
	_, err := db.ExecContext(ctx, query, schemaVersion, time.Now().Format("20060102 15:04:05"))
	return err
}

// checkSettingsTable verifies the proper transition to the new settings table
func checkSettingsTable(db *sql.DB) error {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	var s models.Settings

	// check settings table (first app run)
	var rowsCount int
	row := db.QueryRowContext(ctx, "SELECT COUNT(*) FROM settings2")

	if err := row.Scan(&rowsCount); err != nil {
		return err
	}

	if rowsCount == 0 {
		// default values
		s.OwnerName = DefaultOwnerName
		s.SignatureText = DefaultSignatureText

		out, err := json.Marshal(s)
		if err != nil {
			return err
		}

		_, err = db.ExecContext(ctx, "INSERT INTO settings2 (id, settings) VALUES (0, ?)", string(out))
		return err
	}

	return nil
}
