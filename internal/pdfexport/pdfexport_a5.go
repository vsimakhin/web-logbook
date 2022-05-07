package pdfexport

import (
	"fmt"
	"io"
	"strings"

	"github.com/jung-kurt/gofpdf"
	"github.com/vsimakhin/web-logbook/internal/models"
)

var header1_div = 8
var header2_div = 9
var header3_div = 14

var leftMarginB float64

// printA5LogbookHeaderA prints header on the "left page"
func (l *Logbook) printA5LogbookHeaderA() {

	l.pdf.SetFillColor(217, 217, 217)
	l.pdf.SetFont(fontBold, "", 8)

	l.pdf.SetX(leftMargin)
	l.pdf.SetY(topMargin)

	// First header
	l.pdf.SetXY(leftMargin, topMargin)
	x, y := l.pdf.GetXY()
	for i := 0; i < header1_div; i++ {
		width := w1[i]
		l.pdf.Rect(x, y-1, width, 5, "FD")
		l.pdf.MultiCell(width, 1, header1[i], "", "C", false)
		x += width
		l.pdf.SetXY(x, y)
	}
	l.pdf.Ln(-1)

	// Second header
	l.pdf.SetXY(leftMargin, topMargin+3)
	x, y = l.pdf.GetXY()
	for i := 0; i < header2_div; i++ {
		width := w2[i]
		l.pdf.Rect(x, y-1, width, 12, "FD")
		l.pdf.MultiCell(width, 3, header2[i], "", "C", false)
		x += width
		l.pdf.SetXY(x, y)
	}
	l.pdf.Ln(-1)

	// Header inside header
	l.pdf.SetXY(leftMargin, topMargin+11)
	x, y = l.pdf.GetXY()
	for i := 0; i < header3_div; i++ {
		width := w3[i]
		if header3[i] != "" {
			l.pdf.Rect(x, y-1, width, 4, "FD")
			l.pdf.MultiCell(width, 2, header3[i], "", "C", false)
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

// printA5LogbookHeaderA prints header on the "right page"
func (l *Logbook) printA5LogbookHeaderB() {

	l.pdf.SetFillColor(217, 217, 217)
	l.pdf.SetFont(fontBold, "", 8)

	// First header
	l.pdf.SetXY(leftMarginB, topMargin)
	x, y := l.pdf.GetXY()
	for i := header1_div; i < len(header1); i++ {
		width := w1[i]
		// l.pdf.CellFormat(w1[i], footerRowHeight, header1[i], "1", 0, "C", true, 0, "")
		l.pdf.Rect(x, y-1, width, 5, "FD")
		l.pdf.MultiCell(width, 1, header1[i], "", "C", false)
		x += width
		l.pdf.SetXY(x, y)
	}
	l.pdf.Ln(-1)

	// Second header
	l.pdf.SetXY(leftMarginB, topMargin+3)
	x, y = l.pdf.GetXY()
	for i := header2_div; i < len(header2); i++ {
		width := w2[i]
		l.pdf.Rect(x, y-1, width, 12, "FD")
		l.pdf.MultiCell(width, 3, header2[i], "", "C", false)
		x += width
		l.pdf.SetXY(x, y)
	}
	l.pdf.Ln(-1)

	// Header inside header
	l.pdf.SetXY(leftMarginB, topMargin+11)
	x, y = l.pdf.GetXY()
	for i := header3_div; i < len(header3); i++ {
		width := w3[i]
		if header3[i] != "" {
			l.pdf.Rect(x, y-1, width, 4, "FD")
			l.pdf.MultiCell(width, 2, header3[i], "", "C", false)
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

// printA5LogbookFooterA prints footer on the "left page"
func (l *Logbook) printA5LogbookFooterA() {

	printTotal := func(totalName string, total models.FlightRecord) {
		l.pdf.SetFillColor(217, 217, 217)
		l.pdf.SetFont(fontBold, "", 8)

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

		l.pdf.Ln(-1)
	}

	printTotal("TOTAL THIS PAGE", totalPage)
	printTotal("TOTAL FROM PREVIOUS PAGES", totalPrevious)
	printTotal("TOTAL TIME", totalTime)
}

// printA5LogbookFooterA prints footer on the "left page"
func (l *Logbook) printA5LogbookFooterB() {

	printTotal := func(totalName string, total models.FlightRecord) {
		l.pdf.SetFillColor(217, 217, 217)
		l.pdf.SetFont(fontBold, "", 8)

		l.pdf.SetX(leftMarginB)

		l.pdf.CellFormat(w4[9], footerRowHeight, total.Time.Night, "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[10], footerRowHeight, total.Time.IFR, "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[11], footerRowHeight, total.Time.PIC, "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[12], footerRowHeight, total.Time.CoPilot, "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[13], footerRowHeight, total.Time.Dual, "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[14], footerRowHeight, total.Time.Instructor, "1", 0, "C", true, 0, "")
		l.pdf.CellFormat(w4[15], footerRowHeight, "", "1", 0, "", true, 0, "")
		l.pdf.CellFormat(w4[16], footerRowHeight, total.SIM.Time, "1", 0, "C", true, 0, "")

		l.pdf.SetFont(fontRegular, "", 6)
		if totalName == "TOTAL THIS PAGE" {
			l.pdf.CellFormat(w4[17], footerRowHeight, l.Signature, "LTR", 0, "C", true, 0, "")
		} else if totalName == "TOTAL FROM PREVIOUS PAGES" {
			l.pdf.CellFormat(w4[17], footerRowHeight, "", "LR", 0, "", true, 0, "")
		} else {
			l.pdf.CellFormat(w4[17], footerRowHeight, l.OwnerName, "LBR", 0, "C", true, 0, "")
		}

		l.pdf.Ln(-1)
	}

	printTotal("TOTAL THIS PAGE", totalPage)
	printTotal("TOTAL FROM PREVIOUS PAGES", totalPrevious)
	printTotal("TOTAL TIME", totalTime)
}

// printA5LogbookBodyA forms and prints the logbook row on the "left page"
func (l *Logbook) printA5LogbookBodyA(record models.FlightRecord, fill bool) {

	l.pdf.SetFillColor(228, 228, 228)
	l.pdf.SetTextColor(0, 0, 0)
	l.pdf.SetFont(fontRegular, "", 8)

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

	l.pdf.Ln(-1)

	l.pdf.SetX(leftMargin)
}

// printA5LogbookBodyB forms and prints the logbook row on the "right page"
func (l *Logbook) printA5LogbookBodyB(record models.FlightRecord, fill bool) {

	l.pdf.SetFillColor(228, 228, 228)
	l.pdf.SetTextColor(0, 0, 0)
	l.pdf.SetFont(fontRegular, "", 8)

	// 	Data
	l.pdf.SetX(leftMarginB)
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

// TitlePageA5 print title page for A5
func (l *Logbook) TitlePageA5() {
	l.pdf.AddPage()
	l.pdf.SetFont(fontBold, "", 20)
	l.pdf.SetXY(55, 60)
	l.pdf.MultiCell(100, 2, "PILOT LOGBOOK", "", "C", false)

	l.pdf.SetFont(fontRegular, "", 15)
	l.pdf.SetXY(25, 100)
	l.pdf.MultiCell(160, 2, "HOLDER'S NAME: "+strings.ToUpper(l.OwnerName), "", "C", false)
}

// ExportA5 creates A5 pdf with logbook in EASA format
func (l *Logbook) ExportA5(flightRecords []models.FlightRecord, w io.Writer) error {
	// init global vars
	l.init(PDFA5)

	// start forming the pdf file
	l.pdf = gofpdf.New("L", "mm", "A5", "")
	l.pdf.SetAutoPageBreak(false, 5)
	l.loadFonts()

	l.pdf.SetLineWidth(.2)

	rowCounter := 0
	pageCounter := 1

	var totalEmpty models.FlightRecord
	fill := false

	// title page
	l.TitlePageA5()

	logBookRowA := func(item int) int {
		rowCounter += 1

		record := flightRecords[item]
		if record.Time.MCC != "" {
			record.Time.ME = ""
		}

		totalPage = models.CalculateTotals(totalPage, record)
		totalTime = models.CalculateTotals(totalTime, record)

		l.printA5LogbookBodyA(record, fill)

		if rowCounter >= logbookRows {
			rowCounter = 0

			return item
		}
		fill = fillLine(rowCounter, fillRow)
		return -1
	}

	logBookRowB := func(item int) {
		rowCounter += 1

		record := flightRecords[item]
		if record.Time.MCC != "" {
			record.Time.ME = ""
		}

		l.printA5LogbookBodyB(record, fill)

		if rowCounter >= logbookRows {
			rowCounter = 0
		}
		fill = fillLine(rowCounter, fillRow)
	}

	l.pdf.AddPage()
	l.printA5LogbookHeaderA()

	itemCounter := len(flightRecords)
	for i := len(flightRecords) - 1; i >= 0; i-- {
		currentItem := logBookRowA(i)

		if currentItem >= 0 {
			// page A closed
			l.printA5LogbookFooterA()
			l.printPageNumber(pageCounter)
			pageCounter += 1

			// let's print page B
			l.pdf.AddPage()
			l.printA5LogbookHeaderB()

			for y := itemCounter - 1; y >= currentItem; y-- {
				logBookRowB(y)
			}

			// end of page B
			l.printA5LogbookFooterB()
			totalPrevious = totalTime
			totalPage = totalEmpty

			// check for the page breakes to separate logbooks
			if len(l.PageBreaks) > 0 {
				if fmt.Sprintf("%d", pageCounter-1) == l.PageBreaks[0] {
					l.pdf.AddPage()
					l.TitlePageA5()

					pageCounter = 1

					l.PageBreaks = append(l.PageBreaks[:0], l.PageBreaks[1:]...)
				}
			}

			itemCounter = currentItem
			if currentItem != 0 {
				l.pdf.AddPage()
				l.printA5LogbookHeaderA()
			}
		}
	}

	// check the last pages for the proper format
	var emptyRecord models.FlightRecord
	if rowCounter != 0 {
		for i := rowCounter + 1; i <= logbookRows; i++ {
			l.printA5LogbookBodyA(emptyRecord, fill)
			fill = fillLine(i, fillRow)

		}
		l.printA5LogbookFooterA()
		l.printPageNumber(pageCounter)

		// page B
		l.pdf.AddPage()
		l.printA5LogbookHeaderB()
		fill = false

		for i := itemCounter - 1; i >= 0; i-- {
			logBookRowB(i)
		}
		for i := itemCounter; i < logbookRows; i++ {
			fill = fillLine(i, fillRow)
			l.printA5LogbookBodyB(emptyRecord, fill)
		}
		l.printA5LogbookFooterB()
	}

	err := l.pdf.Output(w)

	return err
}
