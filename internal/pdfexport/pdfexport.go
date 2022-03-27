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
}

func (l *Logbook) init(format int) {
	var emptyRecord models.FlightRecord
	totalPage = emptyRecord
	totalPrevious = emptyRecord
	totalTime = emptyRecord

	if format == PDFA4 {
		logbookRows = 23
		fillRow = 3

		leftMargin = 10.0
		topMargin = 30.0
		bodyRowHeight = 5.0
		footerRowHeight = 6.0

		w1 = []float64{12.2, 16.5, 16.5, 22.9, 33.6, 11.2, 22.86, 16.76, 22.4, 44.8, 22.4, 33.8}
		w2 = []float64{
			12.2,       //date
			16.5,       //departure
			16.5,       //arrival
			22.9,       //aircraft
			22.4, 11.2, //single, mcc
			11.2,  //total time
			22.86, //pic name
			16.76, //landings
			22.4,  //operational condition time
			44.8,  //pilot function time
			22.4,  //fstd session
			33.8,  //remarks
		}
		w3 = []float64{
			12.2,       //date
			8.25, 8.25, //departue - place, time
			8.25, 8.25, //arrival - place, time
			10, 12.9, //aircraft - type, reg
			11.2, 11.2, 11.2, //se, me, mcc
			11.2,       //total time
			22.86,      //pic name
			8.38, 8.38, //landings - day, night
			11.2, 11.2, //night, ifr
			11.2, 11.2, 11.2, 11.2, //pic, cop, dual, instr
			11.2, 11.2, //fstd - type, time
			33.8, //remarks
		}
		w4 = []float64{
			20.45,      //date + departure place
			47.65,      //departure time...aircraft reg
			11.2,       //se
			11.2,       //me
			11.2,       //mcc
			11.2,       //total
			22.86,      //pic name
			8.38, 8.38, //landings
			11.2,       //night
			11.2,       //ifr
			11.2,       //pic
			11.2,       //cop
			11.2,       //dual
			11.2,       //instr
			11.2, 11.2, //fstd type and time
			33.8, //remarks
		}

	} else if format == PDFA5 {
		logbookRows = 19
		fillRow = 4

		leftMargin = 10.0
		leftMarginB = 20.0
		topMargin = 5.0
		bodyRowHeight = 5.5
		footerRowHeight = 5.5

		w1 = []float64{15.5, 18.5, 18.5, 25.4, 36.6, 12.2, 35.86, 16.76, 24.4, 48.8, 36.4, 70.8}
		w2 = []float64{
			15.5,       //date
			18.5,       //departure
			18.5,       //arrival
			25.4,       //aircraft
			24.4, 12.2, //single, mcc
			12.2,  //total time
			35.86, //pic name
			16.76, //landings
			24.4,  //operational condition time
			48.8,  //pilot function time
			36.4,  //fstd session
			70.8,  //remarks
		}
		w3 = []float64{
			15.5,        //date
			10.25, 8.25, //departue - place, time
			10.25, 8.25, //arrival - place, time
			10, 15.4, //aircraft - type, reg
			12.2, 12.2, 12.2, //se, me, mcc
			12.2,       //total time
			35.86,      //pic name
			8.38, 8.38, //landings - day, night
			12.2, 12.2, //night, ifr
			12.2, 12.2, 12.2, 12.2, //pic, cop, dual, instr
			24.2, 12.2, //fstd - type, time
			70.8, //remarks
		}
		w4 = []float64{
			25.75,      //date + departure place
			52.15,      //departure time...aircraft reg
			12.2,       //se
			12.2,       //me
			12.2,       //mcc
			12.2,       //total
			35.86,      //pic name
			8.38, 8.38, //landings
			12.2,       //night
			12.2,       //ifr
			12.2,       //pic
			12.2,       //cop
			12.2,       //dual
			12.2,       //instr
			24.2, 12.2, //fstd type and time
			70.8, //remarks
		}
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
