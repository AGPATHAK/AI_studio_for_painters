# Issue 019 — Painter Profile Injection

## Goal

Every Gemini call carries a compact, editable painter profile plus a distilled doctrine block, so critiques speak painter-to-painter to this specific painter instead of a generic intermediate.

## Why

The mentor doesn't know the painter. Prompts in `server/semantic-proxy.js` are good but generic — no skill level, no taste anchor, no doctrine grounding at runtime even though `docs/knowledge-base/` holds 15 files of it.

## Scope

### Included

- `server/painter-profile.json` — skill level, media, tradition, values, avoid list, register.
- `server/doctrine.js` — one exported `DOCTRINE` string (300–500 words), distilled from `common_failure_modes.md`, `watercolor_specific_doctrine.md`, `intervention_scope_framework.md`.
- Proxy loads profile at request time via `withProfile(basePrompt)`, appended to all five prompt constants: `SEMANTIC_PROMPT`, `REFERENCE_IDEATION_PROMPT`, `IN_PROCESS_PROMPT`, `STUDIO_CHECK_PROMPT`, `FINISHED_CRITIQUE_PROMPT`.
- `DOCTRINE` appended only to `IN_PROCESS_PROMPT`, `STUDIO_CHECK_PROMPT`, `FINISHED_CRITIQUE_PROMPT` (not ideation/mockup).
- Intermediate-register guardrail line appended to the three critique prompts.
- `PROMPT_VERSION = '2.0'` constant, included in every API response payload.

### Excluded

- No journal, no chat, no progress memory (later phases).
- No UI changes.
- No change to annotated-mockup or correction prompts beyond nothing (Phase 6 handles those).

## Data / State / API Model

- Profile load: `fs.readFileSync` + `JSON.parse` at module load is fine for the file read, but `withProfile()` builds the string at request time (not cached at load) so a future reload endpoint stays possible. On read/parse error, fall back to `null` profile and log a warning — never crash the proxy.
- Response payload: add `promptVersion: PROMPT_VERSION` key to all normalized responses (semantic, in-process, studio-check, finished/archive). Reference Ideation and mockup responses do not require it but including it is harmless if trivial.

## Acceptance Criteria

- `node server/semantic-proxy.js` starts clean with no profile/doctrine load errors.
- POST to `/api/in-process` with a temporary `console.log` of the assembled prompt shows profile + doctrine text present; log removed before commit.
- Response JSON includes `promptVersion: "2.0"`.
- All four modes (reference-ideation, in-process, studio-check, archive) still return valid schema JSON.
- If `painter-profile.json` is deleted/corrupted, proxy still starts and still answers requests (profile block silently omitted).

## Validation Method

- `node --check server/semantic-proxy.js`
- `node --check server/doctrine.js`
- Manual: run proxy, exercise all four modes from the running app, confirm critiques read as before (profile/doctrine are additive context, not a rewrite) and confirm no console errors.
- Global verification checklist (from the improvement plan) run at end of phase.

## Likely Files / Modules

- `server/painter-profile.json` (new)
- `server/doctrine.js` (new)
- `server/semantic-proxy.js` (modify)

## Constraints

- Vanilla JS, Node stdlib only, no new npm dependencies.
- Do not touch annotated-mockup or correction prompts in this phase.
- Do not restructure existing prompt content beyond appending profile/doctrine/guardrail blocks.
- Static frontend must keep working unchanged (no frontend changes in this phase).

## Status / Next Action

Active. Implement on branch `issue-019-painter-profile`.
