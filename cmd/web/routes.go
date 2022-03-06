package main

import (
	"github.com/go-chi/chi/v5"
)

const APIRoot = "/"

const APILogbook = "/logbook"
const APILogbookUUID = "/logbook/{uuid}"
const APILogbookData = "/logbook/data"

const APILogbookNew = "/logbook/new"
const APILogbookSave = "/logbook/save"
const APILogbookDelete = "/logbook/delete"

const APILogbookNight = "/logbook/night"
const APILogbookExport = "/logbook/export"

const APIAircraftModels = "/aircraft/models"
const APIAircraftClasses = "/aircraft/classes"

const APILogbookUUIDAttachments = "/logbook/{uuid}/attachments"
const APILogbookAttachmentsDelete = "/logbook/attachments/delete"
const APILogbookAttachmentsUpload = "/logbook/attachments/upload"
const APILogbookAttachmentsDownload = "/logbook/attachments/download/"
const APILogbookAttachmentsDownloadUUID = APILogbookAttachmentsDownload + "{uuid}"

const APILicensing = "/licensing"
const APILicensingData = "/licensing/data"
const APILicensingUUID = "/licensing/{uuid}"
const APILicensingNew = "/licensing/new"
const APILicensingSave = "/licensing/save"
const APILicensingDelete = "/licensing/delete"
const APILicensingAttachmentDelete = "/licensing/attachment/delete"
const APILicensingDownload = "/licensing/download/"
const APILicensingDownloadUUID = APILicensingDownload + "{uuid}"

const APISettings = "/settings"
const APIAirport = "/airport/"
const APIAirportID = APIAirport + "{id}"
const APIAirportUpdate = "/airport/update"

const APIMap = "/map"
const APIMapData = "/map/data"

const APIStats = "/stats"

func (app *application) routes() *chi.Mux {
	server := chi.NewRouter()

	// logbook
	server.Get(APIRoot, app.HandlerLogbook)
	server.Get(APILogbook, app.HandlerLogbook)
	server.Get(APILogbookData, app.HandlerFlightRecordsData)

	server.Get(APILogbookUUID, app.HandlerFlightRecordByID)
	server.Get(APILogbookNew, app.HandlerFlightRecordNew)

	server.Post(APILogbookSave, app.HandlerFlightRecordSave)
	server.Post(APILogbookDelete, app.HandlerFlightRecordDelete)

	server.Post(APILogbookNight, app.HandlerNightTime)

	server.Get(APILogbookUUIDAttachments, app.HandlerGetAttachments)
	server.Post(APILogbookAttachmentsUpload, app.HandlerUploadAttachment)
	server.Post(APILogbookAttachmentsDelete, app.HandlerDeleteAttachment)
	server.Get(APILogbookAttachmentsDownloadUUID, app.HandlerAttachmentDownload)

	// export
	server.Get(APILogbookExport, app.HandlerExportLogbook)

	// airports
	server.Get(APIAirportID, app.HandlerAirportByID)
	server.Get(APIAirportUpdate, app.HandlerAirportUpdate)

	// aircrafts
	server.Get(APIAircraftModels, app.HandlerAircraftModels)
	server.Get(APIAircraftClasses, app.HandlerAircraftClasses)

	// settings
	server.Get(APISettings, app.HandlerSettings)
	server.Post(APISettings, app.HandlerSettingsSave)

	// stats
	server.Get(APIStats, app.HandlerStats)

	// map
	server.Get(APIMap, app.HandlerMap)
	server.Get(APIMapData, app.HandlerMapData)

	// documents
	server.Get(APILicensing, app.HandlerLicensing)
	server.Get(APILicensingData, app.HandlerLicensingRecordsData)
	server.Get(APILicensingUUID, app.HandlerLicensingRecordByID)
	server.Get(APILicensingNew, app.HandlerLicensingRecordNew)
	server.Get(APILicensingDownloadUUID, app.HandlerLicensingDownload)

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
