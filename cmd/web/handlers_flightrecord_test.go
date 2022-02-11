package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHandlerFlightRecordNew(t *testing.T) {

	app := initTestApp()
	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s/logbook/new", srv.URL))
	responseBody, _ := ioutil.ReadAll(resp.Body)

	assert.Equal(t, resp.StatusCode, http.StatusOK)

	assert.Contains(t, string(responseBody), `<link rel="stylesheet" href="/static/css/ol.css">`)
	assert.Contains(t, string(responseBody), `<script src="/static/js/ol.js"></script>`)

}
