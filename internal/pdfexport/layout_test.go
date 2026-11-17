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

func TestIsTakeoffCategory(t *testing.T) {
	tests := []struct {
		input    string
		expected bool
	}{
		{"Take off", true},
		{"Takeoff", true},
		{"Take offs", true},
		{"Takeoffs", true},
		{"Take-off", true},
		{"Take-offs", true},
		{"take off", true},
		{"takeoff", true},
		{"take offs", true},
		{"TAKEOFF", true},
		{"TAKE OFFS", true},
		{"TAKE-OFF", true},
		{"landings", false},
		{"Landing", false},
		{"departure", false},
		{"", false},
	}

	for _, tt := range tests {
		got := isTakeoffCategory(tt.input)
		if got != tt.expected {
			t.Errorf("isTakeoffCategory(%q) = %v, want %v", tt.input, got, tt.expected)
		}
	}
}

func TestNumberGroupWidthsTakeoffAndLandings(t *testing.T) {
	exp := &PDFExporter{
		Export: models.ExportPDF{
			Headers: models.ColumnsHeader{
				Landings: "LANDINGS",
				SPT:      "SINGLE PILOT TIME",
			},
		},
	}

	takeoffGroup := headerGroup{label: "Take off", width: 10, grouped: true, cols: []pdfColumn{{Field: "custom_fields.to", Label: "Day"}}}
	landingsGroup := headerGroup{label: "LANDINGS", width: 20, grouped: true, cols: []pdfColumn{{Field: "land_day", Label: "Day"}}}
	otherGroup := headerGroup{label: "OTHER", width: 15, grouped: true, cols: []pdfColumn{{Field: "other", Label: "Other"}}}

	// Takeoff before Landings: should merge into one width (10 + 20 = 30)
	widths := exp.numberGroupWidths([]headerGroup{otherGroup, takeoffGroup, landingsGroup})
	if len(widths) != 2 {
		t.Fatalf("expected 2 widths (other, takeoff+landings), got %d: %v", len(widths), widths)
	}
	if widths[0] != 15 || widths[1] != 30 {
		t.Errorf("expected [15, 30], got %v", widths)
	}

	// Landings before Takeoff: should also merge into one width (20 + 10 = 30)
	widthsRev := exp.numberGroupWidths([]headerGroup{otherGroup, landingsGroup, takeoffGroup})
	if len(widthsRev) != 2 {
		t.Fatalf("expected 2 widths (other, landings+takeoff), got %d: %v", len(widthsRev), widthsRev)
	}
	if widthsRev[0] != 15 || widthsRev[1] != 30 {
		t.Errorf("expected [15, 30], got %v", widthsRev)
	}

	// Landings alone: not merged
	widthsAlone := exp.numberGroupWidths([]headerGroup{otherGroup, landingsGroup})
	if len(widthsAlone) != 2 || widthsAlone[1] != 20 {
		t.Errorf("expected [15, 20], got %v", widthsAlone)
	}

	// Split by another column (e.g. Total Time between Takeoff and Landings): column numbers must split!
	totalGroup := headerGroup{label: "TOTAL", width: 12, grouped: false, cols: []pdfColumn{{Field: "total", Label: "Total"}}}
	widthsSplit := exp.numberGroupWidths([]headerGroup{otherGroup, takeoffGroup, totalGroup, landingsGroup})
	if len(widthsSplit) != 4 {
		t.Fatalf("expected 4 widths when separated by total (other, takeoff, total, landings), got %d: %v", len(widthsSplit), widthsSplit)
	}
	if widthsSplit[0] != 15 || widthsSplit[1] != 10 || widthsSplit[2] != 12 || widthsSplit[3] != 20 {
		t.Errorf("expected [15, 10, 12, 20], got %v", widthsSplit)
	}

	// Interleaved: takeoff day, landing day, takeoff night, landing night -> all merged into one (10+20+10+20 = 60)
	toDay := headerGroup{label: "Take off", width: 10, grouped: true, cols: []pdfColumn{{Field: "custom_fields.to_day", Label: "Day"}}}
	landDay := headerGroup{label: "LANDINGS", width: 20, grouped: true, cols: []pdfColumn{{Field: "land_day", Label: "Day"}}}
	toNight := headerGroup{label: "Take off", width: 10, grouped: true, cols: []pdfColumn{{Field: "custom_fields.to_night", Label: "Night"}}}
	landNight := headerGroup{label: "LANDINGS", width: 20, grouped: true, cols: []pdfColumn{{Field: "land_night", Label: "Night"}}}

	widthsInterleaved := exp.numberGroupWidths([]headerGroup{otherGroup, toDay, landDay, toNight, landNight})
	if len(widthsInterleaved) != 2 {
		t.Fatalf("expected 2 widths (other, to+land interleaved), got %d: %v", len(widthsInterleaved), widthsInterleaved)
	}
	if widthsInterleaved[0] != 15 || widthsInterleaved[1] != 60 {
		t.Errorf("expected [15, 60], got %v", widthsInterleaved)
	}
}

