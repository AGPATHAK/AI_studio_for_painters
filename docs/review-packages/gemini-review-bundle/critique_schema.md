# Critique Schema

## Purpose

This document defines a human-readable structure for future AI-assisted painting critiques.

It is not implementation code. It is a shared shape for organizing critique so the system can remain:
- painter-centered,
- consistent,
- teachable,
- and useful for repaint decisions.

The schema should help a critique answer three questions:
1. What is happening visually?
2. Why does it matter as painting?
3. What should the painter try next?

---

## Schema Principles

A structured critique should:
- diagnose before prescribing,
- prioritize major visual structure before detail,
- preserve successful passages,
- explain the principle behind each recommendation,
- and end with repaint guidance the painter can act on.

Avoid:
- generic beautification,
- global improvement language,
- style imitation as a goal,
- and technical language that obscures the painting problem.

---

## Critique Type Taxonomy

Structured critique may use four related modes:

- diagnostic critique: names what is happening visually.
- teaching critique: explains why the issue matters as painting.
- prescriptive critique: identifies what the painter should try next.
- demonstrative critique: shows or describes a controlled alternative for comparison.

These modes can appear together, but they should not be blurred. A critique should diagnose before prescribing, and demonstrate only when comparison will clarify the repaint decision.

---

## Top-Level Critique Shape

Use this conceptual structure when a critique needs to be consistent or machine-readable later:

```yaml
critique:
  critique_type:
    primary:
    supporting_modes:

  overall_read:
    summary:
    strongest_passages:
    primary_weakness:

  design:
    diagnosis:
    visual_consequence:
    suggested_adjustment:
    principle:

  value_structure:
    diagnosis:
    value_grouping:
    dominant_masses:
    shadow_architecture:
    suggested_adjustment:

  focal_hierarchy:
    diagnosis:
    focal_area:
    competing_areas:
    contrast_priority:
    suggested_adjustment:

  edge_economy:
    diagnosis:
    hard_edges_to_preserve:
    edges_to_soften_or_lose:
    edge_clutter:
    suggested_adjustment:

  chroma_hierarchy:
    diagnosis:
    strongest_chroma:
    secondary_chroma:
    atmospheric_greys:
    suggested_adjustment:

  atmosphere:
    diagnosis:
    simplification_opportunities:
    depth_cues:
    suggested_adjustment:

  watercolor_handling:
    freshness:
    transparency:
    paper_integrity:
    wash_unity:
    suggested_adjustment:

  intervention_priority:
    first:
    second:
    optional:

  intervention_scope:
    scope_class:
    target_passage:
    protected_passages:

  repaint_guidance:
    repaintability_level:
    preparation:
    first_pass:
    preserve:
    simplify:
    final_accents:

  teaching_point:
    transferable_principle:
    guiding_question:
```

---

## Field Guidance

### Overall Read

Captures the first impression of the painting as a whole.

Use for:
- distance read,
- main strength,
- primary structural problem.

Avoid:
- starting with small corrections before naming the central issue.

---

### Critique Type

Clarifies the role of the critique.

Use for:
- diagnostic,
- teaching,
- prescriptive,
- demonstrative.

Avoid:
- turning every critique into a correction request.

---

### Design

Describes the arrangement of shapes, movement, containment, and visual emphasis.

Use for:
- dominant visual statement,
- tangent clutter,
- corner noise,
- directional movement,
- shape economy.

Useful question:
> What is the painting asking the eye to do?

---

### Value Structure

Describes how lights, midtones, and darks are grouped.

Use for:
- value grouping,
- dominant mass,
- shadow architecture,
- tonal cohesion,
- fragmentation.

Useful question:
> Does the painting still read when squinted at?

---

### Focal Hierarchy

Describes how attention is ordered across the painting.

Use for:
- focal contrast,
- competing passages,
- detail density,
- edge emphasis,
- chroma emphasis.

Useful question:
> Where should the strongest visual claim be, and what is competing with it?

---

### Edge Economy

Describes the distribution of hard, soft, lost, and broken edges.

Use for:
- edge equality,
- edge clutter,
- lost-and-found edges,
- atmospheric transitions,
- focal sharpness.

Useful question:
> Which edges deserve to remain sharp?

---

### Chroma Hierarchy

Describes how saturation is distributed and whether color supports structure.

Use for:
- excessive chroma,
- secondary chroma reduction,
- atmospheric greys,
- restrained palette,
- color supporting depth.

Useful question:
> Is color helping the structure, or competing with it?

---

### Atmosphere

