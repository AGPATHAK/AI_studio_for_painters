# Issue 024 — Prompt Refinements (Bounded)

## Goal

Small, surgical prompt edits — no restructuring — that sharpen judgment quality without adding scope.

## Why

Three specific gaps found in the existing prompts: In-Process/Studio Check critiques don't name an explicit stylistic anchor to judge finish against; the annotated-mockup prompt doesn't guard against the model repainting instead of annotating; and correction-edit prompts don't constrain the output to a rough demonstration rather than a polished finish.

## Scope

### Included

- `STUDIO_CHECK_PROMPT` and `IN_PROCESS_PROMPT` (`server/semantic-proxy.js`): add one line naming the taste anchor — the restraint of Wesson and Seago, judged against that standard rather than realist completeness.
- `ANNOTATED_MOCKUP_PROMPT` (`server/semantic-proxy.js`): add one line requiring annotation marks to be clearly graphic (arrows, circles, hatching, text labels) and not blend into or repaint the underlying image.
- `buildEditPrompt` (`app.js`): append a constraint that the correction render as a painter's rough demonstration, not a polished finish.
- Verify total prompt length (profile + doctrine + guardrail + history blocks + base prompt) stays comfortably under ~8,000 chars for the critique prompts; log the length once during manual testing.

### Excluded

- No prompt restructuring, no new fields, no schema changes.
- No changes to Reference Ideation or Archive prompts (not mentioned in scope).
- No changes to the Journal view, chat, or distillation logic from Phases 3/4.

## Data / State / API Model

None — pure prompt-text edits.

## Acceptance Criteria

- Side-by-side before/after critiques on 2–3 test images read as more specific, not longer.
- Mockups remain clearly annotated overlays, not repaints.
- Correction edits still read as rough demonstrations (unchanged visual behavior, reinforced by the added prompt line).
- Total critique prompt length stays under ~8,000 chars with profile + doctrine + guardrail + history blocks included.

## Validation Method

- `node --check server/semantic-proxy.js`
- `node --check app.js`
- Manual: run an In-Process and a Studio Check critique before/after, compare specificity; run a mockup and a correction edit to confirm behavior is unchanged or improved; log prompt length once.

## Likely Files / Modules

- `server/semantic-proxy.js` (modify — three prompt constants)
- `app.js` (modify — `buildEditPrompt`)

## Constraints

- Small, surgical edits only — no restructuring.
- Do not touch annotated-mockup or correction feature logic beyond the prompt-text edit itself.

## Status / Next Action

Active. Implement on branch `issue-024-prompt-polish`, branched from `issue-021-progress-memory` (continuing the phase stack).
