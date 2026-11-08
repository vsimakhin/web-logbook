# PDF Export — Architecture

**Last Updated:** 2026-10-14 — initial version generated from code and fact-checked (TASK_AGENT_WORKFLOW_SETUP); 2026-10-14 — cross-links to APPLICATION/CURRENCY_LICENSING, custom-title upload consequences (consistency pass); 2026-11-08 — profile-based column layout, custom fields, date format, PAGE_DIVIDER split (sync 30 days)

## Table of Contents

1. [Overview](#1-overview)
2. [Key Concepts](#2-key-concepts)
3. [How It Works](#3-how-it-works)
4. [Components & Files](#4-components--files)
5. [Data Model & Persistence](#5-data-model--persistence)
6. [Data Flow](#6-data-flow)
7. [Config & Constants](#7-config--constants)
8. [Error Handling & Edge Cases](#8-error-handling--edge-cases)
9. [Integration Points](#9-integration-points)
10. [Testing](#10-testing)
11. [Known Issues & Tech Debt](#11-known-issues--tech-debt)
12. [Rules for Future Development](#12-rules-for-future-development)
13. [AI Notes](#13-ai-notes)

## 1. Overview

PDF Export turns the whole logbook into a printable EASA-style paper logbook (Part FCL.050 layout) in two landscape formats. **A4** puts every visible column on one page. **A5** splits each logbook page into a left page and a right page at a `PAGE_DIVIDER` marker. The output has a title page (built-in, or a PDF the pilot uploaded), numbered column groups, per-page footers with "this page / previous pages / total" sums, the owner's signature text and image, and the per-flight signatures of instructors or examiners. Since #568 the columns are no longer a fixed 23-column grid: each format keeps a **table profile** (column order, hidden columns, widths in mm) and can include **custom fields** as extra columns, with footer totals for `duration` and `number` fields (`internal/pdfexport/layout.go:242-365`). The Go package `internal/pdfexport` renders the PDF with `codeberg.org/go-pdf/fpdf` (`internal/pdfexport/pdfexport.go:12-13`, `go.mod:6`). The HTTP entry point is `HandlerApiExportLogbook` (`app/handlers_export.go:93`). Layout settings live in the settings JSON document (`export_a4` / `export_a5`, `internal/models/structs.go:256-257`).

The UI has one settings page per format (`/export/a4`, `/export/a5`; `app/ui/src/main.jsx:84-88`). Each page edits page settings, headers, the column layout (order, visibility, widths), time and date formats and other options, manages the custom title page and has an Export button. The logbook table toolbar also has a PDF export menu (`app/ui/src/components/Logbook/PDFExportButton.jsx`). This doc also covers the **Quick CSV export**, which runs only in the browser and is offered on 10 data-grid tables (`app/ui/src/components/UIElements/CSVExportButton.jsx`). The current code has **no XLS export**. The server-side CSV/XLS packages and templates were removed in `a46e936` (#270).

## 2. Key Concepts

| Concept | Definition / invariant | Evidence |
|---|---|---|
| Format id | The strings `"A4"` and `"A5"`, uppercase and case-sensitive, in the route param and in `PDFExporter.Format` | `internal/pdfexport/pdfexport.go:18-21`, `app/handlers_export.go:17-18` |
| Time = integer minutes | Every duration in `FlightRecord.Time`, `SIM.Time` and previous experience is an `int` in minutes. It is formatted only at render time | `internal/models/structs.go:40-62`, `internal/pdfexport/pdfexport.go:402-437` |
| Per-format time format | `ExportPDF.TimeFieldsAutoFormat`: `1` HH:MM, `2` or `0` H:MM, `3` FAA decimal (`%.1f` hours). This is separate from the global setting | `internal/pdfexport/pdfexport.go:417-436`, `internal/models/structs.go:215` |
| Per-format date format | `ExportPDF.DateFieldsFormat`: `DD/MM/YYYY` (also used when empty or unknown), `YYYY-MM-DD`, `MM/DD/YYYY`. Applied by `formatDate` to the `date` column only; a value that is not ISO is printed unchanged. Separate from the global `date_fields_format` | `internal/pdfexport/pdfexport.go:577-599`, `internal/pdfexport/pdfexport_a4.go:141-143`, `internal/pdfexport/pdfexport_a5.go:288-290`, `internal/models/structs.go:216` |
| Zero handling | Body cells print `""` for 0 minutes. Footer totals print `0:00`, or `0.0` in FAA format (`formatTimeFieldTotals`). Landings print `""` in the body and `0` in footers | `internal/pdfexport/pdfexport.go:405-415`, `:570-575`, `internal/pdfexport/layout.go:58-62` |
| Chronological order | SQL returns the newest record first. Both exporters iterate the slice backwards, so the PDF starts with the oldest flight | `internal/models/flightrecords.go:180`, `internal/pdfexport/pdfexport_a4.go:26`, `internal/pdfexport/pdfexport_a5.go:27` |
| MCC suppresses ME | If a row has MCC time, its ME time is zeroed for both display and totals (A5: only in the page A pass, see §8) | `internal/pdfexport/pdfexport_a4.go:92-94`, `internal/pdfexport/pdfexport_a5.go:226-228` |
| Totals seeded by previous experience | `totalPrevious` and `totalTime` start from the pilot's previous experience. `totalPage` resets after each page. Custom-field totals (`customTotalPage/Previous/Time`, keyed by field uuid) start at 0 and roll forward the same way | `internal/pdfexport/pdfexport.go:147-152`, `internal/pdfexport/pdfexport_a4.go:105-114`, `internal/pdfexport/pdfexport_a5.go:47-54` |
| Table profile | `ExportPDF.TableProfile` (`table_columns`, `table_hidden_columns`, `table_column_widths`) drives the layout. `buildLayout` takes the saved order, then appends every standard column that is neither saved nor hidden, in `standardOrder`. Unknown ids are dropped | `internal/models/structs.go:220`, `:233-239`, `internal/pdfexport/layout.go:242-280`, `:115-129` |
| Standard column ids | 23 ids (`date`, `dep_place` … `remarks`), each a `columnDef` with header label key, category key, alignment, body getter and optional footer total. Label and category resolve through `headers` (JSON tag → text) | `internal/pdfexport/layout.go:64-100`, `headerMap` `:103-113` |
| Custom field column | Id `custom_fields.<uuid>`; shown only when saved in `table_columns`. Label = `pdf_header`, else `name`. Its `category` is matched to a standard group (`matchStandardCategory`), else used as its own group. `duration` → time cell + footer total, `number` → integer cell + footer total, other types → raw text | `internal/pdfexport/layout.go:297-329`, `:131-169` |
| Header groups | Consecutive columns with the same category merge into one group header with sub-headers; a column without category spans both header rows. The number row gives one number per group, except that the single-pilot group and the MCC column share one number | `headerGroupsFor` `internal/pdfexport/layout.go:380-399`, `numberGroupWidths` `internal/pdfexport/pdfexport.go:604-623` |
| Custom-field regrouping | A custom field placed after the last standard column of its category is moved next to that column, so the group header merges | `groupCustomFieldsByCategory` `internal/pdfexport/layout.go:171-231`, `:337` |
| Hidden column / width | A column is hidden by listing it in `table_hidden_columns`. A missing or `<= 0` width falls back to 11.2 mm, so a width of 0 no longer hides a column (§11 #21). Cell printers still skip `w <= 0` | `internal/pdfexport/layout.go:233-238`, `:246-249`, `internal/pdfexport/pdfexport.go:364-385` |
| A5 page split | `PAGE_DIVIDER` in `table_columns` ends page A. Without it, page B starts at `night`; without `night`, everything is on page A. A4 ignores the marker | `splitLayoutAtDivider` `internal/pdfexport/layout.go:495-508`, `:255-258`, `app/handlers_settings.go:132-143` |
| Extended format | `is_extended` inserts a `sim_date` column ("Date") before `sim_type`, with the `date` width, and subtracts that width from Remarks. Sim records then show the date there, not in the `date` column | `internal/pdfexport/layout.go:339-361`, `:65-71` |
| Single-pilot tick | `replace_sp_time` prints `✓` in the B612Mono font instead of SE/ME values | `internal/pdfexport/pdfexport.go:388-399`, `:71`, `internal/pdfexport/layout.go:79-80` |
| Header newlines | A literal `\n` typed in a header becomes a line break | `internal/pdfexport/layout.go:109-111` |
| Page breaks (new logbook) | `page_breaks` = `"X,Y"`: after page X a title page is inserted and the page counter restarts at 1. Totals are **not** reset | `internal/pdfexport/pdfexport.go:170`, `:557-567` |
| Custom title page | A PDF stored in `attachments` with `uuid = record_id = custom_title_a4 \| custom_title_a5`. All its pages replace the built-in title page | `app/handlers_export.go:146-148`, `internal/pdfexport/pdfexport.go:266-269`, `:293-337` |

## 3. How It Works

User-level flow:

| Step | What the pilot does | What happens | Evidence |
|---|---|---|---|
| 1 | Opens Export → PDF A4 / PDF A5 | `PdfExport` reads `['settings']` through `useSettings` and copies `export_a4` or `export_a5` into local state | `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:62-64`, `app/ui/src/components/PdfExport/PdfExport.jsx:13-21` |
| 2 | Edits rows, margins, headers, options, time/date format; reorders, adds, removes or resizes columns | The changes stay in local React state only (`handleChange` sets a dotted path) | `app/ui/src/components/PdfExport/PdfExport.jsx:23-41`, `app/ui/src/components/PdfExport/PDFPageLayout.jsx:154-207` |
| 3 | (optional) Restore defaults → page settings or headers; or Restore columns | Defaults are fetched and written into local state. Restore columns sets the default widths and clears order and hidden list. Nothing is saved yet | `app/ui/src/components/PdfExport/MenuButtons/RestoreDefaultsButton.jsx:29-40`, `app/ui/src/components/PdfExport/MenuButtons/RestoreColumnsButton.jsx:17-24` |
| 4 | Clicks Save (any of the three Save buttons sends the whole local block) | `PUT /api/settings/export/{format}` stores 16 fields, then `['settings']` is invalidated | `app/ui/src/components/PdfExport/MenuButtons/SaveSettingsButton.jsx:41-62`, `app/handlers_settings.go:108-169` |
| 5 | (optional) Uploads a custom title PDF | `POST /api/export/custom-title` validates page 1 and replaces the attachment row | `app/ui/src/components/PdfExport/MenuButtons/AddCustomTitleButton.jsx:25-35`, `app/handlers_export.go:38-90` |
| 6 | Clicks Export (export page or logbook toolbar) | `GET /api/export/{format}` streams `application/pdf`. The UI saves the blob as `logbook-<format>.pdf` | `app/ui/src/components/PdfExport/MenuButtons/ExportButton.jsx:13-27`, `app/ui/src/components/Logbook/PDFExportButton.jsx:18-32` |

Rendering pipeline (both formats):

| # | Step | Function |
|---|---|---|
| 1 | Validate the format, split `page_breaks`, drop the signature image unless `include_signature` is set | `init` `internal/pdfexport/pdfexport.go:164-177` |
| 2 | New landscape fpdf doc, auto page break margin 5 mm, load 3 embedded TTFs, register the owner signature PNG | `initPDF` `internal/pdfexport/pdfexport.go:180-208` |
| 3 | Resolve the table profile and custom fields into `p.layout` (order, labels, categories, widths, extended `sim_date`) | `buildLayout` `internal/pdfexport/layout.go:242-365` |
| 4 | Title page (built-in or custom) | `titlePage` `internal/pdfexport/pdfexport.go:244-290` |
| 5 | Header → rows → footer + page number, repeated every `logbook_rows` rows. Each row parses the record's `custom_fields` JSON into `p.rowCustom` | A4 `logBookRow` `internal/pdfexport/pdfexport_a4.go:89-124`. A5 loop `internal/pdfexport/pdfexport_a5.go:27-65`. `loadRowCustomFields` `internal/pdfexport/layout.go:403-450` |
| 6 | Pad the last page with empty rows, print the last footer | `internal/pdfexport/pdfexport_a4.go:31-37`, `internal/pdfexport/pdfexport_a5.go:68-89` |
| 7 | `pdf.Output(w)` straight into the `http.ResponseWriter` | `internal/pdfexport/pdfexport_a4.go:39`, `internal/pdfexport/pdfexport_a5.go:91` |

A4 vs A5 layout:

| Aspect | A4 | A5 |
|---|---|---|
| Pages per logbook page | 1 | 2: page A (left), then page B (right) |
| Columns on page | every column of `p.layout` | A: columns before `PAGE_DIVIDER`; B: columns after it. Default profile puts the divider after `land_night` (`internal/models/models_defaults.go:157`); fallback split before `night` (`internal/pdfexport/layout.go:495-508`) |
| Left margin field | `left_margin` | `left_margin_a`, `left_margin_b` |
| Header numbering | 1…n | page B continues after the last number of page A (`internal/pdfexport/pdfexport_a5.go:103-109`) |
| How rows are printed | once | Page A rows as they are read. On split, the same records are printed again on page B (`internal/pdfexport/pdfexport_a5.go:39-41`) |
| Page number | every page | page A only (`internal/pdfexport/pdfexport_a5.go:33`, `:74`) |
| Last page when count % rows == 0 | an extra empty page is printed (see §11 #7) | no extra page (`internal/pdfexport/pdfexport_a5.go:60`, `:68`) |

Footer rows (`printA4Total` `internal/pdfexport/pdfexport_a4.go:169-193`, `printA5TotalRow` `internal/pdfexport/pdfexport_a5.go:187-220`): the leading columns that have no footer total form the label area. Up to the first two of them (at least one is left for the label) become an empty grey block, the rest carry the label `TOTAL THIS PAGE` / `TOTAL FROM PREVIOUS PAGES` / `TOTAL TIME` (`footerLeftBlockCols` `internal/pdfexport/pdfexport.go:628-637`). After that, `printFooterColumns` prints each column's total, an empty cell, the merged `sim_date`+`sim_type` cell in extended format, or the signature block for `remarks` (`internal/pdfexport/pdfexport.go:639-658`).

Footer signature block (the `remarks` column, wherever it sits; absent if Remarks is hidden), from `printFooterSignatureBlock` `internal/pdfexport/pdfexport.go:502-539`:

| Footer row | Normal | Extended |
|---|---|---|
| TOTAL THIS PAGE | `signature_text` | empty filled box, coordinates saved |
| TOTAL FROM PREVIOUS PAGES | empty | empty box on this row. While this row is printed, `signature_text` is drawn as a MultiCell at the coordinates saved on the TOTAL THIS PAGE row. If `len(text)` (bytes) > `int(0.8 × remarks width)` (mm), the line height is halved so two lines fit in one footer row (`:515-534`) |
| TOTAL TIME | `owner_name` + signature image drawn over the 3 footer rows (`printSignature` `:542-547`) | same |

## 4. Components & Files

### 4.1 File Index

| File | Responsibility |
|---|---|
| `internal/pdfexport/pdfexport.go` | `PDFExporter` type (incl. layout, per-row custom values, custom totals), constants (formats, fonts, labels, colors, font sizes), `NewPDFExporter`, fonts, signatures, title page, custom title import, cell printers, time and date formatting, page breaks, number-row widths, footer label area, `printFooterColumns` |
| `internal/pdfexport/layout.go` | Column model: `columnDef`/`pdfColumn`, `standardColumns`, `standardOrder`, `headerMap`, `matchStandardCategory`, `groupCustomFieldsByCategory`, `widthOf`, `buildLayout`, `headerGroupsFor`, custom-field row parsing and totals, `splitLayoutAtDivider` |
| `internal/pdfexport/layout_test.go` | Category matching, `PAGE_DIVIDER` handling per format, A4/A5 smoke exports (§10) |
| `internal/pdfexport/pdfexport_a4.go` | `ExportA4`, A4 header, row, body and footer, all driven by `p.layout` |
| `internal/pdfexport/pdfexport_a5.go` | `ExportA5`, header/body/footer for page A and page B over the two halves of `p.layout`, `intToStr` |
| `internal/pdfexport/font/` | Embedded TTFs: `internal/pdfexport/font/LiberationSansNarrow-Regular.ttf`, `internal/pdfexport/font/LiberationSansNarrow-Bold.ttf`, `internal/pdfexport/font/B612Mono-Regular.ttf` (`//go:embed font/*` `internal/pdfexport/pdfexport.go:73-74`) |
| `app/handlers_export.go` | `HandlerApiExportLogbook` (also loads custom field definitions), `HandlerApiUploadCustomTitle`, `validateCustomTitlePdf` |
| `internal/models/models_defaults.go` | `pdfDefaultHeaders`, legacy `pdfA4DefaultColumns`/`pdfA5DefaultColumns`, `pdfA4Defaults`, `pdfA5Defaults`, `pdfA4TableColumns`/`pdfA5TableColumns`, `pdfA4TableColumnWidth`/`pdfA5TableColumnWidth`, `CheckDefaultValues` incl. the table-profile migration (owned by ARCHITECTURE_SETTINGS.md) |
| `internal/models/structs.go:139-239` | `ColumnsWidth` (legacy), `ColumnsHeader`, `ExportPDF`, `Profile` (JSON contract) |
| `internal/models/custom_fields.go` | `GetCustomFields` (owned by ARCHITECTURE_LOGBOOK.md) |
| `app/ui/src/pages/PdfExportA4Page.jsx`, `app/ui/src/pages/PdfExportA5Page.jsx` | Render `<PdfExport format="A4" />` / `"A5"` |
| `app/ui/src/components/PdfExport/*.jsx` | Settings page (`PdfExport`), `PageSettings`, `PDFPageLayout`, `OtherSettings`, `CustomTitlePreview` |
| `app/ui/src/components/PdfExport/MenuButtons/*.jsx` | Save, restore defaults, restore columns, export, custom title add/delete buttons |
| `app/ui/src/components/UIElements/SortableColumnList.jsx` | `SortableColumnList` (drag, remove, width input) and `AvailableColumnList`, used by `PDFPageLayout` |
| `app/ui/src/components/Logbook/PDFExportButton.jsx` | Logbook toolbar menu "Export PDF A4/A5" |
| `app/ui/src/components/UIElements/CSVExportButton.jsx` | Quick CSV export for data grids (client only) |
| `app/ui/src/util/http/export.jsx` | `fetchExport`, `uploadCustomTitle` |
| `app/ui/src/util/http/settings.jsx:48-66` | `fetchPdfDefaults`, `updatePdfSettings` |

### 4.2 API Endpoints

All routes are inside the `/api` group guarded by `app.Auth` (`app/routes.go:26-27`).

| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/api/export/{format}` | `HandlerApiExportLogbook` `app/handlers_export.go:93` | Route `app/routes.go:123`, no `Compress` middleware. `format` ∈ `A4`/`A5`. Loads records, settings and custom field definitions (`:96-112`). Response `application/pdf`, `Content-Disposition: attachment; filename=logbook.pdf` (`:171-172`). Documented in `README.md:348`, `README.md:360`, `README.md:369` |
| POST | `/api/export/custom-title` | `HandlerApiUploadCustomTitle` `app/handlers_export.go:38` | Route `app/routes.go:124`. Multipart: `document` (file), `id` (`custom_title_a4`/`_a5`). Returns `{ok:true,message:"Attachment has been uploaded"}` |
| GET | `/api/settings/export/defaults/{format}` | `HandlerApiSettingsExportDefaults` `app/handlers_settings.go:102` | Route `app/routes.go:87`. Returns default `ExportPDF` built from constants, with default headers and `table_profile.table_column_widths` only (no column order) (`internal/models/settings.go:70-83`) |
| PUT | `/api/settings/export/{format}` | `HandlerApiSettingsExportUpdate` `app/handlers_settings.go:108` | Route `app/routes.go:88`. Copies 16 fields incl. `page_breaks`, `table_profile` and `date_fields_format` (`:145-160`). The legacy `columns` block is **not** copied. For A4, `PAGE_DIVIDER` is removed from `table_columns` and `table_column_widths` (`:132-143`) |
| GET | `/api/settings/list` | `HandlerApiSettingsList` `app/handlers_settings.go:11` | The export page reads `export_a4`/`export_a5` from it |
| PUT | `/api/settings/general` | `HandlerApiSettingsUpdate` `app/handlers_settings.go:22` | Route `app/routes.go:84`. Owned by ARCHITECTURE_SETTINGS.md. Writes the PDF's non-layout inputs (owner name, license, address, signature text, previous experience). Restores `ExportA4`/`ExportA5` from the DB (`:36-38`), so it cannot change the layout |
| PUT | `/api/settings/signature` | `HandlerApiSettingsSignature` `app/handlers_settings.go:53` | Route `app/routes.go:85`. Owned by ARCHITECTURE_SETTINGS.md. Writes only `signature_image` (`:67`), the PNG drawn in the footer when `include_signature` is set |
| GET | `/api/attachment/{uuid}` | `HandlerApiGetAttachment` `app/handlers_attachments.go:42` | Route `app/routes.go:67`, wrapped in `middleware.Compress(5)`. Custom title preview. Returns `document: null` if no row exists (`internal/models/attachments.go:108-110`) |
| DELETE | `/api/attachment/{uuid}` | `HandlerApiDeleteAttachment` `app/handlers_attachments.go:55` | Route `app/routes.go:68`. Deletes the custom title |

### 4.3 Data Access

| File | Method | Purpose | Tables / views |
|---|---|---|---|
| `internal/models/flightrecords.go` | `GetFlightRecordsForExport` `:168-203` | 26 columns incl. `signature` and `custom_fields` (`:178`), `ORDER BY date desc, departure_time desc` (`:180`). Calls `processFlightrecord` | `logbook_view` |
| `internal/models/custom_fields.go` | `GetCustomFields` `:3-29` | All custom field definitions incl. `pdf_header`; no `ORDER BY` | `custom_fields` |
| `internal/models/flightrecords.go` | `CalculateTotals` `:4-24` | Pure function: sums times, sim time, landings, distance, CC | — |
| `internal/models/settings.go` | `GetSettings` `:11-28`, `UpdateSettings` `:31-68` | Read/write the whole settings JSON | `settings2` (`id=0`) |
| `internal/models/settings.go` | `GetPdfDefaults` `:70-83` | Defaults for `A4`/`A5` plus the default width map. Any other format → zero values + default headers | none |
| `internal/models/attachments.go` | `GetAttachmentByID` `:95-113` | Custom title blob. `sql.ErrNoRows` → empty struct, `nil` error | `attachments_view` |
| `internal/models/attachments.go` | `DeleteAttachment` `:75-83`, `InsertAttachmentRecord` `:64-72` | Replace the custom title row | `attachments` |
| `internal/models/attachments.go` | `GetAttachments` `:35-61` | Leaves custom titles out of the Attachments page (`:43`) | `attachments_view` |
| `internal/models/models_defaults.go` | `CheckDefaultValues` `:215-328` | At startup: if `LogbookRows == 0`, the whole format block is replaced by defaults (`:227-244`). If `table_profile.table_columns` is empty, it is set to the default order, the hidden list is cleared and `table_column_widths` is copied from the legacy `columns.col1..col23` (`:257-318`) | `settings2` |

### 4.4 UI

| Item | File | Notes |
|---|---|---|
| Routes `/export`, `/export/a4`, `/export/a5` | `app/ui/src/main.jsx:84-88` | `/export` index shows A4 |
| Sidebar "Export → PDF A4 / PDF A5" | `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:62-64` | |
| `PdfExport` | `app/ui/src/components/PdfExport/PdfExport.jsx:12-58` | `useSettings()` (`['settings']`, staleTime 1 h, `app/ui/src/hooks/useSettings.jsx:244-250`). Local `pdfSettings`; nested `handleChange(path, value)`. Left column: Page Settings + PDF Table Layout. Right column: Custom title page + Other Settings. All cards are `CollapsibleCard`s |
| `PageSettings` | `app/ui/src/components/PdfExport/PageSettings.jsx` | `PAGE_SETTINGS_CONFIG` `:16-26` (incl. `page_breaks`), `HEADERS_CONFIG` `:28-116`. Card actions: Export, Save, Restore defaults (`:137-143`). A header input is disabled when all its legacy `columns.colN` are 0 (`:182`, see §11 #21) |
| `PDFPageLayout` | `app/ui/src/components/PdfExport/PDFPageLayout.jsx` | Column editor. `allColumns` (`:50-122`): standard columns, custom fields slotted after their category (`matchCategoryKey` `:20-40`, via `useCustomFields`), A5 `PAGE_DIVIDER` (`:98-100`). `visibleColumns` (`:125-146`): saved order minus hidden, then unsaved standard columns; custom fields only when saved. Add/remove/reorder/width write `table_profile.*` (`:154-207`). Width caption warns above 297 mm (A4) or 210 mm per side (A5) (`:245-253`). Card actions: Restore columns, Save |
| `OtherSettings` | `app/ui/src/components/PdfExport/OtherSettings.jsx` | Switches `replace_sp_time`, `include_signature`, `is_extended`. Time format toggle 2/1/3 (`:49-66`). Date format toggle DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY (`:67-86`). Card action: Save |
| `SaveSettingsButton` | `app/ui/src/components/PdfExport/MenuButtons/SaveSettingsButton.jsx` | `parseInt` on `INT_FIELDS` (`:11-14`, includes margins and row heights), `parseFloat` on legacy col1–col23 (`:23-30`, ignored by the server), `Number` on `table_column_widths`, dropping empty values (`:32-38`). Invalidates `['settings']` (`:44`) |
| `RestoreDefaultsButton` | `app/ui/src/components/PdfExport/MenuButtons/RestoreDefaultsButton.jsx` | Sections page / headers. Updates local state only |
| `RestoreColumnsButton` | `app/ui/src/components/PdfExport/MenuButtons/RestoreColumnsButton.jsx` | Sets default widths, empties `table_columns` and `table_hidden_columns` in local state (`:19-23`) |
| `ExportButton` | `app/ui/src/components/PdfExport/MenuButtons/ExportButton.jsx` | `useMutation` → `fetchExport` → object URL → `<a download>` |
| `AddCustomTitleButton` / `DeleteCustomTitleButton` | `app/ui/src/components/PdfExport/MenuButtons/AddCustomTitleButton.jsx`, `app/ui/src/components/PdfExport/MenuButtons/DeleteCustomTitleButton.jsx` | Invalidate `['custom-title', format]`. Delete asks for confirmation (`useDialogs`) |
| `CustomTitlePreview` | `app/ui/src/components/PdfExport/CustomTitlePreview.jsx` | `useQuery(['custom-title', format])` → `fetchAttachment`, staleTime 1 h (`:26-33`). Detects the MIME type with `file-type` and shows a data-URL `<iframe>` |
| `PDFExportButton` | `app/ui/src/components/Logbook/PDFExportButton.jsx` | In the logbook toolbar `app/ui/src/components/Logbook/LogbookTable.jsx:316` |
| `CSVExportButton` | `app/ui/src/components/UIElements/CSVExportButton.jsx` | `exportMappers` keys: `aircrafts`, `categories`, `airports`, `custom-airports`, `licensing`, `logbook`, `totals-by-year`, `totals-by-aircraft`, `persons`, `person-flights` (`:29-150`) |

## 5. Data Model & Persistence

No table belongs to this system. Nothing is cached in memory: each export reads the DB and builds the PDF in memory inside fpdf.

`settings2.settings` JSON → `export_a4` / `export_a5` (`ExportPDF`, `internal/models/structs.go:200-221`):

| JSON key | Type | A4 default | A5 default | Notes |
|---|---|---|---|---|
| `logbook_rows` | int | 23 | 20 | `internal/models/models_defaults.go:130`, `:140` |
| `fill` | int | 3 | 3 | Row is grey when `rowCounter % fill == 0` (`internal/pdfexport/pdfexport.go:341`) |
| `left_margin` | float mm | 10.0 | 0 | A4 only |
| `left_margin_a` / `left_margin_b` | float mm | 0 | 6.0 / 14.0 | A5 only |
| `top_margin` | float mm | 30.0 | 9.0 | |
| `body_row_height` / `footer_row_height` | float mm | 5.0 / 6.0 | 5.0 / 5.0 | |
| `page_breaks` | string `"X,Y"` | `""` | `""` | Saved by the PUT handler since #568 (`app/handlers_settings.go:154`) |
| `table_profile.table_columns` | []string | `pdfA4TableColumns` `internal/models/models_defaults.go:149-153` | `pdfA5TableColumns` `:155-159` (with `PAGE_DIVIDER` after `land_night`) | Column order; ids of §2 plus `custom_fields.<uuid>` and `PAGE_DIVIDER`. `omitempty`: an empty list is not stored (`internal/models/structs.go:236`) |
| `table_profile.table_hidden_columns` | []string | `[]` | `[]` | Removed from the layout |
| `table_profile.table_column_widths` | map id → mm | `pdfA4TableColumnWidth` `internal/models/models_defaults.go:161-185` | `pdfA5TableColumnWidth` `:187-211` | Missing or `<= 0` → 11.2 mm (`internal/pdfexport/layout.go:14`, `:233-238`) |
| `table_profile.fields_visibility`, `.flight_record_layout` | — | — | — | Part of the shared `Profile` type (`internal/models/structs.go:233-239`, also used by `logbook_profile`); not read by the PDF |
| `columns.col1..col23` | float mm | `internal/models/models_defaults.go:75-99` | `:102-126` | **Legacy.** Not read by the renderer and not written by the PUT handler. Read only by the startup migration (`internal/models/models_defaults.go:257-318`) and the UI header-disable check (§11 #21) |
| `headers.*` (31 keys) | string | `pdfDefaultHeaders` `internal/models/models_defaults.go:4-36` | same | `ColumnsHeader` also has `tags`, which the PDF does not use. Keys are the JSON tags (`internal/models/structs.go:165-198`) and double as the label/category keys of `standardColumns` |
| `replace_sp_time`, `include_signature`, `is_extended` | bool | false | false | |
| `time_fields_auto_format` | byte | 0 (rendered as H:MM) | 0 | UI shows `0` as H:MM (`app/ui/src/components/PdfExport/OtherSettings.jsx:55`) |
| `date_fields_format` | string | `""` (rendered DD/MM/YYYY) | `""` | UI shows `""` as DD/MM/YYYY (`app/ui/src/components/PdfExport/OtherSettings.jsx:74`) |
| `custom_title` | string | — | — | Not read anywhere (§11 #15) |
| `CustomTitleBlob` | []byte | — | — | No JSON tag. Filled only at export time (`app/handlers_export.go:148`) |

Other inputs:

| Source | Fields | Evidence |
|---|---|---|
| `settings2` (top level) | `owner_name`, `license_number`, `address`, `signature_text`, `signature_image` (PNG data URL), `previous_experience.*` | `internal/models/structs.go:243-247`, `:276-292`, `app/handlers_export.go:130-153` |
| `attachments` | Rows `uuid = record_id = custom_title_a4 \| custom_title_a5`, `document_name`, `document` (BLOB / MySQL LONGBLOB) | `internal/driver/db_structure.go:95-100`, `:14` |
| `logbook_view` | The columns of `GetFlightRecordsForExport`. `signature` = per-flight PNG data URL (`IFNULL(signature,'')`). `custom_fields` = JSON object `{"<uuid>": value}` (`IFNULL(custom_fields,'{}')`); the parser also accepts `custom_fields.<uuid>` keys and an array of `{uuid\|id, value}` (`internal/pdfexport/layout.go:427-447`) | `internal/driver/db_structure.go:165-224`, `:181`, `:52` |
| `custom_fields` | `uuid`, `name`, `category`, `type`, `pdf_header` (column label, `NOT NULL DEFAULT ''`) | `internal/driver/db_structure.go:134-142`, `internal/models/structs.go:366-374` |

Engine differences: none in this system's SQL. `logbook.signature` and `settings2.settings` are `FullText` = `TEXT` on both engines (`internal/driver/db_structure.go:10`), see §11 #17.

## 6. Data Flow

| Operation | Path |
|---|---|
| Export PDF | `ExportButton` / `PDFExportButton` → `fetchExport` (`app/ui/src/util/http/export.jsx:5-13`, Bearer header, `returnJson=false` → blob) → `GET /api/export/{format}` → `Auth` → `HandlerApiExportLogbook`: `GetFlightRecordsForExport` (`logbook_view`) → `GetSettings` (`settings2`) → `GetCustomFields` (`custom_fields`, `app/handlers_export.go:108-112`) → map previous experience into a `FlightRecord` (`:130-143`) → `GetAttachmentByID("custom_title_<fmt>")` (error ignored, `:147`) → `NewPDFExporter` (`:150-153`), `pdfExporter.CustomFields = customFields` (`:155`) → set headers → `ExportA4`/`ExportA5`: `initPDF` → `buildLayout` → title → rows → `Output(w)` → UI `createObjectURL` → `<a download="logbook-<fmt>.pdf">` |
| Save layout | `SaveSettingsButton.onSave` (`app/ui/src/components/PdfExport/MenuButtons/SaveSettingsButton.jsx:50-62`) → `updatePdfSettings` (`app/ui/src/util/http/settings.jsx:58-66`) → `PUT /api/settings/export/{format}` → `HandlerApiSettingsExportUpdate` → `GetSettings` → (A4: strip `PAGE_DIVIDER`) → copy fields → `UpdateSettings` (`UPDATE settings2`, `authCache.Clear()`) → UI invalidates `['settings']` → `PdfExport` effect resets local state from the server (`app/ui/src/components/PdfExport/PdfExport.jsx:16-21`) |
| Restore defaults | `RestoreDefaultsButton` / `RestoreColumnsButton` → `fetchPdfDefaults` (`app/ui/src/util/http/settings.jsx:48-56`) → `GET /api/settings/export/defaults/{format}` → `GetPdfDefaults` (constants) → `handleChange` into local state |
| Upload custom title | `AddCustomTitleButton` builds `FormData{document, id}` (`app/ui/src/components/PdfExport/MenuButtons/AddCustomTitleButton.jsx:28-30`) → `uploadCustomTitle` (`app/ui/src/util/http/export.jsx:15-23`) → `POST /api/export/custom-title` → `ParseMultipartForm(32<<20)` → `validateCustomTitlePdf` (gofpdi imports page 1, `recover()` turns a panic into an error, `app/handlers_export.go:21-35`) → `DeleteAttachment(id)` → `InsertAttachmentRecord` → UI invalidates `['custom-title', format]` |
| Preview / delete custom title | `CustomTitlePreview` → `fetchAttachment` → `GET /api/attachment/custom_title_<fmt>` → `GetAttachmentByID` → base64 `document` → data URL iframe. Delete: `deleteAttachment` → `DELETE /api/attachment/{id}` |
| Quick CSV | `CSVExportButton.handleCSVExport` (`app/ui/src/components/UIElements/CSVExportButton.jsx:167-180`): sorted row ids minus `state.filter.filteredRowsLookup` keys → `exportMappers[type]` → `export-to-csv` `mkConfig/generateCsv/download` with `filename: type` (`:152-162`). Times go through `formatTimeField(minutes, settings.time_fields_auto_format)` (`app/ui/src/util/helpers.jsx:4-23`). No backend call |

## 7. Config & Constants

| Name | Value | Location | Kind |
|---|---|---|---|
| Page orientation / unit | landscape `"L"`, `"mm"`, `"A4"`/`"A5"` | `internal/pdfexport/pdfexport.go:182-187` | hardcoded |
| Auto page break margin | `true`, 5 mm | `internal/pdfexport/pdfexport.go:190` | hardcoded |
| Line width | 0.2 | `internal/pdfexport/pdfexport.go:205` | hardcoded |
| Fonts | `LiberationSansNarrow-Bold`, `-Regular`, `B612Mono-Regular` | `internal/pdfexport/pdfexport.go:24-28` | hardcoded |
| Font sizes | header/body 8, signature 6, page number 6, title 20, title info 15 | `internal/pdfexport/pdfexport.go:62-69` | hardcoded |
| Remarks shrink | `> 0.9w` → 6 pt, `> 1.35w` → 5 pt, `> 1.575w` → truncate + `...` (byte count `len(value)` vs mm width) | `internal/pdfexport/pdfexport.go:445-461` | hardcoded |
| Colors | header fill 217,217,217; body fill 228,228,228; text black | `internal/pdfexport/pdfexport.go:56-59` | hardcoded |
| Labels | `PILOT LOGBOOK`, `HOLDER'S NAME:`, `LICENSE NUMBER:`, `ADDRESS:`, `TOTAL THIS PAGE`, `TOTAL FROM PREVIOUS PAGES`, `TOTAL TIME`, `✓`, `Date` (extended FSTD), `page %d` | `internal/pdfexport/pdfexport.go:31-43`, `:71`, `internal/pdfexport/layout.go:344`, `internal/pdfexport/pdfexport.go:553` | hardcoded |
| Title page coordinates | A4 title (95,60), info (65,150/157/164); A5 title (55,60), info (25,100/107/114) | `internal/pdfexport/pdfexport.go:251-264` | hardcoded |
| Custom title placement | page sizes A4 210×297, A5 148×210; landscape y-offset −87 (A4) / −62 (A5) | `internal/pdfexport/pdfexport.go:295-310` | hardcoded |
| Default column width | 11.2 mm for a column with no saved width or a width `<= 0` | `internal/pdfexport/layout.go:14`, `:233-238` | hardcoded |
| A5 split marker | `PAGE_DIVIDER` in `table_columns`; fallback split before `night` | `internal/pdfexport/layout.go:495-508` | configurable (A5 column layout in UI) |
| Date formats | `DD/MM/YYYY` (default and fallback), `YYYY-MM-DD`, `MM/DD/YYYY` | `internal/pdfexport/pdfexport.go:583-596` | configurable (per format, in UI) |
| Header row geometry | group numbers h=5 at `top-1`, group headers h=12 at `top+2` (text `top+3`), sub-headers h=4 at `top+10` (text `top+11`); A4 body starts at `top+14`, A5 1 mm below the last header text | `internal/pdfexport/pdfexport_a4.go:52-85`, `internal/pdfexport/pdfexport_a5.go:117-151` | hardcoded |
| Layout defaults | see §5 table | `internal/models/models_defaults.go:128-211` | configurable (per format, in UI) |
| Page width warning (UI only) | A4 297 mm total; A5 210 mm per side | `app/ui/src/components/PdfExport/PDFPageLayout.jsx:245-253` | hardcoded |
| Upload memory limit | `32 << 20` (32 MiB in memory; the rest spills to temp files) | `app/handlers_export.go:39` | hardcoded |
| DB query timeout | 60 s | `internal/models/helpers.go:14` | hardcoded |
| HTTP server timeouts | none set | `app/main.go:53-60` | hardcoded |
| Download filename | server `logbook.pdf`; UI overrides with `logbook-<format>.pdf` | `app/handlers_export.go:120`, `app/ui/src/components/PdfExport/MenuButtons/ExportButton.jsx:21` | hardcoded |
| CSV options | `,` separator, `.` decimal, keys as headers, filename = mapper key | `app/ui/src/components/UIElements/CSVExportButton.jsx:21-26`, `:159` | hardcoded |

## 8. Error Handling & Edge Cases

| Case | Behaviour | Evidence |
|---|---|---|
| DB error loading records/settings/custom fields | `handleError` → 500 JSON `{ok:false,message:<error>}`. The UI toast shows that server message (`error.info.message`). "Failed to export PDF" is only the last fallback | `app/handlers_export.go:96-112`, `app/helpers.go:37-43`, `app/helpers.go:53-63`, `app/ui/src/util/http/http.jsx:20-21`, `app/ui/src/hooks/useAppNotifications.jsx:9` |
| Format other than `A4`/`A5` (e.g. `a4`) | `exportFunc` stays `nil` → nil function call panics. No Recoverer middleware, so `net/http` drops the connection | `app/handlers_export.go:115-174`, `app/routes.go:9-27` |
| Exporter error after headers set | `handleError` rewrites Content-Type to JSON. If fpdf already wrote bytes, the body is corrupt | `app/handlers_export.go:171-177` |
| No custom title / lookup error | Error ignored. The built-in title page is used | `app/handlers_export.go:147`, `internal/pdfexport/pdfexport.go:266` |
| Owner signature not valid base64 | Printed via `fmt.Println`. Export continues without the image | `internal/pdfexport/pdfexport.go:198-203`, `:227-241` |
| Per-flight signature not valid base64 | Error discarded. Row printed without the image | `internal/pdfexport/pdfexport.go:466-472` |
| Custom-field JSON in an unknown shape | Printed via `fmt.Printf`. The row's custom-field cells stay empty | `internal/pdfexport/layout.go:427-449` |
| Saved column id no longer exists (deleted custom field, `PAGE_DIVIDER` in A4) | Silently dropped from the layout | `known` `internal/pdfexport/layout.go:255-264` |
| Remarks hidden | No signature block: no `signature_text`, owner name or signature image in the footer, because only the `remarks` column triggers it | `internal/pdfexport/pdfexport.go:644-645` |
| First visible column has a footer total (e.g. `total` moved to the front) | The label area is empty, so no `TOTAL THIS PAGE` / … label is printed (zero-width cell skipped) | `internal/pdfexport/pdfexport_a4.go:182-189`, `internal/pdfexport/pdfexport.go:628-637`, `:380-383` |
| A5 with ME on page B | ME is zeroed for MCC rows only in the page A pass, so page B shows the original ME while totals use the zeroed value | `internal/pdfexport/pdfexport_a5.go:226-228`, `:247-259` |
| Empty owner name/license/address | That title line is skipped | `internal/pdfexport/pdfexport.go:284-289` |
| Zero records | A4: title + one empty page with footers (previous experience totals). A5: title + page A header only | `internal/pdfexport/pdfexport_a4.go:23-37`, `internal/pdfexport/pdfexport_a5.go:24-25`, `:68` |
| Custom title upload without a file | `no such file` is tolerated: old title deleted, an empty row inserted | `app/handlers_export.go:52-57`, `:77-87` |
| Custom title that gofpdi cannot parse | Validation panic recovered → 500 "this PDF file is not supported by pdf library" | `app/handlers_export.go:22-26` |
| Rows overflow page height | fpdf auto page break (5 mm) adds a page mid-table and breaks the layout | `internal/pdfexport/pdfexport.go:190` |
| Columns wider than the page | Not fitted (`fitLayoutToPage` is commented out, §11 #26). The UI only colours the width caption | `internal/pdfexport/layout.go:364`, `app/ui/src/components/PdfExport/PDFPageLayout.jsx:245-253` |
| `fill = 0` | Integer modulo by zero panic | `internal/pdfexport/pdfexport.go:341` |
| `logbook_rows = 0` | A4: one row per page. A5: one row per page A, page B empty. At next startup the whole format block is reset to defaults | `internal/pdfexport/pdfexport_a4.go:101`, `internal/pdfexport/pdfexport_a5.go:238`, `internal/models/models_defaults.go:227-244` |
| Page-break list with spaces (`"10, 20"`) | No `TrimSpace`. `" 20"` never matches the page counter | `internal/pdfexport/pdfexport.go:170`, `:559` |
| Export uses saved settings | Unsaved edits on screen are ignored: `fetchExport` sends only the format | `app/ui/src/util/http/export.jsx:5-13`, `app/handlers_export.go:102-128` |
| CSV with no visible rows / unknown type | Silent no-op | `app/ui/src/components/UIElements/CSVExportButton.jsx:153-156` |

## 9. Integration Points

| Doc | What crosses the boundary |
|---|---|
| `ARCHITECTURE_SETTINGS.md` | `export_a4`/`export_a5` blocks incl. `table_profile` and `date_fields_format`, defaults and the startup table-profile migration (`internal/models/models_defaults.go`, `GetPdfDefaults`, `CheckDefaultValues`), `HandlerApiSettingsExportUpdate`, owner name / license / address / signature text / signature image, previous experience, the shared `Profile` type (also `logbook_profile`), React Query key `['settings']` read through `useSettings` (`app/ui/src/hooks/useSettings.jsx:244-250`) |
| `ARCHITECTURE_LOGBOOK.md` | Records come from `GetFlightRecordsForExport` and `CalculateTotals` in `internal/models/flightrecords.go`. Custom field definitions (`GetCustomFields`, `pdf_header`, category, type) and the per-record `custom_fields` JSON become PDF columns (`internal/pdfexport/layout.go:297-329`); the UI column editor reads them through `useCustomFields` (`['custom-fields']`, `app/ui/src/hooks/useCustomFields.jsx:21`). Per-flight signature set via `PUT /api/logbook/{uuid}/signature` (`app/routes.go:39`). `PDFExportButton` and the `logbook` CSV export sit in the logbook toolbar (`app/ui/src/components/Logbook/LogbookTable.jsx:315-316`) |
| `ARCHITECTURE_CURRENCY_LICENSING.md` | The custom title is an `attachments` row. Preview and delete reuse `/api/attachment/{uuid}`. `GetAttachments` hides `custom_title_a4/a5` |
| `ARCHITECTURE_DATABASE.md` | `logbook_view`, `attachments_view`, `settings2`, `attachments` definitions, `DefaultTimeout`, ISO `YYYY-MM-DD` dates since the v5 overhaul (`internal/driver/data_overhaul.go:14-15`) |
| `ARCHITECTURE_APPLICATION.md` | Routing (`app/routes.go:122-125`), `handleError`/`writeOkResponse`, no panic recovery |
| `ARCHITECTURE_AUTH.md` | `Auth` middleware (`app/handlers_auth.go:112`). The UI adds `Authorization: Bearer` in `fetchExport`/`uploadCustomTitle` |
| `ARCHITECTURE_FRONTEND.md` | `handleFetch` (`app/ui/src/util/http/http.jsx:13-31`), `queryClient`, `useErrorNotification`/`useSuccessNotification` (`app/ui/src/hooks/useAppNotifications.jsx`), `XDataGrid` toolbar `customActions`, shared `CollapsibleCard` and `SortableColumnList` UI elements (`app/ui/src/components/UIElements/CollapsibleCard.jsx`, `app/ui/src/components/UIElements/SortableColumnList.jsx`) |
| `ARCHITECTURE_STATS_AND_MAP.md` | `totals-by-year`, `totals-by-aircraft` CSV mappers |
| `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` | `aircrafts`, `categories`, `airports`, `custom-airports` CSV mappers |
| `ARCHITECTURE_PERSONS.md` | `persons`, `person-flights` CSV mappers |
| `ARCHITECTURE_IMPORT.md` | CSV import is separate. `README.md:323` suggests CSV export → import to move from SQLite to MySQL. Round-trip compatibility: Not found in code |

## 10. Testing

| Area | Tests |
|---|---|
| `internal/pdfexport` | `internal/pdfexport/layout_test.go`: `TestMatchStandardCategory` (table-driven, `:10-41`), `TestA4IgnoresPageDivider` (`:43-64`), `TestA5RetainsPageDividerForSplit` (incl. `splitLayoutAtDivider`, `:66-106`), `TestExportA4Smoke` / `TestExportA5Smoke` (one record into a `bytes.Buffer`, checks the `%PDF` prefix, `:108-177`) |
| `app/handlers_export.go` | None (the former handlers_export_test.go was deleted in commit a46e936) |
| `GetFlightRecordsForExport`, `CheckDefaultValues` table-profile migration | None |
| UI `components/PdfExport`, `CSVExportButton` | None. The only JS tests are `app/ui/src/hooks/*.test.jsx`, `app/ui/src/hooks/useLocalStorageState/useStorageState.test.tsx`, `app/ui/src/components/Currency/helpers.test.jsx` |

How to run: `make test` (`Makefile:32-33`, `go test -v ./... -coverpkg=./...`; needs `make build_ui` first so that `app/ui/dist` exists). UI: `npm run test:run` in `app/ui` (`app/ui/package.json:12`).

Gaps worth filling first:
- Table tests for `formatTimeFieldOptions` (codes 0–3, zero, negative) and `formatDate` (three formats, empty, unknown format, non-ISO input).
- `buildLayout` with hidden columns, zero widths, custom fields of each type, `IsExtended` (with and without `sim_type`), and `groupCustomFieldsByCategory`.
- Smoke tests for `ExportA4`/`ExportA5` with 0, N and k×`LogbookRows` records and a custom-field column; for A5 assert that padding rows have empty custom cells (§11 #20).
- `CheckDefaultValues` migration: legacy widths, zero widths, empty `table_columns` (§11 #21, #22).
- A mapper test for `exportMappers` that checks the field names against the row JSON.

## 11. Known Issues & Tech Debt

| # | Issue | Location | Status (Confirmed/Suspected) | Severity | verified: 2026-11-08 |
|---|---|---|---|---|---|
| 1 | ~~Page breaks cannot be saved.~~ **Fixed in 9bb8263 (#568):** the PUT handler now copies `PageBreaks`. The general settings save still restores the stored export blocks, which is intended | `app/handlers_settings.go:154`, `app/handlers_settings.go:36-38`, `app/ui/src/components/PdfExport/PageSettings.jsx:25` (ARCHITECTURE_SETTINGS.md §11 #1 describes the old behaviour) | Fixed: `targetExport.PageBreaks = updated.PageBreaks` | — | verified: 2026-11-08 |
| 2 | ~~The Night-landings body cell uses the Day-landings width.~~ **Fixed in 9bb8263 (#568):** every column, including `land_day` and `land_night`, is its own `pdfColumn` with its own width | `internal/pdfexport/layout.go:86-87`, `:291` | Fixed: no shared width arrays remain | — | verified: 2026-11-08 |
| 3 | No validation of the numeric layout fields. An empty or 0 `fill` → `rowCounter % 0` runtime panic (connection dropped). `logbook_rows = 0` → one row per page, and at the next startup `CheckDefaultValues` resets the whole format block (headers, widths, flags, table profile) | `internal/pdfexport/pdfexport.go:341`, `app/ui/src/components/PdfExport/MenuButtons/SaveSettingsButton.jsx:18`, `app/handlers_settings.go:145-146`, `internal/models/models_defaults.go:227-244` (no panic recovery: ARCHITECTURE_APPLICATION.md §11 #19) | Confirmed: the UI sends `parseInt('')\|\|0`, the server copies it unchanged, and Go panics on integer modulo by zero | MINOR | verified: 2026-11-08 |
| 4 | **PDF part fixed in 9bb8263 (#568):** the `date` column is formatted with the per-format `date_fields_format` (§2). Still open: the extended FSTD date (§11 #23) and the Quick CSV date columns (`logbook` `Date`, `licensing` `Issued`/`Valid From`/`Valid Until`, `person-flights` `Date`) print the stored ISO `YYYY-MM-DD`, ignoring the user's `date_fields_format` | `internal/pdfexport/pdfexport.go:577-599`, `app/ui/src/components/UIElements/CSVExportButton.jsx:72`, `:65-67`, `:142`, `app/ui/src/hooks/useSettings.jsx:306`, `internal/driver/data_overhaul.go:14-15` | Confirmed (CSV): the mappers copy `row.date` / `row.issued` / `row.valid_until` unchanged | MINOR | verified: 2026-11-08 |
| 5 | Margins and row heights are truncated to integers on save (`parseInt`), though the backend fields are `float64`. A row height of 4.5 is saved as 4. Column widths are not affected (`Number`) | `app/ui/src/components/PdfExport/MenuButtons/SaveSettingsButton.jsx:11-14`, `:53`, `:32-38`, `internal/models/structs.go:203-208` | Confirmed | MINOR | verified: 2026-11-08 |
| 6 | The "PDF Exported successfully" toast fires when the export **starts** (`isSuccess: isExporting`), even if it later fails | `app/ui/src/components/PdfExport/MenuButtons/ExportButton.jsx:29`; same bug in the logbook toolbar: ARCHITECTURE_LOGBOOK.md §11 #11 | Confirmed: `isPending` is passed as `isSuccess` | MINOR | verified: 2026-11-08 |
| 7 | A4 adds a fully empty page (empty rows + repeated totals) when the record count is an exact multiple of `logbook_rows`. A5 guards against this | `internal/pdfexport/pdfexport_a4.go:101-123`, `:31-37` | Confirmed: `logBookRow` always prints the next header after a full page, then the padding loop fills it | MINOR | verified: 2026-11-08 |
| 8 | An unknown `{format}` crashes the request: nil `exportFunc` call on export, nil `targetExport` dereference on settings PUT. Latent: `pdfExporter.CustomFields` is assigned before the `NewPDFExporter` error check, so an exporter error would be a nil dereference instead of a 500 (unreachable today, the format is already checked by the `switch`) | `app/handlers_export.go:174`, `:155-160`, `app/handlers_settings.go:124-130`, `:145` (also ARCHITECTURE_SETTINGS.md §11 #8, RULE_DEVELOPMENT.md §13 #5; root cause ARCHITECTURE_APPLICATION.md §11 #19) | Confirmed: there is no `default` branch and no Recoverer middleware (`app/routes.go:9-27`) | MINOR | verified: 2026-11-08 |
| 9 | The custom title upload trusts the client `id`, so it can delete and replace **any** attachment by uuid; the re-inserted row gets `record_id = uuid` and loses its flight link. A request with no `document` part replaces the row with an empty one, because `validateCustomTitlePdf` runs only in the file branch. Delete + insert is not atomic: if the insert fails, the old title is lost | `app/handlers_export.go:46-49`, `:52-74`, `:77-87` (also ARCHITECTURE_CURRENCY_LICENSING.md §11 #21) | Confirmed: no allow-list for `custom_title_a4/a5`, no transaction | MINOR | verified: 2026-11-08 |
| 10 | Remarks truncation counts and cuts **bytes** (`len`, `value[:longCut-3]`). This can split a multi-byte UTF-8 character. A positive column width below ~2.22 mm (`int(0.9·w) <= 1`) gives `longCut < 3` → slice-bounds panic for any remark longer than `longCut` bytes | `internal/pdfexport/pdfexport.go:445-452` | Confirmed (code). How fpdf renders the invalid UTF-8 has not been checked | MINOR | verified: 2026-11-08 |
| 11 | The Co-Pilot column in the `totals-by-year` and `totals-by-aircraft` CSVs reads `row.time.copilot_time`, but the rows carry `co_pilot_time` → `NaN:NaN`/`NaN` | `app/ui/src/components/UIElements/CSVExportButton.jsx:107`, `:125`, `app/ui/src/util/helpers.jsx:53-57` (also ARCHITECTURE_STATS_AND_MAP.md §11 #3) | Confirmed: `formatTimeField(undefined)` yields NaN strings. This predates v5 | MINOR | verified: 2026-11-08 |
| 12 | The `custom-airports` CSV has no airport code column. Since #560, `row.name` is the full name and the code is in `row.icao` | `app/ui/src/components/UIElements/CSVExportButton.jsx:52-59`, `internal/models/airports.go:138` | Confirmed | MINOR | verified: 2026-11-08 |
| 13 | Zero-width columns are mostly gone: hidden columns are removed from the layout and non-positive widths fall back to 11.2 mm. Remaining case: the extended format subtracts the Date width from Remarks, so a Remarks column narrower than the Date column gets a width `<= 0`. The body cell is skipped, but the header `Rect`/`MultiCell` and `printFooterSignatureBlock` have no guard | `internal/pdfexport/layout.go:356-360`, `:233-238`, `internal/pdfexport/pdfexport.go:441-443`, `:502-539`, `internal/pdfexport/pdfexport_a4.go:64-66` | Suspected: confirm by exporting with `is_extended` and a Remarks width below the Date width, then inspecting header and footer | MINOR | verified: 2026-11-08 |
| 14 | Errors are swallowed or printed to stdout instead of `errorLog`: owner-signature errors use `fmt.Println`, per-flight signature decode errors are assigned and dropped, unparsable custom-field JSON uses `fmt.Printf`, and `GetAttachmentByID` errors are ignored | `internal/pdfexport/pdfexport.go:202`, `:468-471`, `internal/pdfexport/layout.go:449`, `app/handlers_export.go:147` | Confirmed | MINOR | verified: 2026-11-08 |
| 15 | Dead code and fields. `DBModel.UpdateDefaults` was **removed in 9bb8263** (file internal/models/export.go deleted). Still open: `ExportPDF.CustomTitle` is never read; `CustomTitleBlob` has no `json:"-"`, so a `"CustomTitleBlob"` key is serialized into the settings JSON; the legacy `columns` block is still sent by the UI but ignored by the server | `internal/models/structs.go:217-218`, `app/ui/src/components/PdfExport/MenuButtons/SaveSettingsButton.jsx:54`, `app/handlers_settings.go:145-160` (also ARCHITECTURE_SETTINGS.md §11 #18) | Confirmed by repo-wide grep | MINOR | verified: 2026-11-08 |
| 16 | Only page 1 of a custom title PDF is validated. `printCustomTitle` imports every page with no `recover`, so a later page gofpdi cannot parse would panic during export | `app/handlers_export.go:21-35`, `internal/pdfexport/pdfexport.go:312-336` | Suspected: confirm with a multi-page PDF whose later page uses features gofpdi does not support | MINOR | verified: 2026-11-08 |
| 17 | Signature PNG data URLs are stored in `TEXT` columns (`logbook.signature`, `settings2.settings`). On MySQL, TEXT holds at most 64 KB, so a large signature could fail to save or be truncated, which breaks the PDF signature image. `settings2.settings` now also carries both table profiles | `internal/driver/db_structure.go:10`, `:52`, `:79` | Suspected: confirm on MySQL with a signature data URL > 64 KB | MINOR | verified: 2026-11-08 |
| 18 | Test coverage is thin. Since #568 `internal/pdfexport/layout_test.go` covers category matching, the A4/A5 `PAGE_DIVIDER` rules and one-record smoke exports. No tests for the export handlers, time/date formatting, the table-profile migration, custom-field cells/totals or the CSV mappers | §10 | Confirmed | MINOR | verified: 2026-11-08 |
| 19 | Quick CSV omits custom-field columns. The `logbook`, `totals-by-year` and `totals-by-aircraft` mappers export fixed keys only, although those grids show custom-field columns (`createCustomFieldColumns` in the logbook, `buildCustomFieldColumns` in stats) | `app/ui/src/components/UIElements/CSVExportButton.jsx:71-133`, `app/ui/src/components/Logbook/helpers.jsx:104-117`, `app/ui/src/components/Stats/helpers.jsx:111-116` (stats part also ARCHITECTURE_STATS_AND_MAP.md §11 #3) | Confirmed: no `custom_fields` access in any mapper | MINOR | verified: 2026-11-08 |
| 20 | A5 padding rows repeat the last record's custom-field values. The page A and page B padding rows call `printA5LogbookBody*` with an empty record, but `p.rowCustom` still holds the last loaded record, and custom-field body funcs read `p.rowCustom`, not the record. Empty rows on the last A5 page therefore print another flight's custom values. A4 is not affected (it reloads per body row) | `internal/pdfexport/pdfexport_a5.go:69-72`, `:84-87`, `:262-277`, `internal/pdfexport/layout.go:310-328`; A4 `internal/pdfexport/pdfexport_a4.go:130` | Confirmed: `loadRowCustomFields` is only called from `logBookRowA` / `logBookRowB` (`internal/pdfexport/pdfexport_a5.go:233`, `:252`) | MAJOR | verified: 2026-11-08 |
| 21 | A width of 0 no longer hides a column, but the UI still treats it as hidden. `widthOf` turns `<= 0` into 11.2 mm, while the UI shows `0` and counts 0 mm in the width caption. The startup migration copies the legacy `col1..col23` widths (zeros included) and clears the hidden list, so columns a pilot hid with 0 mm before the upgrade reappear at 11.2 mm. `PageSettings` still disables a header input when its legacy `columns.colN` are 0 | `internal/pdfexport/layout.go:233-238`, `internal/models/models_defaults.go:257-318`, `app/ui/src/components/PdfExport/PDFPageLayout.jsx:120`, `:213-215`, `app/ui/src/components/PdfExport/PageSettings.jsx:182` | Confirmed by reading the migration and `widthOf` | MINOR | verified: 2026-11-08 |
| 22 | "Restore columns" followed by Save stores an empty `table_columns`, which `omitempty` drops. At the next startup `CheckDefaultValues` sees an empty list and runs the migration again: the order is reset and **`table_column_widths` is overwritten** with the legacy `col1..col23` values, discarding the widths just saved | `app/ui/src/components/PdfExport/MenuButtons/RestoreColumnsButton.jsx:21-22`, `app/handlers_settings.go:159`, `internal/models/structs.go:236`, `internal/models/models_defaults.go:257-318` | Confirmed: any reorder, add or remove fills `table_columns` again and avoids it (`app/ui/src/components/PdfExport/PDFPageLayout.jsx:164`, `:174`, `:190`) | MINOR | verified: 2026-11-08 |
| 23 | Extended format: the FSTD `sim_date` column prints the raw ISO date, because `formatDate` is applied only to the `date` field. Remarks is also reduced by the Date width when `sim_type` is hidden and no `sim_date` column was inserted | `internal/pdfexport/layout.go:346-350`, `:340-361`, `internal/pdfexport/pdfexport_a4.go:141-143`, `internal/pdfexport/pdfexport_a5.go:288-290` | Confirmed | MINOR | verified: 2026-11-08 |
| 24 | Custom `number` fields are truncated to integers in body cells and totals (`strconv.Atoi`, else `int(ParseFloat)`), so `1.5` prints as `1` | `internal/pdfexport/layout.go:316-326`, `:452-464`, `:467-476` | Confirmed | MINOR | verified: 2026-11-08 |
| 25 | The PDF column order can differ from the order shown in the UI. `groupCustomFieldsByCategory` moves a custom field behind the last standard column of its category; the UI list does not. In A5 this can move a column across `PAGE_DIVIDER`, so the UI's left/right width sums no longer match the PDF | `internal/pdfexport/layout.go:171-231`, `:334-337`, `app/ui/src/components/PdfExport/PDFPageLayout.jsx:125-146`, `:209-215` | Confirmed: the comment at `internal/pdfexport/layout.go:241` says the rules mirror the UI, but only the Go side regroups | MINOR | verified: 2026-11-08 |
| 26 | Width fitting is **commented out, currently disabled**: `// p.fitLayoutToPage()`. No function of that name exists. A layout wider than the page is printed past the edge | `internal/pdfexport/layout.go:364` | Confirmed (Rule A: commented out) | MINOR | verified: 2026-11-08 |

## 12. Rules for Future Development

**Recipe A — add a new export option (bool or number) to `ExportPDF`**
1. Add the field with a JSON tag to `ExportPDF` (`internal/models/structs.go:200-221`).
2. Add it to the copy list in `HandlerApiSettingsExportUpdate` (`app/handlers_settings.go:145-160`). Otherwise it is silently dropped, as `page_breaks` was before #568.
3. Add a default to `pdfA4Defaults`/`pdfA5Defaults` (`internal/models/models_defaults.go:129-147`). Existing DBs keep the zero value, because `CheckDefaultValues` only fills a format block when `LogbookRows == 0`.
4. UI: add a control in `app/ui/src/components/PdfExport/OtherSettings.jsx` or `PAGE_SETTINGS_CONFIG` (`app/ui/src/components/PdfExport/PageSettings.jsx:16-26`). Integer fields go in `INT_FIELDS` (`app/ui/src/components/PdfExport/MenuButtons/SaveSettingsButton.jsx:11-14`), which is always parsed with `parseInt` (`:53`). For mm values, add a `FLOAT_FIELDS` list parsed with `parseFloat`. None exists yet; moving the margins and row heights there also fixes §11 #5. For page-section fields, add the key to `PageSettingsFields` (`app/ui/src/components/PdfExport/MenuButtons/RestoreDefaultsButton.jsx:17-20`).
5. Read it in `internal/pdfexport` through `p.Export.<Field>`. Apply it in **both** `internal/pdfexport/pdfexport_a4.go` and `internal/pdfexport/pdfexport_a5.go`, or once in `buildLayout` (`internal/pdfexport/layout.go:242-365`) if it changes columns.

**Recipe B — print a new standard logbook field as a column**
Custom fields need no code: any custom field can be added in the UI column editor and is rendered by `buildLayout` (`internal/pdfexport/layout.go:297-329`). For a new **standard** column:
1. Add it to the SELECT and `Scan` in `GetFlightRecordsForExport` (`internal/models/flightrecords.go:172-194`). If it is not in `logbook_view`, change the view for **both** engines in `internal/driver/db_structure.go:165-224` and bump `schemaVersion` (`:4`). If the field is new to the logbook, also add a `logbookTable` column with a both-engine `ColumnType` (`internal/driver/db_structure.go:23-53`) and a `FlightRecord` field (`internal/models/structs.go:25-78`); the logbook side is described in ARCHITECTURE_LOGBOOK.md.
2. Add a header key to `ColumnsHeader` (`internal/models/structs.go:165-198`); its JSON tag is the id used everywhere below. Add defaults to `pdfDefaultHeaders` and `standardFieldsHeaders` (`internal/models/models_defaults.go:4-36`, `:39-72`; `ColumnsHeader` is also `Settings.StandardFieldsHeaders`, `internal/models/structs.go:265`). Existing DBs are not backfilled, because `CheckDefaultValues` replaces those headers only when `Date` is empty (`internal/models/models_defaults.go:252-255`) — an empty header prints an empty label.
3. Add a `columnDef` to `standardColumns` with `textDef`/`timeDef`/`singlePilotDef`/`landingDef` (`internal/pdfexport/layout.go:37-100`); a non-nil `total` gives it a footer total automatically (`internal/pdfexport/pdfexport.go:651-652`). Add the id to `standardOrder` (`internal/pdfexport/layout.go:115-129`): existing profiles get it appended after their saved columns, visible.
4. Add the id to `pdfA4TableColumns`/`pdfA5TableColumns` and both width maps (`internal/models/models_defaults.go:149-211`). Without a saved width it prints at 11.2 mm.
5. UI: add it to `allColumns` in `app/ui/src/components/PdfExport/PDFPageLayout.jsx:75-116` (keep it in step with `buildLayout`, see the comment at `internal/pdfexport/layout.go:241`) and a header input to `HEADERS_CONFIG` (`app/ui/src/components/PdfExport/PageSettings.jsx:28-116`).
6. If the new column belongs to a group that the number row treats specially, check `numberGroupWidths` (`internal/pdfexport/pdfexport.go:604-623`) and `matchStandardCategory` / `matchCategoryKey` (`internal/pdfexport/layout.go:131-169`, `app/ui/src/components/PdfExport/PDFPageLayout.jsx:20-40`).

**Recipe C — add a page format (e.g. Letter)**
1. Add a constant next to `PDFA4`/`PDFA5`, then update the `init` check, the `initPDF` switch, the `titlePage` coordinates and the `printCustomTitle` sizes/params (`internal/pdfexport/pdfexport.go:18-21`, `:166`, `:182-187`, `:251-264`, `:295-310`). Decide whether it is a one-page or a split format (`PAGE_DIVIDER` is accepted only for A5, `internal/pdfexport/layout.go:256-258`, `:284-288`). Add an `ExportX` function.
2. Handler: add a constant and a switch branch in `HandlerApiExportLogbook` (`app/handlers_export.go:17-18`, `:117-169`, including the A4/A5 `if` blocks at `:124-128` and `:163-166`). Add a `Settings.ExportX` block (`internal/models/structs.go:256-257`) and `pdfXDefaults`, `pdfXTableColumns`, `pdfXTableColumnWidth` in `internal/models/models_defaults.go` (next to `:129-211`), plus branches in `CheckDefaultValues` (`internal/models/models_defaults.go:227-244`, `:257-318`), `GetPdfDefaults` (`internal/models/settings.go:70-83`) and the `HandlerApiSettingsExportUpdate` switch and `PAGE_DIVIDER` strip (`app/handlers_settings.go:125-143`). Preserve the block in `HandlerApiSettingsUpdate` (`settings.ExportX = oldsettings.ExportX`, `app/handlers_settings.go:36-38`); otherwise every general settings save writes back the client's possibly stale copy.
3. Custom title id `custom_title_<fmt>`: add it to the exclusion in `GetAttachments` (`internal/models/attachments.go:43`).
4. UI: add a page, a route in `app/ui/src/main.jsx:84-88`, a sidebar entry in `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:62-64` and a menu item in `app/ui/src/components/Logbook/PDFExportButton.jsx:58-63`. Replace the A4/A5 ternary in `app/ui/src/components/PdfExport/PdfExport.jsx:19` with a lookup such as ``data[`export_${format.toLowerCase()}`]``; otherwise the new page loads A5's values and saves them into the new block. Extend the `showIf` margin rules in `app/ui/src/components/PdfExport/PageSettings.jsx:19-21`, the `PAGE_DIVIDER` rule and the width caption in `app/ui/src/components/PdfExport/PDFPageLayout.jsx:98-100`, `:245-253`.

**Recipe D — change time or date formatting**
Keep the three time implementations in step: PDF `formatTimeFieldOptions` (`internal/pdfexport/pdfexport.go:408-437`), UI `formatTimeField` (`app/ui/src/util/helpers.jsx:4-23`, also used by the CSV export) and server `app.formatTimeField` (`app/helpers.go:115`). Then update the toggle in `app/ui/src/components/PdfExport/OtherSettings.jsx:49-66` and the global settings toggle. Known divergence: FAA decimal rounding on exact ties. Go `%.1f` (`internal/pdfexport/pdfexport.go:419`, `app/helpers.go:122`) rounds half to even, while JS `toFixed(1)` (`app/ui/src/util/helpers.jsx:10`) rounds up, so 15 min prints `0.2` in the PDF and `0.3` in the UI and CSV. See ARCHITECTURE_SETTINGS.md §11 #7, and fix it in all three places together. For dates, the format strings in `formatDate` (`internal/pdfexport/pdfexport.go:587-591`) must match the toggle values in `app/ui/src/components/PdfExport/OtherSettings.jsx:78-80`; apply the format to any new date column too (§11 #23).

**Recipe E — add or fix a Quick CSV export**
Add a mapper key to `exportMappers` (`app/ui/src/components/UIElements/CSVExportButton.jsx:29-150`), then render `<CSVExportButton apiRef={apiRef} type="<key>" />` in the table's `customActions`. Take field names from the **row JSON**, not from the column ids (see §11 #11). Pass durations through `formatTimeField`. Include custom-field columns when the grid shows them (§11 #19): logbook rows hold the raw value in `row.custom_fields[uuid]`, while stats rows hold `{sum, count}` per field, read by `buildCustomFieldColumns` (`app/ui/src/components/Stats/helpers.jsx:40-51`). A mapper receives only `(rows, timeFieldsFormat)` (`app/ui/src/components/UIElements/CSVExportButton.jsx:158`), so the field definitions must be passed in.

**Recipe F — add an export endpoint**
Register it inside `r.Route("/export", ...)` under the `app.Auth` group (`app/routes.go:122-125`). Follow every `app.handleError(w, err)` with `return`: the helper only writes the JSON error and does not stop the handler (`app/helpers.go:53-63`). Answer mutations with `app.writeOkResponse` (`app/helpers.go:45-51`). Add a `default:` branch that returns an error for unknown formats. Add the client function to `app/ui/src/util/http/export.jsx` with the Bearer header.

**Cross-check list before finishing a change here**
- [ ] A4 **and** A5 updated, including the A5 `PAGE_DIVIDER` split and the extended-format `sim_date`/Remarks adjustment.
- [ ] Any code that prints a body row has loaded that row's custom fields (`loadRowCustomFields`), including padding rows (§11 #20).
- [ ] Hidden columns come from `table_hidden_columns`; every new cell printer still checks `w <= 0`.
- [ ] Go `buildLayout` and UI `PDFPageLayout` apply the same visibility and order rules.
- [ ] `fill` and `logbook_rows` cannot reach 0 (guard in the handler or the exporter).
- [ ] New `ExportPDF` fields are copied in `HandlerApiSettingsExportUpdate` and are restorable in `RestoreDefaultsButton` / `RestoreColumnsButton`.
- [ ] Settings-shape change: check the startup migration in `CheckDefaultValues` for existing installs.
- [ ] SQL or view change: both engines in `internal/driver/db_structure.go`, `schemaVersion` bumped.
- [ ] Routes inside the `/api` group under `Auth`. UI requests send `Authorization: Bearer`.
- [ ] React Query: invalidate `['settings']` after layout writes and `['custom-title', format]` after custom title writes.
- [ ] New glyphs exist in the embedded fonts (`internal/pdfexport/font/`). B612Mono is used for the single-pilot `✓`; a JSON `true` custom value also becomes `✓` but in the regular font (`internal/pdfexport/layout.go:417-421`).
- [ ] `go vet ./...` and `make test` (after `make build_ui`). Manually export A4 and A5 with 0, 1 and exactly `logbook_rows` records, with and without extended format, signature, custom title and a custom-field column.
- [ ] `CHANGELOG.md` `[Unreleased]` bullet (`- New:`/`- Update:`/`- Fix:`) plus its copy in `README.md` (changelog section at `README.md:64`). Update the README Export section (`README.md:243-259`) and the API examples (`README.md:348`, `:360`, `:369`) if behaviour or routes change.

## 13. AI Notes

### Mental Model
`HandlerApiExportLogbook` gathers four inputs: records (newest first, with their `custom_fields` JSON), the settings JSON, the custom field definitions and an optional custom title blob. It builds a `PDFExporter` that holds three running totals (page, previous, total, the last two seeded with previous experience) plus the same three buckets per custom field. `buildLayout` turns the format's table profile into an ordered list of columns, each with a width, a header label, a category and a body/total function. The exporter walks the records backwards, printing each row by iterating that list, and writes the finished PDF straight to the response. A5 is the same list cut at `PAGE_DIVIDER` into a left and a right page, with each batch of records printed twice. All layout knobs live in `settings2` JSON. The UI is a form and a column editor over that JSON plus a download button.

### Gotchas
- Export uses the **saved** settings. Edits on the export page do nothing until Save is clicked.
- `page_breaks` is saved since #568 (§11 #1 fixed).
- Columns are no longer hard-coded indices. Order, visibility and widths come from `table_profile`; the 23 standard ids live in `standardColumns`/`standardOrder` (`internal/pdfexport/layout.go:64-129`). The legacy `columns.col1..col23` block only feeds the startup migration.
- A width of 0 does **not** hide a column any more; it prints at 11.2 mm (§11 #21). Hide columns with `table_hidden_columns`.
- An empty `table_columns` is treated as "not migrated yet" at startup and resets the widths from the legacy block (§11 #22).
- Custom fields appear only when saved in `table_columns`, and the PDF may regroup them next to their category (§11 #25).
- In A5, custom-field values are read from `p.rowCustom`, which padding rows do not reset (§11 #20).
- `fill = 0` panics the request. `logbook_rows = 0` resets the format block at the next startup.
- The PDF has its own `time_fields_auto_format` and `date_fields_format` per format, separate from the global settings. Time `0` means H:MM; an empty date format means DD/MM/YYYY.
- Only the `date` column is date-formatted; the extended FSTD date is printed raw (§11 #23).
- Totals do not reset at page breaks: a "new logbook" carries the totals forward.
- MCC rows have ME zeroed, so PDF totals can differ from logbook-table totals for ME.
- Format strings are uppercase only. `/api/export/a4` crashes the request.
- Custom titles are rows in `attachments` with fixed uuids. They are hidden from the Attachments page by a literal `WHERE` in `GetAttachments`.
- `CustomTitlePreview` (`app/ui/src/components/PdfExport/CustomTitlePreview.jsx:26-33`) relies on `GET /api/attachment/{uuid}` returning 200 with a zero-value attachment (`document: null`) when no title exists (`internal/models/attachments.go:105-112`). Do not turn that reply into an error or 404 without changing this caller (ARCHITECTURE_CURRENCY_LICENSING.md §11 #1).
- "Restore defaults" and "Restore columns" are client-side only; nothing is stored until Save. `DBModel.UpdateDefaults` was removed in #568.
- The Quick CSV export never calls the server. It exports the grid's currently visible (filtered) rows.

### File Quick Reference
| Need | File |
|---|---|
| Render logic shared by both formats | `internal/pdfexport/pdfexport.go` |
| Column model, table profile, custom fields, A5 split | `internal/pdfexport/layout.go` |
| Tests | `internal/pdfexport/layout_test.go` |
| A4 grid | `internal/pdfexport/pdfexport_a4.go` |
| A5 two-page grid | `internal/pdfexport/pdfexport_a5.go` |
| HTTP export + custom title upload | `app/handlers_export.go` |
| Save / defaults of export settings | `app/handlers_settings.go:102-169`, `internal/models/settings.go:70-83` |
| Defaults values and migration | `internal/models/models_defaults.go:4-328` |
| Data for export | `internal/models/flightrecords.go:168-203`, `internal/models/custom_fields.go:3-29` |
| Settings types | `internal/models/structs.go:139-239` |
| UI export page | `app/ui/src/components/PdfExport/PdfExport.jsx` |
| UI column editor | `app/ui/src/components/PdfExport/PDFPageLayout.jsx` |
| UI HTTP calls | `app/ui/src/util/http/export.jsx`, `app/ui/src/util/http/settings.jsx:48-66` |
| Quick CSV | `app/ui/src/components/UIElements/CSVExportButton.jsx` |

> **AI Usage Instructions**
> - Always read this file before modifying this system
> - Do not refactor without impact analysis
> - Ask if information is missing
