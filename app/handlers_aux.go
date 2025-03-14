package main

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"
)

//go:embed ui/dist/*
var ui embed.FS

func (app *application) HandlerUI() http.Handler {
	// Subdirectory inside the embedded FS where the React build is located
	dist, _ := fs.Sub(ui, "ui/dist")

	fileServer := http.FileServer(http.FS(dist))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPath := r.URL.Path

		if requestedPath != "/" && !strings.Contains(requestedPath, "assets") {
			r.URL.Path = "/"
		}

		fileServer.ServeHTTP(w, r)
	})
}

func (app *application) HandlerVersion(w http.ResponseWriter, r *http.Request) {
	app.writeJSON(w, http.StatusOK, app.version)
}

func (app *application) HandlerAuthEnabled(w http.ResponseWriter, r *http.Request) {
	isAuth, _ := app.db.IsAuthEnabled()
	app.writeJSON(w, http.StatusOK, isAuth)
}
