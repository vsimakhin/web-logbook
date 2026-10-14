---
status: open
priority: medium
created: YYYY-MM-DD
version: X.Y.Z
systems: []
---

<!--
Template for docs/issues/ISSUE_<NAME>.md (UPPER_SNAKE name), written by /cmd-issue after the user confirms.
Frontmatter:
  status:   open | in_progress | review | done   (nothing else)
  priority: low | medium | high
  created:  date the file was written, YYYY-MM-DD
  version:  app version the bug was seen in — the `version` const in app/main.go, or `web-logbook -version`
  systems:  system IDs from the "System IDs" line of docs/architecture/SUMMARIES.md, never display names:
            APPLICATION, DATABASE, AUTH, SETTINGS, LOGBOOK, STATS_AND_MAP, PERSONS, AIRCRAFT_AIRPORTS,
            CURRENCY_LICENSING, PDF_EXPORT, IMPORT, FRONTEND — e.g. [LOGBOOK, PDF_EXPORT]
Evidence: every claim about the code carries `path:line` (repo-relative, no leading ./). List only problems visible
in code or reproduced; label each cause Confirmed (with the reasoning) or Suspected (with what would confirm it).
Commented-out code is not active behaviour.
Fix flow: /cmd-task "Fix docs/issues/ISSUE_<NAME>.md" writes the fix task (it links this file in its §1), then
/cmd-implement on that task, then /cmd-review docs/issues/ISSUE_<NAME>.md, which reviews against the fix task.
Closing: fill §11 Result, set status: done and move the file to docs/issues/_old/ (the fix task is closed with it).
When writing the file: replace the hint comments of §1 to §10 with content (fill the tables and the CHANGELOG line
outside the comments; delete the §10 work-package table when the fix touches one file) and delete this comment.
§11 Result keeps its hint comment until the issue is closed.
-->

# ISSUE: <one-line symptom, as the user sees it>

## 1. Problem Description

<!-- What goes wrong, for whom, how often, how bad (wrong totals in the logbook or PDF, data loss, crash, cosmetic).
Link the GitHub issue if there is one. -->

## 2. Current Behavior

<!-- What happens now, step by step, as the Bug Trace table below: entry point (UI action, page or component, fetcher
in app/ui/src/util/http/, endpoint and route in app/routes.go; or the startup path from app/main.go), then handler,
DBModel method, SQL, tables and views, response and UI render, down to the failure point where actual behaviour
departs from expected. Cover both DB engines where they differ. Quote the exact error text from the UI notification,
the browser console or weblogbook-output.log. -->

| Step | Location (path:line) | What happens |
|---|---|---|
| 1 | <path:line> | <what happens> |

## 3. Expected Behavior

<!-- What should happen instead, and what the pilot sees after the fix (User-Facing Impact). -->

## 4. Reproduction Conditions

<!-- Minimal steps from a known state. Record:
- app version and how it was run (binary, Docker, make start_backend);
- DB engine (sqlite / mysql) and whether the DB was upgraded from an older version (schemaVersion);
- relevant settings (time and date display formats, authentication on/off), browser;
- the data needed (a sample flight record, CSV file or KML track; never real personal data);
- reproduced: yes / no / intermittent. -->

## 5. Affected Systems

<!-- One line per system: docs/architecture/ARCHITECTURE_<SYSTEM>.md and the part involved. -->

## 6. Dependency Map

<!-- What calls the faulty code and what consumes its output (e.g. the logbook view feeding stats, map and PDF export;
query keys that cache the wrong data). -->

## 7. Root Cause Hypothesis

<!-- One row per hypothesis, most likely first. -->

| # | Hypothesis | Evidence (`path:line`) | Status | What would confirm or refute it |
|---|---|---|---|---|
| H1 | <cause> | <file:line and the reasoning> | Confirmed / Suspected | <test, log line, query, breakpoint> |

## 8. Risks

<!-- Risks of the fix: existing user data that already holds wrong values (does it need a migration?), SQLite vs MySQL
differences, other callers of the same function, external API users, PDF/CSV output changes. -->

## 9. Assumptions

<!-- What is taken as true without proof. Open questions as `Open question: <question>` items. -->

## 10. Proposed Investigation / Fix Steps

<!-- Ordered. Investigation first if the cause is Suspected; then the fix: the files to touch (Component Breakdown,
Data Model), Complexity & Risk, a regression test (Go `*_test.go` or vitest `*.test.jsx`), and verification with the
CI parity sequence (docs/guides/HOWTO_DEVELOPMENT.md §6). When the fix spans more than one file, fill the
file-disjoint work-package table below (no file in two rows; the fix task's §10 starts from it); otherwise delete
the table. -->

**Draft CHANGELOG line** (under `## [Unreleased]` in `CHANGELOG.md` and its copy in `README.md`): `- Fix: <what the pilot no longer sees>`

| Pkg | Goal | New files | Modified files | Depends | Validation |
|---|---|---|---|---|---|
| P1 | <goal> | <new paths or —> | <modified paths or —> | — | <test, go vet ./..., make test, npm run lint, manual check> |

## 11. Result

<!-- Filled when the issue is closed: the fix task (docs/tasks/_old/TASK_<NAME>.md), confirmed root cause
(`path:line`), files changed, test added, how it was verified, changelog bullet, date. If closed without a fix,
say why. -->
