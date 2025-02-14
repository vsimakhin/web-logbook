package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"runtime"
	"strings"
	"time"

	"github.com/vsimakhin/web-logbook/internal/models"
	"github.com/vsimakhin/web-logbook/internal/nighttime"
	"golang.org/x/exp/slices"
)

// writeJSON writes arbitrary data out as JSON
func (app *application) writeJSON(w http.ResponseWriter, status int, data interface{}, headers ...http.Header) {
	out, err := json.Marshal(data)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
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
		app.errorLog.Println(err)
	}
}

func (app *application) writeErrorResponse(w http.ResponseWriter, status int, message string) {
	response := models.JSONResponse{
		OK:      false,
		Message: message,
	}
	app.writeJSON(w, status, response)
}

func (app *application) writeOkResponse(w http.ResponseWriter, message string) {
	response := models.JSONResponse{
		OK:      true,
		Message: message,
	}
	app.writeJSON(w, http.StatusOK, response)
}

func (app *application) handleError(w http.ResponseWriter, err error) {
	// Capture the file and line number of the original error
	_, file, line, ok := runtime.Caller(1)
	if ok {
		app.errorLog.Printf("%s:%d: %v", path.Base(file), line, err)
	} else {
		app.errorLog.Println(err)
	}
	// app.errorLog.Println(err)
	app.writeErrorResponse(w, http.StatusInternalServerError, err.Error())
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

	body, err := io.ReadAll(resp.Body)
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
	lastAircrafts, err := app.db.GetAircraftsInLogbook(models.LastAircrafts)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot get aircrafts list - %s", err))
	}

	for key, val := range lastAircrafts {
		if !slices.Contains(aircraftRegs, key) {
			aircraftRegs = append(aircraftRegs, key)
		}
		if !slices.Contains(aircraftModels, val) {
			aircraftModels = append(aircraftModels, val)
		}
	}

	slices.Sort(aircraftRegs)
	slices.Sort(aircraftModels)

	return aircraftRegs, aircraftModels
}

