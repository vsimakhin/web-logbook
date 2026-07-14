package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/vsimakhin/web-logbook/internal/models"
)

func flightDuplicateKey(fr models.FlightRecord) string {
	if fr.Departure.Place != "" && fr.Arrival.Place != "" {
		// Real flight
		// Same rule as IsFlightRecordExists:
		// no duplicate check without both times
		if fr.Departure.Time == "" || fr.Arrival.Time == "" {
			return ""
		}

		return strings.Join([]string{
			"FLIGHT",
			fr.Date,
			fr.Departure.Place,
			fr.Departure.Time,
			fr.Arrival.Place,
			fr.Arrival.Time,
			fr.Aircraft.Model,
			fr.Aircraft.Reg,
		}, "|")
	}

	if fr.SIM.Type != "" && fr.SIM.Time != "" {
		// Simulator
		return strings.Join([]string{
			"SIM",
			fr.Date,
			fr.SIM.Type,
			fr.SIM.Time,
			fr.Remarks,
		}, "|")
	}

	return ""
}

func (app *application) GetFlightRecordDuplicates() (map[string]bool, error) {
	frs, err := app.db.GetFlightRecords()
	if err != nil {
		return nil, err
	}

	result := make(map[string]bool)

	for _, fr := range frs {
		key := flightDuplicateKey(fr)
		result[key] = true
	}

	return result, nil
}

type ImportData struct {
	RecalculateNightTime bool                  `json:"recalculate_night_time"`
	FlightRecords        []models.FlightRecord `json:"data"`
}

type ImportProgress struct {
	Type string `json:"type"`

	Current int `json:"current,omitempty"`
	Total   int `json:"total,omitempty"`

	Message string `json:"message,omitempty"`
	OK      bool   `json:"ok,omitempty"`
}

// HandlerApiImportRun runs the import
func (app *application) HandlerApiImportRun(w http.ResponseWriter, r *http.Request) {
	var importData ImportData

	err := json.NewDecoder(r.Body).Decode(&importData)
	if err != nil {
		app.handleError(w, err)
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

	sendChunk := func(chunk ImportProgress) {
		if b, err := json.Marshal(chunk); err == nil {
			_, _ = w.Write(append(b, '\n'))
			if flusherOk {
				flusher.Flush()
			}
		}
	}

	writeProgress := func(current, total int) {
		sendChunk(ImportProgress{Type: "progress", Current: current, Total: total})
	}

	writeLog := func(message string) {
		sendChunk(ImportProgress{Type: "log", Message: message})
	}

	writeResult := func(message string, ok bool) {
		sendChunk(ImportProgress{Type: "result", Message: message, OK: ok})
	}

	failedRecords := 0
	skippedRecords := 0
	flightRecords := len(importData.FlightRecords)

	duplicates, err := app.GetFlightRecordDuplicates()
	if err != nil {
		app.handleError(w, err)
		return
	}

	for i, fr := range importData.FlightRecords {
		var rowLogs []string
		logRow := func(msg string) {
			rowLogs = append(rowLogs, msg)
		}

		statusMsg := fmt.Sprintf("Imported %s", fr.DisplayName())

		// let's double check if the record alredy exists
		key := flightDuplicateKey(fr)
		if key != "" && duplicates[key] {
			statusMsg = fmt.Sprintf("Skipped %s", fr.DisplayName())
			logRow("--- already exists")
			skippedRecords++
		} else {
			uuid, err := uuid.NewRandom()
			if err != nil {
				app.errorLog.Println(err)
			}

			fr.UUID = uuid.String()
			fr.Distance = app.db.Distance(fr.Departure.Place, fr.Arrival.Place)

			// recalculate night time?
			if importData.RecalculateNightTime {
				night, isNightLanding, err := app.calculateNightTime(fr)
				if err != nil {
					// nevermind, add error to the log
					logRow(fmt.Sprintf("--- cannot calculate night time - %s", err))
				} else {
					if night != time.Duration(0) {
						prev := fr.Time.Night
						if prev == "" {
							prev = "0:00"
						}
						fr.Time.Night = app.db.DtoA(night)
						if prev != fr.Time.Night {
							logRow(fmt.Sprintf("--- night time changed from %s to %s", prev, fr.Time.Night))
						}

						if isNightLanding && (fr.Landings.Day != 0 && fr.Landings.Night == 0) {
							fmt.Printf("is night landing %v, day %d, night %d \n", isNightLanding, fr.Landings.Day, fr.Landings.Night)
							fr.Landings.Night = fr.Landings.Day
							fr.Landings.Day = 0
							logRow(fmt.Sprintf("--- %d day landings changed to night landings", fr.Landings.Night))
						}
					}
				}
			}

			err = app.db.InsertFlightRecord(fr)
			if err != nil {
				statusMsg = fmt.Sprintf("Failed %s", fr.DisplayName())
				logRow(fmt.Sprintf("--- cannot create a new record - %s", err))
				failedRecords++
			} else {
				if key != "" {
					duplicates[key] = true
				}
			}
		}

		// Send progress log chunks
		writeProgress(i+1, flightRecords)
		writeLog(statusMsg)
		for _, rl := range rowLogs {
			writeLog(rl)
		}
	}

	// update aircrafts table
	_ = app.db.GenerateAircraftTable()

	// Send final result chunk
	var finalMessage string
	var finalOK bool

	if failedRecords != 0 || skippedRecords != 0 {
		finalMessage = fmt.Sprintf("Imported %d of %d records. %d records failed, %d skipped",
			flightRecords-failedRecords-skippedRecords, flightRecords, failedRecords, skippedRecords)
		finalOK = false
	} else {
		finalMessage = fmt.Sprintf("Imported %d of %d records.", flightRecords, flightRecords)
		finalOK = true
	}

	writeResult(finalMessage, finalOK)
}
