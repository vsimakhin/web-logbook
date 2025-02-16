package main

import (
	"fmt"
	"net/http"

	"github.com/vsimakhin/web-logbook/internal/models"
)

const farFuture = "30000101"
const farPast = "19000101"

// HandlerStatsTotalsByClass is a handler for the Totals By Class table source
func (app *application) HandlerStatsTotalsByClass(w http.ResponseWriter, r *http.Request) {
	// get filter parameters
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")

	var tableData models.TableData

	if startDate == "" || endDate == "" {
		startDate = farPast
		endDate = farFuture
	}

	totals, err := app.db.GetTotalsByAircraftClass(startDate, endDate)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for class, item := range totals {
		tableRow := []string{class, item.Time.SE, item.Time.ME, item.Time.MCC, item.Time.Night,
			item.Time.IFR, item.Time.PIC, item.Time.CoPilot, item.Time.Dual, item.Time.Instructor,
			item.SIM.Time, item.Time.CrossCountry, fmt.Sprintf("%d/%d", item.Landings.Day, item.Landings.Night),
			formatNumber(item.Distance), item.Time.Total}

		tableData.Data = append(tableData.Data, tableRow)
	}

	if len(tableData.Data) == 0 {
		tableData.Data = append(tableData.Data, []string{"", "", "", "", "", "", "", "", "", "", "", "", "", "", ""})
	}

	app.writeJSON(w, http.StatusOK, tableData)
}

// HandlerStatsTotalsByType is a handler for the Totals By Type table source
func (app *application) HandlerStatsTotalsByType(w http.ResponseWriter, r *http.Request) {
	// get filter parameters
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")

	var tableData models.TableData

	if startDate == "" || endDate == "" {
		startDate = farPast
		endDate = farFuture
	}

	totals, err := app.db.GetTotalsByAircraftType(startDate, endDate)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for aircraft, item := range totals {
		tableRow := []string{aircraft, item.Time.SE, item.Time.ME, item.Time.MCC, item.Time.Night,
			item.Time.IFR, item.Time.PIC, item.Time.CoPilot, item.Time.Dual, item.Time.Instructor,
			item.SIM.Time, item.Time.CrossCountry, fmt.Sprintf("%d/%d", item.Landings.Day, item.Landings.Night),
			formatNumber(item.Distance), item.Time.Total}

		tableData.Data = append(tableData.Data, tableRow)
	}

	if len(tableData.Data) == 0 {
		tableData.Data = append(tableData.Data, []string{"", "", "", "", "", "", "", "", "", "", "", "", "", "", ""})
	}

	app.writeJSON(w, http.StatusOK, tableData)
}

// HandlerStatsLimits is a handler for the Flight Time Limitations table source
func (app *application) HandlerStatsLimits(w http.ResponseWriter, r *http.Request) {

	totals, err := app.getTotalStats("", "")
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	detailed, err := app.getDetailedLimitsStats()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := map[string]map[string]interface{}{
		"totals": {
			"last28":  totals["Last28"].Time.Total,
			"last90":  totals["Last90"].Time.Total,
			"last12m": totals["Last12M"].Time.Total,
			"last1y":  totals["Year"].Time.Total,
		},
		"detailed": {
			"last28":  detailed["Last28"],
			"last90":  detailed["Last90"],
			"last12m": detailed["Last12m"],
			"last1y":  detailed["Last1y"],
		},
	}

	app.writeJSON(w, http.StatusOK, data)
}

// HandlerStatsTotalsByTypePage is a handler for Stats Totals by Type page
func (app *application) HandlerStatsTotalsByTypePage(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	data["activePage"] = "stats"
	data["activeSubPage"] = "totalsByType"
	if err := app.renderTemplate(w, r, "stats-totals-type", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerStatsTotalsByClassPage is a handler for Stats Totals by Class page
func (app *application) HandlerStatsTotalsByClassPage(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	data["activePage"] = "stats"
	data["activeSubPage"] = "totalsByClass"
	if err := app.renderTemplate(w, r, "stats-totals-class", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerStatsLimitsPage is a handler for Stats Limits page
func (app *application) HandlerStatsLimitsPage(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	totals, err := app.getTotalStats("", "")
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data["last28"] = totals["Last28"].Time.Total
	data["last90"] = totals["Last90"].Time.Total
	data["last12m"] = totals["Last12M"].Time.Total
	data["last1y"] = totals["Year"].Time.Total

	data["activePage"] = "stats"
	data["activeSubPage"] = "limits"
	if err := app.renderTemplate(w, r, "stats-limits", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
}
