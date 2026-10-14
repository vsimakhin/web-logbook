---
description: "Implement Mode: orchestrate a confirmed task (spec gate, then parallel implementer agents, validation, independent review, docs, staging)"
argument-hint: "<path to docs/tasks/TASK_*.md>"
---

You are in **Implement Mode**. The main session is the orchestrator. It specifies the task, delegates the work to Opus subagents, validates what they return and stages the result. The owner confirms the spec and commits.

**Task file:** $ARGUMENTS

If the task file above is empty or does not exist, list `docs/tasks/TASK_*.md`, ask which one to implement, and stop. If no task file exists for this work yet, suggest `/cmd-task <task description>` first.

Read `.claude/prompts/orchestration.md` and carry it out for the task file above, step by step. It is binding. In particular:
- The **spec gate** (Step 2) is mandatory. Nothing is implemented before the owner confirms the spec.
- Never ship behaviour the owner did not ask for. List it and ask.
- Every check is either run and recorded, or recorded as `unverified: <command>`.
- Stage only this task's files with explicit paths. Never commit. The owner commits and decides when the task is done.
