# Improvement Plan — Mentor v3

_Date: 18-07-2026. Author: Claude (architect pass). Executor: Claude Code (Sonnet)._
_Prerequisite: Mentor v2 is fully merged (commits `f8b9fc6`…`deeb95e`). Read `docs/improvement-plan-mentor-v2.md` for context, then this file. This file is authoritative where they differ._

## Purpose

Five owner-reported problems from daily use of the v2 app:

1. **Misleading status copy.** Loading an image in In-Process / Studio Check / Archive immediately shows "Gemini critique did not complete… no AI guidance was generated" — before the read button was ever pressed. The left panel generally feels raw.
2. **Continuity is opaque.** It is unclear that session linking depends on the painting title. Titles should be auto-generated so linking works without manual typing.
3. **No pre-read brief.** The painter cannot tell the mentor anything before the read (e.g. "suggest changes to the foreground only").
4. **In-Process prompt critiques incompleteness.** It flags things that belong to a later pass anyway ("you have not added darks yet, this feels incomplete"). A WIP mentor must judge decisions made so far, not the absence of final-pass work.
5. **Studio Check should proactively suggest mixed-media accents** (pen line, pastel, gouache) as part of the closing verdict, not only when asked.

## Locked constraints (unchanged from v2 — do not violate)

- Vanilla JS / HTML / CSS, no build step, no new npm dependencies (Node stdlib only in the proxy).
- Graceful degradation when the proxy is absent (GitHub Pages case).
- `aps:` localStorage prefix; bump service-worker cache name on any shell change.
- Do not touch mockup/correction features except where this plan says so.
- Do not touch anything related to Painter's Reference Lab.
- SOP: one phase = one issue file (`docs/issues/026`–`030`) = one branch. Explicit-file-list commits. The app currently works — if the plan conflicts with the code as found, stop and ask before deviating.

---

## Phase 1 — Semantic state machine fix + left panel polish

**Issue file:** `docs/issues/026-idle-state-and-left-panel.md`. **Branch:** `issue-026-idle-state-and-left-panel`.

### 1.1 Root cause fix: add an `idle` status state

`appState.semanticStatus.state` currently conflates "not yet requested" with "request failed" — both are `'unavailable'`. The upload handler and the mode-switch handler both set `{ source: 'none', state: 'unavailable' }`, so `refreshInProcessCopy` / `refreshStudioCheckCopy` / `refreshFinishedCopy` render their failure copy ("Gemini critique did not complete…") on a freshly loaded image.

Changes in `app.js`:

- Extend the state enum: `'idle' | 'loading' | 'succeeded' | 'unavailable'`. `'unavailable'` now means **a request was made and failed** — nothing else.
- Set `{ source: 'none', state: 'idle' }` in: the initial `appState` literal, the upload handler, the reset handler, and the mode-tab click handler.
- In the three `refresh*Copy` functions: `idle` → show `copy.ready` (e.g. "WIP image is ready. Ask for critique and next painting actions."); `unavailable` → keep the failure copy. Audit `refreshSemanticSource` the same way: `idle` → "Mentor: ready" (not "waiting for image" when an image is loaded, not an error).
- Grep for every other read of `semanticStatus.state` (journal save guard, chat enable, print button, etc.) and confirm each treats `idle` correctly. List them in the phase report.

### 1.2 Left panel polish (bounded — polish, not redesign)

- **Stepper clarity:** the three action buttons (Open / Read / Annotate) become visibly sequential: number prefixes (`1 ·`, `2 ·`, `3 ·`) or a connected-step style using existing CSS tokens. A step that is disabled shows *why* in its `step-hint` ("Load an image first", "Read the painting first") instead of an empty hint.
- **Consistent casing and labels:** "clear" button → "Clear image". Mode-dependent verbs already exist (`refreshWorkflowChrome`) — verify each mode's button/hint text reads naturally after the idle-state fix; fix any leftover "Tap to analyse"-style strings.
- **Annotate step visibility:** in modes that do not support the mockup, the Annotate step row is hidden entirely (not just the button) so the stepper never shows a dead step.
- **Journal button:** style it as a peer of the mode tabs but visually separated (it is a view, not a stage); ensure it is keyboard-focusable and shows an active state when the Journal view is open.
- **Previous-sessions block:** show it only in In-Process and Studio Check, only when matches exist; give it a one-line explanation (see Phase 3.3).
- Bump service-worker cache name.

**Acceptance:** load an image in each of the four modes → the right panel invites the read (never claims a failure); kill the proxy and press Read → failure copy appears only then. Stepper hints always explain the next action. Lighthouse PWA stays 100.

---

## Phase 2 — Pre-read brief: painter's note and stage to the mentor

**Issue file:** `docs/issues/027-pre-read-brief.md`. **Branch:** `issue-027-pre-read-brief`.

### 2.1 Frontend

