package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// HandlerLicensing is a handler for /licensing page
func (app *application) HandlerLicensing(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APILicensing)
	}

	if err := app.renderTemplate(w, r, "licensing", nil); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerFlightRecordsData generates data for the logbook table at /logbook page
func (app *application) HandlerLicensingRecordsData(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APILicensingData)
	}

	type TableData struct {
		Data [][]string `json:"data"`
	}

	var tableData TableData

	licenses, err := app.db.GetLicenses()
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	icon := `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
	<path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
	<path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
	</svg>`
	for _, item := range licenses {
		expire := ""
		if item.ValidUntil != "" {
			expireDate, err := time.Parse("02/01/2006", item.ValidUntil)
			if err != nil {
				app.errorLog.Printf("error parsing time %s: %s", item.ValidUntil, err.Error())
			}

			days := int(expireDate.Sub(time.Now().UTC()).Hours() / 24)
			if days <= 0 {
				expire = "Expired!"
			} else if days <= 30 {
				expire = fmt.Sprintf("In %d days", days)
			} else {
				expire = fmt.Sprintf("In %d months", int(days/30))
			}
		}

		link := ""
		if item.DocumentName != "" {
			link = fmt.Sprintf("<a href='/licensing/download/%s' target='_blank' class='link-primary'>%s</a>", item.UUID, icon)
		} else {
			link = ""
		}

		tableRow := []string{item.Category, fmt.Sprintf("<a href='/licensing/%s' class='link-primary'>%s</a>", item.UUID, item.Name),
			item.Number, item.Issued, item.ValidFrom, item.ValidUntil, expire, link}

		tableData.Data = append(tableData.Data, tableRow)
	}

	err = app.writeJSON(w, http.StatusOK, tableData)
	if err != nil {
		app.errorLog.Println(err)
		return
	}

	if app.config.env == "dev" {
		app.infoLog.Printf("%d license records generated for the table\n", len(tableData.Data))
	}
}

// HandlerLicensingRecordByID is handler for a license record
func (app *application) HandlerLicensingRecordByID(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	if app.config.env == "dev" {
		app.infoLog.Println(strings.ReplaceAll(APILicensingUUID, "{uuid}", uuid))
	}

	license, err := app.db.GetLicenseRecordByID(uuid)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	categories, err := app.db.GetLicensesCategory()
	if err != nil {
		app.errorLog.Println(err)
	}

	data := make(map[string]interface{})
	data["license"] = license
	data["categories"] = categories

	if err := app.renderTemplate(w, r, "license-record", &templateData{Data: data}, "common-js", "license-record-js"); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerLicensingDownload is a handler for downloading the license files
func (app *application) HandlerLicensingDownload(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	if app.config.env == "dev" {
		app.infoLog.Println(strings.ReplaceAll(APILicensingDownloadUUID, "{uuid}", uuid))
	}

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
	if app.config.env == "dev" {
		app.infoLog.Println(APILicensingNew)
	}

	var license models.License

	categories, err := app.db.GetLicensesCategory()
	if err != nil {
		app.errorLog.Println(err)
	}

	data := make(map[string]interface{})
	data["license"] = license
	data["categories"] = categories

	if err := app.renderTemplate(w, r, "license-record", &templateData{Data: data}, "common-js", "license-record-js"); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerLicensingRecordDelete is a handler for deleting license record
func (app *application) HandlerLicensingRecordDelete(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APILicensingDelete)
	}

	var license models.License
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&license)
	if err != nil {
		app.errorLog.Panicln(err)
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

		if app.config.env == "dev" {
			app.infoLog.Printf("license record %s deleted\n", license.UUID)
		}
	}

	err = app.writeJSON(w, http.StatusOK, response)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

func (app *application) HandlerLicensingDeleteAttachment(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APILicensingAttachmentDelete)
	}

	var license models.License
	var response models.JSONResponse

	err := json.NewDecoder(r.Body).Decode(&license)
	if err != nil {
		app.errorLog.Panicln(err)
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

		if app.config.env == "dev" {
			app.infoLog.Printf("license record %s deleted\n", license.UUID)
		}
	}

	err = app.writeJSON(w, http.StatusOK, response)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}

// HandlerLicensingRecordSave is a handler for creating or updating license record
func (app *application) HandlerLicensingRecordSave(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APILicensingSave)
	}

	var response models.JSONResponse

	err := r.ParseMultipartForm(32 << 20)
	if err != nil {
		app.errorLog.Panicln(err)
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
		bs, err := ioutil.ReadAll(file)
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

			if app.config.env == "dev" {
				app.infoLog.Printf("new license record %s created", license.UUID)
			}
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

			if app.config.env == "dev" {
				app.infoLog.Printf("license records %s updated\n", license.UUID)
			}
		}
	}

	err = app.writeJSON(w, http.StatusOK, response)
	if err != nil {
		app.errorLog.Println(err)
		return
	}
}
