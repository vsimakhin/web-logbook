package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/vsimakhin/web-logbook/internal/models"
	"github.com/vsimakhin/web-logbook/internal/nighttime"
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

// getFlightRecordHelpSetting returns if help messages on the flight record page are enabled
func (app *application) isFlightRecordHelpEnabled() bool {
	settings, err := app.db.GetSettings()
	if err != nil {
		app.errorLog.Println(err)
		return false
	}

	return !settings.DisableFlightRecordHelp
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
	var err error
	totals := make(map[string]models.FlightRecord)

	now := time.Now().UTC()
	minus12m := now.AddDate(0, -11, 0).UTC()

	days28 := now.AddDate(0, 0, -27).UTC().Format("20060102")
	days90 := now.AddDate(0, 0, -89).UTC().Format("20060102")
	months12 := time.Date(minus12m.Year(), minus12m.Month(), 1, 0, 0, 0, 0, time.UTC).Format("20060102")
	beginningOfMonth := now.AddDate(0, 0, -now.Day()+1).Format("20060102")
	endOfMonth := now.AddDate(0, 1, -now.Day()).Format("20060102")
	beginningOfYear := time.Date(now.Year(), time.January, 1, 0, 0, 0, 0, time.UTC).Format("20060102")
	endOfYear := time.Date(now.Year(), time.December, 31, 0, 0, 0, 0, time.UTC).Format("20060102")

	if startDate == "" || endDate == "" {
		startDate = farPast
		endDate = farFuture
	}

	// range totals
	totals["Totals"], err = app.db.GetTotals(startDate, endDate)
	if err != nil {
		return nil, err
	}

	// last 28 days
	totals["Last28"], err = app.db.GetTotals(days28, farFuture)
	if err != nil {
		return nil, err
	}

	// last 90 days
	totals["Last90"], err = app.db.GetTotals(days90, farFuture)
	if err != nil {
		return nil, err
	}

	// this months
	totals["Month"], err = app.db.GetTotals(beginningOfMonth, endOfMonth)
	if err != nil {
		return nil, err
	}

	// last 12 calendar months
	totals["Last12M"], err = app.db.GetTotals(months12, farFuture)
	if err != nil {
		return nil, err
	}

	// this years
	totals["Year"], err = app.db.GetTotals(beginningOfYear, endOfYear)
	if err != nil {
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

func (app *application) getServerUrls() []string {
	var urls []string
	re, _ := regexp.Compile(`^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$`)

	ifaces, err := net.Interfaces()
	if err != nil {
		return []string{"Cannot retrieve server ip address :("}
	}

	urlPrefix := "https://"
	if !app.config.tls.enabled {
		urlPrefix = "http://"
	}

	for _, i := range ifaces {
		addrs, err := i.Addrs()
		if err != nil {
			continue
		}

		for _, addr := range addrs {
			var ip net.IP
			switch v := addr.(type) {
			case *net.IPNet:
				ip = v.IP
			case *net.IPAddr:
				ip = v.IP
			}

			// check ip address like it's not ipv6, localhost and docker host one
			if re.MatchString(ip.String()) && ip.String() != "127.0.0.1" && ip.String() != "172.17.0.1" {
				urls = append(urls, fmt.Sprintf("%s%s:%d", urlPrefix, ip, app.config.port))
			}
		}
	}

	return urls
}

func decodeParameter(r *http.Request, parameter string) string {
	encoded := r.URL.Query().Get(parameter)
	decoded, err := url.QueryUnescape(encoded)
	if err != nil {
		return encoded
	}

	return strings.TrimSpace(decoded)
}
