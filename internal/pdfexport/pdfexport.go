package pdfexport

import (
	"bytes"
	"embed"
	"encoding/base64"
	"fmt"
	"io"
	"strings"

	"github.com/go-pdf/fpdf"
	"github.com/go-pdf/fpdf/contrib/gofpdi"
	"github.com/vsimakhin/web-logbook/internal/models"
)

// Constants for page formats
const (
	PDFA4 string = "A4"
	PDFA5 string = "A5"
)

// Constants for fonts
const (
	fontBold    string = "LiberationSansNarrow-Bold"
	fontRegular string = "LiberationSansNarrow-Regular"
	fontB612    string = "B612Mono-Regular"
)

// Constants for title page
const (
	Title   string = "PILOT LOGBOOK"
	Name    string = "HOLDER'S NAME:"
	License string = "LICENSE NUMBER:"
	Address string = "ADDRESS:"
)

// Contstants for footer
const (
	FooterThisPage     string = "TOTAL THIS PAGE"
	FooterPreviousPage string = "TOTAL FROM PREVIOUS PAGES"
	FooterTotalTime    string = "TOTAL TIME"
)

// colors
type Color struct{ r, g, b int }

func NewColor(r, g, b int) Color {
	return Color{r: r, g: g, b: b}
}

func EmptyTotals() models.FlightRecord {
	return models.FlightRecord{}
}

var HeaderBG = NewColor(217, 217, 217)
var HeaderText = NewColor(0, 0, 0)
var BodyFillBG = NewColor(228, 228, 228)
var BodyText = NewColor(0, 0, 0)

// Constants for font sizes
const (
	HeaderFontSize        float64 = 8
	BodyFontSize          float64 = 8
	SignatureFontSize     float64 = 6
	PageNumberFontSize    float64 = 6
	TitlePageMainFontSize float64 = 20
	TitlePageInfoFontSize float64 = 15
)

const CheckSymbol string = "✓"

//go:embed font/*
var content embed.FS

// Headers and columns for the logbook
type Headers struct {
	header1 []string
	header2 []string
	header3 []string
}

type ColumnWidths struct {
	w1 []float64
	w2 []float64
	w3 []float64
	w4 []float64
}

// PDFExporter is a struct for exporting logbook to PDF
type PDFExporter struct {
	Format string

	OwnerName      string
	LicenseNumber  string
	Address        string
	Signature      string
	SignatureImage string

	Export models.ExportPDF

	headers Headers
	columns ColumnWidths

	pageBreaks []string

	totalPage     models.FlightRecord
	totalPrevious models.FlightRecord
	totalTime     models.FlightRecord

	pdf *fpdf.Fpdf

	rowCounter      int
	pageCounter     int
	signatureBlockX float64
	signatureBlockY float64
}

// NewPDFExporter creates a new PDFExporter object
func NewPDFExporter(format, ownerName, licenseNumber, address,
	signature, signatureImage string, exportConfig models.ExportPDF) (*PDFExporter, error) {

	pdfExporter := &PDFExporter{
		Format: format,

		OwnerName:      ownerName,
		LicenseNumber:  licenseNumber,
		Address:        address,
		Signature:      signature,
		SignatureImage: signatureImage,

		Export: exportConfig,
	}

	err := pdfExporter.init()
	if err != nil {
		return nil, err
	}

	return pdfExporter, nil
}

// init initializes the PDFExporter object
func (p *PDFExporter) init() error {
	// check if we have a right format
	if p.Format != PDFA4 && p.Format != PDFA5 {
		return fmt.Errorf("wrong format %s", p.Format)
	}

	p.pageBreaks = strings.Split(p.Export.PageBreaks, ",")

	if !p.Export.IncludeSignature {
		p.SignatureImage = ""
	}

	p.initHeaders()
	p.initColumns()

	return nil
}

// initHeaders initializes headers for the logbook
func (p *PDFExporter) initHeaders() {
	h := p.Export.Headers

	p.headers = Headers{
		header1: []string{"1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"},

		header2: []string{
			h.Date, h.Departure, h.Arrival, h.Aircraft, h.SPT, h.MCC, h.Total,
			h.PICName, h.Landings, h.OCT, h.PFT, h.FSTD, h.Remarks,
		},
		header3: []string{
			"", h.DepPlace, h.DepTime, h.ArrPlace, h.ArrTime, h.Model, h.Reg,
			h.SE, h.ME, "", "", "", h.LandDay, h.LandNight, h.Night, h.IFR,
			h.PIC, h.COP, h.Dual, h.Instr, h.SimType, h.SimTime, "",
		},
	}
}

