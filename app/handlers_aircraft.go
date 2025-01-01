package main

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/vsimakhin/web-logbook/internal/models"
)

func (app *application) HandlerAircrafts(w http.ResponseWriter, r *http.Request) {

	var aircrafts map[string]string
	var err error

	filter := chi.URLParam(r, "filter")

	if filter == "last" {
		aircrafts, err = app.db.GetAircrafts(models.LastAircrafts)
	} else {
		aircrafts, err = app.db.GetAircrafts(models.AllAircrafts)
	}
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot get aircrafts list - %s", err))
	}

	app.writeJSON(w, http.StatusOK, aircrafts)
}

// HandlerApiAircraftModels is a handler for getting the list of aircraft models/types
func (app *application) HandlerApiAircraftModels(w http.ResponseWriter, r *http.Request) {

	models, err := app.db.GetAircraftModels()
	if err != nil {
		app.handleError(w, err)
	}

	app.writeJSON(w, http.StatusOK, models)
}
