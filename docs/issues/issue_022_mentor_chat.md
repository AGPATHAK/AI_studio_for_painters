# Issue 022 — Mentor Follow-up Chat

## Goal

After a critique, the painter can ask questions and get a scoped, direct answer from "the same mentor" — the single biggest step from report to mentor.

## Why

Right now a critique is a one-shot report. A painter who wants to push back, ask why, or get a clarification has nowhere to go. Follow-up chat closes that gap without turning the tool into a general chatbot.

## Scope

### Included

- Proxy endpoint `POST /api/followup`: body `{ image, mimeType, workflowMode, critique, history: [{role, text}], question }`. Sends the image + a system-style prompt + a compact serialization of the critique + capped chat history (last 10 turns) + the question to Gemini as a plain-text (no JSON schema) call. Applies `withProfile(..., { doctrine: true, guardrail: true })` like the other critique prompts.
- Frontend: an "Ask the mentor" section under the critique fields (all four modes, including Reference Ideation), with a transcript, single-line input, and send button. Hidden until a critique exists; hidden again whenever a new critique run starts (same reset points as the journal section: new upload, mode switch, reset click, re-run).
- Render turns as alternating plain paragraphs — `textContent` only, no markdown parsing.
- Each Q&A exchange is appended to the in-memory chat transcript and persisted to the current journal entry via the existing `POST /api/journal/update` (`chat` array field — already supported by the Phase 2 backend, no backend journal changes needed).
- 60s timeout via `AbortController`, matching the existing critique-request pattern.
- Hide the section (or fail quietly with an inline status line) when the proxy/endpoint is unavailable — never block the critique flow.

### Excluded

- No changes to Studio Journal endpoints beyond reusing `/api/journal/update`'s existing `chat` field.
- No changes to progress memory / distillation (Phase 3) — `previousEntryId` continuity is out of scope here.
- No markdown rendering, no rich formatting, no message editing/deleting.
- No changes to annotated-mockup or correction features.

## Data / State / API Model

- `appState.chat = { turns: [] /* {role: 'painter'|'mentor', text} */, sending: false }`.
- New DOM refs: `#chat-section`, `#chat-transcript`, `#chat-input`, `#chat-send-btn`, `#chat-status`, added to the existing guard block.
- New endpoint helper `getFollowupEndpoint()` + `APP_CONFIG.sameOriginFollowupPath = '/api/followup'`, following the existing `getJournalSaveEndpoint()` pattern.

## Acceptance Criteria

- After a critique in any mode, asking "why do you say the darks are scattered?" returns a scoped, concise (< 150 words unless procedural) answer referencing the actual critique.
- The transcript persists into the journal entry JSON (`chat` array) and survives a second question (context of the first question/answer is retained by the model).
- Chat section is hidden before any critique exists and resets (clears transcript) when a new critique run starts.
- Proxy down: no console errors, chat section stays hidden or shows a quiet unavailable status; nothing blocks the critique flow.

## Validation Method

- `node --check server/semantic-proxy.js`
- `node --check app.js`
- Manual: run proxy, critique an image, ask two sequential follow-up questions, confirm the second answer uses context from the first; inspect the journal entry file to confirm `chat` was persisted; kill the proxy and confirm no console errors and graceful hiding.
- Global verification checklist (from the improvement plan) run at end of phase.

## Likely Files / Modules

- `server/semantic-proxy.js` (modify — new `/api/followup` endpoint + Gemini call + prompt)
- `app.js` (modify — chat state, DOM refs, send/reset/visibility logic, journal chat persistence)
- `index.html` (modify — chat section markup under the critique panel)
- `styles.css` (modify — chat section, transcript, alternating turn styling)
- `service-worker.js` (modify — bump `CACHE_NAME`, shell files changed)

## Constraints

- Vanilla JS, no build step, no new dependencies.
- `textContent` only for rendering chat turns (XSS-safe).
- Do not touch annotated-mockup or correction features.
- Reuse the existing `/api/journal/update` endpoint rather than adding a new one for chat persistence.

## Status / Next Action

Active. Implement on branch `issue-022-mentor-chat`, branched from `issue-023-panel-tiers` (the chat section is inserted into Phase 5's tiered panel layout; not yet merged to `main`).
