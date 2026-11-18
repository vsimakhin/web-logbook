package pdfexport

import (
	"io"

	"github.com/vsimakhin/web-logbook/internal/models"
)

// this file contains the A5 format specific functions

// closeSpread pads and closes page A, prints page B for the spread, and rolls the totals over
func (p *PDFExporter) closeSpread(spread []models.FlightRecord) {
	// finish page A
	for p.rowCounter < p.Export.LogbookRows {
		p.rowCounter++
		p.loadRowCustomFields(EmptyTotals())
		p.printA5LogbookBodyA(EmptyTotals(), p.isFillLine())
	}
	p.printA5LogbookFooterA()
	p.printPageNumber()

	// page B
	p.pdf.AddPage()
	p.printA5LogbookHeaderB()
	p.rowCounter = 0

	for _, r := range spread {
		p.logBookRowB(r)
	}
	for p.rowCounter < p.Export.LogbookRows {
		p.rowCounter++
		p.loadRowCustomFields(EmptyTotals())
		p.printA5LogbookBodyB(EmptyTotals(), p.isFillLine())
	}
	p.printA5LogbookFooterB()

	// roll totals forward
	p.totalPrevious = p.totalTime
	p.totalPage = EmptyTotals()
	for uuid, v := range p.customTotalTime {
		p.customTotalPrevious[uuid] = v
	}
	for uuid := range p.customTotalPage {
		p.customTotalPage[uuid] = 0
	}

	p.checkPageBreaks()
	p.pageCounter++
	p.rowCounter = 0
}

// ExportA5 creates A5 pdf with logbook in EASA format
func (p *PDFExporter) ExportA5(flightRecords []models.FlightRecord, w io.Writer) error {
	err := p.initPDF()
	if err != nil {
		return err
	}
	p.buildLayout()

	p.rowCounter = 0
	p.pageCounter = 1

	p.titlePage()

	var spread []models.FlightRecord // records of the current A+B spread

	for i := len(flightRecords) - 1; i >= 0; i-- {
		record := flightRecords[i]

		if record.Time.MCC != 0 {
			record.Time.ME = 0
		}

		// forced page break: close the current spread, the record starts a new one
		if record.NewPDFPage && len(spread) > 0 {
			p.closeSpread(spread)
			spread = spread[:0]
		}

		// first record of a spread: start page A
		if len(spread) == 0 {
			p.pdf.AddPage()
			p.printA5LogbookHeaderA()
		}

		p.logBookRowA(record)
		spread = append(spread, record)

		if len(spread) >= p.Export.LogbookRows {
			p.closeSpread(spread)
			spread = spread[:0]
		}
	}

	// last, partially filled spread
	if len(spread) > 0 {
		p.closeSpread(spread)
	}

	return p.pdf.Output(w)
}

// printA5LogbookHeaderA prints the logbook header for the left page
func (p *PDFExporter) printA5LogbookHeaderA() {
	pageA, _ := p.splitLayoutAtDivider()
	p.printA5Header(pageA, p.Export.LeftMarginA, 0)
}

// printA5LogbookHeaderB prints the logbook header for the right page
func (p *PDFExporter) printA5LogbookHeaderB() {
	pageA, pageB := p.splitLayoutAtDivider()

	// continue numbering after the last number used on page A
	offset := len(p.numberGroupWidths(headerGroupsFor(pageA)))
	p.printA5Header(pageB, p.Export.LeftMarginB, offset)
}

// printA5Header prints the 3-row logbook header for a given column slice and left margin.
func (p *PDFExporter) printA5Header(cols []pdfColumn, leftMargin float64, numberOffset int) {
	p.setFontLogbookHeader()
	groups := headerGroupsFor(cols)
	top := p.Export.TopMargin

	// row 1: numbers (SPT + MCC share one number)
	x := leftMargin
	for i, w := range p.numberGroupWidths(groups) {
		p.pdf.Rect(x, top-1, w, 5, "FD")
		p.pdf.SetXY(x, top)
		p.pdf.MultiCell(w, 1, intToStr(numberOffset+i+1), "", "C", false)
		x += w
	}

	// row 2: category (or standalone column label)
	x = leftMargin
	for _, g := range groups {
		p.pdf.Rect(x, top+2, g.width, 12, "FD")
		p.pdf.SetXY(x, top+3)
		p.pdf.MultiCell(g.width, 3, g.label, "", "C", false)
		x += g.width
	}

	// row 3: sub-headers, only for grouped columns
	x = leftMargin
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

	_, y := p.pdf.GetXY()
	p.pdf.SetY(y + 1)
}

