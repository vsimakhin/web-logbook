package main

import (
	"encoding/json"
	"net/http"

	"github.com/vsimakhin/web-logbook/internal/models"
)

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
