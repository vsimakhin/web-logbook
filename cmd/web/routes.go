package main

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (app *application) routes() http.Handler {
	server := chi.NewRouter()

	server.Get("/", app.HandlerLogbook)
	server.Get("/logbook", app.HandlerLogbook)
	server.Get("/logbook/{uuid}", app.HandlerFlightRecordByID)
	server.Get("/logbook/new", app.HandlerFlightRecordNew)
	server.Post("/logbook/save", app.HandlerFlightRecordSave)
	server.Post("/logbook/delete", app.HandlerFlightRecordDelete)

	server.Handle("/static/*", app.HandlerStatic())
	server.HandleFunc("/favicon.ico", app.HandlerFavicon)
	server.NotFound(app.HandlerNotFound)
	server.MethodNotAllowed(app.HandlerNotAllowed)

	return server
}
