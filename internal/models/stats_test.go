package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetTotals(t *testing.T) {
	db := initModel(t)

	fr, err := db.GetTotals(ThisYear)
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, fr.Time.Total, "2:00")
}
