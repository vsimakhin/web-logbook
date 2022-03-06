package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetFlightRecords(t *testing.T) {
	db := initModel(t)

	frs, err := db.GetFlightRecords()
	if err != nil {
		t.Fatal(err)
	}

	for _, fr := range frs {
		assert.Equal(t, fr.UUID, "uuid")
	}
}

func TestGetAircraftRegs(t *testing.T) {
	db := initModel(t)

	records, err := db.GetAircraftRegs()
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, records[0], "REG1")
}

func TestGetAircraftModels(t *testing.T) {
	db := initModel(t)

	records, err := db.GetAircraftModels(JustLastModels)
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, records[0], "MODEL1")
}

func TestDeleteFlightRecord(t *testing.T) {
	db := initModel(t)

	err := db.DeleteFlightRecord("uuid")
	if err != nil {
		t.Fatal(err)
	}
}

func TestInsertFlightRecord(t *testing.T) {
	db := initModel(t)

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
	db := initModel(t)

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
	db := initModel(t)

	fr, err := db.GetFlightRecordByID("uuid")
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, fr.UUID, "uuid")
}
