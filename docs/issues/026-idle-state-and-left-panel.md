# Issue 026 — Idle State Fix + Left Panel Polish

## Goal

Stop the app from claiming a critique failure ("Gemini critique did not
complete… no AI guidance was generated") on a freshly loaded image, before
the read was ever requested. Polish the left panel stepper so it always
explains the next action.

## Why

`appState.semanticStatus.state` conflates "not yet requested" with "request
failed" — both are `'unavailable'`. The upload handler, reset handler, and
mode-tab click handler all set `{ source: 'none', state: 'unavailable' }`,
so `refreshInProcessCopy` / `refreshStudioCheckCopy` / `refreshFinishedCopy`
render failure copy on a freshly loaded image, before the painter has
pressed Read. The left panel also has several small rough edges (stepper
numbering, disabled-step hints, button casing) worth cleaning up while
touching this code.

## Scope

### Included

`app.js`:
- Add an `'idle'` state to the semantic-status enum: `'idle' | 'loading' |
  'succeeded' | 'unavailable'`. `'unavailable'` now means only "a request
  was made and failed."
- Change `{ source: 'none', state: 'unavailable' }` to
  `{ source: 'none', state: 'idle' }` in: the initial `appState` literal,
  the `fileInput` change handler (both the success path and the
  decode-failure catch path), the `resetBtn` click handler, and the
  mode-tab click handler.
- `refreshSemanticSource`: add an explicit `idle` branch so the (currently
  unreachable while hidden) text never claims "waiting for image" when an
  image is actually loaded.
- Confirm (no code change needed — verified during implementation) that
  `refreshInProcessCopy`, `refreshFinishedCopy`, `refreshStudioCheckCopy`,
  and `refreshReferenceIdeationCopy` already branch correctly once `idle`
  stops aliasing `unavailable`: `unavailable` → failure copy, anything else
  → `copy.ready`.
- Audit every other read of `semanticStatus.{state,source}` (chat enable,
  journal save guard, print button) and confirm each treats `idle`
  correctly; list them in the phase report instead of changing code that
  doesn't need it.
- Stepper clarity: number-prefix the three left-panel action buttons
  (`1 · Open …`, `2 · Read …`, `3 · Annotate`).
- Step hints: the Read step's hint shows "Load an image first" when
  disabled (was empty); stays empty when enabled (mirrors the existing
  Annotate-step convention). The Annotate step's hint shows "Load an image
  first" or "Read the painting first" for its disabled cases (was empty in
  the no-image case, "Analyse first" in the no-critique case).
- "clear" button label → "Clear image" (`index.html`).
- Add a one-line explanation under the previous-sessions block: "Sessions
  are linked by painting title (or filename if untitled)." (text specified
  by Phase 3.3 of the v3 plan; adding it now since the block already
  exists — Phase 3 will not need to re-add it).
- Journal-view button: add a `:focus-visible` outline matching `.mode-tab`
  for keyboard-focus consistency (it is already a native, focusable
  button with an `is-active` state — this is the one small gap).

`index.html`: static "Annotate" label → "3 · Annotate"; "clear" → "Clear
image"; add the previous-sessions hint paragraph.

`styles.css`: minor rule for the journal-view button focus outline and the
new hint paragraph's typography (reuse `.step-hint`-equivalent styling).

`service-worker.js`: bump `CACHE_NAME`.

### Excluded

- No changes to `server/semantic-proxy.js` (Phase 1 is frontend-only).
- No changes to the Annotate step's underlying visibility logic — it
  already hides the row entirely via `mockupBtn.hidden` +
  `.workflow-step:has(button[hidden])` when a mode doesn't support the
  mockup; this issue only fixes hint *text*.
- No changes to previous-sessions *matching* logic (filename-vs-paintingId
  priority) — that's Phase 3.
- No mockup or correction feature changes.

## Data / State / API Model

- `appState.semanticStatus.state`: `'idle' | 'loading' | 'succeeded' |
  'unavailable'` (was missing `'idle'`; `'unavailable'` previously did
  double duty as the default/no-request state).
- Default value: `{ source: 'none', state: 'idle' }`.
- Invalid-value fallback: none needed — all four call sites are internal
  assignments, not user input.
- Refresh behavior: `refreshCritiquePanel` already re-derives all copy from
  `appState.semanticStatus` on every call; no caching to invalidate.

## Acceptance Criteria

- Loading an image in each of the four modes shows copy that invites the
  read (never a failure claim).
- Killing the proxy and pressing Read shows the failure copy only after
  that request actually fails.
- Stepper hints explain the next action whenever a step is disabled; no
  step ever shows an empty hint while disabled.
- Lighthouse PWA score stays 100.

## Validation Method

- `node --check app.js`
- `node server/semantic-proxy.js` starts clean.
- Manual: for each of the four modes, upload an image and confirm the
  right panel shows ready/invite copy, not failure copy. Stop the proxy,
  press Read, confirm failure copy appears only then. Tab through the left
  panel with keyboard only and confirm every actionable step is reachable
  and its hint is legible.
- Plain static serve (no proxy): app loads, journal/chat/brief UI degrades
  gracefully, no console errors.

## Likely Files / Modules

- `app.js` (modify)
- `index.html` (modify)
- `styles.css` (modify)
- `service-worker.js` (modify — cache name bump only)

## Constraints

- Vanilla JS / HTML / CSS, no build step, no new npm dependencies.
- Graceful degradation without the proxy.
- `aps:` localStorage prefix (untouched by this issue).
- Do not touch mockup or correction features.
- Do not touch anything related to Painter's Reference Lab.
- Bounded polish only — no left-panel redesign.

## Status / Next Action

Active. Implement on branch `issue-026-idle-state-and-left-panel`, branched
from `main`.
