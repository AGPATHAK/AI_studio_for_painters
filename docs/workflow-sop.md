# Solo AI Workflow SOP — Solo-Light v7

A practical workflow for single-developer projects using ChatGPT for steering and Codex for tight repo-aware implementation, using in-repo markdown issue files as the execution source of truth.

---

## Why this revision

After multiple real project iterations, the lightest durable pattern remains:

```text
brief → markdown issue file → branch → scoped Codex prompt → review → commit/merge
```

This v7 revision preserves the useful v6 structure and adds lessons from debugging a Streamlit filter-state failure and a Codex workflow drift incident:

- Define the data/state model before UI work.
- Inspect the current repo structure before every Codex implementation prompt.
- Remove deprecated helper paths as soon as a design decision makes them obsolete.
- Keep ChatGPT, Codex, and the user in distinct roles.
- Provide explicit commit commands at clean commit points.

GitHub Issues and boards remain optional. For solo development, markdown issue files in the repo are the source of truth.

---

## 1. Workflow at a glance

| Stage | Primary tool | Output | Stop when |
|---|---|---|---|
| Explore | ChatGPT | 2–4 plausible directions | One direction is clearly better |
| Frame | ChatGPT | One-page brief | First issue can be written without guessing |
| Decide | ChatGPT | Milestone + issue breakdown | Issue 1 has goal, scope, acceptance criteria, validation |
| Track | Repo docs | `docs/brief.md`, `docs/issues/*.md`, optional board | One markdown issue file is active |
| Build | Codex + VS Code | Narrow implementation on one branch | Diff matches issue scope |
| Review | ChatGPT + local checks | Accept / revise / split | Acceptance criteria are actually met |
| Commit | User, guided by ChatGPT | Clean commit with exact message | Coherent unit of work is preserved |
| Document | ChatGPT or Codex | README + decisions + next issue docs | Repo reflects the new state |

Solo-default loop:

```text
Explore → Frame → Decide → Track lightly → Build → Review → Commit → Document
```

---

## 2. Roles and responsibilities

### User = Product Owner / Tester / Decision-maker

- Tests behavior in the real app.
- Reports symptoms and terminal output.
- Approves product direction and visible behavior.
- Executes local commands when needed.

### ChatGPT = Project Manager / Architect / Reviewer

- Frames issues and milestones.
- Makes project-management decisions rather than pushing ambiguity back to the user.
- Writes Codex prompts.
- Reviews Codex summaries and diffs.
- Provides exact bash commands at commit points.
- Does **not** directly patch repo files unless explicitly asked.

### Codex = Builder / Implementer

- Performs tightly scoped repo-aware edits.
- Reads the active issue file and current repo structure.
- Does not steer architecture.
- Does not create branches, commit, merge, or broaden scope unless explicitly instructed.

---

## 3. Default operating principles

- No coding before a brief.
- No implementation without an issue and acceptance criteria.
- One active issue at a time unless work is genuinely independent.
- Codex builds; ChatGPT reviews.
- If scope grows inside an issue, stop and create a follow-on issue.
- Markdown issue files are the source of truth.
- GitHub boards are optional milestone visibility, not mandatory bookkeeping.
- Do not leave deprecated helper paths in the repo after a design decision invalidates them.
- Commit immediately after a coherent validated unit of work.

---

## 4. Solo vs heavier workflow

| Use case | Recommended tracking | Notes |
|---|---|---|
| Single-file PWA, notebook, small utility, one developer | Brief + `docs/issues/*.md` + branches + commits/PRs | Default for most personal projects |
| Medium repo with several active workstreams | Brief + issue docs + light milestone board | Use only if milestone visibility helps |
| Multi-person or dependency-heavy work | Brief + issue docs + board + explicit review gates | Heavier workflow justified |

Recommended minimum repo setup:

```text
project_root/
├── README.md
├── docs/
│   ├── brief.md
│   ├── decisions.md
│   └── issues/
│       ├── 001-<name>.md
│       ├── 002-<name>.md
│       └── ...
├── src/
└── tests/  # optional but preferred
```

---

## 5. Phase checklist

### Explore

- Capture the idea plainly.
- Generate 2–4 credible directions.
- Do not produce code.

### Frame

Write a one-page brief:

