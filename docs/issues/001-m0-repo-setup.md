# Issue 001 — M0 Repo Setup

**Status: Done — 2026-05-11** (commit `e679db1`)

## Goal

Stand up the project repository with documentation, decisions, and forward issue files so that subsequent implementation milestones (M1+) have a stable foundation. Produce **no runtime code** in this issue — M0 is documentation-only per the roadmap.

## Why

Per the workflow SOP (Solo-Light v7) and the roadmap, no implementation begins until a brief, decisions log, and the first batch of issue files exist. This issue exists to satisfy that gate and to lock the architectural decisions (static PWA, vanilla JS, BYO OpenAI key, single vendor) before any code is written that would commit us to them.

## Scope

### Included

- `git init` on the workspace folder, `main` branch.
- `.gitignore` appropriate for a static PWA (OS junk, editors, secrets, build outputs, scratch).
- `README.md` at repo root, modelled on the sister app's README.
- `docs/brief.md` — consolidated one-page brief.
- `docs/decisions.md` — locked + open decisions, dated.
- `docs/design-philosophy.md` — relocated source doc.
- `docs/roadmap.md` — relocated source doc (was `roadmap_final.md`).
- `docs/workflow-sop.md` — relocated source doc (was `solo_ai_workflow_sop_solo_light_v7.md`).
- `docs/archive/roadmap-v0.1.md`, `docs/archive/roadmap-v0.2.md` — archived earlier drafts.
- `docs/issues/001`–`006` — issue files for M0 through M3.

### Excluded

- `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `service-worker.js`. These belong to M1.
- `icons/`. Created in M1 when there is something to render.
- Any GitHub Pages deploy. Done after M1 has something to show.
- Any GitHub remote setup beyond confirming the local repo is clean. Remote add + first push is a manual step the user does in GitHub Desktop after reviewing this commit.

## Data / State / API Model

Not applicable — documentation-only milestone.

## Acceptance Criteria

1. `git status` shows a clean working tree on `main` after the M0 commit.
2. The repo root contains exactly: `.gitignore`, `README.md`, `docs/`, `.git/`. Nothing else.
3. `docs/` contains: `brief.md`, `decisions.md`, `design-philosophy.md`, `roadmap.md`, `workflow-sop.md`, `archive/`, `issues/`.
4. `docs/issues/` contains 6 files: 001 (this issue, Active), 002–006 (Planned).
5. `docs/brief.md` fits on one printed page and answers: problem, user, success criteria, scope, non-goals, first milestone, key decisions.
6. `docs/decisions.md` has at least D1–D5 locked with rationale and at least O1–O7 open decisions surfaced.
7. `README.md` references all planning documents by relative path and they resolve.
8. The first git commit message is a single coherent unit covering only M0 deliverables.

## Validation Method

Manual, in this order:

```bash
git status                          # clean tree
git ls-files | sort                 # exact file inventory
ls docs/                            # confirm structure
ls docs/issues/                     # confirm 6 issue files
ls docs/archive/                    # confirm 2 archived drafts
head -1 README.md                   # sanity-check root README
```

Plus a human read-through of `README.md`, `docs/brief.md`, and `docs/decisions.md` in GitHub Desktop's diff view before commit.

## Likely Files / Modules

All under repo root and `docs/`. No source code touched.

## Constraints

- One commit for the entire M0 scope. Do not bundle anything outside M0.
- Use explicit `git add <path>` per the SOP — no `git add .`.
- The commit message follows the SOP commit format (short imperative summary + bullet list of specific deliverables).
- No secrets, no API keys, no scratch files committed.
- No `index.html` or runtime files even as empty stubs.

## Status / Next Action

**Done.** Committed as `e679db1` on `main` on 2026-05-11.

Follow-on housekeeping (small commit on `main` after this commit):
- Lock O1 (repo name) in `decisions.md` → resolved as `AI_studio_for_painters`.
- Patch the placeholder GitHub Pages URL in `README.md` to the real slug.
- Switch issue 002 from Planned to Active.

Then: branch `issue-002-m1-input-display` and start M1.
