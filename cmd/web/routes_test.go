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
		"/logbook/save",
		"/logbook/delete",
		"/logbook/night",
		"/logbook/{uuid}/attachments",
		"/logbook/attachments/upload",
		"/logbook/attachments/delete",
		"/logbook/attachments/download/{uuid}",
		"/logbook/export",
		"/airport/{id}",
		"/airport/update",
		"/settings",
		"/stats",
		"/map",
		"/map/lines",
		"/map/markers",
		"/licensing",
		"/licensing/data",
		"/licensing/{uuid}",
		"/licensing/new",
		"/licensing/download/{uuid}",
		"/licensing/save",
		"/licensing/delete",
		"/static/*",
		"/favicon.ico",
	}

	server := app.routes()

	for _, i := range server.Routes() {
		assert.Contains(t, routes, i.Pattern)
	}
}
