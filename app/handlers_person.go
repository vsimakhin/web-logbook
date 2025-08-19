package main

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerApiPersonList returns a list all persons
func (app *application) HandlerApiPersonList(w http.ResponseWriter, r *http.Request) {
	persons, err := app.db.GetPersons()
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, persons)
}

func (app *application) HandlerApiPersonByID(w http.ResponseWriter, r *http.Request) {
	uuid := strings.ToLower(chi.URLParam(r, "uuid"))
	person, err := app.db.GetPersonById(uuid)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, person)
}

// HandlerApiPersonNew adds a new person
func (app *application) HandlerApiPersonNew(w http.ResponseWriter, r *http.Request) {
	var person models.Person
	err := json.NewDecoder(r.Body).Decode(&person)
	if err != nil {
		app.handleError(w, err)
		return
	}

	uuid, err := uuid.NewRandom()
	if err != nil {
		app.handleError(w, err)
		return
	}
	person.UUID = uuid.String()

	err = app.db.AddPerson(person)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, "Person added")
}

// HandlerApiPersonUpdate updates a person
func (app *application) HandlerApiPersonUpdate(w http.ResponseWriter, r *http.Request) {
	var person models.Person
	err := json.NewDecoder(r.Body).Decode(&person)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.UpdatePerson(person)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, "Person updated")
}

// HandlerApiPersonToLogNew creates a new person-to-log record
func (app *application) HandlerApiPersonToLogNew(w http.ResponseWriter, r *http.Request) {
	var personToLog models.PersonToLog
	err := json.NewDecoder(r.Body).Decode(&personToLog)
	if err != nil {
		app.handleError(w, err)
		return
	}

	uuid, err := uuid.NewRandom()
	if err != nil {
		app.handleError(w, err)
		return
	}
	personToLog.UUID = uuid.String()

	err = app.db.AddPersonToLog(personToLog)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, "Person added")
}

// HandlerApiPersonToLogUpdate updates a person-to-log record
func (app *application) HandlerApiPersonToLogUpdate(w http.ResponseWriter, r *http.Request) {
	var personToLog models.PersonToLog
	err := json.NewDecoder(r.Body).Decode(&personToLog)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.UpdatePersonToLog(personToLog)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, "Person updated")
}

// HandlerApiPersonsForLog returns a list of persons
func (app *application) HandlerApiPersonToLogDelete(w http.ResponseWriter, r *http.Request) {
	var personToLog models.PersonToLog
	err := json.NewDecoder(r.Body).Decode(&personToLog)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.DeletePersonToLog(personToLog)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, "Person-to-log deleted")
}

// HandlerApiPersonsForLog returns a list of persons
func (app *application) HandlerApiPersonsForLog(w http.ResponseWriter, r *http.Request) {
	logUuid := strings.ToLower(chi.URLParam(r, "logUuid"))

	persons, err := app.db.GetPersonsForLog(logUuid)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, persons)
}

func (app *application) HandlerApiLogsForPerson(w http.ResponseWriter, r *http.Request) {
	personUuid := strings.ToLower(chi.URLParam(r, "personUuid"))

	records, err := app.db.GetFlightRecordsForPerson(personUuid)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, records)
}
