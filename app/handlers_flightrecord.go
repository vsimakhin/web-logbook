package main

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerFlightRecordByID shows flight record by UUID
func (app *application) HandlerApiFlightRecordByID(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	flightRecord, err := app.db.GetFlightRecordByID(uuid)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, flightRecord)
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

// HandlerApiFlightRecordDelete deletes the flight record
func (app *application) HandlerApiFlightRecordDelete(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	err := app.db.DeleteFlightRecord(uuid)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.DeleteAttachmentsForFlightRecord(uuid)
	if err != nil {
		app.errorLog.Println(err)
	}

	app.writeOkResponse(w, "Flight record has been deleted")
}

// HandlerApiFlightRecordNew creates a new flight record
func (app *application) HandlerApiFlightRecordNew(w http.ResponseWriter, r *http.Request) {

	var flightRecord models.FlightRecord
	err := json.NewDecoder(r.Body).Decode(&flightRecord)
	if err != nil {
		app.handleError(w, err)
		return
	}

	uuid, err := uuid.NewRandom()
	if err != nil {
		app.handleError(w, err)
		return
	}
	flightRecord.UUID = uuid.String()

	err = app.db.InsertFlightRecord(flightRecord)
	if err != nil {
		app.handleError(w, err)
		return
	}

	var response models.JSONResponse
	response.OK = true
	response.Message = "New Flight Record created"
	response.Data = flightRecord.UUID

	app.writeJSON(w, http.StatusOK, response)
}

// HandlerApiFlightRecordUpdate updates the flight record
func (app *application) HandlerApiFlightRecordUpdate(w http.ResponseWriter, r *http.Request) {

	var flightRecord models.FlightRecord
	err := json.NewDecoder(r.Body).Decode(&flightRecord)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.UpdateFlightRecord(flightRecord)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeOkResponse(w, "Flight Record has been updated")
}
