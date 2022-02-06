package main

import (
	"embed"
	"net/http"
)

//go:embed static
var staticFS embed.FS

// other auxiliary handlers
func (app *application) HandlerStatic() http.Handler {
	return http.FileServer(http.FS(staticFS))
}

func (app *application) HandlerFavicon(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/static/favicon.ico", http.StatusMovedPermanently)
}

func (app *application) HandlerNotFound(w http.ResponseWriter, r *http.Request) {
	if err := app.renderTemplate(w, r, "notfound", nil); err != nil {
		app.errorLog.Println(err)
	}
}

func (app *application) HandlerNotAllowed(w http.ResponseWriter, r *http.Request) {
	if err := app.renderTemplate(w, r, "notallowed", nil); err != nil {
		app.errorLog.Println(err)
	}
}
