package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestAuthenticate(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetSettings")

	err := db.Authenticate("login", "password")
	if err != nil {
		t.Fatal(err)
	}
}

func TestIsAuthEnabled(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetSettings")

	auth := db.IsAuthEnabled()

	assert.Equal(t, auth, false)
}

func DisableAuthorization(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetSettings")
	AddMock(mock, "UpdateSettings")

	err := db.DisableAuthorization()
	if err != nil {
		t.Fatal(err)
	}
}
