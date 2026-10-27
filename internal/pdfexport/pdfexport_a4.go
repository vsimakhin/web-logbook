package pdfexport

import (
	"io"
	"strconv"

	"github.com/vsimakhin/web-logbook/internal/models"
)

// this file contains the A4 format specific functions

// exportA4 creates A4 pdf with logbook in EASA format
func (p *PDFExporter) ExportA4(flightRecords []models.FlightRecord, w io.Writer) error {
	err := p.initPDF()
	if err != nil {
		return err
	}
	p.buildLayout()

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

	groups := p.headerGroups()
	left, top := p.Export.LeftMargin, p.Export.TopMargin

	// row 1: numbers, one per group
	x := left
	for i, g := range groups {
		p.pdf.Rect(x, top-1, g.width, 5, "FD")
		p.pdf.SetXY(x, top)
		p.pdf.MultiCell(g.width, 1, strconv.Itoa(i+1), "", "C", false)
		x += g.width
	}

	// row 2: category (or the column label for standalone columns)
	x = left
	for _, g := range groups {
		p.pdf.Rect(x, top+2, g.width, 12, "FD")
		p.pdf.SetXY(x, top+3)
		p.pdf.MultiCell(g.width, 3, g.label, "", "C", false)
		x += g.width
	}

	// row 3: sub-headers, only for grouped columns
	x = left
	for _, g := range groups {
		if !g.grouped {
			x += g.width
			continue
		}
		for _, c := range g.cols {
			p.pdf.Rect(x, top+10, c.Width, 4, "FD")
			p.pdf.SetXY(x, top+11)
			p.pdf.MultiCell(c.Width, 2, c.Label, "", "C", false)
			x += c.Width
		}
	}

	p.pdf.SetY(top + 14)
}

// logBookRow prints the logbook row
func (p *PDFExporter) logBookRow(record models.FlightRecord) {
	p.rowCounter += 1

	if record.Time.MCC != 0 {
		record.Time.ME = 0
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
	p.setFontLogbookBody()
	p.loadRowCustomFields(record)

	p.pdf.SetX(p.Export.LeftMargin)
	for i := range p.layout {
		c := &p.layout[i]
		value := c.body(p, &record)

		switch {
		case c.Field == "remarks":
			p.printBodyRemarksCell(c.Width, record.Remarks, record.Signature, record.UUID, fill)
		case c.singlePilot:
			p.printSinglePilotTime(c.Width, value, fill)
		case c.align == "L":
			p.printBodyTextCell(c.Width, value, fill)
		default:
			p.printBodyTimeCell(c.Width, value, fill)
		}
	}

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

	sum := func(cols []pdfColumn) (w float64) {
		for _, c := range cols {
			w += c.Width
		}
		return
	}

	// leading columns without totals form the "TOTAL THIS PAGE" label area
	lead := 0
	for lead < len(p.layout) && p.layout[lead].total == nil && p.layout[lead].Field != "remarks" {
		lead++
	}
	leftN := 0
	if lead >= 2 {
		leftN = 1 // first column is the empty left block
	}

	p.printFooterLeftBlock(totalName, sum(p.layout[:leftN]))
	p.printFooterCell(sum(p.layout[leftN:lead]), totalName)

	for _, c := range p.layout[lead:] {
		switch {
		case c.Field == "remarks":
			p.printFooterSignatureBlock(totalName, c.Width)
		case c.total != nil:
			p.printFooterCell(c.Width, c.total(p, &total))
		default:
			p.printFooterCell(c.Width, "")
		}
	}

	p.pdf.Ln(-1)
}
