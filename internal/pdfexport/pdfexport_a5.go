package pdfexport

import (
	"fmt"
	"io"

	"github.com/vsimakhin/web-logbook/internal/models"
)

// this file contains the A5 format specific functions

// Constants for the A5 format to split the headers between two pages
const (
	header1_div int = 8
	header2_div int = 9
	header3_div int = 14
)

// ExportA5 creates A5 pdf with logbook in EASA format
func (p *PDFExporter) ExportA5(flightRecords []models.FlightRecord, w io.Writer) error {
	err := p.initPDF()
	if err != nil {
		return err
	}

	p.rowCounter = 0
	p.pageCounter = 1

	p.titlePage()

	p.pdf.AddPage()
	p.printA5LogbookHeaderA()

	for i := len(flightRecords) - 1; i >= 0; i-- {
		pageSplit := p.logBookRowA(flightRecords[i])

		if pageSplit {
			// page A closed
			p.printA5LogbookFooterA()
			p.printPageNumber()

			// let's print page B
			p.pdf.AddPage()
			p.printA5LogbookHeaderB()

			for y := i + p.Export.LogbookRows - 1; y >= i; y-- {
				p.logBookRowB(flightRecords[y])
			}

			// end of page B
			p.printA5LogbookFooterB()
			p.totalPrevious = p.totalTime
			p.totalPage = EmptyTotals()

			// check for the page breakes to separate logbooks
			p.checkPageBreaks()
			p.pageCounter += 1

			if i != 0 {
				p.pdf.AddPage()
				p.printA5LogbookHeaderA()
			}
		}
	}

	// check the last pages for the proper format
	if p.rowCounter != 0 {
		for i := p.rowCounter + 1; i <= p.Export.LogbookRows; i++ {
			p.rowCounter += 1
			p.printA5LogbookBodyA(EmptyTotals(), p.isFillLine())
		}
		p.printA5LogbookFooterA()
		p.printPageNumber()

		// page B
		p.pdf.AddPage()
		p.printA5LogbookHeaderB()
		p.rowCounter = 0

		for i := len(flightRecords)%p.Export.LogbookRows - 1; i >= 0; i-- {
			p.logBookRowB(flightRecords[i])
		}
		for i := len(flightRecords) % p.Export.LogbookRows; i < p.Export.LogbookRows; i++ {
			p.rowCounter++
			p.printA5LogbookBodyB(EmptyTotals(), p.isFillLine())
		}
		p.printA5LogbookFooterB()
	}

	err = p.pdf.Output(w)

	return err
}

// printA5LogbookHeaderA prints the logbook header for the left page
func (p *PDFExporter) printA5LogbookHeaderA() {

	p.setFontLogbookHeader()

	// First header
	p.pdf.SetXY(p.Export.LeftMarginA, p.Export.TopMargin)

	x, y := p.pdf.GetXY()
	for i := 0; i < header1_div; i++ {
		width := p.columns.w1[i]
		p.pdf.Rect(x, y-1, width, 5, "FD")
		p.pdf.MultiCell(width, 1, p.headers.header1[i], "", "C", false)
		x += width
		p.pdf.SetXY(x, y)
	}
	p.pdf.Ln(-1)

	// Second header
	p.pdf.SetXY(p.Export.LeftMarginA, p.Export.TopMargin+3)
	x, y = p.pdf.GetXY()
	for i := 0; i < header2_div; i++ {
		width := p.columns.w2[i]
		p.pdf.Rect(x, y-1, width, 12, "FD")
		p.pdf.MultiCell(width, 3, p.headers.header2[i], "", "C", false)
		x += width
		p.pdf.SetXY(x, y)
	}
	p.pdf.Ln(-1)

	// Header inside header
	p.pdf.SetXY(p.Export.LeftMarginA, p.Export.TopMargin+11)
	x, y = p.pdf.GetXY()
	for i := 0; i < header3_div; i++ {
		width := p.columns.w3[i]
		if p.headers.header3[i] != "" {
			p.pdf.Rect(x, y-1, width, 4, "FD")
			p.pdf.MultiCell(width, 2, p.headers.header3[i], "", "C", false)
		}
		x += width
		p.pdf.SetXY(x, y)
	}
	p.pdf.Ln(-1)

	// Align the logbook body
	_, y = p.pdf.GetXY()
	y += 1
	p.pdf.SetY(y)
}

