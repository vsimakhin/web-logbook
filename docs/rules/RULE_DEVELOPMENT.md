# Development Rules

How backend and frontend fit together and what must stay consistent when you change them. Derived from the code as of 2026-10-14; every rule cites its evidence. Naming and formatting: `docs/rules/RULE_CODE_STYLE.md`. Git: `docs/rules/RULE_GIT.md`. System details: `docs/architecture/ARCHITECTURE_*.md` (start with `docs/architecture/ARCHITECTURE_APPLICATION.md` and `docs/architecture/ARCHITECTURE_DATABASE.md`).

---

## 1. Request Lifecycle

```
React SPA (app/ui/src)
  util/http/<domain>.jsx  fetch(`${API_URL}/...`, Authorization: Bearer <token>)
    chi router ................ app/routes.go:9   (middleware.Logger if -env=dev :12-14, CORS :16-22)
      POST /api/login ......... app/routes.go:24  public
      /api/* .................. app/routes.go:26-163, r.Use(app.Auth) :27  -> Auth app/handlers_auth.go:112
        HandlerApi<Entity><Action> ....... app/handlers_<domain>.go
          app.db.<Method>() .............. internal/models/<domain>.go (DBModel)
            database/sql, raw SQL, ? placeholders -> base tables / *_view
      /* ...................... SPA fallback HandlerUI app/handlers_aux.go:15-30 (Compress, app/routes.go:165)
```

- `Auth` passes everything through when authentication is disabled in settings (`app/handlers_auth.go:120-124`); otherwise it checks the JWT and the `tokens` row (`app/handlers_auth.go:127-159`). Details: `docs/architecture/ARCHITECTURE_AUTH.md`.
- Startup order (DB open + `validateDB`, defaults, airport DB download, distance cache) is in `main` (`app/main.go:119-215`); see `docs/architecture/ARCHITECTURE_APPLICATION.md`.

---

## 2. Recipe: Add an API Endpoint

1. DBModel method in `internal/models/<domain>.go` (§4).
2. Handler in `app/handlers_<domain>.go` (§3), named per `docs/rules/RULE_CODE_STYLE.md` §2.2.
3. Register it **inside** the authenticated `/api` group, in the domain's `r.Route("/<domain>", ...)` block (`app/routes.go:131-138`). REST shape of the recent domains (currency, custom fields): `GET /list`, `GET /{uuid}`, `POST /new`, `PUT /{uuid}`, `DELETE /{uuid}` (`app/routes.go:132-146`).
4. Large GET payloads get `r.With(middleware.Compress(5))` — logbook data/map data, airport lists, person list, single license and attachment (`app/routes.go:34-35`, `app/routes.go:56`, `app/routes.go:67`, `app/routes.go:94-96`, `app/routes.go:106`).
5. UI: HTTP function in `app/ui/src/util/http/<domain>.jsx`, query hook or mutation with invalidation (§9).
6. Docs: API table of the system's architecture doc + CHANGELOG (§12).

Only `/api/login` is registered outside the `Auth` group (`app/routes.go:24`); keep it that way.

---

## 3. Handlers and Responses

Dominant shape (`HandlerApiCurrencyUpdate`, `app/handlers_currency.go:54-67`):

```go
func (app *application) HandlerApiCurrencyUpdate(w http.ResponseWriter, r *http.Request) {
	var c models.Currency
	err := json.NewDecoder(r.Body).Decode(&c)
	if err != nil {
		app.handleError(w, err)
		return
	}
	err = app.db.UpdateCurrency(c)
	if err != nil {
		app.handleError(w, err)
		return
	}
	app.writeJSON(w, http.StatusOK, "Currency updated") // new code: app.writeOkResponse(w, "Currency updated")
}
```

**Rule: `handleError` then `return`.** `handleError` writes the 500 response; anything written afterwards is a bug. Existing violations: `HandlerLogin` (`app/handlers_auth.go:206-213`), `HandlerLogout` (`app/handlers_auth.go:228-232`).

