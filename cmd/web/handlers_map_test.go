package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHandlerMap(t *testing.T) {

	app := initTestApp()
	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APIMap))
	responseBody, _ := ioutil.ReadAll(resp.Body)

	assert.Equal(t, resp.StatusCode, http.StatusOK)

	assert.Contains(t, string(responseBody), `<script src="/static/js/ol.js"></script>`)
	assert.Contains(t, string(responseBody), `<link rel="stylesheet" href="/static/css/ol.css">`)

}
