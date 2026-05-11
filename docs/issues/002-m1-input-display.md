# Issue 002 — M1 Input + Display Baseline

**Status: Planned**

## Goal

Stand up the static PWA shell. User can open the app in a browser, upload a JPG or PNG, see it displayed in a responsive canvas, and reset to a clean state. App installs as a PWA.

## Why

This is the smallest possible end-to-end shippable surface. It validates the architecture (PWA, vanilla JS, service worker, GitHub Pages deploy) and gives us something to compare against for every later milestone. No AI yet — just file in, image on screen, app installable.

## Scope

### Included

- `index.html` with a minimal layout: header (app title), left rail (controls, currently just Upload + Reset + Theme toggle), main canvas area.
- `styles.css` with the basic layout, a light/dark theme via CSS custom properties, and a "studio-friendly" muted palette.
- `app.js` with: file input handler, image decode, draw to canvas while preserving aspect ratio, fit-to-container on resize, reset, theme toggle persistence (`localStorage`).
- `manifest.webmanifest` with name, short_name, description, start_url, display=standalone, theme/background colors, and references to icons.
- `service-worker.js` that caches the app shell (`index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, icons) with a versioned cache name and a cache-first strategy for the shell.
- `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon.svg` (placeholder is fine for v1; final design later).
- A small `Settings` affordance stub (does nothing yet — wiring the OpenAI key field comes in M2).

### Excluded

- AI calls of any kind. No fetch to OpenAI.
- Critique panel, edit controls, comparison view, reference sheet export. Later milestones.
- Image processing (grayscale, masks, etc). Not this project — that's PRL's job.
- Settings UI for the OpenAI key — M2.

## Data / State / API Model

For each stateful UI element (per SOP §8 — state-model discipline):

```
loadedImage:
  Widget type:           <input type="file" accept="image/jpeg,image/png">
  Session-state key:     window.appState.image (in-memory Image object + ObjectURL)
  Session-state type:    { bitmap: ImageBitmap | null, srcUrl: string | null, filename: string | null }
  Function argument:     ImageBitmap passed to renderCanvas(bitmap)
  Valid values:          A successfully decoded ImageBitmap or null
  Default:               null
  Invalid-value fallback: discard, show empty-state placeholder
  Refresh behavior:      Re-fit on window resize, keep image
  Empty-data behavior:   Placeholder text "Load a JPG or PNG to begin"

themeMode:
  Widget type:           toggle button
  Session-state key:     localStorage["theme"]
  Session-state type:    "light" | "dark"
  Function argument:     string passed to applyTheme(mode)
  Valid values:          "light" | "dark"
  Default:               match prefers-color-scheme; fall back to "light"
  Invalid-value fallback: "light"
  Refresh behavior:      Apply on load before paint to avoid flash
  Empty-data behavior:   Default
```

State lifecycle: `initialize → reconcile/validate → render widgets → apply logic → resize behavior → empty-data behavior`.

## Acceptance Criteria

1. Serving the repo with `python3 -m http.server 8080` and opening `http://localhost:8080/` loads the app with no console errors.
2. Loading a JPG and a PNG each renders in the canvas with correct aspect ratio.
3. Resizing the browser window re-fits the image without distortion and without re-uploading.
4. Reset clears the canvas and returns to the empty-state placeholder.
5. Theme toggle switches between light and dark; choice persists across reloads.
6. The app is installable as a PWA in Chrome and Safari (install prompt available; manifest validates; service worker registers).
7. Closing the browser, going offline, and re-opening the installed PWA loads the app shell without network.
8. Lighthouse PWA score ≥ 90 on a local build.

## Validation Method

```bash
# Static serve
python3 -m http.server 8080

# In a browser
# - Open http://localhost:8080
# - Open DevTools > Application > Manifest: no warnings
# - DevTools > Application > Service Workers: shows registered, activated
# - DevTools > Lighthouse > PWA audit: ≥ 90
# - Network tab: throttle to Offline, reload, app shell still loads
# - Try uploading test-fixtures/landscape.jpg and figure.png
```

Manual painter-grade check: image at arm's length is sharp, not pixel-blurry.

## Likely Files / Modules

- `index.html`
- `styles.css`
- `app.js`
- `manifest.webmanifest`
- `service-worker.js`
- `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon.svg`

## Constraints

- No external runtime dependencies. Vanilla browser APIs only.
- No build step. Files must run as-is when served statically.
- Service worker caches app shell only. Never user images. Never API responses.
- Cache version string must change with every shell change (e.g. `apsv1-shell-2026-05-11a`).
- Image is held in memory; not written to `localStorage` or IndexedDB in M1.
- All `localStorage` keys are prefixed `aps:` to avoid collisions with other apps.

## Status / Next Action

Planned. Becomes active after 001 (M0) commits.
