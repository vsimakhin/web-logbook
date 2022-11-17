package main

import (
	"net/http"
	"strconv"

	"github.com/vsimakhin/web-logbook/internal/maprender"
)

// HandlerStatsMap is a handler for Map page
func (app *application) HandlerMap(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APIMap)
	}

	data := make(map[string]interface{})

	if err := app.renderTemplate(w, r, "map", &templateData{Data: data}, "common-js", "map-js"); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerMapData returs lines and markers for the map page
func (app *application) HandlerMapData(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APIMapData)
	}

	// get filter parameters
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")
	filterNoRoutes, _ := strconv.ParseBool(r.URL.Query().Get("filter_noroutes"))

	if app.config.env == "dev" {
		app.infoLog.Printf("%s?%s\n", APIMapData, r.URL.Query().Encode())
	}

	flightRecords, err := app.db.GetFlightRecords()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	airports, err := app.db.GetAirports()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	render := maprender.MapRender{
		FlightRecords:  flightRecords,
		StartDate:      startDate,
		EndDate:        endDate,
		FilterNoRoutes: filterNoRoutes,
		AirportsDB:     airports,
	}
	render.Render()

	data := make(map[string]interface{})
	data["lines"] = render.Lines
	data["markers"] = render.Markers

	err = app.writeJSON(w, http.StatusOK, data)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}
