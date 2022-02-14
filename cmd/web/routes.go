package main

import (
	"github.com/go-chi/chi/v5"
)

const APILicensingSave = "/licensing/save"
const APILicensingDelete = "/licensing/delete"
const APILicensingAttachmentDelete = "/licensing/attachment/delete"
const APISettings = "/settings"
const APIAirportUpdate = "/airport/update"
const APILogbookSave = "/logbook/save"
const APILogbookDelete = "/logbook/delete"
const APILogbookNight = "/logbook/night"
const APILogbookAttachmentsDelete = "/logbook/attachments/delete"
const APILogbookAttachmentsUpload = "/logbook/attachments/upload"

func (app *application) routes() *chi.Mux {
	server := chi.NewRouter()

	// logbook
	server.Get("/", app.HandlerLogbook)
	server.Get("/logbook", app.HandlerLogbook)
	server.Get("/logbook/data", app.HandlerFlightRecordsData)

	server.Get("/logbook/{uuid}", app.HandlerFlightRecordByID)
	server.Get("/logbook/new", app.HandlerFlightRecordNew)

	server.Post(APILogbookSave, app.HandlerFlightRecordSave)
	server.Post(APILogbookDelete, app.HandlerFlightRecordDelete)

	server.Post(APILogbookNight, app.HandlerNightTime)

	server.Get("/logbook/{uuid}/attachments", app.HandlerGetAttachments)
	server.Post(APILogbookAttachmentsUpload, app.HandlerUploadAttachment)
	server.Post(APILogbookAttachmentsDelete, app.HandlerDeleteAttachment)
	server.Get("/logbook/attachments/download/{uuid}", app.HandlerAttachmentDownload)

	// export
	server.Get("/logbook/export", app.HandlerExportLogbook)

	// airports
	server.Get("/airport/{id}", app.HandlerAirportByID)
	server.Get(APIAirportUpdate, app.HandlerAirportUpdate)

	// settings
	server.Get(APISettings, app.HandlerSettings)
	server.Post(APISettings, app.HandlerSettingsSave)

	// stats
	server.Get("/stats", app.HandlerStats)

	// map
	server.Get("/map", app.HandlerMap)
	server.Get("/map/lines", app.HandlerMapLines)
	server.Get("/map/markers", app.HandlerMapMarkers)

	// documents
	server.Get("/licensing", app.HandlerLicensing)
	server.Get("/licensing/data", app.HandlerLicensingRecordsData)
	server.Get("/licensing/{uuid}", app.HandlerLicensingRecordByID)
	server.Get("/licensing/new", app.HandlerLicensingRecordNew)
	server.Get("/licensing/download/{uuid}", app.HandlerLicensingDownload)

	server.Post(APILicensingSave, app.HandlerLicensingRecordSave)
	server.Post(APILicensingDelete, app.HandlerLicensingRecordDelete)
	server.Post(APILicensingAttachmentDelete, app.HandlerLicensingDeleteAttachment)

	// other stuff
	server.Handle("/static/*", app.HandlerStatic())
	server.HandleFunc("/favicon.ico", app.HandlerFavicon)
	server.NotFound(app.HandlerNotFound)
	server.MethodNotAllowed(app.HandlerNotAllowed)

	return server
}
