# Issue 005 — M2.5 Critique → Edit Bridge

**Status: Planned**

## Goal

Define and implement the contract that turns a single critique item into a concrete edit-engine request. No edits applied yet — this issue produces the mapping, the prompt template for the edit model, and the region-resolution logic, and validates them on paper.

## Why

This is the project's identified primary bottleneck. Without a reliable mapping from critique to edit, M3 will produce edits that look unrelated to what the critique called out, and the whole loop fails.

## Scope

### Included

- A canonical "edit request" data structure that the edit engine will consume.
- A mapping function `critiqueItemToEditRequest(item, imageMeta, context)` that takes one critique issue and produces one edit request.
- A region resolver that turns the critique's natural-language `region` field into an actual mask or bounding box, or — when resolution fails — a `region: global` fallback that is explicitly logged.
- A prompt template for the image edit model that:
  - References the `issue_type` and `suggested_action`.
  - Constrains against beautification (no added detail, no texture, no finishing).
  - Holds painterly intent (value grouping, shadow mass coherence, edge respect).
- A small test harness that runs the mapping over the M2a fixture critiques and writes the resulting edit requests for human review.

### Excluded

- Actually calling the image edit API. M3.
- Multi-item edit composition (apply two critique items at once). Not in v1.
- Brush-based user mask drawing. Deferred (M9).

## Data / State / API Model

Edit request data structure (canonical):

```json
{
  "edit_id": "uuid",
  "source_critique_id": "string (image_id + issue index)",
  "issue_type": "value_structure | edge_control | composition | chroma",
  "region": {
    "mode": "mask | bbox | global",
    "mask_png_data_url": "string, when mode=mask",
    "bbox": "[x, y, w, h] normalized, when mode=bbox",
    "resolution_confidence": "high | medium | low",
    "fallback_reason": "string, when mode=global"
  },
  "edit_model": "gpt-image-1",
  "prompt": "string (composed from template + critique fields)",
  "constraints": [
    "no added detail",
    "preserve drawing",
    "respect existing edges unless edge correction is the issue"
  ],
  "guidance": {
    "size": "string",
    "response_format": "string"
  }
}
```

Region resolver behavior:
- If `region_bbox` is present in the critique → use it directly, confidence `high`.
- If only a natural-language `region` is present → invoke a small grounding call (vision LLM, returns a bbox), confidence `medium`.
- If grounding fails or returns nothing → `mode: global`, confidence `low`, `fallback_reason` populated.

## Acceptance Criteria

1. Edit request schema is documented in `docs/edit-request-schema.md` with field semantics and one fully-worked example per `issue_type`.
2. Mapping function is implemented as a pure function in `app.js` (or `app/edit-bridge.js` if we split files at this point) — given a critique item and image metadata, it returns a valid edit request without I/O.
3. Region resolver is implemented with the three-tier fallback. Each tier is unit-test-able in isolation.
4. For every critique in the M2a example library, the harness produces an edit request whose `prompt` field a human reader can connect to the original critique's `suggested_action` without ambiguity.
5. At least one fixture per `issue_type` produces a non-global region. Confirms the resolver isn't always falling back.
6. The prompt template explicitly contains the anti-beautification clauses listed in `roadmap.md §5`.

## Validation Method

```bash
node tools/run-edit-bridge-eval.mjs --critique-set test-fixtures/critique-examples/
# Outputs edit requests as JSON under test-fixtures/edit-requests/<image>/<issue-index>.json
# Manual painter review of: does this edit request, as worded, plausibly improve the painting?
```

Pass/fail: ≥80% of generated edit requests pass painter review on the M2a fixture set.

## Likely Files / Modules

- `docs/edit-request-schema.md`
- `docs/prompts/edit-template.md`
- `app.js` (or `app/edit-bridge.js` if we split)
- `tools/run-edit-bridge-eval.mjs`
- `test-fixtures/edit-requests/<image>/<issue-index>.json`

## Constraints

- Mapping function must be pure: no `fetch`, no `Date.now()` outside of `edit_id`, no DOM access. Region grounding is a separate function.
- Region resolver may call OpenAI for vision-grounding, but must degrade gracefully to global when offline.
- Edit prompts must never instruct the model to "improve", "enhance", or "make beautiful". Painterly verbs only (simplify, group, suppress, anchor, mute, etc.).
- No image edits performed in this issue. Strictly request-construction.

## Status / Next Action

Planned. Blocked by 004 (M2).
