package main

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerFlightRecordByID shows flight record by UUID
func (app *application) HandlerFlightRecordByID(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	flightRecord, err := app.db.GetFlightRecordByID(uuid)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot find the flight record %s - %s", uuid, err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	aircraftRegs, aircraftModels := app.lastRegsAndModels()

	data := make(map[string]interface{})
	data["flightRecord"] = flightRecord
	data["aircraftRegs"] = aircraftRegs
	data["aircraftModels"] = aircraftModels
	data["enableHelpMessages"] = app.isFlightRecordHelpEnabled()

	if err := app.renderTemplate(w, r, "flight-record", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerFlightRecordNew shows the empty form for a new flight record
func (app *application) HandlerFlightRecordNew(w http.ResponseWriter, r *http.Request) {

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

	aircraftRegs, aircraftModels := app.lastRegsAndModels()

	data := make(map[string]interface{})
	data["flightRecord"] = flightRecord
	data["aircraftRegs"] = aircraftRegs
	data["aircraftModels"] = aircraftModels
	data["enableHelpMessages"] = app.isFlightRecordHelpEnabled()

	if err := app.renderTemplate(w, r, "flight-record", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerFlightRecordDelete serves POST request for deleting flight record
func (app *application) HandlerFlightRecordDelete(w http.ResponseWriter, r *http.Request) {

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

	}

	err = app.db.DeleteAttachmentsForFlightRecord(flightRecord.UUID)
	if err != nil {
		app.errorLog.Println(err)
	}

	app.writeJSON(w, http.StatusOK, response)
}

// HandlerFlightRecordSave updates the flight record or create a new one
func (app *application) HandlerFlightRecordSave(w http.ResponseWriter, r *http.Request) {

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

		}

	} else {
		// just update the current flight record
		flightRecord.UpdateTime = time.Now().Unix() // set update time
		err = app.db.UpdateFlightRecord(flightRecord)
		if err != nil {
			app.errorLog.Println(fmt.Errorf("error updating the flight record - %s", err))
			response.OK = false
			response.Message = err.Error()
		} else {
			response.OK = true
			response.Message = "Flight Record has been updated"

		}
	}

	app.writeJSON(w, http.StatusOK, response)
}

// HandlerNightTime is a handler for calculating night time
func (app *application) HandlerNightTime(w http.ResponseWriter, r *http.Request) {

	var fr models.FlightRecord
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&fr)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("error calculating night time - %s", err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	night, err := app.calculateNightTime(fr)
	if err != nil {
		app.errorLog.Println(err)
		return
	}

	response.OK = true
	response.Data = fmt.Sprintf("%d", int(math.Round(night.Minutes())))

	app.writeJSON(w, http.StatusOK, response)
}
