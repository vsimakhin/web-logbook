# Stats and Map — Architecture

**Last Updated:** 2026-10-14 — initial version generated from code and fact-checked (TASK_AGENT_WORKFLOW_SETUP); 2026-10-14 — §11 #3 cross-links PDF_EXPORT #11 and #19 (consistency pass)

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

Stats and Map is the read-only reporting part of the logbook. It gives the pilot four statistics views (Dashboard, by Year/Month, by Aircraft Type, by Aircraft Category) and a filterable world map of flown routes, GPS tracks and visited airports. Routes are registered in `app/ui/src/main.jsx:60` (`/map`) and `app/ui/src/main.jsx:71-76` (`/stats`, `/stats/dashboard`, `/stats/by-year`, `/stats/by-type`, `/stats/by-category`). The sidebar entries are in `NAV_ITEMS` (`app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:44`, `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:51-55`).

**There is no stats endpoint and no server-side aggregation.** The backend only serves raw lists: all flight records (`GET /api/logbook/data`, `GET /api/logbook/mapdata`), airports, aircraft, model categories, custom fields and settings. All totals, grouping, filtering, great-circle geometry and the PNG export run in the browser. The aggregation code is in `app/ui/src/util/helpers.jsx:53-267`, and the map rendering uses OpenLayers in `app/ui/src/components/FlightMap/`. The system writes nothing to the database.

## 2. Key Concepts

