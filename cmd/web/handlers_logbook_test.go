package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHandlerLogbook(t *testing.T) {

	app := initTestApp()
	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s/", srv.URL))
	responseBody, _ := ioutil.ReadAll(resp.Body)

	assert.Equal(t, resp.StatusCode, http.StatusOK)

	// need to have datatables css and js
	assert.Contains(t, string(responseBody), `<link rel="stylesheet" type="text/css" href="/static/css/datatables.min.css"/>`)
	assert.Contains(t, string(responseBody), `<script type="text/javascript" src="/static/js/datatables.min.js"></script>`)

}

func TestHandlerFlightRecordsData(t *testing.T) {

	app := initTestApp()
	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s/logbook/data", srv.URL))
	responseBody, _ := ioutil.ReadAll(resp.Body)

	assert.Equal(t, resp.StatusCode, http.StatusOK)
	assert.Equal(t, resp.Header["Content-Type"][0], "application/json")
	assert.Equal(t, string(responseBody), `{"data":[["\u003ca href=\"/logbook/uuid\" class=\"link-primary\"\u003e01/02/2022\u003c/a\u003e","LKPR","1000","EDDM","1200","C152","OK-XXX","2:00","","2:00","2:00","Self","1","2","2:00","2:00","2:00","2:00","2:00","2:00","SIM","2:00","Remarks"]]}`)

}
