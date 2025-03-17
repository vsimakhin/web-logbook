package main

import (
	"net/http"

	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerApiLogbookData generates data for the logbook table
func (app *application) HandlerApiLogbookData(w http.ResponseWriter, r *http.Request) {
	flightRecords, err := app.db.GetFlightRecords()
	if err != nil {
		app.handleError(w, err)
		return
	}

	var formattedFlightRecords []models.FlightRecord

	for _, flight := range flightRecords {
		flight.Time.SE = app.formatTimeField(flight.Time.SE)
		flight.Time.ME = app.formatTimeField(flight.Time.ME)
		flight.Time.MCC = app.formatTimeField(flight.Time.MCC)
		flight.Time.Total = app.formatTimeField(flight.Time.Total)
		flight.Time.Night = app.formatTimeField(flight.Time.Night)
		flight.Time.IFR = app.formatTimeField(flight.Time.IFR)
		flight.Time.PIC = app.formatTimeField(flight.Time.PIC)
		flight.Time.CoPilot = app.formatTimeField(flight.Time.CoPilot)
		flight.Time.Dual = app.formatTimeField(flight.Time.Dual)
		flight.Time.Instructor = app.formatTimeField(flight.Time.Instructor)
		flight.Time.CrossCountry = app.formatTimeField(flight.Time.CrossCountry)
		flight.SIM.Time = app.formatTimeField(flight.SIM.Time)

		formattedFlightRecords = append(formattedFlightRecords, flight)
	}

	app.writeJSON(w, http.StatusOK, formattedFlightRecords)
}
