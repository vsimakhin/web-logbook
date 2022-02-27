package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetAirportByID(t *testing.T) {
	db := initModel(t)

	ap, err := db.GetAirportByID("XXXX")
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, ap.ICAO, "XXXX")
	assert.Equal(t, ap.IATA, "XXX")
}

func TestGetAirports(t *testing.T) {
	db := initModel(t)

	aps, err := db.GetAirports()
	if err != nil {
		t.Fatal(err)
	}

	for _, ap := range aps {
		assert.Equal(t, ap.ICAO, "XXXX")
		assert.Equal(t, ap.IATA, "XXX")
	}
}

func TestGetAirportCount(t *testing.T) {
	db := initModel(t)

	c, err := db.GetAirportCount()
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, c, 100)
}
