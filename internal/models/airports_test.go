package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetAirportByID(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetAirportByID")

	ap, err := db.GetAirportByID("XXXX")
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, "XXXX", ap.ICAO)
	assert.Equal(t, "XXX", ap.IATA)
}

func TestGetAirports(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetAirports")

	aps, err := db.GetAirports()
	if err != nil {
		t.Fatal(err)
	}

	for _, ap := range aps {
		assert.Equal(t, "XXXX", ap.ICAO)
		assert.Equal(t, "XXX", ap.IATA)
	}
}

func TestGetAirportCount(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetAirportCount")

	c, err := db.GetAirportCount()
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, 100, c)
}
