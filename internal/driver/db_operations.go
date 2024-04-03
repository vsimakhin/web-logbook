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

// queries is a map that stores the SQL queries for different database types.
// The keys of the outer map represent the database types (e.g., SQLite, MySQL),
// and the values are inner maps that store the specific queries for each database type.
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

// Column represents a database column.
type ColumnType map[string]string
type Column struct {
	Name       string     // Name of the column.
	Type       ColumnType // Type of the column.
	Properties string     // Additional properties of the column.
	Index      bool       // Indicates if the column has an index.
}

// Table represents a database table.
type Table struct {
	Name           string     // Name of the table.
	PrimaryKeyName string     // Name of the primary key column.
	PrimaryKeyType ColumnType // Type of the primary key column.
	Columns        []Column   // List of columns in the table.
}

// View represents a database view.
type SQLQuery map[string]string
type View struct {
	Name  string   // Name of the view.
	Query SQLQuery // SQL query used to create the view.
}

// NewView creates a new View with the given name and SQLQuery.
func NewView(name string, query SQLQuery) *View {
	return &View{
		Name:  name,
		Query: query,
	}
}

// NewTable creates a new Table instance with the specified name, primary key name, primary key type, and columns.
func NewTable(name string, primaryKeyName string, primaryKeyType ColumnType, columns []Column) *Table {
	return &Table{
		Name:           name,
		PrimaryKeyName: primaryKeyName,
		PrimaryKeyType: primaryKeyType,
		Columns:        columns,
	}
}

// initTable initializes the table by checking if it exists and creating it if necessary.
// It also ensures that all required columns exist in the table.
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

// isExists checks if the table exists in the database.
func (t *Table) isExists(ctx context.Context, db *sql.DB, engine string) bool {
	query := fmt.Sprintf(queries[engine][checkTable], t.Name)
	_, err := db.ExecContext(ctx, query)

	return err == nil
}

// createTable creates the table in the database.
func (t *Table) createTable(ctx context.Context, db *sql.DB, engine string) error {
	query := fmt.Sprintf(queries[engine][createTable], t.Name, t.PrimaryKeyName, t.PrimaryKeyType[engine])
	_, err := db.ExecContext(ctx, query)
	if err != nil {
		return err
	}

	return nil
}

// ensureColumnsExist ensures that all columns defined in the Table struct exist in the database table.
// It queries the database to retrieve the existing columns and compares them with the columns defined in the Table struct.
// If a column is missing, it adds the column to the table using an ALTER TABLE query.
// If the column has an index, it also ensures that the index exists in the database.
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

// ensureIndexExists checks if an index exists in the specified table for the given column.
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

// createIndex creates an index for the specified column in the table.
func (t *Table) createIndex(ctx context.Context, db *sql.DB, engine string, column Column) error {
	indexName := fmt.Sprintf("%s_%s", t.Name, column.Name)
	query := fmt.Sprintf(queries[engine][createIndex], indexName, t.Name, column.Name)
	_, err := db.ExecContext(ctx, query)

	return err
}

// initView initializes the view by checking if it exists and creating it if necessary.
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

// isExists checks if the view exists in the database.
func (v *View) isExists(ctx context.Context, db *sql.DB, engine string) bool {
	query := fmt.Sprintf(queries[engine][checkView], v.Name)
	_, err := db.ExecContext(ctx, query)

	return err == nil
}

// createView creates the view in the database.
func (v *View) createView(ctx context.Context, db *sql.DB, engine string) error {
	query := fmt.Sprintf(queries[engine][createView], v.Name, v.Query[engine])
	_, err := db.ExecContext(ctx, query)
	if err != nil {
		return err
	}

	return nil
}
