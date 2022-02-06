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
		app.infoLog.Println("/licensing")
	}

	if err := app.renderTemplate(w, r, "licensing", nil); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerFlightRecordsData generates data for the logbook table at /logbook page
func (app *application) HandlerLicensingRecordsData(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println("/licensing/data")
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

		tableRow := []string{item.Category, fmt.Sprintf("<a href='/licensing/%s' class='link-primary'>%s</a>", item.UUID, item.Name),
			item.Number, item.Issued, item.ValidFrom, item.ValidUntil, expire,
			fmt.Sprintf("<a href='/licensing/download/%s' target='_blank' class='link-primary'>%s</a>", item.UUID, item.DocumentName)}

		tableData.Data = append(tableData.Data, tableRow)
	}

	out, err := json.Marshal(tableData)
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
		app.infoLog.Printf("%d license records generated for the table\n", len(tableData.Data))
	}
}

// HandlerLicensingRecordByID is handler for a license record
func (app *application) HandlerLicensingRecordByID(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	if app.config.env == "dev" {
		app.infoLog.Printf("/licensing/%s", uuid)
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

	if err := app.renderTemplate(w, r, "license-record", &templateData{Data: data}); err != nil {
		app.errorLog.Println(err)
	}
}

// HandlerLicensingDownload is a handler for downloading the license files
func (app *application) HandlerLicensingDownload(w http.ResponseWriter, r *http.Request) {
	uuid := chi.URLParam(r, "uuid")

	if app.config.env == "dev" {
		app.infoLog.Printf("/licensing/download/%s", uuid)
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
		app.infoLog.Println("/licensing/new")
	}

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
	if app.config.env == "dev" {
		app.infoLog.Println("/licensing/delete")
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
		response.RedirectURL = "/licensing"

		if app.config.env == "dev" {
			app.infoLog.Printf("license record %s deleted\n", license.UUID)
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

// HandlerLicensingRecordSave is a handler for creating or updating license record
func (app *application) HandlerLicensingRecordSave(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println("/licensing/save")
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
			response.RedirectURL = fmt.Sprintf("/licensing/%s", license.UUID)

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

			if app.config.env == "dev" {
				app.infoLog.Printf("license records %s updated\n", license.UUID)
			}
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
