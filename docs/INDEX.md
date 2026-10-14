# Documentation Index

Master index of the agent-facing documentation for web-logbook. User-facing documentation stays in [`README.md`](../README.md) and [`CHANGELOG.md`](../CHANGELOG.md).

**Last updated:** 2026-10-14 · **Architecture docs:** 12

---

## Quick Navigation

| I want to… | Read |
|---|---|
| Start any work | [`CLAUDE.md`](../CLAUDE.md) → this file |
| Find which system owns a feature | [`architecture/SUMMARIES.md`](architecture/SUMMARIES.md) |
| Change code | [`rules/RULE_DEVELOPMENT.md`](rules/RULE_DEVELOPMENT.md), [`rules/RULE_CODE_STYLE.md`](rules/RULE_CODE_STYLE.md), the system's `ARCHITECTURE_*.md` |
| Build, run, test locally | [`guides/HOWTO_DEVELOPMENT.md`](guides/HOWTO_DEVELOPMENT.md) |
| Prepare a release or a dependency bump | [`guides/HOWTO_RELEASE.md`](guides/HOWTO_RELEASE.md) |
| Know what an agent may do with git | [`rules/RULE_GIT.md`](rules/RULE_GIT.md) |
| See the workflow commands | `/cmd-modes` |

---

## Rules (always apply)

| Document | File | Description |
|---|---|---|
| Git | [`RULE_GIT.md`](rules/RULE_GIT.md) | Agents are stage-only; the owner commits. Allowed/forbidden commands, branch and commit-message conventions |
| Code style | [`RULE_CODE_STYLE.md`](rules/RULE_CODE_STYLE.md) | Go and React/JS conventions derived from the codebase |
| Development | [`RULE_DEVELOPMENT.md`](rules/RULE_DEVELOPMENT.md) | Request lifecycle, DB access, schema changes, settings, caches, API and UI data-fetching patterns, Do/Don't |

## Architecture

| System | File | Description |
|---|---|---|
| Summaries | [`SUMMARIES.md`](architecture/SUMMARIES.md) | One paragraph per system — routing table for research |
| Application | [`ARCHITECTURE_APPLICATION.md`](architecture/ARCHITECTURE_APPLICATION.md) | Startup, CLI flags, logging, chi routes and middleware, response helpers, SPA serving, DB backup/restore |
| Database | [`ARCHITECTURE_DATABASE.md`](architecture/ARCHITECTURE_DATABASE.md) | SQLite/MySQL, declarative schema, `schemaVersion`, `validateDB`, v5 data overhaul, views |
| Authentication | [`ARCHITECTURE_AUTH.md`](architecture/ARCHITECTURE_AUTH.md) | Optional JWT auth, login throttling, tokens, `authCache`, UI sign-in/401 handling |
| Settings | [`ARCHITECTURE_SETTINGS.md`](architecture/ARCHITECTURE_SETTINGS.md) | `settings2` JSON blob, defaults, settings UI, time/date display formats |
| Logbook | [`ARCHITECTURE_LOGBOOK.md`](architecture/ARCHITECTURE_LOGBOOK.md) | Flight records, logbook table, custom fields, night time, tracks |
| Stats & Map | [`ARCHITECTURE_STATS_AND_MAP.md`](architecture/ARCHITECTURE_STATS_AND_MAP.md) | Client-side statistics and OpenLayers map (no stats endpoint) |
| Persons | [`ARCHITECTURE_PERSONS.md`](architecture/ARCHITECTURE_PERSONS.md) | Crew directory and person ↔ flight links |
| Aircraft & Airports | [`ARCHITECTURE_AIRCRAFT_AIRPORTS.md`](architecture/ARCHITECTURE_AIRCRAFT_AIRPORTS.md) | Aircraft list generation, airport DB download/custom airports, distance cache |
| Currency, Licensing & Attachments | [`ARCHITECTURE_CURRENCY_LICENSING.md`](architecture/ARCHITECTURE_CURRENCY_LICENSING.md) | Currency rules, licence records, attachments |
| PDF & CSV Export | [`ARCHITECTURE_PDF_EXPORT.md`](architecture/ARCHITECTURE_PDF_EXPORT.md) | A4/A5 PDF logbook rendering, export settings, quick CSV export |
| Import | [`ARCHITECTURE_IMPORT.md`](architecture/ARCHITECTURE_IMPORT.md) | CSV import with mapping presets and NDJSON progress |
| Frontend | [`ARCHITECTURE_FRONTEND.md`](architecture/ARCHITECTURE_FRONTEND.md) | React SPA shell: router, HTTP layer, query hooks, shared UI elements, embed/dev mode |

## Guides

| Document | File | Description |
|---|---|---|
| Development | [`HOWTO_DEVELOPMENT.md`](guides/HOWTO_DEVELOPMENT.md) | Prerequisites, build order, dev loop, tests, lint, CI parity, end-to-end feature recipe |
| Release | [`HOWTO_RELEASE.md`](guides/HOWTO_RELEASE.md) | Version bump, changelog + README sync, tag/release pipeline, dependency bumps |

## Tasks and Issues

| Path | Content |
|---|---|
| [`tasks/_TEMPLATE.md`](tasks/_TEMPLATE.md) | Task template (§1–§10 written by `/cmd-task`; living-task sections §11–§16 kept commented, un-commented and filled by `/cmd-implement`) |
| `tasks/TASK_*.md` | Active tasks (`/cmd-task`) |
| `tasks/refs/<task_snake>/` | Contracts for multi-package tasks (`CONTRACTS.md`, created by `/cmd-implement` at its spec stage) and other task working files |
| `tasks/_old/` | Completed tasks |
| [`issues/_TEMPLATE.md`](issues/_TEMPLATE.md) | Issue template |
| `issues/ISSUE_*.md` | Open issues (`/cmd-issue`) |
| `issues/_old/` | Closed issues |

Status vocabulary for both: `open | in_progress | review | done`.

---

## Document Structure (architecture docs)

Every `ARCHITECTURE_*.md` has the same headings, in order: 1 Overview · 2 Key Concepts · 3 How It Works · 4 Components & Files (File Index, API Endpoints, Data Access, UI) · 5 Data Model & Persistence · 6 Data Flow · 7 Config & Constants · 8 Error Handling & Edge Cases · 9 Integration Points · 10 Testing · 11 Known Issues & Tech Debt · 12 Rules for Future Development · 13 AI Notes — followed by the AI Usage Instructions footer. The full template is embedded in `/cmd-architecture`.
