package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetLicenses(t *testing.T) {
	db, mock := initDBModel(t)

	InitMock(mock, "GetLicenses")

	lics, err := db.GetLicenses()
	if err != nil {
		t.Fatal(err)
	}

	for _, lic := range lics {
		assert.Equal(t, "uuid", lic.UUID)
		assert.Equal(t, "category", lic.Category)
		assert.Equal(t, "document_name", lic.DocumentName)
	}
}

func TestGetLicenseRecordByID(t *testing.T) {
	db, mock := initDBModel(t)

	InitMock(mock, "GetLicenseRecordByID")

	lic, err := db.GetLicenseRecordByID("uuid")
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, "uuid", lic.UUID)
}

func TestGetLicensesCategory(t *testing.T) {
	db, mock := initDBModel(t)

	InitMock(mock, "GetLicensesCategory")

	cats, err := db.GetLicensesCategory()
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, "category", cats[0])
}

func TestUpdateLicenseRecord(t *testing.T) {
	db, mock := initDBModel(t)

	InitMock(mock, "UpdateLicenseRecord")

	var lic License
	lic.UUID = "uuid"
	lic.Name = "name"
	lic.Category = "category"
	lic.Number = "number"
	lic.Issued = "issued"
	lic.ValidFrom = "valid_from"
	lic.ValidUntil = "valid_until"
	lic.Remarks = "remarks"

	err := db.UpdateLicenseRecord(lic)
	if err != nil {
		t.Fatal(err)
	}
}

func TestInsertLicenseRecord(t *testing.T) {
	db, mock := initDBModel(t)

	InitMock(mock, "InsertLicenseRecord")

	var lic License
	lic.UUID = "uuid"
	lic.Name = "name"
	lic.Category = "category"
	lic.Number = "number"
	lic.Issued = "issued"
	lic.ValidFrom = "valid_from"
	lic.ValidUntil = "valid_until"
	lic.Remarks = "remarks"
	lic.DocumentName = "document_name"
	lic.Document = []byte("0")

	err := db.InsertLicenseRecord(lic)
	if err != nil {
		t.Fatal(err)
	}
}

func TestDeleteLicenseRecord(t *testing.T) {
	db, mock := initDBModel(t)

	InitMock(mock, "DeleteLicenseRecord")

	err := db.DeleteLicenseRecord("uuid")
	if err != nil {
		t.Fatal(err)
	}
}
