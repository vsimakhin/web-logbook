package main

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/vsimakhin/web-logbook/internal/models"
)

func (app *application) HandlerApiCurrencytList(w http.ResponseWriter, r *http.Request) {
	currencies, err := app.db.GetCurrencies()
	if err != nil {
		app.handleError(w, err)
		return
	}
	app.writeJSON(w, http.StatusOK, currencies)
}

func (app *application) HandlerApiCurrencyGet(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")
	currency, err := app.db.GetCurrency(uuid)
	if err != nil {
		app.handleError(w, err)
		return
	}
	app.writeJSON(w, http.StatusOK, currency)
}

func (app *application) HandlerApiCurrencyNew(w http.ResponseWriter, r *http.Request) {
	var c models.Currency
	err := json.NewDecoder(r.Body).Decode(&c)
	if err != nil {
		app.handleError(w, err)
		return
	}
	err = app.db.InsertCurrency(c)
	if err != nil {
		app.handleError(w, err)
		return
	}
	app.writeJSON(w, http.StatusOK, "New currency created")
}

func (app *application) HandlerApiCurrencyUpdate(w http.ResponseWriter, r *http.Request) {
	var c models.Currency
	err := json.NewDecoder(r.Body).Decode(&c)
	if err != nil {
		app.handleError(w, err)
		return
	}
	err = app.db.UpdateCurrency(c)
	if err != nil {
		app.handleError(w, err)
		return
	}
	app.writeJSON(w, http.StatusOK, "Currency updated")
}

func (app *application) HandlerApiCurrencyDelete(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")
	err := app.db.DeleteCurrency(uuid)
	if err != nil {
		app.handleError(w, err)
		return
	}
	app.writeJSON(w, http.StatusOK, "Currency deleted")
}
