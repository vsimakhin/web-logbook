package driver

import (
	"context"
	"database/sql"
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

	// check settings table
	var rowsCount int
	row := db.QueryRowContext(ctx, "SELECT COUNT(*) FROM settings;")

	err := row.Scan(&rowsCount)
	if err != nil {
		return err
	}

	if rowsCount == 0 {
		_, err = db.ExecContext(ctx, `INSERT INTO settings (id, owner_name, signature_text, page_breaks)
			VALUES (1, "Owner Name", "I certify that the entries in this log are true.", "")`)

		if err != nil {
			return err
		}
	}

	return nil
}
