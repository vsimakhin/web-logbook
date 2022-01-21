package main

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (app *application) routes() http.Handler {
	server := chi.NewRouter()

	// logbook
	server.Get("/", app.HandlerLogbook)
	server.Get("/logbook", app.HandlerLogbook)
	server.Get("/logbook/data", app.HandlerFlightRecordsData)

	server.Get("/logbook/{uuid}", app.HandlerFlightRecordByID)
	server.Get("/logbook/new", app.HandlerFlightRecordNew)

	server.Post("/logbook/save", app.HandlerFlightRecordSave)
	server.Post("/logbook/delete", app.HandlerFlightRecordDelete)

	// export
	server.Get("/logbook/export", app.HandlerExportLogbook)

	// airports
	server.Get("/airport/{id}", app.HandlerAirportByID)
	server.Get("/airport/update", app.HandlerAirportUpdate)

	// settings
	server.Get("/settings", app.HandlerSettings)
	server.Post("/settings", app.HandlerSettingsSave)

	// stats

	// other stuff
	server.Handle("/static/*", app.HandlerStatic())
	server.HandleFunc("/favicon.ico", app.HandlerFavicon)
	server.NotFound(app.HandlerNotFound)
	server.MethodNotAllowed(app.HandlerNotAllowed)

	return server
}
