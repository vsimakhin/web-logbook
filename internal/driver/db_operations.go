package driver

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

const (
	SQLite = "sqlite"
	MySQL  = "mysql"

	checkTable  = iota
	createTable = iota
	getColumns  = iota
	alterTable  = iota
	checkView   = iota
	createView  = iota
	checkIndex  = iota
	createIndex = iota
)

var queries = map[string]map[int]string{
	SQLite: {
		checkTable:  "SELECT * FROM %s WHERE 1=2",
		createTable: "CREATE TABLE %s (%s %s PRIMARY KEY)",
		getColumns:  "PRAGMA table_info(%s)",
		alterTable:  "ALTER TABLE %s ADD COLUMN %s %s",
		checkView:   "SELECT * FROM %s WHERE 1=2",
		createView:  "CREATE VIEW %s AS %s",
		checkIndex:  "PRAGMA index_list(%s)",
		createIndex: "CREATE INDEX %s ON %s (%s)",
	},
	MySQL: {
		checkTable:  "SELECT * FROM %s WHERE 1=2",
		createTable: "CREATE TABLE %s (%s %s PRIMARY KEY);",
		getColumns:  "SHOW COLUMNS FROM %s",
		alterTable:  "ALTER TABLE %s ADD COLUMN %s %s",
		checkView:   "SELECT * FROM %s WHERE 1=2",
		createView:  "CREATE VIEW %s AS %s",
		checkIndex:  "SHOW INDEX FROM %s",
		createIndex: "CREATE INDEX %s ON %s (%s)",
	},
}

type ColumnType map[string]string
type Column struct {
	Name       string
	Type       ColumnType
	Properties string
	Index      bool
}

type Table struct {
	Name           string
	PrimaryKeyName string
	PrimaryKeyType ColumnType
	Columns        []Column
}

type SQLQuery map[string]string
type View struct {
	Name  string
	Query SQLQuery
}

func NewView(name string, query SQLQuery) *View {
	return &View{
		Name:  name,
		Query: query,
	}
}

func NewTable(name string, primaryKeyName string, primaryKeyType ColumnType, columns []Column) *Table {
	return &Table{
		Name:           name,
		PrimaryKeyName: primaryKeyName,
		PrimaryKeyType: primaryKeyType,
		Columns:        columns,
	}
}

func (t *Table) initTable(db *sql.DB, engine string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var err error

	if !t.isExists(ctx, db, engine) {
		err := t.createTable(ctx, db, engine)
		if err != nil {
			return err
		}
	}
	err = t.ensureColumnsExist(ctx, db, engine)
	if err != nil {
		return err
	}

	return nil
}

func (t *Table) isExists(ctx context.Context, db *sql.DB, engine string) bool {
	query := fmt.Sprintf(queries[engine][checkTable], t.Name)
	_, err := db.ExecContext(ctx, query)

	return err == nil
}

func (t *Table) createTable(ctx context.Context, db *sql.DB, engine string) error {
	query := fmt.Sprintf(queries[engine][createTable], t.Name, t.PrimaryKeyName, t.PrimaryKeyType[engine])
	_, err := db.ExecContext(ctx, query)
	if err != nil {
		return err
	}

	return nil
}

func (t *Table) ensureColumnsExist(ctx context.Context, db *sql.DB, engine string) error {
	query := fmt.Sprintf(queries[engine][getColumns], t.Name)
	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return err
	}
	defer rows.Close()

	existingColumns := make(map[string]bool)
	for rows.Next() {
		var columnName string

		var str string
		var strp *string
		var val int
		if engine == SQLite {
			err = rows.Scan(&val, &columnName, &str, &val, &strp, &val)
		} else if engine == MySQL {
			err = rows.Scan(&columnName, &str, &str, &str, &strp, &str)
		}
		if err != nil {
			return err
		}
		existingColumns[columnName] = true
	}

	for _, column := range t.Columns {
		if _, exists := existingColumns[column.Name]; !exists {
			alterQuery := fmt.Sprintf(queries[engine][alterTable], t.Name, column.Name, column.Type[engine])
			if _, err := db.ExecContext(ctx, alterQuery); err != nil {
				return fmt.Errorf("failed to add column %s to table %s: %w", column.Name, t.Name, err)
			}
		}

		if column.Index {
			err = t.ensureIndexExists(ctx, db, engine, column)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func (t *Table) ensureIndexExists(ctx context.Context, db *sql.DB, engine string, column Column) error {
	query := fmt.Sprintf(queries[engine][checkIndex], t.Name)
	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var indexName string

		var str string
		var strp *string
		if engine == MySQL {
			err = rows.Scan(&str, &str, &indexName, &str, &str, &str, &str, &strp, &strp, &str, &str, &str, &str, &str, &strp)
		} else if engine == SQLite {
			err = rows.Scan(&str, &indexName, &str, &str, &str)
		}
		if err != nil {
			return err
		}

		if indexName == fmt.Sprintf("%s_%s", t.Name, column.Name) {
			return nil
		}
	}

	err = t.createIndex(ctx, db, engine, column)
	return err
}

func (t *Table) createIndex(ctx context.Context, db *sql.DB, engine string, column Column) error {
	indexName := fmt.Sprintf("%s_%s", t.Name, column.Name)
	query := fmt.Sprintf(queries[engine][createIndex], indexName, t.Name, column.Name)
	_, err := db.ExecContext(ctx, query)

	return err
}

func (v *View) initView(db *sql.DB, engine string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if !v.isExists(ctx, db, engine) {
		err := v.createView(ctx, db, engine)
		if err != nil {
			return err
		}
	}
	return nil
}

func (v *View) isExists(ctx context.Context, db *sql.DB, engine string) bool {
	query := fmt.Sprintf(queries[engine][checkView], v.Name)
	_, err := db.ExecContext(ctx, query)

	return err == nil
}

func (v *View) createView(ctx context.Context, db *sql.DB, engine string) error {
	query := fmt.Sprintf(queries[engine][createView], v.Name, v.Query[engine])
	_, err := db.ExecContext(ctx, query)
	if err != nil {
		return err
	}

	return nil
}
