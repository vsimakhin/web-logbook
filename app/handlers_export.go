package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/vsimakhin/web-logbook/internal/models"
	"github.com/vsimakhin/web-logbook/internal/pdfexport"
	"github.com/vsimakhin/web-logbook/internal/xlsexport"
)

const exportA4 = "A4"
const exportA5 = "A5"
const exportXLS = "xls"

// HandlerExportPDFA4Page is a handler for /export-pdf-a4 page
func (app *application) HandlerExportPDFA4Page(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	data["activePage"] = "export"
	data["activeSubPage"] = "pdfa4"
	if err := app.renderTemplate(w, r, "export-pdf-a4", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerExportPDFA5Page is a handler for /export-pdf-a5 page
func (app *application) HandlerExportPDFA5Page(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	data["activePage"] = "export"
	data["activeSubPage"] = "pdfa5"
	if err := app.renderTemplate(w, r, "export-pdf-a5", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerExportPDFA5Page is a handler for /export-pdf-a5 page
func (app *application) HandlerExportCSVXLSPage(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	data["activePage"] = "export"
	data["activeSubPage"] = "csv"
	if err := app.renderTemplate(w, r, "export-csv-xls", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerExportLogbook serves the GET request for logbook export
func (app *application) HandlerExportLogbook(w http.ResponseWriter, r *http.Request) {
	format := chi.URLParam(r, "format")

	flightRecords, err := app.db.GetFlightRecords()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	settings, err := app.db.GetSettings()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var contentType, fileName string
	var exportFunc func() error

	switch format {
	case exportA4, exportA5:
		contentType = "application/pdf"
		fileName = "logbook.pdf"

		var exportSettings models.ExportPDF

		if format == exportA4 {
			exportSettings = settings.ExportA4
		} else {
			exportSettings = settings.ExportA5
		}

		if exportSettings.CustomTitle != "" {
			att, _ := app.db.GetAttachmentByID(exportSettings.CustomTitle)
			exportSettings.CustomTitleBlob = att.Document
		}

		pdfExporter, err := pdfexport.NewPDFExporter(format,
			settings.OwnerName, settings.LicenseNumber, settings.Address,
			settings.SignatureText, settings.SignatureImage, exportSettings)

		if err != nil {
			app.errorLog.Println(err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		exportFunc = func() error {
			if format == exportA4 {
				return pdfExporter.ExportA4(flightRecords, w)
			}
			return pdfExporter.ExportA5(flightRecords, w)
		}

	case exportXLS:
		contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		fileName = "logbook.xlsx"
		var xls xlsexport.ExportXLS
		xls.ExportXLS = settings.ExportXLS
		exportFunc = func() error {
			return xls.Export(flightRecords, w)
		}
	}

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", fileName))

	err = exportFunc()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// HandlerExportSettingsSave serves the POST request for export settings update
func (app *application) HandlerExportSettingsSave(w http.ResponseWriter, r *http.Request) {
	format := chi.URLParam(r, "format")

	currsettings, err := app.db.GetSettings()
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot get the export settings - %s", err))
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

	// rewrite only export settings since the others are set from /settings page
	if format == exportA4 {
		currsettings.ExportA4 = settings.ExportA4

	} else if format == exportA5 {
		currsettings.ExportA5 = settings.ExportA5

	} else if format == exportXLS {
		currsettings.ExportXLS = settings.ExportXLS

	}

	err = app.db.UpdateSettings(currsettings)
	if err != nil {
		app.errorLog.Println(err)
		response.OK = false
		response.Message = err.Error()
	} else {
		response.OK = true
		response.Message = "Export settings have been updated"

	}

	app.writeJSON(w, http.StatusOK, response)
}

// HandlerRestoreDefaults restores default values
func (app *application) HandlerExportRestoreDefaults(w http.ResponseWriter, r *http.Request) {
	var response models.JSONResponse

	param := ""
	err := json.NewDecoder(r.Body).Decode(&param)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.db.UpdateDefaults(param)

	if err != nil {
		app.errorLog.Println(err)
		response.OK = false
		response.Message = err.Error()
	} else {
		response.OK = true
		response.Message = "Export settings have been restored. Refresh the page to see the changes."
	}

	app.writeJSON(w, http.StatusOK, response)
}
