package pdfexport

import (
	"embed"
	"fmt"
	"io"

	"github.com/jung-kurt/gofpdf"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// some global vars
var leftMargin = 10.0
var topMargin = 30.0
var logbookRows = 23
var bodyRowHeight = 5.0
var footerRowHeight = 6.0

var header1 = []string{"1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"}
var header2 = []string{"DATE", "DEPARTURE", "ARRIVAL", "AIRCRAFT", "SINGLE PILOT TIME", "MULTI PILOT TIME", "TOTAL TIME", "PIC NAME", "LANDINGS", "OPERATIONAL CONDITION TIME", "PILOT FUNCTION TIME", "FSTD SESSION", "REMARKS AND ENDORSMENTS"}
var header3 = []string{"", "Place", "Time", "Place", "Time", "Type", "Reg", "SE", "ME", "", "", "", "Day", "Night", "Night", "IFR", "PIC", "COP", "DUAL", "INSTR", "Type", "Time", ""}

var w1 = []float64{12.2, 16.5, 16.5, 22.9, 33.6, 11.2, 22.86, 16.76, 22.4, 44.8, 22.4, 33.8}
var w2 = []float64{12.2, 16.5, 16.5, 22.9, 22.4, 11.2, 11.2, 22.86, 16.76, 22.4, 44.8, 22.4, 33.8}
var w3 = []float64{12.2, 8.25, 8.25, 8.25, 8.25, 10, 12.9, 11.2, 11.2, 11.2, 11.2, 22.86, 8.38, 8.38, 11.2, 11.2, 11.2, 11.2, 11.2, 11.2, 11.2, 11.2, 33.8}
var w4 = []float64{20.45, 47.65, 11.2, 11.2, 11.2, 11.2, 22.86, 8.38, 8.38, 11.2, 11.2, 11.2, 11.2, 11.2, 11.2, 11.2, 11.2, 33.8}

//go:embed font/*
var content embed.FS

type Logbook struct {
	pdf *gofpdf.Fpdf

	OwnerName  string
	Signature  string
	PageBreaks []string

	totalPage     models.FlightRecord
	totalPrevious models.FlightRecord
	totalTime     models.FlightRecord
}

// printLogbookHeader prints header
func (l *Logbook) printLogbookHeader() {

	l.pdf.SetFillColor(217, 217, 217)
	l.pdf.SetFont("LiberationSansNarrow-Bold", "", 8)

	l.pdf.SetX(leftMargin)
	l.pdf.SetY(topMargin)

	// First header
	x, y := l.pdf.GetXY()
	for i, str := range header1 {
		width := w1[i]
		l.pdf.Rect(x, y-1, width, 5, "FD")
		l.pdf.MultiCell(width, 1, str, "", "C", false)
		x += width
		l.pdf.SetXY(x, y)
	}
	l.pdf.Ln(-1)

	// Second header
	x, y = l.pdf.GetXY()
	y += 2
	l.pdf.SetY(y)
	for i, str := range header2 {
		width := w2[i]
		l.pdf.Rect(x, y-1, width, 12, "FD")
		l.pdf.MultiCell(width, 3, str, "", "C", false)
		x += width
		l.pdf.SetXY(x, y)
	}
	l.pdf.Ln(-1)

	// Header inside header
	x, y = l.pdf.GetXY()
	y += 5
	l.pdf.SetY(y)
	for i, str := range header3 {
		width := w3[i]
		if str != "" {
			l.pdf.Rect(x, y-1, width, 4, "FD")
			l.pdf.MultiCell(width, 2, str, "", "C", false)
		}
		x += width
		l.pdf.SetXY(x, y)
	}
	l.pdf.Ln(-1)

	// Align the logbook body
	_, y = l.pdf.GetXY()
	y += 1
	l.pdf.SetY(y)
}

// printLogbookFooter prints footer
func (l *Logbook) printLogbookFooter() {

	printTotal := func(totalName string, total models.FlightRecord) {
		l.pdf.SetFillColor(217, 217, 217)
		l.pdf.SetFont("LiberationSansNarrow-Bold", "", 8)

		l.pdf.SetX(leftMargin)

		if totalName == "TOTAL THIS PAGE" {
			l.pdf.CellFormat(w4[0], footerRowHeight, "", "LTR", 0, "", true, 0, "")
		} else if totalName == "TOTAL FROM PREVIOUS PAGES" {
			l.pdf.CellFormat(w4[0], footerRowHeight, "", "LR", 0, "", true, 0, "")
		} else {
			l.pdf.CellFormat(w4[0], footerRowHeight, "", "LBR", 0, "", true, 0, "")
		}
		l.pdf.CellFormat(w4[1], footerRowHeight, totalName, "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[2], footerRowHeight, total.Time.SE, "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[3], footerRowHeight, total.Time.ME, "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[4], footerRowHeight, total.Time.MCC, "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[5], footerRowHeight, total.Time.Total, "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[6], footerRowHeight, "", "1", 0, "", true, 0, "")
		l.pdf.CellFormat(w4[7], footerRowHeight, fmt.Sprintf("%d", total.Landings.Day), "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[8], footerRowHeight, fmt.Sprintf("%d", total.Landings.Night), "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[9], footerRowHeight, total.Time.Night, "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[10], footerRowHeight, total.Time.IFR, "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[11], footerRowHeight, total.Time.PIC, "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[12], footerRowHeight, total.Time.CoPilot, "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[13], footerRowHeight, total.Time.Dual, "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[14], footerRowHeight, total.Time.Instructor, "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[15], footerRowHeight, "", "1", 0, "", true, 0, "")
		l.pdf.CellFormat(w4[16], footerRowHeight, total.SIM.Time, "1", 0, "C", true, 0, "")

		l.pdf.SetFont("LiberationSansNarrow-Regular", "", 6)
		if totalName == "TOTAL THIS PAGE" {
			l.pdf.CellFormat(w4[17], footerRowHeight, l.Signature, "LTR", 0, "C", true, 0, "")
		} else if totalName == "TOTAL FROM PREVIOUS PAGES" {
			l.pdf.CellFormat(w4[17], footerRowHeight, "", "LR", 0, "", true, 0, "")
		} else {
			l.pdf.CellFormat(w4[17], footerRowHeight, l.OwnerName, "LBR", 0, "C", true, 0, "")
		}

		l.pdf.Ln(-1)
	}

	printTotal("TOTAL THIS PAGE", l.totalPage)
	printTotal("TOTAL FROM PREVIOUS PAGES", l.totalPrevious)
	printTotal("TOTAL TIME", l.totalTime)
}

func formatLandings(landing int) string {
	if landing == 0 {
		return ""
	} else {
		return fmt.Sprintf("%d", landing)
	}
}

// printLogbookBody forms and prints the logbook row
func (l *Logbook) printLogbookBody(record models.FlightRecord, fill bool) {

	l.pdf.SetFillColor(228, 228, 228)
	l.pdf.SetTextColor(0, 0, 0)
	l.pdf.SetFont("LiberationSansNarrow-Regular", "", 8)

	// 	Data

	l.pdf.SetX(leftMargin)
	l.pdf.CellFormat(w3[0], bodyRowHeight, record.Date, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[1], bodyRowHeight, record.Departure.Place, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[2], bodyRowHeight, record.Departure.Time, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[3], bodyRowHeight, record.Arrival.Place, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[4], bodyRowHeight, record.Arrival.Time, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[5], bodyRowHeight, record.Aircraft.Model, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[6], bodyRowHeight, record.Aircraft.Reg, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[7], bodyRowHeight, record.Time.SE, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[8], bodyRowHeight, record.Time.ME, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[9], bodyRowHeight, record.Time.MCC, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[10], bodyRowHeight, record.Time.Total, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[11], bodyRowHeight, record.PIC, "1", 0, "L", fill, 0, "")
	l.pdf.CellFormat(w3[12], bodyRowHeight, formatLandings(record.Landings.Day), "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[12], bodyRowHeight, formatLandings(record.Landings.Night), "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[14], bodyRowHeight, record.Time.Night, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[15], bodyRowHeight, record.Time.IFR, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[16], bodyRowHeight, record.Time.PIC, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[17], bodyRowHeight, record.Time.CoPilot, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[18], bodyRowHeight, record.Time.Dual, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[19], bodyRowHeight, record.Time.Instructor, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[20], bodyRowHeight, record.SIM.Type, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[21], bodyRowHeight, record.SIM.Time, "1", 0, "C", fill, 0, "")
	l.pdf.CellFormat(w3[22], bodyRowHeight, record.Remarks, "1", 0, "L", fill, 0, "")

	l.pdf.Ln(-1)

	l.pdf.SetX(leftMargin)
}

// fillLine returns if the logbook line should be filled with gray color
func fillLine(rowCounter int) bool {
	if (rowCounter+1)%3 == 0 { // fill every 3rd row only
		return true
	} else {
		return false
	}
}

// LoadFonts loads fonts for pdf object from embed fs
func (l *Logbook) loadFonts() {

	fontRegularBytes, _ := content.ReadFile("font/LiberationSansNarrow-Regular.ttf")
	l.pdf.AddUTF8FontFromBytes("LiberationSansNarrow-Regular", "", fontRegularBytes)

	fontBoldBytes, _ := content.ReadFile("font/LiberationSansNarrow-Bold.ttf")
	l.pdf.AddUTF8FontFromBytes("LiberationSansNarrow-Bold", "", fontBoldBytes)
}

// Export creates pdf with logbook in EASA format
func (l *Logbook) Export(flightRecords []models.FlightRecord, w io.Writer) error {

	// start forming the pdf file
	l.pdf = gofpdf.New("L", "mm", "A4", "")
	l.loadFonts()

	l.pdf.SetLineWidth(.2)

	rowCounter := 0
	pageCounter := 1

	var totalEmpty models.FlightRecord

	l.pdf.AddPage()
	l.printLogbookHeader()

	fill := false

	logBookRow := func(item int) {
		rowCounter += 1

		record := flightRecords[item]
		if record.Time.MCC != "" {
			record.Time.ME = ""
		}

		l.totalPage = models.CalculateTotals(l.totalPage, record)
		l.totalTime = models.CalculateTotals(l.totalTime, record)

		l.printLogbookBody(record, fill)

		if rowCounter >= logbookRows {
			l.printLogbookFooter()
			l.totalPrevious = l.totalTime
			l.totalPage = totalEmpty

			// print page number
			l.pdf.SetY(l.pdf.GetY() - 1)
			l.pdf.CellFormat(0, 10, fmt.Sprintf("page %d", pageCounter), "", 0, "L", false, 0, "")

			// check for the page breakes to separate logbooks
			if len(l.PageBreaks) > 0 {
				if fmt.Sprintf("%d", pageCounter) == l.PageBreaks[0] {
					l.pdf.AddPage()
					pageCounter = 0

					l.PageBreaks = append(l.PageBreaks[:0], l.PageBreaks[1:]...)
				}
			}

			rowCounter = 0
			pageCounter += 1

			l.pdf.AddPage()
			l.printLogbookHeader()
		}
		fill = fillLine(rowCounter)

	}

	for i := len(flightRecords) - 1; i >= 0; i-- {
		logBookRow(i)
	}

	// check the last page for the proper format
	var emptyRecord models.FlightRecord
	for i := rowCounter + 1; i <= logbookRows; i++ {
		l.printLogbookBody(emptyRecord, fill)
		fill = fillLine(i)

	}
	l.printLogbookFooter()
	// print page number
	l.pdf.SetY(l.pdf.GetY() - 1)
	l.pdf.CellFormat(0, 10, fmt.Sprintf("page %d", pageCounter), "", 0, "L", false, 0, "")

	err := l.pdf.Output(w)

	return err
}
