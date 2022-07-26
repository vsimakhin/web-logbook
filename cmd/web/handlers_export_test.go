package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHandlerExport(t *testing.T) {

	app := initTestApp()
	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APIExport))
	responseBody, _ := ioutil.ReadAll(resp.Body)

	assert.Equal(t, resp.StatusCode, http.StatusOK)

	assert.Contains(t, string(responseBody), `PDF A4`)
	assert.Contains(t, string(responseBody), `PDF A5`)
	assert.Contains(t, string(responseBody), `XLS`)
	assert.Contains(t, string(responseBody), `CSV`)

}
