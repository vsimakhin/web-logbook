package main

import (
	"net/http"
)

// HandlerImport is a handler for /import page
func (app *application) HandlerImport(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APIImport)
	}

	data := make(map[string]interface{})

	partials := []string{"common-js", "import-js"}
	if err := app.renderTemplate(w, r, "import", &templateData{Data: data}, partials...); err != nil {
		app.errorLog.Println(err)
	}
}