// printA5LogbookHeaderB prints the logbook header for the right page
func (p *PDFExporter) printA5LogbookHeaderB() {

	p.setFontLogbookHeader()

	// First header
	p.pdf.SetXY(p.Export.LeftMarginB, p.Export.TopMargin)
	x, y := p.pdf.GetXY()
	for i := header1_div; i < len(p.headers.header1); i++ {
		width := p.columns.w1[i]
		p.pdf.Rect(x, y-1, width, 5, "FD")
		p.pdf.MultiCell(width, 1, p.headers.header1[i], "", "C", false)
		x += width
		p.pdf.SetXY(x, y)
	}
	p.pdf.Ln(-1)

	// Second header
	p.pdf.SetXY(p.Export.LeftMarginB, p.Export.TopMargin+3)
	x, y = p.pdf.GetXY()
	for i := header2_div; i < len(p.headers.header2); i++ {
		width := p.columns.w2[i]
		p.pdf.Rect(x, y-1, width, 12, "FD")
		p.pdf.MultiCell(width, 3, p.headers.header2[i], "", "C", false)
		x += width
		p.pdf.SetXY(x, y)
	}
	p.pdf.Ln(-1)

	// Header inside header
	p.pdf.SetXY(p.Export.LeftMarginB, p.Export.TopMargin+11)
	x, y = p.pdf.GetXY()
	for i := header3_div; i < len(p.headers.header3); i++ {
		width := p.columns.w3[i]
		// add Date columns for FSTD if format is extended
		if i == 20 && p.Export.IsExtended {
			p.pdf.Rect(x, y-1, p.columns.w3[0], 4, "FD")
			p.pdf.MultiCell(p.columns.w3[0], 2, "Date", "", "C", false)
			x += p.columns.w3[0]
			p.pdf.SetXY(x, y)
		}
		if p.headers.header3[i] != "" {
			p.pdf.Rect(x, y-1, width, 4, "FD")
			p.pdf.MultiCell(width, 2, p.headers.header3[i], "", "C", false)
		}

		x += width
		p.pdf.SetXY(x, y)
	}
	p.pdf.Ln(-1)

	// Align the logbook body
	_, y = p.pdf.GetXY()
	y += 1
	p.pdf.SetY(y)
}

// printA5LogbookFooterA prints the logbook footer for the left page
func (p *PDFExporter) printA5LogbookFooterA() {
	p.printA5TotalA(FooterThisPage, p.totalPage)
	p.printA5TotalA(FooterPreviousPage, p.totalPrevious)
	p.printA5TotalA(FooterTotalTime, p.totalTime)
}

// printA5LogbookFooterB prints the logbook footer for the right page
func (p *PDFExporter) printA5LogbookFooterB() {
	p.printA5TotalB(FooterThisPage, p.totalPage)
	p.printA5TotalB(FooterPreviousPage, p.totalPrevious)
	p.printA5TotalB(FooterTotalTime, p.totalTime)
}

// printA5TotalA prints the totals for the left page
func (p *PDFExporter) printA5TotalA(totalName string, total models.FlightRecord) {
	p.setFontLogbookFooter()

	p.pdf.SetX(p.Export.LeftMarginA)

	p.printFooterLeftBlock(totalName)
	p.printFooterCell(p.columns.w4[1], totalName)
	p.printFooterCell(p.columns.w4[2], p.formatTimeField(total.Time.SE))
	p.printFooterCell(p.columns.w4[3], p.formatTimeField(total.Time.ME))
	p.printFooterCell(p.columns.w4[4], p.formatTimeField(total.Time.MCC))
	p.printFooterCell(p.columns.w4[5], p.formatTimeField(total.Time.Total))
	p.printFooterCell(p.columns.w4[6], "")
	p.printFooterCell(p.columns.w4[7], fmt.Sprintf("%d", total.Landings.Day))
	p.printFooterCell(p.columns.w4[8], fmt.Sprintf("%d", total.Landings.Night))

	p.pdf.Ln(-1)
}

// printA5TotalB prints the totals for the right page
func (p *PDFExporter) printA5TotalB(totalName string, total models.FlightRecord) {
	p.setFontLogbookFooter()

	p.pdf.SetX(p.Export.LeftMarginB)

	p.printFooterCell(p.columns.w4[9], p.formatTimeField(total.Time.Night))
	p.printFooterCell(p.columns.w4[10], p.formatTimeField(total.Time.IFR))
	p.printFooterCell(p.columns.w4[11], p.formatTimeField(total.Time.PIC))
	p.printFooterCell(p.columns.w4[12], p.formatTimeField(total.Time.CoPilot))
	p.printFooterCell(p.columns.w4[13], p.formatTimeField(total.Time.Dual))
	p.printFooterCell(p.columns.w4[14], p.formatTimeField(total.Time.Instructor))
	p.printFooterCell(p.columns.w4[15], "")
	p.printFooterCell(p.columns.w4[16], p.formatTimeField(total.SIM.Time))
	p.printFooterSignatureBlock(totalName)

	p.pdf.Ln(-1)
}

