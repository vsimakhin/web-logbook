package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerAirportByID returns airport record by ID (ICAO or IATA)
func (app *application) HandlerAirportByID(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "id")

	if app.config.env == "dev" {
		app.infoLog.Println(strings.ReplaceAll(APIAirportID, "{id}", uuid))
	}

	airport, err := app.db.GetAirportByID(uuid)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.writeJSON(w, http.StatusOK, airport)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

// HandlerAirportUpdate updates the Airports DB
func (app *application) HandlerAirportUpdate(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APIAirportUpdate)
	}

	var airportsDB map[string]interface{}
	var airports []models.Airport
	var response models.JSONResponse

	// download the json db from the repo
	resp, err := http.Get("https://github.com/vsimakhin/Airports/raw/master/airports.json")
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if app.config.env == "dev" {
		app.infoLog.Println("new file airports.json downloaded")
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// parse the json
	err = json.Unmarshal(body, &airportsDB)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, item := range airportsDB {
		airportItem := item.(map[string]interface{})

		var airport models.Airport

		if value, ok := airportItem["icao"].(string); ok {
			airport.ICAO = value
		}

		if value, ok := airportItem["iata"].(string); ok {
			airport.IATA = value
		}

		if value, ok := airportItem["name"].(string); ok {
			airport.Name = value
		}

		if value, ok := airportItem["city"].(string); ok {
			airport.City = value
		}

		if value, ok := airportItem["country"].(string); ok {
			airport.Country = value
		}

		if value, ok := airportItem["elevation"].(float64); ok {
			airport.Elevation = int(value)
		}

		if value, ok := airportItem["lat"].(float64); ok {
			airport.Lat = value
		}

		if value, ok := airportItem["lon"].(float64); ok {
			airport.Lon = value
		}

		airports = append(airports, airport)
	}

	records, err := app.db.UpdateAirportDB(airports)
	if err != nil {
		app.errorLog.Println(err)
		response.OK = false
		response.Message = err.Error()
	} else {
		response.OK = true
		response.Message = fmt.Sprintf("%d", records)

		if app.config.env == "dev" {
			app.infoLog.Println("airports db updated")
		}
	}

	err = app.writeJSON(w, http.StatusOK, response)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}
