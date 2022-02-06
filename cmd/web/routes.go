package main

import (
	"github.com/go-chi/chi/v5"
)

func (app *application) routes() *chi.Mux {
	server := chi.NewRouter()

	// logbook
	server.Get("/", app.HandlerLogbook)
	server.Get("/logbook", app.HandlerLogbook)
	server.Get("/logbook/data", app.HandlerFlightRecordsData)

	server.Get("/logbook/{uuid}", app.HandlerFlightRecordByID)
	server.Get("/logbook/new", app.HandlerFlightRecordNew)

	server.Post("/logbook/save", app.HandlerFlightRecordSave)
	server.Post("/logbook/delete", app.HandlerFlightRecordDelete)

	server.Post("/logbook/night", app.HandlerNightTime)

	// export
	server.Get("/logbook/export", app.HandlerExportLogbook)

	// airports
	server.Get("/airport/{id}", app.HandlerAirportByID)
	server.Get("/airport/update", app.HandlerAirportUpdate)

	// settings
	server.Get("/settings", app.HandlerSettings)
	server.Post("/settings", app.HandlerSettingsSave)

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

	server.Post("/licensing/save", app.HandlerLicensingRecordSave)
	server.Post("/licensing/delete", app.HandlerLicensingRecordDelete)

	// other stuff
	server.Handle("/static/*", app.HandlerStatic())
	server.HandleFunc("/favicon.ico", app.HandlerFavicon)
	server.NotFound(app.HandlerNotFound)
	server.MethodNotAllowed(app.HandlerNotAllowed)

	return server
}
