package main

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/vsimakhin/web-logbook/internal/maprender"
)

// HandlerStatsMap is a handler for Map page
func (app *application) HandlerMap(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println("/map")
	}

	data := make(map[string]interface{})

	// get filter parameters
	filterDate := r.URL.Query().Get("filter_date")
	filterNoRoutes, _ := strconv.ParseBool(r.URL.Query().Get("filter_noroutes"))

	if app.config.env == "dev" {
		app.infoLog.Printf("/map?%s\n", r.URL.Query().Encode())
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
		FilterDate:     filterDate,
		FilterNoRoutes: filterNoRoutes,
		AirportsDB:     airports,
	}

	render.Render()
	data["lines"] = render.Lines
	data["markers"] = render.Markers

	if err := app.renderTemplate(w, r, "map", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerMapLines returns routes array with coordinates
func (app *application) HandlerMapLines(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println("/map/lines")
	}

	// get filter parameters
	filterDate := r.URL.Query().Get("filter_date")
	filterNoRoutes, _ := strconv.ParseBool(r.URL.Query().Get("filter_noroutes"))

	if app.config.env == "dev" {
		app.infoLog.Printf("/map/lines?%s\n", r.URL.Query().Encode())
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
		FilterDate:     filterDate,
		FilterNoRoutes: filterNoRoutes,
		AirportsDB:     airports,
	}
	render.Render()

	out, err := json.Marshal(render.Lines)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(out)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// HandlerMapMarkers returns airports coordinates
func (app *application) HandlerMapMarkers(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println("/map/markers")
	}

	// get filter parameters
	filterDate := r.URL.Query().Get("filter_date")
	filterNoRoutes, _ := strconv.ParseBool(r.URL.Query().Get("filter_noroutes"))

	if app.config.env == "dev" {
		app.infoLog.Printf("/map/markers?%s\n", r.URL.Query().Encode())
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
		FilterDate:     filterDate,
		FilterNoRoutes: filterNoRoutes,
		AirportsDB:     airports,
	}
	render.Render()

	out, err := json.Marshal(render.Markers)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(out)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
