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

func TestHandlerAircrafts(t *testing.T) {

	app, mock := initTestApplication()

	models.AddMock(mock, "GetAircraftsAll")
	models.AddMock(mock, "GetAircraftsLast")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APIAircrafts))
	responseBody, _ := io.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)
	assert.Equal(t, "application/json", resp.Header["Content-Type"][0])
	assert.Equal(t, `{"REG":"MODEL"}`, string(responseBody))

}
