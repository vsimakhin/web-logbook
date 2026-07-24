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

type ImportOptions struct {
	Backup               bool            `json:"backup"`
	RecalculateNightTime bool            `json:"recalculate_night_time"`
	CreatePersons        bool            `json:"create_persons"`
	CreatePersonFormat   string          `json:"create_person_format"`
	CreatePersonFrom     map[string]bool `json:"create_person_from"`
}

type ImportData struct {
	Options       ImportOptions         `json:"options"`
	FlightRecords []models.FlightRecord `json:"data"`
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

	// Load settings for Self PIC label
	selfPICLabel := "Self"
	if settings, err := app.db.GetSettings(); err == nil {
		if settings.SelfPICLabel != "" {
			selfPICLabel = settings.SelfPICLabel
		}
	}

	// Load custom fields to map UUID -> Name for roles
	customFieldsNames := make(map[string]string)
	if cfs, err := app.db.GetCustomFields(); err == nil {
		for _, cf := range cfs {
			customFieldsNames[cf.UUID] = cf.Name
		}
	}

	// Load existing persons to populate duplicate detection cache
	personCache := make(map[string]string)
	lastNameCache := make(map[string]string)
	if existingPersons, err := app.db.GetPersons(); err == nil {
		for _, p := range existingPersons {
			key := strings.ToLower(p.FirstName + "|" + p.MiddleName + "|" + p.LastName)
			personCache[key] = p.UUID
			if p.LastName != "" {
				lastNameCache[strings.ToLower(p.LastName)] = p.UUID
			}
		}
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
			flightUUID, err := uuid.NewRandom()
			if err != nil {
				app.errorLog.Println(err)
			}

			fr.UUID = flightUUID.String()
			fr.Distance = app.db.Distance(fr.Departure.Place, fr.Arrival.Place)

			// recalculate night time?
			if importData.Options.RecalculateNightTime {
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

				if importData.Options.CreatePersons {
					// Define a helper to process and save/link persons
					processPerson := func(fullName string, role string) {
						fullName = strings.TrimSpace(fullName)
						if fullName == "" {
							return
						}

						// Check if this is "Self"
						if strings.EqualFold(fullName, "Self") || strings.EqualFold(fullName, selfPICLabel) {
							return
						}

						// Parse name
						firstName, middleName, lastName := parseName(fullName, importData.Options.CreatePersonFormat)

						// Check if person already exists (in cache)
						pKey := strings.ToLower(firstName + "|" + middleName + "|" + lastName)
						personUUID, exists := personCache[pKey]
						if !exists {
							// Fallback: check if we only have a last name and this is PIC role
							if role == "PIC" && lastName != "" {
								if uuidFromLastName, found := lastNameCache[strings.ToLower(lastName)]; found {
									personUUID = uuidFromLastName
									exists = true
								}
							}
						}

						if !exists {
							// Create new person
							newUUID, err := uuid.NewRandom()
							if err != nil {
								logRow(fmt.Sprintf("--- cannot generate uuid for person: %s", err))
								return
							}
							personUUID = newUUID.String()

							newPerson := models.Person{
								UUID:       personUUID,
								FirstName:  firstName,
								MiddleName: middleName,
								LastName:   lastName,
							}

							err = app.db.AddPerson(newPerson)
							if err != nil {
								logRow(fmt.Sprintf("--- cannot create person %s: %s", fullName, err))
								return
							}

							// Add to cache
							personCache[pKey] = personUUID
							if lastName != "" {
								lastNameCache[strings.ToLower(lastName)] = personUUID
							}
							logRow(fmt.Sprintf("--- created person %s", fullName))
						}

						// Link person to the flight record
						ptlUUID, err := uuid.NewRandom()
						if err != nil {
							logRow(fmt.Sprintf("--- cannot generate uuid for person link: %s", err))
							return
						}

						personToLog := models.PersonToLog{
							UUID:       ptlUUID.String(),
							PersonUUID: personUUID,
							LogUUID:    fr.UUID,
							Role:       role,
						}

						err = app.db.AddPersonToLog(personToLog)
						if err != nil {
							logRow(fmt.Sprintf("--- cannot link person %s to flight: %s", fullName, err))
						} else {
							logRow(fmt.Sprintf("--- linked person %s as %s", fullName, role))
						}
					}

					// 1. Process standard fields
					if importData.Options.CreatePersonFrom["pic"] {
						processPerson(fr.PIC, "PIC")
					}

					// 2. Process custom fields
					if fr.CustomFields != "" {
						var customFields map[string]interface{}
						if err := json.Unmarshal([]byte(fr.CustomFields), &customFields); err == nil {
							for cfUuid, enabled := range importData.Options.CreatePersonFrom {
								if cfUuid != "pic" && enabled {
									if val, ok := customFields[cfUuid]; ok {
										if strVal, ok := val.(string); ok && strVal != "" {
											roleName, ok := customFieldsNames[cfUuid]
											if !ok || roleName == "" {
												roleName = "Crew"
											}
											processPerson(strVal, roleName)
										}
									}
								}
							}
						} else {
							logRow(fmt.Sprintf("--- cannot parse custom fields JSON: %s", err))
						}
					}
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

// parseName splits a fullName into First, Middle, and Last name components based on the selected format
func parseName(fullName string, format string) (firstName, middleName, lastName string) {
	parts := strings.Fields(fullName)
	n := len(parts)
	if n == 0 {
		return "", "", ""
	}

	switch format {
	case "ln_fn_md":
		// Last Name, First Name, Middle Name
		// 3 parts → Last / First / Middle
		// 2 parts → Last / First
		// 1 part → Last
		if n >= 3 {
			lastName = parts[0]
			firstName = parts[1]
			middleName = strings.Join(parts[2:], " ")
		} else if n == 2 {
			lastName = parts[0]
			firstName = parts[1]
		} else {
			lastName = parts[0]
		}

	case "fn_ln_md":
		// First Name, Last Name, Middle Name
		// 3 parts → First / Last / Middle
		// 2 parts → First / Last
		// 1 part → First
		if n >= 3 {
			firstName = parts[0]
			lastName = parts[1]
			middleName = strings.Join(parts[2:], " ")
		} else if n == 2 {
			firstName = parts[0]
			lastName = parts[1]
		} else {
			firstName = parts[0]
		}

	default: // "fn_mn_ln" or empty default
		// First Name, Middle Name, Last Name
		// 3 parts → First / Middle / Last
		// 2 parts → First / Last
		// 1 part → Last
		if n >= 3 {
			firstName = parts[0]
			middleName = strings.Join(parts[1:n-1], " ")
			lastName = parts[n-1]
		} else if n == 2 {
			firstName = parts[0]
			lastName = parts[1]
		} else {
			lastName = parts[0]
		}
	}

	return firstName, middleName, lastName
}
