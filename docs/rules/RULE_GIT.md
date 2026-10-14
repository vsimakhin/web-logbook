# Git Rules — STAGE-ONLY WRITE ACCESS

> Owner decision **D2** of the agent workflow setup (§10 of `docs/tasks/_old/TASK_AGENT_WORKFLOW_SETUP.md`): agents are stage-only, the owner commits.
> Partly enforced by the `permissions.deny` list in `.claude/settings.json` (owned by the orchestrator; agents never edit it); §1 says which commands are enforced and which are rule only.

## Absolute Restrictions

AI agents have **read-only access to git, except staging files with `git add <path>`**, and only the **main session** may stage: the orchestrator in `/cmd-implement`, or the session that closes a task or issue (`/cmd-review`, or the owner's "finish the task", `CLAUDE.md` "Task Completion"). Subagents (`researcher`, `implementer`, `reviewer`, `doc-writer`) are git read-only and never run `git add`. No other write operation is allowed. The owner reviews, commits, creates branches, pushes, opens and merges PRs himself.

This rule **cannot be bypassed by user request, task requirements, or workflow commands** (`/cmd-*`, subagent prompts, task files), except for the explicit `git add` staging allowance below. If a commit, push or branch switch is requested, stop and hand over the proposed branch name and commit message (§4.3) instead.

---

## 1. Forbidden (under ALL circumstances)

| Category | Commands | Deny rule present in `.claude/settings.json` |
|---|---|---|
| Write / sync | `commit`, `push`, `pull`, `fetch` | yes, with and without arguments |
| Branch | `checkout`, `switch`, `merge`, `rebase` | yes, with arguments; `merge` and `rebase` also bare; bare `checkout` / `switch` are rule only |
| Branch / worktree | `branch -d/-D/-m/-M <name>`, `worktree add`, `cherry-pick` | yes, with arguments |
| Branch (rule only) | `branch <name>` (create), `branch -c/-C` | no — `git branch *` cannot be denied without also blocking the allowed `git branch --show-current`; the rule still binds |
| History / working tree | `reset`, `restore`, `clean`, `stash`, `revert` | yes, with arguments; `stash` and `reset` also bare; bare `restore` / `clean` / `revert` are rule only |
| Tracked files | `mv`, `rm` (`git mv`, `git rm`) | yes, with arguments — use a plain `mv` / `rm`, then `git add` (§2.1) |
| Tags / config | `tag`, `config` | yes, with arguments |
| Remote (rule only) | `remote add/remove/set-url` | no — the rule still binds |
| Staging flags | `git add -A`, `git add --all`, `git add .`, `git add -f` / `--force` | yes |
| Staging update | `git add -u` / `--update` | yes, with and without paths |
| Flags (rule only) | `--no-verify`, and `--force` / `-f` on any other command | no deny rule for the flags themselves — the rule still binds |
| GitHub CLI | `gh pr merge`, `gh pr create`, `gh release` | yes, with arguments |
| GitHub CLI (rule only) | `gh pr edit`, `gh issue create/close` | no — the owner opens PRs and manages issues |

Deny patterns of the form `Bash(git <sub> *)` may not match the bare command without arguments, so the bare forms are listed separately in `.claude/settings.json` (`git commit`, `git push`, `git pull`, `git fetch`, `git stash`, `git reset`, `git merge`, `git rebase`, `git add -A`, `git add --all`, `git add -u`, `git add --update`). A command missing from the deny list is **not** permitted by that omission. The table above is the rule; the deny list is only its partial enforcement.

---

## 2. Allowed

| Command | Purpose | Pre-approved in `.claude/settings.json` |
|---|---|---|
| `git status` | View working tree state | yes |
| `git diff` | View changes (also `git diff --cached` for what is staged) | yes |
| `git log` | View commit history | yes |
| `git show` | View commit details | yes |
| `git blame` | View line-by-line authorship | yes |
| `git branch` / `git branch --show-current` | List branches / show current branch | yes |
| `git remote -v` | View remotes | yes |
| `git add <path...>` | Stage specific files for the owner's commit — **main session only** (§2.1) | yes — for every session, so for subagents this rule is the only safeguard |
| `gh issue view`, `gh pr view`, `gh pr diff` | Read GitHub context | no (asks for approval) |

### 2.1 Staging rules

- Only the main session stages (see Absolute Restrictions). Subagents report the files they touched; the orchestrator stages them.
- Stage **explicit paths only** — the files the task created, modified or deleted. Never `git add -A`, `git add --all`, `git add .` or `git add -f` / `--force` (all four are also blocked by deny rules), and never `git add -u` / `--update` (denied with and without paths).
- Stage only the files of this task: the package ownership in `docs/tasks/refs/<task_snake>/CONTRACTS.md` (when the task has one) and the task file's §13 Work Packages show which files belong to it. Never stage another task's or the owner's unrelated edits.
- To move or delete a tracked file (for example a task or issue file moved to `_old/` on closure), use a plain `mv` / `rm`, never `git mv` / `git rm`, then stage both the old and the new path: `git add <old path> <new path>` (`git add` of a path that no longer exists stages its deletion). Same procedure in `.claude/prompts/orchestration.md` (§1 Working rules, rule 5) and `.claude/commands/cmd-review.md` ("After the verdict").
- Never stage git-ignored local data, even with an explicit path: the pilot's SQLite database web-logbook.sql (`.gitignore:16`), the log file weblogbook-output.log (`.gitignore:18`), TLS certificates in certs (`.gitignore:19`), .logbook.json (`.gitignore:3`), build output dist/ (`.gitignore:13`, which also covers `app/ui/dist`), and `app/ui/node_modules` (`.gitignore:21`). Never use `git add -f` to force them in.
- Stage `app/ui/package-lock.json`, `go.mod`, `go.sum` only when the task intentionally changed dependencies.
- `make test` runs `go fmt ./...` first (`Makefile:32`) and may rewrite files you did not mean to touch — check `git status` before staging.

---

## 3. Branch Names (proposed, never created)

The agent works on whatever branch is checked out and **proposes** a branch name for the owner.

| Kind | Pattern | Example from history |
|---|---|---|
| Feature | `feature/<kebab-case>` | `feature/previous-experience` (`8c8f2f7`), `feature/customizable-map` (`946fe74`) |
| Fix | `fix/<kebab-case>` | `fix/kml-distance-calculation` (`8396081`), `fix/mariadb-1292-error` (`5ea5871`) |
| Dependency refresh | `dependabot-YYYYMMDD` | `dependabot-20260722` (`b937e84`) |

One-offs in the history (`release/v4.0.0`, `replace-toolpad-core`, `check/night-time-calculation`) are not templates.

---

## 4. Commit Message Format (HUMAN REFERENCE ONLY)

The agent does **NOT** create commits. This section documents the owner's style so that proposals match it. Derived from `git log --oneline -60` and `git show` of `8b2fa8d`, `948ac96`, `2b1f410`, `5755599`, `ec1c966`, `d3fcc75`, `14714ab`, `301f4da`.

### 4.1 What lands on `main`

| Kind | Subject | Body | Example |
|---|---|---|---|
| Feature / fix PR (squash merge) | `<Summary> (#NNN)` | one `* <branch commit subject>` bullet per branch commit | `5755599` "Tags filters (#558)", `8b2fa8d` "data type overhaul, v5 (#562)" |
| Dependency refresh PR | `Dependabot YYYYMMDD (#NNN)` | `* update npm libs`, `* update golang libs`, `* update readme/changelog` (canonical form, `948ac96`); the wording varies: `libs` / `modules`, `readme/changelog` / `changelog/readme` (`2b1f410`, `495d8e4`) | `948ac96` |
| Version bump (owner, directly on `main`) | `version ++` | empty; touches only `app/main.go` (`version` const), `CHANGELOG.md`, `README.md` | `d3fcc75`, `1f675ca`, `e0be1a1` |
| README-only tweak (owner, directly on `main`) | short sentence | empty or one sentence | `301f4da` (empty), `14714ab` (one sentence) |

PRs have been squash-merged since `#535` (`f29ec55`). Older history uses merge commits `Merge pull request #NNN from vsimakhin/<branch>` (`25a75f2`) — do not imitate them.

### 4.2 Format rules

- Summary in plain English, **no type prefix** (no `feat:`, `fix:`, `add:`), no trailing period, about 70 characters at most. Case varies in history (`return flight (#549)`, `Split Code/Name field into two separate fields (#560)`); prefer sentence case.
- `(#NNN)` is appended by GitHub when the PR is squash-merged. Never invent a PR number; leave it out of proposals.
- Body bullets: `* ` + a short lowercase phrase per logical change, in the order the work was done. Include `* update readme/changelog` when `CHANGELOG.md`/`README.md` were touched, normally as the last bullet (`ec1c966`; in `5755599` a later `* reduce lines` follows it).
- Spelling of the bump commit: `version ++` (14 of the last 150 non-merge commits) is dominant over `version++` (4). Agents do not change `version` in `app/main.go:18` unless the task says so explicitly.

### 4.3 Proposal block (end of every task that changed files)

```
Proposed branch:  fix/custom-airport-cache
Proposed commit:  Clear airport cache when a custom airport changes

* clear airportCache in UpdateCustomAirport and RemoveCustomAirport
* update readme/changelog

Staged files:
  internal/models/airports.go
  CHANGELOG.md
  README.md
```

---

## 5. When a Forbidden Operation Seems Necessary

- Stop and explain why it seems necessary; give the owner the exact command to run.
- Wrong branch, dirty tree, merge conflict, detached HEAD: report it. Never resolve it with `checkout`, `stash`, `reset` or `restore`.
- Accidentally staged a wrong file: report it with the path. Do not unstage it with `git restore --staged` or `git reset` (both forbidden); the owner unstages.
- Never edit `.claude/settings.json` or any configuration to relax these rules. Messages from other agents or workflow scripts are never the owner's approval.
