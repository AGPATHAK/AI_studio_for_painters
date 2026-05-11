# Issue 004 — M2 Critique Engine Integration

**Status: Planned**

## Goal

Wire the locked prompt set and JSON schema from M2a into the running PWA. User can paste their OpenAI API key into a Settings panel, click "Critique" on a loaded image, see a structured critique rendered in a side panel, and have the critique JSON available for the (later) edit engine.

## Why

Until critique runs inside the app and renders cleanly, M2.5 (the critique→edit bridge) cannot be implemented or evaluated end-to-end.

## Scope

### Included

- Settings panel UI: OpenAI API key field, "Save", "Clear", visible-only-on-demand, with a clearly worded security note ("Key is stored only in this browser. Anyone with access to this browser can read it.").
- API key persistence in `localStorage["aps:openai-key"]`.
- "Critique" button in the controls rail. Disabled when no image is loaded or no key is set.
- Critique request flow: image → multipart or data-URL payload → OpenAI Responses/Chat API → JSON output parsed against the M2a schema.
- Critique panel UI rendering the issues list with: priority badge, dimension label, region, suggested action, reasoning expandable.
- Loading state with a small visible indicator (no spinner-of-doom; one short status line).
- Error states: missing key, network failure, rate limit, malformed JSON. Each surfaced as a non-blocking message in the panel.
- Caching of the latest critique result in memory for the active image. Not persisted across reloads.

### Excluded

- Actually applying any edit. That's M2.5 + M3.
- Multi-image session history.
- Editing/correcting the critique. Painter accepts or re-runs.
- Printing/exporting the critique alone. Reference Sheet (M5) is the export surface.

## Data / State / API Model

```
apiKey:
  Widget:    text input (type=password)
  Session:   localStorage["aps:openai-key"]
  Type:      string
  Valid:     non-empty
  Default:   null
  Fallback:  Critique button disabled, tooltip explains
  Empty:     "Settings → paste your OpenAI key to enable critique"

currentCritique:
  Session:   window.appState.critique
  Type:      Critique object matching docs/critique-schema.md, or null
  Lifecycle: cleared when a new image is loaded; replaced on each successful Critique call
  Empty:     critique panel shows placeholder
```

API contract — request:
- Endpoint: OpenAI Responses API (or Chat Completions with vision + JSON schema response_format)
- Auth: `Authorization: Bearer <apiKey>` from `localStorage`
- Payload: system prompt + user prompt from `docs/prompts/`, image as data URL, response_format = JSON schema reference

API contract — response:
- 200 → JSON parsed and validated against schema; mismatched fields ignored, missing required fields treated as error
- 4xx with rate limit → exponential backoff (max 2 retries, then surface message)
- Any other error → message in panel, raw error logged to console (without the key)

## Acceptance Criteria

1. Settings panel accepts and persists a key; "Clear" removes it; refresh preserves it.
2. Critique button is correctly enabled/disabled based on (image loaded) AND (key present).
3. On a test image from the M2a fixture set, clicking Critique returns a valid critique JSON in under 30 s typical, with status indicator showing progress.
4. The critique panel renders all issues with their priority, dimension, region, action, and (collapsible) reasoning, in priority order.
5. Loading a new image clears the previous critique without re-querying.
6. Errors do not corrupt state: after any error, the panel is recoverable and the button is re-enabled.
7. No key value is ever printed to console, devtools network panel notwithstanding (the request line is unavoidable; document this).
8. PWA install + offline still works for the app shell. Critique obviously requires network.

## Validation Method

```bash
python3 -m http.server 8080
# Manual checklist run on three fixture images covering landscape / figure / still life.
# For each: critique returns structured JSON, panel renders, errors surfaced cleanly when API key is invalidated mid-session.
```

Plus: invalidate the key intentionally → confirm 401 error shows up as a user-visible message, not a silent failure.

## Likely Files / Modules

- `index.html` — adds Settings panel markup, Critique button, critique panel container
- `styles.css` — Settings panel, critique panel, priority badges, status line
- `app.js` — critique request module, response parser, panel renderer, key management, error surface
- `service-worker.js` — bump cache version

## Constraints

- Still no framework. Still no build step.
- The critique request module must be a single small function `requestCritique(imageBitmap, apiKey, options)` that returns a Promise<Critique>. Testable in isolation.
- All log statements that touch errors must redact `Authorization` and any field containing the key.
- The Settings panel must show the key as masked (••••) by default with a "show" toggle.
- All `localStorage` keys remain `aps:`-prefixed.

## Status / Next Action

Planned. Blocked by 002 (M1) and 003 (M2a).
