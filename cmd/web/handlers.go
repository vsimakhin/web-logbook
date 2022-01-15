package main

import (
	"embed"
	"net/http"

	"github.com/go-chi/chi/v5"
)

//go:embed static
var staticFS embed.FS

// HandlerLogbook is a handler for /logbook page
func (app *application) HandlerLogbook(w http.ResponseWriter, r *http.Request) {

	flightRecords, err := app.db.GetFlightRecords()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	data := make(map[string]interface{})
	data["flightRecords"] = flightRecords

	if err := app.renderTemplate(w, r, "logbook", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerFlightRecordByID shows flight record by UUID
func (app *application) HandlerFlightRecordByID(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	flightRecord, err := app.db.GetFlightRecordByID(uuid)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)

	}

	data := make(map[string]interface{})
	data["flightRecord"] = flightRecord

	if err := app.renderTemplate(w, r, "flightrecord", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}

}

// other aux handlers
func (app *application) HandlerStatic() http.Handler {
	return http.FileServer(http.FS(staticFS))
}

func (app *application) HandlerFavicon(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/static/favicon.ico", http.StatusMovedPermanently)
}

func (app *application) HandlerNotFound(w http.ResponseWriter, r *http.Request) {
	if err := app.renderTemplate(w, r, "notfound", nil); err != nil {
		app.errorLog.Println(err)
	}
}

func (app *application) HandlerNotAllowed(w http.ResponseWriter, r *http.Request) {
	if err := app.renderTemplate(w, r, "notallowed", nil); err != nil {
		app.errorLog.Println(err)
	}
}
