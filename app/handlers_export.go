package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strings"

	"codeberg.org/go-pdf/fpdf"
	"codeberg.org/go-pdf/fpdf/contrib/gofpdi"
	"github.com/go-chi/chi/v5"
	"github.com/vsimakhin/web-logbook/internal/models"
	"github.com/vsimakhin/web-logbook/internal/pdfexport"
)

const exportA4 = "A4"
const exportA5 = "A5"

// validateCustomTitlePdf checks if the uploaded PDF file is supported by fpdf library
func validateCustomTitlePdf(bs []byte) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("this PDF file is not supported by pdf library")
		}
	}()

	pdf := fpdf.New("L", "mm", "A4", "")
	imp := gofpdi.NewImporter()

	readSeeker := io.ReadSeeker(bytes.NewReader(bs))
	imp.ImportPageFromStream(pdf, &readSeeker, 1, "/MediaBox")

	return nil
}

// HandlerApiUploadAttachment handles attachments upload
func (app *application) HandlerApiUploadCustomTitle(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(32 << 20)
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot parse the data, probably the attachment is too big - %s", err))
		app.handleError(w, err)
		return
	}

	attachment := models.Attachment{
		UUID:     r.PostFormValue("id"),
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
		err = validateCustomTitlePdf(attachment.Document)
		if err != nil {
			app.handleError(w, err)
			return
		}
	}

	// drop the old custom title
	err = app.db.DeleteAttachment(attachment.UUID)
	if err != nil {
		app.handleError(w, err)
		return
	}

	err = app.db.InsertAttachmentRecord(attachment)
	if err != nil {
		app.handleError(w, err)
		return
	}

	app.writeOkResponse(w, "Attachment has been uploaded")
}

// HandlerExportLogbook serves the GET request for logbook export
func (app *application) HandlerApiExportLogbook(w http.ResponseWriter, r *http.Request) {
	format := chi.URLParam(r, "format")

	flightRecords, err := app.db.GetFlightRecordsForExport()
	if err != nil {
		app.handleError(w, err)
		return
	}

	settings, err := app.db.GetSettings()
	if err != nil {
		app.handleError(w, err)
		return
	}

	var contentType, fileName string
	var exportFunc func() error

	switch format {
	case exportA4, exportA5:
		contentType = "application/pdf"
		fileName = "logbook.pdf"

		var exportSettings models.ExportPDF

		if format == exportA4 {
			exportSettings = settings.ExportA4
		} else {
			exportSettings = settings.ExportA5
		}

		// custom title
		id := fmt.Sprintf("custom_title_%s", strings.ToLower(format))
		att, _ := app.db.GetAttachmentByID(id)
		exportSettings.CustomTitleBlob = att.Document

		pdfExporter, err := pdfexport.NewPDFExporter(format,
			settings.OwnerName, settings.LicenseNumber, settings.Address,
			settings.SignatureText, settings.SignatureImage, exportSettings)

		if err != nil {
			app.handleError(w, err)
			return
		}

		exportFunc = func() error {
			if format == exportA4 {
				return pdfExporter.ExportA4(flightRecords, w)
			}
			return pdfExporter.ExportA5(flightRecords, w)
		}

	}

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", fileName))

	err = exportFunc()
	if err != nil {
		app.handleError(w, err)
	}
}
