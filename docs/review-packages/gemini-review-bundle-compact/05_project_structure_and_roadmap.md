# 05 Project Structure and Roadmap

## Mini TOC

1. Knowledge architecture map
2. Current project stage
3. Milestone summaries
4. Review implications for Gemini

---

## Knowledge Architecture Map

The knowledge base exists to transform critique discussions, workflows, and artistic doctrines into:
- reusable documentation,
- structured critique systems,
- prompt primitives,
- future AI-readable knowledge assets.

This phase is conceptual, pedagogical, and architectural. Implementation comes later.

### Canonical Vocabulary

Use these terms consistently:
- value grouping: organization of lights, midtones, and darks into readable masses.
- focal hierarchy: ordered control of contrast, edge sharpness, chroma, and detail density.
- edge economy: selective use of hard, soft, lost, and broken edges.
- chroma hierarchy: controlled saturation supporting depth, focus, and atmosphere.
- atmospheric simplification: omission, softening, compression, and grouping in service of air and depth.
- selective intervention: local, interpretable correction that teaches what to change and why.
- repaint workflow: diagnosis, simplified planning, manual repainting, and comparison.
- painterliness: visual authority through selection, abstraction, and brush-led decision-making.

### Canonical Documents

Glossary:
- preferred meanings,
- related concepts,
- usage boundaries,
- painter-centered phrasing.

Critique schema:
- design,
- value structure,
- focal hierarchy,
- edge economy,
- chroma hierarchy,
- atmosphere,
- watercolor handling,
- repaint guidance.

Painting critique philosophy:
- role of critique,
- role of AI,
- critique -> correction -> repaint,
- painterliness vs realism,
- simplification philosophy,
- anti-goals.

Visual heuristics:
- value grouping,
- edge economy,
- focal contrast,
- chroma hierarchy,
- atmosphere,
- simplification.

Common failure modes:
- symptoms,
- causes,
- visual consequences,
- corrective actions,
- repaint strategies.

Artist influences:
- Edward Wesson,
- Edward Seago,
- line-and-wash traditions,
- restrained palette doctrine.

Multimodal workflows:
- critique overlays,
- repaint simulations,
- side-by-side comparisons,
- selective edits,
- value-only workflows,
- variant generation.

Critique patterns:
- diagnosis templates,
- intervention phrasing,
- repaint guidance patterns,
- edge/value/chroma vocabulary.

Watercolor doctrine:
- freshness,
- glazing,
- paper fatigue,
- edge sensitivity,
- overworking,
- transparency handling.

Prompt primitives:
- simplify shadows,
- reduce edge count,
- mute secondary chroma,
- preserve focal hierarchy,
- strengthen atmosphere.

Repaintability framework:
- actionable critique,
- repaint sequence,
- preserved strengths,
- success signals,
- critique-to-repaint learning.

Edit request schema:
- critique linkage,
- selected primitive,
- intervention scope,
- interpretability,
- fallback behavior.

Intervention scope framework:
- local scope,
- regional scope,
- compositional scope,
- global study scope,
- escalation rules.

Workflow selection logic:
- critique type selection,
- failure-mode mapping,
- medium sensitivity,
- pedagogical intent.

---

## Current Project Stage

The project is currently moving from conceptual architecture into future app workflow design.

Completed or prepared:
- static PWA baseline,
- knowledge-base normalization,
- glossary,
- critique schema,
- architecture refinement pass,
- review packages for external critique.

The product surface should still be treated as designable. Workflow sequencing, critique surfaces, and repaint handoff are not yet locked.

---

## Milestone Summaries

### M0 Repo Setup

Documentation and planning foundation:
- brief,
- decisions,
- design philosophy,
- roadmap,
- workflow SOP,
- issue files.

No runtime code.

### M1 Input + Display Baseline

Done.

The static PWA shell supports:
- image upload,
- display in responsive canvas,
- reset,
- theme persistence,
- service worker caching,
- installability.

No AI yet. This validates the app shell and gives later workflows a surface to build on.

### M2a Critique Design

Planned.

Goal:
- produce a versioned prompt set and critique schema that generate non-generic, actionable, painter-aligned, prioritized critiques on a fixed test set.

No app integration yet.

Important UX relevance:
- this milestone should define the critique voice and output shape before UI surfaces harden.

### M2 Critique Engine Integration

Planned.

Goal:
- let user provide an API key,
- request critique on loaded image,
- render structured critique in side panel,
- keep critique JSON available for later edit bridge.

Important UX relevance:
- this is where critique surfaces first become real.
- risk: a panel of many issues may overload the painter.

### M2.5 Critique -> Edit Bridge

Planned.

Goal:
- define the contract that turns one critique item into a concrete edit request.
- validate mapping from critique to edit request before applying edits.

Important UX relevance:
- this is where selected issue, scope, protected passages, and teaching intent need to remain legible.

### M3 First Controlled Edit

Planned.

Goal:
- apply one fixed transformation: value simplification with shadow-mass correction.
- result displayed beside original.
- edit traceable to critique item.
- history stack allows revert.

Important UX relevance:
- first real test of critique -> correction -> repaint.
- risk: user may treat AI correction as the endpoint rather than a study for repaint.

---

## Review Implications for Gemini

Please evaluate:
- whether M2 should first show a compact priority summary or image-anchored critique,
- whether M2.5 needs explicit painter approval of scope before demonstration,
- whether M3 should limit demonstrations per image,
- how the UX should prevent "apply edit" from becoming the primary affordance,
- how tablet/iPad layout should handle critique without shrinking the painting too much,
- and what workflow decisions should be locked before M2 versus left flexible until painter testing.

---

## Non-Goals to Preserve

The project should not become:
- a generic image generator,
- a style imitation app,
- an automatic painting enhancer,
- a polishing tool,
- or a system that replaces the painter's judgment.

The guiding heuristic remains:
> The system exists to help painters see better, simplify better, and make stronger visual decisions.
