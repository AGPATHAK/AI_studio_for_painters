# Issue 008 — AI Semantic Pass

## Purpose

Introduce a narrowly scoped AI semantic interpretation layer into the prototype.

The goal is NOT:
- autonomous critique,
- AI painting generation,
- or generalized image editing.

The goal IS:
- scene understanding,
- spatial grounding,
- and painter-friendly critique language.

This phase introduces:
- semantic labeling of scene regions,
- connected value-family understanding,
- and spatially grounded critique descriptions.

---

# Core Problem

The current deterministic critique system can identify:
- tonal fragmentation,
- masks,
- overlays,
- and value issues.

However, the critique language remains abstract because the system does not understand:
- what the scene elements are.

Example problem:
- critique references "mid-ground shadow family"
- but painter cannot clearly tell whether:
  - mountain,
  - shoreline,
  - or waterbody
  is being discussed.

---

# Goal

Add a lightweight AI semantic pass that identifies:
- major scene regions,
- dominant masses,
- connected shadow/value families,
- and spatial scene descriptions.

This semantic layer should improve:
- critique clarity,
- scope reveal,
- repaint guidance,
- and painter orientation.

---

# Important Constraints

The semantic AI layer should NOT:
- generate paintings,
- perform autonomous critique,
- redesign compositions,
- or produce beautified corrections.

It should ONLY provide:
- semantic interpretation.

The doctrine system remains responsible for:
- pacing,
- critique sequencing,
- selective intervention,
- repaint philosophy,
- and painter agency.

---

# Proposed Semantic Outputs

Examples:

- distant mountain
- shoreline dark accents
- foreground vegetation
- connected water-shadow band
- sky opening
- dominant shadow family

The outputs should remain:
- painter-friendly,
- spatially meaningful,
- and concise.

---

# Initial Technical Direction

Use:
- one tightly constrained semantic API call

Likely provider:
- Gemini Vision API

Keep architecture intentionally simple.

No:
- orchestration layers
- agent frameworks
- abstraction-heavy API systems

---

# Prototype Flow

upload
→ semantic interpretation
→ spatial grounding
→ critique generation
→ scope reveal
→ demonstrative correction
→ repaint guidance

---

# Deliverables

Implement:

1. semantic interpretation pass
2. structured semantic response
3. integration into critique wording
4. improved repaint guidance specificity
5. improved scope descriptions

Provide:
- concise implementation summary
- known limitations
- notes on future semantic refinement

No commit.

