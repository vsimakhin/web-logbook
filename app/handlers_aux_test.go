package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/vsimakhin/web-logbook/internal/models"
)

func TestHandlerNotFound(t *testing.T) {

	app, mock := initTestApplication()
	models.InitMock(mock, "GetSettings")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s/notfound", srv.URL))

	assert.Equal(t, http.StatusNotFound, resp.StatusCode)
}
