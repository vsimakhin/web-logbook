package main

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

const (
	APIRoot                   = "/"
	APIExport                 = "/export"
	APIExportPDFA4Page        = "/export-pdf-a4"
	APIExportPDFA5Page        = "/export-pdf-a5"
	APIExportCSVXLSPage       = "/export-csv-xls"
	APIExportFormat           = "/export/{format}"
	APIExportRestoreDefaults  = "/export/restore"
	APIImport                 = "/import"
	APIImportCreateBackup     = "/import/backup/create"
	APIImportRun              = "/import/run"
	APIStatsTotalsByType      = "/stats/data/totals-by-type"
	APIStatsTotalsByClass     = "/stats/data/totals-by-class"
	APIStatsLimits            = "/stats/data/limits"
	APIStatsTotalsByTypePage  = "/stats-totals-by-type"
	APIStatsTotalsByClassPage = "/stats-totals-by-class"
	APIStatsLimitsPage        = "/stats-limits"
)

var apiMap = map[string]string{
	"Root":                   APIRoot,
	"Export":                 APIExport,
	"ExportPDFA4Page":        APIExportPDFA4Page,
	"ExportPDFA5Page":        APIExportPDFA5Page,
	"ExportCSVXLSPage":       APIExportCSVXLSPage,
	"ExportFormat":           APIExportFormat,
	"ExportRestoreDefaults":  APIExportRestoreDefaults,
	"Import":                 APIImport,
	"ImportCreateBackup":     APIImportCreateBackup,
	"ImportRun":              APIImportRun,
	"StatsTotalsByType":      APIStatsTotalsByType,
	"StatsTotalsByClass":     APIStatsTotalsByClass,
	"StatsLimits":            APIStatsLimits,
	"StatsTotalsByTypePage":  APIStatsTotalsByTypePage,
	"StatsTotalsByClassPage": APIStatsTotalsByClassPage,
	"StatsLimitsPage":        APIStatsLimitsPage,
	"ExportFormatA4":         exportA4,
	"ExportFormatA5":         exportA5,
	"ExportFormatXLS":        exportXLS,
}

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
			r.Put("/airports", app.HandlerApiSettingsAirports)
		})

		// airports
		r.Route("/airport", func(r chi.Router) {
			r.With(middleware.Compress(5)).Get("/standard-list", app.HandlerApiStandardAirportList)
			r.With(middleware.Compress(5)).Get("/custom-list", app.HandlerApiCustomAirportList)
			r.With(middleware.Compress(5)).Get("/list", app.HandlerApiAirportList)
			r.Post("/custom", app.HandlerApiAirportCustomNew)
			r.Put("/custom", app.HandlerApiAirportCustomUpdate)
			r.Delete("/custom", app.HandlerApiAirportCustomDelete)
			r.Get("/{id}", app.HandlerApiAirportByID)
			r.Post("/update-db", app.HandlerApiAirportDBUpdate)
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
		r.Post(APIExportFormat, app.HandlerExportSettingsSave)
		r.Post(APIExportRestoreDefaults, app.HandlerExportRestoreDefaults)

		// import
		r.Post(APIImportCreateBackup, app.HandlerImportCreateBackup)
		r.Post(APIImportRun, app.HandlerImportRun)

		// stats
		r.Get(APIStatsTotalsByType, app.HandlerStatsTotalsByType)
		r.Get(APIStatsTotalsByClass, app.HandlerStatsTotalsByClass)
		r.Get(APIStatsLimits, app.HandlerStatsLimits)
		r.Get(APIStatsLimitsPage, app.HandlerStatsLimitsPage)
	})

	r.Handle("/*", middleware.Compress(5)(app.HandlerUI()))

	return r
}
