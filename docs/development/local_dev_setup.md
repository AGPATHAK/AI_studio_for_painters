# Local Development Setup

## Purpose

AI Painter Studio uses two lightweight local processes during development:

- the static frontend server,
- and the Gemini semantic proxy.

Keeping these roles separate prevents confusion between serving app files and handling `POST /api/semantic`.

---

## Ports

Use these ports by convention:

- Semantic proxy: `http://127.0.0.1:8080`
- Static frontend: `http://127.0.0.1:8081`

The frontend automatically sends semantic requests to:

```text
http://127.0.0.1:8080/api/semantic
```

when it is served from `127.0.0.1:8081` or `localhost:8081`.

In same-origin contexts, such as when the semantic proxy itself serves the frontend, the app falls back to:

```text
/api/semantic
```

---

## Recommended Startup Sequence

From the repository root, start the semantic proxy first:

```bash
cp server/.env.example server/.env
# edit server/.env and set GEMINI_API_KEY
node server/semantic-proxy.js
```

Then, in a second terminal, start the static frontend:

```bash
python3 -m http.server 8081
```

Open:

```text
http://127.0.0.1:8081
```

This setup keeps the frontend static and lightweight while routing AI calls to the local proxy that owns the API key.

---

## Why Not Python on 8080?

Do not run:

```bash
python3 -m http.server 8080
```

for the normal semantic workflow.

Python's static file server can serve `index.html`, `app.js`, and `styles.css`, but it does not implement:

```text
POST /api/semantic
```

If the frontend is loaded from a static server on `8080`, then same-origin requests to `/api/semantic` go to Python instead of the semantic proxy. The result is a failed semantic request, usually followed by local fallback behavior in the app.

Use `8080` for the semantic proxy and `8081` for the static frontend.

---

## Endpoint Override

For unusual local setups, the frontend still supports a manual endpoint override:

```js
localStorage.setItem('aps:semanticEndpoint', 'http://127.0.0.1:8080/api/semantic');
```

Clear it with:

```js
localStorage.removeItem('aps:semanticEndpoint');
```

Most development should not need this. The default config already handles the recommended `8081 -> 8080` setup.

---

## Lightweight Philosophy

This project intentionally does not use a build system or environment framework for local development.

The local runtime remains:

- static HTML/CSS/JS for the frontend,
- a small Node semantic proxy for Gemini,
- explicit ports,
- and no bundled frontend secrets.
