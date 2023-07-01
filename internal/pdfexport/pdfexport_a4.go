package pdfexport

import (
	"fmt"
	"io"
	"strings"

	"github.com/go-pdf/fpdf"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// printA4LogbookHeader prints header
func printA4LogbookHeader() {
	pdf.AddPage()
	setFontLogbookHeader()

	// First header
	pdf.SetXY(leftMargin, topMargin)
	x, y := pdf.GetXY()
	for i, str := range header1 {
		width := w1[i]
		pdf.Rect(x, y-1, width, 5, "FD")
		pdf.MultiCell(width, 1, str, "", "C", false)
		x += width
		pdf.SetXY(x, y)
	}
	pdf.Ln(-1)

	// Second header
	pdf.SetXY(leftMargin, topMargin+3)
	x, y = pdf.GetXY()
	for i, str := range header2 {
		width := w2[i]
		pdf.Rect(x, y-1, width, 12, "FD")
		pdf.MultiCell(width, 3, str, "", "C", false)
		x += width
		pdf.SetXY(x, y)
	}
	pdf.Ln(-1)

	// Header inside header
	pdf.SetXY(leftMargin, topMargin+11)
	x, y = pdf.GetXY()
	for i, str := range header3 {
		width := w3[i]
		if str != "" {
			pdf.Rect(x, y-1, width, 4, "FD")
			pdf.MultiCell(width, 2, str, "", "C", false)
		}
		x += width
		pdf.SetXY(x, y)
	}
	pdf.Ln(-1)

	// Align the logbook body
	_, y = pdf.GetXY()
	y += 1
	pdf.SetY(y)
}

func printA4Total(totalName string, total models.FlightRecord) {
	setFontLogbookFooter()

	pdf.SetX(leftMargin)

	printFooterLeftBlock(totalName)
	printFooterCell(w4[1], totalName)
	printFooterCell(w4[2], total.Time.SE)
	printFooterCell(w4[3], total.Time.ME)
	printFooterCell(w4[4], total.Time.MCC)
	printFooterCell(w4[5], total.Time.Total)
	printFooterCell(w4[6], "")
	printFooterCell(w4[7], fmt.Sprintf("%d", total.Landings.Day))
	printFooterCell(w4[8], fmt.Sprintf("%d", total.Landings.Night))
	printFooterCell(w4[9], total.Time.Night)
	printFooterCell(w4[10], total.Time.IFR)
	printFooterCell(w4[11], total.Time.PIC)
	printFooterCell(w4[12], total.Time.CoPilot)
	printFooterCell(w4[13], total.Time.Dual)
	printFooterCell(w4[14], total.Time.Instructor)
	printFooterCell(w4[15], "")
	printFooterCell(w4[16], total.SIM.Time)
	printFooterSignatureBlock(totalName)

	pdf.Ln(-1)
}

// printA4LogbookFooter prints footer
func printA4LogbookFooter() {
	printA4Total("TOTAL THIS PAGE", totalPage)
	printA4Total("TOTAL FROM PREVIOUS PAGES", totalPrevious)
	printA4Total("TOTAL TIME", totalTime)
}

// printA4LogbookBody forms and prints the logbook row
func printA4LogbookBody(record models.FlightRecord, fill bool) {
	setFontLogbookBody()

	// 	Data
	pdf.SetX(leftMargin)
	printBodyTimeCell(w3[0], record.Date, fill)
	printBodyTimeCell(w3[1], record.Departure.Place, fill)
	printBodyTimeCell(w3[2], record.Departure.Time, fill)
	printBodyTimeCell(w3[3], record.Arrival.Place, fill)
	printBodyTimeCell(w3[4], record.Arrival.Time, fill)
	printBodyTimeCell(w3[5], record.Aircraft.Model, fill)
	printBodyTimeCell(w3[6], record.Aircraft.Reg, fill)
	printSinglePilotTime(w3[7], record.Time.SE, fill)
	printSinglePilotTime(w3[8], record.Time.ME, fill)
	printBodyTimeCell(w3[9], record.Time.MCC, fill)
	printBodyTimeCell(w3[10], record.Time.Total, fill)
	printBodyTextCell(w3[11], record.PIC, fill)
	printBodyTimeCell(w3[12], formatLandings(record.Landings.Day), fill)
	printBodyTimeCell(w3[12], formatLandings(record.Landings.Night), fill)
	printBodyTimeCell(w3[14], record.Time.Night, fill)
	printBodyTimeCell(w3[15], record.Time.IFR, fill)
	printBodyTimeCell(w3[16], record.Time.PIC, fill)
	printBodyTimeCell(w3[17], record.Time.CoPilot, fill)
	printBodyTimeCell(w3[18], record.Time.Dual, fill)
	printBodyTimeCell(w3[19], record.Time.Instructor, fill)
	printBodyTimeCell(w3[20], record.SIM.Type, fill)
	printBodyTimeCell(w3[21], record.SIM.Time, fill)
	printBodyRemarksCell(w3[22], record.Remarks, fill)

	pdf.Ln(-1)

	pdf.SetX(leftMargin)
}

// titlePageA4 prints title page for A4
func titlePageA4() {
	pdf.AddPage()
	pdf.SetFont(fontBold, "", 20)
	pdf.SetXY(95, 60)
	pdf.MultiCell(100, 2, "PILOT LOGBOOK", "", "C", false)

	pdf.SetFont(fontRegular, "", 15)
	pdf.SetXY(65, 150)
	pdf.MultiCell(160, 2, "HOLDER'S NAME: "+strings.ToUpper(ownerName), "", "C", false)
}

// logBookRow prints logbook record row
func logBookRow(record models.FlightRecord, rowCounter *int, pageCounter *int) {
	var totalEmpty models.FlightRecord

	*rowCounter += 1

	if record.Time.MCC != "" {
		record.Time.ME = ""
	}

	totalPage = models.CalculateTotals(totalPage, record)
	totalTime = models.CalculateTotals(totalTime, record)

	printA4LogbookBody(record, isFillLine(*rowCounter, fillRow))

	if *rowCounter >= logbookRows {
		printA4LogbookFooter()
		printPageNumber(*pageCounter)

		totalPrevious = totalTime
		totalPage = totalEmpty

		// check for the page breakes to separate logbooks
		checkPageBreaks(pageCounter, titlePageA4)

		*rowCounter = 0
		*pageCounter += 1

		printA4LogbookHeader()
	}
}

// exportA4 creates A4 pdf with logbook in EASA format
func exportA4(flightRecords []models.FlightRecord, w io.Writer) error {
	// start forming the pdf file
	pdf = fpdf.New("L", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 5)
	loadFonts()
	loadSignature()

	pdf.SetLineWidth(.2)

	rowCounter := 0
	pageCounter := 1

	titlePageA4()
	printA4LogbookHeader()

	for i := len(flightRecords) - 1; i >= 0; i-- {
		logBookRow(flightRecords[i], &rowCounter, &pageCounter)
	}

	// check the last page for the proper format
	var emptyRecord models.FlightRecord
	for i := rowCounter + 1; i <= logbookRows; i++ {
		printA4LogbookBody(emptyRecord, isFillLine(i, fillRow))
	}

	printA4LogbookFooter()
	printPageNumber(pageCounter)

	err := pdf.Output(w)

	return err
}
