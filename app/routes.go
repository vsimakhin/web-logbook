package main

import (
	"github.com/alexedwards/scs/v2"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

const (
	APIRoot                       = "/"
	APIPreferences                = "/preferences"
	APILogbook                    = "/logbook"
	APIExport                     = "/export"
	APIExportPDFA4Page            = "/export-pdf-a4"
	APIExportPDFA5Page            = "/export-pdf-a5"
	APIExportCSVXLSPage           = "/export-csv-xls"
	APIExportFormat               = "/export/{format}"
	APIExportRestoreDefaults      = "/export/restore"
	APIImport                     = "/import"
	APIImportCreateBackup         = "/import/backup/create"
	APIImportRun                  = "/import/run"
	APIAircrafts                  = "/aircrafts/"
	APIAircraftsFilter            = "/aircrafts/{filter}"
	APISettings                   = "/settings"
	APISettingsAirportDB          = "/settings-airportdb"
	APISettingsAircraftClasses    = "/settings/classes"
	APIAirport                    = "/airport/"
	APIAirportID                  = "/airport/{id}"
	APIAirportUpdate              = "/airport/update"
	APIAirportStandardData        = "/airport/standard/"
	APIAirportCustomData          = "/airport/custom/"
	APIAirportAddCustom           = "/airport/custom/add"
	APIAirportDeleteCustom        = "/airport/custom/delete"
	APIMap                        = "/map"
	APIMapData                    = "/map/data"
	APIStatsTotals                = "/stats/data/totals"
	APIStatsTotalsByType          = "/stats/data/totals-by-type"
	APIStatsTotalsByClass         = "/stats/data/totals-by-class"
	APIStatsLimits                = "/stats/data/limits"
	APIStatsTotalsPage            = "/stats-totals"
	APIStatsTotalsByYearPage      = "/stats-totals-by-year"
	APIStatsTotalsByMonthPage     = "/stats-totals-by-month"
	APIStatsTotalsByMonthYearPage = "/stats-totals-by-month/{year}"
	APIStatsTotalsByTypePage      = "/stats-totals-by-type"
	APIStatsTotalsByClassPage     = "/stats-totals-by-class"
	APIStatsLimitsPage            = "/stats-limits"
	APILogin                      = "/login"
	APILogout                     = "/logout"
)

var apiMap = map[string]string{
	"Root":                       APIRoot,
	"Preferences":                APIPreferences,
	"Logbook":                    APILogbook,
	"Aircrafts":                  APIAircrafts,
	"AircraftsFilter":            APIAircraftsFilter,
	"Export":                     APIExport,
	"ExportPDFA4Page":            APIExportPDFA4Page,
	"ExportPDFA5Page":            APIExportPDFA5Page,
	"ExportCSVXLSPage":           APIExportCSVXLSPage,
	"ExportFormat":               APIExportFormat,
	"ExportRestoreDefaults":      APIExportRestoreDefaults,
	"Import":                     APIImport,
	"ImportCreateBackup":         APIImportCreateBackup,
	"ImportRun":                  APIImportRun,
	"Airport":                    APIAirport,
	"AirportID":                  APIAirportID,
	"AirportUpdate":              APIAirportUpdate,
	"AirportStandardData":        APIAirportStandardData,
	"AirportCustomData":          APIAirportCustomData,
	"AirportAddCustom":           APIAirportAddCustom,
	"AirportDeleteCustom":        APIAirportDeleteCustom,
	"Settings":                   APISettings,
	"SettingsAirportDB":          APISettingsAirportDB,
	"SettingsAircraftClasses":    APISettingsAircraftClasses,
	"StatsTotals":                APIStatsTotals,
	"StatsTotalsByType":          APIStatsTotalsByType,
	"StatsTotalsByClass":         APIStatsTotalsByClass,
	"StatsLimits":                APIStatsLimits,
	"StatsTotalsPage":            APIStatsTotalsPage,
	"StatsTotalsByYearPage":      APIStatsTotalsByYearPage,
	"StatsTotalsByMonthPage":     APIStatsTotalsByMonthPage,
	"StatsTotalsByMonthYearPage": APIStatsTotalsByMonthYearPage,
	"StatsTotalsByTypePage":      APIStatsTotalsByTypePage,
	"StatsTotalsByClassPage":     APIStatsTotalsByClassPage,
	"StatsLimitsPage":            APIStatsLimitsPage,
	"Map":                        APIMap,
	"MapData":                    APIMapData,
	"Login":                      APILogin,
	"Logout":                     APILogout,
	"ExportFormatA4":             exportA4,
	"ExportFormatA5":             exportA5,
	"ExportFormatXLS":            exportXLS,
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

	r.Post("/api/login", app.HandlerLogin) // to review

	r.Route("/api", func(r chi.Router) {
		r.Use(app.Auth) // to review

		// logout
		r.Post("/logout", app.HandlerLogout)

		// logbook
		r.Route("/logbook", func(r chi.Router) {
			r.With(middleware.Compress(5)).Get("/data", app.HandlerApiLogbookData)
			r.Get("/{uuid}", app.HandlerApiFlightRecordByID)
			r.Delete("/{uuid}", app.HandlerApiFlightRecordDelete)
			r.Post("/new", app.HandlerApiFlightRecordNew)
			r.Put("/{uuid}", app.HandlerApiFlightRecordUpdate)
			r.Post("/night", app.HandlerNightTime)
		})

		// licensing
		r.Route("/licensing", func(r chi.Router) {
			r.Get("/list", app.HandlerApiGetLicensingRecords)
			r.Get("/categories", app.HandlerApiGetLicensingCategories)
			r.With(middleware.Compress(5)).Get("/{uuid}", app.HandlerApiGetLicensingRecord)
			r.Post("/new", app.HandlerApiNewLicensingRecord)
			r.Put("/{uuid}", app.HandlerApiUpdateLicensingRecord)
			r.Delete("/{uuid}", app.HandlerApiDeleteLicensingRecord)
			r.Delete("/{uuid}/attachment", app.HandlerApiDeleteLicensingAttachment)
		})

		// attachments
		r.Route("/attachment", func(r chi.Router) {
			r.Get("/list/{uuid}", app.HandlerApiGetAttachments)
			r.With(middleware.Compress(5)).Get("/{uuid}", app.HandlerApiGetAttachment)
			r.Delete("/{uuid}", app.HandlerApiDeleteAttachment)
			r.Post("/upload", app.HandlerApiUploadAttachment)
		})

		// aircrafts
		r.Route("/aircraft", func(r chi.Router) {
			r.Get("/list", app.HandlerApiAircraftList)
			r.Get("/models", app.HandlerApiAircraftModels)
			r.Get("/models-categories", app.HandlerApiAircraftModelsCategoriesList)
			r.Put("/models-categories", app.HandlerApiAircraftModelsCategoriesUpdate)
			r.Get("/categories", app.HandlerApiAircraftCategoriesList)
			r.Get("/logbook", app.HandlerAircrafts)
			r.Get("/logbook/{filter}", app.HandlerAircrafts)
		})

		// settings
		r.Route("/settings", func(r chi.Router) {
			r.Get("/list", app.HandlerApiSettingsList)
			r.Put("/general", app.HandlerApiSettingsUpdate)
			r.Put("/signature", app.HandlerApiSettingsSignature)
		})

		// airports
		r.Route("/airport", func(r chi.Router) {
			r.Get("/{id}", app.HandlerAirportByID)
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

		// api & parameters
		r.Get(APIPreferences, app.HandlerPreferences)
	})

	r.Handle("/*", middleware.Compress(5)(app.HandlerUI()))

	return r
}
