# Contracts — Agent Workflow Setup

The task file (`docs/tasks/_old/TASK_AGENT_WORKFLOW_SETUP.md`) is the "what and why"; this file fixes the names, the files and who owns what, so parallel agents never collide. If a contract here is wrong, say so in your report. Do not silently change it.

---

## 1. Ground rules for every agent

1. **Read first:** this file, then `docs/tasks/_old/TASK_AGENT_WORKFLOW_SETUP.md`.
2. **Write only the files your package owns** (§3). Never modify any pre-existing repository file (`app/**`, `internal/**`, `README.md`, `CHANGELOG.md`, `Makefile`, `.github/**`, …). If you need a change outside your files, put it in your report as a request.
3. **Git:** read-only commands only (`git log`, `git show`, `git diff`, `git blame`, `git status`). Never `git add`, never commit — the orchestrator stages.
4. **Do not build or install.** Go is not installed on this machine and `app/ui/node_modules` may be absent; do not run `make`, `go`, `npm install`. Everything is derived by reading code and git history.
5. **Language:** all written content in English. Markdown.
6. **Evidence:** every factual claim about the code carries a reference in inline code: repo-relative path, optionally with a line or range — `app/main.go:18`, `internal/driver/driver.go:40-72`, `app/ui/src/main.jsx`. No leading `./`. Line numbers must be real: open the file and check before writing. Prefer function names next to the reference (`HandlerLogin` in `app/handlers_auth.go:164`) so the reference survives small edits.
7. **Anti-hallucination rules:**
   - **Rule A** — commented-out code is not active behaviour.
   - **Rule B** — attribute behaviour only to the exact function/component that implements it.
   - **Rule C** — no fabricated issues: list only problems actually visible in code; label each `Confirmed` (with reasoning) or `Suspected` (with the evidence that would confirm it).
   - **Rule D** — group functions by their owning file/type.
   - If something cannot be found, write **"Not found in code"** — never guess.
8. **No game/Unity vocabulary.** This workflow is ported from a Unity game project; nothing about Unity, scenes, prefabs, Play Mode, players, battles, game design, C#, UniTask, Blender, assets pipelines may leak in. The product is a pilot's electronic logbook (Go backend + React SPA).
9. **Report** via the structured output requested in your prompt: files written, issues found, cross-package requests, anything unverified.

---

## 2. Project facts every agent can rely on

- Go module `github.com/vsimakhin/web-logbook`, Go 1.26.9. `app/` is `package main` (HTTP layer, chi router). `internal/{driver,models,pdfexport,nighttime,utils}`.
- React 19 + Vite + MUI SPA in `app/ui/`, embedded into the binary via `//go:embed ui/dist/*` (`app/handlers_aux.go`). `go build`, `go vet ./...` and `make test` need `make build_ui` first (`app/ui/dist` must exist).
- DB: SQLite (`modernc.org/sqlite`, default) or MySQL. Declarative schema in `internal/driver/db_structure.go` (`schemaVersion`), per-engine DDL pairs; `validateDB` in `internal/driver/driver.go` only adds tables/columns/indexes and recreates views; type changes need an explicit migration like `internal/driver/data_overhaul.go`.
- CI (`.github/workflows/go.yml`): `make npm_install build_ui` → `go vet ./...` → `make test` → `make build_backend`. Release (`.github/workflows/release.yml`): `make build_all` + Docker buildx on GitHub release.
- Version bump ("version ++" commits): `app/main.go` `version` const + `CHANGELOG.md` + the copy of the changelog section in `README.md`. Changelog bullets: `- New:`, `- Update:`, `- Fix:`.
- Branches: `feature/<kebab>`, `fix/<kebab>`, `dependabot-YYYYMMDD` (manual dependency bumps). PRs squash-merged as `Title (#NNN)`.
- Owner decisions for this workflow: everything is committed to the repo; agents are **stage-only** (owner commits); Claude only (no AGENTS.md / Codex); no product-spec layer; all agent roles run on **Opus**.

---

## 3. File layout and ownership

All paths are new files. Directories are lowercase (repo idiom); doc file names are UPPER_SNAKE.

