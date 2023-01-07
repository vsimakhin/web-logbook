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

func TestHandlerStats(t *testing.T) {

	app, mock := initTestApplication()

	// first tab
	// totals
	models.AddMock(mock, "GetTotals")
	// last 30 days
	models.AddMock(mock, "GetTotals")
	// last 90 days
	models.AddMock(mock, "GetTotals")
	// this months
	models.AddMock(mock, "GetTotals")
	// this year
	models.AddMock(mock, "GetTotals")

	// second tab
	models.AddMock(mock, "GetSettings")
	models.AddMock(mock, "GetTotalsClassType")

	// third tab
	models.AddMock(mock, "GetTotalsClassType")

	// fourth tab
	models.AddMock(mock, "GetTotalsYear")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APIStats))
	responseBody, _ := io.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// first tab with totals
	assert.Contains(t, string(responseBody), `<div class="tab-pane fade show active" id="nav-totals" role="tabpanel" aria-labelledby="nav-totals-tab">`)
	// second tab with totals by year
	assert.Contains(t, string(responseBody), `<div class="tab-pane fade" id="nav-totals-by-year" role="tabpanel" aria-labelledby="nav-totals-by-year">`)
	// third tab with totals by aircraft
	assert.Contains(t, string(responseBody), `<div class="tab-pane fade" id="nav-totals-by-type" role="tabpanel" aria-labelledby="nav-totals-by-type">`)
	// fourth tab with totals by class
	assert.Contains(t, string(responseBody), `<div class="tab-pane fade" id="nav-totals-by-class" role="tabpanel" aria-labelledby="nav-totals-by-class">`)

}

func TestHandlerStatsTotals(t *testing.T) {

	app, mock := initTestApplication()

	// totals
	models.AddMock(mock, "GetTotals")
	// last 30 days
	models.AddMock(mock, "GetTotals")
	// last 90 days
	models.AddMock(mock, "GetTotals")
	// this months
	models.AddMock(mock, "GetTotals")
	// this year
	models.AddMock(mock, "GetTotals")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APIStatsTotals))

	assert.Equal(t, http.StatusOK, resp.StatusCode)

}

func TestHandlerStatsByClass(t *testing.T) {

	app, mock := initTestApplication()

	models.AddMock(mock, "GetSettings")
	models.AddMock(mock, "GetTotalsClassType")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APIStatsTotalsByClass))

	assert.Equal(t, http.StatusOK, resp.StatusCode)

}

func TestHandlerStatsByType(t *testing.T) {

	app, mock := initTestApplication()

	models.AddMock(mock, "GetTotalsClassType")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APIStatsTotalsByType))

	assert.Equal(t, http.StatusOK, resp.StatusCode)

}
