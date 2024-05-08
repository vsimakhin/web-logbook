package main

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/vsimakhin/web-logbook/internal/models"
)

func TestHandlerMap(t *testing.T) {

	app, mock := initTestApplication()

	models.InitMock(mock, "GetSettings")
	models.InitMock(mock, "GetSettings")
	models.InitMock(mock, "GetAircraftsModels")
	models.InitMock(mock, "GetAircraftsRegs")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APIMap))
	responseBody, _ := io.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	assert.Contains(t, string(responseBody), `<script src="/static/js/ol.js"></script>`)
	assert.Contains(t, string(responseBody), `<link rel="stylesheet" href="/static/css/ol.css">`)

}

func TestHandlerMapGetData(t *testing.T) {

	app, mock := initTestApplication()

	models.InitMock(mock, "GetSettings")
	models.InitMock(mock, "GetFlightRecords")
	models.InitMock(mock, "GetAirports")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APIMapData))

	assert.Equal(t, http.StatusOK, resp.StatusCode)

}
