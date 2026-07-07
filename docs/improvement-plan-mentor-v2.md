# Improvement Plan — Mentor v2

_Date: 07-07-2026. Author: Claude (architect pass). Executor: Claude Sonnet 5._
_Read `session-notes.md`, `docs/workflow-sop.md`, and this file before starting any phase._

## Purpose

Turn the app from a **stateless critique report generator** into a **mentor that knows the painter**. The app works and nothing is broken — every change below is additive or a refinement. Do not redesign what exists.

The owner is an **intermediate painter** (watercolor + pastel) working in the British tradition — Edward Seago, Edward Wesson, James Fletcher-Watson. Preferences: simplicity of form, strong value structure, muted painterly effects over realism. Critiques must never explain basic technique.

## Gap analysis (what this plan fixes)

1. **No persistence.** Critiques vanish on reload. Progress tracking is impossible today.
2. **The mentor doesn't know the painter.** Prompts in `server/semantic-proxy.js` are good but generic — no skill level, no taste profile, no memory of past critiques.
3. **Knowledge base unused at runtime.** `docs/knowledge-base/` (15 files of doctrine) is never injected into prompts.
4. **One-shot critique.** No way to ask the mentor a follow-up question.
5. **Critique panel is a wall of text.** Up to 17 flat fields; the priority lesson doesn't stand out.

## Locked constraints (do not violate)

