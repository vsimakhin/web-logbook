---
status: done
priority: high
created: 2026-10-14
version: 5.0.0-alpha1
systems: [workflow, docs]
---

# TASK: Agent Workflow Setup

> **Read first:** `docs/tasks/refs/agent_workflow_setup/CONTRACTS.md` — names, file ownership, templates.

## 1. Goal Description

Give web-logbook the agent infrastructure that already works in the owner's other project (battle-group): an auto-loaded `CLAUDE.md` with a startup sequence, a `docs/` knowledge base (rules, per-system architecture docs, guides, task/issue files), workflow commands (`/cmd-*`), and Opus subagent roles for an orchestrated plan → implement → review → document loop. Port only the generic parts; battle-group is a Unity game and its game-specific layers are dropped.

## 2. Current State

No `CLAUDE.md`, no `.claude/`, no `docs/`. Knowledge lives in `README.md`, `CHANGELOG.md` and the code. Only 2 Go test files and 5 JS test files exist.

## 3. Expected Outcome

- `CLAUDE.md`, `.claude/{settings.json,agents/,commands/,prompts/}`, `docs/{INDEX.md,rules/,architecture/,guides/,tasks/,issues/}` exist and are mutually consistent.
- 12 architecture docs generated from code, fact-checked by independent reviewers.
- No pre-existing file modified.

## 4. Affected Systems

Documentation and agent tooling only. No runtime code changes.

## 5–8. Dependency Map / Risks / Impact / Assumptions

- **Risk:** hallucinated facts in generated docs → mitigated by `file:line` evidence rule, independent fact-check wave, orchestrator spot checks.
- **Risk:** game-project leftovers → leftover grep in validation.
- **Assumption:** Go is not installed locally, so docs are derived from reading code; build commands are documented from `Makefile` and CI, not executed.

## 9. Open Questions

None — see Decisions.

## 10. Decisions

| # | Decision | Confirmed |
|---|---|---|
| D1 | Commit everything (incl. `docs/tasks`, `docs/issues`) to the public repo | owner, 2026-10-14 |
| D2 | Agents are stage-only; owner commits; enforced via deny rules in `.claude/settings.json` | owner, 2026-10-14 |
| D3 | Claude only — no `AGENTS.md`, no `.codex/` | owner, 2026-10-14 |
| D4 | No product-spec layer (no GameDesign analogue) | owner, 2026-10-14 |
| D5 | All agent roles run on Opus; the main session orchestrates and validates | owner, 2026-10-14 |
| D6 | Docs in English; lowercase directories, UPPER_SNAKE doc names | orchestrator (repo idiom) |

## 11. Work Packages

No file overlap; see CONTRACTS §3 for exact ownership.

| Pkg | Owner | New files | Depends |
|---|---|---|---|
| A-× 12 | one agent per system | `docs/architecture/ARCHITECTURE_<SYSTEM>.md` | — |
| W1 | agent | `cmd-plan/task/issue/question/retro/modes`, `prompts/research.md`, `prompts/planning.md` | — |
| W2 | agent | `cmd-implement/review/architecture/architecture-sync`, `prompts/orchestration.md`, `.claude/agents/*.md` | — |
| W3 | agent | `docs/rules/RULE_GIT.md`, `RULE_CODE_STYLE.md`, `RULE_DEVELOPMENT.md` | — |
| W4 | agent | `docs/guides/HOWTO_DEVELOPMENT.md`, `HOWTO_RELEASE.md`, `docs/tasks/_TEMPLATE.md`, `docs/issues/_TEMPLATE.md` | — |
| INT | orchestrator | `CLAUDE.md`, `.claude/settings.json`, `docs/INDEX.md`, `docs/architecture/SUMMARIES.md` | wave 1 |
| REV | 4 reviewer → 4 fixer agents | edits within reviewed files | INT |

## 12. Acceptance