// parameterFilter is a custom string case insensetive compare function
func parameterFilter(s string, substr string) bool {
	if strings.TrimSpace(s) == "" {
		return true
	}

	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
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

// func getTotalStats returns set of flight statistics which is used by stats handlers
func (app *application) getTotalStats(startDate string, endDate string) (map[string]models.FlightRecord, error) {
	totals := make(map[string]models.FlightRecord)

	now := time.Now().UTC()
	minus12m := now.AddDate(0, -11, 0).UTC()

	dates := map[string][]string{
		"Totals":  {startDate, endDate},
		"Last28":  {now.AddDate(0, 0, -27).UTC().Format("20060102"), farFuture},
		"Last90":  {now.AddDate(0, 0, -89).UTC().Format("20060102"), farFuture},
		"Month":   {now.AddDate(0, 0, -now.Day()+1).Format("20060102"), now.AddDate(0, 1, -now.Day()).Format("20060102")},
		"Last12M": {time.Date(minus12m.Year(), minus12m.Month(), 1, 0, 0, 0, 0, time.UTC).Format("20060102"), farFuture},
		"Year":    {time.Date(now.Year(), time.January, 1, 0, 0, 0, 0, time.UTC).Format("20060102"), time.Date(now.Year(), time.December, 31, 0, 0, 0, 0, time.UTC).Format("20060102")},
	}

	if startDate == "" || endDate == "" {
		dates["Totals"] = []string{farPast, farFuture}
	}

	for key, dateRange := range dates {
		total, err := app.db.GetTotals(dateRange[0], dateRange[1])
		if err != nil {
			return nil, err
		}
		totals[key] = total
	}

	return totals, nil
}

// getDetailedLimitsStats retrieves detailed limit statistics for different time periods.
// It returns a map of limit statistics, where the keys represent the time periods and the values represent the statistics.
// It returns the map of limit statistics and an error if any occurred during the retrieval process.
func (app *application) getDetailedLimitsStats() (map[string]map[string]string, error) {
	totals := make(map[string]map[string]string)

	now := time.Now().UTC()
	minus12m := now.AddDate(0, -11, 0).UTC()

	getData := func(key string, startDate time.Time, groupByMonth bool) error {
		total, err := app.db.GetDetailedTotals(
			startDate.Format("20060102"), farFuture,
			groupByMonth, app.db.GenerateFlightRecordMap(startDate, now, groupByMonth),
		)
		if err != nil {
			return err
		}

		totalTimeMap := make(map[string]string)
		for key, record := range total {
			totalTimeMap[key] = record.Time.Total
		}

		totals[key] = totalTimeMap
		return nil
	}

	if err := getData("Last28", now.AddDate(0, 0, -27), false); err != nil {
		return nil, err
	}
	if err := getData("Last90", now.AddDate(0, 0, -89), false); err != nil {
		return nil, err
	}
	if err := getData("Last12m", time.Date(minus12m.Year(), minus12m.Month(), 1, 0, 0, 0, 0, time.UTC), true); err != nil {
		return nil, err
	}
	if err := getData("Last1y", time.Date(now.Year(), time.January, 1, 0, 0, 0, 0, time.UTC), true); err != nil {
		return nil, err
	}

	return totals, nil
}

// calculateNightTime returns the nighttime.Route object which later can be called
// to calculate night time, like obj.NightTime()
func (app *application) calculateNightTime(fr models.FlightRecord) (time.Duration, error) {
	night := time.Duration(0)

	departure_place, err := app.db.GetAirportByID(fr.Departure.Place)
	if err != nil {
		return night, fmt.Errorf("error calculating night time, cannot find %s - %s", fr.Departure.Place, err)
	}

	departure_time, err := time.Parse("02/01/2006 1504", fmt.Sprintf("%s %s", fr.Date, fr.Departure.Time))
	if err != nil {
		return night, fmt.Errorf("error calculating night time, wrong date format %s - %s", fmt.Sprintf("%s %s", fr.Date, fr.Departure.Time), err)
	}

	arrival_place, err := app.db.GetAirportByID(fr.Arrival.Place)
	if err != nil {
		return night, fmt.Errorf("error calculating night time, cannot find %s - %s", fr.Arrival.Place, err)
	}

	arrival_time, err := time.Parse("02/01/2006 1504", fmt.Sprintf("%s %s", fr.Date, fr.Arrival.Time))
	if err != nil {
		return night, fmt.Errorf("error calculating night time, wrong date format %s - %s", fmt.Sprintf("%s %s", fr.Date, fr.Arrival.Time), err)
	}

	// correct arrival time if the flight is through midnight
	if arrival_time.Before(departure_time) {
		arrival_time = arrival_time.Add(24 * time.Hour)
	}

	route := nighttime.Route{
		Departure: nighttime.Place{
			Lat:  departure_place.Lat,
			Lon:  departure_place.Lon,
			Time: departure_time,
		},
		Arrival: nighttime.Place{
			Lat:  arrival_place.Lat,
			Lon:  arrival_place.Lon,
			Time: arrival_time,
		},
	}
	night = route.NightTime()

	return night, nil
}

func decodeParameter(r *http.Request, parameter string) string {
	encoded := r.URL.Query().Get(parameter)
	decoded, err := url.QueryUnescape(encoded)
	if err != nil {
		return encoded
	}

	return strings.TrimSpace(decoded)
}

func (app *application) formatTimeField(timeField string) string {
	if app.timeFieldsAutoFormat == 0 || timeField == "" {
		return timeField
	}

	parts := strings.Split(timeField, ":")

	if len(parts) != 2 { // probably some wrong value in the field
		if timeField == "0" {
			return ""
		}

		return timeField
	}

	hours := parts[0]
	minutes := parts[1]

	if app.timeFieldsAutoFormat == 1 {
		// add leading zero if missing
		if len(hours) == 1 {
			hours = fmt.Sprintf("0%s", hours)
		}
	} else {
		// Remove leading zero if present
		if strings.HasPrefix(hours, "0") && len(hours) == 2 {
			hours = hours[1:]
		}
	}

	return hours + ":" + minutes
}
