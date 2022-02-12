package main

import (
	"encoding/json"
	"fmt"
	"net/http"
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
		app.infoLog.Printf("/logbook/%s", uuid)
	}

	flightRecord, err := app.db.GetFlightRecordByID(uuid)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	aircraftRegs, err := app.db.GetAircraftRegs()
	if err != nil {
		app.errorLog.Println(err)
	}

	aircraftModels, err := app.db.GetAircraftModels()
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
		app.infoLog.Println("/logbook/new")
	}

	var flightRecord models.FlightRecord

	flightRecord.Date = time.Now().Format("02/01/2006")

	aircraftRegs, err := app.db.GetAircraftRegs()
	if err != nil {
		app.errorLog.Println(err)
	}

	aircraftModels, err := app.db.GetAircraftModels()
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
		app.infoLog.Println("/logbook/delete")
	}

	var flightRecord models.FlightRecord
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&flightRecord)
	if err != nil {
		app.errorLog.Panicln(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.db.DeleteFlightRecord(flightRecord.UUID)
	if err != nil {
		app.errorLog.Println(err)
		response.OK = false
		response.Message = err.Error()
	} else {
		response.OK = true
		response.Message = "Flight Record deleted"
		response.RedirectURL = "/logbook"

		if app.config.env == "dev" {
			app.infoLog.Printf("flight records %s deleted\n", flightRecord.UUID)
		}
	}

	err = app.db.DeleteAttachmentsForFlightRecord(flightRecord.UUID)
	if err != nil {
		app.errorLog.Println(err)
	}

	out, err := json.Marshal(response)
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

// HandlerFlightRecordSave updates the flight record or create a new one
func (app *application) HandlerFlightRecordSave(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println("/logbook/save")
	}

	var flightRecord models.FlightRecord
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&flightRecord)
	if err != nil {
		app.errorLog.Panicln(err)
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
			app.errorLog.Println(err)
			response.OK = false
			response.Message = err.Error()
		} else {
			response.OK = true
			response.Message = "New Flight Record has been saved"
			response.RedirectURL = fmt.Sprintf("/logbook/%s", flightRecord.UUID)

			if app.config.env == "dev" {
				app.infoLog.Printf("few flight record %s created", flightRecord.UUID)
			}
		}

	} else {
		// just update the current flight record
		err = app.db.UpdateFlightRecord(flightRecord)
		if err != nil {
			app.errorLog.Println(err)
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

	out, err := json.Marshal(response)
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

// HandlerNightTime is a handler for calculating night time
func (app *application) HandlerNightTime(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println("/logbook/nighttime")
	}

	var fr models.FlightRecord
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&fr)
	if err != nil {
		app.errorLog.Panicln(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	departure_place, err := app.db.GetAirportByID(fr.Departure.Place)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
	departure_time, err := time.Parse("02/01/2006 1504", fmt.Sprintf("%s %s", fr.Date, fr.Departure.Time))
	if err != nil {
		app.errorLog.Println(err)
		return
	}
	arrival_place, err := app.db.GetAirportByID(fr.Arrival.Place)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
	arrival_time, err := time.Parse("02/01/2006 1504", fmt.Sprintf("%s %s", fr.Date, fr.Arrival.Time))
	if err != nil {
		app.errorLog.Println(err)
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

	out, err := json.Marshal(response)
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
