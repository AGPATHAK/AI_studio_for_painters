# Issue 027 — Pre-Read Brief: Painter's Note and Stage to the Mentor

## Goal

Let the painter tell the mentor something before pressing Read — a scope
note ("suggest changes to the foreground only") and, for WIP paintings,
which development stage the painting is at — and have the critique
prompts actually respect it.

## Why

Right now every critique request goes in cold: the mentor has no way to
know what the painter wants attention on, or how far along a WIP is. The
In-Process prompt in particular treats an unfinished painting as if it
should already be complete (that's Phase 4's fix, but Phase 4 depends on
the stage being available — this issue supplies it).

## Scope

### Included

`index.html`:
- A `painter-brief` block inside `.workflow-steps`, between the Open and
  Read step rows: a `<textarea id="painter-note" maxlength="500">` (2
  rows, placeholder per plan) and, nested inside it, a
  `<select id="painting-stage">` row with the four named stages plus
  `(not stated)`.
- Both are hidden by default (`hidden` attribute) — visibility is
  mode-driven from `app.js`, not static markup, since this whole block
  lives inside the single shared `.mode-actions` node that already moves
  between mode-groups on tab click.

`app.js`:
- `refreshPainterBrief()` (called from `refreshWorkflowChrome()`, which
  already runs on every panel refresh and mode switch): shows the note
  for In-Process, Studio Check, and Archive; hides it for Reference
  Ideation (per plan, skipped there — no request path change needed since
  the field simply won't exist for that mode). Shows the stage row only
  in In-Process.
- `currentPainterNote()` / `currentPaintingStage()` helpers, gated by
  mode support so a value never leaks into a mode/request that shouldn't
  carry it (e.g. into `/api/followup` while viewing Reference Ideation).
- `clearPainterBrief()` clears both fields; called on a new image load
  (`fileInput` change handler success path) and on `resetBtn` click —
  matching "cleared on new image." Not cleared on a bare mode-tab switch
  (the note is treated as belonging to the session, not the tab).
- `requestInProcessCritique`, `requestStudioCheckCritique`,
  `requestFinishedCritique`: read the current note/stage once at request
  time, include them in the POST body when non-empty, and return them on
  the result object so the exact values sent (not whatever the textarea
  holds later) get journaled.
- `saveJournalEntry`: two new parameters, `noteText` / `stageText`,
  included in the `/api/journal/save` POST body as `painterNote` /
  `paintingStage`. Both call sites (`rerunWorkflowAnalysis` and the
  Reference Ideation auto-fetch path in the `fileInput` handler) pass
  them from the request result.
- `sendChatMessage`: includes `painterNote: currentPainterNote()` in the
  `/api/followup` body.

`server/semantic-proxy.js`:
- `handleInProcess`, `handleStudioCheck`, `handleFinishedCritique`: read
  `painterNote` / `paintingStage` from the body, sanitize
  (`sanitizePainterNote`: strip control characters, collapse whitespace,
  cap at 500 chars), and pass through to the prompt builders.
- `buildInProcessPrompt`, `buildStudioCheckPrompt`,
  `buildFinishedCritiquePrompt`: when `painterNote` is present, append
  the brief-respecting instruction from the plan. When `paintingStage` is
  present (In-Process only), append the stage-statement line — Phase 4
  will add the calibration rules that consume it; this issue only wires
  the value through.
- `handleFollowup` / `callGeminiFollowup`: accept and sanitize
  `painterNote` the same way, append the same brief instruction to the
  follow-up prompt.
- `handleJournalSave`: persist `painterNote` / `paintingStage` on the
  saved entry (pass-through fields, same pattern as `userNote`).

### Excluded

- No stage-calibration prompt rules (what "Early washes" *means* to the
  critique) — that's Phase 4.
- No UI surfacing of `painterNote`/`paintingStage` in the Journal entry
  list or expanded view — the plan only asks that the saved record
  contain them, not that they render yet.
- Reference Ideation does not get a note field (plan explicitly allows
  skipping it; there is no request-path change for that mode).
- No changes to mockup or correction features.

## Data / State / API Model

- `painter-note` (textarea): session-scoped DOM value, not in
  `appState` — cleared on new image / reset, read fresh at request time.
  Server cap: 500 chars, control characters stripped.
- `painting-stage` (select): same lifecycle; values are the four literal
  stage labels or `''` for "(not stated)"; `''` is never sent as
  `paintingStage` (field omitted instead).
- Request body additions: `painterNote?: string`, `paintingStage?: string`
  (In-Process only) on `/api/in-process`, `/api/studio-check`,
  `/api/finished-critique`, `/api/followup`.
- Journal entry additions: `painterNote: string`, `paintingStage: string`
  (both default `''`), written by `handleJournalSave`.

## Acceptance Criteria

- With note "foreground only" on a WIP, the in-process critique's
  priority lesson and repaint handoff concern the foreground; sky/
  background commentary shrinks to at most a one-line risk flag.
- Note and stage appear in the saved journal JSON for that entry.
- Follow-up chat answers respect the same brief.
- Reference Ideation is unaffected (no note field, no body changes).
- A 600-character note is capped to 500 server-side and doesn't error.

## Validation Method

- `node --check app.js`
- `node --check server/semantic-proxy.js`
- `node server/semantic-proxy.js` starts clean.
- Manual: type a scoping note in In-Process, pick a stage, run a critique,
  confirm the response concentrates where asked and the saved journal
  JSON has both fields. Repeat for Studio Check and Archive (note only,
  no stage row). Ask a follow-up question and confirm the answer respects
  the note. Confirm Reference Ideation shows no note field and behaves as
  before.

## Likely Files / Modules

- `index.html` (modify)
- `app.js` (modify)
- `server/semantic-proxy.js` (modify)
- `styles.css` (modify — new block styling)

## Constraints

- Vanilla JS / HTML / CSS, no build step, no new npm dependencies.
- Graceful degradation without the proxy (unaffected — this is additive
  request-body data).
- Treat `painterNote` strictly as a focus instruction in the prompt, not
  free-form injected text — the appended wording constrains it the same
  way for all three critique prompts and the follow-up prompt.
- Do not touch mockup or correction features.

## Status / Next Action

Active. Implement on branch `issue-027-pre-read-brief`, branched from
`main` (after Phase 1 merge).
