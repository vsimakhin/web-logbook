package main

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/vsimakhin/web-logbook/internal/models"
	"golang.org/x/exp/slices"
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

// HandlerStatsTotals is a handler for the Totals table source
func (app *application) HandlerStatsTotals(w http.ResponseWriter, r *http.Request) {

	// get filter parameters
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")

	settings, err := app.db.GetSettings()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var tableData models.TableData

	totals, err := app.getTotalStats(startDate, endDate)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// let's form our custom totals table
	tableData.Data = append(tableData.Data, []string{"A", "Total",
		totals["Last28"].Time.Total,
		totals["Month"].Time.Total,
		totals["Last90"].Time.Total,
		totals["Last12M"].Time.Total,
		totals["Year"].Time.Total,
		totals["Totals"].Time.Total,
	})
	if !settings.HideStatsFields.SE {
		tableData.Data = append(tableData.Data, []string{"B", "Single Engine",
			totals["Last28"].Time.SE,
			totals["Month"].Time.SE,
			totals["Last90"].Time.SE,
			totals["Last12M"].Time.SE,
			totals["Year"].Time.SE,
			totals["Totals"].Time.SE,
		})
	}
	if !settings.HideStatsFields.ME {
		tableData.Data = append(tableData.Data, []string{"C", "Multi Engine",
			totals["Last28"].Time.ME,
			totals["Month"].Time.ME,
			totals["Last90"].Time.ME,
			totals["Last12M"].Time.ME,
			totals["Year"].Time.ME,
			totals["Totals"].Time.ME,
		})
	}
	if !settings.HideStatsFields.MCC {
		tableData.Data = append(tableData.Data, []string{"D", "MCC",
			totals["Last28"].Time.MCC,
			totals["Month"].Time.MCC,
			totals["Last90"].Time.MCC,
			totals["Last12M"].Time.MCC,
			totals["Year"].Time.MCC,
			totals["Totals"].Time.MCC,
		})
	}
	if !settings.HideStatsFields.Night {
		tableData.Data = append(tableData.Data, []string{"E", "Night",
			totals["Last28"].Time.Night,
			totals["Month"].Time.Night,
			totals["Last90"].Time.Night,
			totals["Last12M"].Time.Night,
			totals["Year"].Time.Night,
			totals["Totals"].Time.Night,
		})
	}
	if !settings.HideStatsFields.IFR {
		tableData.Data = append(tableData.Data, []string{"F", "IFR",
			totals["Last28"].Time.IFR,
			totals["Month"].Time.IFR,
			totals["Last90"].Time.IFR,
			totals["Last12M"].Time.IFR,
			totals["Year"].Time.IFR,
			totals["Totals"].Time.IFR,
		})
	}
	if !settings.HideStatsFields.PIC {
		tableData.Data = append(tableData.Data, []string{"G", "PIC",
			totals["Last28"].Time.PIC,
			totals["Month"].Time.PIC,
			totals["Last90"].Time.PIC,
			totals["Last12M"].Time.PIC,
			totals["Year"].Time.PIC,
			totals["Totals"].Time.PIC,
		})
	}
	if !settings.HideStatsFields.CoPilot {
		tableData.Data = append(tableData.Data, []string{"H", "CoPilot",
			totals["Last28"].Time.CoPilot,
			totals["Month"].Time.CoPilot,
			totals["Last90"].Time.CoPilot,
			totals["Last12M"].Time.CoPilot,
			totals["Year"].Time.CoPilot,
			totals["Totals"].Time.CoPilot,
		})
	}
	if !settings.HideStatsFields.Dual {
		tableData.Data = append(tableData.Data, []string{"I", "Dual",
			totals["Last28"].Time.Dual,
			totals["Month"].Time.Dual,
			totals["Last90"].Time.Dual,
			totals["Last12M"].Time.Dual,
			totals["Year"].Time.Dual,
			totals["Totals"].Time.Dual,
		})
	}
	if !settings.HideStatsFields.Instructor {
		tableData.Data = append(tableData.Data, []string{"J", "Instructor",
			totals["Last28"].Time.Instructor,
			totals["Month"].Time.Instructor,
			totals["Last90"].Time.Instructor,
			totals["Last12M"].Time.Instructor,
			totals["Year"].Time.Instructor,
			totals["Totals"].Time.Instructor,
		})
	}
	if !settings.HideStatsFields.Sim {
		tableData.Data = append(tableData.Data, []string{"K", "Simulator",
			totals["Last28"].SIM.Time,
			totals["Month"].SIM.Time,
			totals["Last90"].SIM.Time,
			totals["Last12M"].SIM.Time,
			totals["Year"].SIM.Time,
			totals["Totals"].SIM.Time,
		})
	}
	if !settings.HideStatsFields.CrossCountry {
		tableData.Data = append(tableData.Data, []string{"L", "Cross Country",
			totals["Last28"].Time.CrossCountry,
			totals["Month"].Time.CrossCountry,
			totals["Last90"].Time.CrossCountry,
			totals["Last12M"].Time.CrossCountry,
			totals["Year"].Time.CrossCountry,
			totals["Totals"].Time.CrossCountry,
		})
	}
	if !settings.HideStatsFields.Landings {
		tableData.Data = append(tableData.Data, []string{"M", "Landings (day/night)",
			fmt.Sprintf("%d/%d", totals["Last28"].Landings.Day, totals["Last28"].Landings.Night),
			fmt.Sprintf("%d/%d", totals["Month"].Landings.Day, totals["Month"].Landings.Night),
			fmt.Sprintf("%d/%d", totals["Last90"].Landings.Day, totals["Last90"].Landings.Night),
			fmt.Sprintf("%d/%d", totals["Last12M"].Landings.Day, totals["Last12M"].Landings.Night),
			fmt.Sprintf("%d/%d", totals["Year"].Landings.Day, totals["Year"].Landings.Night),
			fmt.Sprintf("%d/%d", totals["Totals"].Landings.Day, totals["Totals"].Landings.Night),
		})
	}
	if !settings.HideStatsFields.Distance {
		tableData.Data = append(tableData.Data, []string{"N", "Distance",
			formatNumber(totals["Last28"].Distance),
			formatNumber(totals["Month"].Distance),
			formatNumber(totals["Last90"].Distance),
			formatNumber(totals["Last12M"].Distance),
			formatNumber(totals["Year"].Distance),
			formatNumber(totals["Totals"].Distance),
		})
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

// HandlerStats is a handler for Stats Totals page
func (app *application) HandlerStatsTotalsPage(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})
	data["activePage"] = "stats"
	data["activeSubPage"] = "totals"
	if err := app.renderTemplate(w, r, "stats-totals", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerStatsTotalsByYearPage is a handler for Stats Totals by Year page
func (app *application) HandlerStatsTotalsByYearPage(w http.ResponseWriter, r *http.Request) {
	data := make(map[string]interface{})

	totalsByYear, err := app.db.GetTotalsByYear()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data["totalsByYear"] = totalsByYear
	data["activePage"] = "stats"
	data["activeSubPage"] = "totalsByYear"
	if err := app.renderTemplate(w, r, "stats-totals-year", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerStatsTotalsByMonthPage is a handler for Stats Totals by Month page
func (app *application) HandlerStatsTotalsByMonthPage(w http.ResponseWriter, r *http.Request) {
	// get all years in the logbook
	years, err := app.db.GetYears()
	if err != nil {
		app.errorLog.Println(err)
	}

	// year parameter
	year := chi.URLParam(r, "year")
	_, err = strconv.Atoi(year)
	if err != nil || !slices.Contains(years, year) {
		year = years[0]
	}

	// start and end dates for the selected year
	startDate, err := time.Parse("20060102", fmt.Sprintf("%s0101", year))
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	endDate, err := time.Parse("20060102", fmt.Sprintf("%s1231", year))
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// get totals by month
	totalsByMonth, err := app.db.GetDetailedTotals(
		startDate.Format("20060102"), endDate.Format("20060102"), true,
		app.db.GenerateFlightRecordMap(startDate, endDate, true),
	)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := make(map[string]interface{})
	data["activePage"] = "stats"
	data["activeSubPage"] = "totalsByMonth"
	data["totalsByMonth"] = totalsByMonth
	data["years"] = years
	data["year"] = year
	if err := app.renderTemplate(w, r, "stats-totals-month", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
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