// printA5LogbookFooterA prints the logbook footer for the left page
func (p *PDFExporter) printA5LogbookFooterA() {
	p.printA5TotalA(FooterThisPage)
	p.printA5TotalA(FooterPreviousPage)
	p.printA5TotalA(FooterTotalTime)
}

// printA5LogbookFooterB prints the logbook footer for the right page
func (p *PDFExporter) printA5LogbookFooterB() {
	p.printA5TotalB(FooterThisPage)
	p.printA5TotalB(FooterPreviousPage)
	p.printA5TotalB(FooterTotalTime)
}

// printA5TotalA prints one footer row for the left page (page A columns).
func (p *PDFExporter) printA5TotalA(totalName string) {
	p.currentFooterRow = totalName
	p.setFontLogbookFooter()

	pageA, _ := p.splitLayoutAtDivider()
	p.printA5TotalRow(totalName, pageA, p.Export.LeftMarginA)
}

// printA5TotalB prints one footer row for the right page (page B columns).
func (p *PDFExporter) printA5TotalB(totalName string) {
	p.currentFooterRow = totalName
	p.setFontLogbookFooter()

	_, pageB := p.splitLayoutAtDivider()
	p.printA5TotalRow(totalName, pageB, p.Export.LeftMarginB)
}

// printA5TotalRow renders one footer row for the given column slice, starting at leftMargin.
func (p *PDFExporter) printA5TotalRow(totalName string, cols []pdfColumn, leftMargin float64) {
	p.pdf.SetX(leftMargin)

	// pick the right FlightRecord accumulator for standard totals
	var total models.FlightRecord
	switch totalName {
	case FooterThisPage:
		total = p.totalPage
	case FooterPreviousPage:
		total = p.totalPrevious
	default:
		total = p.totalTime
	}

	sum := func(cs []pdfColumn) (w float64) {
		for _, c := range cs {
			w += c.Width
		}
		return
	}

	// leading columns without totals form the label area
	lead := 0
	for lead < len(cols) && cols[lead].total == nil && cols[lead].Field != "remarks" {
		lead++
	}
	leftN := footerLeftBlockCols(lead)

	p.printFooterLeftBlock(totalName, sum(cols[:leftN]))
	p.printFooterCell(sum(cols[leftN:lead]), totalName)
	p.printFooterColumns(totalName, cols[lead:], total)

	p.pdf.Ln(-1)
}

// logBookRowA prints a logbook record row for the left page and returns true when the page is full.
func (p *PDFExporter) logBookRowA(record models.FlightRecord) {
	p.rowCounter += 1

	p.totalPage = models.CalculateTotals(p.totalPage, record)
	p.totalTime = models.CalculateTotals(p.totalTime, record)

	p.loadRowCustomFields(record)
	p.accumulateCustomTotals()

	p.printA5LogbookBodyA(record, p.isFillLine())
}

// logBookRowB prints a logbook record row for the right page.
func (p *PDFExporter) logBookRowB(record models.FlightRecord) {
	p.rowCounter += 1
	p.loadRowCustomFields(record)
	p.printA5LogbookBodyB(record, p.isFillLine())
}

// printA5LogbookBodyA prints the logbook body row for the left page
func (p *PDFExporter) printA5LogbookBodyA(record models.FlightRecord, fill bool) {
	p.setFontLogbookBody()
	p.pdf.SetX(p.Export.LeftMarginA)

	pageA, _ := p.splitLayoutAtDivider()
	p.printA5BodyRow(record, fill, pageA)
}

// printA5LogbookBodyB prints the logbook body row for the right page
func (p *PDFExporter) printA5LogbookBodyB(record models.FlightRecord, fill bool) {
	p.setFontLogbookBody()
	p.pdf.SetX(p.Export.LeftMarginB)

	_, pageB := p.splitLayoutAtDivider()
	p.printA5BodyRow(record, fill, pageB)
}

// printA5BodyRow iterates the given column slice and renders one body row.
func (p *PDFExporter) printA5BodyRow(record models.FlightRecord, fill bool, cols []pdfColumn) {
	for i := range cols {
		c := &cols[i]

		value := ""
		if c.body != nil {
			value = c.body(p, &record)
		}
		if c.Field == "date" {
			value = formatDate(value, p.Export.DateFieldsFormat)
		}

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
	p.pdf.SetX(p.Export.LeftMarginA)
}

// intToStr converts an integer to its string representation (avoids import of strconv in this file).
func intToStr(n int) string {
	if n == 0 {
		return "0"
	}
	buf := [20]byte{}
	pos := len(buf)
	for n > 0 {
		pos--
		buf[pos] = byte('0' + n%10)
		n /= 10
	}
	return string(buf[pos:])
}
