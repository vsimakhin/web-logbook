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

//////////////////////////////////////////////
/////////////////////////////////////////////

// HandlerLicensingDownload is a handler for downloading the license files
func (app *application) HandlerLicensingDownload(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	license, err := app.db.GetLicenseRecordByID(uuid)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = w.Write(license.Document)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// HandlerLicensingRecordNew is a handler for creating a new license record
func (app *application) HandlerLicensingRecordNew(w http.ResponseWriter, r *http.Request) {

	var license models.License

	categories, err := app.db.GetLicensesCategory()
	if err != nil {
		app.errorLog.Println(err)
	}

	data := make(map[string]interface{})
	data["license"] = license
	data["categories"] = categories

	if err := app.renderTemplate(w, r, "license-record", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerLicensingRecordDelete is a handler for deleting license record
func (app *application) HandlerLicensingRecordDelete(w http.ResponseWriter, r *http.Request) {

	var license models.License
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&license)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.db.DeleteLicenseRecord(license.UUID)
	if err != nil {
		app.errorLog.Println(err)
		response.OK = false
		response.Message = err.Error()
	} else {
		response.OK = true
		response.Message = "License Record deleted"
		response.RedirectURL = APILicensing

	}

	app.writeJSON(w, http.StatusOK, response)
}

func (app *application) HandlerLicensingDeleteAttachment(w http.ResponseWriter, r *http.Request) {

	var license models.License
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&license)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.db.DeleteLicenseAttachment(license.UUID)
	if err != nil {
		app.errorLog.Println(err)
		response.OK = false
		response.Message = err.Error()
	} else {
		response.OK = true
		response.Message = "Attachment removed"
		response.RedirectURL = strings.ReplaceAll(APILicensingUUID, "{uuid}", license.UUID)

	}

	app.writeJSON(w, http.StatusOK, response)
}

// HandlerLicensingRecordSave is a handler for creating or updating license record
func (app *application) HandlerLicensingRecordSave(w http.ResponseWriter, r *http.Request) {

	var response models.JSONResponse

	err := r.ParseMultipartForm(32 << 20)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot parse the data, probably the attachment is too big - %s", err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	license := models.License{
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
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		defer file.Close()
		license.DocumentName = header.Filename

		// read file
		bs, err := io.ReadAll(file)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		license.Document = bs
	}

	if license.UUID == "" {
		// new record
		uuid, err := uuid.NewRandom()
		if err != nil {
			app.errorLog.Println(err)
			response.OK = false
			response.Message = err.Error()
		}

		license.UUID = uuid.String()

		err = app.db.InsertLicenseRecord(license)
		if err != nil {
			app.errorLog.Println(err)
			response.OK = false
			response.Message = err.Error()
		} else {
			response.OK = true
			response.Message = "New Record has been saved"
			response.RedirectURL = strings.ReplaceAll(APILicensingUUID, "{uuid}", license.UUID)

		}

	} else {
		// just update the license record
		err = app.db.UpdateLicenseRecord(license)
		if err != nil {
			app.errorLog.Println(err)
			response.OK = false
			response.Message = err.Error()
		} else {
			response.OK = true
			response.Message = "License Record has been updated"
			response.RedirectURL = strings.ReplaceAll(APILicensingUUID, "{uuid}", license.UUID)

		}
	}

	app.writeJSON(w, http.StatusOK, response)
}
