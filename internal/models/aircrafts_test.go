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

	assert.Equal(t, aircrafts["REG"], "MODEL")

	// Last aircrafts
	aircrafts, err = db.GetAircrafts(LastAircrafts)
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, aircrafts["REG"], "MODEL")
}
