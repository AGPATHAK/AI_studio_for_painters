# 04 Operational Schema and Edit Logic

## Mini TOC

1. Source boundary: Critique schema
2. Source boundary: Prompt primitives
3. Source boundary: Edit request schema
4. Source boundary: Intervention scope framework
5. UX implications for Gemini

---

## Source Boundary: Critique Schema

The critique schema is a human-readable structure for future AI-assisted painting critiques. It is not implementation code.

It should help a critique answer:
1. What is happening visually?
2. Why does it matter as painting?
3. What should the painter try next?

### Schema Principles

A structured critique should:
- diagnose before prescribing,
- prioritize major visual structure before detail,
- preserve successful passages,
- explain the principle behind each recommendation,
- end with repaint guidance the painter can act on.

Avoid:
- generic beautification,
- global improvement language,
- style imitation as a goal,
- technical language that obscures the painting problem.

### Critique Type Taxonomy

Structured critique may use four related modes:
- diagnostic critique: names what is happening visually,
- teaching critique: explains why the issue matters as painting,
- prescriptive critique: identifies what the painter should try next,
- demonstrative critique: shows or describes a controlled alternative for comparison.

These modes can appear together, but they should not be blurred. A critique should diagnose before prescribing, and demonstrate only when comparison will clarify the repaint decision.

### Conceptual Shape

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

### Field Guidance Highlights

Overall read:
- first impression, distance read, main strength, primary structural problem.

Design:
- arrangement of shapes, movement, containment, visual emphasis.

Value structure:
- value grouping, dominant mass, shadow architecture, tonal cohesion, fragmentation.

Focal hierarchy:
- attention order across contrast, edge emphasis, chroma, and detail density.

Edge economy:
- distribution of hard, soft, lost, and broken edges.

Chroma hierarchy:
- saturation distribution and whether color supports structure.

Atmosphere:
- air, depth, and simplification.

Watercolor handling:
- freshness, transparency, wash unity, glazing, paper fatigue, overworking.

Intervention priority:
- first structural correction, second supporting correction, optional refinement.

Intervention scope:
- local, regional, compositional, global-study.

Repaint guidance:
- practical repaint workflow and repaintability level.

Teaching point:
- transferable lesson and guiding question.

---

## Source Boundary: Prompt Primitives

Prompt primitives are reusable instruction modules for AI-assisted critique and correction workflows.

The emphasis is:
- painter education,
- structural clarity,
- controlled intervention.

### Value Structure Primitives

Shadow mass simplification:
- reconnect fragmented shadow structures,
- reduce tonal fragmentation,
- simplify into dominant masses,
- preserve focal hierarchy.

Midtone compression:
- compress secondary midtones,
- quiet background contrast,
- subordinate nonessential passages.

### Edge Economy Primitives

Edge reduction:
- soften secondary edges,
- lose background contours,
- preserve only focal sharpness.

Lost-and-found edge enhancement:
- dissolve selected contours,
- merge adjacent passages,
- preserve selective edge accents.

### Chroma Hierarchy Primitives

Secondary chroma reduction:
- mute nonessential chroma,
- introduce atmospheric greys,
- preserve strongest saturation near focal area.

Atmospheric cooling:
- cool distant passages,
- reduce distant contrast,
- soften atmospheric transitions.

### Simplification Primitives

Detail suppression:
- simplify secondary detail,
- merge repetitive marks,
- reduce descriptive noise.

Floral simplification:
- group petals into masses,
- simplify floral structure,
- preserve only selective accents.

### Composition Primitives

Corner quieting:
- soften corner activity,
- reduce edge contrast near borders,
- simplify peripheral detail.

Focal reinforcement:
- deepen focal contrast,
- sharpen focal transitions,
- reduce competition elsewhere.

### Watercolor Primitives

Freshness preservation:
- preserve wash transparency,
- avoid over-rendering,
- maintain soft transitions,
- protect paper luminosity.

Wash unification:
- unify connected passages,
- simplify wash transitions,
- reduce unnecessary interruptions.

### AI-Assisted Correction Doctrine

Controlled intervention:
- isolate weak regions,
- preserve successful passages,
- apply selective corrections only.

Demonstration over replacement:
- demonstrate alternatives,
- clarify structural issues,
- support repaint planning.

---

## Source Boundary: Edit Request Schema

The edit request schema defines the conceptual bridge between a critique and a controlled correction demonstration.

It is not implementation code. It clarifies what an edit request must include so correction remains:
- traceable to critique,
- selective,
- interpretable,
- painter-centered,
- useful for repaint learning.

Core doctrine:
> Demonstrate one limited visual correction that helps the painter understand a specific critique.

If the critique is not specific enough to guide a controlled demonstration, it should return to repaint guidance rather than become an edit request.

### Conceptual Shape

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

### Valid Edit Request Qualities

A valid edit request is:
- linked to one critique issue,
- limited in scope,
- phrased in painterly terms,
- clear about what to preserve,
- clear about what to avoid,
- evaluable through side-by-side comparison.

Invalid signals:
- asks for general improvement,
- combines several unrelated issues,
- changes the subject or drawing unnecessarily,
- introduces detail or finish,
- hides the original painter's decision-making,
- cannot explain what the painter should learn.

---

## Source Boundary: Intervention Scope Framework

Intervention scope defines how broad a correction or demonstration may be.

Core doctrine:
> Intervention scope should be no larger than the visual problem requires.

A useful intervention is:
- limited,
- interpretable,
- traceable to a critique,
- respectful of successful passages,
- safe for repaint learning.

### Scope Classes

Local:
- affects a small passage or specific visual incident.
- examples: one hard edge, a small chroma distraction, a tangent, a local dark accent.

Regional:
- affects a connected passage or visual family.
- examples: background area, shadow family, flower cluster, roofline, tree mass.

Compositional:
- affects overall read or attention path while preserving subject.
- examples: focal hierarchy, corner noise, dominant value mass, major movement.

Global study:
- creates a study or comparison artifact rather than a finished correction.
- examples: value-only study, Notan, tonal mask, simplified repaint plan.

### Prohibited Behaviors

Do not use an intervention to:
- improve everything,
- add decorative detail,
- finish unresolved areas,
- replace the painter's drawing,
- imitate a named artist's surface style,
- introduce new subject matter,
- remove ambiguity that is already working,
- make watercolor passages look digitally polished.

### Escalation Rules

Local to regional:
- escalate when the same problem repeats across a connected passage.

Regional to compositional:
- escalate when a passage affects the whole eye path or focal hierarchy.

Compositional to global study:
- escalate only when the problem cannot be clarified by a selective correction.

### Interpretability Doctrine

After an intervention, the painter should be able to say:
- what changed,
- why it changed,
- what stayed untouched,
- what lesson should carry into the repaint.

If the painter cannot identify the lesson, the intervention was too broad, too decorative, or insufficiently tied to critique.

---

## UX Implications for Gemini

Please evaluate:
- how much of the schema should be visible to painters,
- whether critique types should be surfaced explicitly,
- how intervention scope should be represented,
- whether selected primitives should be user-facing or hidden,
- how to present "what will be preserved",
- when an edit request should be denied in favor of repaint guidance,
- and how to avoid making the workflow feel like prompt engineering.
