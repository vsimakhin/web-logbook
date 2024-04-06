package main

import (
	"net/http"

	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerLogbook is a handler for /logbook page
func (app *application) HandlerLogbook(w http.ResponseWriter, r *http.Request) {
	if err := app.renderTemplate(w, r, "logbook", &templateData{}, "logbook-js"); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerFlightRecordsData generates data for the logbook table at /logbook page
func (app *application) HandlerFlightRecordsData(w http.ResponseWriter, r *http.Request) {

	var tableData models.TableData

	flightRecords, err := app.db.GetFlightRecords()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, item := range flightRecords {
		if item.Time.MCC != "" {
			item.Time.ME = ""
		}

		tableRow := []string{item.UUID, item.Date, item.Departure.Place, item.Departure.Time,
			item.Arrival.Place, item.Arrival.Time, item.Aircraft.Model, item.Aircraft.Reg,
			app.formatTimeField(item.Time.SE), app.formatTimeField(item.Time.ME), app.formatTimeField(item.Time.MCC),
			app.formatTimeField(item.Time.Total), item.PIC, formatLandings(item.Landings.Day), formatLandings(item.Landings.Night),
			app.formatTimeField(item.Time.Night), app.formatTimeField(item.Time.IFR), app.formatTimeField(item.Time.PIC),
			app.formatTimeField(item.Time.CoPilot), app.formatTimeField(item.Time.Dual), app.formatTimeField(item.Time.Instructor),
			item.SIM.Type, app.formatTimeField(item.SIM.Time), item.Remarks}

		tableData.Data = append(tableData.Data, tableRow)
	}

	err = app.writeJSON(w, http.StatusOK, tableData)
	if err != nil {
		app.errorLog.Println(err)
		return
	}

}
