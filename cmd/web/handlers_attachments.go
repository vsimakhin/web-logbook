package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerGetAttachments generates attachments
func (app *application) HandlerGetAttachments(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")
	if app.config.env == "dev" {
		app.infoLog.Println(strings.ReplaceAll(APILogbookUUIDAttachments, "{uuid}", uuid))
	}

	attachments, err := app.db.GetAttachments(uuid)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.writeJSON(w, http.StatusOK, attachments)
	if err != nil {
		app.errorLog.Println(err)
		return
	}

	if app.config.env == "dev" {
		app.infoLog.Printf("%d attachments generated for %s\n", len(attachments), uuid)
	}
}

// HandlerUploadAttachment handles attachments upload
func (app *application) HandlerUploadAttachment(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APILogbookAttachmentsUpload)
	}

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

		if app.config.env == "dev" {
			app.infoLog.Printf("attachment %s has been uploaded\n", attachment.UUID)
		}
	}

	err = app.writeJSON(w, http.StatusOK, response)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

// HandlerDeleteAttachment is a handler for removing attachments
func (app *application) HandlerDeleteAttachment(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APILogbookAttachmentsDelete)
	}

	var att models.Attachment
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&att)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.db.DeleteAttachment(att.UUID)
	if err != nil {
		app.errorLog.Println(err)
		response.OK = false
		response.Message = err.Error()
	} else {
		response.OK = true

		if app.config.env == "dev" {
			app.infoLog.Printf("attachment %s deleted\n", att.UUID)
		}
	}

	err = app.writeJSON(w, http.StatusOK, response)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

// HandlerAttachmentDownload is a hadnler for attachment download
func (app *application) HandlerAttachmentDownload(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	if app.config.env == "dev" {
		app.infoLog.Println(strings.ReplaceAll(APILogbookAttachmentsDownloadUUID, "{uuid}", uuid))
	}

	att, err := app.db.GetAttachmentByID(uuid)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = w.Write(att.Document)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
