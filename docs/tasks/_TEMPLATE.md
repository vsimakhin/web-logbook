---
status: open
priority: medium
created: YYYY-MM-DD
version: X.Y.Z
systems: []
---

<!--
Template for docs/tasks/TASK_<NAME>.md (UPPER_SNAKE name), written by /cmd-task after the user confirms.
Frontmatter:
  status:   open | in_progress | review | done   (nothing else)
  priority: low | medium | high
  created:  date the file was written, YYYY-MM-DD
  version:  app version at creation time — the `version` const in app/main.go
  systems:  system IDs from the "System IDs" line of docs/architecture/SUMMARIES.md, never display names:
            APPLICATION, DATABASE, AUTH, SETTINGS, LOGBOOK, STATS_AND_MAP, PERSONS, AIRCRAFT_AIRPORTS,
            CURRENCY_LICENSING, PDF_EXPORT, IMPORT, FRONTEND — e.g. [LOGBOOK, DATABASE]
Evidence: every claim about the code carries `path:line` (repo-relative, no leading ./).
Closing: set status: done and move the file to docs/tasks/_old/.
When writing the file: replace the hint comments of §1 to §10 with content (keep the labels and the table outside
the comments and fill them) and delete this comment.
Decisions the owner makes at the /cmd-task confirmation gate are recorded in §9 as `Answered: ...`, not in §11.
Keep the commented LIVING-TASK SECTIONS at the end as they are, still commented; /cmd-implement un-comments and
fills them.
-->

# TASK: <Short Name>

<!-- When §16 START HERE is first written (.claude/prompts/orchestration.md Step 9.2), replace this comment with:
> **Read first:** §16 START HERE — current state, which sections are binding and which are history.
-->

## 1. Goal Description

<!-- What needs to be built and why, in the pilot's terms (the logbook user). Link the GitHub issue if there is one.
If the task fixes an issue file, link it by its full path (docs/issues/ISSUE_<NAME>.md); /cmd-review finds the fix
task through this link. One or two paragraphs. -->

## 2. Current State

<!-- How it works today, with `path:line`. Start from the relevant docs/architecture/ARCHITECTURE_<SYSTEM>.md and
confirm against the code. Say "Not found in code" when something does not exist. -->

## 3. Expected Outcome

### 3.1 User-facing impact

<!-- What the pilot sees and does differently: pages, fields, columns, totals, filters, PDF/CSV output, settings.
Include what an existing user experiences on upgrade (existing data, saved settings, exported files).
End with the draft CHANGELOG line(s) from the plan: `- New: ...`, `- Update: ...` or `- Fix: ...`. They go under
`## [Unreleased]` in CHANGELOG.md and its copy in README.md when the work ships; /cmd-implement copies them into the
Spec (§12). -->

### 3.2 Technical outcome

<!-- What exists in the code afterwards: endpoints, tables/columns, models, UI components, query hooks
(plan: Component Breakdown and Data Model). -->

### 3.3 Non-goals

<!-- What is explicitly out of scope, including product scope that is deliberately deferred. -->

## 4. Affected Systems

<!-- One line per system: the docs/architecture/ARCHITECTURE_<SYSTEM>.md file and what changes in it.
Layers to check: DB schema (internal/driver/db_structure.go, schemaVersion), models (internal/models/), handlers and
routes (app/), UI (app/ui/src/), PDF export, import/export, both DB engines (SQLite and MySQL). -->

## 5. Dependency Map

<!-- Direct dependencies (what this calls / is called by) and indirect ones (data that flows on, e.g. through the
logbook view into stats, map and PDF export; query keys that must be invalidated). -->

## 6. Risks & Edge Cases

**Migration & Compatibility:** <!-- From the plan's Migration & Compatibility: whether schemaVersion
(internal/driver/db_structure.go:4) must be bumped; the SQLite AND MySQL variants of every new column type and view;
what happens to an existing database on first start (validateDB only adds tables, columns and indexes and recreates
views, so a type or format change needs an explicit migration like internal/driver/data_overhaul.go); defaults for
settings blobs that lack a new key; API compatibility for external scripts. Or "No migration needed — <reason>". -->

<!-- Then the risks and edge cases: upgrade of an existing database (backup warning), SQLite vs MySQL differences,
time stored as integer minutes and the configurable time/date display formats, empty database / first start,
large logbooks, authentication disabled, external API users (README.md "API" section), imported CSV data, and the
regression risk to existing tests, imports, exports and PDF layouts. -->

## 7. Impact Analysis

<!-- What else changes because of this: other systems, performance, the REST API contract, CHANGELOG.md and its copy in
README.md, README usage sections, architecture docs. -->

## 8. Assumptions

<!-- What is taken as true without proof; each one either verified during implementation or turned into a question. -->

## 9. Open Questions

<!-- Numbered; each with the options and a recommendation. A question the owner answered at the /cmd-task
confirmation gate gets `Answered: <choice> — owner, YYYY-MM-DD`; /cmd-implement Step 2.1 copies these into
§11 Decisions. Every question that blocks the design must be answered before the /cmd-implement spec gate. -->

