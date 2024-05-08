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

func TestHandlerSettings(t *testing.T) {

	app, mock := initTestApplication()

	models.InitMock(mock, "GetSettings")
	models.InitMock(mock, "GetAirportCount")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APISettings))
	responseBody, _ := io.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	assert.Contains(t, string(responseBody), `Owner Name`)
	assert.Contains(t, string(responseBody), `Signature`)
	assert.Contains(t, string(responseBody), `Airport database`)

	assert.Contains(t, string(responseBody), `General`)
	assert.Contains(t, string(responseBody), `Misc`)
}

func TestHandlerSettingsAircraftClasses(t *testing.T) {

	app, mock := initTestApplication()

	models.InitMock(mock, "GetSettings")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APISettingsAircraftClasses))

	assert.Equal(t, http.StatusOK, resp.StatusCode)
}
