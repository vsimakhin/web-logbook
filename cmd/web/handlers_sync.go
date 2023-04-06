package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerSyncData generates data for sync with mobile app
func (app *application) HandlerSyncData(w http.ResponseWriter, r *http.Request) {

	tableData := []map[string]string{}

	flightRecords, err := app.db.GetFlightRecords()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, item := range flightRecords {
		tableRow := map[string]string{
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
			"day_landings":    formatLandings(item.Landings.Day),
			"night_landings":  formatLandings(item.Landings.Night),
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
			"update_time":     fmt.Sprintf("%d", item.UpdateTime),
		}

		tableData = append(tableData, tableRow)
	}

	err = app.writeJSON(w, http.StatusOK, tableData)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

// HandlerSyncDataDeleted generates removed items data for sync with mobile app
func (app *application) HandlerSyncDataDeleted(w http.ResponseWriter, r *http.Request) {

	tableData := []map[string]string{}

	dis, err := app.db.GetDeletedItems()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, item := range dis {
		tableRow := map[string]string{
			"uuid":        item.UUID,
			"table_name":  item.TableName,
			"delete_time": fmt.Sprintf("%d", item.DeleteTime),
		}

		tableData = append(tableData, tableRow)
	}

	err = app.writeJSON(w, http.StatusOK, tableData)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

// HandlerSyncDataUpload receivs records and deleted items from mobile app
func (app *application) HandlerSyncDataUpload(w http.ResponseWriter, r *http.Request) {

	type Payload struct {
		FlightRecords []models.FlightRecord `json:"flight_records"`
		DeletedItems  []models.DeletedItem  `json:"deleted_items"`
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
