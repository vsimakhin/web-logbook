package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/vsimakhin/web-logbook/internal/models"
	"golang.org/x/exp/slices"
)

// writeJSON writes arbitrary data out as JSON
func (app *application) writeJSON(w http.ResponseWriter, status int, data interface{}, headers ...http.Header) error {
	out, err := json.Marshal(data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return err
	}

	if len(headers) > 0 {
		for k, v := range headers[0] {
			w.Header()[k] = v
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, err = w.Write(out)
	if err != nil {
		return err
	}

	return nil
}

// checkNewVersion checks if the new version released on github
func (app *application) checkNewVersion() {
	type githubResponse struct {
		Name string `json:"name"`
	}

	resp, err := http.Get("https://api.github.com/repos/vsimakhin/web-logbook/releases/latest")
	if err != nil {
		app.infoLog.Println(fmt.Errorf("cannot retrieve the latest release, no internet connection? - %s", err))
		return
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot retrieve the latest release - %s", err))
		return
	}

	var release githubResponse
	err = json.Unmarshal(body, &release)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("error decoding github response - %s", err))
		return
	}

	// just a simple compare of the versions, if not equal - show the badge
	if !strings.Contains(release.Name, app.version) {
		app.infoLog.Printf("new version %s is available https://github.com/vsimakhin/web-logbook\n", release.Name)
		app.isNewVersion = true
	}
}

// lastRegsAndModels returns aircrafts registrations and models for the last 100 flight records
func (app *application) lastRegsAndModels() (aircraftRegs []string, aircraftModels []string) {
	lastAircrafts, err := app.db.GetAircrafts(models.LastAircrafts)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot get aircrafts list - %s", err))
	}

	for key, val := range lastAircrafts {
		aircraftRegs = append(aircraftRegs, key)
		aircraftModels = append(aircraftModels, val)
	}

	return aircraftRegs, aircraftModels
}

// getShowFlightRecordHelpSetting returns if help messages on the flight record page are enabled
func (app *application) getShowFlightRecordHelpSetting() bool {
	settings, err := app.db.GetSettings()
	if err != nil {
		app.errorLog.Println(err)
		return false
	}

	return settings.EnableFlightRecordHelp
}

// parameterFilter is some custom string compare function
func parameterFilter(s string, substr string) bool {
	if strings.TrimSpace(s) == "" {
		return true
	}

	return strings.Contains(s, substr)
}

func parameterClassFilter(classes map[string]string, model string, filter string) bool {
	if strings.TrimSpace(filter) == "" {
		return true
	}

	var ac []string

	for key, element := range classes {
		if slices.Contains(strings.Split(element, ","), model) {
			ac = append(ac, key)
		}
	}

	// aircraft is not classified
	if len(ac) == 0 {
		ac = append(ac, model)
	}

	return slices.Contains(ac, filter)
}
