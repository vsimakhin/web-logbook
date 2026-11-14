package driver

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	_ "embed"

	_ "github.com/go-sql-driver/mysql"
	"github.com/vsimakhin/web-logbook/internal/models"
	_ "modernc.org/sqlite"

	version "github.com/hashicorp/go-version"
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

// validateDB creates db structure in case it's a first run and the schema is empty
func validateDB(db *sql.DB, engine string) error {
	metadataTable.initTable(db, engine)
	version := getSchemaVersion(db)

	if version != "unknown" {
		versionInt, err := strconv.Atoi(version)
		if err == nil && versionInt < 100 {
			if err := dataOverhaulMigration(db, engine); err != nil {
				return fmt.Errorf("migration failed: %w", err)
			}
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
		views := []*View{logbookView, airportsView, aircraftsView, attachmentsView}
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

func getSchemaVersion(db *sql.DB) (highestVersion string) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	rows, err := db.QueryContext(ctx, "SELECT version FROM metadata")
	if err != nil {
		fmt.Println(err)
		return "unknown"
	}
	defer rows.Close()

	var highest *version.Version

	for rows.Next() {
		var raw string

		if err := rows.Scan(&raw); err != nil {
			fmt.Println(err)
			return "unknown"
		}

		current, err := version.NewVersion(raw)
		if err != nil {
			fmt.Printf("Invalid schema version %q: %v\n", raw, err)
			continue
		}

		if highest == nil || current.GreaterThan(highest) {
			highest = current
		}
	}

	if err := rows.Err(); err != nil {
		fmt.Println(err)
		return "unknown"
	}

	if highest == nil {
		fmt.Println("No valid versions found in 'metadata'")
		return "unknown"
	}

	highestVersion = highest.Original()

	if highestVersion != schemaVersion {
		fmt.Printf("Schema version (%s) mismatch\n", highestVersion)
	}

	return highestVersion
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
