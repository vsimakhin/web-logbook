package models

import (
	"testing"
)

func TestAuthenticate(t *testing.T) {
	db, mock := initDBModel(t)

	InitMock(mock, "GetSettings")

	err := db.Authenticate("login", "password")
	if err != nil {
		t.Fatal(err)
	}
}

func DisableAuthorization(t *testing.T) {
	db, mock := initDBModel(t)

	InitMock(mock, "GetSettings")

	err := db.DisableAuthorization()
	if err != nil {
		t.Fatal(err)
	}
}
