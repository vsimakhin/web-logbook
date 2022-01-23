package models

import (
	"database/sql"
)

// DBModel is a type for database connections
type DBModel struct {
	DB *sql.DB
}

// Models is a wraper for DBModel
type Models struct {
	DB DBModel
}

// NewMdels returns a model type with db connection pool
func NewModels(db *sql.DB) Models {
	return Models{
		DB: DBModel{DB: db},
	}
}
