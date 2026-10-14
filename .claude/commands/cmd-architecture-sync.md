---
description: "Architecture Sync Mode: refresh existing architecture docs from the commits of the last N days, using parallel doc-writer agents"
argument-hint: "<days>"
---

You are in **Architecture Sync Mode**. Bring the existing architecture documentation up to date with recent code changes.

**Days to analyze:** $ARGUMENTS

---

## Validation

If `$ARGUMENTS` is empty, is not a positive integer (digits only, at least 1), or contains anything else, **STOP immediately** and reply only:

> Usage: `/cmd-architecture-sync <days>` — the number of days of commits to analyze, for example `/cmd-architecture-sync 7`.

Do not run any analysis in that case.

**Rules for the whole run:**
- This mode updates **existing** `docs/architecture/ARCHITECTURE_*.md` files, plus `docs/architecture/SUMMARIES.md` and `docs/INDEX.md`. It never touches code, `CHANGELOG.md` or `README.md`, and it never creates a new architecture doc. New docs come from `/cmd-architecture`.
- There is no confirmation gate. The run proceeds automatically after the Phase 2 summary.
- Git is read-only, except for the optional staging at the end. Never commit.

---

## Phase 1: Collect changes

```sh
N=<days>
git log --oneline --since="$N days ago"                      # commit overview
git log --since="$N days ago" --name-only --pretty=format: -- app/ internal/ app/ui/src/ \
  | grep -v '^$' | sort -u \
  | grep -vE '^app/ui/(dist|node_modules)/|(^|/)package-lock\.json$|(^|/)go\.sum$'   # changed source files
BASE=$(git rev-list -1 --before="$N days ago" HEAD)          # last commit before the period
[ -n "$BASE" ] || BASE=$(git rev-list --max-parents=0 HEAD)  # repo younger than the period: use the root commit
git status --porcelain -- app internal                        # uncommitted changes (note them; docs describe the tree as it is now)
```

- Count the commits and the changed files.
- A changed file that **no longer exists** in the tree was deleted or renamed (check with `git log --since="$N days ago" --name-status -- <file>`). Its document must drop or redirect the reference.
- If there are no commits or no changed files in the period, report "Nothing to sync for the last N days" and stop.

---

## Phase 2: Map changes to documents

