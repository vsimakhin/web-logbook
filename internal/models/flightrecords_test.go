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

	records, err := db.GetAircraftModels()
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, records[0], "MODEL1")

}
