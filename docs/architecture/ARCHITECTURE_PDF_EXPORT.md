# PDF Export — Architecture

**Last Updated:** 2026-10-14 — initial version generated from code and fact-checked (TASK_AGENT_WORKFLOW_SETUP); 2026-10-14 — cross-links to APPLICATION/CURRENCY_LICENSING, custom-title upload consequences (consistency pass)

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

PDF Export turns the whole logbook into a printable EASA-style paper logbook (Part FCL.050 layout) in two landscape formats. **A4** puts every column on one page. **A5** splits each logbook page into a left page and a right page. The output has a title page (built-in, or a PDF the pilot uploaded), 12 numbered column groups, per-page footers with "this page / previous pages / total" sums, the owner's signature text and image, and the per-flight signatures of instructors or examiners. The Go package `internal/pdfexport` renders the PDF with `codeberg.org/go-pdf/fpdf` (`internal/pdfexport/pdfexport.go:11-12`, `go.mod:6`). The HTTP entry point is `HandlerApiExportLogbook` (`app/handlers_export.go:93`). Layout settings live in the settings JSON document (`export_a4` / `export_a5`, `internal/models/structs.go:235-236`).

The UI has one settings page per format (`/export/a4`, `/export/a5`; `app/ui/src/main.jsx:81-85`). Each page edits layout, column widths, headers and options, manages the custom title page and has an Export button. The logbook table toolbar also has a PDF export menu (`app/ui/src/components/Logbook/PDFExportButton.jsx`). This doc also covers the **Quick CSV export**, which runs only in the browser and is offered on 10 data-grid tables (`app/ui/src/components/UIElements/CSVExportButton.jsx`). The current code has **no XLS export**. The server-side CSV/XLS packages and templates were removed in `a46e936` (#270).

## 2. Key Concepts

| Concept | Definition / invariant | Evidence |
|---|---|---|
| Format id | The strings `"A4"` and `"A5"`, uppercase and case-sensitive, in the route param and in `PDFExporter.Format` | `internal/pdfexport/pdfexport.go:17-20`, `app/handlers_export.go:17-18` |
| Time = integer minutes | Every duration in `FlightRecord.Time`, `SIM.Time` and previous experience is an `int` in minutes. It is formatted only at render time | `internal/models/structs.go:40-62`, `internal/pdfexport/pdfexport.go:502-531` |
| Per-format time format | `ExportPDF.TimeFieldsAutoFormat`: `1` HH:MM, `2` or `0` H:MM, `3` FAA decimal (`%.1f` hours). This is separate from the global setting | `internal/pdfexport/pdfexport.go:511-530`, `internal/models/structs.go:215` |
| Zero handling | Body cells print `""` for 0 minutes. Footer totals print `0:00`, or `0.0` in FAA format (`formatTimeFieldTotals`). Landings print `""` in the body and `0` in footers | `internal/pdfexport/pdfexport.go:496-509`, `:666-671`, `internal/pdfexport/pdfexport_a4.go:196-197` |
| Chronological order | SQL returns the newest record first. Both exporters iterate the slice backwards, so the PDF starts with the oldest flight | `internal/models/flightrecords.go:180`, `internal/pdfexport/pdfexport_a4.go:25`, `internal/pdfexport/pdfexport_a5.go:34` |
| MCC suppresses ME | If a row has MCC time, its ME time is zeroed for both display and totals (A5: page A only) | `internal/pdfexport/pdfexport_a4.go:103-105`, `internal/pdfexport/pdfexport_a5.go:258-260` |
| Totals seeded by previous experience | `totalPrevious` and `totalTime` start from the pilot's previous experience. `totalPage` resets after each page | `internal/pdfexport/pdfexport.go:134-135`, `internal/pdfexport/pdfexport_a4.go:116-117` |
| 23 base columns → 4 width arrays | `Col1..Col23` (mm) are combined into `w1` (12 group numbers), `w2` (13 group headers), `w3` (23 cells), `w4` (18 footer cells) | `internal/pdfexport/pdfexport.go:192-256` |
| Hidden column | A width `<= 0` skips body and footer cells (`printBody*Cell`, `printFooterCell`). The UI disables the header input when all its columns are 0 | `internal/pdfexport/pdfexport.go:458-479`, `app/ui/src/components/PdfExport/PageSettings.jsx:194` |
| Extended format | `is_extended` adds a Date column to the FSTD group. Its width is taken from Remarks. Sim records then show the date there, not in column 1 | `internal/pdfexport/pdfexport.go:258-270`, `internal/pdfexport/pdfexport_a4.go:137-141`, `:161-167` |
| Single-pilot tick | `replace_sp_time` prints `✓` in the B612Mono font instead of SE/ME values | `internal/pdfexport/pdfexport.go:482-493`, `:70` |
| Header newlines | A literal `\n` typed in a header becomes a line break | `internal/pdfexport/pdfexport.go:183-188` |
| Page breaks (new logbook) | `page_breaks` = `"X,Y"`: after page X a title page is inserted and the page counter restarts at 1. Totals are **not** reset | `internal/pdfexport/pdfexport.go:153`, `:653-663` |
| Custom title page | A PDF stored in `attachments` with `uuid = record_id = custom_title_a4 \| custom_title_a5`. All its pages replace the built-in title page | `app/handlers_export.go:140-142`, `internal/pdfexport/pdfexport.go:360-363`, `:387-431` |

## 3. How It Works

User-level flow:

| Step | What the pilot does | What happens | Evidence |
|---|---|---|---|
| 1 | Opens Export → PDF A4 / PDF A5 | `PdfExport` loads `['settings']` and copies `export_a4` or `export_a5` into local state | `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:61-64`, `app/ui/src/components/PdfExport/PdfExport.jsx:24-35` |
| 2 | Edits rows, margins, widths, headers, options | The changes stay in local React state only | `app/ui/src/components/PdfExport/PdfExport.jsx:37-39` |
| 3 | (optional) Restore defaults → section | The defaults are fetched and written into local state. Nothing is saved yet | `app/ui/src/components/PdfExport/RestoreDefaultsButton.jsx:30-43` |
| 4 | Clicks Save | `PUT /api/settings/export/{format}` stores 14 fields, then `['settings']` is invalidated | `app/ui/src/components/PdfExport/SaveSettingsButton.jsx:32-49`, `app/handlers_settings.go:108-154` |
| 5 | (optional) Uploads a custom title PDF | `POST /api/export/custom-title` validates page 1 and replaces the attachment row | `app/ui/src/components/PdfExport/AddCustomTitleButton.jsx:25-35`, `app/handlers_export.go:38-90` |
| 6 | Clicks Export (export page or logbook toolbar) | `GET /api/export/{format}` streams `application/pdf`. The UI saves the blob as `logbook-<format>.pdf` | `app/ui/src/components/PdfExport/ExportButton.jsx:13-27`, `app/ui/src/components/Logbook/PDFExportButton.jsx:18-32` |

Rendering pipeline (both formats):

| # | Step | Function |
|---|---|---|
| 1 | Validate the format, split `page_breaks`, drop the signature image unless `include_signature` is set, build headers and widths | `init` `internal/pdfexport/pdfexport.go:147-163` |
| 2 | New landscape fpdf doc, auto page break margin 5 mm, load 3 embedded TTFs, register the owner signature PNG | `initPDF` `internal/pdfexport/pdfexport.go:274-302` |
| 3 | Title page (built-in or custom) | `titlePage` `internal/pdfexport/pdfexport.go:338-384` |
| 4 | Header → rows → footer + page number, repeated every `logbook_rows` rows | A4 `logBookRow` `internal/pdfexport/pdfexport_a4.go:100-127`. A5 loop `internal/pdfexport/pdfexport_a5.go:34-64` |
| 5 | Pad the last page with empty rows, print the last footer | `internal/pdfexport/pdfexport_a4.go:29-36`, `internal/pdfexport/pdfexport_a5.go:66-88` |
| 6 | `pdf.Output(w)` straight into the `http.ResponseWriter` | `internal/pdfexport/pdfexport_a4.go:38`, `internal/pdfexport/pdfexport_a5.go:90` |

A4 vs A5 layout:

| Aspect | A4 | A5 |
|---|---|---|
| Pages per logbook page | 1 | 2: page A (left), then page B (right) |
| Columns on page | all 23 | A: `w3[0..13]` (Date…Landings); B: `w3[14..22]` (Night…Remarks), split by `header1_div=8`, `header2_div=9`, `header3_div=14` (`internal/pdfexport/pdfexport_a5.go:13-17`) |
| Left margin field | `left_margin` | `left_margin_a`, `left_margin_b` |
| How rows are printed | once | Page A rows as they are read. On split, the same records are printed again on page B (`internal/pdfexport/pdfexport_a5.go:46-48`) |
| Page number | every page | page A only (`internal/pdfexport/pdfexport_a5.go:40`, `:73`) |
| Last page when count % rows == 0 | an extra empty page is printed (see §11 #7) | no extra page (`internal/pdfexport/pdfexport_a5.go:59`, `:67`) |

Footer signature block (column `w4[17]`, the Remarks area), from `printFooterSignatureBlock` `internal/pdfexport/pdfexport.go:598-635`:

| Footer row | Normal | Extended |
|---|---|---|
| TOTAL THIS PAGE | `signature_text` | empty filled box, coordinates saved |
| TOTAL FROM PREVIOUS PAGES | empty | empty box on this row. While this row is printed, `signature_text` is drawn as a MultiCell at the coordinates saved on the TOTAL THIS PAGE row. If `len(text)` (bytes) > `int(0.8 × w4[17])` (mm), the line height is halved so two lines fit in one footer row (`:611-630`) |
| TOTAL TIME | `owner_name` + signature image drawn over the 3 footer rows (`printSignature` `:638-643`) | same |

## 4. Components & Files

### 4.1 File Index

| File | Responsibility |
|---|---|
| `internal/pdfexport/pdfexport.go` | `PDFExporter` type, constants (formats, fonts, labels, colors, font sizes), `NewPDFExporter`, header/width setup, fonts, signatures, title page, custom title import, cell printers, time formatting, page breaks |
| `internal/pdfexport/pdfexport_a4.go` | `ExportA4`, A4 header, row, body and footer |
| `internal/pdfexport/pdfexport_a5.go` | `ExportA5`, split constants, header/body/footer for page A and page B |
| `internal/pdfexport/font/` | Embedded TTFs: `internal/pdfexport/font/LiberationSansNarrow-Regular.ttf`, `internal/pdfexport/font/LiberationSansNarrow-Bold.ttf`, `internal/pdfexport/font/B612Mono-Regular.ttf` (`//go:embed font/*` `internal/pdfexport/pdfexport.go:72-73`) |
| `app/handlers_export.go` | `HandlerApiExportLogbook`, `HandlerApiUploadCustomTitle`, `validateCustomTitlePdf` |
| `internal/models/export.go` | `UpdateDefaults` (no callers, see §11 #15) |
| `internal/models/models_defaults.go` | `pdfDefaultHeaders`, `pdfA4DefaultColumns`, `pdfA5DefaultColumns`, `pdfA4Defaults`, `pdfA5Defaults`, `CheckDefaultValues` (owned by ARCHITECTURE_SETTINGS.md) |
| `internal/models/structs.go:139-218` | `ColumnsWidth`, `ColumnsHeader`, `ExportPDF` (JSON contract) |
| `app/ui/src/pages/PdfExportA4Page.jsx`, `app/ui/src/pages/PdfExportA5Page.jsx` | Render `<PdfExport format="A4" />` / `"A5"` |
| `app/ui/src/components/PdfExport/*.jsx` | Settings page, save/restore/export buttons, custom title add/delete/preview |
| `app/ui/src/components/Logbook/PDFExportButton.jsx` | Logbook toolbar menu "Export PDF A4/A5" |
| `app/ui/src/components/UIElements/CSVExportButton.jsx` | Quick CSV export for data grids (client only) |
| `app/ui/src/util/http/export.jsx` | `fetchExport`, `uploadCustomTitle` |
| `app/ui/src/util/http/settings.jsx:48-66` | `fetchPdfDefaults`, `updatePdfSettings` |

### 4.2 API Endpoints

All routes are inside the `/api` group guarded by `app.Auth` (`app/routes.go:26-27`).

| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/api/export/{format}` | `HandlerApiExportLogbook` `app/handlers_export.go:93` | Route `app/routes.go:122`, no `Compress` middleware. `format` ∈ `A4`/`A5`. Response `application/pdf`, `Content-Disposition: attachment; filename=logbook.pdf` (`:163-164`). Documented in `README.md:330`, `README.md:342`, `README.md:351` |
| POST | `/api/export/custom-title` | `HandlerApiUploadCustomTitle` `app/handlers_export.go:38` | Route `app/routes.go:123`. Multipart: `document` (file), `id` (`custom_title_a4`/`_a5`). Returns `{ok:true,message:"Attachment has been uploaded"}` |
| GET | `/api/settings/export/defaults/{format}` | `HandlerApiSettingsExportDefaults` `app/handlers_settings.go:102` | Route `app/routes.go:87`. Returns default `ExportPDF` built from constants |
| PUT | `/api/settings/export/{format}` | `HandlerApiSettingsExportUpdate` `app/handlers_settings.go:108` | Route `app/routes.go:88`. Copies 14 fields (`:132-145`). `page_breaks` is **not** copied |
| GET | `/api/settings/list` | `HandlerApiSettingsList` `app/handlers_settings.go:11` | The export page reads `export_a4`/`export_a5` from it |
| PUT | `/api/settings/general` | `HandlerApiSettingsUpdate` `app/handlers_settings.go:22` | Route `app/routes.go:84`. Owned by ARCHITECTURE_SETTINGS.md. Writes the PDF's non-layout inputs (owner name, license, address, signature text, previous experience). Restores `ExportA4`/`ExportA5` from the DB (`:36-38`), so it cannot change the layout |
| PUT | `/api/settings/signature` | `HandlerApiSettingsSignature` `app/handlers_settings.go:53` | Route `app/routes.go:85`. Owned by ARCHITECTURE_SETTINGS.md. Writes only `signature_image` (`:67`), the PNG drawn in the footer when `include_signature` is set |
| GET | `/api/attachment/{uuid}` | `HandlerApiGetAttachment` `app/handlers_attachments.go:42` | Route `app/routes.go:67`, wrapped in `middleware.Compress(5)`. Custom title preview. Returns `document: null` if no row exists (`internal/models/attachments.go:108-110`) |
| DELETE | `/api/attachment/{uuid}` | `HandlerApiDeleteAttachment` `app/handlers_attachments.go:55` | Route `app/routes.go:68`. Deletes the custom title |

### 4.3 Data Access

| File | Method | Purpose | Tables / views |
|---|---|---|---|
| `internal/models/flightrecords.go` | `GetFlightRecordsForExport` `:168-203` | 25 columns incl. `signature`, `ORDER BY date desc, departure_time desc` (`:180`). Calls `processFlightrecord` | `logbook_view` |
| `internal/models/flightrecords.go` | `CalculateTotals` `:4-24` | Pure function: sums times, sim time, landings, distance, CC | — |
| `internal/models/settings.go` | `GetSettings` `:11-28`, `UpdateSettings` `:31-68` | Read/write the whole settings JSON | `settings2` (`id=0`) |
| `internal/models/settings.go` | `GetPdfDefaults` `:70-81` | Defaults for `A4`/`A5`. Any other format → zero values + default headers | none |
| `internal/models/attachments.go` | `GetAttachmentByID` `:95-113` | Custom title blob. `sql.ErrNoRows` → empty struct, `nil` error | `attachments_view` |
| `internal/models/attachments.go` | `DeleteAttachment` `:75-83`, `InsertAttachmentRecord` `:64-72` | Replace the custom title row | `attachments` |
| `internal/models/attachments.go` | `GetAttachments` `:35-61` | Leaves custom titles out of the Attachments page (`:43`) | `attachments_view` |
| `internal/models/export.go` | `UpdateDefaults` `:6-42` | Resets `a4common/a4headers/a4columns/a5*` sections. **No callers** | `settings2` |
| `internal/models/models_defaults.go` | `CheckDefaultValues` `:151-197` | At startup: if `LogbookRows == 0`, the whole format block is replaced by defaults (`:163-176`) | `settings2` |

### 4.4 UI

| Item | File | Notes |
|---|---|---|
| Routes `/export`, `/export/a4`, `/export/a5` | `app/ui/src/main.jsx:81-85` | `/export` index shows A4 |
| Sidebar "Export → PDF A4 / PDF A5" | `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:61-64` | |
| `PdfExport` | `app/ui/src/components/PdfExport/PdfExport.jsx:21-88` | `useQuery(['settings'], fetchSettings)` (no staleTime). Local `pdfSettings`. Three cards: Page Settings, Other Settings, Custom title page |
| `PageSettings` | `app/ui/src/components/PdfExport/PageSettings.jsx` | `PAGE_SETTINGS_CONFIG` `:10-20` (incl. `page_breaks`), `COLUMN_CONFIG` col1–col23 `:22-46`, `HEADERS_CONFIG` `:48-135` |
| `OtherSettings` | `app/ui/src/components/PdfExport/OtherSettings.jsx` | Switches `replace_sp_time`, `include_signature`, `is_extended`. Time format toggle 2/1/3 (`:49-59`) |
| `SaveSettingsButton` | `app/ui/src/components/PdfExport/SaveSettingsButton.jsx` | `parseInt` on `INT_FIELDS` (`:11-14`, includes margins and row heights), `parseFloat` on 23 columns (`:23-30`). Invalidates `['settings']` (`:36`) |
| `RestoreDefaultsButton` | `app/ui/src/components/PdfExport/RestoreDefaultsButton.jsx` | Sections page/columns/headers. Updates local state only |
| `ExportButton` | `app/ui/src/components/PdfExport/ExportButton.jsx` | `useMutation` → `fetchExport` → object URL → `<a download>` |
| `AddCustomTitleButton` / `DeleteCustomTitleButton` | `app/ui/src/components/PdfExport/AddCustomTitleButton.jsx`, `app/ui/src/components/PdfExport/DeleteCustomTitleButton.jsx` | Invalidate `['custom-title', format]` |
| `CustomTitlePreview` | `app/ui/src/components/PdfExport/CustomTitlePreview.jsx` | `useQuery(['custom-title', format])` → `fetchAttachment`. Detects the MIME type with `file-type` and shows a data-URL `<iframe>` |
| `PDFExportButton` | `app/ui/src/components/Logbook/PDFExportButton.jsx` | In the logbook toolbar `app/ui/src/components/Logbook/LogbookTable.jsx:287` |
| `CSVExportButton` | `app/ui/src/components/UIElements/CSVExportButton.jsx` | `exportMappers` keys: `aircrafts`, `categories`, `airports`, `custom-airports`, `licensing`, `logbook`, `totals-by-year`, `totals-by-aircraft`, `persons`, `person-flights` (`:29-150`) |

## 5. Data Model & Persistence

No table belongs to this system. Nothing is cached in memory: each export reads the DB and builds the PDF in memory inside fpdf.

`settings2.settings` JSON → `export_a4` / `export_a5` (`ExportPDF`, `internal/models/structs.go:200-218`):

| JSON key | Type | A4 default | A5 default | Notes |
|---|---|---|---|---|
| `logbook_rows` | int | 23 | 20 | `internal/models/models_defaults.go:130`, `:140` |
| `fill` | int | 3 | 3 | Row is grey when `rowCounter % fill == 0` (`internal/pdfexport/pdfexport.go:435`) |
| `left_margin` | float mm | 10.0 | 0 | A4 only |
| `left_margin_a` / `left_margin_b` | float mm | 0 | 6.0 / 14.0 | A5 only |
| `top_margin` | float mm | 30.0 | 9.0 | |
| `body_row_height` / `footer_row_height` | float mm | 5.0 / 6.0 | 5.0 / 5.0 | |
| `page_breaks` | string `"X,Y"` | `""` | `""` | Never written by the PUT handler (§11 #1) |
| `columns.col1..col23` | float mm | `internal/models/models_defaults.go:75-99` | `:102-126` | 0 hides the column |
| `headers.*` (31 keys) | string | `pdfDefaultHeaders` `internal/models/models_defaults.go:4-36` | same | `ColumnsHeader` also has `tags`, which the PDF does not use |
| `replace_sp_time`, `include_signature`, `is_extended` | bool | false | false | |
| `time_fields_auto_format` | byte | 0 (rendered as H:MM) | 0 | UI shows `0` as H:MM (`app/ui/src/components/PdfExport/OtherSettings.jsx:52`) |
| `custom_title` | string | — | — | Not read anywhere (§11 #15) |
| `CustomTitleBlob` | []byte | — | — | No JSON tag. Filled only at export time (`app/handlers_export.go:142`) |

Other inputs:

| Source | Fields | Evidence |
|---|---|---|
| `settings2` (top level) | `owner_name`, `license_number`, `address`, `signature_text`, `signature_image` (PNG data URL), `previous_experience.*` | `internal/models/structs.go:222-226`, `:255-271`, `app/handlers_export.go:124-147` |
| `attachments` | Rows `uuid = record_id = custom_title_a4 \| custom_title_a5`, `document_name`, `document` (BLOB / MySQL LONGBLOB) | `internal/driver/db_structure.go:95-100`, `:14` |
| `logbook_view` | The columns of `GetFlightRecordsForExport`. `signature` = per-flight PNG data URL (`IFNULL(signature,'')`) | `internal/driver/db_structure.go:168-227`, `:52` |

Engine differences: none in this system's SQL. `logbook.signature` and `settings2.settings` are `FullText` = `TEXT` on both engines (`internal/driver/db_structure.go:10`), see §11 #17.

## 6. Data Flow

| Operation | Path |
|---|---|
| Export PDF | `ExportButton` / `PDFExportButton` → `fetchExport` (`app/ui/src/util/http/export.jsx:5-13`, Bearer header, `returnJson=false` → blob) → `GET /api/export/{format}` → `Auth` → `HandlerApiExportLogbook`: `GetFlightRecordsForExport` (`logbook_view`) → `GetSettings` (`settings2`) → map previous experience into a `FlightRecord` (`app/handlers_export.go:124-137`) → `GetAttachmentByID("custom_title_<fmt>")` (error ignored, `:141`) → `NewPDFExporter` (`:144-147`) → set headers → `ExportA4`/`ExportA5` writes to `w` → UI `createObjectURL` → `<a download="logbook-<fmt>.pdf">` |
| Save layout | `SaveSettingsButton.onSave` (`app/ui/src/components/PdfExport/SaveSettingsButton.jsx:42-49`) → `updatePdfSettings` (`app/ui/src/util/http/settings.jsx:58-66`) → `PUT /api/settings/export/{format}` → `HandlerApiSettingsExportUpdate` → `GetSettings` → copy fields → `UpdateSettings` (`UPDATE settings2`, `authCache.Clear()`) → UI invalidates `['settings']` → `PdfExport` effect resets local state from the server (`app/ui/src/components/PdfExport/PdfExport.jsx:30-35`) |
| Restore defaults | `RestoreDefaultsButton` → `fetchPdfDefaults` (`app/ui/src/util/http/settings.jsx:48-56`) → `GET /api/settings/export/defaults/{format}` → `GetPdfDefaults` (constants) → `handleChange` into local state |
| Upload custom title | `AddCustomTitleButton` builds `FormData{document, id}` (`app/ui/src/components/PdfExport/AddCustomTitleButton.jsx:28-30`) → `uploadCustomTitle` (`app/ui/src/util/http/export.jsx:15-23`) → `POST /api/export/custom-title` → `ParseMultipartForm(32<<20)` → `validateCustomTitlePdf` (gofpdi imports page 1, `recover()` turns a panic into an error, `app/handlers_export.go:21-35`) → `DeleteAttachment(id)` → `InsertAttachmentRecord` → UI invalidates `['custom-title', format]` |
| Preview / delete custom title | `CustomTitlePreview` → `fetchAttachment` → `GET /api/attachment/custom_title_<fmt>` → `GetAttachmentByID` → base64 `document` → data URL iframe. Delete: `deleteAttachment` → `DELETE /api/attachment/{id}` |
| Quick CSV | `CSVExportButton.handleCSVExport` (`app/ui/src/components/UIElements/CSVExportButton.jsx:167-180`): sorted row ids minus `state.filter.filteredRowsLookup` keys → `exportMappers[type]` → `export-to-csv` `mkConfig/generateCsv/download` with `filename: type` (`:152-162`). Times go through `formatTimeField(minutes, settings.time_fields_auto_format)` (`app/ui/src/util/helpers.jsx:4-23`). No backend call |

## 7. Config & Constants

| Name | Value | Location | Kind |
|---|---|---|---|
| Page orientation / unit | landscape `"L"`, `"mm"`, `"A4"`/`"A5"` | `internal/pdfexport/pdfexport.go:276-281` | hardcoded |
| Auto page break margin | `true`, 5 mm | `internal/pdfexport/pdfexport.go:284` | hardcoded |
| Line width | 0.2 | `internal/pdfexport/pdfexport.go:299` | hardcoded |
| Fonts | `LiberationSansNarrow-Bold`, `-Regular`, `B612Mono-Regular` | `internal/pdfexport/pdfexport.go:23-27` | hardcoded |
| Font sizes | header/body 8, signature 6, page number 6, title 20, title info 15 | `internal/pdfexport/pdfexport.go:61-68` | hardcoded |
| Remarks shrink | `> 0.9w` → 6 pt, `> 1.35w` → 5 pt, `> 1.575w` → truncate + `...` (byte count `len(value)` vs mm width) | `internal/pdfexport/pdfexport.go:539-555` | hardcoded |
| Colors | header fill 217,217,217; body fill 228,228,228; text black | `internal/pdfexport/pdfexport.go:55-58` | hardcoded |
| Labels | `PILOT LOGBOOK`, `HOLDER'S NAME:`, `LICENSE NUMBER:`, `ADDRESS:`, `TOTAL THIS PAGE`, `TOTAL FROM PREVIOUS PAGES`, `TOTAL TIME`, `✓`, `Date` (extended FSTD), `page %d` | `internal/pdfexport/pdfexport.go:30-42`, `:70`, `internal/pdfexport/pdfexport_a4.go:80`, `internal/pdfexport/pdfexport.go:649` | hardcoded |
| Title page coordinates | A4 title (95,60), info (65,150/157/164); A5 title (55,60), info (25,100/107/114) | `internal/pdfexport/pdfexport.go:345-358` | hardcoded |
| Custom title placement | page sizes A4 210×297, A5 148×210; landscape y-offset −87 (A4) / −62 (A5) | `internal/pdfexport/pdfexport.go:389-404` | hardcoded |
| A5 split indices | `header1_div=8`, `header2_div=9`, `header3_div=14` | `internal/pdfexport/pdfexport_a5.go:13-17` | hardcoded |
| Header row geometry | group numbers h=5, group headers h=12 at `top+3`, sub-headers h=4 at `top+11` | `internal/pdfexport/pdfexport_a4.go:49-90` | hardcoded |
| Layout defaults | see §5 table | `internal/models/models_defaults.go:75-147` | configurable (per format, in UI) |
| Upload memory limit | `32 << 20` (32 MiB in memory; the rest spills to temp files) | `app/handlers_export.go:39` | hardcoded |
| DB query timeout | 60 s | `internal/models/helpers.go:14` | hardcoded |
| HTTP server timeouts | none set | `app/main.go:52-59` | hardcoded |
| Download filename | server `logbook.pdf`; UI overrides with `logbook-<format>.pdf` | `app/handlers_export.go:114`, `app/ui/src/components/PdfExport/ExportButton.jsx:21` | hardcoded |
| CSV options | `,` separator, `.` decimal, keys as headers, filename = mapper key | `app/ui/src/components/UIElements/CSVExportButton.jsx:21-26`, `:159` | hardcoded |

## 8. Error Handling & Edge Cases

| Case | Behaviour | Evidence |
|---|---|---|
| DB error loading records/settings | `handleError` → 500 JSON `{ok:false,message:<error>}`. The UI toast shows that server message (`error.info.message`). "Failed to export PDF" is only the last fallback | `app/handlers_export.go:96-106`, `app/helpers.go:37-43`, `app/helpers.go:53-63`, `app/ui/src/util/http/http.jsx:20-21`, `app/ui/src/hooks/useAppNotifications.jsx:9` |
| Format other than `A4`/`A5` (e.g. `a4`) | `exportFunc` stays `nil` → nil function call panics. No Recoverer middleware, so `net/http` drops the connection | `app/handlers_export.go:109-166`, `app/routes.go:9-27` |
| Exporter error after headers set | `handleError` rewrites Content-Type to JSON. If fpdf already wrote bytes, the body is corrupt | `app/handlers_export.go:163-169` |
| No custom title / lookup error | Error ignored. The built-in title page is used | `app/handlers_export.go:141`, `internal/pdfexport/pdfexport.go:360` |
| Owner signature not valid base64 | Printed via `fmt.Println`. Export continues without the image | `internal/pdfexport/pdfexport.go:293-297`, `:321-335` |
| Per-flight signature not valid base64 | Error discarded. Row printed without the image | `internal/pdfexport/pdfexport.go:560-566` |
| Empty owner name/license/address | That title line is skipped | `internal/pdfexport/pdfexport.go:378-383` |
| Zero records | A4: title + one empty page with footers (previous experience totals). A5: title + page A header only | `internal/pdfexport/pdfexport_a4.go:22-36`, `internal/pdfexport/pdfexport_a5.go:29-32`, `:67` |
| Custom title upload without a file | `no such file` is tolerated: old title deleted, an empty row inserted | `app/handlers_export.go:52-57`, `:77-87` |
| Custom title that gofpdi cannot parse | Validation panic recovered → 500 "this PDF file is not supported by pdf library" | `app/handlers_export.go:22-26` |
| Rows overflow page height | fpdf auto page break (5 mm) adds a page mid-table and breaks the layout | `internal/pdfexport/pdfexport.go:284` |
| `fill = 0` | Integer modulo by zero panic | `internal/pdfexport/pdfexport.go:435` |
| `logbook_rows = 0` | A4: one row per page. A5: one row per page A, page B empty. At next startup the whole format block is reset to defaults | `internal/pdfexport/pdfexport_a4.go:112`, `internal/pdfexport/pdfexport_a5.go:46`, `internal/models/models_defaults.go:163-176` |
| Page-break list with spaces (`"10, 20"`) | No `TrimSpace`. `" 20"` never matches the page counter | `internal/pdfexport/pdfexport.go:153`, `:655` |
| Export uses saved settings | Unsaved edits on screen are ignored: `fetchExport` sends only the format | `app/ui/src/util/http/export.jsx:5-13`, `app/handlers_export.go:102` |
| CSV with no visible rows / unknown type | Silent no-op | `app/ui/src/components/UIElements/CSVExportButton.jsx:153-156` |

## 9. Integration Points

| Doc | What crosses the boundary |
|---|---|
| `ARCHITECTURE_SETTINGS.md` | `export_a4`/`export_a5` blocks, defaults (`internal/models/models_defaults.go`, `GetPdfDefaults`, `CheckDefaultValues`), `HandlerApiSettingsExportUpdate`, owner name / license / address / signature text / signature image, previous experience, React Query key `['settings']` shared with `useSettings` (`app/ui/src/hooks/useSettings.jsx:84`) |
| `ARCHITECTURE_LOGBOOK.md` | Records come from `GetFlightRecordsForExport` and `CalculateTotals` in `internal/models/flightrecords.go`. Per-flight signature set via `PUT /api/logbook/{uuid}/signature` (`app/routes.go:39`). `PDFExportButton` and the `logbook` CSV export sit in the logbook toolbar (`app/ui/src/components/Logbook/LogbookTable.jsx:286-287`) |
| `ARCHITECTURE_CURRENCY_LICENSING.md` | The custom title is an `attachments` row. Preview and delete reuse `/api/attachment/{uuid}`. `GetAttachments` hides `custom_title_a4/a5` |
| `ARCHITECTURE_DATABASE.md` | `logbook_view`, `attachments_view`, `settings2`, `attachments` definitions, `DefaultTimeout`, ISO `YYYY-MM-DD` dates since the v5 overhaul (`internal/driver/data_overhaul.go:14-15`) |
| `ARCHITECTURE_APPLICATION.md` | Routing (`app/routes.go:121-124`), `handleError`/`writeOkResponse`, no panic recovery |
| `ARCHITECTURE_AUTH.md` | `Auth` middleware (`app/handlers_auth.go:112`). The UI adds `Authorization: Bearer` in `fetchExport`/`uploadCustomTitle` |
| `ARCHITECTURE_FRONTEND.md` | `handleFetch` (`app/ui/src/util/http/http.jsx:13-31`), `queryClient`, `useErrorNotification`/`useSuccessNotification` (`app/ui/src/hooks/useAppNotifications.jsx`), `XDataGrid` toolbar `customActions` |
| `ARCHITECTURE_STATS_AND_MAP.md` | `totals-by-year`, `totals-by-aircraft` CSV mappers |
| `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` | `aircrafts`, `categories`, `airports`, `custom-airports` CSV mappers |
| `ARCHITECTURE_PERSONS.md` | `persons`, `person-flights` CSV mappers |
| `ARCHITECTURE_IMPORT.md` | CSV import is separate. `README.md:305` suggests CSV export → import to move from SQLite to MySQL. Round-trip compatibility: Not found in code |

## 10. Testing

| Area | Tests |
|---|---|
| `internal/pdfexport` | None |
| `app/handlers_export.go` | None (the former handlers_export_test.go was deleted in commit a46e936) |
| `internal/models/export.go`, `GetFlightRecordsForExport` | None |
| UI `components/PdfExport`, `CSVExportButton` | None. The only JS tests are `app/ui/src/hooks/*.test.jsx`, `app/ui/src/hooks/useLocalStorageState/useStorageState.test.tsx`, `app/ui/src/components/Currency/helpers.test.jsx` |

How to run: `make test` (`Makefile:32-33`, `go test -v ./... -coverpkg=./...`; needs `make build_ui` first so that `app/ui/dist` exists). UI: `npm run test:run` in `app/ui` (`app/ui/package.json:12`).

Gaps worth filling first:
- Table test for `formatTimeFieldOptions` (codes 0–3, zero, negative).
- `initColumns` with and without `IsExtended`.
- Smoke tests for `ExportA4`/`ExportA5` into a `bytes.Buffer` with 0, N, and k×`LogbookRows` records: check the `%PDF` prefix and no panic.
- A mapper test for `exportMappers` that checks the field names against the row JSON.

## 11. Known Issues & Tech Debt

| # | Issue | Location | Status (Confirmed/Suspected) | Severity | verified: 2026-10-14 |
|---|---|---|---|---|---|
| 1 | Page breaks cannot be saved. The UI shows and sends `page_breaks`, the server says "Export settings updated", but the PUT handler never copies `PageBreaks`, and the general settings save restores the old export blocks. True since the React UI (`a46e936`) | `app/handlers_settings.go:132-145`, `app/handlers_settings.go:36-38`, `app/ui/src/components/PdfExport/PageSettings.jsx:19` (also ARCHITECTURE_SETTINGS.md §11 #1) | Confirmed: the copy list has 14 fields and no `PageBreaks`; no other writer exists | MAJOR | verified: 2026-10-14 |
| 2 | The Night-landings body cell uses the Day-landings width `w3[12]`, not `w3[13]` (Col14). With Col13 ≠ Col14, or Col14 = 0 to hide it, the body no longer lines up with the header | `internal/pdfexport/pdfexport_a4.go:154`, `internal/pdfexport/pdfexport_a5.go:310` | Confirmed: header3 index 13 is `LandNight` (`internal/pdfexport/pdfexport.go:178`), but the body passes `w3[12]` twice. Hidden by the defaults (8.38/8.38) | MINOR | verified: 2026-10-14 |
| 3 | No validation of the numeric layout fields. An empty or 0 `fill` → `rowCounter % 0` runtime panic (connection dropped). `logbook_rows = 0` → one row per page, and at the next startup `CheckDefaultValues` resets the whole format block (headers, widths, flags) | `internal/pdfexport/pdfexport.go:435`, `app/ui/src/components/PdfExport/SaveSettingsButton.jsx:18`, `app/handlers_settings.go:132-133`, `internal/models/models_defaults.go:163-176` (no panic recovery: ARCHITECTURE_APPLICATION.md §11 #19) | Confirmed: the UI sends `parseInt('')\|\|0`, the server copies it unchanged, and Go panics on integer modulo by zero | MINOR | verified: 2026-10-14 |
| 4 | The PDF date column and the Quick CSV date columns (`logbook` `Date`, `licensing` `Issued`/`Valid From`/`Valid Until`, `person-flights` `Date`) print the stored ISO `YYYY-MM-DD`. The user's `date_fields_format` (default DD/MM/YYYY, used by the logbook table) is ignored. Pre-v5 PDFs printed DD/MM/YYYY because that was the stored format | `internal/pdfexport/pdfexport_a4.go:140`, `internal/pdfexport/pdfexport_a5.go:296`, `app/ui/src/components/UIElements/CSVExportButton.jsx:72`, `:65-67`, `:142`, `app/ui/src/hooks/useSettings.jsx:137`, `internal/driver/data_overhaul.go:14-15` | Confirmed: `internal/pdfexport` has no date formatting | MINOR | verified: 2026-10-14 |
| 5 | Margins and row heights are truncated to integers on save (`parseInt`), though the backend fields are `float64`. A row height of 4.5 is saved as 4 | `app/ui/src/components/PdfExport/SaveSettingsButton.jsx:11-14`, `internal/models/structs.go:203-208` | Confirmed | MINOR | verified: 2026-10-14 |
| 6 | The "PDF Exported successfully" toast fires when the export **starts** (`isSuccess: isExporting`), even if it later fails | `app/ui/src/components/PdfExport/ExportButton.jsx:29`; same bug in the logbook toolbar: ARCHITECTURE_LOGBOOK.md §11 #11 | Confirmed: `isPending` is passed as `isSuccess` | MINOR | verified: 2026-10-14 |
| 7 | A4 adds a fully empty page (empty rows + repeated totals) when the record count is an exact multiple of `logbook_rows`. A5 guards against this | `internal/pdfexport/pdfexport_a4.go:112-126`, `:29-36` | Confirmed: `logBookRow` always prints the next header after a full page, then the padding loop fills it | MINOR | verified: 2026-10-14 |
| 8 | An unknown `{format}` crashes the request: nil `exportFunc` call on export, nil `targetExport` dereference on settings PUT | `app/handlers_export.go:166`, `app/handlers_settings.go:124-132` (also ARCHITECTURE_SETTINGS.md §11 #8, RULE_DEVELOPMENT.md §13 #5; root cause ARCHITECTURE_APPLICATION.md §11 #19) | Confirmed: there is no `default` branch and no Recoverer middleware (`app/routes.go:9-27`) | MINOR | verified: 2026-10-14 |
| 9 | The custom title upload trusts the client `id`, so it can delete and replace **any** attachment by uuid; the re-inserted row gets `record_id = uuid` and loses its flight link. A request with no `document` part replaces the row with an empty one, because `validateCustomTitlePdf` runs only in the file branch. Delete + insert is not atomic: if the insert fails, the old title is lost | `app/handlers_export.go:46-49`, `:52-74`, `:77-87` (also ARCHITECTURE_CURRENCY_LICENSING.md §11 #21) | Confirmed: no allow-list for `custom_title_a4/a5`, no transaction | MINOR | verified: 2026-10-14 |
| 10 | Remarks truncation counts and cuts **bytes** (`len`, `value[:longCut-3]`). This can split a multi-byte UTF-8 character. A column width below ~2.22 mm (`int(0.9·w) <= 1`) gives `longCut < 3` → slice-bounds panic for any remark longer than `longCut` bytes | `internal/pdfexport/pdfexport.go:539-546` | Confirmed (code). How fpdf renders the invalid UTF-8 has not been checked | MINOR | verified: 2026-10-14 |
| 11 | The Co-Pilot column in the `totals-by-year` and `totals-by-aircraft` CSVs reads `row.time.copilot_time`, but the rows carry `co_pilot_time` → `NaN:NaN`/`NaN` | `app/ui/src/components/UIElements/CSVExportButton.jsx:107`, `:125`, `app/ui/src/util/helpers.jsx:53-57` (also ARCHITECTURE_STATS_AND_MAP.md §11 #3) | Confirmed: `formatTimeField(undefined)` yields NaN strings. This predates v5 | MINOR | verified: 2026-10-14 |
| 12 | The `custom-airports` CSV has no airport code column. Since #560, `row.name` is the full name and the code is in `row.icao` | `app/ui/src/components/UIElements/CSVExportButton.jsx:52-59`, `internal/models/airports.go:138` | Confirmed | MINOR | verified: 2026-10-14 |
| 13 | Header loops (`header1` and `header2` with no check at all, `header3` checking only that the text is non-empty) and the signature footer cell `w4[17]` have no zero-width guard. fpdf treats `w=0` as "extend to the right margin", so hidden columns may leave stray header text or a full-width signature box. Extended + hidden Remarks gives a negative `w4[17]` | `internal/pdfexport/pdfexport_a4.go:51-90`, `internal/pdfexport/pdfexport_a5.go:104-193`, `internal/pdfexport/pdfexport.go:598-635`, `:266-269` | Suspected: confirm by exporting with `col12=0` and `col23=0` (and `is_extended`) and inspecting the header and footer | MINOR | verified: 2026-10-14 |
| 14 | Errors are swallowed or printed to stdout instead of `errorLog`: owner-signature errors use `fmt.Println`, per-flight signature decode errors are assigned and dropped, and `GetAttachmentByID` errors are ignored | `internal/pdfexport/pdfexport.go:296`, `:562-566`, `app/handlers_export.go:141` | Confirmed | MINOR | verified: 2026-10-14 |
| 15 | Dead code and fields: `DBModel.UpdateDefaults` has no callers (restore defaults is client-side). `ExportPDF.CustomTitle` is never read. `CustomTitleBlob` has no `json:"-"`, so a `"CustomTitleBlob"` key is serialized into the settings JSON | `internal/models/export.go:6-42`, `internal/models/structs.go:216-217` (also ARCHITECTURE_SETTINGS.md §11 #18) | Confirmed by repo-wide grep | MINOR | verified: 2026-10-14 |
| 16 | Only page 1 of a custom title PDF is validated. `printCustomTitle` imports every page with no `recover`, so a later page gofpdi cannot parse would panic during export | `app/handlers_export.go:21-35`, `internal/pdfexport/pdfexport.go:406-430` | Suspected: confirm with a multi-page PDF whose later page uses features gofpdi does not support | MINOR | verified: 2026-10-14 |
| 17 | Signature PNG data URLs are stored in `TEXT` columns (`logbook.signature`, `settings2.settings`). On MySQL, TEXT holds at most 64 KB, so a large signature could fail to save or be truncated, which breaks the PDF signature image | `internal/driver/db_structure.go:10`, `:52`, `:79` | Suspected: confirm on MySQL with a signature data URL > 64 KB | MINOR | verified: 2026-10-14 |
| 18 | No automated tests for the PDF renderer, the export handlers or the CSV mappers | §10 | Confirmed | MINOR | verified: 2026-10-14 |
| 19 | Quick CSV omits custom-field columns. The `logbook`, `totals-by-year` and `totals-by-aircraft` mappers export fixed keys only, although those grids show custom-field columns (`createCustomFieldColumns` in the logbook, `buildCustomFieldColumns` in stats) | `app/ui/src/components/UIElements/CSVExportButton.jsx:71-133`, `app/ui/src/components/Logbook/helpers.jsx:104-117`, `app/ui/src/components/Stats/helpers.jsx:111-116` (stats part also ARCHITECTURE_STATS_AND_MAP.md §11 #3) | Confirmed: no `custom_fields` access in any mapper | MINOR | verified: 2026-10-14 |

## 12. Rules for Future Development

**Recipe A — add a new export option (bool or number) to `ExportPDF`**
1. Add the field with a JSON tag to `ExportPDF` (`internal/models/structs.go:200-218`).
2. Add it to the copy list in `HandlerApiSettingsExportUpdate` (`app/handlers_settings.go:132-145`). Otherwise it is silently dropped, as happens to `page_breaks`.
3. Add a default to `pdfA4Defaults`/`pdfA5Defaults` (`internal/models/models_defaults.go:129-147`). Existing DBs keep the zero value, because `CheckDefaultValues` only fills a format block when `LogbookRows == 0`.
4. UI: add a control in `app/ui/src/components/PdfExport/OtherSettings.jsx` or `PAGE_SETTINGS_CONFIG` (`app/ui/src/components/PdfExport/PageSettings.jsx:10-20`). Integer fields go in `INT_FIELDS` (`app/ui/src/components/PdfExport/SaveSettingsButton.jsx:11-14`), which is always parsed with `parseInt` (`:45`). For mm values, add a `FLOAT_FIELDS` list parsed with `parseFloat`. None exists yet; moving the margins and row heights there also fixes §11 #5. For page-section fields, add the key to `PageSettingsFields` (`app/ui/src/components/PdfExport/RestoreDefaultsButton.jsx:18-21`).
5. Read it in `internal/pdfexport` through `p.Export.<Field>`. Apply it in **both** `internal/pdfexport/pdfexport_a4.go` and `internal/pdfexport/pdfexport_a5.go`.

**Recipe B — print a new logbook field / add a column**
1. Add it to the SELECT and `Scan` in `GetFlightRecordsForExport` (`internal/models/flightrecords.go:172-194`). If it is not in `logbook_view`, change the view for **both** engines in `internal/driver/db_structure.go:168-227` and bump `schemaVersion` (`:4`). If the field is new to the logbook, also add a `logbookTable` column with a both-engine `ColumnType` (`internal/driver/db_structure.go:23-53`) and a `FlightRecord` field (`internal/models/structs.go:25-79`); the logbook side is described in ARCHITECTURE_LOGBOOK.md.
2. Add `ColN` to `ColumnsWidth` and a header key to `ColumnsHeader` (`internal/models/structs.go:139-198`), plus defaults in `internal/models/models_defaults.go` (`pdfDefaultHeaders`, both default column sets). `ColumnsHeader` is also the type of `Settings.StandardFieldsHeaders` (`internal/models/structs.go:244`), so the new key appears among the standard field names too: add a default to `standardFieldsHeaders` (`internal/models/models_defaults.go:39-72`). Existing DBs are not backfilled, because `CheckDefaultValues` replaces those headers only when `Date` is empty (`internal/models/models_defaults.go:184-187`).
3. Extend `initHeaders`/`initColumns` (`internal/pdfexport/pdfexport.go:166-271`). **Every** hard-coded index after the insertion point shifts: body `w3[...]`, footer `w4[...]`, the extended adjustments `:259-270`, header3 index `20` (`internal/pdfexport/pdfexport_a4.go:78`, `internal/pdfexport/pdfexport_a5.go:180`) and the A5 split constants `header*_div` (`internal/pdfexport/pdfexport_a5.go:13-17`).
4. Print the cell in the body and footer functions of both formats. For A5, decide whether it goes on page A or page B.
5. UI: add it to `COLUMN_CONFIG` and `HEADERS_CONFIG` (`app/ui/src/components/PdfExport/PageSettings.jsx:22-135`) and update `columnCount = 23` (`app/ui/src/components/PdfExport/SaveSettingsButton.jsx:24`).
6. Existing DBs get width 0 (hidden) for the new column unless a migration sets a default.

**Recipe C — add a page format (e.g. Letter)**
1. Add a constant next to `PDFA4`/`PDFA5`, then update the `init` check, the `initPDF` switch, the `titlePage` coordinates and the `printCustomTitle` sizes/params (`internal/pdfexport/pdfexport.go:17-20`, `:149`, `:276-281`, `:345-358`, `:389-404`). Add an `ExportX` function.
2. Handler: add a constant and a switch branch in `HandlerApiExportLogbook` (`app/handlers_export.go:17-18`, `:111-160`, including the A4/A5 `if` blocks at `:118-122` and `:155-158`). Add a `Settings.ExportX` block (`internal/models/structs.go:235-236`) and `pdfXDefaults`/`pdfXDefaultColumns` in `internal/models/models_defaults.go` (next to `:75-147`), plus branches in `CheckDefaultValues` (`internal/models/models_defaults.go:163-176`), `GetPdfDefaults` (`internal/models/settings.go:70-81`) and the `HandlerApiSettingsExportUpdate` switch (`app/handlers_settings.go:125-130`). Preserve the block in `HandlerApiSettingsUpdate` (`settings.ExportX = oldsettings.ExportX`, `app/handlers_settings.go:36-38`); otherwise every general settings save writes back the client's possibly stale copy.
3. Custom title id `custom_title_<fmt>`: add it to the exclusion in `GetAttachments` (`internal/models/attachments.go:43`).
4. UI: add a page, a route in `app/ui/src/main.jsx:81-85`, a sidebar entry in `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:61-64` and a menu item in `app/ui/src/components/Logbook/PDFExportButton.jsx:58-63`. Replace the A4/A5 ternary in `app/ui/src/components/PdfExport/PdfExport.jsx:33` with a lookup such as ``data[`export_${format.toLowerCase()}`]``; otherwise the new page loads A5's values and saves them into the new block. Extend the `showIf` margin rules in `app/ui/src/components/PdfExport/PageSettings.jsx:13-15`; otherwise the page has no left-margin input.

**Recipe D — change time formatting**
Keep the three implementations in step: PDF `formatTimeFieldOptions` (`internal/pdfexport/pdfexport.go:502-531`), UI `formatTimeField` (`app/ui/src/util/helpers.jsx:4-23`, also used by the CSV export) and server `app.formatTimeField` (`app/helpers.go:115`). Then update the toggle in `app/ui/src/components/PdfExport/OtherSettings.jsx:49-59` and the global settings toggle. Known divergence: FAA decimal rounding on exact ties. Go `%.1f` (`internal/pdfexport/pdfexport.go:513`, `app/helpers.go:122`) rounds half to even, while JS `toFixed(1)` (`app/ui/src/util/helpers.jsx:10`) rounds up, so 15 min prints `0.2` in the PDF and `0.3` in the UI and CSV. See ARCHITECTURE_SETTINGS.md §11 #7, and fix it in all three places together.

**Recipe E — add or fix a Quick CSV export**
Add a mapper key to `exportMappers` (`app/ui/src/components/UIElements/CSVExportButton.jsx:29-150`), then render `<CSVExportButton apiRef={apiRef} type="<key>" />` in the table's `customActions`. Take field names from the **row JSON**, not from the column ids (see §11 #11). Pass durations through `formatTimeField`. Include custom-field columns when the grid shows them (§11 #19): logbook rows hold the raw value in `row.custom_fields[uuid]`, while stats rows hold `{sum, count}` per field, read by `buildCustomFieldColumns` (`app/ui/src/components/Stats/helpers.jsx:40-51`). A mapper receives only `(rows, timeFieldsFormat)` (`app/ui/src/components/UIElements/CSVExportButton.jsx:158`), so the field definitions must be passed in.

**Recipe F — add an export endpoint**
Register it inside `r.Route("/export", ...)` under the `app.Auth` group (`app/routes.go:121-124`). Follow every `app.handleError(w, err)` with `return`: the helper only writes the JSON error and does not stop the handler (`app/helpers.go:53-63`). Answer mutations with `app.writeOkResponse` (`app/helpers.go:45-51`). Add a `default:` branch that returns an error for unknown formats. Add the client function to `app/ui/src/util/http/export.jsx` with the Bearer header.

**Cross-check list before finishing a change here**
- [ ] A4 **and** A5 updated, including the A5 page A/page B split and the extended-format width adjustments.
- [ ] Hidden (0 mm) columns still render: every new cell printer checks `w <= 0`.
- [ ] `fill` and `logbook_rows` cannot reach 0 (guard in the handler or the exporter).
- [ ] New `ExportPDF` fields are copied in `HandlerApiSettingsExportUpdate` and are restorable in `RestoreDefaultsButton`.
- [ ] SQL or view change: both engines in `internal/driver/db_structure.go`, `schemaVersion` bumped.
- [ ] Routes inside the `/api` group under `Auth`. UI requests send `Authorization: Bearer`.
- [ ] React Query: invalidate `['settings']` after layout writes and `['custom-title', format]` after custom title writes.
- [ ] New glyphs exist in the embedded fonts (`internal/pdfexport/font/`). Only B612Mono is used for `✓`.
- [ ] `go vet ./...` and `make test` (after `make build_ui`). Manually export A4 and A5 with 0, 1 and exactly `logbook_rows` records, with and without extended format, signature and custom title.
- [ ] `CHANGELOG.md` `[Unreleased]` bullet (`- New:`/`- Update:`/`- Fix:`) plus its copy in `README.md` (changelog section at `README.md:66`). Update the README Export section (`README.md:247-263`) and the API examples (`README.md:330`, `:342`, `:351`) if behaviour or routes change.

## 13. AI Notes

### Mental Model
`HandlerApiExportLogbook` gathers three inputs: records (newest first), the settings JSON and an optional custom title blob. It builds a `PDFExporter` that holds three running totals (page, previous, total, the last two seeded with previous experience). The exporter walks the records backwards, printing rows into a fixed grid built from 23 mm widths, and writes the finished PDF straight to the response. A5 is the same grid cut into a left and a right page, with each batch of records printed twice. All layout knobs live in `settings2` JSON. The UI is a form over that JSON plus a download button.

### Gotchas
- Export uses the **saved** settings. Edits on the export page do nothing until Save is clicked.
- `page_breaks` can be typed but is never persisted (§11 #1).
- Body and footer cells are addressed by **hard-coded indices** into `w3`/`w4`. Inserting a column shifts all of them, including the extended-format adjustments and the A5 split constants.
- `fill = 0` panics the request. `logbook_rows = 0` resets the format block at the next startup.
- The PDF has its own `time_fields_auto_format` per format, separate from the global setting. `0` means H:MM.
- Dates are printed raw (ISO `YYYY-MM-DD`). There is no date formatting in Go.
- Totals do not reset at page breaks: a "new logbook" carries the totals forward.
- MCC rows have ME zeroed, so PDF totals can differ from logbook-table totals for ME.
- Format strings are uppercase only. `/api/export/a4` crashes the request.
- Custom titles are rows in `attachments` with fixed uuids. They are hidden from the Attachments page by a literal `WHERE` in `GetAttachments`.
- `CustomTitlePreview` (`app/ui/src/components/PdfExport/CustomTitlePreview.jsx:21-27`) relies on `GET /api/attachment/{uuid}` returning 200 with a zero-value attachment (`document: null`) when no title exists (`internal/models/attachments.go:107-111`). Do not turn that reply into an error or 404 without changing this caller (ARCHITECTURE_CURRENCY_LICENSING.md §11 #1).
- "Restore defaults" is client-side only. `DBModel.UpdateDefaults` is dead code.
- The Quick CSV export never calls the server. It exports the grid's currently visible (filtered) rows.

### File Quick Reference
| Need | File |
|---|---|
| Render logic shared by both formats | `internal/pdfexport/pdfexport.go` |
| A4 grid | `internal/pdfexport/pdfexport_a4.go` |
| A5 two-page grid | `internal/pdfexport/pdfexport_a5.go` |
| HTTP export + custom title upload | `app/handlers_export.go` |
| Save / defaults of export settings | `app/handlers_settings.go:102-154`, `internal/models/settings.go:70-81` |
| Defaults values | `internal/models/models_defaults.go:4-147` |
| Data for export | `internal/models/flightrecords.go:168-203` |
| Settings types | `internal/models/structs.go:139-218` |
| UI export page | `app/ui/src/components/PdfExport/PdfExport.jsx` |
| UI HTTP calls | `app/ui/src/util/http/export.jsx`, `app/ui/src/util/http/settings.jsx:48-66` |
| Quick CSV | `app/ui/src/components/UIElements/CSVExportButton.jsx` |

> **AI Usage Instructions**
> - Always read this file before modifying this system
> - Do not refactor without impact analysis
> - Ask if information is missing
