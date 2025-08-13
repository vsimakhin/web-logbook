package main

import (
	"net/http"
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
