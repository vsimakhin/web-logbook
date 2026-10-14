# Currency, Licensing & Attachments — Architecture

**Last Updated:** 2026-10-14 — initial version generated from code and fact-checked (TASK_AGENT_WORKFLOW_SETUP); 2026-10-14 — §11 cross-links to DATABASE/LOGBOOK/STATS_AND_MAP, orphan-attachment display (consistency pass)

## Table of Contents

- [1. Overview](#1-overview)
- [2. Key Concepts](#2-key-concepts)
- [3. How It Works](#3-how-it-works)
- [4. Components & Files](#4-components--files)
  - [4.1 File Index](#41-file-index)
  - [4.2 API Endpoints](#42-api-endpoints)
  - [4.3 Data Access](#43-data-access)
  - [4.4 UI](#44-ui)
- [5. Data Model & Persistence](#5-data-model--persistence)
- [6. Data Flow](#6-data-flow)
- [7. Config & Constants](#7-config--constants)
- [8. Error Handling & Edge Cases](#8-error-handling--edge-cases)
- [9. Integration Points](#9-integration-points)
- [10. Testing](#10-testing)
- [11. Known Issues & Tech Debt](#11-known-issues--tech-debt)
- [12. Rules for Future Development](#12-rules-for-future-development)
- [13. AI Notes](#13-ai-notes)

## 1. Overview

This doc covers three related features that sit next to the flight log:

- **Currency**: rules the pilot writes, such as "90 hours in the last 28 days" or "3 landings in 90 days". Each rule is checked against the logbook and shows progress, a pass/fail state and an expiry date.
- **Licensing**: license and certificate records with dates, remarks and one optional scanned document. The navigation bar shows badges for licenses that are expiring soon or already expired.
- **Attachments**: files attached to flight records. They can be viewed per flight, as one global list with preview, or downloaded together as a ZIP.

The backend side is three handler files and three model files. Each one is a thin CRUD layer over the tables `currency`, `licensing` and `attachments` and the view `attachments_view`. All the currency logic (summing, comparing, expiry) runs **in the browser** in `app/ui/src/components/Currency/helpers.jsx`. The server only stores rule definitions (`internal/models/currency.go`). Documents are stored as BLOBs inside the database, not on the file system (`internal/driver/db_structure.go:91`, `internal/driver/db_structure.go:99`).

## 2. Key Concepts

| Concept | Definition / invariant | Evidence |
|---|---|---|
| Currency rule | Row in `currency`: `name`, `metric`, `target_value`, `comparison`, `time_frame{unit,value,since}`, `filters`, `sub_metrics`. Only the definition is stored. The server never evaluates it. | `Currency` in `internal/models/structs.go:327-340` |
| Metric path | A dotted path resolved against the FlightRecord JSON: `time.<field>`, `landings.day/night/all`, `sim.time`. Resolved by `getFlightMetricValue`. | `app/ui/src/components/Currency/helpers.jsx:97-106`, `internal/models/structs.go:40-62` |
| Units | Flight times are integer **minutes**. A currency `target_value` for a time metric is an integer number of **hours**: any metric whose name contains `time` is multiplied by 60 (`isTimeMetric`). Landings targets are counts. | `app/ui/src/components/Currency/helpers.jsx:7`, `app/ui/src/components/Currency/helpers.jsx:53-64`, `app/ui/src/util/http/currency.jsx:18-19` |
| Comparison | One of `>=`, `>`, `=`, `<`, `<=`. | `app/ui/src/components/Currency/helpers.jsx:9` |
| Time frame unit | `days`, `calendar_months`, `calendar_years`, `since` (stored date), `all_time`. | `app/ui/src/components/Currency/helpers.jsx:11-17`, `getStartDate` `app/ui/src/components/Currency/helpers.jsx:19-36` |
| Filters | Comma-separated aircraft categories. They are resolved to registrations through `/api/aircraft/list` categories. Empty filters mean all flights. Filters that match no aircraft also count all flights, because an empty registration set means "no filter" (`regs.size === 0`, see #20). | `resolveAircraftsFromFilters` `app/ui/src/components/Currency/helpers.jsx:66-84`, `app/ui/src/components/Currency/helpers.jsx:111-114`, `app/ui/src/components/Currency/helpers.jsx:277-280` |
| Sub-metrics | JSON array string in `currency.sub_metrics`: `[{id, metric, comparison, target_value}]`. A sub-metric is summed only over flights where the main metric is > 0. The rule passes only if the main metric and every sub-metric pass. | `app/ui/src/components/Currency/helpers.jsx:129-150`, `app/ui/src/components/Currency/CurrencyModal.jsx:124-133` |
| Currency expiry | Landing metrics: the N-th most recent landing date + time frame. Time metrics: only for the `days` unit with `>=`/`>`, the date the oldest needed flight leaves the rolling window. `since`/`all_time` rules have no expiry. When the rule has sub-metrics, the earliest expiry wins. | `getSingleMetricExpiry` `app/ui/src/components/Currency/helpers.jsx:175-272`, `getCurrencyExpiryForRule` `app/ui/src/components/Currency/helpers.jsx:274-302` |
| License record | Row in `licensing`. `category` is free text: categories are the distinct values already in use (`app/ui/src/components/LicenseRecord/LicenseCategory.jsx:6-12`). The record holds at most one document (`document_name` + `document` BLOB) in the same row. | `internal/driver/db_structure.go:82-93` |
| Date storage | All stored dates are ISO `YYYY-MM-DD` strings (licensing dates, `time_frame_since`). Before v5 they were `DD/MM/YYYY` and were converted by the data overhaul migration. Display uses the `dateFieldsFormat` setting. | `internal/driver/data_overhaul.go:14-15`, `internal/driver/data_overhaul.go:311-405`, `app/ui/src/components/UIElements/DatePicker.jsx:10` |
| License expiration badges | `settings.licenses_expiration{show_expired, show_warning, warning_period}`. The UI falls back to a 90-day warning period. | `internal/models/structs.go:246-250`, `app/ui/src/components/Licensing/LicensingNavTitle.jsx:15-36` |
| Attachment | Row in `attachments`: `uuid`, `record_id` (the flight UUID, with no FK), `document_name`, `document` BLOB. Size (KB) and flight info are computed by `attachments_view`. | `internal/driver/db_structure.go:95-100`, `internal/driver/db_structure.go:295-342` |
| Reserved attachment IDs | `custom_title_a4` / `custom_title_a5` are custom PDF title pages stored in `attachments` with `uuid = record_id = id`. `GetAttachments` excludes them. | `app/handlers_export.go:46-49`, `internal/models/attachments.go:43` |
| Blob transport | Go `[]byte` fields (`License.Document`, `Attachment.Document`) are serialized to JSON as base64. The UI decodes them with `atob`. | `internal/models/structs.go:285`, `internal/models/structs.go:293`, `app/ui/src/components/Attachments/DownloadAttachmentButton.jsx:19` |

## 3. How It Works

**Currency**

| Step | What happens | Evidence |
|---|---|---|
| 1 | `/currency` route renders `CurrencyPage` → `Currency` | `app/ui/src/main.jsx:79`, `app/ui/src/pages/CurrencyPage.jsx:5` |
| 2 | Loads three datasets: logbook (`['logbook']`), rules (`['currency']`), aircraft (`['aircrafts']`). Shows a progress bar until all are loaded | `app/ui/src/components/Currency/Currency.jsx:13-26` |
| 3 | For each rule, `evaluateCurrency` + `getCurrencyExpiryForRule` run in a `useMemo` | `app/ui/src/components/Currency/CurrencyTable.jsx:176-186` |
| 4 | Table columns: Metric (with sub-metrics), Target, Time Frame, Filters, Valid Until, Expire (colored: under 30 days = warning), Status (progress bar + tooltip) | `app/ui/src/components/Currency/CurrencyTable.jsx:188-253` |
| 5 | New/Edit opens `CurrencyModal`. Save → POST `/currency/new` or PUT `/currency/{uuid}` → invalidate `['currency']` | `app/ui/src/components/Currency/CurrencyModal.jsx:38-63` |
| 6 | Delete asks for confirmation → DELETE `/currency/{uuid}` → invalidate `['currency']` | `app/ui/src/components/Currency/DeleteCurrencyButton.jsx:17-35` |

**Licensing**

| Step | What happens | Evidence |
|---|---|---|
| 1 | `/licensing` → `LicensingTable` (sorted by category, name on the server). Columns: Issued, Valid From, Valid Until, Expire (colored by warning period) | `app/ui/src/main.jsx:55-57`, `app/ui/src/components/Licensing/LicensingTable.jsx:17-150`, `internal/models/licensing.go:12` |
| 2 | Clicking a name → `/licensing/:id`; "New" → `/licensing/new` | `app/ui/src/components/Licensing/LicensingTable.jsx:56`, `app/ui/src/components/Licensing/NewLicenseRecordButton.jsx:13` |
| 3 | `LicenseRecord` fetches `['license', id]` (skipped for `new`). It edits local state and previews the document (image/PDF detected with `file-type`) | `app/ui/src/components/LicenseRecord/LicenseRecord.jsx:22-42`, `app/ui/src/components/LicenseRecord/LicensePreview.jsx:9-52` |
| 4 | Save validates that category and name are set, builds `FormData` (multipart) → POST `/licensing/new` (navigates to the new uuid) or PUT `/licensing/{uuid}` | `app/ui/src/components/LicenseRecord/SaveLicenseRecordButton.jsx:39-69`, `app/ui/src/components/LicenseRecord/SaveLicenseRecordButton.jsx:25-34` |
| 5 | Delete record / delete attachment, each with a confirmation dialog | `app/ui/src/components/LicenseRecord/DeleteLicenseRecordButton.jsx:18-41`, `app/ui/src/components/LicenseRecord/DeleteLicenseRecordAttachmentButton.jsx:17-37` |
| 6 | Nav badge counts: `LicensingNavTitle` counts expired and expiring-soon licenses from `['licensing']` + settings | `app/ui/src/components/Licensing/LicensingNavTitle.jsx:11-56`, `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:43` |

**Attachments**

| Step | What happens | Evidence |
|---|---|---|
| 1 | Flight record page embeds `FlightRecordAttachment/Attachments` (hidden for `new`) | `app/ui/src/components/FlightRecord/FlightRecord.jsx:81`, `app/ui/src/components/FlightRecordAttachment/Attachments.jsx:21-46` |
| 2 | Add attachment: multi-file input → one POST `/attachment/upload` per file (`document`, `id` = flight uuid) | `app/ui/src/components/FlightRecordAttachment/AddAttachmentButton.jsx:25-35` |
| 3 | Add track (KML/GPX): parse coordinates in the browser → upload the file as an attachment → POST `/logbook/track/{id}` with the coordinates, one after the other | `app/ui/src/components/FlightRecordAttachment/AddTrackButton.jsx:40-79` |
| 4 | Per-attachment menu: Convert to track (`.kml` only), Download, Delete (for `.kml`, optionally reset the track) | `app/ui/src/components/FlightRecordAttachment/Attachment.jsx:33-45`, `app/ui/src/components/FlightRecordAttachment/ConvertAttachmentToTrackButton.jsx:28-45`, `app/ui/src/components/FlightRecordAttachment/DeleteAttachmentButton.jsx:38-65` |
| 5 | Global `/attachments` page: list of all attachments (newest flight first), with a preview on row click and "Download all/filtered" as a ZIP | `app/ui/src/main.jsx:68`, `app/ui/src/components/Attachments/Attachments.jsx:12-35`, `app/ui/src/components/Attachments/AttachmentsTable.jsx:87-104`, `app/ui/src/components/Attachments/DownloadAllAttachmentsButton.jsx:31-46` |

## 4. Components & Files

### 4.1 File Index

| File | Responsibility |
|---|---|
| `app/handlers_currency.go` | Currency CRUD handlers (JSON bodies) |
| `app/handlers_licensing.go` | Licensing CRUD + multipart parsing (`ParseLicenseFormData`) + delete document |
| `app/handlers_attachments.go` | Attachment list/get/delete/upload + streaming ZIP download |
| `internal/models/currency.go` | `currency` table SQL |
| `internal/models/licensing.go` | `licensing` table SQL |
| `internal/models/attachments.go` | `attachments` table + `attachments_view` SQL |
| `internal/models/structs.go:274-298`, `internal/models/structs.go:326-340` | `License`, `Attachment`, `Currency` structs |
| `internal/driver/db_structure.go:82-132`, `internal/driver/db_structure.go:295-342` | DDL for the three tables and `attachments_view` |
| `app/ui/src/util/http/currency.jsx`, `app/ui/src/util/http/licensing.jsx`, `app/ui/src/util/http/attachment.jsx` | Fetch wrappers (Bearer token, `handleFetch`) |
| `app/ui/src/hooks/queries/useLicensingQuery.js` | Shared `['licensing']` query (list, categories, nav badges) |
| `app/ui/src/components/Currency/*` | Currency page, modal, evaluation helpers + vitest |
| `app/ui/src/components/Licensing/*` | License list, nav badge, `calculateExpiry` |
| `app/ui/src/components/LicenseRecord/*` | Single license editor, preview, document actions |
| `app/ui/src/components/Attachments/*` | Global attachments page, preview, ZIP |
| `app/ui/src/components/FlightRecordAttachment/*` | Per-flight attachments, track upload/convert, KML/GPX parser |
| `app/ui/src/pages/CurrencyPage.jsx`, `app/ui/src/pages/LicensingPage.jsx`, `app/ui/src/pages/LicenseRecordPage.jsx`, `app/ui/src/pages/AttachmentsPage.jsx` | One-line page wrappers |

### 4.2 API Endpoints

All of these routes are inside `r.Route("/api")` with `r.Use(app.Auth)` (`app/routes.go:26-27`).

| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/api/currency/list` | `HandlerApiCurrencytList` (sic) `app/handlers_currency.go:12` | `[]Currency` or `null` when empty |
| GET | `/api/currency/{uuid}` | `HandlerApiCurrencyGet` `app/handlers_currency.go:21` | Not used by the UI (no GET caller in `app/ui/src`; `app/ui/src/util/http/currency.jsx` only lists, creates, updates and deletes) |
| POST | `/api/currency/new` | `HandlerApiCurrencyNew` `app/handlers_currency.go:31` | Server generates the UUID (`app/handlers_currency.go:39-44`); returns the bare JSON string `"New currency created"` |
| PUT | `/api/currency/{uuid}` | `HandlerApiCurrencyUpdate` `app/handlers_currency.go:54` | Uses the body `uuid`, **ignores the URL param** |
| DELETE | `/api/currency/{uuid}` | `HandlerApiCurrencyDelete` `app/handlers_currency.go:69` | |
| GET | `/api/licensing/list` | `HandlerApiGetLicensingRecords` `app/handlers_licensing.go:15` | No `document` column |
| GET | `/api/licensing/{uuid}` | `HandlerApiGetLicensingRecord` `app/handlers_licensing.go:26` | Includes base64 `document`; gzip `middleware.Compress(5)` (`app/routes.go:56`) |
| POST | `/api/licensing/new` | `HandlerApiNewLicensingRecord` `app/handlers_licensing.go:78` | multipart; returns `JSONResponse{ok, message, data: uuid}` (`app/handlers_licensing.go:99-104`) |
| PUT | `/api/licensing/{uuid}` | `HandlerApiUpdateLicensingRecord` `app/handlers_licensing.go:108` | multipart; uses the form `uuid` (`app/handlers_licensing.go:46`), ignores the URL param |
| DELETE | `/api/licensing/{uuid}` | `HandlerApiDeleteLicensingRecord` `app/handlers_licensing.go:127` | |
| DELETE | `/api/licensing/{uuid}/attachment` | `HandlerApiDeleteLicensingAttachment` `app/handlers_licensing.go:139` | Clears `document_name`/`document` |
| GET | `/api/attachment/list` | `HandlerApiGetAttachments` `app/handlers_attachments.go:31` | Without body; excludes custom titles |
| GET | `/api/attachment/list/{uuid}` | `HandlerApiGetFlightRecordAttachments` `app/handlers_attachments.go:18` | `{uuid}` = flight `record_id` |
| GET | `/api/attachment/{uuid}` | `HandlerApiGetAttachment` `app/handlers_attachments.go:42` | Includes base64 `document`; Compress(5) (`app/routes.go:67`) |
| DELETE | `/api/attachment/{uuid}` | `HandlerApiDeleteAttachment` `app/handlers_attachments.go:55` | |
| POST | `/api/attachment/upload` | `HandlerApiUploadAttachment` `app/handlers_attachments.go:68` | multipart `id` + `document` |
| POST | `/api/attachment/zip-download` | `HandlerApiZipDownload` `app/handlers_attachments.go:120` | JSON `{ids: []}` → streamed `application/zip` |

### 4.3 Data Access

Every method uses `ContextWithDefaultTimeout()` (`internal/models/helpers.go:22`). None of them uses a transaction.

**`internal/models/currency.go`** — table `currency`

| Method | Purpose | SQL |
|---|---|---|
| `GetCurrencies` `internal/models/currency.go:3` | List all rules; `IFNULL(sub_metrics,'')` | SELECT, no ORDER BY |
| `GetCurrency` `internal/models/currency.go:29` | One rule by uuid | SELECT … WHERE uuid |
| `UpdateCurrency` `internal/models/currency.go:46` | Update all fields | UPDATE |
| `InsertCurrency` `internal/models/currency.go:60` | Insert | INSERT |
| `DeleteCurrency` `internal/models/currency.go:72` | Delete | DELETE |

**`internal/models/licensing.go`** — table `licensing`

| Method | Purpose | SQL |
|---|---|---|
| `GetLicenses` `internal/models/licensing.go:4` | List without `document` | SELECT … ORDER BY category, name |
| `GetLicenseRecordByID` `internal/models/licensing.go:32` | One record with `document` | SELECT |
| `UpdateLicenseRecord` `internal/models/licensing.go:52` | Two variants: when `DocumentName != ""` it also replaces `document_name`/`document`, otherwise it leaves them untouched (`internal/models/licensing.go:56-78`) | UPDATE |
| `InsertLicenseRecord` `internal/models/licensing.go:84` | Insert including the document | INSERT |
| `DeleteLicenseRecord` `internal/models/licensing.go:101` | Delete row | DELETE |
| `DeleteLicenseAttachment` `internal/models/licensing.go:110` | `document_name = ""`, `document = null` | UPDATE |

**`internal/models/attachments.go`** — table `attachments`, view `attachments_view`

| Method | Purpose | Source |
|---|---|---|
| `GetFlightRecordAttachments` `internal/models/attachments.go:9` | Attachments of one flight (no body) | `attachments_view` WHERE record_id |
| `GetAttachments` `internal/models/attachments.go:35` | All attachments except `custom_title_a4/a5`, ORDER BY flight_date DESC | `attachments_view` |
| `InsertAttachmentRecord` `internal/models/attachments.go:64` | Insert (also used by custom title upload) | `attachments` |
| `DeleteAttachment` `internal/models/attachments.go:75` | Delete by uuid (also called by the custom-title upload, `app/handlers_export.go:77`) | `attachments` |
| `DeleteAttachmentsForFlightRecord` `internal/models/attachments.go:85` | Delete all for a flight (called on flight delete) | `attachments` |
| `GetAttachmentByID` `internal/models/attachments.go:95` | One attachment with body. **Returns a zero value and `nil` error on `sql.ErrNoRows`** (`internal/models/attachments.go:107-111`) | `attachments_view` |

### 4.4 UI

| Page / component | Role | Query key / API |
|---|---|---|
| `app/ui/src/components/Currency/Currency.jsx` | Loads data, renders the table | `['logbook']`, `['currency']` (`app/ui/src/components/Currency/Currency.jsx:17`), `['aircrafts']` |
| `app/ui/src/components/Currency/CurrencyTable.jsx` | Evaluation, cells (`MetricCell`, `ExpireCell`, `StatusCell`) | — |
| `app/ui/src/components/Currency/CurrencyModal.jsx` | Create/edit dialog, sub-metric editor | `createCurrency`/`updateCurrency`, invalidates `['currency']` |
| `app/ui/src/components/Currency/helpers.jsx` | Evaluation and expiry engine | pure functions |
| `app/ui/src/components/Licensing/Licensing.jsx`, `app/ui/src/components/Licensing/LicensingTable.jsx` | License list + CSV export button (`type="licensing"`) | `useLicensingQuery` → `['licensing']` |
| `app/ui/src/components/Licensing/LicensingNavTitle.jsx` | Warning/expired chips in the navigation | `['licensing']` + `useSettings` |
| `app/ui/src/components/Licensing/helpers.jsx` | `calculateExpiry(dayjs)` → `{months, days, diffDays}` | — |
| `app/ui/src/components/LicenseRecord/LicenseRecord.jsx` | Editor shell | `['license', id]` (`app/ui/src/components/LicenseRecord/LicenseRecord.jsx:27`) |
| `app/ui/src/components/LicenseRecord/LicenseRecordDetails.jsx` | Fields + file input (keeps `File` in state) | — |
| `app/ui/src/components/LicenseRecord/SaveLicenseRecordButton.jsx` | multipart save | invalidates `['license', license.id]`, `['licensing']` |
| `app/ui/src/components/LicenseRecord/LicenseCategory.jsx` | freeSolo select over existing categories | `['licensing']` |
| `app/ui/src/components/LicenseRecord/LicensePreview.jsx` | Image/PDF preview from a `File` or base64 | — |
| `app/ui/src/components/Attachments/Attachments.jsx` + `app/ui/src/components/Attachments/AttachmentsTable.jsx` | Global list; filtered rows feed the ZIP button | `['attachments']` (`app/ui/src/components/Attachments/Attachments.jsx:16`) |
| `app/ui/src/components/Attachments/AttachmentPreview.jsx` | Blob URL preview | `['attachments','attachment',uuid]` (`app/ui/src/components/Attachments/AttachmentPreview.jsx:19`) |
| `app/ui/src/components/FlightRecordAttachment/Attachments.jsx` | Per-flight list | `['attachments', id]` (`app/ui/src/components/FlightRecordAttachment/Attachments.jsx:23`) |
| `app/ui/src/components/FlightRecordAttachment/helpers.jsx` | `parseTrackFile` (KML/GPX → `[lat,lng][]`) | — |

All `['attachments', …]` keys share the `['attachments']` prefix, so invalidating `['attachments']` refreshes every attachment query.

## 5. Data Model & Persistence

The DDL is declarative and comes in per-engine pairs (`internal/driver/db_structure.go:6-14`). The tables are created and checked by `validateDB` only when `schemaVersion` changes (`internal/driver/driver.go:56-73`).

**`licensing`** (`internal/driver/db_structure.go:82-93`), PK `uuid` (`TEXT` / `VARCHAR(36)`)

| Column | SQLite | MySQL | Notes |
|---|---|---|---|
| category, name, number | TEXT | VARCHAR(255) | nullable |
| issued, valid_from, valid_until | TEXT | VARCHAR(32) | `YYYY-MM-DD` or `""` |
| document_name | TEXT | VARCHAR(512) | `""` when no document |
| document | BLOB | LONGBLOB | NULL after delete-attachment |
| remarks | TEXT | TEXT | |

**`attachments`** (`internal/driver/db_structure.go:95-100`), PK `uuid`: `record_id` (`TEXT`/`VARCHAR(36)`, **no index, no FK**), `document_name` (`TEXT`/`VARCHAR(512)`), `document` (`BLOB`/`LONGBLOB`).

**`currency`** (`internal/driver/db_structure.go:121-132`), PK `uuid`

| Column | SQLite | MySQL | Constraint |
|---|---|---|---|
| name, metric, comparison, time_frame_unit | TEXT | VARCHAR(255) | NOT NULL |
| target_value, time_frame_value | INTEGER | INT | NOT NULL |
| time_frame_since | TEXT | VARCHAR(32) | NOT NULL DEFAULT '' |
| filters, sub_metrics | TEXT | TEXT | nullable; `sub_metrics` holds a JSON array string |

**`attachments_view`** (`internal/driver/db_structure.go:295-342`): the SQLite and MySQL SQL text is identical. It selects `a.uuid, a.record_id, a.document_name, a.document` (an explicit list, not `attachments.*`, so a new `attachments` column does not appear in the view automatically: `internal/driver/db_structure.go:297-301`, `internal/driver/db_structure.go:319-323`) plus `ROUND(LENGTH(a.document)/1024,0) AS document_size` (KB), `IFNULL(l.date,'') AS flight_date` and `flight_info` (`departure_place departure_time - arrival_place arrival_time` via `CONCAT`, or `''` when there is no departure place), with a `LEFT JOIN logbook`. SQLite truncates `LENGTH/1024` (integer division) while MySQL rounds a decimal quotient, so `document_size` can differ by 1 KB between engines; for example, 1600 bytes gives 1 on SQLite and 2 on MySQL (`internal/driver/db_structure.go:302`, `internal/driver/db_structure.go:324`).

**Attachment count in `logbook_view`**: a `LEFT JOIN (SELECT record_id, COUNT(*) … FROM attachments GROUP BY record_id)` (`internal/driver/db_structure.go:186-191` SQLite, `internal/driver/db_structure.go:213-218` MySQL) feeds `attachments_count` in the logbook table (`app/ui/src/components/Logbook/helpers.jsx:173`).

**Persistence vs memory**: there is no server-side cache. On the client, the list queries (`['licensing']`, `['currency']`, `['attachments']`, `['attachments', id]`) and the attachment-preview query `['attachments','attachment',uuid]` use `staleTime`/`gcTime` = 1 h (see §7). The single-license query `['license', id]` sets no cache options (`app/ui/src/components/LicenseRecord/LicenseRecord.jsx:26-30`) and the `QueryClient` has no defaults (`app/ui/src/util/http/http.jsx:4`), so TanStack defaults apply: `staleTime` 0, and a refetch on window focus or remount. The PDF page's `['custom-title', format]` attachment query also uses the defaults (`app/ui/src/components/PdfExport/CustomTitlePreview.jsx:23-27`). Currency results are recomputed in memory on every render where their inputs change (`app/ui/src/components/Currency/CurrencyTable.jsx:176-186`).

## 6. Data Flow

| Operation | UI → HTTP | Handler → Model → DB | Back to UI |
|---|---|---|---|
| Evaluate currency | `fetchCurrency` (`app/ui/src/util/http/currency.jsx:5`) + logbook + aircraft | `GetCurrencies` → SELECT `currency` | `evaluateCurrency`/`getCurrencyExpiryForRule` in the browser |
| Save currency | `createCurrency`/`updateCurrency` (`app/ui/src/util/http/currency.jsx:15`, `app/ui/src/util/http/currency.jsx:29`); `parseInt` on main target/value only | JSON decode → `InsertCurrency`/`UpdateCurrency` | invalidate `['currency']` |
| Save license | `FormData` (`app/ui/src/components/LicenseRecord/SaveLicenseRecordButton.jsx:56-66`) → `createLicenseRecord`/`updateLicenseRecord` with `returnJson=false` (`app/ui/src/util/http/licensing.jsx:32`, `app/ui/src/util/http/licensing.jsx:42`) | `ParseLicenseFormData` (`app/handlers_licensing.go:38-75`) → `InsertLicenseRecord`/`UpdateLicenseRecord` | Blob response parsed by hand: `JSON.parse(await data.text())` (`app/ui/src/components/LicenseRecord/SaveLicenseRecordButton.jsx:26`) |
| Open license | `fetchLicense` (`app/ui/src/util/http/licensing.jsx:15`) | `GetLicenseRecordByID` → `document` BLOB → base64 | `LicensePreview` decodes it and sniffs the MIME type |
| Upload attachment | `uploadAttachement` (sic, `app/ui/src/util/http/attachment.jsx:52`) | `HandlerApiUploadAttachment` → `io.ReadAll` → `InsertAttachmentRecord` | invalidate `['attachments']`, `['logbook']` (`app/ui/src/components/FlightRecordAttachment/AddAttachmentButton.jsx:18-19`) |
| Preview/download | `fetchAttachment` (`app/ui/src/util/http/attachment.jsx:35`) | `GetAttachmentByID` (view) | `atob` → Blob → object URL |
| ZIP download | `downloadAttachments({ids})` (`app/ui/src/util/http/attachment.jsx:25`), `returnJson=false` | `HandlerApiZipDownload`: one `GetAttachmentByID` per id, `zip.Writer` streams to `w` (`app/handlers_attachments.go:137-165`) | Blob → `attachments.zip` |
| Track from file | `parseTrackFile` → upload attachment → `uploadTrackLog` (`app/ui/src/util/http/logbook.jsx:133`) | `/api/logbook/track/{uuid}` (`app/routes.go:47-50`) | invalidate `['attachments', id]`, `['flight', id]`, `['logbook']` |

## 7. Config & Constants

| Constant | Value | Where | Kind |
|---|---|---|---|
| Multipart in-memory limit | `32 << 20` (32 MB) | `app/handlers_licensing.go:39`, `app/handlers_attachments.go:70`, `app/handlers_export.go:39` | (hardcoded) |
| HTTP server read/write timeouts | none set | `app/main.go:52-59` | (hardcoded) |
| DB query timeout | `60 * time.Second` | `internal/models/helpers.go:14` | (hardcoded) |
| gzip level for blob GETs | `middleware.Compress(5)` | `app/routes.go:56`, `app/routes.go:67` | (hardcoded) |
| ZIP filename | `attachments.zip` | `app/handlers_attachments.go:138`, `app/ui/src/components/Attachments/DownloadAllAttachmentsButton.jsx:22` | (hardcoded) |
| Reserved attachment IDs | `custom_title_a4`, `custom_title_a5` | `internal/models/attachments.go:43`, `app/handlers_export.go:140` | (hardcoded) |
| License warning period | default 90 days | `app/ui/src/components/Licensing/LicensingNavTitle.jsx:21`, `app/ui/src/components/Licensing/LicensingTable.jsx:22`, `app/ui/src/util/http/settings.jsx:17` | (configurable) via Settings `licenses_expiration.warning_period` |
| License badges on/off | `show_warning`, `show_expired` | `internal/models/structs.go:246-250`, `app/ui/src/components/Settings/GeneralSettings/LicensesExpiration.jsx:29-41` | (configurable) |
| Currency "expire soon" color | under 30 days | `app/ui/src/components/Currency/CurrencyTable.jsx:88` | (hardcoded) |
| Status bar warning threshold | 75 % | `app/ui/src/components/Currency/helpers.jsx:309`, `app/ui/src/components/Currency/helpers.jsx:314` | (hardcoded) |
| Status label cap | `500+%` | `app/ui/src/components/Currency/CurrencyTable.jsx:108` | (hardcoded) |
| New currency defaults | `time.total_time`, `>=`, target 0, `days`/90 | `app/ui/src/constants/constants.jsx:84-96` | (hardcoded) |
| New license defaults | dates = today (evaluated when the module loads) | `app/ui/src/constants/constants.jsx:54-65` | (hardcoded) |
| Query cache | `staleTime`/`gcTime` 3 600 000 ms | `app/ui/src/hooks/queries/useLicensingQuery.js:7-8`, `app/ui/src/components/Currency/Currency.jsx:19-20`, `app/ui/src/components/Attachments/Attachments.jsx:18-19`, `app/ui/src/components/FlightRecordAttachment/Attachments.jsx:26-27`, `app/ui/src/components/Attachments/AttachmentPreview.jsx:21-22`. Not set for `['license', id]` (TanStack defaults, see §5) | (hardcoded) |
| Date picker min date | `1903-12-17` | `app/ui/src/components/UIElements/DatePicker.jsx:25` | (hardcoded) |
| Stored date format | `2006-01-02` (old: `02/01/2006`) | `internal/driver/data_overhaul.go:14-15` | (hardcoded) |
| API base URL | `/api`; dev `http://localhost:4000/api` | `app/ui/src/constants/constants.jsx:9-11` | (hardcoded, by Vite mode) |

## 8. Error Handling & Edge Cases

| Case | Behaviour | Evidence |
|---|---|---|
| Any DB/parse error | `handleError` logs `file:line` and returns **500** with `{ok:false, message: err.Error()}` | `app/helpers.go:53-63` |
| Unknown currency/license uuid on GET | `sql.ErrNoRows` → 500 with "sql: no rows in result set" | `internal/models/currency.go:38-41`, `internal/models/licensing.go:43-46` |
| Unknown attachment uuid on GET | 200 with an empty attachment (`document: null`) | `internal/models/attachments.go:107-111` |
| Update/delete of an unknown uuid | 200 success (rows affected is never checked) | `internal/models/currency.go:55-57`, `internal/models/licensing.go:105-106`, `internal/models/attachments.go:79-82` |
| No file part in multipart | `"no such file"` error ignored. License keeps its old document (update branch); an attachment row is inserted with no body | `app/handlers_licensing.go:57-61`, `internal/models/licensing.go:68-77`, `app/handlers_attachments.go:82-87` |
| Existing license document sent back as base64 text | Appended as a plain form field (`app/ui/src/components/LicenseRecord/SaveLicenseRecordButton.jsx:65`), so `FormFile` sees no file and the document stays unchanged | `app/handlers_licensing.go:57` |
| ZIP with no ids | 500 "No files selected" | `app/handlers_attachments.go:132-135` |
| ZIP entry failure | Silently `continue`; headers are already sent | `app/handlers_attachments.go:143-164` |
| ZIP filename safety | `/` and `\` stripped from names (zip-slip guard) | `app/handlers_attachments.go:150-152` |
| Empty list | Go nil slice → JSON `null`. The licensing query maps it to `[]` (`app/ui/src/hooks/queries/useLicensingQuery.js:10`). Currency and attachments rely on `XDataGrid` tolerating null (`app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:144`) | |
| Rule with empty `since` | `dayjs('', 'YYYY-MM-DD')` is invalid → `isBefore` is false → all flights count | `app/ui/src/components/Currency/helpers.jsx:28-29`, `app/ui/src/components/Currency/helpers.jsx:118-122` |
| 401 from API | `handleFetch` redirects to `/signin` | `app/ui/src/util/http/http.jsx:6-17` |

## 9. Integration Points

| System | What crosses the boundary |
|---|---|
| `ARCHITECTURE_LOGBOOK.md` | Currency reads the full logbook JSON (`useLogbookQuery`), so its numbers depend on the FlightRecord JSON shape (`internal/models/structs.go:24-79`). Flight delete calls `DeleteAttachmentsForFlightRecord` (`app/handlers_flightrecord.go:61`). Track upload/reset endpoints live in the logbook routes (`app/routes.go:47-50`). `logbook_view.attachments_count`. Flight save and bulk edit invalidate `['currency']` (`app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:44`, `app/ui/src/components/Logbook/BulkEditButtons.jsx:50`). |
| `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` | Currency filters resolve categories through `/api/aircraft/list` (`Aircraft.Category`, `internal/models/aircrafts.go:125-145`). |
| `ARCHITECTURE_SETTINGS.md` | `licenses_expiration` settings; `useSettings` gives `fieldNameF` (metric labels), `timeFieldsFormat`, `dateFieldsFormat`. |
| `ARCHITECTURE_PDF_EXPORT.md` | Custom title PDFs are stored in `attachments` (`HandlerApiUploadCustomTitle`, `app/handlers_export.go:38-90`) and read back at export (`app/handlers_export.go:140-142`). The PDF page uses this system's endpoints for them: `CustomTitlePreview` → GET `/api/attachment/{uuid}` (`app/ui/src/components/PdfExport/CustomTitlePreview.jsx:21-27`, relies on the 200 zero-value reply, see #1) and `DeleteCustomTitleButton` → DELETE `/api/attachment/{uuid}` (`app/ui/src/components/PdfExport/DeleteCustomTitleButton.jsx:16-19`). The upload can overwrite any attachment (#21). The license list uses the shared `CSVExportButton` (`licensing` mapper, `app/ui/src/components/UIElements/CSVExportButton.jsx:61-69`). |
| `ARCHITECTURE_DATABASE.md` | DDL, `schemaVersion`, `validateDB`, and the v5 date migration for `currency.time_frame_since` and the `licensing` dates (`internal/driver/data_overhaul.go:311-405`, run when version < 100: `internal/driver/driver.go:47-53`). |
| `ARCHITECTURE_APPLICATION.md` | Router, the `writeJSON`/`writeOkResponse`/`handleError` helpers, DB download/upload (which carries all BLOBs). |
| `ARCHITECTURE_AUTH.md` | All endpoints sit behind `app.Auth`. The UI adds `Authorization: Bearer` in every `util/http` call. |
| `ARCHITECTURE_FRONTEND.md` | Router entries (`app/ui/src/main.jsx:55-57`, `app/ui/src/main.jsx:68`, `app/ui/src/main.jsx:79`), navigation (`app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:43`, `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:48`, `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:58`), `XDataGrid`, `useDialogs`, notifications. |
| `ARCHITECTURE_STATS_AND_MAP.md` | Tracks created from KML/GPX attachments are stored in `logbook.track` (`internal/models/flightrecords.go:209`, via `HandlerApiTrackLogNew` `app/handlers_flightrecord.go:127`) and drawn by `FlightMap` when `flight.track` is set (`app/ui/src/components/FlightMap/FlightMap.jsx:171-172`). |

## 10. Testing

| Test | Covers | Run |
|---|---|---|
| `app/ui/src/components/Currency/helpers.test.jsx` | `parseSubMetrics`, `getFlightMetricValue`, `evaluateCurrency` (only `all_time`, sub-metrics), `getStatusBarColor`, `formatCurrencyValue` | `cd app/ui && npm run test:run` (`app/ui/package.json:12`). Also runs as part of `npm run build` (`app/ui/package.json:8`) |
| Go | **No tests** for the handlers or models in this system | `make test` (`Makefile:32-33`) runs other packages |

Gaps: `getCurrencyExpiryForRule`/`getSingleMetricExpiry`, the `days`/`calendar_*`/`since` start dates, filters, `calculateExpiry`, `parseTrackFile`, multipart parsing, ZIP streaming, and both DB engines for `attachments_view`.

## 11. Known Issues & Tech Debt

| # | Issue | Location | Status (Confirmed/Suspected) | Severity | verified: 2026-10-14 |
|---|---|---|---|---|---|
| 1 | `GetAttachmentByID` returns `nil` error on `sql.ErrNoRows`, so GET of an unknown id returns 200 with a zero-value attachment (`document: null`), and ZIP download does not skip missing ids: it writes an empty-named zero-byte entry. Callers rely on the 200 reply: `CustomTitlePreview` (no custom title yet) and the global `AttachmentPreview`, which requests `/api/attachment/undefined` on every Attachments page load (initial selection `{}`; the `enabled` guard `uuid !== ""` is true for `undefined`). Change both callers before returning an error or 404. | `internal/models/attachments.go:107-111`, `app/handlers_attachments.go:145-148`, `app/ui/src/components/PdfExport/CustomTitlePreview.jsx:21-27`, `app/ui/src/components/Attachments/Attachments.jsx:13`, `app/ui/src/components/Attachments/AttachmentPreview.jsx:18-25` | Confirmed (the `continue` only fires when `err != nil`) | MINOR | 2026-10-14 |
| 2 | ZIP entries use `document_name` as-is, so two attachments with the same name give duplicate entries. Write errors after streaming starts are dropped without a log. | `app/handlers_attachments.go:151-164` | Confirmed | MINOR | 2026-10-14 |
| 3 | Upload inserts an attachment row even when there is no `document` file part, and `id` is never checked against `logbook`. A NULL `document` would make `document_size` NULL, and scanning that into `int` would then break `GetAttachments`. | `app/handlers_attachments.go:82-110`; `internal/models/attachments.go:53-54` | Confirmed (insert without a file); Suspected (NULL scan failure: needs a check of how each driver binds `[]byte(nil)`) | MINOR | 2026-10-14 |
| 4 | No upload size limit: `ParseMultipartForm(32<<20)` only caps memory and spills larger parts to temp files, so the "attachment is too big" log text is misleading. `io.ReadAll` loads the whole file. No `MaxBytesReader` and no server timeouts. Very large BLOBs may also hit MySQL `max_allowed_packet`. | `app/handlers_licensing.go:39-41`, `app/handlers_attachments.go:70-72`, `app/handlers_attachments.go:93`, `app/main.go:52-59` | Confirmed (no limit); Suspected (MySQL rejection depends on server config) | MINOR | 2026-10-14 |
| 5 | PUT `/currency/{uuid}` and PUT `/licensing/{uuid}` ignore the URL param and update by the body/form `uuid`. No update or delete checks rows affected, so an unknown uuid returns 200. | `app/handlers_currency.go:54-61`, `app/handlers_licensing.go:46`, `app/handlers_licensing.go:116` | Confirmed | MINOR | 2026-10-14 |
| 6 | `DeleteLicenseAttachment` uses a double-quoted `""` string literal. That works in MySQL's default mode and SQLite with DQS enabled, but would fail under MySQL `ANSI_QUOTES` or a SQLite build with DQS disabled. | `internal/models/licensing.go:114` | Suspected (confirm by running with `sql_mode=ANSI_QUOTES`) | MINOR | 2026-10-14 |
| 7 | Metric column shows a sub-metric's time target without converting hours to minutes, so a 3 h target displays as `00:03`. | `app/ui/src/components/Currency/CurrencyTable.jsx:52` vs `app/ui/src/util/helpers.jsx:4` | Confirmed (`StatusCell` converts with `isTimeMetric` at `app/ui/src/components/Currency/CurrencyTable.jsx:120`, `MetricCell` does not) | MINOR | 2026-10-14 |
| 8 | Sub-metric `target_value` is saved as a string (TextField value, never `parseInt`). The `=` comparison is strict, so a landings sub-metric with `=` never passes (`5 === "5"`). | `app/ui/src/components/Currency/CurrencyModal.jsx:265-270`, `app/ui/src/util/http/currency.jsx:18-19`, `app/ui/src/components/Currency/helpers.jsx:59` | Confirmed | MINOR | 2026-10-14 |
| 9 | Unit "Since": the date picker shows today when `time_frame.since` is unset, but state stays `undefined`, so the rule is saved with `""` and counts all flights. | `app/ui/src/components/Currency/CurrencyModal.jsx:162-170`, `app/ui/src/components/Currency/helpers.jsx:28-29` | Confirmed | MINOR | 2026-10-14 |
| 10 | Dead branch in `ExpireCell`: `days` comes from `.diff()` (a number or NaN) and is never `null`/`undefined`, so the "Expired" label for rolling time rules that were never met cannot appear. | `app/ui/src/components/Currency/CurrencyTable.jsx:64-79` | Confirmed | MINOR | 2026-10-14 |
| 11 | Wrong notification wiring: the Currency page passes `isLogbookDataError`/`logbookDataError`, but the hook reads `isError`/`error`. The flight-attachment preview hardcodes `isError:false`. The license page fallback text says "flight record". | `app/ui/src/components/Currency/Currency.jsx:14`, `app/ui/src/hooks/useAppNotifications.jsx:4`, `app/ui/src/components/FlightRecordAttachment/AttachmentPreview.jsx:33`, `app/ui/src/components/LicenseRecord/LicenseRecord.jsx:31` | Confirmed | MINOR | 2026-10-14 |
| 12 | After updating a license, the code invalidates `['license', license.id]`, but the record has `uuid`, not `id`, so the invalidation is a no-op. The record is refetched only on the next window focus or remount, because the query sets no cache options and TanStack defaults apply (`staleTime` 0). Until then local state still holds a `File` in `document`, and Download calls `atob(File)`, which throws (logged to the console only). Download works again once the record is refetched (window refocus, navigation or reload) and the effect replaces the `File` with base64. | `app/ui/src/components/LicenseRecord/SaveLicenseRecordButton.jsx:31`, `app/ui/src/components/LicenseRecord/LicenseRecord.jsx:26-30`, `app/ui/src/components/LicenseRecord/LicenseRecord.jsx:33-38`, `app/ui/src/util/http/http.jsx:4`, `app/ui/src/components/LicenseRecord/DownloadLicenseRecordAttachmentButton.jsx:16` | Confirmed | MINOR | 2026-10-14 |
| 13 | Stale query keys: `['licensing-categories']` matches no query. Both attachment delete buttons (per-flight and global Attachments page) and convert-to-track do not invalidate `['logbook']`, so the attachment count and track badge stay stale for up to 1 h. Flight delete does not invalidate `['attachments']` although the server deletes the flight's attachments (`app/handlers_flightrecord.go:61`), so the global Attachments page (`staleTime` 1 h) still lists them for up to 1 h. Convert-to-track also leaves `/map` and the distance totals stale, see `ARCHITECTURE_STATS_AND_MAP.md` §6.E. | `app/ui/src/components/LicenseRecord/DeleteLicenseRecordButton.jsx:22`, `app/ui/src/components/FlightRecordAttachment/DeleteAttachmentButton.jsx:21`, `app/ui/src/components/Attachments/DeleteAttachmentButton.jsx:22`, `app/ui/src/components/FlightRecordAttachment/ConvertAttachmentToTrackButton.jsx:21-22`, `app/ui/src/components/FlightRecord/DeleteFlightRecordButton.jsx:21-22`, `app/ui/src/components/Attachments/Attachments.jsx:16-19` | Confirmed | MINOR | 2026-10-14 |
| 14 | Track handling checks only for a case-sensitive `.kml`, while `.gpx` tracks are accepted and parsed. A GPX attachment gets no "Convert to track" and no track-reset prompt on delete. `AddTrackButton` hides its button only when both uploads are pending (`&&` should be `\|\|`). | `app/ui/src/components/FlightRecordAttachment/Attachment.jsx:40`, `app/ui/src/components/Attachments/DeleteAttachmentButton.jsx:49`, `app/ui/src/components/FlightRecordAttachment/DeleteAttachmentButton.jsx:48`, `app/ui/src/components/FlightRecordAttachment/AddTrackButton.jsx:84`, `app/ui/src/components/FlightRecordAttachment/AddTrackButton.jsx:87`, `app/ui/src/components/FlightRecordAttachment/helpers.jsx:176` | Confirmed | MINOR | 2026-10-14 |
| 15 | Flight delete and attachment delete are separate, non-transactional calls. An attachment-delete failure is only logged and the handler still answers OK, which leaves orphan attachments. The global Attachments page lists them last (`flight_date` is `''` from the `LEFT JOIN`, `ORDER BY flight_date DESC`) with an empty Flight Date and an empty Flight Info link; they can still be previewed, downloaded and deleted there. Same issue: `ARCHITECTURE_LOGBOOK.md` §11 #24. | `app/handlers_flightrecord.go:55-69`, `internal/driver/db_structure.go:303`, `internal/models/attachments.go:44`, `app/ui/src/components/Attachments/AttachmentsTable.jsx:43-44`, `app/ui/src/components/Attachments/AttachmentsTable.jsx:55-56` | Confirmed | MINOR | 2026-10-14 |
| 16 | `attachments.record_id` has no index (it is used in `GetFlightRecordAttachments` and in every `logbook_view` GROUP BY). `attachments_view` computes `LENGTH(document)` for list queries, which may read whole LONGBLOBs on MySQL. | `internal/driver/db_structure.go:95-100`, `internal/driver/db_structure.go:190`, `internal/driver/db_structure.go:217`, `internal/driver/db_structure.go:302`, `internal/driver/db_structure.go:324` | Suspected (confirm with `EXPLAIN` and timing on a large DB) | MINOR | 2026-10-14 |
| 17 | `all_time` start date parses `'17/12/1903'` with format `'YYYY-MM-DD'`. It only works because of lenient parsing or an invalid-date comparison. | `app/ui/src/components/Currency/helpers.jsx:31` | Confirmed (format mismatch is visible; the `all_time` test at `app/ui/src/components/Currency/helpers.test.jsx:92-104` passes) | MINOR | 2026-10-14 |
| 18 | `GetCurrencies` has no `ORDER BY`, so row order depends on the DB engine. | `internal/models/currency.go:7-10` | Confirmed | MINOR | 2026-10-14 |
| 19 | The v5 licensing date migration reports the overwritten (empty) value in its error message instead of the bad input. Same issue: `ARCHITECTURE_DATABASE.md` §11 #21. | `internal/driver/data_overhaul.go:372-384` | Confirmed (`update.issued` is reassigned by `convertDate` before `Errorf`) | MINOR | 2026-10-14 |
| 20 | A non-empty currency filter that matches no aircraft category (a typo, or a category whose aircraft were removed) gives an empty registration set. The evaluator and the expiry treat an empty set as "no filter", so the rule silently counts every flight. | `app/ui/src/components/Currency/helpers.jsx:66-84`, `app/ui/src/components/Currency/helpers.jsx:111-114`, `app/ui/src/components/Currency/helpers.jsx:277-280` | Confirmed (`regs.size === 0` is the only "no filter" test, and it cannot tell an empty filter from an unmatched one) | MINOR | 2026-10-14 |
| 21 | POST `/api/export/custom-title` trusts the form `id`: it deletes and re-inserts **any** attachment uuid, and the re-inserted row loses its flight link (`record_id = uuid`). With no `document` file part the row is replaced by an empty one, because PDF validation only runs when a file is present. Delete + insert is not atomic. Owned by `ARCHITECTURE_PDF_EXPORT.md` §11 #9. | `app/handlers_export.go:46-49`, `app/handlers_export.go:52-74`, `app/handlers_export.go:77-87` | Confirmed (no allow-list for `custom_title_a4/a5`, no transaction) | MINOR | 2026-10-14 |

## 12. Rules for Future Development

**Recipe A — add a field to license records**
1. `internal/driver/db_structure.go:82-93`: add a `Column` using a shared `ColumnType` (both engines). Prefer `Properties: "NOT NULL DEFAULT ''"` so existing rows do not scan NULL into `string`, but only with `SmallText`, `BigText` or `DateTime` (VARCHAR on MySQL, `internal/driver/db_structure.go:7-9`). Never combine a `DEFAULT` with `FullText` or `Blob` (MySQL `TEXT` / `LONGBLOB`, `internal/driver/db_structure.go:10`, `internal/driver/db_structure.go:14`): MySQL in strict mode rejects a literal default on those types, so the `ALTER TABLE` in `ensureColumnsExist` fails (`internal/driver/db_operations.go:169-171`) and startup stops (`app/main.go:138-141`). For a long text field, leave it nullable and read it with `IFNULL(col,'')` in every SELECT (pattern: `sub_metrics` in `internal/models/currency.go:9`). Bump `schemaVersion` (`internal/driver/db_structure.go:4`), because `validateDB` adds columns only when the version changes (`internal/driver/driver.go:56`).
2. `internal/models/structs.go:275-286`: add the field to `License` with a JSON tag.
3. `internal/models/licensing.go`: update the SELECT and Scan in `GetLicenses` and `GetLicenseRecordByID`, **both** UPDATE branches in `UpdateLicenseRecord`, and `InsertLicenseRecord`.
4. `app/handlers_licensing.go:45-54`: read the field with `r.PostFormValue`.
5. UI: `LICENSE_INITIAL_STATE` (`app/ui/src/constants/constants.jsx:54`), the input in `app/ui/src/components/LicenseRecord/LicenseRecordDetails.jsx`, `formData.append` in `app/ui/src/components/LicenseRecord/SaveLicenseRecordButton.jsx:56-66`, and optionally a column in `app/ui/src/components/Licensing/LicensingTable.jsx`, and the `licensing` mapper in `app/ui/src/components/UIElements/CSVExportButton.jsx:61-69` if the field should appear in the CSV export (used at `app/ui/src/components/Licensing/LicensingTable.jsx:130`). Dates must use `DatePicker` (stores `YYYY-MM-DD`).

**Recipe B — add a currency metric** (UI only; `metric` is free text in the DB)
1. Add `{value, label}` to **both** duplicated `metricOptions` lists: `app/ui/src/components/Currency/CurrencyTable.jsx:156-174` and `app/ui/src/components/Currency/CurrencyModal.jsx:80-98`.
2. Make sure the path resolves in `getFlightMetricValue` (`app/ui/src/components/Currency/helpers.jsx:97-106`) against the FlightRecord JSON (`internal/models/structs.go:24-79`).
3. Remember the name-based rules: a name containing `time` is converted hours→minutes (`app/ui/src/components/Currency/helpers.jsx:7`), and a `landings*` prefix selects the landing expiry branch (`app/ui/src/components/Currency/helpers.jsx:182`). Any other metric goes through the time-expiry branch. Also check `formatCurrencyValue` (`app/ui/src/components/Currency/helpers.jsx:163-173`: `includes('landings')` first, then `includes('time')`) and `ExpireCell` (`app/ui/src/components/Currency/CurrencyTable.jsx:70`, `startsWith('time')`, so `sim.time` is excluded; currently a dead branch, see #10). The time-expiry branch converts the target hours to minutes for every non-landings metric, whatever its name (`app/ui/src/components/Currency/helpers.jsx:214`), so a metric that is neither a time nor a landing count needs its own branch.
4. Add cases to `app/ui/src/components/Currency/helpers.test.jsx`.

**Recipe C — add a time-frame unit**
Update `timeframeUnitOptions` (`app/ui/src/components/Currency/helpers.jsx:11-17`), `getStartDate` (`app/ui/src/components/Currency/helpers.jsx:19-36`), `getEndDate` (`app/ui/src/components/Currency/helpers.jsx:39-51`), the expiry guards (`app/ui/src/components/Currency/helpers.jsx:178-180`, `app/ui/src/components/Currency/helpers.jsx:207-209`), `formatTimeFrame` (`app/ui/src/components/Currency/CurrencyTable.jsx:28-40`) and `currencyTimeFrame` (`app/ui/src/components/Currency/CurrencyModal.jsx:152-174`). Store any date in `time_frame_since` as `YYYY-MM-DD`.

**Recipe D — add an endpoint to currency / licensing / attachments**
1. Write the handler in the matching `app/handlers_*.go`. Follow every `app.handleError(w, err)` with `return`, because the helper does not stop the handler (`app/helpers.go:53-63`). Answer mutations with `app.writeOkResponse` (`app/helpers.go:45-51`); do not copy the bare-string `writeJSON` replies in `app/handlers_currency.go:51`, `app/handlers_currency.go:66` and `app/handlers_currency.go:76`. Use `app.writeJSON` only for data.
2. Register it inside the existing `r.Route("/currency" | "/licensing" | "/attachment")` block (`app/routes.go:54-71`, `app/routes.go:131-138`). These blocks are already under `app.Auth`. Wrap GETs that return base64 blobs in `middleware.Compress(5)`.
3. Write the model method in `internal/models/<x>.go` with `ContextWithDefaultTimeout()` and `?` placeholders.
4. Write the UI wrapper in `app/ui/src/util/http/<x>.jsx` using `handleFetch` (`returnJson=false` for binary responses).
5. In the mutation's `onSuccess`, invalidate every dependent query key (see the cross-check list), and add the CHANGELOG/README bullet for a user-visible change.

**Recipe E — store attachments for a non-flight entity**
`attachments.record_id` has no FK (`internal/driver/db_structure.go:97`). Choose reserved or unique IDs as the custom titles do, and exclude those rows from `GetAttachments` (`internal/models/attachments.go:43`). Otherwise they show up on the global Attachments page with an empty flight date. Delete the entity's attachments in its delete handler, or orphan rows remain (pattern: `DeleteAttachmentsForFlightRecord`, `internal/models/attachments.go:85-92`, called at `app/handlers_flightrecord.go:61`), and invalidate `['attachments']` and the entity's own query key after the delete.

**Recipe F — change `attachments_view`**
Edit **both** SQL strings (`internal/driver/db_structure.go:297-340`) and bump `schemaVersion` so the view is recreated (`internal/driver/driver.go:73-78`). The view lists its columns explicitly, so to expose a new `attachments` column, add it to **both** SELECT lists (`internal/driver/db_structure.go:297-301`, `internal/driver/db_structure.go:319-323`), add the field to `Attachment` (`internal/models/structs.go:289-298`) and update every `Scan` in `internal/models/attachments.go`.

**Cross-check list (every change)**
- [ ] Both engines: `ColumnType` pairs, both view SQL strings, no engine-specific literals (see issue #6).
- [ ] `schemaVersion` bumped for any table, column, index or view change. Type changes need an explicit migration (pattern: `internal/driver/data_overhaul.go`).
- [ ] New routes sit inside the `/api` group under `app.Auth` (`app/routes.go:26-27`).
- [ ] Every `handleError` is followed by `return`; mutations reply with `writeOkResponse`.
- [ ] Query keys invalidated: `['currency']`, `['licensing']`, `['license', uuid]`, `['attachments']` (prefix), plus `['logbook']` and `['flight', id]` when an attachment count or track changes.
- [ ] Units: flight times are in minutes, currency time targets are in hours, dates are stored as `YYYY-MM-DD` and displayed via `dateFieldsFormat`.
- [ ] Currency helper changes are covered in `app/ui/src/components/Currency/helpers.test.jsx`; `npm run test:run` passes.
- [ ] A `- New:` / `- Update:` / `- Fix:` bullet is added under `## [Unreleased]` in `CHANGELOG.md` **and** in its copy in `README.md` (`README.md:64-66`).
- [ ] This doc (§4.2, §5, §11) is updated.

## 13. AI Notes

### Mental Model
Treat the backend as three plain CRUD tables plus one view. Currency is a client-side rules engine: changing a calculation means editing `app/ui/src/components/Currency/helpers.jsx`, never Go. Licenses and attachments keep binary files as DB BLOBs and send them as base64 JSON. The UI decodes them with `atob` and detects the MIME type with `file-type`.

### Gotchas
- Currency targets are integer **hours** for any metric containing `time` (including `sim.time`); flight values are **minutes**.
- PUT handlers ignore `{uuid}` in the URL; the identity comes from the body/form.
- Licensing create/update responses are read as a Blob (`returnJson=false`) and parsed by hand.
- `UpdateLicenseRecord` replaces the document only when a file part was uploaded (`DocumentName != ""`).
- `GetAttachmentByID` never returns `sql.ErrNoRows`. Check for an empty `UUID` instead. `CustomTitlePreview` (`app/ui/src/components/PdfExport/CustomTitlePreview.jsx:21-27`) and the global `AttachmentPreview`, which requests `/api/attachment/undefined` on mount (`app/ui/src/components/Attachments/Attachments.jsx:13`, `app/ui/src/components/Attachments/AttachmentPreview.jsx:25`), rely on that 200 reply; change them before making the lookup return an error (#1).
- A currency filter that matches no aircraft counts all flights, exactly like an empty filter (#20).
- `custom_title_a4/a5` rows live in `attachments`; keep them out of user-facing lists.
- The `metricOptions` list is duplicated in two components.
- Go nil slices serialize to `null`; the UI must default them to `[]`.

### File Quick Reference
| Need | File |
|---|---|
| Currency math | `app/ui/src/components/Currency/helpers.jsx` |
| Currency table/cells | `app/ui/src/components/Currency/CurrencyTable.jsx` |
| License multipart parsing | `app/handlers_licensing.go:38-75` |
| License SQL | `internal/models/licensing.go` |
| Attachment upload/ZIP | `app/handlers_attachments.go:68-166` |
| Attachment SQL/view | `internal/models/attachments.go`, `internal/driver/db_structure.go:295-342` |
| KML/GPX parsing | `app/ui/src/components/FlightRecordAttachment/helpers.jsx` |
| Expiry badges | `app/ui/src/components/Licensing/LicensingNavTitle.jsx` |
| Routes | `app/routes.go:54-71`, `app/routes.go:131-138` |

> **AI Usage Instructions**
> - Always read this file before modifying this system
> - Do not refactor without impact analysis
> - Ask if information is missing
