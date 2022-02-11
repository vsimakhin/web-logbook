package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetSettings(t *testing.T) {
	db := initModel(t)

	set, err := db.GetSettings()
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, set.ID, 1)
	assert.Equal(t, set.OwnerName, "Owner Name")
	assert.Equal(t, set.PageBreaks, "")
	assert.Equal(t, set.SignatureText, "I certify that the entries in this log are true.")
}

func TestUpdateSettings(t *testing.T) {
	db := initModel(t)

	var set Settings

	set.OwnerName = "Owner Name"
	set.PageBreaks = ""
	set.SignatureText = "I certify that the entries in this log are true."

	err := db.UpdateSettings(set)
	if err != nil {
		t.Fatal(err)
	}
}