// initColumns initializes columns for the logbook
func (p *PDFExporter) initColumns() {
	c := p.Export.Columns

	p.columns = ColumnWidths{
		w1: []float64{
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
		},
		w2: []float64{
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
		},
		w3: []float64{
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
		},
		w4: []float64{
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
		},
	}
}

// initPDF initializes the PDF object
func (p *PDFExporter) initPDF() error {
	// init pdf object
	if p.Format == PDFA4 {
		p.pdf = fpdf.New("L", "mm", "A4", "")
	} else if p.Format == PDFA5 {
		p.pdf = fpdf.New("L", "mm", "A5", "")
	}

	// page configuration
	p.pdf.SetAutoPageBreak(true, 5)

	// load fonts
	err := p.loadFonts()
	if err != nil {
		return err
	}

	// try to load a signature
	err = p.loadSignature()
	if err != nil {
		// just print error message, we can continue without signature
		fmt.Println(err)
	}

	p.pdf.SetLineWidth(.2)

	return nil
}

// loadFonts loads fonts for the PDF
func (p *PDFExporter) loadFonts() error {
	fonts := []string{fontRegular, fontBold, fontB612}

	for _, font := range fonts {
		fontBytes, err := content.ReadFile(fmt.Sprintf("font/%s.ttf", font))
		if err != nil {
			return fmt.Errorf("failed to read font file: %v", err)
		}

		p.pdf.AddUTF8FontFromBytes(font, "", fontBytes)
	}

	return nil
}

// loadSignature register PNG image with signature in a pdf file
func (p *PDFExporter) loadSignature() error {
	if p.SignatureImage != "" {
		unbased, err := base64.StdEncoding.DecodeString(strings.ReplaceAll(p.SignatureImage, "data:image/png;base64,", ""))
		if err != nil {
			err = fmt.Errorf("error adding signature image to the pdf file - %s, continue without signature", err)
			p.SignatureImage = ""
			return err
		}

		r := bytes.NewReader(unbased)
		p.pdf.RegisterImageReader("signature", "png", r)
	}

	return nil
}

// titlePage prints title page
func (p *PDFExporter) titlePage() {

	type XY struct {
		x float64
		y float64
	}

	coord := map[string]map[string]XY{
		PDFA4: {
			Title:   {x: 95, y: 60},
			Name:    {x: 65, y: 150},
			License: {x: 65, y: 157},
			Address: {x: 65, y: 164},
		},
		PDFA5: {
			Title:   {x: 55, y: 60},
			Name:    {x: 25, y: 100},
			License: {x: 25, y: 107},
			Address: {x: 25, y: 114},
		},
	}

	if len(p.Export.CustomTitleBlob) != 0 {
		p.printCustomTitle()
		return
	}

	p.pdf.AddPage()
	p.pdf.SetFont(fontBold, "", TitlePageMainFontSize)
	p.pdf.SetXY(coord[p.Format][Title].x, coord[p.Format][Title].y)
	p.pdf.MultiCell(100, 2, Title, "", "C", false)

	p.pdf.SetFont(fontRegular, "", TitlePageInfoFontSize)

	info := map[string]string{
		Name:    fmt.Sprintf("%s %s", Name, strings.ToUpper(p.OwnerName)),
		License: fmt.Sprintf("%s %s", License, strings.ToUpper(p.LicenseNumber)),
		Address: fmt.Sprintf("%s %s", Address, strings.ToUpper(p.Address)),
	}

	for position, text := range info {
		if strings.TrimSpace(position) != strings.TrimSpace(text) {
			p.pdf.SetXY(coord[p.Format][position].x, coord[p.Format][position].y)
			p.pdf.MultiCell(160, 2, text, "", "C", false)
		}
	}
}

