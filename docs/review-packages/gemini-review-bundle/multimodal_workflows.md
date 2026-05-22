# Multimodal Workflows

## Purpose

This document defines the AI-assisted critique and correction workflows used throughout the project.

The emphasis is:
- painter education,
- visual diagnosis,
- repaint assistance,
- and controlled experimentation.

The repaint remains central.

---

## Core Workflow

The primary workflow is:

1. Upload painting
2. Diagnose structural issues
3. Select the appropriate teaching workflow
4. Compare critique artifacts or selective corrections
5. Repaint manually

The objective is:
- learning through visual comparison,
not:
- replacing the painter.

---

## Critique → Correction → Repaint

### Purpose

The correction stage exists to:
- demonstrate stronger design decisions,
- expose hidden weaknesses,
- and clarify repaint direction.

Corrections are teaching artifacts.

---

### Typical Corrections

Typical interventions include:
- reconnecting shadow masses,
- reducing edge clutter,
- simplifying flowers,
- muting secondary chroma,
- strengthening focal contrast,
- quieting backgrounds,
- compressing secondary detail.

---

## Critique Modes in Workflow

The workflow may use four critique modes:

- diagnostic critique to identify the problem,
- teaching critique to explain the principle,
- prescriptive critique to guide the next repaint,
- demonstrative critique to compare a controlled alternative.

Not every critique should become a demonstration. Use [workflow_selection_logic.md](workflow_selection_logic.md) to choose the lightest workflow that teaches the painter what matters.

---

## Selective Intervention Philosophy

Global “enhancement” is discouraged.

Preferred corrections are:
- local,
- interpretable,
- controlled,
- and visually explainable.

For scope classes and escalation rules, see [intervention_scope_framework.md](intervention_scope_framework.md).

---

## Value-Only Workflows

### Purpose

Separate structural value problems from color distraction.

---

### Typical Sequence

1. Convert to grayscale
2. Evaluate major masses
3. Identify fragmentation
4. Simulate simplified value grouping
5. Repaint based on corrected structure

---

## Notan and Tonal Mask Workflows

Recurring tools:
- grayscale studies,
- 3-value Notans,
- tonal masks,
- contour simplifications.

These workflows support:
- abstraction,
- value grouping,
- and compositional clarity.

---

## Overlay-Based Teaching

### Purpose

Provide direct visual instruction on the image itself.

---

### Typical Overlay Guidance

- soften here,
- merge these shapes,
- reduce this contrast,
- lose this edge,
- mute this region,
- sharpen focal transition,
- simplify this passage.

---

## Side-by-Side Comparison Workflows

### Purpose

Accelerate visual learning through comparison.

---

### Typical Comparisons

- original vs corrected,
- simplified vs fragmented,
- atmospheric vs literal,
- loose vs overworked,
- high-key vs middle-key,
- restrained vs noisy.

---

## Variant Exploration Workflows

### Purpose

Explore alternate interpretations without losing painter intent.

---

### Typical Variants

- stronger shadow grouping,
- quieter background,
- Wesson-like simplification,
- Seago-like atmosphere,
- restrained palette interpretation,
- alternate focal hierarchy.

---

## Region-Specific Edit Logic

A recurring doctrine:

Do not improve everything.

Instead:
- identify the weak region,
- isolate the problem,
- apply selective correction,
- preserve successful passages.

This mirrors traditional studio critique.

When a region-specific correction is justified, the bridge should remain traceable to one critique issue and one correction primitive. See [edit_request_schema.md](edit_request_schema.md).

---

## Repaint Planning Workflows

The system repeatedly emphasizes:
- repaint preparation,
- not final rendering.

Useful outputs include:
- value maps,
- simplified studies,
- tonal sheets,
- edge economy demonstrations,
- comparison layouts.

Repaint planning should make the next manual attempt clearer. See [repaintability_framework.md](repaintability_framework.md).

---

## PRL Relationship

Painter’s Reference Lab (PRL) acts as:
- deterministic visual analysis support.

Typical PRL outputs:
- grayscale,
- Notan,
- tonal masks,
- contour references,
- compositional overlays.

PRL supports structural analysis,
not probabilistic reinterpretation.

---

## AI Painter Studio Relationship

AI Painter Studio extends into:
- interpretive critique,
- controlled correction,
- visual experimentation,
- and repaint guidance.

However:
- educational purpose remains primary.

---

## Relationship to Prompt Primitives

When a workflow needs a repeatable instruction unit, use [prompt_primitives.md](prompt_primitives.md). When a workflow needs a diagnostic category, use [common_failure_modes.md](common_failure_modes.md). When a workflow needs selection rules, use [workflow_selection_logic.md](workflow_selection_logic.md). For watercolor handling limits, defer to [watercolor_specific_doctrine.md](watercolor_specific_doctrine.md).

---

## Future Workflow Direction

The long-term direction emphasizes:
- AI as diagnostic collaborator,
- controlled experimentation,
- painter-centered workflows,
- and visual reasoning assistance.

Not:
- autonomous art generation.
