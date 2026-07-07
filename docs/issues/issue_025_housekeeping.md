# Issue 025 — Housekeeping (Phase 7)

## Goal

Close out the mentor-v2 improvement plan: bring the project's own documentation back in sync with what the code actually does, so a new session (or a future Ardhendu) isn't misled by stale M1/M2a-era notes or OpenAI references.

## Why

`session-notes.md` still describes the pre-Gemini, pre-proxy, M1/M2a state (dated 2026-05-12). `README.md` still says "runtime files do not exist yet" and documents OpenAI/`gpt-4o`/`gpt-image-1` as the AI vendor, when the app has run on a local Gemini proxy for several phases now. `docs/decisions.md` has no record of the four architectural decisions made across Phases 2–4.

## Scope

### Included

- Rewrite `session-notes.md` to reflect the post-v2 state: current architecture (Gemini proxy, four workflow modes, studio journal, progress memory, mentor chat), current branch stack, and updated locked-decisions headline list.
- Update `README.md`: fix the "runtime files do not exist yet" line (the app is fully built), replace OpenAI/`gpt-4o`/`gpt-image-1` references with the Gemini proxy reality, document `studio-journal/`, `server/painter-profile.json`, and the proxy's API surface.
- Append to `docs/decisions.md`:
  - **D8** — journal-on-disk via the proxy (not client-side storage).
  - **D9** — painter profile as a server-side JSON file.
  - **D10** — follow-up chat as a dedicated proxy endpoint (not a general chat feature).
  - **D11** — annotated-mockup and correction/edit features kept as-is through this improvement plan (owner decision, 2026-07-07).
- Confirm all issue files `019`–`024` exist (they do — each was created at the start of its phase per SOP).

### Excluded

- No decision entry for the earlier OpenAI → Gemini vendor switch — that predates this improvement plan and isn't in the plan's explicit D8–D11 list. Flagged as a gap, not resolved here, to avoid improvising a decision that wasn't requested.
- No code changes — this is a documentation-only phase.
- No changes to `docs/brief.md`, `docs/roadmap.md`, or `docs/workflow-sop.md`.

## Acceptance Criteria

- `session-notes.md` accurately describes the current architecture and state; no references to M1/M2a, OpenAI, or the old Streamlit-alternatives framing as current.
- `README.md` no longer claims runtime files don't exist; documents Gemini, the proxy's endpoints, `studio-journal/`, and `painter-profile.json`.
- `docs/decisions.md` has D8–D11 appended, each dated and with a rationale, matching the existing format of D1–D7.
- All issue files `019`–`024` are present in `docs/issues/`.

## Validation Method

- Read-through diff review; no code to run.
- `ls docs/issues/` to confirm 019–024 exist.

## Likely Files / Modules

- `session-notes.md` (rewrite)
- `README.md` (modify)
- `docs/decisions.md` (append D8–D11)

## Constraints

- Documentation only — no runtime code changes.
- Match each file's existing structure/conventions rather than introducing a new format.

## Status / Next Action

Active. Implement on branch `issue-025-housekeeping`, branched from `issue-024-prompt-polish` (final phase in the stack).
