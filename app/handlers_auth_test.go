package main

import (
	"fmt"
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

	models.InitMock(mock, "GetSettings")
	models.InitMock(mock, "GetSettings")

	// auth enabled
	app.isAuthEnabled = true
	resp, _ := http.Get(fmt.Sprintf("%s/", srv.URL))

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// auth disabled
	app.isAuthEnabled = false
	resp, _ = http.Get(fmt.Sprintf("%s/", srv.URL))
	assert.Equal(t, http.StatusOK, resp.StatusCode)

}

func TestHandlerLogin(t *testing.T) {

	app, mock := initTestApplication()

	models.InitMock(mock, "GetSettings")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APILogin))

	assert.Equal(t, http.StatusOK, resp.StatusCode)

}

func TestHandlerLogout(t *testing.T) {

	app, mock := initTestApplication()

	models.InitMock(mock, "GetSettings")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APILogout))

	assert.Equal(t, http.StatusOK, resp.StatusCode)

}
