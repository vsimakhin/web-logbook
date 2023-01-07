package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/vsimakhin/web-logbook/internal/models"
)

const farFuture = "30000101"
const farPast = "19000101"

// HandlerStatsTotalsByClass is a handler for the Totals By Class table source
func (app *application) HandlerStatsTotalsByClass(w http.ResponseWriter, r *http.Request) {
	// get filter parameters
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")

	if app.config.env == "dev" {
		if startDate != "" && endDate != "" {
			app.infoLog.Printf(fmt.Sprintf("%s/start_date=%s&end_date=%s\n", APIStatsTotalsByClass, startDate, endDate))
		} else {
			app.infoLog.Println(APIStatsTotalsByClass)
		}
	}

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
			item.SIM.Time, fmt.Sprintf("%d/%d", item.Landings.Day, item.Landings.Night),
			formatNumber(item.Distance), item.Time.Total}

		tableData.Data = append(tableData.Data, tableRow)
	}

	if len(tableData.Data) == 0 {
		tableData.Data = append(tableData.Data, []string{"", "", "", "", "", "", "", "", "", "", "", "", "", ""})
	}

	err = app.writeJSON(w, http.StatusOK, tableData)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

// HandlerStatsTotalsByType is a handler for the Totals By Type table source
func (app *application) HandlerStatsTotalsByType(w http.ResponseWriter, r *http.Request) {
	// get filter parameters
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")

	if app.config.env == "dev" {
		if startDate != "" && endDate != "" {
			app.infoLog.Printf(fmt.Sprintf("%s/start_date=%s&end_date=%s\n", APIStatsTotalsByType, startDate, endDate))
		} else {
			app.infoLog.Println(APIStatsTotalsByType)
		}
	}

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
			item.SIM.Time, fmt.Sprintf("%d/%d", item.Landings.Day, item.Landings.Night),
			formatNumber(item.Distance), item.Time.Total}

		tableData.Data = append(tableData.Data, tableRow)
	}

	if len(tableData.Data) == 0 {
		tableData.Data = append(tableData.Data, []string{"", "", "", "", "", "", "", "", "", "", "", "", "", ""})
	}

	err = app.writeJSON(w, http.StatusOK, tableData)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