| Helper (`app/helpers.go`) | Line | Use |
|---|---|---|
| `writeJSON(w, status, data, headers...)` | 16 | GET payloads: entity, list, scalar |
| `writeErrorResponse(w, status, msg)` | 37 | deliberate non-500 errors (401, 403, 404; 400 only where the Spec says so) |
| `writeOkResponse(w, msg)` | 45 | successful mutations → `{"ok":true,"message":...}` |
| `handleError(w, err)` | 53 | unexpected errors → logs caller `file:line`, 500 + `{"ok":false,"message":err.Error()}` |

- `models.JSONResponse` has `ok`, `message`, `redirect_url`, `data` (`internal/models/structs.go:17-22`). Create endpoints are inconsistent: flight-record and licence create return the new UUID in `data` (`HandlerApiFlightRecordNew`, `app/handlers_flightrecord.go:97-102`; `HandlerApiNewLicensingRecord`, `app/handlers_licensing.go:99-104`) and the UI reads it (`app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:29-30`, `app/ui/src/components/LicenseRecord/SaveLicenseRecordButton.jsx:28-29`); currency and custom-field create return a bare string (`app/handlers_currency.go:51`, `app/handlers_custom_fields.go:51`); person create returns the `Person` object (`app/handlers_person.go:57`). New create endpoints: `writeJSON` a `models.JSONResponse` with `ok: true`, a message and the new UUID in `data`.
- The UI shows `error.info?.message || error?.message || fallbackMessage` (`app/ui/src/hooks/useAppNotifications.jsx:9`); for an HTTP error `info` is the JSON body (`app/ui/src/util/http/http.jsx:20-21`), so error texts must make sense to a pilot. On a dropped connection (e.g. a handler panic, §13 #4) the browser's fetch error text (such as "Failed to fetch") is shown instead.
- Inconsistent today: 16 mutation handlers answer with a bare JSON string (`app/handlers_currency.go:66`; also persons, custom fields, custom airports) and 18 use `writeOkResponse`. New code uses `writeOkResponse`.
- Status codes in use: 200; 401 (`app/handlers_auth.go:129`, `app/handlers_auth.go:137`); 403 (`app/handlers_auth.go:174`, `app/handlers_auth.go:198`); 404 (`app/handlers_airport.go:32`, `app/handlers_db.go:66`); 500 via `handleError`. `400` is Not found in code — invalid input currently yields 500 through `handleError`. Rule for new code: unexpected errors and invalid input go through `handleError` (500); deliberate 401/403/404 use `writeErrorResponse`; a `400` is sent only where the task's Spec (§12, which names the status codes of each endpoint) says so, with `app.writeErrorResponse(w, http.StatusBadRequest, "<message>")` (`app/helpers.go:37`) followed by `return`. Review status codes against this rule and the Spec.
- Inputs: `chi.URLParam(r, "uuid")`; `json.NewDecoder(r.Body).Decode(&x)`; uploads via `r.ParseMultipartForm(32 << 20)` + `r.FormFile("document")` (`app/handlers_attachments.go:70-99`). A `switch` over a path parameter must have a `default` that returns an error (see §13 #5).
- Long-running jobs stream NDJSON progress like `HandlerApiImportRun` (`app/handlers_import.go:98-128`).

---

## 4. Database Access

- Only through `DBModel` methods. `DBModel` holds just `*sql.DB` (`internal/models/structs.go:12-14`). No ORM (none in `go.mod`).
- Each method starts with `ctx, cancel := m.ContextWithDefaultTimeout()` + `defer cancel()` — 60 s (`internal/models/helpers.go:14`, `internal/models/helpers.go:22-24`). Bulk jobs use an explicit longer timeout (`UpdateAirportDB`, 300 s, `internal/models/airports.go:56`).
- Raw SQL with `?` placeholders (both drivers accept them). Never format user input into SQL; `fmt.Sprintf` SQL exists only for DDL identifiers that come from code (`internal/driver/db_operations.go:116`).
- `DBModel` does not know the engine, so **SQL in `internal/models` must run unchanged on SQLite and MySQL/MariaDB** (no engine branches exist there). Engine-specific SQL lives only in `internal/driver` as per-engine `SQLQuery` pairs (e.g. `||` vs `CONCAT` in `aircraftsView`, `internal/driver/db_structure.go:244-293`).
- Read from views (`logbook_view`, `airports_view`, `aircrafts_view`, `attachments_view`), write to base tables: `GetFlightRecordByID` reads `logbook_view` (`internal/models/flightrecords.go:39`), `UpdateFlightRecord` writes `logbook` (`internal/models/flightrecords.go:66`).
- Scan nullable or later-added text columns with `IFNULL(col, '')` (`internal/models/currency.go:9`).
- Multi-statement writes run in one transaction with rollback on every error path (`GenerateAircraftTable`, `internal/models/aircrafts.go:11-84`). In new code prefer `m.DB.BeginTx(ctx, nil)` + `defer tx.Rollback()` as in `dataOverhaulMigration` (`internal/driver/data_overhaul.go:432-436`).
- The `aircrafts` table is derived from the logbook: every flight write calls `GenerateAircraftTable` (`app/handlers_flightrecord.go:95`, `app/handlers_flightrecord.go:121`).

---

## 5. Schema Changes (`internal/driver`)

Schema is declarative: table and view vars in `internal/driver/db_structure.go`. `validateDB` (`internal/driver/driver.go:43-94`) runs at startup and does work only when the stored version differs from `schemaVersion` (`internal/driver/driver.go:56`).

| `validateDB` does | Where |
|---|---|
| create missing tables | `internal/driver/db_operations.go:100-105` |
| add missing columns (`ALTER TABLE ... ADD COLUMN`) | `internal/driver/db_operations.go:167-173` |
| create missing indexes `<table>_<column>` for `Index: true` | `internal/driver/db_operations.go:175-180`, `internal/driver/db_operations.go:222-227` |
| drop and recreate every view | `internal/driver/db_operations.go:231-241` |
| **does not** change types, rename or drop columns, or rewrite data | — |

Recipes:

- **Add a column:** append `Column{Name, Type, Properties}` using the shared types `UUID`, `DateTime`, `SmallText`, `BigText`, `FullText`, `SmallInt`, `Int`, `Real`, `Blob` (`internal/driver/db_structure.go:6-14`); bump `schemaVersion` (`internal/driver/db_structure.go:4`, currently `"101"`); add the column to the view **in both the SQLite and MySQL query** if reads need it (`logbookView`, `internal/driver/db_structure.go:168-227`); update the struct and every column list in SELECT/INSERT/UPDATE. For a logbook column that means the four SELECTs in `GetFlightRecordByID` (`internal/models/flightrecords.go:27`), `GetFlightRecords` (`:128`), `GetFlightRecordsForExport` (`:168`) and `GetFlightRecordsForMap` (`:218`) — each selects its own column subset, so add the column to every one whose consumer (flight form, logbook table, PDF export, map) needs it — plus `UpdateFlightRecord` (`:61`) and `InsertFlightRecord` (`:87`).
- `NOT NULL` columns need a `DEFAULT` for existing rows (`tags`, `internal/driver/db_structure.go:51`). MySQL `TEXT`/`LONGBLOB` (`FullText`, `Blob`) cannot take a literal default: `sub_metrics` had to drop `NOT NULL DEFAULT ''` in `cabf7e5` (#546). Leave such columns nullable and `IFNULL` them on read.
- **Add a table:** `NewTable(...)` var + append it to the `tables` slice (`internal/driver/driver.go:60-64`). **Add a view:** `NewView(...)` with both engine queries + the `views` slice (`internal/driver/driver.go:73`).
- **Change a type, rename, or transform data:** write an explicit migration modelled on `internal/driver/data_overhaul.go` — one transaction, one function per step, MySQL-only DDL behind `if engine == MySQL` (`internal/driver/data_overhaul.go:461-465`), progress via `fmt.Println`, triggered from `validateDB` by a version check (`internal/driver/driver.go:47-54` runs the overhaul for stored versions below 100). MySQL DDL commits implicitly, so a failure after an `ALTER` is not rolled back — order steps so a re-run is safe.
- Keep declarative types aligned with migrations: fresh MySQL installs create the time columns as `SMALLINT` (`internal/driver/db_structure.go:32-45`) while migrated databases have `INT` (`internal/driver/data_overhaul.go:411-423`).
- Never drop or rename columns through the declarative schema; keep the old name (`airports_custom.name` kept "for back compatibility", `internal/driver/db_structure.go:67`).
- SQL/DDL changes must work on both engines; MySQL/MariaDB-only breakages in history: `cabf7e5` (#546), `5ea5871` (fix/mariadb-1292-error).

---

## 6. Settings (JSON Blob)

- One row in `settings2` (`id = 0`), column `settings` = JSON of `models.Settings` (`internal/driver/db_structure.go:77-80`; `GetSettings` `internal/models/settings.go:11-28`; struct `internal/models/structs.go:221-272`). New settings need **no** schema change and no `schemaVersion` bump.
- Backward compatibility: old rows decode a new field as its zero value. Make zero mean "default/off", or set a default in `CheckDefaultValues` (`internal/models/models_defaults.go:151-197`, called at startup `app/main.go:164`) and/or in the UI fallback (`app/ui/src/hooks/useSettings.jsx:136-137`).
- `PUT /api/settings/general` overwrites the blob with the client object except the preserved fields `ExportA4`, `ExportA5`, `SignatureImage` (`app/handlers_settings.go:36-40`). A field edited on another page needs its own endpoint that loads the stored settings and patches only that field (`HandlerApiSettingsAirports`, `app/handlers_settings.go:77-100`) **and** must join the preserved list.
- `UpdateSettings` hashes a non-empty `Password` into `Hash` and clears `authCache` (`internal/models/settings.go:35-52`, `internal/models/settings.go:65`); the GET handler blanks `Hash` (`app/handlers_settings.go:18`).
- `timeFieldsAutoFormat` is mirrored on `application` (`app/main.go:199`, `app/handlers_settings.go:48`); any new path that writes it must refresh the mirror.

---

## 7. In-Memory Caches

| Cache | Declared | Filled | Invalidated |
|---|---|---|---|
| `distanceCache` (`sync.Map`) | `internal/models/helpers.go:26` | `Distance` (`internal/models/helpers.go:41-53`); warm-up `CreateDistanceCache` at startup (`app/main.go:202`) | cleared in `CreateDistanceCache` (`internal/models/helpers.go:111`), re-run after `UpdateAirportDB` (`internal/models/airports.go:96`) |
| `airportCache` (`sync.Map`) | `internal/models/airports.go:13` | `GetAirportByID` (`internal/models/airports.go:40`); misses are not cached (`internal/models/airports.go:33-35`) | only in `UpdateAirportDB` (`internal/models/airports.go:95`) |
| `authCache` (`sync.Map`) | `internal/models/auth.go:11` | `GetSecretKey`, `IsAuthEnabled`, `VerifyToken` | `UpdateSettings` (`internal/models/settings.go:65`) |
| `app.timeFieldsAutoFormat` | `app/main.go:47` | `app/main.go:199` | `app/handlers_settings.go:48` |

Rules: a cache is a package-level `sync.Map` in the model file that owns the data; every write path that changes cached data evicts or clears it **in the same DBModel method**; derived caches (distances) are rebuilt when their source (airports) changes. Known gaps: §13 #6, #7, #9.

---

## 8. Data Formats

| Data | Stored / transported as | Evidence |
|---|---|---|
| Dates | ISO `YYYY-MM-DD` string; display format is a setting (`date_fields_format`, UI default `DD/MM/YYYY`) | `internal/driver/data_overhaul.go:13-16`, `app/ui/src/constants/constants.jsx:16`, `app/ui/src/hooks/useSettings.jsx:137` |
| Durations (block, PIC, night, SIM, …) | integer minutes in DB, JSON and UI state | `internal/models/structs.go:40-51`, `internal/driver/db_structure.go:32-45`, `CHANGELOG.md:11` |
| Duration display | `1` = HH:MM, `2` (and legacy `0`) = H:MM, `3` = decimal hours. Two settings feed it: the general `time_fields_auto_format` (`Settings.TimeFieldsAutoFormat`, `internal/models/structs.go:241`), read by the Go `app.formatTimeField` through the `app.timeFieldsAutoFormat` mirror and by the UI as `useSettings().timeFieldsFormat`; and the per-format `export_a4` / `export_a5` `time_fields_auto_format` (`ExportPDF.TimeFieldsAutoFormat`, `internal/models/structs.go:215`), edited on the PDF export page (`app/handlers_settings.go:145`) and used only by the PDF | three implementations to keep identical: `formatTimeField` `app/helpers.go:115-140` (only used for import log lines, `app/handlers_import.go:204`), `formatTimeFieldOptions` `internal/pdfexport/pdfexport.go:502-531` (reads `p.Export.TimeFieldsAutoFormat`, `:511`, `:519`), `formatTimeField` `app/ui/src/util/helpers.jsx:4-23`; input parsing `parseTimeToMinutes` `app/ui/src/util/helpers.jsx:26-47`. Known deviations: the UI maps a stored `0` to `1` (`data.time_fields_auto_format \|\| 1`, `app/ui/src/hooks/useSettings.jsx:136`), so legacy `0` shows HH:MM in the UI but H:MM in Go and the PDF; the UI and the PDF return `""` for 0 minutes unless `formatZero` is set (`app/ui/src/util/helpers.jsx:6`, `internal/pdfexport/pdfexport.go:507`), the Go `formatTimeField` does not |
| Departure/arrival clock time | 4-character `HHMM` string | `app/helpers.go:78`, `app/ui/src/components/FlightRecord/PlaceField.jsx:21-22`, `app/ui/src/components/FlightRecord/PlaceField.jsx:93` |
| Custom field values | JSON object string keyed by custom-field UUID; `duration` fields hold minutes | `internal/models/structs.go:69`, `app/ui/src/util/http/logbook.jsx:16-38`, `internal/driver/data_overhaul.go:93-130` |
| Distance | float, nautical miles | `internal/utils/distance.go:23` |
| IDs | UUID v4 strings; airports keyed by ICAO, aircraft by registration | `app/handlers_person.go:44`, `internal/driver/db_structure.go:55`, `internal/driver/db_structure.go:109` |

Never store formatted values. Convert only at the edges: UI input/display, PDF export, import.

---

## 9. Frontend Data Fetching

- `API_URL` is `/api` in production (same origin, SPA embedded in the binary) and `http://localhost:4000/api` when Vite runs in development mode (`app/ui/src/constants/constants.jsx:9-12`). `npm run dev` therefore needs the backend on port 4000 (`make start_backend` → `-port=4000 -env=dev`, `Makefile:1-2`, `Makefile:46-48`); CORS allows any origin (`app/routes.go:16-22`).
- Every request sends `Authorization: Bearer ${getAuthToken()}` (`app/ui/src/util/auth.jsx:13-16`). `handleFetch` throws an `Error` carrying `code` and `info` (parsed JSON body) and navigates to `/signin` on 401 (`app/ui/src/util/http/http.jsx:6-31`).
- Coerce numbers before sending — Go decodes into `int` and rejects strings: `parseInt(...) || 0` in the HTTP layer (`app/ui/src/util/http/currency.jsx:18-19`, `app/ui/src/util/http/fields.jsx:5-11`).
- After a mutation, invalidate **every** query whose server data changed, including derived data. Saving a flight invalidates `['flight', uuid]`, `['logbook']`, `['currency']`, `['aircrafts']`, `['models-categories']` (`app/ui/src/components/FlightRecord/SaveFlightRecordButton.jsx:41-47`) because the backend regenerates the aircraft tables. Whole-database operations call `queryClient.invalidateQueries()` without a key (`app/ui/src/components/Import/RunImportButton.jsx:34`, `app/ui/src/components/Settings/GeneralSettings/DBControl/DBUploadButton.jsx:30`).
- `staleTime` is one hour (`app/ui/src/hooks/queries/useLogbookQuery.js:7`), so a missed invalidation shows stale data until reload. When adding a write, grep all `queryKey` users of the affected endpoints.

---

## 10. Dependencies and Builds

- **Pure Go only.** SQLite via `modernc.org/sqlite` (`go.mod:15`), MySQL via `github.com/go-sql-driver/mysql` (`go.mod:9`). All 7 release targets build with `CGO_ENABLED=0`: linux amd64/arm64/arm v6/arm v7, darwin amd64/arm64, windows amd64 (`Makefile:50-99`). A dependency that needs cgo breaks the release.
- The binary embeds `app/ui/dist` (`app/handlers_aux.go:12-13`), so `go build`, `go vet` and `make test` need `make build_ui` first. `npm run build` runs `vitest run` before `vite build` (`app/ui/package.json:8`) — a failing UI test fails the UI build and CI.
- A heavy new npm library gets its own `manualChunks` entry (`app/ui/vite.config.js:11-21`).
- Dependency refreshes are separate `dependabot-YYYYMMDD` work (`docs/rules/RULE_GIT.md` §3), never mixed into feature work.

---

## 11. Testing

| Layer | Framework | Examples | Run |
|---|---|---|---|
| Go | stdlib `testing`, table-driven with `t.Run`; `testify/assert` allowed | `TestParseName` `app/handlers_import_test.go:7-146` (`t.Run` at `:138`), `internal/nighttime/nighttime_test.go:8` | `make test` = `go fmt ./...` + `go test -v ./... -coverpkg=./...` (`Makefile:32-33`) |
| UI | Vitest + Testing Library + jsdom | `app/ui/src/components/Currency/helpers.test.jsx`, `app/ui/src/hooks/useSettings.test.jsx` | `npm run test:run` in `app/ui` (`app/ui/package.json:12`) |

- New pure logic (parsers, formatters, calculations) gets table-driven tests. There are no DB-backed Go tests (Not found in code) — keep logic in pure functions so it can be tested without a database.
- A bug fix in pure logic comes with a regression test.
- Never weaken, skip or delete an existing test to get a build green.
- CI: `make npm_install build_ui` → `go vet ./...` → `make test` → `make build_backend` (`.github/workflows/go.yml:22-31`).

---

## 12. Documentation Obligations

- Every user-visible change: a bullet under `## [Unreleased]` in `CHANGELOG.md` (`CHANGELOG.md:3`) **and** the identical bullet in the changelog copy in `README.md` (`README.md:64-66`). Prefixes: `- New:`, `- Update:`, `- Fix:` (`CHANGELOG.md:11-17`). Example: `ec1c966` adds one line to each file.
- Behaviour, API or schema changes: update the matching `docs/architecture/ARCHITECTURE_<SYSTEM>.md` (API table, data model, rules section) and its entry in `docs/architecture/SUMMARIES.md`.
- Do not change `version` (`app/main.go:18`) or rename `[Unreleased]` to a version heading — that is the owner's `version ++` commit (`docs/rules/RULE_GIT.md` §4.1).

---

## 13. Known Deviations — Do Not Copy

| # | Deviation | Location | Status |
|---|---|---|---|
| 1 | `handleError` not followed by `return`; the handler keeps writing | `app/handlers_auth.go:206-213`, `app/handlers_auth.go:228-232` | Confirmed |
| 2 | `writeJSON` continues after `http.Error` when marshalling fails | `app/helpers.go:17-21` | Confirmed |
| 3 | `HandlerNightTime` logs an error and writes no response | `app/handlers_flightrecord.go:39-43` | Confirmed |
| 4 | `GetPersonById` returns `persons[0]` without a length check — panics for an unknown UUID | `internal/models/persons.go:39-43` | Confirmed |
| 5 | Unknown `{format}` path value → nil pointer dereference / nil function call (= ARCHITECTURE_PDF_EXPORT.md §11 #8) | `app/handlers_settings.go:124-132`, `app/handlers_export.go:109-166` | Confirmed |
| 6 | `AddCustomAirport` / `UpdateCustomAirport` / `RemoveCustomAirport` do not clear `distanceCache`; update/remove also leave `airportCache` stale. After an add, a distance computed from 0°N 0°E while the code was unknown stays cached (see ARCHITECTURE_AIRCRAFT_AIRPORTS.md §11 #5) | `internal/models/airports.go:143-184`, `internal/models/helpers.go:45-52` | Confirmed |
| 7 | `DeleteToken` does not evict the token cached by `VerifyToken`, which checks the cache first | `internal/models/auth.go:43-50`, `internal/models/auth.go:111-122` | Confirmed |
| 8 | `loginAttempts` is a plain map written by concurrent requests (= ARCHITECTURE_AUTH.md §11 #1) | `app/handlers_auth.go:29`, `app/handlers_auth.go:167-203` | Confirmed — no lock or `sync.Map`, and `net/http` serves each request on its own goroutine |
| 9 | DB upload swaps the connection without clearing package-level caches (canonical: ARCHITECTURE_APPLICATION.md §11 #2) | `app/handlers_db.go:36-58` | Confirmed — the handler only replaces `app.db` (`app/handlers_db.go:53-60`); `authCache` is cleared only in `UpdateSettings` (`internal/models/settings.go:65`) |
| 10 | Mutation responses mix `writeOkResponse` and bare strings | §3 | Confirmed |
| 11 | `useErrorNotification` called with wrong prop names, so logbook load errors never show on the Currency page | `app/ui/src/components/Currency/Currency.jsx:14` | Confirmed |
| 12 | Test imports non-exported `defaultFieldNames` and does not await `waitFor` | `app/ui/src/hooks/useSettings.test.jsx:3`, `app/ui/src/hooks/useSettings.test.jsx:92-94` | Suspected — assertions likely never enforced |
| 13 | `/api/logout` registered twice (= ARCHITECTURE_APPLICATION.md §11 #8) | `app/routes.go:30`, `app/routes.go:157` | Confirmed |

---

## Critical Do / Don't

- DO call `app.handleError(w, err)` and `return` immediately; never write to `w` after it.
- DO keep SQL inside `DBModel` methods with `ContextWithDefaultTimeout()` and `?` placeholders; SQL in `internal/models` must run unchanged on SQLite and MySQL.
- DO change the schema only in `internal/driver/db_structure.go`, bump `schemaVersion`, and update views for both engines.
- DON'T expect `validateDB` to change types, rename or drop columns — write an explicit migration like `internal/driver/data_overhaul.go`.
- DO store dates as `YYYY-MM-DD` and durations as integer minutes; format only at the edges (UI, PDF, import).
- DO add settings as snake_case fields of `models.Settings` with a safe zero value or a default in `CheckDefaultValues`; preserve page-specific fields in `HandlerApiSettingsUpdate`.
- DO evict or clear the matching `sync.Map` cache in every write path that changes cached data.
- DO register endpoints inside the authenticated `/api` group in `app/routes.go`, add `Compress(5)` to large GETs, and answer mutations with `writeOkResponse`.
- DO invalidate every affected TanStack Query key after a mutation, including derived data (aircrafts, currency after flight writes).
- DO put shared queries in `app/ui/src/hooks/queries/use<Entity>Query.js` and HTTP calls in `app/ui/src/util/http/<domain>.jsx` with the Bearer token.
- DON'T add cgo dependencies, an ORM, TypeScript files or CSS files.
- DO add table-driven Go tests or Vitest tests for new pure logic; never weaken existing tests.
- DO add a `- New:` / `- Update:` / `- Fix:` bullet under `[Unreleased]` in both `CHANGELOG.md` and `README.md`; never bump the version.
- DON'T commit, branch or push — only the main session stages, with explicit paths, and proposes a branch name and commit message; subagents never run `git add` (`docs/rules/RULE_GIT.md`).
