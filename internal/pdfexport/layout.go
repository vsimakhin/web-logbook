package pdfexport

import (
	"encoding/json"
	"fmt"
	"reflect"
	"strconv"
	"strings"

	"github.com/vsimakhin/web-logbook/internal/models"
)

const (
	defaultColumnWidth = 11.2
	customPrefix       = "custom_fields."
)

// columnDef describes how to render one standard column.
// label/category are keys of ColumnsHeader (its json tags), the same ids the React side uses.
type columnDef struct {
	label, category string
	align           string // "C" or "L"
	singlePilot     bool
	body            func(p *PDFExporter, r *models.FlightRecord) string
	total           func(p *PDFExporter, t *models.FlightRecord) string // nil = no footer total
}

// pdfColumn is a resolved column of the current export
type pdfColumn struct {
	columnDef
	Field    string
	Label    string
	Category string // "" = standalone column, spans both header rows
	Width    float64
}

func textDef(label, cat, align string, get func(r *models.FlightRecord) string) columnDef {
	return columnDef{label: label, category: cat, align: align,
		body: func(_ *PDFExporter, r *models.FlightRecord) string { return get(r) }}
}

func timeDef(label, cat string, get func(r *models.FlightRecord) int) columnDef {
	return columnDef{label: label, category: cat, align: "C",
		body: func(p *PDFExporter, r *models.FlightRecord) string {
			return p.formatTimeField(get(r))
		},
		total: func(p *PDFExporter, t *models.FlightRecord) string {
			return p.formatTimeFieldTotals(get(t))
		}}
}

func singlePilotDef(label, cat string, get func(r *models.FlightRecord) int) columnDef {
	d := timeDef(label, cat, get)
	d.singlePilot = true
	return d
}

func landingDef(label, cat string, get func(r *models.FlightRecord) int) columnDef {
	return columnDef{label: label, category: cat, align: "C",
		body:  func(_ *PDFExporter, r *models.FlightRecord) string { return formatLandings(get(r)) },
		total: func(_ *PDFExporter, t *models.FlightRecord) string { return fmt.Sprintf("%d", get(t)) }}
}

var standardColumns = map[string]columnDef{
	"date": {label: "date", align: "C",
		body: func(p *PDFExporter, r *models.FlightRecord) string {
			if p.Export.IsExtended && r.SIM.Type != "" {
				return "" // extended format: sim records show the date in the FSTD block
			}
			return r.Date
		}},
	"dep_place": textDef("dep_place", "departure", "C", func(r *models.FlightRecord) string { return r.Departure.Place }),
	"dep_time":  textDef("dep_time", "departure", "C", func(r *models.FlightRecord) string { return r.Departure.Time }),
	"arr_place": textDef("arr_place", "arrival", "C", func(r *models.FlightRecord) string { return r.Arrival.Place }),
	"arr_time":  textDef("arr_time", "arrival", "C", func(r *models.FlightRecord) string { return r.Arrival.Time }),
	"model":     textDef("model", "aircraft", "C", func(r *models.FlightRecord) string { return r.Aircraft.Model }),
	"reg":       textDef("reg", "aircraft", "C", func(r *models.FlightRecord) string { return r.Aircraft.Reg }),

	"se":    singlePilotDef("se", "spt", func(r *models.FlightRecord) int { return r.Time.SE }),
	"me":    singlePilotDef("me", "spt", func(r *models.FlightRecord) int { return r.Time.ME }),
	"mcc":   timeDef("mcc", "", func(r *models.FlightRecord) int { return r.Time.MCC }),
	"total": timeDef("total", "", func(r *models.FlightRecord) int { return r.Time.Total }),

	"pic_name": textDef("pic_name", "", "L", func(r *models.FlightRecord) string { return r.PIC }),

	"land_day":   landingDef("land_day", "landings", func(r *models.FlightRecord) int { return r.Landings.Day }),
	"land_night": landingDef("land_night", "landings", func(r *models.FlightRecord) int { return r.Landings.Night }),

	"night": timeDef("night", "oct", func(r *models.FlightRecord) int { return r.Time.Night }),
	"ifr":   timeDef("ifr", "oct", func(r *models.FlightRecord) int { return r.Time.IFR }),
	"pic":   timeDef("pic", "pft", func(r *models.FlightRecord) int { return r.Time.PIC }),
	"cop":   timeDef("cop", "pft", func(r *models.FlightRecord) int { return r.Time.CoPilot }),
	"dual":  timeDef("dual", "pft", func(r *models.FlightRecord) int { return r.Time.Dual }),
	"instr": timeDef("instr", "pft", func(r *models.FlightRecord) int { return r.Time.Instructor }),

	"sim_type": textDef("sim_type", "fstd", "C", func(r *models.FlightRecord) string { return r.SIM.Type }),
	"sim_time": timeDef("sim_time", "fstd", func(r *models.FlightRecord) int { return r.SIM.Time }),

	"remarks": textDef("remarks", "", "L", func(r *models.FlightRecord) string { return r.Remarks }),
}

