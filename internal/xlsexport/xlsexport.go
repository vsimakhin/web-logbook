package xlsexport

import (
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/vsimakhin/web-logbook/internal/models"
	"github.com/xuri/excelize/v2"
)

const sheet = "Logbook"

type XLSExport struct {
	f *excelize.File

	ConvertTime bool
}

func (x *XLSExport) createFile() {
	x.f = excelize.NewFile()

	// Create a new sheet
	s := x.f.NewSheet(sheet)
	x.f.SetActiveSheet(s)

	x.f.DeleteSheet("Sheet1")
}

func (x *XLSExport) writeHeader() {
	x.f.SetCellValue(sheet, "A1", "Date")
	x.f.SetCellValue(sheet, "B1", "Departure Place")
	x.f.SetCellValue(sheet, "C1", "Departure Time")
	x.f.SetCellValue(sheet, "D1", "Arrival Place")
	x.f.SetCellValue(sheet, "E1", "Arrival Time")
	x.f.SetCellValue(sheet, "F1", "Model")
	x.f.SetCellValue(sheet, "G1", "Registration")
	x.f.SetCellValue(sheet, "H1", "SE")
	x.f.SetCellValue(sheet, "I1", "ME")
	x.f.SetCellValue(sheet, "J1", "MCC")
	x.f.SetCellValue(sheet, "K1", "Total")
	x.f.SetCellValue(sheet, "L1", "PIC Name")
	x.f.SetCellValue(sheet, "M1", "Day Landings")
	x.f.SetCellValue(sheet, "N1", "Night Landings")
	x.f.SetCellValue(sheet, "O1", "Night")
	x.f.SetCellValue(sheet, "P1", "IFR")
	x.f.SetCellValue(sheet, "Q1", "PIC")
	x.f.SetCellValue(sheet, "R1", "CoPilot")
	x.f.SetCellValue(sheet, "S1", "Dual")
	x.f.SetCellValue(sheet, "T1", "FSTD Type")
	x.f.SetCellValue(sheet, "U1", "FSTD Time")
	x.f.SetCellValue(sheet, "V1", "Remarks")
}

func (x *XLSExport) parseTime(t string) interface{} {
	if !x.ConvertTime {
		return t
	}

	if t == "" {
		return ""
	}

	t = strings.ReplaceAll(t, ":", "h")
	t = fmt.Sprintf("%sm", t)

	d, err := time.ParseDuration(t)
	if err != nil {
		fmt.Println(err)
	}

	return d
}

func parseLanding(l int) interface{} {
	if l == 0 {
		return ""
	}

	return l
}

func (x *XLSExport) writeRow(fr models.FlightRecord, row int) {
	// row := i + 2

	x.f.SetCellValue(sheet, fmt.Sprintf("A%d", row), fr.Date)
	x.f.SetCellValue(sheet, fmt.Sprintf("B%d", row), fr.Departure.Place)
	x.f.SetCellValue(sheet, fmt.Sprintf("C%d", row), fr.Departure.Time)
	x.f.SetCellValue(sheet, fmt.Sprintf("D%d", row), fr.Arrival.Place)
	x.f.SetCellValue(sheet, fmt.Sprintf("E%d", row), fr.Arrival.Time)
	x.f.SetCellValue(sheet, fmt.Sprintf("F%d", row), fr.Aircraft.Model)
	x.f.SetCellValue(sheet, fmt.Sprintf("G%d", row), fr.Aircraft.Reg)
	x.f.SetCellValue(sheet, fmt.Sprintf("H%d", row), x.parseTime(fr.Time.SE))
	x.f.SetCellValue(sheet, fmt.Sprintf("I%d", row), x.parseTime(fr.Time.ME))
	x.f.SetCellValue(sheet, fmt.Sprintf("J%d", row), x.parseTime(fr.Time.MCC))
	x.f.SetCellValue(sheet, fmt.Sprintf("K%d", row), x.parseTime(fr.Time.Total))
	x.f.SetCellValue(sheet, fmt.Sprintf("L%d", row), fr.PIC)
	x.f.SetCellValue(sheet, fmt.Sprintf("M%d", row), parseLanding(fr.Landings.Day))
	x.f.SetCellValue(sheet, fmt.Sprintf("N%d", row), parseLanding(fr.Landings.Night))
	x.f.SetCellValue(sheet, fmt.Sprintf("O%d", row), x.parseTime(fr.Time.Night))
	x.f.SetCellValue(sheet, fmt.Sprintf("P%d", row), x.parseTime(fr.Time.IFR))
	x.f.SetCellValue(sheet, fmt.Sprintf("Q%d", row), x.parseTime(fr.Time.PIC))
	x.f.SetCellValue(sheet, fmt.Sprintf("R%d", row), x.parseTime(fr.Time.CoPilot))
	x.f.SetCellValue(sheet, fmt.Sprintf("S%d", row), x.parseTime(fr.Time.Dual))
	x.f.SetCellValue(sheet, fmt.Sprintf("T%d", row), fr.SIM.Type)
	x.f.SetCellValue(sheet, fmt.Sprintf("U%d", row), x.parseTime(fr.SIM.Time))
	x.f.SetCellValue(sheet, fmt.Sprintf("V%d", row), fr.Remarks)
}

func (x *XLSExport) Export(flightRecords []models.FlightRecord, w io.Writer) error {
	// new file
	x.createFile()

	// headers
	x.writeHeader()

	sheetRow := 2
	for i := len(flightRecords) - 1; i >= 0; i-- {
		x.writeRow(flightRecords[i], sheetRow)
		sheetRow++
	}

	buf, err := x.f.WriteToBuffer()
	if err != nil {
		return err
	}

	w.Write(buf.Bytes())

	return nil
}
