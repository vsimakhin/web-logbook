package main

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

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

	r.Post("/api/login", app.HandlerLogin)

	r.Route("/api", func(r chi.Router) {
		r.Use(app.Auth)

		// logout
		r.Post("/logout", app.HandlerLogout)

		// logbook
		r.Route("/logbook", func(r chi.Router) {
			r.With(middleware.Compress(5)).Get("/data", app.HandlerApiLogbookData)
			r.With(middleware.Compress(5)).Get("/mapdata", app.HandlerApiLogbookMapData)
			r.Get("/{uuid}", app.HandlerApiFlightRecordByID)
			r.Delete("/{uuid}", app.HandlerApiFlightRecordDelete)
			r.Post("/new", app.HandlerApiFlightRecordNew)
			r.Put("/{uuid}", app.HandlerApiFlightRecordUpdate)
			r.Post("/night", app.HandlerNightTime)

			// track log
			r.Route("/track", func(r chi.Router) {
				r.Post("/{uuid}", app.HandlerApiTrackLogNew)
				r.Delete("/{uuid}", app.HandlerApiTrackLogReset)
			})
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
			r.Get("/export/defaults/{format}", app.HandlerApiSettingsExportDefaults)
			r.Put("/export/{format}", app.HandlerApiSettingsExportUpdate)
			r.Get("/standard-fields", app.HandlerApiSettingsFieldsDefaults)
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

		r.Route("/person", func(r chi.Router) {
			r.With(middleware.Compress(5)).Get("/list", app.HandlerApiPersonList)
			r.Get("/{uuid}", app.HandlerApiPersonByID)
			r.Delete("/{uuid}", app.HandlerApiPersonDelete)
			r.Post("/", app.HandlerApiPersonNew)
			r.Put("/", app.HandlerApiPersonUpdate)
			r.Get("/logs-for-person/{personUuid}", app.HandlerApiLogsForPerson)
			r.Get("/persons-for-log/{logUuid}", app.HandlerApiPersonsForLog)
			r.Post("/person-to-log", app.HandlerApiPersonToLogNew)
			r.Put("/person-to-log", app.HandlerApiPersonToLogUpdate)
			r.Delete("/person-to-log", app.HandlerApiPersonToLogDelete)
		})

		// export
		r.Route("/export", func(r chi.Router) {
			r.Get("/{format}", app.HandlerApiExportLogbook)
			r.Post("/custom-title", app.HandlerApiUploadCustomTitle)
		})

		// import
		r.Route("/import", func(r chi.Router) {
			r.Post("/run", app.HandlerApiImportRun)
		})

		// currency
		r.Route("/currency", func(r chi.Router) {
			r.Get("/list", app.HandlerApiCurrencytList)
			r.Get("/{uuid}", app.HandlerApiCurrencyGet)
			r.Post("/new", app.HandlerApiCurrencyNew)
			r.Put("/{uuid}", app.HandlerApiCurrencyUpdate)
			r.Delete("/{uuid}", app.HandlerApiCurrencyDelete)
		})

		// custom fields
		r.Route("/custom-fields", func(r chi.Router) {
			r.Get("/list", app.HandlerApiCustomFieldsList)
			r.Get("/{uuid}", app.HandlerApiCustomFieldGet)
			r.Post("/new", app.HandlerApiCustomFieldNew)
			r.Put("/{uuid}", app.HandlerApiCustomFieldUpdate)
			r.Delete("/{uuid}", app.HandlerApiCustomFieldDelete)
		})

		// db
		r.Route("/db", func(r chi.Router) {
			r.Get("/filename", app.HandlerApiDBFile)
			r.Post("/upload-db", app.HandlerApiUploadDB)
			r.Get("/download-db", app.HandlerApiDownloadDB)
		})

		// logout
		r.Post("/logout", app.HandlerLogout)

		// aux
		r.Get("/version", app.HandlerVersion)
		r.Get("/auth-enabled", app.HandlerAuthEnabled)
		r.Get("/distance/{departure}/{arrival}", app.HandlerDistance)
	})

	r.Handle("/*", middleware.Compress(5)(app.HandlerUI()))

	return r
}
