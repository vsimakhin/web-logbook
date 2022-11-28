package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetTotals(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetTotals")

	fr, err := db.GetTotals("19000101", "30000101")
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, fr.Time.Total, "2:00")
}

func TestGetTotalsByAicraftType(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetTotalsClassType")

	fr, err := db.GetTotalsByAircraftType("19000101", "30000101")
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, fr["MODEL"].Time.Total, "2:00")
}

func TestGetTotalsByAicraftClass(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetSettings")
	AddMock(mock, "GetTotalsClassType")

	fr, err := db.GetTotalsByAircraftClass("19000101", "30000101")
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, fr["MODEL"].Time.Total, "2:00")
}

func TestGetTotalsByYear(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetTotalsYear")

	fr, err := db.GetTotalsByYear()
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, fr["2022"].Time.Total, "2:00")
}
