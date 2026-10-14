# Architecture Summaries

One paragraph per `ARCHITECTURE_*.md` — the routing table the `researcher` agent reads first (`.claude/prompts/research.md`). Pick the relevant systems here, then open only their documents.

**Last generated:** 2026-10-14 — initial generation from code (`docs/tasks/_old/TASK_AGENT_WORKFLOW_SETUP.md`)  
**Total systems:** 12

**System IDs** — use these in the `systems:` frontmatter of task and issue files: `APPLICATION`, `DATABASE`, `AUTH`, `SETTINGS`, `LOGBOOK`, `STATS_AND_MAP`, `PERSONS`, `AIRCRAFT_AIRPORTS`, `CURRENCY_LICENSING`, `PDF_EXPORT`, `IMPORT`, `FRONTEND`.

| ID | System | Document |
|---|---|---|
| `APPLICATION` | Application | [ARCHITECTURE_APPLICATION.md](ARCHITECTURE_APPLICATION.md) |
| `DATABASE` | Database | [ARCHITECTURE_DATABASE.md](ARCHITECTURE_DATABASE.md) |
| `AUTH` | Authentication | [ARCHITECTURE_AUTH.md](ARCHITECTURE_AUTH.md) |
| `SETTINGS` | Settings | [ARCHITECTURE_SETTINGS.md](ARCHITECTURE_SETTINGS.md) |
| `LOGBOOK` | Logbook (Flight Records) | [ARCHITECTURE_LOGBOOK.md](ARCHITECTURE_LOGBOOK.md) |
| `STATS_AND_MAP` | Stats & Map | [ARCHITECTURE_STATS_AND_MAP.md](ARCHITECTURE_STATS_AND_MAP.md) |
| `PERSONS` | Persons | [ARCHITECTURE_PERSONS.md](ARCHITECTURE_PERSONS.md) |
| `AIRCRAFT_AIRPORTS` | Aircraft & Airports | [ARCHITECTURE_AIRCRAFT_AIRPORTS.md](ARCHITECTURE_AIRCRAFT_AIRPORTS.md) |
| `CURRENCY_LICENSING` | Currency, Licensing & Attachments | [ARCHITECTURE_CURRENCY_LICENSING.md](ARCHITECTURE_CURRENCY_LICENSING.md) |
| `PDF_EXPORT` | PDF & CSV Export | [ARCHITECTURE_PDF_EXPORT.md](ARCHITECTURE_PDF_EXPORT.md) |
| `IMPORT` | Import | [ARCHITECTURE_IMPORT.md](ARCHITECTURE_IMPORT.md) |
| `FRONTEND` | Frontend (SPA Infrastructure) | [ARCHITECTURE_FRONTEND.md](ARCHITECTURE_FRONTEND.md) |

---

## Application

**ID:** `APPLICATION` · **Doc:** [ARCHITECTURE_APPLICATION.md](ARCHITECTURE_APPLICATION.md)

The Go `package main` shell around every other system. `app/main.go` parses the CLI flags (-url/-port/-env/-engine/-dsn/-enable-https/-disable-authentication), sets up the info/error/warning loggers that write to stdout and to a `weblogbook-output.log` truncated on each start, opens the DB through `driver.OpenDB` (which runs schema validation and migration), runs startup housekeeping (settings defaults, airport DB bootstrap, distance cache and back-fill), then serves. `app/routes.go` holds the whole chi route table: dev-only request logger → wildcard CORS → public `POST /api/login` → the `/api` group behind `app.Auth` → `/*` embedded SPA (`app/handlers_aux.go`, `//go:embed ui/dist/*`). The response and error helpers every handler uses live in `app/helpers.go` (`writeJSON`, `writeOkResponse`, `handleError` = always 500, plus `calculateNightTime` and `formatTimeField`). `app/handlers_db.go` provides SQLite file backup and restore (`/api/db/*`). Gotcha: DB upload closes the pool and overwrites the live file before validating it, and does not reset the package-level `authCache`/`airportCache`/`distanceCache` or `timeFieldsAutoFormat`. Also, a failed airport download on an empty airports table stops startup with exit code 0, and there is no panic-recovery middleware, so a handler panic drops the connection instead of returning a 500 JSON.

**Keywords:** app/main.go, app/routes.go, startup sequence, CLI flags, chi router, CORS, Auth middleware, middleware.Compress, writeJSON, handleError, HandlerUI, go:embed ui/dist, /api/db/upload-db, /api/db/download-db, /api/version, panic, Recoverer

