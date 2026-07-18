# Session Notes — Handoff for next chat

_This file is a continuity artifact. If you're a new chat session reading this for the first time, read it through before anything else. Then read `docs/decisions.md` and, if there's an active plan, its `docs/improvement-plan-*.md` file and the active issue file in `docs/issues/`._

_If you're Ardhendu opening a new chat: drop this file path into the conversation and say "read session-notes.md and continue"._

---

## Project

**AI Painter Studio** — a browser-based **visual reasoning tool for painters**. It is the AI-assisted companion to the sister app [Painter's Reference Lab (PRL)](https://github.com/AGPATHAK/PaintersRef_v5.2). It is **not** an image generator; it helps the painter see, diagnose, and repaint better via a Critique → Correction → Repaint loop, extended into a persistent studio-mentor loop (profile, journal, progress memory, follow-up chat, pre-read brief, auto-title continuity).

Repo on user's machine: `~/Documents/GitHub/AI_studio_for_painters`
GitHub: `https://github.com/AGPATHAK/AI_studio_for_painters`

---

## Where we are right now

Both **`docs/improvement-plan-mentor-v2.md`** (7 phases: profile/doctrine, journal, progress memory, follow-up chat, panel tiers, prompt polish, housekeeping) and **`docs/improvement-plan-mentor-v3.md`** (5 phases: idle-state fix + left panel polish, pre-read brief, stage-aware WIP prompt, Studio Check media accents, auto-title + continuity) are **fully implemented and merged to `main`**. No active plan or open issue right now.

**Immediate next action:** none pending — wait for the user's next request. If they want to keep building, the natural next step is deciding on a v4 direction (or a smaller one-off ask) before writing any code.

---

## Roles

- **User (Ardhendu)** — product owner, tester, decision-maker. Approves direction, tests behavior in the real app, gives the explicit "merge" instruction per phase.
- **Claude** — project manager, architect, and implementer, running as **Claude Code CLI** directly in the repo. Writes issue files, branches, implements, tests locally (including live browser testing via `mcp__claude-in-chrome__*` tools), commits with the user's authorization. **Does not push or merge to `main`** without an explicit "merge" instruction from the user, given after each phase individually.

---

## Locked decisions (headlines only — see `docs/decisions.md` for full rationale)

- **D1.** Static PWA, vanilla JS/HTML/CSS, no build step, GitHub Pages (frontend) + a local Node proxy (AI calls).
- **D2.** *(Stale text — see note in `docs/decisions.md`.)* The app runs entirely on **Google Gemini** (`gemini-3.5-flash` for critique, `gemini-3.1-flash-image-preview` for image edits/mockups) via `server/semantic-proxy.js`. Treat the code as authoritative over D2's original OpenAI text.
- **D3.** *(Superseded by D8.)* The proxy holds the Gemini key server-side and owns the studio journal on disk — not client-side `localStorage`.
- **D4.** Separation from PRL is non-negotiable. Image-file-level interop only.
- **D5.** Critique precedes edit. User triggers every edit. Every edit traceable to a critique item.
- **D6.** Repo name: `AI_studio_for_painters`.
- **D7.** License: MIT.
- **D8.** Studio journal stored on disk via the proxy, not client-side (2026-07-07).
- **D9.** Painter profile as a server-side JSON file (2026-07-07).
- **D10.** Follow-up chat as a dedicated, scoped proxy endpoint — not a general chatbot (2026-07-07).
- **D11.** Annotated-mockup and correction/edit features kept as-is through mentor-v2 (owner decision, 2026-07-07).
- **D12.** Explicit `idle` semantic-status state, distinct from `unavailable` (2026-07-18).
- **D13.** Pre-read brief (note + stage) sent as a focus instruction, never a standards override; capped/sanitized server-side (2026-07-18).
- **D14.** Auto-title priority: an established continuity title always beats a fresh per-critique suggestion (2026-07-18).

---

## Current architecture (post mentor-v3)

- **Four workflow modes**, each its own left-panel tab, its own image state, its own Gemini prompt/schema: Reference Ideation, In-Process, Studio Check, Archive.
- **`server/semantic-proxy.js`** — dependency-free Node HTTP server. Serves the static app, proxies every Gemini call, owns `studio-journal/` on disk. Full endpoint list in `README.md` → "Proxy API". `PROMPT_VERSION` is currently `3.0`.
- **Prompt injection** — every critique prompt is `withProfile(basePrompt, { doctrine, guardrail })`: base prompt + `server/painter-profile.json` (skill/tradition/taste) + `server/doctrine.js` (studio judgment rules) + an intermediate-register guardrail, plus (where relevant) a history block, a painter-brief block, and a stage-calibration block.
- **Idle vs. unavailable** — `semanticStatus.state` is `idle | loading | succeeded | unavailable`; `unavailable` means a request was actually made and failed, never the default. A freshly loaded image always shows invite copy, never a failure claim.
- **Pre-read brief** — an optional "Note to mentor" textarea (all four modes) and a Stage selector (In-Process only) sent with the critique/follow-up request; server sanitizes (500-char cap, control-char strip, stage whitelist) and appends a focus-narrowing instruction to the prompt. Cleared on a new image, not on a mode switch.
- **Stage-aware In-Process** — the WIP prompt never critiques incompleteness itself (missing darks, unpainted passages); a declared or inferred stage calibrates what gets critiqued.
- **Proactive Studio Check accents** — `mediaOptions` actively considers a closing pen/pastel/gouache/charcoal accent on every near-final painting, consistent with the signing verdict, rather than only when asked.
- **Auto-title + continuity** — every critique returns a `suggestedTitle`; the journal title field auto-fills (typed > established continuity title > suggestion > filename stem) and tags itself "suggested" until the painter edits it. Previous-sessions matching prefers `paintingId` over filename; the block header reads "Linked painting: `<title>` — `<n>` previous session(s) · most recent `<date>` (`<mode>`)". The Journal view shows a "×n sessions" badge on entries sharing a `paintingId`.
- **Studio journal** — every successful critique auto-saves to `studio-journal/entries/*.json` (+ `.jpg` thumbnail), including `painterNote`/`paintingStage`. Rating, free-text note, painting title. Gitignored; the app feature-detects the proxy once at startup and hides all journal UI if it's absent.
- **Progress memory** — `POST /api/journal/distill` distills the last 15 non-"off" entries into persistent development areas / improving areas / established strengths, cached to `studio-journal/progress-summary.json`. Auto-regenerates after a save once ≥5 new entries exist. Injected back into In-Process and Studio Check prompts as a history block; a same-painting continuity opt-in (checkbox) additionally injects the prior session's conclusion.
- **Journal view** — a fifth left-panel item (`appState.view`, deliberately *not* a workflow mode) showing the development-areas card and an expandable entry list.
- **Mentor follow-up chat** — `POST /api/followup`, scoped to the current painting + critique + the same painter brief, plain-text answer, persisted into the journal entry's `chat` array.
- **Critique panel tiers** — priority lesson (always visible) / full read (collapsed `<details>`, open by default only in Reference Ideation) / mode extras.

---

## Issue files (source of truth for implementation)

In `docs/issues/`, mentor-v3 phases (all done, merged):

- `026-idle-state-and-left-panel.md` — Phase 1.
- `027-pre-read-brief.md` — Phase 2.
- `029-stage-aware-wip-prompt.md` — Phase 4 (includes a recorded before/after prompt comparison).
- `030-studio-check-accents.md` — Phase 5 (includes a recorded 2-painting validation run).
- `028-auto-title-continuity.md` — Phase 3 (includes two bugs found and fixed during manual testing — see the file for details).

Mentor-v2 phases (`issue_019`–`issue_025`) and earlier M0–M5 issue files (`001`–`018`) are historical; done and merged.

---

## Workflow conventions (from `docs/workflow-sop.md`)

- One branch per issue: `issue-NNN-short-name`. Issue files are the source of truth, written before implementation starts on that branch.
- Commits are explicit-file-list, not `git add .`. Commit messages: imperative summary + bullet list of what/why.
- No bundling unrelated work in one commit; small logical commits within a phase are fine.
- Claude does not push or merge to `main` without the user explicitly saying so ("merge") — per phase, not once for a whole plan.
- After a phase: report (a) summary of changes, (b) files touched, (c) manual test steps, (d) branch name — then stop and wait.

---

## Implementation notes carried forward

- **Theme toggle:** inline SVG with `stroke="currentColor"`, not emoji (macOS system emoji font ignores CSS `color`).
- **`aps:` localStorage prefix** on all client-side storage keys.
- **Service worker cache name** bumped on every shell (`index.html`/`app.js`/`styles.css`/`service-worker.js`) change: format `apsv1-shell-YYYY-MM-DDx`. Currently `apsv1-shell-2026-07-18c`.
- **Gemini "thinking tokens" truncation:** `gemini-3.5-flash` can silently truncate a schema-enforced or plain-text response if `max_output_tokens` is too tight, even when the visible answer would be short — its internal reasoning eats into the same budget. Watch for `"semantic JSON parse recovered partial fields"` in the proxy log — that's the tell. Fix by raising the budget, not shortening prompts.
- **`normalizeSemanticResponse` (server-side, shared by In-Process/Studio Check/Archive) is a separate normalization path from `app.js`'s per-mode `normalize*` functions.** Adding a field to a schema and its prompt is not enough — it also has to be added to this shared server-side function, or it gets silently dropped before reaching the browser. Caught live during Phase 3 (`suggestedTitle` was missing here).
- **Restarting the proxy after a server-side edit is required** — `node server/semantic-proxy.js` only reads its own source once at process startup; unlike the static frontend files (read fresh per request via `serveStatic`), editing `server/semantic-proxy.js` while the process is already running has no effect until it's restarted. Easy to test-and-be-fooled if you forget this.
- **`studio-journal/` must stay gitignored** — never commit real entries; clean up any synthetic/test entries created during manual testing before committing, but never delete entries that look like the user's own testing (distinguishable by content, e.g. their own typos in a note field).
- **macOS Desktop-folder access:** this environment's Bash/Read tools can read `~/Documents` but not `~/Desktop` (a TCC privacy restriction) — even a `cp` run via the user's own `!`-prefixed shell input inherits the same restriction. If the user needs to share a file from Desktop, ask them to move/copy it into `~/Documents` (or a subfolder) via Finder first.

---

## Environmental notes for Claude

- Running as **Claude Code CLI** directly against the local repo at `~/Documents/GitHub/AI_studio_for_painters`.
- Claude can run `git add`/`commit`/`merge` itself once the user has authorized it in the conversation (merges are fast-forward only, one phase at a time), but never pushes to a remote without an explicit instruction.
- Live UI testing uses `mcp__claude-in-chrome__*` tools against a locally running `node server/semantic-proxy.js` (port 8080) or, for degradation testing, a plain static server (`python3 -m http.server`) with the proxy not involved.

---

## How to resume in a new chat

1. Confirm branch and working tree state: `git status` and `git log --oneline -10`.
2. Read, in order: this file, `docs/decisions.md`.
3. If the user names a new improvement plan or issue, read that plan file and the active issue before writing any code.

---

_Last updated: 2026-07-18, at the close of the mentor-v3 improvement plan (all 5 phases merged)._
