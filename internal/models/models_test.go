package models

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

func initModel(t *testing.T) DBModel {
	dbconn, mock, err := sqlmock.New(sqlmock.QueryMatcherOption(sqlmock.QueryMatcherRegexp))
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	db := DBModel{DB: dbconn}

	InitMock(mock)

	return db
}
