package csvexport

import (
	"encoding/csv"
	"fmt"
	"io"

	"github.com/vsimakhin/web-logbook/internal/models"
)

// ExportCSV is a structure to store export parameters
type ExportCSV struct {
	ExportCSV models.ExportCSV
}

// pointer to the file
var f *csv.Writer

// newWriter creates new writer and set parameters
func (e *ExportCSV) newWriter(w io.Writer) {
	f = csv.NewWriter(w)

	if e.ExportCSV.Delimeter != "" {
		f.Comma = []rune(e.ExportCSV.Delimeter)[0]
	}
	f.UseCRLF = e.ExportCSV.CRLF

}

// formatRecord returns flight record as []string
func (e *ExportCSV) formatRecord(fr *models.FlightRecord) []string {
	if fr != nil {
		return []string{fr.Date, fr.Departure.Place, fr.Departure.Time,
			fr.Arrival.Place, fr.Arrival.Time, fr.Aircraft.Model, fr.Aircraft.Reg,
			fr.Time.SE, fr.Time.ME, fr.Time.MCC, fr.Time.Total, fmt.Sprintf("%d", fr.Landings.Day), fmt.Sprintf("%d", fr.Landings.Night),
			fr.Time.Night, fr.Time.IFR, fr.Time.PIC, fr.Time.CoPilot, fr.Time.Dual, fr.Time.Instructor,
			fr.SIM.Type, fr.SIM.Time, fr.PIC, fr.Remarks}

	} else {
		return []string{"Date", "Departure Place", "Departure Time",
			"Arrival Place", "Arrival Time", "Aircraft Model", "Aircraft Reg",
			"Time SE", "Time ME", "Time MCC", "Time Total", "Landings Day", "Landings Night",
			"Time Night", "Time IFR", "Time PIC", "Time CoPilot", "Time Dual", "Time Instructor",
			"SIM Type", "SIM Time", "PIC Name", "Remarks"}
	}
}

// writeRecord writes row with a flight record data
func (e *ExportCSV) writeRecord(fr models.FlightRecord) error {
	err := f.Write(e.formatRecord(&fr))
	if err != nil {
		return err
	}

	return nil
}

// writeHeader writes header
func (e *ExportCSV) writeHeader() error {
	h := e.formatRecord(nil)

	if err := f.Write(h); err != nil {
		return err
	}

	return nil
}

// Export is a main function
func (e *ExportCSV) Export(flightRecords []models.FlightRecord, w io.Writer) error {
	// new write
	e.newWriter(w)

	err := e.writeHeader()
	if err != nil {
		return err
	}

	for i := len(flightRecords) - 1; i >= 0; i-- {
		err := e.writeRecord(flightRecords[i])
		if err != nil {
			return err
		}
	}

	f.Flush()

	if err := f.Error(); err != nil {
		return err
	}

	return nil
}
