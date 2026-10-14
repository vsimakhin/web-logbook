---
description: "Architecture Documentation Mode: research a system from code, wait for confirmation, then write docs/architecture/ARCHITECTURE_<SYSTEM>.md plus its SUMMARIES and INDEX entries"
argument-hint: "<system name>"
---

You are in **Architecture Documentation Mode**. Generate a full architecture document for an existing system of web-logbook from its code.

**System:** $ARGUMENTS

If the system name above is empty, list the existing `docs/architecture/ARCHITECTURE_*.md` files, ask which system to document, and stop.

This mode ALWAYS runs the research first and writes the document only after the owner confirms.

---

## Phase 1: Code research (mandatory)

**Rules:**
- Do NOT modify any code or file in this phase.
- Do NOT invent behaviour. Document only what exists in the code.
- If something is unclear or missing, state **"Not found in code"**.
- Evidence: every factual claim carries an inline-code reference, as a repo-relative path optionally with a line or range (`app/main.go:18`, `internal/driver/driver.go:43-94`, `app/ui/src/main.jsx`). Do not prefix paths with `./`. Line numbers must be real: open the file and check them before writing. Put the function name next to the reference (`HandlerLogin` in `app/handlers_auth.go:164`), so the reference still makes sense after small edits.

**Anti-hallucination rules (strict):**
- **Rule A**: commented-out code is not active behaviour. If source code contains commented-out lines (`//`, `/* */`, or `{/* */}` in JSX), do not describe that logic as active. If it matters, list it under Known Issues & Tech Debt as "commented out, currently disabled".
- **Rule B**: attribute behaviour only to the exact function or component that implements it. Do not merge behaviour from helpers, middleware or child components into the main handler or page.
- **Rule C**: no fabricated issues. List only problems actually visible in code, and label each one `Confirmed` (with reasoning) or `Suspected` (with the evidence that would confirm it). Do not add hypothetical issues.
- **Rule D**: group functions by the file or type that owns them. In API and data-access tables, use one sub-header or block per file. Do not mix several files into one flat table.

**Process:**
1. **Context and boundaries.**
   - Read `docs/architecture/SUMMARIES.md`, `docs/INDEX.md` and the neighbouring `ARCHITECTURE_*.md` docs, so you know where this system ends and which documents to cross-link.
   - If `docs/architecture/ARCHITECTURE_<SYSTEM>.md` already exists, stop and ask the owner: a full regeneration, or `/cmd-architecture-sync <days>` instead?
   - If the boundaries of the system are unclear, ask before researching.
2. **Source scope.** List every file of the system:
   - the Go handlers in `app/` and the models in `internal/models/`
   - the helpers in `internal/{driver,pdfexport,nighttime,utils}/`
   - the UI pages in `app/ui/src/pages/`, the components in `app/ui/src/components/<Area>/`, the hooks in `app/ui/src/hooks/` and the fetch functions in `app/ui/src/util/http/`

   To find them, search for the route paths, handler names, table names and component names. Read **all** of these files fully, not only the entry points.
3. **Routes**: every route of the system in `app/routes.go`, with its method, path, handler, and middleware (the `app.Auth` group, `middleware.Compress(5)`).
4. **Handlers**: request parsing and validation, the model calls, the responses (`writeJSON`, `writeOkResponse`, `writeErrorResponse`, `handleError`; `app/helpers.go`), the status codes, and where a `return` is missing after an error.
5. **Data access**: the `DBModel` methods, grouped by file (Rule D), with their SQL, the tables and views they touch, transactions, context timeouts, and the in-memory caches (`sync.Map`) with where each one is filled and invalidated.
6. **Schema**:
   - the tables, columns (SQLite and MySQL types), indexes and views in `internal/driver/db_structure.go`
   - `schemaVersion`
   - migrations in `internal/driver/data_overhaul.go`
   - per-engine differences
7. **Settings**: the `models.Settings` fields (JSON keys in table `settings2`) that the system reads or writes, their defaults, and where the UI applies its own defaults.
8. **UI**:
   - the pages and their routes in `app/ui/src/main.jsx`
   - the key components
   - the query hooks and their query keys
   - the fetch functions
   - which mutation invalidates which key
   - what the pilot sees and can do on each page
9. **Data flow**: trace the main operations from a UI action through the fetch function, endpoint, handler, model and SQL, and back.
10. **Error paths and edge cases**: empty database, missing record, invalid input, auth enabled or disabled, SQLite vs MySQL, large logbooks.
11. **Constants and config**: real values with `file:line`.
    - **(configurable)**: CLI flags in `parseFlags` (`app/main.go`) or settings fields.
    - **(hardcoded)**: constants in Go and in `app/ui/src/constants/`, timeouts and limits.