func TestGroupCustomFieldsByCategoryInterleaved(t *testing.T) {
	cols := []pdfColumn{
		{Field: "date", Label: "Date"},
		{Field: "pic_name", Label: "Name"},
		{Field: "custom_fields.to_day", Label: "Day", Category: "Take off"},
		{Field: "land_day", Label: "Day", Category: "LANDINGS"},
		{Field: "custom_fields.to_night", Label: "Night", Category: "Take off"},
		{Field: "land_night", Label: "Night", Category: "LANDINGS"},
		{Field: "night", Label: "Night"},
	}

	reordered := groupCustomFieldsByCategory(cols)

	expectedFields := []string{
		"date",
		"pic_name",
		"custom_fields.to_day",
		"land_day",
		"custom_fields.to_night",
		"land_night",
		"night",
	}

	if len(reordered) != len(expectedFields) {
		t.Fatalf("expected %d columns, got %d", len(expectedFields), len(reordered))
	}
	for i, exp := range expectedFields {
		if reordered[i].Field != exp {
			t.Errorf("at index %d: expected %s, got %s", i, exp, reordered[i].Field)
		}
	}
}

func TestGroupCustomFieldsByCategoryPreservesUserOrder(t *testing.T) {
	cols := []pdfColumn{
		{Field: "date", Label: "Date"},
		{Field: "pic_name", Label: "Name"},
		{Field: "land_day", Label: "Day", Category: "LANDINGS"},
		{Field: "land_night", Label: "Night", Category: "LANDINGS"},
		{Field: "total", Label: "Total"},
		{Field: "custom_fields.to_day", Label: "Day", Category: "Take off"},
		{Field: "custom_fields.to_night", Label: "Night", Category: "Take off"},
	}

	reordered := groupCustomFieldsByCategory(cols)

	// User placed total between landings and takeoff; the order must NOT be overridden
	expectedFields := []string{
		"date",
		"pic_name",
		"land_day",
		"land_night",
		"total",
		"custom_fields.to_day",
		"custom_fields.to_night",
	}

	if len(reordered) != len(expectedFields) {
		t.Fatalf("expected %d columns, got %d", len(expectedFields), len(reordered))
	}
	for i, exp := range expectedFields {
		if reordered[i].Field != exp {
			t.Errorf("at index %d: expected %s, got %s", i, exp, reordered[i].Field)
		}
	}
}

func TestExportA4WithTakeoffSmoke(t *testing.T) {
	toUUID := "takeoff-uuid-1"
	exp, err := NewPDFExporter(PDFA4, "Pilot", "LIC-123", "Address", "Sig", "", models.ExportPDF{
		LogbookRows: 20,
		Fill:        2,
		LeftMargin:  10,
		TopMargin:   10,
		BodyRow:     5,
		FooterRow:   5,
		TableProfile: models.Profile{
			TableColumns: []string{"date", "pic_name", "custom_fields." + toUUID, "land_day", "land_night", "remarks"},
		},
	}, models.FlightRecord{})
	if err != nil {
		t.Fatalf("NewPDFExporter failed: %v", err)
	}
	exp.CustomFields = []models.CustomField{
		{
			UUID:      toUUID,
			Name:      "Takeoffs",
			PDFHeader: "T/O",
			Category:  "Take off",
			Type:      "number",
		},
	}

	records := []models.FlightRecord{
		{
			UUID:         "test-1",
			Date:         "2026-01-01",
			CustomFields: `{"` + toUUID + `": 2}`,
			Landings: struct {
				Day   int `json:"day"`
				Night int `json:"night"`
			}{Day: 2},
			Remarks: "Test takeoff and landing",
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

func TestExportA5WithTakeoffSmoke(t *testing.T) {
	toUUID := "takeoff-uuid-1"
	exp, err := NewPDFExporter(PDFA5, "Pilot", "LIC-123", "Address", "Sig", "", models.ExportPDF{
		LogbookRows: 10,
		Fill:        2,
		LeftMarginA: 10,
		LeftMarginB: 10,
		TopMargin:   10,
		BodyRow:     5,
		FooterRow:   5,
		TableProfile: models.Profile{
			TableColumns: []string{"date", "pic_name", "custom_fields." + toUUID, "land_day", "land_night", "PAGE_DIVIDER", "remarks"},
		},
	}, models.FlightRecord{})
	if err != nil {
		t.Fatalf("NewPDFExporter failed: %v", err)
	}
	exp.CustomFields = []models.CustomField{
		{
			UUID:      toUUID,
			Name:      "Takeoffs",
			PDFHeader: "T/O",
			Category:  "Take off",
			Type:      "number",
		},
	}

	records := []models.FlightRecord{
		{
			UUID:         "test-1",
			Date:         "2026-01-01",
			CustomFields: `{"` + toUUID + `": 2}`,
			Landings: struct {
				Day   int `json:"day"`
				Night int `json:"night"`
			}{Day: 2},
			Remarks: "Test takeoff and landing A5",
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