// logBookRowA prints logbook record row for the left page
func (p *PDFExporter) logBookRowA(record models.FlightRecord) bool {
	p.rowCounter += 1

	if record.Time.MCC != "" {
		record.Time.ME = ""
	}

	p.totalPage = models.CalculateTotals(p.totalPage, record)
	p.totalTime = models.CalculateTotals(p.totalTime, record)

	p.printA5LogbookBodyA(record, p.isFillLine())

	if p.rowCounter >= p.Export.LogbookRows {
		p.rowCounter = 0

		return true
	}

	return false
}

// logBookRowV prints logbook record row for the right page
func (p *PDFExporter) logBookRowB(record models.FlightRecord) {
	p.rowCounter += 1

	p.printA5LogbookBodyB(record, p.isFillLine())

	if p.rowCounter >= p.Export.LogbookRows {
		p.rowCounter = 0
	}
}

// printA5LogbookBodyA prints the logbook body for the left page
func (p *PDFExporter) printA5LogbookBodyA(record models.FlightRecord, fill bool) {
	p.setFontLogbookBody()

	// 	Data
	p.pdf.SetX(p.Export.LeftMarginA)
	if p.Export.IsExtended && record.SIM.Type != "" {
		p.printBodyTimeCell(p.columns.w3[0], "", fill)
	} else {
		p.printBodyTimeCell(p.columns.w3[0], record.Date, fill)
	}
	p.printBodyTimeCell(p.columns.w3[1], record.Departure.Place, fill)
	p.printBodyTimeCell(p.columns.w3[2], record.Departure.Time, fill)
	p.printBodyTimeCell(p.columns.w3[3], record.Arrival.Place, fill)
	p.printBodyTimeCell(p.columns.w3[4], record.Arrival.Time, fill)
	p.printBodyTimeCell(p.columns.w3[5], record.Aircraft.Model, fill)
	p.printBodyTimeCell(p.columns.w3[6], record.Aircraft.Reg, fill)
	p.printSinglePilotTime(p.columns.w3[7], p.formatTimeField(record.Time.SE), fill)
	p.printSinglePilotTime(p.columns.w3[8], p.formatTimeField(record.Time.ME), fill)
	p.printBodyTimeCell(p.columns.w3[9], p.formatTimeField(record.Time.MCC), fill)
	p.printBodyTimeCell(p.columns.w3[10], p.formatTimeField(record.Time.Total), fill)
	p.printBodyTextCell(p.columns.w3[11], record.PIC, fill)
	p.printBodyTimeCell(p.columns.w3[12], formatLandings(record.Landings.Day), fill)
	p.printBodyTimeCell(p.columns.w3[12], formatLandings(record.Landings.Night), fill)

	p.pdf.Ln(-1)

	p.pdf.SetX(p.Export.LeftMarginA)
}

// printA5LogbookBodyB prints the logbook body for the right page
func (p *PDFExporter) printA5LogbookBodyB(record models.FlightRecord, fill bool) {

	p.setFontLogbookBody()

	p.pdf.SetX(p.Export.LeftMarginB)
	p.printBodyTimeCell(p.columns.w3[14], p.formatTimeField(record.Time.Night), fill)
	p.printBodyTimeCell(p.columns.w3[15], p.formatTimeField(record.Time.IFR), fill)
	p.printBodyTimeCell(p.columns.w3[16], p.formatTimeField(record.Time.PIC), fill)
	p.printBodyTimeCell(p.columns.w3[17], p.formatTimeField(record.Time.CoPilot), fill)
	p.printBodyTimeCell(p.columns.w3[18], p.formatTimeField(record.Time.Dual), fill)
	p.printBodyTimeCell(p.columns.w3[19], p.formatTimeField(record.Time.Instructor), fill)
	if p.Export.IsExtended {
		if record.SIM.Type != "" {
			p.printBodyTimeCell(p.columns.w3[0], record.Date, fill)
		} else {
			p.printBodyTimeCell(p.columns.w3[0], "", fill)
		}
	}
	p.printBodyTimeCell(p.columns.w3[20], record.SIM.Type, fill)
	p.printBodyTimeCell(p.columns.w3[21], p.formatTimeField(record.SIM.Time), fill)
	p.printBodyRemarksCell(p.columns.w3[22], record.Remarks, record.Signature, record.UUID, fill)

	p.pdf.Ln(-1)

	p.pdf.SetX(p.Export.LeftMarginA)
}