| Path | Owner |
|---|---|
| `CLAUDE.md` | orchestrator |
| `.claude/settings.json` | orchestrator |
| `.claude/agents/researcher.md`, `implementer.md`, `reviewer.md`, `doc-writer.md` | W2 |
| `.claude/commands/cmd-plan.md`, `cmd-task.md`, `cmd-issue.md`, `cmd-question.md`, `cmd-retro.md`, `cmd-modes.md` | W1 |
| `.claude/commands/cmd-implement.md`, `cmd-review.md`, `cmd-architecture.md`, `cmd-architecture-sync.md` | W2 |
| `.claude/prompts/research.md`, `planning.md` | W1 |
| `.claude/prompts/orchestration.md` | W2 |
| `docs/INDEX.md` | orchestrator |
| `docs/rules/RULE_GIT.md`, `RULE_CODE_STYLE.md`, `RULE_DEVELOPMENT.md` | W3 |
| `docs/guides/HOWTO_DEVELOPMENT.md`, `HOWTO_RELEASE.md` | W4 |
| `docs/tasks/_TEMPLATE.md`, `docs/issues/_TEMPLATE.md` | W4 |
| `docs/architecture/SUMMARIES.md` | orchestrator |
| `docs/architecture/ARCHITECTURE_<SYSTEM>.md` | A-<SYSTEM> (one agent each, §5) |
| `docs/tasks/_old/TASK_AGENT_WORKFLOW_SETUP.md`, this file | orchestrator |

Other docs may link to any file in this table by its exact path even before it exists.

---

## 4. Workflow surface (names are binding)

### 4.1 Commands (`.claude/commands/<name>.md`, invoked as `/<name>`)

Every command file starts with YAML frontmatter: `description` (one line, shown in `/help`) and `argument-hint`. Body opens with `You are in **<Mode> Mode**` and uses `$ARGUMENTS`.

| Command | argument-hint | Writes | User gate before writing | Delegates to |
|---|---|---|---|---|
| `/cmd-plan` | `<task description>` | nothing (chat) | — | `prompts/planning.md` → `researcher` agent |
| `/cmd-task` | `<task description>` | `docs/tasks/TASK_<NAME>.md` | yes | `planning.md`, `docs/tasks/_TEMPLATE.md` |
| `/cmd-issue` | `<bug description>` | `docs/issues/ISSUE_<NAME>.md` | yes | `planning.md` + bug trace, `docs/issues/_TEMPLATE.md` |
| `/cmd-question` | `<question>` | nothing | — | docs first, then code; `researcher` for broad questions |
| `/cmd-retro` | `[task file path]` | nothing (proposes doc fixes, applies only after confirmation) | — | — |
| `/cmd-modes` | — | nothing | — | lists commands + `docs/architecture/ARCHITECTURE_*.md` |
| `/cmd-implement` | `<path to docs/tasks/TASK_*.md>` | code + task-file sections | yes (spec gate) | `prompts/orchestration.md`; `implementer`, `reviewer`, `doc-writer` |
| `/cmd-review` | `[docs/tasks/TASK_*.md or docs/issues/ISSUE_*.md]` | nothing (offers fixes / ISSUE files / task closure) | — | `reviewer` agent(s), main session consolidates |
| `/cmd-architecture` | `<system name>` | `docs/architecture/ARCHITECTURE_<SYSTEM>.md` + SUMMARIES + INDEX rows | yes | §5 template |
| `/cmd-architecture-sync` | `<days>` | updates existing architecture docs | no | ≤ 8 parallel `doc-writer` agents; main session updates SUMMARIES/INDEX |

### 4.2 Subagents (`.claude/agents/<name>.md`, all `model: opus`)

| Agent | Tools | Role |
|---|---|---|
| `researcher` | read-only (`disallowedTools: Edit, Write, NotebookEdit`) | Produces a Research Brief (≤ 300 lines, format of `.claude/prompts/research.md`) |
| `implementer` | all | Implements one work package; touches only files the package owns; never stages/commits; reports files touched / API added / cross-package requests / unverified |
| `reviewer` | read-only (`disallowedTools: Edit, Write, NotebookEdit`), may run tests/vet | Independent review of a spec or a diff; findings `BLOCKER/MAJOR/MINOR/SUGGESTION`, each `Confirmed`/`Suspected` with `file:line` |
| `doc-writer` | all | Updates architecture docs, SUMMARIES, INDEX, CHANGELOG `[Unreleased]` + its copy in README; never touches code |