---

## Database

**ID:** `DATABASE` · **Doc:** [ARCHITECTURE_DATABASE.md](ARCHITECTURE_DATABASE.md)

This is the persistence layer for the whole logbook. It runs on SQLite (modernc, the default file `web-logbook.sql`) or MySQL through `database/sql`, selected by the `-engine`/`-dsn` flags. The schema is declarative in `internal/driver/db_structure.go`: 14 tables (13 domain tables plus `metadata`), 4 views (`logbook_view`, `airports_view`, `aircrafts_view`, `attachments_view`), with SQLite and MySQL DDL variants. `OpenDB` → `validateDB` (`internal/driver/driver.go`) reconciles it additively: it creates tables, adds columns and indexes, recreates views and seeds `settings2`, but only when the latest `metadata` version differs from `schemaVersion` "101". Type and data changes need explicit migrations; the only one is the v5 data overhaul (`internal/driver/data_overhaul.go`). It runs for integer versions < 100 and converts HH:MM times to integer minutes and DD/MM/YYYY dates to ISO. All runtime SQL lives in engine-agnostic `DBModel` methods in `internal/models` (60 s `DefaultTimeout`, distance cache in `helpers.go`), and the logbook is read through `logbook_view`. Gotcha: a table or view edit does nothing to existing DBs unless `schemaVersion` is bumped and both engine variants are written. The overhaul gate also has upgrade-path holes: the version is chosen by `ORDER BY` on a `created_at` string with mixed date formats, and dotted versions skip the overhaul.

**Keywords:** schemaVersion, validateDB, data_overhaul, metadata, logbook_view, aircrafts_view, airports_view, attachments_view, sqlite, mysql, dsn, ColumnType, DefaultTimeout, distanceCache, /api/db/upload-db

---

## Authentication

**ID:** `AUTH` · **Doc:** [ARCHITECTURE_AUTH.md](ARCHITECTURE_AUTH.md)

