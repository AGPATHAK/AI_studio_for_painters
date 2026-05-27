# Issue 011 — AI-Native Critique Panel

## Purpose

Replace the current semantic-label pipeline with an AI-native critique response.

The app should no longer compress Gemini into small deterministic fields such as:
- regions
- valueFamilies
- critiqueTarget
- repaintFirstAction

Instead, Gemini should produce a structured painterly critique in the exact sequence the UI will display.

The frontend should display Gemini’s critique directly with only very light cleanup.

---

# Core Direction

AI Painter Studio is not Painter's Reference Lab.

Painter's Reference Lab is deterministic.

AI Painter Studio should use AI meaningfully for:
- painterly visual reasoning
- critique
- value structure diagnosis
- edge hierarchy analysis
- focal hierarchy
- atmosphere
- repaint guidance

Avoid deterministic critique templates except as fallback.

---

# Required Change

Move from:

Gemini → semantic labels → deterministic critique templates

to:

Gemini → rich ordered critique object → direct panel display

---

# Prompt Requirements

The Gemini prompt must incorporate the project philosophy from:

- docs/knowledge-base/painting_critique_philosophy.md
- docs/knowledge-base/visual_heuristics.md
- docs/knowledge-base/common_failure_modes.md
- docs/knowledge-base/critique_patterns.md
- docs/knowledge-base/watercolor_specific_doctrine.md
- docs/knowledge-base/repaintability_framework.md
- docs/knowledge-base/workflow_selection_logic.md
- docs/knowledge-base/intervention_scope_framework.md
- docs/knowledge-base/artist_influences.md

Use the philosophy wisely, not mechanically.

Gemini should act as a candid watercolor studio critic.

---

# Desired Critique Sequence

Ask Gemini to return critique in this order:

1. Priority diagnosis
2. Scene read
3. Value structure critique
4. Edge / atmosphere critique
5. Scope of intervention
6. Demonstrative correction description
7. Repaint handoff
8. What to preserve
9. What to avoid
10. Optional uncertainty note

The panel can show this sequence directly.

---

# Output Style

The critique should be:

- specific
- candid
- painterly
- scene-aware
- value-first
- repaint-oriented
- concise but not shallow

Avoid:
- generic labels
- vague praise
- over-compressed language
- AI-art wording
- deterministic boilerplate

---

# UI Requirements

Keep the panel simple.

Do NOT require progressive reveal.

The Gemini response can be shown directly in the panel in the requested sequence.

Keep:
- provenance indicator
- image-first layout
- quiet overlay if still useful

Remove or bypass:
- deterministic critique sentence templates
- heavy normalization
- semantic label compression

---

# Cleanup Rules

Cleanup should be extremely light:
- trim whitespace
- remove markdown fences if present
- correct obvious formatting only

Do NOT rewrite Gemini’s critique into generic house language.

---

# Fallback

If Gemini fails:
- use current fallback
- clearly show fallback provenance

---

# Deliverables

- revised Gemini prompt
- revised response shape
- direct AI critique panel rendering
- minimal cleanup only
- retained fallback
- concise implementation summary
- no commit
