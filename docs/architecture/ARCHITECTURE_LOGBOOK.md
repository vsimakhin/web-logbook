# Logbook & Flight Records — Architecture

**Last Updated:** 2026-10-14 — initial version generated from code and fact-checked (TASK_AGENT_WORKFLOW_SETUP); 2026-10-14 — §11 cross-links to sibling docs, new #28 delete invalidation gap (consistency pass); 2026-11-08 — custom-fields refactor, server-side form layout/visibility profile, schema 103 (sync 30 days)

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

The logbook is the core of the product: the pilot's list of flight records (one row per flight or simulator session) shown as an EASA-style table, plus the single-record editor. It covers creating, editing (one record or many in-place), copying, deleting and signing flight records, uploading/resetting a GPS track, automatic total-time and night-time calculation, and user-defined **custom fields** that add extra columns/inputs to every record.

Backend: HTTP handlers in `app/handlers_flightrecord.go`, `app/handlers_logbook.go`, `app/handlers_custom_fields.go` (all under the `/api` route group with the `Auth` middleware, `app/routes.go:26-27`), SQL in `internal/models/flightrecords.go` and `internal/models/custom_fields.go`, night-time maths in `internal/nighttime/nighttime.go`. Frontend: `LogbookPage.jsx` → `components/Logbook/*` (MUI DataGrid table with bulk edit) and `FlightRecordPage.jsx` → `components/FlightRecord/*` (record form + map + attachments + persons), routed at `/`, `/logbook` and `/logbook/:id` (`app/ui/src/main.jsx:50-56`). The record form's grid layout, the form-field visibility and the logbook table's column order are a per-installation **logbook profile** stored in settings (`logbook_profile`) and edited from the record page menu and from the Settings "Fields & Layout" page (`/fields-and-layout`, `app/ui/src/main.jsx:92`).

## 2. Key Concepts

| Term | Meaning / invariant | Evidence |
|---|---|---|
| Flight record | One row of table `logbook`, keyed by `uuid` (server generates UUIDv4 on create) | `internal/driver/db_structure.go:23`, `HandlerApiFlightRecordNew` `app/handlers_flightrecord.go:81-86` |
| Time fields | All flight times (`se_time` … `sim_time`) are **integer minutes**; the UI formats them (H:MM, HH:MM or FAA decimal) | `internal/models/structs.go:40-50`, `formatTimeField` `app/ui/src/util/helpers.jsx:4` |
| Date | Stored as ISO `YYYY-MM-DD` string; display format is a setting | `internal/driver/data_overhaul.go:15`, `DatePicker` `app/ui/src/components/UIElements/DatePicker.jsx:10` |
| Departure/arrival time | 4-digit `HHMM` string (UTC assumed by night-time calc) | `TIME_SLOT_PROPS` `app/ui/src/constants/constants.jsx:70-72`, layout `"2006-01-02 1504"` `app/helpers.go:78` |
| Place | ICAO/IATA code (upper-cased in UI) resolved against `airports_view` for distance / night time | `PLACE_SLOT_PROPS` `app/ui/src/constants/constants.jsx:67`, `GetAirportByID` `internal/models/airports.go:16` |
| Cross-country time (`cc_time`) | Not stored; computed on read = `total_time` when departure ≠ arrival, else 0 | `processFlightrecord` `internal/models/helpers.go:56-63` |
| Record number / prev / next | Not stored; `ROW_NUMBER()`/`LAG`/`LEAD` over `(date, departure_time)` in view `logbook_view` | `internal/driver/db_structure.go:172`, `:192-193` |
| `has_track`, `attachments_count` | Computed in `logbook_view` | `internal/driver/db_structure.go:182-183` |
| Distance | Nautical miles, persisted in `logbook.distance`; great-circle dep→arr on create, track length after track upload | `InsertFlightRecord` `internal/models/flightrecords.go:91`, `HandlerApiTrackLogNew` `app/handlers_flightrecord.go:137-140` |
| Track | JSON `[[lat, lon], …]` in BLOB `track`; Go `[]byte` ⇒ base64 string in API JSON; UI does `JSON.parse(atob(track))` | `app/handlers_flightrecord.go:130-148`, `internal/models/structs.go:68`, `app/ui/src/components/FlightMap/helpers.jsx:74` |
| Custom fields | Definitions in table `custom_fields`; values per record in `logbook.custom_fields` as a JSON object `{ "<field uuid>": value }` (string on the wire, object in the UI). Each definition has an optional `pdf_header` used as the PDF column label (falls back to `name`) | `internal/driver/db_structure.go:134-142`, `:50`; `prepareFlightDataForAPI` `app/ui/src/util/http/logbook.jsx:16-38`; `internal/pdfexport/layout.go:301-304` |
| Custom field types | `text`, `number`, `time`, `duration` (minutes), `enroute` (waypoint list used for distance) | `typeOptions` `app/ui/src/components/Settings/CustomFields/CustomFieldModal.jsx:23` |
| Custom field category | The logbook column group the field is rendered in; stored as the **display text** of the standard header, `"Custom"`, or any free text. A category that matches no current standard header text (and is not `"Custom"`) is a **user-defined category** and gets its own column group | Options `allCategories` `app/ui/src/hooks/useCustomFields.jsx:29-49`, `userDefinedCategories` `:51-58`; free-solo select `CustomFieldModal.jsx:130-139`; filter `app/ui/src/components/Logbook/helpers.jsx:109`; groups `app/ui/src/components/Logbook/LogbookTable.jsx:145-147`, `:280-291` |
| Logbook profile | `settings.logbook_profile` (`models.Profile`): `fields_visibility` (form field key → bool), `flight_record_layout` (react-grid-layout items per breakpoint), `table_columns` (logbook column order), `table_hidden_columns`. UI fallback `DEFAULT_PROFILE` when a key is absent | `internal/models/structs.go:223-239`, `:294`; `DEFAULT_PROFILE` `app/ui/src/hooks/useSettings.jsx:81-239`, `logbookProfile` `:290-294` |
| Night time | Time with sun centre ≤ −6° (civil twilight) along the route | `NIGHT_SUN_ELEVATION` `internal/nighttime/nighttime.go:14` |
| Signature | PNG data URL drawn with `signature_pad`, stored in `logbook.signature`, printed in PDF export | `SignModal.jsx:113`, `UpdateFlightRecordSignature` `internal/models/flightrecords.go:274` |
| `"new"` uuid | UI sentinel for an unsaved record (`/logbook/new`) | `FlightRecord` `app/ui/src/components/FlightRecord/FlightRecord.jsx:22-33` |

## 3. How It Works

| Step | User action | What happens |
|---|---|---|
| 1 | Opens `/` or `/logbook` | `Logbook` loads all records via `useLogbookQuery` (key `['logbook']`) and renders `LogbookTable` (`app/ui/src/components/Logbook/Logbook.jsx:9-15`) |
| 2 | Clicks a date cell | Link to `/logbook/<uuid>` (`app/ui/src/components/Logbook/helpers.jsx:51`) → `FlightRecord` fetches `['flight', id]` |
| 3 | Clicks "Add New Flight Record" | Navigates to `/logbook/new` (`app/ui/src/components/Logbook/NewFlightRecordButton.jsx:13`); form starts from `FLIGHT_INITIAL_STATE` merged with `location.state` (`FlightRecord.jsx:26-33`) |
| 4 | Types dep/arr time and leaves the field | `DepArrTime.handleTimeChange` (only when both times have 4 digits): total time = arr − dep (+1 day if negative); every other time field except `night_time` that equalled the old non-zero total is updated; then, if date and both places are set, `POST /api/logbook/night` sets `time.night_time` (`app/ui/src/components/UIElements/DepArrTime.jsx:45-70`) |
| 5 | Leaves a place field | `DepArrPlace.handlePlaceChange`: distance recomputed client-side via `/api/distance/...` (incl. enroute waypoints) and stored only when `flight.track === null`; map redrawn (`app/ui/src/components/UIElements/DepArrPlace.jsx:30-43`) |
| 6 | Picks PIC = self label / aircraft model (new record only) | PIC time and model-configured time fields auto-filled from total (`app/ui/src/components/FlightRecord/FlightRecordDetails.jsx:94-120`) |
| 7 | Saves | `POST /api/logbook/new` or `PUT /api/logbook/{uuid}`; custom fields filtered to existing definitions; caches invalidated; new record navigates to its uuid (`app/ui/src/components/FlightRecord/MenuButtons/SaveFlightRecordButton.jsx:24-60`) |
| 8 | Menu: New / Return / Copy | Navigate to `/logbook/new` with prefilled `state` (`app/ui/src/components/FlightRecord/MenuButtons/NewFlightRecordButton.jsx:13-21`, `ReturnFlightRecordButton.jsx:20-35`, `CopyFlightRecordButton.jsx:18`) |
| 9 | Menu: Sign | `SignModal` loads/saves `/api/logbook/{uuid}/signature` |
| 10 | Menu: Delete | Confirm dialog → `DELETE /api/logbook/{uuid}` → back to `/logbook` (`app/ui/src/components/FlightRecord/MenuButtons/DeleteFlightRecordButton.jsx:18-41`) |
| 11 | Table: "Edit Logbook" | Bulk-edit mode: cells become inputs, changed row ids collected; Save sends one `PUT` per changed row sequentially (`BulkEditButtons.jsx:30-63`). Dep/arr time cells reuse `DepArrTime` (total time + night time on blur), place cells reuse `DepArrPlace` (`app/ui/src/components/Logbook/EditCells/DepArrTimeCell.jsx:12-21`, `DepArrPlaceCell.jsx:12-21`) |
| 12 | Adds a KML track (attachments card) | `POST /api/logbook/track/{uuid}` stores track + track length; "Reset track" deletes it and restores great-circle distance |
| 13 | Menu: Layout | Edit mode: fields can be dragged and resized horizontally in a react-grid-layout grid; the header shows only Reset layout (restore `DEFAULT_PROFILE` layout, local until saved) and Save layout (`PUT /api/settings/general` with `logbook_profile.flight_record_layout`) (`app/ui/src/components/FlightRecord/FlightRecordMenuButtons.jsx:68-77`, `app/ui/src/components/FlightRecord/MenuButtons/ResetLayoutButton.jsx:15-31`, `app/ui/src/components/FlightRecord/MenuButtons/SaveLayoutButton.jsx:26-36`) |
| 14 | Menu: Fields | Dialog of switches; each toggle immediately saves `logbook_profile.fields_visibility` via `PUT /api/settings/general` (`app/ui/src/components/FlightRecord/MenuButtons/ShowHideFieldsButton.jsx:47-59`) |
| 15 | Settings → Fields & Layout | Standard field names, the custom-field table and the "Logbook Table Layout" card (visible/available column lists); Save sends `PUT /api/settings/profile`, which stores only `logbook_profile` (`app/ui/src/components/Settings/FieldsAndLayout.jsx:47-56`, `app/ui/src/components/Settings/LogbookLayout/SaveProfileButton.jsx:13-18`, `app/handlers_settings.go:176-198`) |

