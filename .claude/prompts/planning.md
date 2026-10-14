# Planning Prompt

Used by `/cmd-plan`, by Phase 1 of `/cmd-task` and by Phase 1 of `/cmd-issue`.

**Goal:** analyze the task in depth before any implementation, and produce a plan that `/cmd-implement` can execute.

## Rules

- Do NOT create, edit or delete any file, and do not stage anything. The plan lives in chat. The calling command decides whether a file is written afterwards.
- Do NOT write code. Do not propose fixes or refactors outside the scope of the plan.
- Base every claim on actual code or project docs, with a repo-relative `path:line` reference. If something cannot be found, write "Not found in code". Never guess.
- Commented-out code is not active behaviour.
- If the requirements are ambiguous in a way that changes the design, ask before planning. Smaller ambiguities go under **Assumptions**.

---

## Phase 0: Research (mandatory, runs first)

1. Read `.claude/prompts/research.md`.
2. Replace `{{TASK_DESCRIPTION}}` with the full task or issue text: the command's arguments plus any clarifications the user has given.
3. Launch the **Agent** tool with `subagent_type: researcher` and the filled prompt.
   - **Split when the task clearly spans separable areas**, for example Go backend + React UI, or PDF export + DB schema. Launch 2 or 3 researchers **in parallel** (several Agent calls in one message), one per area. For each one, append this line to the task text: `**Focus area:** <area> (other researchers cover <other areas>)`.
   - Do not split a task that lives in one area. Never launch more than 3 researchers.
4. Wait for every brief. If there are several, merge them: remove duplicate Key Files, keep every Gotcha, and check the code yourself wherever two briefs contradict each other.
5. The merged Research Brief is your primary context for Phase 1.

**Do not skip this phase. Do not read architecture docs yourself;** the researcher does that. If the brief misses a system or a fact you need, read that specific source file, or launch one more researcher with a narrow focus. Do not fall back to reading all the docs.

---

## Phase 1: Planning

Using the Research Brief:

1. **Validate coverage.** Does the brief cover every system the task touches? Fill any gaps as described above.
2. **Map dependencies**, direct and indirect: route (`app/routes.go`) to handler (`app/handlers_*.go`) to `DBModel` method (`internal/models/*.go`) to tables and views (`internal/driver/db_structure.go`); and on the UI side, page to component to query hook to fetcher (`app/ui/src/util/http/*`) to endpoint.
3. **Check persistence and compatibility.** This feeds the Migration & Compatibility section.
   - New tables, columns or indexes are declared in `internal/driver/db_structure.go` and need a `schemaVersion` bump. `validateDB` (`internal/driver/driver.go`) only re-checks the schema when the stored version differs from `schemaVersion`. It only adds missing tables, columns and indexes and recreates views. It never changes a column type or rewrites data.
   - Changing the type or format of existing data needs an explicit migration, following the pattern of `dataOverhaulMigration` in `internal/driver/data_overhaul.go`.
   - Both engines are affected: every column type has an SQLite and a MySQL variant, and views have per-engine SQL.
   - Settings live as one JSON blob in table `settings2` (`GetSettings` / `UpdateSettings` in `internal/models/settings.go`). Existing users' blobs lack any new key, so it unmarshals to the Go zero value. The UI applies its own defaults in `app/ui/src/hooks/useSettings.jsx`.
   - Check the API contract between `app/handlers_*.go` and the fetchers in `app/ui/src/util/http/`.
   - Check the PDF output in `internal/pdfexport/`, because layout changes affect logbooks pilots have already printed or will submit.
4. **Identify fragile zones and regression risk.** Look at existing tests (`*_test.go`, `*.test.jsx`), import and export round-trips, both database engines, and a first run on an empty database.
5. **Follow existing patterns** from the brief's **Patterns to Follow**.
6. **List explicit assumptions.**
7. **Ask clarifying questions** wherever the requirements are ambiguous.

---

## Output structure

Present the plan in chat with these sections, in this order. If a section genuinely does not apply, keep its heading and write `Not applicable — <one-line reason>`.

1. **Feature Overview**: what is being planned and why.
2. **User-Facing Impact**: what the pilot sees, in non-technical language. Cover UI changes (pages, forms, tables, settings), API contract changes, PDF output changes, and import or export behaviour. End with draft CHANGELOG line(s) in the repo format, `- New: ...`, `- Update: ...` or `- Fix: ...`. These go under `## [Unreleased]` in `CHANGELOG.md` when the work ships.
3. **Goals & Non-Goals**: explicit scope boundaries. Non-Goals include product scope exclusions (features deliberately deferred), not only technical ones.
4. **Proposed Architecture**: how the change fits into the existing layers and systems, naming the `docs/architecture/ARCHITECTURE_*.md` docs involved.
5. **Component Breakdown**: new and modified items, as tables:
   - Go files and packages
   - HTTP endpoints: method, path, handler, route registration in `app/routes.go`
   - `DBModel` methods: file, purpose, tables touched
   - React pages, components, query hooks and `util/http` fetchers
6. **Data Model**: new or changed tables, columns (SQLite and MySQL types), views, indexes, settings JSON keys, and Go structs with their JSON tags. Say what persists in the database, what is an in-memory cache, and what lives in browser storage.
7. **Migration & Compatibility**: whether `schemaVersion` must be bumped in `internal/driver/db_structure.go`; the SQLite AND MySQL variants; what happens to existing user databases on first start (`validateDB` only adds tables, columns and indexes, so a type or format change needs an explicit migration like `internal/driver/data_overhaul.go`); backward compatibility of the settings JSON blob when old blobs lack new keys; API compatibility. If none of this applies, write "No migration needed" with a justification.
8. **Integration Points**: how the change connects to existing code, with `path:line`.
9. **Risks & Edge Cases**: what could go wrong. Include regression risk: which existing tests, flows, imports, exports or PDF layouts may break.
10. **Impact Analysis**: effects on other systems.
11. **Assumptions**: what is assumed to be true, and any open questions for the user.
12. **Complexity & Risk**: Low, Medium or High for each, with a one-line reason.
13. **Implementation Phases**, expressed as **file-disjoint work packages**. They feed `/cmd-implement`.

    | Pkg | Goal | New files | Modified files | Depends | Validation |
    |---|---|---|---|---|---|

    - No file appears in more than one package (New files or Modified files). Shared hot spots such as `app/routes.go`, `internal/driver/db_structure.go`, `internal/models/structs.go` and `app/ui/src/util/http/index.js` belong to exactly one package. Other packages state what they need from it.
    - Order the packages by dependency. Packages without mutual dependencies can run in parallel.
    - Give each package its validation: `go vet ./...` and `make test` for Go (both need `make build_ui` first, because `app/ui/dist` is embedded), and `npm run lint` and `npm run test:run` in `app/ui` for the UI, plus any manual check (for example both DB engines, or a PDF export).
    - Documentation (affected `ARCHITECTURE_*.md`, `SUMMARIES.md`, `CHANGELOG.md` `[Unreleased]` and its copy in `README.md`) is a final package handled by the `doc-writer` agent.
