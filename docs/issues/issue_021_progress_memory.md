# Issue 021 — Progress Memory (the mentor remembers)

## Goal

Recurring development areas distilled from the studio journal are injected into future critiques, and visible in a simple Journal view — so the mentor stops repeating advice the painter has already acted on, and starts naming recurring patterns explicitly.

## Why

Each critique today is amnesiac — it has no memory of the last ten paintings. Once enough journal entries exist (Phase 2), the tool can name a genuinely recurring weakness ("this is the recurring lost-edge issue") instead of re-diagnosing it from scratch every time.

## Scope

### Included

- **Distillation.** `POST /api/journal/distill`: loads the last 15 journal entries (critique text fields only, no images; skips entries rated `"off"`), sends them to Gemini as a text-only, schema-enforced call returning `persistentDevelopmentAreas` (max 3), `improvingAreas` (max 2), `establishedStrengths` (max 3), plus `entryCount` and `generatedAt`. Cached to `studio-journal/progress-summary.json`.
- Auto-regeneration: after `handleJournalSave`, if ≥5 entries are newer than the cached `generatedAt` (or no cache exists and ≥1 entry exists), fire-and-forget a regeneration — never blocks the save response.
- New read endpoint `GET /api/journal/progress` returning the cached summary (or `{}` if none yet), so the frontend can display it without forcing a regeneration.
- **Injection.** `/api/in-process`, `/api/studio-check`, `/api/finished-critique` append a history block built from the cached progress summary (persistent/improving areas) when it exists, and — when the frontend sends `previousEntryId` — a same-painting continuity block quoting that entry's `priorityDiagnosis`/`repaintHandoff`/`teachingPoint`.
- **Journal view (frontend).** A fifth left-panel nav item, "Journal" — a separate UI view state (`appState.view`), not a workflow mode; existing `WORKFLOW_MODES` and mode-tab logic are untouched. Content: a development-areas card (three lists + `generatedAt` date + "Refresh summary" button) and a plain entry list (thumbnail, date, mode, painting title, priority diagnosis, rating) that expands read-only on click. The expanded read-only view and the live critique panel share one label/field-selection function (`getCritiqueFieldRows`) rather than duplicating the field-to-label mapping.
- **Same-painting continuity opt-in.** In In-Process and Studio Check modes, when the current filename or painting title matches earlier journal entries, show a compact "previous sessions" line (clickable — jumps to the Journal view with that entry expanded) plus a checkbox "Give the mentor the last session's conclusions." Checking it sends `previousEntryId` (the most recent match) with the next critique request.
- Journal entry thumbnails served via the existing generic static file server (`studio-journal/entries/*.jpg` — no new binary-serving endpoint needed); `GET /api/journal/list` gains a `thumbnailUrl` field.

### Excluded

- No charts/graphs in the Journal view — plain lists only.
- No editing or deleting journal entries from the UI.
- No changes to Reference Ideation or Archive continuity (continuity opt-in is In-Process/Studio Check only, per plan).
- No changes to annotated-mockup or correction features.
- No changes to Phase 4's chat feature beyond what already persists via `/api/journal/update`.

## Data / State / API Model

- New file: `studio-journal/progress-summary.json` — `{ persistentDevelopmentAreas: string[], improvingAreas: string[], establishedStrengths: string[], entryCount: number, generatedAt: ISO-8601 }`. Gitignored (already covered by the existing `studio-journal/` ignore rule).
- `appState.view = 'workflow' | 'journal'` (new, top-level, independent of `appState.workflowMode`).
- `appState.journal.progressSummary`, `appState.journal.expandedEntryId`, `appState.journal.expandedEntryData` (new fields on the existing journal state object).
- Request body addition: `previousEntryId?: string` on `/api/in-process` and `/api/studio-check` bodies.

## Acceptance Criteria

- With ≥3 saved entries, `POST /api/journal/distill` returns sane, non-empty areas grounded in the entries' actual text.
- A new in-process critique's Gemini request includes the history block when a cached summary exists (verifiable via server log).
- Journal view lists all entries (newest first), each expands to a read-only critique on click, and the development-areas card shows the cached summary with a working "Refresh summary" button.
- Checking "Give the mentor the last session's conclusions" on a matching painting and re-running In-Process critique produces a critique that references the previous session's conclusion.
- Proxy down / no entries yet: Journal view and continuity UI stay hidden or show an empty state; no console errors.

## Validation Method

- `node --check server/semantic-proxy.js`
- `node --check app.js`
- Manual: save ≥3 journal entries across modes, call `/api/journal/distill` via curl and inspect the result; open the Journal view, expand an entry, refresh the summary; mark a painting's filename/title to match a prior entry, check the continuity box, confirm the next critique references the prior session.
- Global verification checklist (from the improvement plan) run at end of phase.

## Likely Files / Modules

- `server/semantic-proxy.js` (modify — distill endpoint + prompt/schema, progress-summary caching, auto-regeneration hook in `handleJournalSave`, history-block injection in the three critique builders, `thumbnailUrl` in `/api/journal/list`)
- `app.js` (modify — view-state switching, Journal view rendering, shared `getCritiqueFieldRows`, previous-sessions opt-in UI and request wiring)
- `index.html` (modify — Journal nav button, Journal view markup, previous-sessions block)
- `styles.css` (modify — Journal view, progress card, entry list, previous-sessions block)
- `service-worker.js` (modify — bump `CACHE_NAME`, shell files changed)

## Constraints

- Vanilla JS, no build step, no new dependencies.
- Do not add `"journal"` to `WORKFLOW_MODES` — it is a view, not a workflow mode.
- Do not touch annotated-mockup or correction features.
- Reuse the existing generic static file server for thumbnails rather than adding a binary-serving endpoint.

## Status / Next Action

Active. Implement on branch `issue-021-progress-memory`, branched from `issue-022-mentor-chat` (continuing the phase stack; depends on Phase 2's journal data, already merged to `main`).
