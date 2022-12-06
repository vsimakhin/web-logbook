package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetAircrafts(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetAircraftsLast")
	AddMock(mock, "GetAircraftsAll")

	// All aircrafts
	aircrafts, err := db.GetAircrafts(AllAircrafts)
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, "MODEL", aircrafts["REG"])

	// Last aircrafts
	aircrafts, err = db.GetAircrafts(LastAircrafts)
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, "MODEL", aircrafts["REG"])
}

func TestGetAircraftClasses(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetSettings")

	classes, err := db.GetAircraftClasses()
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, "model1,model2", classes["class"])

}
