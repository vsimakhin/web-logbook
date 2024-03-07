package pdfexport

import (
	"fmt"
	"io"
	"strings"

	"github.com/go-pdf/fpdf"
	"github.com/vsimakhin/web-logbook/internal/models"
)

var header1_div = 8
var header2_div = 9
var header3_div = 14

var leftMarginB float64

// printA5LogbookHeaderA prints header on the "left page"
func printA5LogbookHeaderA() {

	setFontLogbookHeader()

	pdf.SetX(leftMargin)
	pdf.SetY(topMargin)

	// First header
	pdf.SetXY(leftMargin, topMargin)
	x, y := pdf.GetXY()
	for i := 0; i < header1_div; i++ {
		width := w1[i]
		pdf.Rect(x, y-1, width, 5, "FD")
		pdf.MultiCell(width, 1, header1[i], "", "C", false)
		x += width
		pdf.SetXY(x, y)
	}
	pdf.Ln(-1)

	// Second header
	pdf.SetXY(leftMargin, topMargin+3)
	x, y = pdf.GetXY()
	for i := 0; i < header2_div; i++ {
		width := w2[i]
		pdf.Rect(x, y-1, width, 12, "FD")
		pdf.MultiCell(width, 3, header2[i], "", "C", false)
		x += width
		pdf.SetXY(x, y)
	}
	pdf.Ln(-1)

	// Header inside header
	pdf.SetXY(leftMargin, topMargin+11)
	x, y = pdf.GetXY()
	for i := 0; i < header3_div; i++ {
		width := w3[i]
		if header3[i] != "" {
			pdf.Rect(x, y-1, width, 4, "FD")
			pdf.MultiCell(width, 2, header3[i], "", "C", false)
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

// printA5LogbookHeaderA prints header on the "right page"
func printA5LogbookHeaderB() {

	setFontLogbookHeader()

	// First header
	pdf.SetXY(leftMarginB, topMargin)
	x, y := pdf.GetXY()
	for i := header1_div; i < len(header1); i++ {
		width := w1[i]
		pdf.Rect(x, y-1, width, 5, "FD")
		pdf.MultiCell(width, 1, header1[i], "", "C", false)
		x += width
		pdf.SetXY(x, y)
	}
	pdf.Ln(-1)

	// Second header
	pdf.SetXY(leftMarginB, topMargin+3)
	x, y = pdf.GetXY()
	for i := header2_div; i < len(header2); i++ {
		width := w2[i]
		pdf.Rect(x, y-1, width, 12, "FD")
		pdf.MultiCell(width, 3, header2[i], "", "C", false)
		x += width
		pdf.SetXY(x, y)
	}
	pdf.Ln(-1)

	// Header inside header
	pdf.SetXY(leftMarginB, topMargin+11)
	x, y = pdf.GetXY()
	for i := header3_div; i < len(header3); i++ {
		width := w3[i]
		// add Date columns for FSTD if format is extended
		if i == 20 && isExtended {
			pdf.Rect(x, y-1, w3[0], 4, "FD")
			pdf.MultiCell(w3[0], 2, "Date", "", "C", false)
			x += w3[0]
			pdf.SetXY(x, y)
		}
		if header3[i] != "" {
			pdf.Rect(x, y-1, width, 4, "FD")
			pdf.MultiCell(width, 2, header3[i], "", "C", false)
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

func printA5TotalA(totalName string, total models.FlightRecord) {
	setFontLogbookFooter()

	pdf.SetX(leftMargin)

	printFooterLeftBlock(totalName)
	printFooterCell(w4[1], totalName)
	printFooterCell(w4[2], formatTimeField(total.Time.SE))
	printFooterCell(w4[3], formatTimeField(total.Time.ME))
	printFooterCell(w4[4], formatTimeField(total.Time.MCC))
	printFooterCell(w4[5], formatTimeField(total.Time.Total))
	printFooterCell(w4[6], "")
	printFooterCell(w4[7], fmt.Sprintf("%d", total.Landings.Day))
	printFooterCell(w4[8], fmt.Sprintf("%d", total.Landings.Night))

	pdf.Ln(-1)
}

// printA5LogbookFooterA prints footer on the "left page"
func printA5LogbookFooterA() {
	printA5TotalA("TOTAL THIS PAGE", totalPage)
	printA5TotalA("TOTAL FROM PREVIOUS PAGES", totalPrevious)
	printA5TotalA("TOTAL TIME", totalTime)
}

func printA5TotalB(totalName string, total models.FlightRecord) {
	setFontLogbookFooter()

	pdf.SetX(leftMarginB)

	printFooterCell(w4[9], formatTimeField(total.Time.Night))
	printFooterCell(w4[10], formatTimeField(total.Time.IFR))
	printFooterCell(w4[11], formatTimeField(total.Time.PIC))
	printFooterCell(w4[12], formatTimeField(total.Time.CoPilot))
	printFooterCell(w4[13], formatTimeField(total.Time.Dual))
	printFooterCell(w4[14], formatTimeField(total.Time.Instructor))
	printFooterCell(w4[15], "")
	printFooterCell(w4[16], formatTimeField(total.SIM.Time))
	printFooterSignatureBlock(totalName)

	pdf.Ln(-1)
}

// printA5LogbookFooterA prints footer on the "left page"
func printA5LogbookFooterB() {
	printA5TotalB("TOTAL THIS PAGE", totalPage)
	printA5TotalB("TOTAL FROM PREVIOUS PAGES", totalPrevious)
	printA5TotalB("TOTAL TIME", totalTime)
}

// printA5LogbookBodyA forms and prints the logbook row on the "left page"
func printA5LogbookBodyA(record models.FlightRecord, fill bool) {
	setFontLogbookBody()

	// 	Data
	pdf.SetX(leftMargin)
	if isExtended && record.SIM.Type != "" {
		printBodyTimeCell(w3[0], "", fill)
	} else {
		printBodyTimeCell(w3[0], record.Date, fill)
	}
	printBodyTimeCell(w3[1], record.Departure.Place, fill)
	printBodyTimeCell(w3[2], record.Departure.Time, fill)
	printBodyTimeCell(w3[3], record.Arrival.Place, fill)
	printBodyTimeCell(w3[4], record.Arrival.Time, fill)
	printBodyTimeCell(w3[5], record.Aircraft.Model, fill)
	printBodyTimeCell(w3[6], record.Aircraft.Reg, fill)
	printSinglePilotTime(w3[7], formatTimeField(record.Time.SE), fill)
	printSinglePilotTime(w3[8], formatTimeField(record.Time.ME), fill)
	printBodyTimeCell(w3[9], formatTimeField(record.Time.MCC), fill)
	printBodyTimeCell(w3[10], formatTimeField(record.Time.Total), fill)
	printBodyTextCell(w3[11], record.PIC, fill)
	printBodyTimeCell(w3[12], formatLandings(record.Landings.Day), fill)
	printBodyTimeCell(w3[12], formatLandings(record.Landings.Night), fill)

	pdf.Ln(-1)

	pdf.SetX(leftMargin)
}

// printA5LogbookBodyB forms and prints the logbook row on the "right page"
func printA5LogbookBodyB(record models.FlightRecord, fill bool) {

	setFontLogbookBody()

	// 	Data
	pdf.SetX(leftMarginB)
	printBodyTimeCell(w3[14], formatTimeField(record.Time.Night), fill)
	printBodyTimeCell(w3[15], formatTimeField(record.Time.IFR), fill)
	printBodyTimeCell(w3[16], formatTimeField(record.Time.PIC), fill)
	printBodyTimeCell(w3[17], formatTimeField(record.Time.CoPilot), fill)
	printBodyTimeCell(w3[18], formatTimeField(record.Time.Dual), fill)
	printBodyTimeCell(w3[19], formatTimeField(record.Time.Instructor), fill)
	if isExtended {
		if record.SIM.Type != "" {
			printBodyTimeCell(w3[0], record.Date, fill)
		} else {
			printBodyTimeCell(w3[0], "", fill)
		}
	}
	printBodyTimeCell(w3[20], record.SIM.Type, fill)
	printBodyTimeCell(w3[21], formatTimeField(record.SIM.Time), fill)
	printBodyRemarksCell(w3[22], record.Remarks, fill)

	pdf.Ln(-1)

	pdf.SetX(leftMargin)
}

// titlePageA5 print title page for A5
func titlePageA5() {
	pdf.AddPage()
	pdf.SetFont(fontBold, "", 20)
	pdf.SetXY(55, 60)
	pdf.MultiCell(100, 2, "PILOT LOGBOOK", "", "C", false)

	pdf.SetFont(fontRegular, "", 15)
	pdf.SetXY(25, 100)
	pdf.MultiCell(160, 2, "HOLDER'S NAME: "+strings.ToUpper(ownerName), "", "C", false)

	if licenseNumber != "" {
		pdf.SetXY(25, 107)
		pdf.MultiCell(160, 2, "LICENSE NUMBER: "+strings.ToUpper(licenseNumber), "", "C", false)
	}
	if address != "" {
		pdf.SetXY(25, 114)
		pdf.MultiCell(160, 2, "ADDRESS: "+strings.ToUpper(address), "", "C", false)
	}
}

// logBookRowA prints logbook record row for the left page
func logBookRowA(record models.FlightRecord, rowCounter *int, pageCounter *int) bool {
	*rowCounter += 1

	if record.Time.MCC != "" {
		record.Time.ME = ""
	}

	totalPage = models.CalculateTotals(totalPage, record)
	totalTime = models.CalculateTotals(totalTime, record)

	printA5LogbookBodyA(record, isFillLine(*rowCounter, fillRow))

	if *rowCounter >= logbookRows {
		*rowCounter = 0

		return true
	}

	return false
}

// logBookRowV prints logbook record row for the right page
func logBookRowB(record models.FlightRecord, rowCounter *int) {
	*rowCounter += 1

	printA5LogbookBodyB(record, isFillLine(*rowCounter, fillRow))

	if *rowCounter >= logbookRows {
		*rowCounter = 0
	}
}

// exportA5 creates A5 pdf with logbook in EASA format
func exportA5(flightRecords []models.FlightRecord, w io.Writer) error {
	// start forming the pdf file
	pdf = fpdf.New("L", "mm", "A5", "")
	pdf.SetAutoPageBreak(false, 5)
	loadFonts()
	loadSignature()

	pdf.SetLineWidth(.2)

	rowCounter := 0
	pageCounter := 1

	var totalEmpty models.FlightRecord

	titlePageA5()

	pdf.AddPage()
	printA5LogbookHeaderA()

	for i := len(flightRecords) - 1; i >= 0; i-- {
		pageSplit := logBookRowA(flightRecords[i], &rowCounter, &pageCounter)

		if pageSplit {
			// page A closed
			printA5LogbookFooterA()
			printPageNumber(pageCounter)

			// let's print page B
			pdf.AddPage()
			printA5LogbookHeaderB()

			for y := i + logbookRows - 1; y >= i; y-- {
				logBookRowB(flightRecords[y], &rowCounter)
			}

			// end of page B
			printA5LogbookFooterB()
			totalPrevious = totalTime
			totalPage = totalEmpty

			// check for the page breakes to separate logbooks
			checkPageBreaks(&pageCounter, titlePageA5)
			pageCounter += 1

			if i != 0 {
				pdf.AddPage()
				printA5LogbookHeaderA()
			}
		}
	}

	// check the last pages for the proper format
	var emptyRecord models.FlightRecord
	if rowCounter != 0 {
		for i := rowCounter + 1; i <= logbookRows; i++ {
			printA5LogbookBodyA(emptyRecord, isFillLine(i, fillRow))
		}
		printA5LogbookFooterA()
		printPageNumber(pageCounter)

		// page B
		pdf.AddPage()
		printA5LogbookHeaderB()
		rowCounter = 0

		for i := len(flightRecords)%logbookRows - 1; i >= 0; i-- {
			logBookRowB(flightRecords[i], &rowCounter)
		}
		for i := len(flightRecords) % logbookRows; i < logbookRows; i++ {
			rowCounter++
			printA5LogbookBodyB(emptyRecord, isFillLine(rowCounter, fillRow))
		}
		printA5LogbookFooterB()
	}

	err := pdf.Output(w)

	return err
}
