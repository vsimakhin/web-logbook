# HOWTO: Development

> For the owner and for Claude Code agents working on web-logbook (Go backend + React SPA, single binary).
> Read `docs/rules/RULE_DEVELOPMENT.md` and `docs/rules/RULE_CODE_STYLE.md` before writing code, and the
> `docs/architecture/ARCHITECTURE_<SYSTEM>.md` of every system you touch (`docs/architecture/SUMMARIES.md` routes you there).
> Releases and dependency bumps: `docs/guides/HOWTO_RELEASE.md`.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [First Build](#2-first-build)
3. [Dev Loop](#3-dev-loop)
4. [Running Tests](#4-running-tests)
5. [Lint and Format](#5-lint-and-format)
6. [CI Parity Sequence](#6-ci-parity-sequence)
7. [Runtime Files and First Start](#7-runtime-files-and-first-start)
8. [CLI Flags](#8-cli-flags)
9. [Adding a Feature End to End](#9-adding-a-feature-end-to-end)
10. [How This Connects to the Workflow Commands](#10-how-this-connects-to-the-workflow-commands)

---

## 1. Prerequisites

| Tool | Version | Source |
|---|---|---|
| Go | 1.26.9 | `go.mod:3`; CI uses the same (`.github/workflows/go.yml:19`, `.github/workflows/release.yml:17`) |
| Node.js | v22.19.0 | `app/ui/.nvmrc:1` (with nvm: `cd app/ui && nvm use`). CI does not set up Node at all (no setup-node step in `.github/workflows/go.yml`), so the runner's default Node is used there. |
| npm | ships with Node | used by `npm_install` / `build_ui` (`Makefile:20-29`) |
| make | any | `Makefile` |
| tar, zip | any | only for `make build_all` (archives in `Makefile:55`, `Makefile:97`) |
| Docker | optional | image builds, see `docs/guides/HOWTO_RELEASE.md` |

No CGO is needed: the default SQLite driver is pure Go (`modernc.org/sqlite`, `go.mod:15`) and the cross-builds set `CGO_ENABLED=0` (`Makefile:53`).

---

## 2. First Build

The UI is compiled into the binary with `//go:embed ui/dist/*` (`app/handlers_aux.go:12`). **`app/ui/dist` must exist before anything compiles package `main` (`./app`)**: `go build`, `go vet ./...`, `go test ./...`, `make test`, `make build_backend`. Without it the compiler stops with `pattern ui/dist/*: no matching files found`. `app/ui/dist` is not in git (fresh checkout has none).

```sh
make build_ui        # npm install + npm run build -> app/ui/dist  (Makefile:20-29)
make build_backend   # go build -o dist/web-logbook ./app            (Makefile:36-39)
```

What these do:

- `build_ui` depends on `npm_install`, so every `make build_ui` runs `npm install` in `app/ui` first (`Makefile:20-29`).
- `npm run build` is `npm run test:run && vite build` (`app/ui/package.json:8`): **the UI unit tests run on every UI build**, and a failing vitest test fails `make build_ui` (and therefore CI).
- `build_backend` depends on `clean`, which deletes the root `dist/*` and runs `go clean` (`Makefile:11-15`, `Makefile:36`). The root `dist/` (binaries) and `app/ui/dist` (UI bundle) are different directories.
- `make start` = `build_ui` + `build_backend` + run (`Makefile:42-44`).

Packages that do not import `./app` (for example `internal/nighttime`) compile and test without `app/ui/dist`.

---

## 3. Dev Loop

Two processes: the Go backend on port 4000 and the Vite dev server with hot reload for the UI.

```sh
# once, so ./app compiles (embed)
make build_ui

# terminal 1 — backend (rebuilds the binary, runs ./dist/web-logbook -port=4000 -env="dev")
make start_backend

# terminal 2 — UI with hot reload
cd app/ui && npm run dev
```

- `make start_backend` = `clean` + `build_backend` + `./dist/web-logbook -port=${PORT} -env="${ENV}"` with `PORT=4000`, `ENV=dev` (`Makefile:1-2`, `Makefile:46-48`). There is no file watcher for Go: after a backend change stop it (Ctrl+C) and run `make start_backend` again.
- `-env=dev` only adds chi's request logger (`app/routes.go:12-14`); it changes nothing else (`app.config.env` is read only there).
- In Vite development mode the UI calls `http://localhost:4000/api` instead of the relative `/api` (`API_URL` in `app/ui/src/constants/constants.jsx:9-12`). **The backend must listen on port 4000 for `npm run dev` to work**; `make start_backend PORT=…` with another port breaks the dev UI.
- CORS allows any origin with credentials for all environments (`cors.Handler` in `app/routes.go:16-22`), so the Vite origin can call the API without extra setup.
- Open the URL that `npm run dev` prints (no port is configured in `app/ui/vite.config.js:25-27`, so Vite's default applies). `http://localhost:4000` serves the **embedded** UI from the last `make build_ui`, not your live code.
- Client-side routes need no backend change: `HandlerUI` rewrites every path that is not `/`, an `assets` path or `favicon.ico` to `/` (`app/handlers_aux.go:15-30`), mounted as the catch-all `r.Handle("/*", …)` (`app/routes.go:165`).
- Authentication: if sign-in is enabled in the DB and you are locked out, see `-disable-authentication` in §8.

---

## 4. Running Tests

Existing tests: Go — `app/handlers_import_test.go`, `internal/nighttime/nighttime_test.go`; UI — `app/ui/src/hooks/useAppNotifications.test.jsx`, `app/ui/src/hooks/useSettings.test.jsx`, `app/ui/src/hooks/useCustomFields.test.jsx`, `app/ui/src/hooks/useLocalStorageState/useStorageState.test.tsx`, `app/ui/src/components/Currency/helpers.test.jsx`.

### Go

| Goal | Command | Needs `app/ui/dist` |
|---|---|---|
| Everything, as CI | `make test` — runs `go fmt ./...` first, then `go test -v ./... -coverpkg=./...` (`Makefile:17-18`, `Makefile:32-33`) | yes |
| One package | `go test ./internal/nighttime/` | no |
| The `main` package | `go test ./app/` | yes |
| One test | `go test ./app/ -run TestParseName -v` (`TestParseName` in `app/handlers_import_test.go:7`) | yes |
| One test | `go test ./internal/nighttime/ -run TestKnownNightTime -v` (`TestKnownNightTime` in `internal/nighttime/nighttime_test.go:11`) | no |

`make test` **rewrites files** through `go fmt` (`Makefile:32` depends on `fmt`). Run it before staging, or review the formatting diff it produced.

Tests use the standard `testing` package with table-driven cases (`app/handlers_import_test.go:7-12`) and `github.com/stretchr/testify/assert` (`internal/nighttime/nighttime_test.go:8`, `go.mod:13`).

### UI (vitest)

Run from `app/ui` (node modules come from `make npm_install` or `make build_ui`):

| Goal | Command |
|---|---|
| All tests once | `npm run test:run` (`vitest run`, `app/ui/package.json:12`) |
| Watch mode | `npm test` (`vitest`, `app/ui/package.json:11`) |
| One file | `npx vitest run src/hooks/useSettings.test.jsx` |

Vitest runs in `jsdom` with globals and the setup file `app/ui/src/setupTests.js` (which loads `@testing-library/jest-dom`) — `app/ui/vite.config.js:28-32`, `app/ui/src/setupTests.js:1`. Test files sit next to the code they test as `*.test.jsx`.

---

## 5. Lint and Format

| Check | Command | In CI? |
|---|---|---|
| Go vet | `go vet ./...` (needs `app/ui/dist`) | yes, `.github/workflows/go.yml:24-25` |
| Go format (list only) | `gofmt -l app internal` | no — CI runs `make test`, whose `go fmt` rewrites instead of failing |
| Go format (rewrite) | `make fmt` (`Makefile:17-18`) | — |
| ESLint | `cd app/ui && npm run lint` (`eslint .`, `app/ui/package.json:9`) | **no** — `.github/workflows/go.yml` has no lint step; run it locally |

ESLint covers `**/*.{js,jsx}` and ignores `dist` (`app/ui/eslint.config.js:8-10`); `.tsx` files are not linted.

---

## 6. CI Parity Sequence

CI runs on push and PR to `main` (`.github/workflows/go.yml:3-7`) and executes exactly these steps (`.github/workflows/go.yml:21-31`):

```sh
make npm_install build_ui
go vet ./...
make test
make build_backend
```

Before handing work over, run the same four commands plus the two checks CI skips, in this order:

```sh
gofmt -l app internal       # must print nothing; run it BEFORE make test, which rewrites files (go fmt ./...)
make npm_install build_ui
go vet ./...
make test
make build_backend
cd app/ui && npm run lint
```

`gofmt -l` after `make test` always prints nothing, because `make test` has already reformatted the files (`Makefile:17-18`, `Makefile:32`); it would hide a formatting miss instead of reporting it.

---

## 7. Runtime Files and First Start

All paths are relative to the working directory of the process (the repo root for `make start_backend`).

| File | Created by | Notes |
|---|---|---|
| `web-logbook.sql` | `-dsn` default (`app/main.go:86`); tables created by `OpenDB` → `validateDB` (`internal/driver/driver.go:23-40`, `internal/driver/driver.go:43-94`) | SQLite database. Git-ignored (`.gitignore:16`). Point `-dsn` at a copy to experiment without touching your real logbook. |
| `weblogbook-output.log` | `setupLogger` (`app/main.go:97-109`) | Opened with `O_TRUNC` (`app/main.go:98`): **emptied on every start**. Copy it before restarting if you need the previous run. Also written to stdout. Git-ignored (`.gitignore:18`). |
| `certs/localhost.pem`, `certs/localhost-key.pem` | you | Only with `-enable-https` (`app/main.go:89-91`). Git-ignored (`.gitignore:19`). |

Startup order in `main` (`app/main.go:119-215`): flags → logger → DB open/validate → `CheckDefaultValues` → airport DB check → settings → background distance cache → distance backfill → `serve`.

**First start needs network.** When the `airports` table is empty, `main` downloads the airport database (`app/main.go:170-191`) from `https://github.com/vsimakhin/Airports/raw/master/airports.json` (`downloadAirportDB`, `app/handlers_airport.go:72-100`, timeout 300 s at `app/handlers_airport.go:77`). If the download fails, `main` logs the error and **returns without starting the server** (`app/main.go:179-182`). A fresh DB offline therefore never serves; reuse an existing DB file that already has airports.

Schema upgrades run on open: tables, columns and indexes are added and views recreated only when the stored schema version differs from `schemaVersion` (`internal/driver/driver.go:56`, `internal/driver/db_structure.go:4`). Opening an old DB with a new build changes it — use a copy.

---

## 8. CLI Flags

Defined in `parseFlags` (`app/main.go:77-95`); the same list is in `README.md:132-155` (keep both in sync when adding a flag).

| Flag | Default | Effect |
|---|---|---|
| `-url` | `""` | Listen address; empty = all interfaces (`app/main.go:82`) |
| `-port` | `4000` | Server port (`app/main.go:83`) |
| `-env` | `prod` | `dev` adds the request logger (`app/main.go:84`, `app/routes.go:12-14`) |
| `-engine` | `sqlite` | `sqlite` or `mysql` (`app/main.go:85`) |
| `-dsn` | `web-logbook.sql` | SQLite file path or MySQL DSN `user:password@protocol(address)/dbname?param=value` (`app/main.go:86`; example in `README.md:312-315`) |
| `-version` | `false` | Prints the version and exits (`app/main.go:87`, `app/main.go:124-127`) |
| `-disable-authentication` | `false` | Turns sign-in off in the DB (`DisableAuthorization`) and **exits** without serving (`app/main.go:88`, `app/main.go:153-161`) |
| `-enable-https` | `false` | Serve TLS (`app/main.go:89`, `app/main.go:66-68`) |
| `-key` | `certs/localhost-key.pem` | TLS private key (`app/main.go:90`) |
| `-cert` | `certs/localhost.pem` | TLS certificate (`app/main.go:91`) |

To run against MySQL locally: `./dist/web-logbook -env dev -engine mysql -dsn "user:pwd@tcp(127.0.0.1)/web-logbook"` after `make build_backend`.

---

## 9. Adding a Feature End to End

The generic order of work. Exact rules and conventions are in `docs/rules/RULE_DEVELOPMENT.md` and `docs/rules/RULE_CODE_STYLE.md`; system-specific recipes are in §12 "Rules for Future Development" of each `docs/architecture/ARCHITECTURE_<SYSTEM>.md` (database: `docs/architecture/ARCHITECTURE_DATABASE.md`, UI patterns: `docs/architecture/ARCHITECTURE_FRONTEND.md`). The persons feature is used as the worked reference because it spans every layer.

| # | Layer | What to do | Reference in code |
|---|---|---|---|
| 1 | Plan | `/cmd-task` → `docs/tasks/TASK_<NAME>.md`; read the affected architecture docs | `docs/tasks/_TEMPLATE.md` |
| 2 | Schema (only if data is persisted) | Add the column/table with a `ColumnType` that has both a SQLite and a MySQL type; register a new table in the `tables` list of `validateDB`, a new view in `views`; **bump `schemaVersion`**, otherwise `validateDB` never applies the change. Type changes of existing columns need an explicit migration. | `internal/driver/db_structure.go:4-14`, `personsTable` at `internal/driver/db_structure.go:147-155`, `internal/driver/driver.go:60-64`, `internal/driver/driver.go:73`, `internal/driver/data_overhaul.go:428` |
| 3 | Model | Struct with `json` tags in `internal/models/structs.go`; `DBModel` methods in `internal/models/<domain>.go`, each with `ContextWithDefaultTimeout` and `?` placeholders | `Person` at `internal/models/structs.go:103-111`; `GetPersons` `internal/models/persons.go:34`, `AddPerson` `internal/models/persons.go:69-92`; `ContextWithDefaultTimeout` `internal/models/helpers.go:22` |
| 4 | Handler | Method on `*application` in `app/handlers_<domain>.go`; respond with `writeJSON` / `writeOkResponse`, errors through `handleError` | `HandlerApiPersonList` `app/handlers_person.go:14-22`, `HandlerApiPersonNew` `app/handlers_person.go:36-58`; helpers `app/helpers.go:16`, `app/helpers.go:45`, `app/helpers.go:53` |
| 5 | Route | Register inside the authenticated `/api` group (`r.Use(app.Auth)`); wrap large GET payloads in `middleware.Compress(5)` | `app/routes.go:26-27`, persons block `app/routes.go:105-117` |
| 6 | UI HTTP | Fetch function in `app/ui/src/util/http/<domain>.jsx` using `handleFetch`, `API_URL` and the bearer token | `fetchPersons` `app/ui/src/util/http/person.jsx:5-13`; `handleFetch` `app/ui/src/util/http/http.jsx:13`; barrel `app/ui/src/util/http/index.js:1-3` (exports only logbook, licensing, aircraft) |
| 7 | Query hook | `queryOptions` + `useQuery` hook in `app/ui/src/hooks/queries/`, exported from `app/ui/src/hooks/queries/index.js`; writes via `useMutation` + `queryClient.invalidateQueries` on the same `queryKey` | `useAircraftsQuery` `app/ui/src/hooks/queries/useAircraftsQuery.js:4-18`, `app/ui/src/hooks/queries/index.js:1-6`; mutation `app/ui/src/components/Persons/SavePersonButton.jsx:22-25` (older components such as `app/ui/src/components/Persons/Persons.jsx:20-21` call `useQuery` inline) |
| 8 | Page / component | Components in `app/ui/src/components/<Domain>/`, page in `app/ui/src/pages/<Name>Page.jsx`, route in the router, menu entry in the navbar | router `app/ui/src/main.jsx:35`, persons routes `app/ui/src/main.jsx:63-65`; navbar entry `app/ui/src/components/UIElements/Dashboard/DashboardNavbar.jsx:47` |
| 9 | Tests | Go table test next to the code (`*_test.go`); vitest `*.test.jsx` next to the hook/helper | `app/handlers_import_test.go:7`, `app/ui/src/hooks/useSettings.test.jsx` |
| 10 | Changelog | Bullet under `## [Unreleased]` in `CHANGELOG.md` **and the identical bullet** in the changelog copy in `README.md`; prefix `- New:`, `- Update:` or `- Fix:`. Create the `[Unreleased]` heading if the last release removed it. New flags or pages may also need the README usage/interface sections. | `CHANGELOG.md:3-5`, `README.md:64-68`, `README.md:132-155`, `README.md:169` |
| 11 | Architecture docs | Update the affected `docs/architecture/ARCHITECTURE_<SYSTEM>.md` (endpoints, tables, files, gotchas) and its entry in `docs/architecture/SUMMARIES.md` if keywords changed | — |
| 12 | Verify | §6 CI parity sequence, then a manual check in the dev loop (§3) on a copy of a real DB | — |

Cross-checks that are easy to miss:

- Both DB engines: every new column type, query and view must work on SQLite **and** MySQL (`ColumnType` pairs, `internal/driver/db_structure.go:6-14`).
- Data that flows into the logbook view also reaches stats, map and PDF export — check `docs/architecture/ARCHITECTURE_STATS_AND_MAP.md` and `docs/architecture/ARCHITECTURE_PDF_EXPORT.md`.
- New fields that users may import/export: `docs/architecture/ARCHITECTURE_IMPORT.md`.
- The REST API is used by external scripts (`README.md:317-319`): do not rename or remove existing endpoints or JSON fields without saying so in the changelog.

Agents never commit. Subagents never stage either; the orchestrator (main session) stages the task's files with explicit paths. The owner commits, opens the PR and merges (the `deny` list in `.claude/settings.json` blocks `git commit`, `git push`, `git checkout`, `git tag` and more). Branch and commit conventions: `docs/rules/RULE_GIT.md`.

---

## 10. How This Connects to the Workflow Commands

| Step | Command | Output |
|---|---|---|
| Explore an idea | `/cmd-plan <task description>` | chat only |
| Write the task | `/cmd-task <task description>` | `docs/tasks/TASK_<NAME>.md` from `docs/tasks/_TEMPLATE.md`, after your confirmation |
| Report a bug | `/cmd-issue <bug description>` | `docs/issues/ISSUE_<NAME>.md` from `docs/issues/_TEMPLATE.md`, after your confirmation |
| Build it | `/cmd-implement docs/tasks/TASK_<NAME>.md` | Fills the task file's living sections (§11 Decisions → §12 Spec → §13 Work Packages → §14 Acceptance → §15 Result → §16 START HERE), un-commenting them from the template. After the spec gate, `implementer` agents build their packages (§9 rows 2–9, no `make` targets); the orchestrator runs the §6 CI parity sequence and the smoke run; `reviewer` agents review the spec and the diff read-only; `doc-writer` does rows 10–11; the orchestrator stages |
| Fix a reported bug | `/cmd-task "Fix docs/issues/ISSUE_<NAME>.md"` → `/cmd-implement docs/tasks/TASK_<NAME>.md` → `/cmd-review docs/issues/ISSUE_<NAME>.md` | the fix task file (linking the issue in its §1), the code, then a review of the fix against the issue |
| Independent review | `/cmd-review [task or issue file]` | findings in chat |
| Ask about the code | `/cmd-question <question>` | answer with `file:line` |
| Look back | `/cmd-retro [task file path]` | proposed doc fixes |

Orchestration details: `.claude/prompts/orchestration.md`. Closing a task or issue: set `status: done` and move the file to `docs/tasks/_old/` or `docs/issues/_old/` (an issue is closed together with its fix task).
