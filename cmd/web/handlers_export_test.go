package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/vsimakhin/web-logbook/internal/models"
)

func TestHandlerExport(t *testing.T) {

	app, mock := initTestApplication()

	models.AddMock(mock, "GetSettings")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APIExport))
	responseBody, _ := ioutil.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	assert.Contains(t, string(responseBody), `PDF A4`)
	assert.Contains(t, string(responseBody), `PDF A5`)
	assert.Contains(t, string(responseBody), `XLS`)
	assert.Contains(t, string(responseBody), `CSV`)

}

func TestHandlerExportLogbook(t *testing.T) {

	app, mock := initTestApplication()

	models.AddMock(mock, "GetSettings")
	models.AddMock(mock, "GetFlightRecords")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, strings.ReplaceAll(APIExportFormat, "{format}", "csv")))
	responseBody, _ := ioutil.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	assert.Contains(t, string(responseBody), `Date,Departure Place,Departure Time,Arrival Place,Arrival Time,Aircraft Model,Aircraft Reg,Time SE,Time ME,Time MCC,Time Total,Landings Day,Landings Night,Time Night,Time IFR,Time PIC,Time CoPilot,Time Dual,Time Instructor,SIM Type,SIM Time,PIC Name,Remarks`)
	assert.Contains(t, string(responseBody), `01/02/2022,XXXX,1000,XXXX,1200,C152,OK-XXX,2:00,2:00,2:00,2:00,1,2,2:00,2:00,2:00,2:00,2:00,2:00,SIM,2:00,Self,Remarks`)

}
