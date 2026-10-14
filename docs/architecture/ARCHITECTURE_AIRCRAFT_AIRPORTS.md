# Aircraft & Airports — Architecture

**Last Updated:** 2026-10-14 — initial version generated from code and fact-checked (TASK_AGENT_WORKFLOW_SETUP)

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

This system covers two reference datasets that the pilot's logbook relies on:

- **Aircraft.** The aircraft list (registration to type) is never typed in by hand. `GenerateAircraftTable` (`internal/models/aircrafts.go:7`) rebuilds it from the logbook every time flights are created, updated, deleted or imported. On top of that list the pilot sets **categories per aircraft type** (with optional time-field auto-fill flags) and **custom categories per registration**. Stats, filters and currency use both.
- **Airports.** A standard airport database is downloaded from a public JSON/CSV source into table `airports`, either on first start (`app/main.go:170-191`) or on demand (`HandlerApiAirportDBUpdate`, `app/handlers_airport.go:195`). The pilot can add their own entries to `airports_custom`. View `airports_view` merges the two (`internal/driver/db_structure.go:229-242`). Airport coordinates feed the **great-circle distance** calculation (`internal/utils/distance.go:14`, in nautical miles), two in-memory caches (`airportCache`, `distanceCache`), night-time calculation and the maps.

Backend code is in `app/handlers_aircraft.go`, `app/handlers_airport.go`, `internal/models/aircrafts.go`, `internal/models/airports.go`, the distance part of `internal/models/helpers.go` and `internal/utils/distance.go`. The UI is two pages, `/aircrafts` and `/airports` (`app/ui/src/main.jsx:61`, `app/ui/src/main.jsx:69`), built from `app/ui/src/components/Aircrafts/*` and `app/ui/src/components/Airports/*`.

## 2. Key Concepts

| Term | Meaning / invariant | Evidence |
|---|---|---|
| Registration (`reg_name`) | Primary key of `aircrafts`. A row exists only while at least one logbook row uses that registration. | `internal/driver/db_structure.go:109`, `internal/models/aircrafts.go:33-38` |
| Aircraft type / model (`aircraft_model`) | The type assigned to a registration is `MIN(aircraft_model)` over that registration's flights. If several types were logged under one registration, the alphabetically smallest one wins. | `internal/models/aircrafts.go:18-25`, `internal/models/aircrafts.go:46-62` |
| Model categories | `aircraft_categories.categories`: a comma-separated string, one row per type. Rows are created with `''` and never deleted. | `internal/models/aircrafts.go:70-75`, `internal/driver/db_structure.go:115-119` |
| Custom categories | `aircrafts.custom_categories`: a comma-separated string per registration. It is lost when the registration disappears from the logbook, because the row is deleted. | `internal/driver/db_structure.go:112`, `internal/models/aircrafts.go:33-38` |
| Effective category | `aircrafts_view.categories` is model categories + `', '` + custom categories. SQLite and MySQL use different SQL for this. | `internal/driver/db_structure.go:249-260`, `internal/driver/db_structure.go:272-283` |
| Time fields auto-fill | A JSON blob in `aircraft_categories.time_fields_auto_fill` with 8 booleans (`se_time` … `instructor_time`). For new flights the UI copies total time into each flagged field. | `internal/models/structs.go:313-322`, `app/ui/src/components/FlightRecord/FlightRecordDetails.jsx:61-79` |
| Total time | Integer minutes, summed from `logbook.total_time` and formatted in the UI. | `internal/driver/db_structure.go:35`, `app/ui/src/components/Aircrafts/AircraftsTable.jsx:66` |
| Standard airport | A row in `airports` (PK `icao`). The whole table is replaced on every DB update. | `internal/driver/db_structure.go:55`, `internal/models/airports.go:65` |
| Custom airport | A row in `airports_custom`. Column `name` holds the **code** and `full_name` holds the display name; the column names were kept for backward compatibility. | `internal/driver/db_structure.go:67-75` |
| `airports_view` | `UNION` of standard and custom airports. Custom codes are exposed as `UPPER(name)` in both `icao` and `iata`. | `internal/driver/db_structure.go:229-242` |
| Airport lookup key | Any ICAO or IATA code: `WHERE icao = ? or iata = ?` against `airports_view`. | `internal/models/airports.go:26-28` |
| "Not found" contract | `GetAirportByID` returns a **zero-value `Airport` and `nil` error** when no row matches. | `internal/models/airports.go:32-35` |
| Distance | Haversine distance, Earth radius 6378100 m, converted to nautical miles. | `internal/utils/distance.go:14-24` |
| ICAO filter | Unless `no_icao_filter` is set, only codes of exactly 4 letters A–Z are imported. | `internal/models/airports.go:71-76` |

## 3. How It Works

**Aircraft list lifecycle**

| Step | What happens | Evidence |
|---|---|---|
| 1 | A flight is created, updated or deleted, or an import finishes. | `app/handlers_flightrecord.go:67`, `app/handlers_flightrecord.go:95`, `app/handlers_flightrecord.go:121`, `app/handlers_import.go:347` |
| 2 | `GenerateAircraftTable` runs one transaction: insert missing registrations, delete registrations no longer in the logbook, re-sync each registration's type, insert missing types into `aircraft_categories`. Callers discard the error (`_ =`). | `internal/models/aircrafts.go:7-85` |
| 3 | The Aircrafts page loads `GET /api/aircraft/list` (`aircrafts_view`) and `GET /api/aircraft/models-categories`. | `app/ui/src/components/Aircrafts/Aircrafts.jsx:10-13` |
| 4 | **Edit type categories**: the pilot opens `EditCategoriesModal` and saves with `PUT /api/aircraft/models-categories`, which updates `categories` and `time_fields_auto_fill`. | `app/ui/src/components/Aircrafts/EditCategoriesModal.jsx:34-41`, `internal/models/aircrafts.go:153-164` |
| 5 | **Edit aircraft**: the pilot opens `EditAircraftModal` and saves with `PUT /api/aircraft/update`, which updates `custom_categories` and the type. If the type changed, the matching logbook rows are rewritten too. | `app/ui/src/components/Aircrafts/EditAircraftModal.jsx:32-42`, `internal/models/aircrafts.go:179-203` |

**Airport database lifecycle**

| Step | What happens | Evidence |
|---|---|---|
| 1 | Startup: `CheckDefaultValues` fills in the default `airports_db_source` if it is empty. | `app/main.go:164`, `internal/models/models_defaults.go:178-182` |
| 2 | Startup: if `airports` has 0 rows, the default source is downloaded with the ICAO filter **on**. Any failure makes `main` return, so the server never starts. | `app/main.go:170-191` |
| 3 | Startup: `go CreateDistanceCache()` runs in the background and `UpdateFlightRecordsDistance()` runs synchronously. Only then does the server start listening. | `app/main.go:201-209` |
| 4 | Airports page: the pilot picks a source or toggles "No ICAO Filter". Each change autosaves with `PUT /api/settings/airports`. | `app/ui/src/components/Airports/AirportsDB.jsx:43-46`, `app/handlers_settings.go:77-100` |
| 5 | The pilot clicks Refresh, which sends `POST /api/airport/update-db`. The server reads the settings, downloads, parses JSON or CSV, then `DELETE FROM airports` and re-inserts in one transaction. It then clears `airportCache` and rebuilds `distanceCache` asynchronously. | `app/handlers_airport.go:195-214`, `internal/models/airports.go:55-99` |
| 6 | Custom airports: add (including "Copy to Custom Airport" from the standard table), edit or delete through `POST`/`PUT`/`DELETE /api/airport/custom`. | `app/ui/src/components/Airports/AddEditCustomAirportModal.jsx:39`, `app/ui/src/components/Airports/CopyAirportButton.jsx:15`, `app/ui/src/components/Airports/DeleteCustomAirportButton.jsx:17-22` |

## 4. Components & Files

### 4.1 File Index

