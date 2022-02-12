package main

import (
	"encoding/json"
	"io/ioutil"
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
		app.infoLog.Printf("/logbook/%s/attachments\n", uuid)
	}

	attachments, err := app.db.GetAttachments(uuid)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	out, err := json.Marshal(attachments)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(out)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if app.config.env == "dev" {
		app.infoLog.Printf("%d attachments generated for %s\n", len(attachments), uuid)
	}
}

// HandlerUploadAttachment handles attachments upload
func (app *application) HandlerUploadAttachment(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println("/logbook/attachments/upload")
	}

	var response models.JSONResponse

	err := r.ParseMultipartForm(32 << 20)
	if err != nil {
		app.errorLog.Panicln(err)
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
		bs, err := ioutil.ReadAll(file)
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

	out, err := json.Marshal(response)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(out)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// HandlerDeleteAttachment is a handler for removing attachments
func (app *application) HandlerDeleteAttachment(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println("/logbook/attachments/delete")
	}

	var att models.Attachment
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&att)
	if err != nil {
		app.errorLog.Panicln(err)
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

	out, err := json.Marshal(response)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(out)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// HandlerAttachmentDownload is a hadnler for attachment download
func (app *application) HandlerAttachmentDownload(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	if app.config.env == "dev" {
		app.infoLog.Printf("/logbook/attachments/download/%s", uuid)
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