// printCustomTitle prints custom title page
func (p *PDFExporter) printCustomTitle() {
	// some variables and parameters
	sizes := map[string]fpdf.SizeType{
		PDFA4: {Wd: 210, Ht: 297},
		PDFA5: {Wd: 148, Ht: 210},
	}

	type pageParams struct{ x, y, w, h float64 }
	params := map[string]map[string]pageParams{
		PDFA4: {
			"P": {x: 0, y: 0, w: 210, h: 297},
			"L": {x: 0, y: -87, w: 297, h: 297},
		},
		PDFA5: {
			"P": {x: 0, y: 0, w: 148, h: 210},
			"L": {x: 0, y: -62, w: 210, h: 210},
		},
	}

	imp := gofpdi.NewImporter()

	readSeeker := io.ReadSeeker(bytes.NewReader(p.Export.CustomTitleBlob))

	// import first page and determine page sizes
	imp.ImportPageFromStream(p.pdf, &readSeeker, 1, "/MediaBox")
	pageSizes := imp.GetPageSizes()
	nrPages := len(imp.GetPageSizes())

	// add pages of the attached custom title pdf file
	for i := 1; i <= nrPages; i++ {
		tpl := imp.ImportPageFromStream(p.pdf, &readSeeker, i, "/MediaBox")

		orientation := "P"
		if pageSizes[i]["/MediaBox"]["w"] > pageSizes[i]["/MediaBox"]["h"] {
			orientation = "L"
		}

		p.pdf.AddPageFormat(orientation, sizes[p.Format])
		imp.UseImportedTemplate(p.pdf, tpl,
			params[p.Format][orientation].x, params[p.Format][orientation].y,
			params[p.Format][orientation].w, params[p.Format][orientation].h,
		)
	}
}

// isFillLine checks if the line should be filled
func (p *PDFExporter) isFillLine() bool {
	return p.rowCounter%p.Export.Fill == 0 // fill every "fill" row only
}

// setFontLogbookHeader sets font for logbook header
func (p *PDFExporter) setFontLogbookHeader() {
	p.pdf.SetFillColor(HeaderBG.r, HeaderBG.g, HeaderBG.b)
	p.pdf.SetTextColor(HeaderText.r, HeaderText.g, HeaderText.b)
	p.pdf.SetFont(fontBold, "", HeaderFontSize)
}

// setFontLogbookFooter sets font for logbook footer
func (p *PDFExporter) setFontLogbookFooter() {
	p.setFontLogbookHeader()
}

// setFontLogbookBody sets font for logbook rows
func (p *PDFExporter) setFontLogbookBody() {
	p.pdf.SetFillColor(BodyFillBG.r, BodyFillBG.g, BodyFillBG.b)
	p.pdf.SetTextColor(BodyText.r, BodyText.g, BodyText.b)
	p.pdf.SetFont(fontRegular, "", BodyFontSize)
}

// printBodyTimeCell prints time cell in the row of the logbook
func (p *PDFExporter) printBodyTimeCell(w float64, value string, fill bool) {
	p.pdf.CellFormat(w, p.Export.BodyRow, value, "1", 0, "C", fill, 0, "")
}

// printBodyTextCell prints text cell in the row of the logbook
func (p *PDFExporter) printBodyTextCell(w float64, value string, fill bool) {
	p.pdf.CellFormat(w, p.Export.BodyRow, value, "1", 0, "L", fill, 0, "")
}

// printFooterCell prints cell in the footer of the logbook
func (p *PDFExporter) printFooterCell(w float64, value string) {
	p.pdf.CellFormat(w, p.Export.FooterRow, value, "1", 0, "C", true, 0, "")
}

// printSinglePilotTime prints time cell for single pilot in the row of the logbook
func (p *PDFExporter) printSinglePilotTime(w float64, value string, fill bool) {
	if p.Export.ReplaceSPTime && value != "" {
		// set new font with symbol support
		p.pdf.SetFont(fontB612, "", BodyFontSize)
		// put check symbol
		p.printBodyTimeCell(w, CheckSymbol, fill)
		// set back the regular font
		p.pdf.SetFont(fontRegular, "", BodyFontSize)
	} else {
		p.printBodyTimeCell(w, value, fill)
	}
}

// formatTimeField formats time field in the logbook
func (p *PDFExporter) formatTimeField(timeField string) string {
	if p.Export.TimeFieldsAutoFormat == 0 || timeField == "" {
		return timeField
	}

	parts := strings.Split(timeField, ":")

	if len(parts) != 2 { // probably some wrong value in the field
		if timeField == "0" {
			return ""
		}

		return timeField
	}

	hours := parts[0]
	minutes := parts[1]

	if p.Export.TimeFieldsAutoFormat == 1 {
		// add leading zero if missing
		if len(hours) == 1 {
			hours = fmt.Sprintf("0%s", hours)
		}
	} else {
		// Remove leading zero if present
		if strings.HasPrefix(hours, "0") && len(hours) == 2 {
			hours = hours[1:]
		}
	}

	return hours + ":" + minutes
}

