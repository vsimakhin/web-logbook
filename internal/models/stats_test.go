package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetTotals(t *testing.T) {
	db := initModel(t)

	fr, err := db.GetTotals("19000101", "30000101")
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, fr.Time.Total, "2:00")
}
