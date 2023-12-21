package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerSyncAirports returns data from the airports view
func (app *application) HandlerSyncAirports(w http.ResponseWriter, r *http.Request) {

	tableData := []map[string]interface{}{}

	airports, err := app.db.GetAllAirports()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, item := range airports {
		tableRow := map[string]interface{}{
			"icao":      item.ICAO,
			"iata":      item.IATA,
			"name":      item.Name,
			"city":      item.City,
			"country":   item.Country,
			"elevation": item.Elevation,
			"lat":       item.Lat,
			"lon":       item.Lon,
		}

		tableData = append(tableData, tableRow)
	}

	err = app.writeJSON(w, http.StatusOK, tableData)
	if err != nil {
		app.errorLog.Println(err)
		return
	}

}

func (app *application) HandlerSyncDeletedGet(w http.ResponseWriter, r *http.Request) {

	tableData := []map[string]interface{}{}

	dis, err := app.db.GetDeletedItems()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, item := range dis {
		tableRow := map[string]interface{}{
			"uuid":        item.UUID,
			"table_name":  item.TableName,
			"delete_time": item.DeleteTime,
		}

		tableData = append(tableData, tableRow)
	}

	err = app.writeJSON(w, http.StatusOK, tableData)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

func (app *application) HandlerSyncDeletedPost(w http.ResponseWriter, r *http.Request) {
	type Payload struct {
		DeletedItems []models.DeletedItem `json:"deleted_items"`
	}

	var payload Payload
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.db.SyncDeletedItems(payload.DeletedItems)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response.OK = true
	err = app.writeJSON(w, http.StatusOK, response)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

func (app *application) HandlerSyncFlightRecordsGet(w http.ResponseWriter, r *http.Request) {

	tableData := []map[string]interface{}{}

	flightRecords, err := app.db.GetFlightRecords()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, item := range flightRecords {
		tableRow := map[string]interface{}{
			"uuid":            item.UUID,
			"date":            item.Date,
			"departure_place": item.Departure.Place,
			"departure_time":  item.Departure.Time,
			"arrival_place":   item.Arrival.Place,
			"arrival_time":    item.Arrival.Time,
			"aircraft_model":  item.Aircraft.Model,
			"reg_name":        item.Aircraft.Reg,
			"se_time":         item.Time.SE,
			"me_time":         item.Time.ME,
			"mcc_time":        item.Time.MCC,
			"total_time":      item.Time.Total,
			"day_landings":    item.Landings.Day,
			"night_landings":  item.Landings.Night,
			"night_time":      item.Time.Night,
			"ifr_time":        item.Time.IFR,
			"pic_time":        item.Time.PIC,
			"co_pilot_time":   item.Time.CoPilot,
			"dual_time":       item.Time.Dual,
			"instructor_time": item.Time.Instructor,
			"sim_type":        item.SIM.Type,
			"sim_time":        item.SIM.Time,
			"pic_name":        item.PIC,
			"remarks":         item.Remarks,
			"update_time":     item.UpdateTime,
		}

		tableData = append(tableData, tableRow)
	}

	err = app.writeJSON(w, http.StatusOK, tableData)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

func (app *application) HandlerSyncFlightRecordsPost(w http.ResponseWriter, r *http.Request) {

	type Payload struct {
		FlightRecords []models.FlightRecord `json:"flight_records"`
	}

	var payload Payload
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.db.SyncUploadedFlightRecords(payload.FlightRecords)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response.OK = true
	err = app.writeJSON(w, http.StatusOK, response)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

// returns all attachments without document body
func (app *application) HandlerSyncAttachmentsAll(w http.ResponseWriter, r *http.Request) {

	tableData := []map[string]interface{}{}

	flightRecords, err := app.db.GetAllAttachments()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, item := range flightRecords {
		tableRow := map[string]interface{}{
			"uuid":          item.UUID,
			"record_id":     item.RecordID,
			"document_name": item.DocumentName,
			"document":      []byte{0},
		}

		tableData = append(tableData, tableRow)
	}

	err = app.writeJSON(w, http.StatusOK, tableData)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

// returns the attachment records
func (app *application) HandlerSyncAttachments(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	att, err := app.db.GetAttachmentByID(uuid)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot find the attachment %s - %s", uuid, err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.writeJSON(w, http.StatusOK, att)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

func (app *application) HandlerSyncAttachmentsUpload(w http.ResponseWriter, r *http.Request) {

	var attachment models.Attachment
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&attachment)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.db.InsertAttachmentRecord(attachment)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response.OK = true
	err = app.writeJSON(w, http.StatusOK, response)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

func (app *application) HandlerSyncLicensingGet(w http.ResponseWriter, r *http.Request) {

	tableData := []map[string]interface{}{}

	licenses, err := app.db.GetLicenses()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, item := range licenses {
		tableRow := map[string]interface{}{
			"uuid":          item.UUID,
			"category":      item.Category,
			"name":          item.Name,
			"number":        item.Number,
			"issued":        item.Issued,
			"valid_from":    item.ValidFrom,
			"valid_until":   item.ValidUntil,
			"document_name": item.DocumentName,
			"document":      item.Document,
			"remarks":       item.Remarks,
			"update_time":   item.UpdateTime,
		}

		tableData = append(tableData, tableRow)
	}

	err = app.writeJSON(w, http.StatusOK, tableData)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

func (app *application) HandlerSyncLicensingPost(w http.ResponseWriter, r *http.Request) {

	type Payload struct {
		Licenses []models.License `json:"licenses"`
	}

	var payload Payload
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.db.SyncUploadedLicenses(payload.Licenses)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response.OK = true
	err = app.writeJSON(w, http.StatusOK, response)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}
