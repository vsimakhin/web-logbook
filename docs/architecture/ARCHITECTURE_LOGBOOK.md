# Logbook & Flight Records — Architecture

**Last Updated:** 2026-10-14 — initial version generated from code and fact-checked (TASK_AGENT_WORKFLOW_SETUP); 2026-10-14 — §11 cross-links to sibling docs, new #28 delete invalidation gap (consistency pass)

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

Backend: HTTP handlers in `app/handlers_flightrecord.go`, `app/handlers_logbook.go`, `app/handlers_custom_fields.go` (all under the `/api` route group with the `Auth` middleware, `app/routes.go:26-27`), SQL in `internal/models/flightrecords.go` and `internal/models/custom_fields.go`, night-time maths in `internal/nighttime/nighttime.go`. Frontend: `LogbookPage.jsx` → `components/Logbook/*` (MUI DataGrid table with bulk edit) and `FlightRecordPage.jsx` → `components/FlightRecord/*` (record form + map + attachments + persons), routed at `/`, `/logbook` and `/logbook/:id` (`app/ui/src/main.jsx:47-52`).

## 2. Key Concepts

| Term | Meaning / invariant | Evidence |
|---|---|---|
| Flight record | One row of table `logbook`, keyed by `uuid` (server generates UUIDv4 on create) | `internal/driver/db_structure.go:23`, `HandlerApiFlightRecordNew` `app/handlers_flightrecord.go:81-86` |
| Time fields | All flight times (`se_time` … `sim_time`) are **integer minutes**; the UI formats them (H:MM, HH:MM or FAA decimal) | `internal/models/structs.go:40-50`, `formatTimeField` `app/ui/src/util/helpers.jsx:4` |
| Date | Stored as ISO `YYYY-MM-DD` string; display format is a setting | `internal/driver/data_overhaul.go:15`, `DatePicker` `app/ui/src/components/UIElements/DatePicker.jsx:10` |
| Departure/arrival time | 4-digit `HHMM` string (UTC assumed by night-time calc) | `TIME_SLOT_PROPS` `app/ui/src/constants/constants.jsx:70-72`, layout `"2006-01-02 1504"` `app/helpers.go:78` |
| Place | ICAO/IATA code (upper-cased in UI) resolved against `airports_view` for distance / night time | `PLACE_SLOT_PROPS` `app/ui/src/constants/constants.jsx:67`, `GetAirportByID` `internal/models/airports.go:16` |
| Cross-country time (`cc_time`) | Not stored; computed on read = `total_time` when departure ≠ arrival, else 0 | `processFlightrecord` `internal/models/helpers.go:56-63` |
| Record number / prev / next | Not stored; `ROW_NUMBER()`/`LAG`/`LEAD` over `(date, departure_time)` in view `logbook_view` | `internal/driver/db_structure.go:175`, `:195-196` |
| `has_track`, `attachments_count` | Computed in `logbook_view` | `internal/driver/db_structure.go:185-186` |
| Distance | Nautical miles, persisted in `logbook.distance`; great-circle dep→arr on create, track length after track upload | `InsertFlightRecord` `internal/models/flightrecords.go:91`, `HandlerApiTrackLogNew` `app/handlers_flightrecord.go:137-140` |
| Track | JSON `[[lat, lon], …]` in BLOB `track`; Go `[]byte` ⇒ base64 string in API JSON; UI does `JSON.parse(atob(track))` | `app/handlers_flightrecord.go:130-148`, `internal/models/structs.go:68`, `app/ui/src/components/FlightMap/helpers.jsx:74` |
| Custom fields | Definitions in table `custom_fields`; values per record in `logbook.custom_fields` as a JSON object `{ "<field uuid>": value }` (string on the wire, object in the UI) | `internal/driver/db_structure.go:134-145`, `:50`; `prepareFlightDataForAPI` `app/ui/src/util/http/logbook.jsx:16-38` |
| Custom field types | `text`, `number`, `time`, `duration` (minutes), `enroute` (waypoint list used for distance) | `typeOptions` `app/ui/src/components/Settings/CustomFields/CustomFieldModal.jsx:22` |
| Custom field category | The logbook column group the field is rendered in; stored as the **display text** of the standard header (or `"Custom"`) | `CustomFieldModal.jsx:81-94`, filter `app/ui/src/components/Logbook/helpers.jsx:109` |
| Night time | Time with sun centre ≤ −6° (civil twilight) along the route | `NIGHT_SUN_ELEVATION` `internal/nighttime/nighttime.go:14` |
| Signature | PNG data URL drawn with `signature_pad`, stored in `logbook.signature`, printed in PDF export | `SignModal.jsx:113`, `UpdateFlightRecordSignature` `internal/models/flightrecords.go:274` |
| `"new"` uuid | UI sentinel for an unsaved record (`/logbook/new`) | `FlightRecord` `app/ui/src/components/FlightRecord/FlightRecord.jsx:22-33` |

## 3. How It Works