// headerMap turns ColumnsHeader into map[json tag]text, so defs can refer to headers by key
func headerMap(h models.ColumnsHeader) map[string]string {
	m := map[string]string{}
	v, t := reflect.ValueOf(h), reflect.TypeOf(h)
	for i := 0; i < t.NumField(); i++ {
		m[strings.Split(t.Field(i).Tag.Get("json"), ",")[0]] = v.Field(i).String()
	}
	for k, s := range m {
		m[k] = strings.ReplaceAll(s, "\\n", "\n")
	}
	return m
}

var standardOrder = []string{
	"date",
	"dep_place", "dep_time",
	"arr_place", "arr_time",
	"model", "reg",
	"se", "me",
	"mcc",
	"total",
	"pic_name",
	"land_day", "land_night",
	"night", "ifr",
	"pic", "cop", "dual", "instr",
	"sim_type", "sim_time",
	"remarks",
}

func matchStandardCategory(cat string, headers map[string]string) string {
	clean := strings.ToLower(strings.TrimSpace(cat))
	if clean == "" || clean == "custom" {
		return cat
	}

	switch clean {
	case "departure":
		return headers["departure"]
	case "arrival":
		return headers["arrival"]
	case "aircraft":
		return headers["aircraft"]
	case "spt", "single pilot", "single pilot time":
		return headers["spt"]
	case "mcc", "multi pilot time":
		return headers["mcc"]
	case "total", "total time":
		return headers["total"]
	case "landings":
		return headers["landings"]
	case "oct", "operational condition time":
		return headers["oct"]
	case "pft", "pilot function time":
		return headers["pft"]
	case "fstd", "fstd session":
		return headers["fstd"]
	case "remarks", "remarks and endorsements":
		return headers["remarks"]
	}

	for key, hVal := range headers {
		if strings.EqualFold(cat, hVal) {
			return headers[key]
		}
	}

	return cat
}

func groupCustomFieldsByCategory(cols []pdfColumn) []pdfColumn {
	if len(cols) == 0 {
		return cols
	}

	lastIndexForCategory := make(map[string]int)
	for i, c := range cols {
		if c.Category != "" && !strings.HasPrefix(c.Field, customPrefix) {
			lastIndexForCategory[c.Category] = i
		}
	}

	type toMove struct {
		col      pdfColumn
		category string
	}
	var moves []toMove
	var remaining []pdfColumn

	for i, c := range cols {
		if strings.HasPrefix(c.Field, customPrefix) && c.Category != "" {
			if lastIdx, ok := lastIndexForCategory[c.Category]; ok && i > lastIdx {
				moves = append(moves, toMove{col: c, category: c.Category})
				continue
			}
		}
		remaining = append(remaining, c)
	}

	if len(moves) == 0 {
		return cols
	}

	lastInRemaining := make(map[string]int)
	for i, c := range remaining {
		if c.Category != "" {
			lastInRemaining[c.Category] = i
		}
	}

	res := make([]pdfColumn, 0, len(cols))
	for i, c := range remaining {
		res = append(res, c)
		if lastInRemaining[c.Category] == i {
			for j := 0; j < len(moves); j++ {
				if moves[j].category == c.Category {
					res = append(res, moves[j].col)
					moves = append(moves[:j], moves[j+1:]...)
					j--
				}
			}
		}
	}
	for _, m := range moves {
		res = append(res, m.col)
	}
	return res
}

