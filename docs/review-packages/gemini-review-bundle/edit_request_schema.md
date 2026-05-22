# Edit Request Schema

## Purpose

This document defines the conceptual bridge between a critique and a controlled correction demonstration.

It is not implementation code. It describes what an edit request must clarify so that any AI-assisted correction remains:
- traceable to a critique,
- selective,
- interpretable,
- painter-centered,
- and useful for repaint learning.

---

## Core Doctrine

An edit request should never mean "improve the painting."

It should mean:
> Demonstrate one limited visual correction that helps the painter understand a specific critique.

If the critique is not specific enough to guide a controlled demonstration, it should return to repaint guidance rather than become an edit request.

---

## Conceptual Shape

```yaml
edit_request:
  source_critique:
    critique_type:
    source_section:
    diagnosis:
    teaching_principle:
    suggested_adjustment:

  selected_primitive:
    name:
    purpose:
    related_failure_mode:

  intervention_scope:
    scope_class:
    target_region:
    protected_passages:
    reason_for_scope:

  edit_intent:
    change_to_demonstrate:
    what_to_preserve:
    what_to_avoid:

  interpretability:
    painter_should_notice:
    comparison_question:
    success_signal:

  fallback_behavior:
    if_region_unclear:
    if_scope_too_broad:
    if_watercolor_freshness_at_risk:
```

---

## Field Guidance

### Source Critique

Links the request back to the critique that justified it.

Use for:
- diagnostic critique type,
- root issue,
- teaching principle,
- proposed adjustment.

Avoid:
- edit requests that cannot be traced to a clear critique.

---

### Selected Primitive

Names the correction idea being demonstrated.

Examples:
- shadow mass simplification,
- midtone compression,
- edge reduction,
- secondary chroma reduction,
- corner quieting,
- focal reinforcement,
- wash unification.

The primitive should come from [prompt_primitives.md](prompt_primitives.md) or be clearly justified by the same vocabulary.

---

### Intervention Scope

Defines how broad the correction may be.

Use:
- local,
- regional,
- compositional,
- global-study.

For scope rules, see [intervention_scope_framework.md](intervention_scope_framework.md).

---

### Edit Intent

States the visual lesson.

It should include:
- what changes,
- what stays intact,
- and what must not be introduced.

Common prohibitions:
- no added detail,
- no beautification,
- no new subject matter,
- no finishing pass,
- no style imitation,
- no loss of successful fresh passages.

---

### Interpretability

Defines what the painter should be able to see after comparison.

Useful comparison questions:
- Did the value grouping become clearer?
- Did the focal area gain priority?
- Did secondary edges become quieter?
- Did chroma support depth better?
- Did the correction preserve the painter's original intent?

---

### Fallback Behavior

Defines what to do when the request cannot remain controlled.

Fallback examples:
- if the region is unclear, use an overlay or repaint note instead of an edit,
- if the scope becomes too broad, convert the edit into a value study,
- if watercolor freshness is at risk, recommend repainting fresh rather than patching,
- if the critique lacks specificity, return to diagnostic critique.

---

## Valid Edit Request Qualities

A valid edit request is:
- linked to one critique issue,
- limited in scope,
- phrased in painterly terms,
- clear about what to preserve,
- clear about what to avoid,
- and evaluable through side-by-side comparison.

---

## Invalid Edit Request Signals

An edit request should be rejected or rewritten when it:
- asks for general improvement,
- combines several unrelated issues,
- changes the subject or drawing unnecessarily,
- introduces detail or finish,
- hides the original painter's decision-making,
- or cannot explain what the painter should learn from the demonstration.

---

## Lightweight Example

```yaml
edit_request:
  source_critique:
    critique_type: prescriptive
    source_section: value_structure
    diagnosis: The middle-distance darks are scattered and weaken the distance read.
    teaching_principle: Merge first, separate later only if necessary.
    suggested_adjustment: Connect the shadow family before adding accents.

  selected_primitive:
    name: shadow mass simplification
    purpose: strengthen value grouping
    related_failure_mode: fragmented value structure

  intervention_scope:
    scope_class: regional
    target_region: middle-distance shadow passages
    protected_passages: central light shape and existing fresh sky wash
    reason_for_scope: the issue affects a connected passage, not the entire painting

  edit_intent:
    change_to_demonstrate: unify scattered darks into a calmer shadow architecture
    what_to_preserve: drawing, focal light, watercolor softness
    what_to_avoid: added detail, sharper outlines, decorative contrast

  interpretability:
    painter_should_notice: the painting reads more clearly at thumbnail size
    comparison_question: Are the shadows behaving as one structure?
    success_signal: fewer isolated dark accents and stronger dominant mass

  fallback_behavior:
    if_region_unclear: use an overlay note instead of a correction
    if_scope_too_broad: make a value-only study
    if_watercolor_freshness_at_risk: recommend repainting the passage fresh
```

---

## Relationship to Other Documents

- Use [critique_schema.md](critique_schema.md) for critique source structure.
- Use [prompt_primitives.md](prompt_primitives.md) for candidate correction primitives.
- Use [intervention_scope_framework.md](intervention_scope_framework.md) for scope decisions.
- Use [repaintability_framework.md](repaintability_framework.md) to keep the demonstration useful for manual repainting.
