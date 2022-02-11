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
