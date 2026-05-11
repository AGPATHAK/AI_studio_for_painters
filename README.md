# AI Painter Studio

AI Painter Studio is a browser-based **visual reasoning tool for painters**. It is the AI-assisted companion to [Painter's Reference Lab (PRL)](https://github.com/AGPATHAK/PaintersRef_v5.2): where PRL is deterministic and structural, this app is interpretive and exploratory.

It is **not an image generator**. Its job is to help the painter see, diagnose, and repaint better.

## Status

Pre-v1. Currently in **M0 — Project Setup**.

The shippable v1 loop is:
1. Upload an image
2. Generate a structured painter-grade critique
3. Apply one controlled transformation (value simplification with shadow-mass correction)
4. Compare original vs edited side-by-side
5. Export a printable **Reference Sheet** for easel-side repainting

See [`docs/roadmap.md`](docs/roadmap.md) for the full milestone plan.

## Architecture

Mirrors the sister app (PRL) deliberately:

- Static **Progressive Web App** — `index.html` + `styles.css` + `app.js` + `manifest.webmanifest` + `service-worker.js`
- **Vanilla** JavaScript, HTML, CSS — no framework, no build step
- Hosted on **GitHub Pages**
- Image stays in the browser; the only network calls are to the AI provider
- **OpenAI** for both critique (`gpt-4o` / current) and edit (`gpt-image-1`), single vendor for v1
- **BYO API key** — user supplies an OpenAI key on first run; stored in `localStorage`

See [`docs/decisions.md`](docs/decisions.md) for the full rationale and open decisions.

## Live App

Not yet deployed. Will be published at:

`https://agpathak.github.io/<repo-name>/` once v1 lands.

## Local Development

Serve as a static site from the repo root. The service worker requires HTTP, so opening `index.html` directly will not work:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

## Project Files (planned)

- `index.html` — app shell and controls
- `styles.css` — layout and visual styling
- `app.js` — image handling, critique requests, edit requests, comparison view, export
- `manifest.webmanifest` — PWA manifest
- `service-worker.js` — offline caching of app shell (not of API responses)
- `icons/` — app icons

The runtime files do not exist yet; M0 is documentation-only per the roadmap.

## Planning Documents

- [Design Philosophy](docs/design-philosophy.md)
- [Roadmap (final v1.0)](docs/roadmap.md)
- [Brief](docs/brief.md)
- [Decisions](docs/decisions.md)
- [Workflow SOP (Solo-Light v7)](docs/workflow-sop.md)
- [Active issue files](docs/issues/)

## Relationship to Painter's Reference Lab

Loose, image-level interop only:

- Export an image from PRL → use as input here
- Export a Reference Sheet here → use as reference in PRL

No shared runtime, UI, or state. See [Design Philosophy §2](docs/design-philosophy.md).

## License

TBD.
