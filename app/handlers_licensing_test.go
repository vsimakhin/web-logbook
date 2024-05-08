package main

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/vsimakhin/web-logbook/internal/models"
)

func TestHandlerLicensing(t *testing.T) {

	app, mock := initTestApplication()

	models.InitMock(mock, "GetSettings")
	models.InitMock(mock, "GetLicenses")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APILicensing))
	responseBody, _ := io.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// need to have datatables css and js
	assert.Contains(t, string(responseBody), `<link rel="stylesheet" type="text/css" href="/static/css/datatables.min.css"/>`)
	assert.Contains(t, string(responseBody), `<script type="text/javascript" src="/static/js/datatables.min.js"></script>`)

}

func TestHandlerLicensingRecordsData(t *testing.T) {

	app, mock := initTestApplication()

	models.InitMock(mock, "GetLicenses")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APILicensingData))
	responseBody, _ := io.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)
	assert.Equal(t, `{"data":[["category","uuid","name","number","issued","01/01/2022","01/01/2022","Expired!","uuid"]]}`, string(responseBody))
}

func TestHandlerLicensingRecordByID(t *testing.T) {

	app, mock := initTestApplication()

	models.InitMock(mock, "GetSettings")
	models.InitMock(mock, "GetLicenseRecordByID")
	models.InitMock(mock, "GetLicensesCategory")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, strings.ReplaceAll(APILicensingUUID, "{uuid}", "uuid")))
	responseBody, _ := io.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	assert.Contains(t, string(responseBody), `<label for="category" class="form-label">Category</label>`)
	assert.Contains(t, string(responseBody), `<label for="name" class="form-label">Name</label>`)
	assert.Contains(t, string(responseBody), `<label for="number" class="form-label">Number</label>`)

}

func TestHandlerLicensingDownload(t *testing.T) {

	app, mock := initTestApplication()

	models.InitMock(mock, "GetLicenseRecordByID")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, strings.ReplaceAll(APILicensingDownloadUUID, "{uuid}", "uuid")))
	responseBody, _ := io.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	assert.Contains(t, string(responseBody), `document`)

}

func TestHandlerLicensingRecordNew(t *testing.T) {

	app, mock := initTestApplication()

	models.InitMock(mock, "GetSettings")
	models.InitMock(mock, "GetLicensesCategory")

	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s%s", srv.URL, APILicensingNew))
	responseBody, _ := io.ReadAll(resp.Body)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	assert.Contains(t, string(responseBody), `<label for="category" class="form-label">Category</label>`)
	assert.Contains(t, string(responseBody), `<label for="name" class="form-label">Name</label>`)
	assert.Contains(t, string(responseBody), `<label for="number" class="form-label">Number</label>`)

}
