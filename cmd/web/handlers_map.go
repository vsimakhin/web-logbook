package main

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/vsimakhin/web-logbook/internal/maprender"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerStatsMap is a handler for Map page
func (app *application) HandlerMap(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APIMap)
	}

	classes, err := app.db.GetAircraftClasses()
	if err != nil {
		app.errorLog.Printf("cannot get aircraft classes - %s", err)
	}

	data := make(map[string]interface{})
	data["classes"] = classes

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
	aircraftReg := strings.TrimSpace(r.URL.Query().Get("reg"))
	aircraftModel := r.URL.Query().Get("model")
	aircraftClass := r.URL.Query().Get("class")
	routePlace := r.URL.Query().Get("place")
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

	classes, err := app.db.GetAircraftClasses()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// filter flight records
	var filteredFlightRecords []models.FlightRecord

	for _, fr := range flightRecords {
		if fr.Departure.Place == "" || fr.Arrival.Place == "" {
			continue
		}

		// filters
		if ((startDate <= fr.MDate) && (fr.MDate <= endDate)) &&
			parameterFilter(fr.Aircraft.Reg, aircraftReg) &&
			parameterFilter(fr.Aircraft.Model, aircraftModel) &&
			parameterClassFilter(classes, fr.Aircraft.Model, aircraftClass) &&
			(parameterFilter(fr.Arrival.Place, routePlace) || parameterFilter(fr.Departure.Place, routePlace)) {

			filteredFlightRecords = append(filteredFlightRecords, fr)
		}
	}

	render := maprender.MapRender{
		FlightRecords: filteredFlightRecords,
		AirportsDB:    airports,

		FilterNoRoutes: filterNoRoutes,
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
