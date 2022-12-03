package models

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestAtod(t *testing.T) {
	assert.Equal(t, time.Duration(3600000000000), atod("1:00"))
	assert.Equal(t, time.Duration(1800000000000), atod("0:30"))
	assert.Equal(t, time.Duration(0), atod(""))
}

func TestDtoa(t *testing.T) {
	assert.Equal(t, dtoa(time.Duration(3600000000000)), "1:00")
	assert.Equal(t, dtoa(time.Duration(1800000000000)), "0:30")
	assert.Equal(t, dtoa(time.Duration(0)), "0:00")
}

func TestGetFlightRecords(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetFlightRecords")

	frs, err := db.GetFlightRecords()
	if err != nil {
		t.Fatal(err)
	}

	for _, fr := range frs {
		assert.Equal(t, "uuid", fr.UUID)
	}
}

func TestDeleteFlightRecord(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "DeleteFlightRecord")

	err := db.DeleteFlightRecord("uuid")
	if err != nil {
		t.Fatal(err)
	}
}

func TestInsertFlightRecord(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "InsertFlightRecord")

	var fr FlightRecord
	fr.UUID = "uuid"
	fr.Date = "01/02/2022"
	fr.Departure.Place = "LKPR"
	fr.Departure.Time = "1000"
	fr.Arrival.Place = "EDDM"
	fr.Arrival.Time = "1200"
	fr.Aircraft.Model = "C152"
	fr.Aircraft.Reg = "OK-XXX"
	fr.Time.SE = "2:00"
	fr.Time.ME = "2:00"
	fr.Time.MCC = "2:00"
	fr.Time.Total = "2:00"
	fr.Time.Night = "2:00"
	fr.Time.IFR = "2:00"
	fr.Time.PIC = "2:00"
	fr.Time.CoPilot = "2:00"
	fr.Time.Dual = "2:00"
	fr.Time.Instructor = "2:00"
	fr.Landings.Day = 1
	fr.Landings.Night = 2
	fr.SIM.Type = "SIM"
	fr.SIM.Time = "2:00"
	fr.PIC = "Self"
	fr.Remarks = "Remarks"

	err := db.InsertFlightRecord(fr)
	if err != nil {
		t.Fatal(err)
	}
}

func TestUpdateFlightRecord(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "UpdateFlightRecord")

	var fr FlightRecord
	fr.UUID = "uuid"
	fr.Date = "01/02/2022"
	fr.Departure.Place = "LKPR"
	fr.Departure.Time = "1000"
	fr.Arrival.Place = "EDDM"
	fr.Arrival.Time = "1200"
	fr.Aircraft.Model = "C152"
	fr.Aircraft.Reg = "OK-XXX"
	fr.Time.SE = "2:00"
	fr.Time.ME = "2:00"
	fr.Time.MCC = "2:00"
	fr.Time.Total = "2:00"
	fr.Time.Night = "2:00"
	fr.Time.IFR = "2:00"
	fr.Time.PIC = "2:00"
	fr.Time.CoPilot = "2:00"
	fr.Time.Dual = "2:00"
	fr.Time.Instructor = "2:00"
	fr.Landings.Day = 1
	fr.Landings.Night = 2
	fr.SIM.Type = "SIM"
	fr.SIM.Time = "2:00"
	fr.PIC = "Self"
	fr.Remarks = "Remarks"

	err := db.UpdateFlightRecord(fr)
	if err != nil {
		t.Fatal(err)
	}
}

func TestGetFlightRecordsByID(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetFlightRecordByID")

	fr, err := db.GetFlightRecordByID("uuid")
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, "uuid", fr.UUID)
}

func TestCalculateTotals(t *testing.T) {

	var fr FlightRecord
	fr.Time.SE = "2:00"
	fr.Time.ME = "2:00"
	fr.Time.MCC = "2:00"
	fr.Time.Total = "2:00"
	fr.Time.Night = "2:00"
	fr.Time.IFR = "2:00"
	fr.Time.PIC = "2:00"
	fr.Time.CoPilot = "2:00"
	fr.Time.Dual = "2:00"
	fr.Time.Instructor = "2:00"
	fr.Landings.Day = 1
	fr.Landings.Night = 2
	fr.SIM.Time = "2:00"

	assert.Equal(t, "4:00", CalculateTotals(fr, fr).Time.SE)
	assert.Equal(t, "4:00", CalculateTotals(fr, fr).Time.ME)
	assert.Equal(t, "4:00", CalculateTotals(fr, fr).Time.MCC)
	assert.Equal(t, "4:00", CalculateTotals(fr, fr).Time.Total)
	assert.Equal(t, "4:00", CalculateTotals(fr, fr).Time.Night)
	assert.Equal(t, "4:00", CalculateTotals(fr, fr).Time.IFR)
	assert.Equal(t, "4:00", CalculateTotals(fr, fr).Time.PIC)
	assert.Equal(t, "4:00", CalculateTotals(fr, fr).Time.CoPilot)
	assert.Equal(t, "4:00", CalculateTotals(fr, fr).Time.Dual)
	assert.Equal(t, "4:00", CalculateTotals(fr, fr).Time.Instructor)
	assert.Equal(t, "4:00", CalculateTotals(fr, fr).SIM.Time)
	assert.Equal(t, 2, CalculateTotals(fr, fr).Landings.Day)
	assert.Equal(t, 4, CalculateTotals(fr, fr).Landings.Night)
}
