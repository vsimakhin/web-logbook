package main

import (
	"encoding/json"
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
		aircrafts, err = app.db.GetAircraftsInLogbook(models.LastAircrafts)
	} else {
		aircrafts, err = app.db.GetAircraftsInLogbook(models.AllAircrafts)
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

// HandlerApiAircraftList is a handler to build the aircrafts list and return it
func (app *application) HandlerApiAircraftBuildList(w http.ResponseWriter, r *http.Request) {
	err := app.db.GenerateAircraftTable()
	if err != nil {
		app.handleError(w, err)
		return
	}

	aircrafts, err := app.db.GetAircrafts()
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, aircrafts)
}

// HandlerApiAircraftList is a handler for getting the list of aircrafts
func (app *application) HandlerApiAircraftList(w http.ResponseWriter, r *http.Request) {
	aircrafts, err := app.db.GetAircrafts()
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, aircrafts)
}

// HandlerApiAircraftModelsCategories is a handler for getting the list of aircraft categories
func (app *application) HandlerApiAircraftModelsCategoriesList(w http.ResponseWriter, r *http.Request) {
	categories, err := app.db.GetAircraftModelsCategories()
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, categories)
}

// HandlerApiAircraftModelsCategoriesUpdate is a handler for updating aircraft categories
func (app *application) HandlerApiAircraftModelsCategoriesUpdate(w http.ResponseWriter, r *http.Request) {
	var category models.Category
	err := json.NewDecoder(r.Body).Decode(&category)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.UpdateAircraftModelsCategories(category)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeOkResponse(w, "Aircraft categories have been updated")
}

func (app *application) HandlerApiAircraftUpdate(w http.ResponseWriter, r *http.Request) {
	var aircraft models.Aircraft
	err := json.NewDecoder(r.Body).Decode(&aircraft)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.UpdateAircraft(aircraft)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeOkResponse(w, "Aircraft have been updated")
}
