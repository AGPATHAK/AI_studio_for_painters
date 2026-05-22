# Gemini Multimodal Workflow Review Package

## Purpose

This package requests a focused multimodal workflow and UX critique of AI Painter Studio.

Gemini should evaluate how the system can present critique, comparison, correction demonstrations, and repaint guidance without overwhelming the painter or weakening painter agency.

This is not a code review. It is not a backend architecture review. It is a critique of workflow, interaction sequencing, attention management, and multimodal teaching surfaces.

---

## Executive Summary

AI Painter Studio is a painter-centered educational critique system. It helps painters diagnose visual weaknesses, compare selective corrections, and repaint manually with clearer judgment.

The system rejects generic AI-art generation workflows. Its purpose is not to produce finished images, imitate named styles, beautify uploads, or encourage one-click improvement. AI should act as a visual reasoning partner and correction simulator, not as a replacement painter.

The core doctrine is:
1. upload painting,
2. diagnose structural issues,
3. select the appropriate teaching workflow,
4. compare critique artifacts or controlled demonstrations,
5. repaint manually.

The repaint is the center of learning. Corrections are teaching artifacts.

---

## Review Focus

Please focus on:
- critique surface sequencing,
- repaint handoff UX,
- workflow-selection clarity,
- intervention scope visibility,
- cognitive overload risks,
- comparison-system design,
- painter agency preservation,
- tablet and iPad interaction patterns,
- multimodal teaching workflows,
- and avoiding AI improvement addiction.

"AI improvement addiction" means the user keeps asking the system for more polished outputs instead of learning what to repaint and why.

---

## System Philosophy

### Painter-Centered AI

AI should help the painter:
- see value structure,
- understand focal hierarchy,
- recognize edge economy problems,
- control chroma hierarchy,
- preserve atmosphere,
- and plan a stronger repaint.

AI should not:
- replace the painter,
- produce a finished artwork,
- auto-enhance the whole image,
- imitate artist surface style,
- or hide the painter's original decisions.

### Critique Types

The refined architecture separates four critique modes:

- diagnostic critique: identifies what is happening visually.
- teaching critique: explains why the issue matters.
- prescriptive critique: tells the painter what to try next.
- demonstrative critique: shows a controlled alternative for comparison.

Please evaluate whether these modes should appear as separate surfaces, progressive layers, tabs, cards, overlays, or some other interaction pattern.

### Selective Intervention

The system favors local, interpretable correction demonstrations over broad transformations.

Intervention scope classes:
- local: a small passage or visual incident,
- regional: a connected passage or visual family,
- compositional: a whole-painting attention or hierarchy issue,
- global study: a teaching artifact such as a value map, Notan, or simplified repaint plan.

Please evaluate how scope should be made visible to painters without adding cognitive burden.

### Repaintability

Critique is successful when the painter knows:
- what is weakening the painting,
- why it matters,
- what to try first,
- what to preserve,
- what to simplify,
- and how to judge the next attempt.

Repaintability is more important than polished AI output.

---

## Current Workflow Model

The intended workflow is:

```text
upload -> diagnose -> select workflow -> compare -> controlled demonstration when useful -> repaint manually
```

Possible workflow artifacts include:
- written critique,
- priority list,
- region callouts,
- overlays,
- value-only studies,
- Notan or tonal masks,
- side-by-side comparisons,
- controlled edit demonstrations,
- variant comparisons,
- repaint planning notes.

The main UX risk is that all of these surfaces may compete for attention.

---

## Key UX Questions

### 1. Critique Surface Sequencing

Please critique:
- What should the painter see first after requesting critique?
- Should the first surface be a summary, priority list, annotated image, value map, or side-by-side view?
- How should diagnostic, teaching, prescriptive, and demonstrative critique unfold over time?
- What should be visible by default, and what should be progressive disclosure?

### 2. Repaint Handoff UX

Please critique:
- How should the system hand off from critique to manual repaint?
- What form should repaint guidance take: checklist, sequence, visual map, overlay, small study, or comparison panel?
- How can the interface encourage the painter to repaint instead of repeatedly requesting AI corrections?
- What should the final "next action" feel like?

### 3. Workflow-Selection Clarity

