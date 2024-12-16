package main

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"
	"strings"
)

//go:embed static
var staticFS embed.FS

// other auxiliary handlers
func (app *application) HandlerStatic() http.Handler {
	return http.FileServer(http.FS(staticFS))
}

func (app *application) HandlerFavicon(w http.ResponseWriter, r *http.Request) {
	data, err := fs.ReadFile(staticFS, "static/favicon.ico")
	if err != nil {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Cache-Control", "private, max-age=3600, must-revalidate")
	w.Write(data)
}

func (app *application) HandlerNotFound(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotFound)

	if err := app.renderTemplate(w, r, "notfound", nil); err != nil {
		app.errorLog.Println(err)
	}
}

func (app *application) HandlerNotAllowed(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusMethodNotAllowed)

	if err := app.renderTemplate(w, r, "notallowed", nil); err != nil {
		app.errorLog.Println(err)
	}
}

func (app *application) HandlerPreferences(w http.ResponseWriter, r *http.Request) {
	settings, err := app.db.GetSettings()
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot get settings - %s", err))
		http.Error(w, "cannot get settings", http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"enable_flightrecord_tooltips": !settings.DisableFlightRecordHelp,
		"daterange_picker_first_day":   settings.DateRangePickerWeek,
		"licensing_rows":               settings.LicensingRows,
		"logbook_rows":                 settings.LogbookRows,
		"hide_stats_se":                settings.HideStatsFields.SE,
		"hide_stats_me":                settings.HideStatsFields.ME,
		"hide_stats_mcc":               settings.HideStatsFields.MCC,
		"hide_stats_night":             settings.HideStatsFields.Night,
		"hide_stats_ifr":               settings.HideStatsFields.IFR,
		"hide_stats_pic":               settings.HideStatsFields.PIC,
		"hide_stats_copilot":           settings.HideStatsFields.CoPilot,
		"hide_stats_dual":              settings.HideStatsFields.Dual,
		"hide_stats_instructor":        settings.HideStatsFields.Instructor,
		"hide_stats_sim":               settings.HideStatsFields.Sim,
		"hide_stats_crosscountry":      settings.HideStatsFields.CrossCountry,
		"hide_stats_landings":          settings.HideStatsFields.Landings,
		"hide_stats_distance":          settings.HideStatsFields.Distance,
		"signature_image":              settings.SignatureImage,
		"logbook_no_columns_change":    settings.LogbookNoColumnsChnage,
	}

	app.writeJSON(w, http.StatusOK, data)
}

//go:embed ui/dist/*
var ui embed.FS

func (app *application) HandlerUI() http.Handler {
	// Subdirectory inside the embedded FS where the React build is located
	dist, _ := fs.Sub(ui, "ui/dist")

	fileServer := http.FileServer(http.FS(dist))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPath := r.URL.Path

		if requestedPath != "/" && !strings.Contains(requestedPath, "assets") {
			r.URL.Path = "/"
		}

		fileServer.ServeHTTP(w, r)
	})
}
