package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"image/png"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/vsimakhin/web-logbook/internal/maprender"
	"github.com/vsimakhin/web-logbook/internal/models"
	"github.com/vsimakhin/web-logbook/internal/pdfexport"
)

//go:embed static
var staticFS embed.FS

// HandlerLogbook is a handler for /logbook page
func (app *application) HandlerLogbook(w http.ResponseWriter, r *http.Request) {

	if err := app.renderTemplate(w, r, "logbook", nil); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerFlightRecordsData generates data for the logbook table at /logbook page
func (app *application) HandlerFlightRecordsData(w http.ResponseWriter, r *http.Request) {

	type TableData struct {
		Data [][]string `json:"data"`
	}

	var tableData TableData

	flightRecords, err := app.db.GetFlightRecords()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, item := range flightRecords {
		tableRow := []string{fmt.Sprintf("<a href='/logbook/%s' class='link-primary'>%s</a>", item.UUID, item.Date), item.Departure.Place, item.Departure.Time,
			item.Arrival.Place, item.Arrival.Time, item.Aircraft.Model, item.Aircraft.Reg,
			item.Time.SE, item.Time.ME, item.Time.MCC, item.Time.Total, formatRemarks(item.PIC), formatLandings(item.Landings.Day), formatLandings(item.Landings.Night),
			item.Time.Night, item.Time.IFR, item.Time.PIC, item.Time.CoPilot, item.Time.Dual, item.Time.Instructor,
			item.SIM.Type, item.SIM.Time, formatRemarks(item.Remarks)}
		tableData.Data = append(tableData.Data, tableRow)
	}

	out, err := json.Marshal(tableData)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(out)
}

// HandlerFlightRecordByID shows flight record by UUID
func (app *application) HandlerFlightRecordByID(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	flightRecord, err := app.db.GetFlightRecordByID(uuid)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	aircraftRegs, err := app.db.GetAircraftRegs()
	if err != nil {
		app.errorLog.Println(err)
	}

	aircraftModels, err := app.db.GetAircraftModels()
	if err != nil {
		app.errorLog.Println(err)
	}

	data := make(map[string]interface{})
	data["flightRecord"] = flightRecord
	data["aircraftRegs"] = aircraftRegs
	data["aircraftModels"] = aircraftModels

	if err := app.renderTemplate(w, r, "flight-record", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}

}

// HandlerFlightRecordNew shows the empty form for a new flight record
func (app *application) HandlerFlightRecordNew(w http.ResponseWriter, r *http.Request) {
	var flightRecord models.FlightRecord

	flightRecord.Date = time.Now().Format("02/01/2006")

	aircraftRegs, err := app.db.GetAircraftRegs()
	if err != nil {
		app.errorLog.Println(err)
	}

	aircraftModels, err := app.db.GetAircraftModels()
	if err != nil {
		app.errorLog.Println(err)
	}

	data := make(map[string]interface{})
	data["flightRecord"] = flightRecord
	data["aircraftRegs"] = aircraftRegs
	data["aircraftModels"] = aircraftModels

	if err := app.renderTemplate(w, r, "flight-record", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
}

func (app *application) HandlerFlightRecordDelete(w http.ResponseWriter, r *http.Request) {
	var flightRecord models.FlightRecord
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&flightRecord)
	if err != nil {
		app.errorLog.Panicln(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.db.DeleteFlightRecord(flightRecord.UUID)
	if err != nil {
		app.errorLog.Println(err)
		response.OK = false
		response.Message = err.Error()
	} else {
		response.OK = true
		response.Message = "Flight Record deleted"
		response.RedirectURL = "/logbook"
	}

	out, err := json.Marshal(response)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(out)
}

// HandlerFlightRecordSave updates the flight record or create a new one
func (app *application) HandlerFlightRecordSave(w http.ResponseWriter, r *http.Request) {
	var flightRecord models.FlightRecord
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&flightRecord)
	if err != nil {
		app.errorLog.Panicln(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if flightRecord.UUID == "" {
		// new flight record
		uuid, err := uuid.NewRandom()
		if err != nil {
			app.errorLog.Println(err)
			response.OK = false
			response.Message = err.Error()
		}

		flightRecord.UUID = uuid.String()

		err = app.db.InsertFlightRecord(flightRecord)
		if err != nil {
			app.errorLog.Println(err)
			response.OK = false
			response.Message = err.Error()
		} else {
			response.OK = true
			response.Message = "New Flight Record has been saved"
			response.RedirectURL = fmt.Sprintf("/logbook/%s", flightRecord.UUID)
		}

	} else {
		err = app.db.UpdateFlightRecord(flightRecord)
		if err != nil {
			app.errorLog.Println(err)
			response.OK = false
			response.Message = err.Error()
		} else {
			response.OK = true
			response.Message = "Flight Record has been updated"
		}
	}

	out, err := json.Marshal(response)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(out)
}

// other aux handlers
func (app *application) HandlerStatic() http.Handler {
	return http.FileServer(http.FS(staticFS))
}

func (app *application) HandlerFavicon(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/static/favicon.ico", http.StatusMovedPermanently)
}

func (app *application) HandlerNotFound(w http.ResponseWriter, r *http.Request) {
	if err := app.renderTemplate(w, r, "notfound", nil); err != nil {
		app.errorLog.Println(err)
	}
}

func (app *application) HandlerNotAllowed(w http.ResponseWriter, r *http.Request) {
	if err := app.renderTemplate(w, r, "notallowed", nil); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerAirportByID returns airport record by ID (ICAO or IATA)
func (app *application) HandlerAirportByID(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "id")

	airport, err := app.db.GetAirportByID(uuid)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	out, err := json.Marshal(airport)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(out)
}

func (app *application) HandlerAirportUpdate(w http.ResponseWriter, r *http.Request) {
	var airportsDB map[string]interface{}
	var airports []models.Airport
	var response models.JSONResponse

	resp, err := http.Get("https://github.com/vsimakhin/Airports/raw/master/airports.json")
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = json.Unmarshal(body, &airportsDB)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for _, item := range airportsDB {
		airportItem := item.(map[string]interface{})

		var airport models.Airport

		if value, ok := airportItem["icao"].(string); ok {
			airport.ICAO = value
		}

		if value, ok := airportItem["iata"].(string); ok {
			airport.IATA = value
		}

		if value, ok := airportItem["name"].(string); ok {
			airport.Name = value
		}

		if value, ok := airportItem["city"].(string); ok {
			airport.City = value
		}

		if value, ok := airportItem["country"].(string); ok {
			airport.Country = value
		}

		if value, ok := airportItem["elevation"].(float64); ok {
			airport.Elevation = int(value)
		}

		if value, ok := airportItem["lat"].(float64); ok {
			airport.Lat = value
		}

		if value, ok := airportItem["lon"].(float64); ok {
			airport.Lon = value
		}

		airports = append(airports, airport)
	}

	records, err := app.db.UpdateAirportDB(airports)
	if err != nil {
		app.errorLog.Println(err)
		response.OK = false
		response.Message = err.Error()
	} else {
		response.OK = true
		response.Message = fmt.Sprintf("%d", records)
	}

	out, err := json.Marshal(response)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(out)

}

// HandlerExportLogbook executes the pdf export and returns pdf file
func (app *application) HandlerExportLogbook(w http.ResponseWriter, r *http.Request) {
	flightRecords, err := app.db.GetFlightRecords()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	settings, err := app.db.GetSettings()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	var logbook pdfexport.Logbook
	logbook.OwnerName = settings.OwnerName
	logbook.Signature = settings.SignatureText
	logbook.PageBreaks = strings.Split(settings.PageBreaks, ",")

	logbook.Export(flightRecords, w)
}

func (app *application) HandlerSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := app.db.GetSettings()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	records, err := app.db.GetAirportCount()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := make(map[string]interface{})
	data["settings"] = settings
	data["records"] = records

	if err := app.renderTemplate(w, r, "settings", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}

}

func (app *application) HandlerSettingsSave(w http.ResponseWriter, r *http.Request) {
	var settings models.Settings
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&settings)
	if err != nil {
		app.errorLog.Panicln(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.db.UpdateSettings(settings)
	if err != nil {
		app.errorLog.Println(err)
		response.OK = false
		response.Message = err.Error()
	} else {
		response.OK = true
		response.Message = "Settings have been updated"
	}

	out, err := json.Marshal(response)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(out)

}

func (app *application) HandlerStats(w http.ResponseWriter, r *http.Request) {
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

	totalsByYear, err := app.db.GetTotalsByYear()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data["totals"] = totals
	data["totals30"] = totals30
	data["totals90"] = totals90
	data["totalsY"] = totalsYear
	data["totalsByYear"] = totalsByYear

	if err := app.renderTemplate(w, r, "stats", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
}

func (app *application) HandlerStatsMap(w http.ResponseWriter, r *http.Request) {
	filterDate := r.URL.Query().Get("filter_date")
	filterNoRoutes, _ := strconv.ParseBool(r.URL.Query().Get("filter_noroutes"))

	flightRecords, err := app.db.GetFlightRecords()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	airports, err := app.db.GetAirports()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	render := maprender.MapRender{
		FlightRecords:  flightRecords,
		FilterDate:     filterDate,
		FilterNoRoutes: filterNoRoutes,
		AirportsDB:     airports,
	}

	err = render.Render()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	png.Encode(w, render.Img)
}
