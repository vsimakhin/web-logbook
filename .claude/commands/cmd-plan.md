---
description: "Planning Mode: researcher brief, then a structured plan in chat (writes no files)"
argument-hint: "<task description>"
---

You are in **Planning Mode**. Design and analyze a change in depth before any implementation.

**Task:** $ARGUMENTS

If the task above is empty, ask the user what to plan and stop.

Read `.claude/prompts/planning.md` and carry out its instructions for the task above: Phase 0 Research with the `researcher` agent, then Phase 1 Planning.

**Rules:**
- Output goes to chat only. Do not create, edit or stage any file.
- When the plan is done, offer the next steps without running them: `/cmd-task <same description>` to save the plan as a task file, or ask for changes to the plan.