## 10. Proposed Next Steps

<!-- From the plan: Complexity & Risk (Low / Medium / High for each, with a one-line reason), then the Implementation
Phases as the file-disjoint work-package table below. No file appears in two rows. Each shared hot spot
(app/routes.go, internal/driver/db_structure.go, internal/driver/driver.go, internal/models/structs.go,
app/ui/src/main.jsx, app/ui/src/util/http/index.js, app/ui/src/hooks/queries/index.js) belongs to exactly one
package. Order the packages by dependency; documentation is the last row (DOC, handled by the doc-writer agent).
Inside a package, work in the order of docs/guides/HOWTO_DEVELOPMENT.md §9. Verification ends with the CI parity
sequence (docs/guides/HOWTO_DEVELOPMENT.md §6), a manual check in the running app, CHANGELOG [Unreleased] + README
copy, and the architecture docs. /cmd-implement Step 2.3 builds §13 Work Packages from this table. -->

| Pkg | Goal | New files | Modified files | Depends | Validation |
|---|---|---|---|---|---|
| P1 | <goal> | <new paths or —> | <modified paths or —> | — | <e.g. go vet ./..., make test, npm run lint, npm run test:run, manual check> |
| DOC | Architecture docs, CHANGELOG `[Unreleased]` and its README copy | — | affected `ARCHITECTURE_*.md`, `CHANGELOG.md`, `README.md` | all | references checked; `[Unreleased]` blocks identical |

<!--
LIVING-TASK SECTIONS. /cmd-implement un-comments the sections below and fills them as the work progresses:
Decisions, Spec, Work Packages, Acceptance, Result (one subsection per stage), START HERE.
Use these headings exactly as written (§11 to §16); never renumber or reorder them.
Multi-package work also gets docs/tasks/refs/<task_snake>/CONTRACTS.md (names, file ownership, contracts), created by
/cmd-implement at its spec stage (.claude/prompts/orchestration.md Step 2.3a, finalized in Step 3), never by /cmd-task.
-->

<!--
## 11. Decisions

Every answered open question (copied from §9) and every owner choice; nothing is implemented against an unconfirmed
decision. Orchestrator choices stay pending until the owner confirms them at the spec gate.

| # | Decision | Confirmed |
|---|---|---|
| D1 | <decision> | owner, YYYY-MM-DD |
| D2 | <orchestrator's technical choice> | orchestrator (<reason>), pending owner confirmation at the spec gate |
-->

<!--
## 12. Spec

Contracts every package relies on, by exact name: endpoints (method, path, handler, route group, Compress or not,
request and response JSON, status codes for success, bad input and errors); tables, columns and views with both engine
types, the new schemaVersion and whether an explicit migration is needed; settings keys with the default for old
blobs; Go structs, JSON tags and DBModel method signatures; UI pages, routes, components, query hooks, query keys,
fetch functions and the keys each mutation invalidates; behaviour rules S1, S2, ... (one testable rule each);
non-goals (from §3.3); CHANGELOG lines (from §3.1). For multi-package work link
docs/tasks/refs/<task_snake>/CONTRACTS.md. The spec gate of /cmd-implement is approved against this section.
-->

<!--
## 13. Work Packages

Built from the §10 table; Goal and Validation move into §12 and §14. No two packages touch the same file.

| Pkg | Owner agent | New files | Modified files | Depends |
|---|---|---|---|---|
| P1 | implementer | <new paths or —> | <modified paths or —> | — |
| DOC | doc-writer | — | affected ARCHITECTURE_*.md, CHANGELOG.md, README.md | all |
-->

<!--
## 14. Acceptance

| # | Check | Pass |
|---|---|---|
| 1 | CI parity: make build_ui, go vet ./..., make test, make build_backend; plus npm run lint in app/ui and gofmt -l app internal printing nothing | |
| 2 | <endpoint check from the smoke run: request → expected status and JSON> | |
| 3 | <schema: a fresh DB, and an upgraded DB from the previous schemaVersion> (only if the schema changes) | |
| 4 | Owner check, in plain language: "Open <page>, do <action>, you see <result>." | |
| 5 | CHANGELOG.md [Unreleased] and its copy in README.md are identical and describe the change | |
| 6 | Affected docs/architecture/ARCHITECTURE_*.md are updated | |

Each implementation package is assigned the rows it must satisfy. Pass is pass, fail or
unverified: <command> — <reason>; never a pass that did not run.
-->

<!--
## 15. Result

### 15.1 Stage 1, YYYY-MM-DD

Built (files by package, endpoints, schema version); Validation (command → result, unverified rows included);
Smoke (what was called and the outcome, or unverified with the reason); Review (runs, finding counts B/M/m/S, fixed,
rejected and why, deferred as proposed ISSUE files); Accepted deviations (who accepted, when); Carried forward.
Add 15.2, 15.3 for later stages.
-->

<!--
## 16. START HERE

Rewritten at the end of every session: current state, which sections are binding and which are history,
the next step, open debts. A new session reads this first.
-->
