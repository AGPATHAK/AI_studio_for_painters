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
3. Reveal the proposed intervention scope
4. Explain the teaching principle
5. Compare critique artifacts or selective corrections
6. Repaint manually

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

## Critique Surface Sequencing

Critique surfaces should not all appear at once.

Preferred sequence:
1. diagnosis,
2. scope reveal,
3. teaching explanation,
4. demonstration,
5. repaint guidance.

The priority diagnosis should appear first. Secondary critiques should be hidden, collapsed, or deferred until the painter has understood the main visual lesson.

This pacing protects the painter from trying to solve value, edge, chroma, composition, and detail at the same time.

---

## Typical Corrections

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

## Scope Reveal Before Demonstration

Before any correction or demonstrative critique appears, the painter should first see:
- the target passage,
- the scope class,
- what will be preserved,
- and why the scope is appropriate.

This orientation preserves trust. It makes selective intervention visible before the system changes or compares anything.

Preferred order:
1. diagnosis,
2. scope reveal,
3. controlled demonstration,
4. repaint guidance.

---

## Selective Intervention Philosophy

Global “enhancement” is discouraged.

Preferred corrections are:
- local,
- interpretable,
- controlled,
- and visually explainable.

Demonstrations should be limited. The system should avoid endless variants, correction shopping, and optimization drift. Once the lesson is visible, the next preferred action is repaint planning.

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

### Quiet Overlay Doctrine

Overlays should guide attention without visually dominating the painting.

Preferred overlays are:
- subtle,
- sparse,
- non-destructive,
- easy to dismiss,
- and visually subordinate to the painting.

Avoid:
- aggressive digital markup aesthetics,
- dense labels,
- heavy outlines,
- saturated annotation colors,
- and overlays that make the painting harder to see.

The overlay should act like a teacher pointing gently at the painting, not like a graphic layer competing with it.

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

Variant exploration should be limited and purposeful. A variant should answer a specific visual question, not invite shopping for a better image.

After a useful variant comparison, the system should transition toward repaint guidance.

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

Repaint planning is the terminal educational handoff. It should summarize the next manual attempt rather than invite another round of optimization.

Repaint planning should make the next manual attempt clearer. See [repaintability_framework.md](repaintability_framework.md).

---

## Image-First Workflow Doctrine

Multimodal critique should keep the painting visually dominant.

Conceptual priorities:
- critique text supports looking,
- overlays remain quiet,
- comparisons should be focused and few,
- controls should not compete with the image,
- tablet and iPad review should preserve enough image area for real looking.

The painter should not have to manage many panels, layers, or modes before seeing the main lesson.

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

## Four-Stage Workflow (current implementation)

The app uses four stages, each with its own prompt, schema, and intended use.

### Stage 1: Reference Ideation

**When:** Before painting starts. Upload a reference photograph.
**Purpose:** Compositional and painterly interpretation — what could this become as a painting?
**Prompt framing:** Design operations, shape economy, value massing, crop ideas, atmospheric simplification.
**Output:** Dominant read, value masses, atmosphere, focal hierarchy, simplification idea, palette direction, crop ideas.
**No corrections.** This is not a critique.

---

### Stage 2: In-Process

**When:** Painting is under way. Upload a WIP photo.
**Purpose:** Identify the single most structurally important issue; prescribe one bounded next action.
**Prompt framing:** Progressive reveal — one priority lesson, scope class, protected passages, repaint guidance.
**Output:** priorityDiagnosis, sceneRead, value/focal/edge/chroma/watercolor critique, interventionScope, teachingPoint, repaintHandoff, preserve, avoid.
**Edit buttons active** (value, focal, edges, chroma → suggest edit → apply correction).

---

### Stage 3: Studio Check

**When:** Painting feels nearly done but has not been signed. Upload the near-final painting.
**Purpose:** Answer one question: sign now, or make one more bounded adjustment first?
**Prompt framing:** Last-opportunity read across all dimensions. Anti-spiral guard — "the painting should stop" is a complete answer.
**New fields:** signingRecommendation (direct verdict), finalAdjustments (≤3 ordered actions), mediaOptions (pen, pastel, dry brush, gouache if applicable).
**Edit buttons active** (same 4 as In-Process). Corrections are still possible here.

---

### Stage 4: Archive

**When:** Painting is signed and complete. Upload the finished, signed work.
**Purpose:** Retrospective critique and study record — not prescription, not correction.
**Prompt framing:** Post-session studio note. Document what worked, what to study, where to go next.
**New fields:** strengths (2–4 specific successes to repeat), studyAreas (recurring weakness patterns to practice), nextExploration (1–2 future ideas), exhibitionNote (one-sentence candid readiness assessment).
**No edit buttons.** The painting is closed.

---

## Future Workflow Direction

The long-term direction emphasizes:
- AI as diagnostic collaborator,
- controlled experimentation,
- painter-centered workflows,
- and visual reasoning assistance.

Not:
- autonomous art generation.
