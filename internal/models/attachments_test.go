package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetAttachments(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetAttachments")

	atts, err := db.GetAttachments("RECORDID")
	if err != nil {
		t.Fatal(err)
	}

	for _, att := range atts {
		assert.Equal(t, "UUID", att.UUID)
		assert.Equal(t, "RECORDID", att.RecordID)
	}
}

func TestGetAttachmentByID(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetAttachmentByID")

	att, err := db.GetAttachmentByID("UUID")
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, "UUID", att.UUID)
	assert.Equal(t, "RECORDID", att.RecordID)
}

func TestInsertAttachment(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "InsertAttachment")

	att := Attachment{
		UUID:         "UUID",
		RecordID:     "RECORDID",
		DocumentName: "DOCUMENT_NAME",
		Document:     []byte("DOC"),
	}

	err := db.InsertAttachmentRecord(att)
	if err != nil {
		t.Fatal(err)
	}
}

func TestDeleteAttachment(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "DeleteAttachment")
	AddMock(mock, "InsertDeletedItem")

	err := db.DeleteAttachment("UUID")
	if err != nil {
		t.Fatal(err)
	}
}

func TestDeleteAttachmentForFlightRecord(t *testing.T) {
	db, mock := initDBModel(t)

	AddMock(mock, "GetAttachments2")
	AddMock(mock, "DeleteAttachmentsForFlightRecord")

	err := db.DeleteAttachmentsForFlightRecord("UUID")
	if err != nil {
		t.Fatal(err)
	}
}