| Concept | Meaning / invariant | Evidence |
|---|---|---|
| Time = integer minutes | All flight time fields arrive as ints (`FlightRecord.Time`). They are summed as numbers and converted to text only for display. | `internal/models/structs.go:40-54`, `formatTimeField` `app/ui/src/util/helpers.jsx:4-23` |
| Time display format | `time_fields_auto_format`: `1` = `HH:MM`, `2`/`0` = `H:MM`, `3` = decimal hours. `useSettings` falls back to `1` when the value is falsy. | `app/ui/src/util/helpers.jsx:8-22`, `app/ui/src/hooks/useSettings.jsx:136`, `internal/models/structs.go:241` |
| ISO dates | Since v5 the flight `date` is `YYYY-MM-DD`. Filters parse it with that format. | `internal/driver/data_overhaul.go:15`, `app/ui/src/components/UIElements/Filters.jsx:89` |
| Cross-country (`cc_time`) | This field is not stored. The server sets it to `total_time` whenever departure ≠ arrival. It is omitted from JSON when 0 (`omitempty`). | `processFlightrecord` `internal/models/helpers.go:56-63`, `internal/models/structs.go:53` |
| Distance | Nautical miles, read from the stored `logbook.distance` column (SQLite `REAL` / MySQL `FLOAT`). Written by `InsertFlightRecord` (direct dep→arr great circle, ignores enroute), by `UpdateFlightRecord` (stores the client value, which `calculateDistance` sums from `/api/distance` legs including enroute), by the track handlers (sum of track segments on upload, direct distance on reset) and by the startup backfill `UpdateFlightRecordsDistance` (rows with NULL distance). Never by this system. Create and update can store different values for the same route (`ARCHITECTURE_LOGBOOK.md` §11 #3). The map shows nm and km (×1.852). | `internal/driver/db_structure.go:13`, `internal/driver/db_structure.go:48`, `internal/models/flightrecords.go:91`, `internal/models/flightrecords.go:71`, `app/ui/src/hooks/useCustomFields.jsx:36-56`, `app/handlers_flightrecord.go:139`, `app/handlers_flightrecord.go:168`, `internal/models/helpers.go:65-69`, `app/main.go:206`, `app/ui/src/components/FlightMap/FlightMap.jsx:225` |
| Track log | A `[[lat, lon], ...]` JSON array in a BLOB. Go serialises `[]byte` as base64, so the UI runs `atob` + `JSON.parse` and swaps to `[lon, lat]`. | `app/handlers_flightrecord.go:130`, `app/handlers_flightrecord.go:142`, `internal/models/structs.go:68`, `drawTrackLog` `app/ui/src/components/FlightMap/helpers.jsx:73-80` |
| Enroute custom field | A custom field of type `enroute`. Its value is split on `[,;\s-]+` and the parts become intermediate airports of the route. | `getEnroute` `app/ui/src/hooks/useCustomFields.jsx:17-33` |
| Custom-field stats function | Allowed per type: text/time → `none,count`; number/duration → `none,sum,average,count`; enroute → `none`. | `app/ui/src/components/Settings/CustomFields/CustomFieldModal.jsx:24-30` |
| Per-bucket custom totals | Each stats row carries `custom_fields[uuid] = {sum, count}`, filled by `updateCustomFieldTotals`. Text/time values count as 1. | `app/ui/src/util/helpers.jsx:85-108`, `app/ui/src/util/helpers.jsx:176-182`, `app/ui/src/util/helpers.jsx:250-255` |
| Category bucketing | Model → categories come from `aircraft_categories`, and aircraft-level categories are added from `aircrafts_view`. One flight can land in several categories. A model with no category mapping becomes its own bucket. | `getTotalsByAircraft` `app/ui/src/util/helpers.jsx:199-227` |
| Simulator bucket | A record with no `aircraft.model` is grouped under `sim.type` when that type matches a known model or category, and otherwise under `"Simulator"`. | `app/ui/src/util/helpers.jsx:228-244` |
| Previous experience | The Dashboard only: an artificial record (`uuid: "previous-experience-artificial-uuid"`) built from `settings.previous_experience` is put in front of the flights. | `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:30-69` |
| Counters | `Airports` = distinct place codes as typed. `Routes` = distinct directional `DEP-ARR` pairs. `Countries` = distinct `country` of places found in the airport map. | `getStats` `app/ui/src/util/helpers.jsx:120-165` |

## 3. How It Works

| Page | What the pilot sees | Data source | Default filter |
|---|---|---|---|
| `/stats` and `/stats/dashboard` | A Filters card and the "Dashboard Options" switches on the left. On the right, a "Stats" tile grid (13 time/landing tiles plus 7 counters) and "Custom Fields" tiles. | `['logbook']`, `['airports']`, `['custom-fields']`, `['settings']`, plus `['aircrafts']` and `['models-categories']` loaded by `Filters` (`app/ui/src/components/UIElements/Filters.jsx:145-146`) | "All Time" (`app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:104`) |
| `/stats/by-year` | One tab per year (descending) holding a month-by-month grid with a Total footer and a CSV button. | `['logbook']`, `['custom-fields']`, `['settings']` (`app/ui/src/components/Stats/ByYear/TotalsByYear.jsx:50-53`) | none — always all flights |
| `/stats/by-type` | One grid row per aircraft model (plus simulator rows), with a Total footer and CSV. | `['logbook']`, `['models-categories']`, `['aircrafts']`, `['custom-fields']` (`app/ui/src/components/Stats/ByAircraft/TotalsByAircraft.jsx:10-15`), `['settings']` (`app/ui/src/components/Stats/ByAircraft/TotalsByAircraftTable.jsx:16`) | none |
| `/stats/by-category` | One grid row per category, with **no** Total footer because rows overlap. | same as by-type | none |
| `/map` | Filters and a summary-stats tile column on the left. On the right, an OpenLayers map with markers, great-circle routes, tracks, a distance label, PNG export and an options dialog. | `['logbook','map']` (mapdata with tracks); `['logbook']` through the Filters autocompletes `AircraftReg`/`AircraftType`/`FlightTags`/`DepartureArrival` (`app/ui/src/components/UIElements/AircraftReg.jsx:9`, `app/ui/src/components/UIElements/AircraftType.jsx:18`, `app/ui/src/components/UIElements/FlightTags.jsx:17`, `app/ui/src/components/UIElements/DepartureArrival.jsx:28`); `['airports']`; per-airport `['airports', id]`; `['aircrafts']` and `['models-categories']` (`Filters`); `['custom-fields']` for enroute (`app/ui/src/components/FlightMap/FlightMap.jsx:65`); `['settings']` (`app/ui/src/components/Map/SummaryStats.jsx:10`) | "This Year" (initial filter state, `app/ui/src/components/UIElements/Filters.jsx:19-31`) |

Step by step for the Map (the most complex flow):

| # | Step | Code |
|---|---|---|
| 1 | `SummaryFlightMap` fetches all flights including tracks, and in parallel the full airport list. | `app/ui/src/components/Map/SummaryFlightMap.jsx:21-34` |
| 2 | The airport list is indexed into a `Map` keyed by ICAO and, when present, by IATA. | `app/ui/src/components/Map/SummaryFlightMap.jsx:36-48` |
| 3 | `Filters` filters client-side by date range, registration, type, category, tags, departure and arrival, then calls `callbackFunction(filtered)`. | `app/ui/src/components/UIElements/Filters.jsx:82-126`, `app/ui/src/components/UIElements/Filters.jsx:160-165` |
| 4 | `SummaryStats` runs `getStats` on the filtered rows to build the tiles. | `app/ui/src/components/Map/SummaryStats.jsx:9-24` |
| 5 | `FlightMap` clears its vector source. For each flight that has both places, it resolves the airports (map first, then cache, then `GET /api/airport/{id}`), adds deduplicated markers, adds enroute airports, draws 64-segment great-circle lines and the decoded track, and sums `flight.distance`. | `app/ui/src/components/FlightMap/FlightMap.jsx:121-201` |
| 6 | Once all flights are processed it adds the markers, fits the view to the extent and shows the distance label. | `app/ui/src/components/FlightMap/FlightMap.jsx:180-193`, `app/ui/src/components/FlightMap/FlightMap.jsx:223-227` |
| 7 | Clicking a marker opens a popup with the airport's name, country, city, elevation and lat/lon. | `app/ui/src/components/FlightMap/FlightMap.jsx:90-109`, `app/ui/src/components/FlightMap/FlightMap.jsx:231-245` |

## 4. Components & Files

### 4.1 File Index

| File | Responsibility |
|---|---|
| `app/ui/src/pages/StatsDashboardPage.jsx` | Renders `TotalsDashboard`. |
| `app/ui/src/pages/StatsByYearPage.jsx` | Renders `TotalsByYear`. |
| `app/ui/src/pages/StatsByTypePage.jsx` | Renders `TotalsByAircraft type="type"`. |
| `app/ui/src/pages/StatsByCategoryPage.jsx` | Renders `TotalsByAircraft type="category"`. |
| `app/ui/src/pages/MapPage.jsx` | Renders `SummaryFlightMap`. |
| `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx` | Dashboard container: logbook query, previous-experience record, airport list/map, Filters, options. |
| `app/ui/src/components/Stats/Dashboard/DashboardTiles.jsx` | Time tiles (switchable via `STATS_FILTERS`), an always-on landings tile, and 7 counter tiles, via `getStats`. |
| `app/ui/src/components/Stats/Dashboard/CustomFieldsTiles.jsx` | One tile per custom field with `count/sum/average` (`calculateStats`). |
| `app/ui/src/components/Stats/Dashboard/DashboardOptions.jsx` | Accordion of show/hide switches (`STATS_FILTERS`). |
| `app/ui/src/components/Stats/ByYear/TotalsByYear.jsx` | Year tabs and month grid, using `getTotalsByMonthAndYear`. |
| `app/ui/src/components/Stats/ByAircraft/TotalsByAircraft.jsx` | Loads flights, models and aircraft, then calls `getTotalsByAircraft`. |
| `app/ui/src/components/Stats/ByAircraft/TotalsByAircraftTable.jsx` | Grid for type/category, with the footer only for type. |
| `app/ui/src/components/Stats/helpers.jsx` | Shared grid column factory `createStatsColumns`, `buildCustomFieldColumns`, `timeColumn`. |
| `app/ui/src/components/Map/SummaryFlightMap.jsx` | Map page container: mapdata and airport queries, Filters, SummaryStats, FlightMap. |
| `app/ui/src/components/Map/SummaryStats.jsx` | Seven summary tiles for the filtered map data. |
| `app/ui/src/components/FlightMap/FlightMap.jsx` | OpenLayers map lifecycle, feature drawing, popup, distance label. Also used by the flight-record page. |
| `app/ui/src/components/FlightMap/helpers.jsx` | `DEFAULT_MAP_OPTIONS`, icons, great-circle math, track decode, markers, base layers. |
| `app/ui/src/components/FlightMap/MapOptionsButton.jsx` | Opens `MapOptionsModal` through `useDialogs`. |
| `app/ui/src/components/FlightMap/MapOptionsModal.jsx` | Edits map options stored in localStorage. |
| `app/ui/src/components/FlightMap/DownloadMapButton.jsx` | Composes the map canvases into `map.png`. |
| `app/ui/src/util/helpers.jsx` | Aggregators `getStats`, `getTotalsByMonthAndYear`, `getTotalsByAircraft`, plus `formatTimeField` and `getValue`. |
| `app/handlers_logbook.go` | `HandlerApiLogbookData`, `HandlerApiLogbookMapData`. |
| `internal/models/flightrecords.go` | `GetFlightRecords`, `GetFlightRecordsForMap`. |

Shared UI pieces this system depends on (owned by the frontend doc): `app/ui/src/components/UIElements/Filters.jsx`, `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx`, `app/ui/src/components/UIElements/Tile.jsx`, `app/ui/src/components/UIElements/CSVExportButton.jsx`, `app/ui/src/components/UIElements/CardHeader.jsx`.

### 4.2 API Endpoints

All routes are inside `r.Route("/api", ...)` behind `r.Use(app.Auth)` (`app/routes.go:26-27`). No stats-specific aggregation endpoint exists. `GET /api/logbook/mapdata` is consumed only by the Map page (`fetchLogbookMapData`, `app/ui/src/util/http/logbook.jsx:55`, called only from `app/ui/src/components/Map/SummaryFlightMap.jsx:23`), but its handler lives with the logbook handlers (`app/handlers_logbook.go:18`) and belongs to `ARCHITECTURE_LOGBOOK.md`.

| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/api/logbook/data` | `HandlerApiLogbookData` `app/handlers_logbook.go:8` | Route `app/routes.go:34`, gzip `Compress(5)`. All flights, no `track`. Used by every Stats page and, through the Filters autocompletes, also on the Map page (so `/map` loads both payloads). |
| GET | `/api/logbook/mapdata` | `HandlerApiLogbookMapData` `app/handlers_logbook.go:18` | Route `app/routes.go:35`, gzip. All flights **with** `track` (base64). Used by the Map page only. |
| GET | `/api/airport/list` | `HandlerApiAirportList` `app/handlers_airport.go:62` | Route `app/routes.go:96`, gzip. `airports_view` = standard + custom airports. |
| GET | `/api/airport/{id}` | `HandlerApiAirportByID` `app/handlers_airport.go:20` | Route `app/routes.go:100`. ICAO or IATA, upper-cased. `404 {"ok":false,"message":"Airport not found"}` plus a `warningLog` line when unknown (`app/handlers_airport.go:29-33`). The map uses it as a fallback. |
| GET | `/api/aircraft/list` | `HandlerApiAircraftList` `app/handlers_aircraft.go:11` | Route `app/routes.go:75`. Category bucketing and the Filters category filter. |
| GET | `/api/aircraft/models-categories` | `HandlerApiAircraftModelsCategoriesList` `app/handlers_aircraft.go:22` | Route `app/routes.go:76`. Model → categories. |
| GET | `/api/custom-fields/list` | `HandlerApiCustomFieldsList` `app/handlers_custom_fields.go:12` | Route `app/routes.go:142`. Stats columns/tiles and the enroute field. |
| GET | `/api/settings/list` | `HandlerApiSettingsList` `app/handlers_settings.go:11` | Route `app/routes.go:83`. Previous experience, time format, field names. `Hash` is blanked (`app/handlers_settings.go:18`). |

`GET /api/distance/{departure}/{arrival}` (`app/routes.go:162`) is **not** used here. The map relies on the stored `distance`.

### 4.3 Data Access

| File | Method | Purpose | Tables / views |
|---|---|---|---|
| `internal/models/flightrecords.go` | `GetFlightRecords` `internal/models/flightrecords.go:128` | All records, `ORDER BY date desc, departure_time desc` (`internal/models/flightrecords.go:141`); includes `rn`, `has_track`, `attachments_count`, prev/next uuid | `logbook_view` |
| `internal/models/flightrecords.go` | `GetFlightRecordsForMap` `internal/models/flightrecords.go:218` | All records plus `track` (`internal/models/flightrecords.go:228`); no `rn`/`has_track`/attachments | `logbook_view` |
| `internal/models/helpers.go` | `processFlightrecord` `internal/models/helpers.go:56` | Sets `cc_time` for each row (both methods above call it) | — |
| `internal/models/helpers.go` | `ContextWithDefaultTimeout` `internal/models/helpers.go:22` | 60 s query context | — |
| `internal/models/airports.go` | `GetAllAirports` `internal/models/airports.go:125` → `fetchAirports` `internal/models/airports.go:102` | Full airport list | `airports_view` |
| `internal/models/airports.go` | `GetAirportByID` `internal/models/airports.go:16` | `icao = ? or iata = ?`. In-process `airportCache` (`internal/models/airports.go:13`, `internal/models/airports.go:19`, `internal/models/airports.go:40`). Returns an empty struct on `ErrNoRows` (`internal/models/airports.go:33-34`) | `airports_view` |
| `internal/models/aircrafts.go` | `GetAircrafts` `internal/models/aircrafts.go:125` | Registrations with merged categories | `aircrafts_view` |
| `internal/models/aircrafts.go` | `GetAircraftModelsCategories` `internal/models/aircrafts.go:87` | Model → categories, **INNER JOIN** so only models present in the logbook (`internal/models/aircrafts.go:96`) | `aircraft_categories`, `logbook_view` |
| `internal/models/custom_fields.go` | `GetCustomFields` `internal/models/custom_fields.go:3` | All custom-field definitions ordered by `display_order` | `custom_fields` |
| `internal/models/settings.go` | `GetSettings` `internal/models/settings.go:11` | JSON blob from `settings2 WHERE id=0` (`internal/models/settings.go:17`) | `settings2` |

### 4.4 UI

| Item | Kind | Notes |
|---|---|---|
| `useLogbookQuery` | Query hook, key `['logbook']` | `app/ui/src/hooks/queries/useLogbookQuery.js:4-17`, `select: data \|\| []` (`app/ui/src/hooks/queries/useLogbookQuery.js:10`) |
| inline `useQuery` key `['logbook','map']` | Map data | `app/ui/src/components/Map/SummaryFlightMap.jsx:21-26` → `fetchLogbookMapData` `app/ui/src/util/http/logbook.jsx:55-68` |
| inline `useQuery` key `['airports']` | Airport list | `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:71-76`, `app/ui/src/components/Map/SummaryFlightMap.jsx:29-34` → `fetchAirports` `app/ui/src/util/http/airport.jsx:35-43` |
| `queryClient.fetchQuery` key `['airports', id]` | Single airport | `app/ui/src/components/FlightMap/FlightMap.jsx:26-52` → `fetchAirport` `app/ui/src/util/http/airport.jsx:5-13` |
| `useAircraftsQuery`, `useModelsCategoriesQuery` | Query hooks | `app/ui/src/hooks/queries/useAircraftsQuery.js:4-11`, `app/ui/src/hooks/queries/useModelsCategoriesQuery.js:4-11` (also used inside `Filters`) |
| `useCustomFields` | Key `['custom-fields']`, `getEnroute` | `app/ui/src/hooks/useCustomFields.jsx:8-67` |
| `useSettings` | Key `['settings']`, `fieldName`, `fieldNameF`, `timeFieldsFormat` | `app/ui/src/hooks/useSettings.jsx:81-139` |
| `useLocalStorageState` | Options persistence, same-tab sync via an emitter | `app/ui/src/hooks/useLocalStorageState/useStorageState.tsx:5-41` |
| `XDataGrid` | Grid with a custom aggregation footer | `app/ui/src/components/UIElements/XDataGrid/XFooter.jsx:106-203` |
| `CSVExportButton` | `totals-by-year` / `totals-by-aircraft` mappers | `app/ui/src/components/UIElements/CSVExportButton.jsx:98-133` |

## 5. Data Model & Persistence

Stats and Map only reads data. It owns no tables.

| Store | Columns / keys used | Engine notes |
|---|---|---|
| `logbook` → `logbook_view` (`internal/driver/db_structure.go:23`, `internal/driver/db_structure.go:168`) | `date`, places/times, `aircraft_model`, `reg_name`, all `*_time` (SmallInt minutes, `internal/driver/db_structure.go:32-45`), landings, `sim_type`, `distance` (`Real`, `internal/driver/db_structure.go:48`), `track` (`Blob`, `internal/driver/db_structure.go:49`), `custom_fields` (JSON text `internal/driver/db_structure.go:50`), `tags` | The view normalises `IFNULL(distance,0)` (`internal/driver/db_structure.go:182`) and `IFNULL(custom_fields,'{}')` (`internal/driver/db_structure.go:184`). Landings: SQLite `IFNULL(NULLIF(day_landings,''),0)` (`internal/driver/db_structure.go:178`), MySQL `IFNULL(day_landings,0)` (`internal/driver/db_structure.go:207`). `distance` is `REAL` on SQLite but single-precision `FLOAT` on MySQL; `track` is `BLOB` / `LONGBLOB` (`internal/driver/db_structure.go:13-14`). |
| `airports` + `airports_custom` → `airports_view` (`internal/driver/db_structure.go:229`) | `icao, iata, name, city, country, elevation, lat, lon` | Custom rows expose `UPPER(name)` as both icao and iata (`internal/driver/db_structure.go:234`, `internal/driver/db_structure.go:239`), so the map labels them with a single code (`app/ui/src/components/FlightMap/helpers.jsx:88`). |
| `aircrafts` + `aircraft_categories` → `aircrafts_view` (`internal/driver/db_structure.go:244`) | `reg_name`, `categories` (model + custom merged) | Same shape in both engines. |
| `custom_fields` (`internal/driver/db_structure.go:134`) | `uuid, name, description, type, stats_function` | — |
| `settings2.settings` JSON (`internal/driver/db_structure.go:77`) | `previous_experience.*` (`internal/models/structs.go:255-271`), `time_fields_auto_format`, `enable_custom_names`, `standard_fields_headers` | One JSON blob, id 0. |

Caches:

| Cache | Where | Lifetime / invalidation |
|---|---|---|
| `airportCache` (`sync.Map`) | `internal/models/airports.go:13` | Process lifetime. Cleared only by the airport DB update (`internal/models/airports.go:95`). |
| `distanceCache` | `internal/models/helpers.go:26` | Used when distance is *written*. Not read by this system. |
| TanStack Query cache | Browser | `staleTime`/`gcTime` 1 h (24 h for single airports). See §7. |
| localStorage `dashboard-options` | `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:23` | Per browser. Tile visibility map `{key: bool}`. |
| localStorage `map-advanced-options` | `app/ui/src/components/FlightMap/helpers.jsx:15` | Per browser. The whole object replaces the defaults (no deep merge). |
| localStorage grid state `totals-type-*`, `totals-category-*`, `totals-year-*` | `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:111-112`, `app/ui/src/components/UIElements/XDataGrid/FilterContext.jsx:7-8` | Pagination, columns and filter model per `tableId`. |

## 6. Data Flow

**A. Dashboard load**

| # | Hop | Code |
|---|---|---|
| 1 | `TotalsDashboard` → `useLogbookQuery()` → `fetchLogbookData` → `GET /api/logbook/data` with a Bearer token | `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:27`, `app/ui/src/util/http/logbook.jsx:40-53` |
| 2 | `HandlerApiLogbookData` → `GetFlightRecords` → `logbook_view` → `processFlightrecord` → `writeJSON` | `app/handlers_logbook.go:8-16`, `internal/models/flightrecords.go:128-165` |
| 3 | The UI parses the `custom_fields` string into an object (a parse error gives `{}`) | `app/ui/src/util/http/logbook.jsx:5-14`, `app/ui/src/util/http/logbook.jsx:49-52` |
| 4 | Prepends the previous-experience record (when settings are loaded) | `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:30-69` |
| 5 | `Filters` (quick select "All Time") → `setDashboardData(filtered)` | `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:94`, `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:104` |
| 6 | `DashboardTiles` → `getStats(data, airportsMap, settings.time_fields_auto_format)` and `CustomFieldsTiles` → `calculateStats[fn]` | `app/ui/src/components/Stats/Dashboard/DashboardTiles.jsx:17`, `app/ui/src/components/Stats/Dashboard/CustomFieldsTiles.jsx:14-78` |

**B. Stats by Year / Type / Category**

| # | Hop | Code |
|---|---|---|
| 1 | `useLogbookQuery()` (the same cache entry as the Dashboard and the Logbook page) | `app/ui/src/components/Stats/ByYear/TotalsByYear.jsx:53`, `app/ui/src/components/Stats/ByAircraft/TotalsByAircraft.jsx:10` |
| 2 | Year: `getTotalsByMonthAndYear` groups by `dayjs(date).format('YYYY-MM')`, sorted by year desc then month asc | `app/ui/src/util/helpers.jsx:167-193` |
| 3 | Type/Category: `getTotalsByAircraft(flights, type, models, aircrafts, customFields)`, sorted by `model` | `app/ui/src/util/helpers.jsx:195-267` |
| 4 | Columns come from `createStatsColumns`. The XDataGrid footer aggregates `sum/avg/count` | `app/ui/src/components/Stats/helpers.jsx:62-117`, `app/ui/src/components/UIElements/XDataGrid/XFooter.jsx:171-203` |
| 5 | CSV: visible rows → `exportMappers['totals-by-year' \| 'totals-by-aircraft']` → `export-to-csv` | `app/ui/src/components/UIElements/CSVExportButton.jsx:152-180` |

**C. Map load and draw** — see §3 steps 1-7. Backend hop: `HandlerApiLogbookMapData` → `GetFlightRecordsForMap` (`app/handlers_logbook.go:18-26`, `internal/models/flightrecords.go:218-255`). The airport fallback is `HandlerApiAirportByID` → `GetAirportByID` (`app/handlers_airport.go:20-37`, `internal/models/airports.go:16-43`).

**D. Map options change**

| # | Hop | Code |
|---|---|---|
| 1 | `MapOptionsButton` → `dialogs.open(MapOptionsModal)` | `app/ui/src/components/FlightMap/MapOptionsButton.jsx:14-16` |
| 2 | The modal writes nested keys (`routes.color`, `airport.icon`, `map_base`, ...) to localStorage | `app/ui/src/components/FlightMap/MapOptionsModal.jsx:74-96` |
| 3 | The same-tab emitter re-renders `FlightMap`. A `map_base` change re-creates the OL map (effect dep `options.map_base`); any option change redraws the features | `app/ui/src/components/FlightMap/FlightMap.jsx:55`, `app/ui/src/components/FlightMap/FlightMap.jsx:119`, `app/ui/src/components/FlightMap/FlightMap.jsx:201` |

**E. Freshness after edits**: flight-record mutations call `invalidateQueries({ queryKey: ['logbook'] })` (e.g. `app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:43`). Prefix matching also invalidates `['logbook','map']`. Exception: Convert attachment to track (`app/ui/src/components/FlightRecordAttachment/ConvertAttachmentToTrackButton.jsx:21-22`) invalidates only `['attachments', id]` and `['flight', id]`, although `POST /api/logbook/track/{uuid}` rewrites `track` and `distance` (`app/routes.go:48`, `app/handlers_flightrecord.go:148`). The new track is then missing from `/map` and the distance totals stay stale for up to 1 h (`ARCHITECTURE_CURRENCY_LICENSING.md` §11 #13). Custom-airport edits invalidate only `['custom-airports']` (`app/ui/src/components/Airports/AddEditCustomAirportModal.jsx:43`), so `['airports']` stays stale for up to 1 h (§11 #16).

## 7. Config & Constants

| Constant | Value | Where | Kind |
|---|---|---|---|
| Logbook query `staleTime`/`gcTime` | 3 600 000 ms (1 h), `refetchOnWindowFocus: false` | `app/ui/src/hooks/queries/useLogbookQuery.js:7-9` | (hardcoded) |
| Map data query `staleTime`/`gcTime` | 1 h | `app/ui/src/components/Map/SummaryFlightMap.jsx:24-25` | (hardcoded) |
| Airport list query `staleTime`/`gcTime` | 1 h | `app/ui/src/components/Map/SummaryFlightMap.jsx:32-33`, `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:74-75` | (hardcoded) |
| Single airport query `staleTime`/`gcTime` | 86 400 000 ms (24 h) | `app/ui/src/components/FlightMap/FlightMap.jsx:44-45` | (hardcoded) |
| Aircraft / models / settings / custom-field queries | 1 h | `app/ui/src/hooks/queries/useAircraftsQuery.js:7-8`, `app/ui/src/hooks/queries/useModelsCategoriesQuery.js:7-8`, `app/ui/src/hooks/useSettings.jsx:86-87`, `app/ui/src/hooks/useCustomFields.jsx:12-13` | (hardcoded) |
| DB query timeout | 60 s | `internal/models/helpers.go:14` | (hardcoded) |
| Response gzip level | 5 | `app/routes.go:34-35`, `app/routes.go:96` | (hardcoded) |
| API base URL | `/api`; dev mode `http://localhost:4000/api` | `app/ui/src/constants/constants.jsx:9-11` | (hardcoded, by build mode) |
| Time display format | `time_fields_auto_format`, default `1` | `app/ui/src/hooks/useSettings.jsx:136` | (configurable, Settings) |
| Custom field names | `enable_custom_names` + `standard_fields_headers` | `app/ui/src/hooks/useSettings.jsx:107-125` | (configurable, Settings) |
| Previous experience values | `settings.previous_experience` | `internal/models/structs.go:255-271` | (configurable, Settings) |
| Previous-experience record | `uuid "previous-experience-artificial-uuid"`, `date "17/12/1903"` | `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:37-38` | (hardcoded) |
| "All Time" range start | `1903-12-17` → today | `app/ui/src/components/UIElements/Filters.jsx:138` | (hardcoded) |
| Default filter range | start/end of the current year, from `MAP_FILTER_INITIAL_STATE` (the default quick-select label at `app/ui/src/components/UIElements/Filters.jsx:141` matches no option, see §11 #8) | `app/ui/src/components/UIElements/Filters.jsx:20-21` | (hardcoded) |
| Dashboard quick select | `"All Time"` | `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:104` | (hardcoded) |
| Dashboard tile switches | `STATS_FILTERS` (12 keys, default on) | `app/ui/src/components/Stats/Dashboard/DashboardOptions.jsx:13-26`, `app/ui/src/components/Stats/Dashboard/DashboardOptions.jsx:45` | (configurable, localStorage) |
| Map defaults | routes/tracks enabled, thickness 1, color `#1a5fb4`, airport ids on, icon 0, `map_base` 0 | `app/ui/src/components/FlightMap/helpers.jsx:22-38` | (configurable, localStorage) |
| Line thickness slider | 1 – 10, step 0.1 | `app/ui/src/components/FlightMap/MapOptionsModal.jsx:61-64` | (hardcoded) |
| Base layers | 0 OSM, 1 Esri World_Imagery, 2 Esri World_Terrain_Base, `maxZoom 19` | `app/ui/src/components/FlightMap/helpers.jsx:121-145` | (configurable choice, hardcoded URLs) |
| Initial view | center `[10, 45]` (EPSG:4326), zoom 4 | `app/ui/src/components/FlightMap/FlightMap.jsx:83-84` | (hardcoded) |
| Fit to features | `maxZoom 16`, padding 30 px, duration 100 ms | `app/ui/src/components/FlightMap/FlightMap.jsx:188-192` | (hardcoded) |
| Great-circle segments | 64 | `app/ui/src/components/FlightMap/helpers.jsx:40` | (hardcoded) |
| nm → km | 1.852 | `app/ui/src/components/FlightMap/FlightMap.jsx:225` | (hardcoded) |
| Map card height | `85vh` | `app/ui/src/components/FlightMap/FlightMap.jsx:213` | (hardcoded) |
| PNG file name | `map.png` | `app/ui/src/components/FlightMap/DownloadMapButton.jsx:68` | (hardcoded) |
| Grid column widths | time 80, landings 50, distance 100 | `app/ui/src/components/Stats/helpers.jsx:11`, `app/ui/src/components/Stats/helpers.jsx:78`, `app/ui/src/components/Stats/helpers.jsx:100` | (hardcoded) |
| Grid `tableId`s | `totals-type`, `totals-category`, `totals-year` | `app/ui/src/components/Stats/ByAircraft/TotalsByAircraftTable.jsx:38`, `app/ui/src/components/Stats/ByYear/TotalsByYear.jsx:92` | (hardcoded) |

## 8. Error Handling & Edge Cases

| Case | Behaviour | Evidence |
|---|---|---|
| DB error in any feeding handler | `handleError` logs file:line and returns 500 with a JSON message | `app/helpers.go:53-63` |
| 401 from the API | `handleFetch` navigates to `/signin`, then throws | `app/ui/src/util/http/http.jsx:6-28` |
| Logbook load failure | A notification "Failed to load logbook" | `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:28`, `app/ui/src/components/Stats/ByYear/TotalsByYear.jsx:54`, `app/ui/src/components/Stats/ByAircraft/TotalsByAircraft.jsx:11`, `app/ui/src/components/Map/SummaryFlightMap.jsx:27` |
| Airport list failure | No notification. `airportsMap` stays empty, so Countries = 0 and the map falls back to per-airport requests | `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:71-90`, `app/ui/src/components/FlightMap/FlightMap.jsx:26-52` |
| Empty logbook | Go returns `null`. `useLogbookQuery` maps it to `[]`; map data stays `null` and `Filters` returns early | `app/ui/src/hooks/queries/useLogbookQuery.js:10`, `app/ui/src/components/UIElements/Filters.jsx:161` |
| Unknown airport code on the map | `GET /api/airport/{id}` → 404 → `getAirportData` returns `null` → the flight is skipped (no line, no marker, not in the distance label) | `app/handlers_airport.go:29-33`, `app/ui/src/components/FlightMap/FlightMap.jsx:49-51`, `app/ui/src/components/FlightMap/FlightMap.jsx:143` |
| Simulator records (no places) | Skipped on the map, still counted in SummaryStats "Total Flights" | `app/ui/src/components/FlightMap/FlightMap.jsx:136`, `app/ui/src/components/Map/SummaryStats.jsx:16` |
| Map distance label vs tile | The label sums only flights that were drawn; the tile sums every filtered flight | `app/ui/src/components/FlightMap/FlightMap.jsx:175`, `app/ui/src/util/helpers.jsx:79` |
| Redraw during a pending draw | A `cancelled` flag stops the stale run before `addFeatures`/fit | `app/ui/src/components/FlightMap/FlightMap.jsx:124`, `app/ui/src/components/FlightMap/FlightMap.jsx:181`, `app/ui/src/components/FlightMap/FlightMap.jsx:198-200` |
| Enroute equals departure/arrival | Skipped to avoid duplicates | `app/ui/src/components/FlightMap/FlightMap.jsx:153` |
| Category with no mapping | The model name becomes the category bucket | `app/ui/src/util/helpers.jsx:220` |
| Overlapping categories | Footer hidden for category view (`showAggregationFooter={type === "type"}`) | `app/ui/src/components/Stats/ByAircraft/TotalsByAircraftTable.jsx:45` |
| Non-numeric `number` custom field | `parseFloat` gives `NaN`, which poisons that bucket's sum | `app/ui/src/util/helpers.jsx:97` |
| Duration average in tiles | Rounded to whole minutes before formatting | `app/ui/src/components/Stats/Dashboard/CustomFieldsTiles.jsx:50` |
| Zero cells in grids | Greyed out via the `dg-zero` class | `app/ui/src/components/Stats/helpers.jsx:3-6`, `app/ui/src/components/Stats/ByAircraft/TotalsByAircraftTable.jsx:36` |
| PNG export | The button is disabled until the map exists. It waits for `rendercomplete`, and tile sources need `crossOrigin` to avoid a tainted canvas | `app/ui/src/components/FlightMap/DownloadMapButton.jsx:11-13`, `app/ui/src/components/FlightMap/DownloadMapButton.jsx:80`, `app/ui/src/components/FlightMap/helpers.jsx:131`, `app/ui/src/components/FlightMap/helpers.jsx:140` |

## 9. Integration Points

| Doc | What crosses the boundary |
|---|---|
| `ARCHITECTURE_LOGBOOK.md` | Owns `app/handlers_logbook.go` and `internal/models/flightrecords.go` (both endpoints feeding this system), the `distance`/`track` writes (`HandlerApiTrackLogNew`/`HandlerApiTrackLogReset` in `app/handlers_flightrecord.go:127-177`), custom fields (`stats_function`, `enroute`), and the `['logbook']` invalidations after edits. `FlightMap` is reused on the flight-record page (`app/ui/src/components/FlightRecord/FlightRecord.jsx:86`). |
| `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` | `/api/airport/list`, `/api/airport/{id}`, `/api/aircraft/list`, `/api/aircraft/models-categories`; `airports_view`, `aircrafts_view`, `airportCache`; the `['airports']` query key shared with `app/ui/src/components/Airports/Airports.jsx:15` (its §11 #4, #5, #14 = this doc's §11 #2, #16). |
| `ARCHITECTURE_CURRENCY_LICENSING.md` | Attachment → track conversion writes the `track`/`distance` the map draws; its missing `['logbook']` invalidation (its §11 #13) leaves `/map` and the distance totals stale (§6.E). |
| `ARCHITECTURE_SETTINGS.md` | `previous_experience`, `time_fields_auto_format`, custom standard-field names via `useSettings`. |
| `ARCHITECTURE_FRONTEND.md` | `Filters`, `XDataGrid`/`XFooter`, `Tile`, `CardHeader`, `useLocalStorageState`, `useDialogs`, `util/http`, query-hook pattern, router (`app/ui/src/main.jsx`) and sidebar (`app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx`). |
| `ARCHITECTURE_PDF_EXPORT.md` | The quick CSV export (`app/ui/src/components/UIElements/CSVExportButton.jsx`) used by both stats grids; its mappers are owned there (Co-Pilot `NaN` defect = its §11 #11 = this doc's §11 #3). |
| `ARCHITECTURE_AUTH.md` | All endpoints sit behind `app.Auth`; the Bearer token comes from `getAuthToken()` in each fetcher. |
| `ARCHITECTURE_DATABASE.md` | `logbook_view`/`airports_view`/`aircrafts_view` definitions for both engines, `schemaVersion`, the 60 s timeout, the v5 date/minute migration. |
| `ARCHITECTURE_APPLICATION.md` | Router, `Compress(5)` middleware, `writeJSON`/`handleError`. |

## 10. Testing

| Area | Existing tests | How to run |
|---|---|---|
| Aggregators (`getStats`, `getTotalsBy*`) | **None** | — |
| Stats/Map components | **None** | — |
| `getEnroute` (map route parsing) | `app/ui/src/hooks/useCustomFields.test.jsx:62` | `cd app/ui && npm run test:run` (`app/ui/package.json:12`) |
| Storage hook behind the `dashboard-options` / `map-advanced-options` persistence, and field labels (`fieldName`/`fieldNameF` for tile and column titles) | `app/ui/src/hooks/useLocalStorageState/useStorageState.test.tsx`, `app/ui/src/hooks/useSettings.test.jsx:75-147` | `cd app/ui && npm run test:run` |
| Backend handlers feeding stats/map | **None** (Go tests exist only for import and nighttime) | `make test` (`Makefile:32-33`) |

CI runs Vitest indirectly: `make build_ui` (`Makefile:26-28`) → `npm run build` = `npm run test:run && vite build` (`app/ui/package.json:8`), invoked in `.github/workflows/go.yml:22`.

Gaps worth filling first: unit tests for `app/ui/src/util/helpers.jsx` (pure functions, so easy to test), covering the previous-experience record surviving "All Time" filtering, category double counting, simulator bucketing, custom-field `{sum,count}`, and the CSV mapper keys.

Manual checks after any change: `/stats/dashboard` with "All Time" and previous experience set; `/stats/by-year` footer; `/stats/by-type` vs `/stats/by-category`; `/map` with a custom airport, an enroute field, a flight with a track, each base layer, and PNG export.

## 11. Known Issues & Tech Debt

| # | Issue | Location | Status | Severity | Verified |
|---|---|---|---|---|---|
| 1 | Previous experience never reaches the Dashboard. The artificial record still uses `date: "17/12/1903"` (DD/MM/YYYY), but v5 (`8b2fa8d`) switched `filterData` to parse `'YYYY-MM-DD'` and moved "All Time" to start at `1903-12-17`. The string parses either as Invalid Date (dayjs core falls back to `new Date("17/12/1903")`) or, through customParseFormat, as a date before 1903-12-17, so `isBetween` is false and the record is filtered out. Fix: `date: "1903-12-17"`. | `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:38`, `app/ui/src/components/UIElements/Filters.jsx:89-90`, `app/ui/src/components/UIElements/Filters.jsx:138` | Confirmed — format mismatch visible in code and in the v5 diff | MAJOR | verified: 2026-10-14 |
| 2 | Query-key collision on `['airports']`. The Airports page caches `/airport/standard-list` (the `airports` table only) under the same key that Dashboard/Map use for `/airport/list` (`airports_view` with custom airports). Whichever page mounts first fills the cache for 1 h. The Airports page may then list custom airports as standard ones, or Dashboard/Map may lack custom airports (Countries undercounted, extra per-airport requests). Same issue as `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` §11 #4. | `app/ui/src/components/Airports/Airports.jsx:15-16`, `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:72-73`, `app/ui/src/components/Map/SummaryFlightMap.jsx:30-31` | Confirmed — same key, different `queryFn` and payload | MAJOR | verified: 2026-10-14 |
| 3 | Stats CSV writes Co-Pilot as `NaN:NaN`. The mappers read `row.time.copilot_time`, but the totals key is `co_pilot_time`, and `formatTimeField(undefined)` yields `"NaN:NaN"` (or `"NaN"` in decimal mode). The CSV also omits custom-field columns. Only the quick CSV is wrong; the on-screen grids read `time.co_pilot_time` (`app/ui/src/components/Stats/helpers.jsx:70`). Also `ARCHITECTURE_PDF_EXPORT.md` §11 #11 (Co-Pilot, predates v5) and #19 (custom-field columns); the CSV mappers are owned there. | `app/ui/src/components/UIElements/CSVExportButton.jsx:107`, `app/ui/src/components/UIElements/CSVExportButton.jsx:125`; key in `app/ui/src/util/helpers.jsx:55` | Confirmed — key mismatch read directly; `formatTimeField` has no guard for `undefined` (`app/ui/src/util/helpers.jsx:4-22`) | MINOR | verified: 2026-10-14 |
| 4 | Custom-field footers are wrong for `count`/`average`. XFooter `count` counts rows (months/types), not flights, and `avg` averages per-row averages without weighting. Duration averages are not rounded in cells or footer, so they render like `00:45.5`. | `app/ui/src/components/Stats/helpers.jsx:38`, `app/ui/src/components/Stats/helpers.jsx:45-46`, `app/ui/src/components/Stats/helpers.jsx:53`; `app/ui/src/components/UIElements/XDataGrid/XFooter.jsx:186-203` | Confirmed — the column passes the stats function as the footer `aggregation`, and XFooter counts or plainly averages the per-row cell values | MINOR | verified: 2026-10-14 |
| 5 | `FlightRecord` passes `options` (track instead of route when a track exists) to `FlightMap`, but since `2822577` `FlightMap` ignores that prop and uses the global localStorage options. | `app/ui/src/components/FlightRecord/FlightRecord.jsx:69-73`, `app/ui/src/components/FlightRecord/FlightRecord.jsx:86`; `app/ui/src/components/FlightMap/FlightMap.jsx:54-55` | Confirmed — dead prop | MINOR | verified: 2026-10-14 |
| 6 | Inconsistent time-format source. `DashboardTiles` and `CSVExportButton` use the raw `settings.time_fields_auto_format`, while `SummaryStats` and the grids use `timeFieldsFormat` (`\|\| 1`). A stored `0` renders `H:MM` on the Dashboard and `HH:MM` elsewhere. | `app/ui/src/components/Stats/Dashboard/DashboardTiles.jsx:17`, `app/ui/src/components/UIElements/CSVExportButton.jsx:178`, `app/ui/src/hooks/useSettings.jsx:136` | Confirmed — both call sites read the raw setting, and `formatTimeField` maps `0` to `H:MM` (`app/ui/src/util/helpers.jsx:19`) | MINOR | verified: 2026-10-14 |
| 7 | `Tile` ignores the `tooltip` prop, so custom-field descriptions passed by `CustomFieldsTiles` never appear. | `app/ui/src/components/UIElements/Tile.jsx:6`, `app/ui/src/components/Stats/Dashboard/CustomFieldsTiles.jsx:90` | Confirmed — `Tile` destructures only `title`, `value`, `size` | MINOR | verified: 2026-10-14 |
| 8 | The Map's default quick select `"This Year"` matches no option (labels are `This Year - YYYY`). `handleQuickSelect` is a no-op and the Autocomplete shows a non-option value. The range is still correct thanks to the initial state. | `app/ui/src/components/UIElements/Filters.jsx:135`, `app/ui/src/components/UIElements/Filters.jsx:141`, `app/ui/src/components/UIElements/Filters.jsx:152-158` | Confirmed — no `dateRanges` label equals `"This Year"`, so `find` returns `undefined` | MINOR | verified: 2026-10-14 |
| 9 | Unknown airport codes are re-requested on every map redraw. `getAirportData` does not cache failures, and each miss logs a backend warning. | `app/ui/src/components/FlightMap/FlightMap.jsx:34-51`, `app/handlers_airport.go:31` | Confirmed — the `catch` returns `null` without storing anything, so the next draw calls `fetchQuery` again | MINOR | verified: 2026-10-14 |
| 10 | Stale lines after a quick filter change. A cancelled draw run still adds route/track features straight into the shared vector source after the new run's `clear()`; only `addFeatures`/fit are guarded. To confirm: change a filter while per-airport fetches are pending and look for leftover lines. | `app/ui/src/components/FlightMap/FlightMap.jsx:128`, `app/ui/src/components/FlightMap/FlightMap.jsx:165-173`, `app/ui/src/components/FlightMap/FlightMap.jsx:181`; `app/ui/src/components/FlightMap/helpers.jsx:70`, `app/ui/src/components/FlightMap/helpers.jsx:79` | Suspected | MINOR | verified: 2026-10-14 |
| 11 | First Map load can fire one `/airport/{id}` request per unique airport when `mapdata` resolves before `/airport/list`, because `airportsMap` starts as an empty `Map`. To confirm: look at the network tab on a cold `/map` load. | `app/ui/src/components/Map/SummaryFlightMap.jsx:19`, `app/ui/src/components/FlightMap/FlightMap.jsx:26-46` | Suspected | MINOR | verified: 2026-10-14 |
| 12 | One malformed track blob aborts the whole map draw (no try/catch around `JSON.parse(atob())`; `Promise.all` rejects, so markers are never added and the rejection is unhandled). Tracks normally come only from `json.Marshal`. To confirm: put a non-JSON blob in `logbook.track`. | `app/ui/src/components/FlightMap/helpers.jsx:74`, `app/ui/src/components/FlightMap/FlightMap.jsx:180`, `app/handlers_flightrecord.go:142` | Suspected | MINOR | verified: 2026-10-14 |
| 13 | `filterData` mutates the React state object (`filter.start_date = dayjs(...)`). | `app/ui/src/components/UIElements/Filters.jsx:83-84` | Confirmed — `filter` is the `useState` object passed in at `app/ui/src/components/UIElements/Filters.jsx:163`, and the function assigns to its properties | MINOR | verified: 2026-10-14 |
| 14 | Previous-experience ME mapping: the Dashboard uses `me_total_time` for the ME tile and ignores `me_time` (SP ME), while flights contribute SP ME. It is unclear whether this is intended. To confirm: ask the owner. | `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:44`, `app/ui/src/components/Settings/PreviousExperience/PreviousExperience.jsx:31`, `app/ui/src/components/Settings/PreviousExperience/PreviousExperience.jsx:40` | Suspected | MINOR | verified: 2026-10-14 |
| 15 | With an empty logbook, Stats by Year passes `rows={undefined}` to `XDataGrid`, which then passes `undefined` to the MUI grid. To confirm: open `/stats/by-year` on an empty DB. | `app/ui/src/components/Stats/ByYear/TotalsByYear.jsx:95`, `app/ui/src/components/UIElements/XDataGrid/XDataGrid.jsx:144` | Suspected | MINOR | verified: 2026-10-14 |
| 16 | Custom-airport add/edit/delete invalidates only `['custom-airports']`, so the Dashboard/Map airport list `['airports']` is stale for up to 1 h. The server `airportCache` is not cleared by the custom CRUD either, so the map's `/api/airport/{id}` fallback can serve old coordinates (or a deleted airport) until restart, and the browser keeps each `['airports', id]` result for 24 h. Same issues as `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` §11 #14 and #5. | `app/ui/src/components/Airports/AddEditCustomAirportModal.jsx:43`, `app/ui/src/components/Airports/DeleteCustomAirportButton.jsx:20`; `internal/models/airports.go:19`, `internal/models/airports.go:95`; `app/ui/src/components/FlightMap/FlightMap.jsx:44-45` | Confirmed — the only invalidated key is `['custom-airports']`, and `airportCache.Clear()` is called only from `UpdateAirportDB` | MINOR | verified: 2026-10-14 |

## 12. Rules for Future Development

**Recipe 1 — add a new standard time total (new logbook time column) to stats**
1. Backend: the column in `logbookTable` (`internal/driver/db_structure.go:23`) and in `logbook_view` for **both engines** (`internal/driver/db_structure.go:168`), with a `schemaVersion` bump (`internal/driver/db_structure.go:4`); a field in `FlightRecord.Time` (`internal/models/structs.go:40-54`); and every SQL list in `internal/models/flightrecords.go`: `GetFlightRecordByID` (`internal/models/flightrecords.go:27`), `UpdateFlightRecord` (`internal/models/flightrecords.go:61`), `InsertFlightRecord` (`internal/models/flightrecords.go:87`), `GetFlightRecords` (`internal/models/flightrecords.go:128`), `GetFlightRecordsForExport` (`internal/models/flightrecords.go:168`) and `GetFlightRecordsForMap` (`internal/models/flightrecords.go:218`), plus `CalculateTotals` (`internal/models/flightrecords.go:4`). Without the insert/update writers the column is never filled and stats stay 0. Follow `ARCHITECTURE_LOGBOOK.md` and `ARCHITECTURE_DATABASE.md`.
2. `TIME_FIELDS` in `app/ui/src/util/helpers.jsx:53-57` (feeds every aggregator).
3. Field label: a key in `defaultFieldNames` (`app/ui/src/hooks/useSettings.jsx:6-77`, both the `table` and `flightRecord` sections), a `ColumnsHeader` field (`internal/models/structs.go:165-198`) and its default in `standardFieldsHeaders` (`internal/models/models_defaults.go:39-72`). Existing installations keep their stored headers, because the defaults are applied only when `StandardFieldsHeaders.Date == ""` (`internal/models/models_defaults.go:184-187`). With custom names enabled, a missing key falls back to the raw id with a console warning (`app/ui/src/hooks/useSettings.jsx:123-124`), so plan a default for existing installations.
4. Grid column in `createStatsColumns` (`app/ui/src/components/Stats/helpers.jsx:62-117`).
5. Dashboard tile in `app/ui/src/components/Stats/Dashboard/DashboardTiles.jsx:19-33` **and** a switch with the same `key` in `STATS_FILTERS` (`app/ui/src/components/Stats/Dashboard/DashboardOptions.jsx:13-26`).
6. CSV mappers `totals-by-year` and `totals-by-aircraft` (`app/ui/src/components/UIElements/CSVExportButton.jsx:98-133`), using the exact JSON key.
7. If it belongs to previous experience: the `PreviousExperience` struct in `Settings` (`internal/models/structs.go:255-271`), the input list in `app/ui/src/components/Settings/PreviousExperience/PreviousExperience.jsx:27-43`, and the artificial record (`app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx:42-54`).

**Recipe 2 — add a dashboard counter tile** (e.g. "Night landings airports")
1. Add a `Set` or total in `getStats` (`app/ui/src/util/helpers.jsx:120-165`); it is shared by Dashboard and Map.
2. Render it in `app/ui/src/components/Stats/Dashboard/DashboardTiles.jsx:49-57` and/or `app/ui/src/components/Map/SummaryStats.jsx:14-22`.

**Recipe 3 — add a new stats page** (e.g. by registration)
1. Aggregator in `app/ui/src/util/helpers.jsx`. Return rows built with `createInitialTotals({ <key> })` plus `custom_fields[uuid] = {sum,count}`, like `getTotalsByAircraft`.
2. Component in `app/ui/src/components/Stats/<Name>/` using `XDataGrid` + `createStatsColumns`, with a **unique** `tableId` and `getRowId`.
3. Page `app/ui/src/pages/Stats<Name>Page.jsx`, a route in `app/ui/src/main.jsx:71-76`, and a nav child in `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:51-55`.
4. Add a CSV mapper type in `app/ui/src/components/UIElements/CSVExportButton.jsx` if you add a CSV button.
5. Hide the aggregation footer if rows can overlap (see `app/ui/src/components/Stats/ByAircraft/TotalsByAircraftTable.jsx:45`).

**Recipe 4 — add a map option**
1. Default in `DEFAULT_MAP_OPTIONS` (`app/ui/src/components/FlightMap/helpers.jsx:22-38`). Stored options **replace** the defaults (no merge), so read the new key defensively: `options.x?.y ?? DEFAULT_MAP_OPTIONS.x.y`.
2. Control in `app/ui/src/components/FlightMap/MapOptionsModal.jsx` through `handleChange('<path>', value)`.
3. Consume it in the `app/ui/src/components/FlightMap/FlightMap.jsx` draw effect. `options` is already a dependency (`app/ui/src/components/FlightMap/FlightMap.jsx:201`); a change that needs a new OL map must be added to the init effect deps (`app/ui/src/components/FlightMap/FlightMap.jsx:119`).
4. A new base layer goes in `getMapBase` (`app/ui/src/components/FlightMap/helpers.jsx:121-145`) plus a `ToggleButton` (`app/ui/src/components/FlightMap/MapOptionsModal.jsx:165-167`). Keep `crossOrigin: 'anonymous'` or PNG export breaks.

**Recipe 5 — move an aggregation server-side / add an endpoint**
1. Route inside the `r.Route("/api")` group so `app.Auth` applies (`app/routes.go:26-27`). Add `.With(middleware.Compress(5))` for large payloads.
2. Handler `HandlerApi<Entity><Action>` in `app/handlers_logbook.go` (repo idiom: handlers by domain). Every `app.handleError(w, err)` is immediately followed by `return`, because `handleError` only writes the response and does not stop the handler (`app/helpers.go:53-63`; idiom in `app/handlers_logbook.go:10-13`). Answer success with `app.writeJSON`.
3. DBModel method in `internal/models/`, using `ContextWithDefaultTimeout` and `?` placeholders, with SQL valid on SQLite **and** MySQL.
4. Fetcher in `app/ui/src/util/http/logbook.jsx` with a Bearer header, and a hook in `app/ui/src/hooks/queries/` re-exported from `app/ui/src/hooks/queries/index.js`.
5. Put the query key under `['logbook', ...]` so the existing flight-edit invalidations refresh it.

**Recipe 6 — add a custom-field type or stats function**
1. A new type goes in `typeOptions` (`app/ui/src/components/Settings/CustomFields/CustomFieldModal.jsx:22`), with its allowed functions in `statsFunction` (`app/ui/src/components/Settings/CustomFields/CustomFieldModal.jsx:24-30`). The input side follows `ARCHITECTURE_LOGBOOK.md`: `getFieldProps` and the per-type renderers on the flight-record page (`app/ui/src/components/FlightRecord/CustomFields.jsx:12-29`, `app/ui/src/components/FlightRecord/CustomFields.jsx:50-53`) and the logbook column in `createCustomFieldColumns` (`app/ui/src/components/Logbook/helpers.jsx:121-144`).
2. Value → number in `updateCustomFieldTotals` (`app/ui/src/util/helpers.jsx:85-108`).
3. Cell, footer and format in `buildCustomFieldColumns` (`app/ui/src/components/Stats/helpers.jsx:22-60`). The stats function becomes the column's footer `aggregation` (`average` → `avg`, `app/ui/src/components/Stats/helpers.jsx:38`), and `XFooter` aggregates only `sum`/`avg`/`count` or a column-supplied `aggregationFn` (`app/ui/src/components/UIElements/XDataGrid/XFooter.jsx:110`, `app/ui/src/components/UIElements/XDataGrid/XFooter.jsx:158-203`). A new stats function must map to one of these.
4. Tile formula in `calculateStats` (`app/ui/src/components/Stats/Dashboard/CustomFieldsTiles.jsx:14-52`).

**Cross-check list (every change)**
- [ ] SQL/view changes work on both SQLite and MySQL, and `schemaVersion` is bumped when the schema changes.
- [ ] New endpoints are inside the `app.Auth` group, use `writeJSON`, and every `handleError` is followed by `return`.
- [ ] Query keys: logbook-derived data sits under `['logbook', ...]`; never reuse `['airports']` (or any key) for a different payload; mutations invalidate what they change.
- [ ] Dates are `YYYY-MM-DD` and times are integer minutes; format only at display through `formatTimeField` + `timeFieldsFormat`.
- [ ] Artificial records, filter ranges and CSV mapper keys match the real data keys.
- [ ] Category rows overlap, so do not sum them.
- [ ] localStorage option shapes stay backward compatible.
- [ ] `cd app/ui && npm run lint && npm run test:run` (`app/ui/package.json:9`, `app/ui/package.json:12`).
- [ ] `CHANGELOG.md` `[Unreleased]` bullet (`- New:` / `- Update:` / `- Fix:`) **and** the same bullet in the changelog copy in `README.md` (`README.md:64-68`).

## 13. AI Notes

### Mental Model

The backend serves raw rows only. Each stats page pulls the whole logbook once (shared `['logbook']` cache), and pure functions in `app/ui/src/util/helpers.jsx` turn the rows into totals objects of shape `{time:{...minutes}, landings, sim:{time}, distance, custom_fields:{uuid:{sum,count}}}`. `XDataGrid` and `Tile` display them, and `formatTimeField` converts minutes to text at the very end. The Map uses the same filter component on a heavier payload (`mapdata`, with tracks) and draws with OpenLayers. Airport coordinates come from a client-side `Map` built from `/airport/list`, with `/airport/{id}` as the fallback.

### Gotchas

- `['logbook']` (no tracks) and `['logbook','map']` (with tracks) are different payloads. Do not switch the Map to `useLogbookQuery`, because it has no `track`. The Map page still loads `['logbook']` through the Filters autocompletes, so a cold `/map` downloads both payloads (§3).
- Category totals double-count flights by design; only the type view shows a Total footer.
- The landings tile has no switch in `STATS_FILTERS`, so it is always shown (`app/ui/src/components/Stats/Dashboard/DashboardTiles.jsx:32`, `app/ui/src/components/Stats/Dashboard/DashboardOptions.jsx:13-26`).
- The Dashboard defaults to "All Time"; the Map defaults to the current year.
- `cc_time` is computed server-side and omitted when 0, so it must always be read with `|| 0`.
- Route lines and tracks are added to the vector source immediately; markers are added in one batch at the end.
- `GetAircraftModelsCategories` only returns models that appear in the logbook (INNER JOIN).
- Issues #1 and #2 in §11 change the numbers users see; check them before trusting dashboard totals in a bug report.

### File Quick Reference

| Need | File |
|---|---|
| Totals math | `app/ui/src/util/helpers.jsx` |
| Grid columns | `app/ui/src/components/Stats/helpers.jsx` |
| Dashboard | `app/ui/src/components/Stats/Dashboard/TotalsDashboard.jsx` |
| Map drawing | `app/ui/src/components/FlightMap/FlightMap.jsx`, `app/ui/src/components/FlightMap/helpers.jsx` |
| Map page | `app/ui/src/components/Map/SummaryFlightMap.jsx` |
| Filters | `app/ui/src/components/UIElements/Filters.jsx` |
| Endpoints | `app/handlers_logbook.go`, `app/routes.go:34-35` |
| SQL | `internal/models/flightrecords.go:128`, `internal/models/flightrecords.go:218`; views in `internal/driver/db_structure.go:168`, `internal/driver/db_structure.go:229` |

> **AI Usage Instructions**
> - Always read this file before modifying this system
> - Do not refactor without impact analysis
> - Ask if information is missing
