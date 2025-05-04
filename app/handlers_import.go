package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerApiImportRun runs the import
func (app *application) HandlerApiImportRun(w http.ResponseWriter, r *http.Request) {

	type ImportData struct {
		RecalculateNightTime bool                  `json:"recalculate_night_time"`
		FlightRecords        []models.FlightRecord `json:"data"`
	}

	var importData ImportData

	var response models.JSONResponse
	var importLog []string

	err := json.NewDecoder(r.Body).Decode(&importData)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, fr := range importData.FlightRecords {
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

			// recalculate night time?
			if importData.RecalculateNightTime {
				night, err := app.calculateNightTime(fr)
				if err != nil {
					// nevermind, add error to the log
					importLog = append(importLog, fmt.Sprintf("cannot calculate night time for %s - %s", infoMsg, err))
				} else {
					if night != time.Duration(0) {
						prev := fr.Time.Night
						fr.Time.Night = app.db.DtoA(night)
						if prev != fr.Time.Night {
							importLog = append(importLog, fmt.Sprintf("Night time changed for %s from %s to %s", infoMsg, prev, fr.Time.Night))
						}
					}
				}
			}

			err = app.db.InsertFlightRecord(fr)
			if err != nil {
				importLog = append(importLog, fmt.Sprintf("Cannot create a new record for %s - %s", infoMsg, err))
			}
		}
	}

	lWrongRecords := len(importLog)
	lFlightRecords := len(importData.FlightRecords)

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
