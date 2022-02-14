package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRoutes(t *testing.T) {

	app := initTestApp()

	routes := []string{
		"/",
		"/logbook",
		"/logbook/data",
		"/logbook/{uuid}",
		"/logbook/new",
		APILogbookSave,
		APILogbookDelete,
		APILogbookNight,
		"/logbook/{uuid}/attachments",
		APILogbookAttachmentsUpload,
		APILogbookAttachmentsDelete,
		"/logbook/attachments/download/{uuid}",
		"/logbook/export",
		"/airport/{id}",
		APIAirportUpdate,
		APISettings,
		"/stats",
		"/map",
		"/map/lines",
		"/map/markers",
		"/licensing",
		"/licensing/data",
		"/licensing/{uuid}",
		"/licensing/new",
		"/licensing/download/{uuid}",
		APILicensingSave,
		APILicensingDelete,
		APILicensingAttachmentDelete,
		"/static/*",
		"/favicon.ico",
	}

	server := app.routes()

	for _, i := range server.Routes() {
		assert.Contains(t, routes, i.Pattern)
	}
}
