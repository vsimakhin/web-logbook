# Database — Architecture

**Last Updated:** 2026-10-14 — initial version generated from code and fact-checked (TASK_AGENT_WORKFLOW_SETUP); 2026-10-14 — §11 #6/#7/#8/#17 aligned and cross-linked with sibling docs (consistency pass)

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

The database layer stores the whole pilot logbook: flight records, aircraft, airports, licences, currencies, attachments, persons, custom fields, settings and auth tokens. It supports two engines through `database/sql`: **SQLite** (`modernc.org/sqlite`, the default, a single local file) and **MySQL** (`github.com/go-sql-driver/mysql`). Both drivers are blank-imported in `internal/driver/driver.go:13-15`. The engine and DSN come from the `-engine` / `-dsn` flags (`app/main.go:85-86`).

`internal/driver` owns the schema. The schema is **declarative**: Go values in `internal/driver/db_structure.go` describe tables, columns and views, with one DDL variant per engine. At startup `OpenDB` → `validateDB` (`internal/driver/driver.go:23-94`) reconciles the live database with those values. Reconciliation only adds things: it creates missing tables, adds missing columns and indexes, and drops and recreates views. It never changes a column type and never drops a table or column. Data/type changes need an explicit migration. The only migration today is the v5 "data overhaul" (`internal/driver/data_overhaul.go`). It converts legacy `HH:MM` time strings to integer minutes and `DD/MM/YYYY` dates to ISO `YYYY-MM-DD`. All runtime SQL lives in `internal/models` as methods on `DBModel` (`internal/models/structs.go:12-14`). `DBModel` wraps a `*sql.DB` and carries **no engine information**. `internal/models/helpers.go` provides the query-timeout helpers and the airport-distance cache.

## 2. Key Concepts

