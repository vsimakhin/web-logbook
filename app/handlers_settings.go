package main

import (
	"encoding/json"
	"net/http"

	"github.com/vsimakhin/web-logbook/internal/models"
)

func (app *application) HandlerApiSettingsList(w http.ResponseWriter, r *http.Request) {
	settings, err := app.db.GetSettings()
	if err != nil {
		app.handleError(w, err)
		return
	}

	settings.Hash = ""
	app.writeJSON(w, http.StatusOK, settings)
}

func (app *application) HandlerApiSettingsUpdate(w http.ResponseWriter, r *http.Request) {
	oldsettings, err := app.db.GetSettings()
	if err != nil {
		app.handleError(w, err)
		return
	}

	var settings models.Settings
	err = json.NewDecoder(r.Body).Decode(&settings)
	if err != nil {
		app.handleError(w, err)
		return
	}

	// rewrite export settings since they are set from /export page
	settings.ExportA4 = oldsettings.ExportA4
	settings.ExportA5 = oldsettings.ExportA5
	settings.ExportXLS = oldsettings.ExportXLS
	settings.ExportCSV = oldsettings.ExportCSV
	// Signature image is also updated separately
	settings.SignatureImage = oldsettings.SignatureImage

	err = app.db.UpdateSettings(settings)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.timeFieldsAutoFormat = settings.TimeFieldsAutoFormat

	app.writeOkResponse(w, "Settings updated")
}

func (app *application) HandlerApiSettingsSignature(w http.ResponseWriter, r *http.Request) {
	oldsettings, err := app.db.GetSettings()
	if err != nil {
		app.handleError(w, err)
		return
	}

	var settings models.Settings
	err = json.NewDecoder(r.Body).Decode(&settings)
	if err != nil {
		app.handleError(w, err)
		return
	}

	oldsettings.SignatureImage = settings.SignatureImage
	err = app.db.UpdateSettings(oldsettings)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeOkResponse(w, "Signature updated")
}

func (app *application) HandlerApiSettingsAirports(w http.ResponseWriter, r *http.Request) {
	oldsettings, err := app.db.GetSettings()
	if err != nil {
		app.handleError(w, err)
		return
	}

	var settings models.Settings
	err = json.NewDecoder(r.Body).Decode(&settings)
	if err != nil {
		app.handleError(w, err)
		return
	}

	oldsettings.AirportDBSource = settings.AirportDBSource
	oldsettings.NoICAOFilter = settings.NoICAOFilter
	err = app.db.UpdateSettings(oldsettings)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeOkResponse(w, "Airports DB Settings updated")
}
