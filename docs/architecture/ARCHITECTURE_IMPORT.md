# Import — Architecture

**Last Updated:** 2026-10-14 — initial version generated from code and fact-checked (TASK_AGENT_WORKFLOW_SETUP); 2026-10-14 — Gotcha: preview shares Logbook grid localStorage keys (consistency pass)

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

Import is how a pilot loads an existing logbook from a CSV file, for example a web-logbook CSV export, a Leon export, or any custom layout (`README.md:265-270`). The work is split in two. The **browser** parses the CSV with `papaparse` (`app/ui/src/components/Import/OpenCSVButton.jsx:18`), lets the pilot map CSV columns to logbook fields, normalises dates, times and routes, and shows the rows in a preview grid. The **server** runs one streaming endpoint, `POST /api/import/run` (`app/routes.go:127-129`). For each record it skips duplicates, can recalculate night time, inserts the record, and can create and link Persons. Progress comes back as NDJSON (`app/handlers_import.go:99`).

Backend: `app/handlers_import.go` (handler, duplicate key, name parser) and its test `app/handlers_import_test.go`. The handler has no model file of its own. It calls DBModel methods of other systems: flight records, persons, settings, custom fields, aircraft. UI: route `/import` (`app/ui/src/main.jsx:87-89`), nav entry (`app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:66`), page `app/ui/src/pages/ImportPage.jsx`, and components in `app/ui/src/components/Import/`.

## 2. Key Concepts

| Term | Meaning | Evidence |
|---|---|---|
| Field mapping ("profile") | Object `{ <field id>: <CSV header> }` plus optional `pic_self_replace` and `custom_fields.<uuid>` keys | `app/ui/src/components/Import/MapFieldsDialog.jsx:28-53`, `:132-149` |
| Predefined profiles | "Web Logbook" (`default` header names, the same as the logbook CSV export) and "Leon" (`leon` keys) | `MapFieldsDialog.jsx:89-98`, `app/ui/src/components/UIElements/CSVExportButton.jsx:71-96` |
| Custom profile | A mapping the pilot saved in browser `localStorage` under `custom-import-profile`. It is not stored on the server | `MapFieldsDialog.jsx:79`, `CHANGELOG.md:121` |
| Import row (UI) | A `FlightRecord`-shaped JSON object built by `marshallItem`. Its preview id is `uuid = String(generated_id)` | `app/ui/src/components/Import/helpers.jsx:70-121` |
| Time values | Integer **minutes**, the same as the logbook columns since v5. Converted in the browser by `autoTimeFieldRecog` (H:MM or decimal hours) | `app/ui/src/components/Import/helpers.jsx:35-68`, `internal/driver/db_structure.go:32-45`, `CHANGELOG.md:11` |
| Dates | ISO `YYYY-MM-DD`. `convertToDate` parses a fixed list of formats strictly; on failure it returns the input unchanged | `app/ui/src/components/Import/helpers.jsx:6-19` |
| Dep/Arr times | `HHMM` strings. `autoDepArrTimeRecog` turns `H:MM` into `HHMM`, otherwise strips non-digits and left-pads to 4 | `app/ui/src/components/Import/helpers.jsx:21-33` |
| Duplicate key | `FLIGHT\|date\|dep\|depTime\|arr\|arrTime\|model\|reg` for flights (both places **and** both times needed), `SIM\|date\|type\|time\|remarks` for simulator sessions (type and non-zero time needed). Otherwise `""` = never treated as a duplicate | `flightDuplicateKey` `app/handlers_import.go:14-47` |
| Import options | `backup`, `recalculate_night_time`, `create_persons`, `create_person_format`, `create_person_from{pic, <custom-field uuid>}` | `ImportOptions` `app/handlers_import.go:65-71`, `app/ui/src/components/Import/ImportOptionsDialog.jsx:24-30` |
| "I have a logbook backup" | A UI-only confirmation. "Run Import" stays disabled until it is on. The server decodes `Backup` but never reads it and makes **no** backup | `ImportOptionsDialog.jsx:104`, `RunImportButton.jsx:43`, `app/handlers_import.go:66` |
| Progress chunk | One JSON line `{type, current?, total?, message?, ok?}` with `type` ∈ `progress`, `log`, `result`. All fields except `type` are `omitempty` | `ImportProgress` `app/handlers_import.go:78-86` |
| Self | PIC names equal to the mapped "Name to Detect as Self" become `Self` in the browser. On the server, `Self` and the settings `self_pic_label` are never turned into Persons | `OpenCSVButton.jsx:28`, `:69`; `app/handlers_import.go:141-146`, `:236-238` |
| Name format | How a free-text name is split: `fn_mn_ln` (default), `ln_fn_md`, `fn_ln_md` | `parseName` `app/handlers_import.go:366-424` |

## 3. How It Works

| # | Step (user view) | Implementation |
|---|---|---|
| 1 | Open **Import**. An empty grid appears with the Help, Clear table, Open CSV and Run Import buttons | `ImportTable` `app/ui/src/components/Import/ImportTable.jsx:11-35` reuses `LogbookTable` |
| 2 | Click **Open CSV** and pick a `.csv` file | Hidden `<input type="file">` `OpenCSVButton.jsx:95-96` → `Papa.parse(file, {complete})` `:18` |
| 3 | Map columns in **Map Fields**. Pick each header by hand, or apply Leon / Web Logbook / a saved custom profile, optionally set "Name to Detect as Self", then click Continue | `MapFieldsDialog.jsx:77-155`. Continue is enabled as soon as the profile has any key (`:82`, `:102`), even if that key is only "Name to Detect as Self" (`:132-138`) or a select that was cleared to `null` (`app/ui/src/components/UIElements/Select.jsx:34`) |
| 4 | Rows are converted and shown in the preview grid | `OpenCSVButton.jsx:30-83`: drop rows without a date (`:38-40`), date (`:43`), times (`:44-45`), route split `XXXX-YYYY` (`:47-53`), time fields → minutes (`:56-66`), Self (`:69`), tag delimiters (`:72-74`), `marshallItem` → `setData` (`:79-83`) |
| 5 | Click **Run Import** and set the options. The backup switch must be on | `RunImportButton.jsx:41-46` → `ImportOptionsDialog.jsx:74-208` |
| 6 | A progress dialog streams a per-record log and a final result | `ImportProgressDialog.jsx:44-107` → `POST /api/import/run` |
| 7 | Server: for each record, skip it if it is a duplicate. Otherwise create a UUID, set the distance, optionally recalculate night time and night landings, insert it, and optionally create or link persons | `HandlerApiImportRun` `app/handlers_import.go:169-344` |
| 8 | Server: sync the aircraft table and send the `result` chunk | `app/handlers_import.go:347`, `:350-362` |
| 9 | Click **Ok**. Query caches are refreshed only if the result was `ok` | `ImportProgressDialog.jsx:204`, `RunImportButton.jsx:32-35` |