Describes the painting’s air, depth, and degree of simplification.

Use for:
- atmospheric simplification,
- compressed distant detail,
- softened transitions,
- reduced peripheral contrast,
- breathing room.

Useful question:
> What can be removed or softened without weakening the painting?

---

### Watercolor Handling

Describes medium-specific concerns.

Use for:
- freshness,
- transparency,
- wash unity,
- glazing,
- paper fatigue,
- overworking.

Useful question:
> Is this passage becoming fresher or more labored?

---

### Intervention Priority

Orders recommendations by importance.

Use for:
- the first structural correction,
- the second supporting correction,
- optional refinements.

Avoid:
- listing every possible improvement as equally urgent.

---

### Intervention Scope

Describes how broad a suggested correction or demonstration may be.

Use for:
- local,
- regional,
- compositional,
- global-study.

Avoid:
- broad edits when a local teaching note would be clearer.

For scope rules, see [intervention_scope_framework.md](intervention_scope_framework.md).

---

### Repaint Guidance

Translates diagnosis into a practical repaint workflow.

Use for:
- repaintability level,
- planning a simplified value map,
- deciding what to preserve,
- rebuilding major masses,
- delaying accents,
- avoiding late-stage patching.

Useful question:
> What should the painter do differently on the next attempt?

---

### Teaching Point

Names the transferable lesson.

Use for:
- principles that apply beyond the current painting,
- concise guiding questions,
- painterly judgment.

Avoid:
- generic encouragement without visual reasoning.

---

## Lightweight Example

```yaml
critique:
  overall_read:
    summary: The painting has a clear subject, but the surrounding passages compete too strongly.
    strongest_passages: The central wash has freshness and a convincing sense of light.
    primary_weakness: The value structure fragments in the background and corners.

  critique_type:
    primary: diagnostic
    supporting_modes: teaching, prescriptive

  value_structure:
    diagnosis: The darks are scattered rather than grouped into a dominant mass.
    value_grouping: Lights and midtones need clearer families.
    dominant_masses: The main shadow shape should connect across the middle distance.
    shadow_architecture: Rebuild the shadows as one pattern before adding accents.
    suggested_adjustment: Merge small dark interruptions and compress secondary midtones.

  focal_hierarchy:
    diagnosis: The focal area is not sufficiently protected.
    focal_area: The central light shape.
    competing_areas: High-contrast marks near the upper right and lower edge.
    contrast_priority: Keep the strongest contrast near the focal light.
    suggested_adjustment: Quiet the corners and reduce peripheral edge activity.

  edge_economy:
    diagnosis: Too many background contours are equally sharp.
    hard_edges_to_preserve: A few structural accents near the focal area.
    edges_to_soften_or_lose: Background foliage and distant roofline.
    edge_clutter: Secondary contours pull attention away from the main shape.
    suggested_adjustment: Lose more edges in the background than feels comfortable.

  intervention_scope:
    scope_class: regional
    target_passage: background and corner passages
    protected_passages: central light shape and fresh central wash

  repaint_guidance:
    repaintability_level: high
    preparation: Make a small value grouping study before repainting.
    first_pass: Lay in the major light, midtone, and shadow families simply.
    preserve: Keep the central light shape and the freshest wash behavior.
    simplify: Reduce background description and corner contrast.
    final_accents: Add only a few hard edges near the focal area.

  teaching_point:
    transferable_principle: Merge first, separate later only if necessary.
    guiding_question: What can be removed without weakening the painting?
```

---

## Relationship to Other Documents

- Use [glossary.md](glossary.md) for preferred terminology.
- Use [visual_heuristics.md](visual_heuristics.md) for the visual reasoning behind each section.
- Use [common_failure_modes.md](common_failure_modes.md) for recurring diagnostic categories.
- Use [critique_patterns.md](critique_patterns.md) for critique phrasing.
- Use [prompt_primitives.md](prompt_primitives.md) for reusable AI-assisted correction instructions.
- Use [repaintability_framework.md](repaintability_framework.md) to judge whether guidance is actionable for a painter.
- Use [intervention_scope_framework.md](intervention_scope_framework.md) when a critique implies correction.
- Use [edit_request_schema.md](edit_request_schema.md) only when a critique should become a controlled demonstration.
- Use [workflow_selection_logic.md](workflow_selection_logic.md) to choose the right critique or teaching workflow.
- Use [watercolor_specific_doctrine.md](watercolor_specific_doctrine.md) when freshness, transparency, glazing, or paper integrity affect the recommendation.
