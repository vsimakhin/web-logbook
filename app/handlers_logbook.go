package main

import (
	"net/http"
)

// HandlerApiLogbookData generates data for the logbook table
func (app *application) HandlerApiLogbookData(w http.ResponseWriter, r *http.Request) {
	flightRecords, err := app.db.GetFlightRecords()
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, flightRecords)
}

func (app *application) HandlerApiLogbookMapData(w http.ResponseWriter, r *http.Request) {
	flightRecords, err := app.db.GetFlightRecordsForMap()
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, flightRecords)
}