// printBodyRemarksCell prints remarks cell in the row of the logbook
func (p *PDFExporter) printBodyRemarksCell(w float64, value string, fill bool) {

	wFactored := int(w * 0.9)
	vL := len(value)
	longCut := int(1.75 * float64(wFactored))

	if vL > longCut {
		// too long remark, cut it and set font 5
		p.pdf.SetFont(fontRegular, "", BodyFontSize-3)
		value = value[:longCut-3] + "..."

	} else if vL > wFactored*3/2 {
		// slightly long remark
		p.pdf.SetFont(fontRegular, "", BodyFontSize-3)

	} else if vL > wFactored {
		// long remark
		p.pdf.SetFont(fontRegular, "", BodyFontSize-2)
	}

	p.pdf.CellFormat(w, p.Export.BodyRow, value, "1", 0, "L", fill, 0, "")
	p.pdf.SetFont(fontRegular, "", BodyFontSize)
}

// printFooterLeftBlock prints left block in the footer of the logbook
func (p *PDFExporter) printFooterLeftBlock(totalName string) {
	var border string
	switch totalName {
	case FooterThisPage:
		border = "LTR"
	case FooterPreviousPage:
		border = "LR"
	case FooterTotalTime:
		border = "LBR"
	}

	p.pdf.CellFormat(p.columns.w4[0], p.Export.FooterRow, "", border, 0, "", true, 0, "")
}

// printFooterSignatureBlock prints signature block in the footer of the logbook
func (p *PDFExporter) printFooterSignatureBlock(totalName string) {
	p.pdf.SetFont(fontRegular, "", SignatureFontSize)

	if totalName == FooterThisPage {
		if p.Export.IsExtended {
			// let's save the coordinates
			p.signatureBlockX, p.signatureBlockY = p.pdf.GetXY()
			// and put empty filled box
			p.pdf.CellFormat(p.columns.w4[17], p.Export.FooterRow, "", "LTR", 0, "C", true, 0, "")
		} else {
			p.pdf.CellFormat(p.columns.w4[17], p.Export.FooterRow, p.Signature, "LTR", 0, "C", true, 0, "")
		}
	} else if totalName == FooterPreviousPage {
		p.pdf.CellFormat(p.columns.w4[17], p.Export.FooterRow, "", "LR", 0, "", true, 0, "")

		if p.Export.IsExtended {
			// in case it's extended format, the remarks field can be too short to
			// include the signature text, especially for A4 format. In this case
			// there will be MultiCell function which support new line automatically
			x, y := p.pdf.GetXY()
			rowH := p.Export.FooterRow
			if len(p.Signature) > int(p.columns.w4[17]*0.8) {
				// looks like the signature text is really too long,
				// so let's fit multiline cell into one normal footerRowHeight
				rowH = p.Export.FooterRow / 2
			}
			p.pdf.SetXY(p.signatureBlockX, p.signatureBlockY)
			p.pdf.MultiCell(p.columns.w4[17], rowH, strings.TrimRight(p.Signature, "\r\n"), "LTR", "C", true)
			p.pdf.SetXY(x, y)
			// empty tiny cell to set the footerRowHeight back
			p.pdf.CellFormat(0.01, p.Export.FooterRow, "", "", 0, "", true, 0, "")
		}
	} else {
		p.pdf.CellFormat(p.columns.w4[17], p.Export.FooterRow, p.OwnerName, "LBR", 0, "C", true, 0, "")
		p.printSignature()
	}
}

// printSignature prints signature in the footer of the logbook
func (p *PDFExporter) printSignature() {
	if p.SignatureImage != "" {
		p.pdf.Image("signature", p.pdf.GetX()-p.columns.w4[17], p.pdf.GetY()-p.Export.FooterRow*2, p.columns.w4[17],
			p.Export.FooterRow*3, false, "", 0, "")
	}
}

// printPageNumber prints page number in the footer of the logbook
func (p *PDFExporter) printPageNumber() {
	p.pdf.SetFont(fontRegular, "", PageNumberFontSize)
	p.pdf.SetY(p.pdf.GetY() + 2)
	p.pdf.MultiCell(10, 1, fmt.Sprintf("page %d", p.pageCounter), "", "L", false)
}

// checkPageBreaks checks if we need to insert a page break and a new logbook started
func (p *PDFExporter) checkPageBreaks() {
	if len(p.pageBreaks) > 0 {
		if fmt.Sprintf("%d", p.pageCounter) == p.pageBreaks[0] {
			p.titlePage()

			p.pageCounter = 0

			p.pageBreaks = append(p.pageBreaks[:0], p.pageBreaks[1:]...)
		}
	}
}

// formatLandings is a helper function and formats landings field in the logbook
func formatLandings(landing int) string {
	if landing == 0 {
		return ""
	}
	return fmt.Sprintf("%d", landing)
}
