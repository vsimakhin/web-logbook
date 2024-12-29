package main

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerAirportByID returns airport record by ID (ICAO or IATA)
func (app *application) HandlerAirportByID(w http.ResponseWriter, r *http.Request) {
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

/////////////////////////////////////////////////
// for futher review
/////////////////////////////////////////////////

func (app *application) downloadAirportDB(source string) ([]models.Airport, error) {
	var airports []models.Airport
	var airportsDB map[string]interface{}

	if source == "" {
		source = "https://github.com/vsimakhin/Airports/raw/master/airports.json" // default one
	}

	resp, err := http.Get(source)
	if err != nil {
		return airports, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return airports, err
	}

	if strings.Contains(source, "airports.json") {
		// let's assume it's a standard airport database
		// however, it's not a good idea to rely on the file name, so might be changed in the future

		// parse the json
		err = json.Unmarshal(body, &airportsDB)
		if err != nil {
			return airports, err
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
	} else {
		// it's a new csv Ourairports source
		r := csv.NewReader(strings.NewReader(string(body)))
		for {
			record, err := r.Read()
			if err == io.EOF {
				break
			}
			if err != nil {
				app.errorLog.Println(err)
			}

			var airport models.Airport

			airport.ICAO = record[12]
			airport.IATA = record[13]

			// if airfield doesn't have ICAO and IATA codes,
			// let's make some name from the airfield name and record ID
			if airport.ICAO == "" && airport.IATA == "" {
				if strings.Contains(strings.ToUpper(record[3]), "DUPLICATE") {
					continue
				}
				airport.ICAO = fmt.Sprintf("%s %s", strings.ToUpper(record[3]), record[1])
			}

			// if it's still empty, let's skip this record
			if airport.ICAO == "" {
				continue
			}

			airport.Name = record[3]
			airport.City = record[10]
			airport.Country = record[8]
			airport.Elevation, _ = strconv.Atoi(record[6])
			airport.Lat, _ = strconv.ParseFloat(record[4], 64)
			airport.Lon, _ = strconv.ParseFloat(record[5], 64)

			airports = append(airports, airport)
		}
	}

	return airports, nil
}

// HandlerAirportUpdate updates the Airports DB
func (app *application) HandlerAirportUpdate(w http.ResponseWriter, r *http.Request) {

	var response models.JSONResponse

	settings, err := app.db.GetSettings()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	airports, err := app.downloadAirportDB(settings.AirportDBSource)
	if err != nil {
		app.errorLog.Println(err)
		response.OK = false
		response.Message = err.Error()
	} else {
		records, err := app.db.UpdateAirportDB(airports, settings.NoICAOFilter)
		if err != nil {
			app.errorLog.Println(err)
			response.OK = false
			response.Message = err.Error()
		} else {
			response.OK = true
			response.Message = fmt.Sprintf("%d", records)
		}
	}

	app.writeJSON(w, http.StatusOK, response)
}

// HandlerAirportAddCustom adds a new custom airport
func (app *application) HandlerAirportAddCustom(w http.ResponseWriter, r *http.Request) {

	var airport models.Airport
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&airport)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.db.AddCustomAirport(airport)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("error adding a new custom airport - %s", err))
		response.OK = false
		response.Message = err.Error()
	} else {
		response.OK = true
		response.Message = fmt.Sprintf("Custom airport %s has been added", airport.Name)
	}

	app.writeJSON(w, http.StatusOK, response)
}

// HandlerAirportDeleteCustom removes a custom airport
func (app *application) HandlerAirportDeleteCustom(w http.ResponseWriter, r *http.Request) {

	var airport models.Airport
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&airport)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.db.RemoveCustomAirport(airport.Name)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot remove custom airport - %s", err))
		response.OK = false
		response.Message = err.Error()
	} else {
		response.OK = true
		response.Message = fmt.Sprintf("Airport %s has been removed", airport.Name)
	}

	app.writeJSON(w, http.StatusOK, response)
}

// HandlerAirportCustomData generates data for the custom airports table
func (app *application) HandlerAirportCustomData(w http.ResponseWriter, r *http.Request) {

	type TableData struct {
		Data [][]string `json:"data"`
	}

	var tableData TableData

	airports, err := app.db.GetCustomAirports()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, item := range airports {
		tableRow := []string{item.Name, item.City, item.Country,
			fmt.Sprintf("%d", item.Elevation), fmt.Sprintf("%f", item.Lat), fmt.Sprintf("%f", item.Lon), "",
		}

		tableData.Data = append(tableData.Data, tableRow)
	}

	app.writeJSON(w, http.StatusOK, tableData)
}

// HandlerAirportDBData generates data for the standard airports table
func (app *application) HandlerAirportDBData(w http.ResponseWriter, r *http.Request) {

	type TableData struct {
		Data [][]string `json:"data"`
	}

	var tableData TableData

	airports, err := app.db.GetStandardAirports()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, item := range airports {
		tableRow := []string{item.ICAO, item.IATA, item.Name, item.City, item.Country,
			fmt.Sprintf("%d", item.Elevation), fmt.Sprintf("%f", item.Lat), fmt.Sprintf("%f", item.Lon), "",
		}

		tableData.Data = append(tableData.Data, tableRow)
	}

	app.writeJSON(w, http.StatusOK, tableData)
}
