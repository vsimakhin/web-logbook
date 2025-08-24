package main

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
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

func (app *application) HandlerApiSettingsExportDefaults(w http.ResponseWriter, r *http.Request) {
	format := chi.URLParam(r, "format")
	defaults := app.db.GetPdfDefaults(format)
	app.writeJSON(w, http.StatusOK, defaults)
}

func (app *application) HandlerApiSettingsExportUpdate(w http.ResponseWriter, r *http.Request) {
	format := chi.URLParam(r, "format")

	s, err := app.db.GetSettings()
	if err != nil {
		app.handleError(w, err)
		return
	}

	var updated models.ExportPDF
	err = json.NewDecoder(r.Body).Decode(&updated)
	if err != nil {
		app.handleError(w, err)
		return
	}

	var targetExport *models.ExportPDF
	switch format {
	case "A4":
		targetExport = &s.ExportA4
	case "A5":
		targetExport = &s.ExportA5
	}

	targetExport.LogbookRows = updated.LogbookRows
	targetExport.Fill = updated.Fill
	targetExport.LeftMargin = updated.LeftMargin
	targetExport.TopMargin = updated.TopMargin
	targetExport.BodyRow = updated.BodyRow
	targetExport.FooterRow = updated.FooterRow
	targetExport.LeftMarginA = updated.LeftMarginA
	targetExport.LeftMarginB = updated.LeftMarginB
	targetExport.Headers = updated.Headers
	targetExport.Columns = updated.Columns
	targetExport.ReplaceSPTime = updated.ReplaceSPTime
	targetExport.IncludeSignature = updated.IncludeSignature
	targetExport.IsExtended = updated.IsExtended
	targetExport.TimeFieldsAutoFormat = updated.TimeFieldsAutoFormat

	err = app.db.UpdateSettings(s)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeOkResponse(w, "Export settings updated")
}

func (app *application) HandlerApiSettingsFieldsDefaults(w http.ResponseWriter, r *http.Request) {
	defaults := app.db.GetStandardFieldsHeaders()
	app.writeJSON(w, http.StatusOK, defaults)
}
