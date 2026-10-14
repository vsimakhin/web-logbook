---
description: "Question Mode: read-only factual answer from docs and code, with path:line references"
argument-hint: "<question>"
---

You are in **Question Mode**. Do read-only research and give a factual answer.

**Question:** $ARGUMENTS

If the question above is empty, vague or ambiguous, ask clarifying questions before researching. Do not guess what was meant.

**Strict rules:**
- Do NOT create, edit or delete any file, and do not stage anything.
- Do NOT suggest improvements, refactors or "better" approaches.
- State only facts found in docs and code. Never invent behaviour.
- Commented-out code is not active behaviour. Attribute behaviour only to the exact function or component that implements it.
- If something is not found, write **"Not found in code"**. Do not guess.

---

## Process

1. **Docs first.** Read `docs/architecture/SUMMARIES.md`, pick the relevant systems, and read only the relevant sections of their `docs/architecture/ARCHITECTURE_*.md`. For build, run and release questions, start with `docs/guides/`. For conventions, start with `docs/rules/`.
2. **Then code.** Docs can lag behind the code, so confirm every claim you put in the answer in the source. Where the two disagree, the code wins. Report the drift in Found Issues and suggest `/cmd-architecture-sync`.
3. **Trace the full chain** across every system involved. For a typical feature that is: UI page or component, then query hook, then fetcher in `app/ui/src/util/http/`, then the endpoint and route in `app/routes.go`, then the handler in `app/handlers_*.go`, then the `DBModel` method in `internal/models/`, then tables and views from `internal/driver/db_structure.go`, and back.
4. **Cite `path:line`** (repo-relative, plus the function name where possible) for every claim. Open the file and check the line number.

**Broad questions:** if the question spans more than two systems, or asks for a whole-system explanation ("how does X work end to end"), launch the **Agent** tool with `subagent_type: researcher`. Use the prompt from `.claude/prompts/research.md`, with the question in `{{TASK_DESCRIPTION}}`. Verify the key claims of the returned brief in code yourself before answering.

---

## Answer shape by question type

- **"How does X work?"**: trace from the entry point to the result, step by step, with `path:line`.
- **"Why does X do Y?"**: the line(s) that cause Y, and the conditions on the path that lead there.
- **"Where is X used?"**: every usage, grouped by owning file, in both Go and UI code. Say how you searched (the pattern), so completeness can be checked.
- **"Is there a bug in X?"**: analyze the suspected problem. Label it Confirmed (with reasoning) or Suspected (with the evidence that would confirm it).
- **"What happens if X?"**: trace the scenario through the code, including error paths and SQLite or MySQL differences where they exist.
- **"Where is X configured?" / "What is the default?"**: the value with `path:line`, marked (configurable: CLI flag in `app/main.go` or the settings JSON) or (hardcoded).

---

## Output

1. **Answer**: the full trace with `path:line` references, covering the complete chain across all systems involved.
2. **Sources**: the docs and files you read.
3. **Found Issues** (only if any): bugs, edge cases or doc drift discovered along the way. For each one: severity (High, Medium or Low), Confirmed or Suspected, and `path:line`.

**Short mode:** if the user explicitly asks for a brief answer, give 1 to 3 sentences with the single most important `path:line`, and no full trace.

**Found issues are never written down silently.** For each Confirmed issue, propose an issue file: give a suggested name `docs/issues/ISSUE_<SHORT_NAME>.md` and a ready-to-run `/cmd-issue <one-line description>`. Create nothing in this mode.
