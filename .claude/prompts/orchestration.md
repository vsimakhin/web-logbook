# Orchestration Prompt

Used by `/cmd-implement <path to docs/tasks/TASK_*.md>`. The main session is the **orchestrator**. It turns a confirmed task file into staged, validated, reviewed and documented changes, using Opus subagents from `.claude/agents/`.

---

## 0. Roles

| Who | Does | Never |
|---|---|---|
| **Owner** | Decides scope. Confirms the spec. Accepts or rejects deviations. Creates the branch, commits, and says when a task is done. | — |
| **Orchestrator** (main session) | Plans and decides within the confirmed scope. Writes the Decisions, Spec, Work Packages, Acceptance, Result and START HERE sections and the contracts file. Launches agents, validates every hand-back, integrates, runs validation and the smoke run, and stages files. | Commits, pushes or switches branches. Ships behaviour the owner did not ask for. Claims a check passed when it did not run. |
| `researcher` | Read-only Research Brief | Edits |
| `implementer` | One work package, or a fix round, only in its owned files | Touching other files, `git add` or commit, `make` targets |
| `reviewer` | Independent review of the spec or of the diff | Edits |
| `doc-writer` | Architecture docs, `SUMMARIES.md`, `docs/INDEX.md`, `CHANGELOG.md` `[Unreleased]` and its copy in `README.md` | Code |

## 1. Working rules (always active)

1. **Never ship behaviour the owner did not ask for.** If the spec, an agent or a reviewer brings in a new behaviour, rule, default, UI element or stop condition, list it and ask the owner. Do not decide it yourself.
2. **An agent report is a claim, not proof.** Read every diff yourself, and run the checks yourself.
3. **No invented passes.** Every check in the Result and Acceptance tables either ran, with its result recorded, or is recorded as `unverified: <command> — <reason>`, for example "Go not installed".
4. **Fix the obvious before showing the owner.** Validation and smoke failures, a missing route, a crash on an empty database or a lint error are fixed (through a fixer) before the owner is asked to look. They are not handed to the owner as findings to discover.
5. **Git is stage-only** (`docs/rules/RULE_GIT.md`). The only write allowed is `git add <explicit paths>`. Never use `git add -A`, `git add .` or `git add -f`. Any git write not in the rule's §2 Allowed table is forbidden. That includes everything its §1 lists (`commit`, `push`, `checkout`, `switch`, `branch <name>`, `worktree add`, `stash`, `reset`, `restore`, `clean`), and also `git mv`. To move a file, use a plain `mv`, then `git add` both the old and the new path.
6. **File ownership is absolute while agents run.** Do not edit an agent's files until it has reported.
7. **Evidence**: repo-relative `path:line` references, without `./`, verified by opening the file. Apply the anti-hallucination rules:
   - **A**: commented-out code is not behaviour.
   - **B**: attribute behaviour only to the exact function or component that implements it.
   - **C**: no fabricated issues; label each one `Confirmed` or `Suspected`.
   - **D**: group functions by the file or type that owns them.
   - If something cannot be found, write "Not found in code".
8. **Everything goes in the task file.** Decisions, the spec, deviations and results are written to the task file as they happen, so a new session can continue from §16 START HERE.

**Trivial vs non-trivial.** A task is **trivial** when it is one work package in one system, with no schema or migration change, no new or changed endpoint, no auth, upload or security surface, and roughly under 150 changed lines. Anything else is **non-trivial**. Trivial tasks may skip the spec review (§2, step 2.6) and the contracts file. They never skip the spec gate, validation, the diff review or the documentation step.

---

## 2. Procedure

### Step 1: Precondition and context

1. Take the task file path passed to `/cmd-implement` (its "Task file:" line).
   - If it is empty, or the file does not exist under `docs/tasks/`, list `docs/tasks/TASK_*.md` and ask which one to use.
   - If it is a `docs/issues/ISSUE_*.md`, explain that the fix needs a task file, and suggest `/cmd-task "Fix docs/issues/ISSUE_<NAME>.md"`, then `/cmd-implement` on the resulting task file, then `/cmd-review docs/issues/ISSUE_<NAME>.md`.
   - Stop in both cases.
