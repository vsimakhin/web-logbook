package pdfexport

import (
	"bytes"
	"embed"
	"encoding/base64"
	"fmt"
	"io"
	"strings"

	"github.com/go-pdf/fpdf"
	"github.com/vsimakhin/web-logbook/internal/models"
)

const PDFA4 = "A4"
const PDFA5 = "A5"

// fonts
const fontBold = "LiberationSansNarrow-Bold"
const fontRegular = "LiberationSansNarrow-Regular"
const fontB612 = "B612Mono-Regular"

// logbook page settings
var logbookRows int
var fillRow int

var leftMargin float64
var topMargin float64
var bodyRowHeight float64
var footerRowHeight float64

// headers captions
var header1 = []string{"1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"}
var header2 []string
var header3 []string

// colums widths
var w1 []float64
var w2 []float64
var w3 []float64
var w4 []float64

// vars
var totalPage models.FlightRecord
var totalPrevious models.FlightRecord
var totalTime models.FlightRecord

var replace_sp_time bool

var pageBreaks []string
var ownerName string
var signature string
var signatureImg string
var isExtended bool

//go:embed font/*
var content embed.FS

// pdf
var pdf *fpdf.Fpdf

type Logbook struct {
	OwnerName      string
	Signature      string
	SignatureImage string
	Export         models.ExportPDF
}

func (l *Logbook) ExportPDF(format string, flightRecords []models.FlightRecord, w io.Writer) error {
	var err error

	l.init(format)

	switch format {
	case PDFA4:
		err = exportA4(flightRecords, w)
	case PDFA5:
		err = exportA5(flightRecords, w)
	}

	return err
}

func (l *Logbook) init(format string) {
	// init empty records
	var emptyRecord models.FlightRecord
	totalPage = emptyRecord
	totalPrevious = emptyRecord
	totalTime = emptyRecord

	// page format
	logbookRows = l.Export.LogbookRows
	fillRow = l.Export.Fill

	topMargin = l.Export.TopMargin
	bodyRowHeight = l.Export.BodyRow
	footerRowHeight = l.Export.FooterRow

	if format == PDFA4 {
		leftMargin = l.Export.LeftMargin

	} else if format == PDFA5 {
		leftMargin = l.Export.LeftMarginA
		leftMarginB = l.Export.LeftMarginB
	}

	replace_sp_time = l.Export.ReplaceSPTime
	pageBreaks = strings.Split(l.Export.PageBreaks, ",")
	ownerName = l.OwnerName
	signature = l.Signature
	signatureImg = l.SignatureImage
	if !l.Export.IncludeSignature {
		signatureImg = ""
	}

	isExtended = l.Export.IsExtended

	initWidths(l.Export.Columns)
	initHeaders(l.Export.Headers)
}

// initHeaders sets the headers values
func initHeaders(h models.ColumnsHeader) {
	header2 = []string{
		h.Date, h.Departure, h.Arrival, h.Aircraft, h.SPT, h.MCC, h.Total,
		h.PICName, h.Landings, h.OCT, h.PFT, h.FSTD, h.Remarks,
	}
	header3 = []string{
		"", h.DepPlace, h.DepTime, h.ArrPlace, h.ArrTime, h.Model, h.Reg,
		h.SE, h.ME, "", "", "", h.LandDay, h.LandNight, h.Night, h.IFR,
		h.PIC, h.COP, h.Dual, h.Instr, h.SimType, h.SimTime, "",
	}
}

// initWidths sets the columns width values
func initWidths(c models.ColumnsWidth) {
	w1 = []float64{
		c.Col1,
		c.Col2 + c.Col3,
		c.Col4 + c.Col5,
		c.Col6 + c.Col7,
		c.Col8 + c.Col9 + c.Col10,
		c.Col11,
		c.Col12,
		c.Col13 + c.Col14,
		c.Col15 + c.Col16,
		c.Col17 + c.Col18 + c.Col19 + c.Col20,
		c.Col21 + c.Col22,
		c.Col23,
	}
	w2 = []float64{
		c.Col1,                   //date
		c.Col2 + c.Col3,          //departure
		c.Col4 + c.Col5,          //arrival
		c.Col6 + c.Col7,          //aircraft
		c.Col8 + c.Col9, c.Col10, //single, mcc
		c.Col11,                               //total time
		c.Col12,                               //pic name
		c.Col13 + c.Col14,                     //landings
		c.Col15 + c.Col16,                     //operational condition time
		c.Col17 + c.Col18 + c.Col19 + c.Col20, //pilot function time
		c.Col21 + c.Col22,                     //fstd session
		c.Col23,                               //remarks
	}
	w3 = []float64{
		c.Col1,         //date
		c.Col2, c.Col3, //departue - place, time
		c.Col4, c.Col5, //arrival - place, time
		c.Col6, c.Col7, //aircraft - type, reg
		c.Col8, c.Col9, c.Col10, //se, me, mcc
		c.Col11,          //total time
		c.Col12,          //pic name
		c.Col13, c.Col14, //landings - day, night
		c.Col15, c.Col16, //night, ifr
		c.Col17, c.Col18, c.Col19, c.Col20, //pic, cop, dual, instr
		c.Col21, c.Col22, //fstd - type, time
		c.Col23, //remarks
	}
	w4 = []float64{
		c.Col1 + c.Col2, //date + departure place
		c.Col3 + c.Col4 + c.Col5 + c.Col6 + c.Col7, //departure time...aircraft reg
		c.Col8,           //se
		c.Col9,           //me
		c.Col10,          //mcc
		c.Col11,          //total
		c.Col12,          //pic name
		c.Col13, c.Col14, //landings
		c.Col15,          //night
		c.Col16,          //ifr
		c.Col17,          //pic
		c.Col18,          //cop
		c.Col19,          //dual
		c.Col20,          //instr
		c.Col21, c.Col22, //fstd type and time
		c.Col23, //remarks
	}

	// extended format add Date column to the FSTD session by reducing Remarks
	if isExtended {
		w1[10] += c.Col1
		w1[11] -= c.Col1

		w2[11] += c.Col1
		w2[12] -= c.Col1

		w3[22] -= c.Col1

		w4[15] += c.Col1
		w4[17] -= c.Col1
	}
}

