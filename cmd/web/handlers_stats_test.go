package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHandlerStats(t *testing.T) {

	app := initTestApp()
	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APIStats))
	responseBody, _ := ioutil.ReadAll(resp.Body)

	assert.Equal(t, resp.StatusCode, http.StatusOK)

	// first tab with totals
	assert.Contains(t, string(responseBody), `<div class="tab-pane fade show active" id="nav-totals" role="tabpanel" aria-labelledby="nav-totals-tab">`)
	// second tab with totals by year
	assert.Contains(t, string(responseBody), `<div class="tab-pane fade" id="nav-totals-by-year" role="tabpanel" aria-labelledby="nav-totals-by-year">`)
	// third tab with totals by aircraft
	assert.Contains(t, string(responseBody), `<div class="tab-pane fade" id="nav-totals-by-type" role="tabpanel" aria-labelledby="nav-totals-by-type">`)
	// fourth tab with totals by class
	assert.Contains(t, string(responseBody), `<div class="tab-pane fade" id="nav-totals-by-class" role="tabpanel" aria-labelledby="nav-totals-by-class">`)

}