Optional single-user authentication. When enabled, it protects every /api/* route except the public POST /api/login (app/routes.go:24-27). Login checks the login and bcrypt hash stored in the settings2 JSON blob, issues a 24h HS256 JWT signed with a secret key that the browser generates (AuthSettings.jsx), records the token in the `tokens` table, and throttles failed attempts per IP in memory (app/handlers_auth.go, internal/models/auth.go). The UI keeps the JWT in localStorage (app/ui/src/util/auth.jsx), adds the Bearer header by hand in every API request function in app/ui/src/util/http/*.jsx, and redirects to /signin on any 401 via handleFetch/handle401. The -disable-authentication CLI flag (app/main.go:88, 154-161) turns the flag off and exits. Planner gotcha: auth state is cached in the process-wide `authCache` sync.Map, which only UpdateSettings clears. Logout, DB upload and direct SQL do not clear it, and PUT /api/settings/general replaces the whole Settings struct, including login/secret_key/auth_enabled.

**Keywords:** auth, /api/login, /api/logout, /api/auth-enabled, Auth middleware, JWT, tokens table, authCache, secret_key, bcrypt, loginAttempts, -disable-authentication, SignIn, LogoutPage, getAuthToken

---

## Settings

**ID:** `SETTINGS` · **Doc:** [ARCHITECTURE_SETTINGS.md](ARCHITECTURE_SETTINGS.md)

Settings stores every per-installation preference as one JSON document in table settings2, row id=0: owner data, signature image, auth credentials, PDF A4/A5 layout, airport DB source, interface prefs, time/date display formats, license warnings and previous experience. GetSettings and UpdateSettings in internal/models/settings.go read and write it; UpdateSettings bcrypt-hashes the password and clears authCache. Seven handlers in app/handlers_settings.go serve /api/settings/*, and first-run defaults come from internal/models/models_defaults.go (CheckDefaultValues at startup). In the UI, components/Settings/Settings.jsx edits a local copy of useSettings data (query key ['settings']), and about 30 components read display prefs through the useSettings hook (fieldName, timeFieldsFormat, dateFieldsFormat). Gotcha: PUT /settings/general replaces the whole document from the client copy and only protects export_a4/export_a5/signature_image, so every writer must do GetSettings, change fields, then UpdateSettings; a new PDF field must also be added to the explicit copy list in HandlerApiSettingsExportUpdate or it is silently dropped (page_breaks is dropped today).

**Keywords:** settings2, /api/settings, GetSettings, UpdateSettings, CheckDefaultValues, useSettings, time_fields_auto_format, date_fields_format, formatTimeField, standard_fields_headers, enable_custom_names, previous_experience, signature_image, export_a4, SettingsPage, auth_enabled

---

## Logbook (Flight Records)

**ID:** `LOGBOOK` · **Doc:** [ARCHITECTURE_LOGBOOK.md](ARCHITECTURE_LOGBOOK.md)

The logbook system handles flight records: the EASA-style logbook table (MUI DataGrid with in-place bulk edit), the single-record form at /logbook/:id, create/update/delete/copy/return/sign, track upload/reset, night-time calculation and user-defined custom fields. Backend: app/handlers_flightrecord.go, app/handlers_logbook.go and app/handlers_custom_fields.go (routes under /api/logbook and /api/custom-fields behind Auth). SQL is in internal/models/flightrecords.go and custom_fields.go over table logbook and view logbook_view. Night maths (civil twilight at -6 deg) is in internal/nighttime. UI: components/Logbook (LogbookTable, BulkEditButtons, EditCells), components/FlightRecord (FlightRecord, FlightRecordDetails, PlaceField, SaveFlightRecordButton) and util/http/logbook.jsx. Gotcha: the backend does no validation and trusts the UI-shaped JSON (times in integer minutes, date as a YYYY-MM-DD string, custom_fields as a JSON string, track as base64). Update takes the uuid from the body, create recomputes distance on the server while update trusts the client, and the "Return" action currently writes an ISO timestamp into date. Unknown airport codes silently produce a 0°N 0°E distance and night time that get saved.

**Keywords:** /api/logbook, /api/custom-fields, logbook_view, logbook table, custom_fields, FlightRecord, LogbookTable, bulk edit, night time, nighttime, track log, signature, PlaceField, useLogbookQuery, flight record

---

## Stats & Map

**ID:** `STATS_AND_MAP` · **Doc:** [ARCHITECTURE_STATS_AND_MAP.md](ARCHITECTURE_STATS_AND_MAP.md)

Stats and Map is the read-only reporting part of the logbook: Dashboard tiles, totals by year/month, by aircraft type and by category (/stats/*), plus an OpenLayers map of routes, GPS tracks and airports (/map). There is no stats endpoint. The UI downloads the whole logbook (GET /api/logbook/data, or /api/logbook/mapdata which adds tracks) plus the airport/aircraft/custom-field/settings lists, and aggregates client-side in app/ui/src/util/helpers.jsx (getStats, getTotalsByMonthAndYear, getTotalsByAircraft). The views are app/ui/src/components/Stats/*, app/ui/src/components/Map/* and app/ui/src/components/FlightMap/*; filtering is the shared UIElements/Filters.jsx. Backend: HandlerApiLogbookData/HandlerApiLogbookMapData in app/handlers_logbook.go → GetFlightRecords/GetFlightRecordsForMap on logbook_view. Gotchas: times are integer minutes formatted only at display; category rows overlap, so there is no total footer; map options in localStorage replace the defaults instead of merging; and the shared ['airports'] query key plus the stale DD/MM/YYYY previous-experience date currently produce wrong dashboard numbers.

**Keywords:** stats, dashboard, map, FlightMap, TotalsDashboard, getStats, getTotalsByAircraft, getTotalsByMonthAndYear, /logbook/mapdata, /airport/list, logbook_view, previous_experience, OpenLayers, track log, custom field stats_function

---

## Persons

**ID:** `PERSONS` · **Doc:** [ARCHITECTURE_PERSONS.md](ARCHITECTURE_PERSONS.md)

Persons keeps the pilot's directory of people (name, phone, email, remarks) and links them to flight records with a free-text role. It also shows each person's flights with a summed total-time footer. Backend: 12 handlers in app/handlers_person.go under /api/person (app/routes.go:105-118, behind app.Auth), SQL in internal/models/persons.go, tables persons and person_to_log (internal/driver/db_structure.go:147-166). UI: components/Persons (Persons.jsx list, PersonView.jsx, FlightRecordPersons.jsx card on the flight page), UIElements/PersonSelect.jsx and PersonRole.jsx, and util/http/person.jsx, with all query keys under the ["persons", ...] prefix. Roles are just SELECT DISTINCT role FROM person_to_log. Links are addressed by (log_uuid, person_uuid), not by their own uuid. Gotcha: the DB has no constraints or FKs, so uniqueness and cascade-on-person-delete live only in persons.go, and deleting a flight leaves orphan person_to_log rows. Also, GET /api/person/{uuid} panics on an unknown UUID.

**Keywords:** persons, person_to_log, /api/person, persons-for-log, logs-for-person, copy-flight-record, person roles, PersonView, FlightRecordPersons, AddEditFlightrecordPersonModal, CopyPersonsForLog, crew, return flight, create_persons import

---

## Aircraft & Airports

**ID:** `AIRCRAFT_AIRPORTS` · **Doc:** [ARCHITECTURE_AIRCRAFT_AIRPORTS.md](ARCHITECTURE_AIRCRAFT_AIRPORTS.md)

Covers two reference datasets: the aircraft list (registration to type, per-type categories with time-field auto-fill flags, per-registration custom categories) and the airport database (standard airports downloaded from a JSON or CSV source, plus custom airports), along with the great-circle distance in nautical miles derived from airport coordinates. The aircraft list is never edited directly: GenerateAircraftTable in internal/models/aircrafts.go rebuilds the aircrafts and aircraft_categories tables from the logbook after every flight create/update/delete and after import. Airports are read through airports_view (standard UNION custom) by ICAO-or-IATA code, and lookups and distances go through two process-global sync.Map caches (airportCache in internal/models/airports.go, distanceCache in internal/models/helpers.go). Key files: app/handlers_aircraft.go, app/handlers_airport.go (download plus JSON/CSV parsers), internal/models/aircrafts.go, internal/models/airports.go, internal/utils/distance.go, app/main.go:170-206 (first-run download), and the UI under app/ui/src/components/Aircrafts and app/ui/src/components/Airports. Gotcha: GetAirportByID returns a zero-value Airport with a nil error when a code is not found, so the distance and night-time code silently treats unknown codes as 0°N 0°E and stores the result. Neither cache is invalidated by custom airport edits or by a DB upload.

**Keywords:** /api/aircraft, /api/airport, /api/distance, aircrafts_view, airports_view, aircraft_categories, airports_custom, GenerateAircraftTable, airportCache, distanceCache, time_fields_auto_fill, airports_db_source, no_icao_filter, AirportsDB, EditCategoriesModal

---

## Currency, Licensing & Attachments

**ID:** `CURRENCY_LICENSING` · **Doc:** [ARCHITECTURE_CURRENCY_LICENSING.md](ARCHITECTURE_CURRENCY_LICENSING.md)

This system covers three features next to the flight log: currency rules (e.g. "90 h in 28 days", "3 landings in 90 days"), license and certificate records with one optional scanned document and expiry badges in the navigation, and flight-record attachments with preview, KML/GPX track import and ZIP download. The backend is thin CRUD (app/handlers_currency.go, app/handlers_licensing.go, app/handlers_attachments.go, plus internal/models/currency.go, licensing.go and attachments.go) over the tables currency, licensing and attachments and the view attachments_view, all under app.Auth. Documents are stored as DB BLOBs and sent to the UI as base64 JSON. All currency evaluation and expiry logic runs client-side in app/ui/src/components/Currency/helpers.jsx against the full logbook JSON. The key gotcha for planners is that currency time targets are integer hours while flight times are minutes (any metric name containing "time" is multiplied by 60). Also, the PUT handlers ignore the {uuid} URL param, and GetAttachmentByID returns a nil error for unknown ids.

**Keywords:** currency, licensing, license expiry, attachments, attachments_view, /api/currency, /api/licensing, /api/attachment, zip-download, sub_metrics, evaluateCurrency, getCurrencyExpiryForRule, LicensingNavTitle, custom-title, custom_title_a4, KML GPX track

---

## PDF & CSV Export

**ID:** `PDF_EXPORT` · **Doc:** [ARCHITECTURE_PDF_EXPORT.md](ARCHITECTURE_PDF_EXPORT.md)

PDF Export renders the whole logbook as an EASA Part FCL.050-style printable logbook in landscape A4 (all columns on one page) or A5 (left page A plus right page B). Rendering uses fpdf in internal/pdfexport (pdfexport.go shared logic, pdfexport_a4.go, pdfexport_a5.go, embedded fonts). The entry point is GET /api/export/{format} -> HandlerApiExportLogbook in app/handlers_export.go, which combines GetFlightRecordsForExport (logbook_view), the export_a4/export_a5 blocks of the settings JSON, previous experience and an optional custom title PDF stored in attachments as custom_title_a4/a5. The UI is components/PdfExport, reached from /export/a4 and /export/a5: a local-state settings form saved via PUT /api/settings/export/{format}, client-side restore defaults, custom title upload and preview, and an export button; the logbook toolbar has a PDFExportButton too. The browser-only Quick CSV export (UIElements/CSVExportButton.jsx) is offered on 10 data grids; there is no XLS export. The gotcha a planner must know: body and footer cells use hard-coded indices into the w3/w4 width arrays (shifted by extended format and the A5 split constants). Also, the export uses only the saved settings, and page_breaks is never saved by the PUT handler.

**Keywords:** /api/export/{format}, /api/export/custom-title, /api/settings/export, pdfexport, PDFExporter, ExportA4, ExportA5, export_a4, export_a5, page_breaks, custom_title_a4, PdfExport, CSVExportButton, fpdf, signature

---

## Import

**ID:** `IMPORT` · **Doc:** [ARCHITECTURE_IMPORT.md](ARCHITECTURE_IMPORT.md)

Import loads a pilot's existing logbook from a CSV file. The browser (app/ui/src/components/Import) parses it with papaparse and maps columns with the Web Logbook or Leon presets or a custom profile kept in localStorage. It turns dates into YYYY-MM-DD and times into integer minutes, then previews the rows in the reused LogbookTable. Run Import POSTs the whole array to /api/import/run (HandlerApiImportRun in app/handlers_import.go), which streams NDJSON progress/log/result chunks. Per record it skips duplicates (flightDuplicateKey), can recalculate night time, inserts via InsertFlightRecord, and can create or link Persons (parseName); at the end it calls GenerateAircraftTable. There is no transaction, no cancellation and no server-side backup: the "I have a logbook backup" switch only exists in the UI. Gotcha: React Query caches are invalidated only when the final result chunk has ok=true, so any skipped or failed record leaves the Logbook view stale for up to 1 h; every handler exit after the first flush must also send a result chunk, or the progress dialog can never be closed.

**Keywords:** import, /api/import/run, HandlerApiImportRun, NDJSON, CSV, papaparse, MapFieldsDialog, ImportProgressDialog, flightDuplicateKey, parseName, custom-import-profile, Leon, recalculate_night_time, create_persons, person_to_log

---

## Frontend (SPA Infrastructure)

**ID:** `FRONTEND` · **Doc:** [ARCHITECTURE_FRONTEND.md](ARCHITECTURE_FRONTEND.md)

The React 19 + MUI 9 + TanStack Query 5 single-page app shell. It covers the router tree in app/ui/src/main.jsx (a path-less App route that holds the provider stack, the Root dashboard layout with all pages, and /signin and /logout), the HTTP layer in app/ui/src/util/http (about 70 hand-written request functions that all end in handleFetch, with 401 sending the user to /signin), and the query-hook pattern in app/ui/src/hooks/queries (1 h staleTime, invalidation by hand after mutations). It also covers browser persistence (useLocalStorageState, XDataGrid table state keyed by tableId), the theme, and the shared UIElements: form fields with handleChange(id, value), XDataGrid, Filters and CSVExportButton. In production the build in app/ui/dist is embedded with //go:embed ui/dist/* (app/handlers_aux.go) and served with an SPA fallback. In dev, `npm run dev` calls http://localhost:4000/api cross-origin (constants.jsx API_URL, CORS in app/routes.go). The gotcha a planner must know: the whole logbook is one cached query ['logbook'] that stats, currency and autocomplete all derive from, so every mutation must invalidate every dependent query key by hand. Also, app/ui/dist must be built (`npm run build` runs Vitest) before any go build, vet or test.

**Keywords:** main.jsx router, App providers, Root layout, DashboardNavbar NAV_ITEMS, handleFetch, queryClient invalidateQueries, hooks/queries query-hook pattern, API_URL dev mode :4000, go:embed ui/dist HandlerUI, XDataGrid tableId, useLocalStorageState, useDialogs useNotifications, UIElements TimeField DatePicker Select, CSVExportButton, vite.config.js eslint.config.js package.json

---

## Entry template

```markdown
## <System Name>

**ID:** `<SYSTEM>` · **Doc:** [ARCHITECTURE_<SYSTEM>.md](ARCHITECTURE_<SYSTEM>.md)

<3–6 sentences: what the system does, its key files, the one gotcha a planner must know.>

**Keywords:** <5–15 routing terms: endpoint fragments, tables, components, domain words>
```
