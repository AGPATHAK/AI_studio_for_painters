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

## System Philosophy Snapshot

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

The refined architecture separates four critique modes:
- diagnostic critique: identifies what is happening visually.
- teaching critique: explains why the issue matters.
- prescriptive critique: tells the painter what to try next.
- demonstrative critique: shows a controlled alternative for comparison.

Please evaluate whether these modes should appear as separate surfaces, progressive layers, tabs, cards, overlays, or some other interaction pattern.

---

## Current Workflow Model

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

- What should the painter see first after requesting critique?
- Should the first surface be a summary, priority list, annotated image, value map, or side-by-side view?
- How should diagnostic, teaching, prescriptive, and demonstrative critique unfold over time?
- What should be visible by default, and what should be progressive disclosure?

### 2. Repaint Handoff UX

- How should the system hand off from critique to manual repaint?
- What form should repaint guidance take: checklist, sequence, visual map, overlay, small study, or comparison panel?
- How can the interface encourage the painter to repaint instead of repeatedly requesting AI corrections?
- What should the final "next action" feel like?

### 3. Workflow-Selection Clarity

- How should the system decide between written critique, overlay, value map, variant, or controlled edit?
- Should workflow selection be automatic, painter-chosen, or a guided recommendation?
- How should failure modes map to the cleanest teaching artifact?
- When should the system refuse to create an edit and recommend repaint planning instead?

### 4. Intervention Scope Visibility

- How should local, regional, compositional, and global-study scope be communicated?
- Should scope be represented visually on the image?
- Should the painter approve scope before a controlled demonstration?
- How can the system show what will be preserved?

### 5. Cognitive Overload Risks

- Which workflows are cognitively clean?
- Which workflows are overloaded?
- Which combinations should not be shown together?
- Where does the system risk showing too many possible improvements?

Please pay special attention to painter attention: the user should not have to manage the system more than they are learning from the painting.

### 6. Comparison-System Design

Please critique sequencing and display for:
- original vs critique overlay,
- original vs value map,
- original vs controlled correction,
- original vs variant,
- value-only vs color view,
- before/after/detail crops.

Which comparisons should be side-by-side, toggles, overlays, or hidden until requested?

### 7. Painter Agency Preservation

- Where should the painter choose?
- Where should the system recommend?
- Where should the system stay quiet?
- How can the system prevent passive acceptance of AI corrections?

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

- How can the workflow avoid becoming endless AI correction?
- How many demonstrations should be allowed before repaint guidance becomes primary?
- Should the system include "repaint now" moments?
- How should AI output be framed as study material, not a finished endpoint?

---

## Specific Requested Output

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
