# CLAUDE.md

Entry point for the AI agent. This file is auto-loaded into context — keep it concise.

---

## Project

**Web Logbook** — a self-hosted electronic pilot logbook (EASA-style logbook, PDF export, stats, map, currency, licensing).
Backend: Go 1.26 (`app/` = `package main`, chi router; `internal/{driver,models,pdfexport,nighttime,utils}`). DB: SQLite (default) or MySQL.
Frontend: React 19 + MUI + TanStack Query SPA in `app/ui/`, embedded into the binary via `//go:embed ui/dist/*` (`app/handlers_aux.go:12`).
Single maintainer; current version in `app/main.go:18`. Full agent documentation: [`docs/INDEX.md`](docs/INDEX.md).

---

## Startup Sequence

Read in this order before starting work:

1. **This file** — overview, critical rules, workflow
2. **`docs/INDEX.md`** — map of all agent docs
3. **`docs/rules/RULE_GIT.md`** — git restrictions (stage-only)
4. **`docs/rules/RULE_DEVELOPMENT.md`** + **`docs/rules/RULE_CODE_STYLE.md`** — *(read when writing code)*
5. **`docs/architecture/SUMMARIES.md`** → the **`ARCHITECTURE_<SYSTEM>.md`** of every system you touch
6. **`docs/guides/HOWTO_DEVELOPMENT.md`** — build/test/dev loop *(read when running anything)*; **`docs/guides/HOWTO_RELEASE.md`** for version or dependency bumps

---

## Documentation Map

```
docs/
├── INDEX.md                      # Master index
├── rules/                        # RULE_GIT, RULE_CODE_STYLE, RULE_DEVELOPMENT
├── architecture/
│   ├── SUMMARIES.md              # One paragraph per system — research routing table
│   └── ARCHITECTURE_*.md         # 12 per-system docs, generated from code
├── guides/                       # HOWTO_DEVELOPMENT, HOWTO_RELEASE
├── tasks/                        # TASK_*.md (/cmd-task), _TEMPLATE.md, refs/<task_snake>/, _old/
└── issues/                       # ISSUE_*.md (/cmd-issue), _TEMPLATE.md, _old/
```

---

## Communication Style (always active)

- **Be brief.** Report outcomes — what changed, what was found, what failed.
- Do not echo script bodies, raw tool output or data dumps; show final results only.
- Every claim about the code carries a `path:line` reference; if something is not in the code, say "Not found in code".

---

## Critical Rules (always active)

**Do:**
- Follow every `app.handleError(w, err)` with `return` — the helper does not stop the handler (`app/helpers.go:53`).
- Register every API route inside the authenticated `/api` group (`app.Auth`, `app/routes.go:26-27`); only `POST /api/login` is public. Wrap large GETs in `middleware.Compress(5)`; answer mutations with `writeOkResponse`.
- Keep SQL inside `DBModel` methods in `internal/models`, with `ContextWithDefaultTimeout()` and `?` placeholders — it must run unchanged on SQLite **and** MySQL.
- Change the schema only in `internal/driver/db_structure.go`: give every column/view both engine variants and **bump `schemaVersion`** (`internal/driver/db_structure.go:4`). `validateDB` only adds tables/columns/indexes and recreates views — type or format changes need an explicit migration like `internal/driver/data_overhaul.go`.
- Store dates as `YYYY-MM-DD` and durations as integer minutes; format only at the edges (UI, PDF, import).
- Add settings as snake_case fields of `models.Settings` (`settings2` JSON blob) with a safe zero value or a default; writers do read → modify → `UpdateSettings`.
- Clear/evict the matching `sync.Map` cache (`authCache`, `airportCache`, `distanceCache`) in every write path that changes cached data.
- UI: HTTP calls in `app/ui/src/util/http/<domain>.jsx`, shared queries in `app/ui/src/hooks/queries/`; after a mutation invalidate **every** dependent query key (the whole logbook is one `['logbook']` query that stats, currency and autocomplete derive from).
- Add a `- New:` / `- Update:` / `- Fix:` bullet under `## [Unreleased]` in **both** `CHANGELOG.md` and the changelog copy in `README.md` for every user-visible change. Never bump the version unless asked.
- Add table-driven Go tests or Vitest tests for new pure logic.

**Don't:**
- Add cgo dependencies (release builds are `CGO_ENABLED=0` for 7 targets), an ORM, TypeScript files or CSS files.
- Commit, branch, push, tag or release — agents are stage-only (`docs/rules/RULE_GIT.md`; most forbidden git commands are denied in `.claude/settings.json`, the rest bind by rule).
- Ship behaviour the owner did not ask for — list it and ask.

Full rules: `docs/rules/RULE_DEVELOPMENT.md` + `docs/rules/RULE_CODE_STYLE.md`.

---

## Build & Test

