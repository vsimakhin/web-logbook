package main

import (
	"fmt"
	"net/http"

	"github.com/alexedwards/scs/v2"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/vsimakhin/web-logbook/internal/models"
)

const (
	APIRoot                           = "/"
	APIGetApi                         = "/api/{api}"
	APILogbook                        = "/logbook"
	APILogbookUUID                    = "/logbook/{uuid}"
	APILogbookData                    = "/logbook/data"
	APILogbookNew                     = "/logbook/new"
	APILogbookSave                    = "/logbook/save"
	APILogbookDelete                  = "/logbook/delete"
	APILogbookNight                   = "/logbook/night"
	APIExport                         = "/export"
	APIExportFormat                   = "/export/{format}"
	APIExportRestoreDefaults          = "/export/restore"
	APIImport                         = "/import"
	APIImportCreateBackup             = "/import/backup/create"
	APIImportRun                      = "/import/run"
	APIAircrafts                      = "/aircrafts/"
	APIAircraftsFilter                = "/aircrafts/{filter}"
	APILogbookUUIDAttachments         = "/logbook/{uuid}/attachments"
	APILogbookAttachmentsDelete       = "/logbook/attachments/delete"
	APILogbookAttachmentsUpload       = "/logbook/attachments/upload"
	APILogbookAttachmentsDownload     = "/logbook/attachments/download/"
	APILogbookAttachmentsDownloadUUID = APILogbookAttachmentsDownload + "{uuid}"
	APILicensing                      = "/licensing"
	APILicensingData                  = "/licensing/data"
	APILicensingUUID                  = "/licensing/{uuid}"
	APILicensingNew                   = "/licensing/new"
	APILicensingSave                  = "/licensing/save"
	APILicensingDelete                = "/licensing/delete"
	APILicensingAttachmentDelete      = "/licensing/attachment/delete"
	APILicensingDownload              = "/licensing/download/"
	APILicensingDownloadUUID          = APILicensingDownload + "{uuid}"
	APISettings                       = "/settings"
	APISettingsAircraftClasses        = "/settings/classes"
	APIAirport                        = "/airport/"
	APIAirportID                      = "/airport/{id}"
	APIAirportUpdate                  = "/airport/update"
	APIAirportStandardData            = "/airport/standard/"
	APIAirportCustomData              = "/airport/custom/"
	APIAirportAddCustom               = "/airport/custom/add"
	APIAirportDeleteCustom            = "/airport/custom/delete"
	APIMap                            = "/map"
	APIMapData                        = "/map/data"
	APIStats                          = "/stats"
	APIStatsTotals                    = "/stats/totals"
	APIStatsTotalsByType              = "/stats/totals-by-type"
	APIStatsTotalsByClass             = "/stats/totals-by-class"
	APIStatsLimits                    = "/stats/limits"
	APILogin                          = "/login"
	APILogout                         = "/logout"
	APISyncAirports                   = "/sync/airports"
	APISyncDeleted                    = "/sync/deleted"
	APISyncFlightRecords              = "/sync/flightrecords"
	APISyncLicensing                  = "/sync/licensing"
	APISyncAttachmentsAll             = "/sync/attachments/all"
	APISyncAttachments                = "/sync/attachments/{uuid}"
	APISyncAttachmentsUpload          = "/sync/attachments/upload"
)

var apiMap = map[string]string{
	"Root":                           APIRoot,
	"Logbook":                        APILogbook,
	"LogbookData":                    APILogbookData,
	"LogbookUUID":                    APILogbookUUID,
	"LogbookNew":                     APILogbookNew,
	"LogbookSave":                    APILogbookSave,
	"LogbookDelete":                  APILogbookDelete,
	"LogbookNight":                   APILogbookNight,
	"Aircrafts":                      APIAircrafts,
	"AircraftsFilter":                APIAircraftsFilter,
	"LogbookUUIDAttachments":         APILogbookUUIDAttachments,
	"LogbookAttachmentsUpload":       APILogbookAttachmentsUpload,
	"LogbookAttachmentsDelete":       APILogbookAttachmentsDelete,
	"LogbookAttachmentsDownload":     APILogbookAttachmentsDownload,
	"LogbookAttachmentsDownloadUUID": APILogbookAttachmentsDownloadUUID,
	"Export":                         APIExport,
	"ExportFormat":                   APIExportFormat,
	"ExportRestoreDefaults":          APIExportRestoreDefaults,
	"Import":                         APIImport,
	"ImportCreateBackup":             APIImportCreateBackup,
	"ImportRun":                      APIImportRun,
	"Airport":                        APIAirport,
	"AirportID":                      APIAirportID,
	"AirportUpdate":                  APIAirportUpdate,
	"AirportStandardData":            APIAirportStandardData,
	"AirportCustomData":              APIAirportCustomData,
	"AirportAddCustom":               APIAirportAddCustom,
	"AirportDeleteCustom":            APIAirportDeleteCustom,
	"Settings":                       APISettings,
	"SettingsAircraftClasses":        APISettingsAircraftClasses,
	"Stats":                          APIStats,
	"StatsTotals":                    APIStatsTotals,
	"StatsTotalsByType":              APIStatsTotalsByType,
	"StatsTotalsByClass":             APIStatsTotalsByClass,
	"StatsLimits":                    APIStatsLimits,
	"Map":                            APIMap,
	"MapData":                        APIMapData,
	"Licensing":                      APILicensing,
	"LicensingData":                  APILicensingData,
	"LicensingUUID":                  APILicensingUUID,
	"LicensingNew":                   APILicensingNew,
	"LicensingDownload":              APILicensingDownload,
	"LicensingDownloadUUID":          APILicensingDownloadUUID,
	"LicensingSave":                  APILicensingSave,
	"LicensingDelete":                APILicensingDelete,
	"LicensingAttachmentDelete":      APILicensingAttachmentDelete,
	"Login":                          APILogin,
	"Logout":                         APILogout,
	"ExportFormatA4":                 exportA4,
	"ExportFormatA5":                 exportA5,
	"ExportFormatCSV":                exportCSV,
	"ExportFormatXLS":                exportXLS,
}

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

		server.Get(APISyncLicensing, app.HandlerSyncLicensingGet)
		server.Post(APISyncLicensing, app.HandlerSyncLicensingPost)

		// api
		server.Get(APIGetApi, app.HandlerGetApi)
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

func (app *application) HandlerGetApi(w http.ResponseWriter, r *http.Request) {
	api := chi.URLParam(r, "api")

	// check if api is in mapAPI
	item, ok := apiMap[api]
	if !ok {
		app.errorLog.Println("api not found")
		http.Error(w, "api not found", http.StatusNotFound)
		return
	}

	var response models.JSONResponse
	response.Data = item
	response.OK = true

	err := app.writeJSON(w, http.StatusOK, response)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot get aircrafts list - %s", err))
		return
	}
}