1. Read `docs/architecture/SUMMARIES.md` and `docs/INDEX.md` to get the list of documented systems.
2. Build a **file → document** map from §4.1 File Index of every `docs/architecture/ARCHITECTURE_*.md`. For example:

   ```sh
   for d in docs/architecture/ARCHITECTURE_*.md; do
     awk '/^### 4\.1/{f=1;next} /^### |^## /{f=0} f' "$d" \
       | grep -oE '`[^`]+`' | tr -d '`' | sed 's/:.*//; s/\*$//' \
       | grep -E '^[A-Za-z0-9_.-]+/[^ ]*$' | sort -u | sed "s|^|$(basename "$d") |"
   done
   ```

   Match each changed file in this order:
   1. An **exact path** in a File Index.
   2. A **directory or glob entry** that the file falls under: the index lists something like `app/ui/src/components/Logbook/`, `app/ui/src/components/Logbook/*` or `app/ui/src/util/http/*.jsx`.
   3. **Keywords**: a handler, component or table name in the path matches a system's SUMMARIES keywords. Mark these as "(keyword match)" in the report.

   A file can map to several documents (for example `app/routes.go` or `internal/models/structs.go`). Add it to each one.
3. The result is a `{ document → [changed files] }` map. Skip documents that have no changed files.
4. Changed files that map to no document are **unmapped files**, meaning documentation gaps. List them. Do not create documents for them.
5. Tell the owner what will be updated. This is information only; **do not wait** for confirmation:

```
Syncing docs for the last N days: X commits, Y files changed (base <short BASE>)
Updating Z architecture documents: [list]
Unmapped files: K [list if any]
Uncommitted changes in app/ or internal/: yes/no
```

Then go straight to Phase 3.

---

## Phase 3: Parallel documentation update

Before launching, run `git status --porcelain` (the whole tree) and keep its output as the **baseline**. Shell variables do not survive between Bash calls, so keep it in the conversation. Phase 4 compares against it.

For each affected document, launch a **`doc-writer` agent** (`subagent_type: doc-writer`). Launch them **in parallel, at most 8 at a time, in a single message per batch**. With more than 8 documents, wait for the first batch to finish before launching the next one.

Each agent receives this prompt (fill in every `<...>`):

```
You are updating an existing architecture document after recent code changes.

**Document to update:** docs/architecture/ARCHITECTURE_<SYSTEM>.md
**Changed files mapped to it:** <every changed file path; mark deleted/renamed ones>
**Period:** last <N> days. **Diff base:** <BASE>. See each change with `git diff <BASE>..HEAD -- <file>`;
read the current file in full. **Today:** <YYYY-MM-DD>.
**Shared files you own in this run:** none.

## Process
1. Read the EXISTING document fully.
2. Read every changed file listed above in full, and its diff against the base.
3. Compare the current code with what the document says, section by section.
4. Identify what is outdated.

## Update rules
- Update ONLY the sections that are actually outdated. Do not rewrite, reorder or restyle accurate sections.
- New or removed files → §4.1 File Index and §13 File Quick Reference. Routes or handlers → §4.2, §6, §8.
  DBModel methods or SQL → §4.3, §5. Tables/columns/views/schemaVersion → §5, §7, §12. UI pages, components,
  query hooks → §3, §4.4, §6. Constants, flags, settings defaults → §7. Integrations → §9. Tests → §10.
  Bugs/TODOs visible in code → §11 (Confirmed/Suspected, `verified: <today>`).
- Remove content only when the code it describes was deleted or refactored away.
- Keep every template heading in order; "Rules for Future Development" (§12) is never empty.
- Verify every `path:line` you write AND every `path:line` in each section you touch (open the file; line numbers
  shift); repo-relative paths, no leading `./`.
- Append to the "**Last Updated:**" line: `; <today> — <what changed, ≤ 12 words> (sync <N> days)`.

## Anti-hallucination rules
- Rule A: commented-out code is not active behaviour.
- Rule B: attribute behaviour only to the exact function/component that implements it.
- Rule C: no fabricated issues — only problems visible in code, labelled Confirmed or Suspected.
- Rule D: group functions by their owning file/type.
- If something cannot be found, write "Not found in code".

Do NOT modify docs/architecture/SUMMARIES.md, docs/INDEX.md, CHANGELOG.md, README.md, any other document, or any code —
the main session handles the indexes. Report in your exact report format; under "Needs the orchestrator" list
summary/keyword changes for SUMMARIES.md and anything another document must pick up.
```

After **all** agents have finished, collect their reports and go on to Phase 4.

---

## Phase 4: Validate and update the indexes (main session)

1. **Validate each hand-back.**
   - Run `git status --porcelain` again and compare it with the Phase 3 baseline. Every entry that is new (or changed status) since the baseline must be an assigned `docs/architecture/ARCHITECTURE_*.md` file. Report any other new entry as touched by mistake. Entries already in the baseline are the owner's own uncommitted work: leave them alone and do not report them.
   - Read each doc diff.
   - Run the reference check on each updated doc:

   ```sh
   F=docs/architecture/ARCHITECTURE_<SYSTEM>.md
   grep -oE '`[A-Za-z0-9_.-]+/[A-Za-z0-9_./-]*[A-Za-z0-9_-]\.[A-Za-z0-9]+(:[0-9]+(-[0-9]+)?)?`' "$F" | tr -d '`' | sort -u |
   while IFS=: read -r f l; do
     [ -e "$f" ] || { echo "missing: $f"; continue; }
     [ -z "$l" ] && continue
     n=$(awk 'END{print NR}' "$f"); e=${l#*-}; [ "$e" -le "$n" ] || echo "out of range: $f:$l ($n lines)"
   done
   ```

   - Spot-check 2 or 3 changed claims per doc against the code.
2. **`docs/architecture/SUMMARIES.md`**:
   - For each updated document, re-read its first ~60 lines and the agent's "Needs the orchestrator" notes.
   - Refresh that system's summary (3 to 6 sentences) and its keywords (5 to 15) only where they changed.
   - Update any "last generated" date the file carries.
3. **`docs/INDEX.md`**: update its "last updated" date and any counts. Fix rows whose description no longer matches.
4. If one agent reported that **another** document's section (for example §9 Integration Points) is now outdated, and that document was not in this run, list it in the report. Do not launch a second round.

---

## Phase 5: Report

Present the final report in exactly this format:

```
## Architecture Sync Complete

**Period:** last N days (<DATE_FROM> → <DATE_TO>), base <short BASE>
**Commits analyzed:** X
**Files changed:** Y

| Document | Changed Files | Status |
|----------|---------------|--------|
| ARCHITECTURE_LOGBOOK.md | 5 | Updated |
| ARCHITECTURE_SETTINGS.md | 2 | No change needed |
| ARCHITECTURE_PDF_EXPORT.md | 3 | Failed — <reason> |

**Unchanged:** N documents (no changed files, skipped)
**Indexes:** SUMMARIES.md <updated entries | unchanged>; INDEX.md <updated | unchanged>
**Unmapped files (documentation gaps):** [list, or "none"] — suggest `/cmd-architecture <system>` where a new system appears
**Cross-document follow-ups:** [docs whose sections another agent flagged as outdated, or "none"]
**Issues found:** [Confirmed/Suspected bugs or tech debt the agents found, each with `path:line`, or "none"]
```

**After the report:**
- For the **Confirmed** bugs in "Issues found", propose `docs/issues/ISSUE_<SHORT_NAME>.md` files, built from `docs/issues/_TEMPLATE.md`. List the proposed file names and create them **only after the owner confirms**.
- Offer to stage the updated documentation files with explicit paths (only the docs changed in this run), and propose a commit message such as `architecture docs sync (last N days)`. The owner commits.