// HandlerStatsTotals is a handler for the Totals table source
func (app *application) HandlerStatsTotals(w http.ResponseWriter, r *http.Request) {

	// get filter parameters
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")

	if app.config.env == "dev" {
		if startDate != "" && endDate != "" {
			app.infoLog.Printf(fmt.Sprintf("%s/start_date=%s&end_date=%s\n", APIStatsTotals, startDate, endDate))
		} else {
			app.infoLog.Println(APIStatsTotals)
		}
	}

	var tableData models.TableData
	now := time.Now().UTC()
	days30 := now.AddDate(0, 0, -29).UTC().Format("20060102")
	days90 := now.AddDate(0, 0, -89).UTC().Format("20060102")
	beginningOfMonth := now.AddDate(0, 0, -now.Day()+1).Format("20060102")
	endOfMonth := now.AddDate(0, 1, -now.Day()).Format("20060102")
	beginningOfYear := time.Date(now.Year(), time.January, 1, 0, 0, 0, 0, time.UTC).Format("20060102")
	endOfYear := time.Date(now.Year(), time.December, 31, 0, 0, 0, 0, time.UTC).Format("20060102")

	if startDate == "" || endDate == "" {
		startDate = farPast
		endDate = farFuture
	}
	totals, err := app.db.GetTotals(startDate, endDate)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// last 30 days
	totals30, err := app.db.GetTotals(days30, farFuture)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// last 90 days
	totals90, err := app.db.GetTotals(days90, farFuture)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// this months
	totalsMonth, err := app.db.GetTotals(beginningOfMonth, endOfMonth)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// this years
	totalsYear, err := app.db.GetTotals(beginningOfYear, endOfYear)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// let's form our custom totals table
	tableData.Data = append(tableData.Data,
		[]string{"A", "Total", totals30.Time.Total, totalsMonth.Time.Total, totals90.Time.Total, totalsYear.Time.Total, totals.Time.Total})
	tableData.Data = append(tableData.Data,
		[]string{"B", "Single Engine", totals30.Time.SE, totalsMonth.Time.SE, totals90.Time.SE, totalsYear.Time.SE, totals.Time.SE})
	tableData.Data = append(tableData.Data,
		[]string{"C", "Multi Engine", totals30.Time.ME, totalsMonth.Time.ME, totals90.Time.ME, totalsYear.Time.ME, totals.Time.ME})
	tableData.Data = append(tableData.Data,
		[]string{"D", "MCC", totals30.Time.MCC, totalsMonth.Time.MCC, totals90.Time.MCC, totalsYear.Time.MCC, totals.Time.MCC})
	tableData.Data = append(tableData.Data,
		[]string{"E", "Night", totals30.Time.Night, totalsMonth.Time.Night, totals90.Time.Night, totalsYear.Time.Night, totals.Time.Night})
	tableData.Data = append(tableData.Data,
		[]string{"F", "IFR", totals30.Time.IFR, totalsMonth.Time.IFR, totals90.Time.IFR, totalsYear.Time.IFR, totals.Time.IFR})
	tableData.Data = append(tableData.Data,
		[]string{"G", "PIC", totals30.Time.PIC, totalsMonth.Time.PIC, totals90.Time.PIC, totalsYear.Time.PIC, totals.Time.PIC})
	tableData.Data = append(tableData.Data,
		[]string{"H", "CoPilot", totals30.Time.CoPilot, totalsMonth.Time.CoPilot, totals90.Time.CoPilot, totalsYear.Time.CoPilot, totals.Time.CoPilot})
	tableData.Data = append(tableData.Data,
		[]string{"I", "Dual", totals30.Time.Dual, totalsMonth.Time.Dual, totals90.Time.Dual, totalsYear.Time.Dual, totals.Time.Dual})
	tableData.Data = append(tableData.Data,
		[]string{"J", "Instructor", totals30.Time.Instructor, totalsMonth.Time.Instructor, totals90.Time.Instructor, totalsYear.Time.Instructor, totals.Time.Instructor})
	tableData.Data = append(tableData.Data,
		[]string{"K", "Simulator", totals30.SIM.Time, totalsMonth.SIM.Time, totals90.SIM.Time, totalsYear.SIM.Time, totals.SIM.Time})
	tableData.Data = append(tableData.Data,
		[]string{"L", "Landings (day/night)",
			fmt.Sprintf("%d/%d", totals30.Landings.Day, totals30.Landings.Night),
			fmt.Sprintf("%d/%d", totalsMonth.Landings.Day, totalsMonth.Landings.Night),
			fmt.Sprintf("%d/%d", totals90.Landings.Day, totals90.Landings.Night),
			fmt.Sprintf("%d/%d", totalsYear.Landings.Day, totalsYear.Landings.Night),
			fmt.Sprintf("%d/%d", totals.Landings.Day, totals.Landings.Night)})
	tableData.Data = append(tableData.Data,
		[]string{"M", "Distance", formatNumber(totals30.Distance), formatNumber(totalsMonth.Distance), formatNumber(totals90.Distance),
			formatNumber(totalsYear.Distance), formatNumber(totals.Distance)})

	err = app.writeJSON(w, http.StatusOK, tableData)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

// HandlerStatsLimits is a handler for the Flight Time Limitations table source
func (app *application) HandlerStatsLimits(w http.ResponseWriter, r *http.Request) {

	if app.config.env == "dev" {
		app.infoLog.Println(APIStatsLimits)
	}

	var tableData models.TableData
	now := time.Now().UTC()
	minus12m := now.AddDate(0, -11, 0).UTC()

	days28 := now.AddDate(0, 0, -27).UTC().Format("20060102")
	days90 := now.AddDate(0, 0, -89).UTC().Format("20060102")
	months12 := time.Date(minus12m.Year(), minus12m.Month(), 1, 0, 0, 0, 0, time.UTC).Format("20060102")
	beginningOfYear := time.Date(now.Year(), time.January, 1, 0, 0, 0, 0, time.UTC).Format("20060102")
	endOfYear := time.Date(now.Year(), time.December, 31, 0, 0, 0, 0, time.UTC).Format("20060102")

	// last 28 days
	totals28, err := app.db.GetTotals(days28, farFuture)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// last 90 days
	totals90, err := app.db.GetTotals(days90, farFuture)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// last 12 calendar months
	totals12m, err := app.db.GetTotals(months12, farFuture)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// current calendar year
	totalsYear, err := app.db.GetTotals(beginningOfYear, endOfYear)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// let's form our custom table
	tableData.Data = append(tableData.Data,
		[]string{totals28.Time.Total, totals90.Time.Total, totals12m.Time.Total, totalsYear.Time.Total})

	err = app.writeJSON(w, http.StatusOK, tableData)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

// HandlerStats is a handler for Stats page
func (app *application) HandlerStats(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APIStats)
	}

	data := make(map[string]interface{})

	totalsByYear, err := app.db.GetTotalsByYear()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data["totalsByYear"] = totalsByYear

	partials := []string{"stats-totals", "stats-totals-year", "stats-totals-type", "stats-totals-class", "stats-js", "common-js"}

	if err := app.renderTemplate(w, r, "stats", &templateData{Data: data}, partials...); err != nil {
		app.errorLog.Println(err)
	}
}
