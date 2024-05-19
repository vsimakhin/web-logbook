package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetAttachments(t *testing.T) {
	db, mock := initDBModel(t)

	InitMock(mock, "GetAttachments")

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

	InitMock(mock, "GetAttachmentByID")

	att, err := db.GetAttachmentByID("UUID")
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, "UUID", att.UUID)
	assert.Equal(t, "RECORDID", att.RecordID)
}

func TestInsertAttachment(t *testing.T) {
	db, mock := initDBModel(t)

	InitMock(mock, "InsertAttachment")

	att := Attachment{
		UUID:         "uuid",
		RecordID:     "record_id",
		DocumentName: "document_name",
		Document:     []byte("doc"),
	}

	err := db.InsertAttachmentRecord(att)
	if err != nil {
		t.Fatal(err)
	}
}

func TestDeleteAttachment(t *testing.T) {
	db, mock := initDBModel(t)

	InitMock(mock, "DeleteAttachment")

	err := db.DeleteAttachment("uuid")
	if err != nil {
		t.Fatal(err)
	}
}

func TestDeleteAttachmentForFlightRecord(t *testing.T) {
	db, mock := initDBModel(t)

	InitMock(mock, "GetAttachments2")
	InitMock(mock, "DeleteAttachmentsForFlightRecord")

	err := db.DeleteAttachmentsForFlightRecord("uuid")
	if err != nil {
		t.Fatal(err)
	}
}
