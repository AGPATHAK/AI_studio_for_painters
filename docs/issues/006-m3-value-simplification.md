# Issue 006 — M3 First Controlled Edit (Value Simplification + Shadow-Mass Correction)

**Status: Planned**

## Goal

Apply one fixed transformation — value simplification with shadow-mass correction — driven by a critique item selected by the user. Result is displayed beside the original. Edit is traceable in the UI to the critique item that triggered it. History stack allows revert.

## Why

This is the project's first real test of the Critique → Correction → Repaint loop. Until M3 works end-to-end, the project has no demonstrable user value.

## Scope

### Included

- "Apply Edit" affordance attached to each critique item with priority `high` (and `medium` once `high` items are exhausted).
- Edit request construction via the M2.5 bridge.
- OpenAI image-edit API call (`gpt-image-1`) using the bridge's edit request.
- History stack: `original`, `last_edit`, `current_edit`, with revert to any of the three.
- UI indicator on the rendered edit showing which critique item drove it ("Edit derived from: <issue_type> — <region>").
- Side-by-side comparison view (basic; full UX polish is M4).
- Error states for the edit call: network, rate limit, content policy, malformed image bytes returned.
- Anti-beautification verification: every applied edit is annotated with the prompt that was actually sent, accessible via a "Debug" disclosure for the developer to spot drift.

### Excluded

- Multiple simultaneous edits.
- Variation generation (M6).
- Style-constrained transformations (M7).
- Multi-session history (M8). v1 history is in-memory only.
- Brush masking UI (M9).
- Reference Sheet export (M5).

## Data / State / API Model

```
historyStack:
  Session:   window.appState.history
  Type:      { original: Image, lastEdit: Image | null, currentEdit: Image | null, currentSourceCritiqueId: string | null }
  Default:   { original: <uploaded image>, lastEdit: null, currentEdit: null, currentSourceCritiqueId: null }
  Lifecycle: original is locked once set per session; lastEdit shifts to whatever currentEdit was before a new edit lands; revert sets currentEdit = lastEdit (or null).
  Refresh:   page reload clears the whole stack.
  Empty:     no edit displayed; comparison view shows original on both sides.
```

API contract — request:
- Endpoint: OpenAI image edit API (`gpt-image-1`)
- Auth: same key as critique
- Payload: image (PNG bytes), mask (PNG bytes, alpha-zero = editable region) when region mode is `mask` or `bbox`; no mask when `global`; prompt and constraints from the bridge's edit request
- size: image's native size capped at provider limit (resize down if needed, original retained)

API contract — response:
- 200 → PNG bytes; decoded to ImageBitmap; pushed onto history stack
- Provider content policy refusal → user-visible "Edit rejected by provider" with the reason text from the API
- 4xx rate limit → backoff (max 2 retries), then surface message
- Malformed response → preserve current state, show error

## Acceptance Criteria

1. With a loaded image and a successful critique, clicking "Apply Edit" on a high-priority value-structure item produces a new image rendered to the right of the original within a reasonable time.
2. The edit visibly groups values into coherent shadow/light masses; it is **not** posterization. A painter can confirm this on the fixture set.
3. The UI shows which critique item triggered the active edit. Selecting a different item triggers a new edit (not a layered one).
4. Revert restores the previous state. Two reverts in succession return to the original.
5. Failures (network, content policy, malformed JSON) leave state intact and the user can retry.
6. The actual prompt sent is recoverable via a debug disclosure for at least the session.
7. No "added detail" drift: on the fixture set, applied edits do not introduce texture, finishing, or content not present in the original.
8. The full loop — upload, critique, select item, apply, compare, revert — works on the three primary fixture images.

## Validation Method

```bash
python3 -m http.server 8080
# Use three fixtures from the M2a set. For each:
# - Upload image
# - Critique
# - Apply Edit on the dominant high-priority value-structure item
# - Visually verify shadow-mass grouping, not posterization
# - Toggle to original; toggle back
# - Revert; confirm history behavior
```

Painter pass criterion: "Yes, this edit reflects the critique AND improves clarity of value structure" on ≥2 of 3 fixtures.

## Likely Files / Modules

- `app.js` (or `app/edit-engine.js`) — edit request executor, response decoder
- `app.js` (or `app/history.js`) — history stack
- `index.html` — comparison view container, Apply Edit and Revert buttons
- `styles.css` — comparison view layout, edit-source annotation
- `service-worker.js` — bump cache version

## Constraints

- Only one transformation type for v1: value simplification + shadow-mass. Other transformations are M6/M7.
- No auto-apply. User must click Apply Edit.
- No persistence of edited images in `localStorage` or IndexedDB in v1. History is in-memory.
- Edits never overwrite the original. The original is sacred.
- All image payloads sent to the API are downscaled to the provider's max input bound only if they exceed it. Otherwise sent native.
- Network calls never log the API key. Headers redacted on console errors.

## Status / Next Action

Planned. Blocked by 005 (M2.5). After this issue commits, M4 (Comparison UX polish) becomes the natural next milestone.