- problem
- user
- success criteria
- scope
- non-goals
- first milestone
- key design decisions

Freeze the brief when Issue 1 can be written without guessing.

### Decide

- Convert the brief into a small milestone.
- Break work into issue-sized units.
- Each issue must have scope, acceptance criteria, validation, likely files, and constraints.

### Track

- Create repo, brief, and markdown issue files.
- Select one active issue.
- Use a board only if it adds clarity.

### Build

- Create or use the correct branch.
- Give Codex a narrow prompt derived from the active issue file.
- Require Codex to inspect current repo structure before editing.
- Inspect the diff in VS Code or terminal.

### Review

- Check acceptance criteria.
- Check regressions.
- Check scope leakage.
- If Codex deviated, do not patch informally; issue a corrective prompt or rollback.

### Commit

- Commit only after validation passes.
- Use a commit message that matches the actual scope.
- Do not bundle the next feature into the same commit.

### Document

- Update README if behavior changed.
- Add or update decisions only when they matter later.
- Mark or archive completed issue files if that is the project convention.

---

## 6. Project bootstrap: 5-minute setup

Use this at the start of every new project to eliminate setup ambiguity.

1. Write `docs/brief.md` in one page or less.
2. Create the first 3–5 issue files.
3. Mark only Issue 001 as active.
4. Create branch:

```bash
git checkout -b issue-001-<short-name>
```

Rules:

- Do not start coding before Issue 001 is written.
- Do not create more than one active implementation issue.
- Keep issue names short and functional.
- Put experiments or reviewer packs in ignored folders if they are not part of the product repo.

---

## 7. Issue template

```markdown
# Issue N — <Short functional title>

## Goal

## Why

## Scope

### Included

### Excluded

## Data / State / API Model

- UI control type:
- Session state type:
- Function argument type:
- Allowed values:
- Default behavior:
- Refresh / empty-state behavior:

## Acceptance Criteria

## Validation Method

## Likely Files / Modules

## Constraints

## Status / Next Action
```

### Issue splitting rule

Split an issue into multiple issues if any of the following are true:

- More than 2–3 files need meaningful modification.
- UI and backend changes are mixed without a clear boundary.
- The change cannot be expressed as a single clear delta.
- State model and visual design are both changing.
- The Codex prompt exceeds roughly 15–20 lines.
- You cannot write acceptance criteria without using vague words like “improve,” “clean up,” or “fix everything.”

If any condition is triggered, stop and create a smaller issue.

---

## 8. State-model discipline for UI apps

Before Codex touches UI or stateful code, ChatGPT must define the state model.

For every stateful UI control, specify:

```text
Widget type:
Session-state key:
Session-state type:
Function argument type:
Valid values:
Default value:
Invalid-value fallback:
Refresh behavior:
Empty-data behavior:
```

For Streamlit-style apps, define the lifecycle explicitly:

```text
initialize → reconcile/validate → render widgets → apply logic → refresh behavior → empty-data behavior
```

Rule:

- If a widget is single-select, do not preserve list-based helper paths.
- If a widget is multi-select, make list semantics explicit end-to-end.
- Never allow UI type and internal model type to diverge.

---

## 9. Codex operating pattern

Codex is an executor, not an explorer.

Every Codex prompt must include:

- Git instructions.
- Active issue path or one-line issue goal.
- Current-state inspection instruction.
- Exact scope.
- Explicit non-goals.
- Exact files to modify when known.
- Permission to remove obsolete code directly related to the issue.
- Validation commands.
- Mandatory output format.

### Standard starter block

```text
You are working in an existing Git repository.

Git instructions:
- Stay on the currently checked-out branch.
- Do not create or switch branches.
- Do not commit, merge, or change git history.
- Only edit files in the current working tree.

Current-state instruction:
- First inspect the current repo structure and identify canonical files before editing.
- Do not assume filenames from prior prompts are current.

Scope instructions:
- Implement the active issue only.
- Do not implement later issues.
- Do not refactor unrelated code.
- Remove obsolete helpers directly related to this issue if the issue makes them invalid.

Issue-file context:
- Read the active issue spec in docs/issues/.
- Treat it as the source of truth for goal, scope, acceptance criteria, validation, and constraints.

End with:
- Files changed
- Summary of change
- Validation commands run
- Assumptions
```

