---
description: "Issue Mode: trace a bug to its root cause, wait for confirmation, then write docs/issues/ISSUE_<NAME>.md"
argument-hint: "<bug description>"
---

You are in **Issue Mode**. Investigate a bug, then save the findings as an issue file.

**Issue:** $ARGUMENTS

If the description above is empty, ask the user for the symptom (what they did, what they saw, what they expected) and stop.

This mode ALWAYS investigates first. It writes exactly one file, and only after the user confirms.

---

## Phase 1: Investigation (mandatory)

1. Read `.claude/prompts/planning.md` and carry out Phase 0 Research for the issue above with the `researcher` agent. Put the symptom text in `{{TASK_DESCRIPTION}}`.
2. **Trace the bug** through the code. Follow the actual path; do not guess it.
   - **Entry point:** the UI action and the page or component, the fetcher in `app/ui/src/util/http/`, the endpoint and the route in `app/routes.go`. Or, for startup and database problems, the code path from `app/main.go`.
   - **Execution path:** handler, then `DBModel` method, then SQL, tables and views, then the response and the UI render. Cover both database engines where they differ.
   - **Failure point:** the exact line where actual behaviour departs from expected behaviour.
3. **Root cause**, with `path:line`, labelled:
   - **Confirmed:** verified in code, with the reasoning.
   - **Suspected:** a hypothesis, with the evidence that would confirm it (data to inspect, log line, request to replay, test to write).
4. **Reproduction conditions:** the data, settings, DB engine (SQLite or MySQL), flags, browser or OS needed to trigger the bug. If any are unknown, say so.
5. Then carry out `planning.md` Phase 1 for the fix. Keep it proportional: for a small bug, sections such as Component Breakdown or Data Model may be a single line or `Not applicable — <reason>`. The draft CHANGELOG line is a `- Fix: ...` line.

**Present in chat:** the Bug Trace table (`| Step | Location (path:line) | What happens |`), the Root Cause, the Reproduction Conditions, the `planning.md` output sections for the fix, and the proposed file name.

**Wait for the user's confirmation.** Do not write anything yet. If the user adds facts or asks for changes, update the investigation and present it again.

**Rules:**
- Do not fix the bug in this mode. Do not modify code.
- Commented-out code is not active behaviour. List only problems visible in code. If something cannot be found, write "Not found in code".

---

## Phase 2: Issue file (only after confirmation)

**Create:** `docs/issues/ISSUE_<SHORT_NAME>.md`

**File name rules:**
- `<SHORT_NAME>` is 3 to 6 words in UPPER_SNAKE_CASE.
- It must be specific: it names the symptom, not the fix (`ISSUE_NIGHT_TIME_WRONG_ACROSS_MIDNIGHT`, not `ISSUE_LOGBOOK_BUG`).
- It must not collide with an existing file in `docs/issues/` or `docs/issues/_old/`. Check before writing.

**Structure:** copy the structure of `docs/issues/_TEMPLATE.md` exactly. The template is the only source of the section list. If it is missing, tell the user and stop. Do not invent a structure.

**Filling it:**
- Frontmatter: `status: open` (allowed values are `open | in_progress | review | done`), `created:` today's date, `version:` the current value of the `version` const in `app/main.go` (unless the user reported a different version), and `systems:` as IDs from the "System IDs" line of `docs/architecture/SUMMARIES.md` (for example `[LOGBOOK, PDF_EXPORT]`), never display names. Fill every other frontmatter field the template defines.
- Delete the template's frontmatter-hint comment (the `<!-- ... -->` block under the frontmatter) and replace the hint comments of §1 to §10 with content. §11 Result keeps its hint comment until the issue is closed.
- Fill the sections from the confirmed investigation with this map. Every claim about the code keeps its `path:line` reference:

  | Investigation item | Issue file section |
  |---|---|
  | The symptom: what goes wrong, for whom, how bad | §1 Problem Description |
  | The Bug Trace table (columns Step, Location (path:line), What happens) | §2 Current Behavior |
  | The expected behaviour, and the User-Facing Impact of the fix | §3 Expected Behavior |
  | The Reproduction Conditions | §4 Reproduction Conditions |
  | The affected systems with their `ARCHITECTURE_*.md` (Proposed Architecture) | §5 Affected Systems |
  | Integration Points and Impact Analysis | §6 Dependency Map |
  | The root cause: one row per hypothesis (H1, H2, ...), most likely first, each labelled Confirmed or Suspected | §7 Root Cause Hypothesis table |
  | Risks & Edge Cases, and Migration & Compatibility | §8 Risks |
  | Assumptions; open questions as `Open question: <question>` items | §9 Assumptions |
  | The fix: investigation steps first if the cause is Suspected, then Component Breakdown, Data Model, Complexity & Risk, the draft `- Fix:` line, and, when the fix spans more than one file, the file-disjoint work-package table (columns Pkg, Goal, New files, Modified files, Depends, Validation) | §10 Proposed Investigation / Fix Steps |

- A section that genuinely does not apply gets `Not applicable — <one-line reason>`.

**Rules:**
- Write only this one file. Do not change code or other docs. Do not commit.

**Finish** by reporting the file path and suggesting the next steps:
- To plan and run the fix: `/cmd-task "Fix docs/issues/ISSUE_<SHORT_NAME>.md"`, then `/cmd-implement` on the resulting task file.
- After the fix: `/cmd-review docs/issues/ISSUE_<SHORT_NAME>.md`.
