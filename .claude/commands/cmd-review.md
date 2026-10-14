---
description: "Review Mode: independent review of completed work against its task or issue, via reviewer agents, with every BLOCKER/MAJOR verified by the main session"
argument-hint: "[docs/tasks/TASK_*.md or docs/issues/ISSUE_*.md]"
---

You are in **Review Mode**. This is a post-implementation review of completed work.

**What to review:** $ARGUMENTS

**Rules:**
- Do NOT modify any code or doc during the review itself. Fixes happen only after the verdict, with the owner's confirmation.
- Base every finding on actual code, not assumptions. Each one cites a repo-relative `path:line` and is labelled **Confirmed** (verified in code, with reasoning) or **Suspected** (with the evidence that would confirm it).
- Anti-hallucination rules:
  - **A**: commented-out code is not active behaviour.
  - **B**: attribute behaviour only to the exact function or component that implements it.
  - **C**: no fabricated issues.
  - **D**: group functions by the file or type that owns them.
- Do not run `make test` (it runs `go fmt` and rewrites files), `make build_ui` or `npm install` during the review. The `reviewer` agents run read-only checks.

---

## Questions & Alternatives (always active)

- If anything is unclear (the review scope, which changes to include, which task or issue the work belongs to), **ask the owner**. Never guess silently, and never cover a doubt with an assumption.
- If you see a better approach than the one implemented (simpler, safer, or a better fit with the existing architecture), **record it as a finding** (`SUGGESTION` or higher). Do not stay silent about it.

---

## Process

### 1. Scope

1. If `$ARGUMENTS` names a task or issue file, read it fully.
   - **Task file**: requirements (§1 to §10), §11 Decisions, §12 Spec, §14 Acceptance and §15 Result if present. Also read its `docs/tasks/refs/<task_snake>/CONTRACTS.md` if one exists.
   - **Issue file**: an issue has no Decisions, Spec or Acceptance; they live in its fix task, created by `/cmd-task "Fix docs/issues/ISSUE_<NAME>.md"`. Find that task with `grep -rl --include='TASK_*.md' 'docs/issues/ISSUE_<NAME>.md' docs/tasks` (this covers `docs/tasks/_old/`). Read the fix task as above, with its contracts file, and use it for requirement coverage and as `<TASK_FILE>` in the review prompt. Take the reproduction from the issue's §4 Reproduction Conditions and the root cause from its §7 Root Cause Hypothesis. If no fix task or more than one is found, ask the owner which task holds the fix. If the owner confirms there is none, review against the issue's §3 Expected Behavior and §10 Proposed Investigation / Fix Steps.
2. Identify the changes:
   - **Uncommitted work**: `git status --porcelain`, `git diff HEAD --stat`, and the untracked files.
   - **A branch**: `git log --oneline main..HEAD` and `git diff main...HEAD --stat`.

   If both exist, or it is unclear which changes belong to the task, ask the owner.
3. With no argument and no changes to review, ask what to review. Stop.
4. Read the `docs/architecture/ARCHITECTURE_*.md` of every affected system (§4 of the task, or the systems that own the changed files, via `docs/architecture/SUMMARIES.md`).

### 2. Launch reviewers

- **Small diff** (roughly up to 600 changed lines in one area): one `reviewer` agent, area `all`.
- **Large diff**: one `reviewer` per area, all launched **in parallel in a single message**:
  - **backend**: `app/*.go`, `internal/models/`, `internal/{nighttime,pdfexport,utils}/`
  - **frontend**: `app/ui/src/**`
  - **schema**: `internal/driver/**`, struct and JSON-tag changes in `internal/models/structs.go`, migrations

  Leave out areas the diff does not touch.
- Use the diff-review prompt template in `.claude/prompts/orchestration.md` §3.4. Give each reviewer the task file as `<TASK_FILE>` (for an issue, its fix task, plus the issue path for the reproduction and root cause), the contracts path, the exact diff command, the list of new files, and any validation results you already have.

### 3. Consolidate (the main session itself)

1. **Deduplicate.** One root cause becomes one finding, at the highest severity reported, with every location listed.
2. **Verify every `BLOCKER` and `MAJOR` personally.** Open the cited `path:line` and trace the claim.
   - If it holds, keep it and record that you verified it.
   - If it does not hold, reject it, and list it under "Rejected findings" with the reason.
   - If you cannot decide, keep it as `Suspected` and state the evidence that would settle it.
