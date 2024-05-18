package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRoutes(t *testing.T) {

	app, _ := initTestApplication()

	routes := []string{
		APIRoot,
		APILogbook,
		APILogbookData,
		APILogbookUUID,
		APILogbookNew,
		APILogbookSave,
		APILogbookDelete,
		APILogbookNight,
		APILogbookUUIDAttachments,
		APILogbookAttachmentsUpload,
		APILogbookAttachmentsDelete,
		APILogbookAttachmentsDownloadUUID,
		APIAirportID,
		APIAirportUpdate,
		APISettings,
		APIMap,
		APIMapData,
		APILicensing,
		APILicensingData,
		APILicensingUUID,
		APILicensingNew,
		APILicensingDownloadUUID,
		APILicensingSave,
		APILicensingDelete,
		APILicensingAttachmentDelete,
		APISettingsAircraftClasses,
		APILogin,
		APILogout,
		"/static/*",
		"/favicon.ico",
		"/*",
	}

	server := app.routes()

	for _, i := range server.Routes() {
		assert.Contains(t, routes, i.Pattern)
	}
}
