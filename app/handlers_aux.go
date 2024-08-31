package main

import (
	"embed"
	"io/fs"
	"net/http"
)

//go:embed static
var staticFS embed.FS

// other auxiliary handlers
func (app *application) HandlerStatic() http.Handler {
	return http.FileServer(http.FS(staticFS))
}

func (app *application) HandlerFavicon(w http.ResponseWriter, r *http.Request) {
	data, err := fs.ReadFile(staticFS, "static/favicon.ico")
	if err != nil {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Cache-Control", "private, max-age=3600, must-revalidate")
	w.Write(data)
}

func (app *application) HandlerNotFound(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotFound)

	if err := app.renderTemplate(w, r, "notfound", nil); err != nil {
		app.errorLog.Println(err)
	}
}

func (app *application) HandlerNotAllowed(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusMethodNotAllowed)

	if err := app.renderTemplate(w, r, "notallowed", nil); err != nil {
		app.errorLog.Println(err)
	}
}
