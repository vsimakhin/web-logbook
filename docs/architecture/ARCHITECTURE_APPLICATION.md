# Application — Architecture

**Last Updated:** 2026-10-14 — initial version generated from code and fact-checked (TASK_AGENT_WORKFLOW_SETUP); 2026-10-14 — cross-doc links, §11 #5 scope, UI error message chain (consistency pass)

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

The Application system is the Go `package main` shell that wraps every other system. It parses the CLI flags, sets up three loggers, opens the SQLite or MySQL database through `internal/driver`, and runs startup housekeeping: settings defaults, the airport DB bootstrap and the distance cache. It then builds the chi router with CORS, auth and gzip middleware, serves the embedded React SPA, and exposes a few cross-cutting endpoints: version, auth flag, airport-to-airport distance, and database file download and upload. The pilot runs one self-contained binary (`go build ... ./app`, `Makefile:38`), then opens `http://<host>:4000` in a browser.

The code lives in `app/main.go`, `app/routes.go`, `app/helpers.go`, `app/handlers_aux.go` and `app/handlers_db.go`. Every domain handler in `app/handlers_*.go` is a method on the same `application` struct (`app/main.go:40-48`) and uses this system's response helpers (`app/helpers.go:16-63`), so changes here affect the whole HTTP layer.

## 2. Key Concepts

| Term | Meaning | Evidence |
|---|---|---|
| `application` | One struct holds the config, the three loggers, the version, the `models.DBModel` and a cached `timeFieldsAutoFormat`. Every HTTP handler is a method on it | `app/main.go:40-48` |
| `config` | Flag values: `url`, `port`, `env`, `db.engine`, `db.dsn`, `tls.enabled`, `tls.key`, `tls.crt` | `app/main.go:25-38` |
| `models.DBModel` | A thin wrapper around `*sql.DB`. All data access methods hang off it | `internal/models/structs.go:12-14` |
| `models.JSONResponse` | The `{ok, message, redirect_url, data}` envelope used by `writeOkResponse` / `writeErrorResponse` | `internal/models/structs.go:17-22`, `app/helpers.go:37-51` |
| Engine name = SQL driver name | The `-engine` value goes straight to `sql.Open`. Valid values are `sqlite` (modernc) and `mysql` | `internal/driver/driver.go:24`, `internal/driver/db_operations.go:11-12` |
| Protected API | Everything under `/api` except `POST /api/login` passes through the `app.Auth` middleware | `app/routes.go:24-27`, `Auth` in `app/handlers_auth.go:112` |
| SPA fallback | A path that is not `/` and does not contain `assets` or `favicon.ico` is rewritten to `/` (index.html). react-router then routes on the client | `HandlerUI` in `app/handlers_aux.go:21-29`, `app/ui/src/main.jsx:35` |
| Embedded UI | `app/ui/dist/*` is compiled into the binary, so `go build` needs `make build_ui` first | `app/handlers_aux.go:12-13` |
| Time as integer minutes | `formatTimeField` renders minutes as `H:MM` (codes 0, 2 and default), `HH:MM` (1) or decimal hours `%.1f` (3) | `app/helpers.go:115-140` |
| Package-level caches | `authCache`, `airportCache` and `distanceCache` are `sync.Map` globals in `internal/models`. They live outside `application` and stay in memory for the whole process | `internal/models/auth.go:11`, `internal/models/airports.go:13`, `internal/models/helpers.go:26` |

## 3. How It Works

### 3.1 Startup sequence (`main` in `app/main.go:119-215`)

| # | Step | Code | On failure |
|---|---|---|---|
| 1 | Parse the flags | `parseFlags` `app/main.go:77-95`, called at `:122` | — |
| 2 | With `-version`: print the version and exit 0 | `app/main.go:124-127` | — |
| 3 | `setupLogger`: open and truncate `weblogbook-output.log` in the CWD, then build info/error/warning loggers on `io.MultiWriter(file, stdout)` | `app/main.go:97-109`, called at `:130-135` | Prints the error, `os.Exit(1)` (`:133`) |
| 4 | Open the DB: `createDBConnection` → `driver.OpenDB` → `sql.Open`, `Ping`, `validateDB` (creates or migrates the schema) | `app/main.go:111-117`, `:138-142`, `internal/driver/driver.go:23-40` | `errorLog.Fatalln` (exit 1) |
| 5 | Build `application{}` | `app/main.go:144-151` | — |
| 6 | With `-disable-authentication`: `DisableAuthorization` sets `AuthEnabled=false` in settings, logs a warning, then exits 0 | `app/main.go:154-161`, `internal/models/auth.go:125-139` | The error is logged and the process still exits 0 |
| 7 | `CheckDefaultValues` fills empty A4/A5 PDF settings, the airport DB source and the standard field headers | `app/main.go:164-168`, `internal/models/models_defaults.go:151-197` | Logged, startup continues |
| 8 | Airport bootstrap: if `airports` holds 0 rows, run `downloadAirportDB("")` (default GitHub JSON), then `UpdateAirportDB(airports, false)` | `app/main.go:171-191`, `app/handlers_airport.go:72-100`, `internal/models/airports.go:55-99` | Logged, then `return`: the server never starts and the exit code is 0 |
| 9 | `GetSettings`, then cache `TimeFieldsAutoFormat` in `app.timeFieldsAutoFormat` | `app/main.go:194-199` | Logged, then `return` (exit 0) |
| 10 | `go app.db.CreateDistanceCache()` runs in the background | `app/main.go:202`, `internal/models/helpers.go:106-129` | Errors are silently ignored |
| 11 | `UpdateFlightRecordsDistance()` runs synchronously and fills `logbook.distance` where it is NULL | `app/main.go:206`, `internal/models/helpers.go:65-103` | Errors are silently ignored |
| 12 | `serve()` starts an `http.Server` on `url:port`, with TLS when `-enable-https` is set | `app/main.go:50-75`, `:209-214` | `errorLog.Fatalln` (exit 1) |

### 3.2 Request pipeline (`routes` in `app/routes.go:9-168`)