| # | Check | Pass |
|---|---|---|
| 1 | Every `path` / `path:line` reference resolves (file exists, line ≤ length) | ✓ 5350 path refs, 4040 line refs; the only "missing" path is the intentionally absent `.github/dependabot.yml` |
| 2 | Every `/cmd-*` and agent name referenced exists | ✓ |
| 3 | Frontmatter of commands/agents parses; `settings.json` is valid JSON | ✓ agents load live with the declared tool restrictions |
| 4 | Zero battle-group leftovers (Unity, GameDesign, Play Mode, prefab, player, battle, C#, …) | ✓ 0 hits |
| 5 | `git diff --stat` on tracked files is empty | ✓ |
| 6 | Orchestrator spot check: 5 random claims × 3 docs match code | ✓ 15/15 facts correct; 1 wrong line range fixed (LOGBOOK §11 #26). Function-scope heuristic over 769 identifier→reference pairs: no further real mismatch |
| 7 | Headless smoke: `/cmd-modes` and `/cmd-question` resolve and answer with `file:line` | ✓ both via `claude -p`; `/cmd-modes` self-check matched 10 commands / 4 agents / 12 docs |

## 15. Result

### 15.1 Stage 1, 2026-10-14

**Built** (all new files; no pre-existing file modified):
- `CLAUDE.md`, `.claude/settings.json` (stage-only git enforced by deny rules), `.claude/agents/{researcher,implementer,reviewer,doc-writer}.md` (all `model: opus`), 10 `/cmd-*` commands, 3 shared prompts (`research.md`, `planning.md`, `orchestration.md`).
- `docs/INDEX.md`, 3 rules, 2 guides, task/issue templates, `docs/architecture/SUMMARIES.md` + 12 `ARCHITECTURE_*.md` generated from code.

**Waves** (all subagents Opus; orchestrator = main session):
| Wave | Agents | Outcome |
|---|---|---|
| 1 — authors | 16 (12 architecture + 4 workflow packages) | all files written, file-disjoint |
| 2 — review → fix | 14 reviewers → 14 fixers (`doc-writer` / `implementer`) | 2212 claims checked, ~250 findings (MAJOR 21, rest MINOR/SUGGESTION), ~270 edits applied, 21 rejected/forwarded with reasons |
| 3 — consistency | 15 `doc-writer` | cross-doc severities/links aligned, RULE_GIT matched to the final deny list |

**Deviations / lessons:**
- Wave 2 was first launched with a placeholder instead of the cross-doc request map; stopped before any write and relaunched with the requests read from a file.
- Subagents share the session scratchpad: one overwrote the orchestrator's `validate.py`. Orchestrator tools now live in a dedicated sub-directory.
- Reference checks must count lines with `awk 'END{print NR}'` (several source files lack a trailing newline); fixed in `doc-writer.md`, `/cmd-architecture`, `/cmd-architecture-sync`.

**Carried forward (owner decision — proposed, not created):**
- Product bugs recorded in architecture §11 tables; candidates for `/cmd-issue`: schema-version selection by `created_at` string (`ARCHITECTURE_DATABASE.md` §11, BLOCKER), DB upload leaves `authCache`/airport/distance caches stale (`ARCHITECTURE_APPLICATION.md` §11 #2), unknown airport → 0°N 0°E distance/night time persisted (`ARCHITECTURE_LOGBOOK.md` §11 #21), "Return" writes an ISO timestamp into `date` (`ARCHITECTURE_LOGBOOK.md` §11 #1), missing `return` after `handleError` in auth handlers and no panic-recovery middleware (`ARCHITECTURE_AUTH.md`, `ARCHITECTURE_APPLICATION.md` §11 #19).
- Drift in pre-existing user docs (not edited by rule): `README.md` "No ICAO codes filter" wording inverted; `docker/README.md` advertises `:latest`, which `release.yml` no longer pushes, and its HTTPS example lacks flags.
- Environment: Go is not installed locally and Node differs from `app/ui/.nvmrc`; `/cmd-implement` validation will report `unverified` until both are installed.
