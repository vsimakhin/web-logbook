package main

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerAirportByID returns airport record by ID (ICAO or IATA)
func (app *application) HandlerApiAirportByID(w http.ResponseWriter, r *http.Request) {
	uuid := strings.ToUpper(chi.URLParam(r, "id"))

	airport, err := app.db.GetAirportByID(uuid)
	if err != nil {
		app.handleError(w, err)
		return
	}

	if airport.IATA == "" && airport.ICAO == "" {
		// looks like there is no such ID in airport database
		app.warningLog.Printf("cannot find %s in the airport database\n", uuid)
		app.writeJSON(w, http.StatusNotFound, models.JSONResponse{OK: false, Message: "Airport not found"})
		return
	}

	app.writeJSON(w, http.StatusOK, airport)
}

// HandlerApiStandardAirportList returns a list of standard airports
func (app *application) HandlerApiStandardAirportList(w http.ResponseWriter, r *http.Request) {
	airports, err := app.db.GetStandardAirports()
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, airports)
}

// HandlerApiCustomAirportList returns a list of custom airports
func (app *application) HandlerApiCustomAirportList(w http.ResponseWriter, r *http.Request) {
	airports, err := app.db.GetCustomAirports()
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, airports)
}

// HandlerApiAirportList returns a list of all airports
func (app *application) HandlerApiAirportList(w http.ResponseWriter, r *http.Request) {
	airports, err := app.db.GetAllAirports()
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, airports)
}

func (app *application) downloadAirportDB(source string) ([]models.Airport, error) {
	if source == "" {
		source = "https://github.com/vsimakhin/Airports/raw/master/airports.json"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 300*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, source, nil)
	if err != nil {
		return nil, err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if strings.Contains(source, "airports.json") {
		return app.parseJSONAirports(body)
	}
	return app.parseCSVAirports(body)
}

func (app *application) parseJSONAirports(data []byte) ([]models.Airport, error) {
	type airportJSON struct {
		ICAO      string  `json:"icao"`
		IATA      string  `json:"iata"`
		Name      string  `json:"name"`
		City      string  `json:"city"`
		Country   string  `json:"country"`
		Elevation float64 `json:"elevation"`
		Lat       float64 `json:"lat"`
		Lon       float64 `json:"lon"`
	}

	var airportsMap map[string]airportJSON
	if err := json.Unmarshal(data, &airportsMap); err != nil {
		return nil, err
	}

	airports := make([]models.Airport, 0, len(airportsMap))
	for _, a := range airportsMap {
		airports = append(airports, models.Airport{
			ICAO:      a.ICAO,
			IATA:      a.IATA,
			Name:      a.Name,
			City:      a.City,
			Country:   a.Country,
			Elevation: int(a.Elevation),
			Lat:       a.Lat,
			Lon:       a.Lon,
		})
	}
	return airports, nil
}

func (app *application) parseCSVAirports(data []byte) ([]models.Airport, error) {
	const (
		// CSV field indices
		csvID      = 1
		csvName    = 3
		csvLat     = 4
		csvLon     = 5
		csvElev    = 6
		csvCountry = 8
		csvCity    = 10
		csvICAO    = 12
		csvIATA    = 13
	)

	r := csv.NewReader(bytes.NewReader(data))
	records, err := r.ReadAll()
	if err != nil {
		return nil, err
	}

	airports := make([]models.Airport, 0, len(records))
	for _, record := range records {
		if len(record) <= csvIATA {
			continue
		}

		icao := record[csvICAO]
		iata := record[csvIATA]
		name := record[csvName]

		if icao == "" && iata == "" {
			if strings.Contains(strings.ToUpper(name), "DUPLICATE") {
				continue
			}
			icao = fmt.Sprintf("%s %s", strings.ToUpper(name), record[csvID])
		}

		if icao == "" {
			continue
		}

		elevation, _ := strconv.Atoi(record[csvElev])
		lat, _ := strconv.ParseFloat(record[csvLat], 64)
		lon, _ := strconv.ParseFloat(record[csvLon], 64)

		airports = append(airports, models.Airport{
			ICAO:      icao,
			IATA:      iata,
			Name:      name,
			City:      record[csvCity],
			Country:   record[csvCountry],
			Elevation: elevation,
			Lat:       lat,
			Lon:       lon,
		})
	}
	return airports, nil
}

// HandlerAirportUpdate updates the Airports DB
func (app *application) HandlerApiAirportDBUpdate(w http.ResponseWriter, r *http.Request) {
	settings, err := app.db.GetSettings()
	if err != nil {
		app.handleError(w, err)
		return
	}

	airports, err := app.downloadAirportDB(settings.AirportDBSource)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.UpdateAirportDB(airports, settings.NoICAOFilter)
	if err != nil {
		app.handleError(w, err)
		return
	}
	app.writeJSON(w, http.StatusOK, "Airports DB updated")
}

// HandlerAirportAddCustom adds a new custom airport
func (app *application) HandlerApiAirportCustomNew(w http.ResponseWriter, r *http.Request) {
	var airport models.Airport
	err := json.NewDecoder(r.Body).Decode(&airport)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.AddCustomAirport(airport)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, "Custom airport added")
}

// HandlerAirportUpdateCustom updates a custom airport
func (app *application) HandlerApiAirportCustomUpdate(w http.ResponseWriter, r *http.Request) {
	var airport models.Airport
	err := json.NewDecoder(r.Body).Decode(&airport)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.UpdateCustomAirport(airport)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, "Custom airport updated")
}

// HandlerApiAirportCustomDelete removes a custom airport
func (app *application) HandlerApiAirportCustomDelete(w http.ResponseWriter, r *http.Request) {
	var airport models.Airport
	err := json.NewDecoder(r.Body).Decode(&airport)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.RemoveCustomAirport(airport.Name)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, "Custom airport removed")
}
