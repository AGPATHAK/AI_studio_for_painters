# Issue 023 — Critique Panel UI Restructure

## Goal

The priority lesson leads; detail is available, not imposed. In the three diagnostic modes (In-Process, Studio Check, Archive), the right panel should show one visual lesson at a glance without scrolling, with everything else tucked behind a native disclosure.

## Why

The critique panel currently renders all ~13-17 fields as a flat list. The priority diagnosis (already the single most important line) is buried among equally-weighted dimension breakdowns, so the panel reads as a report, not a lesson.

## Scope

### Included

- Restructure the right panel into three tiers for In-Process, Studio Check, and Archive modes:
  1. **Priority lesson** (always visible): `priorityDiagnosis` (existing `#critique-message`, promoted styling), `teachingPoint`, the mode's verdict field (`repaintHandoff` for In-Process/Archive-as-"Final verdict", `signingRecommendation` for Studio Check), then `preserve` + `avoid` as two compact lines.
  2. **Full read** (collapsed by default): native `<details>/<summary>` containing scene read, value structure, focal hierarchy, edges/atmosphere, chroma, watercolor handling, scope, demonstration, and uncertainty.
  3. **Mode extras** (always visible): Studio Check's `finalAdjustments` + `mediaOptions`; Archive's `strengths` + `studyAreas` + `nextExploration` + `exhibitionNote`.
- Reference Ideation keeps its current flat layout — the same `<details>` element defaults `open` in that mode so nothing is hidden behind a click there.
- Small bundled fixes (plan §5.2):
  - Shorten `#semantic-source` copy to `Mentor: Gemini · ready / thinking… / unavailable` pattern.
  - Rename step hint "Tap to analyse" → "Read this reference".
  - Add painting title (if set) to the print sheet header.
  - Bump service-worker `CACHE_NAME`.

### Excluded

- No change to `app.js` DOM ref IDs — nodes are moved in `index.html`, not renamed, so the guard block and `setAiItem`/`setAiLabel` mechanism stay valid.
- No change to the annotated-mockup or correction features.
- No change to prompts (Phase 6) or progress memory (Phase 3).
- No "persistent development areas" on the print sheet — that data doesn't exist until Phase 3.

## Data / State / API Model

No new state. Purely a DOM reorganization plus one small behavior: a `fullReadDetails.open` toggle set from `refreshWorkflowChrome()` (`true` for Reference Ideation, `false` otherwise, on every refresh).

## Acceptance Criteria

- Each diagnostic mode shows tier 1 at a glance without scrolling on a 13″ laptop viewport.
- `<details>` opens to the full read; the "→ suggest edit" buttons and their preview/apply flow still work (delegated click handler binds on `#ai-critique-section`, an ancestor of the `<details>` — unaffected by nesting).
- Reference Ideation's layout is visually unchanged (details defaults open).
- Print output still includes the priority diagnosis and mode fields; painting title appears in the header when set.
- Served with the proxy down (plain static serve): no console errors, journal/chat UI still hidden as before.
- No console errors in any of the four modes.

## Validation Method

- `node --check app.js`
- Manual: run proxy, exercise all four modes; confirm tier 1 fields render without scrolling, `<details>` collapse/expand, edit-suggestion buttons still work inside the details, print preview shows expected fields.
- Global verification checklist (from the improvement plan) run at end of phase.

## Likely Files / Modules

- `index.html` (modify — reorder critique panel markup, wrap dimension fields in `<details>`)
- `styles.css` (modify — tier 1 promoted styling, `<details>/<summary>` styling, compact preserve/avoid row)
- `app.js` (modify — `fullReadDetails` ref + open/close toggle, shortened semantic-source copy, step-hint rename, print-sheet painting title)
- `service-worker.js` (modify — bump `CACHE_NAME`)

## Constraints

- Vanilla JS, no build step, no new dependencies.
- Keep all existing element IDs; only reposition nodes.
- Do not touch annotated-mockup or correction features.

## Status / Next Action

Active. Implement on branch `issue-023-panel-tiers`, branched from `main` (parallel-safe, no dependency on other phases).