- In the left-panel actions (between Open and Read steps), add for In-Process, Studio Check, and Archive modes:
  - **Note to mentor** — a small `<textarea id="painter-note">` (2 rows, placeholder: "Optional — e.g. 'suggest changes to the foreground only', 'I plan to add darks last'"), persisted per session in memory only (cleared on new image).
  - **Stage selector** (In-Process mode only) — `<select id="painting-stage">` with: `(not stated)` / `Early washes — big shapes only` / `Masses placed — mid development` / `Refinement — most passages decided` / `Final accents pending`.
- Send both with the critique request body: `painterNote` (trimmed string) and `paintingStage` (the label string, omitted when "(not stated)").
- Reference Ideation may reuse `painterNote` trivially (append to the same request body); if it complicates the code path, skip it and note that in the report.
- Save both into the journal entry (`painterNote`, `paintingStage` fields) so the record shows what the mentor was told.

### 2.2 Proxy (`server/semantic-proxy.js`)

- In the handlers for `/api/in-process`, `/api/studio-check`, `/api/finished-critique` (and `/api/semantic` if 2.1 includes it): when `painterNote` is present, append to the prompt:
  `"The painter's brief for this session: '<note>'. Respect it. Concentrate the critique where the painter asked. Do not critique passages the painter has declared out of scope or not yet painted — at most, flag a structural risk there in one sentence. The brief narrows your focus; it does not change your standards."`