2. The task file must contain a **confirmed plan**: §1 to §10 filled, and no open question in §9 that blocks the design. If the plan is missing or blocked, stop and suggest `/cmd-task <description>`, or ask the open questions first.
3. If the frontmatter `status` is `done`, stop and ask. Otherwise set `status: in_progress`.
4. Read:
   - the whole task file, plus any `docs/tasks/refs/<task_snake>/` material it references
   - `docs/architecture/SUMMARIES.md` and the `docs/architecture/ARCHITECTURE_*.md` of every affected system (§4 of the task)
   - `docs/rules/RULE_DEVELOPMENT.md`, `docs/rules/RULE_CODE_STYLE.md` and `docs/rules/RULE_GIT.md`
   - `docs/guides/HOWTO_DEVELOPMENT.md` §6 (CI parity) and §7 (first start)
5. If research is missing or stale for an affected system, or the code moved since the plan (`git log --since=<task created date> -- <affected paths>`), launch a `researcher` (template §3.1). Do not start the spec on guesses.
6. If a §16 START HERE section exists, this is a continuation. Resume from it instead of starting over.

### Step 2: Spec (written into the task file)

In the task file, uncomment the LIVING-TASK blocks that `/cmd-task` kept from `docs/tasks/_TEMPLATE.md` (copy them from the template if they are missing). Use exactly these headings: `## 11. Decisions`, `## 12. Spec`, `## 13. Work Packages`, `## 14. Acceptance`, `## 15. Result` (subsections `### 15.N Stage N, YYYY-MM-DD`), `## 16. START HERE`. Never renumber.

**2.1 §11 Decisions.** Record every answered open question and every owner choice. Copy each answered §9 item (`Answered: <choice> — owner, YYYY-MM-DD`, written by `/cmd-task`) into §11 as an owner row:

| # | Decision | Confirmed |
|---|---|---|
| D1 | <decision> | owner, YYYY-MM-DD |
| D2 | <orchestrator's technical choice> | orchestrator (<reason>), pending owner confirmation at the spec gate |

Only decisions the owner actually made are marked "owner". Everything else is shown at the gate.

**2.2 §12 Spec, the fixed contracts.** Every name that more than one package or the UI relies on is written down exactly:
- **Endpoints**: method, path, handler name, route group (inside `app.Auth`, `app/routes.go:26-27`), `middleware.Compress(5)` or not, request JSON (field names and types), response JSON (`models.JSONResponse` or a typed body), and status codes for success, bad input and errors.
- **Database**: table and column names with `ColumnType` for SQLite and MySQL, indexes, views (SQL for both engines), the new `schemaVersion` value (`internal/driver/db_structure.go:4`), and whether an explicit migration is needed (type change, rename or data rewrite, following `internal/driver/data_overhaul.go`).
- **Settings JSON**: field, JSON key, type, the default for old blobs that lack it, and where the UI applies its default.
- **Go**: struct names and JSON tags (`internal/models/structs.go`), and `DBModel` method signatures with their files.
- **UI**: pages, routes (`app/ui/src/main.jsx`), component names and props, query hooks, query keys, fetch functions in `app/ui/src/util/http/`, and which keys each mutation invalidates.
- **Behaviour rules**, numbered S1, S2 and so on: one testable rule each, including edge cases (empty database, missing fields, both engines, auth disabled).
- **Non-goals**, carried over from §3.3.
- **CHANGELOG lines**: the draft from the plan.