| Order | Layer | Applies to | Code |
|---|---|---|---|
| 1 | `middleware.Logger` (chi request log) | All requests, only when `-env=dev` | `app/routes.go:12-14` |
| 2 | `cors.Handler` | All requests | `app/routes.go:16-22` |
| — | No panic recovery: chi `middleware.Recoverer` is not mounted, so a handler panic is caught only by net/http (see §8, §11 #19) | All requests | `app/routes.go:9-22` |
| 3 | `POST /api/login` | Public, registered before the auth group | `app/routes.go:24` |
| 4 | `app.Auth` | The whole `/api` subrouter | `app/routes.go:26-27` |
| 5 | `middleware.Compress(5)` | 8 GET list/blob endpoints and the SPA | `app/routes.go:34-35,56,67,94-96,106,165` |
| 6 | Handler → `DBModel` method → `writeJSON` / `writeOkResponse` / `handleError` | Each route | `app/helpers.go:16-63` |
| — | `/*` → `HandlerUI` | Every path not matched under `/api` | `app/routes.go:165`, `app/handlers_aux.go:15-30` |

## 4. Components & Files

### 4.1 File Index

| File | Responsibility |
|---|---|
| `app/main.go` | `version` const, log prefixes, the `config` and `application` types, `serve`, `parseFlags`, `setupLogger`, `createDBConnection`, `main` (startup sequence) |
| `app/routes.go` | The chi router, global middleware (dev logger, CORS), the auth group and the full route table (76 registrations) |
| `app/helpers.go` | Response helpers `writeJSON`, `writeErrorResponse`, `writeOkResponse`, `handleError`. Also the shared domain helpers `calculateNightTime` (night-time minutes and night landing) and `formatTimeField` |
| `app/handlers_aux.go` | The `//go:embed ui/dist/*` FS and `HandlerUI` (SPA server), plus `HandlerVersion`, `HandlerAuthEnabled` and `HandlerDistance` |
| `app/handlers_db.go` | `HandlerApiDBFile`, `HandlerApiUploadDB` and `HandlerApiDownloadDB` (whole-database backup and restore) |
| `internal/driver/driver.go` | `OpenDB`, the integration point used at startup and after a DB upload (documented in ARCHITECTURE_DATABASE.md) |
| `Makefile` | `build_ui`, `build_backend`, `start` (runs with `-port=4000 -env=dev`, `Makefile:42-44`) |
| `docker/build.Dockerfile` | `WORKDIR /web-logbook`, default `CMD ["-dsn", "/data/web-logbook.sql"]` (`docker/build.Dockerfile:8,25`) |

### 4.2 API Endpoints

Endpoints implemented in this system:

| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/api/version` | `HandlerVersion` `app/handlers_aux.go:32` | Returns `app.version` as a JSON string. Behind Auth |
| GET | `/api/auth-enabled` | `HandlerAuthEnabled` `app/handlers_aux.go:36` | Returns a JSON bool from `IsAuthEnabled` (cached), ignoring the error. Behind Auth, so it needs a token when auth is on |
| GET | `/api/distance/{departure}/{arrival}` | `HandlerDistance` `app/handlers_aux.go:41` | Returns a JSON number in nautical miles from `DBModel.Distance`. Codes are not upper-cased |
| GET | `/api/db/filename` | `HandlerApiDBFile` `app/handlers_db.go:12` | Returns the raw `-dsn` string |
| POST | `/api/db/upload-db` | `HandlerApiUploadDB` `app/handlers_db.go:16` | Multipart field `dbfile`. SQLite only. Replaces the live DB file and reconnects |
| GET | `/api/db/download-db` | `HandlerApiDownloadDB` `app/handlers_db.go:63` | Returns the raw file bytes as `application/octet-stream` with `Content-Length` and no `Content-Disposition` |
| any | `/*` | `HandlerUI` `app/handlers_aux.go:15` | Serves the embedded SPA and assets, gzip level 5 |

Route map (all groups, so that a route can be traced to its owner doc):

| Prefix | `app/routes.go` lines | Auth | Handler file(s) | Documented in |
|---|---|---|---|---|
| `POST /api/login` | 24 | public | `app/handlers_auth.go` (`HandlerLogin` :164) | ARCHITECTURE_AUTH.md |
| `POST /api/logout` | 30 and 157 (duplicate) | yes | `app/handlers_auth.go` (`HandlerLogout` :225) | ARCHITECTURE_AUTH.md |
| `/api/logbook` (+ `/track`) | 33-51 | yes | `app/handlers_logbook.go`, `app/handlers_flightrecord.go` | ARCHITECTURE_LOGBOOK.md (`/mapdata` → ARCHITECTURE_STATS_AND_MAP.md) |
| `/api/licensing` | 54-61 | yes | `app/handlers_licensing.go` | ARCHITECTURE_CURRENCY_LICENSING.md |
| `/api/attachment` | 64-71 | yes | `app/handlers_attachments.go` | ARCHITECTURE_CURRENCY_LICENSING.md |
| `/api/aircraft` | 74-79 | yes | `app/handlers_aircraft.go` | ARCHITECTURE_AIRCRAFT_AIRPORTS.md |
| `/api/settings` | 82-90 | yes | `app/handlers_settings.go` | ARCHITECTURE_SETTINGS.md |
| `/api/airport` | 93-102 | yes | `app/handlers_airport.go` | ARCHITECTURE_AIRCRAFT_AIRPORTS.md |
| `/api/person` | 105-118 | yes | `app/handlers_person.go` | ARCHITECTURE_PERSONS.md |
| `/api/export` | 121-124 | yes | `app/handlers_export.go` | ARCHITECTURE_PDF_EXPORT.md |
| `/api/import` | 127-129 | yes | `app/handlers_import.go` | ARCHITECTURE_IMPORT.md |
| `/api/currency` | 132-138 | yes | `app/handlers_currency.go` | ARCHITECTURE_CURRENCY_LICENSING.md |
| `/api/custom-fields` | 141-147 | yes | `app/handlers_custom_fields.go` | ARCHITECTURE_LOGBOOK.md |
| `/api/db` | 150-154 | yes | `app/handlers_db.go` | this doc |
| aux (`/version`, `/auth-enabled`, `/distance`) | 160-162 | yes | `app/handlers_aux.go` | this doc |

### 4.3 Data Access

The app layer has no SQL of its own. It calls these `DBModel` methods (grouped by owning file):

| File | Method | Purpose here | Tables / views |
|---|---|---|---|
| `internal/driver/driver.go` | `OpenDB` (:23-40) | Startup connection, and reconnection after an upload. Runs `validateDB` (:43-94) | `metadata` plus all tables and views |
| `internal/models/auth.go` | `DisableAuthorization` (:125-139) | `-disable-authentication` | `settings2` |
| `internal/models/auth.go` | `IsAuthEnabled` (:28-41) | `/api/auth-enabled` and the `Auth` middleware (cached in `authCache`) | `settings2` |
| `internal/models/models_defaults.go` | `CheckDefaultValues` (:151-197) | Startup defaults | `settings2` |
| `internal/models/settings.go` | `GetSettings` (:11-28) | Startup `timeFieldsAutoFormat` | `settings2` (`id=0`, JSON blob) |
| `internal/models/airports.go` | `GetAirportDBRecordsCount` (:46-52) | Startup bootstrap check | `airports` |
| `internal/models/airports.go` | `UpdateAirportDB` (:55-99) | Startup bootstrap. `DELETE` then `INSERT` in one tx, clears `airportCache`, starts `CreateDistanceCache` | `airports` |
| `internal/models/airports.go` | `GetAirportByID` (:16-43) | Used by `Distance` and `calculateNightTime` | `airports_view` |
| `internal/models/helpers.go` | `Distance` (:29-54) | `/api/distance`. Haversine via `internal/utils/distance.go:14` | `airports_view` (through `GetAirportByID`) |
| `internal/models/helpers.go` | `CreateDistanceCache` (:106-129) | Background warm-up at startup | `logbook_view` |
| `internal/models/helpers.go` | `UpdateFlightRecordsDistance` (:65-103) | Startup back-fill of `distance` | `logbook` |

`app/handlers_db.go` bypasses SQL entirely: it reads and writes the SQLite file with `os.Open` / `os.Create` (`app/handlers_db.go:39,64`).

### 4.4 UI

| UI element | File | Calls | Query key / cache |
|---|---|---|---|
| Version chip and "New" badge | `AppTitle` in `app/ui/src/components/UIElements/Dashboard/DashboardToolbar.jsx:24-59` | `fetchVersion` `app/ui/src/util/http/settings.jsx:68` → `GET /api/version`. `fetchLatestRelease` `:88` → GitHub releases API | `['version']`, `['latestRelease']` |
| Logout button visibility | `ToolbarActions` in `app/ui/src/components/UIElements/Dashboard/DashboardToolbar.jsx:61-87` (rendered only when `auth` is true, `:77`) | `fetchAuthEnabled` `app/ui/src/util/http/settings.jsx:78` | `['auth-enabled']`, invalidated by `app/ui/src/components/Settings/SaveSettingsButton.jsx:17` |
| Database actions menu | `app/ui/src/components/Settings/GeneralSettings/DBControl/DBActionsMenu.jsx:11-34`, mounted in `app/ui/src/components/Settings/GeneralSettings/GeneralSettings.jsx:18` (Settings page, `app/ui/src/components/Settings/Settings.jsx:51`) | — | — |
| Upload Database | `app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx` | `fetchDBFileName` and `uploadDBFile` (`app/ui/src/util/http/db.jsx:5,15`) | `['db','filename']`. On success, `queryClient.invalidateQueries()` marks every query stale and refetches the active ones (`app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx:30`) |
| Download Database | `app/ui/src/components/Settings/GeneralSettings/DBControl/DBDownloadButton.jsx` | `downloadDBFile` (`app/ui/src/util/http/db.jsx:25`) → blob → `<a download>` | `['db','filename']`. The file name is the last `/` segment of the DSN (`app/ui/src/components/Settings/GeneralSettings/DBControl/DBDownloadButton.jsx:28`) |
| Route distance in custom fields | `app/ui/src/hooks/useCustomFields.jsx:48` | `fetchDistance` `app/ui/src/util/http/logbook.jsx:152` | — |
| Fetch plumbing | `app/ui/src/util/http/http.jsx:13-31` (`handleFetch`), `app/ui/src/constants/constants.jsx:9-12` (`API_URL`) | Every API call | Shared `queryClient` `app/ui/src/util/http/http.jsx:4` |

## 5. Data Model & Persistence

- **No tables of its own.** The startup and aux paths touch `settings2`, `airports`, `airports_view` (= `airports` UNION `airports_custom`, with `UPPER(name)` as the code of a custom airport, `internal/driver/db_structure.go:229-241`), `logbook`, `logbook_view` and `metadata` indirectly (see §4.3). With auth on, every request through the `/api` group also reads `tokens`: `Auth` calls `VerifyToken` (`app/handlers_auth.go:149`), which queries the table unless the token equals the last one cached in `authCache` (`internal/models/auth.go:45-55`; owned by ARCHITECTURE_AUTH.md). The schema itself is described in ARCHITECTURE_DATABASE.md.
- **Files on disk:**

| File | Path | Lifecycle | Ref |
|---|---|---|---|
| Database (SQLite) | `-dsn`, default `web-logbook.sql`, relative to the CWD | Replaced in place by `HandlerApiUploadDB` | `app/main.go:86`, `app/handlers_db.go:39` |
| Log | `weblogbook-output.log` in the CWD | Truncated on every start (`O_TRUNC`), permissions 0666, no rotation | `app/main.go:98` |
| TLS key/cert | `certs/localhost-key.pem`, `certs/localhost.pem` (relative) | Read only by `ListenAndServeTLS` | `app/main.go:90-91,68` |
| SPA | `app/ui/dist/*`, embedded at build time | Immutable at runtime | `app/handlers_aux.go:12-13` |

- **In-memory state** (none of it is persisted, and none of it is reset by `HandlerApiUploadDB`):

| State | Declared | Filled by | Reset by |
|---|---|---|---|
| `app.timeFieldsAutoFormat` | `app/main.go:47` | `app/main.go:199` | `HandlerApiSettingsUpdate` `app/handlers_settings.go:48` |
| `authCache` (secret key, auth flag, last token) | `internal/models/auth.go:11` | `GetSecretKey`, `IsAuthEnabled`, `VerifyToken` | `UpdateSettings` `internal/models/settings.go:65` |
| `airportCache` | `internal/models/airports.go:13` | `GetAirportByID` (:40) | `UpdateAirportDB` (:95) |
| `distanceCache` | `internal/models/helpers.go:26` | `Distance` (:52) | `CreateDistanceCache` (:111) |
| `loginAttempts` | `app/handlers_auth.go:29` | `HandlerLogin` (entry created per IP, `app/handlers_auth.go:167-169`) | The per-IP counter is reset on a successful login (`HandlerLogin`, `app/handlers_auth.go:203`). Entries are never deleted, so the map grows for the process lifetime. Owned by ARCHITECTURE_AUTH.md |

## 6. Data Flow

### 6.1 Generic authenticated API call

1. A UI fetch function builds `${API_URL}/<path>` with `Authorization: Bearer <token>` and calls `handleFetch` (`app/ui/src/util/http/http.jsx:13`).
2. chi applies CORS (`app/routes.go:16-22`), then `app.Auth`, which skips token checks when `IsAuthEnabled` is false (`app/handlers_auth.go:115-124`).
3. The handler decodes the JSON and calls a `DBModel` method, which uses a 60 s context (`internal/models/helpers.go:14,22-24`).
4. On success it calls `writeJSON(200, data)` or `writeOkResponse(msg)`. On error it calls `handleError` → 500 `{ok:false, message}` (`app/helpers.go:53-63`).
5. In the UI, a non-OK response becomes an `Error` with `code` and `info` (the parsed JSON body). A 401 navigates to `/signin` (`app/ui/src/util/http/http.jsx:6-11,16-28`). `useErrorNotification` shows `error.info?.message || error?.message || fallbackMessage` (`app/ui/src/hooks/useAppNotifications.jsx:9`): the server's `message` for an HTTP error, but the browser's own network-error text (e.g. "Failed to fetch") when the request ends without a response, such as after a handler panic (§8).

### 6.2 Database upload (restore)

| # | Where | What |
|---|---|---|
| 1 | `app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx:24,57` | The file picker `accept` is the extension of the DSN file name |
| 2 | `app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx:39-44` | Confirm dialog ("All data will be replaced!") |
| 3 | `app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx:47-49`, `app/ui/src/util/http/db.jsx:15-23` | `FormData{dbfile}` → `POST /api/db/upload-db`. The response is read as a blob |
| 4 | `app/handlers_db.go:17-20` | Rejects non-SQLite engines (500) |
| 5 | `app/handlers_db.go:22,28` | `ParseMultipartForm(1000<<20)`, `FormFile("dbfile")` |
| 6 | `app/handlers_db.go:36` | `app.db.DB.Close()` closes the live pool |
| 7 | `app/handlers_db.go:39,47` | `os.Create(dsn)` truncates the live file, then `io.Copy` writes the upload |
| 8 | `app/handlers_db.go:53-58` | `createDBConnection` → `OpenDB` → `validateDB` migrates the uploaded schema, then `app.db` is replaced |
| 9 | `app/handlers_db.go:60`, `app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx:30` | `{ok:true}`, then the UI invalidates every query |

### 6.3 Database download (backup)

`downloadDBFile` (`app/ui/src/util/http/db.jsx:25-31`) → `GET /api/db/download-db` → `os.Open(dsn)` (`app/handlers_db.go:64`) → `Content-Type: application/octet-stream` and `Content-Length` (`:79-80`) → `io.Copy` (`:83`) → the UI turns the blob into an object URL and clicks an anchor whose name is the DSN basename (`app/ui/src/components/Settings/GeneralSettings/DBControl/DBDownloadButton.jsx:25-31`).

### 6.4 Distance

`app/ui/src/hooks/useCustomFields.jsx:48` → `fetchDistance` (`app/ui/src/util/http/logbook.jsx:152`, returns 0 without a request if either code is empty) → `GET /api/distance/{dep}/{arr}` → `HandlerDistance` (`app/handlers_aux.go:41-46`) → `DBModel.Distance`. The cache key is the two codes concatenated, larger code first (`internal/models/helpers.go:34-39`). Each code goes through `GetAirportByID` → `utils.Distance`, which returns nautical miles (`internal/utils/distance.go:14-24`).

### 6.5 SPA serving

`GET /logbook/<uuid>` does not match `/api`, so it falls to `/*` (`app/routes.go:165`). The path contains neither `assets` nor `favicon.ico`, so it is rewritten to `/` (`app/handlers_aux.go:24-26`) and `http.FileServer` serves the embedded `index.html`. `createBrowserRouter` (`app/ui/src/main.jsx:35`) then renders the page. `/assets/*.js` is served unchanged from the embedded FS (Vite's default `assets` dir; `app/ui/vite.config.js` does not override it).

## 7. Config & Constants

| Name | Value | Where | Kind |
|---|---|---|---|
| `version` | `"5.0.0-alpha1"` | `app/main.go:18` | hardcoded (bumped per release) |
| Log prefixes | `INFO\t` / `ERROR\t` / `WARNING\t` | `app/main.go:20-22` | hardcoded |
| Log flags | info and warning: `Ldate\|Ltime`. error: also `Lshortfile` | `app/main.go:104-106` | hardcoded |
| Log file | `weblogbook-output.log`, `O_RDWR\|O_CREATE\|O_TRUNC`, `0666` | `app/main.go:98` | hardcoded |
| `-url` | `""` (listen on all interfaces; the log line shows `localhost`) | `app/main.go:82,61-64` | configurable |
| `-port` | `4000` | `app/main.go:83` | configurable |
| `-env` | `prod`. `dev` turns on the chi request logger | `app/main.go:84`, `app/routes.go:12` | configurable |
| `-engine` | `sqlite` (`sqlite`\|`mysql`) | `app/main.go:85` | configurable |
| `-dsn` | `web-logbook.sql` | `app/main.go:86` | configurable |
| `-version` | `false` | `app/main.go:87` | configurable |
| `-disable-authentication` | `false` | `app/main.go:88` | configurable |
| `-enable-https` | `false` | `app/main.go:89` | configurable |
| `-key` / `-cert` | `certs/localhost-key.pem` / `certs/localhost.pem` | `app/main.go:90-91` | configurable |
| TLS ALPN | `h2`, `http/1.1` | `app/main.go:57` | hardcoded |
| Server timeouts | none set (Read/Write/Idle) | `app/main.go:52-59` | hardcoded (absent) |
| CORS origins | `*` | `app/routes.go:17` | hardcoded |
| CORS methods | `GET POST PUT DELETE OPTIONS` | `app/routes.go:18` | hardcoded |
| CORS headers | `Accept Authorization Content-Type X-CSRF-Token` | `app/routes.go:19` | hardcoded |
| CORS credentials / max-age | `true` / `300` | `app/routes.go:20-21` | hardcoded |
| gzip level | `5` | `app/routes.go:34` (and the other `Compress(5)` lines) | hardcoded |
| Upload multipart memory | `1000 << 20` (1000 MiB in-memory threshold, not a size cap) | `app/handlers_db.go:22` | hardcoded |
| Upload form field | `dbfile` | `app/handlers_db.go:28`, `app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx:48` | hardcoded |
| Startup airport source | `https://github.com/vsimakhin/Airports/raw/master/airports.json` (forced: `""` is passed, `noICAOFilter=false`) | `app/main.go:178,185`, `app/handlers_airport.go:74` | hardcoded |
| Airport download timeout | 300 s | `app/handlers_airport.go:77` | hardcoded |
| `UpdateAirportDB` timeout | 300 s | `internal/models/airports.go:56` | hardcoded |
| Default DB query timeout | 60 s | `internal/models/helpers.go:14` | hardcoded |
| `UpdateFlightRecordsDistance` timeout | 60 s | `internal/models/helpers.go:66` | hardcoded |
| `CreateDistanceCache` timeout | 120 s | `internal/models/helpers.go:107` | hardcoded |
| Night-time parse layout | `"2006-01-02 1504"` (ISO date + HHMM) | `app/helpers.go:78,88` | hardcoded |
| Time display codes | 0 and 2 → `H:MM`, 1 → `HH:MM`, 3 → decimal `%.1f` | `app/helpers.go:120-139` | configurable (settings `time_fields_auto_format`) |
| UI API base | `/api`. In Vite dev mode, `http://localhost:4000/api` | `app/ui/src/constants/constants.jsx:9-12` | hardcoded |
| `make start` | `PORT=4000`, `ENV=dev` | `Makefile:1-2,44` | configurable (make vars) |
| Docker default args | `-dsn /data/web-logbook.sql` | `docker/build.Dockerfile:25` | configurable |

## 8. Error Handling & Edge Cases

| Situation | Behaviour | Ref |
|---|---|---|
| Handler error | `handleError` logs the caller's `file:line` (`runtime.Caller(1)`), then returns 500 `{ok:false,message:err}` | `app/helpers.go:53-63` |
| Client error (bad JSON body) | Still 500. No 4xx mapping exists in the helpers | `app/helpers.go:62` |
| `json.Marshal` fails in `writeJSON` | `http.Error` 500 is written, but execution continues (no `return`) | `app/helpers.go:17-21` |
| Missing `Authorization` header with auth on | Plain-text 401 from `http.Error`. Invalid or expired token → 401 JSON | `app/handlers_auth.go:128-130,136-138` |
| UI receives 401 | `globalNavigate('/signin')` | `app/ui/src/util/http/http.jsx:6-11` |
| UI receives a non-JSON error body | Falls back to `"<errorMessage> - <statusText>"` | `app/ui/src/util/http/http.jsx:20-26` |
| Upload with MySQL engine | 500 "upload DB supported for SQLite engine only" | `app/handlers_db.go:17-20` |
| Upload fails after the pool is closed (create/copy error) | Returns 500. `app.db.DB` stays closed until restart | `app/handlers_db.go:36-51` |
| Uploaded file cannot be opened or validated | `errorLog.Fatalln` kills the process, and the original DB file is already overwritten | `app/handlers_db.go:53-56` |
| Download: file missing (or MySQL DSN) | Plain-text 404 "File not found" | `app/handlers_db.go:64-67` |
| Download: stat or copy failure | Plain-text 500 (a copy failure may come after the headers are sent) | `app/handlers_db.go:72-87` |
| `/api/auth-enabled` on a DB error | In practice a 500 JSON from `Auth` (`app/handlers_auth.go:115-118`), because the middleware calls `IsAuthEnabled` first and caches the result (`internal/models/auth.go:39`), so the handler's own call is a cache hit. The ignored `_` error at `app/handlers_aux.go:37` (which would answer `false`) is reachable only if `authCache` is cleared between the two calls (a concurrent settings save, `internal/models/settings.go:65`) and the DB then fails | `app/handlers_auth.go:115-118`, `app/handlers_aux.go:37` |
| Handler or middleware panic | No `Recoverer` is mounted. net/http recovers the panic, logs the stack through `srv.ErrorLog` (`app/main.go:55`, i.e. `errorLog`) and aborts the request without a response: it closes the connection on HTTP/1.1 or resets the stream on HTTP/2 (`-enable-https`). `handleFetch` (`app/ui/src/util/http/http.jsx:14`) then rejects with a network error, not a 500 JSON. Reachable panics are listed in §11 #19 | `app/routes.go:9-22`, `app/main.go:55` |
| DB download/upload request fails (UI) | The error toast shows (`useErrorNotification`), but the awaited `mutateAsync` rejects and nothing catches it. Download: `setIsDownloading(false)` and `handleCloseMenu()` are skipped, so the menu stays open with the item disabled and a spinner. Upload: `handleCloseMenu()` is skipped, so the menu stays open. Both leave an unhandled promise rejection (§11 #20) | `app/ui/src/components/Settings/GeneralSettings/DBControl/DBDownloadButton.jsx:36-41`, `app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx:46-52` |
| Distance with the same code twice | `0` | `internal/models/helpers.go:30-32` |
| Distance with an unknown code | `GetAirportByID` returns a zero `Airport` and a nil error, so the distance is computed against lat/lon 0,0 | `internal/models/airports.go:33-34`, `internal/models/helpers.go:45-51` |
| Night time with a missing place or time | `0, false, nil` (no error) | `app/helpers.go:69-71` |
| Night time with arrival before departure | Arrival time gets +24 h (flight past midnight) | `app/helpers.go:94-96` |
| `formatTimeField` with negative minutes | `""` | `app/helpers.go:116-118` |
| `serve` returns | Fatal unless `http.ErrServerClosed`, which never happens because nothing calls `Shutdown` | `app/main.go:209-214` |
| Startup step 8 or 9 fails | `return` from `main` (exit 0, server never started) | `app/main.go:174,181,188,197` |

## 9. Integration Points

| Doc | What crosses the boundary |
|---|---|
| ARCHITECTURE_DATABASE.md | `driver.OpenDB` / `validateDB` at startup and after a DB upload. `models.DBModel`, `JSONResponse`, `DefaultTimeout`. `distanceCache`, `Distance`, `CreateDistanceCache`, `UpdateFlightRecordsDistance` (`internal/models/helpers.go`) |
| ARCHITECTURE_AUTH.md | `app.Auth` mounted at `app/routes.go:27`. Public `/api/login` (`:24`). `-disable-authentication` → `DisableAuthorization`. `IsAuthEnabled` behind `/api/auth-enabled` |
| ARCHITECTURE_SETTINGS.md | `CheckDefaultValues` and `GetSettings` at startup. `app.timeFieldsAutoFormat` refreshed by `HandlerApiSettingsUpdate` (`app/handlers_settings.go:48`). The DB actions menu is an icon button in the header of the `GeneralSettings` card ("Settings") on the Settings page (`app/ui/src/components/Settings/GeneralSettings/GeneralSettings.jsx:15-27`, `app/ui/src/components/Settings/Settings.jsx:51`); the page is a two-column grid of cards, not tabs (`app/ui/src/components/Settings/Settings.jsx:49-60`) |
| ARCHITECTURE_AIRCRAFT_AIRPORTS.md | Startup airport bootstrap via `downloadAirportDB` / `UpdateAirportDB`. `GetAirportByID` and `airportCache` behind `/api/distance` and `calculateNightTime` |
| ARCHITECTURE_LOGBOOK.md | `calculateNightTime` used by `HandlerNightTime` (`app/handlers_flightrecord.go:39`). The custom-fields route distance calls `/api/distance` |
| ARCHITECTURE_IMPORT.md | `calculateNightTime` and `formatTimeField` used by `HandlerApiImportRun` (`app/handlers_import.go:194,204`) |
| ARCHITECTURE_STATS_AND_MAP.md | `GET /api/logbook/mapdata` is registered here with gzip (`app/routes.go:35`) |
| ARCHITECTURE_FRONTEND.md | The `//go:embed ui/dist/*` build dependency. `API_URL` / `handleFetch`. Vite dev mode calls `:4000` cross-origin, which relies on the CORS config (`app/routes.go:16-22`) |
| ARCHITECTURE_PERSONS.md, ARCHITECTURE_CURRENCY_LICENSING.md, ARCHITECTURE_PDF_EXPORT.md | Only route registration and the shared response helpers |

## 10. Testing

- **Existing:** none of `app/main.go`, `app/routes.go`, `app/helpers.go`, `app/handlers_aux.go` or `app/handlers_db.go` has tests. The only Go test in `app/` is `TestParseName` (`app/handlers_import_test.go:7`). The other Go test file is `internal/nighttime/nighttime_test.go`.
- **How to run:** `make test` → `go fmt ./...`, then `go test -v ./... -coverpkg=./...` (`Makefile:32-33`). It needs `app/ui/dist` because of `go:embed`, so run `make build_ui` first. CI runs `make npm_install build_ui` → `go vet ./...` → `make test` → `make build_backend` (`.github/workflows/go.yml:21-31`). `npm run build` runs vitest before `vite build` (`app/ui/package.json:8`).
- **Gaps worth filling:** a table test for `formatTimeField` (pure). An `httptest` test of `HandlerUI` path rewriting. A route smoke test with auth on and off (temp SQLite DSN). Upload and download against a temp SQLite file, including an invalid upload. The `writeJSON` marshal-error path.

## 11. Known Issues & Tech Debt

| # | Issue | Location | Status (Confirmed/Suspected) | Severity | verified: 2026-10-14 |
|---|---|---|---|---|---|
| 1 | DB upload is destructive and not atomic. The live pool is closed and the live file truncated before the upload is validated. If create or copy fails, the handler returns with `app.db.DB` closed, so every later request fails. If the new file fails `OpenDB`, `Fatalln` kills the process with the original already overwritten. No backup copy is made. = ARCHITECTURE_DATABASE.md §11 #20 | `app/handlers_db.go:36-58` | Confirmed: there is no temp file, rename or backup, and the error branches after `:36` never reopen the pool | MAJOR | verified: 2026-10-14 |
| 2 | DB upload keeps in-memory state from the previous DB. `authCache` (auth flag, secret key, last token), `airportCache`, `distanceCache` and `app.timeFieldsAutoFormat` are not reset, and startup steps 7–11 are not re-run. Example: a DB uploaded with auth enabled is served without auth if the old DB had auth off, until a restart or a settings save. This doc is the canonical owner; also listed as ARCHITECTURE_AUTH.md §11 #8, ARCHITECTURE_SETTINGS.md §11 #5, ARCHITECTURE_DATABASE.md §11 #8 and RULE_DEVELOPMENT.md §13 #9 | `app/handlers_db.go:53-60`, `internal/models/auth.go:11`, `internal/models/settings.go:65` | Confirmed: `authCache.Clear()` exists only in `UpdateSettings`, and the upload handler resets nothing | MAJOR | verified: 2026-10-14 |
| 3 | Startup aborts if the airports table is empty and the download fails (for example an offline first run). `main` returns, the server never starts and the exit code is 0. The same exit-0 `return` happens for the step 9 failure. = ARCHITECTURE_AIRCRAFT_AIRPORTS.md §11 #2 | `app/main.go:176-191,194-198` | Confirmed: `return` sits on every error branch | MAJOR | verified: 2026-10-14 |
| 4 | `/api/db/filename` returns the raw DSN. With `-engine mysql` this is `user:password@...`, sent to any client that passes Auth. Auth is off by default (`checkSettingsTable` sets only the owner name and signature) and the server listens on all interfaces by default. = ARCHITECTURE_DATABASE.md §11 #7 | `app/handlers_db.go:13`, `internal/driver/driver.go:143-154`, `app/main.go:82` | Confirmed | MAJOR | verified: 2026-10-14 |
| 5 | Cross-site requests against a local instance with auth off. The upload CSRF works regardless of CORS: a multipart POST to `/api/db/upload-db` is a simple request and needs no preflight. So is a `text/plain` POST to a JSON endpoint such as `POST /api/logbook/new` (`app/routes.go:42`), because no handler checks the request `Content-Type` before decoding (`app/handlers_flightrecord.go:75`). Preflighted `PUT`/`DELETE` also pass, because CORS allows every origin and both methods (`app/routes.go:17-18`). Separately, `AllowedOrigins: ["*"]` lets any origin **read** responses, for example exfiltrating the whole DB via `GET /api/db/download-db` (`app/handlers_db.go:63-88`) or the DSN via `GET /api/db/filename` (`app/handlers_db.go:12-14`). See also ARCHITECTURE_AUTH.md §11 #16 | `app/routes.go:16-22`, `app/handlers_db.go:16` | Suspected: exploitability depends on browser private-network protections and on go-chi/cors v1.2.2 header behaviour. Confirm with a cross-origin request test against a running instance | MAJOR | verified: 2026-10-14 |
| 6 | `writeJSON` has no `return` after a marshal failure, so after `http.Error` it calls `WriteHeader` again and writes an empty body. = RULE_DEVELOPMENT.md §13 #2 | `app/helpers.go:17-21` | Confirmed | MINOR | verified: 2026-10-14 |
| 7 | `handleError` always returns 500, even for malformed client input. Success shapes are inconsistent: `writeOkResponse` `{ok,message}` vs a bare JSON string (e.g. `app/handlers_currency.go:51`, `app/handlers_airport.go:213`). = RULE_DEVELOPMENT.md §13 #10 | `app/helpers.go:62` | Confirmed | MINOR | verified: 2026-10-14 |
| 8 | `POST /api/logout` is registered twice inside the auth group. = ARCHITECTURE_AUTH.md §11 #13, RULE_DEVELOPMENT.md §13 #13 | `app/routes.go:30,157` | Confirmed (same handler, so redundant; chi's handling of the duplicate was not checked against the library source) | MINOR | verified: 2026-10-14 |
| 9 | No server timeouts and no graceful shutdown. Nothing calls `srv.Shutdown`, so the `http.ErrServerClosed` branch is unreachable and the deferred `conn.Close()` / `logf.Close()` never run on SIGINT/SIGTERM | `app/main.go:52-59,209-214` | Confirmed: a repo-wide grep finds no `Shutdown`, `signal.Notify` or `*Timeout` fields | MINOR | verified: 2026-10-14 |
| 10 | Download and upload treat the DSN as a bare file path. With `-engine mysql`, download returns a plain-text 404 (no engine check, unlike upload). An SQLite URI DSN with parameters would be used verbatim as a file name | `app/handlers_db.go:39,64` | Confirmed for MySQL. Suspected for URI DSNs (confirm with `-dsn "file:x.sql?_pragma=..."`) | MINOR | verified: 2026-10-14 |
| 11 | Download copies the live SQLite file without coordinating with SQLite (no pragmas or WAL configured), so a commit during the copy may produce an inconsistent backup | `app/handlers_db.go:64-87` | Suspected: confirm by downloading during a concurrent write and running `PRAGMA integrity_check` on the copy | MINOR | verified: 2026-10-14 |
| 12 | Unsynchronised writes to shared fields: `app.db` is reassigned during upload and `app.timeFieldsAutoFormat` during a settings save, while other request goroutines read them. The `timeFieldsAutoFormat` part = ARCHITECTURE_SETTINGS.md §11 #14 | `app/handlers_db.go:58`, `app/handlers_settings.go:48` | Confirmed: no mutex or atomic exists. `go test -race` with concurrent requests would show it | MINOR | verified: 2026-10-14 |
| 13 | `-disable-authentication` logs "authentication has been disabled" and exits 0 even when `DisableAuthorization` failed. = ARCHITECTURE_AUTH.md §11 #11 | `app/main.go:155-160` | Confirmed | MINOR | verified: 2026-10-14 |
| 14 | The airport-count error branch in `main` is dead code: `GetAirportDBRecordsCount` discards the `Scan` error and returns `count, nil`. A failing query therefore looks like an empty table and triggers a download. = ARCHITECTURE_AIRCRAFT_AIRPORTS.md §11 #8 | `app/main.go:171-175`, `internal/models/airports.go:50-51` | Confirmed | MINOR | verified: 2026-10-14 |
| 15 | `/api/distance` with an unknown code (and, on SQLite, a lower-case code) returns the distance to lat/lon 0,0 instead of 0. `GetAirportByID` returns nil error on `ErrNoRows`, and `HandlerDistance` does not upper-case (unlike `HandlerApiAirportByID`, `app/handlers_airport.go:21`). The lookup `icao = ? or iata = ?` (`internal/models/airports.go:26-28`) runs on `airports_view`, which declares no collation and exposes custom codes as `UPPER(name)` (`internal/driver/db_structure.go:229-241`). The wrong value is cached in `distanceCache` (`internal/models/helpers.go:52`) and can be persisted by `UpdateFlightRecordsDistance` (`internal/models/helpers.go:89-92`). `calculateNightTime` has the same blind spot. = ARCHITECTURE_AIRCRAFT_AIRPORTS.md §11 #1, #19; ARCHITECTURE_DATABASE.md §11 #6 | `app/handlers_aux.go:42-44`, `internal/models/helpers.go:45-51`, `internal/models/airports.go:33-34`, `app/helpers.go:73-91` | Confirmed for unknown codes on both engines, and for lower-case codes on SQLite (default BINARY comparison). On MySQL the lower-case behaviour depends on the DB collation (usually case-insensitive) | MINOR | verified: 2026-10-14 |
| 16 | The SPA fallback matches substrings: any URL containing `assets` or `favicon.ico` bypasses the rewrite, and any other root-level file added to `dist` would be answered with index.html. The `fs.Sub` error is ignored | `app/handlers_aux.go:17,24` | Confirmed (no current SPA route contains `assets`; `app/ui/src/main.jsx:41-94`) | MINOR | verified: 2026-10-14 |
| 17 | The log file is truncated on every start and has no rotation. `internal/driver` writes migration messages with `fmt.Print*` to stdout only, so they never reach the log file | `app/main.go:98`, `internal/driver/driver.go:57,104,107,112` | Confirmed | MINOR | verified: 2026-10-14 |
| 18 | Upload size is unbounded: `ParseMultipartForm(1000<<20)` only sets the in-memory threshold and no `http.MaxBytesReader` exists | `app/handlers_db.go:22` | Confirmed | MINOR | verified: 2026-10-14 |
| 19 | No panic-recovery middleware, so a panic in a handler or in `Auth` drops the connection (or resets the HTTP/2 stream) instead of returning a 500 JSON. Reachable today: unknown export format, nil `exportFunc` (`app/handlers_export.go:166`); unknown format on the settings export PUT, nil `targetExport` (`app/handlers_settings.go:132`); `fill = 0` (`internal/pdfexport/pdfexport.go:435`); unknown person UUID (`internal/models/persons.go:42`); an `Authorization` header shorter than 7 bytes (`app/handlers_auth.go:132`); `POST /api/logout` with auth off (`app/handlers_auth.go:227`). The individual panics are owned by ARCHITECTURE_PDF_EXPORT.md §11 #3, #8, ARCHITECTURE_SETTINGS.md §11 #8, ARCHITECTURE_PERSONS.md §11 #1 and ARCHITECTURE_AUTH.md §11 #4, #5 | `app/routes.go:9-22` | Confirmed: there is no `Recoverer` on the router, and the only `recover()` in `app/` and `internal/` is in `validateCustomTitlePdf` (`app/handlers_export.go:22-26`), which is not on the request path | MINOR | verified: 2026-10-14 |
| 20 | DB download/upload buttons do not catch `mutateAsync` rejections. On a failed download the menu stays open with the item disabled and a spinner (`setIsDownloading(false)` and `handleCloseMenu()` are skipped). On a failed upload the menu stays open. Both leave an unhandled promise rejection; the error toast still shows | `app/ui/src/components/Settings/GeneralSettings/DBControl/DBDownloadButton.jsx:36-41`, `app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx:46-52` | Confirmed: `handleFetch` throws on a non-OK response (`app/ui/src/util/http/http.jsx:16-27`), TanStack `mutateAsync` rejects on error, and there is no try/catch/finally | MINOR | verified: 2026-10-14 |

## 12. Rules for Future Development

### 12.1 Add an API endpoint to an existing group

1. **Model:** add a `func (m *DBModel) X(...)` in the owning `internal/models/<domain>.go`. Use `m.ContextWithDefaultTimeout()` (`internal/models/helpers.go:22`) and `?` placeholders, which work on both SQLite and MySQL.
   - **Caches:** if the write changes data served from a package-level `sync.Map` cache (`authCache` `internal/models/auth.go:11`, `airportCache` `internal/models/airports.go:13`, `distanceCache` `internal/models/helpers.go:26`), clear or evict it in the same `DBModel` method. Pattern: `UpdateAirportDB` clears `airportCache` and rebuilds the distances (`internal/models/airports.go:95-96`).
2. **Handler:** in `app/handlers_<domain>.go`, add `func (app *application) HandlerApi<Name>(w http.ResponseWriter, r *http.Request)`. Read path params with `chi.URLParam`. On error, call `app.handleError(w, err); return`. On success, call `app.writeJSON(w, http.StatusOK, data)`, or `app.writeOkResponse(w, msg)` for mutations.
3. **Route:** register it in `app/routes.go` **inside** `r.Route("/api", ...)`, after `r.Use(app.Auth)` (`app/routes.go:26-27`), in the matching sub-group. Wrap large GET payloads with `r.With(middleware.Compress(5))`. Never register next to `/api/login` (`:24`), because that bypasses auth.
4. **UI:** add a fetch function in `app/ui/src/util/http/<domain>.jsx` that uses `API_URL`, `handleFetch` and the `Authorization: Bearer ${getAuthToken()}` header (pattern: `app/ui/src/util/http/db.jsx:5-13`). Wire a `useQuery` / `useMutation` with a stable `queryKey`, and invalidate every dependent key in `onSuccess`, including `['logbook']` (`app/ui/src/hooks/queries/useLogbookQuery.js:5`), from which stats, currency and autocomplete derive (see ARCHITECTURE_FRONTEND.md).
5. **Docs:** update the owning `ARCHITECTURE_<SYSTEM>.md` §4.2. README.md:319 points readers to `app/routes.go#L26` as the public API list.
6. **Tests:** add a table-driven Go test (`*_test.go` next to the code, e.g. `app/handlers_import_test.go`) or a Vitest test (`*.test.jsx` next to the module, e.g. `app/ui/src/hooks/useSettings.test.jsx`) for any new pure logic. Run `make build_ui` before `make test` because of `go:embed`. `npm run build` runs `vitest run` first (`app/ui/package.json:8`).

### 12.2 Add a new route group / handler file

- Create `app/handlers_<domain>.go` in `package main`, with methods on `*application`.
- Add an `r.Route("/<domain>", ...)` block inside the `/api` group, next to the others (`app/routes.go:33-154`). Keep the aux routes at the end.
- Add a row to the route map in §4.2 of this doc.

### 12.3 Add a CLI flag

1. Add a field to `config` (`app/main.go:25-38`) and a `flag.*Var` in `parseFlags` (`app/main.go:77-95`). Use the value through `app.config.<field>`.
2. If it is a one-shot action like `-disable-authentication`, return it from `parseFlags` and handle it in `main` after the DB is opened (pattern: `app/main.go:154-161`).
3. Update the verbatim `-h` block in `README.md:132`, `docker/README.md` if containers need it, and `CHANGELOG.md` `[Unreleased]` together with its copy in README.

### 12.4 Add a startup step

- Put it in `main` after `GetSettings` (`app/main.go:194-199`) and before `serve()` (`:209`). Long work belongs in a goroutine, like `CreateDistanceCache` (`:202`).
- Decide on purpose between "log and continue" (`:164-168`) and abort. If it must abort, use `errorLog.Fatalln` (exit 1) rather than a bare `return` (exit 0, see issue #3).
- If the step derives in-memory state from the DB, also re-run it after `HandlerApiUploadDB` reconnects (`app/handlers_db.go:53-58`).

### 12.5 Change response helpers or the error shape

- `app/helpers.go:16-63` is used by every `app/handlers_*.go`, so grep all callers.
- The UI shows `error.info?.message`, falling back to `error.message` and then the caller's `fallbackMessage` (`app/ui/src/hooks/useAppNotifications.jsx:9`), and treats any non-2xx as an error (`app/ui/src/util/http/http.jsx:16`). Keep the `message` field and the `ok` flag of `JSONResponse` (`internal/models/structs.go:17-22`).
- The `handleError` caller-line logging depends on being called **directly** from the handler (`runtime.Caller(1)`, `app/helpers.go:55`). Do not wrap it in another helper.

### 12.6 Touch DB upload/download

- Keep upload SQLite-only (`app/handlers_db.go:17`). After any reconnect, reset `authCache` / `airportCache` / `distanceCache`, reload `timeFieldsAutoFormat` and re-run the startup housekeeping (§3.1 steps 7–11). Those caches are package-private in `internal/models`, so resetting them needs an exported reset method there (DATABASE / AUTH owners).
- Write to a temp file and validate it with `driver.OpenDB` before replacing the live file. Never `Fatalln` inside a handler.
- Keep the form field name `dbfile` in sync with `app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx:48`.

### 12.7 Bump the version

Update `version` in `app/main.go:18`, add the `CHANGELOG.md` section, and update the copy of the changelog section in `README.md` (starts at `README.md:64`). The UI shows the value through `/api/version` and compares it with the GitHub latest release (`app/ui/src/components/UIElements/Dashboard/DashboardToolbar.jsx:42-45`).

### Cross-check list

- [ ] The new route sits under the `app.Auth` group (`app/routes.go:26-27`), unless it is deliberately public.
- [ ] Errors go through `handleError`, and every error branch ends with `return`.
- [ ] Model SQL works on **both** SQLite and MySQL. A schema change needs a `schemaVersion` bump in `internal/driver/db_structure.go:4` (see ARCHITECTURE_DATABASE.md).
- [ ] New in-memory state is reset on a DB upload and on a settings save, where relevant.
- [ ] Every write path that changes cached data evicts the matching `sync.Map` cache (`authCache`, `airportCache`, `distanceCache`).
- [ ] UI query keys are invalidated after mutations, including `['logbook']` when logbook-derived data changes. The upload path invalidates everything (`app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx:30`).
- [ ] New pure logic has a table-driven Go test or a Vitest test.
- [ ] `make build_ui` was run before `go vet` / `go test` / `go build` (`go:embed`).
- [ ] `CHANGELOG.md` `[Unreleased]` has a `- New:` / `- Update:` / `- Fix:` bullet, mirrored in `README.md`.
- [ ] The README CLI block (`README.md:132`) matches `parseFlags` when flags change.

## 13. AI Notes

### Mental Model

`main` = flags → logger → `OpenDB` (schema migrate) → one-shot `-disable-authentication` → settings defaults → airport bootstrap → caches → `serve`. `routes()` = dev logger → CORS → public login → `/api` group behind `Auth` → `/*` SPA, with no panic-recovery middleware. Each handler is a thin `application` method: decode, call a `DBModel` method, then `writeJSON` or `handleError`. The DB file endpoints are the only place where the app layer touches the filesystem and swaps `app.db` at runtime.

### Gotchas

- `go build` and `go vet` fail without `app/ui/dist` because of `//go:embed ui/dist/*` (`app/handlers_aux.go:12`).
- `/api/version` and `/api/auth-enabled` are **behind** Auth (`app/routes.go:160-161`). Only `/api/login` is public.
- `-env` only toggles the chi request logger (`app/routes.go:12`). It has no other effect. `make start` uses `ENV=dev` (`Makefile:2`).
- The startup airport download always uses the default GitHub JSON with the ICAO filter on, whatever `AirportDBSource` / `NoICAOFilter` say in settings (`app/main.go:178,185`). The settings-driven download is `HandlerApiAirportDBUpdate` (`app/handlers_airport.go:195`).
- On a first run, `CreateDistanceCache` starts twice: once from `UpdateAirportDB` (`internal/models/airports.go:96`) and once from `main` (`app/main.go:202`).
- `errorLog` has `Lshortfile`, which would always print the logging line inside `handleError`. That is why `handleError` prefixes the real caller location itself (`app/helpers.go:55-57`).
- Relative paths (`-dsn`, log file, certs) resolve against the process CWD. In Docker that is `/web-logbook` (`docker/build.Dockerfile:8`).
- In Docker the `/certs` volume (`docker/build.Dockerfile:19`) is not the default cert location: `-key` / `-cert` default to `certs/...` under WORKDIR `/web-logbook` (`app/main.go:90-91`). HTTPS needs `-enable-https -key /certs/... -cert /certs/...`. The example in `docker/README.md:69` passes only `-cert`, without `-enable-https` or `-key`, so it serves plain HTTP. Also, the release workflow pushes only the version tag (`:latest` / `:4` are commented out, `.github/workflows/release.yml:85-86`), although `docker/README.md:24-27` advertises `:latest`; how `:latest` is updated is not found in the repository. See HOWTO_RELEASE.md §5.
- `formatTimeField` reads `app.timeFieldsAutoFormat`, which is refreshed only at startup and by `HandlerApiSettingsUpdate`. Its only current caller is the import log (`app/handlers_import.go:204`).
- The UI dev server calls `http://localhost:4000/api` cross-origin (`app/ui/src/constants/constants.jsx:11`). Tightening CORS breaks `npm run dev` unless the dev origin stays allowed.

### File Quick Reference

| Need | Go to |
|---|---|
| Version / flags / startup order | `app/main.go:18`, `:77-95`, `:119-215` |
| Route table and middleware | `app/routes.go:9-168` |
| JSON / error helpers | `app/helpers.go:16-63` |
| Night-time calculation wrapper | `app/helpers.go:67-113` |
| Time display formatting | `app/helpers.go:115-140` |
| SPA serving / embed | `app/handlers_aux.go:12-30` |
| Version, auth flag and distance endpoints | `app/handlers_aux.go:32-46` |
| DB backup/restore | `app/handlers_db.go:12-88` |
| DB open + schema validate | `internal/driver/driver.go:23-94` |
| UI DB menu | `app/ui/src/components/Settings/GeneralSettings/DBControl/` |
| UI fetch wrapper | `app/ui/src/util/http/http.jsx:13-31` |

> **AI Usage Instructions**
> - Always read this file before modifying this system
> - Do not refactor without impact analysis
> - Ask if information is missing
