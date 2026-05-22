# 03 Multimodal Workflows and Repaint

## Mini TOC

1. Source boundary: Multimodal workflows
2. Source boundary: Repaintability framework
3. Source boundary: Workflow selection logic
4. UX implications for Gemini

---

## Source Boundary: Multimodal Workflows

The AI-assisted critique workflow emphasizes:
- painter education,
- visual diagnosis,
- repaint assistance,
- controlled experimentation.

The repaint remains central.

### Core Workflow

The primary workflow is:
1. upload painting,
2. diagnose structural issues,
3. select the appropriate teaching workflow,
4. compare critique artifacts or selective corrections,
5. repaint manually.

The objective is learning through visual comparison, not replacing the painter.

### Critique -> Correction -> Repaint

The correction stage exists to:
- demonstrate stronger design decisions,
- expose hidden weaknesses,
- clarify repaint direction.

Corrections are teaching artifacts.

### Typical Corrections

Typical interventions include:
- reconnecting shadow masses,
- reducing edge clutter,
- simplifying flowers,
- muting secondary chroma,
- strengthening focal contrast,
- quieting backgrounds,
- compressing secondary detail.

### Critique Modes in Workflow

The workflow may use four critique modes:
- diagnostic critique to identify the problem,
- teaching critique to explain the principle,
- prescriptive critique to guide the next repaint,
- demonstrative critique to compare a controlled alternative.

Not every critique should become a demonstration. The system should choose the lightest workflow that teaches the painter what matters.

### Selective Intervention Philosophy

Global enhancement is discouraged.

Preferred corrections are:
- local,
- interpretable,
- controlled,
- visually explainable.

### Value-Only Workflows

Purpose:
- separate structural value problems from color distraction.

Typical sequence:
1. convert to grayscale,
2. evaluate major masses,
3. identify fragmentation,
4. simulate simplified value grouping,
5. repaint based on corrected structure.

### Notan and Tonal Mask Workflows

Recurring tools:
- grayscale studies,
- 3-value Notans,
- tonal masks,
- contour simplifications.

These workflows support:
- abstraction,
- value grouping,
- compositional clarity.

### Overlay-Based Teaching

Purpose:
- provide direct visual instruction on the image itself.

Typical overlay guidance:
- soften here,
- merge these shapes,
- reduce this contrast,
- lose this edge,
- mute this region,
- sharpen focal transition,
- simplify this passage.

### Side-by-Side Comparison Workflows

Purpose:
- accelerate visual learning through comparison.

Typical comparisons:
- original vs corrected,
- simplified vs fragmented,
- atmospheric vs literal,
- loose vs overworked,
- high-key vs middle-key,
- restrained vs noisy.

### Variant Exploration Workflows

Purpose:
- explore alternate interpretations without losing painter intent.

Typical variants:
- stronger shadow grouping,
- quieter background,
- Wesson-like simplification,
- Seago-like atmosphere,
- restrained palette interpretation,
- alternate focal hierarchy.

Variant language should point to principles, not style imitation.

### Region-Specific Edit Logic

Do not improve everything.

Instead:
- identify the weak region,
- isolate the problem,
- apply selective correction,
- preserve successful passages.

This mirrors traditional studio critique.

### Repaint Planning Workflows

The system emphasizes repaint preparation, not final rendering.

Useful outputs include:
- value maps,
- simplified studies,
- tonal sheets,
- edge economy demonstrations,
- comparison layouts.

### PRL Relationship

Painter's Reference Lab (PRL) is deterministic visual analysis support:
- grayscale,
- Notan,
- tonal masks,
- contour references,
- compositional overlays.

PRL supports structural analysis, not probabilistic reinterpretation.

AI Painter Studio extends into:
- interpretive critique,
- controlled correction,
- visual experimentation,
- repaint guidance.

Educational purpose remains primary.

---

## Source Boundary: Repaintability Framework

Repaintability is the practical clarity that allows a painter to move from critique into a stronger next attempt.

A critique is repaintable when it helps the painter understand:
- what is visually weakening the painting,
- why it matters,
- what should change first,
- what should be preserved,
- how to approach the next pass or repaint.

