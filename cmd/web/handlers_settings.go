package main

import (
	"encoding/json"
	"net/http"

	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerSettings is a handler for Settings page
func (app *application) HandlerSettings(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APISettings)
	}

	settings, err := app.db.GetSettings()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	records, err := app.db.GetAirportCount()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := make(map[string]interface{})
	data["settings"] = settings
	data["records"] = records

	if err := app.renderTemplate(w, r, "settings", &templateData{Data: data}, "common-js", "settings-js"); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerSettingsSave serves the POST request for settings update
func (app *application) HandlerSettingsSave(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APISettings)
	}

	var settings models.Settings
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&settings)
	if err != nil {
		app.errorLog.Panicln(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.db.UpdateSettings(settings)
	if err != nil {
		app.errorLog.Println(err)
		response.OK = false
		response.Message = err.Error()
	} else {
		response.OK = true
		response.Message = "Settings have been updated"

		if app.config.env == "dev" {
			app.infoLog.Println("settings updated")
		}
	}

	out, err := json.Marshal(response)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(out)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
