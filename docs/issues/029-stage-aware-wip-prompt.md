# Issue 029 — Stage-Aware In-Process Prompt (Stop Critiquing Incompleteness)

## Goal

Stop the In-Process mentor from flagging normal watercolor sequencing
("you haven't added darks yet", "this feels incomplete") as a defect, and
use the stage the painter declared (Phase 2) to calibrate what the
critique should even look at.

## Why

Owner-reported problem #4 from the v3 plan: the In-Process prompt
critiques incompleteness itself — things that belong to a later pass
anyway. A WIP mentor must judge decisions made so far, not the absence of
final-pass work. Phase 2 added the stage selector; this phase is the
prompt logic that actually uses it.

## Scope

### Included

Prompt-only. `server/semantic-proxy.js`:

- `IN_PROCESS_PROMPT`: insert the core "never critique incompleteness
  itself" rule right after "Judge the WIP on its own painting terms,"
  per the plan's exact wording.
- New `buildStageCalibrationBlock(paintingStage)`: when a stage is
  declared, the four stage → critique-focus mapping lines from the plan;
  when not declared, the one-line instruction to infer the stage from
  coverage/density and calibrate accordingly. Appended in
  `buildInProcessPrompt` only (Studio Check and Archive are not WIP
  modes and don't take a stage).
- Bump `PROMPT_VERSION` from `'2.0'` to `'3.0'` — shared across all
  modes; journal entries already carry it, so old and new critiques stay
  distinguishable. Phase 5 will note the shared bump rather than
  re-bumping.

### Excluded

- No changes to `app.js`, `index.html`, or `styles.css` — this phase
  edits prompt text and the version constant only.
- No changes to Studio Check, Archive, or Reference Ideation prompts.
- No restructuring of `buildInProcessPrompt`'s existing field
  instructions or the painter-brief/history blocks Phase 2/3 added.

## Data / State / API Model

None — pure prompt-text and constant changes. `paintingStage` was already
wired end-to-end in Phase 2; this phase only changes how the In-Process
prompt uses the value it already receives.

## Acceptance Criteria

- A half-covered WIP with no darks gets a priority lesson about the
  decisions already on the paper (mass design, edge economy, what to
  protect) plus at most sequencing guidance about future darks — zero
  "incomplete/missing/not yet added" framing.
- Before/after comparison on 3 WIP images at different declared stages:
  the "before" critique's incompleteness complaints are absent in
  "after"; structural critique of existing passages remains equally
  specific (not vaguer or shorter for the sake of avoiding the banned
  framing).
- `promptVersion` in new critiques reads `'3.0'`.

## Validation Method

- `node --check server/semantic-proxy.js`
- `node server/semantic-proxy.js` starts clean.
- Manual before/after: run In-Process critiques on 3 WIP photos (owner-
  supplied) at different stages, before and after the prompt edit,
  comparing the priority lesson and repaint handoff for incompleteness
  framing. Record the comparison in this file once run.

## Likely Files / Modules

- `server/semantic-proxy.js` (modify — `IN_PROCESS_PROMPT`,
  `buildInProcessPrompt`, `PROMPT_VERSION`)

## Constraints

- Prompt-only phase — no other files.
- Small, surgical edits — no restructuring of the existing prompt.

## Status / Next Action

Active. Implement on branch `issue-029-stage-aware-wip-prompt`, branched
from `main` (after Phase 2 merge). Regression-guard comparison pending
owner-supplied test images.
