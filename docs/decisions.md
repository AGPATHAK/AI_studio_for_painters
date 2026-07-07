# Decisions Log

Locked decisions, dated. Append-only. Earlier rows are not edited; they are superseded by later rows when the project changes direction. Each row records what was decided, why, and what alternatives were considered.

---

## D1 — 2026-05-11 — Architecture: Static PWA, vanilla JS/HTML/CSS

**Decision.** Build v1 as a static Progressive Web App with vanilla JavaScript, HTML, and CSS. No framework, no build step. File layout matches PRL: `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `service-worker.js`, `icons/`, `docs/`.

**Why.**
- Mirrors the sister app (Painter's Reference Lab) beat-for-beat, so the two are maintainable side-by-side and image-level interop is trivial.
- Zero toolchain: no npm install, no build pipeline, no framework upgrades.
- Deployable on GitHub Pages.
- Installable on iPad and desktop for actual studio use.
- Image data stays in the browser by default; only the user-triggered API calls leave the device.

**Alternatives rejected.**
- **Streamlit.** Fast to prototype but pulls in a Python runtime, a separate hosting story, and would diverge from PRL's architecture. Region/brush UI for M6 would also be awkward.
- **Next.js + React.** More UI ceiling for later masking work, but high upfront cost (build setup, state libraries, deploy pipeline) and a permanent divergence from PRL.
- **Gradio.** Similar trade-offs to Streamlit; backend-bound.

**Revisit when.** Either (a) the brush/region UI in M6 cannot be done acceptably with vanilla canvas APIs, or (b) v1 is shipped and we want to add features that genuinely warrant a framework.

---

## D2 — 2026-05-11 — AI vendor: OpenAI, single vendor for v1

**Decision.** Use OpenAI for both the critique LLM (current `gpt-4o`-class model with structured JSON output) and the image edit model (`gpt-image-1`, with mask support).

**Why.**
- One API key, one billing line, one rate-limit story.
- `gpt-image-1` supports mask-based edits, which is what M3 region-first editing requires.
- Strong instruction-following on painterly language reduces prompt drift.
- Swapping vendors later is a contained refactor since the critique→edit contract is the abstraction boundary.

**Alternatives rejected (for now).**
- **Replicate (SDXL inpaint, Flux).** More model choice and stronger painterly inpainting options, but more integration plumbing and provider-specific quirks.
- **Gemini image models.** Capable on structure preservation, but tooling for masks is less mature.
- **Multi-vendor split.** Premature flexibility; adds plumbing without v1 value.

**Revisit when.** OpenAI image quality regresses on painterly edits, or we hit a wall on a specific transformation that another vendor handles better.

---

## D3 — 2026-05-11 — API key handling: BYO key in localStorage

**Decision.** The user supplies their own OpenAI API key on first run via a Settings panel. The key is persisted in browser `localStorage` and read at request time. No backend, no proxy, no shared key.

**Why.**
- Matches "image stays local" philosophy as closely as possible given the use of an external API.
- Zero infrastructure: no Cloudflare Worker, no Vercel function, no auth.
- For a personal studio tool used by the developer (and a small number of trusted painters), the security model is acceptable: the key never leaves the user's device except in the direct call to `api.openai.com`.

**Alternatives rejected (for now).**
- **Thin proxy (Cloudflare Worker / Vercel function).** More secure for distribution, but adds infra and a deploy target beyond GitHub Pages. Not justified for v1.
- **Server-side key, user accounts.** Way out of scope.

**Revisit when.** The app is intended to be used by people who should not need their own OpenAI account, _or_ if Anthropic publishes an equivalent image edit API and we want to abstract behind a proxy.

**Risk notes.**
- The key is visible to anyone with access to the user's browser/devtools. Document this clearly in the Settings panel.
- Provide a "Clear API key" action.
- Never log the key.
- Never include the key in exported Reference Sheets or screenshots.

---

## D4 — 2026-05-11 — Separation from PRL is non-negotiable

**Decision.** AI Painter Studio shares no runtime, UI, or state with Painter's Reference Lab. The only allowed interop is image-file-level: a user manually exports from one and imports into the other.

**Why.**
- PRL's value is its determinism and predictability. Mixing in probabilistic AI behavior would compromise that.
- The two apps target different cognitive modes (analytical vs interpretive).
- Keeping the codebases separate keeps PRL's app shell small and its service worker cache tight.

**Alternatives rejected.**
- Shared component library, shared service worker, deep linking. All add coupling for marginal user benefit.

**Revisit when.** Never, unless the project is rescoped at a strategic level.

---

## D5 — 2026-05-11 — Critique precedes edit; user triggers every edit

**Decision.** No edit may be applied without a preceding critique. The user must explicitly trigger each edit. Every edit must be traceable to a specific critique item shown in the UI.

**Why.**
- Aligns with the design philosophy: the system is a teaching instrument, not an autonomous beautifier.
- Prevents the app from drifting into "image generator" mode.
- Makes the critique → edit contract debuggable: when an edit feels wrong, you can inspect which critique item drove it.

**Alternatives rejected.**
- Auto-apply suggested edits. Faster but undermines the learning goal and creates "black box" outputs.

**Revisit when.** Never for v1.

---

## D6 — 2026-05-11 — Repository name: `AI_studio_for_painters`

**Decision.** The repository is named `AI_studio_for_painters`. Local folder, GitHub repo, and (when published) GitHub Pages slug all use this name. Resolves O1.

**Why.**
- Avoids the apostrophe and spaces of the original folder name, which GitHub and shell tooling do not handle cleanly.
- Plain ASCII underscored form is consistent with the sister app's `PaintersRef_v5.2` convention.
- Reads cleanly in URLs without needing percent-encoding.

**Alternatives rejected.**
- `painter-ai-studio` (lowercase-hyphenated). Reads slightly cleaner in URLs but diverges from the sister app's naming convention.
- `PaintersAI_v0.1`. Version suffix is premature; a v1.0 rename would be churn.

**Revisit when.** Never expected; rename would require a Pages-URL migration plan and is not justified by anything currently foreseeable.

---

## D7 — 2026-05-11 — License: MIT

**Decision.** The project is released under the MIT License. `LICENSE` at the repo root carries the canonical text. Resolves O2.

**Why.**
- MIT is permissive, short, well-understood, and standard for small personal/studio tools.
- Allows any painter or developer to read, fork, and adapt the code without friction.
- Compatible with the sister app's likely license posture and with any conceivable future redistribution path.
- No warranty exposure — important for a tool that calls third-party AI services.

**Alternatives rejected.**
- **Apache 2.0.** Adds an explicit patent grant and a NOTICE file requirement. Useful for larger projects with corporate contributors; overkill here.
- **GPLv3.** Copyleft is unnecessary; this project gains nothing from forcing downstream openness.
- **Proprietary / unlicensed.** Would make the repo unusable to anyone else and signals nothing positive.

**Revisit when.** The project takes on contributors who require a CLA, _or_ relicensing is needed to integrate with a differently-licensed dependency.

---

## D8 — 2026-07-07 — Studio journal stored on disk via the proxy, not client-side

**Decision.** Every successful critique is saved as a JSON file (plus a JPEG thumbnail) under `studio-journal/entries/` on the machine running `server/semantic-proxy.js`. The proxy owns reads and writes (`/api/journal/save`, `/api/journal/list`, `/api/journal/entry`, `/api/journal/update`); the browser only ever calls these endpoints. `studio-journal/` is gitignored — it is local session history, not repo content.

**Why.**
- The proxy already handles all Gemini calls and holds the filesystem; writing journal entries there needs no new infrastructure.
- File-based storage needs no database, migration story, or extra dependency, consistent with the project's zero-toolchain posture.
- Keeping journal data server-side (rather than `localStorage`) means entries survive a browser cache clear and can exceed `localStorage`'s size limits (thumbnails alone would blow past 5–10 MB quickly).
- The app must degrade gracefully when the proxy is absent (the GitHub Pages case) — a one-time feature-detect probe (`GET /api/journal/list`) at startup hides all journal UI if it fails, so there's no broken state.

**Alternatives rejected.**
- **`localStorage`/`IndexedDB` on the client.** No thumbnails at scale, no cross-device continuity, and duplicates state the proxy could own more simply.
- **A real database (SQLite, etc.).** Unjustified complexity for what is, at this scale, a folder of JSON files a painter can inspect directly.

**Revisit when.** Entry counts grow large enough that `fs.readdirSync` + read-all-then-filter (used by `listJournalEntries()`) becomes a real latency problem, or the app needs multi-device sync.

---

## D9 — 2026-07-07 — Painter profile as a server-side JSON file

**Decision.** `server/painter-profile.json` (skill level, media, tradition, values, things to avoid, register) is loaded once at proxy startup and appended to every critique prompt via `withProfile()`. It is a plain file the painter can hand-edit; there is no in-app profile editor.

**Why.**
- The mentor's voice needs to consistently reflect *this* painter's level and taste (intermediate, British watercolor tradition, Wesson/Seago restraint) rather than a generic critique register — a single static file is the simplest thing that could inject that consistently across all five prompts.
- Keeping it server-side (not sent from the browser per request) means it can't be tampered with or drift between requests, and costs nothing extra per call.
- A missing or malformed file degrades gracefully — `loadPainterProfile()` logs a warning and continues with `profileBlock = ''`, never crashing the proxy.

**Alternatives rejected.**
- **In-app settings UI backed by `localStorage`.** More flexible for multiple users, but this is a single-painter tool; a hand-edited file is lower-ceremony and the profile changes rarely.
- **Hardcoding the profile text into each prompt.** Would require editing multiple prompt constants for any tone/taste change.

**Revisit when.** The tool needs to support more than one painter profile (e.g. a shared install), at which point this becomes a per-user setting.

---

## D10 — 2026-07-07 — Follow-up chat as a dedicated, scoped proxy endpoint

**Decision.** `POST /api/followup` is a narrow, single-purpose endpoint: image + serialized critique + capped chat history (last 10 turns) + one question, answered in plain text (no JSON schema) by "the same mentor who wrote the critique." It is not a general-purpose chat feature — the prompt explicitly forbids expanding scope beyond the critique's intervention scope or redesigning the painting.

**Why.**
- A generic chat surface risks turning the tool into a chatbot; scoping every answer to "this painting, this critique" keeps it a mentor, not an assistant.
- Reusing the existing critique + doctrine + guardrail prompt-injection pattern (`withProfile`) keeps the follow-up voice consistent with the critique voice.
- Persisting each exchange into the journal entry's existing `chat` array (via the already-shipped `/api/journal/update`) means no new storage schema was needed.

**Alternatives rejected.**
- **A general "ask anything" chat tab.** Explicitly rejected — it would dilute the tool's identity as a scoped studio mentor rather than a general painting chatbot.
- **Client-side-only chat (no persistence).** Would lose the transcript on reload and couldn't inform progress-memory distillation later.

**Revisit when.** The tool needs multi-painting conversations (e.g. "compare this to my last three paintings") — at that point the endpoint's single-image, single-critique scoping would need to change.

---

## D11 — 2026-07-07 — Annotated-mockup and correction/edit features kept as-is

**Decision.** The mentor-v2 improvement plan (Phases 1–6) makes no structural changes to the annotated-mockup (`/api/mockup`) or correction/edit (`/api/image-edit`, `buildEditPrompt`) features beyond bounded, surgical prompt-line additions in Phase 6. Owner decision, 2026-07-07.

**Why.**
- Both features work as shipped; the improvement plan's goal is turning the critique loop into a persistent mentor (profile, journal, chat, progress memory, panel hierarchy), not re-litigating already-working image-generation features.
- Keeping their scope frozen avoids risk to two Gemini-image-model integrations while six other phases are in flight.

**Alternatives rejected.**
- **Folding mockup/correction into the same profile+doctrine injection as critiques.** Considered and explicitly out of scope for this plan; would be its own phase if pursued.

**Revisit when.** A future improvement plan specifically targets the mockup or correction/edit experience.

---

## Open Decisions

These are flagged here so we don't waste time re-discovering them. None block M0; some block specific later milestones.

### ~~O1 — Repository name and GitHub Pages slug~~ (Resolved — see D6)

### ~~O2 — License~~ (Resolved — see D7)

### O3 — Exact critique model id
`gpt-4o` is the working assumption; the actual model id should be locked at M2a after the prompt set is validated. May need a vision-capable variant for images.

### O4 — Exact image edit model id and parameters
`gpt-image-1` is the working assumption. Concrete parameters (size, quality, response format, mask format) get locked at M2.5.

### O5 — Reference Sheet print layout
A4 vs Letter default, 4-panel vs 3-panel, where the critique notes sit. Resolved at M5.

### O6 — Iconography and theme tokens
PWA icons and a small studio-light palette. Resolved at M1 close.

### O7 — Service worker caching strategy
Cache app shell only, never cache API responses or user images. Concrete cache version and update strategy resolved at M1.
