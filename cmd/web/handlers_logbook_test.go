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

func TestHandlerLogbook(t *testing.T) {

	app, mock := initTestApplication()

	models.AddMock(mock, "GetSettings")
	models.AddMock(mock, "GetFlightRecords")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s/", srv.URL))
	responseBody, _ := io.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// need to have datatables css and js
	assert.Contains(t, string(responseBody), `<link rel="stylesheet" type="text/css" href="/static/css/datatables.min.css"/>`)
	assert.Contains(t, string(responseBody), `<script type="text/javascript" src="/static/js/datatables.min.js"></script>`)

}

func TestHandlerFlightRecordsData(t *testing.T) {

	app, mock := initTestApplication()

	models.AddMock(mock, "GetFlightRecords")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APILogbookData))
	responseBody, _ := io.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)
	assert.Equal(t, "application/json", resp.Header["Content-Type"][0])
	assert.Equal(t, `{"data":[["uuid","01/02/2022","XXXX","1000","XXXX","1200","C152","OK-XXX","2:00","","2:00","2:00","Self","1","2","2:00","2:00","2:00","2:00","2:00","2:00","SIM","2:00","Remarks"]]}`, string(responseBody))

}
