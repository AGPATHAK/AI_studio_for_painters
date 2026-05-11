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

## Open Decisions

These are flagged here so we don't waste time re-discovering them. None block M0; some block specific later milestones.

### O1 — Repository name and GitHub Pages slug
The folder is currently `Painter's AI Studio`. GitHub Pages URLs prefer lowercase-hyphenated. Sister app is `PaintersRef_v5.2`. Candidates: `PaintersAI_v0.1`, `painter-ai-studio`, `painters-ai-lab`. **Resolve before first push to GitHub.**

### O2 — License
TBD (MIT / Apache-2.0 / proprietary). **Resolve before public push.**

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
