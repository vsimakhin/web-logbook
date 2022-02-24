package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHandlerSettings(t *testing.T) {

	app := initTestApp()
	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APISettings))
	responseBody, _ := ioutil.ReadAll(resp.Body)

	assert.Equal(t, resp.StatusCode, http.StatusOK)

	assert.Contains(t, string(responseBody), `Owner Name`)
	assert.Contains(t, string(responseBody), `Signature Text`)
	assert.Contains(t, string(responseBody), `Page breaks`)
	assert.Contains(t, string(responseBody), `Airport database`)
}