func (p *PDFExporter) widthOf(field string) float64 {
	if w := p.Export.TableProfile.TableColumnWidths[field]; w > 0 {
		return w
	}
	return defaultColumnWidth
}

// buildLayout resolves the saved table profile into the list of columns to print.
// The rules mirror PDFPageLayout.jsx (visibleColumns).
func (p *PDFExporter) buildLayout() {
	profile := p.Export.TableProfile
	headers := headerMap(p.Export.Headers)

	hidden := map[string]bool{}
	for _, f := range profile.TableHiddenColumns {
		hidden[f] = true
	}

	customs := map[string]models.CustomField{}
	for _, cf := range p.CustomFields {
		customs[customPrefix+cf.UUID] = cf
	}
	known := func(f string) bool {
		if _, ok := standardColumns[f]; ok {
			return true
		}
		_, ok := customs[f]
		return ok
	}

	// 1. saved order, 2. then standard columns that are neither saved nor hidden
	var order []string
	seen := map[string]bool{}
	add := func(f string) {
		if !seen[f] && !hidden[f] && known(f) {
			seen[f] = true
			order = append(order, f)
		}
	}
	for _, f := range profile.TableColumns {
		add(f)
	}
	for _, f := range standardOrder {
		add(f)
	}

	cols := make([]pdfColumn, 0, len(order)+1)
	for _, f := range order {
		c := pdfColumn{Field: f, Width: p.widthOf(f)}

		if def, ok := standardColumns[f]; ok {
			c.columnDef = def
			c.Label = headers[def.label]
			c.Category = headers[def.category] // headers[""] == ""
		} else {
			cf := customs[f]
			uuid := cf.UUID
			cfType := cf.Type
			c.Label = cf.PDFHeader
			if c.Label == "" {
				c.Label = cf.Name
			}
			c.Category = matchStandardCategory(cf.Category, headers)
			c.align = "C"

			switch cfType {
			case "duration":
				c.body = func(p *PDFExporter, _ *models.FlightRecord) string {
					return p.formatTimeField(p.rowCustomInt(uuid))
				}
				c.total = func(p *PDFExporter, _ *models.FlightRecord) string {
					return p.formatTimeFieldTotals(p.customTotalForRow(uuid))
				}
			case "number":
				c.body = func(p *PDFExporter, _ *models.FlightRecord) string {
					raw := p.rowCustom[uuid]
					if raw == "" {
						return ""
					}
					return formatLandings(p.rowCustomInt(uuid))
				}
				c.total = func(p *PDFExporter, _ *models.FlightRecord) string {
					return fmt.Sprintf("%d", p.customTotalForRow(uuid))
				}
			default:
				c.body = func(p *PDFExporter, _ *models.FlightRecord) string { return p.rowCustom[uuid] }
			}
		}
		cols = append(cols, c)
	}

	// Re-order custom-field columns so they sit adjacent to the last standard column
	// that shares their category. This enables headerGroups() to merge them into the
	// same group header even when the user dragged them to the end of the list.
	cols = groupCustomFieldsByCategory(cols)

	// extended format: extra "Date" column in front of the FSTD type, taken from remarks
	if p.Export.IsExtended {
		dateW := p.widthOf("date")
		for i := range cols {
			if cols[i].Field == "sim_type" {
				simDate := pdfColumn{Field: "sim_date", Label: "Date", Category: cols[i].Category, Width: dateW}
				simDate.align = "C"
				simDate.body = func(_ *PDFExporter, r *models.FlightRecord) string {
					if r.SIM.Type != "" {
						return r.Date
					}
					return ""
				}
				cols = append(cols[:i], append([]pdfColumn{simDate}, cols[i:]...)...)
				break
			}
		}
		for i := range cols {
			if cols[i].Field == "remarks" {
				cols[i].Width -= dateW
			}
		}
	}

	p.layout = cols
	// p.fitLayoutToPage()
}

