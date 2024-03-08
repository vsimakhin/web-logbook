package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetTotals(t *testing.T) {
	db, mock := initDBModel(t)

	InitMock(mock, "GetTotals")

	fr, err := db.GetTotals("19000101", "30000101")
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, "2:00", fr.Time.Total)
}

func TestGetTotalsByAicraftType(t *testing.T) {
	db, mock := initDBModel(t)

	InitMock(mock, "GetTotalsClassType")

	fr, err := db.GetTotalsByAircraftType("19000101", "30000101")
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, "2:00", fr["MODEL"].Time.Total)
}

func TestGetTotalsByAicraftClass(t *testing.T) {
	db, mock := initDBModel(t)

	InitMock(mock, "GetSettings")
	InitMock(mock, "GetTotalsClassType")

	fr, err := db.GetTotalsByAircraftClass("19000101", "30000101")
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, "2:00", fr["MODEL"].Time.Total)
}

func TestGetTotalsByYear(t *testing.T) {
	db, mock := initDBModel(t)

	InitMock(mock, "GetTotalsYear")

	fr, err := db.GetTotalsByYear()
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, "2:00", fr["2022"].Time.Total)
}