func formatLandings(landing int) string {
	if landing == 0 {
		return ""
	} else {
		return fmt.Sprintf("%d", landing)
	}
}

func isFillLine(rowCounter int, fill int) bool {
	if (rowCounter)%fill == 0 { // fill every "fill" row only
		return true
	} else {
		return false
	}
}

// LoadFonts loads fonts for pdf object from embed fs
func loadFonts() {
	fontRegularBytes, _ := content.ReadFile(fmt.Sprintf("font/%s.ttf", fontRegular))
	pdf.AddUTF8FontFromBytes(fontRegular, "", fontRegularBytes)

	fontBoldBytes, _ := content.ReadFile(fmt.Sprintf("font/%s.ttf", fontBold))
	pdf.AddUTF8FontFromBytes(fontBold, "", fontBoldBytes)

	fontB612Bytes, _ := content.ReadFile(fmt.Sprintf("font/%s.ttf", fontB612))
	pdf.AddUTF8FontFromBytes(fontB612, "", fontB612Bytes)
}

// loadSignature register PNG image with signature in a pdf file
func loadSignature() {
	if signatureImg != "" {
		unbased, err := base64.StdEncoding.DecodeString(strings.ReplaceAll(signatureImg, "data:image/png;base64,", ""))
		if err != nil {
			fmt.Printf("error adding signature image to the pdf file - %s, continue without signature\n", err)
			signatureImg = ""
			return
		}
		r := bytes.NewReader(unbased)
		pdf.RegisterImageReader("signature", "png", r)
	}
}

// printPageNumber just prints a page number
func printPageNumber(pageCounter int) {
	pdf.SetFont(fontRegular, "", 6)
	pdf.SetY(pdf.GetY() + 2)
	pdf.MultiCell(10, 1, fmt.Sprintf("page %d", pageCounter), "", "L", false)
}

func printBodyTimeCell(w float64, value string, fill bool) {
	pdf.CellFormat(w, bodyRowHeight, value, "1", 0, "C", fill, 0, "")
}

func printBodyTextCell(w float64, value string, fill bool) {
	pdf.CellFormat(w, bodyRowHeight, value, "1", 0, "L", fill, 0, "")
}

func printFooterCell(w float64, value string) {
	pdf.CellFormat(w, footerRowHeight, value, "1", 0, "C", true, 0, "")
}

func printFooterLeftBlock(totalName string) {
	if totalName == "TOTAL THIS PAGE" {
		pdf.CellFormat(w4[0], footerRowHeight, "", "LTR", 0, "", true, 0, "")
	} else if totalName == "TOTAL FROM PREVIOUS PAGES" {
		pdf.CellFormat(w4[0], footerRowHeight, "", "LR", 0, "", true, 0, "")
	} else {
		pdf.CellFormat(w4[0], footerRowHeight, "", "LBR", 0, "", true, 0, "")
	}
}

func printFooterSignatureBlock(totalName string) {
	pdf.SetFont(fontRegular, "", 6)

	if totalName == "TOTAL THIS PAGE" {
		pdf.CellFormat(w4[17], footerRowHeight, signature, "LTR", 0, "C", true, 0, "")
	} else if totalName == "TOTAL FROM PREVIOUS PAGES" {
		pdf.CellFormat(w4[17], footerRowHeight, "", "LR", 0, "", true, 0, "")
	} else {
		pdf.CellFormat(w4[17], footerRowHeight, ownerName, "LBR", 0, "C", true, 0, "")
		printSignature()
	}
}

func printSignature() {
	if signatureImg != "" {
		pdf.Image("signature", pdf.GetX()-w4[17], pdf.GetY()-footerRowHeight*2, w4[17], footerRowHeight*3, false, "", 0, "")
	}
}

// printSinglePilotTime replaces single pilot time with check symbol if the replace_sp_time is set
func printSinglePilotTime(w float64, value string, fill bool) {
	if replace_sp_time && value != "" {
		// set new font with symbol support
		pdf.SetFont(fontB612, "", 8)
		// put check symbol
		printBodyTimeCell(w, "✓", fill)
		// set back the regular font
		pdf.SetFont(fontRegular, "", 8)
	} else {
		printBodyTimeCell(w, value, fill)
	}
}

// checkPageBreaks prints the title page and resets the page counter
func checkPageBreaks(pageCounter *int, titlePage func()) {
	if len(pageBreaks) > 0 {
		if fmt.Sprintf("%d", *pageCounter) == pageBreaks[0] {
			titlePage()

			*pageCounter = 0

			pageBreaks = append(pageBreaks[:0], pageBreaks[1:]...)
		}
	}
}

// setFontLogbookBody sets font parameters for logbook rows
func setFontLogbookBody() {
	pdf.SetFillColor(228, 228, 228)
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont(fontRegular, "", 8)
}

// setFontLogbookHeader sets font parameters for logbook header
func setFontLogbookHeader() {
	pdf.SetFillColor(217, 217, 217)
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont(fontBold, "", 8)
}

// setFontLogbookFooter sets font parameters for logbook footer
// eventually is as same as for headers
func setFontLogbookFooter() {
	setFontLogbookHeader()
}
