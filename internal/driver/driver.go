package driver

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	_ "embed"

	"github.com/vsimakhin/web-logbook/internal/models"
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
	var s models.Settings

	row := db.QueryRowContext(ctx, "SELECT owner_name, signature_text, page_breaks FROM settings")
	err := row.Scan(&s.OwnerName, &s.SignatureText, &s.ExportA4.PageBreaks)
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
		s.SignatureText = "I certify that the entries in this log are true."

		s.ExportA5.LogbookRows = 20
		s.ExportA5.Fill = 3
		s.ExportA5.LeftMarginA = 6.0
		s.ExportA5.LeftMarginB = 14.0
		s.ExportA5.TopMargin = 9.0
		s.ExportA5.BodyRow = 5.0
		s.ExportA5.FooterRow = 5.0
		s.ExportA5.Columns.Col1 = 15.5
		s.ExportA5.Columns.Col2 = 12.25
		s.ExportA5.Columns.Col3 = 8.25
		s.ExportA5.Columns.Col4 = 12.25
		s.ExportA5.Columns.Col5 = 8.25
		s.ExportA5.Columns.Col6 = 10.0
		s.ExportA5.Columns.Col7 = 15.4
		s.ExportA5.Columns.Col8 = 12.2
		s.ExportA5.Columns.Col9 = 12.2
		s.ExportA5.Columns.Col10 = 12.2
		s.ExportA5.Columns.Col11 = 12.2
		s.ExportA5.Columns.Col12 = 41.86
		s.ExportA5.Columns.Col13 = 8.38
		s.ExportA5.Columns.Col14 = 8.38
		s.ExportA5.Columns.Col15 = 12.2
		s.ExportA5.Columns.Col16 = 12.2
		s.ExportA5.Columns.Col17 = 12.2
		s.ExportA5.Columns.Col18 = 12.2
		s.ExportA5.Columns.Col19 = 12.2
		s.ExportA5.Columns.Col20 = 12.2
		s.ExportA5.Columns.Col21 = 24.2
		s.ExportA5.Columns.Col22 = 12.2
		s.ExportA5.Columns.Col23 = 79.8

		s.ExportA4.LogbookRows = 23
		s.ExportA4.Fill = 3
		s.ExportA4.LeftMargin = 10.0
		s.ExportA4.TopMargin = 30.0
		s.ExportA4.BodyRow = 5.0
		s.ExportA4.FooterRow = 6.0
		s.ExportA4.Columns.Col1 = 12.2
		s.ExportA4.Columns.Col2 = 8.25
		s.ExportA4.Columns.Col3 = 8.25
		s.ExportA4.Columns.Col4 = 8.25
		s.ExportA4.Columns.Col5 = 8.25
		s.ExportA4.Columns.Col6 = 10.0
		s.ExportA4.Columns.Col7 = 12.9
		s.ExportA4.Columns.Col8 = 11.2
		s.ExportA4.Columns.Col9 = 11.2
		s.ExportA4.Columns.Col10 = 11.2
		s.ExportA4.Columns.Col11 = 11.2
		s.ExportA4.Columns.Col12 = 22.86
		s.ExportA4.Columns.Col13 = 8.38
		s.ExportA4.Columns.Col14 = 8.38
		s.ExportA4.Columns.Col15 = 11.2
		s.ExportA4.Columns.Col16 = 11.2
		s.ExportA4.Columns.Col17 = 11.2
		s.ExportA4.Columns.Col18 = 11.2
		s.ExportA4.Columns.Col19 = 11.2
		s.ExportA4.Columns.Col20 = 11.2
		s.ExportA4.Columns.Col21 = 11.2
		s.ExportA4.Columns.Col22 = 11.2
		s.ExportA4.Columns.Col23 = 33.8

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
