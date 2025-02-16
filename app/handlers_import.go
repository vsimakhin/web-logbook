package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerCreateBackup creates backup of the current db file
func (app *application) HandlerImportCreateBackup(w http.ResponseWriter, r *http.Request) {
	var response models.JSONResponse

	if app.config.db.engine != "sqlite" {
		response.Message = "backup is available only for sqlite3 database"
		response.OK = false
		app.writeJSON(w, http.StatusOK, response)
		return
	}

	source, err := os.Open(app.config.db.dsn)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer source.Close()

	bckpFileName := fmt.Sprintf("%s_bckp.%s", app.config.db.dsn, time.Now().Format("20060102-150405.000000"))
	destination, err := os.Create(bckpFileName)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer destination.Close()

	_, err = io.Copy(destination, source)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response.Message = fmt.Sprintf("new backup %s is created", bckpFileName)
	response.OK = true
	app.writeJSON(w, http.StatusOK, response)
}

// HandlerImportRun runs the import
func (app *application) HandlerImportRun(w http.ResponseWriter, r *http.Request) {

	type ImportData struct {
		RecalculateNightTime bool                  `json:"recalculate_night_time"`
		FlightRecords        []models.FlightRecord `json:"data"`
	}

	var importData ImportData
	var wrongRecords []models.FlightRecord
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&importData)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, flightRecord := range importData.FlightRecords {
		uuid, err := uuid.NewRandom()
		if err != nil {
			app.errorLog.Println(err)
			response.OK = false
			response.Message = err.Error()
		}

		infoMsg := ""
		if flightRecord.Departure.Place != "" && flightRecord.Arrival.Place != "" {
			infoMsg = fmt.Sprintf("flight %s %s-%s", flightRecord.Date, flightRecord.Departure.Place, flightRecord.Arrival.Place)
		} else {
			infoMsg = fmt.Sprintf("simulator record %s %s", flightRecord.Date, flightRecord.SIM.Type)
		}

		// let's double check if the record alredy exists
		if app.db.IsFlightRecordExists(flightRecord) {
			app.warningLog.Printf("%s already exists, skipping", infoMsg)
			wrongRecords = append(wrongRecords, flightRecord)

		} else {
			flightRecord.UUID = uuid.String()

			// recalculate night time?
			if importData.RecalculateNightTime {
				night, err := app.calculateNightTime(flightRecord)
				if err != nil {
					// nevermind, just let's write some warning message
					app.warningLog.Printf("cannot calculate night time for %s - %s\n", infoMsg, err)
				} else {
					if night != time.Duration(0) {
						flightRecord.Time.Night = app.db.DtoA(night)
					}
				}
			}

			err = app.db.InsertFlightRecord(flightRecord)
			if err != nil {
				app.warningLog.Printf("cannot create a new record for %s - %s", infoMsg, err)
				wrongRecords = append(wrongRecords, flightRecord)
			}
		}
	}

	lWrongRecords := len(wrongRecords)
	lFlightRecords := len(importData.FlightRecords)

	if lWrongRecords != 0 {
		response.Message = fmt.Sprintf("Imported %d of %d records. %d records failed, check the logs in the console.",
			lFlightRecords-lWrongRecords, lFlightRecords, lWrongRecords)
		response.OK = false
		bData, err := json.Marshal(wrongRecords)
		if err != nil {
			app.errorLog.Println(err)
		}
		response.Data = string(bData)
	} else {
		response.Message = fmt.Sprintf("Imported %d of %d records.", lFlightRecords, lFlightRecords)
		response.OK = true
	}

	app.writeJSON(w, http.StatusOK, response)
}
