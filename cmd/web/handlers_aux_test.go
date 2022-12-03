package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHandlerNotFound(t *testing.T) {

	app, _ := initTestApplication()
	srv := httptest.NewServer(app.routes())
	defer srv.Close()

	resp, _ := http.Get(fmt.Sprintf("%s/notfound", srv.URL))
	responseBody, _ := ioutil.ReadAll(resp.Body)

	assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	assert.Contains(t, string(responseBody), `<p class="lead">This requested URL was not found on this server</p>`)
}