| File | Responsibility |
|---|---|
| `app/handlers_aircraft.go` | 4 aircraft HTTP handlers (list, categories list/update, aircraft update) |
| `app/handlers_airport.go` | Airport HTTP handlers, plus `downloadAirportDB`, `parseJSONAirports` and `parseCSVAirports` (methods on `application`) |
| `internal/models/aircrafts.go` | `GenerateAircraftTable`, aircraft and category queries and updates |
| `internal/models/airports.go` | `airportCache`, lookup by code, full DB replace, standard/custom/all lists, custom CRUD |
| `internal/models/helpers.go` | `distanceCache`, `DBModel.Distance`, `UpdateFlightRecordsDistance`, `CreateDistanceCache`, `DefaultTimeout` |
| `internal/utils/distance.go` | Pure haversine function `Distance(lat1, lon1, lat2, lon2)` in NM |
| `internal/models/structs.go` | `Airport` (`internal/models/structs.go:91-100`), `Aircraft` (`internal/models/structs.go:301-308`), `Category` (`internal/models/structs.go:310-324`), settings fields (`internal/models/structs.go:252-253`) |
| `internal/driver/db_structure.go` | Tables `airports`, `airports_custom`, `aircrafts`, `aircraft_categories` and views `airports_view`, `aircrafts_view` |
| `app/main.go` | First-run airport download and startup distance jobs (`app/main.go:170-206`) |
| `app/handlers_aux.go` | `HandlerDistance` (`app/handlers_aux.go:41-46`) |
| `app/ui/src/pages/AircraftsPage.jsx`, `app/ui/src/pages/AirportsPage.jsx` | Thin page wrappers |
| `app/ui/src/components/Aircrafts/*` | Aircrafts and Types & Categories grids and edit modals |
| `app/ui/src/components/Airports/*` | Standard and custom airport grids, DB source card, custom airport CRUD |
| `app/ui/src/util/http/aircraft.jsx`, `app/ui/src/util/http/airport.jsx` | Fetch wrappers for the endpoints |
| `app/ui/src/hooks/queries/useAircraftsQuery.js`, `app/ui/src/hooks/queries/useModelsCategoriesQuery.js` | Shared TanStack query hooks (keys `['aircrafts']`, `['models-categories']`) |
| `app/ui/src/components/UIElements/AircraftCategories.jsx` | Multi-select category picker; its options come from both aircraft queries |

### 4.2 API Endpoints

All of these routes sit inside `r.Route("/api", …)` with `r.Use(app.Auth)` (`app/routes.go:26-27`).

| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/api/aircraft/list` | `HandlerApiAircraftList` (`app/handlers_aircraft.go:11`) | `[]Aircraft` from `aircrafts_view`; `app/routes.go:75` |
| GET | `/api/aircraft/models-categories` | `HandlerApiAircraftModelsCategoriesList` (`app/handlers_aircraft.go:22`) | `[]Category`; only types that have logbook rows; `app/routes.go:76` |
| PUT | `/api/aircraft/models-categories` | `HandlerApiAircraftModelsCategoriesUpdate` (`app/handlers_aircraft.go:33`) | Body `Category`; replies `JSONResponse{ok:true}`; `app/routes.go:77` |
| PUT | `/api/aircraft/update` | `HandlerApiAircraftUpdate` (`app/handlers_aircraft.go:50`) | Body `Aircraft` (uses `reg`, `model`, `custom_category`); `app/routes.go:78` |
| GET | `/api/airport/standard-list` | `HandlerApiStandardAirportList` (`app/handlers_airport.go:40`) | Table `airports`; gzip `Compress(5)`; `app/routes.go:94` |
| GET | `/api/airport/custom-list` | `HandlerApiCustomAirportList` (`app/handlers_airport.go:51`) | Table `airports_custom` (code not upper-cased); gzip `Compress(5)`; `app/routes.go:95` |
| GET | `/api/airport/list` | `HandlerApiAirportList` (`app/handlers_airport.go:62`) | `airports_view` (standard + custom); gzip `Compress(5)`; `app/routes.go:96` |
| POST | `/api/airport/custom` | `HandlerApiAirportCustomNew` (`app/handlers_airport.go:217`) | Body `Airport` (`icao` = code); replies with a bare JSON string; `app/routes.go:97` |
| PUT | `/api/airport/custom` | `HandlerApiAirportCustomUpdate` (`app/handlers_airport.go:235`) | Keyed by `icao`; `app/routes.go:98` |
| DELETE | `/api/airport/custom` | `HandlerApiAirportCustomDelete` (`app/handlers_airport.go:253`) | JSON body with `icao`; `app/routes.go:99` |
| GET | `/api/airport/{id}` | `HandlerApiAirportByID` (`app/handlers_airport.go:20`) | `id` is upper-cased; 404 `JSONResponse` if not found; `app/routes.go:100` |
| POST | `/api/airport/update-db` | `HandlerApiAirportDBUpdate` (`app/handlers_airport.go:195`) | Synchronous download and replace; `app/routes.go:101` |
| PUT | `/api/settings/airports` | `HandlerApiSettingsAirports` (`app/handlers_settings.go:77`) | Copies only `airports_db_source` and `no_icao_filter`; `app/routes.go:86` |
| GET | `/api/distance/{departure}/{arrival}` | `HandlerDistance` (`app/handlers_aux.go:41`) | Float in NM; codes passed through unchanged (no upper-casing); `app/routes.go:162` |

### 4.3 Data Access

**`internal/models/aircrafts.go`**

| Method | Purpose | Tables / views |
|---|---|---|
| `GenerateAircraftTable` (`internal/models/aircrafts.go:7`) | Four-statement sync of aircraft and types from the logbook, in one transaction | `aircrafts`, `aircraft_categories`, `logbook_view` |
| `GetAircraftModelsCategories` (`internal/models/aircrafts.go:87`) | Types with categories, auto-fill JSON and `SUM(total_time)`. `INNER JOIN` hides types that have no flights. | `aircraft_categories`, `logbook_view` |
| `GetAircrafts` (`internal/models/aircrafts.go:125`) | All registrations with effective, model and custom categories and total time | `aircrafts_view` |
| `UpdateAircraftModelsCategories` (`internal/models/aircrafts.go:153`) | Sets `categories` and `time_fields_auto_fill` for one type. **Always returns `nil`** (`internal/models/aircrafts.go:163`). | `aircraft_categories` |
| `GetAircraft` (`internal/models/aircrafts.go:166`) | One registration (no total time) | `aircrafts_view` |
| `UpdateAircraft` (`internal/models/aircrafts.go:179`) | Updates `custom_categories` and the type. If the type changed, runs `UPDATE logbook … WHERE aircraft_model = old AND reg_name = reg` (`internal/models/aircrafts.go:196-201`). No transaction. | `aircrafts`, `logbook` |

**`internal/models/airports.go`**

| Method | Purpose | Tables / views |
|---|---|---|
| `GetAirportByID` (`internal/models/airports.go:16`) | Looks in `airportCache` first, then the database; caches hits only (`internal/models/airports.go:40`) | `airports_view` |
| `GetAirportDBRecordsCount` (`internal/models/airports.go:46`) | `COUNT(*)`. The scan error is dropped (`internal/models/airports.go:51`). | `airports` |
| `UpdateAirportDB` (`internal/models/airports.go:55`) | Transaction: `DELETE FROM airports`, filtered inserts, commit, `airportCache.Clear()`, `go CreateDistanceCache()` | `airports` |
| `fetchAirports` (`internal/models/airports.go:102`) | Shared scanner (8 columns, fixed order) | — |
| `GetAllAirports` (`internal/models/airports.go:125`), `GetStandardAirports` (`internal/models/airports.go:131`), `GetCustomAirports` (`internal/models/airports.go:137`) | List queries | `airports_view`, `airports`, `airports_custom` |
| `AddCustomAirport` (`internal/models/airports.go:143`) | Rejects an exact `name` duplicate (`internal/models/airports.go:148-152`), then inserts | `airports_custom` |
| `UpdateCustomAirport` (`internal/models/airports.go:168`), `RemoveCustomAirport` (`internal/models/airports.go:178`) | Update or delete by code (`name`) | `airports_custom` |

**`internal/models/helpers.go`** (distance part)

| Method | Purpose | Tables / views |
|---|---|---|
| `Distance` (`internal/models/helpers.go:29`) | Order-independent cache key `max+min` (`internal/models/helpers.go:34-39`); looks up both airports; stores the result in `distanceCache` | via `GetAirportByID` |
| `UpdateFlightRecordsDistance` (`internal/models/helpers.go:65`) | Fills `logbook.distance` where it is `NULL` (startup) | `logbook` |
| `CreateDistanceCache` (`internal/models/helpers.go:106`) | Clears and pre-computes distances for every distinct departure/arrival pair | `logbook_view` |

### 4.4 UI

| Item | File | Notes |
|---|---|---|
| Route `/aircrafts` → `AircraftsPage` → `Aircrafts` | `app/ui/src/main.jsx:61`, `app/ui/src/pages/AircraftsPage.jsx:3-7` | Nav entry `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:45` |
| `Aircrafts` | `app/ui/src/components/Aircrafts/Aircrafts.jsx:9-26` | Two-column grid: `AircraftsTable` and `CategoriesTable` |
| `AircraftsTable` | `app/ui/src/components/Aircrafts/AircraftsTable.jsx:17-89` | `XDataGrid` `tableId='aircrafts'`, row id `reg`, CSV type `aircrafts` |
| `CategoriesTable` | `app/ui/src/components/Aircrafts/CategoriesTable.jsx:17-83` | `tableId='categories'`, row id `model` |
| `EditAircraftModal` | `app/ui/src/components/Aircrafts/EditAircraftModal.jsx:58-124` | Sends `model_change` (ignored by the server) to decide whether to invalidate `['logbook']` (`app/ui/src/components/Aircrafts/EditAircraftModal.jsx:38-40`) |
| `EditCategoriesModal` | `app/ui/src/components/Aircrafts/EditCategoriesModal.jsx:57-139` | 8 auto-fill switches (`app/ui/src/components/Aircrafts/EditCategoriesModal.jsx:69-80`) |
| Route `/airports` → `AirportsPage` → `Airports` | `app/ui/src/main.jsx:69`, `app/ui/src/pages/AirportsPage.jsx:3-7` | Nav entry `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:46` |
| `Airports` | `app/ui/src/components/Airports/Airports.jsx:13-49` | Inline `useQuery` with key `['airports']` (standard list) and `['custom-airports']` |
| `StandardAirportsTable` | `app/ui/src/components/Airports/StandardAirportsTable.jsx:11-54` | Row action `CopyAirportButton`, CSV type `airports` |
| `AirportsDB` | `app/ui/src/components/Airports/AirportsDB.jsx:22-72` | Source select (3 fixed URLs), "No ICAO Filter" switch, `UpdateAirportsDBButton` |
| `CustomAirportsTable` | `app/ui/src/components/Airports/CustomAirportsTable.jsx:13-61` | Edit/Delete menu, Add button, `tableId='custom-airports-2'` |
| `AddEditCustomAirportModal` | `app/ui/src/components/Airports/AddEditCustomAirportModal.jsx:61-131` | Code field is disabled when editing (`app/ui/src/components/Airports/AddEditCustomAirportModal.jsx:88`) |

| Query key | Fetcher | Owner | Invalidated by |
|---|---|---|---|
| `['aircrafts']` | `fetchAircrafts` | `app/ui/src/hooks/queries/useAircraftsQuery.js:4-11` | Both edit modals, `app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:45`, `app/ui/src/components/FlightRecord/DeleteFlightRecordButton.jsx:22`, `app/ui/src/components/Logbook/BulkEditButtons.jsx:51`, and all keys via `invalidateQueries()` in `app/ui/src/components/Import/RunImportButton.jsx:34` and `app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx:30` |
| `['models-categories']` | `fetchAircraftModelsCategories` | `app/ui/src/hooks/queries/useModelsCategoriesQuery.js:4-11` | Both edit modals, `app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:46`, `app/ui/src/components/Logbook/BulkEditButtons.jsx:52`, and all keys via `invalidateQueries()` in `app/ui/src/components/Import/RunImportButton.jsx:34` and `app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx:30` |
| `['airports']` | `fetchStandardAirports` **or** `fetchAirports` (see §11 #4) | `app/ui/src/components/Airports/Airports.jsx:15`, `app/ui/src/components/Map/SummaryFlightMap.jsx:30`, `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:72` | `app/ui/src/components/Airports/UpdateAirportsDBButton.jsx:17` |
| `['custom-airports']` | `fetchCustomAirports` | `app/ui/src/components/Airports/Airports.jsx:23` | `app/ui/src/components/Airports/AddEditCustomAirportModal.jsx:43`, `app/ui/src/components/Airports/DeleteCustomAirportButton.jsx:20` |
| `['airports', id]` | `fetchAirport` | `app/ui/src/components/FlightMap/FlightMap.jsx:41-46` | Nominally by prefix match on `['airports']` (`app/ui/src/components/Airports/UpdateAirportsDBButton.jsx:17`). In practice this has no effect: the entry is filled only by `queryClient.fetchQuery`, so it has no observers and is only marked stale, and `getAirportData` returns `getQueryData(['airports', id])` without a staleness check (`app/ui/src/components/FlightMap/FlightMap.jsx:36-38`). Entries live for `gcTime` (24 h). Custom-airport edits do not touch it. |

## 5. Data Model & Persistence

| Object | Columns (SQLite / MySQL type) | Evidence |
|---|---|---|
| `airports` | PK `icao` SmallText (TEXT / VARCHAR(255)); `iata` SmallText **indexed**; `name`, `city`, `country` SmallText; `elevation` SmallInt (INTEGER / SMALLINT); `lat`, `lon` Real (REAL / FLOAT) | `internal/driver/db_structure.go:55-65`, types `internal/driver/db_structure.go:6-15` |
| `airports_custom` | PK `name` (= code) SmallText; `full_name` SmallText `NOT NULL DEFAULT ''`; `city`, `country`, `elevation`, `lat`, `lon` | `internal/driver/db_structure.go:67-75` |
| `aircrafts` | PK `reg_name` SmallText; `aircraft_model` SmallText `NOT NULL`; `custom_categories` BigText (TEXT / VARCHAR(512)) `NOT NULL DEFAULT ''` | `internal/driver/db_structure.go:109-113` |
| `aircraft_categories` | PK `model` SmallText; `categories` BigText `NOT NULL`; `time_fields_auto_fill` FullText (JSON) | `internal/driver/db_structure.go:115-119` |
| `airports_view` | Same SQL for both engines: `airports UNION airports_custom` with `UPPER(name)` as `icao`/`iata` | `internal/driver/db_structure.go:229-242` |
| `aircrafts_view` | Two SQL variants: SQLite builds `categories` with `\|\|`, MySQL with `CONCAT`. `LEFT JOIN aircraft_categories`, `LEFT JOIN logbook`, `SUM(l.total_time)` | `internal/driver/db_structure.go:244-293` |
| `logbook` (read/written here) | `departure_place`, `arrival_place`, `aircraft_model`, `reg_name`, `distance` Real | `internal/driver/db_structure.go:26-31`, `internal/driver/db_structure.go:48` |
| Settings JSON (`settings2.settings`) | `airports_db_source`, `no_icao_filter` | `internal/models/structs.go:252-253` |
| In-memory `airportCache` | `sync.Map` from code to `Airport`. Process-global; cleared only by `UpdateAirportDB` (not by DB upload, §11 #25). | `internal/models/airports.go:13`, `internal/models/airports.go:95` |
| In-memory `distanceCache` | `sync.Map` from `max(dep,arr)+min(dep,arr)` to NM. Cleared only by `CreateDistanceCache`, which runs at startup and after `UpdateAirportDB` (not after DB upload, §11 #25). | `internal/models/helpers.go:26`, `internal/models/helpers.go:111`, `app/main.go:202`, `internal/models/airports.go:96` |

What persists and what does not: `logbook.distance` is computed server-side on insert (`internal/models/flightrecords.go:91`), on track reset (`app/handlers_flightrecord.go:168`) and, from the track points, on track upload (`app/handlers_flightrecord.go:137-148`). On update the server stores the client-supplied value as is (`internal/models/flightrecords.go:71`, `internal/models/flightrecords.go:79`). The UI gets that value from `/api/distance` when a place or enroute field changes (`app/ui/src/components/FlightRecord/PlaceField.jsx:77-80`, only when the result is non-zero and `track === null`; `app/ui/src/components/FlightRecord/CustomFields.jsx:40-41`). The stored value is never recomputed when airport data changes. The only exception is `NULL` values, which are filled at startup (`internal/models/helpers.go:69`). Both caches are lost on restart.

## 6. Data Flow

| Operation | Path |
|---|---|
| List aircraft | `app/ui/src/components/Aircrafts/Aircrafts.jsx:10` → `useAircraftsQuery` → `fetchAircrafts` (`app/ui/src/util/http/aircraft.jsx:5-13`) → `GET /api/aircraft/list` → `HandlerApiAircraftList` → `GetAircrafts` → `aircrafts_view` |
| Save type categories | `app/ui/src/components/Aircrafts/EditCategoriesModal.jsx:36` → `updateAircraftModelsCategories` (`app/ui/src/util/http/aircraft.jsx:15-23`) → `PUT /api/aircraft/models-categories` → `UpdateAircraftModelsCategories` → `UPDATE aircraft_categories` → invalidate `['aircrafts']`, `['models-categories']` |
| Save aircraft | `app/ui/src/components/Aircrafts/EditAircraftModal.jsx:34` → `updateAircraft` (`app/ui/src/util/http/aircraft.jsx:35-43`) → `PUT /api/aircraft/update` → `UpdateAircraft` → `UPDATE aircrafts` (+ `UPDATE logbook`) → invalidate `['aircrafts']`, `['models-categories']`, optionally `['logbook']` |
| Refresh airport DB | `app/ui/src/components/Airports/UpdateAirportsDBButton.jsx:15` → `updateAirportsDB` (`app/ui/src/util/http/airport.jsx:45-52`) → `POST /api/airport/update-db` → `GetSettings` → `downloadAirportDB` → `parseJSONAirports`/`parseCSVAirports` → `UpdateAirportDB` → invalidate `['airports']` |
| Save DB source settings | `app/ui/src/components/Airports/AirportsDB.jsx:35` → `updateAirportsDBSettings` (`app/ui/src/util/http/settings.jsx:38-46`) → `PUT /api/settings/airports` → `HandlerApiSettingsAirports` → `UpdateSettings` → invalidate `['settings']` |
| Add/edit custom airport | `app/ui/src/components/Airports/AddEditCustomAirportModal.jsx:39` → `createCustomAirport`/`updateCustomAirport` (`app/ui/src/util/http/airport.jsx:54-72`) → `POST`/`PUT /api/airport/custom` → `AddCustomAirport`/`UpdateCustomAirport` → `airports_custom` → invalidate `['custom-airports']` |
| Delete custom airport | `app/ui/src/components/Airports/DeleteCustomAirportButton.jsx:18` → `deleteCustomAirport` (`app/ui/src/util/http/airport.jsx:74-82`) → `DELETE /api/airport/custom` → `RemoveCustomAirport` |
| Airport by code (maps) | `app/ui/src/components/FlightMap/FlightMap.jsx:41-46` → `fetchAirport` (`app/ui/src/util/http/airport.jsx:5-13`) → `GET /api/airport/{id}` → `GetAirportByID` → `airportCache` / `airports_view` |
| Leg distance (UI) | `app/ui/src/hooks/useCustomFields.jsx:48` → `fetchDistance` (`app/ui/src/util/http/logbook.jsx:152-164`) → `GET /api/distance/{dep}/{arr}` → `DBModel.Distance` → `distanceCache` / `GetAirportByID` → `utils.Distance` |
| Distance on insert/import | `InsertFlightRecord` (`internal/models/flightrecords.go:91`), import (`app/handlers_import.go:190`), track reset (`app/handlers_flightrecord.go:168`) → `DBModel.Distance` |
| Distance on update | Place or enroute field change: `app/ui/src/components/FlightRecord/PlaceField.jsx:77-80` / `app/ui/src/components/FlightRecord/CustomFields.jsx:40-41` → `calculateDistance` (`app/ui/src/hooks/useCustomFields.jsx:36-56`) → `GET /api/distance/{dep}/{arr}` per leg → `handleChange("distance", …)` → saved with the flight → `UpdateFlightRecord` writes `distance = ?` from the request body without recomputing (`internal/models/flightrecords.go:71`, `internal/models/flightrecords.go:79`) |

## 7. Config & Constants

| Name | Value | Kind | Evidence |
|---|---|---|---|
| Airport DB source (setting) | default `https://github.com/vsimakhin/Airports/raw/master/airports.json` | (configurable) via `airports_db_source` | `internal/models/models_defaults.go:178-181` |
| Fallback source when `""` (first-run download) | the same URL | (hardcoded) | `app/handlers_airport.go:73-75`, `app/main.go:178` |
| UI source options | vsimakhin JSON, mwgg JSON, OurAirports CSV | (hardcoded) list in UI | `app/ui/src/components/Airports/AirportsDB.jsx:16-20` |
| Parser selection | `strings.Contains(source, "airports.json")` → JSON parser, anything else → CSV parser | (hardcoded) | `app/handlers_airport.go:96-99` |
| CSV column indices | id 1, name 3, lat 4, lon 5, elev 6, country 8, city 10, IATA 13, ICAO 14 | (hardcoded) | `app/handlers_airport.go:136-147` |
| ICAO filter | `^[A-Z]+$` and length 4, applied unless `no_icao_filter` is set | (configurable) toggle; rule (hardcoded) | `internal/models/airports.go:71-73` |
| ICAO filter at first-run download | `noICAOFilter=false`, i.e. filter on | (hardcoded) | `app/main.go:185` |
| Download timeout | 300 s | (hardcoded) | `app/handlers_airport.go:77` |
| `UpdateAirportDB` transaction context | 300 s | (hardcoded) | `internal/models/airports.go:56` |
| Default DB query timeout | 60 s (`DefaultTimeout`) | (hardcoded) | `internal/models/helpers.go:14` |
| `UpdateFlightRecordsDistance` timeout | 60 s | (hardcoded) | `internal/models/helpers.go:66` |
| `CreateDistanceCache` timeout | 120 s | (hardcoded) | `internal/models/helpers.go:107` |
| Earth radius | 6378100.0 m | (hardcoded) | `internal/utils/distance.go:20` |
| Unit conversion | `/1000/1.852` → NM | (hardcoded) | `internal/utils/distance.go:23` |
| gzip level for airport lists | `middleware.Compress(5)` | (hardcoded) | `app/routes.go:94-96` |
| UI `staleTime`/`gcTime` | 3600000 ms (1 h) for aircraft, categories and airport lists | (hardcoded) | `app/ui/src/hooks/queries/useAircraftsQuery.js:7-8`, `app/ui/src/hooks/queries/useModelsCategoriesQuery.js:7-8`, `app/ui/src/components/Airports/Airports.jsx:17-18`, `app/ui/src/components/Airports/Airports.jsx:25-26` |
| UI per-airport cache | 86400000 ms (24 h) | (hardcoded) | `app/ui/src/components/FlightMap/FlightMap.jsx:44-45` |
| `refetchOnWindowFocus` | `false` for aircraft hooks | (hardcoded) | `app/ui/src/hooks/queries/useAircraftsQuery.js:9`, `app/ui/src/hooks/queries/useModelsCategoriesQuery.js:9` |

