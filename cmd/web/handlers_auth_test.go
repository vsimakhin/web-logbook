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

func TestAuth(t *testing.T) {

	app, mock := initTestApplication()

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	models.AddMock(mock, "GetSettings")

	// auth enabled
	app.isAuthEnabled = true
	resp, _ := http.Get(fmt.Sprintf("%s/", srv.URL))
	responseBody, _ := io.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)
	assert.Contains(t, string(responseBody), `<input class="form-control" id="login" type="login" placeholder="Login"`)

	// auth disabled
	app.isAuthEnabled = false
	resp, _ = http.Get(fmt.Sprintf("%s/", srv.URL))
	responseBody, _ = io.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)
	assert.Contains(t, string(responseBody), `<link rel="stylesheet" type="text/css" href="/static/css/datatables.min.css"/>`)

}

func TestHandlerLogin(t *testing.T) {

	app, _ := initTestApplication()

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APILogin))
	responseBody, _ := io.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)
	assert.Contains(t, string(responseBody), `<input class="form-control" id="login" type="login" placeholder="Login"`)

}

func TestHandlerLogout(t *testing.T) {

	app, _ := initTestApplication()

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APILogout))
	responseBody, _ := io.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)
	assert.Contains(t, string(responseBody), `<input class="form-control" id="login" type="login" placeholder="Login"`)

}