| Step | User action | What happens |
|---|---|---|
| 1 | Opens `/` or `/logbook` | `Logbook` loads all records via `useLogbookQuery` (key `['logbook']`) and renders `LogbookTable` (`app/ui/src/components/Logbook/Logbook.jsx:9-15`) |
| 2 | Clicks a date cell | Link to `/logbook/<uuid>` (`app/ui/src/components/Logbook/helpers.jsx:51`) → `FlightRecord` fetches `['flight', id]` |
| 3 | Clicks "Add New Flight Record" | Navigates to `/logbook/new` (`app/ui/src/components/Logbook/NewFlightRecordButton.jsx:13`); form starts from `FLIGHT_INITIAL_STATE` merged with `location.state` (`FlightRecord.jsx:26-33`) |
| 4 | Types dep/arr time and leaves the field | `PlaceField.handleTimeChange`: total time = arr − dep (+1 day if negative), every time field equal to the old total is updated, then `POST /api/logbook/night` sets `time.night_time` (`app/ui/src/components/FlightRecord/PlaceField.jsx:87-112`) |
| 5 | Leaves a place field | Distance recomputed client-side via `/api/distance/...` (incl. enroute waypoints) when no track, map redrawn (`PlaceField.jsx:72-85`) |
| 6 | Picks PIC = self label / aircraft model (new record only) | PIC time and model-configured time fields auto-filled from total (`FlightRecordDetails.jsx:53-79`) |
| 7 | Saves | `POST /api/logbook/new` or `PUT /api/logbook/{uuid}`; custom fields filtered to existing definitions; caches invalidated; new record navigates to its uuid (`SaveFlightRecordButton.jsx:24-60`) |
| 8 | Menu: New / Return / Copy | Navigate to `/logbook/new` with prefilled `state` (`app/ui/src/components/FlightRecord/NewFlightRecordButton.jsx:13-21`, `ReturnFlightRecordButton.jsx:20-35`, `CopyFlightRecordButton.jsx:17`) |
| 9 | Menu: Sign | `SignModal` loads/saves `/api/logbook/{uuid}/signature` |
| 10 | Menu: Delete | Confirm dialog → `DELETE /api/logbook/{uuid}` → back to `/logbook` (`DeleteFlightRecordButton.jsx:17-40`) |
| 11 | Table: "Edit Logbook" | Bulk-edit mode: cells become inputs, changed row ids collected; Save sends one `PUT` per changed row sequentially (`BulkEditButtons.jsx:30-63`) |
| 12 | Adds a KML track (attachments card) | `POST /api/logbook/track/{uuid}` stores track + track length; "Reset track" deletes it and restores great-circle distance |

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
| `internal/models/structs.go` | `FlightRecord` (`:25-79`), `CustomField` (`:343-354`), `JSONResponse` (`:17-22`) |
| `internal/nighttime/nighttime.go` | Route model, great-circle distance/midpoint, night-time and night-landing calculation |
| `internal/nighttime/nighttime_test.go` | 4 unit tests for night time |
| `app/ui/src/pages/LogbookPage.jsx`, `FlightRecordPage.jsx` | Thin page wrappers |
| `app/ui/src/components/Logbook/` | `Logbook.jsx` (data load), `LogbookTable.jsx` (columns, grouping, toolbar), `helpers.jsx` (column factories), `BulkEditButtons.jsx`, `NewFlightRecordButton.jsx`, `PDFExportButton.jsx`, `EditCells/*` (11 bulk-edit cell editors) |
| `app/ui/src/components/FlightRecord/` | `FlightRecord.jsx` (state owner), `FlightRecordDetails.jsx` (form), `PlaceField.jsx`, `LandingFields.jsx`, `PICNameField.jsx`, `CustomFields.jsx`, `FlightTitle.jsx` (prev/next), `FlightRecordMenuButtons.jsx` + action buttons, `SignModal.jsx`, `ShowHideFieldsButton.jsx`, `HelpButton.jsx` |
| `app/ui/src/components/Settings/CustomFields/` | Custom-field management UI, rendered on the Settings page (`app/ui/src/components/Settings/Settings.jsx:58`): `CustomFieldsTable.jsx`, `NewCustomFieldButton.jsx`, `EditCustomFieldButton.jsx`, `DeleteCustomFieldButton.jsx`, `CustomFieldModal.jsx` (type/category/stats/size form), `HelpButton.jsx`; all mutations invalidate `['custom-fields']` |
| `app/ui/src/util/http/logbook.jsx` | All logbook fetch functions + `prepareFlightDataForAPI` |
| `app/ui/src/util/http/fields.jsx` | Custom field fetch functions |
| `app/ui/src/hooks/queries/useLogbookQuery.js`, `useFlightQuery.js`, `useNightTime.js` | Query/mutation hooks |
| `app/ui/src/hooks/useCustomFields.jsx` | Custom field list query, `getEnroute`, `calculateDistance` |

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
| GET | `/api/custom-fields/list` | `HandlerApiCustomFieldsList` `app/handlers_custom_fields.go:12` | Ordered by `display_order` |
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
| `GetFlightRecordsForExport` `:168` | Export list incl. `signature` | `logbook_view` |
| `UpdateFlightRecordTrack` `:205` | Sets `distance` + `track` | `logbook` |
| `GetFlightRecordsForMap` `:218` | Map list incl. `track` | `logbook_view` |
| `GetFlightRecordSignature` `:258` / `UpdateFlightRecordSignature` `:274` | Signature read/write | `logbook_view` / `logbook` |

**`internal/models/custom_fields.go`**: `GetCustomFields` `:3`, `GetCustomField` `:30`, `InsertCustomField` `:48`, `UpdateCustomField` `:64`, `DeleteCustomField` `:79` — all on `custom_fields`.

**`internal/models/helpers.go`**: `Distance` `:29` (cached in package-level `sync.Map` `distanceCache` `:26`; returns 0 only when departure == arrival (`:30-31`) or on a DB error (`:45-49`); an unknown code resolves to a zero-value `Airport` (`internal/models/airports.go:33-34`), so the result is the distance from lat/lon 0,0 and is cached (`:51-52`), issue 21), `processFlightrecord` `:56`, `UpdateFlightRecordsDistance` `:65` (startup backfill of `distance IS NULL`, called from `app/main.go:206`), `CreateDistanceCache` `:106` (startup, `app/main.go:202`).

**`internal/nighttime/nighttime.go`**: `Route.NightTime` `:86` (same coordinates → `nightCircuits` minute-by-minute at arrival point `:108-121`; otherwise recursive `nightSegment` bisection until a segment ≤ 1 minute of flight, each segment counted as night if sun elevation at its end point ≤ −6° `:123-145`), `Route.IsNightLanding` `:101`, `FlightSpeed` `:82`, private `distance`/`midpoint` `:36-69`.

### 4.4 UI

| Piece | Key facts |
|---|---|
| `LogbookTable` `app/ui/src/components/Logbook/LogbookTable.jsx:31` | `XDataGrid` with `tableId='logbook'` (`:300`), EASA column groups (`:159-281`), custom-field columns inserted per category (`:70`, `:82`, …), only `date` and `record_number` sortable (`:156`), hidden by default: `record_number`, `has_track`, `has_attachment`, `tags` (`:317-322`), footer totals with optional previous-pages total and previous experience (`:312-314`) |
| ME column | Shows blank / 0 when `mcc_time ≠ 0` (`LogbookTable.jsx:97-102`) |
| Column factories `app/ui/src/components/Logbook/helpers.jsx` | `createDateColumn` `:37`, `createTimeColumn` `:70`, `createLandingColumn` `:88`, `createCustomFieldColumns` `:104` (field id `custom_fields.<uuid>`, `duration`/`number` get `sum` aggregation), `createHasTrackColumn` `:149`, `createHasAttachmentColumn` `:163`, `updateNested` `:20` |
| Bulk edit | State `isBulkEdit`/`updatedRows` (`LogbookTable.jsx:37-43`); cells in `EditCells/` write into the grid via `params.api.updateRows` and mark the row; Save/Cancel in `BulkEditButtons.jsx`; hidden on `< md` screens (`:80-82`) |
| Toolbar | New record, CSV export (`CSVExportButton` type `logbook`), PDF A4/A5 export (`PDFExportButton.jsx`), bulk edit (`LogbookTable.jsx:283-293`) |
| `FlightRecord` `FlightRecord.jsx:17` | Owns `flight` state; `handleChange(key, value)` with dotted keys (`:47-67`); builds an `options` object (`:69-73`) and passes it to `FlightMap` (`:86`), but `FlightMap` has ignored it since commit `2822577`: routes/tracks are drawn according to the localStorage map options (`app/ui/src/components/FlightMap/FlightMap.jsx:54-55`, issue 22); renders `FlightRecordDetails`, `Attachments`, `FlightRecordPersons`, `FlightMap` (`:80-86`) |
| `FlightRecordDetails` | Form layout; field visibility from localStorage key `flight-record-visibility-key` (`:34`); renders `CustomFields` (`:173`) |
| `FlightTitle` | Prev/next buttons from `prev_uuid`/`next_uuid` (`FlightTitle.jsx:17-30`) |
| `PICNameField` | Free-solo select; options = distinct PIC names from `useLogbookQuery`; double-click sets self label (`PICNameField.jsx:18-23`) |
| `CustomFields` | One input per definition; `duration` uses `TimeField`; `enroute` recomputes distance on blur with no track check (`CustomFields.jsx:39-43`, issue 23) |
| Custom-field management `app/ui/src/components/Settings/CustomFields/` | Rendered on the Settings page (`app/ui/src/components/Settings/Settings.jsx:58`). `CustomFieldsTable` is an `XDataGrid` with `tableId='custom-fields'` (`CustomFieldsTable.jsx:55-67`), Edit/Delete row actions and Help/New toolbar buttons. `NewCustomFieldButton` / `EditCustomFieldButton` open `CustomFieldModal` via `dialogs.open` (`NewCustomFieldButton.jsx:16`, `EditCustomFieldButton.jsx:15`): name, description, free-solo category from the header display names (`CustomFieldModal.jsx:81-94`), type locked after creation (`:79`), stats function per type (`:24-30`), sizes, order. `DeleteCustomFieldButton` confirms, then calls `DELETE` (`DeleteCustomFieldButton.jsx:26-39`). Every mutation invalidates `['custom-fields']` (`CustomFieldModal.jsx:44-49`, `DeleteCustomFieldButton.jsx:17-22`). `HelpButton` is static help text |

