package main

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerApiPersonList returns a list of standard airports
func (app *application) HandlerApiPersonList(w http.ResponseWriter, r *http.Request) {
	persons, err := app.db.GetPersons()
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, persons)
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