3. Sort the findings by severity, from `BLOCKER` to `MAJOR`, `MINOR` and `SUGGESTION`.

---

## Output structure

1. **Audit Summary**: what was reviewed (the files and diff base, the task or issue), how many reviewers covered which areas, and the commands run with their results. List the commands that could not run as `unverified: <command> — <reason>`.
2. **Requirement Coverage**: a table of requirement, Spec item or Acceptance row, then status (met, partial, missing) and evidence.
3. **Architecture Compliance**: whether the change follows the project's patterns. Check the handler `handleError` + `return` pattern, the routes inside the `app.Auth` group, `DBModel` access, the per-engine schema with the `schemaVersion` bump, the query hooks with their invalidation, `docs/rules/RULE_CODE_STYLE.md`, and the "Rules for Future Development" of the affected architecture docs.
4. **Risk Assessment**: the risks the change introduces: data and migration on existing SQLite and MySQL databases, settings compatibility, auth, caches, and the API contract.
5. **Edge Cases**: uncovered edge cases, each with the input that triggers it.
6. **Performance**: N+1 queries, heavy GET responses without `Compress`, needless UI refetching, or "no concerns".
7. **Documentation Consistency**:
   - `CHANGELOG.md` `[Unreleased]` and its identical copy in `README.md`
   - the README "CLI options" section, if flags changed
   - the affected `ARCHITECTURE_*.md` and `SUMMARIES.md`
   - the task file's Result section
8. **Findings**: severity, title, `path:line`, Confirmed or Suspected, problem, impact and fix. Then **Rejected findings**, each with its reason.
9. **Questions & Alternatives**: open questions for the owner, and better approaches.
10. **Final Verdict**: `Safe`, `Needs Fix` or `Risky`, with a justification.
    - `Safe`: no `BLOCKER` or `MAJOR`.
    - `Needs Fix`: `BLOCKER` or `MAJOR` findings, each with a clear, local fix.
    - `Risky`: a design-level problem, or a decision only the owner can make.

---

## After the verdict

- **`BLOCKER` or `MAJOR` findings:** offer the owner a choice and **wait for the decision**.
  1. **Fix now.** Launch `implementer` agents as fixers, using the template in `.claude/prompts/orchestration.md` §3.5. The fixers are file-disjoint and run in parallel, and each one gets only verified findings. Then re-validate following `.claude/prompts/orchestration.md` Step 5, and re-review the fix diff with the previous findings attached. Allow at most 2 fix rounds, then escalate to the owner.
  2. **Create issue files.** Propose one `docs/issues/ISSUE_<SHORT_NAME>.md` per independent problem, built from `docs/issues/_TEMPLATE.md`, and list the proposed file names. Write them **only after the owner confirms**.
- **`MINOR` and `SUGGESTION` findings:** list them, and offer to include them in the fix round or in an issue file.
- **`Safe`, and a task or issue file was reviewed:** propose completing it. Do this **only after the owner confirms**:
  1. Set the frontmatter to `status: done`, and fill in the Result section if it is missing (a task's §15 Result, an issue's §11 Result). **For an issue, close its fix task too:** set `status: done` on both files, fill the issue's §11 Result (confirmed root cause with `path:line`, files changed, test added, how it was verified, the changelog bullet, the date), and check that the task's §15 Result is complete. A fix task that is already in `docs/tasks/_old/` stays where it is.
  2. Move each closed file with a plain `mv`: a task to `docs/tasks/_old/`, an issue to `docs/issues/_old/`. Do not use `git mv`: `docs/rules/RULE_GIT.md` allows only `git add`.
  3. Stage the old path (the deletion) and the new path of every moved file (four paths when an issue and its fix task are both moved), and the task's other files, all with explicit paths. Check `git status` to confirm that nothing else is staged.
  4. Give the proposal block from `docs/rules/RULE_GIT.md` §4.3: the branch (`feature/<kebab>` or `fix/<kebab>`, if the work is not on a branch yet), the commit message in the owner's style, and the staged files.

  The owner commits.
