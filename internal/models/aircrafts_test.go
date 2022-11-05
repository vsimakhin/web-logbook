package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetAircrafts(t *testing.T) {
	db := initModel(t)

	aircrafts, err := db.GetAircrafts(AllAircrafts)
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, aircrafts["REG"], "MODEL")
}
