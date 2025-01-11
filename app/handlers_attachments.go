package main

import (
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerGetAttachments generates attachments
func (app *application) HandlerApiGetAttachments(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	attachments, err := app.db.GetAttachments(uuid)
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

////////////////////////////////////////////////////////
// for review

// HandlerUploadAttachment handles attachments upload
func (app *application) HandlerUploadAttachment(w http.ResponseWriter, r *http.Request) {

	var response models.JSONResponse

	err := r.ParseMultipartForm(32 << 20)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot parse the data, probably the attachment is too big - %s", err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	attachment := models.Attachment{
		RecordID: r.PostFormValue("record_id"),
	}

	// check attached file
	file, header, err := r.FormFile("document")
	if err != nil {
		if !strings.Contains(err.Error(), "no such file") {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		defer file.Close()
		attachment.DocumentName = header.Filename

		// read file
		bs, err := io.ReadAll(file)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		attachment.Document = bs
	}

	// new record
	uuid, err := uuid.NewRandom()
	if err != nil {
		app.errorLog.Println(err)
		response.OK = false
		response.Message = err.Error()
	}

	attachment.UUID = uuid.String()

	err = app.db.InsertAttachmentRecord(attachment)
	if err != nil {
		app.errorLog.Println(err)
		response.OK = false
		response.Message = err.Error()
	} else {
		response.OK = true
		response.Message = "Attachment has been uploaded"

	}

	app.writeJSON(w, http.StatusOK, response)
}