Repaintability is not the same as ease. A recommendation may be difficult, but it should be clear enough to guide the painter's next decision.

### Repaintability Requirements

Structural specificity:
- name the visual structure involved.

Priority:
- distinguish first-order problems from refinements.

Preserved strengths:
- identify what must not be lost.

Sequence:
- help the painter know when to act.

Transferable principle:
- leave behind a lesson that applies beyond the current image.

### Typical Repaint Sequence

1. simplify the value plan,
2. establish dominant masses,
3. protect focal hierarchy,
4. subordinate secondary passages,
5. add final accents sparingly.

### Repaintability Levels

High repaintability:
- the painter can identify the visual problem, affected region, first action, what to preserve, and how success should look.

Medium repaintability:
- the critique identifies the problem and principle, but exact repaint sequence needs interpretation.

Low repaintability:
- the critique names a general weakness but does not guide the next attempt clearly.

Low-repaintability critique should be revised before it becomes guidance or an edit request.

### Repaint Success Signals

A repaint has likely improved when:
- the image reads more clearly from distance,
- dominant masses are stronger,
- focal hierarchy is clearer,
- secondary passages compete less,
- edge economy feels more intentional,
- chroma supports depth and focus,
- watercolor passages remain fresh,
- and the painter can explain the change in visual terms.

Success is not measured by polish alone.

---

## Source Boundary: Workflow Selection Logic

Core principle:
> Choose the workflow that best helps the painter see the problem and make the next decision.

Do not default to image correction when a simpler teaching artifact would be clearer.

### Workflow Types

Diagnostic critique:
- use when the main need is identifying what is going wrong.
- output: concise diagnosis, consequence, priority, guiding principle.

Teaching critique:
- use when the painter needs to understand why the issue matters.
- output: principle, painterly explanation, guiding question.

Prescriptive critique:
- use when the issue is clear and the painter needs a next action.
- output: what to change first, what to preserve, what to delay.

Demonstrative critique:
- use when comparison would clarify the lesson and correction can remain interpretable.
- output: controlled correction, side-by-side comparison, repaint lesson.

### Failure Mode to Workflow Mapping

Fragmented value structure:
- value-only workflow,
- Notan or tonal mask,
- shadow mass simplification demonstration,
- repaint planning.

Weak focal hierarchy:
- diagnostic critique,
- side-by-side comparison,
- focal reinforcement demonstration,
- corner quieting if competition comes from edges.

Edge equality or clutter:
- overlay-based teaching,
- edge economy demonstration,
- side-by-side comparison.

Excessive chroma:
- chroma hierarchy critique,
- restrained palette comparison,
- secondary chroma reduction demonstration.

Weak atmosphere:
- atmospheric simplification critique,
- value and edge comparison,
- restrained variant exploration,
- repaint guidance.

Watercolor overworking:
- diagnostic critique,
- repaintability guidance,
- fresh passage planning,
- comparison with simpler wash structure.

Avoid for watercolor overworking:
- patch-style correction,
- repeated local fixes,
- digital polish.

### Pedagogical Intent

Choose based on what the painter needs:
- to see the problem: diagnostic critique or overlay,
- to understand the principle: teaching critique,
- to know what to do next: prescriptive critique,
- to compare an alternative: demonstrative critique,
- to repaint fresh: repaintability guidance.

### Selection Questions

Before choosing a workflow, ask:
- Is the failure mode clear?
- Is the problem local, regional, compositional, or better handled as a study?
- Would a correction teach more than a diagram or value study?
- What should be preserved?
- Is watercolor freshness at risk?
- What should the painter learn for the next repaint?

---

## UX Implications for Gemini

Please evaluate:
- when the system should lead with text vs image vs comparison,
- how many workflow artifacts can appear before attention fragments,
- whether workflow selection should be automatic or painter-guided,
- how to make "repaint now" feel natural rather than punitive,
- how to prevent endless requests for variants,
- and how to make PRL-style deterministic outputs work with AI interpretive critique.
