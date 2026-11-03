package main

import (
	"bytes"
	"embed"
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
)

//go:embed ui/dist/*
var ui embed.FS

const (
	customCSSFile = "custom.css"
	customJSFile  = "custom.js"
)

func (app *application) HandlerUI() http.Handler {
	// Subdirectory inside the embedded FS where the React build is located
	dist, _ := fs.Sub(ui, "ui/dist")

	fileServer := http.FileServer(http.FS(dist))
	indexHTML, _ := fs.ReadFile(dist, "index.html")

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPath := r.URL.Path

		if requestedPath != "/" && !strings.Contains(requestedPath, "assets") && !strings.Contains(requestedPath, "favicon.ico") {
			r.URL.Path = "/"
		}

		// index.html with the custom css/js tags, only if -custom-dir is set
		if r.URL.Path == "/" && app.config.customDir != "" && indexHTML != nil &&
			(r.Method == http.MethodGet || r.Method == http.MethodHead) {
			page := injectIntoHead(indexHTML, customAssetsTags(app.config.customDir))
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Header().Set("Cache-Control", "no-cache")
			w.WriteHeader(http.StatusOK)
			if r.Method == http.MethodGet {
				w.Write(page)
			}
			return
		}

		fileServer.ServeHTTP(w, r)
	})
}

// HandlerCustomFile serves one file (custom.css or custom.js) from the -custom-dir directory
func (app *application) HandlerCustomFile(name string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if _, ok := customFileVersion(app.config.customDir, name); !ok {
			http.NotFound(w, r)
			return
		}

		// the browser revalidates (Last-Modified) on every load, so an edited file is picked up without a restart
		w.Header().Set("Cache-Control", "no-cache")
		http.ServeFile(w, r, filepath.Join(app.config.customDir, name))
	}
}

// customFileVersion returns the modification time of the regular file dir/name, used as a cache-busting version
func customFileVersion(dir string, name string) (int64, bool) {
	info, err := os.Stat(filepath.Join(dir, name))
	if err != nil || !info.Mode().IsRegular() {
		return 0, false
	}
	return info.ModTime().Unix(), true
}

// customAssetsTags returns the <link> and <script> tags for the custom files that exist in dir
func customAssetsTags(dir string) string {
	var sb strings.Builder

	if v, ok := customFileVersion(dir, customCSSFile); ok {
		fmt.Fprintf(&sb, `<link rel="stylesheet" href="/%s?v=%d">`, customCSSFile, v)
	}
	if v, ok := customFileVersion(dir, customJSFile); ok {
		fmt.Fprintf(&sb, `<script defer src="/%s?v=%d"></script>`, customJSFile, v)
	}

	return sb.String()
}

// injectIntoHead inserts tags right before the closing </head>, the page is returned as is if there is no such tag
func injectIntoHead(page []byte, tags string) []byte {
	if tags == "" {
		return page
	}
	return bytes.Replace(page, []byte("</head>"), []byte(tags+"</head>"), 1)
}

func (app *application) HandlerVersion(w http.ResponseWriter, r *http.Request) {
	app.writeJSON(w, http.StatusOK, app.version)
}

func (app *application) HandlerAuthEnabled(w http.ResponseWriter, r *http.Request) {
	isAuth, _ := app.db.IsAuthEnabled()
	app.writeJSON(w, http.StatusOK, isAuth)
}

func (app *application) HandlerDistance(w http.ResponseWriter, r *http.Request) {
	dep := chi.URLParam(r, "departure")
	arr := chi.URLParam(r, "arrival")
	distance := app.db.Distance(dep, arr)
	app.writeJSON(w, http.StatusOK, distance)
}
