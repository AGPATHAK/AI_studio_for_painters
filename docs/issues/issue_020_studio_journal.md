# Issue 020 — Studio Journal (Persistence via Proxy)

## Goal

Every successful critique is saved automatically to disk via the proxy, so nothing is lost on reload. Lightweight rating and note round-trip. Nothing breaks when the proxy is absent (GitHub Pages case).

## Why

Critiques currently vanish on reload. Progress tracking (Phase 3) needs a journal to distill from.

## Scope

### Included

- `studio-journal/` folder at repo root, gitignored, created on demand by the proxy.
- Entry schema per plan §2.2: id, savedAt, workflowMode, filename, paintingId, promptVersion, model, critique, userNote, userRating, chat.
- Proxy endpoints: `POST /api/journal/save`, `GET /api/journal/list`, `GET /api/journal/entry?id=`, `POST /api/journal/update`.
- Browser-side thumbnail generation (canvas → `toDataURL('image/jpeg', 0.85)`, longest side 800px) sent with the save request; proxy only writes files.
- Frontend: auto-save after every successful critique (all four modes); quiet one-line status under `semantic-source`; painting-title input (pre-filled from last entry with the same filename); rating buttons (useful/partly/off); free-text note (save on blur).
- Feature-detect via one `/api/journal/list` call at startup; hide all journal UI if it fails.
- Add `model` field to backend normalized critique responses (`GEMINI_MODEL`) and thread `promptVersion`/`model` through the four frontend `normalize*Critique` functions, so the journal entry schema can be populated (dependency on Phase 1's `PROMPT_VERSION`).

### Excluded

- No distillation / progress memory (Phase 3).
- No follow-up chat (Phase 4) — the `chat` array field exists in the schema but stays empty here.
- No Journal view / entry browsing UI (Phase 3).
- No changes to annotated-mockup or correction features.

## Data / State / API Model

- `appState.journal = { available: null|boolean, entries: [] /* cached list summaries */, currentEntryId: null|string }`.
- Journal UI widgets: painting-title text input, three rating buttons, note textarea — all live inside a new `#journal-section` under `#semantic-source` in the critique panel, `hidden` by default.
- `available` starts `null` (unknown), resolves to `true`/`false` after the startup `/api/journal/list` probe. `false` means the section stays `hidden` permanently for the session — no further journal fetches are attempted.
- Refresh/empty-state behavior: journal section is hidden again whenever a new upload/critique run starts, a mode switch happens, or reset is clicked (an old entry's rating/note must not appear to apply to a new image). It reappears once the new critique's save completes.

## Acceptance Criteria

- Running a critique in each of the four modes writes one `.json` + one `.jpg` under `studio-journal/entries/`.
- Rating and note round-trip: click a rating button or blur the note field, then `GET /api/journal/entry?id=...` shows the update.
- Painting-title input pre-fills from the most recent entry sharing the same filename, if any.
- App served with plain `python3 -m http.server` (no proxy): no journal UI visible, no console errors from journal code.
- Existing four-mode critique flow, mockup, and correction features are unaffected.

## Validation Method

- `node --check server/semantic-proxy.js`
- `node --check app.js`
- Manual: run proxy, exercise all four modes, inspect `studio-journal/entries/`; toggle rating/note and confirm via `/api/journal/entry`; kill the proxy and reload the static app to confirm graceful degradation.
- Global verification checklist (from the improvement plan) run at end of phase.

## Likely Files / Modules

- `server/semantic-proxy.js` (modify — new endpoints, `model` field)
- `app.js` (modify — journal state, save/update calls, thumbnailing)
- `index.html` (modify — journal section markup)
- `styles.css` (modify — journal section styling)
- `.gitignore` (modify — add `studio-journal/`, must land before any journal code)
- `service-worker.js` (modify — bump `CACHE_NAME`, shell files changed)

## Constraints

- Vanilla JS, Node stdlib only (`crypto.randomUUID()` is stdlib), no new npm dependencies.
- `aps:` prefix rule applies only to `localStorage` keys — journal has no localStorage keys, N/A here.
- Do not touch annotated-mockup or correction features.
- `studio-journal/` must be added to `.gitignore` before any journal-writing code lands, and before any manual test run creates entries.

## Status / Next Action

Active. Implement on branch `issue-020-studio-journal`, branched from `issue-019-painter-profile` (dependency: `PROMPT_VERSION` from Phase 1, not yet merged to `main`).