---

## 10. Edit instruction clarity

All edit instructions to Codex must explicitly specify one of the following:

- **Append** — add content without modifying existing content.
- **Replace** — replace an explicit section, block, or function.
- **Modify** — change specific lines, functions, or behavior only.
- **Delete** — remove named obsolete code paths.

Avoid positional ambiguity such as “add at the end” unless the instruction also says exactly what must be appended and what must not be touched.

---

## 11. Codex prompt optimization principles

### Use micro-tasks

Break work into:

- UI shell
- backend logic
- integration
- tests
- documentation

### Use delta prompts

Prefer:

```text
Modify only uploads.py to fix the categorizer call.
```

Avoid:

```text
Implement upload workflow.
```

### Limit file scope

Always specify files when known:

```text
Modify only:
- src/expense_intel/importers.py
- tests/test_importers.py
```

### Avoid repeating full specs

Refer to the issue file instead:

```text
Read docs/issues/012-owner-support.md and implement only its acceptance criteria.
```

### Run only relevant tests

Prefer:

```text
python3 -m unittest tests/test_ui_filters.py
```

Avoid full test runs unless the change is broad enough to justify them.

### Avoid repo-wide scans unless needed

Do not say “check the entire repo” by default. Instead say:

```text
Inspect current repo structure, then inspect these files: ...
```

---

## 12. Review checklist

Before accepting Codex output, verify:

- Only scoped files were changed.
- Canonical current files were edited, not stale renamed files.
- No hidden or unrelated refactors were introduced.
- Logic matches the issue intent exactly.
- Existing behavior is preserved unless explicitly changed.
- Deprecated helper paths related to the issue were removed.
- New stateful code has initialization, reconciliation, refresh, and empty-state behavior.
- Output is clean and minimal.
- Validation commands actually ran and passed.

If any check fails, revise via a new prompt or rollback. Do not patch informally.

---

## 13. Off-rail recovery pattern

If Codex deviates from scope, overwrites files unexpectedly, uses deprecated functions, or produces confusing changes:

1. Stop immediately.
2. Do not continue editing in the same prompt.
3. Inspect `git status` and `git diff`.
4. Decide whether to restore, rollback, or create a narrow corrective issue.
5. Re-issue a tighter prompt with exact file scope and deletion/restore instructions.

Rules:

- Never patch over unclear changes.
- Always return to a controlled, deterministic state before proceeding.
- Do not commit a messy working tree.

Useful commands:

```bash
git status
git diff --stat
git diff
```

To discard an unintended change to one file:

```bash
git restore <path>
```

To unstage a file:

```bash
git restore --staged <path>
```

---

## 14. Commit discipline

Commit when a coherent unit of work is complete and validated.

ChatGPT should decide and provide exact commands rather than vague guidance.

### Pre-commit check

```bash
git status
git diff --stat
git diff --cached --stat
```

### Stage explicitly

Prefer explicit staging:

```bash
git add <file1> <file2> <file3>
```

Avoid `git add .` unless the working tree has been inspected and every changed file belongs in the commit.

### Commit message format

```bash
git commit -m "Short imperative summary

- Specific change 1
- Specific change 2
- Specific change 3"
```

### After commit

```bash
git log -1
git status
```

Rules:

- Do not mix unrelated features in one commit.
- Do not commit untracked issue files unless they are part of the active issue or milestone documentation.
- Keep reviewer packs, scratch exports, and external review bundles ignored unless intentionally versioned.

---

## 15. Minimal board recommendation

Use a board only for milestone visibility.

Recommended solo setup:

- `docs/brief.md`
- `docs/decisions.md`
- `docs/issues/*.md`
- one branch per issue or milestone slice
- optional board cards only for milestones

Do not duplicate every markdown issue file as a GitHub Issue unless the board is genuinely useful.

---

## 16. Starter prompt for a new project chat

