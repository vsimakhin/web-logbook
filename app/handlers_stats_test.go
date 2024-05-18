package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/vsimakhin/web-logbook/internal/models"
)

func TestHandlerStatsTotals(t *testing.T) {

	app, mock := initTestApplication()

	// totals
	models.InitMock(mock, "GetTotals")
	// last 28 days
	models.InitMock(mock, "GetTotals")
	// last 90 days
	models.InitMock(mock, "GetTotals")
	// this month
	models.InitMock(mock, "GetTotals")
	// last 12 months
	models.InitMock(mock, "GetTotals")
	// this year
	models.InitMock(mock, "GetTotals")

	models.InitMock(mock, "GetSettings")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APIStatsTotals))

	assert.Equal(t, http.StatusOK, resp.StatusCode)

}

func TestHandlerStatsByClass(t *testing.T) {

	app, mock := initTestApplication()

	models.InitMock(mock, "GetSettings")
	models.InitMock(mock, "GetTotalsClassType")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APIStatsTotalsByClass))

	assert.Equal(t, http.StatusOK, resp.StatusCode)

}

func TestHandlerStatsByType(t *testing.T) {

	app, mock := initTestApplication()

	models.InitMock(mock, "GetTotalsClassType")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APIStatsTotalsByType))

	assert.Equal(t, http.StatusOK, resp.StatusCode)

}
