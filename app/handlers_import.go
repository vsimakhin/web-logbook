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

	var importLog []string

	err := json.NewDecoder(r.Body).Decode(&importData)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Set up response headers for NDJSON streaming
	w.Header().Set("Content-Type", "application/x-ndjson")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, flusherOk := w.(http.Flusher)
	if flusherOk {
		w.WriteHeader(http.StatusOK)
		flusher.Flush()
	}

	type ImportProgress struct {
		Current int    `json:"current"`
		Total   int    `json:"total"`
		Message string `json:"message"`
		Type    string `json:"type"` // "log" | "result"
		OK      bool   `json:"ok"`
		Data    string `json:"data,omitempty"`
	}

	writeProgress := func(current, total int, message, chunkType string, ok bool, data string) {
		progress := ImportProgress{
			Current: current,
			Total:   total,
			Message: message,
			Type:    chunkType,
			OK:      ok,
			Data:    data,
		}
		if b, err := json.Marshal(progress); err == nil {
			_, _ = w.Write(append(b, '\n'))
			if flusherOk {
				flusher.Flush()
			}
		}
	}

	failedRecords := 0
	skippedRecords := 0
	flightRecords := len(importData.FlightRecords)

	for i, fr := range importData.FlightRecords {
		uuid, err := uuid.NewRandom()
		if err != nil {
			app.errorLog.Println(err)
		}

		infoMsg := ""
		if fr.Departure.Place != "" && fr.Arrival.Place != "" {
			infoMsg = fmt.Sprintf("Flight %s %s-%s %s %s",
				fr.Date, fr.Departure.Place, fr.Arrival.Place, fr.Aircraft.Model, fr.Aircraft.Reg)
		} else {
			infoMsg = fmt.Sprintf("Simulator record %s %s", fr.Date, fr.SIM.Type)
		}

		var rowLogs []string

		// let's double check if the record alredy exists
		if app.db.IsFlightRecordExists(fr) {
			msg := fmt.Sprintf("%s already exists, skipping", infoMsg)
			importLog = append(importLog, msg)
			rowLogs = append(rowLogs, msg)
			skippedRecords++
		} else {
			fr.UUID = uuid.String()
			fr.Distance = app.db.Distance(fr.Departure.Place, fr.Arrival.Place)

			// recalculate night time?
			if importData.RecalculateNightTime {
				night, isNightLanding, err := app.calculateNightTime(fr)
				if err != nil {
					// nevermind, add error to the log
					msg := fmt.Sprintf("cannot calculate night time for %s - %s", infoMsg, err)
					importLog = append(importLog, msg)
					rowLogs = append(rowLogs, msg)
				} else {
					if night != time.Duration(0) {
						prev := fr.Time.Night
						if prev == "" {
							prev = "0:00"
						}
						fr.Time.Night = app.db.DtoA(night)
						if prev != fr.Time.Night {
							msg := fmt.Sprintf("Night time changed for %s from %s to %s", infoMsg, prev, fr.Time.Night)
							importLog = append(importLog, msg)
							rowLogs = append(rowLogs, msg)
						}

						if isNightLanding && (fr.Landings.Day != 0 && fr.Landings.Night == 0) {
							fr.Landings.Night = fr.Landings.Day
							fr.Landings.Day = 0
							msg := fmt.Sprintf("Landings for %s: %d day landings changed to night landings", infoMsg, fr.Landings.Night)
							importLog = append(importLog, msg)
							rowLogs = append(rowLogs, msg)
						}
					}
				}
			}

			err = app.db.InsertFlightRecord(fr)
			if err != nil {
				msg := fmt.Sprintf("Cannot create a new record for %s - %s", infoMsg, err)
				importLog = append(importLog, msg)
				rowLogs = append(rowLogs, msg)
				failedRecords++
			}
		}

		// Send progress log chunks
		if len(rowLogs) > 0 {
			for _, rl := range rowLogs {
				writeProgress(i+1, flightRecords, rl, "log", false, "")
			}
		} else {
			writeProgress(i+1, flightRecords, fmt.Sprintf("Imported %s", infoMsg), "log", false, "")
		}
	}

	// update aircrafts table
	_ = app.db.GenerateAircraftTable()

	// Send final result chunk
	var finalMessage string
	var finalOK bool
	var finalData string

	if failedRecords != 0 || skippedRecords != 0 {
		finalMessage = fmt.Sprintf("Imported %d of %d records. %d records failed, %d skipped",
			flightRecords-failedRecords-skippedRecords, flightRecords, failedRecords, skippedRecords)
		finalOK = false
		bData, err := json.Marshal(importLog)
		if err == nil {
			finalData = string(bData)
		}
	} else {
		finalMessage = fmt.Sprintf("Imported %d of %d records.", flightRecords, flightRecords)
		finalOK = true
	}

	writeProgress(flightRecords, flightRecords, finalMessage, "result", finalOK, finalData)
}