## 8. Error Handling & Edge Cases

| Case | Behaviour | Evidence |
|---|---|---|
| Handler or DB error | `handleError` logs it with the caller's file:line and returns 500 `JSONResponse{ok:false,message}` | `app/helpers.go:53-63` |
| Unknown airport code via the API | 404 `{"ok":false,"message":"Airport not found"}` and a warning in the log | `app/handlers_airport.go:29-34` |
| Unknown airport code inside `Distance` / `calculateNightTime` | No error: the zero-value airport (0°, 0°) is used for that end (§11 #1) | `internal/models/airports.go:32-35`, `internal/models/helpers.go:45-51`, `app/helpers.go:73-86` |
| Same departure and arrival | Distance 0 without any lookup | `internal/models/helpers.go:30-32` |
| Download HTTP error status | Not checked; the body is parsed as if it were data | `app/handlers_airport.go:85-99` |
| CSV row with ≤ 13 fields | Skipped (`len(record) <= csvIATA`). The guard is off by one: a 14-field row passes it and `record[csvICAO]` (index 14) panics with index out of range (§11 #26) | `app/handlers_airport.go:145-146`, `app/handlers_airport.go:157-161` |
| CSV row without ICAO and IATA | Skipped if the name contains `DUPLICATE`; otherwise ICAO is set to `"<NAME> <id>"`, which the ICAO filter then drops | `app/handlers_airport.go:165-170` |
| CSV numeric parse errors | Ignored; the field becomes 0 | `app/handlers_airport.go:176-178` |
| Insert failure during DB update | Rollback, so the previous airports are kept | `internal/models/airports.go:81-86` |
| Duplicate custom code | Exact-match check returns an error ("already exists") → 500 | `internal/models/airports.go:148-152` |
| Updating a type that has no row | `UPDATE` matches 0 rows and still reports success | `internal/models/aircrafts.go:158-163` |
| Updating an unknown registration | `GetAircraft` returns `sql.ErrNoRows` → 500 | `internal/models/aircrafts.go:184-187` |
| Empty list results | Go `nil` slices serialize as `null`; aircraft hooks map that to `[]` (`select`), but the airport queries in `app/ui/src/components/Airports/Airports.jsx` have no `select`. Consumers that pass their own `select` lose the `\|\| []` guard: `AircraftCategories` calls `items.forEach` on `null` for an empty list, so its queries end in a select error and the picker shows no options | `app/ui/src/hooks/queries/useAircraftsQuery.js:10`, `app/ui/src/hooks/queries/useAircraftsQuery.js:13-17`, `app/ui/src/components/Airports/Airports.jsx:14-27`, `app/ui/src/components/UIElements/AircraftCategories.jsx:6-9`, `app/ui/src/components/UIElements/AircraftCategories.jsx:28-34` |
| UI save failure | `mutateAsync` rejects before `onClose()`, so the dialog stays open | `app/ui/src/components/Aircrafts/EditAircraftModal.jsx:46-49`, `app/ui/src/components/Airports/AddEditCustomAirportModal.jsx:49-52` |

## 9. Integration Points

| System doc | What crosses the boundary |
|---|---|
| `ARCHITECTURE_APPLICATION.md` | Startup airport check/download and distance jobs (`app/main.go:170-206`); route registration (`app/routes.go:74-102`, `app/routes.go:162`); `writeJSON`/`writeOkResponse`/`handleError` (`app/helpers.go:16-63`) |
| `ARCHITECTURE_DATABASE.md` | Table and view definitions with per-engine SQL (`internal/driver/db_structure.go:55-119`, `internal/driver/db_structure.go:229-293`); `validateDB` creates them (`internal/driver/driver.go:60-78`); `ContextWithDefaultTimeout` (`internal/models/helpers.go:22`) |
| `ARCHITECTURE_AUTH.md` | Every endpoint here sits behind `app.Auth` (`app/routes.go:27`); UI fetchers send `Bearer` tokens (`app/ui/src/util/http/airport.jsx:9`) |
| `ARCHITECTURE_SETTINGS.md` | `airports_db_source` / `no_icao_filter` are stored in settings (`internal/models/structs.go:252-253`), with the dedicated endpoint `HandlerApiSettingsAirports` (`app/handlers_settings.go:77`), defaults (`internal/models/models_defaults.go:178-182`) and the `['settings']` query used by `AirportsDB` (`app/ui/src/components/Airports/AirportsDB.jsx:24`) |
| `ARCHITECTURE_LOGBOOK.md` | Flight CRUD calls `GenerateAircraftTable` (`app/handlers_flightrecord.go:67`, `app/handlers_flightrecord.go:95`, `app/handlers_flightrecord.go:121`); distance is computed on insert (`internal/models/flightrecords.go:91`), on track reset (`app/handlers_flightrecord.go:168`) and from track logs (`app/handlers_flightrecord.go:137-140`); night time uses `GetAirportByID` (`app/helpers.go:73`, `app/helpers.go:83`); type auto-fill (`app/ui/src/components/FlightRecord/FlightRecordDetails.jsx:61-79`); type options come from the logbook (`app/ui/src/components/UIElements/AircraftType.jsx:18-19`); enroute leg distances (`app/ui/src/hooks/useCustomFields.jsx:36-56`) |
| `ARCHITECTURE_IMPORT.md` | Import computes distance (`app/handlers_import.go:190`) and refreshes aircraft (`app/handlers_import.go:347`) |
| `ARCHITECTURE_STATS_AND_MAP.md` | `fetchAirports` under `['airports']` for the map and dashboard (`app/ui/src/components/Map/SummaryFlightMap.jsx:29-34`, `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:71-76`); per-code lookups in `app/ui/src/components/FlightMap/FlightMap.jsx:26-52`; aircraft and categories queries in `app/ui/src/components/Stats/ByAircraft/TotalsByAircraft.jsx:13-14` and `app/ui/src/components/UIElements/Filters.jsx:145-146` |
| `ARCHITECTURE_CURRENCY_LICENSING.md` | Currency evaluates category filters against `useAircraftsQuery` data (`app/ui/src/components/Currency/Currency.jsx:24`, `app/ui/src/components/Currency/helpers.jsx:69-73`) |
| `ARCHITECTURE_PDF_EXPORT.md` | CSV export mappers `aircrafts`, `categories`, `airports`, `custom-airports` (`app/ui/src/components/UIElements/CSVExportButton.jsx:30-59`) |
| `ARCHITECTURE_FRONTEND.md` | Query-hook pattern, `handleFetch` (`app/ui/src/util/http/http.jsx:13`), `XDataGrid`, `useDialogs`, `Select` (multi-select values joined with `", "`, `app/ui/src/components/UIElements/Select.jsx:34`) |

## 10. Testing

| Item | State |
|---|---|
| Go tests for this system | None. The only Go tests are `app/handlers_import_test.go` (`TestParseName`, `app/handlers_import_test.go:7`) and `internal/nighttime/nighttime_test.go`. |
| UI tests for this system | None. Existing UI tests: `app/ui/src/hooks/*.test.jsx`, `app/ui/src/hooks/useLocalStorageState/useStorageState.test.tsx`, `app/ui/src/components/Currency/helpers.test.jsx`. `fetchDistance` is only mocked (`app/ui/src/hooks/useCustomFields.test.jsx:29`). |
| How to run | Backend: `make test` → `go test -v ./... -coverpkg=./...` (`Makefile:32-33`); `app/ui/dist` must exist first (`make build_ui`). UI: `npm run test` / `npm run test:run` in `app/ui` (`app/ui/package.json:11-12`). |
| Cheapest gaps to close | `utils.Distance` (pure function); `parseJSONAirports` / `parseCSVAirports` (pure apart from the receiver); `DBModel.Distance` behaviour for unknown codes; `GenerateAircraftTable` against a SQLite DB opened through `driver.OpenDB`. |

## 11. Known Issues & Tech Debt

| # | Issue | Location | Status (Confirmed/Suspected) | Severity | verified: 2026-10-14 |
|---|---|---|---|---|---|
| 1 | Distance to an **unknown code** is measured from 0°N 0°E. `GetAirportByID` returns a zero `Airport` with `nil` error on no match, and `Distance` only bails out on `err != nil`, so it computes and caches a bogus non-zero distance. That value is stored in `logbook.distance` on insert. The same zero-value lookup feeds `calculateNightTime` (`app/helpers.go:73-86`, which also checks only `err != nil`), so `POST /api/logbook/night` (`app/routes.go:44`, `app/handlers_flightrecord.go:39`) and import night-time recalculation (`app/handlers_import.go:193-212`) compute night time at 0°N 0°E without an error. On import this can overwrite the CSV night time and move day landings to night. See also `ARCHITECTURE_DATABASE.md` §11 #6, `ARCHITECTURE_IMPORT.md` §11 #4, `ARCHITECTURE_APPLICATION.md` §11 #15. | `internal/models/airports.go:32-35`, `internal/models/helpers.go:45-52`, `internal/models/flightrecords.go:91`, `app/helpers.go:73-86`, `app/handlers_import.go:193-212` | Confirmed: all code paths read directly | MAJOR | verified: 2026-10-14 |
| 2 | First start **exits without serving** when the airport download fails (offline first run, or an empty `airports` table later). `main` `return`s on download or update error. See also `ARCHITECTURE_APPLICATION.md` §11 #3. | `app/main.go:176-191` | Confirmed: `return` precedes `app.serve()` | MAJOR | verified: 2026-10-14 |
| 3 | `AirportsDB` autosave sends the **previous** settings. `handleChange` calls `setSettings` and then immediately `saveSettings()`, whose `mutationFn` closes over the not-yet-updated `settings`. The latest change is persisted only after the next change, and "Update DB" uses stale values. See also `ARCHITECTURE_SETTINGS.md` §11 #3 (labelled Suspected there). | `app/ui/src/components/Airports/AirportsDB.jsx:34-46` | Confirmed: React state updates are not visible synchronously in the same handler; `mutateAsync` runs the `mutationFn` of the last render, which closes over the previous `settings` (`app/ui/src/components/Airports/AirportsDB.jsx:35`, `app/ui/src/components/Airports/AirportsDB.jsx:44-45`) | MAJOR | verified: 2026-10-14 |
| 4 | Query key `['airports']` is used for **two different datasets**: standard list on the Airports page, all airports (standard + custom) on the Map and Dashboard. With 1 h staleTime, whichever loads first is served to the others. Custom airports can then show up in "Standard Airports", or be missing from the dashboard/map country counts. See also `ARCHITECTURE_STATS_AND_MAP.md` §11 #2. | `app/ui/src/components/Airports/Airports.jsx:15-16`, `app/ui/src/components/Map/SummaryFlightMap.jsx:30-31`, `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:72-73` | Confirmed: same key, different `queryFn` | MAJOR | verified: 2026-10-14 |
| 5 | Custom airport add/update/delete does not clear `airportCache` or `distanceCache`. Edited coordinates or deleted airports keep being served (distance, night time, `/api/airport/{id}`) until restart or an airport DB update. See also `ARCHITECTURE_DATABASE.md` §11 #6, `ARCHITECTURE_STATS_AND_MAP.md` §11 #16, `RULE_DEVELOPMENT.md` §13 #6. | `internal/models/airports.go:143-184` vs `internal/models/airports.go:94-96` | Confirmed: no cache call in the custom CRUD methods | MAJOR | verified: 2026-10-14 |
| 6 | `UpdateAircraftModelsCategories` ignores the `ExecContext` error and always returns `nil`, so a failed write is reported as success. | `internal/models/aircrafts.go:161-163` | Confirmed: `_, err = m.DB.ExecContext(…)` is followed by `return nil`. Rated like the other swallowed-error items (#8, #11), because it needs a DB write failure on a single-row `UPDATE` | MINOR | verified: 2026-10-14 |
| 7 | The airport download has no HTTP status check and there is no empty-result guard before `DELETE FROM airports`. A response that parses to zero rows commits an **empty airport table**. | `app/handlers_airport.go:85-99`, `internal/models/airports.go:65-92` | Confirmed (missing checks). Whether a real error body (e.g. HTML 404 for the CSV source) parses to zero rows is Suspected; confirm by feeding such a body to `parseCSVAirports`. | MAJOR | verified: 2026-10-14 |
| 8 | `GetAirportDBRecordsCount` returns `nil` even when the query fails, so the error branch in `main` is dead and a failing count looks like "0 rows" and triggers a download. See also `ARCHITECTURE_APPLICATION.md` §11 #14, `ARCHITECTURE_DATABASE.md` §11 #23. | `internal/models/airports.go:50-51`, `app/main.go:171-175` | Confirmed: `return count, nil` after `Scan` (`internal/models/airports.go:50-51`) | MINOR | verified: 2026-10-14 |
| 9 | After a **type change**, `UpdateAircraft` does not run `GenerateAircraftTable`. The new type gets no `aircraft_categories` row, so it is missing from "Types & Categories" (INNER JOIN) until another flight save or import, even though the modal tells the user to set categories there. | `internal/models/aircrafts.go:179-203`, `internal/models/aircrafts.go:96`, `app/ui/src/components/Aircrafts/EditAircraftModal.jsx:115-117` | Confirmed: `HandlerApiAircraftUpdate` calls only `UpdateAircraft` (`app/handlers_aircraft.go:58`), which has no `GenerateAircraftTable` call, and the categories list uses `INNER JOIN` | MINOR | verified: 2026-10-14 |
| 10 | `UpdateAircraft` runs two writes (`aircrafts`, then `logbook`) without a transaction, so a partial update is possible. | `internal/models/aircrafts.go:190-201` | Confirmed: two `m.DB.ExecContext` calls (`internal/models/aircrafts.go:193`, `internal/models/aircrafts.go:200`), no `Begin` | MINOR | verified: 2026-10-14 |
| 11 | All callers discard `GenerateAircraftTable` errors (`_ =`), so the aircraft list can silently drift from the logbook. | `app/handlers_flightrecord.go:67`, `app/handlers_flightrecord.go:95`, `app/handlers_flightrecord.go:121`, `app/handlers_import.go:347` | Confirmed: `_ = app.db.GenerateAircraftTable()` at all four sites | MINOR | verified: 2026-10-14 |
| 12 | Category strings are split on `','` without trimming, but saved joined with `", "`. Each save after changing the field adds leading spaces to the stored chips (` B` no longer matches option `B`, so duplicates become possible). Consumers trim, which limits the impact to display and editing. | `app/ui/src/components/Aircrafts/EditAircraftModal.jsx:91`, `app/ui/src/components/Aircrafts/EditAircraftModal.jsx:100`, `app/ui/src/components/Aircrafts/EditCategoriesModal.jsx:106`, `app/ui/src/components/UIElements/Select.jsx:34` | Confirmed: `split(',')` without `trim` at the three sites vs `value.join(", ")` in `Select` | MINOR | verified: 2026-10-14 |
| 13 | `useErrorNotification` gets the wrong prop names (`isStandardAirportsError`, `isSaveError`, …), so load and save errors on the Airports page are never shown. See also `ARCHITECTURE_SETTINGS.md` §11 #16. | `app/ui/src/components/Airports/Airports.jsx:20`, `app/ui/src/components/Airports/Airports.jsx:28`, `app/ui/src/components/Airports/AirportsDB.jsx:40`, hook signature `app/ui/src/hooks/useAppNotifications.jsx:4` | Confirmed: the hook destructures `isError`/`error` (`app/ui/src/hooks/useAppNotifications.jsx:4`), so the renamed props are ignored | MINOR | verified: 2026-10-14 |
| 14 | Custom airport mutations invalidate only `['custom-airports']`, not the all-airports `['airports']` list used by the map and dashboard, which stay stale for up to 1 h. See also `ARCHITECTURE_STATS_AND_MAP.md` §11 #2, #16. | `app/ui/src/components/Airports/AddEditCustomAirportModal.jsx:43`, `app/ui/src/components/Airports/DeleteCustomAirportButton.jsx:20` | Confirmed: both `onSuccess` handlers invalidate only `['custom-airports']` | MINOR | verified: 2026-10-14 |
| 15 | The "custom-airports" CSV export omits the **Code** column, the only identifier of a custom airport. See also `ARCHITECTURE_PDF_EXPORT.md` §11 #12. | `app/ui/src/components/UIElements/CSVExportButton.jsx:52-59` | Confirmed: the mapper has no `row.icao`, where `GetCustomAirports` puts the code (`internal/models/airports.go:138`) | MINOR | verified: 2026-10-14 |
| 16 | No server-side validation of custom airport input: empty code, mixed case and coordinate range are not checked. The UI `required` flag is not enforced on save. | `internal/models/airports.go:143-165`, `app/ui/src/components/Airports/AddEditCustomAirportModal.jsx:28-37` | Confirmed: `AddCustomAirport` checks only for an existing `name`, `UpdateCustomAirport` checks nothing, and the Save handler sends the payload unvalidated (`app/ui/src/components/Airports/AddEditCustomAirportModal.jsx:49-52`) | MINOR | verified: 2026-10-14 |
| 17 | Deleting a flight invalidates `['aircrafts']` but not `['models-categories']`, so Types & Categories totals stay stale. | `app/ui/src/components/FlightRecord/DeleteFlightRecordButton.jsx:21-22` | Confirmed: only `['logbook']` and `['aircrafts']` are invalidated (`app/ui/src/components/FlightRecord/DeleteFlightRecordButton.jsx:21-22`) | MINOR | verified: 2026-10-14 |
| 18 | Distance to an **empty** code (one place blank) runs `WHERE icao = '' or iata = ''`, which matches an arbitrary airport with an empty IATA code. | `internal/models/airports.go:26-28`, `internal/models/helpers.go:45-46` | Suspected: confirm that `airports` contains rows with `iata = ''` (very likely for both JSON sources) | MINOR | verified: 2026-10-14 |
| 19 | Lookup case sensitivity depends on the engine. `/api/distance` and internal callers pass codes unchanged; SQLite `=` is case-sensitive, MySQL's default collation is not. A lower-case code therefore misses on SQLite and falls into #1. See also `ARCHITECTURE_APPLICATION.md` §11 #15. | `app/handlers_aux.go:42-44`, `internal/models/airports.go:26-28`, `internal/driver/db_operations.go:30` | Confirmed for SQLite: the DDL sets no `COLLATE` (`internal/driver/db_operations.go:30`, `internal/driver/db_operations.go:32`, column types `internal/driver/db_structure.go:6-15`), so TEXT `=` uses BINARY. MySQL depends on the server collation (Suspected: confirm with `/api/distance/eddf/lkpr`) | MINOR | verified: 2026-10-14 |
| 20 | When a standard and a custom airport share a code (e.g. after "Copy to Custom Airport" without changing the code), `QueryRow` without `ORDER BY` picks either one. | `internal/models/airports.go:26-28`, `app/ui/src/components/Airports/CopyAirportButton.jsx:15` | Suspected: confirm which row each engine returns first for the `UNION` | MINOR | verified: 2026-10-14 |
| 21 | The CSV parser does not skip a header row. With `no_icao_filter` on, the header line could be inserted as an airport. | `app/handlers_airport.go:149-190` | Suspected: confirm the first line of the OurAirports CSV | MINOR | verified: 2026-10-14 |
| 22 | A duplicate ICAO in the source aborts the whole update: plain `INSERT` into PK `icao` → rollback. | `internal/models/airports.go:78-86`, `internal/driver/db_structure.go:55` | Suspected: confirm whether the sources contain duplicate codes | MINOR | verified: 2026-10-14 |
| 23 | The distance cache key `max+min` has no separator, so different code pairs can collide (e.g. 3-letter + 4-letter codes). See also `ARCHITECTURE_DATABASE.md` §11 #15. | `internal/models/helpers.go:34-39` | Confirmed (structural): `ABCD`+`EFG` and `EFGA`+`BCD` both produce key `EFGABCD`. Whether real airport data collides is Suspected: needs a real colliding pair | MINOR | verified: 2026-10-14 |
| 24 | `Settings.AircraftClasses` is legacy: it is declared but referenced nowhere else in `app/` or `internal/`. | `internal/models/structs.go:227` | Confirmed: grep finds only the declaration | MINOR | verified: 2026-10-14 |
| 25 | DB upload (`HandlerApiUploadDB`) replaces the connection without `airportCache.Clear()` or `CreateDistanceCache()`, so airports and distances from the old DB are served until restart or an airport DB update. The startup steps are not re-run either: the empty-`airports` bootstrap (`app/main.go:170-191`), `CreateDistanceCache` and `UpdateFlightRecordsDistance` (`app/main.go:202-206`). See also `ARCHITECTURE_APPLICATION.md` §11 #2, `ARCHITECTURE_DATABASE.md` §11 #8, `RULE_DEVELOPMENT.md` §13 #9. | `app/handlers_db.go:36-58`, `internal/models/airports.go:13`, `internal/models/helpers.go:26` | Confirmed: the handler only closes the DB, writes the file and sets `app.db` (`app/handlers_db.go:58`), with no cache call | MINOR | verified: 2026-10-14 |
| 26 | The CSV length guard checks `csvIATA` (13) but then reads `record[csvICAO]` (14). A 14-field row passes the guard and panics with index out of range. `csv.Reader` requires every record to have the first record's field count, so a 14-column source makes every row panic in `POST /api/airport/update-db` (there is no `middleware.Recoverer` in `app/routes.go`). | `app/handlers_airport.go:145-161` | Confirmed (code path); needs a 14-column source to trigger | MINOR | verified: 2026-10-14 |
| 27 | `UpdateFlightRecordsDistance` returns on a `Scan` error without `tx.Rollback()`, which leaks an open transaction. A NULL `departure_place`/`arrival_place` in a row with `distance IS NULL` triggers it, because both are scanned into Go strings. See also `ARCHITECTURE_DATABASE.md` §11 #13. | `internal/models/helpers.go:78-87`, `internal/driver/db_structure.go:26`, `internal/driver/db_structure.go:28` | Confirmed: `return` at `internal/models/helpers.go:86` without `Rollback`. Whether real data has such a row is Suspected: needs a row with `distance IS NULL` and a NULL place | MINOR | verified: 2026-10-14 |

## 12. Rules for Future Development

**Recipe A: add a column to airports (standard and/or custom)**
1. Add the `Column` in `internal/driver/db_structure.go` (`airportsTable` `internal/driver/db_structure.go:55`, `customAirportsTable` `internal/driver/db_structure.go:67`) using a `ColumnType` that has both SQLite and MySQL variants (`internal/driver/db_structure.go:6-15`).
2. Update **both** branches of `airportsView` (`internal/driver/db_structure.go:229-242`). The two `UNION` halves must keep the same column count and order.
3. Bump `schemaVersion` (`internal/driver/db_structure.go:4`) so that `validateDB` adds columns and recreates views (`internal/driver/driver.go:56-78`).
4. Add the field to `models.Airport` (`internal/models/structs.go:91-100`).
5. Update every 8-column `SELECT` and `Scan` in `internal/models/airports.go`: `internal/models/airports.go:26-30`, `internal/models/airports.go:114-115`, `internal/models/airports.go:126`, `internal/models/airports.go:132`, `internal/models/airports.go:138`, the bulk `INSERT` `internal/models/airports.go:78-83`, and `AddCustomAirport` / `UpdateCustomAirport` (`internal/models/airports.go:154-158`, `internal/models/airports.go:172-173`).
6. Map the field in `parseJSONAirports` / `parseCSVAirports` (`app/handlers_airport.go:103-130`, `app/handlers_airport.go:136-189`).
7. UI: grid columns (`app/ui/src/components/Airports/StandardAirportsTable.jsx:27-34`, `app/ui/src/components/Airports/CustomAirportsTable.jsx:30-36`), modal payload and fields (`app/ui/src/components/Airports/AddEditCustomAirportModal.jsx:29-37`, `app/ui/src/components/Airports/AddEditCustomAirportModal.jsx:81-126`), CSV mappers (`app/ui/src/components/UIElements/CSVExportButton.jsx:41-59`).

**Recipe B: add or change an airport DB source**
1. Add the URL to `airportsDBOptions` (`app/ui/src/components/Airports/AirportsDB.jsx:16-20`).
2. Check parser routing at `app/handlers_airport.go:96`: any URL not containing the substring `"airports.json"` goes to the OurAirports CSV parser with fixed indices. For a new format, add a parser and an explicit branch.
3. Make sure the result passes the ICAO filter (`internal/models/airports.go:71-76`) or document that `no_icao_filter` is needed.
4. To change the **default** source, update the settings default `internal/models/models_defaults.go:178-181` (applied only when `airports_db_source` is empty, so existing installs keep their stored value) and the first-run fallback `app/handlers_airport.go:73-75` (used by `app/main.go:178`), and move the "(default)" marker in `README.md:286-289`.
5. Update the README "Airports Databases" section (`README.md:284-291`).

**Recipe C: add a per-type (category) attribute**
1. Add a column to `aircraftCategoriesTable` (`internal/driver/db_structure.go:115-119`) and bump `schemaVersion`. For boolean flags, consider extending the `time_fields_auto_fill` JSON instead; that needs no schema change (`internal/models/structs.go:313-322`).
2. Add the field to `models.Category` (`internal/models/structs.go:310-324`).
3. `GenerateAircraftTable` inserts only `(model, categories)` (`internal/models/aircrafts.go:70-75`). Give a `NOT NULL` column a `DEFAULT` or extend that `INSERT`, because its error is discarded (§11 #11).
4. Update `GetAircraftModelsCategories`. A new column must go into **`SELECT` and `GROUP BY`** (`internal/models/aircrafts.go:91-98`) as well as `Scan`.
5. Update `UpdateAircraftModelsCategories` (`internal/models/aircrafts.go:153-164`) and fix its swallowed error while you are there (§11 #6).
6. UI: `app/ui/src/components/Aircrafts/EditCategoriesModal.jsx`, plus consumers such as `app/ui/src/components/FlightRecord/FlightRecordDetails.jsx:61-79`. If the attribute should be exported, extend the CSV mapper `categories` (`app/ui/src/components/UIElements/CSVExportButton.jsx:36-39`).

**Recipe D: add a per-registration attribute**
1. Add a column to `aircraftsTable` (`internal/driver/db_structure.go:109-113`) and to **both** `aircraftsView` variants (`internal/driver/db_structure.go:246-291`), including their `GROUP BY`. Bump `schemaVersion`.
2. Add the field to `models.Aircraft` (`internal/models/structs.go:301-308`).
3. Give a `NOT NULL` column a `DEFAULT`: `GenerateAircraftTable` inserts only `(reg_name, aircraft_model)` (`internal/models/aircrafts.go:18`), and callers discard its error (§11 #11).
4. Update `GetAircrafts` / `GetAircraft` `Scan` (`internal/models/aircrafts.go:129-141`, `internal/models/aircrafts.go:169-175`) and `UpdateAircraft` (`internal/models/aircrafts.go:190-193`).
5. UI: grid column in `app/ui/src/components/Aircrafts/AircraftsTable.jsx:39-69`; form field in `app/ui/src/components/Aircrafts/EditAircraftModal.jsx:78-104` (the payload is the whole row state, `app/ui/src/components/Aircrafts/EditAircraftModal.jsx:59`, `app/ui/src/components/Aircrafts/EditAircraftModal.jsx:72`); CSV mapper `aircrafts` (`app/ui/src/components/UIElements/CSVExportButton.jsx:30-34`). `EditAircraftModal` already invalidates `['aircrafts']` and `['models-categories']` (`app/ui/src/components/Aircrafts/EditAircraftModal.jsx:36-37`).
6. Remember that `GenerateAircraftTable` **deletes** the row when the registration leaves the logbook (`internal/models/aircrafts.go:33-38`), so user data stored here is lost at that point.

**Recipe E: add an endpoint**
1. Write a handler in `app/handlers_aircraft.go` or `app/handlers_airport.go` using `writeJSON` / `writeOkResponse` / `handleError` (`app/helpers.go:16-63`). Follow every `app.handleError(w, err)` with `return`: the helper only writes the response (`app/helpers.go:53-63`). Answer mutations with `writeOkResponse` (`app/helpers.go:45-51`), not with the bare strings of `app/handlers_airport.go:213`, `app/handlers_airport.go:231`, `app/handlers_airport.go:249`, `app/handlers_airport.go:267`.
2. Register it inside the existing `r.Route("/aircraft" …)` or `r.Route("/airport" …)` block (`app/routes.go:74-79`, `app/routes.go:93-102`), so it stays under `app.Auth` (`app/routes.go:27`). Add `Compress(5)` for large lists.
3. Add a fetcher in `app/ui/src/util/http/aircraft.jsx` or `app/ui/src/util/http/airport.jsx`. `app/ui/src/util/http/index.js` re-exports `logbook`, `licensing` and `aircraft` but **not** `airport`, which is imported by direct path.
4. For shared reads, add a hook in `app/ui/src/hooks/queries/` and export it from `app/ui/src/hooks/queries/index.js` (aircraft hooks: `app/ui/src/hooks/queries/index.js:5-6`).

**Recipe F: change airport data or coordinates programmatically**
1. Clear `airportCache` and rebuild `distanceCache` the same way `UpdateAirportDB` does (`internal/models/airports.go:94-96`).
2. Decide whether stored `logbook.distance` must be recomputed. Nothing does that today except for `NULL` values (`internal/models/helpers.go:69`).

**Cross-check list (every change here)**
- [ ] SQL valid on **SQLite and MySQL**: view variants differ (`||` vs `CONCAT`), collations differ, and MySQL `VARCHAR(255/512)` limits apply.
- [ ] `schemaVersion` bumped for any table or view change (`internal/driver/db_structure.go:4`); type changes need an explicit migration (see `ARCHITECTURE_DATABASE.md`).
- [ ] New route inside the `/api` group under `app.Auth` (`app/routes.go:26-27`).
- [ ] Every `handleError` followed by `return`; mutations reply with `writeOkResponse` (`app/helpers.go:45-63`).
- [ ] UI invalidation: `['aircrafts']`, `['models-categories']`, `['airports']` (all + standard, see §11 #4), `['custom-airports']`, `['airports', id]`, `['logbook']`, `['settings']`.
- [ ] In-memory caches (`airportCache`, `distanceCache`) invalidated when airport data changes.
- [ ] `GenerateAircraftTable` is still the only place that derives aircraft from the logbook; flight CRUD and import call it.
- [ ] `CHANGELOG.md` `[Unreleased]` bullet (`- New:`/`- Update:`/`- Fix:`) plus the copy of that section in `README.md`; README "Airports Databases" or API examples (`README.md:354-357`) if affected.
- [ ] Unit tests for new pure logic (parsers, distance).

## 13. AI Notes

### Mental Model

Aircraft data is **derived**: the logbook is the source of truth and `GenerateAircraftTable` mirrors it into `aircrafts` / `aircraft_categories`. The only user-owned data there is the category strings and auto-fill flags. Airport data is **replaced wholesale** from an external file, plus a small user-owned `airports_custom` table. Everything reads airports through `airports_view` by ICAO-or-IATA code. Distance and night time are computed from those coordinates through two process-global `sync.Map` caches.

### Gotchas

- `GetAirportByID` signals "not found" with zero values and `nil` error. Check `ICAO == "" && IATA == ""` as `HandlerApiAirportByID` does (`app/handlers_airport.go:29`).
- For custom airports the code lives in column `name` and the display name in `full_name`. `GetCustomAirports` re-aliases them to `icao`/`iata`/`name` (`internal/models/airports.go:138`), and the API field `icao` carries the custom code.
- `airports_view` upper-cases custom codes; `/api/airport/custom-list` does not.
- Airport handlers reply with a bare JSON string (`"Custom airport added"`), while aircraft handlers reply with `JSONResponse` (`app/handlers_airport.go:213`, `app/handlers_airport.go:231` vs `app/handlers_aircraft.go:47`).
- At first start the airport download blocks `serve()` for up to 300 s + insert time, and both `UpdateAirportDB` and `main` launch `CreateDistanceCache` (`internal/models/airports.go:96`, `app/main.go:202`).
- The first-run download ignores the configured source and filter (`app/main.go:178`, `app/main.go:185`).
- README says enabling "No ICAO codes filter" *ignores* codes with digits/dashes (`README.md:291`). In code, `no_icao_filter=true` **disables** the filter and keeps those codes (`internal/models/airports.go:73`).
- `EditCategoriesModal` falls back to `?? true` for a missing flag (`app/ui/src/components/Aircrafts/EditCategoriesModal.jsx:126`), but the API always sends the full struct (all `false` when unset), so the fallback never applies to server data.
- The registration's "type" is `MIN(aircraft_model)`; changing it rewrites only logbook rows that had that exact old type (`internal/models/aircrafts.go:196-200`).

### File Quick Reference

| Need | Go to |
|---|---|
| Endpoint wiring | `app/routes.go:74-102`, `app/routes.go:162` |
| Aircraft handlers / SQL | `app/handlers_aircraft.go`, `internal/models/aircrafts.go` |
| Airport handlers, download, parsers | `app/handlers_airport.go` |
| Airport SQL and cache | `internal/models/airports.go` |
| Distance and distance cache | `internal/models/helpers.go:26-129`, `internal/utils/distance.go` |
| Schema and views | `internal/driver/db_structure.go:55-119`, `internal/driver/db_structure.go:229-293` |
| Startup download | `app/main.go:170-206` |
| Aircrafts UI | `app/ui/src/components/Aircrafts/` |
| Airports UI | `app/ui/src/components/Airports/` |
| Fetchers / hooks | `app/ui/src/util/http/aircraft.jsx`, `app/ui/src/util/http/airport.jsx`, `app/ui/src/hooks/queries/useAircraftsQuery.js`, `app/ui/src/hooks/queries/useModelsCategoriesQuery.js` |

> **AI Usage Instructions**
> - Always read this file before modifying this system
> - Do not refactor without impact analysis
> - Ask if information is missing
