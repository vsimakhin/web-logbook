package main

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/vsimakhin/web-logbook/internal/models"
)

func TestHandlerAirportByID(t *testing.T) {

	app, mock := initTestApplication()

	models.AddMock(mock, "GetAirports")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, strings.ReplaceAll(APIAirportID, "{uuid}", "XXXX")))
	responseBody, _ := io.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	assert.Contains(t, string(responseBody), `{"icao":"XXXX","iata":"XXX","name":"Airport","city":"City","country":"Country","elevation":100,"lat":55.5,"lon":44.4}`)

}
