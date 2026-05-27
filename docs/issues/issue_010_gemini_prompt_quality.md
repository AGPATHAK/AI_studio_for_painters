# Issue 010 — Improve Gemini Semantic Prompt Quality

## Purpose

Improve the Gemini semantic prompt so the AI Studio produces richer, painter-useful critique grounding.

The current Gemini integration works technically, but its semantic output is too generic.

Example weak output:
- main scene mass
- connected shadow family

Desired output:
- distant mountain ridge
- water band
- shoreline dark accents
- foreground fence shadows
- vegetation mass at lower left
- cloud opening in upper sky

This issue improves prompt specificity, not system architecture.

---

# Core Principle

AI Painter Studio is allowed to use detailed multimodal critique.

This is not Painter's Reference Lab.

Painter's Reference Lab is deterministic.

AI Painter Studio should use AI to provide:
- richer visual reading,
- painterly scene interpretation,
- value-structure critique,
- repaint-relevant spatial grounding,
- and medium-aware guidance.

However, the output must remain:
- painter-centered,
- educational,
- restrained,
- and repaint-oriented.

---

# Problem

The current Gemini semantic pass often returns labels that are too abstract.

This weakens:
- scope clarity,
- repaint guidance,
- painter trust,
- and critique usefulness.

The semantic pass must describe visible scene forms, not just abstract design concepts.

---

# Goals

Improve Gemini prompt so it returns:

1. Concrete scene regions
2. Painter-readable spatial labels
3. Value-family descriptions
4. Specific critique target
5. Protected passages
6. Repaint-relevant guidance
7. Confidence/uncertainty where useful

---

# Prompt Requirements

The prompt should ask Gemini to behave as:

- a watercolor critique assistant,
- focused on visual structure,
- value grouping,
- edge economy,
- focal hierarchy,
- and repaint guidance.

It should NOT behave as:
- a generic image captioner,
- an AI-art generator,
- or a beautification engine.

---

# Required Semantic Output Fields

Ensure the proxy asks for and normalizes fields such as:

- sceneSummary
- regions
- valueFamilies
- primaryIssue
- critiqueTarget
- protectedPassages
- repaintFirstAction
- repaintPreserve
- repaintCaution
- uncertaintyNotes

Use existing frontend fields where possible, but enrich them if needed.

Do not overbuild UI.

---

# Output Quality Rules

Gemini should be explicitly instructed to:

- name visible forms concretely
- avoid generic phrases like "main scene mass"
- avoid vague phrases like "connected shadow family" unless paired with scene objects
- prefer "mountain ridge shadow mass" over "value family"
- prefer "shoreline dark band" over "mid-ground shadow"
- prefer "foreground fence shadow accents" over "lower field darks"
- distinguish water, sky, land, vegetation, buildings, boats, figures, paths, rocks, and shadows when visible
- state uncertainty if object identity is unclear

---

# Critique Depth

The semantic pass may provide detailed critique internally.

But frontend should still reveal only:
- one priority visual lesson,
- scope,
- demonstration,
- repaint handoff.

The UI should not dump all critique at once.

---

# Security

Do not change API key handling.

Do not expose secrets.

Do not move API calls to frontend.

---

# Non-Goals

Do NOT:
- add multi-model orchestration
- add autonomous image generation
- add variant galleries
- add new workflow modes
- redesign UI
- add settings panels
- add cloud deployment logic

---

# Validation

Test with at least:
- the mountain/water/fence scene
- one tree/landscape scene if available

Check whether Gemini output becomes:
- more concrete,
- more painter-readable,
- more repaint-actionable,
- less generic.

---

# Deliverables

- improved Gemini prompt
- updated response schema/normalization if needed
- improved frontend wording if needed
- concise implementation summary
- known limitations
- no commit

