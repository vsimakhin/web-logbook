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

	for _, fr := range frs {
		uuid, err := uuid.NewRandom()
		if err != nil {
			app.errorLog.Println(err)
			response.OK = false
			response.Message = err.Error()
		}

		infoMsg := ""
		if fr.Departure.Place != "" && fr.Arrival.Place != "" {
			infoMsg = fmt.Sprintf("Flight %s %s-%s %s %s",
				fr.Date, fr.Departure.Place, fr.Arrival.Place, fr.Aircraft.Model, fr.Aircraft.Reg)
		} else {
			infoMsg = fmt.Sprintf("Simulator record %s %s", fr.Date, fr.SIM.Type)
		}

		// let's double check if the record alredy exists
		if app.db.IsFlightRecordExists(fr) {
			importLog = append(importLog, fmt.Sprintf("%s already exists, skipping", infoMsg))
		} else {
			fr.UUID = uuid.String()
			fr.Distance = app.db.Distance(fr.Departure.Place, fr.Arrival.Place)

			err = app.db.InsertFlightRecord(fr)
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
