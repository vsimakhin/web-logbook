package pdfexport

import (
	"bytes"
	"testing"

	"github.com/vsimakhin/web-logbook/internal/models"
)

func TestMatchStandardCategory(t *testing.T) {
	headers := map[string]string{
		"departure": "DEPARTURE",
		"arrival":   "ARRIVAL",
		"aircraft":  "AIRCRAFT",
		"spt":       "SINGLE PILOT TIME",
		"landings":  "LANDINGS",
		"oct":       "OPERATIONAL CONDITION TIME",
		"pft":       "PILOT FUNCTION TIME",
		"fstd":      "FSTD SESSION",
	}

	tests := []struct {
		input    string
		expected string
	}{
		{"departure", "DEPARTURE"},
		{"Departure", "DEPARTURE"},
		{"DEPARTURE", "DEPARTURE"},
		{"spt", "SINGLE PILOT TIME"},
		{"single pilot", "SINGLE PILOT TIME"},
		{"unknown", "unknown"},
		{"", ""},
	}

	for _, tt := range tests {
		got := matchStandardCategory(tt.input, headers)
		if got != tt.expected {
			t.Errorf("matchStandardCategory(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestA4IgnoresPageDivider(t *testing.T) {
	// PAGE_DIVIDER is defined for A5 export only; A4 layout should not include it
	exp := &PDFExporter{
		Format: PDFA4,
		Export: models.ExportPDF{
			TableProfile: models.Profile{
				TableColumns: []string{"date", "dep_place", "PAGE_DIVIDER", "remarks"},
			},
		},
	}

	exp.buildLayout()

	for _, col := range exp.layout {
		if col.Field == "PAGE_DIVIDER" {
			t.Errorf("A4 layout should not include PAGE_DIVIDER (defined for A5 only)")
		}
		if col.body == nil {
			t.Errorf("Column %s has nil body func", col.Field)
		}
	}
}

func TestA5RetainsPageDividerForSplit(t *testing.T) {
	exp := &PDFExporter{
		Format: PDFA5,
		Export: models.ExportPDF{
			TableProfile: models.Profile{
				TableColumns: []string{"date", "dep_place", "PAGE_DIVIDER", "remarks"},
			},
		},
	}

	exp.buildLayout()

	foundDivider := false
	for _, col := range exp.layout {
		if col.Field == "PAGE_DIVIDER" {
			foundDivider = true
			break
		}
	}
	if !foundDivider {
		t.Fatalf("A5 layout expected PAGE_DIVIDER in layout, but not found")
	}

	pageA, pageB := exp.splitLayoutAtDivider()
	for _, col := range pageA {
		if col.Field == "PAGE_DIVIDER" {
			t.Errorf("pageA contains PAGE_DIVIDER")
		}
	}
	for _, col := range pageB {
		if col.Field == "PAGE_DIVIDER" {
			t.Errorf("pageB contains PAGE_DIVIDER")
		}
	}
	if len(pageA) != 2 || pageA[0].Field != "date" || pageA[1].Field != "dep_place" {
		t.Errorf("pageA unexpected columns: %+v", pageA)
	}
	if len(pageB) == 0 || pageB[0].Field != "remarks" {
		t.Errorf("pageB unexpected first column: %+v", pageB)
	}
}

func TestExportA4Smoke(t *testing.T) {
	exp, err := NewPDFExporter(PDFA4, "Pilot", "LIC-123", "Address", "Sig", "", models.ExportPDF{
		LogbookRows: 20,
		Fill:        2,
		LeftMargin:  10,
		TopMargin:   10,
		BodyRow:     5,
		FooterRow:   5,
		TableProfile: models.Profile{
			TableColumns: []string{"date", "PAGE_DIVIDER", "remarks"},
		},
	}, models.FlightRecord{})
	if err != nil {
		t.Fatalf("NewPDFExporter failed: %v", err)
	}

	records := []models.FlightRecord{
		{
			UUID:    "test-1",
			Date:    "2026-01-01",
			Remarks: "Test flight",
		},
	}

	var buf bytes.Buffer
	err = exp.ExportA4(records, &buf)
	if err != nil {
		t.Fatalf("ExportA4 failed: %v", err)
	}

	if !bytes.HasPrefix(buf.Bytes(), []byte("%PDF")) {
		t.Errorf("Export output does not have PDF header")
	}
}

func TestExportA5Smoke(t *testing.T) {
	exp, err := NewPDFExporter(PDFA5, "Pilot", "LIC-123", "Address", "Sig", "", models.ExportPDF{
		LogbookRows: 10,
		Fill:        2,
		LeftMarginA: 10,
		LeftMarginB: 10,
		TopMargin:   10,
		BodyRow:     5,
		FooterRow:   5,
		TableProfile: models.Profile{
			TableColumns: []string{"date", "PAGE_DIVIDER", "remarks"},
		},
	}, models.FlightRecord{})
	if err != nil {
		t.Fatalf("NewPDFExporter failed: %v", err)
	}

	records := []models.FlightRecord{
		{
			UUID:    "test-1",
			Date:    "2026-01-01",
			Remarks: "Test flight",
		},
	}

	var buf bytes.Buffer
	err = exp.ExportA5(records, &buf)
	if err != nil {
		t.Fatalf("ExportA5 failed: %v", err)
	}

	if !bytes.HasPrefix(buf.Bytes(), []byte("%PDF")) {
		t.Errorf("Export output does not have PDF header")
	}
}
