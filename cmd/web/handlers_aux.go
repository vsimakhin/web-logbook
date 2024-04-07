package main

import (
	"embed"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
)

//go:embed static
var staticFS embed.FS

// other auxiliary handlers
func (app *application) HandlerStatic() http.Handler {
	return http.FileServer(http.FS(staticFS))
}

func (app *application) HandlerFavicon(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/static/favicon.ico", http.StatusMovedPermanently)
}

func (app *application) HandlerNotFound(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotFound)

	if err := app.renderTemplate(w, r, "notfound", nil); err != nil {
		app.errorLog.Println(err)
	}
}

func (app *application) HandlerNotAllowed(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusMethodNotAllowed)

	if err := app.renderTemplate(w, r, "notallowed", nil); err != nil {
		app.errorLog.Println(err)
	}
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

	err := app.writeJSON(w, http.StatusOK, item)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot get aircrafts list - %s", err))
		return
	}
}

func (app *application) HandlerPreferences(w http.ResponseWriter, r *http.Request) {
	settings, err := app.db.GetSettings()
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot get settings - %s", err))
		http.Error(w, "cannot get settings", http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"enable_flightrecord_tooltips": !settings.DisableFlightRecordHelp,
		"daterange_picker_first_day":   settings.DateRangePickerWeek,
	}

	err = app.writeJSON(w, http.StatusOK, data)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot get aircrafts list - %s", err))
		return
	}
}
