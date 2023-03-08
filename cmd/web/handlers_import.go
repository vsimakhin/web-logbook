package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerImport is a handler for /import page
func (app *application) HandlerImport(w http.ResponseWriter, r *http.Request) {

	data := make(map[string]interface{})

	partials := []string{"common-js", "import-js", "import-mapfields-modal"}
	if err := app.renderTemplate(w, r, "import", &templateData{Data: data}, partials...); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerCreateBackup creates backup of the current db file
func (app *application) HandlerImportCreateBackup(w http.ResponseWriter, r *http.Request) {

	var response models.JSONResponse

	source, err := os.Open(app.config.db.dsn)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer source.Close()

	bckpFileName := fmt.Sprintf("%s_bckp.%s", app.config.db.dsn, time.Now().Format("20060102-150405.000000"))
	destination, err := os.Create(bckpFileName)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer destination.Close()

	_, err = io.Copy(destination, source)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response.Message = fmt.Sprintf("new backup %s is created", bckpFileName)
	response.OK = true
	err = app.writeJSON(w, http.StatusOK, response)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

// HandlerImportRun runs the import
func (app *application) HandlerImportRun(w http.ResponseWriter, r *http.Request) {

	var flightRecords []models.FlightRecord
	var wrongRecords []models.FlightRecord

	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&flightRecords)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, flightRecord := range flightRecords {
		uuid, err := uuid.NewRandom()
		if err != nil {
			app.errorLog.Println(err)
			response.OK = false
			response.Message = err.Error()
		}

		flightRecord.UUID = uuid.String()

		err = app.db.InsertFlightRecord(flightRecord)
		if err != nil {
			wrongRecords = append(wrongRecords, flightRecord)
		}
	}

	if len(wrongRecords) != 0 {
		response.Message = fmt.Sprintf("Imported %d of %d records. %d records failed.", len(flightRecords)-len(wrongRecords), len(flightRecords), len(wrongRecords))
		response.OK = false
		bData, err := json.Marshal(wrongRecords)
		if err != nil {
			app.errorLog.Println(err)
		}
		response.Data = string(bData)
	} else {
		response.Message = fmt.Sprintf("Imported %d of %d records.", len(flightRecords), len(flightRecords))
		response.OK = true
	}

	err = app.writeJSON(w, http.StatusOK, response)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}
