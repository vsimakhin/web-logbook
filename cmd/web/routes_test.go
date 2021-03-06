package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRoutes(t *testing.T) {

	app := initTestApp()

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
		APILogbookExport,
		APIAirportID,
		APIAirportUpdate,
		APISettings,
		APIStats,
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
		APIAircraftClasses,
		APIAircraftModels,
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
