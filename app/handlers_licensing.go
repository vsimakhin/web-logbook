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

// HandlerApiGetLicensingRecords returns a list of license records
func (app *application) HandlerApiGetLicensingRecords(w http.ResponseWriter, r *http.Request) {
	licenses, err := app.db.GetLicenses()
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, licenses)
}

// HandlerApiGetLicensingRecord is handler for a license record
func (app *application) HandlerApiGetLicensingRecord(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	license, err := app.db.GetLicenseRecordByID(uuid)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, license)
}

func (app *application) ParseLicenseFormData(r *http.Request) (license models.License, err error) {
	err = r.ParseMultipartForm(32 << 20)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot parse the data, probably the attachment is too big - %s", err))
		return license, err
	}

	license = models.License{
		UUID:       r.PostFormValue("uuid"),
		Category:   r.PostFormValue("category"),
		Name:       r.PostFormValue("name"),
		Number:     r.PostFormValue("number"),
		Issued:     r.PostFormValue("issued"),
		ValidFrom:  r.PostFormValue("valid_from"),
		ValidUntil: r.PostFormValue("valid_until"),
		Remarks:    r.PostFormValue("remarks"),
	}

	// check attached file
	file, header, err := r.FormFile("document")
	if err != nil {
		if !strings.Contains(err.Error(), "no such file") {
			return license, err
		}
	} else {
		defer file.Close()
		license.DocumentName = header.Filename

		// read file
		bs, err := io.ReadAll(file)
		if err != nil {
			return license, err
		}
		license.Document = bs
	}

	return license, nil
}

// HandlerLicensingRecordSave is a handler for creating or updating license record
func (app *application) HandlerApiNewLicensingRecord(w http.ResponseWriter, r *http.Request) {
	license, err := app.ParseLicenseFormData(r)
	if err != nil {
		app.handleError(w, err)
		return
	}

	uuid, err := uuid.NewRandom()
	if err != nil {
		app.handleError(w, err)
		return
	}

	license.UUID = uuid.String()

	err = app.db.InsertLicenseRecord(license)
	if err != nil {
		app.handleError(w, err)
		return
	}

	var response models.JSONResponse
	response.OK = true
	response.Message = "New License Record created"
	response.Data = license.UUID

	app.writeJSON(w, http.StatusOK, response)
}

// HandlerApiUpdateLicensingRecord is a handler for updating license record
func (app *application) HandlerApiUpdateLicensingRecord(w http.ResponseWriter, r *http.Request) {
	license, err := app.ParseLicenseFormData(r)
	if err != nil {
		app.handleError(w, err)
		return
	}

	// just update the license record
	err = app.db.UpdateLicenseRecord(license)
	if err != nil {
		app.handleError(w, err)
		return

	}

	app.writeOkResponse(w, "License Record has been updated")
}

// HandlerApiGetLicensingCategories returns a list of license categories
func (app *application) HandlerApiGetLicensingCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := app.db.GetLicensesCategory()
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeJSON(w, http.StatusOK, categories)
}

// HandlerApiDeleteLicensingRecord is a handler for deleting license record
func (app *application) HandlerApiDeleteLicensingRecord(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	err := app.db.DeleteLicenseRecord(uuid)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeOkResponse(w, "License Record deleted")
}

func (app *application) HandlerApiDeleteLicensingAttachment(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	err := app.db.DeleteLicenseAttachment(uuid)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeOkResponse(w, "License Record Attachment deleted")
}