Query hooks and keys:

| Hook | Key | Fetcher → path |
|---|---|---|
| `useLogbookQuery` `app/ui/src/hooks/queries/useLogbookQuery.js:4-18` | `['logbook']` | `fetchLogbookData` → `GET /logbook/data` (`app/ui/src/util/http/logbook.jsx:40`) |
| `useFlightQuery` `useFlightQuery.js:4-18` | `['flight', id]` | `fetchFlightData` → `GET /logbook/{id}` (`logbook.jsx:70`) |
| `SignModal` inline query `SignModal.jsx:100-106` | `['flight', uuid, 'signature']` | `fetchFlightRecordSignature` (`logbook.jsx:166`) |
| `useNightTime` (mutation) `useNightTime.js:6-21` | — | `fetchNightTime` → `POST /logbook/night` (`logbook.jsx:90`) |
| `useCustomFields` `app/ui/src/hooks/useCustomFields.jsx:8-14` | `['custom-fields']` | `fetchCustomFields` → `GET /custom-fields/list` (`app/ui/src/util/http/fields.jsx:13`) |
| `SummaryFlightMap` (Map page) | `['logbook', 'map']` | `fetchLogbookMapData` (`logbook.jsx:55`) |

## 5. Data Model & Persistence

| Object | Columns / content | Notes |
|---|---|---|
| Table `logbook` `internal/driver/db_structure.go:23-53` | `uuid` PK (UUID: TEXT / VARCHAR(36)); `date` NOT NULL, `departure_time`, `arrival_time` (DateTime: TEXT / VARCHAR(32)); `departure_place`, `arrival_place`, `aircraft_model`, `reg_name`, `sim_type`, `pic_name` (SmallText: TEXT / VARCHAR(255)); 11 time columns + `day_landings`/`night_landings` (SmallInt NOT NULL DEFAULT 0: INTEGER / SMALLINT); `remarks`, `custom_fields`, `signature` (FullText: TEXT / TEXT); `distance` (Real: REAL / FLOAT); `track` (Blob: BLOB / LONGBLOB); `tags` (BigText: TEXT / VARCHAR(512), NOT NULL DEFAULT '') | Engine types (SQLite / MySQL) come from `ColumnType` (`db_structure.go:6-14`). MySQL time columns differ between installs: fresh installs get SMALLINT from the declarative schema, while DBs migrated from schema < 100 have INT (`migrateLogbookTimeColumns` `internal/driver/data_overhaul.go:407-426`, MySQL only `:461-465`, gated at `internal/driver/driver.go:49`); landings stay SMALLINT |
| Table `custom_fields` `db_structure.go:134-145` | `uuid` PK, `name`, `description`, `category` (DEFAULT 'Custom'), `type`, `stats_function`, `size_xs/md/lg`, `display_order` | |
| View `logbook_view` `db_structure.go:168-227` | All `logbook` columns + `rn`, `has_track`, `attachments_count` (LEFT JOIN `attachments`), `prev_uuid`, `next_uuid`; `IFNULL` for `distance`, `custom_fields` (→ `'{}'`), `tags`, `signature`, landings | Separate SQLite and MySQL SQL strings; SQLite also maps `''` landings to 0 (`:178-179`) |
| `logbook.custom_fields` JSON | `{ "<custom field uuid>": value }`; `duration` values are minutes (migrated by `migrateCustomFields` `data_overhaul.go:93-130`) | UI parses with `jsonCodec` and re-stringifies on save (`app/ui/src/util/http/logbook.jsx:5-38`) |
| `logbook.tags` | Comma-separated string | Split in UI (`FlightRecordDetails.jsx:156`) |
| In-memory | `distanceCache` (`internal/models/helpers.go:26`) — keyed by sorted airport pair, filled at startup and on demand | Lost on restart |
| Browser | localStorage: field visibility (`constants.jsx:111`), grid pagination/columns `logbook-pagination`, `logbook-columns` (`XDataGrid.jsx:111-112`), filters (`FilterContext.jsx:7-8`) | Per browser |

## 6. Data Flow

