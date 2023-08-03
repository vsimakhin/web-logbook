package main

import (
	"net/http"

	"github.com/alexedwards/scs/v2"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

const APIRoot = "/"

const APILogbook = "/logbook"
const APILogbookUUID = "/logbook/{uuid}"
const APILogbookData = "/logbook/data"

const APILogbookNew = "/logbook/new"
const APILogbookSave = "/logbook/save"
const APILogbookDelete = "/logbook/delete"

const APILogbookNight = "/logbook/night"

const APIExport = "/export"
const APIExportFormat = "/export/{format}"
const APIExportRestoreDefaults = "/export/restore"

const APIImport = "/import"
const APIImportCreateBackup = "/import/backup/create"
const APIImportRun = "/import/run"

const APIAircrafts = "/aircrafts/"
const APIAircraftsFilter = "/aircrafts/{filter}"

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
const APISettingsAircraftClasses = "/settings/classes"

const APIAirport = "/airport/"
const APIAirportID = "/airport/{id}"
const APIAirportUpdate = "/airport/update"
const APIAirportStandardData = "/airport/standard/"
const APIAirportCustomData = "/airport/custom/"
const APIAirportAddCustom = "/airport/custom/add"
const APIAirportDeleteCustom = "/airport/custom/delete"

const APIMap = "/map"
const APIMapData = "/map/data"

const APIStats = "/stats"
const APIStatsTotals = "/stats/totals"
const APIStatsTotalsByType = "/stats/totals-by-type"
const APIStatsTotalsByClass = "/stats/totals-by-class"
const APIStatsLimits = "/stats/limits"

const APILogin = "/login"
const APILogout = "/logout"

const APISyncAirports = "/sync/airports"
const APISyncDeleted = "/sync/deleted"
const APISyncFlightRecords = "/sync/flightrecords"
const APISyncAttachmentsAll = "/sync/attachments/all"
const APISyncAttachments = "/sync/attachments/{uuid}"
const APISyncAttachmentsUpload = "/sync/attachments/upload"

var session *scs.SessionManager

func (app *application) routes() *chi.Mux {
	server := chi.NewRouter()

	if app.config.env == "dev" {
		server.Use(middleware.Logger)
	}

	server.Use(SessionLoad)

	server.Route("/", func(server chi.Router) {
		server.Use(app.Auth)

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
		server.Get(APIExport, app.HandlerExport)
		server.Get(APIExportFormat, app.HandlerExportLogbook)
		server.Post(APIExportFormat, app.HandlerExportSettingsSave)
		server.Post(APIExportRestoreDefaults, app.HandlerExportRestoreDefaults)

		// import
		server.Get(APIImport, app.HandlerImport)
		server.Post(APIImportCreateBackup, app.HandlerImportCreateBackup)
		server.Post(APIImportRun, app.HandlerImportRun)

		// airports
		server.Get(APIAirportID, app.HandlerAirportByID)
		server.Get(APIAirportUpdate, app.HandlerAirportUpdate)
		server.Get(APIAirportStandardData, app.HandlerAirportDBData)
		server.Get(APIAirportCustomData, app.HandlerAirportCustomData)
		server.Post(APIAirportAddCustom, app.HandlerAirportAddCustom)
		server.Post(APIAirportDeleteCustom, app.HandlerAirportDeleteCustom)

		// aircrafts
		server.Get(APISettingsAircraftClasses, app.HandlerSettingsAircraftClasses)
		server.Get(APIAircrafts, app.HandlerAircrafts)
		server.Get(APIAircraftsFilter, app.HandlerAircrafts)

		// settings
		server.Get(APISettings, app.HandlerSettings)
		server.Post(APISettings, app.HandlerSettingsSave)

		// stats
		server.Get(APIStats, app.HandlerStats)
		server.Get(APIStatsTotals, app.HandlerStatsTotals)
		server.Get(APIStatsTotalsByType, app.HandlerStatsTotalsByType)
		server.Get(APIStatsTotalsByClass, app.HandlerStatsTotalsByClass)
		server.Get(APIStatsLimits, app.HandlerStatsLimits)

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

		// sync
		server.Get(APISyncAirports, app.HandlerSyncAirports)

		server.Get(APISyncDeleted, app.HandlerSyncDeletedGet)
		server.Post(APISyncDeleted, app.HandlerSyncDeletedPost)

		server.Get(APISyncFlightRecords, app.HandlerSyncFlightRecordsGet)
		server.Post(APISyncFlightRecords, app.HandlerSyncFlightRecordsPost)

		server.Get(APISyncAttachmentsAll, app.HandlerSyncAttachmentsAll)
		server.Get(APISyncAttachments, app.HandlerSyncAttachments)
		server.Post(APISyncAttachmentsUpload, app.HandlerSyncAttachmentsUpload)

	})

	// login & logout
	server.Get(APILogin, app.HandlerLogin)
	server.Post(APILogin, app.HandlerLoginPost)
	server.Get(APILogout, app.HandlerLogout)

	// other stuff
	server.Handle("/static/*", middleware.SetHeader("Cache-Control", "private, max-age=3600, must-revalidate")(app.HandlerStatic()))
	server.HandleFunc("/favicon.ico", app.HandlerFavicon)
	server.NotFound(app.HandlerNotFound)
	server.MethodNotAllowed(app.HandlerNotAllowed)

	return server
}

// SessionLoad peforms the load and save of a session, per request
func SessionLoad(next http.Handler) http.Handler {
	return session.LoadAndSave(next)
}
