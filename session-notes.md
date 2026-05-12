# Session Notes — Handoff for next chat

_This file is a continuity artifact. If you're a new chat session reading this for the first time, read it through before anything else. Then read `docs/brief.md`, `docs/decisions.md`, and the active issue file in `docs/issues/`._

_If you're Ardhendu opening a new chat: drop this file path into the conversation and say "read session-notes.md and continue"._

---

## Project

**AI Painter Studio** — a browser-based **visual reasoning tool for painters**. It is the AI-assisted companion to the sister app [Painter's Reference Lab (PRL)](https://github.com/AGPATHAK/PaintersRef_v5.2). It is **not** an image generator; it helps the painter see, diagnose, and repaint better via a Critique → Correction → Repaint loop.

Repo on user's machine: `~/Documents/GitHub/AI_studio_for_painters`
GitHub: `https://github.com/AGPATHAK/AI_studio_for_painters`
Future Pages URL: `https://agpathak.github.io/AI_studio_for_painters/`

---

## Where we are right now

- **Current branch: `main`** — M1 merged and pushed. Working tree clean.
- M1 shipped with Lighthouse PWA score of 100. All 8 acceptance criteria passed.
- **Immediate next action (user):** create the M2a branch:
  ```bash
  git checkout -b issue-003-m2a-critique-design
  git push -u origin issue-003-m2a-critique-design
  ```
- **Immediate next Claude action:** start M2a work — critique schema, instructor voice spec, per-dimension prompt templates, test-image set, and eval script. Full plan in `docs/issues/003-m2a-critique-design.md`.

---

## Roles (collapsed from the v7 SOP)

- **User (Ardhendu)** — product owner, tester, decision-maker. Reviews diffs in GitHub Desktop, runs git commands locally, commits, pushes. Approves direction. Tests behavior in the real app.
- **Claude** — project manager, architect, reviewer, and tightly-scoped implementer. Frames issues, defines state models, edits files directly in the workspace folder, runs validation in its sandbox, and hands the user explicit terminal commands at clean commit points. Does not commit or push on the user's behalf.

When the SOP says "ChatGPT" or "Codex", read it as "Claude".

---

## Locked decisions (headlines only — see `docs/decisions.md` for full rationale)

- **D1.** Static PWA, vanilla JS/HTML/CSS, no build step, GitHub Pages.
- **D2.** Single AI vendor for v1: OpenAI. `gpt-4o`-class for critique with JSON-schema output; `gpt-image-1` for image edits.
- **D3.** BYO API key, stored in `localStorage`. No backend, no proxy.
- **D4.** Separation from PRL is non-negotiable. Image-file-level interop only.
- **D5.** Critique precedes edit. User triggers every edit. Every edit traceable to a critique item.
- **D6.** Repo name: `AI_studio_for_painters`.
- **D7.** License: MIT.

## Open decisions

- **O3** — exact critique model id (locked at M2a close).
- **O4** — exact image edit model id/params (locked at M2.5).
- **O5** — Reference Sheet print layout (locked at M5).
- **O6** — iconography and theme tokens (carried forward; SVG palette icon is a placeholder).
- **O7** — service worker caching strategy (resolved in M1: cache app-shell only, versioned cache name, cache-first).

---

## Roadmap headline

v1 is shippable when: upload image → structured painter-grade critique → one controlled value-simplification edit → side-by-side comparison → printable Reference Sheet. Full milestone plan in `docs/roadmap.md`.

---

## Issue files (source of truth for implementation)

In `docs/issues/`:

- `001-m0-repo-setup.md` — **Done**, commit `e679db1`.
- `002-m1-input-display.md` — **Done**, commits `3bcba3a`–`b699593`, Lighthouse 100.
- `003-m2a-critique-design.md` — **Active** (next branch).
- `004-m2-critique-engine.md` — Planned. Blocked by 003.
- `005-m2-5-critique-edit-bridge.md` — Planned. Blocked by 004. Identified bottleneck.
- `006-m3-value-simplification.md` — Planned. Blocked by 005.

---

## M2a plan (next active issue)

Full acceptance criteria in `docs/issues/003-m2a-critique-design.md`. Headline:

- **`docs/critique-schema.md`** — canonical JSON schema with field semantics and a worked example.
- **`docs/prompts/instructor-voice.md`** — forbidden phrases, required vocabulary, tone spec.
- **`docs/prompts/value-structure.md`**, `edge-control.md`, `composition.md`, `chroma.md` — per-dimension prompt templates.
- **`docs/critique-validation.md`** — reproducible scoring protocol.
- **`test-fixtures/critique/`** — 10–15 licence-clear images + `manifest.json`.
- **`tools/run-critique-eval.mjs`** — Node script that calls OpenAI, writes JSON outputs, prints eval worksheet. Reads key from `OPENAI_API_KEY` env; never committed.

No app code changes in M2a. This is entirely prompt design and validation.

**Key constraint:** Prompts must not re-state the JSON schema in natural language. The schema is enforced via `response_format` / JSON schema mode — once, in one place.

**Target:** ≥80% pass rate on the validation set (non-generic, actionable, painter-aligned, prioritized) with a single locked prompt version.

Suggested M2a commit cadence:
1. Schema + instructor voice + per-dimension prompts (docs only)
2. Test-image set + manifest (fixtures)
3. Eval script skeleton (`tools/run-critique-eval.mjs`)
4. Iterated prompt refinement + validation record (may be multiple commits)
5. Lock prompt at v1.0, final validation pass

---

## Implementation notes carried forward

- **Theme toggle:** use inline SVG with `stroke="currentColor"`, not emoji. macOS system emoji font ignores CSS `color`; glyphs become invisible on dark backgrounds.
- **`aps:` localStorage prefix** on all keys to avoid collisions.
- **Service worker cache name** must be bumped on every shell change: format `apsv1-shell-YYYY-MM-DDx`.

---

## Workflow conventions (from `docs/workflow-sop.md`)

- One active issue at a time. One branch per issue: `issue-NNN-short-name`.
- Markdown issue files are the source of truth, not GitHub Issues.
- Commits are explicit-file-list, not `git add .`. Commit messages: imperative summary + bullet list.
- No bundling unrelated work in one commit.
- Define the state model before UI work (SOP §8).
- After every milestone: update README if behavior changed, mark/archive completed issues, start next issue on a clean branch.

---

## Environmental notes for Claude

- Workspace folder mounted at `/sessions/<session-id>/mnt/AI_studio_for_painters` in Claude's sandbox. Read/write via `Read`/`Edit`/`Write` and `Bash`.
- **Known sandbox quirk:** `git` commands that write the index (`git add`, `git commit`, `git checkout`) leave a stale `.git/index.lock`. **Always tell the user to `rm -f .git/index.lock` before staging.** Read-only commands (`git status`, `git log`) are safe.
- Claude does **not** commit or push on the user's behalf. Always hand over explicit terminal commands.
- Each Bash invocation is a fresh shell — use absolute paths or `cd && ...` chains.

---

## How to resume in a new chat

1. User re-selects the workspace folder in Cowork.
2. User shares `session-notes.md` (or says "read session-notes.md and continue").
3. Claude reads, in order: `session-notes.md`, `docs/brief.md`, `docs/decisions.md`, `docs/issues/003-m2a-critique-design.md`.
4. Claude confirms branch and working tree state with `git status` and `git log --oneline -5`.
5. Claude proceeds from "Immediate next Claude action" above.

## Quick reference — files Claude should read first in a new chat

```
session-notes.md                        # this file
docs/brief.md                           # one-page brief
docs/decisions.md                       # locked + open decisions
docs/issues/003-m2a-critique-design.md  # active issue
docs/workflow-sop.md                    # full workflow reference (skim)
```

---

_Last updated: 2026-05-12, end of M1 session._