type headerGroup struct {
	label   string
	width   float64
	cols    []pdfColumn
	grouped bool // has a category, so a third header row is printed
}

// headerGroups merges consecutive columns with the same category
func (p *PDFExporter) headerGroups() []headerGroup {
	var groups []headerGroup
	for _, c := range p.layout {
		n := len(groups)
		if c.Category != "" && n > 0 && groups[n-1].grouped && groups[n-1].label == c.Category {
			groups[n-1].width += c.Width
			groups[n-1].cols = append(groups[n-1].cols, c)
			continue
		}
		g := headerGroup{label: c.Category, width: c.Width, cols: []pdfColumn{c}, grouped: c.Category != ""}
		if !g.grouped {
			g.label = c.Label
		}
		groups = append(groups, g)
	}
	return groups
}

// loadRowCustomFields parses the custom fields JSON of the record once per row
// (assumes {"<uuid>": value, ...} - adjust if your storage differs)
func (p *PDFExporter) loadRowCustomFields(r models.FlightRecord) {
	p.rowCustom = map[string]string{}
	if strings.TrimSpace(r.CustomFields) == "" {
		return
	}

	toString := func(v any) string {
		switch t := v.(type) {
		case nil:
			return ""
		case string:
			return t
		case float64:
			return strconv.FormatFloat(t, 'f', -1, 64)
		case bool:
			if t {
				return "✓"
			}
			return ""
		default:
			return fmt.Sprint(t)
		}
	}

	// shape 1: {"<uuid>": value} or {"custom_fields.<uuid>": value}
	var obj map[string]any
	if err := json.Unmarshal([]byte(r.CustomFields), &obj); err == nil {
		for k, v := range obj {
			p.rowCustom[strings.TrimPrefix(k, customPrefix)] = toString(v)
		}
		return
	}

	// shape 2: [{"uuid": "...", "value": ...}]
	var arr []map[string]any
	if err := json.Unmarshal([]byte(r.CustomFields), &arr); err == nil {
		for _, item := range arr {
			id := toString(item["uuid"])
			if id == "" {
				id = toString(item["id"])
			}
			p.rowCustom[id] = toString(item["value"])
		}
		return
	}

	fmt.Printf("cannot parse custom fields of %s: %q\n", r.UUID, r.CustomFields)
}

func (p *PDFExporter) rowCustomInt(uuid string) int {
	raw := p.rowCustom[uuid]
	if raw == "" {
		return 0
	}
	if v, err := strconv.Atoi(raw); err == nil {
		return v
	}
	if f, err := strconv.ParseFloat(raw, 64); err == nil {
		return int(f)
	}
	return 0
}

// accumulateCustomTotals sums duration/number custom fields from the current row into the page and time totals.
func (p *PDFExporter) accumulateCustomTotals() {
	for _, cf := range p.CustomFields {
		if cf.Type != "duration" && cf.Type != "number" {
			continue
		}
		val := p.rowCustomInt(cf.UUID)
		p.customTotalPage[cf.UUID] += val
		p.customTotalTime[cf.UUID] += val
	}
}

// customTotalForRow returns the right accumulator bucket for the current footer row.
func (p *PDFExporter) customTotalForRow(uuid string) int {
	switch p.currentFooterRow {
	case FooterThisPage:
		return p.customTotalPage[uuid]
	case FooterPreviousPage:
		return p.customTotalPrevious[uuid]
	default: // FooterTotalTime
		return p.customTotalTime[uuid]
	}
}