| Concept | Definition / invariant | Evidence |
|---|---|---|
| Engine key | The strings `"sqlite"` / `"mysql"` are used three ways: as the `database/sql` driver name, as the key into the DDL `queries` map, and as the key into every `ColumnType` / `SQLQuery` map. | `SQLite`/`MySQL` consts `internal/driver/db_operations.go:11-12`; `sql.Open(engine, dsn)` `internal/driver/driver.go:24` |
| `schemaVersion` | A string holding an integer, currently `"101"`. Reconciliation runs only when the stored version differs from it. | `internal/driver/db_structure.go:4`; `internal/driver/driver.go:56` |
| `metadata` table | Append-only history of applied schema versions. The "current" version is the row with the greatest `created_at` **string**. | `metadataTable` `internal/driver/db_structure.go:17-21`; `getSchemaVersion` `internal/driver/driver.go:96-117` |
| Declarative table | `Table{Name, PrimaryKeyName, PrimaryKeyType, Columns}`. A table is created with the PK column only. Every other column is then added with `ALTER TABLE ... ADD COLUMN`, also on a fresh DB. | `internal/driver/db_operations.go:60-65`, `:30`, `:167-173` |
| `ColumnType` | Map from engine to SQL type. The shared type vocabulary is `UUID`, `DateTime`, `SmallText`, `BigText`, `FullText`, `SmallInt`, `Int`, `Real`, `Blob`. | `internal/driver/db_structure.go:6-14` |
| View | `View{Name, Query SQLQuery}` with one SQL text per engine. It is always dropped and recreated during reconciliation. | `internal/driver/db_operations.go:69-72`, `:231-241` |
| Index | `Column.Index: true` creates the index `<table>_<column>`. Only `airports.iata` and `tokens.username` use it. | `internal/driver/db_operations.go:209`, `:223`; `internal/driver/db_structure.go:58`, `:104` |
| Time = integer minutes | Since v5 every flight-time column, the duration custom fields and `previous_experience` hold integer minutes. Go structs use `int`. | `internal/models/structs.go:40-54`, `:255-271`; `internal/driver/data_overhaul.go:46-65` |
| Date = ISO text | `logbook.date`, licence dates and the currency "since" date are stored as `YYYY-MM-DD` text. Departure/arrival times are `HHMM` text. | `dateFormat` `internal/driver/data_overhaul.go:15`; parse layout `"2006-01-02 1504"` in `app/helpers.go:78`, `:88` |
| Overhaul gate | The data overhaul runs only if the stored version is an integer `< 100`. Non-integer (dotted) versions skip it. | `internal/driver/driver.go:47-54` |
| Views as the read model | Model reads of the logbook go through `logbook_view`, which adds `rn`, `prev_uuid`, `next_uuid`, `has_track`, `attachments_count` and NULL defaults for some columns (§5.2). Writes go to the `logbook` table. Exceptions: `UpdateFlightRecordsDistance` reads `logbook` directly (without the view's NULL defaults), and `aircrafts_view` / `attachments_view` join `logbook`. | `internal/driver/db_structure.go:168-227`; `internal/models/flightrecords.go:39`, `:66`; exceptions `internal/models/helpers.go:69`, `internal/driver/db_structure.go:266`, `:318` |
| Default timeout | Every model query uses a 60 s context unless it chooses another value. | `DefaultTimeout` `internal/models/helpers.go:14`, `ContextWithDefaultTimeout` `:22-24` |
| No foreign keys | No FK constraints are declared. Cascades are done by hand in handlers/models. | `internal/driver/db_structure.go` (no FK clauses); `HandlerApiFlightRecordDelete` `app/handlers_flightrecord.go:52-70` |

## 3. How It Works

### 3.1 Startup sequence (DB-relevant steps of `main`)

| # | Step | Evidence |
|---|---|---|
| 1 | Parse `-engine` (default `sqlite`) and `-dsn` (default `web-logbook.sql`). | `app/main.go:85-86` |
| 2 | `createDBConnection` → `driver.OpenDB`: `sql.Open`, `Ping`, `validateDB`. Any error is fatal. | `app/main.go:111-117`, `:138-141`; `internal/driver/driver.go:23-40` |
| 3 | Optional `-disable-authentication`: rewrites settings and exits. | `app/main.go:154-161` |
| 4 | `CheckDefaultValues` fills empty settings parts (PDF export, airport source, headers). | `app/main.go:164`; `internal/models/models_defaults.go:151` |
| 5 | If the `airports` table is empty, download the airport DB and run `UpdateAirportDB` (one transaction, 300 s). | `app/main.go:171-191`; `internal/models/airports.go:55-99` |
| 6 | `GetSettings` → cache `timeFieldsAutoFormat` on the app. | `app/main.go:194-199` |
| 7 | `go CreateDistanceCache()` (background) and `UpdateFlightRecordsDistance()` (synchronous, fills `distance IS NULL`). | `app/main.go:202-206`; `internal/models/helpers.go:65-129` |

### 3.2 `validateDB` decision table

`metadataTable.initTable` always runs first (`internal/driver/driver.go:44`). Then the latest version is read:

| Stored version (`getSchemaVersion`) | Data overhaul | Tables/views reconciled + settings seeded | New `metadata` row |
|---|---|---|---|
| no row / any query error → `"unknown"` | no | yes | `101` |
| integer `< 100` (e.g. `"45"` = v4.x) | **yes**, before reconciliation | yes | `101` |
| non-integer (e.g. `"3.1.0"`, `"2.0.3"`) | no (`strconv.Atoi` fails) | yes | `101` |
| `"101"` | no | **no** (nothing touched) | — |
| other integer `>= 100` (e.g. a future `"102"` read by an older binary) | no | yes (recreates *this* binary's views) | `101` |

Evidence: `internal/driver/driver.go:45-91`, `:96-117`.

### 3.3 Reconciliation steps (version mismatch branch)

| Step | What happens | Evidence |
|---|---|---|
| Tables | For each of the 13 tables, in slice order: `isExists` (`SELECT * FROM t WHERE 1=2`) → `createTable` (PK only) → `ensureColumnsExist` (list existing columns, `ALTER TABLE ADD COLUMN` for missing ones, then `ensureIndexExists` for `Index` columns). | `internal/driver/driver.go:60-70`; `internal/driver/db_operations.go:94-228` |
| Views | `logbook_view`, `airports_view`, `aircrafts_view`, `attachments_view`: `DROP VIEW IF EXISTS` (error ignored), then `CREATE VIEW`. | `internal/driver/driver.go:73-78`; `internal/driver/db_operations.go:231-266` |
| Settings seed | If `settings2` is empty, insert row `id=0` with JSON `{owner_name:"Owner Name", signature_text:"I certify..."}` (all other fields zero, so `auth_enabled=false`). | `checkSettingsTable` `internal/driver/driver.go:129-158` |
| Stamp | `INSERT INTO metadata (version, created_at)` with `created_at` formatted `20060102 15:04:05`. | `updateSchemaVersion` `internal/driver/driver.go:119-126` |

### 3.4 v5 data overhaul (`dataOverhaulMigration`)

This runs in a single transaction (`BeginTx`, deferred `Rollback`, one 300 s context): `internal/driver/data_overhaul.go:428-474`.

| Order | Function | Effect | Evidence |
|---|---|---|---|
| 1 | `getDurationFields` | Collects the UUIDs of `custom_fields` with `type='duration'`. | `internal/driver/data_overhaul.go:67-91` |
| 2 | `migrateFlightRecords` → `readFlightRecordUpdates` | `readFlightRecordUpdates` (`:132-188`) reads all logbook rows and converts `date` (`02/01/2006` → `2006-01-02`, error aborts), the 11 time columns with `parseTimeToMinutes` and the duration values inside the `custom_fields` JSON. `migrateFlightRecords` (`:190-243`) then runs a prepared `UPDATE` per row (`:198-240`). | `internal/driver/data_overhaul.go:132-243` |
| 3 | `migratePreviousExperience` | In the `settings2` JSON, `previous_experience` time strings become minutes and missing keys become 0 (query errors are ignored, §11 #24). | `internal/driver/data_overhaul.go:245-309` |
| 4 | `migrateCurrencyDates` | `currency.time_frame_since` is converted where `time_frame_unit='since'`. | `internal/driver/data_overhaul.go:311-351` |
| 5 | `migrateLicensingDates` | Non-empty `issued`/`valid_from`/`valid_until` are converted. | `internal/driver/data_overhaul.go:353-405` |
| 6 | `migrateLogbookTimeColumns` (**MySQL only**) | `ALTER TABLE logbook MODIFY <11 time cols> INT NOT NULL DEFAULT 0`. | `internal/driver/data_overhaul.go:407-426`, `:461-465` |
| 7 | `tx.Commit()` | — | `internal/driver/data_overhaul.go:467` |

`parseTimeToMinutes` accepts an integer string (returned as-is) or `H:MM`. Anything else returns `0` (`internal/driver/data_overhaul.go:46-65`). SQLite column types are **not** altered (see §11 #10).

## 4. Components & Files

### 4.1 File Index

| File | Responsibility |
|---|---|
| `internal/driver/driver.go` | `OpenDB`, `validateDB`, schema-version read/write, settings seed, default owner/signature constants. |
| `internal/driver/db_structure.go` | `schemaVersion`, the `ColumnType` vocabulary, the 14 table definitions (`metadata` plus the 13 reconciled in `validateDB`) and the 4 view definitions (SQLite + MySQL SQL). |
| `internal/driver/db_operations.go` | Engine DDL templates (`queries`), `Column`/`Table`/`View` types, create/alter/index/view helpers. |
| `internal/driver/data_overhaul.go` | One-off v5 migration of times → minutes and dates → ISO. |
| `internal/models/helpers.go` | `DefaultTimeout`, context helpers, `Distance` + `distanceCache`, `processFlightrecord` (cross-country), `UpdateFlightRecordsDistance`, `CreateDistanceCache`. |
| `internal/models/structs.go` | `DBModel` and all row/DTO structs (see §5.5). |
| `internal/models/*.go` (other) | Per-domain SQL. These files are owned by the domain docs (§9). |
| `app/main.go` | Flags, `createDBConnection`, startup DB tasks. |
| `app/handlers_db.go` | DB file name, upload (SQLite only) and download endpoints. |
| `docker/release.Dockerfile` | Default container DSN `/data/web-logbook.sql` (`:41`) and the `/data` volume (`:35`). |

### 4.2 API Endpoints

All are inside the `r.Use(app.Auth)` group (`app/routes.go:26-27`, `:150-154`, `:162`).

| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/api/db/filename` | `HandlerApiDBFile` `app/handlers_db.go:12-14` | Returns the raw `-dsn` string (see §11 #7). |
| POST | `/api/db/upload-db` | `HandlerApiUploadDB` `app/handlers_db.go:16-61` | Multipart field `dbfile`. SQLite only. Closes the pool, overwrites the file and reopens it through `createDBConnection`, so `validateDB` and possibly the overhaul run on the uploaded file. Not atomic (§11 #20). |
| GET | `/api/db/download-db` | `HandlerApiDownloadDB` `app/handlers_db.go:63-88` | Streams the file at the DSN path as `application/octet-stream`. Returns 404 for MySQL (the DSN is not a file). |
| GET | `/api/distance/{departure}/{arrival}` | `HandlerDistance` `app/handlers_aux.go:41-46` | Thin wrapper over `DBModel.Distance`. |

### 4.3 Data Access

**Infrastructure methods (`internal/models/helpers.go`)**

| Method | Purpose | Tables/views | Timeout |
|---|---|---|---|
| `ContextWithTimeout` `:17-19` / `ContextWithDefaultTimeout` `:22-24` | Context factory for every model query. | — | caller / 60 s |
| `Distance` `:29-54` | Great-circle distance in NM between two airport codes. Memoised in `distanceCache`. | `airports_view` via `GetAirportByID` | 60 s (inherited) |
| `processFlightrecord` `:56-63` | Sets `Time.CrossCountry = Total` when departure ≠ arrival. Not stored. | — | — |
| `UpdateFlightRecordsDistance` `:65-103` | Fills `logbook.distance` where it is NULL. One transaction. | `logbook` | 60 s |
| `CreateDistanceCache` `:106-129` | Clears and pre-fills `distanceCache` for every distinct route. | `logbook_view` | 120 s |

Distance semantics, airport lookups and cache behaviour from the airport side: see `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` (§4.3, §5).

**Which model file touches which table/view** (line = SQL statement)

| Table / view | Read | Written |
|---|---|---|
| `logbook` | `internal/models/helpers.go:69`; `internal/driver/data_overhaul.go:138` | `internal/models/flightrecords.go:66`, `:94`, `:123`, `:209`, `:278`; `internal/models/aircrafts.go:197`; `internal/models/helpers.go:91`; `internal/driver/data_overhaul.go:199` |
| `logbook_view` | `internal/models/flightrecords.go:39`, `:140`, `:179`, `:230`, `:262`; `internal/models/aircrafts.go:20`, `:36`, `:49`, `:57`, `:72`, `:96`; `internal/models/persons.go:159`; `internal/models/helpers.go:113` | — (view) |
| `airports` / `airports_custom` / `airports_view` | `internal/models/airports.go:50`, `:132` / `:138`, `:148` / `:27`, `:126` | `internal/models/airports.go:65`, `:78` / `:154`, `:172`, `:182` |
| `aircrafts` / `aircrafts_view` / `aircraft_categories` | `internal/models/aircrafts.go:25` (subquery) / `:132`, `:171` / `:73`, `:95` | `internal/models/aircrafts.go:18`, `:33`, `:46`, `:190` / — / `:70`, `:158` |
| `attachments` / `attachments_view` | `attachments_view`: `internal/models/attachments.go:15`, `:42`, `:102` | `internal/models/attachments.go:68`, `:79`, `:89` |
| `licensing` | `internal/models/licensing.go:11`, `:39`; `internal/driver/data_overhaul.go:356` | `internal/models/licensing.go:57`, `:69`, `:88`, `:105`, `:114`; `internal/driver/data_overhaul.go:395` |
| `currency` | `internal/models/currency.go:10`, `:36`; `internal/driver/data_overhaul.go:314` | `internal/models/currency.go:50`, `:64`, `:76`; `internal/driver/data_overhaul.go:343` |
| `custom_fields` | `internal/models/custom_fields.go:10`, `:37`; `internal/driver/data_overhaul.go:68` | `internal/models/custom_fields.go:52`, `:68`, `:83` |
| `persons` / `person_to_log` | `internal/models/persons.go:35`, `:40`, `:74` / `:49`, `:113`, `:158`, `:204` | `internal/models/persons.go:80`, `:99`, `:194` / `:119`, `:137`, `:147`, `:187` |
| `settings2` | `internal/models/settings.go:17`; `internal/driver/driver.go:137`; `internal/driver/data_overhaul.go:250` | `internal/models/settings.go:59`; `internal/driver/driver.go:153`; `internal/driver/data_overhaul.go:306` |
| `tokens` | `internal/models/auth.go:55` | `internal/models/auth.go:102`, `:115` |
| `metadata` | `internal/driver/driver.go:100` | `internal/driver/driver.go:123` |

**Transactions in use:** `GenerateAircraftTable` (`internal/models/aircrafts.go:12-84`), `UpdateAirportDB` (`internal/models/airports.go:60-92`), `UpdateFlightRecordsDistance` (`internal/models/helpers.go:78-102`), `dataOverhaulMigration` (`internal/driver/data_overhaul.go:432-467`). The model transactions use `m.DB.Begin()` without a context, so only the statements are bounded by the context.

### 4.4 UI

| Item | Role | Evidence |
|---|---|---|
| `DBActionsMenu` | Settings → General toolbar menu with upload/download items. | `app/ui/src/components/Settings/GeneralSettings/DBControl/DBActionsMenu.jsx:11-34`; mounted at `app/ui/src/components/Settings/GeneralSettings/GeneralSettings.jsx:18` |
| `DBUploadButton` | Confirms ("All data will be replaced!") and posts `FormData{dbfile}`. On success it calls `queryClient.invalidateQueries()` with no key, which invalidates **all** queries. The file picker `accept` is derived from the DSN extension. | `app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx:17-24`, `:26-32`, `:36-53` |
| `DBDownloadButton` | Downloads the blob and names it after the last path segment of the DSN. | `app/ui/src/components/Settings/GeneralSettings/DBControl/DBDownloadButton.jsx:23-32` |
| Query key `['db','filename']` | Inline `useQuery`, `staleTime`/`gcTime` 24 h. | `app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx:17-23` |
| HTTP client | `fetchDBFileName`, `uploadDBFile`, `downloadDBFile` (the last two use `returnJson=false`, so they return a blob). | `app/ui/src/util/http/db.jsx:5-31`; `handleFetch` `app/ui/src/util/http/http.jsx:13-31` |

## 5. Data Model & Persistence

### 5.1 Tables (`internal/driver/db_structure.go`)

| Table | PK (type) | Notable columns | Lines |
|---|---|---|---|
| `metadata` | `id` (SQLite `INTEGER` rowid / MySQL `INT UNSIGNED AUTO_INCREMENT`) | `version VARCHAR(32) NOT NULL`, `created_at` | `:17-21` |
| `logbook` | `uuid` | `date NOT NULL`, place/time text, 11 time cols + 2 landing cols `SmallInt NOT NULL DEFAULT 0`, `distance Real`, `track Blob`, `custom_fields FullText`, `tags BigText NOT NULL DEFAULT ''`, `signature FullText` | `:23-53` |
| `airports` | `icao` | `iata` (indexed), name/city/country, `elevation`, `lat`, `lon` | `:55-65` |
| `airports_custom` | `name` (the code; the name is kept for backward compatibility) | `full_name NOT NULL DEFAULT ''`, location columns | `:67-75` |
| `settings2` | `id SmallInt` (one row, `id=0`) | `settings FullText` (JSON of `models.Settings`) | `:77-80` |
| `licensing` | `uuid` | category/name/number, `issued`/`valid_from`/`valid_until`, `document_name`, `document Blob`, `remarks` | `:82-93` |
| `attachments` | `uuid` | `record_id` (logbook uuid), `document_name`, `document Blob` | `:95-100` |
| `tokens` | `id` (auto-increment) | `username UUID NOT NULL` (indexed), `token BigText`, `created_at` | `:102-107` |
| `aircrafts` | `reg_name` | `aircraft_model NOT NULL`, `custom_categories NOT NULL DEFAULT ''` | `:109-113` |
| `aircraft_categories` | `model` | `categories NOT NULL`, `time_fields_auto_fill FullText` (JSON) | `:115-119` |
| `currency` | `uuid` | name, metric, target, `time_frame_*`, comparison, `filters`/`sub_metrics` FullText (JSON) | `:121-132` |
| `custom_fields` | `uuid` | name, description, `category DEFAULT 'Custom'`, `type`, `stats_function`, sizes, `display_order` | `:134-145` |
| `persons` | `uuid` | first/middle/last name, phone, email, remarks | `:147-155` |
| `person_to_log` | `uuid` (unused surrogate; see the TODO) | `person_uuid`, `log_uuid`, `role` | `:157-166` |

### 5.2 Views

| View | Purpose | Engine differences | Lines |
|---|---|---|---|
| `logbook_view` | CTE + window functions. `rn = ROW_NUMBER() OVER (ORDER BY date, departure_time)`, `prev_uuid`/`next_uuid` via `LAG`/`LEAD` (no unique tie-breaker, §11 #22), `has_track`, `attachments_count` (grouped subquery on `attachments`). NULL → `0`/`''`/`'{}'` defaults only for landings, `distance`, `custom_fields`, `tags` and `signature`. The other text columns (`departure_*`, `arrival_*`, `aircraft_model`, `reg_name`, `sim_type`, `pic_name`, `remarks`) pass through raw. | SQLite also maps `''` landings to 0 with `NULLIF`. MySQL only uses `IFNULL`. | `:168-227` |
| `airports_view` | `airports UNION airports_custom` (custom code is upper-cased into both `icao` and `iata`). | identical | `:229-242` |
| `aircrafts_view` | Joins `aircrafts`, `aircraft_categories` and `logbook`. Merged `categories` string, `SUM(total_time)`. | SQLite uses `||`, MySQL uses `CONCAT` | `:244-293` |
| `attachments_view` | Attachment plus `document_size` (KB) and `flight_date`/`flight_info` from `logbook`. | identical text (both use `CONCAT`) | `:295-342` |

### 5.3 Type mapping (`internal/driver/db_structure.go:6-14`)

| Alias | SQLite | MySQL |
|---|---|---|
| `UUID` | TEXT | VARCHAR(36) |
| `DateTime` | TEXT | VARCHAR(32) |
| `SmallText` / `BigText` | TEXT | VARCHAR(255) / VARCHAR(512) |
| `FullText` | TEXT | TEXT |
| `SmallInt` / `Int` | INTEGER | SMALLINT / INT |
| `Real` | REAL | FLOAT |
| `Blob` | BLOB | LONGBLOB |

### 5.4 Stored formats and JSON blobs

| Data | Format | Evidence |
|---|---|---|
| Flight times, sim time, `previous_experience` | integer minutes | `internal/models/structs.go:40-54`, `:59-62`, `:255-271` |
| `logbook.date`, licence dates, currency since | `YYYY-MM-DD` | `internal/driver/data_overhaul.go:15`, `:311-405` |
| Departure/arrival time | `HHMM` text | `app/helpers.go:78`, `:88` |
| `logbook.custom_fields` | JSON object keyed by custom-field UUID. Duration values are minutes. The view default is `'{}'`. | `internal/driver/data_overhaul.go:93-130`; `internal/driver/db_structure.go:184` |
| `logbook.track` | JSON `[[lat,lon],...]` stored as BLOB. Sent to the UI as base64 (`[]byte`). | `app/handlers_flightrecord.go:130-148`; `internal/models/structs.go:68` |
| `logbook.tags` | comma-separated string | `app/ui/src/components/UIElements/FlightTags.jsx:9` |
| `settings2.settings` | JSON of `models.Settings` (row `id=0`) | `internal/models/settings.go:17-25`, `:54-60` |
| `metadata.created_at` | `20060102 15:04:05`. Rows written by app versions before 3.0.0-alpha1 used `02.01.2006 15:04:05` (git `dcf1263` → `a46e936`). | `internal/driver/driver.go:124` |
| `tokens.created_at` | `2006-01-02 15:04:05` | `internal/models/auth.go:102-103` |

### 5.5 `internal/models/structs.go` overview

| Struct | Lines | Backing store |
|---|---|---|
| `DBModel` | `:12-14` | `*sql.DB` only (no engine) |
| `JSONResponse` | `:17-22` | API envelope `{ok,message,redirect_url,data}` |
| `FlightRecord` (+`DisplayName`) | `:25-88` | `logbook` / `logbook_view`. Calculated fields `:73-78`. |
| `Airport` | `:91-100` | `airports`, `airports_custom`, `airports_view` |
| `Person`, `PersonToLog`, `PersonForLog`, `FlightRecordForPerson` | `:103-137` | `persons`, `person_to_log` (`TotalTime` is still `string`, `:131`) |
| `ColumnsWidth`, `ColumnsHeader`, `ExportPDF` | `:139-218` | inside the settings JSON (`export_a4`, `export_a5`) |
| `Settings` | `:221-272` | `settings2.settings` JSON |
| `License` / `Attachment` | `:275-286` / `:289-298` | `licensing` / `attachments_view` |
| `Aircraft` / `Category` | `:301-308` / `:310-324` | `aircrafts_view` / `aircraft_categories` |
| `Currency` / `CustomField` | `:327-340` / `:343-354` | `currency` / `custom_fields` |

### 5.6 In-memory state (lost on restart, not reset by DB upload)

All three maps are unexported package variables of `internal/models`, so code outside that package (e.g. `HandlerApiUploadDB` in `package main`) cannot clear them directly (§12 R7). The airport-side behaviour of `airportCache` and `distanceCache` is described in `ARCHITECTURE_AIRCRAFT_AIRPORTS.md`.

| Cache | Key → value | Cleared by |
|---|---|---|
| `distanceCache` `internal/models/helpers.go:26` | `max(dep,arr)+min(dep,arr)` → NM | `CreateDistanceCache` (`:111`), which runs at startup and after `UpdateAirportDB` (`internal/models/airports.go:96`) |
| `airportCache` `internal/models/airports.go:13` | code → `Airport` (found airports only) | `UpdateAirportDB` (`:95`) |
| `authCache` `internal/models/auth.go:11` | `secretKey`, `isAuthEnabled`, `token` | `UpdateSettings` (`internal/models/settings.go:65`) |

## 6. Data Flow

**Read logbook:** `LogbookPage` → `useLogbookQuery` (key `['logbook']`, `app/ui/src/hooks/queries/useLogbookQuery.js:4-11`) → `fetchLogbookData` GET `/api/logbook/data` (`app/ui/src/util/http/logbook.jsx:40-47`) → `HandlerApiLogbookData` (`app/handlers_logbook.go:8-16`) → `GetFlightRecords` (`internal/models/flightrecords.go:128-165`) → `logbook_view` ordered `date desc, departure_time desc` → per row `processFlightrecord` → JSON.

**Create flight:** POST `/api/logbook/new` → `HandlerApiFlightRecordNew` (`app/handlers_flightrecord.go:73-103`) generates the UUID → `InsertFlightRecord` (`internal/models/flightrecords.go:87-116`) computes `distance` with `Distance` → `INSERT logbook` → `GenerateAircraftTable` (transaction over `aircrafts`/`aircraft_categories` derived from `logbook_view`; the error is ignored at `app/handlers_flightrecord.go:95`).

**Upgrade start (v4 → v5):** `OpenDB` → `validateDB` reads `"45"` → `dataOverhaulMigration` (one transaction) → table/column/index reconciliation → views recreated → `metadata` gets `101` (§3.2-3.4).

**DB upload (SQLite):** `DBUploadButton` → POST `/api/db/upload-db` → `HandlerApiUploadDB` closes `app.db.DB`, truncates and writes the DSN file, then runs `createDBConnection` (full `validateDB`) and swaps `app.db` → the UI invalidates all queries.

## 7. Config & Constants

| Name | Value | Kind | Evidence |
|---|---|---|---|
| `-engine` | `sqlite` (or `mysql`) | (configurable) | `app/main.go:85` |
| `-dsn` | `web-logbook.sql` (SQLite path) or `user:pass@tcp(host)/db` | (configurable) | `app/main.go:86`; `README.md:307-315` |
| Docker DSN | `/data/web-logbook.sql` | (configurable, CMD arg) | `docker/release.Dockerfile:41` |
| `schemaVersion` | `"101"` | (hardcoded) | `internal/driver/db_structure.go:4` |
| Overhaul threshold | stored version `< 100` | (hardcoded) | `internal/driver/driver.go:49` |
| `DefaultTimeout` (models) | 60 s | (hardcoded) | `internal/models/helpers.go:14` |
| Schema version read/write, settings seed | 60 s each | (hardcoded) | `internal/driver/driver.go:97`, `:120`, `:130` |
| `initTable` / `initView` / `dropView` | 300 s each | (hardcoded) | `internal/driver/db_operations.go:95`, `:232`, `:245` |
| `dataOverhaulMigration` (whole transaction) | 300 s | (hardcoded) | `internal/driver/data_overhaul.go:429` |
| `UpdateFlightRecordsDistance` / `CreateDistanceCache` | 60 s / 120 s | (hardcoded) | `internal/models/helpers.go:66`, `:107` |
| `UpdateAirportDB` | 300 s | (hardcoded) | `internal/models/airports.go:56` |
| Legacy / new date layout | `02/01/2006` → `2006-01-02` | (hardcoded) | `internal/driver/data_overhaul.go:14-15` |
| `metadata.created_at` layout | `20060102 15:04:05` | (hardcoded) | `internal/driver/driver.go:124` |
| Seed owner / signature | `Owner Name` / `I certify that the entries in this log are true.` | (hardcoded) | `internal/driver/driver.go:19-20` |
| Index name | `<table>_<column>` | (hardcoded) | `internal/driver/db_operations.go:223` |
| Upload multipart memory | `1000 << 20` bytes | (hardcoded) | `app/handlers_db.go:22` |
| UI DB filename cache | 86 400 000 ms | (hardcoded) | `app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx:20-21` |
| Driver versions | `go-sql-driver/mysql v1.10.1`, `modernc.org/sqlite v1.60.1` | (go.mod) | `go.mod:9`, `go.mod:15` |
| Pool limits / SQLite pragmas | **Not found in code.** No `SetMaxOpenConns`, `busy_timeout` or `journal_mode`. | — | `internal/driver/driver.go:23-40` |

## 8. Error Handling & Edge Cases

| Case | Behaviour | Evidence |
|---|---|---|
| Unknown engine string | `sql.Open` fails → `OpenDB` returns the error → `errorLog.Fatalln`. | `internal/driver/driver.go:24-27`; `app/main.go:139-141` |
| Overhaul error | Wrapped as `migration failed: ...`, which makes startup fatal. The SQLite transaction rolls back. | `internal/driver/driver.go:50-52`; `internal/driver/data_overhaul.go:436` |
| Legacy date not `DD/MM/YYYY` | The overhaul aborts with `invalid flight date "<v>" for <uuid>`. | `internal/driver/data_overhaul.go:162-165` |
| Unparseable legacy time | Silently becomes `0`. | `internal/driver/data_overhaul.go:55-63` |
| Metadata read error | Printed. The version is treated as `"unknown"`. | `internal/driver/driver.go:101-109` |
| `metadataTable.initTable` error | Ignored. | `internal/driver/driver.go:44` |
| `isExists` | Any error, not only "no such table", counts as "table missing" → `CREATE TABLE` is attempted. | `internal/driver/db_operations.go:115-120` |
| Add column fails | `failed to add column X to table Y: ...` → startup fatal. | `internal/driver/db_operations.go:169-172` |
| View drop error | Ignored. The `CREATE VIEW` error is returned. | `internal/driver/db_operations.go:235-239` |
| MySQL < 8.0 / old MariaDB | `logbook_view` needs a CTE and window functions, so view creation fails on servers without them. | `internal/driver/db_structure.go:199-225` |
| NULL in a scanned column | Model scans target plain Go types. A NULL that the view does not default fails the scan (`converting NULL to ...`). | e.g. `internal/models/flightrecords.go:150-156` |
| Driver logging | `fmt.Print*` to stdout only. It does not reach `weblogbook-output.log`, because the app loggers are created separately. | `internal/driver/driver.go:57`, `:104-112`; `app/main.go:97-108` |
| Upload on MySQL | Rejected: `upload DB supported for SQLite engine only`. | `app/handlers_db.go:17-20` |
| Upload: `os.Create` / `io.Copy` fails | 500, but `app.db.DB` was already closed and is not reopened, so every later request fails until restart (§11 #20). | `app/handlers_db.go:36-51` |
| Upload: reopen fails | `errorLog.Fatalln` → the process exits. The on-disk file is already replaced (§11 #20). | `app/handlers_db.go:39-56` |
| Download on MySQL | `os.Open(dsn)` fails → 404 `File not found`. | `app/handlers_db.go:64-67` |
| Distance for unknown airport | `GetAirportByID` returns a zero `Airport` and `nil` error, so the distance is computed from (0,0) (§11 #6). | `internal/models/airports.go:32-35`; `internal/models/helpers.go:45-52` |
| Distance for the same place | `0`, not cached. | `internal/models/helpers.go:30-32` |

## 9. Integration Points

| Doc | What crosses the boundary |
|---|---|
| `ARCHITECTURE_APPLICATION.md` | `createDBConnection`, startup order, `app.db` value, DB upload/download handlers, `handleError` → 500 JSON (`app/helpers.go:53-63`). |
| `ARCHITECTURE_AUTH.md` | `tokens` table, `settings2.auth_enabled`/`hash`/`secret_key`, `authCache`, `-disable-authentication` → `DisableAuthorization` (`internal/models/auth.go:125-139`). |
| `ARCHITECTURE_SETTINGS.md` | `settings2` single-row JSON. The seed comes from `checkSettingsTable`, the defaults from `CheckDefaultValues`. The overhaul rewrites `previous_experience`. |
| `ARCHITECTURE_LOGBOOK.md` | `logbook` table + `logbook_view`, `custom_fields` table/JSON, `GenerateAircraftTable` side effect, time/date storage formats. |
| `ARCHITECTURE_STATS_AND_MAP.md` | `/api/logbook/mapdata` reads `logbook_view` incl. `track`. Distances come from `Distance`/`distanceCache`. |
| `ARCHITECTURE_PERSONS.md` | `persons`, `person_to_log` (no FK, orphan rows §11 #16). |
| `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` | `aircrafts`, `aircraft_categories`, `aircrafts_view`, `airports*`, airport download, `airportCache`, `distanceCache`. |
| `ARCHITECTURE_CURRENCY_LICENSING.md` | `currency`, `licensing`, `attachments`, `attachments_view`. The overhaul converts their dates. |
| `ARCHITECTURE_PDF_EXPORT.md` | `GetFlightRecordsForExport`, `CalculateTotals` (`internal/models/flightrecords.go:4-24`), export settings inside the settings JSON. |
| `ARCHITECTURE_IMPORT.md` | The import inserts through `InsertFlightRecord`/`AddPerson`/`AddPersonToLog`, then calls `GenerateAircraftTable` (`app/handlers_import.go:217`, `:347`). |
| `ARCHITECTURE_FRONTEND.md` | `handleFetch`, global `queryClient.invalidateQueries()` after a DB upload. |

## 10. Testing

| Item | State |
|---|---|
| Driver/model tests | **None.** There is no test file in `internal/driver` or `internal/models`. The only Go tests are `app/handlers_import_test.go` and `internal/nighttime/nighttime_test.go`. |
| How to run | `make test` → `go test -v ./... -coverpkg=./...` (`Makefile:32-33`). It needs `make build_ui` first (`app/ui/dist` embed). |
| CI | `.github/workflows/go.yml` runs vet + tests. It has no MySQL service, so the MySQL paths are never exercised. |
| Gaps (highest value first) | 1) Pure functions `convertDate`, `parseTimeToMinutes`, `migrateCustomFields` (`internal/driver/data_overhaul.go:37-130`). 2) `validateDB` on a temp-file SQLite DB (`t.TempDir()`; avoid `:memory:` because each pooled connection gets its own DB): fresh DB, v4 fixture (`"45"`, `HH:MM`, `DD/MM/YYYY`), already-migrated DB, metadata with mixed `created_at` formats. 3) `ensureColumnsExist` adds a new column to a populated table. 4) The `Distance` cache key and the unknown-airport case. |

## 11. Known Issues & Tech Debt

| # | Issue | Location | Status | Severity | verified: 2026-10-14 |
|---|---|---|---|---|---|
| 1 | The "current" schema version is chosen with `ORDER BY created_at DESC` on a **string** column. Rows written by app 2.44.0–2.45.0 used `DD.MM.YYYY hh:mm:ss` (format introduced in git `dcf1263`, first released in 2.44.0; changed in `a46e936` = 3.0.0-alpha1). Current rows use `YYYYMMDD hh:mm:ss`. Any old row dated day 21–31 compares greater than every `20xx...` row, so `getSchemaVersion` keeps returning that old dotted version (e.g. `"2.0.3"`). `Atoi` then fails → the v5 overhaul is **skipped** and the stamp `101` never "wins". Legacy `H:MM` strings stay in columns that models scan into Go `int`, so logbook reads fail when the string is converted to int. Fix idea: `ORDER BY id DESC`. | `internal/driver/driver.go:100`, `:124`, `:47-54` | Confirmed: deterministic string ordering. Both formats are present in git history. | BLOCKER | verified: 2026-10-14 |
| 2 | Non-integer stored versions (DBs last opened by app ≤ 3.1.x: `"3.1.0"`, `"3.0.0-beta3"`, …) skip the overhaul silently and are stamped `101` with legacy data. | `internal/driver/driver.go:47-54` | Confirmed: `strconv.Atoi` error → branch not taken. | MAJOR | verified: 2026-10-14 |
| 3 | The overhaul runs **before** table/column reconciliation. DBs last opened by app 3.2.0–3.10.0 (schema `7`–`10`) lack `currency.time_frame_since` (added at `11`, git `71526a4`, first released in 3.11.0). Schema `6` (git `1407f99`) was never released. The overhaul's currency `SELECT` fails → `migration failed` → the app cannot start. | `internal/driver/driver.go:44-54` vs `:60-70`; `internal/driver/data_overhaul.go:314` | Confirmed: call order is fixed and the column is absent in those schema versions. | MAJOR | verified: 2026-10-14 |
| 4 | The overhaul is not idempotent (`convertDate` rejects ISO dates) and the `101` stamp is written only after table/view reconciliation. If anything fails between the overhaul commit and the stamp, every later start re-runs the overhaul and aborts. The same happens after running a v4 binary on a v5 DB, which re-stamps `45`. | `internal/driver/data_overhaul.go:162-165`, `:329-332`; `internal/driver/driver.go:56-90` | Confirmed: control flow. | MAJOR | verified: 2026-10-14 |
| 5 | MySQL: `ALTER TABLE ... MODIFY` runs inside the overhaul transaction. MySQL DDL implicitly commits, so the earlier UPDATEs are committed before the ALTER. A failing ALTER leaves converted data with version `< 100` → trap #4. | `internal/driver/data_overhaul.go:432-467` | Confirmed: MySQL implicit-commit semantics on DDL. | MAJOR | verified: 2026-10-14 |
| 6 | `Distance` treats a not-found airport as coordinates (0,0): `GetAirportByID` returns `nil` error on `ErrNoRows`. The bogus distance is cached and persisted by `InsertFlightRecord`. It remains cached after the airport is added as a custom airport, because custom-airport CRUD does not clear the caches. `calculateNightTime` uses the same lookup, so night time is also computed against (0,0) for unknown codes. Same issue: `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` §11 #1; for the `/api/distance` endpoint and lower-case codes see `ARCHITECTURE_APPLICATION.md` §11 #15. | `internal/models/helpers.go:45-52`; `internal/models/airports.go:32-35`, `:143-184`; `internal/models/flightrecords.go:91`; `app/helpers.go:73`, `:83` | Confirmed: code path. | MAJOR | verified: 2026-10-14 |
| 7 | `GET /api/db/filename` returns the raw DSN. On MySQL that includes the password. Canonical entry (auth default, listen address): see `ARCHITECTURE_APPLICATION.md` §11 #4. | `app/handlers_db.go:12-14` | Confirmed | MAJOR | verified: 2026-10-14 |
| 8 | DB upload does not reset `airportCache`, `distanceCache` or `authCache`. Stale airports/distances and a stale auth flag/secret from the previous DB stay until restart or a settings save. Auth consequence: `Auth` reads the cached `isAuthEnabled`, so if the previous DB had auth off, an uploaded DB with auth on is served without authentication. `app.timeFieldsAutoFormat` (loaded at startup, refreshed only by the settings handler) also keeps the previous DB's value. Canonical entry: `ARCHITECTURE_APPLICATION.md` §11 #2 (also `ARCHITECTURE_AUTH.md` §11 #8, `ARCHITECTURE_SETTINGS.md` §11 #5). | `app/handlers_db.go:53-58`; `internal/models/airports.go:13`; `internal/models/helpers.go:26`; `internal/models/auth.go:11`, `:28-41`; `app/handlers_auth.go:115-124`; `app/main.go:199`; `app/handlers_settings.go:48` | Confirmed: `authCache.Clear()` is called only in `UpdateSettings` (`internal/models/settings.go:65`) | MAJOR | verified: 2026-10-14 |
| 9 | `parseTimeToMinutes` maps any value other than an integer or `H:MM` to `0` without logging, so legacy values in other formats are lost silently. | `internal/driver/data_overhaul.go:55-63` | Confirmed | MINOR | verified: 2026-10-14 |
| 10 | Schema drift after v5. Migrated SQLite DBs keep the `TEXT` declared type on the 11 time columns (only MySQL is altered, and `ensureColumnsExist` never alters existing columns), so values are stored as text. MySQL fresh DBs use `SMALLINT`, migrated ones `INT`. SQL `MIN`/`MAX`/`ORDER BY`/comparisons on time columns would differ between fresh and migrated DBs. No such query exists today. | `internal/driver/data_overhaul.go:461-465`; `internal/driver/db_operations.go:167-173`; `internal/driver/db_structure.go:11`, `:32-45` | Confirmed (drift); impact latent | MINOR | verified: 2026-10-14 |
| 11 | `logbook_stats_view` was removed from the code in v5 but is never dropped, so upgraded DBs keep a dead view with legacy `HH:MM` parsing logic. | `internal/driver/driver.go:73`; git `8b2fa8d` | Confirmed | MINOR | verified: 2026-10-14 |
| 12 | The MySQL index check queries `information_schema.statistics` by `table_name` only (no `table_schema`). A same-named table in another schema can hide a missing index. | `internal/driver/db_operations.go:45` | Confirmed | MINOR | verified: 2026-10-14 |
| 13 | `UpdateFlightRecordsDistance` returns on a `Scan` error without `tx.Rollback()`, which leaks an open transaction. Both distance helpers swallow every error without logging. | `internal/models/helpers.go:72-102`, `:116-125` | Confirmed | MINOR | verified: 2026-10-14 |
| 14 | `metadataTable.initTable` error is ignored, and `getSchemaVersion` maps any error to `"unknown"`. A transient read error on a v4 DB skips the overhaul and stamps `101`. | `internal/driver/driver.go:44`, `:101-109` | Confirmed | MINOR | verified: 2026-10-14 |
| 15 | The `distanceCache` key concatenates the two codes without a separator, so mixed-length codes can collide (`ABCD`+`EFG` and `EFGA`+`BCD` both give `EFGABCD`). | `internal/models/helpers.go:34-39` | Confirmed | MINOR | verified: 2026-10-14 |
| 16 | `person_to_log` rows are never deleted when a flight is deleted (there is no `DELETE ... WHERE log_uuid`). Orphans accumulate and still feed `GetPersonsRoles`. | `app/handlers_flightrecord.go:52-70`; `internal/models/persons.go:147`, `:204` | Confirmed | MINOR | verified: 2026-10-14 |
| 17 | `tokens.username` is typed `UUID` (MySQL `VARCHAR(36)`) but stores the login name, so MySQL sign-in breaks for logins longer than 36 characters. `HandlerLogin` also has no `return` after `handleError` for `AddToken` (see `ARCHITECTURE_AUTH.md` §11 #3, #15). | `internal/driver/db_structure.go:104`; `app/handlers_auth.go:206`, `:211-213`, `:149-153`; `internal/models/auth.go:55-56` | Confirmed: strict mode rejects the INSERT (login returns 500). Non-strict mode stores the login truncated to 36 chars, so `VerifyToken` (`WHERE username = ?` with the full login from the JWT claim) never matches and every authenticated request returns 401. | MINOR | verified: 2026-10-14 |
| 18 | There are no pool limits and no SQLite `busy_timeout`/journal mode. Concurrent writers (e.g. the startup distance-update transaction while `CreateDistanceCache` reads) may get `SQLITE_BUSY` ("database is locked"). | `internal/driver/driver.go:23-40`; `app/main.go:202-206` | Suspected: confirm by reproducing concurrent writes on SQLite | MINOR | verified: 2026-10-14 |
| 19 | `migrateLicensingDates` scans nullable `DateTime` columns into a plain `string`. A NULL date would abort the overhaul and therefore startup. | `internal/driver/data_overhaul.go:367` | Suspected: confirm by finding NULL licence dates in real v4 DBs | MINOR | verified: 2026-10-14 |
| 20 | `HandlerApiUploadDB` closes the pool and truncates the live SQLite file before anything is validated. A failing `os.Create`/`io.Copy` returns 500 but leaves `app.db.DB` closed, so all later requests fail with `sql: database is closed` until restart. An upload that `OpenDB`/`validateDB` rejects hits `errorLog.Fatalln` with the original DB already overwritten, and every restart then fails the same way. Same issue: `ARCHITECTURE_APPLICATION.md` §11 #1. | `app/handlers_db.go:36-56` | Confirmed: control flow | MAJOR | verified: 2026-10-14 |
| 21 | `migrateLicensingDates` overwrites `issued`/`valid_from`/`valid_until` with `""` before formatting the error, so the abort message shows an empty value instead of the bad legacy date. Same issue: `ARCHITECTURE_CURRENCY_LICENSING.md` §11 #19. | `internal/driver/data_overhaul.go:372-384` | Confirmed: `convertDate` returns `""` on error (`:38-41`) | MINOR | verified: 2026-10-14 |
| 22 | `logbook_view` does not `IFNULL` the nullable text columns (`departure_*`, `arrival_*`, `aircraft_model`, `reg_name`, `sim_type`, `pic_name`, `remarks`), which models scan into Go `string`, so one NULL there makes `GetFlightRecords` fail. Its window ordering `(date, departure_time)` has no unique tie-breaker, so `rn`/`prev_uuid`/`next_uuid` are nondeterministic for same-day records with equal or empty times. Fix idea: `IFNULL(col, '')` and `uuid` as the last `ORDER BY` key. Same issues: `ARCHITECTURE_LOGBOOK.md` §11 #15, #17. | `internal/driver/db_structure.go:175-181`, `:195-196`, `:204-210`, `:222-223`; `internal/models/flightrecords.go:150-159` | Suspected: confirm with NULL text values in legacy DBs / duplicate `(date, departure_time)` rows | MINOR | verified: 2026-10-14 |
| 23 | `GetAirportDBRecordsCount` discards the `Scan` error and returns `(0, nil)`, so a failing count query triggers the airport download plus `DELETE FROM airports`, and the startup error branch is unreachable. Same issue: `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` §11 #8. | `internal/models/airports.go:50-51`, `:65`; `app/main.go:171-191` | Confirmed: control flow | MINOR | verified: 2026-10-14 |
| 24 | `migratePreviousExperience` returns nil on any `SELECT` error (`rawSettings` stays empty), so the overhaul commits without converting `previous_experience`. The `err != nil` branch is dead. | `internal/driver/data_overhaul.go:250-257` | Confirmed: control flow | MINOR | verified: 2026-10-14 |

## 12. Rules for Future Development

### R1 — Add a column to an existing table
1. Add a `Column` to the table in `internal/driver/db_structure.go`, using a type alias from `:6-14`. An `Index: true` column must use a VARCHAR alias (`UUID`, `SmallText`, `BigText`) or an integer type, never `FullText`/`Blob`: MySQL cannot index TEXT/BLOB without a prefix length, and `createIndex` emits none (`internal/driver/db_operations.go:46`).
2. Nullability. On a populated table, SQLite rejects `ADD COLUMN ... NOT NULL` without a non-NULL `DEFAULT`, so either give a default or leave the column nullable. Never put a `DEFAULT` on `FullText`/`Blob`, because MySQL `TEXT`/`LONGBLOB` reject it (git `c6e25c2`, `ce4794d`, `cabf7e5`). Instead, keep these columns nullable and wrap them in `IFNULL` in reads.
3. Bump `schemaVersion` (`internal/driver/db_structure.go:4`) to the next integer, which must be > `101`. Without the bump, existing DBs are never reconciled (`internal/driver/driver.go:56`).
4. If the logbook column is read by models, add it to **both** SQL texts of `logbook_view` (`internal/driver/db_structure.go:170-198` and `:199-225`) with a NULL-safe default.
5. Update the struct in `internal/models/structs.go`, then every `SELECT` column list, `Scan` list, `INSERT` and `UPDATE` in the owning model file. Column order must match exactly.
6. Logbook columns also need: import (`app/handlers_import.go`), PDF export (`internal/pdfexport`), the UI CSV export and the UI forms/tables.

### R2 — Add a table
1. `var xTable = NewTable(...)` in `internal/driver/db_structure.go`. The primary key and any `Index: true` column must use a VARCHAR alias (`UUID`, `SmallText`, `BigText`) or an integer type, never `FullText`/`Blob`: MySQL cannot key or index TEXT/BLOB without a prefix length (`internal/driver/db_operations.go:40`, `:46`).
2. **Append it to the `tables` slice** in `validateDB` (`internal/driver/driver.go:60-64`). A table missing from that slice is never created.
3. Bump `schemaVersion`. Add the model file in `internal/models/` (use `ContextWithDefaultTimeout`, portable SQL), handlers in `app/handlers_<x>.go`, and routes inside the `r.Use(app.Auth)` group (`app/routes.go:26-27`). Handlers: follow every `app.handleError(w, err)` with `return`, because the helper does not stop the handler (`app/helpers.go:53-63`). Wrap large list GETs in `r.With(middleware.Compress(5))` (e.g. `app/routes.go:34-35`) and answer mutations with `writeOkResponse` (`app/helpers.go:45-51`).
4. Deletes: there are no FKs, so write the cascade by hand (compare §11 #16).

### R3 — Add or change a view
1. `NewView(name, SQLQuery{SQLite: ..., MySQL: ...})` in `internal/driver/db_structure.go`, with both texts. MySQL needs 8.0+ for CTEs/window functions.
2. Add new views to the `views` slice (`internal/driver/driver.go:73`). The slice order is the creation order, so put a view after any view it depends on.
3. Bump `schemaVersion`. Views are only recreated on a version mismatch.
4. When removing a view, add an explicit `DROP VIEW IF EXISTS`. Reconciliation never drops views it no longer knows (§11 #11).

### R4 — Change a column type or transform stored data
1. `validateDB` cannot do it. Write an explicit migration modelled on `internal/driver/data_overhaul.go`, gated in `validateDB` on an **integer** version threshold (`internal/driver/driver.go:47-54`). Set the new `schemaVersion` above the threshold.
2. Make it **idempotent**: detect already-converted values instead of failing (§11 #4). After the migration commits, record its completion with a marker that is at or above the migration gate but different from `schemaVersion` (or a separate marker row), so the gate no longer fires but reconciliation still runs. Only `updateSchemaVersion` after reconciliation may write `schemaVersion`. `validateDB` reads the version once (`internal/driver/driver.go:45`) and reconciles only when it differs (`:56`), so writing `schemaVersion` early means a failed reconciliation is never retried.
3. MySQL DDL commits implicitly. Run the DDL as a separate, re-runnable step, or after the data step has been made idempotent (§11 #5). SQLite cannot `ALTER COLUMN`; changing a declared type needs a table rebuild (create new, copy, drop, rename).
4. Make sure every column the migration reads exists first (§11 #3). Either reconcile tables first, or check the columns.
5. Add a CHANGELOG backup warning, as `CHANGELOG.md:9` does.

### R5 — Add a model query
- `DBModel` has no engine field (`internal/models/structs.go:12-14`), so model SQL **must run unchanged on SQLite and MySQL**. Use `?` placeholders and `IFNULL`. Never use `||` for concatenation (MySQL treats it as OR by default; compare the two `aircrafts_view` texts, `internal/driver/db_structure.go:246-268` vs `:269-291`), and avoid `PRAGMA` and other engine-only syntax. Put engine-specific SQL in a view.
- Use single-quoted string literals (`''`) only. Double quotes are identifiers under MySQL `ANSI_QUOTES` and SQLite builds with `DQS=0` (existing offender: `internal/models/licensing.go:114`).
- Read logbook data from `logbook_view`, not `logbook`, so you get the NULL defaults and the calculated columns. The view does not default every text column (§5.2, §11 #22), so scan any nullable column that it passes through raw into `sql.NullString`, or add an `IFNULL` to the view.
- Use `ContextWithDefaultTimeout()` with `defer cancel()`. Check `rows.Err()`. Wrap multi-statement writes in a transaction and roll back on every error path.

### R6 — Add a settings field
No schema change is needed: `settings2.settings` is JSON. Add the field to `Settings` (`internal/models/structs.go:221-272`) and its default to `CheckDefaultValues` (`internal/models/models_defaults.go:151`). Mirror any UI fallback in `app/ui/src/hooks/useSettings.jsx` (e.g. `:136-137`). Writers must read → modify → `UpdateSettings`, because it overwrites the whole JSON blob (`internal/models/settings.go:54-60`). Follow `ARCHITECTURE_SETTINGS.md`.

### R7 — Change cache behaviour or the DB-swap path
Any code that replaces `app.db` or rewrites airports/settings must also clear `distanceCache`, `airportCache` and `authCache` (§5.6, §11 #8).
- The maps are unexported (`internal/models/helpers.go:26`, `internal/models/airports.go:13`, `internal/models/auth.go:11`), and today they are cleared only as side effects of `UpdateSettings`, `UpdateAirportDB` and `CreateDistanceCache`. Add an exported `DBModel` method in `internal/models` (e.g. `ResetCaches()`, not in code yet) that clears `airportCache` and `authCache`, then runs `go CreateDistanceCache()` (which clears and refills `distanceCache`). Call it after swapping `app.db`, and reload `app.timeFieldsAutoFormat` from `GetSettings()` (`app/main.go:194-199`).
- DB swap (§11 #20): write the upload to a temp file next to the DSN, open and validate it with `driver.OpenDB`, close that pool, and only then close the old pool, rename the temp file over the DSN and reopen it. Never call `errorLog.Fatalln` inside a handler.

### Cross-check list (every DB change)
- [ ] Both engines: every new `ColumnType`/`SQLQuery` has `SQLite` **and** `MySQL` entries.
- [ ] `schemaVersion` bumped (integer, ≥ 100, greater than the current value).
- [ ] New tables are in the `tables` slice and new views in the `views` slice.
- [ ] `NOT NULL` columns have a `DEFAULT`, except `FullText`/`Blob`. Nullable columns are `IFNULL`-ed in views, or scanned into `sql.Null*`.
- [ ] Struct, column lists and `Scan` order are consistent. JSON tags match what the UI reads.
- [ ] New endpoints are inside the `app.Auth` group (`app/routes.go:26-27`).
- [ ] Every `handleError` is followed by `return`; large GETs use `Compress(5)`.
- [ ] Primary keys and indexed columns are not `FullText`/`Blob`. String literals are single-quoted.
- [ ] UI: `util/http/<x>.jsx` function + query hook. Mutations invalidate the affected query keys (e.g. `['logbook']`).
- [ ] Import, PDF export and CSV export reviewed for logbook column changes.
- [ ] Tested on a fresh DB **and** a copy of a v4 DB (and a v5 DB), on SQLite and, where possible, MySQL.
- [ ] `CHANGELOG.md` `[Unreleased]` entry + the copy in `README.md`.

## 13. AI Notes

### Mental Model
On every start, the DB is compared with Go values in `internal/driver/db_structure.go`. If the stored version string differs from `schemaVersion`, missing tables, columns and indexes are added, all views are rebuilt and a new version row is written. If the version matches, nothing is touched. Type and data changes are one-off migrations run before reconciliation and gated on the old version number. Models are engine-agnostic SQL over `*sql.DB`, read mostly through views, with a 60 s timeout per call.

### Gotchas
- Editing a table or view without bumping `schemaVersion` has **no effect** on existing databases.
- Migrated SQLite DBs and fresh SQLite DBs have different declared types on time columns (§11 #10). Do not rely on SQL numeric ordering of those columns.
- `logbook_view` recomputes window functions over the whole logbook, even for `GetFlightRecordByID` (`internal/models/flightrecords.go:31-40`).
- `FlightRecordForPerson.TotalTime` is still a `string` (`internal/models/structs.go:131`). The UI tolerates it with `parseFloat` in `app/ui/src/components/UIElements/XDataGrid/XFooter.jsx:166-169`.
- `[]byte` fields (`track`, `document`) are base64 in JSON.
- `AllAircrafts`/`LastAircrafts` (`internal/models/structs.go:8-9`) are unused.
- Driver output goes to stdout only, not to the log file.
- `GetAirportDBRecordsCount` discards the scan error (`internal/models/airports.go:50-51`), so startup's error branch (`app/main.go:172-175`) is unreachable.

### File Quick Reference
| Need | File:line |
|---|---|
| Bump schema | `internal/driver/db_structure.go:4` |
| Table / view lists | `internal/driver/driver.go:60-64`, `:73` |
| Version read / stamp | `internal/driver/driver.go:96-126` |
| Overhaul gate / body | `internal/driver/driver.go:47-54`; `internal/driver/data_overhaul.go:428-474` |
| DDL templates per engine | `internal/driver/db_operations.go:27-48` |
| Timeouts | `internal/models/helpers.go:14-24` |
| Distance + cache | `internal/models/helpers.go:26-54` |
| DB upload/download | `app/handlers_db.go:12-88`; `app/routes.go:150-154` |

> **AI Usage Instructions**
> - Always read this file before modifying this system
> - Do not refactor without impact analysis
> - Ask if information is missing
