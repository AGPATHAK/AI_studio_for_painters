# AI Painter Studio

AI Painter Studio is a browser-based **visual reasoning tool for painters**. It is the AI-assisted companion to [Painter's Reference Lab (PRL)](https://github.com/AGPATHAK/PaintersRef_v5.2): where PRL is deterministic and structural, this app is interpretive and exploratory.

It is **not an image generator**. Its job is to help the painter see, diagnose, and repaint better.

## Status

Past v1. The app now runs a persistent studio-mentor loop across four workflow modes, each backed by a local Gemini proxy:

1. **Reference** (Reference Ideation) — upload a photo, get painterly interpretation ideas before painting starts; optionally generate an annotated planning mockup.
2. **In-Process** — upload a work-in-progress photo, get a prioritized critique and next painting actions.
3. **Studio Check** — upload a near-final painting, get a direct sign-now-or-one-more-adjustment verdict.
4. **Archive** — upload a signed, finished painting for a retrospective critique and study record.

Every mode also supports a one-click "suggest edit" → Gemini image-edit correction, and a printable Reference Sheet.

On top of the four modes: a **Studio journal** (every critique is auto-saved locally, ratable, note-able), a **Journal view** with a "development areas" summary distilled from journal history and injected back into future critiques, and a scoped **"Ask the mentor" follow-up chat** after each critique. Before reading, the painter can give the mentor a **pre-read brief** — an optional note (e.g. "suggest changes to the foreground only," or, in Reference Ideation, "this is an oil painting by Seago") and, in In-Process, a declared **development stage** that calibrates what the critique should even look at (a WIP is never faulted for not yet having darks it hasn't gotten to). Every critique also returns a **suggested title**, which auto-fills the journal's painting-title field (tagged "suggested" until confirmed) so session linking works without typing anything — continuity always prefers an already-established title over a fresh suggestion. See [`docs/improvement-plan-mentor-v2.md`](docs/improvement-plan-mentor-v2.md) and [`docs/improvement-plan-mentor-v3.md`](docs/improvement-plan-mentor-v3.md) for the plans that shipped these, and [`docs/roadmap.md`](docs/roadmap.md) for the earlier milestone history (M0–M5).

## Architecture

Mirrors the sister app (PRL) deliberately, plus a small local proxy for the AI calls:

- Static **Progressive Web App** — `index.html` + `styles.css` + `app.js` + `manifest.webmanifest` + `service-worker.js`
- **Vanilla** JavaScript, HTML, CSS — no framework, no build step
- Frontend hosted on **GitHub Pages**; served locally (or on the studio's LAN) via `server/semantic-proxy.js`, a dependency-free Node HTTP server
- Image stays local; the proxy is the only thing that talks to Gemini, and the API key never reaches the browser
- **Google Gemini** for both critique (`gemini-3.5-flash` by default, JSON-schema-enforced structured output) and image edits/mockups (`gemini-3.1-flash-image-preview`)
- API key lives server-side in `server/.env` (`GEMINI_API_KEY`), read once at proxy startup — never sent to or stored in the browser
- Every critique prompt is built from a base prompt + `server/painter-profile.json` (skill level, tradition, taste) + `server/doctrine.js` (studio judgment rules) + an intermediate-register guardrail, via `withProfile()`
- **Studio journal**: every successful critique is saved as JSON + a JPEG thumbnail under `studio-journal/` (gitignored, proxy-owned; the app degrades gracefully with no journal UI if the proxy is absent, e.g. on GitHub Pages)
- **Progress memory**: the proxy periodically distills the last 15 journal entries into persistent development areas / improving areas / established strengths (`studio-journal/progress-summary.json`), which get folded back into future In-Process and Studio Check prompts

See [`docs/decisions.md`](docs/decisions.md) for the full rationale and open decisions.

## Live App

Not yet deployed — the app currently requires the local proxy (`server/semantic-proxy.js`) for its Gemini-backed features, which GitHub Pages can't run. A static-only deploy would work but with all critique/journal/chat/mockup/correction features hidden (see "Local Development" below for the same degraded-mode behavior). Will be published at:

<https://agpathak.github.io/AI_studio_for_painters/> once a hosting story for the proxy exists.

## Local Development

Serve as a static site from the repo root. The service worker requires HTTP, so opening `index.html` directly will not work:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>. Note: without the proxy running, all critique/journal/chat features are unavailable — the app loads and shows an empty-state UI, but every Gemini-backed feature stays hidden.

To run the full app (critique, mockup, correction, journal, chat, progress memory), run the local proxy instead of the static Python server — it also serves the static files itself:

```bash
cp server/.env.example server/.env
# edit server/.env and set GEMINI_API_KEY
node server/semantic-proxy.js
```

Then open <http://localhost:8080>. The API key stays in `server/.env` and is never sent to the browser. On macOS, double-clicking `Launch AI Painter Studio.command` starts the proxy and opens the browser automatically (also prints the LAN IP so an iPad on the same Wi-Fi can connect).

## Proxy API

All endpoints are served by `server/semantic-proxy.js` under `/api/`:

| Endpoint | Purpose |
|---|---|
| `POST /api/semantic` | Reference Ideation pass |
| `POST /api/mockup` | Annotated planning mockup (image edit model) |
| `POST /api/in-process` | In-Process WIP critique |
| `POST /api/studio-check` | Studio Check (sign-now-or-adjust) critique |
| `POST /api/finished-critique` | Archive (retrospective) critique |
| `POST /api/image-edit` | Correction / suggest-edit demonstration |
| `POST /api/followup` | Mentor follow-up chat on an existing critique |
| `POST /api/journal/save` / `GET /api/journal/list` / `GET /api/journal/entry` / `POST /api/journal/update` | Studio journal CRUD |
| `POST /api/journal/distill` / `GET /api/journal/progress` | Progress-memory distillation and its cached summary |

## Project Files

- `index.html` — app shell, four workflow modes, Journal view, critique panel, chat, print sheet
- `styles.css` — layout and visual styling
- `app.js` — image handling, critique/journal/chat requests, panel rendering, comparison view, export
- `manifest.webmanifest` — PWA manifest
- `service-worker.js` — offline caching of app shell (not of API responses or journal data)
- `icons/` — app icons
- `server/semantic-proxy.js` — dependency-free Node HTTP server: serves the static app, proxies all Gemini calls, owns the studio journal on disk
- `server/painter-profile.json` — this painter's skill level, tradition, and taste, injected into every critique prompt
- `server/doctrine.js` — studio judgment rules injected into critique/studio-check/archive/followup prompts
- `studio-journal/` — gitignored, proxy-created; journal entries, thumbnails, and the cached progress summary

## Planning Documents

- [Design Philosophy](docs/design-philosophy.md)
- [Roadmap (M0–M5, foundational build)](docs/roadmap.md)
- [Mentor v2 Improvement Plan (studio journal, progress memory, chat, panel tiers)](docs/improvement-plan-mentor-v2.md)
- [Mentor v3 Improvement Plan (idle-state fix, pre-read brief, auto-title, stage-aware/media-accent prompts)](docs/improvement-plan-mentor-v3.md)
- [Brief](docs/brief.md)
- [Decisions](docs/decisions.md)
- [Workflow SOP (Solo-Light v7)](docs/workflow-sop.md)
- [Issue files](docs/issues/)

## Relationship to Painter's Reference Lab

Loose, image-level interop only:

- Export an image from PRL → use as input here
- Export a Reference Sheet here → use as reference in PRL

No shared runtime, UI, or state. See [Design Philosophy §2](docs/design-philosophy.md).

## License

MIT — see [`LICENSE`](LICENSE).
