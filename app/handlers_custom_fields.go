package main

import "net/http"

func (app *application) HandlerApiCustomFieldsList(w http.ResponseWriter, r *http.Request) {
	currencies, err := app.db.GetCustomFields()
	if err != nil {
		app.handleError(w, err)
		return
	}
	app.writeJSON(w, http.StatusOK, currencies)
}
