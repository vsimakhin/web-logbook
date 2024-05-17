package main

import (
	"fmt"
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

	assert.Equal(t, http.StatusOK, resp.StatusCode)

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