12. **Tests**: the `*_test.go` and `*.test.jsx` files covering the system, how to run them, and the gaps.
13. **TODO, FIXME and HACK** markers, commented-out code (Rule A), and verified code smells (Rule C).
14. **Integration points** with the other systems, named by their exact `ARCHITECTURE_*.md` file names.

**Present the findings to the owner:**
- the proposed document name `ARCHITECTURE_<SYSTEM>.md`, in UPPER_SNAKE
- the source scope (the file list)
- the endpoints
- the tables and settings
- the main flows
- the issues found
- the open questions

**Wait for confirmation before Phase 2.**

---

## Phase 2: Architecture document

**Create:** `docs/architecture/ARCHITECTURE_<SYSTEM>.md`. Use the name the owner confirmed.

**Rules:**
- Use the template below. **Every heading is present, in this order.** A section that genuinely does not apply keeps its heading with `Not applicable — <one-line reason>`.
- Mark a subsystem that was not fully traced with `(stub)`.
- Give real numbers from the code (timeouts, limits, defaults, formats) with `file:line`. Mark each value `(configurable)`, together with the flag or settings key, or `(hardcoded)`.
- Section 12 "Rules for Future Development" is mandatory and never empty. It holds concrete modification recipes for this system (for example "add a column", "add an endpoint", "add a settings field"), each with the exact files to touch and a cross-check list ("if you change X, also verify Y").
- Write in English, for a developer or planner who has not seen the code. The product is a pilot's logbook: describe behaviour in the pilot's terms in §1 and §3.
- Fill the `Last Updated` placeholder with today's date and the source (`/cmd-architecture`, or the task name).

**Template (binding):**

```markdown
# <System Name> — Architecture

**Last Updated:** <YYYY-MM-DD> — initial version generated from code (<source: /cmd-architecture or TASK_NAME>)

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
<!-- | # | Issue | Location | Status (Confirmed/Suspected) | Severity | verified: <YYYY-MM-DD> | -->

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

Replace the `<!-- ... -->` hints with content. §4.1 File Index must list **every** source file of the system, because `/cmd-architecture-sync` maps changed files to documents through this table. List directories that the system owns entirely as a directory path ending in `/` (or `/*`), in inline code.

**Self-check before finishing.** Every `path` and `path:line` must resolve:

```sh
F=docs/architecture/ARCHITECTURE_<SYSTEM>.md
grep -oE '`[A-Za-z0-9_.-]+/[A-Za-z0-9_./-]*[A-Za-z0-9_-]\.[A-Za-z0-9]+(:[0-9]+(-[0-9]+)?)?`' "$F" | tr -d '`' | sort -u |
while IFS=: read -r f l; do
  [ -e "$f" ] || { echo "missing: $f"; continue; }
  [ -z "$l" ] && continue
  n=$(awk 'END{print NR}' "$f"); e=${l#*-}; [ "$e" -le "$n" ] || echo "out of range: $f:$l ($n lines)"
done
```

This proves only that the lines exist. Spot-check that each cited line shows what the text claims.

---

## After creation

1. **`docs/architecture/SUMMARIES.md`**: register the new system ID and add its entry.
   - The ID is the `<SYSTEM>` part of the file name (`ARCHITECTURE_<SYSTEM>.md`). Add it to the "System IDs" line and as a row of the ID table (ID, System, Document). Task and issue files can use it in `systems:` only after this.
   - Write the entry with the file's "Entry template", including its ID line (`` **ID:** `<SYSTEM>` · **Doc:** [ARCHITECTURE_<SYSTEM>.md](ARCHITECTURE_<SYSTEM>.md) ``). The summary is 3 to 6 sentences covering what the system does, its key files, and the one gotcha a planner must know. Add 5 to 15 routing keywords: endpoint fragments, table names, component names and domain words.
   - Bump "Total systems" and update the "Last generated" date.
2. **`docs/INDEX.md`**: add a row for the new document in the existing architecture table (same columns). Update any "last updated" date or count.
3. If an existing document's §9 Integration Points should now link to this one, list that for the owner. Also list the per-system doc count in the `CLAUDE.md` Documentation Map (`12 per-system docs`) for the owner to update. Do not edit other architecture docs or `CLAUDE.md` in this mode.
4. Report the created file and the two index updates. Do not stage or commit unless the owner asks. If asked, stage only these three files with explicit paths.