- When `paintingStage` is present, append: `"The painter states the painting is at this stage: <stage>."` (Phase 4's prompt text makes use of it.)
- Sanitize: cap `painterNote` at 500 chars server-side; strip control characters. It is painter input into a prompt — treat it as focus instruction only, which the wording above already constrains.
- Also pass `painterNote` into the follow-up chat prompt (`/api/followup`) so chat answers respect the same brief.

**Acceptance:** with note "foreground only", the in-process critique's priority lesson and repaint handoff concern the foreground, and sky/background comments shrink to at most a one-line risk flag. Note and stage appear in the saved journal JSON.

---

## Phase 3 — Auto-title and visible continuity

**Issue file:** `docs/issues/028-auto-title-continuity.md`. **Branch:** `issue-028-auto-title-continuity`.

### 3.1 Mentor-suggested title

- Add `suggestedTitle: { type: 'STRING' }` to all four response schemas (`SEMANTIC_SCHEMA`? — no: to `REFERENCE_IDEATION_SCHEMA`, `SEMANTIC_SCHEMA`, `STUDIO_CHECK_SCHEMA`, `ARCHIVE_SCHEMA`; make it **required** in each so it always arrives).
- Prompt addition (all modes): `"For suggestedTitle, give a short working title for this painting/motif: 2 to 5 words, concrete and studio-plain (e.g. 'Harbour at low tide', 'Elm shadows, morning'). No dates, no quotes, no poetry."`
- Normalize it in the four `normalize*` functions in `app.js`.

### 3.2 Title auto-fill logic (frontend)

Priority order when a critique succeeds and the journal title field is empty:
1. Existing `paintingId` from a matched previous entry (current prefill behavior — keep).
2. `suggestedTitle` from the fresh critique.
3. Filename stem as last resort.

The field remains editable; a user-typed title always wins and is never overwritten. When the title is auto-filled, show it subtly (e.g. placeholder-style until confirmed, or a small "suggested" tag) so the painter knows they can change it.

### 3.3 Make continuity visible and title-first

- Matching (`app.js`, currently filename-OR-paintingId): prefer `paintingId` match; use filename match only as fallback. Document this in a one-line UI hint under the previous-sessions block: *"Sessions are linked by painting title (or filename if untitled)."*
- When matches exist, the block header reads: `Linked painting: <title> — <n> previous session(s)`, with the most recent session's date (dd-mm-yyyy) and mode.
- The checkbox label stays; when checked, `previousEntryId` is sent (existing behavior).
- Journal view: group or badge entries sharing a `paintingId` so a painting's history reads as a thread (minimal implementation: a small `×n sessions` badge and consistent title display — no new layout).

**Acceptance:** critique a new WIP with an empty title → title auto-fills from `suggestedTitle`; re-upload a later photo of the same painting with a different filename but same title → previous-sessions block shows the link; continuity checkbox produces a critique referencing the earlier session.

---

## Phase 4 — Stage-aware In-Process prompt (stop critiquing incompleteness)

**Issue file:** `docs/issues/029-stage-aware-wip-prompt.md`. **Branch:** `issue-029-stage-aware-wip-prompt`.

Prompt-only phase. Edit `IN_PROCESS_PROMPT` in `server/semantic-proxy.js`:

### 4.1 Core rule — add near the top, right after "Judge the WIP on its own painting terms."

```
'This painting is unfinished by definition. Never critique incompleteness itself:',
'missing darks, absent final accents, unpainted or reserved passages, bare paper, and light first washes',
'are normal stages of watercolor sequencing, not faults. Assume the painter knows the painting is unfinished.',
'Judge only what has been decided so far — the shapes, values, edges, and color relationships that exist on the paper —',
'and the single most important next decision.',
'When a final-pass element (connected darks, calligraphic accents, focal sharpening) is relevant,',
'frame it as sequencing guidance for when that pass comes ("when you place the darks, connect them into one family"),',
'never as a present defect ("the painting lacks darks", "this feels incomplete").',
```

### 4.2 Use the declared stage (from Phase 2)

When `paintingStage` is present, the handler appends:

```
'Calibrate to the declared stage. Early washes: critique only big-shape design, value-mass planning, and what to protect.',
'Masses placed: critique value grouping, edge economy, and focal claim; darks and accents are still to come.',
'Refinement: critique what to stop touching, where freshness is at risk, and the order of remaining passes.',
'Final accents pending: critique only the placement, restraint, and sequencing of the last marks.',
```

If no stage is declared, add one line: `'If the stage is not stated, infer it from coverage and paint density, state your assumption in one clause of sceneRead, and calibrate accordingly.'`

### 4.3 Regression guard

Before/after test on **3 WIP images at different stages** (owner supplies, or reuse any prior WIP photos): the "before" critique's incompleteness complaints must be absent in "after"; structural critique of existing passages must remain equally specific. Record the comparison in the issue file. Bump `PROMPT_VERSION` (e.g. `'3.0'`) — journal entries already carry it, so old and new critiques stay distinguishable.

**Acceptance:** a half-covered WIP with no darks gets a priority lesson about the decisions on the paper (mass design, edge economy, what to protect) plus at most sequencing guidance about future darks — zero "incomplete/missing/not yet added" framing.

---

## Phase 5 — Studio Check: proactive mixed-media accent guidance

**Issue file:** `docs/issues/030-studio-check-accents.md`. **Branch:** `issue-030-studio-check-accents`.

Prompt-only phase. Edit `STUDIO_CHECK_PROMPT`:

- Replace the current `mediaOptions` guidance ("if a medium other than watercolor could achieve what watercolor alone cannot… If nothing applies, return an empty string.") with an **actively considered** version:

```
'For mediaOptions, actively consider — on every painting — whether one or two final accents in another medium',
'would strengthen the close: a calligraphic pen or fine brush line to anchor a focal edge or rigging/branch/figure gesture;',
'soft pastel dragged dry for atmospheric light, broken color, or a lifted sky note;',
'white or tinted gouache for one critical recovered light; charcoal or water-soluble pencil for a quiet structural restatement.',
'Suggest at most two accents, each naming the exact passage, the medium and mark, and what to test on scrap paper first.',
'These are closing accents in the Wesson/Seago spirit — economical, subordinate, applied in minutes — never outlining,',
'never a second campaign of work. If the painting is better closed with watercolor alone, say exactly that and why.',
```

- Keep the anti-spiral guard intact: accent suggestions must not conflict with a "sign now" verdict — add one line: `'If signingRecommendation is sign now, mediaOptions may still name one optional accent, clearly marked as optional.'`
- The `mediaOptions` field already renders in the panel and print sheet — verify it displays when populated (it was often empty before; now it rarely will be).
- Bump `PROMPT_VERSION` if Phase 4 hasn't already, or note the shared bump.

**Acceptance:** studio-check on 2 test paintings → `mediaOptions` returns concrete passage-plus-medium suggestions (or an explicit "watercolor alone" verdict), consistent with the signing recommendation.

---

## Execution order and dependencies

| Phase | Branch | Depends on | Size |
|---|---|---|---|
| 1 Idle state + left panel | `issue-026-idle-state-and-left-panel` | — | S–M |
| 2 Pre-read brief | `issue-027-pre-read-brief` | — | M |
| 3 Auto-title + continuity | `issue-028-auto-title-continuity` | — | M |
| 4 Stage-aware WIP prompt | `issue-029-stage-aware-wip-prompt` | 2 (stage selector) | S |
| 5 Studio Check accents | `issue-030-studio-check-accents` | — | S |

Recommended order: **1 → 2 → 4 → 5 → 3**. Phase 1 removes the daily irritation first; 2+4 together fix the biggest critique-quality problem; 3 last because title/continuity benefits from a few new journal entries to test against.

## Global verification checklist (after every phase)

1. `node server/semantic-proxy.js` starts clean; all four modes: upload → read → fields render → journal entry saved.
2. Freshly loaded image never shows failure copy; failure copy appears only after an actual failed request.
3. Plain static serve (no proxy): app loads, journal/chat/brief UI degrades gracefully, no console errors.
4. Mockup and correction flows unchanged.
5. Service-worker cache name bumped if any shell file changed; Lighthouse PWA 100.
6. No new npm dependencies; `studio-journal/` still ignored; no API keys in the diff.
7. Housekeeping at the end of the last phase: update `session-notes.md`, `README.md` (painter note, stage selector, auto-title), and add decisions D12 (idle state), D13 (pre-read brief), D14 (auto-title) to `docs/decisions.md`.
