package main

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/vsimakhin/web-logbook/internal/pdfexport"
)

// HandlerLogbook is a handler for /logbook page
func (app *application) HandlerLogbook(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APILogbook)
	}

	if err := app.renderTemplate(w, r, "logbook", nil); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerFlightRecordsData generates data for the logbook table at /logbook page
func (app *application) HandlerFlightRecordsData(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APILogbookData)
	}

	type TableData struct {
		Data [][]string `json:"data"`
	}

	var tableData TableData

	flightRecords, err := app.db.GetFlightRecords()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, item := range flightRecords {
		if item.Time.MCC != "" {
			item.Time.ME = ""
		}

		tableRow := []string{fmt.Sprintf(`<a href="%s/%s" class="link-primary">%s</a>`, APILogbook, item.UUID, item.Date), item.Departure.Place, item.Departure.Time,
			item.Arrival.Place, item.Arrival.Time, item.Aircraft.Model, item.Aircraft.Reg,
			item.Time.SE, item.Time.ME, item.Time.MCC, item.Time.Total, formatRemarks(item.PIC), formatLandings(item.Landings.Day), formatLandings(item.Landings.Night),
			item.Time.Night, item.Time.IFR, item.Time.PIC, item.Time.CoPilot, item.Time.Dual, item.Time.Instructor,
			item.SIM.Type, item.SIM.Time, formatRemarks(item.Remarks)}

		tableData.Data = append(tableData.Data, tableRow)
	}

	err = app.writeJSON(w, http.StatusOK, tableData)
	if err != nil {
		app.errorLog.Println(err)
		return
	}

	if app.config.env == "dev" {
		app.infoLog.Printf("%d flight records generated for the table\n", len(tableData.Data))
	}
}

// HandlerExportLogbook executes the pdf export and returns pdf file
func (app *application) HandlerExportLogbook(w http.ResponseWriter, r *http.Request) {
	format := chi.URLParam(r, "format")

	if app.config.env == "dev" {
		app.infoLog.Println(strings.ReplaceAll(APILogbookExportFormat, "{format}", format))
	}

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

	w.Header().Set("Content-Type", "application/pdf")
	var logbook pdfexport.Logbook
	logbook.OwnerName = settings.OwnerName
	logbook.Signature = settings.SignatureText

	if format == "A4" {
		logbook.PageBreaks = strings.Split(settings.ExportA4.PageBreaks, ",")
		logbook.Export = settings.ExportA4

		err = logbook.ExportA4(flightRecords, w)
	} else if format == "A5" {
		logbook.PageBreaks = strings.Split(settings.ExportA5.PageBreaks, ",")
		logbook.Export = settings.ExportA5

		err = logbook.ExportA5(flightRecords, w)
	} else {
		err = errors.New("unknown export format")
	}

	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