**2.3 §13 Work Packages.** Start from the work-package table in §10 (the plan's Implementation Phases, columns Pkg, Goal, New files, Modified files, Depends, Validation) and convert it to the §13 columns below; Goal and Validation move into the package's Spec items and Acceptance rows. No file appears in two rows.

| Pkg | Owner agent | New files | Modified files | Depends |
|---|---|---|---|---|
| P1 | implementer | `internal/models/<x>.go` | `internal/driver/db_structure.go`, `internal/models/structs.go` | — |
| P2 | implementer | — | `app/handlers_<x>.go`, `app/routes.go` | P1 |
| P3 | implementer | `app/ui/src/components/<X>/<X>.jsx` | `app/ui/src/util/http/<x>.jsx`, `app/ui/src/hooks/queries/index.js` | P2 (API contract only) |
| DOC | doc-writer | — | affected `ARCHITECTURE_*.md`, `CHANGELOG.md`, `README.md` | all |

Splitting rules:
- **Shared hot spots** each have exactly one owner package:
  - `app/routes.go`
  - `internal/driver/db_structure.go`
  - `internal/driver/driver.go` (the `validateDB` lists)
  - `internal/models/structs.go`
  - `app/ui/src/main.jsx`
  - `app/ui/src/util/http/index.js`
  - `app/ui/src/hooks/queries/index.js`
- **Test files** are owned like any other file.
- `CHANGELOG.md`, `README.md` and `docs/**` always belong to the DOC step, never to an implementer.
- A package that only consumes another package's API (UI against a new endpoint) can run **in parallel** with it when the Spec fixes the contract. A package that needs the other's code to compile runs in a **later wave**.

**2.3a Contracts draft** (more than one implementer package; the DOC row does not count). Write `docs/tasks/refs/<task_snake>/CONTRACTS.md` now, together with the Spec, so the spec reviewer (2.6) and the owner (2.7) see it. It is finalized after the gate (Step 3). `<task_snake>` is the task name in lowercase snake case, without `TASK_`; for example, `TASK_TAGS_FILTERS.md` becomes `tags_filters`. Use this structure:

```markdown
# Contracts — <Task Name>

The task file (`docs/tasks/TASK_<NAME>.md`) is the "what and why"; this file fixes the names, the files and who owns
what, so parallel agents never collide. If a contract here is wrong, say so in your report. Do not silently change it.

## 0. Ground rules for every agent
- Read first: `CLAUDE.md`; `docs/rules/RULE_CODE_STYLE.md`, `docs/rules/RULE_DEVELOPMENT.md`; the task file §11–§14;
  the `docs/architecture/ARCHITECTURE_*.md` of the systems you touch.
- Git: read-only. Never `git add`, commit, stash, checkout, reset or restore — the orchestrator stages.
- Touch only the files your package owns (§2). Need a change elsewhere → a request in your report.
- No `make` targets, no `npm install`, no new dependencies. Verification per your agent instructions.
- Report in the format of your agent instructions: files touched, API/endpoints added, cross-package requests,
  deviations, unverified.

## 1. Already in the tree (written by the orchestrator before the wave; read-only for agents)
| File | Content |
|---|---|
<!-- optional: shared structs / route lines / query keys pre-written so packages compile against a fixed API -->

## 2. Packages and file ownership
| Pkg | Owns (creates or edits) | Must not touch | Wave |
|---|---|---|---|

## 3. Cross-package contracts
<!-- Only what parallel packages need from each other, by exact name; link task Spec §12 items instead of copying. -->

## 4. Decisions after wave N (orchestrator)
<!-- Appended as waves report: accepted deviations, resolved requests, corrected contracts. -->
```

**2.4 §14 Acceptance.**

| # | Check | Pass |
|---|---|---|
| 1 | CI parity: `make build_ui`, `go vet ./...`, `make test`, `make build_backend`; plus `npm run lint` in `app/ui` and `gofmt -l app internal` printing nothing beyond the pre-task baseline | |
| 2 | <endpoint check from the smoke run: request → expected status and JSON> | |
| 3 | <schema: a fresh DB, and an upgraded DB from the previous `schemaVersion`> (if there is a schema change) | |
| 4 | **Owner check, in plain language:** "Open <page>, do <action>, you see <result>." | |
| 5 | `CHANGELOG.md` `[Unreleased]` and its copy in `README.md` are identical and describe the change | |
| 6 | Affected `docs/architecture/ARCHITECTURE_*.md` are updated | |

Each implementation package gets the Acceptance rows it must satisfy.

**2.5 Scope check.** Compare the Spec with the task's §3 and §11. List every behaviour the owner has not explicitly asked for. These items go to the owner as questions.

**2.6 Spec review** (non-trivial tasks). Launch one `reviewer` with the spec template (§3.3). Verify each `BLOCKER` or `MAJOR` yourself, correct the spec, and note what changed.

**2.7 Gate: the owner confirms the spec.** Present:
- the spec summary
- the decisions that need confirmation
- the behaviours that were not asked for (from 2.5)
- the reviewer's finding counts and what changed because of them
- the package plan

**Wait.** When the owner confirms, mark the Decisions rows `owner, <date>`. Without confirmation nothing is implemented.

### Step 3: Finalize the contracts after the gate

Only when a contracts draft exists (2.3a). Apply every change the gate made to the Spec, the packages or the decisions, so the contracts file and §12 and §13 agree.

When several packages need the same new type, the orchestrator may write that small piece of shared contract code itself before the wave (for example a struct in `internal/models/structs.go`, or a query key constant). It is then listed in §1 of the contracts file as read-only. Take the baselines of Step 4, item 0 before writing any of this code, so they come from the unchanged tree.

### Step 4: Launch implementers

0. **Baselines, before wave 1 and before any shared contract code (Step 3) is written:**
   - If `app/ui/dist` is missing, run `make build_ui` first. The baseline build and `go vet ./app` need it (`//go:embed ui/dist/*` in `app/handlers_aux.go:12`).
   - Record the output of `gofmt -l app internal` as the format baseline. Step 5 uses it to tell pre-existing formatting problems from the task's own.
   - If the task changes the schema, take the smoke baseline database from the unchanged tree (see Step 7, "test the upgrade path").
1. Launch **one Agent call per package, all in a single message**, so they run in parallel. Use `subagent_type: implementer` and the prompt template in §3.2. Each prompt gives the task file path, the package id, the owned files, the contracts path and the Acceptance rows.
2. **Waves.** Dependent packages run in a later wave. Before the next wave starts, the earlier wave must pass a quick gate: diffs read, `gofmt -l` on the touched Go files, and `go vet` on the touched packages when Go is available. Vet `./app` only when `app/ui/dist` exists; otherwise vet the touched `./internal/...` packages only and record `unverified: go vet ./app`.
3. **No worktree isolation.** It would need `git worktree add`, which `docs/rules/RULE_GIT.md` §1 forbids. Packages that cannot be made file-disjoint therefore run **sequentially**, in separate waves, in the shared tree.
4. **On each hand-back:**
   - `git status --porcelain` and `git diff HEAD --stat`: the files changed must be a subset of the package's owned files. If an agent wrote outside its ownership, inspect the change. Either keep it, or undo it by editing the file back (never `git restore` or `checkout`). Record what you decided.
   - Read the diff. Check the names against the Spec.
   - **Cross-package requests**: decide each one. Either assign it to the owning package (a later wave or a fixer), or, for a wiring change of a few lines (a route line, a barrel export), make it yourself and record it in the contracts file §4.
   - **Deviations**: accept them yourself only if they change no user-visible behaviour. Otherwise they go to the owner. Record them either way.

### Step 5: Integrate and validate (the orchestrator itself)

1. Read the full integrated diff: `git diff HEAD`, plus every untracked file from `git status --porcelain`, read in full.
2. Run the checks in this order and record each result:

```sh
command -v go  >/dev/null || echo "unverified: Go toolchain not installed"
command -v npm >/dev/null || echo "unverified: Node/npm not installed"

gofmt -l app internal                  # nothing beyond the Step 4.0 baseline; run it BEFORE make test (make test rewrites files)
make build_ui                          # npm install + vitest run + vite build → app/ui/dist (needed by go vet / go test / go build)
go vet ./...
make test                              # runs go fmt ./... first (REWRITES files), then go test -v ./... -coverpkg=./...
npm --prefix app/ui run lint
npm --prefix app/ui run test:run
make build_backend                     # CI's last step; its `clean` wipes the repo-root dist/ (binaries), not app/ui/dist
git status --porcelain                 # after the above: no unexpected changes
```

3. Interpret the results:
   - Compare the files that `make test` rewrote (`go fmt ./...`) with the format baseline from Step 4, item 0. Rewritten files that are part of the integrated diff are formatting misses: keep them. Files outside the task that the baseline already listed are pre-existing: do not stage them, and tell the owner.
   - `make build_ui` runs `npm install`, which can rewrite `app/ui/package-lock.json`. Do not stage a lockfile change unless the task is about dependencies. Tell the owner about it.
4. **Schema change checks**, by reading the code:
   - `schemaVersion` is bumped.
   - Every new column and view has both its SQLite and its MySQL variant.
   - New tables and views are in the `validateDB` lists (`internal/driver/driver.go:43`).
   - A type change, rename or data rewrite has an explicit, idempotent migration.
   - Old settings JSON still loads.
5. If Go or Node is missing, every command that could not run is recorded as `unverified: <command>`. The owner then runs them, or CI does on the PR. Say this plainly in the hand-over.

### Step 6: Independent review and fix rounds

1. Launch the `reviewer` on the integrated diff (diff template, §3.4).
   - A **large diff** (roughly more than 600 changed lines, or more than one area) is split by area into parallel reviewers in one message:
     - **backend**: `app/*.go`, `internal/models/`, `internal/{nighttime,pdfexport,utils}/`
     - **frontend**: `app/ui/src/**`
     - **schema**: `internal/driver/**`, structs, migrations
2. **Consolidate.**
   - Deduplicate: one root cause becomes one finding at the highest severity, with every location listed.
   - **Verify every `BLOCKER` and `MAJOR` yourself** at the cited line. Reject findings that do not hold, and say why.
   - Decide which `MINOR` items to fix now: cheap ones inside the spec. Anything that changes behaviour goes to the owner.
3. **Fix round.** Launch `implementer` agents as fixers (template §3.5), file-disjoint and in parallel, with the verified findings. After they report, repeat step 5. Then re-review only the fix diff, giving the reviewer the previous findings.
4. **At most 2 fix rounds.** If `BLOCKER` or `MAJOR` findings remain after that, stop and escalate to the owner with the remaining findings and the options.

### Step 7: Smoke run (when feasible)

Run the real binary against a throw-away database and call the touched endpoints. The flags come from `parseFlags` (`app/main.go:77-95`). Things to know:
- **Log file:** the logger writes `weblogbook-output.log` into the **current directory** and truncates it (`app/main.go:98`). Always start the binary from inside the temp dir.
- **First start needs network:** with an empty `airports` table, `main` downloads the airport database. If the download fails, `main` returns without serving (`app/main.go:176-182`). Offline, reuse a smoke database from an earlier run that already has airports (copy it into the new temp dir). Otherwise record the smoke run as unverified.
- **Auth:** a fresh database has authentication disabled. `checkSettingsTable` (`internal/driver/driver.go:129`) writes default settings without `AuthEnabled`, so it is false and no token is needed. To exercise auth, enable it in settings, then `POST /api/login` with `{"login":"...","password":"..."}` and send `Authorization: Bearer <token>`.
- **MySQL:** only when a MySQL server is available (`-engine mysql -dsn 'user:pass@tcp(127.0.0.1:3306)/smoke'`). Otherwise record "unverified: MySQL smoke" and rely on the review of the MySQL DDL.

**Running the commands:**
- Shell variables and functions do not survive between Bash tool calls, and the server needs its own `run_in_background` call. Run `mktemp -d` once and paste the literal path it prints in place of `<SMOKE>` in every later command.
- The readiness wait can take minutes on a first start (airport download), longer than the Bash tool's default timeout of 120000 ms. Give that call `timeout: 600000`.
- `mktemp`, the background binary, `curl` and `pkill` are not pre-approved in `.claude/settings.json`, so expect approval prompts for them.

```sh
mktemp -d                                             # once; prints <SMOKE>. Never the repo root, never the owner's web-logbook.sql
go build -o <SMOKE>/web-logbook ./app                 # needs app/ui/dist (make build_ui)
# separate Bash call with run_in_background; starts inside <SMOKE> so the log file lands there:
(cd <SMOKE> && exec <SMOKE>/web-logbook -port 4099 -env dev -dsn <SMOKE>/smoke.sql)
# readiness, with timeout: 600000 (the first start downloads airports):
curl -s --retry 120 --retry-delay 2 --retry-connrefused http://localhost:4099/api/version
# exercise each touched endpoint; check status codes and JSON shape:
curl -s -w '\n%{http_code}\n' http://localhost:4099/api/<path>
curl -s -w '\n%{http_code}\n' -X POST http://localhost:4099/api/<path> -H 'Content-Type: application/json' -d '<json>'
grep -n 'ERROR' <SMOKE>/weblogbook-output.log         # must be empty, or every line explained
pkill -f <SMOKE>/web-logbook                          # stop the server
```

**Schema-change tasks: test the upgrade path.**
1. Before wave 1, while the tree is still at `HEAD`, run `mktemp -d` again for `<SMOKE_BASE>` (literal path, pasted the same way), build the current binary into it, and start it once from inside it with `-dsn <SMOKE_BASE>/base.sql`. This creates `base.sql` with airports.
2. Insert a few records through the API, then stop it (`pkill -f <SMOKE_BASE>/web-logbook`).
3. After integration, copy `<SMOKE_BASE>/base.sql` into `<SMOKE>` and start the new build on the copy (`-dsn <SMOKE>/base.sql`). `validateDB` must upgrade it, and the touched endpoints must work on the upgraded data.

**The UI** is served by the same binary at `http://localhost:4099/`. If a browser tool is available, walk through the owner check yourself. Otherwise it stays the owner's plain-language check.

Fill in the Acceptance table (§14) with the real outcome of each row (`pass`, `fail` or `unverified: <reason>`) before you show the result to the owner.

### Step 8: Documentation

Launch a `doc-writer` (template §3.6) with:
- the affected `ARCHITECTURE_*.md` files
- the changed files
- the draft CHANGELOG lines

It owns `CHANGELOG.md`, the README copy, and `SUMMARIES.md` and `docs/INDEX.md` when a summary or document changed. If many docs are affected, use several doc-writers in parallel, one per doc. Exactly one of them owns the shared files.

Then check the result yourself:
- Read the doc diff.
- Run the reference check from `.claude/agents/doc-writer.md` on the touched docs.
- Confirm that the `[Unreleased]` blocks are identical:

```sh
unrel() { awk '/^## \[Unreleased\]/{f=1;print;next} /^## \[/{f=0} f' "$1"; }
diff <(unrel CHANGELOG.md) <(unrel README.md) && echo IDENTICAL
```

A new or changed CLI flag also needs the README "CLI options" section updated. Assign that explicitly to the doc-writer.

### Step 9: Close the stage

1. **§15 Result**: add a subsection `### 15.<n> Stage <n>, YYYY-MM-DD` with:
   - **Built**: files by package, endpoints, schema version.
   - **Validation**: a command → result table, with the unverified rows included.
   - **Smoke**: what was called and the outcome, or unverified with the reason.
   - **Review**: reviewer runs, finding counts `B/M/m/S`, what was fixed, what was rejected and why, and what was deferred (proposed ISSUE files).
   - **Accepted deviations**: each one with who accepted it and when.
   - **Carried forward**: open items and debts.
2. **§16 START HERE**: rewrite it if the task spans sessions or stages. Cover the current state, which sections are binding and which are history, the next step, and open debts. When §16 is first written, add this line under the task title: `> **Read first:** §16 START HERE — current state, which sections are binding and which are history.`
3. **Stage** only this task's files with explicit paths:
   - the code
   - the tests
   - the task file
   - its `docs/tasks/refs/<task_snake>/` folder
   - the updated docs, `CHANGELOG.md` and `README.md`

   Then run `git status` and confirm that nothing else is staged.
4. **Propose** the branch, the commit and the staged files as the proposal block of `docs/rules/RULE_GIT.md` §4.3:
   - **Commit subject**: plain English in sentence case, no type prefix, no trailing period, at most about 70 characters. Leave out the `(#NNN)`; GitHub appends it on squash merge.
   - **Commit body**: `* ` and a short lowercase phrase per logical change. End with `* update readme/changelog` when `CHANGELOG.md` or `README.md` changed.
   - **Branch name**: `feature/<kebab>` or `fix/<kebab>`. The owner creates it.
5. Set `status: review` and hand over to the owner:
   - the Acceptance table
   - the owner check to perform
   - the unverified commands for the owner or CI to run
   - the questions that really need the owner's decision
6. **The owner commits.** The task is completed (`status: done`, the file moved to `docs/tasks/_old/`, staged) **only when the owner says so**, for example after `/cmd-review` returns `Safe`.

---

## 3. Prompt templates

Fill every `<...>`. Paths are repo-relative. Each subagent already has its role, rules and report format in `.claude/agents/<name>.md`, so a prompt only carries the task-specific inputs.

### 3.1 researcher

```
Research for `<TASK_FILE>` before writing its spec.
Use `.claude/prompts/research.md` with {{TASK_DESCRIPTION}} = <task §1 goal + §3 expected outcome, condensed>.
Focus questions:
1. <e.g. every consumer of `models.FlightRecord.X` in Go and UI, with file:line>
2. <e.g. how settings field Y is defaulted for old settings blobs>
Already known (do not repeat): <brief>.
```

### 3.2 implementer

```
You are implementing work package **<PKG>** of `<TASK_FILE>`.

Read first, in this order: `CLAUDE.md`; `<CONTRACTS_PATH or "no contracts file (single package)">`;
`<TASK_FILE>` §11 Decisions, §12 Spec, §13 Work Packages, §14 Acceptance; `docs/rules/RULE_CODE_STYLE.md`;
`docs/rules/RULE_DEVELOPMENT.md`; `docs/architecture/ARCHITECTURE_<SYSTEM>.md` (§4, §8, §12, §13).

You own exactly these files — nothing else may change:
- new: <paths or "none">
- modified: <paths or "none">

This package delivers (Spec §12 items, exact names):
- <S-item / endpoint / function / component>

Acceptance rows you must satisfy: #<n> <check>; #<m> <check>.

Running in parallel (do not touch their files): <PKG: owned files>. Code they write is defined by
Spec §12.<x> / CONTRACTS §3 — rely on those names, not on their files.
Already in the tree, read-only for you: <contract code the orchestrator pre-wrote, or "nothing">.

Verify as your agent instructions describe and return your report in their exact format.
```

### 3.3 reviewer (spec)

```
Mode: spec.
Review the Spec of `<TASK_FILE>` before implementation: §11 Decisions, §12 Spec, §13 Work Packages, §14 Acceptance.
The confirmed plan is §1–§10; owner decisions are the §11 rows marked "owner". Anything the spec adds beyond them
is scope to flag.
Contracts draft: `<CONTRACTS_PATH or "none">`.
Check every name and assumption against the real code (cite path:line), using your spec-mode checklist.
Return your output format.
```

### 3.4 reviewer (diff)

```
Mode: diff. Area: <backend | frontend | schema | all>.
Task: `<TASK_FILE>` — requirements §1–§10, Decisions §11, Spec §12, Acceptance §14. Contracts: `<CONTRACTS_PATH or "none">`.
Diff: `git diff HEAD -- <paths in your area>`; new untracked files (read in full): <paths>.
Other areas are reviewed by other reviewers: follow calls across the boundary, report findings for your area and
for any contract mismatch at the boundary.
Validation already run by the orchestrator: <command → result; "unverified: ..." rows>.
Deviations reported by implementers: <list, with "accepted by owner <date>" / "pending">.
<Re-review only: previous findings to check — <list>.>
Return your output format.
```

### 3.5 implementer as fixer

```
You are fixer **FIX-<n>** for `<TASK_FILE>` (fixer mode of your agent instructions).
Read first: `CLAUDE.md`; `<CONTRACTS_PATH or "none">`; `<TASK_FILE>` §12 Spec; `docs/rules/RULE_CODE_STYLE.md`;
`docs/rules/RULE_DEVELOPMENT.md`.

You own exactly these files: <paths>.
Fix these findings (each verified by the orchestrator):
1. [<SEVERITY>] <title> — `<path:line>` — <problem> — expected fix: <fix>
2. ...

Fix nothing else. Other fixers in parallel own: <paths>.
Return your report in the exact format, including the Findings table.
```

### 3.6 doc-writer

```
Update the documentation for `<TASK_FILE>`. What was built: <packages → files, endpoints, schemaVersion, from Steps 4–7>;
contracts in §12 Spec.
Today: <YYYY-MM-DD>.
Documents to update: <docs/architecture/ARCHITECTURE_<SYSTEM>.md, ...>.
Changed files: <paths>. See each change with `git diff HEAD -- <file>`; new files: read in full.
Shared files you own in this run: <CHANGELOG.md + the README.md [Unreleased] copy; docs/architecture/SUMMARIES.md;
docs/INDEX.md — or "none">.
CHANGELOG bullets (owner-approved draft; adjust only if the build differs from the plan):
- <New|Update|Fix>: <text>
<Also: README "CLI options" for the new flag -<name> — only if a flag changed.>
Return your report in the exact format.
```
