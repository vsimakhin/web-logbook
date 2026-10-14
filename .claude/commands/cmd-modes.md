---
description: "Help Mode: list the workflow commands, the subagents and the existing architecture docs"
argument-hint: ""
---

You are in **Help Mode**. Show the available workflow commands, the subagents, and the existing architecture docs.

**Arguments:** $ARGUMENTS (this command takes no arguments; if any are given, ignore them and show the full screen).

**Rules:**
- Do NOT create, edit or delete any file.
- Do NOT read the contents of the architecture docs. List their file names only.
- Keep the output structured and readable.

---

## Output

### 1. Workflow commands

| Command | Purpose | Writes | Gate before writing |
|---|---|---|---|
| `/cmd-plan <task description>` | Research and a structured plan in chat | nothing | — |
| `/cmd-task <task description>` | Plan a change, then save it as a task file | `docs/tasks/TASK_<NAME>.md` | yes, after the plan |
| `/cmd-issue <bug description>` | Trace a bug to its root cause, then save it as an issue file | `docs/issues/ISSUE_<NAME>.md` | yes, after the investigation |
| `/cmd-question <question>` | Read-only factual answer with `path:line` references | nothing | — |
| `/cmd-retro [task file path]` | Retrospective of a completed task from five roles | nothing (proposes doc fixes, applies them only after confirmation) | — |
| `/cmd-modes` | This help screen | nothing | — |
| `/cmd-implement <path to docs/tasks/TASK_*.md>` | Orchestrated implementation: spec, then parallel implementers, then review, then docs | code and task-file sections | yes (spec gate) |
| `/cmd-review [docs/tasks/TASK_*.md or docs/issues/ISSUE_*.md]` | Independent review of the changes against their task or issue | nothing (offers fixes, ISSUE files or task closure) | — |
| `/cmd-architecture <system name>` | Generate an architecture doc for a system from its code | `docs/architecture/ARCHITECTURE_<SYSTEM>.md`, plus `SUMMARIES.md` and `docs/INDEX.md` rows | yes |
| `/cmd-architecture-sync <days>` | Refresh existing architecture docs from the commits of the last N days | updates existing architecture docs | no |

**Typical flows:**
- Feature: `/cmd-plan` (optional), then `/cmd-task`, then `/cmd-implement`, then `/cmd-review`, then `/cmd-retro`
- Bug: `/cmd-issue`, then `/cmd-task` for the fix, then `/cmd-implement`, then `/cmd-review`
- Understanding code: `/cmd-question`. Thinking a change through without saving it: `/cmd-plan`

Next, glob `.claude/commands/cmd-*.md`. If a command file exists that is not in the table, or a table row has no file, add a one-line warning under the table.

### 2. Subagents (`.claude/agents/`, all run on Opus)

| Agent | Tools | Role | Used by |
|---|---|---|---|
| `researcher` | read-only | Produces a Research Brief (at most 300 lines, format of `.claude/prompts/research.md`) | `/cmd-plan`, `/cmd-task`, `/cmd-issue`, `/cmd-question`, `/cmd-implement` (step 1) |
| `implementer` | all | Implements one work package; touches only the files it owns; never stages or commits | `/cmd-implement`, `/cmd-review` (fix rounds) |
| `reviewer` | read-only, may run tests and vet | Independent review of a spec or a diff; findings `BLOCKER/MAJOR/MINOR/SUGGESTION`, each `Confirmed` or `Suspected` with `path:line` | `/cmd-implement`, `/cmd-review` |
| `doc-writer` | all, never touches code | Updates architecture docs, `SUMMARIES.md`, `docs/INDEX.md`, and the `CHANGELOG.md` `[Unreleased]` section with its copy in `README.md` | `/cmd-implement`, `/cmd-architecture-sync` |

### 3. Architecture docs

Glob `docs/architecture/ARCHITECTURE_*.md` and list:
- the file names only, sorted alphabetically (do NOT read their contents)
- the total count
- whether `docs/architecture/SUMMARIES.md` exists (it routes the `researcher` to the right docs)

If no architecture docs exist, say so and suggest `/cmd-architecture <system name>`.
