package main

import (
	"net/http"

	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerStats is a handler for Stats page
func (app *application) HandlerStats(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APIStats)
	}

	data := make(map[string]interface{})

	totals, err := app.db.GetTotals(models.AllTotals)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	totals30, err := app.db.GetTotals(models.Last30Days)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	totals90, err := app.db.GetTotals(models.Last90Days)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	totalsYear, err := app.db.GetTotals(models.ThisYear)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	totalsMonth, err := app.db.GetTotals(models.ThisMonth)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	totalsByYear, err := app.db.GetTotalsByYear()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	totalsByAircraft, err := app.db.GetTotalsByAircraftType()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	totalsByClass, err := app.db.GetTotalsByAircraftClass()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data["totals"] = totals
	data["totals30"] = totals30
	data["totals90"] = totals90
	data["totalsY"] = totalsYear
	data["totalsM"] = totalsMonth
	data["totalsByYear"] = totalsByYear
	data["totalsByAircraft"] = totalsByAircraft
	data["totalsByClass"] = totalsByClass

	if err := app.renderTemplate(w, r, "stats", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
}
