package main

import (
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/vsimakhin/web-logbook/internal/models"
)

func (app *application) HandlerApiDBFile(w http.ResponseWriter, r *http.Request) {
	app.writeJSON(w, http.StatusOK, app.config.db.dsn)
}

func (app *application) HandlerApiUploadDB(w http.ResponseWriter, r *http.Request) {
	if app.config.db.engine != "sqlite" {
		app.handleError(w, fmt.Errorf("upload DB supported for SQLite engine only"))
		return
	}

	err := r.ParseMultipartForm(1000 << 20)
	if err != nil {
		app.handleError(w, err)
		return
	}

	file, _, err := r.FormFile("dbfile")
	if err != nil {
		app.handleError(w, err)
		return
	}
	defer file.Close()

	// Close the current database connection before replacing the file
	app.db.DB.Close()

	// Create a new file that will replace the existing database
	newFile, err := os.Create(app.config.db.dsn)
	if err != nil {
		app.handleError(w, err)
		return
	}
	defer newFile.Close()

	// Copy the uploaded content to the new file
	_, err = io.Copy(newFile, file)
	if err != nil {
		app.handleError(w, err)
		return
	}

	conn, err := createDBConnection(app.config.db.engine, app.config.db.dsn)
	if err != nil {
		app.errorLog.Fatalln(err)
	}

	app.db = models.DBModel{DB: conn}

	app.writeOkResponse(w, "Database file uploaded")
}

func (app *application) HandlerApiDownloadDB(w http.ResponseWriter, r *http.Request) {
	file, err := os.Open(app.config.db.dsn)
	if err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}
	defer file.Close()

	// get the file info for size and name
	fi, err := file.Stat()
	if err != nil {
		http.Error(w, "Cannot read file info", http.StatusInternalServerError)
		return
	}

	// Set headers to prompt download
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Length", fmt.Sprintf("%d", fi.Size()))

	// Copy file content to the response
	_, err = io.Copy(w, file)
	if err != nil {
		http.Error(w, "Failed to send file", http.StatusInternalServerError)
		return
	}
}