- **`make build_ui` first.** `go build`, `go vet ./...` and `make test` fail without `app/ui/dist` (embedded). `npm run build` runs Vitest first, so a failing UI test fails the UI build.
- CI parity: `make npm_install build_ui && go vet ./... && make test && make build_backend`. CI does not run `cd app/ui && npm run lint` or `gofmt -l app internal` — run both locally, `gofmt -l` before `make test` (which rewrites files).
- `make test` runs `go fmt ./...` (rewrites files) — never while implementer agents are working.
- Dev loop: `make start_backend` (port 4000 — the dev `API_URL` is hard-coded, `app/ui/src/constants/constants.jsx:9-12`) + `cd app/ui && npm run dev`.
- A fresh DB downloads the airport database at first start; without network the app exits.
- If Go or Node is unavailable, say which checks did not run (`unverified: <command>`) — never claim a pass.

Details: [`docs/guides/HOWTO_DEVELOPMENT.md`](docs/guides/HOWTO_DEVELOPMENT.md).

---

## Where to Add New Code

| What | Where |
|---|---|
| New endpoint | Handler `HandlerApi<Entity><Action>` in `app/handlers_<domain>.go` + route in `app/routes.go` (inside the `/api` group) |
| New query / persistence | `DBModel` method in `internal/models/<domain>.go`; structs in `internal/models/structs.go` |
| Schema change | `internal/driver/db_structure.go` (+ `schemaVersion` bump; migration in `internal/driver/` for type changes) |
| New setting | `models.Settings` + default in `internal/models/models_defaults.go`; UI defaults in `app/ui/src/hooks/useSettings.jsx` |
| UI request function | `app/ui/src/util/http/<domain>.jsx` |
| Shared query hook | `app/ui/src/hooks/queries/use<Entity>Query.js` |
| New page | `app/ui/src/pages/<Name>Page.jsx` + route in `app/ui/src/main.jsx`; components in `app/ui/src/components/<Domain>/` |
| PDF layout | `internal/pdfexport/` (see `ARCHITECTURE_PDF_EXPORT.md` before touching column widths) |

---

## Workflow

Work runs through the commands in `.claude/commands/` (`/cmd-modes` prints the overview):

| Command | Purpose |
|---|---|
| `/cmd-plan` | Research (via `researcher` agents) + plan in chat |
| `/cmd-task` | Plan → owner confirms → `docs/tasks/TASK_*.md` |
| `/cmd-issue` | Bug trace → owner confirms → `docs/issues/ISSUE_*.md` |
| `/cmd-implement` | Orchestrated implementation of a confirmed task (`.claude/prompts/orchestration.md`) |
| `/cmd-review` | Independent review via `reviewer` agents; BLOCKER/MAJOR verified by the main session |
| `/cmd-question` | Read-only factual answer with `path:line` |
| `/cmd-architecture` · `/cmd-architecture-sync` | Write a new architecture doc · refresh docs from recent commits |
| `/cmd-retro` | Retrospective; proposes doc fixes |

**Roles.** The main session is the **orchestrator**: it plans, writes specs and contracts, splits work into file-disjoint packages, launches Opus subagents, validates every hand-back (diffs, build, tests, smoke), integrates and stages. Subagents (`.claude/agents/`, all `model: opus`): `researcher` (read-only briefs), `implementer` (one package or a fix list, owned files only), `reviewer` (read-only, independent spec/diff review), `doc-writer` (architecture docs, SUMMARIES, CHANGELOG + README copy). The **owner** decides scope, confirms specs, accepts deviations and commits.

**Issue auto-discovery.** A bug found while working on something else must be reported with a proposal to create `docs/issues/ISSUE_*.md` (`/cmd-issue`). Never fix it silently, never ignore it.

---

## Task Completion

When the owner says **"finish/complete the task"**:
- Move the task/issue file to `docs/tasks/_old/` or `docs/issues/_old/` and set `status: done`.
- Make sure the affected `ARCHITECTURE_*.md` (and `SUMMARIES.md` if the summary changed) reflect the result.
- Stage only the files that belong to the task (`git add <paths>`; never `-A` / `.`).
- Propose a branch name (`feature/<kebab>` / `fix/<kebab>`) and a commit message in the repo's style.

---

## PR Checklist

- [ ] `make build_ui`, `go vet ./...`, `make test`, `cd app/ui && npm run lint` pass (or are listed as unverified)
- [ ] Every `handleError` is followed by `return`; new routes are inside the `app.Auth` group
- [ ] Schema change: `schemaVersion` bumped, SQLite + MySQL variants, migration for type/format changes
- [ ] New settings keys have safe defaults for existing installations
- [ ] Caches evicted on write; UI query keys invalidated after mutations
- [ ] `CHANGELOG.md` `[Unreleased]` and the `README.md` copy updated identically
- [ ] Affected `ARCHITECTURE_*.md` updated