```text
Act as my technical guide and workflow coach for this project.

Roles:
- ChatGPT = project manager, architect, reviewer, and Codex prompt writer.
- Codex = tightly scoped repo-aware implementer.
- I = product owner, tester, and final decision-maker.

Workflow:
- Do not jump into coding before a brief exists.
- Prefer solo-light workflow: markdown issue files, branches, commits/PRs, and only a minimal board if needed.
- When I ask to implement something, first decide whether it belongs in the current issue or should become a new issue.
- For Codex work, give me one clean Codex prompt with git instructions, scope, validation, and output format.
- When work is ready to commit, give me exact bash commands.
- Do not give multi-step manual edits unless I explicitly ask.

Project idea:
[Paste plain-language idea here]

What I want first:
1. Explore 2–4 credible directions.
2. Freeze a one-page brief.
3. Convert the brief into milestone and issue-sized markdown files.
4. Write the first Codex prompt from the active issue file.
```

---

## 17. Production-grade Codex prompt template

```text
You are working in an existing local Git repository.

Git instructions:
- Stay on the currently checked-out branch.
- Do not create or switch branches.
- Do not commit, merge, or change git history.
- Only edit files in the current working tree.

Current-state instruction:
- First inspect the current repo structure and identify canonical files before editing.
- Do not assume filenames from prior prompts are current.

Context:
- Active issue: <ISSUE_FILE_PATH>
- Goal: <ONE_LINE_GOAL>

Scope:
- Modify ONLY the following files:
  - <file_1>
  - <file_2>

Do NOT:
- Do not scan or modify unrelated files.
- Do not refactor beyond scope.
- Do not add future features.

Task:
- <EXACT_DELTA_INSTRUCTION>

Acceptance Criteria:
- <CRITERIA_1>
- <CRITERIA_2>

Validation:
- Run only:
  - <specific command>

Output format:
- Files changed:
- Summary of change:
- Validation performed:
- Assumptions:
```

---

## 18. Prompt patterns

### A. Bug fix

```text
Goal: Fix incorrect classification of income transactions.

Scope:
- src/expense_intel/categorizer.py

Task:
- Modify logic for positive transactions to classify income categories.
- Do not touch expense categorization logic.

Validation:
- python3 -m unittest tests/test_categorizer.py
```

### B. Small feature addition

```text
Goal: Add income categorization support.

Scope:
- src/expense_intel/categorizer.py
- rules/categories.yml

Task:
- Add income categories: salary, dividend, interest.
- Ensure no impact to existing expense categories.
```

### C. UI layer change

```text
Goal: Add total income metric to Income page.

Scope:
- pages/5_Income.py

Task:
- Add total income metric at top.
- Reuse existing filtered dataframe.
- Do not modify backend logic.
```

### D. State-model cleanup

```text
Goal: Normalize filter model to strict single-select behavior.

Scope:
- src/expense_intel/streamlit_app.py
- src/expense_intel/ui_filters.py

Task:
- Treat source_filter and owner_filter as strings end-to-end.
- Remove obsolete list-based helper paths directly related to source/owner filters.
- Do not add multi-select behavior.

Validation:
- python3 -m unittest tests/test_ui_filters.py
```

---

## 19. Anti-patterns

Avoid these:

- “Implement feature X.”
- “Refactor the codebase.”
- “Check the entire repo.”
- “Fix everything related to filters.”
- “Use the existing helper if useful” when the helper may be deprecated.
- “Add this at the end” without specifying append/replace/modify intent.
- “Commit when done” inside Codex prompts unless you explicitly want Codex to commit.

These cause repo-wide scans, token explosion, stale-file edits, and scope drift.

---

## 20. Closing discipline after each milestone

At the end of each milestone:

1. Merge or commit the final issue cleanly.
2. Update README to reflect actual behavior.
3. Capture only the few design decisions worth remembering.
4. Mark issue files done or archive them if that is the repo convention.
5. Decide whether the next milestone is justified before opening new issue files.
6. Start the next issue on a clean branch or clean working tree.

---

## 21. v7 preservation note

This v7 version intentionally preserves the useful v6 components:

- solo-light brief → issue → branch → Codex → review flow
- project bootstrap structure
- issue template
- issue splitting rule
- edit instruction clarity
- off-rail recovery pattern
- Codex optimization principles
- production-grade Codex prompt template
- prompt anti-patterns
- closing discipline

The duplicated v6 Codex optimization appendices were consolidated into one cleaner section. No useful rule was intentionally removed; repeated material was merged to reduce ambiguity.
