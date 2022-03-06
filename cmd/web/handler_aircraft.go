package main

import (
	"net/http"

	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerAircraftModels is a handler for a list of all aircraft models in the logbook
func (app *application) HandlerAircraftModels(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APIAircraftModels)
	}

	aircraftModels, err := app.db.GetAircraftModels(models.AllAircraftModels)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.writeJSON(w, http.StatusOK, aircraftModels)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

// HandlerAircraftClasses is a handler for aircraft groups/classes
func (app *application) HandlerAircraftClasses(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APIAircraftClasses)
	}

	settings, err := app.db.GetSettings()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.writeJSON(w, http.StatusOK, settings.AircraftClasses)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}
