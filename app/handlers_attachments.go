package main

import (
	"archive/zip"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerApiGetFlightRecordAttachments returns attachments for a flight record
func (app *application) HandlerApiGetFlightRecordAttachments(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	attachments, err := app.db.GetFlightRecordAttachments(uuid)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, attachments)
}

// HandlerApiGetAttachments returns all attachments
func (app *application) HandlerApiGetAttachments(w http.ResponseWriter, r *http.Request) {
	attachments, err := app.db.GetAttachments()
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, attachments)
}

// HandlerApiGetAttachment is a hadnler for attachment download
func (app *application) HandlerApiGetAttachment(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	att, err := app.db.GetAttachmentByID(uuid)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, att)
}

// HandlerApiDeleteAttachment is a handler for removing attachments
func (app *application) HandlerApiDeleteAttachment(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	err := app.db.DeleteAttachment(uuid)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeOkResponse(w, "Attachment removed")
}

// HandlerApiUploadAttachment handles attachments upload
func (app *application) HandlerApiUploadAttachment(w http.ResponseWriter, r *http.Request) {

	err := r.ParseMultipartForm(32 << 20)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot parse the data, probably the attachment is too big - %s", err))
		app.handleError(w, err)
		return
	}

	attachment := models.Attachment{
		RecordID: r.PostFormValue("id"),
	}

	// check attached file
	file, header, err := r.FormFile("document")
	if err != nil {
		if !strings.Contains(err.Error(), "no such file") {
			app.handleError(w, err)
			return
		}
	} else {
		defer file.Close()
		attachment.DocumentName = header.Filename

		// read file
		bs, err := io.ReadAll(file)
		if err != nil {
			app.handleError(w, err)
			return
		}
		attachment.Document = bs
	}

	// new record
	uuid, err := uuid.NewRandom()
	if err != nil {
		app.handleError(w, err)
		return
	}

	attachment.UUID = uuid.String()

	err = app.db.InsertAttachmentRecord(attachment)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeOkResponse(w, "Attachment has been uploaded")
}

// HandlerApiZipDownload handles attachments zip download
func (app *application) HandlerApiZipDownload(w http.ResponseWriter, r *http.Request) {
	type DownloadZipRequest struct {
		IDs []string `json:"ids"`
	}
	var req DownloadZipRequest

	// Decode JSON body
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		app.handleError(w, err)
		return
	}

	if len(req.IDs) == 0 {
		app.handleError(w, errors.New("No files selected"))
		return
	}

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", `attachment; filename="attachments.zip"`)

	zipWriter := zip.NewWriter(w)
	defer zipWriter.Close()

	for _, id := range req.IDs {

		att, err := app.db.GetAttachmentByID(id)
		if err != nil {
			continue
		}

		// Sanitize filename
		filename := strings.ReplaceAll(att.DocumentName, "/", "")
		filename = strings.ReplaceAll(filename, "\\", "")

		// Create file entry inside zip
		f, err := zipWriter.Create(filename)
		if err != nil {
			continue
		}

		// Write file content
		_, err = f.Write(att.Document)
		if err != nil {
			continue
		}
	}
}
