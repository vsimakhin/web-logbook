package driver

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	_ "embed"

	_ "modernc.org/sqlite"
)

func OpenDB(dsn string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		return nil, err
	}

	err = validateDB(db)
	if err != nil {
		return nil, err
	}

	return db, nil
}

//go:embed db.structure
var structure string

// validateDB creates db structure in case it's a first run and the schema is empty
func validateDB(db *sql.DB) error {
	var err error
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// run sql from db.structure
	_, err = db.ExecContext(ctx, structure)
	if err != nil {
		return err
	}

	// check settings table it's not empty
	err = checkSettingsTable(db)
	if err != nil {
		return err
	}

	return nil
}

func checkSettingsTable(db *sql.DB) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// first let's check we migrate everything from old settings table to the new one
	var s struct {
		OwnerName     string `json:"owner_name"`
		SignatureText string `json:"signature_text"`
		PageBreaks    string `json:"page_breaks"`
	}

	row := db.QueryRowContext(ctx, "SELECT owner_name, signature_text, page_breaks FROM settings")
	err := row.Scan(&s.OwnerName, &s.SignatureText, &s.PageBreaks)
	if err == nil {
		// looks like we still have an old table
		out, err := json.Marshal(s)
		if err != nil {
			return err
		}

		// update new settings table with old values
		_, err = db.ExecContext(ctx, "INSERT INTO settings2 (id, settings) VALUES (0, ?)", string(out))
		if err != nil {
			return err
		}

		// drop old settings table
		_, err = db.ExecContext(ctx, "DROP TABLE settings")
		if err != nil {
			return err
		}
	}

	// check settings table (first app run)
	var rowsCount int
	row = db.QueryRowContext(ctx, "SELECT COUNT(*) FROM settings2")

	err = row.Scan(&rowsCount)
	if err != nil {
		return err
	}

	if rowsCount == 0 {
		// default values
		s.OwnerName = "Owner Name"
		s.PageBreaks = ""
		s.SignatureText = "I certify that the entries in this log are true."

		out, err := json.Marshal(s)
		if err != nil {
			return err
		}

		_, err = db.ExecContext(ctx, "INSERT INTO settings2 (id, settings) VALUES (0, ?)", string(out))
		if err != nil {
			return err
		}
	}

	return nil
}
