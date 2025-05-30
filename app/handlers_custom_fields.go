package main

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/vsimakhin/web-logbook/internal/models"
)

func (app *application) HandlerApiCustomFieldsList(w http.ResponseWriter, r *http.Request) {
	currencies, err := app.db.GetCustomFields()
	if err != nil {
		app.handleError(w, err)
		return
	}
	app.writeJSON(w, http.StatusOK, currencies)
}

func (app *application) HandlerApiCustomFieldGet(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")
	customField, err := app.db.GetCustomField(uuid)
	if err != nil {
		app.handleError(w, err)
		return
	}
	app.writeJSON(w, http.StatusOK, customField)
}

func (app *application) HandlerApiCustomFieldNew(w http.ResponseWriter, r *http.Request) {
	var f models.CustomField
	err := json.NewDecoder(r.Body).Decode(&f)
	if err != nil {
		app.handleError(w, err)
		return
	}

	uuid, err := uuid.NewRandom()
	if err != nil {
		app.handleError(w, err)
		return
	}
	f.UUID = uuid.String()

	err = app.db.InsertCustomField(f)
	if err != nil {
		app.handleError(w, err)
		return
	}
	app.writeJSON(w, http.StatusOK, "New custom field created")
}

func (app *application) HandlerApiCustomFieldUpdate(w http.ResponseWriter, r *http.Request) {
	var f models.CustomField
	err := json.NewDecoder(r.Body).Decode(&f)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.UpdateCustomField(f)
	if err != nil {
		app.handleError(w, err)
		return
	}
	app.writeJSON(w, http.StatusOK, "Custom field updated")
}

func (app *application) HandlerApiCustomFieldDelete(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")
	err := app.db.DeleteCustomField(uuid)
	if err != nil {
		app.handleError(w, err)
		return
	}
	app.writeJSON(w, http.StatusOK, "Custom field deleted")
}
