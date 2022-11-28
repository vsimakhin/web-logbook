package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetLicenses(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetLicenses")

	lics, err := db.GetLicenses()
	if err != nil {
		t.Fatal(err)
	}

	for _, lic := range lics {
		assert.Equal(t, lic.UUID, "uuid")
		assert.Equal(t, lic.Category, "category")
		assert.Equal(t, lic.DocumentName, "document_name")
	}
}

func TestGetLicenseRecordByID(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetLicenseRecordByID")

	lic, err := db.GetLicenseRecordByID("uuid")
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, lic.UUID, "uuid")
}

func TestGetLicensesCategory(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetLicensesCategory")

	cats, err := db.GetLicensesCategory()
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, cats[0], "category")
}

func TestUpdateLicenseRecord(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "UpdateLicenseRecord")

	var lic License
	lic.UUID = "uuid"
	lic.Category = "category"

	err := db.UpdateLicenseRecord(lic)
	if err != nil {
		t.Fatal(err)
	}
}

func TestInsertLicenseRecord(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "InsertLicenseRecord")

	var lic License
	lic.UUID = "uuid"
	lic.Category = "category"

	err := db.InsertLicenseRecord(lic)
	if err != nil {
		t.Fatal(err)
	}
}

func TestDeleteLicenseRecord(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "DeleteLicenseRecord")

	err := db.DeleteLicenseRecord("uuid")
	if err != nil {
		t.Fatal(err)
	}
}

func TestDeleteLicenseAttachment(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "DeleteLicenseAttachment")

	err := db.DeleteLicenseAttachment("uuid")
	if err != nil {
		t.Fatal(err)
	}
}
