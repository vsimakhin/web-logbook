package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHandlerAirportByID(t *testing.T) {

	app := initTestApp()
	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, strings.ReplaceAll(APIAirportID, "{uuid}", "XXXX")))
	responseBody, _ := ioutil.ReadAll(resp.Body)

	assert.Equal(t, resp.StatusCode, http.StatusOK)

	assert.Contains(t, string(responseBody), `{"icao":"XXXX","iata":"XXX","name":"Airport","city":"City","country":"Country","elevation":100,"lat":55.5,"lon":44.4}`)

}
