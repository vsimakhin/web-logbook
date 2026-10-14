---
description: "Task Mode: plan a change, wait for confirmation, then write docs/tasks/TASK_<NAME>.md"
argument-hint: "<task description>"
---

You are in **Task Mode**. Plan a change, then save it as a task file.

**Task:** $ARGUMENTS

If the task above is empty, ask the user what to plan and stop.

This mode ALWAYS plans first. It writes exactly one file, and only after the user confirms.

---

## Phase 1: Planning (mandatory)

0. If the task above names a `docs/issues/ISSUE_*.md` file (the issue flow: `/cmd-task "Fix docs/issues/ISSUE_<NAME>.md"`), read that issue file fully first. Its symptom, reproduction (§4), root cause (§7) and fix steps (§10) are part of the task text you plan from.
1. Read `.claude/prompts/planning.md` and carry out its instructions for the task above: Phase 0 Research with the `researcher` agent, then Phase 1 Planning.
2. Present the full plan in chat, with every output section of `planning.md`, plus the proposed file name (see Phase 2).
3. **Wait for the user's confirmation.** Do not write anything yet. If the user asks for changes, revise the plan and present it again. Repeat until they confirm.

---

## Phase 2: Task file (only after confirmation)

**Create:** `docs/tasks/TASK_<SHORT_NAME>.md`

**File name rules:**
- `<SHORT_NAME>` is 3 to 6 words in UPPER_SNAKE_CASE.
- It must be specific: it names the actual change (`TASK_PDF_EXPORT_CUSTOM_FIELDS`, not `TASK_EXPORT_UPDATE`).
- It must not collide with an existing file in `docs/tasks/` or `docs/tasks/_old/`. Check before writing.

**Structure:** copy the structure of `docs/tasks/_TEMPLATE.md` exactly. The template is the only source of the section list. If it is missing, tell the user and stop. Do not invent a structure.

**Filling it:**
- Frontmatter: `status: open` (allowed values are `open | in_progress | review | done`), `created:` today's date, `version:` the current value of the `version` const in `app/main.go`, and `systems:` as IDs from the "System IDs" line of `docs/architecture/SUMMARIES.md` (for example `[LOGBOOK, DATABASE]`), never display names. Fill every other frontmatter field the template defines.
- Delete the template's frontmatter-hint comment (the `<!-- ... -->` block under the frontmatter). Replace the hint comments of §1 to §10 with content.
- Keep the commented LIVING-TASK SECTIONS (§11 to §16) at the end of the file exactly as the template has them, still commented. `/cmd-implement` uncomments and fills them.
- Fill §1 to §10 from the confirmed plan with this map. Carry every item over without shortening it; every claim about the code keeps its `path:line` reference:

  | Plan section (`planning.md` output) | Task file section |
  |---|---|
  | 1. Feature Overview, and the Goals of 3. Goals & Non-Goals | §1 Goal Description |
  | How it works today, from the Research Brief (Architecture Context, Key Files) | §2 Current State |
  | 2. User-Facing Impact, including the draft CHANGELOG line(s) | §3.1 User-facing impact |
  | 5. Component Breakdown and 6. Data Model | §3.2 Technical outcome |
  | The Non-Goals of 3. Goals & Non-Goals | §3.3 Non-goals |
  | 4. Proposed Architecture | §4 Affected Systems |
  | 8. Integration Points | §5 Dependency Map |
  | 7. Migration & Compatibility | §6, as a `**Migration & Compatibility:**` paragraph at the top |
  | 9. Risks & Edge Cases | §6 Risks & Edge Cases, after that paragraph |
  | 10. Impact Analysis | §7 Impact Analysis |
  | 11. Assumptions: the assumptions | §8 Assumptions |
  | 11. Assumptions: the open questions | §9 Open Questions |
  | 12. Complexity & Risk, then 13. Implementation Phases with its work-package table (columns Pkg, Goal, New files, Modified files, Depends, Validation) | §10 Proposed Next Steps |

  `/cmd-implement` builds §13 Work Packages from the §10 work-package table, so keep that table complete and file-disjoint.
- A section that genuinely does not apply gets `Not applicable — <one-line reason>`.
- Record each decision the user made at the confirmation gate in §9 Open Questions as answered: `Answered: <choice> — owner, YYYY-MM-DD`. Questions that are still open stay in §9 without an answer. Keep §11 Decisions commented; `/cmd-implement` Step 2.1 copies the answered §9 items into §11 as owner rows.
- Link the affected `docs/architecture/ARCHITECTURE_*.md` docs by their exact file names.
- If the task fixes an issue file, link it by its full path (`docs/issues/ISSUE_<NAME>.md`) in §1. `/cmd-review docs/issues/ISSUE_<NAME>.md` finds the fix task through this link.

**Rules:**
- Write only this one file. Do not change code or other docs. Do not commit.
- Do not create `docs/tasks/refs/...` contracts here. Contracts for multi-package work belong to the `/cmd-implement` spec stage.

**Finish** by reporting the file path and suggesting the next step:

```
/cmd-implement docs/tasks/TASK_<SHORT_NAME>.md
```