### 4.3 Task / issue files

- Status vocabulary (frontmatter `status:`): `open | in_progress | review | done`. Nothing else.
- Closing: move to `docs/tasks/_old/` or `docs/issues/_old/`, set `status: done`.
- Large tasks grow the "living task file" sections in this order: Decisions → Spec (contracts) → Work Packages → Acceptance → Result (per stage) → START HERE. Multi-package work gets `docs/tasks/refs/<task_snake>/CONTRACTS.md`.

---

## 5. Architecture documents

### 5.1 Systems and source scope (A-agents)

Each A-agent reads its scope **fully** and may read anything else to describe integration points. Cross-link other systems by these exact file names.

| Doc | Scope |
|---|---|
| `ARCHITECTURE_APPLICATION.md` | `app/main.go`, `app/routes.go`, `app/helpers.go`, `app/handlers_aux.go`, `app/handlers_db.go`; startup sequence, flags, loggers, routing/middleware, response helpers, SPA serving, DB download/upload |
| `ARCHITECTURE_DATABASE.md` | `internal/driver/*`, `internal/models/helpers.go`, `internal/models/structs.go` (overview of structs); schema versioning, dual engine, validateDB, data overhaul migration, views, timeouts |
| `ARCHITECTURE_AUTH.md` | `app/handlers_auth.go`, `internal/models/auth.go`, auth middleware in routes, `-disable-authentication`; UI sign-in/logout pages, token storage and injection in `app/ui/src/util/http` |
| `ARCHITECTURE_SETTINGS.md` | `app/handlers_settings.go`, `internal/models/settings.go`, `internal/models/models_defaults.go`; UI `components/Settings`, `SettingsPage.jsx`, `useSettings`; time/date display formats |
| `ARCHITECTURE_LOGBOOK.md` | `app/handlers_flightrecord.go`, `app/handlers_logbook.go`, `app/handlers_custom_fields.go`, `internal/models/flightrecords.go`, `internal/models/custom_fields.go`, `internal/nighttime/*`; UI `components/Logbook`, `components/FlightRecord`, `LogbookPage.jsx`, `FlightRecordPage.jsx` |
| `ARCHITECTURE_STATS_AND_MAP.md` | UI `components/Stats`, `components/Map`, `components/FlightMap`, `Stats*Page.jsx`, `MapPage.jsx`, plus the backend endpoints/queries that feed them |
| `ARCHITECTURE_PERSONS.md` | `app/handlers_person.go`, `internal/models/persons.go`; UI `components/Persons`, `PersonsPage.jsx`, `PersonViewPage.jsx` |
| `ARCHITECTURE_AIRCRAFT_AIRPORTS.md` | `app/handlers_aircraft.go`, `app/handlers_airport.go`, `internal/models/aircrafts.go`, `internal/models/airports.go`, `internal/utils/distance.go`, airport DB download, distance cache; UI `components/Aircrafts`, `components/Airports`, related pages |
| `ARCHITECTURE_CURRENCY_LICENSING.md` | `app/handlers_currency.go`, `app/handlers_licensing.go`, `app/handlers_attachments.go`, `internal/models/currency.go`, `internal/models/licensing.go`, `internal/models/attachments.go`; UI `components/Currency`, `Licensing`, `LicenseRecord`, `Attachments`, `FlightRecordAttachment`, related pages |
| `ARCHITECTURE_PDF_EXPORT.md` | `internal/pdfexport/*`, `app/handlers_export.go`, `internal/models/export.go`; UI `components/PdfExport`, `PdfExportA4Page.jsx`, `PdfExportA5Page.jsx`, any CSV/XLS export in UI |
| `ARCHITECTURE_IMPORT.md` | `app/handlers_import.go`, `app/handlers_import_test.go`; UI `components/Import`, `ImportPage.jsx` |
| `ARCHITECTURE_FRONTEND.md` | `app/ui/src/main.jsx`, `App.jsx`, `pages/Root.jsx`, `hooks/` (query-hook pattern), `util/http`, `constants/`, `context/`, `theme/`, `components/UIElements`, `app/ui/vite.config.js`, `app/ui/eslint.config.js`, `app/ui/package.json`; embed + dev mode (`npm run dev` against `:4000`) |

