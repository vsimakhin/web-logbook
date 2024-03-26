package pdfexport

import (
	"fmt"
	"io"

	"github.com/vsimakhin/web-logbook/internal/models"
)

// this file contains the A4 format specific functions

// exportA4 creates A4 pdf with logbook in EASA format
func (p *PDFExporter) ExportA4(flightRecords []models.FlightRecord, w io.Writer) error {
	err := p.initPDF()
	if err != nil {
		return err
	}

	p.rowCounter = 0
	p.pageCounter = 1

	p.titlePage()
	p.printA4LogbookHeader()

	for i := len(flightRecords) - 1; i >= 0; i-- {
		p.logBookRow(flightRecords[i])
	}

	// check the last page for the proper format
	for i := p.rowCounter + 1; i <= p.Export.LogbookRows; i++ {
		p.rowCounter += 1
		p.printA4LogbookBody(EmptyTotals())
	}

	p.printA4LogbookFooter()
	p.printPageNumber()

	err = p.pdf.Output(w)

	return err
}

// printA4LogbookHeader prints the logbook header
func (p *PDFExporter) printA4LogbookHeader() {
	p.pdf.AddPage()
	p.setFontLogbookHeader()

	// First header
	p.pdf.SetXY(p.Export.LeftMargin, p.Export.TopMargin)
	x, y := p.pdf.GetXY()
	for i, str := range p.headers.header1 {
		width := p.columns.w1[i]
		p.pdf.Rect(x, y-1, width, 5, "FD")
		p.pdf.MultiCell(width, 1, str, "", "C", false)
		x += width
		p.pdf.SetXY(x, y)
	}
	p.pdf.Ln(-1)

	// Second header
	p.pdf.SetXY(p.Export.LeftMargin, p.Export.TopMargin+3)
	x, y = p.pdf.GetXY()
	for i, str := range p.headers.header2 {
		width := p.columns.w2[i]
		p.pdf.Rect(x, y-1, width, 12, "FD")
		p.pdf.MultiCell(width, 3, str, "", "C", false)
		x += width
		p.pdf.SetXY(x, y)
	}
	p.pdf.Ln(-1)

	// Header inside header
	p.pdf.SetXY(p.Export.LeftMargin, p.Export.TopMargin+11)
	x, y = p.pdf.GetXY()
	for i, str := range p.headers.header3 {
		width := p.columns.w3[i]
		// add Date columns for FSTD if format is extended
		if i == 20 && p.Export.IsExtended {
			p.pdf.Rect(x, y-1, p.columns.w3[0], 4, "FD")
			p.pdf.MultiCell(p.columns.w3[0], 2, "Date", "", "C", false)
			x += p.columns.w3[0]
			p.pdf.SetXY(x, y)
		}
		if str != "" {
			p.pdf.Rect(x, y-1, width, 4, "FD")
			p.pdf.MultiCell(width, 2, str, "", "C", false)
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

// logBookRow prints the logbook row
func (p *PDFExporter) logBookRow(record models.FlightRecord) {
	p.rowCounter += 1

	if record.Time.MCC != "" {
		record.Time.ME = ""
	}

	p.totalPage = models.CalculateTotals(p.totalPage, record)
	p.totalTime = models.CalculateTotals(p.totalTime, record)

	p.printA4LogbookBody(record)

	if p.rowCounter >= p.Export.LogbookRows {
		p.printA4LogbookFooter()
		p.printPageNumber()

		p.totalPrevious = p.totalTime
		p.totalPage = EmptyTotals()

		// check for the page breakes to separate logbooks
		p.checkPageBreaks()

		p.rowCounter = 0
		p.pageCounter += 1

		p.printA4LogbookHeader()
	}
}

// printA4LogbookBody prints the logbook body
func (p *PDFExporter) printA4LogbookBody(record models.FlightRecord) {
	fill := p.isFillLine()
	w3 := p.columns.w3

	p.setFontLogbookBody()

	// 	Data
	p.pdf.SetX(p.Export.LeftMargin)
	if p.Export.IsExtended && record.SIM.Type != "" {
		p.printBodyTimeCell(w3[0], "", fill)
	} else {
		p.printBodyTimeCell(w3[0], record.Date, fill)
	}
	p.printBodyTimeCell(w3[1], record.Departure.Place, fill)
	p.printBodyTimeCell(w3[2], record.Departure.Time, fill)
	p.printBodyTimeCell(w3[3], record.Arrival.Place, fill)
	p.printBodyTimeCell(w3[4], record.Arrival.Time, fill)
	p.printBodyTimeCell(w3[5], record.Aircraft.Model, fill)
	p.printBodyTimeCell(w3[6], record.Aircraft.Reg, fill)
	p.printSinglePilotTime(w3[7], p.formatTimeField(record.Time.SE), fill)
	p.printSinglePilotTime(w3[8], p.formatTimeField(record.Time.ME), fill)
	p.printBodyTimeCell(w3[9], p.formatTimeField(record.Time.MCC), fill)
	p.printBodyTimeCell(w3[10], p.formatTimeField(record.Time.Total), fill)
	p.printBodyTextCell(w3[11], record.PIC, fill)
	p.printBodyTimeCell(w3[12], formatLandings(record.Landings.Day), fill)
	p.printBodyTimeCell(w3[12], formatLandings(record.Landings.Night), fill)
	p.printBodyTimeCell(w3[14], p.formatTimeField(record.Time.Night), fill)
	p.printBodyTimeCell(w3[15], p.formatTimeField(record.Time.IFR), fill)
	p.printBodyTimeCell(w3[16], p.formatTimeField(record.Time.PIC), fill)
	p.printBodyTimeCell(w3[17], p.formatTimeField(record.Time.CoPilot), fill)
	p.printBodyTimeCell(w3[18], p.formatTimeField(record.Time.Dual), fill)
	p.printBodyTimeCell(w3[19], p.formatTimeField(record.Time.Instructor), fill)
	if p.Export.IsExtended {
		if record.SIM.Type != "" {
			p.printBodyTimeCell(w3[0], record.Date, fill)
		} else {
			p.printBodyTimeCell(w3[0], "", fill)
		}
	}
	p.printBodyTimeCell(w3[20], record.SIM.Type, fill)
	p.printBodyTimeCell(w3[21], p.formatTimeField(record.SIM.Time), fill)
	p.printBodyRemarksCell(w3[22], record.Remarks, fill)

	p.pdf.Ln(-1)
	p.pdf.SetX(p.Export.LeftMargin)
}

// printA4LogbookFooter prints the logbook footer
func (p *PDFExporter) printA4LogbookFooter() {
	p.printA4Total(FooterThisPage, p.totalPage)
	p.printA4Total(FooterPreviousPage, p.totalPrevious)
	p.printA4Total(FooterTotalTime, p.totalTime)
}

// printA4Total prints the logbook total
func (p *PDFExporter) printA4Total(totalName string, total models.FlightRecord) {
	p.setFontLogbookFooter()

	p.pdf.SetX(p.Export.LeftMargin)

	p.printFooterLeftBlock(totalName)
	p.printFooterCell(p.columns.w4[1], totalName)
	p.printFooterCell(p.columns.w4[2], p.formatTimeField(total.Time.SE))
	p.printFooterCell(p.columns.w4[3], p.formatTimeField(total.Time.ME))
	p.printFooterCell(p.columns.w4[4], p.formatTimeField(total.Time.MCC))
	p.printFooterCell(p.columns.w4[5], p.formatTimeField(total.Time.Total))
	p.printFooterCell(p.columns.w4[6], "")
	p.printFooterCell(p.columns.w4[7], fmt.Sprintf("%d", total.Landings.Day))
	p.printFooterCell(p.columns.w4[8], fmt.Sprintf("%d", total.Landings.Night))
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