| Operation | Path |
|---|---|
| Load table | `Logbook` → `useLogbookQuery` → `fetchLogbookData` (parses `custom_fields`) → `GET /api/logbook/data` → `HandlerApiLogbookData` → `GetFlightRecords` → `logbook_view` |
| Open record | `FlightRecord` → `useFlightQuery(id)` → `fetchFlightData` → `GET /api/logbook/{id}` → `GetFlightRecordByID` → `logbook_view`; result copied into local state with a `redraw` token (`FlightRecord.jsx:36-38`) |
| Create | `SaveFlightRecordButton` → `createFlightRecord` → `prepareFlightDataForAPI` (stringify custom fields, `parseInt` landings) → `POST /api/logbook/new` → `HandlerApiFlightRecordNew` → `InsertFlightRecord` → `GenerateAircraftTable`; UI optionally copies persons (`SaveFlightRecordButton.jsx:32-33`) then navigates to the new uuid |
| Update | `SaveFlightRecordButton` / `BulkEditButtons` → `updateFlightRecord` → `PUT /api/logbook/{uuid}` → `UpdateFlightRecord` → `GenerateAircraftTable` |
| Cache invalidation after save | `['flight', uuid]` (bulk: `['flight']`), `['logbook']`, `['currency']`, `['aircrafts']`, `['models-categories']` (`SaveFlightRecordButton.jsx:41-47`, `BulkEditButtons.jsx:47-53`); no `['persons', …]` key (§11 #5) |
| Delete | `DeleteFlightRecordButton` → `DELETE /api/logbook/{uuid}` → `DeleteFlightRecord` → `DeleteAttachmentsForFlightRecord` (separate call, no transaction, error only logged, §11 #24) → `GenerateAircraftTable` (error ignored); UI invalidates only `['logbook']`, `['aircrafts']` (`DeleteFlightRecordButton.jsx:21-22`; missing keys: §11 #5, #28) |
| Night time | `PlaceField.handleTimeChange` → `useNightTime` → `POST /api/logbook/night` → `HandlerNightTime` → `app.calculateNightTime` (`app/helpers.go:67`: `GetAirportByID` ×2, parse date+time, +24 h if arrival < departure) → `nighttime.Route.NightTime()` → rounded minutes |
| Track upload | `AddTrackButton` / `ConvertAttachmentToTrackButton` → `uploadTrackLog` → `POST /api/logbook/track/{uuid}` → `UpdateFlightRecordTrack(uuid, sum(segments), json)` |
| Track reset | `ResetTrackButton` → `DELETE /api/logbook/track/{uuid}` → `GetFlightRecordByID` → `Distance(dep, arr)` → `UpdateFlightRecordTrack(uuid, d, nil)` |
| Signature | `SignModal` → `PUT /api/logbook/{uuid}/signature` (JSON string) → `UpdateFlightRecordSignature`; invalidates `['flight', uuid, 'signature']` |
| Custom field definitions | Settings `CustomFieldModal` → `createCustomField`/`updateCustomField` (`fields.jsx:33-53`, ints coerced `:5-11`) → `/api/custom-fields/...` → `custom_fields`; invalidates `['custom-fields']` |

## 7. Config & Constants

| Name | Value | Where | Kind |
|---|---|---|---|
| DB query timeout | 60 s | `DefaultTimeout` `internal/models/helpers.go:14` | (hardcoded) |
| Distance backfill / cache build timeout | 60 s / 120 s | `internal/models/helpers.go:66`, `:107` | (hardcoded) |
| Night threshold | sun elevation ≤ −6° | `NIGHT_SUN_ELEVATION` `internal/nighttime/nighttime.go:14` | (hardcoded) |
| Earth radius (night-time distance) | 6378100.0 m, result in NM (÷1.852) | `internal/nighttime/nighttime.go:65-68` | (hardcoded) |
| Night segment size | 1 minute of flight at average speed | `internal/nighttime/nighttime.go:94-95` | (hardcoded) |
| Night time date/time layout | `"2006-01-02 1504"` | `app/helpers.go:78`, `:88` | (hardcoded) |
| Overnight correction | arrival + 24 h if before departure | `app/helpers.go:94-96`; UI `PlaceField.jsx:25` | (hardcoded) |
| gzip level for list endpoints | 5 | `app/routes.go:34-35` | (hardcoded) |
| Query `staleTime` / `gcTime` | 3600000 ms | `useLogbookQuery.js:7-8`, `useFlightQuery.js:8-9`, `useCustomFields.jsx:12-13` | (hardcoded) |
| Grid page sizes | from setting `logbook_pagination`, fallback `[5, 10, 15, 20, 25, 30, 50, 100]` | `app/ui/src/hooks/useSettings.jsx:79`, `:92-99` | (configurable) |
| Grid default page size | 20 | `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:19-20` | (hardcoded) |
| Previous-pages total row | shown when `logbook_totals_view === 1` | `LogbookTable.jsx:313` | (configurable) |
| Footer initial values | `settings.previous_experience` | `LogbookTable.jsx:314` | (configurable) |
| Time display format | `time_fields_auto_format`, default 1 (HH:MM) | `useSettings.jsx:136` | (configurable) |
| Date display format | `date_fields_format`, default `DD/MM/YYYY` | `useSettings.jsx:137` | (configurable) |
| Self PIC label | `self_pic_label`, default `"Self"` | `FlightRecordDetails.jsx:55`, `PICNameField.jsx:22` | (configurable) |
| Place/time input | upper-case; time digits only, max 4 | `constants.jsx:67-72` | (hardcoded) |
| Flight-time input max length | 5 | `app/ui/src/components/UIElements/TimeField.jsx:13` | (hardcoded) |
| Earliest date | 1903-12-17 | `DatePicker.jsx:25` | (hardcoded) |
| New custom field defaults | category `Custom`, type `text`, stats `none`, sizes 3/3/3, order 0 | `constants.jsx:98-109` | (hardcoded) |
| Custom field stats per type | text/time: none,count; number/duration: none,sum,average,count; enroute: none | `CustomFieldModal.jsx:24-30` | (hardcoded) |
| Copy/return notification | 5000 ms | `CopyFlightRecordButton.jsx:19`, `ReturnFlightRecordButton.jsx:38` | (hardcoded) |
| Schema version | `"101"` | `internal/driver/db_structure.go:4` | (hardcoded) |

## 8. Error Handling & Edge Cases

| Case | Behaviour | Evidence |
|---|---|---|
| DB/JSON error in handler | `handleError` logs `file:line` and returns 500 `JSONResponse{ok:false, message}` | `app/helpers.go:53-63` |
| Night-time calc error (bad date/time format, DB error) | Logged; handler returns **no body** (status 200 by default) | `app/handlers_flightrecord.go:39-43`, `app/helpers.go:73-91` |
| Unknown departure/arrival airport (night time) | No error: coordinates default to lat/lon 0,0 and a wrong night time is computed; the form writes it into `time.night_time` (issue 21) | `app/helpers.go:73-91`, `internal/models/airports.go:33-34`, `PlaceField.jsx:107-111` |
| Missing place/time for night time | Returns 0 without error | `app/helpers.go:69-71` |
| Same dep/arr coordinates | Minute-by-minute check at the airport (circuits) | `internal/nighttime/nighttime.go:87-89` |
| Zero flight duration with different places | Speed = +Inf → night time 0 | `nighttime.go:82-84`, `:143` |
| Unknown airport in distance | Distance is computed from lat/lon 0,0 (bogus value, cached in `distanceCache`, persisted on create); 0 only for equal codes or a DB error (issue 21) | `internal/models/airports.go:33-34`, `internal/models/helpers.go:30-31`, `:45-53` |
| Empty logbook / no custom fields | Handlers emit `null`; UI normalizes to `[]` | `useLogbookQuery.js:10`, `useCustomFields.jsx:59-60` |
| Bulk save partial failure | Failed uuids stay highlighted and edit mode stays on, but the following `['logbook']` refetch passes new `rows` to the grid, so the unsaved edits of failed rows are likely lost (issue 27, Suspected) | `BulkEditButtons.jsx:44-60`, `LogbookTable.jsx:304`, `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:143-147`, `:248` |
| Bulk cancel | Rows restored from the query data | `BulkEditButtons.jsx:65-76` |
| Deleted custom field still in a record | Dropped from `custom_fields` on next single-record save | `SaveFlightRecordButton.jsx:53-60` |
| Custom field type change | Disabled for existing fields | `CustomFieldModal.jsx:79` |
| Update/delete of non-existent uuid | Succeeds silently (no rows-affected check) | `internal/models/flightrecords.go:74-83`, `:123-124` |
| Malformed track points | No length check on inner arrays (panic) | `app/handlers_flightrecord.go:138-140` |
| Request body size | No limit applied in these handlers | Not found in code |
| Server-side validation of date/time/place | None — the UI is the only validator | Not found in code |

## 9. Integration Points

| Other system | What crosses the boundary |
|---|---|
| `ARCHITECTURE_APPLICATION.md` | Route registration (`app/routes.go:33-51`, `:141-147`), `writeJSON`/`writeOkResponse`/`handleError` (`app/helpers.go`), startup distance tasks (`app/main.go:202-206`) |
| `ARCHITECTURE_AUTH.md` | `Auth` middleware on all endpoints here; UI fetchers send `Authorization: Bearer` from `getAuthToken()` |
| `ARCHITECTURE_DATABASE.md` | `logbook`, `custom_fields` tables, `logbook_view`, `validateDB`, v5 data overhaul (dates, minutes, duration custom fields) |
| `ARCHITECTURE_SETTINGS.md` | Header names (`fieldName`/`fieldNameF`), time/date formats, `self_pic_label`, `logbook_pagination`, `logbook_totals_view`, `previous_experience`; the custom-field management UI lives in `app/ui/src/components/Settings/CustomFields/` (rendered by `app/ui/src/components/Settings/Settings.jsx:58`, documented here in §4.4) |
| `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` | `GenerateAircraftTable` after every create/update/delete; `GetAirportByID` for night time (unknown codes → lat/lon 0,0, §11 #21 and that doc's §11 #1); `Distance` + `distanceCache`; `/api/distance`; model `time_fields_auto_fill` via `useModelsCategoriesQuery` (`FlightRecordDetails.jsx:51-79`) |
| `ARCHITECTURE_PERSONS.md` | `FlightRecordPersons` card on the record page; `copyPersonsFlightRecord` after a "Return" save; `person_to_log` not cleaned on delete; record save/delete never invalidate `['persons', …]` query keys (§11 #5) |
| `ARCHITECTURE_CURRENCY_LICENSING.md` | `Attachments` card; `DeleteAttachmentsForFlightRecord` on delete (non-transactional, §11 #24); KML → track via `uploadTrackLog`; Currency page consumes `useLogbookQuery`, saves invalidate `['currency']` |
| `ARCHITECTURE_STATS_AND_MAP.md` | Stats pages and Map consume `['logbook']` / `['logbook','map']`; `FlightMap` draws the record route/track according to the localStorage map options (`MAP_OPTIONS_NAME`, `app/ui/src/components/FlightMap/FlightMap.jsx:55`), not the `options` prop `FlightRecord` passes (§11 #22); custom-field stats in `app/ui/src/components/Stats/Dashboard/CustomFieldsTiles.jsx` and `app/ui/src/components/Stats/helpers.jsx` |
| `ARCHITECTURE_PDF_EXPORT.md` | `GetFlightRecordsForExport` (`app/handlers_export.go:96`), `CalculateTotals`, signature; `PDFExportButton`/`CSVExportButton` in the logbook toolbar |
| `ARCHITECTURE_IMPORT.md` | `InsertFlightRecord`, `calculateNightTime` with night-landing swap, `GetFlightRecords` for duplicate detection, `GetCustomFields` (`app/handlers_import.go:50`, `:150`, `:194-217`); `ImportTable` renders `LogbookTable` for the preview without its own `tableId` (`app/ui/src/components/Import/ImportTable.jsx:25-32`), so it shares the logbook grid's localStorage state and footer settings (§13 Gotchas) |
| `ARCHITECTURE_FRONTEND.md` | Query-hook pattern, `handleFetch`, `queryClient`, `XDataGrid`, `constants.jsx`, router (`main.jsx`) |

## 10. Testing

| Test | Covers | Run |
|---|---|---|
| `internal/nighttime/nighttime_test.go` | `TestKnownNightTime` `:11`, `TestKnownNightTime2` `:33`, `TestAllNightTime` `:55`, `TestAllDayTime` `:77` — night minutes and night landing | `make test` (`go test -v ./... -coverpkg=./...`, `Makefile:32-33`; needs `make build_ui` first) |
| `app/ui/src/hooks/useCustomFields.test.jsx` | `getEnroute` parsing (`:62-134`) | `npm test` in `app/ui` (vitest, `app/ui/package.json:11`) |

Gaps: no tests for any handler in scope, the SQL in `flightrecords.go`/`custom_fields.go` (either engine), `calculateNightTime`, `prepareFlightDataForAPI`, `PlaceField` total-time logic, `calculateDistance`, bulk edit, or `LogbookTable` columns.

## 11. Known Issues & Tech Debt

| # | Issue | Location | Status (Confirmed/Suspected) | Severity | verified: 2026-10-14 |
|---|---|---|---|---|---|
| 1 | "Return" puts a dayjs **object** into `date`; if the user does not touch the date, `JSON.stringify` calls `dayjs.toJSON()` and an ISO UTC timestamp (e.g. `2026-10-13T22:00:00.000Z`, previous day east of UTC) is stored in `logbook.date`. Regression from commit `8b2fa8d`, which dropped `.format(...)`. After a reload the state is a structured-clone plain object and the save fails to decode | `app/ui/src/components/FlightRecord/ReturnFlightRecordButton.jsx:21`; passed through by `app/ui/src/util/http/logbook.jsx:30-37`; no server validation `internal/models/flightrecords.go:87-116` | Confirmed — code path read end-to-end; `git show 8b2fa8d` shows the removed `.format` | MAJOR | ✓ |
| 2 | Night-time endpoint writes no response on error; the client's `response.json()` throws on the empty 200 body, and the rejection escapes `handleTimeChange` | `app/handlers_flightrecord.go:39-43`, `app/ui/src/util/http/http.jsx:30`, `PlaceField.jsx:108` | Confirmed — `return` without write | MINOR | ✓ |
| 3 | Distance is inconsistent: create overwrites the UI value with the direct great-circle distance (ignores `enroute`); update stores the client value; track reset recomputes the direct distance | `internal/models/flightrecords.go:91`, `:71`; `app/handlers_flightrecord.go:168`; UI `useCustomFields.jsx:36-56` | Confirmed — `InsertFlightRecord` overwrites with `m.Distance(dep, arr)` (no enroute); `UpdateFlightRecord` binds the body `distance` | MINOR | ✓ |
| 4 | `PUT /logbook/{uuid}` and `PUT /custom-fields/{uuid}` ignore the URL param and update by body `uuid`; no rows-affected check, so a wrong or empty uuid still returns OK | `app/handlers_flightrecord.go:106-123`, `app/handlers_custom_fields.go:54-68`, `internal/models/flightrecords.go:74-83` | Confirmed — `UPDATE … WHERE uuid = ?` bound to the body uuid; `ExecContext` result ignored (`internal/models/custom_fields.go:72-76` likewise) | MINOR | ✓ |
| 5 | Deleting a flight leaves `person_to_log` rows (only attachments are cleaned); orphan roles still appear in `GetPersonsRoles`. Single-record save, bulk save and delete also never invalidate `['persons', …]` keys, so the person view (`['persons','flights',uuid]`, staleTime 1 h) shows edited or deleted flights for up to 1 h, and a Return save's `copyPersonsFlightRecord` leaves `['persons','flights']` / `['persons','roles']` stale. See `ARCHITECTURE_PERSONS.md` §11 #2, #4 | `app/handlers_flightrecord.go:52-70`, `internal/models/persons.go:204`, `SaveFlightRecordButton.jsx:32-47`, `app/ui/src/components/Logbook/BulkEditButtons.jsx:47-53`, `DeleteFlightRecordButton.jsx:21-22`, `app/ui/src/components/Persons/PersonView.jsx:35-41` | Confirmed — no `person_to_log` delete in the handler; no persons key in any of the three invalidation lists | MINOR | ✓ |
| 6 | Deleting a custom field leaves its values in `logbook.custom_fields`; only the single-record save filters them, bulk save does not. The delete confirmation nevertheless says it "will remove all data associated with this field" | `internal/models/custom_fields.go:79-87`, `SaveFlightRecordButton.jsx:53-60`, `BulkEditButtons.jsx:32-37`, `app/ui/src/components/Settings/CustomFields/DeleteCustomFieldButton.jsx:27-28` | Confirmed — `DELETE FROM custom_fields` only; bulk save sends grid rows unfiltered | MINOR | ✓ |
| 7 | Custom field `category` stores the header **display text**. Renaming a standard group header (with `enable_custom_names` on), or toggling `enable_custom_names` when the stored headers differ from the defaults, makes fields saved under the old text match no group, so their columns vanish from the logbook table. Toggling alone with default headers is harmless: the backend defaults equal the UI defaults (`internal/models/models_defaults.go:39-52` vs `useSettings.jsx:7-41`) | `CustomFieldModal.jsx:81-94`, `app/ui/src/components/Logbook/helpers.jsx:109`, `useSettings.jsx:113-121` | Confirmed — strict `field.category === category` filter against the current header text | MINOR | ✓ |
| 8 | Track upload indexes `track[i][0..1]` without checking the inner length; a malformed body panics the handler (no `Recoverer` middleware; `net/http` drops the connection) | `app/handlers_flightrecord.go:138-140`, `app/routes.go:9-22` | Confirmed — no length check before indexing; `routes()` registers no `middleware.Recoverer` | MINOR | ✓ |
| 9 | Night-time rounding differs: UI endpoint rounds, import truncates | `app/handlers_flightrecord.go:46` vs `app/handlers_import.go:202` | Confirmed — `math.Round(night.Minutes())` vs `int(night.Minutes())` | MINOR | ✓ |
| 10 | `nightSegment` truncates midpoint offsets to whole minutes (`time.Duration(flightTime) * time.Minute`), so leaf timestamps drift near twilight boundaries | `internal/nighttime/nighttime.go:130-131` | Suspected — confirm by comparing results with a float-duration variant on routes crossing dusk/dawn | MINOR | ✓ |
| 11 | PDF export success toast is bound to `isPending`, so "PDF Exported successfully" shows when the export starts, even if it then fails. Same bug in `app/ui/src/components/PdfExport/ExportButton.jsx:29`, see `ARCHITECTURE_PDF_EXPORT.md` §11 #6 | `app/ui/src/components/Logbook/PDFExportButton.jsx:34` | Confirmed — `useSuccessNotification({ isSuccess: isExporting })` | MINOR | ✓ |
| 12 | Time format setting is ignored by the bulk-edit ME and SIM cells (no `fieldFormat` → default 1) and by the SIM time input on the form | `LogbookTable.jsx:97-102`, `:134-139`; `app/ui/src/components/Logbook/helpers.jsx:70`; `FlightRecordDetails.jsx:142-147`; `app/ui/src/components/UIElements/TimeField.jsx:12` | Confirmed — these calls pass no `fieldFormat`, so the default 1 applies | MINOR | ✓ |
| 13 | `FLIGHT_INITIAL_STATE.date` is evaluated once at module load, so a tab left open past midnight defaults new flights to the previous day | `app/ui/src/constants/constants.jsx:16` | Confirmed — `dayjs()` is called in a module-level constant | MINOR | ✓ |
| 14 | Records started via New (toolbar/menu) or Return have no `track` key, so `flight.track === null` is false and leaving a place field never sets the live distance (the server computes it on insert). Copy inherits `track` (`CopyFlightRecordButton.jsx:17`, `null` for trackless records), and the enroute blur sets distance unconditionally (`CustomFields.jsx:39-43`) | `constants.jsx:14-52`, `PlaceField.jsx:79`, `FlightRecord.jsx:26-33` | Confirmed — strict `=== null` compared against `undefined` | MINOR | ✓ |
| 15 | `logbook_view` windows order only by `(date, departure_time)`; ties (e.g. several sim sessions with empty times on one day) may give non-deterministic `rn` and prev/next. Same issue: `ARCHITECTURE_DATABASE.md` §11 #22 | `internal/driver/db_structure.go:175`, `:195-196` | Suspected — create two tied records and compare `rn`/`prev_uuid` across requests and engines | MINOR | ✓ |
| 16 | Single-record reads (`GetFlightRecordByID`, `GetFlightRecordSignature`) go through `logbook_view`, whose window functions and attachment aggregation cover the whole table; every save also runs `GenerateAircraftTable` (N times for a bulk save of N rows) | `internal/models/flightrecords.go:39`, `:262`; `app/handlers_flightrecord.go:67`, `:95`, `:121`; `BulkEditButtons.jsx:35-42` | Suspected (performance) — time with a large logbook | MINOR | ✓ |
| 17 | `logbook_view` does not `IFNULL` the nullable text columns that are scanned into Go `string`; one NULL (legacy DB, manual edit) fails the whole list. Same issue: `ARCHITECTURE_DATABASE.md` §11 #22 | `internal/driver/db_structure.go:176-181`, `internal/models/flightrecords.go:150-156` | Suspected — set one `pic_name` to NULL and call `GET /api/logbook/data` | MINOR | ✓ |
| 18 | `number` custom values are stored as strings from the form but as ints from bulk edit (mixed JSON types; consumers currently parse both). Bulk edit also `parseInt`s every keystroke, so decimal `number` values are truncated (a stored `1.5` becomes `1` on any edit) and a `.` cannot be typed | `CustomFields.jsx:68-80`, `app/ui/src/components/UIElements/TextField.jsx:8`, `app/ui/src/components/Logbook/EditCells/NumberCell.jsx:11-14`, `app/ui/src/components/Logbook/helpers.jsx:134-135` | Confirmed — `TextField` passes `event.target.value` (string); `NumberCell` stores `parseInt(value, 10)` | MINOR | ✓ |
| 19 | Custom-field write handlers return a bare JSON string instead of `JSONResponse` | `app/handlers_custom_fields.go:51`, `:67`, `:77` | Confirmed — `writeJSON(w, http.StatusOK, "…")` | MINOR | ✓ |
| 20 | Duplicate haversine implementation | `internal/nighttime/nighttime.go:59-69` vs `internal/utils/distance.go:14-24` | Confirmed — same formula and Earth radius in both files | MINOR | ✓ |
| 21 | Unknown airport codes (a strip missing from the airport DB, a mistyped code) are not errors: `GetAirportByID` returns a zero-value `Airport` on `sql.ErrNoRows`, so `Distance` returns, and caches, the distance from lat/lon 0,0, and `calculateNightTime` computes night time at 0,0. Both values are persisted: the create distance, the live distance the form saves on update, the form's `time.night_time` and import. See also `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` §11 #1, `ARCHITECTURE_DATABASE.md` §11 #6 | `internal/models/airports.go:33-34`, `internal/models/helpers.go:45-53`, `app/helpers.go:73-110`, `internal/models/flightrecords.go:91`, `PlaceField.jsx:79-80`, `:107-111`, `app/handlers_import.go:190-202` | Confirmed — `ErrNoRows` is mapped to a nil error; callers check only `err != nil` and nothing checks for zero coordinates | MAJOR | ✓ |
| 22 | `FlightRecord` builds a track/route `options` object and passes it to `FlightMap`, which has had no `options` prop since commit `2822577`. This is dead code: the record map follows the global localStorage map options | `FlightRecord.jsx:69-73`, `:86`; `app/ui/src/components/FlightMap/FlightMap.jsx:54-55` | Confirmed — `FlightMap` signature is `({ data, title, sx, airportsMap })`; `git show 2822577` removed `options = DEFAULT_OPTIONS` | MINOR | ✓ |
| 23 | Track-derived distance gets overwritten by the great-circle/enroute distance. The enroute blur sets `distance` with no track check, both in the form and in the bulk cell, and the bulk cell marks the row edited even when nothing changed. Bulk place edits pass grid rows from `GetFlightRecords`, which never selects `track`, so `track === null` is always true there. The next save persists the value via `UpdateFlightRecord` | `CustomFields.jsx:39-43`, `app/ui/src/components/Logbook/EditCells/EnrouteCell.jsx:21-25`, `app/ui/src/components/Logbook/EditCells/PlaceTimeCell.jsx:15-26`, `PlaceField.jsx:79`, `internal/models/flightrecords.go:132-141` | Confirmed — the list SELECT has no `track`, and a nil `[]byte` encodes as JSON `null` (`internal/models/structs.go:68`) | MINOR | ✓ |
| 24 | Flight delete and attachment cleanup are two separate, non-transactional calls. An attachment-delete error is only logged and the handler still answers OK, leaving orphan `attachments` rows | `app/handlers_flightrecord.go:55-69` | Confirmed — no transaction; `errorLog.Println` then `writeOkResponse` | MINOR | ✓ |
| 25 | `LogbookTable` destructures `isSettingsLoading` from `useSettings()`, which returns it as `isLoading`. The variable is always `undefined`, so the settings-loading guards on columns and grouping never apply: columns are first built with empty header names (`fieldName` returns `""` while loading), then rebuilt | `LogbookTable.jsx:33`, `:50`, `:160`; `useSettings.jsx:108-110`, `:132` | Confirmed — the hook's return object has no `isSettingsLoading` key | MINOR | ✓ |
| 26 | Copy carries the source `track` into the new-record state. The map shows the copied track until save (the insert does not store it), and the menu offers "Reset track" for uuid `new`. That calls `DELETE /api/logbook/track/new`, where `GetFlightRecordByID("new")` finds no row and the handler answers 500 | `CopyFlightRecordButton.jsx:17`, `FlightRecordMenuButtons.jsx:41`, `app/handlers_flightrecord.go:161-165`, `internal/models/flightrecords.go:27-52` (`GetFlightRecordByID`: `Scan` returns `sql.ErrNoRows`) | Confirmed — every other menu item is gated by `uuid !== "new"`, Reset track only by `flight.track` | MINOR | ✓ |
| 27 | After a bulk save with failures, `['logbook']` is invalidated and the refetched array reaches the grid as new `rows`, replacing rows edited via `apiRef.updateRows`. The failed rows stay marked, but their unsaved edits are probably gone, so a retry would resend server data | `BulkEditButtons.jsx:44-53`, `LogbookTable.jsx:304`, `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:143-147`, `:248` | Suspected — fail one PUT while another succeeds, then check the failed row's cells before retrying (an unchanged refetch may keep the same array through query structural sharing) | MINOR | ✓ |
| 28 | Flight delete invalidates only `['logbook']` and `['aircrafts']`. Still stale for up to 1 h (`staleTime` 1 h): `['flight', …]` (the deleted record stays cached, so browser Back reopens it, and cached neighbours keep `prev_uuid`/`next_uuid` pointing to it, `FlightTitle.jsx:17-30`); `['models-categories']` (per-model `total_time` summed from `logbook_view`, shown on the Aircrafts categories table); `['attachments']` (the server deletes the record's attachments, but the global Attachments page still lists them, see `ARCHITECTURE_CURRENCY_LICENSING.md` §11 #13); `['persons', …]` (§11 #5). Not affected: `['currency']` holds only the currency definitions; currency values are derived from `['logbook']` | `DeleteFlightRecordButton.jsx:21-22`, `app/ui/src/hooks/queries/useFlightQuery.js:8-10`, `app/ui/src/hooks/queries/useModelsCategoriesQuery.js:5-9`, `internal/models/aircrafts.go:87-98`, `app/ui/src/components/Aircrafts/CategoriesTable.jsx:53-60`, `app/handlers_flightrecord.go:61`, `app/ui/src/components/Attachments/Attachments.jsx:16-19`, `internal/models/currency.go:7-10`, `app/ui/src/components/Currency/Currency.jsx:13` | Confirmed — invalidation list read; the delete is only reachable from the record page, so `['flight', uuid]` is always cached at that point (`FlightRecord.jsx:22`) | MINOR | ✓ |

## 12. Rules for Future Development

### Recipe A — add a standard column to flight records (e.g. a new time field)

1. `internal/driver/db_structure.go`: add the column to `logbookTable` (`:23-53`) with a `ColumnType` that covers both engines. Add it to **both** SQL strings of `logbookView` (`:170-198` SQLite, `:199-225` MySQL), wrapping it in `IFNULL` if it is nullable. Bump `schemaVersion` (`:4`). `validateDB` only adds columns and recreates views (`internal/driver/driver.go:56-91`). A type change needs an explicit migration like `internal/driver/data_overhaul.go`.
2. `internal/models/structs.go`: add the field to `FlightRecord` with its JSON tag. If it counts toward totals, also add it to `CalculateTotals` (`internal/models/flightrecords.go:4`).
3. `internal/models/flightrecords.go`: update the SELECT + `Scan` lists in `GetFlightRecordByID`, `GetFlightRecords`, `GetFlightRecordsForMap`, `GetFlightRecordsForExport` (if exported), plus the INSERT column/placeholder lists and the UPDATE SET list. The column order must match exactly.
4. UI: `FLIGHT_INITIAL_STATE` (`app/ui/src/constants/constants.jsx:14-52`), the form (`FlightRecordDetails.jsx` `timeFields` `:36-49` + `ShowHideFieldsButton.jsx:38-55`), the table column + group (`LogbookTable.jsx`), and the header name keys (see `ARCHITECTURE_SETTINGS.md`: `ColumnsHeader` `internal/models/structs.go:165-198` and the UI default names).
5. Check the consumers: import mapping (`ARCHITECTURE_IMPORT.md`), PDF/CSV export (`ARCHITECTURE_PDF_EXPORT.md`), stats `TIME_FIELDS` (`app/ui/src/util/helpers.jsx:53-57`), currency metrics.

### Recipe B — add a logbook endpoint

1. Add the handler to `app/handlers_flightrecord.go` (record-level) or `app/handlers_logbook.go` (list-level). Use `handleError` / `writeOkResponse` / `writeJSON`, and take the target uuid from `chi.URLParam`. Follow every `app.handleError(w, err)` with `return`, because the helper does not stop the handler (`app/helpers.go:53-63`). Answer mutations with `writeOkResponse`. For writes that change aircraft model/registration (or add/remove records), call `_ = app.db.GenerateAircraftTable()` before responding, as create/update/delete do (`app/handlers_flightrecord.go:67`, `:95`, `:121`).
2. Register it inside `r.Route("/logbook", …)` in `app/routes.go:33-51`, which is under `r.Use(app.Auth)`. Add `middleware.Compress(5)` for large list responses.
3. Put the SQL in a `DBModel` method in `internal/models/flightrecords.go`, using `ContextWithDefaultTimeout`, `?` placeholders and SQL valid on both engines. Read from `logbook_view` when computed fields are needed, and write to `logbook`.
4. UI: add the fetcher to `app/ui/src/util/http/logbook.jsx` (Bearer header, `handleFetch`). Add a hook in `hooks/queries/` with a key under `['logbook']` or `['flight', id]` so the existing invalidations cover it.

### Recipe C — add a custom field type

1. `CustomFieldModal.jsx:22-30`: add the type and its stats functions. Update the help text in `app/ui/src/components/Settings/CustomFields/HelpButton.jsx:4-44`.
2. Form input: `getFieldProps` / render branch in `app/ui/src/components/FlightRecord/CustomFields.jsx:12-86`.
3. Table: aggregation and bulk-edit cell in `createCustomFieldColumns` (`app/ui/src/components/Logbook/helpers.jsx:104-147`). Add a new `EditCells/*` component if needed.
4. Stats: `updateCustomFieldTotals` (`app/ui/src/util/helpers.jsx:85-108`), the dashboard tiles' `calculateStats` (`app/ui/src/components/Stats/Dashboard/CustomFieldsTiles.jsx:14-52`, duration vs number parsing `:26`, `:38`) and `buildCustomFieldColumns` (`app/ui/src/components/Stats/helpers.jsx:22`, `isDuration` `:27`). See `ARCHITECTURE_STATS_AND_MAP.md`.
5. If stored values need conversion, write a migration (see `migrateCustomFields`, `internal/driver/data_overhaul.go:93`). The backend stores values as opaque JSON.
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
- [ ] `go vet ./...` + `make test` (after `make build_ui`) and `npm test` / lint in `app/ui`
- [ ] `CHANGELOG.md` `[Unreleased]` bullet (`- New:` / `- Update:` / `- Fix:`) and the same bullet in the README copy (`README.md:64-66`)

## 13. AI Notes

### Mental Model

The backend is a thin CRUD layer: handlers decode `FlightRecord` JSON and pass it straight to SQL, with no validation. The derived values (record number, prev/next, cross-country time, track flag, attachment count) come from `logbook_view` and `processFlightrecord`. Most of the logic lives in the UI: total-time calculation, propagating time to other fields, PIC/model auto-fill, client distance with enroute waypoints, and custom-field sanitising. The server adds only the UUID, the create-time distance, the track-length distance on upload and the direct distance on track reset, the night-time computation, and the aircraft-table refresh after every create/update/delete (`app/handlers_flightrecord.go:86`, `:137-140`, `:168`, `:67`, `:95`, `:121`). The `FlightRecord` page keeps one `flight` state object edited through dotted-key `handleChange`. The table's bulk edit mutates grid rows in place and saves them one by one.

### Gotchas

- Update reads the record id from the **body**, not the URL (`app/handlers_flightrecord.go:106-114`).
- `track` is base64 in JSON because it is a Go `[]byte`. Decode it with `atob` before `JSON.parse`.
- `custom_fields` is a **string** in the API and an **object** in the UI. Only `app/ui/src/util/http/logbook.jsx` converts between the two.
- Create recomputes distance on the server; update trusts the client.
- Leaving a time field overwrites `night_time` with the computed value, even if the pilot typed one (`PlaceField.jsx:107-111`). Night landings are never auto-set from the UI, because the endpoint drops `IsNightLanding` (`app/handlers_flightrecord.go:39`).
- Changing total time also rewrites every time field that equalled the old total (`PlaceField.jsx:100-104`).
- Custom-field columns are matched by header **display name** (issue 7).
- Never pass a dayjs object through `navigate(..., { state })` into `flight.date` (issue 1).
- An unknown airport code is not an error: distance and night time are computed from lat/lon 0,0 and saved (issue 21).
- Grid rows from `GET /api/logbook/data` carry `track: null` even for tracked flights, so bulk place/enroute edits overwrite a track distance (issue 23).
- `LogbookTable` is also the import preview (`app/ui/src/components/Import/ImportTable.jsx:25-32`) and uses `tableId='logbook'` (`LogbookTable.jsx:300`), so both share the `logbook-pagination`, `logbook-columns` and `logbook-filter-model` localStorage state and the footer settings (`:313-314`). Test the Import page after any `LogbookTable` change.
- The `distanceCache` key joins the two codes with no separator (`internal/models/helpers.go:34-39`), so a collision is possible in principle (Suspected, `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` §11 #23).

### File Quick Reference

| Need | File |
|---|---|
| Routes | `app/routes.go:33-51`, `:141-147` |
| Handlers | `app/handlers_flightrecord.go`, `app/handlers_logbook.go`, `app/handlers_custom_fields.go` |
| Night-time glue | `app/helpers.go:67-113` |
| SQL | `internal/models/flightrecords.go`, `internal/models/custom_fields.go` |
| Schema + view | `internal/driver/db_structure.go:23-53`, `:134-145`, `:168-227` |
| Struct | `internal/models/structs.go:25-79`, `:343-354` |
| Night maths | `internal/nighttime/nighttime.go` |
| Table | `app/ui/src/components/Logbook/LogbookTable.jsx`, `helpers.jsx`, `BulkEditButtons.jsx`, `EditCells/` |
| Form | `app/ui/src/components/FlightRecord/FlightRecord.jsx`, `FlightRecordDetails.jsx`, `PlaceField.jsx`, `SaveFlightRecordButton.jsx` |
| Custom-field admin | `app/ui/src/components/Settings/CustomFields/` |
| HTTP | `app/ui/src/util/http/logbook.jsx`, `app/ui/src/util/http/fields.jsx` |
| Hooks | `app/ui/src/hooks/queries/useLogbookQuery.js`, `useFlightQuery.js`, `useNightTime.js`, `app/ui/src/hooks/useCustomFields.jsx` |

> **AI Usage Instructions**
> - Always read this file before modifying this system
> - Do not refactor without impact analysis
> - Ask if information is missing
