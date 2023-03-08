package xlsexport

import (
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/vsimakhin/web-logbook/internal/models"
	"github.com/xuri/excelize/v2"
)

// just a sheet name in the export file
const sheet = "Logbook"

// pointer to the file
var f *excelize.File

// ExportXLS is a structure to store export parameters
type ExportXLS struct {
	ExportXLS models.ExportXLS
}

// createFile creates new file and sheet
func (e *ExportXLS) createFile() {
	f = excelize.NewFile()

	// Create a new sheet
	s, err := f.NewSheet(sheet)
	if err != nil {
		fmt.Println(err)
	}

	f.SetActiveSheet(s)

	f.DeleteSheet("Sheet1")
}

// parseTime converts time to duration format
func (e *ExportXLS) parseTime(t string) interface{} {
	if !e.ExportXLS.ConvertTime {
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

// parseLanding returns empty string in case the value is 0
func (e *ExportXLS) parseLanding(l int) interface{} {
	if l == 0 {
		return ""
	}

	return l
}

// formatRecord returns flight record as []string
func (e *ExportXLS) formatRecord(fr *models.FlightRecord) []interface{} {
	if fr != nil {
		return []interface{}{fr.Date, fr.Departure.Place, fr.Departure.Time,
			fr.Arrival.Place, fr.Arrival.Time, fr.Aircraft.Model, fr.Aircraft.Reg,
			e.parseTime(fr.Time.SE), e.parseTime(fr.Time.ME), e.parseTime(fr.Time.MCC),
			e.parseTime(fr.Time.Total), fr.PIC, e.parseLanding(fr.Landings.Day), e.parseLanding(fr.Landings.Night),
			e.parseTime(fr.Time.Night), e.parseTime(fr.Time.IFR), e.parseTime(fr.Time.PIC),
			e.parseTime(fr.Time.CoPilot), e.parseTime(fr.Time.Dual), e.parseTime(fr.Time.Instructor),
			fr.SIM.Type, e.parseTime(fr.SIM.Time), fr.Remarks}

	} else {
		return []interface{}{"Date", "Departure Place", "Departure Time",
			"Arrival Place", "Arrival Time", "Model", "Aircraft Reg",
			"SE", "ME", "MCC", "Total", "PIC Name", "Landings Day", "Landings Night",
			"Night", "IFR", "PIC", "CoPilot", "Dual", "Instructor",
			"FSTD Type", "FSTD Time", "Remarks"}
	}

}

// writeRow writes a row with flight record data
func (e *ExportXLS) writeRow(fr *models.FlightRecord, row int) {
	columns := "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

	for i, val := range e.formatRecord(fr) {
		f.SetCellValue(sheet, fmt.Sprintf("%s%d", string(columns[i]), row), val)
	}
}

// writeHeader prints header
func (e *ExportXLS) writeHeader() {
	e.writeRow(nil, 1)
}

// Export is a main function
func (e *ExportXLS) Export(flightRecords []models.FlightRecord, w io.Writer) error {
	// new file
	e.createFile()

	// headers
	e.writeHeader()

	sheetRow := 2
	for i := len(flightRecords) - 1; i >= 0; i-- {
		e.writeRow(&flightRecords[i], sheetRow)
		sheetRow++
	}

	buf, err := f.WriteToBuffer()
	if err != nil {
		return err
	}

	w.Write(buf.Bytes())

	return nil
}
