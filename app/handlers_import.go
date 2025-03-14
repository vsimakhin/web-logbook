package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerApiImportRun runs the import
func (app *application) HandlerApiImportRun(w http.ResponseWriter, r *http.Request) {

	var frs []models.FlightRecord
	var response models.JSONResponse
	var importLog []string

	err := json.NewDecoder(r.Body).Decode(&frs)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, flightRecord := range frs {
		uuid, err := uuid.NewRandom()
		if err != nil {
			app.errorLog.Println(err)
			response.OK = false
			response.Message = err.Error()
		}

		infoMsg := ""
		if flightRecord.Departure.Place != "" && flightRecord.Arrival.Place != "" {
			infoMsg = fmt.Sprintf("Flight %s %s-%s %s %s",
				flightRecord.Date, flightRecord.Departure.Place, flightRecord.Arrival.Place, flightRecord.Aircraft.Model, flightRecord.Aircraft.Reg)
		} else {
			infoMsg = fmt.Sprintf("Simulator record %s %s", flightRecord.Date, flightRecord.SIM.Type)
		}

		// let's double check if the record alredy exists
		if app.db.IsFlightRecordExists(flightRecord) {
			importLog = append(importLog, fmt.Sprintf("%s already exists, skipping", infoMsg))
		} else {
			flightRecord.UUID = uuid.String()

			err = app.db.InsertFlightRecord(flightRecord)
			if err != nil {
				importLog = append(importLog, fmt.Sprintf("Cannot create a new record for %s - %s", infoMsg, err))
			}
		}
	}

	lWrongRecords := len(importLog)
	lFlightRecords := len(frs)

	if lWrongRecords != 0 {
		response.Message = fmt.Sprintf("Imported %d of %d records. %d records failed",
			lFlightRecords-lWrongRecords, lFlightRecords, lWrongRecords)
		response.OK = false
		bData, err := json.Marshal(importLog)
		if err != nil {
			app.handleError(w, err)
		}
		response.Data = string(bData)
	} else {
		response.Message = fmt.Sprintf("Imported %d of %d records.", lFlightRecords, lFlightRecords)
		response.OK = true
	}

	app.writeJSON(w, http.StatusOK, response)
}
