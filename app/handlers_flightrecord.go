package main

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/vsimakhin/web-logbook/internal/models"
	"github.com/vsimakhin/web-logbook/internal/utils"
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

	// refresh aircraft tables
	_ = app.db.GenerateAircraftTable()

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

	// refresh aircraft tables
	_ = app.db.GenerateAircraftTable()

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

	// recalculate distance in case departure or arrival place has been changed
	// but not if track log is present
	if flightRecord.Track == nil {
		flightRecord.Distance = app.db.Distance(flightRecord.Departure.Place, flightRecord.Arrival.Place)
	}

	err = app.db.UpdateFlightRecord(flightRecord)
	if err != nil {
		app.handleError(w, err)
		return
	}

	// refresh aircraft tables
	_ = app.db.GenerateAircraftTable()

	app.writeOkResponse(w, "Flight Record has been updated")
}

// HandlerApiTrackLogNew is a handler for uploading track log
func (app *application) HandlerApiTrackLogNew(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	var track [][]float64
	err := json.NewDecoder(r.Body).Decode(&track)
	if err != nil {
		app.handleError(w, err)
		return
	}

	distance := 0.0
	for i := range len(track) - 1 {
		distance += utils.Distance(track[i][0], track[i][1], track[i+1][0], track[i+1][1])
	}

	bTrack, err := json.Marshal(track)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.UpdateFlightRecordTrack(uuid, distance, bTrack)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeOkResponse(w, "Track Log uploaded")
}

// HandlerApiTrackLogReset is a handler for deleting track log
func (app *application) HandlerApiTrackLogReset(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	fr, err := app.db.GetFlightRecordByID(uuid)
	if err != nil {
		app.handleError(w, err)
		return
	}

	// recalculate distance
	fr.Distance = app.db.Distance(fr.Departure.Place, fr.Arrival.Place)

	err = app.db.UpdateFlightRecordTrack(uuid, fr.Distance, nil)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeOkResponse(w, "Track Log reset")
}

// HandlerApiFlightRecordTags returns all unique flight records tags
func (app *application) HandlerApiFlightRecordTags(w http.ResponseWriter, r *http.Request) {
	tags, err := app.db.GetFlightRecordsTags()
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, tags)
}