### 5.2 Template (binding — every heading present, in this order)

```markdown
# <System Name> — Architecture

**Last Updated:** 2026-10-14 — initial version generated from code (TASK_AGENT_WORKFLOW_SETUP)

## Table of Contents

## 1. Overview
<!-- What it is, what problem it solves for the pilot/user, where it lives. 1–2 paragraphs. -->

## 2. Key Concepts
<!-- Domain terms and invariants (e.g. time stored as integer minutes). -->

## 3. How It Works
<!-- User-level flow, step by step; a state/flow table where useful. -->

## 4. Components & Files
### 4.1 File Index
<!-- | File | Responsibility | -->
### 4.2 API Endpoints
<!-- | Method | Path | Handler | Notes | -->
### 4.3 Data Access
<!-- DBModel methods grouped by file: name, purpose, tables touched. -->
### 4.4 UI
<!-- Pages, key components, query hooks. -->

## 5. Data Model & Persistence
<!-- Tables/columns/views/JSON blobs touched, both engines where they differ; what persists vs in-memory caches. -->

## 6. Data Flow
<!-- UI → API → model → DB and back, for the main operations. -->

## 7. Config & Constants
<!-- Real values with file:line; mark (configurable) vs (hardcoded). -->

## 8. Error Handling & Edge Cases

## 9. Integration Points
<!-- Links to other ARCHITECTURE_*.md with what crosses the boundary. -->

## 10. Testing
<!-- Existing tests, how to run them, gaps. -->

## 11. Known Issues & Tech Debt
<!-- | # | Issue | Location | Status (Confirmed/Suspected) | Severity | verified: 2026-10-14 | -->

## 12. Rules for Future Development
<!-- MANDATORY, never empty: concrete modification recipes for this system (e.g. "add a column", "add an endpoint", "add a settings field") with the exact files to touch and a cross-check list. -->

## 13. AI Notes
### Mental Model
### Gotchas
### File Quick Reference

> **AI Usage Instructions**
> - Always read this file before modifying this system
> - Do not refactor without impact analysis
> - Ask if information is missing
```

A section that genuinely does not apply keeps its heading with `Not applicable — <one-line reason>`.

### 5.3 SUMMARIES.md entry (returned by each A-agent, assembled by the orchestrator)

- `summary`: 3–6 sentences — what the system does, its key files, the one gotcha a planner must know.
- `keywords`: 5–15 routing terms (endpoint fragments, table names, component names, domain words).

---

## 6. Battle-group sources (W-agents only; read as reference, do not copy blindly)

`/Users/blackfxx/Projects/battle-group/`:
- `.claude/commands/cmd-*.md` (9 files), `.claude/prompts/planning.md`, `.claude/prompts/research.md`
- `Docs/Tasks/_TEMPLATE.md`, `Docs/Rules/RULE_GIT.md`, `Docs/Guides/HOWTO_DEVELOPMENT.md`
- `Docs/Tasks/Refs/military_props_destruction/CONTRACTS.md` (contracts pattern)
- `git -C /Users/blackfxx/Projects/battle-group show 372cdba7^:Docs/Rules/RULE_WORKFLOW_MODES.md` (one-page spec of all modes)

**Drop:** GameDesign layer and "Player-Facing Impact", Unity CLI/MCP, Play Mode, offline compile, vendor/asset/modeling rules, C#/UniTask specifics, `cmd-mdl-*`, `Docs/Analytics`, drag-racing leftovers ("RoundContext", "config_shop.json", "Cheat Commands", "LocalProfile/PlayerPrefs").
**Fix while porting:** command names inside text must match file names (`/cmd-plan`, not `/plan`); `architecture-sync` source paths are `app/`, `internal/`, `app/ui/src/`; one architecture template (§5.2); normalized statuses (§4.3); every command has frontmatter.
