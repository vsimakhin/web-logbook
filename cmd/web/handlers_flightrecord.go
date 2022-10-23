package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	nighttime "github.com/vsimakhin/go-nighttime"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerFlightRecordByID shows flight record by UUID
func (app *application) HandlerFlightRecordByID(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	if app.config.env == "dev" {
		app.infoLog.Println(strings.ReplaceAll(APILogbookUUID, "{uuid}", uuid))
	}

	flightRecord, err := app.db.GetFlightRecordByID(uuid)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot find the flight record %s - %s", uuid, err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	aircraftRegs, err := app.db.GetAircraftRegs()
	if err != nil {
		app.errorLog.Println(err)
	}

	aircraftModels, err := app.db.GetAircraftModels(models.JustLastModels)
	if err != nil {
		app.errorLog.Println(err)
	}

	data := make(map[string]interface{})
	data["flightRecord"] = flightRecord
	data["aircraftRegs"] = aircraftRegs
	data["aircraftModels"] = aircraftModels

	if err := app.renderTemplate(w, r, "flight-record", &templateData{Data: data}, "common-js", "flight-record-js", "flight-record-map"); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerFlightRecordNew shows the empty form for a new flight record
func (app *application) HandlerFlightRecordNew(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APILogbookNew)
	}

	var flightRecord models.FlightRecord

	// check if the page opened from the existing flight record
	// in this case we can assume it's a next flight and we can set departure = last arrival
	// and the date of the new record = same date
	r.ParseForm()
	lastArrival := r.FormValue("last_arrival")
	if lastArrival != "" {
		flightRecord.Departure.Place = lastArrival
	}

	lastDate := r.FormValue("last_date")
	if lastDate != "" {
		flightRecord.Date = lastDate
	} else {
		flightRecord.Date = time.Now().Format("02/01/2006")
	}

	aircraftRegs, err := app.db.GetAircraftRegs()
	if err != nil {
		app.errorLog.Println(err)
	}

	aircraftModels, err := app.db.GetAircraftModels(models.JustLastModels)
	if err != nil {
		app.errorLog.Println(err)
	}

	data := make(map[string]interface{})
	data["flightRecord"] = flightRecord
	data["aircraftRegs"] = aircraftRegs
	data["aircraftModels"] = aircraftModels

	if err := app.renderTemplate(w, r, "flight-record", &templateData{Data: data}, "common-js", "flight-record-js", "flight-record-map"); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerFlightRecordDelete serves POST request for deleting flight record
func (app *application) HandlerFlightRecordDelete(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APILogbookDelete)
	}

	var flightRecord models.FlightRecord
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&flightRecord)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.db.DeleteFlightRecord(flightRecord.UUID)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("error deleting the flight record - %s", err))
		response.OK = false
		response.Message = err.Error()
	} else {
		response.OK = true
		response.Message = "Flight Record deleted"
		response.RedirectURL = APILogbook

		if app.config.env == "dev" {
			app.infoLog.Printf("flight records %s deleted\n", flightRecord.UUID)
		}
	}

	err = app.db.DeleteAttachmentsForFlightRecord(flightRecord.UUID)
	if err != nil {
		app.errorLog.Println(err)
	}

	err = app.writeJSON(w, http.StatusOK, response)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

// HandlerFlightRecordSave updates the flight record or create a new one
func (app *application) HandlerFlightRecordSave(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APILogbookSave)
	}

	var flightRecord models.FlightRecord
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&flightRecord)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if flightRecord.UUID == "" {
		// new flight record
		uuid, err := uuid.NewRandom()
		if err != nil {
			app.errorLog.Println(err)
			response.OK = false
			response.Message = err.Error()
		}

		flightRecord.UUID = uuid.String()

		err = app.db.InsertFlightRecord(flightRecord)
		if err != nil {
			app.errorLog.Println(fmt.Errorf("error creating a new flight record - %s", err))
			response.OK = false
			response.Message = err.Error()
		} else {
			response.OK = true
			response.Message = "New Flight Record has been saved"
			response.RedirectURL = fmt.Sprintf("%s/%s", APILogbook, flightRecord.UUID)

			if app.config.env == "dev" {
				app.infoLog.Printf("few flight record %s created", flightRecord.UUID)
			}
		}

	} else {
		// just update the current flight record
		err = app.db.UpdateFlightRecord(flightRecord)
		if err != nil {
			app.errorLog.Println(fmt.Errorf("error updating the flight record - %s", err))
			response.OK = false
			response.Message = err.Error()
		} else {
			response.OK = true
			response.Message = "Flight Record has been updated"

			if app.config.env == "dev" {
				app.infoLog.Printf("flight records %s updated\n", flightRecord.UUID)
			}
		}
	}

	err = app.writeJSON(w, http.StatusOK, response)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

// HandlerNightTime is a handler for calculating night time
func (app *application) HandlerNightTime(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APILogbookNight)
	}

	var fr models.FlightRecord
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&fr)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("error calculating night time - %s", err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	departure_place, err := app.db.GetAirportByID(fr.Departure.Place)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("error calculating night time, cannot find %s - %s", fr.Departure.Place, err))
		return
	}

	departure_time, err := time.Parse("02/01/2006 1504", fmt.Sprintf("%s %s", fr.Date, fr.Departure.Time))
	if err != nil {
		app.errorLog.Println(fmt.Errorf("error calculating night time, wrong date format %s - %s", fmt.Sprintf("%s %s", fr.Date, fr.Departure.Time), err))
		return
	}

	arrival_place, err := app.db.GetAirportByID(fr.Arrival.Place)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("error calculating night time, cannot find %s - %s", fr.Arrival.Place, err))
		return
	}

	arrival_time, err := time.Parse("02/01/2006 1504", fmt.Sprintf("%s %s", fr.Date, fr.Arrival.Time))
	if err != nil {
		app.errorLog.Println(fmt.Errorf("error calculating night time, wrong date format %s - %s", fmt.Sprintf("%s %s", fr.Date, fr.Arrival.Time), err))
		return
	}

	route := nighttime.Route{
		Departure: nighttime.Place{
			Lat:  departure_place.Lat,
			Lon:  departure_place.Lon,
			Time: departure_time,
		},
		Arrival: nighttime.Place{
			Lat:  arrival_place.Lat,
			Lon:  arrival_place.Lon,
			Time: arrival_time,
		},
	}

	response.OK = true
	response.Message = fmt.Sprintf("%d", int(route.NightTime().Minutes()))

	err = app.writeJSON(w, http.StatusOK, response)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("error calculating night time - %s", err))
		return
	}
}