## 4. Components & Files

### 4.1 File Index

| File | Responsibility |
|---|---|
| `app/handlers_flightrecord.go` | Get/create/update/delete record, night-time calc endpoint, track upload/reset, signature get/update |
| `app/handlers_logbook.go` | Full logbook list and map-data list |
| `app/handlers_custom_fields.go` | CRUD for custom field definitions |
| `app/helpers.go` | `calculateNightTime` (airport lookup + route build, `:67-113`), response helpers |
| `internal/models/flightrecords.go` | All SQL for `logbook` / `logbook_view`, `CalculateTotals` used by PDF export |
| `internal/models/custom_fields.go` | SQL for `custom_fields` |
| `internal/models/helpers.go` | `DefaultTimeout`, `Distance` + in-memory cache, `processFlightrecord`, startup distance backfill |
| `internal/models/structs.go` | `FlightRecord` (`:25-79`), `CustomField` (`:366-374`), `JSONResponse` (`:17-22`), logbook profile types `FlightRecordLayoutItem` / `FlightRecordLayout` / `Profile` (`:223-239`), `Settings.LogbookProfile` (`:294`) |
| `internal/nighttime/nighttime.go` | Route model, great-circle distance/midpoint, night-time and night-landing calculation |
| `internal/nighttime/nighttime_test.go` | 4 unit tests for night time |
| `app/ui/src/pages/LogbookPage.jsx`, `FlightRecordPage.jsx` | Thin page wrappers |
| `app/ui/src/components/Logbook/` | `Logbook.jsx` (data load), `LogbookTable.jsx` (columns, grouping, profile column order, toolbar), `helpers.jsx` (column factories), `BulkEditButtons.jsx`, `NewFlightRecordButton.jsx`, `PDFExportButton.jsx`, `EditCells/*` (12 bulk-edit cell editors, incl. `DepArrPlaceCell.jsx` and `DepArrTimeCell.jsx`) |
| `app/ui/src/components/FlightRecord/` | `FlightRecord.jsx` (state owner), `FlightRecordDetails.jsx` (form fields incl. custom fields), `FlightRecordLayout.jsx` (react-grid-layout wrapper, applies layout + visibility), `PICNameField.jsx`, `FlightTitle.jsx` (prev/next), `FlightRecordMenuButtons.jsx`, `SignModal.jsx`; `MenuButtons/` holds every menu action: `SaveFlightRecordButton`, `NewFlightRecordButton`, `ReturnFlightRecordButton`, `CopyFlightRecordButton`, `DeleteFlightRecordButton`, `SignFlightRecordButton`, `ResetTrackButton`, `ShowHideFieldsButton`, `EditLayoutButton`, `SaveLayoutButton`, `ResetLayoutButton`, `HelpButton`. `CustomFields.jsx` is still present but imported nowhere (§11 #33) |
| `app/ui/src/components/UIElements/` (form inputs used here) | `DepArrPlace.jsx` (place input + live distance), `DepArrTime.jsx` (time input + total/night time), `LandingField.jsx`, `TimeField.jsx` (H:MM / decimal minutes input), `DatePicker.jsx`; the first two are shared by the form and the bulk-edit cells |
| `app/ui/src/components/Settings/CustomFields/` | Custom-field management UI, rendered on the Fields & Layout settings page (`app/ui/src/components/Settings/FieldsAndLayout.jsx:50`): `CustomFieldsTable.jsx`, `NewCustomFieldButton.jsx`, `EditCustomFieldButton.jsx`, `DeleteCustomFieldButton.jsx`, `CustomFieldModal.jsx` (name/PDF header/description/category/type/stats form), `HelpButton.jsx`; all mutations invalidate `['custom-fields']` |
| `app/ui/src/components/Settings/FieldsAndLayout.jsx`, `Settings/LogbookLayout/` | Fields & Layout page (`/fields-and-layout`, `app/ui/src/pages/SettingsFieldsAndLayoutPage.jsx`): standard field names, custom fields, and `LogbookLayout.jsx` + `SaveProfileButton.jsx` for the logbook table column order / hidden columns |
| `app/ui/src/util/http/logbook.jsx` | All logbook fetch functions + `prepareFlightDataForAPI` |
| `app/ui/src/util/http/fields.jsx` | Custom field fetch functions |
| `app/ui/src/hooks/queries/useLogbookQuery.js`, `useFlightQuery.js`, `useNightTime.js` | Query/mutation hooks |
| `app/ui/src/hooks/useCustomFields.jsx` | Custom field list query, `customFieldsCategories`, `getEnroute`, `calculateDistance` |
| `app/ui/src/hooks/useSettings.jsx` | `DEFAULT_PROFILE` and the `logbookProfile` view of `settings.logbook_profile` (owned by `ARCHITECTURE_SETTINGS.md`) |

### 4.2 API Endpoints

All under `/api` with `app.Auth` (`app/routes.go:26-27`).

| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/api/logbook/data` | `HandlerApiLogbookData` `app/handlers_logbook.go:8` | gzip level 5 (`app/routes.go:34`); array of `FlightRecord` incl. `has_track`, `attachments_count`, no `track`/`signature`; `null` when empty |
| GET | `/api/logbook/mapdata` | `HandlerApiLogbookMapData` `app/handlers_logbook.go:18` | gzip (`app/routes.go:35`); includes `track` |
| GET | `/api/logbook/{uuid}` | `HandlerApiFlightRecordByID` `app/handlers_flightrecord.go:16` | Includes `track`, `prev_uuid`, `next_uuid`, `record_number` |
| GET | `/api/logbook/{uuid}/signature` | `HandlerApiFlightRecordSignature` `app/handlers_flightrecord.go:180` | Returns JSON string (data URL or `""`) |
| PUT | `/api/logbook/{uuid}/signature` | `HandlerApiFlightRecordSignatureUpdate` `app/handlers_flightrecord.go:193` | Body: JSON string |
| DELETE | `/api/logbook/{uuid}` | `HandlerApiFlightRecordDelete` `app/handlers_flightrecord.go:52` | Also deletes attachments, regenerates aircraft table |
| POST | `/api/logbook/new` | `HandlerApiFlightRecordNew` `app/handlers_flightrecord.go:73` | Body: `FlightRecord`; response `JSONResponse` with `data` = new uuid (`:97-102`) |
| PUT | `/api/logbook/{uuid}` | `HandlerApiFlightRecordUpdate` `app/handlers_flightrecord.go:106` | Uses **body** `uuid`, URL param ignored |
| POST | `/api/logbook/night` | `HandlerNightTime` `app/handlers_flightrecord.go:29` | Body: `FlightRecord`; `data` = night minutes as string (`:46`) |
| POST | `/api/logbook/track/{uuid}` | `HandlerApiTrackLogNew` `app/handlers_flightrecord.go:127` | Body: `[[lat, lon], …]`; distance = sum of segments |
| DELETE | `/api/logbook/track/{uuid}` | `HandlerApiTrackLogReset` `app/handlers_flightrecord.go:158` | Track → NULL, distance → great-circle dep→arr |
| GET | `/api/custom-fields/list` | `HandlerApiCustomFieldsList` `app/handlers_custom_fields.go:12` | No `ORDER BY` since `display_order` was dropped (`internal/models/custom_fields.go:7-10`): order is engine-defined |
| GET | `/api/custom-fields/{uuid}` | `HandlerApiCustomFieldGet` `app/handlers_custom_fields.go:21` | |
| POST | `/api/custom-fields/new` | `HandlerApiCustomFieldNew` `app/handlers_custom_fields.go:31` | Server generates uuid; responds bare JSON string |
| PUT | `/api/custom-fields/{uuid}` | `HandlerApiCustomFieldUpdate` `app/handlers_custom_fields.go:54` | Uses body `uuid` |
| DELETE | `/api/custom-fields/{uuid}` | `HandlerApiCustomFieldDelete` `app/handlers_custom_fields.go:70` | Values in `logbook.custom_fields` are not touched |
| GET | `/api/distance/{departure}/{arrival}` | `HandlerDistance` `app/handlers_aux.go:41` | Not owned here; used by the form for live distance |

### 4.3 Data Access

**`internal/models/flightrecords.go`** (every method uses `ContextWithDefaultTimeout`)

| Method | Purpose | Tables / views |
|---|---|---|
| `CalculateTotals` `:4` | Adds one record's times/landings/distance to a totals record (PDF footers) | — |
| `GetFlightRecordByID` `:27` | One record incl. track, prev/next; applies `processFlightrecord` | `logbook_view` |
| `UpdateFlightRecord` `:61` | Updates all editable columns incl. client-sent `distance`; not `track`/`signature` | `logbook` |
| `InsertFlightRecord` `:87` | Inserts; **overwrites** `distance` with `m.Distance(dep, arr)` (`:91`) | `logbook` |
| `DeleteFlightRecord` `:119` | Delete by uuid | `logbook` |
| `GetFlightRecords` `:128` | Table list, `ORDER BY date desc, departure_time desc` (`:141`) | `logbook_view` |
| `GetFlightRecordsForExport` `:168` | Export list incl. `signature` and `custom_fields` (`:178`, `:193`) | `logbook_view` |
| `UpdateFlightRecordTrack` `:205` | Sets `distance` + `track` | `logbook` |
| `GetFlightRecordsForMap` `:218` | Map list incl. `track` | `logbook_view` |
| `GetFlightRecordSignature` `:258` / `UpdateFlightRecordSignature` `:274` | Signature read/write | `logbook_view` / `logbook` |

**`internal/models/custom_fields.go`**: `GetCustomFields` `:3` (no `ORDER BY`; checks `rows.Err()` `:25-27`), `GetCustomField` `:31`, `InsertCustomField` `:48`, `UpdateCustomField` `:62`, `DeleteCustomField` `:77` — all on `custom_fields`, columns `uuid, name, description, category, type, stats_function, pdf_header`. The reads select `IFNULL(pdf_header,"")`, a double-quoted literal that SQLite accepts through its double-quoted-string fallback and MySQL accepts without `ANSI_QUOTES` (`:9`, `:37`).

**`internal/models/helpers.go`**: `Distance` `:29` (cached in package-level `sync.Map` `distanceCache` `:26`; returns 0 only when departure == arrival (`:30-31`) or on a DB error (`:45-49`); an unknown code resolves to a zero-value `Airport` (`internal/models/airports.go:33-34`), so the result is the distance from lat/lon 0,0 and is cached (`:51-52`), issue 21), `processFlightrecord` `:56`, `UpdateFlightRecordsDistance` `:65` (startup backfill of `distance IS NULL`, called from `app/main.go:208`), `CreateDistanceCache` `:106` (startup, `app/main.go:204`).

**`internal/nighttime/nighttime.go`**: `Route.NightTime` `:86` (same coordinates → `nightCircuits` minute-by-minute at arrival point `:108-121`; otherwise recursive `nightSegment` bisection until a segment ≤ 1 minute of flight, each segment counted as night if sun elevation at its end point ≤ −6° `:123-145`), `Route.IsNightLanding` `:101`, `FlightSpeed` `:82`, private `distance`/`midpoint` `:36-69`.

### 4.4 UI

| Piece | Key facts |
|---|---|
| `LogbookTable` `app/ui/src/components/Logbook/LogbookTable.jsx:32` | `XDataGrid` with `tableId='logbook'` (`:329`), EASA column groups (`:176-310`), custom-field columns inserted per category (`:71`, `:83`, …) plus one group per user-defined category (`:145-147`, `:280-291`), only `date` and `record_number` sortable (`:162`), hidden by default: `record_number`, `has_track`, `has_attachment`, `tags` (`:346-351`), footer totals with optional previous-pages total and previous experience (`:341-343`). Columns are re-ordered by `logbookProfile.tableColumns`; columns missing from that list keep their relative order at the end (`:165-174`). `table_hidden_columns` is not read (§11 #32) |
| ME column | Shows blank / 0 when `mcc_time ≠ 0` (`LogbookTable.jsx:98-103`) |
| Column factories `app/ui/src/components/Logbook/helpers.jsx` | `createDateColumn` `:37`, `createTimeColumn` `:70`, `createLandingColumn` `:88`, `createCustomFieldColumns` `:104` (field id `custom_fields.<uuid>`, `duration`/`number` get `sum` aggregation), `createHasTrackColumn` `:149`, `createHasAttachmentColumn` `:163`, `updateNested` `:20` |
| Bulk edit | State `isBulkEdit`/`updatedRows` (`LogbookTable.jsx:38-44`); cells in `EditCells/` write into the grid via `params.api.updateRows` and mark the row; dep/arr cells wrap the form inputs `DepArrPlace` / `DepArrTime` (`app/ui/src/components/Logbook/EditCells/DepArrPlaceCell.jsx:12-21`, `app/ui/src/components/Logbook/EditCells/DepArrTimeCell.jsx:12-21`); Save/Cancel in `BulkEditButtons.jsx`; hidden on `< md` screens (`BulkEditButtons.jsx:80-82`) |
| Toolbar | New record, CSV export (`CSVExportButton` type `logbook`), PDF A4/A5 export (`PDFExportButton.jsx`), bulk edit (`LogbookTable.jsx:312-322`) |
| `FlightRecord` `FlightRecord.jsx:17` | Owns `flight` state; `handleChange(key, value)` with dotted keys (`:47-67`); builds an `options` object (`:69-73`) and passes it to `FlightMap` (`:86`), but `FlightMap` has ignored it since commit `2822577`: routes/tracks are drawn according to the localStorage map options (`app/ui/src/components/FlightMap/FlightMap.jsx:55-56`, issue 22); renders `FlightRecordDetails`, `Attachments`, `FlightRecordPersons`, `FlightMap` (`:80-86`) |
| `FlightRecordDetails` `app/ui/src/components/FlightRecord/FlightRecordDetails.jsx:51` | Every input is a child `<div>` whose `key` is the field id (`date`, `departure.place`, …, `time.<x>`, `sim.type`, custom field uuid) (`:133-231`); labels from `fieldNameF` (`:66-90`); custom fields rendered inline with id `custom_fields.<uuid>`, `duration` as `TimeField`, `enroute` recomputes distance on blur (`:197-230`, `:60-64`); holds `editingLayout` and `layouts` state, `layouts` initialised once from `logbookProfile.flightRecordLayout` (`:55-56`, §11 #34) |
| `FlightRecordLayout` `app/ui/src/components/FlightRecord/FlightRecordLayout.jsx:50` | react-grid-layout `Responsive` grid: breakpoints `xl/lg/md/sm/xs` = 900/600/450/300/150 px, 60 columns each (`:9-10`), row height 32, horizontal compaction, drag and east/west resize only while editing (`:101-114`). Custom fields missing from the saved layout are appended at the bottom, width 30 (`:55-69`). Children whose key is `false` in `fieldsVisibility` are dropped; unknown keys stay visible (`:72-85`) |
| `FlightRecordMenuButtons` | Normal mode: Help + Save, and a "More actions" menu (Sign/New/Return/Copy/Delete only for saved records, Reset track when `flight.track`, Fields, Layout) (`FlightRecordMenuButtons.jsx:27-66`). Layout mode: only Reset layout / Save layout (`:68-77`) |
| `ShowHideFieldsButton` | Switches for the 10 time fields, landings, `simulator`, remarks, tags and every custom field (`app/ui/src/components/FlightRecord/MenuButtons/ShowHideFieldsButton.jsx:61-87`); the `simulator` id matches no form key (§11 #30); default visible (`:100`) |
| `FlightTitle` | Prev/next buttons from `prev_uuid`/`next_uuid` (`FlightTitle.jsx:17-30`) |
| `PICNameField` | Free-solo select; options = distinct PIC names from `useLogbookQuery`; double-click sets self label (`PICNameField.jsx:18-23`) |
| Custom-field management `app/ui/src/components/Settings/CustomFields/` | Rendered on the Fields & Layout settings page (`app/ui/src/components/Settings/FieldsAndLayout.jsx:50`). `CustomFieldsTable` is an `XDataGrid` with `tableId='custom-fields-2'` and columns name, PDF header, description, category, type, stats function (`CustomFieldsTable.jsx:19-61`), Edit/Delete row actions and Help/New toolbar buttons. `NewCustomFieldButton` / `EditCustomFieldButton` open `CustomFieldModal` via `dialogs.open` (`NewCustomFieldButton.jsx:16`, `EditCustomFieldButton.jsx:15`): name, PDF header, description, free-solo category from `customFieldsCategories.allCategories` (`CustomFieldModal.jsx:109-139`), type locked after creation (`:80`, `:150`), stats function per type (`:25-31`); the body is sent as-is (`app/ui/src/util/http/fields.jsx:25-45`). `DeleteCustomFieldButton` confirms, then calls `DELETE` (`DeleteCustomFieldButton.jsx:26-39`). Every mutation invalidates `['custom-fields']` (`CustomFieldModal.jsx:45-50`, `DeleteCustomFieldButton.jsx:17-22`). `HelpButton` is static help text |
| Logbook table layout `app/ui/src/components/Settings/LogbookLayout/LogbookLayout.jsx:21` | Builds the list of standard + custom columns (`:24-65`), splits it into visible (saved order, then new columns) and available (`:70-96`); reorder/remove/add write `logbook_profile.table_columns` and `table_hidden_columns` into the page's local settings copy (`:98-138`); `SaveProfileButton` sends them with `PUT /api/settings/profile` and invalidates `['settings']` (`SaveProfileButton.jsx:13-18`) |

Query hooks and keys:

| Hook | Key | Fetcher → path |
|---|---|---|
| `useLogbookQuery` `app/ui/src/hooks/queries/useLogbookQuery.js:4-18` | `['logbook']` | `fetchLogbookData` → `GET /logbook/data` (`app/ui/src/util/http/logbook.jsx:40`) |
| `useFlightQuery` `useFlightQuery.js:4-18` | `['flight', id]` | `fetchFlightData` → `GET /logbook/{id}` (`logbook.jsx:70`) |
| `SignModal` inline query `SignModal.jsx:100-106` | `['flight', uuid, 'signature']` | `fetchFlightRecordSignature` (`logbook.jsx:166`) |
| `useNightTime` (mutation) `useNightTime.js:6-21` | — | `fetchNightTime` → `POST /logbook/night` (`logbook.jsx:90`) |
| `useCustomFields` `app/ui/src/hooks/useCustomFields.jsx:20-26` | `['custom-fields']` | `fetchCustomFields` → `GET /custom-fields/list` (`app/ui/src/util/http/fields.jsx:5-13`) |
| `useSettings` `app/ui/src/hooks/useSettings.jsx:244-250` (source of `logbookProfile`) | `['settings']` | `fetchSettings` → `GET /settings/list` (`app/ui/src/util/http/settings.jsx:5-6`) |
| `SummaryFlightMap` (Map page) | `['logbook', 'map']` | `fetchLogbookMapData` (`logbook.jsx:55`) |

## 5. Data Model & Persistence

| Object | Columns / content | Notes |
|---|---|---|
| Table `logbook` `internal/driver/db_structure.go:23-53` | `uuid` PK (UUID: TEXT / VARCHAR(36)); `date` NOT NULL, `departure_time`, `arrival_time` (DateTime: TEXT / VARCHAR(32)); `departure_place`, `arrival_place`, `aircraft_model`, `reg_name`, `sim_type`, `pic_name` (SmallText: TEXT / VARCHAR(255)); 11 time columns + `day_landings`/`night_landings` (SmallInt NOT NULL DEFAULT 0: INTEGER / SMALLINT); `remarks`, `custom_fields`, `signature` (FullText: TEXT / TEXT); `distance` (Real: REAL / FLOAT); `track` (Blob: BLOB / LONGBLOB); `tags` (BigText: TEXT / VARCHAR(512), NOT NULL DEFAULT '') | Engine types (SQLite / MySQL) come from `ColumnType` (`db_structure.go:6-14`). MySQL time columns differ between installs: fresh installs get SMALLINT from the declarative schema, while DBs migrated from schema < 100 have INT (`migrateLogbookTimeColumns` `internal/driver/data_overhaul.go:417-439`, MySQL only, run with its own context after the data transaction commits `:474-482`, gated at `internal/driver/driver.go:49`); landings stay SMALLINT |
| Table `custom_fields` `db_structure.go:134-142` | `uuid` PK, `name`, `description`, `category` (DEFAULT 'Custom'), `type`, `stats_function`, `pdf_header` (SmallText NOT NULL DEFAULT '') | `size_xs/md/lg` and `display_order` were removed from the definition in schema 103 (commit `9bb8263`), but `validateDB` never drops columns (`internal/driver/db_operations.go:137-185`), so upgraded databases keep them as `NOT NULL` without a default (§11 #29) |
| View `logbook_view` `db_structure.go:165-224` | All `logbook` columns + `rn`, `has_track`, `attachments_count` (LEFT JOIN `attachments`), `prev_uuid`, `next_uuid`; `IFNULL` for `distance`, `custom_fields` (→ `'{}'`), `tags`, `signature`, landings | Separate SQLite and MySQL SQL strings; SQLite also maps `''` landings to 0 (`:175-176`) |
| `logbook.custom_fields` JSON | `{ "<custom field uuid>": value }`; `duration` values are minutes (migrated by `migrateCustomFields` `internal/driver/data_overhaul.go:101-138`) | UI parses with `jsonCodec` and re-stringifies on save (`app/ui/src/util/http/logbook.jsx:5-38`) |
| `logbook.tags` | Comma-separated string | Split in UI (`FlightRecordDetails.jsx:184`) |
| In-memory | `distanceCache` (`internal/models/helpers.go:26`) — keyed by sorted airport pair, filled at startup and on demand | Lost on restart |
| `settings.logbook_profile` (settings JSON) | `fields_visibility`, `flight_record_layout`, `table_columns`, `table_hidden_columns` (`internal/models/structs.go:223-239`) | Shared by every browser of the installation. Written by `PUT /api/settings/general` (record page: layout, field visibility) and `PUT /api/settings/profile` (table layout, stores only `LogbookProfile`, `app/handlers_settings.go:176-198`). No server default: the UI falls back to `DEFAULT_PROFILE` (`app/ui/src/hooks/useSettings.jsx:290-294`) |
| Browser | localStorage: grid pagination/columns `logbook-pagination`, `logbook-columns` (`XDataGrid.jsx:111-112`), filters (`FilterContext.jsx:7-8`). The former form-visibility key `FIELDS_VISIBILITY_KEY` (`app/ui/src/constants/constants.jsx:108`) is no longer read, and its old values were not migrated into the profile | Per browser |

## 6. Data Flow

| Operation | Path |
|---|---|
| Load table | `Logbook` → `useLogbookQuery` → `fetchLogbookData` (parses `custom_fields`) → `GET /api/logbook/data` → `HandlerApiLogbookData` → `GetFlightRecords` → `logbook_view` |
| Open record | `FlightRecord` → `useFlightQuery(id)` → `fetchFlightData` → `GET /api/logbook/{id}` → `GetFlightRecordByID` → `logbook_view`; result copied into local state with a `redraw` token (`FlightRecord.jsx:36-38`) |
| Create | `SaveFlightRecordButton` → `createFlightRecord` → `prepareFlightDataForAPI` (stringify custom fields, `parseInt` landings) → `POST /api/logbook/new` → `HandlerApiFlightRecordNew` → `InsertFlightRecord` → `GenerateAircraftTable`; UI optionally copies persons (`app/ui/src/components/FlightRecord/MenuButtons/SaveFlightRecordButton.jsx:32-33`) then navigates to the new uuid |
| Update | `SaveFlightRecordButton` / `BulkEditButtons` → `updateFlightRecord` → `PUT /api/logbook/{uuid}` → `UpdateFlightRecord` → `GenerateAircraftTable` |
| Cache invalidation after save | `['flight', uuid]` (bulk: `['flight']`), `['logbook']`, `['currency']`, `['aircrafts']`, `['models-categories']` (`SaveFlightRecordButton.jsx:41-47`, `BulkEditButtons.jsx:47-53`); no `['persons', …]` key (§11 #5) |
| Delete | `DeleteFlightRecordButton` → `DELETE /api/logbook/{uuid}` → `DeleteFlightRecord` → `DeleteAttachmentsForFlightRecord` (separate call, no transaction, error only logged, §11 #24) → `GenerateAircraftTable` (error ignored); UI invalidates only `['logbook']`, `['aircrafts']` (`app/ui/src/components/FlightRecord/MenuButtons/DeleteFlightRecordButton.jsx:22-23`; missing keys: §11 #5, #28) |
| Night time | `DepArrTime.handleTimeChange` (form, and bulk-edit `DepArrTimeCell`) → `useNightTime` → `POST /api/logbook/night` → `HandlerNightTime` → `app.calculateNightTime` (`app/helpers.go:67`: `GetAirportByID` ×2, parse date+time, +24 h if arrival < departure) → `nighttime.Route.NightTime()` → rounded minutes |
| Track upload | `AddTrackButton` / `ConvertAttachmentToTrackButton` → `uploadTrackLog` → `POST /api/logbook/track/{uuid}` → `UpdateFlightRecordTrack(uuid, sum(segments), json)` |
| Track reset | `ResetTrackButton` → `DELETE /api/logbook/track/{uuid}` → `GetFlightRecordByID` → `Distance(dep, arr)` → `UpdateFlightRecordTrack(uuid, d, nil)` |
| Signature | `SignModal` → `PUT /api/logbook/{uuid}/signature` (JSON string) → `UpdateFlightRecordSignature`; invalidates `['flight', uuid, 'signature']` |
| Custom field definitions | Fields & Layout `CustomFieldModal` → `createCustomField`/`updateCustomField` (`app/ui/src/util/http/fields.jsx:25-45`, body sent unchanged) → `/api/custom-fields/...` → `InsertCustomField`/`UpdateCustomField` → `custom_fields`; invalidates `['custom-fields']` |
| Form layout | `SaveLayoutButton` → `updateSettings` with `{...settings, logbook_profile: {..., flight_record_layout}}` → `PUT /api/settings/general` → `HandlerApiSettingsUpdate` (replaces the whole settings object except export and signature, `app/handlers_settings.go:22-50`); invalidates `['settings']` (`app/ui/src/components/FlightRecord/MenuButtons/SaveLayoutButton.jsx:17-36`) |
| Form field visibility | `ShowHideFieldsModal` switch → same `PUT /api/settings/general` path with `logbook_profile.fields_visibility`, one request per toggle (`app/ui/src/components/FlightRecord/MenuButtons/ShowHideFieldsButton.jsx:38-59`) → `FlightRecordLayout` filters children (`app/ui/src/components/FlightRecord/FlightRecordLayout.jsx:72-85`) |
| Logbook table layout | `LogbookLayout` edits → `SaveProfileButton` → `updateProfileSettings` → `PUT /api/settings/profile` → `HandlerApiSettingsProfile` (copies only `LogbookProfile`) → `['settings']` refetch → `LogbookTable` `orderedColumns` (`app/ui/src/util/http/settings.jsx:107-115`, `app/handlers_settings.go:176-198`, `app/ui/src/components/Logbook/LogbookTable.jsx:165-174`) |

## 7. Config & Constants

| Name | Value | Where | Kind |
|---|---|---|---|
| DB query timeout | 60 s | `DefaultTimeout` `internal/models/helpers.go:14` | (hardcoded) |
| Distance backfill / cache build timeout | 60 s / 120 s | `internal/models/helpers.go:66`, `:107` | (hardcoded) |
| Night threshold | sun elevation ≤ −6° | `NIGHT_SUN_ELEVATION` `internal/nighttime/nighttime.go:14` | (hardcoded) |
| Earth radius (night-time distance) | 6378100.0 m, result in NM (÷1.852) | `internal/nighttime/nighttime.go:65-68` | (hardcoded) |
| Night segment size | 1 minute of flight at average speed | `internal/nighttime/nighttime.go:94-95` | (hardcoded) |
| Night time date/time layout | `"2006-01-02 1504"` | `app/helpers.go:78`, `:88` | (hardcoded) |
| Overnight correction | arrival + 24 h if before departure | `app/helpers.go:94-96`; UI `app/ui/src/components/UIElements/DepArrTime.jsx:24` | (hardcoded) |
| gzip level for list endpoints | 5 | `app/routes.go:34-35` | (hardcoded) |
| Query `staleTime` / `gcTime` | 3600000 ms | `useLogbookQuery.js:7-8`, `useFlightQuery.js:8-9`, `useCustomFields.jsx:23-24` | (hardcoded) |
| Grid page sizes | from setting `logbook_pagination`, fallback `[5, 10, 15, 20, 25, 30, 50, 100]` | `app/ui/src/hooks/useSettings.jsx:79`, `:253-260` | (configurable) |
| Grid default page size | 20 | `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:19-20` | (hardcoded) |
| Previous-pages total row | shown when `logbook_totals_view === 1` | `LogbookTable.jsx:342` | (configurable) |
| Footer initial values | `settings.previous_experience` | `LogbookTable.jsx:343` | (configurable) |
| Time display format | `time_fields_auto_format`, default 1 (HH:MM) | `useSettings.jsx:305` | (configurable) |
| Date display format | `date_fields_format`, default `DD/MM/YYYY` | `useSettings.jsx:306` | (configurable) |
| Self PIC label | `self_pic_label`, default `"Self"` | `FlightRecordDetails.jsx:96`, `PICNameField.jsx:22` | (configurable) |
| Place/time input | upper-case; time digits only, max 4 | `constants.jsx:67-72` | (hardcoded) |
| Flight-time input max length | 5 | `app/ui/src/components/UIElements/TimeField.jsx:13` | (hardcoded) |
| Earliest date | 1903-12-17 | `DatePicker.jsx:25` | (hardcoded) |
| New custom field defaults | name `New Custom Field`, category `Custom`, type `text`, stats `none`, `pdf_header` `""` | `app/ui/src/constants/constants.jsx:98-106` | (hardcoded) |
| Custom field stats per type | text/time: none,count; number/duration: none,sum,average,count; enroute: none | `CustomFieldModal.jsx:25-31` | (hardcoded) |
| Copy/return notification | 5000 ms | `app/ui/src/components/FlightRecord/MenuButtons/CopyFlightRecordButton.jsx:20`, `ReturnFlightRecordButton.jsx:38` | (hardcoded) |
| Default form layout and field visibility | `DEFAULT_PROFILE` (all fields visible; per-breakpoint grid items) | `app/ui/src/hooks/useSettings.jsx:81-239` | (configurable: overridden by `settings.logbook_profile`) |
| Form grid | breakpoints 900/600/450/300/150 px, 60 columns, row height 32 px, margin `[6, 12]`; new custom field item width 30, `minW` 4 | `app/ui/src/components/FlightRecord/FlightRecordLayout.jsx:9-10`, `:64`, `:107-108` | (hardcoded) |
| Schema version | `"103"` | `internal/driver/db_structure.go:4` | (hardcoded) |

## 8. Error Handling & Edge Cases

| Case | Behaviour | Evidence |
|---|---|---|
| DB/JSON error in handler | `handleError` logs `file:line` and returns 500 `JSONResponse{ok:false, message}` | `app/helpers.go:53-63` |
| Night-time calc error (bad date/time format, DB error) | Logged; handler returns **no body** (status 200 by default) | `app/handlers_flightrecord.go:39-43`, `app/helpers.go:73-91` |
| Unknown departure/arrival airport (night time) | No error: coordinates default to lat/lon 0,0 and a wrong night time is computed; the form writes it into `time.night_time` (issue 21) | `app/helpers.go:73-91`, `internal/models/airports.go:33-34`, `app/ui/src/components/UIElements/DepArrTime.jsx:65-69` |
| Missing place/time for night time | Returns 0 without error | `app/helpers.go:69-71` |
| Same dep/arr coordinates | Minute-by-minute check at the airport (circuits) | `internal/nighttime/nighttime.go:87-89` |
| Zero flight duration with different places | Speed = +Inf → night time 0 | `nighttime.go:82-84`, `:143` |
| Unknown airport in distance | Distance is computed from lat/lon 0,0 (bogus value, cached in `distanceCache`, persisted on create); 0 only for equal codes or a DB error (issue 21) | `internal/models/airports.go:33-34`, `internal/models/helpers.go:30-31`, `:45-53` |
| Empty logbook / no custom fields | Handlers emit `null`; UI normalizes to `[]` | `useLogbookQuery.js:10`, `useCustomFields.jsx:102-103` |
| Bulk save partial failure | Failed uuids stay highlighted and edit mode stays on, but the following `['logbook']` refetch passes new `rows` to the grid, so the unsaved edits of failed rows are likely lost (issue 27, Suspected) | `BulkEditButtons.jsx:44-60`, `LogbookTable.jsx:333`, `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:143-147`, `:248` |
| Bulk cancel | Rows restored from the query data | `BulkEditButtons.jsx:65-76` |
| Deleted custom field still in a record | Dropped from `custom_fields` on next single-record save | `app/ui/src/components/FlightRecord/MenuButtons/SaveFlightRecordButton.jsx:53-60` |
| Custom field type change | Disabled for existing fields | `CustomFieldModal.jsx:80`, `:150` |
| New custom field on a database created before schema 103 | `INSERT` omits the old `size_xs`/`size_md`/`size_lg`/`display_order` columns, which are `NOT NULL` without a default, so the insert is expected to fail (500) on SQLite and on MySQL in strict mode (§11 #29) | `internal/models/custom_fields.go:52-57`; old definition in commit `1407f99`; no column drop in `internal/driver/db_operations.go:137-185` |
| Update/delete of non-existent uuid | Succeeds silently (no rows-affected check) | `internal/models/flightrecords.go:74-83`, `:123-124` |
| Malformed track points | No length check on inner arrays (panic) | `app/handlers_flightrecord.go:138-140` |
| Request body size | No limit applied in these handlers | Not found in code |
| Server-side validation of date/time/place | None — the UI is the only validator | Not found in code |

## 9. Integration Points

| Other system | What crosses the boundary |
|---|---|
| `ARCHITECTURE_APPLICATION.md` | Route registration (`app/routes.go:33-51`, `:142-148`), `writeJSON`/`writeOkResponse`/`handleError` (`app/helpers.go`), startup distance tasks (`app/main.go:204-208`) |
| `ARCHITECTURE_AUTH.md` | `Auth` middleware on all endpoints here; UI fetchers send `Authorization: Bearer` from `getAuthToken()` |
| `ARCHITECTURE_DATABASE.md` | `logbook`, `custom_fields` tables, `logbook_view`, `validateDB` (adds columns, never drops them, §11 #29), v5 data overhaul (dates, minutes, duration custom fields); schema 103 |
| `ARCHITECTURE_SETTINGS.md` | Header names (`fieldName`/`fieldNameF`), time/date formats, `self_pic_label`, `logbook_pagination`, `logbook_totals_view`, `previous_experience`; `settings.logbook_profile` (`Profile`, `DEFAULT_PROFILE`, `PUT /api/settings/profile` `app/handlers_settings.go:176-198`, `PUT /api/settings/general`). The custom-field UI (`app/ui/src/components/Settings/CustomFields/`) and the table layout card (`app/ui/src/components/Settings/LogbookLayout/`) are rendered on the Fields & Layout page (`app/ui/src/components/Settings/FieldsAndLayout.jsx:47-56`) and documented here in §4.4 |
| `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` | `GenerateAircraftTable` after every create/update/delete; `GetAirportByID` for night time (unknown codes → lat/lon 0,0, §11 #21 and that doc's §11 #1); `Distance` + `distanceCache`; `/api/distance`; model `time_fields_auto_fill` via `useModelsCategoriesQuery` (`FlightRecordDetails.jsx:92-120`) |
| `ARCHITECTURE_PERSONS.md` | `FlightRecordPersons` card on the record page; `copyPersonsFlightRecord` after a "Return" save; `person_to_log` not cleaned on delete; record save/delete never invalidate `['persons', …]` query keys (§11 #5) |
| `ARCHITECTURE_CURRENCY_LICENSING.md` | `Attachments` card; `DeleteAttachmentsForFlightRecord` on delete (non-transactional, §11 #24); KML → track via `uploadTrackLog`; Currency page consumes `useLogbookQuery`, saves invalidate `['currency']` |
| `ARCHITECTURE_STATS_AND_MAP.md` | Stats pages and Map consume `['logbook']` / `['logbook','map']`; `FlightMap` draws the record route/track according to the localStorage map options (`MAP_OPTIONS_NAME`, `app/ui/src/components/FlightMap/FlightMap.jsx:56`), not the `options` prop `FlightRecord` passes (§11 #22); custom-field stats in `app/ui/src/components/Stats/Dashboard/CustomFieldsTiles.jsx` and `app/ui/src/components/Stats/helpers.jsx` |
| `ARCHITECTURE_PDF_EXPORT.md` | `GetFlightRecordsForExport` (`app/handlers_export.go:96`, now including `custom_fields`), `CalculateTotals`, signature; custom-field columns labelled by `pdf_header` or `name` (`internal/pdfexport/layout.go:297-305`); `PDFExportButton`/`CSVExportButton` in the logbook toolbar |
| `ARCHITECTURE_IMPORT.md` | `InsertFlightRecord`, `calculateNightTime` with night-landing swap, `GetFlightRecords` for duplicate detection, `GetCustomFields` (`app/handlers_import.go:50`, `:150`, `:194-217`); `ImportTable` renders `LogbookTable` for the preview without its own `tableId` (`app/ui/src/components/Import/ImportTable.jsx:25-32`), so it shares the logbook grid's localStorage state and footer settings (§13 Gotchas) |
| `ARCHITECTURE_FRONTEND.md` | Query-hook pattern, `handleFetch`, `queryClient`, `XDataGrid`, `constants.jsx`, router (`main.jsx`) |

## 10. Testing

| Test | Covers | Run |
|---|---|---|
| `internal/nighttime/nighttime_test.go` | `TestKnownNightTime` `:11`, `TestKnownNightTime2` `:33`, `TestAllNightTime` `:55`, `TestAllDayTime` `:77` — night minutes and night landing | `make test` (`go test -v ./... -coverpkg=./...`, `Makefile:32-33`; needs `make build_ui` first) |
| `app/ui/src/hooks/useCustomFields.test.jsx` | `getEnroute` parsing (`:62-134`) | `npm test` in `app/ui` (vitest, `app/ui/package.json:11`) |

Gaps: no tests for any handler in scope, the SQL in `flightrecords.go`/`custom_fields.go` (either engine), `calculateNightTime`, `prepareFlightDataForAPI`, the `DepArrTime` total-time logic (`app/ui/src/components/UIElements/DepArrTime.jsx:15-27`, `:45-70`), `calculateDistance`, `customFieldsCategories`, bulk edit, `LogbookTable` columns and profile ordering, or the form layout/visibility handling in `FlightRecordLayout`.

## 11. Known Issues & Tech Debt

| # | Issue | Location | Status (Confirmed/Suspected) | Severity | verified: 2026-11-08 |
|---|---|---|---|---|---|
| 1 | "Return" puts a dayjs **object** into `date`; if the user does not touch the date, `JSON.stringify` calls `dayjs.toJSON()` and an ISO UTC timestamp (e.g. `2026-10-13T22:00:00.000Z`, previous day east of UTC) is stored in `logbook.date`. Regression from commit `8b2fa8d`, which dropped `.format(...)`. After a reload the state is a structured-clone plain object and the save fails to decode | `app/ui/src/components/FlightRecord/MenuButtons/ReturnFlightRecordButton.jsx:21`; passed through by `app/ui/src/util/http/logbook.jsx:30-37`; no server validation `internal/models/flightrecords.go:87-116` | Confirmed — code path read end-to-end; `git show 8b2fa8d` shows the removed `.format` | MAJOR | ✓ |
| 2 | Night-time endpoint writes no response on error; the client's `response.json()` throws on the empty 200 body, and the rejection escapes `DepArrTime.handleTimeChange` (form and bulk-edit time cells) | `app/handlers_flightrecord.go:39-43`, `app/ui/src/util/http/http.jsx:30`, `app/ui/src/components/UIElements/DepArrTime.jsx:66` | Confirmed — `return` without write | MINOR | ✓ |
| 3 | Distance is inconsistent: create overwrites the UI value with the direct great-circle distance (ignores `enroute`); update stores the client value; track reset recomputes the direct distance | `internal/models/flightrecords.go:91`, `:71`; `app/handlers_flightrecord.go:168`; UI `useCustomFields.jsx:79-99` | Confirmed — `InsertFlightRecord` overwrites with `m.Distance(dep, arr)` (no enroute); `UpdateFlightRecord` binds the body `distance` | MINOR | ✓ |
| 4 | `PUT /logbook/{uuid}` and `PUT /custom-fields/{uuid}` ignore the URL param and update by body `uuid`; no rows-affected check, so a wrong or empty uuid still returns OK | `app/handlers_flightrecord.go:106-123`, `app/handlers_custom_fields.go:54-68`, `internal/models/flightrecords.go:74-83` | Confirmed — `UPDATE … WHERE uuid = ?` bound to the body uuid; `ExecContext` result ignored (`internal/models/custom_fields.go:71-73` likewise) | MINOR | ✓ |
| 5 | Deleting a flight leaves `person_to_log` rows (only attachments are cleaned); orphan roles still appear in `GetPersonsRoles`. Single-record save, bulk save and delete also never invalidate `['persons', …]` keys, so the person view (`['persons','flights',uuid]`, staleTime 1 h) shows edited or deleted flights for up to 1 h, and a Return save's `copyPersonsFlightRecord` leaves `['persons','flights']` / `['persons','roles']` stale. See `ARCHITECTURE_PERSONS.md` §11 #2, #4 | `app/handlers_flightrecord.go:52-70`, `internal/models/persons.go:204`, `app/ui/src/components/FlightRecord/MenuButtons/SaveFlightRecordButton.jsx:32-47`, `app/ui/src/components/Logbook/BulkEditButtons.jsx:47-53`, `app/ui/src/components/FlightRecord/MenuButtons/DeleteFlightRecordButton.jsx:22-23`, `app/ui/src/components/Persons/PersonView.jsx:35-41` | Confirmed — no `person_to_log` delete in the handler; no persons key in any of the three invalidation lists | MINOR | ✓ |
| 6 | Deleting a custom field leaves its values in `logbook.custom_fields`; only the single-record save filters them, bulk save does not. The delete confirmation nevertheless says it "will remove all data associated with this field" | `internal/models/custom_fields.go:77-85`, `app/ui/src/components/FlightRecord/MenuButtons/SaveFlightRecordButton.jsx:53-60`, `BulkEditButtons.jsx:32-37`, `app/ui/src/components/Settings/CustomFields/DeleteCustomFieldButton.jsx:27-28` | Confirmed — `DELETE FROM custom_fields` only; bulk save sends grid rows unfiltered | MINOR | ✓ |
| 7 | Custom field `category` stores the header **display text**. Renaming a standard group header (with `enable_custom_names` on), or toggling `enable_custom_names` when the stored headers differ from the defaults, makes fields saved under the old text match no standard group. Since commit `9bb8263` such a field no longer vanishes: the old text becomes a user-defined category and the column moves to its own group at the end of the table, named after the old header. A category with leading/trailing spaces still vanishes, because `userDefinedCategories` is trimmed while the column filter compares the raw value. Toggling alone with default headers is harmless: the backend defaults equal the UI defaults (`internal/models/models_defaults.go:39-52` vs `useSettings.jsx:7-41`) | `CustomFieldModal.jsx:130-139`, `app/ui/src/hooks/useCustomFields.jsx:29-58`, `app/ui/src/components/Logbook/helpers.jsx:109`, `LogbookTable.jsx:145-147`, `useSettings.jsx:268-286` | Confirmed — strict `field.category === category` filter against the current header text; `.trim()` only in `useCustomFields.jsx:12`, `:56` | MINOR (reduced: column moves instead of vanishing) | ✓ |
| 8 | Track upload indexes `track[i][0..1]` without checking the inner length; a malformed body panics the handler (no `Recoverer` middleware; `net/http` drops the connection) | `app/handlers_flightrecord.go:138-140`, `app/routes.go:9-22` | Confirmed — no length check before indexing; `routes()` registers no `middleware.Recoverer` | MINOR | ✓ |
| 9 | Night-time rounding differs: UI endpoint rounds, import truncates | `app/handlers_flightrecord.go:46` vs `app/handlers_import.go:202` | Confirmed — `math.Round(night.Minutes())` vs `int(night.Minutes())` | MINOR | ✓ |
| 10 | `nightSegment` truncates midpoint offsets to whole minutes (`time.Duration(flightTime) * time.Minute`), so leaf timestamps drift near twilight boundaries | `internal/nighttime/nighttime.go:130-131` | Suspected — confirm by comparing results with a float-duration variant on routes crossing dusk/dawn | MINOR | ✓ |
| 11 | PDF export success toast is bound to `isPending`, so "PDF Exported successfully" shows when the export starts, even if it then fails. Same bug in `app/ui/src/components/PdfExport/MenuButtons/ExportButton.jsx:29`, see `ARCHITECTURE_PDF_EXPORT.md` §11 #6 | `app/ui/src/components/Logbook/PDFExportButton.jsx:34` | Confirmed — `useSuccessNotification({ isSuccess: isExporting })` | MINOR | ✓ |
| 12 | Time format setting is ignored by the bulk-edit ME and SIM cells (no `fieldFormat` → default 1) and by the SIM time input on the form | `LogbookTable.jsx:98-103`, `:135-140`; `app/ui/src/components/Logbook/helpers.jsx:70`; `FlightRecordDetails.jsx:178`; `app/ui/src/components/UIElements/TimeField.jsx:12` | Confirmed — these calls pass no `fieldFormat`, so the default 1 applies | MINOR | ✓ |
| 13 | `FLIGHT_INITIAL_STATE.date` is evaluated once at module load, so a tab left open past midnight defaults new flights to the previous day | `app/ui/src/constants/constants.jsx:16` | Confirmed — `dayjs()` is called in a module-level constant | MINOR | ✓ |
| 14 | Records started via New (toolbar/menu) or Return have no `track` key, so `flight.track === null` is false and leaving a place field never sets the live distance (the server computes it on insert). Copy inherits `track` (`CopyFlightRecordButton.jsx:18`, `null` for trackless records), and the enroute blur sets distance unconditionally (`FlightRecordDetails.jsx:60-64`) | `constants.jsx:14-52`, `app/ui/src/components/UIElements/DepArrPlace.jsx:37`, `FlightRecord.jsx:26-33` | Confirmed — strict `=== null` compared against `undefined` | MINOR | ✓ |
| 15 | `logbook_view` windows order only by `(date, departure_time)`; ties (e.g. several sim sessions with empty times on one day) may give non-deterministic `rn` and prev/next. Same issue: `ARCHITECTURE_DATABASE.md` §11 #22 | `internal/driver/db_structure.go:172`, `:192-193` | Suspected — create two tied records and compare `rn`/`prev_uuid` across requests and engines | MINOR | ✓ |
| 16 | Single-record reads (`GetFlightRecordByID`, `GetFlightRecordSignature`) go through `logbook_view`, whose window functions and attachment aggregation cover the whole table; every save also runs `GenerateAircraftTable` (N times for a bulk save of N rows) | `internal/models/flightrecords.go:39`, `:262`; `app/handlers_flightrecord.go:67`, `:95`, `:121`; `BulkEditButtons.jsx:35-42` | Suspected (performance) — time with a large logbook | MINOR | ✓ |
| 17 | `logbook_view` does not `IFNULL` the nullable text columns that are scanned into Go `string`; one NULL (legacy DB, manual edit) fails the whole list. Same issue: `ARCHITECTURE_DATABASE.md` §11 #22 | `internal/driver/db_structure.go:173-178`, `internal/models/flightrecords.go:150-156` | Suspected — set one `pic_name` to NULL and call `GET /api/logbook/data` | MINOR | ✓ |
| 18 | `number` custom values are stored as strings from the form but as ints from bulk edit (mixed JSON types; consumers currently parse both). Bulk edit also `parseInt`s every keystroke, so decimal `number` values are truncated (a stored `1.5` becomes `1` on any edit) and a `.` cannot be typed | `FlightRecordDetails.jsx:215-228`, `app/ui/src/components/UIElements/TextField.jsx:8`, `app/ui/src/components/Logbook/EditCells/NumberCell.jsx:11-14`, `app/ui/src/components/Logbook/helpers.jsx:134-135` | Confirmed — `TextField` passes `event.target.value` (string); `NumberCell` stores `parseInt(value, 10)` | MINOR | ✓ |
| 19 | Custom-field write handlers return a bare JSON string instead of `JSONResponse` | `app/handlers_custom_fields.go:51`, `:67`, `:77` | Confirmed — `writeJSON(w, http.StatusOK, "…")` | MINOR | ✓ |
| 20 | Duplicate haversine implementation | `internal/nighttime/nighttime.go:59-69` vs `internal/utils/distance.go:14-24` | Confirmed — same formula and Earth radius in both files | MINOR | ✓ |
| 21 | Unknown airport codes (a strip missing from the airport DB, a mistyped code) are not errors: `GetAirportByID` returns a zero-value `Airport` on `sql.ErrNoRows`, so `Distance` returns, and caches, the distance from lat/lon 0,0, and `calculateNightTime` computes night time at 0,0. Both values are persisted: the create distance, the live distance the form saves on update, the form's `time.night_time` and import. See also `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` §11 #1, `ARCHITECTURE_DATABASE.md` §11 #6 | `internal/models/airports.go:33-34`, `internal/models/helpers.go:45-53`, `app/helpers.go:73-110`, `internal/models/flightrecords.go:91`, `app/ui/src/components/UIElements/DepArrPlace.jsx:37-38`, `app/ui/src/components/UIElements/DepArrTime.jsx:65-69`, `app/handlers_import.go:190-202` | Confirmed — `ErrNoRows` is mapped to a nil error; callers check only `err != nil` and nothing checks for zero coordinates | MAJOR | ✓ |
| 22 | `FlightRecord` builds a track/route `options` object and passes it to `FlightMap`, which has had no `options` prop since commit `2822577`. This is dead code: the record map follows the global localStorage map options | `FlightRecord.jsx:69-73`, `:86`; `app/ui/src/components/FlightMap/FlightMap.jsx:55-56` | Confirmed — `FlightMap` signature is `({ data, title, sx, airportsMap })`; `git show 2822577` removed `options = DEFAULT_OPTIONS` | MINOR | ✓ |
| 23 | Track-derived distance gets overwritten by the great-circle/enroute distance. The enroute blur sets `distance` with no track check, both in the form and in the bulk cell, and the bulk cell marks the row edited even when nothing changed. Bulk place edits (`DepArrPlaceCell` → `DepArrPlace`) pass grid rows from `GetFlightRecords`, which never selects `track`, so `track === null` is always true there. The next save persists the value via `UpdateFlightRecord` | `FlightRecordDetails.jsx:60-64`, `app/ui/src/components/Logbook/EditCells/EnrouteCell.jsx:21-25`, `app/ui/src/components/Logbook/EditCells/DepArrPlaceCell.jsx:12-21`, `app/ui/src/components/UIElements/DepArrPlace.jsx:37`, `internal/models/flightrecords.go:132-141` | Confirmed — the list SELECT has no `track`, and a nil `[]byte` encodes as JSON `null` (`internal/models/structs.go:68`) | MINOR | ✓ |
| 24 | Flight delete and attachment cleanup are two separate, non-transactional calls. An attachment-delete error is only logged and the handler still answers OK, leaving orphan `attachments` rows | `app/handlers_flightrecord.go:55-69` | Confirmed — no transaction; `errorLog.Println` then `writeOkResponse` | MINOR | ✓ |
| 25 | `LogbookTable` destructures `isSettingsLoading` from `useSettings()`, which returns it as `isLoading`. The variable is always `undefined`, so the settings-loading guards on columns and grouping never apply: columns are first built with empty header names (`fieldName` returns `""` while loading), then rebuilt | `LogbookTable.jsx:34`, `:51`, `:177`; `useSettings.jsx:244`, `:301` | Confirmed — the hook's return object has no `isSettingsLoading` key | MINOR | ✓ |
| 26 | Copy carries the source `track` into the new-record state. The map shows the copied track until save (the insert does not store it), and the menu offers "Reset track" for uuid `new`. That calls `DELETE /api/logbook/track/new`, where `GetFlightRecordByID("new")` finds no row and the handler answers 500 | `CopyFlightRecordButton.jsx:18`, `FlightRecordMenuButtons.jsx:47`, `app/handlers_flightrecord.go:161-165`, `internal/models/flightrecords.go:27-52` (`GetFlightRecordByID`: `Scan` returns `sql.ErrNoRows`) | Confirmed — every other record action in the menu is gated by `uuid !== "new"` (Fields and Layout are not record actions), Reset track only by `flight.track` | MINOR | ✓ |
| 27 | After a bulk save with failures, `['logbook']` is invalidated and the refetched array reaches the grid as new `rows`, replacing rows edited via `apiRef.updateRows`. The failed rows stay marked, but their unsaved edits are probably gone, so a retry would resend server data | `BulkEditButtons.jsx:44-53`, `LogbookTable.jsx:333`, `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:143-147`, `:248` | Suspected — fail one PUT while another succeeds, then check the failed row's cells before retrying (an unchanged refetch may keep the same array through query structural sharing) | MINOR | ✓ |
| 28 | Flight delete invalidates only `['logbook']` and `['aircrafts']`. Still stale for up to 1 h (`staleTime` 1 h): `['flight', …]` (the deleted record stays cached, so browser Back reopens it, and cached neighbours keep `prev_uuid`/`next_uuid` pointing to it, `FlightTitle.jsx:17-30`); `['models-categories']` (per-model `total_time` summed from `logbook_view`, shown on the Aircrafts categories table); `['attachments']` (the server deletes the record's attachments, but the global Attachments page still lists them, see `ARCHITECTURE_CURRENCY_LICENSING.md` §11 #13); `['persons', …]` (§11 #5). Not affected: `['currency']` holds only the currency definitions; currency values are derived from `['logbook']` | `app/ui/src/components/FlightRecord/MenuButtons/DeleteFlightRecordButton.jsx:22-23`, `app/ui/src/hooks/queries/useFlightQuery.js:8-10`, `app/ui/src/hooks/queries/useModelsCategoriesQuery.js:5-9`, `internal/models/aircrafts.go:87-98`, `app/ui/src/components/Aircrafts/CategoriesTable.jsx:53-60`, `app/handlers_flightrecord.go:61`, `app/ui/src/components/Attachments/Attachments.jsx:16-19`, `internal/models/currency.go:7-10`, `app/ui/src/components/Currency/Currency.jsx:13` | Confirmed — invalidation list read; the delete is only reachable from the record page, so `['flight', uuid]` is always cached at that point (`FlightRecord.jsx:22`) | MINOR | ✓ |
| 29 | Creating a custom field on a database whose `custom_fields` table existed before schema 103. Commit `9bb8263` removed `size_xs`, `size_md`, `size_lg` and `display_order` from the table definition and from `InsertCustomField`, but `validateDB` only adds columns. Upgraded databases keep the four columns as `NOT NULL` without a default (definition unchanged since commit `1407f99`), so the new `INSERT` that omits them should fail: SQLite raises a NOT NULL constraint error, MySQL in strict mode raises "doesn't have a default value". Updates and reads are unaffected. Fresh installs are fine. See `ARCHITECTURE_DATABASE.md` | `internal/models/custom_fields.go:48-60`, `internal/driver/db_structure.go:134-142`, `internal/driver/db_operations.go:137-185`, `git show 9bb8263 -- internal/driver/db_structure.go` | Confirmed (code path, not run) — no `DROP COLUMN` or migration for these columns anywhere in `internal/driver`; MySQL in non-strict mode would insert 0 with a warning | MAJOR | ✓ |
| 30 | The Fields dialog's "Simulator" switch saves `fields_visibility.simulator`, but the form children are keyed `sim.type` and `sim.time`, so the switch hides nothing. `DEFAULT_PROFILE.fieldsVisibility` uses the `sim.*` keys, and the dialog has no switch for them | `app/ui/src/components/FlightRecord/MenuButtons/ShowHideFieldsButton.jsx:75`, `app/ui/src/components/FlightRecord/FlightRecordDetails.jsx:174-179`, `app/ui/src/components/FlightRecord/FlightRecordLayout.jsx:79`, `app/ui/src/hooks/useSettings.jsx:102-103` | Confirmed — `FlightRecordLayout` drops a child only when `visibility[child.key] === false`, and no child has key `simulator` | MINOR | ✓ |
| 31 | The date picker on the record form is labelled with the **Total time** header name (`fieldNameF("total")`, default "Total Time") instead of the date header. Regression from commit `9bb8263`; before it the label was `fieldNameF("date")` | `app/ui/src/components/FlightRecord/FlightRecordDetails.jsx:68`, `:135` | Confirmed — `labels.date` is built from `"total"`; `git show 4c65b86:app/ui/src/components/FlightRecord/FlightRecordDetails.jsx` used `"date"` | MINOR | ✓ |
| 32 | Columns removed in Settings → Fields & Layout → "Logbook Table Layout" are saved to `logbook_profile.table_hidden_columns`, but nothing outside that card reads the key: `logbookProfile` exposes only `tableColumns`, and `LogbookTable` sorts the omitted columns to the end with index `Infinity` instead of hiding them | `app/ui/src/components/Settings/LogbookLayout/LogbookLayout.jsx:113-120`, `app/ui/src/hooks/useSettings.jsx:290-294`, `app/ui/src/components/Logbook/LogbookTable.jsx:165-174`, `:346-351` | Confirmed — the only readers of `table_hidden_columns` in `app/ui/src` are `LogbookLayout.jsx:68` and the PDF export `table_profile` (a different object) | MINOR | ✓ |
| 33 | Dead code left by the refactor: `app/ui/src/components/FlightRecord/CustomFields.jsx` is imported nowhere (custom fields are now rendered inline in `FlightRecordDetails`), and `FIELDS_VISIBILITY_KEY` is no longer read. Field-visibility choices saved by earlier versions in localStorage were not migrated to `logbook_profile`, so every field shows again after the upgrade | `app/ui/src/components/FlightRecord/CustomFields.jsx:28-79`, `app/ui/src/components/FlightRecord/FlightRecordDetails.jsx:197-230`, `app/ui/src/constants/constants.jsx:108` | Confirmed — no import of `./CustomFields` or `FIELDS_VISIBILITY_KEY` in `app/ui/src` | MINOR | ✓ |
| 34 | `FlightRecordDetails` copies `logbookProfile.flightRecordLayout` into state only once, on mount. If `['settings']` is not cached yet (hard reload of `/logbook/<uuid>`), the state starts from `DEFAULT_PROFILE` and stays there, so the saved layout is not shown, and a Save in layout mode would store a layout edited from the default. Navigating between records keeps the same instance, so the default layout persists until the page is left | `app/ui/src/components/FlightRecord/FlightRecordDetails.jsx:55-56`, `app/ui/src/hooks/useSettings.jsx:290-294` | Suspected — save a custom layout, hard-reload a record URL and compare; the settings query is not prefetched anywhere (no `prefetchQuery`/`ensureQueryData` in `app/ui/src`) | MINOR | ✓ |

## 12. Rules for Future Development

### Recipe A — add a standard column to flight records (e.g. a new time field)

1. `internal/driver/db_structure.go`: add the column to `logbookTable` (`:23-53`) with a `ColumnType` that covers both engines. Add it to **both** SQL strings of `logbookView` (`:167-195` SQLite, `:196-222` MySQL), wrapping it in `IFNULL` if it is nullable. Bump `schemaVersion` (`:4`). `validateDB` only adds columns and recreates views (`internal/driver/driver.go:56-91`). A type change needs an explicit migration like `internal/driver/data_overhaul.go`.
2. `internal/models/structs.go`: add the field to `FlightRecord` with its JSON tag. If it counts toward totals, also add it to `CalculateTotals` (`internal/models/flightrecords.go:4`).
3. `internal/models/flightrecords.go`: update the SELECT + `Scan` lists in `GetFlightRecordByID`, `GetFlightRecords`, `GetFlightRecordsForMap`, `GetFlightRecordsForExport` (if exported), plus the INSERT column/placeholder lists and the UPDATE SET list. The column order must match exactly.
4. UI: `FLIGHT_INITIAL_STATE` (`app/ui/src/constants/constants.jsx:14-52`); the form: a keyed `<div>` child of `FlightRecordLayout` in `FlightRecordDetails.jsx` (for a time field add it to `TIME_FIELDS` `:46-49` and `labels` `:66-90`), a grid item for **every** breakpoint plus a `fieldsVisibility` entry in `DEFAULT_PROFILE` (`app/ui/src/hooks/useSettings.jsx:81-239`; saved profiles lack the item, see §13 Gotchas), and a switch in `ShowHideFieldsButton.jsx:62-78`; the table column + group (`LogbookTable.jsx`) and the column list of the table layout card (`app/ui/src/components/Settings/LogbookLayout/LogbookLayout.jsx:24-52`); and the header name keys (see `ARCHITECTURE_SETTINGS.md`: `ColumnsHeader` `internal/models/structs.go:165-198` and the UI default names).
5. Check the consumers: import mapping (`ARCHITECTURE_IMPORT.md`), PDF/CSV export (`ARCHITECTURE_PDF_EXPORT.md`), stats `TIME_FIELDS` (`app/ui/src/util/helpers.jsx:53-57`), currency metrics.

### Recipe B — add a logbook endpoint

1. Add the handler to `app/handlers_flightrecord.go` (record-level) or `app/handlers_logbook.go` (list-level). Use `handleError` / `writeOkResponse` / `writeJSON`, and take the target uuid from `chi.URLParam`. Follow every `app.handleError(w, err)` with `return`, because the helper does not stop the handler (`app/helpers.go:53-63`). Answer mutations with `writeOkResponse`. For writes that change aircraft model/registration (or add/remove records), call `_ = app.db.GenerateAircraftTable()` before responding, as create/update/delete do (`app/handlers_flightrecord.go:67`, `:95`, `:121`).
2. Register it inside `r.Route("/logbook", …)` in `app/routes.go:33-51`, which is under `r.Use(app.Auth)`. Add `middleware.Compress(5)` for large list responses.
3. Put the SQL in a `DBModel` method in `internal/models/flightrecords.go`, using `ContextWithDefaultTimeout`, `?` placeholders and SQL valid on both engines. Read from `logbook_view` when computed fields are needed, and write to `logbook`.
4. UI: add the fetcher to `app/ui/src/util/http/logbook.jsx` (Bearer header, `handleFetch`). Add a hook in `hooks/queries/` with a key under `['logbook']` or `['flight', id]` so the existing invalidations cover it.

### Recipe C — add a custom field type

1. `CustomFieldModal.jsx:23-31`: add the type and its stats functions. Update the help text in `app/ui/src/components/Settings/CustomFields/HelpButton.jsx:4-44`.
2. Form input: `getFieldProps` (`app/ui/src/components/FlightRecord/FlightRecordDetails.jsx:27-44`) and the custom-field render branch (`:197-230`). `app/ui/src/components/FlightRecord/CustomFields.jsx` is unused (§11 #33), do not edit it.
3. Table: aggregation and bulk-edit cell in `createCustomFieldColumns` (`app/ui/src/components/Logbook/helpers.jsx:104-147`). Add a new `EditCells/*` component if needed.
4. Stats: `updateCustomFieldTotals` (`app/ui/src/util/helpers.jsx:85-108`), the dashboard tiles' `calculateStats` (`app/ui/src/components/Stats/Dashboard/CustomFieldsTiles.jsx:14-52`, duration vs number parsing `:26`, `:38`) and `buildCustomFieldColumns` (`app/ui/src/components/Stats/helpers.jsx:22`, `isDuration` `:27`). See `ARCHITECTURE_STATS_AND_MAP.md`.
5. If stored values need conversion, write a migration (see `migrateCustomFields`, `internal/driver/data_overhaul.go:101`). The backend stores values as opaque JSON.
6. Import: `marshallItem` copies `custom_fields.*` values raw, with no per-type conversion (`app/ui/src/components/Import/helpers.jsx:70-77`). Add a conversion there if the type needs one. See `ARCHITECTURE_IMPORT.md`.

### Recipe D — make a column bulk-editable

Add a `renderCell` under `isBulkEdit` in `LogbookTable.jsx`, using an `EditCells/*` component that calls `params.api.updateRows` and `callBackFunction(uuid)`. Pass `fieldFormat={timeFieldsFormat}` to time cells (see issue 12). `BulkEditButtons` saves whole rows with `updateFlightRecord`, so no backend change is needed if the field already round-trips through `UpdateFlightRecord`.

### Recipe E — change night-time logic

Edit `internal/nighttime/nighttime.go` and extend `nighttime_test.go` with a known route. Remember the two callers, `HandlerNightTime` (rounds) and `app/handlers_import.go:194-212` (truncates, swaps night landings).

### Cross-check list (every change in this system)

- [ ] SQL valid on **SQLite and MySQL**; view edited in both strings; `schemaVersion` bumped for schema/view changes
- [ ] All four SELECT/Scan lists and the INSERT/UPDATE lists still match `FlightRecord`
- [ ] New route inside the `/api` group with `Auth` (`app/routes.go:26-27`)
- [ ] Every `handleError` followed by `return`; mutations answer with `writeOkResponse`
- [ ] UI invalidates `['logbook']` (which covers `['logbook','map']`), `['flight', uuid]`, and `['aircrafts']`/`['models-categories']`/`['currency']` when aircraft or times change, plus `['persons']` when records are deleted or persons are copied (missing today, §11 #5; see `ARCHITECTURE_PERSONS.md`)
- [ ] Time values stay integer minutes and dates stay `YYYY-MM-DD` strings (format with `dayjs(...).format('YYYY-MM-DD')`, never pass a dayjs object)
- [ ] `prepareFlightDataForAPI` still produces a Go-decodable body (ints for times and landings, string for `custom_fields`)
- [ ] Import, PDF export, CSV export and stats still handle the field
- [ ] Form field keys are the same in `FlightRecordDetails` (`<div key>`), `DEFAULT_PROFILE` (`app/ui/src/hooks/useSettings.jsx:81-239`) and the `ShowHideFieldsButton` ids (§11 #30); logbook column `field` names are the same in `LogbookTable` and `LogbookLayout`
- [ ] Custom-field schema changes: `validateDB` never drops or relaxes columns, so a removed `NOT NULL` column needs an explicit migration (§11 #29)
- [ ] `go vet ./...` + `make test` (after `make build_ui`) and `npm test` / lint in `app/ui`
- [ ] `CHANGELOG.md` `[Unreleased]` bullet (`- New:` / `- Update:` / `- Fix:`) and the same bullet in the README copy (the `## [Unreleased]` block under `# Changelog`, `README.md:64`; after a release the block is absent from both files and must be recreated)

## 13. AI Notes

### Mental Model

The backend is a thin CRUD layer: handlers decode `FlightRecord` JSON and pass it straight to SQL, with no validation. The derived values (record number, prev/next, cross-country time, track flag, attachment count) come from `logbook_view` and `processFlightrecord`. Most of the logic lives in the UI: total-time calculation, propagating time to other fields, PIC/model auto-fill, client distance with enroute waypoints, and custom-field sanitising. The server adds only the UUID, the create-time distance, the track-length distance on upload and the direct distance on track reset, the night-time computation, and the aircraft-table refresh after every create/update/delete (`app/handlers_flightrecord.go:86`, `:137-140`, `:168`, `:67`, `:95`, `:121`). The `FlightRecord` page keeps one `flight` state object edited through dotted-key `handleChange`. The table's bulk edit mutates grid rows in place and saves them one by one. Presentation preferences (form grid layout, form field visibility, table column order) live in the shared settings object as `logbook_profile`; the UI falls back to `DEFAULT_PROFILE` for missing keys.

### Gotchas

- Update reads the record id from the **body**, not the URL (`app/handlers_flightrecord.go:106-114`).
- `track` is base64 in JSON because it is a Go `[]byte`. Decode it with `atob` before `JSON.parse`.
- `custom_fields` is a **string** in the API and an **object** in the UI. Only `app/ui/src/util/http/logbook.jsx` converts between the two.
- Create recomputes distance on the server; update trusts the client.
- Leaving a time field overwrites `night_time` with the computed value, even if the pilot typed one (`app/ui/src/components/UIElements/DepArrTime.jsx:65-69`). Night landings are never auto-set from the UI, because the endpoint drops `IsNightLanding` (`app/handlers_flightrecord.go:39`).
- Changing total time also rewrites every other time field (except `night_time`) that equalled the old non-zero total (`app/ui/src/components/UIElements/DepArrTime.jsx:58-62`). Bulk-edit time cells run the same code.
- Custom-field columns are matched by header **display name**; unmatched categories become their own groups (issue 7).
- Form fields are identified by the `key` of their `<div>` in `FlightRecordDetails`; layout items (`i`) and visibility flags use the same ids. Only custom fields missing from a saved layout are appended automatically (`app/ui/src/components/FlightRecord/FlightRecordLayout.jsx:55-69`); a new standard field gets no saved layout item in existing profiles, so extend that logic when adding one.
- `PUT /api/settings/general` replaces the whole settings object (except export settings and the signature image), so the record page's layout and visibility saves send the full cached `settings` (`app/handlers_settings.go:22-50`). `PUT /api/settings/profile` replaces only `logbook_profile`.
- Never pass a dayjs object through `navigate(..., { state })` into `flight.date` (issue 1).
- An unknown airport code is not an error: distance and night time are computed from lat/lon 0,0 and saved (issue 21).
- Grid rows from `GET /api/logbook/data` carry `track: null` even for tracked flights, so bulk place/enroute edits overwrite a track distance (issue 23).
- `LogbookTable` is also the import preview (`app/ui/src/components/Import/ImportTable.jsx:25-32`) and uses `tableId='logbook'` (`LogbookTable.jsx:329`), so both share the `logbook-pagination`, `logbook-columns` and `logbook-filter-model` localStorage state, the footer settings (`:342-343`) and the profile column order (`:165-174`). Test the Import page after any `LogbookTable` change.
- The `distanceCache` key joins the two codes with no separator (`internal/models/helpers.go:34-39`), so a collision is possible in principle (Suspected, `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` §11 #23).

### File Quick Reference

| Need | File |
|---|---|
| Routes | `app/routes.go:33-51`, `:142-148`; profile `:90` |
| Handlers | `app/handlers_flightrecord.go`, `app/handlers_logbook.go`, `app/handlers_custom_fields.go` |
| Night-time glue | `app/helpers.go:67-113` |
| SQL | `internal/models/flightrecords.go`, `internal/models/custom_fields.go` |
| Schema + view | `internal/driver/db_structure.go:23-53`, `:134-142`, `:165-224` |
| Struct | `internal/models/structs.go:25-79`, `:366-374`; profile `:223-239` |
| Night maths | `internal/nighttime/nighttime.go` |
| Table | `app/ui/src/components/Logbook/LogbookTable.jsx`, `helpers.jsx`, `BulkEditButtons.jsx`, `EditCells/` |
| Form | `app/ui/src/components/FlightRecord/FlightRecord.jsx`, `FlightRecordDetails.jsx`, `FlightRecordLayout.jsx`, `app/ui/src/components/FlightRecord/MenuButtons/SaveFlightRecordButton.jsx`; inputs `app/ui/src/components/UIElements/DepArrPlace.jsx`, `DepArrTime.jsx` |
| Layout / visibility profile | `app/ui/src/hooks/useSettings.jsx:81-239`, `:290-294`; `app/ui/src/components/FlightRecord/MenuButtons/` (`SaveLayoutButton`, `ResetLayoutButton`, `ShowHideFieldsButton`); `app/ui/src/components/Settings/LogbookLayout/` |
| Custom-field admin | `app/ui/src/components/Settings/CustomFields/` (on `app/ui/src/components/Settings/FieldsAndLayout.jsx`) |
| HTTP | `app/ui/src/util/http/logbook.jsx`, `app/ui/src/util/http/fields.jsx` |
| Hooks | `app/ui/src/hooks/queries/useLogbookQuery.js`, `useFlightQuery.js`, `useNightTime.js`, `app/ui/src/hooks/useCustomFields.jsx` |

> **AI Usage Instructions**
> - Always read this file before modifying this system
> - Do not refactor without impact analysis
> - Ask if information is missing