- Vanilla JS / HTML / CSS. No framework, no build step, no bundler.
- **No new npm dependencies.** The proxy uses Node stdlib only (`http`, `fs`, `path`); keep it that way.
- Static frontend must keep working on GitHub Pages: every new feature degrades gracefully when the proxy is absent (hide, don't break).
- `aps:` prefix on all localStorage keys.
- Bump the service-worker cache name (`apsv1-shell-YYYY-MM-DDx`) on every shell change.
- Do not remove or rework the annotated-mockup or correction features. **Owner decision (07-07-2026): keep both as-is**; only prompt-level refinements allowed.
- Do not touch anything related to Painter's Reference Lab (sister app).
- Follow `docs/workflow-sop.md`: one phase = one issue file in `docs/issues/` = one branch (`issue-NNN-short-name`). Claude edits files and hands the user explicit git commands; Claude does not commit or push.
- Sandbox quirk: tell the user `rm -f .git/index.lock` before staging.

---

## Phase 1 — Painter profile injection (prompts know the painter)

**Goal:** every Gemini call carries a compact, editable painter profile.

### 1.1 Create `server/painter-profile.json`

```json
{
  "profileVersion": 1,
  "skillLevel": "intermediate",
  "media": ["watercolor", "soft pastel"],
  "tradition": "British watercolor tradition — Edward Seago, Edward Wesson, James Fletcher-Watson",
  "values": "simplicity of form, dominant value masses, muted painterly effects, atmosphere over description",
  "avoid": "photorealism, overworking, explaining basic technique (washes, wet-in-wet, drawing fundamentals are assumed competent)",
  "register": "Speak painter-to-painter. Skip beginner explanations. Name passages concretely. One priority lesson per critique."
}
```

### 1.2 Proxy changes (`server/semantic-proxy.js`)

- Load the profile at startup with `fs.readFileSync` + `JSON.parse`; on any error, fall back to `null` and log a warning (never crash).
- Add `buildProfileBlock(profile)` returning a single string, e.g.:
  `"Painter profile: intermediate; watercolor and soft pastel; works in the British watercolor tradition (Seago, Wesson, Fletcher-Watson); values simplicity of form ... Do not explain basic technique."`
- Append the profile block to **all five** prompt constants at request time (not at module load, so a future reload endpoint stays possible): `SEMANTIC_PROMPT`, `REFERENCE_IDEATION_PROMPT`, `IN_PROCESS_PROMPT`, `STUDIO_CHECK_PROMPT`, `FINISHED_CRITIQUE_PROMPT`. Simplest correct approach: a helper `withProfile(basePrompt)` used wherever the prompt string is passed to Gemini.

### 1.3 Distill the knowledge base into a doctrine block

- Create `server/doctrine.js` exporting one string constant `DOCTRINE` of **300–500 words maximum**, hand-distilled from these files (in priority order):
  1. `docs/knowledge-base/common_failure_modes.md` — the named failure modes (scattered darks, over-equal edges, chroma competition, overworking, digital tightness).
  2. `docs/knowledge-base/watercolor_specific_doctrine.md` — medium-specific judgment rules.
  3. `docs/knowledge-base/intervention_scope_framework.md` — the local/regional/compositional/global-study scope classes.
- Append `DOCTRINE` to the three critique prompts (`IN_PROCESS_PROMPT`, `STUDIO_CHECK_PROMPT`, `FINISHED_CRITIQUE_PROMPT`). Do **not** append to ideation or mockup prompts (they have their own doctrine inline and token budget matters).
- Add `const PROMPT_VERSION = '2.0';` in the proxy and include it in every API response payload (needed by Phase 2 journal entries).

### 1.4 Intermediate-register guardrails

Add to the three critique prompts:
`"The painter is intermediate. Never explain how to perform basic techniques (flat wash, wet-in-wet, glazing, drybrush mechanics). Assume competent drawing and washes. Critique judgment, not execution mechanics, unless a specific passage shows a handling fault worth naming."`

**Acceptance:** run the proxy, POST a test image to `/api/in-process`; the request body sent to Gemini (add a temporary `console.log`, remove before commit) contains profile + doctrine; response includes `promptVersion`. All four modes still return valid schema JSON.

---

## Phase 2 — Studio journal (persistence via proxy)

**Goal:** every successful critique is saved automatically to disk; nothing is lost.

### 2.1 Storage layout

- Folder: `studio-journal/` at repo root. Add to `.gitignore`.
- One JSON per critique: `studio-journal/entries/2026-07-07_1432_in-progress-guidance.json`.
- One thumbnail per critique: same basename, `.jpg`, longest side **800 px** — decode and downscale **in the browser** (canvas → `toDataURL('image/jpeg', 0.85)`) and send the thumbnail data URL with the save request; the proxy only writes files. (No image libraries in Node — stdlib only.)

### 2.2 Entry schema

```json
{
  "id": "uuid",
  "savedAt": "ISO-8601",
  "workflowMode": "in-progress-guidance",
  "filename": "original filename",
  "paintingId": "user-entered painting title, or null",
  "promptVersion": "2.0",
  "model": "gemini model id from response",
  "critique": { "...full normalized semantic payload..." },
  "userNote": "",
  "userRating": null,
  "chat": []
}
```

`paintingId` links multiple sessions of the same painting (WIP → studio check → archive). `chat` is filled by Phase 4. `userRating` is `"useful" | "partly" | "off" | null`.

### 2.3 Proxy endpoints

- `POST /api/journal/save` — body: full entry minus `id`/`savedAt` plus `thumbnail` (data URL). Writes JSON + jpg, returns `{ id }`. Create directories on demand (`fs.mkdirSync(..., { recursive: true })`).
- `GET /api/journal/list` — returns array of entry summaries (id, savedAt, workflowMode, filename, paintingId, `critique.priorityDiagnosis`, userRating), newest first. Read directory each call; no in-memory cache needed at this scale.
- `GET /api/journal/entry?id=...` — returns full entry.
- `POST /api/journal/update` — body `{ id, userNote?, userRating?, paintingId?, chat? }`; merges into the existing file.
- Reuse the existing CORS/preflight helpers and 30 MB body limit.

### 2.4 Frontend (`app.js`, `index.html`)

- After every successful critique (all four modes): build the entry, generate the thumbnail, POST to save. Show a quiet one-line status under the semantic-source line: "Saved to studio journal" / "Journal unavailable (proxy offline)". Never block or error the critique flow if save fails.
- Before saving, prompt-free capture of `paintingId`: a small text input in the critique panel labelled "Painting title (links sessions)" pre-filled from the last entry with the same filename if any.
- Add rating control (three small buttons: useful / partly / off) under the critique; POST to `/api/journal/update`.
- Add a free-text note field ("What I did about this") with a save-on-blur update.
- **Graceful degradation:** feature-detect by calling `/api/journal/list` once at startup; if it fails, hide all journal UI (the GitHub Pages case).

**Acceptance:** run a critique in each mode → JSON + jpg appear in `studio-journal/entries/`; rating and note round-trip; app on plain `python3 -m http.server` (no proxy) shows no journal UI and no console errors from journal code.

---

## Phase 3 — Progress memory (the mentor remembers)

**Goal:** recurring development areas distilled from the journal are injected into critiques, and visible in a simple progress view.

### 3.1 Distillation

- Proxy endpoint `POST /api/journal/distill`: loads the **last 15** journal entries (critique text fields only, no images), sends them to Gemini (text-only call, same model) with a schema-enforced prompt returning:

```json
{
  "persistentDevelopmentAreas": ["...max 3, each one sentence..."],
  "improvingAreas": ["...max 2..."],
  "establishedStrengths": ["...max 3..."],
  "entryCount": 15,
  "generatedAt": "ISO-8601"
}
```

- Prompt requirements: identify **patterns across paintings**, not single-painting issues; use the doctrine vocabulary (value structure, edge economy, chroma hierarchy, overworking); weight recent entries higher; ignore entries rated "off".
- Cache result to `studio-journal/progress-summary.json`. Regenerate only when requested (button) or when ≥5 new entries exist since `generatedAt` (check on save).

### 3.2 Injection into critique prompts

- When handling `/api/in-process`, `/api/studio-check`, `/api/finished-critique`: if `progress-summary.json` exists, append:
  `"Painter history — persistent development areas from past sessions: <areas>. Improving: <areas>. If this painting shows one of the persistent areas again, name the pattern explicitly ('this is the recurring X issue') and make it the priority lesson candidate. Do not manufacture a connection if the painting does not show it."`
- **Same-painting continuity:** if the frontend sends a `previousEntryId` (user picked a prior session of this painting), load that entry's `priorityDiagnosis`, `repaintHandoff`, and `teachingPoint` and append: `"Previous session on this painting concluded: <...>. Assess whether that guidance was acted on and say so."`

### 3.3 Progress view (frontend)

- Add a fifth left-panel item **"Journal"** below the four mode tabs (it is a view, not a workflow mode — do not add it to `WORKFLOW_MODES`; use a separate UI state so the existing mode logic is untouched).
- Content, top to bottom:
  1. **Development areas card** — the three persistent areas, improving areas, strengths, `generatedAt` date (dd-mm-yyyy), and a "Refresh summary" button → `/api/journal/distill`.
  2. **Entry list** — thumbnail, date (dd-mm-yyyy), mode label, painting title, priority diagnosis (one line), rating. Click → expand full critique read-only (reuse the existing critique-field rendering; do not duplicate markup — extract the field-list renderer into a function both paths call).
- Plain list, no charts. Keep styling consistent with `styles.css` tokens.
- In In-Process and Studio Check modes, when the current filename or paintingId matches previous entries, show "Previous sessions of this painting" links and a checkbox "Give the mentor the last session's conclusions" → sets `previousEntryId` on the critique request.

**Acceptance:** with ≥3 saved entries, distill returns sane areas; a new in-process critique's Gemini request contains the history block; Journal view lists entries and opens them; same-painting continuity produces a critique that references the previous session.

---

## Phase 4 — Mentor follow-up chat

**Goal:** after a critique, the painter can ask questions — the single biggest step from report to mentor.

### 4.1 Proxy endpoint `POST /api/followup`

- Body: `{ image, mimeType, workflowMode, critique, history: [{role, text}], question }`.
- Gemini call: image + a system-style prompt + serialized critique + chat history + question. Plain-text response (no JSON schema).
- Prompt:
  `"You are the same studio mentor who wrote the critique below on this painting. Answer the painter's follow-up question. Rules: stay scoped to this painting and this critique; painter-to-painter register, intermediate level, no basic technique explanations; be direct and concise (under 150 words unless the question demands a procedure); you may disagree with your own critique if the painter's point is right — say so plainly; do not redesign the painting or expand scope beyond the critique's intervention scope; if the question needs information you cannot see, say so. Doctrine and painter profile apply."`
  Append profile block + doctrine.
- Include prior turns (cap history at last 10 turns to bound tokens).

### 4.2 Frontend

- Under the critique fields (all modes except Reference Ideation — ideation gets it too if trivial, otherwise skip): a "Ask the mentor" section — transcript area + single-line input + send button. Disabled until a critique exists.
- Render turns as simple alternating styled paragraphs. No markdown parsing; `textContent` only (XSS-safe, consistent with existing code).
- Each exchange is appended to the journal entry via `/api/journal/update` (`chat` array). 60 s timeout, same AbortController pattern as existing requests.
- Hide the section when the proxy is unavailable.

**Acceptance:** ask "why do you say the darks are scattered?" after an in-process critique → scoped, concise answer; transcript persists in the journal JSON; second question retains context of the first.

---

## Phase 5 — Critique panel UI restructure

**Goal:** the priority lesson leads; detail is available, not imposed.

### 5.1 Panel hierarchy (in-process / studio check / archive)

Restructure the right panel to three tiers:

1. **Priority lesson (always visible, visually dominant):** `priorityDiagnosis` styled larger (existing `panel-copy` promoted), then `teachingPoint`, then the mode's verdict field (`repaintHandoff` / `signingRecommendation` / `repaintHandoff`-as-final-verdict). Then `preserve` + `avoid` as two short lines.
2. **Full read (collapsed by default):** a `<details>` element "Full read — value, focal, edges, chroma, handling" containing the five dimension fields + scope + demonstration + uncertainty. Native `<details>/<summary>` — no JS state needed, styles in `styles.css`.
3. **Mode extras:** Studio Check (`finalAdjustments`, `mediaOptions`) and Archive (`strengths`, `studyAreas`, `nextExploration`, `exhibitionNote`) stay always-visible — they are the point of those modes.

Reference Ideation keeps its current flat layout (it is generative, not diagnostic) — no change.

Implementation notes: keep all existing element IDs and the `setAiItem`/`setAiLabel` mechanism; move nodes in `index.html` rather than renaming, so `app.js` DOM refs and the guard block stay valid. Update the guard block only if elements are added.

### 5.2 Small fixes bundled here

- The "→ suggest edit" buttons (`refreshEditButtons`) move inside the Full read `<details>` with their parent items — verify delegated click handler still works (it binds on `aiCritiqueSection`, so it will).
- Print sheet (`preparePrintSheet`) already selects key fields — confirm unaffected; add painting title and persistent development areas (if available) to the print header.
- `semanticSource` line: shorten copy to "Mentor: Gemini · ready / thinking… / unavailable" — current strings are developer-speak.
- Rename user-facing button "Explore" hint copy that still says "Tap to analyse" → "Read this reference".
- Bump service-worker cache name.

**Acceptance:** each mode shows tier 1 at a glance without scrolling on a 13″ laptop; `<details>` opens to full read; print output unchanged or better; no console errors; Lighthouse PWA score stays 100.

---

## Phase 6 — Prompt refinements (bounded)

Small, surgical prompt edits — no restructuring:

1. `STUDIO_CHECK_PROMPT` and `IN_PROCESS_PROMPT`: add one line naming the taste anchor: `"The painter's stylistic north star is the restraint of Wesson and Seago: big connected washes, economy of statement, muted chroma, atmosphere over description. Judge finish level against that standard, not against realist completeness."`
2. `ANNOTATED_MOCKUP_PROMPT`: add `"Annotation marks must be clearly graphic (drawn arrows, circles, hatching, text labels) and must not blend into or repaint the underlying image."` (keeps the kept-as-is feature honest).
3. Correction edit prompts (`buildEditPrompt` in `app.js`): append constraint `"Render the change as a painter's rough demonstration, not a polished finish."`
4. Verify every prompt still fits comfortably with profile + doctrine + history blocks (log total prompt length once during testing; target < 8,000 chars for critique prompts).

**Acceptance:** side-by-side before/after critiques on 2–3 test images read as more specific, not longer; mockups remain clearly annotated overlays.

---

## Phase 7 — Housekeeping (do last, or fold into final commit)

- `session-notes.md` is badly stale (says M1/M2a; the app is far past that). Rewrite it to reflect post-v2 state per its own conventions.
- `README.md`: "runtime files do not exist yet" and OpenAI references are wrong — update to Gemini proxy reality, document `studio-journal/`, `painter-profile.json`, and the new endpoints.
- Add decisions to `docs/decisions.md`: D8 journal-on-disk via proxy; D9 painter profile file; D10 follow-up chat endpoint; D11 correction/mockup kept as-is (owner decision, 07-07-2026).
- Create issue files `docs/issues/019`–`024` for phases 1–6 per SOP before starting each.

---

## Execution order and dependencies

| Phase | Branch suggestion | Depends on | Size |
|---|---|---|---|
| 1 Profile + doctrine | `issue-019-painter-profile` | — | S |
| 2 Studio journal | `issue-020-studio-journal` | 1 (promptVersion) | M |
| 3 Progress memory | `issue-021-progress-memory` | 2 | M |
| 4 Follow-up chat | `issue-022-mentor-chat` | 1 (2 for persistence) | M |
| 5 Panel restructure | `issue-023-panel-tiers` | — (parallel-safe) | S–M |
| 6 Prompt refinements | `issue-024-prompt-polish` | 1 | S |
| 7 Housekeeping | fold into last phase | all | S |

Recommended order: **1 → 2 → 5 → 4 → 3 → 6 → 7**. Phase 5 early because it improves daily use immediately; Phase 3 needs journal entries to accumulate before distillation is meaningful.

## Global verification checklist (run after every phase)

1. `node server/semantic-proxy.js` starts clean; static app serves at :8080.
2. All four modes: upload → critique → fields render → print sheet works.
3. Mockup and correction flows unchanged.
4. Plain static serve (no proxy): app loads, journal/chat UI hidden, no console errors.
5. Service-worker cache name bumped if any shell file changed.
6. No new npm dependencies; `git status` shows only intended files; `studio-journal/` ignored.
