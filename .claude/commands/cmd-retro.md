---
description: "Retro Mode: retrospective of a completed task from five roles; proposes doc fixes and applies them only after confirmation"
argument-hint: "[task file path]"
---

You are in **Retro Mode**. Run a workflow retrospective of a completed task.

**Task to analyze:** $ARGUMENTS

If no path is given, use the task worked on in this session. If that is unclear, ask which `docs/tasks/TASK_*.md` or `docs/issues/ISSUE_*.md` file to analyze (it may already be in `_old/`).

**Goal:** find out what information each role had, what was missing, and what slowed the work down. Then turn that into concrete documentation and workflow fixes.

**Rules:**
- Do NOT modify code.
- You may propose documentation changes, but **ask before applying any of them**.
- Base every finding on facts: this session's history, the task file (its decisions, work packages, acceptance and result sections), review findings, and read-only git (`git log`, `git show`, `git diff --stat`). Do not invent hypothetical problems.

---

## Analyze from five perspectives

### 1. Analyst
- Which `docs/architecture/ARCHITECTURE_*.md` docs were read, and which were skipped? Did `docs/architecture/SUMMARIES.md` route the researcher to the right systems?
- Was the Research Brief accurate and sufficient, or did it miss systems or facts?
- Were cross-system dependencies visible from the docs alone? Was the problem statement clear enough to scope the work?
- **Output:** docs that helped, docs that were missing or insufficient, information gaps.

### 2. Planner
- Did the docs hold enough detail to design the solution without reading code?
- Were fragile zones discoverable from §11 Known Issues and §13 Gotchas?
- Was Migration & Compatibility right (`schemaVersion`, SQLite and MySQL, existing databases, settings JSON)?
- What did the plan miss that was caught later? What was the root cause of each miss?
- **Output:** what the plan got right, what it missed, and why.

### 3. Developer (`implementer`)
- What information was needed during implementation that was not in the docs?
- Were the conventions clear from `docs/rules/RULE_CODE_STYLE.md`, `docs/rules/RULE_DEVELOPMENT.md` and the §12 Rules for Future Development recipes?
- **Output:** a list of "had to search the code for X" items, each noting whether a doc could have prevented it.

### 4. Reviewer (`reviewer`)
- Did the review catch every issue, or did problems surface later?
- Did the docs help during review, or was raw code reading required?
- **Output:** findings that docs would have caught earlier.

### 5. Orchestrator (main session running `/cmd-implement`)
- Were the work packages really file-disjoint? Did any package touch files outside its ownership, or collide with another?
- How many review and fix rounds were needed, and what triggered each one?
- What did validation miss (`go vet ./...`, `make test`, `npm run lint`, `npm run test:run`, manual checks on both DB engines or the PDF output)?
- Which subagent hand-backs needed rework (incomplete report, unverified claims, wrong files, contract drift), and why?
- Did the spec gate and the contracts prevent problems, or did they let some through?
- **Output:** process gaps, each with the step where it could have been caught.

---

## Output structure

1. **Task Timeline Summary**: commands used in order, key decisions, number of review and fix rounds.
2. **Documentation Audit**: one subsection per role above.
3. **Information Gap Table:**

   | Gap | Role Affected | How Discovered | Proposed Doc Fix |
   |---|---|---|---|

4. **Proposed Documentation Changes**: a numbered list. Each item gives the exact file path and section, and the change as draft text. Targets can be `docs/architecture/*`, `docs/rules/*`, `docs/guides/*`, the templates, `.claude/prompts/*`, `.claude/commands/*`, `.claude/agents/*` or `CLAUDE.md`.
5. **Workflow Observations**: what to change about the process itself (commands, gates, agent roles, validation).

---

## After the report

Ask the user which proposed changes to apply: all of them, a numbered subset, or none. Apply only the confirmed ones. When you edit a `docs/architecture/ARCHITECTURE_*.md` file, update its **Last Updated** line. Never modify code. Never commit.
