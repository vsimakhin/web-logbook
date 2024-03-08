package models

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

func initDBModel(t *testing.T) (DBModel, sqlmock.Sqlmock) {
	dbconn, mock, err := sqlmock.New(sqlmock.QueryMatcherOption(sqlmock.QueryMatcherRegexp))
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	// any order of the queries
	mock.MatchExpectationsInOrder(false)

	db := DBModel{DB: dbconn}

	return db, mock
}
