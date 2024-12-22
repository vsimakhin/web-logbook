package main

import (
	"net/http"

	"github.com/alexedwards/scs/v2"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

const (
	APIRoot                           = "/"
	APIPreferences                    = "/preferences"
	APILogbook                        = "/logbook"
	APILogbookUUID                    = "/logbook/{uuid}"
	APILogbookData                    = "/logbook/data"
	APILogbookNew                     = "/logbook/new"
	APILogbookSave                    = "/logbook/save"
	APILogbookDelete                  = "/logbook/delete"
	APILogbookNight                   = "/logbook/night"
	APIExport                         = "/export"
	APIExportPDFA4Page                = "/export-pdf-a4"
	APIExportPDFA5Page                = "/export-pdf-a5"
	APIExportCSVXLSPage               = "/export-csv-xls"
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
	APISettingsAirportDB              = "/settings-airportdb"
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
	APIStatsTotals                    = "/stats/data/totals"
	APIStatsTotalsByType              = "/stats/data/totals-by-type"
	APIStatsTotalsByClass             = "/stats/data/totals-by-class"
	APIStatsLimits                    = "/stats/data/limits"
	APIStatsTotalsPage                = "/stats-totals"
	APIStatsTotalsByYearPage          = "/stats-totals-by-year"
	APIStatsTotalsByMonthPage         = "/stats-totals-by-month"
	APIStatsTotalsByMonthYearPage     = "/stats-totals-by-month/{year}"
	APIStatsTotalsByTypePage          = "/stats-totals-by-type"
	APIStatsTotalsByClassPage         = "/stats-totals-by-class"
	APIStatsLimitsPage                = "/stats-limits"
	APILogin                          = "/login"
	APILogout                         = "/logout"
)

var apiMap = map[string]string{
	"Root":                           APIRoot,
	"Preferences":                    APIPreferences,
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
	"ExportPDFA4Page":                APIExportPDFA4Page,
	"ExportPDFA5Page":                APIExportPDFA5Page,
	"ExportCSVXLSPage":               APIExportCSVXLSPage,
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
	"SettingsAirportDB":              APISettingsAirportDB,
	"SettingsAircraftClasses":        APISettingsAircraftClasses,
	"StatsTotals":                    APIStatsTotals,
	"StatsTotalsByType":              APIStatsTotalsByType,
	"StatsTotalsByClass":             APIStatsTotalsByClass,
	"StatsLimits":                    APIStatsLimits,
	"StatsTotalsPage":                APIStatsTotalsPage,
	"StatsTotalsByYearPage":          APIStatsTotalsByYearPage,
	"StatsTotalsByMonthPage":         APIStatsTotalsByMonthPage,
	"StatsTotalsByMonthYearPage":     APIStatsTotalsByMonthYearPage,
	"StatsTotalsByTypePage":          APIStatsTotalsByTypePage,
	"StatsTotalsByClassPage":         APIStatsTotalsByClassPage,
	"StatsLimitsPage":                APIStatsLimitsPage,
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
	r := chi.NewRouter()

	if app.config.env == "dev" {
		r.Use(middleware.Logger)
	}

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(SessionLoad) // to review

	r.Post("/api/login", app.HandlerLogin) // to review

	r.Route("/api", func(r chi.Router) {
		r.Use(app.Auth) // to review

		// logbook
		r.Route("/logbook", func(r chi.Router) {
			r.With(middleware.Compress(5)).Get("/data", app.HandlerApiLogbookData)
		})

		// export
		r.Route("/export", func(r chi.Router) {
			r.Get("/{format}", app.HandlerExportLogbook)
		})

		// logout
		r.Post("/logout", app.HandlerLogout) // to review
	})

	r.Route("/", func(r chi.Router) {
		r.Use(app.Auth)

		// logbook
		// r.Get(APIRoot, app.HandlerLogbook)
		// r.Get(APILogbook, app.HandlerLogbook)
		// r.Get(APILogbookData, app.HandlerFlightRecordsData)
		r.Get(APILogbookUUID, app.HandlerFlightRecordByID)
		r.Get(APILogbookNew, app.HandlerFlightRecordNew)

		r.Post(APILogbookSave, app.HandlerFlightRecordSave)
		r.Post(APILogbookDelete, app.HandlerFlightRecordDelete)

		r.Post(APILogbookNight, app.HandlerNightTime)

		r.Get(APILogbookUUIDAttachments, app.HandlerGetAttachments)
		r.Post(APILogbookAttachmentsUpload, app.HandlerUploadAttachment)
		r.Post(APILogbookAttachmentsDelete, app.HandlerDeleteAttachment)
		r.Get(APILogbookAttachmentsDownloadUUID, app.HandlerAttachmentDownload)

		// export
		r.Get(APIExportPDFA4Page, app.HandlerExportPDFA4Page)
		r.Get(APIExportPDFA5Page, app.HandlerExportPDFA5Page)
		r.Get(APIExportCSVXLSPage, app.HandlerExportCSVXLSPage)

		// r.Get(APIExportFormat, app.HandlerExportLogbook)
		r.Post(APIExportFormat, app.HandlerExportSettingsSave)
		r.Post(APIExportRestoreDefaults, app.HandlerExportRestoreDefaults)

		// import
		r.Get(APIImport, app.HandlerImport)
		r.Post(APIImportCreateBackup, app.HandlerImportCreateBackup)
		r.Post(APIImportRun, app.HandlerImportRun)

		// airports
		r.Get(APIAirportID, app.HandlerAirportByID)
		r.Get(APIAirportUpdate, app.HandlerAirportUpdate)
		r.Get(APIAirportStandardData, app.HandlerAirportDBData)
		r.Get(APIAirportCustomData, app.HandlerAirportCustomData)
		r.Post(APIAirportAddCustom, app.HandlerAirportAddCustom)
		r.Post(APIAirportDeleteCustom, app.HandlerAirportDeleteCustom)

		// aircrafts
		r.Get(APISettingsAircraftClasses, app.HandlerSettingsAircraftClasses)
		r.Get(APIAircrafts, app.HandlerAircrafts)
		r.Get(APIAircraftsFilter, app.HandlerAircrafts)

		// settings
		r.Get(APISettings, app.HandlerSettings)
		r.Post(APISettings, app.HandlerSettingsSave)
		r.Get(APISettingsAirportDB, app.HandlerSettingsAirportDB)
		r.Post(APISettingsAirportDB, app.HandlerSettingsAirportDBSave)

		// stats
		r.Get(APIStatsTotals, app.HandlerStatsTotals)
		r.Get(APIStatsTotalsByType, app.HandlerStatsTotalsByType)
		r.Get(APIStatsTotalsByClass, app.HandlerStatsTotalsByClass)
		r.Get(APIStatsLimits, app.HandlerStatsLimits)

		r.Get(APIStatsTotalsPage, app.HandlerStatsTotalsPage)
		r.Get(APIStatsTotalsByYearPage, app.HandlerStatsTotalsByYearPage)
		r.Get(APIStatsTotalsByMonthPage, app.HandlerStatsTotalsByMonthPage)
		r.Get(APIStatsTotalsByMonthYearPage, app.HandlerStatsTotalsByMonthPage)
		r.Get(APIStatsTotalsByTypePage, app.HandlerStatsTotalsByTypePage)
		r.Get(APIStatsTotalsByClassPage, app.HandlerStatsTotalsByClassPage)
		r.Get(APIStatsLimitsPage, app.HandlerStatsLimitsPage)

		// map
		r.Get(APIMap, app.HandlerMap)
		r.Get(APIMapData, app.HandlerMapData)

		// documents
		r.Get(APILicensing, app.HandlerLicensing)
		r.Get(APILicensingData, app.HandlerLicensingRecordsData)
		r.Get(APILicensingUUID, app.HandlerLicensingRecordByID)
		r.Get(APILicensingNew, app.HandlerLicensingRecordNew)
		r.Get(APILicensingDownloadUUID, app.HandlerLicensingDownload)

		r.Post(APILicensingSave, app.HandlerLicensingRecordSave)
		r.Post(APILicensingDelete, app.HandlerLicensingRecordDelete)
		r.Post(APILicensingAttachmentDelete, app.HandlerLicensingDeleteAttachment)

		// api & parameters
		r.Get(APIPreferences, app.HandlerPreferences)
	})

	// login & logout
	r.Get(APILogin, app.HandlerLogin)
	r.Post(APILogin, app.HandlerLoginPost)
	r.Get(APILogout, app.HandlerLogout)

	// other stuff
	if app.config.env == "dev" {
		r.Handle("/static/*", app.HandlerStatic())
	} else {
		r.Handle("/static/*", middleware.SetHeader("Cache-Control", "private, max-age=3600, must-revalidate")(app.HandlerStatic()))
	}
	r.HandleFunc("/favicon.ico", app.HandlerFavicon)
	r.NotFound(app.HandlerNotFound)
	r.MethodNotAllowed(app.HandlerNotAllowed)

	r.Handle("/*", middleware.Compress(5)(app.HandlerUI()))

	return r
}

// SessionLoad peforms the load and save of a session, per request
func SessionLoad(next http.Handler) http.Handler {
	return session.LoadAndSave(next)
}
