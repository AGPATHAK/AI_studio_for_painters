# AI Painter Studio — Brief

_One-page consolidated brief. Source of truth for scope. Frozen at M0 close. Distilled from `design-philosophy.md` and `roadmap.md`._

## Problem

Painters working from photographic references waste effort manually preparing study variations (value studies, shadow mass simplifications, edge analyses) and lack a fast, structured way to diagnose weaknesses in their own paintings. Generic AI image tools fail this audience: they generate "pretty" outputs but do not teach the painter to see better.

## User

A practicing painter (oils, watercolour, gouache) doing reference-based studio work, often at the easel. Single user for v1 — Ardhendu — but the tool is built to be usable by any painter with the same workflow.

## Job To Be Done

Help the painter **see, diagnose, and decide** before and during repainting. Output is not the goal; the learning that flows from the output is the goal.

## Success Criteria (v1)

The system is successful if a painter can:

1. Upload a painting or reference and get a **specific, actionable critique** in painterly vocabulary (value, edges, composition, chroma).
2. Apply **one controlled value-simplification edit** that traces back to a specific critique item.
3. View **original vs edited side-by-side** without leaving the app.
4. Export a printable **Reference Sheet** they can place beside the canvas and repaint from without returning to the screen.

## Scope (v1)

**In scope:**
- Local image upload (JPG/PNG)
- Structured critique via LLM with JSON schema: `issue_type`, `region`, `suggested_action`, `priority`, `reasoning`
- One transformation: **value simplification with shadow-mass correction** (not posterization)
- Region-first editing using the critique's `region` field; global fallback when region detection fails (logged)
- History stack: original / last edit / current edit, with revert
- Side-by-side comparison view
- Reference Sheet export (4 panels: original, edited, optional diff overlay, distilled notes) at A4/Letter
- PWA install (manifest + service worker for app-shell offline)
- Light/dark theme toggle (studio lighting)

**Out of scope (deferred):**
- Multiple simultaneous transformations
- Variation generation (M6)
- Style-constrained transformations (M7)
- Extended session state beyond single-session history (M8)
- Masking UI / brush region selection (M9)
- PRL interop beyond manual image export/import (M10)
- Multi-user accounts, cloud sync, mobile-native apps
- Local model inference

## Non-Goals (anti-goals)

This system must **never** become:

- A generic AI art generator
- A Midjourney-style prompt playground
- A feature-heavy image editor
- A replacement for painting practice
- A tightly-coupled extension of PRL

If a proposed feature does not answer "**Does this help the painter see and decide better?**" — it is rejected.

## First Milestone

**M0 — Project Setup.** Repository, README, brief (this file), decisions log, and issue files for M0–M3. No runtime code.

## Key Design Decisions (locked at M0)

See `decisions.md` for the full log. The headline decisions:

1. **Static PWA, vanilla JS/HTML/CSS, no build step.** Mirrors PRL's structure beat-for-beat. Hosted on GitHub Pages.
2. **Single AI vendor for v1: OpenAI.** `gpt-4o`-class model for critique with JSON-structured output; `gpt-image-1` for image edits with mask support.
3. **BYO API key.** User pastes their own OpenAI API key into a settings panel; stored in `localStorage`. No backend, no proxy.
4. **Image stays local.** Uploaded image is held in the browser; the only outbound payload is the image bytes to OpenAI when the user explicitly triggers a critique or edit.
5. **Separation from PRL.** No shared runtime, UI, or state. Interop is image-file-level only.
6. **Critique always precedes edit.** No autonomous beautification. User must trigger every edit, and every edit must be traceable to a critique item.

## Critical Risks

- **Critique generic-ness.** LLM critique reads like generic AI commentary instead of painter-grade observation. → Mitigated by the M2a critique design phase: fixed test set of 10–15 images, prompt iteration until ≥80% of outputs pass painterly criteria.
- **Edit-critique misalignment.** The applied edit does not visibly correspond to the critique item that triggered it. → Mitigated by the M2.5 Critique → Edit Bridge: explicit mapping from `suggested_action` to edit-engine prompts and regions.
- **Beautification drift.** The image model adds detail, texture, or "finishing" the critique did not ask for. → Mitigated by anti-drift guardrails (`roadmap.md §5`) and explicit prompt constraints.
- **API key exposure.** The key sits in the browser. → Acceptable for personal/studio use; documented clearly; revisit if the app ever ships to third parties.

## Bottleneck

**Critique → Edit Bridge (M2.5).** Until this maps reliably, M3 cannot produce trustworthy results. M2a (critique design) must complete before M3 starts.

## Freeze condition

This brief is frozen when:
- All M0 issue files can be written without re-deciding scope.
- `decisions.md` records every locked decision above with rationale.
- This file fits on one page when printed.
