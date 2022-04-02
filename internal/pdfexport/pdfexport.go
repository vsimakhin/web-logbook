package pdfexport

import (
	"embed"
	"fmt"

	"github.com/jung-kurt/gofpdf"
	"github.com/vsimakhin/web-logbook/internal/models"
)

const PDFA4 = 0
const PDFA5 = 1

const fontBold = "LiberationSansNarrow-Bold"
const fontRegular = "LiberationSansNarrow-Regular"

var logbookRows int
var fillRow int

var leftMargin float64
var topMargin float64
var bodyRowHeight float64
var footerRowHeight float64

var header1 = []string{
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"10",
	"11",
	"12",
}
var header2 = []string{
	"DATE",
	"DEPARTURE",
	"ARRIVAL",
	"AIRCRAFT",
	"SINGLE PILOT TIME", "MULTI PILOT TIME",
	"TOTAL TIME",
	"PIC NAME",
	"LANDINGS",
	"OPERATIONAL CONDITION TIME",
	"PILOT FUNCTION TIME",
	"FSTD SESSION",
	"REMARKS AND ENDORSMENTS",
}
var header3 = []string{
	"",
	"Place", "Time",
	"Place", "Time",
	"Type", "Reg",
	"SE", "ME", "",
	"",
	"",
	"Day", "Night",
	"Night", "IFR",
	"PIC", "COP", "DUAL", "INSTR",
	"Type", "Time",
	"",
}

var w1 []float64
var w2 []float64
var w3 []float64
var w4 []float64

var totalPage models.FlightRecord
var totalPrevious models.FlightRecord
var totalTime models.FlightRecord

//go:embed font/*
var content embed.FS

type Logbook struct {
	pdf *gofpdf.Fpdf

	OwnerName  string
	Signature  string
	PageBreaks []string

	Export models.Export
}

func (l *Logbook) init(format int) {
	var emptyRecord models.FlightRecord
	totalPage = emptyRecord
	totalPrevious = emptyRecord
	totalTime = emptyRecord

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

	initWidths(l.Export.Columns)
}

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
}

func formatLandings(landing int) string {
	if landing == 0 {
		return ""
	} else {
		return fmt.Sprintf("%d", landing)
	}
}

// fillLine returns if the logbook line should be filled with gray color
func fillLine(rowCounter int, fill int) bool {
	if (rowCounter+1)%fill == 0 { // fill every "fill" row only
		return true
	} else {
		return false
	}
}

// LoadFonts loads fonts for pdf object from embed fs
func (l *Logbook) loadFonts() {

	fontRegularBytes, _ := content.ReadFile(fmt.Sprintf("font/%s.ttf", fontRegular))
	l.pdf.AddUTF8FontFromBytes(fontRegular, "", fontRegularBytes)

	fontBoldBytes, _ := content.ReadFile(fmt.Sprintf("font/%s.ttf", fontBold))
	l.pdf.AddUTF8FontFromBytes(fontBold, "", fontBoldBytes)
}

func (l *Logbook) printPageNumber(pageCounter int) {
	l.pdf.SetFont(fontRegular, "", 6)
	l.pdf.SetY(l.pdf.GetY() + 2)
	l.pdf.MultiCell(10, 1, fmt.Sprintf("page %d", pageCounter), "", "L", false)
}
