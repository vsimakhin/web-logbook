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

////////////////////////////////////
// for review

func (app *application) HandlerSettingsAirportDB(w http.ResponseWriter, r *http.Request) {
	records, err := app.db.GetAirportCount()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := make(map[string]interface{})
	data["records"] = records
	data["activePage"] = "settings"
	data["activeSubPage"] = "airports"
	if err := app.renderTemplate(w, r, "settings-airportdb", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerSettingsAirportDBSave serves the POST request for airportdb settings update
func (app *application) HandlerSettingsAirportDBSave(w http.ResponseWriter, r *http.Request) {

	cursettings, err := app.db.GetSettings()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var settings models.Settings
	var response models.JSONResponse

	err = json.NewDecoder(r.Body).Decode(&settings)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	cursettings.AirportDBSource = settings.AirportDBSource
	cursettings.NoICAOFilter = settings.NoICAOFilter

	err = app.db.UpdateSettings(cursettings)
	if err != nil {
		app.errorLog.Println(err)
		response.OK = false
		response.Message = err.Error()
	} else {
		response.OK = true
		response.Message = "Settings have been updated"
	}

	app.writeJSON(w, http.StatusOK, response)
}

// HandlerSettingsAircraftClasses is a handler for aircraft groups/classes
func (app *application) HandlerSettingsAircraftClasses(w http.ResponseWriter, r *http.Request) {

	settings, err := app.db.GetSettings()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	app.writeJSON(w, http.StatusOK, settings.AircraftClasses)
}
