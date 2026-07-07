# Session Notes — Handoff for next chat

_This file is a continuity artifact. If you're a new chat session reading this for the first time, read it through before anything else. Then read `docs/brief.md`, `docs/decisions.md`, `docs/improvement-plan-mentor-v2.md`, and the active issue file in `docs/issues/`._

_If you're Ardhendu opening a new chat: drop this file path into the conversation and say "read session-notes.md and continue"._

---

## Project

**AI Painter Studio** — a browser-based **visual reasoning tool for painters**. It is the AI-assisted companion to the sister app [Painter's Reference Lab (PRL)](https://github.com/AGPATHAK/PaintersRef_v5.2). It is **not** an image generator; it helps the painter see, diagnose, and repaint better via a Critique → Correction → Repaint loop, now extended into a persistent studio-mentor loop (profile, journal, progress memory, follow-up chat).

Repo on user's machine: `~/Documents/GitHub/AI_studio_for_painters`
GitHub: `https://github.com/AGPATHAK/AI_studio_for_painters`

---

## Where we are right now

The M0–M5 foundational build (see `docs/roadmap.md`) is long done and merged. The project is now most of the way through **`docs/improvement-plan-mentor-v2.md`**, a 7-phase plan that turns the stateless critique generator into a persistent mentor. Execution order: **1 → 2 → 5 → 4 → 3 → 6 → 7**.

- **Phase 1 — Painter profile + doctrine** (`issue-019-painter-profile`) — **merged to `main`**.
- **Phase 2 — Studio journal persistence** (`issue-020-studio-journal`) — **merged to `main`**.
- **Phase 5 — Critique panel UI restructure** (`issue-023-panel-tiers`) — done, committed, **not yet merged**.
- **Phase 4 — Mentor follow-up chat** (`issue-022-mentor-chat`) — done, committed, **not yet merged**.
- **Phase 3 — Progress memory / distillation** (`issue-021-progress-memory`) — done, committed, **not yet merged**.
- **Phase 6 — Prompt refinements** (`issue-024-prompt-polish`) — done, committed, **not yet merged**.
- **Phase 7 — Housekeeping** (`issue-025-housekeeping`) — **in progress** (this file is part of it).

Branches after Phase 1/2 are **stacked**, not independent: `023 → 022 → 021 → 024 → 025`, each branched from the previous. This was a deliberate choice, not the plan's literal branch-dependency table — Phases 3–6 each touch the critique panel / journal state that the previous phase had just changed, so stacking avoided merge conflicts and kept work linear for a solo session. **None of `023`/`022`/`021`/`024`/`025` are merged to `main` yet.** The user tests each phase after it lands and says "merge" (or gives corrections) before the next branch is folded in — that has not happened yet for these five.

**Immediate next action (user):** test the full stack (`issue-025-housekeeping`, which contains everything above it), then either say "merge" to fold the whole stack into `main`, or give corrections.

**Immediate next Claude action:** none pending — wait for the user's test results / merge instruction.

---

## Roles

- **User (Ardhendu)** — product owner, tester, decision-maker. Approves direction, tests behavior in the real app, gives the explicit "merge" instruction.
- **Claude** — project manager, architect, and implementer, running as **Claude Code CLI** directly in the repo (not the old Cowork/sandbox setup this file used to describe). Writes issue files, branches, implements, tests locally (including live browser testing via `mcp__claude-in-chrome__*` tools), commits with the user's authorization. **Does not push or merge to `main`** without an explicit "merge" instruction from the user.

---

## Locked decisions (headlines only — see `docs/decisions.md` for full rationale)

- **D1.** Static PWA, vanilla JS/HTML/CSS, no build step, GitHub Pages (frontend) + a local Node proxy (AI calls).
- **D2.** *(Stale — see note below.)* Originally locked OpenAI as the AI vendor. The app has since moved entirely to **Google Gemini** (`gemini-3.5-flash` for critique, `gemini-3.1-flash-image-preview` for image edits/mockups), served through `server/semantic-proxy.js`. This vendor switch predates the mentor-v2 plan and was never recorded as its own decision row — flagged here as a documentation gap, not resolved in Phase 7 (out of that phase's explicit scope). If you're touching vendor/model selection, treat the code as authoritative over D2's text.
- **D3.** *(Superseded in practice by D8.)* Originally "BYO key in `localStorage`, no backend." The app now runs a local proxy (`server/semantic-proxy.js`) that holds the Gemini key server-side (`server/.env`) and owns the studio journal on disk. D3's "image stays local unless user-triggered" spirit still holds; the "no backend, no proxy" part does not.
- **D4.** Separation from PRL is non-negotiable. Image-file-level interop only.
- **D5.** Critique precedes edit. User triggers every edit. Every edit traceable to a critique item.
- **D6.** Repo name: `AI_studio_for_painters`.
- **D7.** License: MIT.
- **D8.** Studio journal stored on disk via the proxy, not client-side (2026-07-07).
- **D9.** Painter profile as a server-side JSON file (2026-07-07).
- **D10.** Follow-up chat as a dedicated, scoped proxy endpoint — not a general chatbot (2026-07-07).
- **D11.** Annotated-mockup and correction/edit features kept as-is through the mentor-v2 plan (owner decision, 2026-07-07).

---

## Current architecture (post mentor-v2)

- **Four workflow modes**, each its own left-panel tab, its own image state, its own Gemini prompt/schema: Reference Ideation, In-Process, Studio Check, Archive.
- **`server/semantic-proxy.js`** — dependency-free Node HTTP server. Serves the static app, proxies every Gemini call, owns `studio-journal/` on disk. Full endpoint list in `README.md` → "Proxy API".
- **Prompt injection** — every critique prompt is `withProfile(basePrompt, { doctrine, guardrail })`: base prompt + `server/painter-profile.json` (skill/tradition/taste) + `server/doctrine.js` (studio judgment rules, critique/studio-check/archive/followup only) + an intermediate-register guardrail.
- **Studio journal** — every successful critique auto-saves to `studio-journal/entries/*.json` (+ `.jpg` thumbnail). Rating (useful/partly/off), free-text note, and a painting title that links sessions of the same painting across modes. Gitignored; the app feature-detects the proxy once at startup and hides all journal UI if it's absent.
- **Progress memory** — `POST /api/journal/distill` distills the last 15 non-"off" entries into persistent development areas / improving areas / established strengths, cached to `studio-journal/progress-summary.json`. Auto-regenerates after a save once ≥5 new entries exist. Injected back into In-Process and Studio Check prompts as a history block; a same-painting continuity opt-in (checkbox) additionally injects the prior session's conclusion when the painter opts in.
- **Journal view** — a fifth left-panel item (`appState.view`, deliberately *not* a workflow mode) showing the development-areas card and a plain, expandable entry list.
- **Mentor follow-up chat** — `POST /api/followup`, scoped to the current painting + critique, plain-text answer, persisted into the journal entry's `chat` array.
- **Critique panel tiers** — priority lesson (always visible) / full read (collapsed `<details>`, open by default only in Reference Ideation) / mode extras.

---

## Issue files (source of truth for implementation)

In `docs/issues/`, mentor-v2 phases:

- `issue_019_painter_profile.md` — Phase 1. **Done, merged.**
- `issue_020_studio_journal.md` — Phase 2. **Done, merged.**
- `issue_023_panel_tiers.md` — Phase 5. **Done, committed, awaiting merge.**
- `issue_022_mentor_chat.md` — Phase 4. **Done, committed, awaiting merge.**
- `issue_021_progress_memory.md` — Phase 3. **Done, committed, awaiting merge.**
- `issue_024_prompt_polish.md` — Phase 6. **Done, committed, awaiting merge.**
- `issue_025_housekeeping.md` — Phase 7. **Active** (this file is part of it).

Earlier M0–M5 issue files (`001`–`018`) are historical; the milestones they describe are done and merged.

---

## Workflow conventions (from `docs/workflow-sop.md`)

- One branch per issue: `issue-NNN-short-name`. Issue files (`docs/issues/issue_NNN_short_name.md`) are the source of truth, written before implementation starts on that branch.
- Commits are explicit-file-list, not `git add .`. Commit messages: imperative summary + bullet list of what/why.
- No bundling unrelated work in one commit; small logical commits within a phase are fine.
- Claude does not push or merge to `main` without the user explicitly saying so ("merge").
- After a phase: report (a) summary of changes, (b) files touched, (c) manual test steps, (d) branch name — then stop and wait.

---

## Implementation notes carried forward

- **Theme toggle:** inline SVG with `stroke="currentColor"`, not emoji (macOS system emoji font ignores CSS `color`).
- **`aps:` localStorage prefix** on all client-side storage keys.
- **Service worker cache name** bumped on every shell (`index.html`/`app.js`/`styles.css`/`service-worker.js`) change: format `apsv1-shell-YYYY-MM-DDx`. Currently `apsv1-shell-2026-07-07d`.
- **Gemini "thinking tokens" truncation:** `gemini-3.5-flash` can silently truncate a schema-enforced or plain-text response if `max_output_tokens` is too tight, even when the visible answer would be short — its internal reasoning eats into the same budget. Hit this three times across Phases 3/4/6 (followup, distill, studio-check/archive); fixed each time by raising the budget (followup 2048, distill 3000, studio-check/archive 4096) rather than shortening prompts. Watch for `"semantic JSON parse recovered partial fields"` in the proxy log — that's the tell.
- **`studio-journal/` must stay gitignored** — never commit real entries; clean up any synthetic/test entries created during manual testing before committing.

---

## Environmental notes for Claude

- Running as **Claude Code CLI** directly against the local repo at `~/Documents/GitHub/AI_studio_for_painters` — no sandbox mount path, no `.git/index.lock` quirk to work around (that was specific to the old Cowork setup and no longer applies).
- Claude can run `git add`/`commit` itself once the user has authorized it in the conversation, but never pushes or merges to `main` without an explicit instruction.
- Live UI testing uses `mcp__claude-in-chrome__*` tools against a locally running `node server/semantic-proxy.js` (port 8080) or, for degradation testing, a plain static server (`python3 -m http.server`) with the proxy killed.

---

## How to resume in a new chat

1. Confirm branch and working tree state: `git status` and `git log --oneline -10`.
2. Read, in order: this file, `docs/decisions.md`, `docs/improvement-plan-mentor-v2.md`, the active issue file in `docs/issues/`.
3. If the branch stack (`023 → 022 → 021 → 024 → 025`) hasn't been merged yet, the next step is almost always "wait for the user's test results," not new feature work — check the latest messages in-session first.

---

_Last updated: 2026-07-07, during Phase 7 (housekeeping) of the mentor-v2 improvement plan._