Per-record outcome:

| Outcome | Condition | Log line | Counter |
|---|---|---|---|
| Skipped | `key != "" && duplicates[key]` | `Skipped <DisplayName>` + `--- already exists` | `skippedRecords` (`app/handlers_import.go:178-182`) |
| Failed | `InsertFlightRecord` error | `Failed <DisplayName>` + `--- cannot create a new record - …` | `failedRecords` (`:217-221`) |
| Imported | Insert OK. The key is added to `duplicates`, so the same row later in the file is skipped too | `Imported <DisplayName>` + optional `---` detail lines | — (`:222-225`) |

## 4. Components & Files

### 4.1 File Index

| File | Responsibility |
|---|---|
| `app/handlers_import.go` | `flightDuplicateKey`, `GetFlightRecordDuplicates` (an `application` method, not a DBModel one), request/progress types, `HandlerApiImportRun`, `parseName` |
| `app/handlers_import_test.go` | `TestParseName`: table-driven test of the three name formats |
| `app/helpers.go` | Shared helpers used by import: `handleError` (`:53-63`), `calculateNightTime` (`:67-113`), `formatTimeField` (`:115-140`) |
| `app/routes.go` | Mounts `/api/import/run` inside the `Auth` group (`:26-27`, `:127-129`) |
| `app/ui/src/pages/ImportPage.jsx` | Page wrapper → `<Import />` |
| `app/ui/src/components/Import/Import.jsx` | Wrapper → `<ImportTable />` |
| `app/ui/src/components/Import/ImportTable.jsx` | Holds `data` state; renders `LogbookTable` with import toolbar actions |
| `app/ui/src/components/Import/OpenCSVButton.jsx` | File picker, CSV parse, mapping dialog, row normalisation |
| `app/ui/src/components/Import/MapFieldsDialog.jsx` | Field list, predefined profiles, custom-field mapping, custom profile in `localStorage` |
| `app/ui/src/components/Import/SaveCustomProfileButton.jsx` | Confirm, then save the current mapping as the custom profile |
| `app/ui/src/components/Import/LoadCustomProfileButton.jsx` | Load the custom profile; warn about headers missing from this CSV and drop them |
| `app/ui/src/components/Import/helpers.jsx` | `convertToDate`, `autoDepArrTimeRecog`, `autoTimeFieldRecog`, `marshallItem` |
| `app/ui/src/components/Import/RunImportButton.jsx` | Options dialog → serialise `custom_fields` → progress dialog → `invalidateQueries()` |
| `app/ui/src/components/Import/ImportOptionsDialog.jsx` | Backup confirmation, night-time recalculation, person creation options |
| `app/ui/src/components/Import/ImportProgressDialog.jsx` | Raw `fetch` with Bearer token, NDJSON stream reader, progress bar, log view |
| `app/ui/src/components/Import/ClearTableButton.jsx` | `setData([])` |
| `app/ui/src/components/Import/HelpButton.jsx` | Static help drawer content |

### 4.2 API Endpoints

| Method | Path | Handler | Notes |
|---|---|---|---|
| POST | `/api/import/run` | `HandlerApiImportRun` (`app/handlers_import.go:89`) | Behind `app.Auth` (`app/routes.go:27`). Body `ImportData{options, data[]}` (`app/handlers_import.go:73-76`). Response `200 application/x-ndjson`, flushed per chunk (`:98-116`). No `Compress` middleware, so the response is not buffered (`app/routes.go:128`). A decode error before the stream starts → 500 JSON via `handleError` (`app/handlers_import.go:92-96`) |

No other endpoint belongs to this system. The mapping dialog and options dialog read existing endpoints through `useCustomFields` and `useSettings` (§9).

### 4.3 Data Access

The handler calls DBModel methods owned by other systems. Grouped by owning file:

| File | Method | Purpose in import | Tables / views |
|---|---|---|---|
| `app/handlers_import.go` | `GetFlightRecordDuplicates` (`:49-63`) | Loads **all** records once and builds the `duplicates` set | via `GetFlightRecords` |
| `internal/models/flightrecords.go` | `GetFlightRecords` (`:128-165`) | Existing records for the duplicate set | `logbook_view` (`:140`) |
| `internal/models/flightrecords.go` | `InsertFlightRecord` (`:87-116`) | Insert one record. Recomputes `Distance` (`:91`) | `logbook` |
| `internal/models/settings.go` | `GetSettings` (`:11-28`) | `SelfPICLabel` | `settings2` (`:17`) |
| `internal/models/custom_fields.go` | `GetCustomFields` (`:3-28`) | Map custom-field UUID → name (used as the person role) | `custom_fields` |
| `internal/models/persons.go` | `GetPersons` (`:34-37`) | Fill the name caches | `persons` |
| `internal/models/persons.go` | `AddPerson` (`:69-92`) | Create a person. Rejects an exact (first, middle, last) duplicate (`:73-78`) | `persons` |
| `internal/models/persons.go` | `AddPersonToLog` (`:108-130`) | Link a person to the new record. Rejects an existing pair (`:112-117`) | `person_to_log` |
| `internal/models/helpers.go` | `Distance` (`:29-54`) | Great-circle distance, cached in `distanceCache`. Returns 0 only on a lookup error (`:47-49`), so an unknown code is measured to 0°N 0°E (§11 #4) | `airports_view` via `GetAirportByID` |
| `internal/models/airports.go` | `GetAirportByID` (`:16`) | Airport coordinates for night time and distance. A miss returns a zero `Airport` with `nil` error (`:33-35`) | `airports_view`, `airportCache` |
| `internal/models/aircrafts.go` | `GenerateAircraftTable` (`:7`) | Sync the aircraft list and aircraft-type category rows with the logbook after the loop. Error ignored (`app/handlers_import.go:347`) | `aircrafts`, `aircraft_categories`, `logbook_view` |

### 4.4 UI

| Item | Detail | Evidence |
|---|---|---|
| Route / nav | `/import` → `ImportPage`; sidebar "Import" | `app/ui/src/main.jsx:87-89`, `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:66` |
| Preview grid | `LogbookTable` with `title="Import"`, sorting and column menu off. `{...props}` is spread last, so the import `customActions` replace the logbook toolbar (new record, CSV/PDF export, bulk edit) | `ImportTable.jsx:25-32`, `app/ui/src/components/Logbook/LogbookTable.jsx:316`, `:332` |
| Grid state | `LogbookTable` hard-codes `tableId='logbook'`. The preview therefore shares the pagination, column and filter `localStorage` keys with the Logbook page | `app/ui/src/components/Logbook/LogbookTable.jsx:300`, `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:111-112`, `app/ui/src/components/UIElements/XDataGrid/FilterContext.jsx:7-8` |
| Dialogs | Opened through `useDialogs().open(Component, payload)`. The promise resolves with whatever the dialog passes to `onClose` | `app/ui/src/hooks/useDialogs/useDialogs.jsx:60-71`, `:99` |
| Query hooks used | `useCustomFields` (`['custom-fields']`) in the mapping and options dialogs; `useSettings` (`fieldNameF`) in the options dialog. Import has no query or mutation hook of its own | `MapFieldsDialog.jsx:80`, `ImportOptionsDialog.jsx:76-79`, `app/ui/src/hooks/useCustomFields.jsx:10` |
| HTTP | **Not** in `app/ui/src/util/http/`. `ImportProgressDialog` calls `fetch` directly with `getAuthToken()` | `ImportProgressDialog.jsx:54-62`, `app/ui/src/util/auth.jsx:13-16` |
| Cache refresh | `queryClient.invalidateQueries()` with no key (all queries), only when the dialog closes with success | `RunImportButton.jsx:32-35` |

## 5. Data Model & Persistence

| Store | What import writes / reads | Notes |
|---|---|---|
| `logbook` table | One INSERT per non-duplicate record: all standard columns + `distance`, `custom_fields` (JSON string), `tags` | `internal/models/flightrecords.go:93-114`. Time columns are `SmallInt NOT NULL DEFAULT 0` (`internal/driver/db_structure.go:32-45`) |
| `logbook_view` | Read once for duplicate detection | `internal/driver/db_structure.go:168-227` (separate SQLite/MySQL SQL, same columns) |
| `persons`, `person_to_log` | Created/linked when `create_persons` is on. Role = `PIC`, or the custom field **name** (fallback `Crew`) | `internal/driver/db_structure.go:147-166`, `app/handlers_import.go:309-333` |
| `aircrafts`, `aircraft_categories` | Synchronised with the logbook after the loop (insert missing, delete stale, update types, add category rows) | `internal/models/aircrafts.go:7-85` (single transaction, `:12`, `:83`) |
| `settings2`, `custom_fields` | Read only | `internal/models/settings.go:17`, `internal/models/custom_fields.go:7-11` |
| `custom_fields` JSON blob | The UI sends an object. `RunImportButton` stringifies it because the Go field is `string` | `RunImportButton.jsx:17-24`, `internal/models/structs.go:69` |
| In memory, per request | `duplicates` set, `personCache` (`lower(first\|middle\|last)` → uuid), `lastNameCache` (`lower(last)` → uuid), `customFieldsNames` | `app/handlers_import.go:134`, `:149-167` |
| In memory, process-wide | `distanceCache`, `airportCache` (`sync.Map`) | `internal/models/helpers.go:26`, `internal/models/airports.go:13` |
| Browser | Preview rows are React state only and are lost on navigation. The custom profile is in `localStorage['custom-import-profile']` | `ImportTable.jsx:12`, `MapFieldsDialog.jsx:79` |

Schema: import adds no tables. Both engines go through the same model methods, so import has no engine-specific code.

## 6. Data Flow

**Load CSV (browser only)**

`OpenCSVButton.handleFileChange` (`OpenCSVButton.jsx:15`) → `Papa.parse` with default options, so there is no header row handling and row 0 is used as headers (`:18`, `:24`) → `dialogs.open(MapFieldsDialog, headers)` (`:25`) → for each data row: copy mapped columns by header index (`:34-36`) → normalise (`:43-74`) → `marshallItem` (`app/ui/src/components/Import/helpers.jsx:70-121`) → `setData` (`:83`) → `LogbookTable` renders the rows.

**Run import**

`RunImportButton.handleImportClick` (`RunImportButton.jsx:41`) → `ImportOptionsDialog` resolves `options` (`ImportOptionsDialog.jsx:104`) → payload `{options, data}` with `custom_fields` stringified (`RunImportButton.jsx:18-29`) → `ImportProgressDialog.startImport` (`ImportProgressDialog.jsx:44`) → `POST ${API_URL}/import/run` (`:54`) → `Auth` middleware (`app/handlers_auth.go:112`) → `HandlerApiImportRun` (`app/handlers_import.go:89`):

1. Decode JSON (`:92`), set NDJSON headers, `WriteHeader(200)` and flush (`:99-107`).
2. Preload: `GetFlightRecordDuplicates` (`:134`), `GetSettings` → self label (`:141-146`), `GetCustomFields` → names (`:149-154`), `GetPersons` → caches (`:157-167`).
3. For each record (`:169`):
   - check the duplicate key (`:178`);
   - new UUID (`:184-189`);
   - `Distance` (`:190`);
   - if `RecalculateNightTime`: `calculateNightTime` (`app/helpers.go:67`). If the result is non-zero, overwrite `Time.Night` (`app/handlers_import.go:199-205`). If the landing is at night and only day landings are set, move them to night (`:207-212`);
   - `InsertFlightRecord` (`:217`);
   - if `CreatePersons`: `processPerson` for PIC (`:309-311`) and for each enabled custom field whose value is a non-empty string (`:314-333`) → `parseName` → cache, last-name fallback for PIC, `AddPerson`, `AddPersonToLog` (`:229-306`);
   - stream `progress`, the status `log` and the detail `log` lines (`:339-343`).
4. `GenerateAircraftTable` (`:347`) → `result` chunk (`:353-362`).

The browser reads the stream with `response.body.getReader()` and splits on `\n`, keeping the trailing partial line (`ImportProgressDialog.jsx:68-100`). It dispatches each line in `handleProgressChunk` (`:109-136`). `result` sets the status to `success` only when `ok` is true (`:129`). Closing with success → `queryClient.invalidateQueries()` (`RunImportButton.jsx:33-35`).

## 7. Config & Constants

| Name | Value | Evidence | Kind |
|---|---|---|---|
| Endpoint | `POST /api/import/run` | `app/routes.go:127-128`, `ImportProgressDialog.jsx:54` | (hardcoded) |
| API base | `/api`; in Vite dev mode `http://localhost:4000/api` | `app/ui/src/constants/constants.jsx:9-12` | (build mode) |
| Response content type | `application/x-ndjson`, `Cache-Control: no-cache`, `Connection: keep-alive` | `app/handlers_import.go:99-101` | (hardcoded) |
| Chunk types | `progress`, `log`, `result` | `app/handlers_import.go:119`, `:123`, `:127` | (hardcoded) |
| DB statement timeout | 60 s per statement (`DefaultTimeout`) | `internal/models/helpers.go:14` | (hardcoded) |
| HTTP server timeouts | None set (no Read/Write timeout), so long imports are not cut off | `app/main.go:52-59` | (hardcoded) |
| Request size limit | Not found in code | — | — |
| Default self label | `"Self"`, replaced by settings `self_pic_label` when non-empty | `app/handlers_import.go:141-145`, `internal/models/structs.go:239` | (configurable, Settings) |
| PIC role name | `"PIC"` | `app/handlers_import.go:310` | (hardcoded) |
| Custom-field role fallback | `"Crew"` | `app/handlers_import.go:321-324` | (hardcoded) |
| Name formats | `fn_mn_ln` (default/empty), `ln_fn_md`, `fn_ln_md` | `app/handlers_import.go:373-421`, `ImportOptionsDialog.jsx:32-72`, `:181` | (configurable per run) |
| Default options | all `false`, format `""`, `create_person_from {}` | `ImportOptionsDialog.jsx:24-30` | (hardcoded) |
| Log time format | `formatTimeField` using `app.timeFieldsAutoFormat` (0–3) | `app/helpers.go:115-140`, `app/main.go:199`, `app/handlers_settings.go:48` | (configurable, Settings) |
| Night time units | Duration → `int(night.Minutes())` (truncated) | `app/handlers_import.go:202` | (hardcoded) |
| Accepted date formats | `YYYY-MM-DD`, `YYYY/MM/DD`, `DD/MM/YYYY`, `DD-MM-YYYY`, `DD/MM/YY`, `DD-MM-YY` (strict) | `app/ui/src/components/Import/helpers.jsx:9-16` | (hardcoded) |
| Time field formats | `H:MM` (minutes < 60) or non-negative decimal hours × 60, rounded; anything else → 0 | `app/ui/src/components/Import/helpers.jsx:35-68` | (hardcoded) |
| Route split | Departure value containing `-` → upper-cased and split into dep/arr | `OpenCSVButton.jsx:47-53` | (hardcoded) |
| Tag delimiters | `;` and `\|` → `,` | `OpenCSVButton.jsx:72-74` | (hardcoded) |
| Accepted file types | `.csv, text/csv, application/csv, text/comma-separated-values` | `OpenCSVButton.jsx:96` | (hardcoded) |
| Mappable fields | 24 standard fields with `default` and optional `leon` header names | `MapFieldsDialog.jsx:28-53` | (hardcoded) |
| Custom profile key | `localStorage['custom-import-profile']` | `MapFieldsDialog.jsx:79` | (per browser) |
| Logbook query freshness | `['logbook']` `staleTime` 3 600 000 ms, `refetchOnWindowFocus: false` | `app/ui/src/hooks/queries/useLogbookQuery.js:5-9` | (hardcoded) |

## 8. Error Handling & Edge Cases

| Case | Behaviour | Evidence |
|---|---|---|
| Malformed JSON body | 500 `JSONResponse` before streaming. The UI shows `Failed to import: <statusText>`; the server `message` is not read | `app/handlers_import.go:92-96`, `ImportProgressDialog.jsx:64-66` |
| 401 (expired token) | Shown as an import error. There is no redirect to `/signin`, because `handle401` is not used | `ImportProgressDialog.jsx:64-66`, `app/ui/src/util/http/http.jsx:6-11` |
| Duplicate-set load fails | `handleError` runs **after** the 200 header was flushed. Its JSON body arrives as a line with no `type`, and the dialog stays "running" (§11 #6) | `app/handlers_import.go:103-107`, `:134-137`, `ImportProgressDialog.jsx:133-134` |
| Settings/custom fields/persons preload fails | Silently ignored. Defaults apply (label `Self`, role `Crew`, empty caches). If `GetPersons` fails, every existing name misses the cache and hits `AddPerson`'s duplicate check, so the row logs `--- cannot create person …` and the person is **not** linked | `app/handlers_import.go:142`, `:150`, `:159`, `:272-276`; `internal/models/persons.go:73-78` |
| UUID generation error | Logged; the zero UUID is used | `app/handlers_import.go:184-189` |
| Night time cannot be calculated | Logged per row (`--- cannot calculate night time`); CSV value kept | `app/handlers_import.go:194-197`, `app/helpers.go:73-91` |
| Missing place or time | `calculateNightTime` returns 0 with no error, so night time is unchanged | `app/helpers.go:69-71` |
| Computed night = 0 | CSV night time is **kept**, not zeroed | `app/handlers_import.go:199` |
| Flight past midnight | Arrival +24 h | `app/helpers.go:94-96` |
| Insert fails | Row counted as failed; the import continues (no transaction) | `app/handlers_import.go:217-221` |
| Person already linked to this flight (e.g. same name as PIC and in a custom field) | `AddPersonToLog` error → `--- cannot link person …` | `internal/models/persons.go:112-117`, `app/handlers_import.go:300-302` |
| Custom-field JSON invalid | `--- cannot parse custom fields JSON` | `app/handlers_import.go:330-332` |
| Custom-field value not a string | Not used for persons | `app/handlers_import.go:320` |
| Same record twice in one CSV | The second copy is skipped (key added after insert) | `app/handlers_import.go:223-225` |
| Flight with both places but a missing departure/arrival time | Key `""` (early return), even if SIM fields are set → never deduplicated | `app/handlers_import.go:15-21` |
| Record with fewer than two places | SIM key when `sim.type` is set and `sim.time` ≠ 0, otherwise `""`. A `""` key is never deduplicated. `DisplayName` says "Simulator record" when either place is empty | `app/handlers_import.go:35-46`, `:179`, `internal/models/structs.go:81-88` |
| Unknown airport code | No error and no log line. The unknown end is placed at 0°N 0°E: the wrong `distance` is stored on every insert, and with night-time recalculation on, night time is computed against those coordinates too (§11 #4) | `internal/models/airports.go:33-35`, `internal/models/helpers.go:45-52`, `internal/models/flightrecords.go:91`, `app/helpers.go:73-86` |
| Client aborts (page reload) | The browser ignores `AbortError`. The server does not watch `r.Context()` and finishes the whole import; write errors are discarded | `ImportProgressDialog.jsx:102`, `app/handlers_import.go:109-116` |
| Dialog close while running | Blocked: backdrop guard and disabled Ok button | `ImportProgressDialog.jsx:141`, `:205` |
| CSV parse error | One generic alert; nothing loaded | `OpenCSVButton.jsx:20-21` |
| Re-selecting the same CSV | Suspected: `handleFileChange` never resets the hidden input's value, so the browser may not fire `change` for the same file again (e.g. after Clear table, or after the Map Fields X-close wiped the preview, §11 #7). Confirm by Clear table → Open CSV → same file | `OpenCSVButton.jsx:15-90`, `:95-96` |
| Row without a date | Dropped silently | `OpenCSVButton.jsx:38-40` |
| Unparseable date / time | Date passed through verbatim; time field → 0 | `app/ui/src/components/Import/helpers.jsx:18`, `app/ui/src/components/Import/helpers.jsx:46-48`, `:63-65` |
| Custom profile with headers missing in this CSV | Alert listing them; the rest is loaded | `LoadCustomProfileButton.jsx:18-36` |

## 9. Integration Points

| Doc | What crosses the boundary |
|---|---|
| `ARCHITECTURE_APPLICATION.md` | Route registration under `Auth` (`app/routes.go:26-27`, `:127-129`); `handleError`, `calculateNightTime`, `formatTimeField` (`app/helpers.go:53`, `:67`, `:115`) |
| `ARCHITECTURE_AUTH.md` | `Auth` middleware (`app/handlers_auth.go:112`); token from `getAuthToken()` injected by hand (`ImportProgressDialog.jsx:58`) |
| `ARCHITECTURE_LOGBOOK.md` | `FlightRecord` JSON contract (`internal/models/structs.go:25-79`), `InsertFlightRecord`, `GetFlightRecords`, night-time engine (`internal/nighttime/nighttime.go:86`, `:101`), preview grid `LogbookTable`, custom-field JSON blob |
| `ARCHITECTURE_PERSONS.md` | `create_persons` path `app/handlers_import.go:227-334`: `GetPersons` preload (`:157-167`), `AddPerson` (`:272`), `AddPersonToLog` (`:300`); roles written as free text. The import cache matches names case-insensitively (`:161`, `:244`), while `AddPerson` rejects only an exact `first/middle/last` match (`internal/models/persons.go:73-78`): case-sensitive on SQLite, server collation on MySQL, which the code does not set (see ARCHITECTURE_PERSONS.md §11 #9). The cache holds every person, so a case variant in the CSV links the existing person |
| `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` | `Distance` (`app/handlers_import.go:190`), `GetAirportByID` via night time, `GenerateAircraftTable` (`:347`) |
| `ARCHITECTURE_SETTINGS.md` | `self_pic_label` (`app/handlers_import.go:141-146`), `time_fields_auto_format` for log lines, `fieldNameF("pic_name")` label (`ImportOptionsDialog.jsx:79`) |
| `ARCHITECTURE_PDF_EXPORT.md` | The logbook CSV export headers (`app/ui/src/components/UIElements/CSVExportButton.jsx:71-96`) are the "Web Logbook" mapping defaults (`MapFieldsDialog.jsx:28-53`), so export → import round-trips. Custom fields are not exported |
| `ARCHITECTURE_DATABASE.md` | Tables `logbook`, `persons`, `person_to_log`, `aircrafts`; `DefaultTimeout`; no import-specific schema |
| `ARCHITECTURE_FRONTEND.md` | `useDialogs`, `queryClient` (`app/ui/src/util/http/http.jsx:4`), `XDataGrid` persistence, `API_URL` |

## 10. Testing

| Area | Tests | How to run |
|---|---|---|
| `parseName` | `TestParseName` (`app/handlers_import_test.go:7`): 14 table cases, 4 per format plus empty and whitespace-only (`:16-134`) | `make build_ui` first (`app/ui/dist` must exist for the `app` package to compile), then `make test` (`Makefile:32-33`, `go test -v ./... -coverpkg=./...`) or `go test ./app -run TestParseName` |
| `flightDuplicateKey`, `HandlerApiImportRun` | **None** | — |
| UI helpers (`convertToDate`, `autoDepArrTimeRecog`, `autoTimeFieldRecog`, `marshallItem`) | **None**. The vitest pattern exists elsewhere, e.g. `app/ui/src/components/Currency/helpers.test.jsx` | `npm run test:run` in `app/ui` (`app/ui/package.json:12`) |
| Stream protocol / progress dialog | **None** | — |

Gaps worth filling first: `flightDuplicateKey` (pure function), `autoTimeFieldRecog`/`convertToDate` (pure), and a handler test with an in-memory SQLite DB that checks the chunk sequence ends with `result`.

## 11. Known Issues & Tech Debt

| # | Issue | Location | Status (Confirmed/Suspected) | Severity | verified: 2026-10-14 |
|---|---|---|---|---|---|
| 1 | The PIC last-name fallback links **any** existing person with the same last name. The comment and commit `f29ec55` ("PIC field has last name only") say it should apply only when the name has a last name alone. The code never checks that first/middle are empty, so "John Smith" is linked to an existing "Jane Smith". `lastNameCache` also keeps only the last person seen per last name. The log line shows the CSV name, which hides the wrong link | `app/handlers_import.go:247-254`, `:164`, `:281`, `:304` | Confirmed: condition is `role == "PIC" && lastName != ""` only | MAJOR | 2026-10-14 |
| 2 | Partial-success imports do not refresh the UI. Any skipped or failed record → `ok:false` → status `error` → `onClose(false)` → no `invalidateQueries()`. The `['logbook']` query has a 1 h `staleTime` with no refetch on focus, so the Logbook page hides the newly imported records. Re-importing an overlapping CSV always produces skips | `app/handlers_import.go:353-356`, `ImportProgressDialog.jsx:129`, `:204`, `RunImportButton.jsx:33-35`, `app/ui/src/hooks/queries/useLogbookQuery.js:7-9` | Confirmed: code path read end to end | MAJOR | 2026-10-14 |
| 3 | `duration` custom fields are imported as raw CSV strings (e.g. `"1:30"`). The app stores them as integer minutes, and readers use `parseInt` or the minutes formatter. Only the standard time fields go through `autoTimeFieldRecog` | `OpenCSVButton.jsx:56-66`, `app/ui/src/components/Import/helpers.jsx:71-77`; consumers `app/ui/src/util/helpers.jsx:94-95`, `app/ui/src/components/Logbook/helpers.jsx:121-125`, `app/ui/src/components/FlightRecord/CustomFields.jsx:53-64` | Confirmed | MAJOR | 2026-10-14 |
| 4 | Night-time recalculation with an **unknown airport** uses 0°N 0°E. `GetAirportByID` returns a zero `Airport` with a `nil` error, so `calculateNightTime` computes against those coordinates without logging anything. The result can overwrite the CSV night time and move day landings to night. The same zero `Airport` also reaches `Distance`, which returns 0 only on `err != nil`: every imported record with an unknown code gets a `distance` measured to 0°N 0°E, which `InsertFlightRecord` stores and `distanceCache` keeps, even when night-time recalculation is off. A record with one blank place looks up `GetAirportByID("")` instead (see ARCHITECTURE_AIRCRAFT_AIRPORTS.md §11 #1, #18) | `internal/models/airports.go:33-35`, `app/helpers.go:73-86`, `app/handlers_import.go:190`, `:199-212`, `internal/models/helpers.go:45-52`, `internal/models/flightrecords.go:91` | Confirmed (code path); the size of the error depends on the route | MAJOR | 2026-10-14 |
| 5 | Loading a CSV without a mapped (or with a cleared) **Departure Place** throws `TypeError` on `newRow.departure_place.includes` inside the async Papa callback. Nothing is loaded and no message is shown. A simulator-only CSV cannot be loaded unless some column is mapped to departure | `OpenCSVButton.jsx:48`; Continue enabled with any mapping `MapFieldsDialog.jsx:102`; cleared Select yields `null` `app/ui/src/components/UIElements/Select.jsx:34` | Confirmed | MINOR | 2026-10-14 |
| 6 | The stream can end without a `result` chunk. If `GetFlightRecordDuplicates` fails, `handleError` writes after the 200 was flushed (superfluous `WriteHeader`). The UI gets a line with no `type` and stays in `running`, with Ok disabled and the backdrop guarded, until the page is reloaded | `app/handlers_import.go:103-107`, `:134-137`, `ImportProgressDialog.jsx:133-134`, `:141`, `:205` | Confirmed | MINOR | 2026-10-14 |
| 7 | "Close" (X) in Map Fields resolves the dialog with the click **event**, which is truthy. Every row then lacks `date`, and `setData([])` wipes rows already in the preview. Escape/backdrop pass `null` and are fine | `MapFieldsDialog.jsx:108`, `app/ui/src/hooks/useDialogs/useDialogs.jsx:99`, `OpenCSVButton.jsx:27`, `:38-40`, `:83` | Confirmed | MINOR | 2026-10-14 |
| 8 | The preview shares grid state with the Logbook page (`tableId='logbook'`). A filter saved there hides preview rows, but Run Import still sends **all** rows in `data` | `app/ui/src/components/Logbook/LogbookTable.jsx:300`, `ImportTable.jsx:19`, `:25-32`, `app/ui/src/components/UIElements/XDataGrid/FilterContext.jsx:7-8` | Confirmed | MINOR | 2026-10-14 |
| 9 | There is no server-side validation of record content. A date that `convertToDate` cannot parse is inserted verbatim, which breaks ordering in `logbook_view` (`ORDER BY date`) | `app/ui/src/components/Import/helpers.jsx:18`, `internal/models/flightrecords.go:87-116`, `internal/driver/db_structure.go:175` | Confirmed | MINOR | 2026-10-14 |
| 10 | The import is not atomic and cannot be cancelled. Each record is a separate autocommit insert with no transaction. `r.Context()` is not checked, so an aborted client does not stop the run. The only safety net is the UI-only "I have a logbook backup" switch; `ImportOptions.Backup` is never read | `app/handlers_import.go:66`, `:169-344`, `:217` | Confirmed | MINOR | 2026-10-14 |
| 11 | Night time is truncated (`int(night.Minutes())`) on import but rounded in `HandlerNightTime` | `app/handlers_import.go:202`, `app/handlers_flightrecord.go:46` | Confirmed | MINOR | 2026-10-14 |
| 12 | A debug `fmt.Printf` left in the night-landing branch writes to stdout for every converted record | `app/handlers_import.go:208` | Confirmed | MINOR | 2026-10-14 |
| 13 | Error details are lost in the UI. Non-2xx responses show only `statusText` (empty on HTTP/2), and the server `message` is ignored | `ImportProgressDialog.jsx:64-66`, `app/helpers.go:53-63` | Confirmed | MINOR | 2026-10-14 |
| 14 | The help text says flight time fields "must use the HH:MM format", but decimal hours are also accepted. US `MM/DD/YYYY` dates are not recognised: `03/04/2026` parses as 3 April | `HelpButton.jsx:39-42`, `app/ui/src/components/Import/helpers.jsx:9-16`, `:60-67` | Confirmed | MINOR | 2026-10-14 |
| 15 | Stale comment references `IsFlightRecordExists`, which no longer exists in the repo (removed by `f29ec55`, #535) | `app/handlers_import.go:17` | Confirmed (`grep` finds only this comment) | MINOR | 2026-10-14 |
| 16 | Distance is computed twice per record: once in the handler, then again in `InsertFlightRecord`, which overwrites it. It is cached, so this is only redundant code | `app/handlers_import.go:190`, `internal/models/flightrecords.go:91` | Confirmed | MINOR | 2026-10-14 |
| 17 | In dev mode, `StrictMode` runs the start effect twice. The first `fetch` is aborted by the cleanup, but if it was already sent, the server (which ignores cancellation) runs a second import in parallel. The two runs share a stale duplicate snapshot, so the same records could be inserted twice | `app/ui/src/main.jsx:100`, `ImportProgressDialog.jsx:26-36`, `app/handlers_import.go:134` | Suspected: confirm with `npm run dev` by counting `POST /api/import/run` per import in the dev server log | MINOR | 2026-10-14 |
| 18 | Large imports may be slow on SQLite. Each record is an autocommit insert, plus per-person SELECT+INSERT, plus a full `logbook_view` scan at the start | `internal/models/flightrecords.go:107`, `internal/models/persons.go:74-85`, `:113-122` | Suspected: time a 5 000-row import on SQLite vs. a batched transaction | MINOR | 2026-10-14 |

## 12. Rules for Future Development

### 12.1 Add a standard logbook field to the import (e.g. a new time column)

1. Schema first (details in `ARCHITECTURE_DATABASE.md` / `ARCHITECTURE_LOGBOOK.md`). Add the column to `logbookTable` with a `ColumnType` that has both SQLite and MySQL types (`internal/driver/db_structure.go:23-53`), add it to both `logbook_view` variants (`:168-227`) and bump `schemaVersion` (`:4`). Add it to the `FlightRecord` struct (`internal/models/structs.go:25-79`), `InsertFlightRecord` (`internal/models/flightrecords.go:93-114`) and the `GetFlightRecords` SELECT/Scan (`:132-156`), which feeds the duplicate set (`app/handlers_import.go:49-63`). Add a grid column in `app/ui/src/components/Logbook/LogbookTable.jsx`; the import preview is that grid (`app/ui/src/components/Import/ImportTable.jsx:25-32`), so without it the field is imported but not shown.
2. `app/ui/src/components/Import/MapFieldsDialog.jsx:28-53`: add `{ id, label, default, leon? }`. Set `default` to the header that the logbook CSV export writes.
3. `app/ui/src/components/UIElements/CSVExportButton.jsx:71-96`: add the same header so export → import still round-trips.
4. Time fields: add `newRow.<id> = autoTimeFieldRecog(newRow.<id>)` (minutes) in `app/ui/src/components/Import/OpenCSVButton.jsx:56-66`. Integer counters: `parseInt(item.<id>) || 0` inside `marshallItem` (`app/ui/src/components/Import/helpers.jsx:108-111`), as landings do.
5. `app/ui/src/components/Import/helpers.jsx:70-121`: put the value at the exact JSON path of the Go struct tag (`internal/models/structs.go:25-79`).
6. Decide if the field belongs in `flightDuplicateKey` (`app/handlers_import.go:14-47`). Changing the key changes which existing records count as duplicates.
7. Update `HelpButton.jsx` if the format is new.
8. Run the §12.8 cross-check list, including the `CHANGELOG.md` `[Unreleased]` bullet and its `README.md` copy.

### 12.2 Add an import option

1. `ImportOptions` (`app/handlers_import.go:65-71`): new field with a snake_case JSON tag.
2. `ImportOptionsDialog.jsx`: add it to `DEFAULT_OPTIONS` (`:24-30`) and an `OptionSwitch` (dotted ids are nested by `handleChange`, `:81-98`).
3. Apply it in the loop of `HandlerApiImportRun`. Report per-row effects with `logRow("--- …")`, never by writing to `w` directly.
4. If the option touches another system's table, use that system's DBModel method. Do not write SQL in the handler.

### 12.3 Add a predefined mapping (another logbook application)

1. Add a new key (like `leon`) to the entries of `fields` (`MapFieldsDialog.jsx:28-53`).
2. Add a `ProfileButton` with that `fieldKey` (`:89-98`).
3. Add a bullet to `README.md:265-270`.

### 12.4 Add a date or time format

Edit `convertToDate` (`app/ui/src/components/Import/helpers.jsx:9-16`; keep strict parsing and the output `YYYY-MM-DD`) or `autoTimeFieldRecog` / `autoDepArrTimeRecog`. Update `HelpButton.jsx`. Add vitest cases in a new test file next to `app/ui/src/components/Import/helpers.jsx` (pattern: `app/ui/src/components/Currency/helpers.test.jsx`).

### 12.5 Add a name format

Add a `case` to `parseName` (`app/handlers_import.go:373-421`), cases to `TestParseName` (`app/handlers_import_test.go:16-134`), and a `TOGGLE_BUTTONS` entry (`ImportOptionsDialog.jsx:32-72`).

### 12.6 Change the stream protocol

Change `ImportProgress` (`app/handlers_import.go:78-86`) together with `handleProgressChunk` (`ImportProgressDialog.jsx:109-136`). Keep `result` as the single terminal chunk. After the header flush (`:103-107`), report failures with `writeResult(msg, false)` and `return`, never with `handleError` (§11 #6).

### 12.7 Add another source format (e.g. XLSX, JSON)

Add a new toolbar button in `app/ui/src/components/Import/` and wire it in `ImportTable.jsx:14-21`. Produce the same objects as `marshallItem`. The backend does not change.

### 12.8 Cross-check list (every Import change)

- [ ] The route stays inside the `Auth` group (`app/routes.go:26-27`) and is never wrapped in `middleware.Compress`, which would buffer the stream.
- [ ] Every handler exit after the first flush sends a `result` chunk.
- [ ] Time values sent to the server are integer minutes and dates are `YYYY-MM-DD`. The server does not convert either.
- [ ] Custom-field values match their type's storage (`duration` = minutes, see §11 #3). `custom_fields` is sent as a JSON **string**.
- [ ] `flightDuplicateKey` gives the same key for a DB record and for its CSV twin.
- [ ] `GenerateAircraftTable` still runs once after the loop.
- [ ] UI cache: `queryClient.invalidateQueries()` (`RunImportButton.jsx:32-35`) runs only when the `result` chunk has `ok: true`. Any change that writes data must keep the logbook, aircraft, persons, stats and map views fresh after a partial success too (§11 #2).
- [ ] Server caches: import changes no data held in `airportCache` or `distanceCache` today (it only fills them through `GetAirportByID` / `Distance`). An option that writes airports must clear `airportCache` and rebuild `distanceCache`, as `UpdateAirportDB` does (`internal/models/airports.go:95-96`).
- [ ] Both DB engines: import has no SQL of its own. New SQL goes into model methods with SQLite/MySQL variants, plus a `schemaVersion` bump (`internal/driver/db_structure.go:4`) if the schema changes.
- [ ] `make build_ui && make test` passes, including `TestParseName`; `npm run test:run` passes for UI helpers.
- [ ] `CHANGELOG.md` `[Unreleased]` bullet (`- New:` / `- Update:` / `- Fix:`) and the same bullet in the changelog copy in `README.md` (`README.md:64-66`). Update the README "Import" section (`README.md:265-270`) for user-visible features.

## 13. AI Notes

### Mental Model

The browser does all the CSV work: parse, map, normalise, convert to `FlightRecord` JSON. The server takes a ready-made array and replays it as one insert per record, with three optional extras: duplicate skip (always on), night-time recalculation, and person creation. Progress is a one-way NDJSON stream with a final `result` line. The UI trusts that line to decide whether to refresh the caches.

### Gotchas

- The backup switch does **not** back anything up; it only enables the Run button (`ImportOptionsDialog.jsx:104`).
- `GetFlightRecordDuplicates` is on `application`, not `DBModel` (`app/handlers_import.go:49`).
- The duplicate check runs against a snapshot taken at the start, which is updated only by the same request (`:134`, `:223-225`).
- Night-time recalculation never lowers night time to 0 (`:199`).
- When it changes landings, it moves **all** day landings to night (`:207-212`).
- `ok` is `omitempty`, so a failed `result` arrives without `ok` (`app/handlers_import.go:85`). The UI treats a missing `ok` as failure.
- `LogbookTable` is reused, so changes to the Logbook grid (columns, `tableId`, toolbar props) also change the import preview (`app/ui/src/components/Logbook/LogbookTable.jsx:298-333`).
- `ImportTable` passes no `tableId` (`app/ui/src/components/Import/ImportTable.jsx:25-32`), so the preview keeps the hard-coded `tableId='logbook'` (`app/ui/src/components/Logbook/LogbookTable.jsx:300`) and reads and writes the Logbook page's `localStorage` state: `logbook-pagination`, `logbook-columns` (`app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:111-112`), `logbook-filter-model` and `logbook-quick-filter-model` (`app/ui/src/components/UIElements/XDataGrid/FilterContext.jsx:7-8`). See §4.4 "Grid state" and §11 #8.
- `ImportProgressDialog` is the one network call outside `app/ui/src/util/http/`. Auth or base-URL changes must be repeated there (`ImportProgressDialog.jsx:54-62`).
- Person roles from custom fields use the field **name** at import time. Renaming the field later does not rename the roles (`app/handlers_import.go:321-325`).

### File Quick Reference

| Need | File |
|---|---|
| Server loop, options, chunks | `app/handlers_import.go` |
| Name parsing + test | `app/handlers_import.go:366-424`, `app/handlers_import_test.go` |
| Route | `app/routes.go:127-129` |
| Night time / log time format | `app/helpers.go:67-140` |
| CSV parse + normalisation | `app/ui/src/components/Import/OpenCSVButton.jsx`, `app/ui/src/components/Import/helpers.jsx` |
| Field list / profiles | `app/ui/src/components/Import/MapFieldsDialog.jsx` |
| Options | `app/ui/src/components/Import/ImportOptionsDialog.jsx` |
| Stream client | `app/ui/src/components/Import/ImportProgressDialog.jsx` |
| Cache refresh | `app/ui/src/components/Import/RunImportButton.jsx` |
| Preview grid | `app/ui/src/components/Import/ImportTable.jsx` → `app/ui/src/components/Logbook/LogbookTable.jsx` |

> **AI Usage Instructions**
> - Always read this file before modifying this system
> - Do not refactor without impact analysis
> - Ask if information is missing