Please critique:
- How should the system decide between written critique, overlay, value map, variant, or controlled edit?
- Should workflow selection be automatic, painter-chosen, or a guided recommendation?
- How should failure modes map to the cleanest teaching artifact?
- When should the system refuse to create an edit and recommend repaint planning instead?

### 4. Intervention Scope Visibility

Please critique:
- How should local, regional, compositional, and global-study scope be communicated?
- Should scope be represented visually on the image?
- Should the painter approve scope before a controlled demonstration?
- How can the system show what will be preserved?

### 5. Cognitive Overload Risks

Please identify:
- which workflows are cognitively clean,
- which workflows are overloaded,
- which combinations should not be shown together,
- and where the system risks showing too many possible improvements.

Please pay special attention to painter attention: the user should not have to manage the system more than they are learning from the painting.

### 6. Comparison-System Design

Please critique sequencing and display for:
- original vs critique overlay,
- original vs value map,
- original vs controlled correction,
- original vs variant,
- value-only vs color view,
- before/after/detail crops.

Questions:
- Which comparisons should be side-by-side?
- Which should be toggles?
- Which should be overlays?
- Which should be hidden unless requested?

### 7. Painter Agency Preservation

Please critique:
- where the painter should choose,
- where the system should recommend,
- where the system should stay quiet,
- and how to prevent passive acceptance of AI corrections.

The painter should remain responsible for visual judgment.

### 8. Tablet and iPad Interaction Patterns

Please critique for touch-first use:
- critique rail vs bottom sheet,
- image-first layout,
- pinch/zoom and pan behavior,
- overlay opacity controls,
- before/after toggles,
- stylus-friendly region review,
- limited text density,
- and switching between full image and detail crops.

Avoid assuming a desktop-only workflow.

### 9. Multimodal Teaching Workflows

Please critique how to sequence:
- text diagnosis,
- image annotations,
- value maps,
- edge overlays,
- chroma notes,
- controlled demonstrations,
- and repaint guidance.

Which modality should lead for each failure mode?

### 10. Avoiding AI Improvement Addiction

Please critique:
- how to stop the workflow from becoming endless AI correction,
- how many demonstrations should be allowed before repaint guidance becomes primary,
- whether the system should include "repaint now" moments,
- and how to frame AI output as study material, not a finished endpoint.

---

## Specific Review Requests

Please answer these directly:

1. Which workflow surfaces are cognitively clean?
2. Which workflow surfaces are likely overloaded?
3. How should critique surfaces be layered from first impression to detailed guidance?
4. What should remain hidden until requested?
5. How should overlays, variants, and value maps be sequenced?
6. How should repaint guidance be visualized?
7. How can the system preserve painter attention and agency?
8. What should the UX avoid at all costs?
9. What interaction patterns are best for tablet/iPad use?
10. What would you change before implementation begins?

---

## Files Included

### Core Review Files

- [README.md](README.md)
- [gemini_review_package.md](gemini_review_package.md)

### Knowledge Architecture

- [painting_critique_philosophy.md](painting_critique_philosophy.md)
- [visual_heuristics.md](visual_heuristics.md)
- [critique_schema.md](critique_schema.md)
- [glossary.md](glossary.md)
- [multimodal_workflows.md](multimodal_workflows.md)
- [critique_patterns.md](critique_patterns.md)
- [prompt_primitives.md](prompt_primitives.md)
- [common_failure_modes.md](common_failure_modes.md)
- [watercolor_specific_doctrine.md](watercolor_specific_doctrine.md)
- [artist_influences.md](artist_influences.md)

### Refinement Documents

- [repaintability_framework.md](repaintability_framework.md)
- [edit_request_schema.md](edit_request_schema.md)
- [intervention_scope_framework.md](intervention_scope_framework.md)
- [workflow_selection_logic.md](workflow_selection_logic.md)

### Architecture Context

- [knowledge_base_plan.md](knowledge_base_plan.md)

---

## Desired Output From Gemini

Please return:
- top UX/workflow strengths,
- top cognitive overload risks,
- recommended critique surface sequence,
- recommended comparison patterns,
- recommended repaint handoff pattern,
- intervention scope visibility recommendations,
- tablet/iPad interaction recommendations,
- risks of AI improvement addiction,
- and changes to make before implementation.
