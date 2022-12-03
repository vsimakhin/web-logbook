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

func TestHandlerFlightRecordNew(t *testing.T) {

	app, mock := initTestApplication()

	models.AddMock(mock, "GetSettings")
	models.AddMock(mock, "GetAircraftsLast")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APILogbookNew))
	responseBody, _ := ioutil.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	assert.Contains(t, string(responseBody), `<link rel="stylesheet" href="/static/css/ol.css">`)
	assert.Contains(t, string(responseBody), `<script src="/static/js/ol.js"></script>`)

}

func TestHandlerFlightRecordByID(t *testing.T) {

	app, mock := initTestApplication()

	models.AddMock(mock, "GetSettings")
	models.AddMock(mock, "GetAircraftsLast")
	models.AddMock(mock, "GetFlightRecordByID")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, strings.ReplaceAll(APILogbookUUID, "{uuid}", "uuid")))
	responseBody, _ := ioutil.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	assert.Contains(t, string(responseBody), `<link rel="stylesheet" href="/static/css/ol.css">`)
	assert.Contains(t, string(responseBody), `<script src="/static/js/ol.js"></script>`)

}
