package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path"
	"runtime"
	"time"

	"github.com/vsimakhin/web-logbook/internal/models"
	"github.com/vsimakhin/web-logbook/internal/nighttime"
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

// calculateNightTime returns the nighttime.Route object which later can be called
// to calculate night time, like obj.NightTime()
func (app *application) calculateNightTime(fr models.FlightRecord) (time.Duration, bool, error) {
	night := time.Duration(0)
	if fr.Departure.Place == "" || fr.Arrival.Place == "" || fr.Departure.Time == "" || fr.Arrival.Time == "" {
		return night, false, nil
	}

	departure_place, err := app.db.GetAirportByID(fr.Departure.Place)
	if err != nil {
		return night, false, fmt.Errorf("error calculating night time, cannot find %s - %s", fr.Departure.Place, err)
	}

	departure_time, err := time.Parse("02/01/2006 1504", fmt.Sprintf("%s %s", fr.Date, fr.Departure.Time))
	if err != nil {
		return night, false, fmt.Errorf("error calculating night time, wrong date format %s - %s", fmt.Sprintf("%s %s", fr.Date, fr.Departure.Time), err)
	}

	arrival_place, err := app.db.GetAirportByID(fr.Arrival.Place)
	if err != nil {
		return night, false, fmt.Errorf("error calculating night time, cannot find %s - %s", fr.Arrival.Place, err)
	}

	arrival_time, err := time.Parse("02/01/2006 1504", fmt.Sprintf("%s %s", fr.Date, fr.Arrival.Time))
	if err != nil {
		return night, false, fmt.Errorf("error calculating night time, wrong date format %s - %s", fmt.Sprintf("%s %s", fr.Date, fr.Arrival.Time), err)
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

	return night, route.IsNightLanding(), nil
}

func (app *application) formatTimeField(minutes int) string {
	if minutes < 0 {
		return ""
	}

	if app.timeFieldsAutoFormat == 3 {
		// FAA format, decimals
		return fmt.Sprintf("%.1f", float64(minutes)/60)
	}

	hours := minutes / 60
	mins := minutes % 60

	switch app.timeFieldsAutoFormat {
	case 1:
		// Format as HH:MM
		return fmt.Sprintf("%02d:%02d", hours, mins)
	case 2, 0:
		// Format as H:MM
		// autoFormat 0 is the old setting for doing nothing,
		// but time is now stored as minutes.
		return fmt.Sprintf("%d:%02d", hours, mins)
	default:
		return fmt.Sprintf("%d:%02d", hours, mins)
	}
}
