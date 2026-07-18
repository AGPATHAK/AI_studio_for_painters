# Issue 028 — Auto-Title and Visible Continuity

## Goal

Session linking depends on the painting title, but nothing generates one
automatically. Titles should auto-fill so linking works without the
painter having to type anything, and the previous-sessions link should be
visible and legible rather than a bare date list.

## Why

Owner-reported problem #2 from the v3 plan: it is unclear that continuity
depends on the painting title. Run last, per the plan's recommended
order, since it benefits from the journal entries that have accumulated
through Phases 1/2/4/5 testing and the owner's own use.

## Scope

### Included

`server/semantic-proxy.js`:
- Add `suggestedTitle: { type: 'STRING' }` to `REFERENCE_IDEATION_SCHEMA`,
  `SEMANTIC_SCHEMA` (the schema In-Process actually uses), `STUDIO_CHECK_SCHEMA`,
  and `ARCHIVE_SCHEMA` — required in each so it always arrives.
- Prompt addition, all four: "For suggestedTitle, give a short working
  title for this painting/motif: 2 to 5 words, concrete and studio-plain
  ... No dates, no quotes, no poetry." Added to `REFERENCE_IDEATION_PROMPT`
  directly (where its other per-field instructions live) and to
  `buildInProcessPrompt` / `buildStudioCheckPrompt` /
  `buildFinishedCritiquePrompt` (matching where their per-field
  instructions live).

`app.js`:
- `suggestedTitle: cleanUiText(safe.suggestedTitle)` added to the four
  `normalize*` functions.
- `saveJournalEntry`'s title resolution becomes a priority chain: (1) a
  title the painter already typed into the now-visible field wins outright
  and is never overwritten; (2) `paintingId` from a previous entry matched
  by filename (existing `findPreviousPaintingId`, unchanged); (3) the
  fresh critique's `suggestedTitle`; (4) a filename-stem fallback
  (extension stripped). A `journal-title-suggested-tag` shows next to the
  label whenever the resolved title wasn't typed by the painter, and
  clears the moment they edit the field.
- `findPreviousSessionsForActiveImage`: prefer a `paintingId` match; only
  fall back to filename matching when no `paintingId` match exists
  (previously an unordered OR of both).
- `refreshPrevSessionsBlock`: header becomes "Linked painting: `<title>`
  — `<n>` previous session(s) · most recent `<date>` (`<mode>`)" instead
  of a bare comma-separated date list.
- Journal view (`buildJournalEntryRow` / `renderJournalEntryList`): a
  small "×n sessions" badge appended to an entry's meta line when its
  `paintingId` is shared by more than one entry — no new layout, reuses
  the existing meta `<p>`.

`index.html` / `styles.css`: the suggested-tag span and its styling.

### Excluded

- No changes to the previous-sessions explanatory hint text (already
  added in Phase 1).
- No new Journal-view layout or grouping beyond the session-count badge —
  plan explicitly calls for a minimal implementation.
- No changes to mockup or correction features.

## Data / State / API Model

- `suggestedTitle` (response field): required string on all four
  critique/ideation schemas; normalized client-side like every other
  field.
- Title resolution priority in `saveJournalEntry`: typed value > filename-
  matched previous `paintingId` > `suggestedTitle` > filename stem. Never
  falls through to `null` now that a filename stem is always available.
- `journal-title-suggested-tag`: DOM-only UI state, not persisted; hidden
  once the painter edits the title field.

## Acceptance Criteria

- Critique a new WIP with an empty title → title auto-fills from
  `suggestedTitle`, tagged as suggested.
- Re-upload a later photo of the same painting under a different filename
  but the same typed/confirmed title → previous-sessions block shows the
  link, matched by `paintingId` first.
- Continuity checkbox still produces a critique referencing the earlier
  session (existing `previousEntryId` behavior, unchanged).
- Journal view shows a "×n sessions" badge on entries sharing a
  `paintingId`.

## Validation Method

- `node --check app.js`
- `node --check server/semantic-proxy.js`
- `node server/semantic-proxy.js` starts clean.
- Manual: critique a fresh WIP, confirm the title auto-fills and is
  tagged suggested; edit it and confirm the tag clears; re-upload a
  differently-named photo of the same title and confirm the previous-
  sessions header reads correctly; open Journal view and confirm the
  session-count badge appears on a painting with multiple entries.

## Likely Files / Modules

- `server/semantic-proxy.js` (modify — 4 schemas, 4 prompts)
- `app.js` (modify — normalize functions, `saveJournalEntry`, previous-
  sessions matching/header, Journal view row rendering)
- `index.html`, `styles.css` (modify — suggested-tag markup/styling)

## Constraints

- Vanilla JS / HTML / CSS, no build step, no new npm dependencies.
- A user-typed title always wins and is never silently overwritten.
- Bounded polish — no Journal-view redesign.

## Status / Next Action

Active. Implement on branch `issue-028-auto-title-continuity`, branched
from `main` (after Phase 5 merge — last phase in the execution order).
