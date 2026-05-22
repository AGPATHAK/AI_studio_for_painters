# Claude Architecture Review Package

## Purpose

This package is for an external architecture review of AI Painter Studio.

The requested review focus is:
- philosophy,
- architecture,
- workflow coherence,
- pedagogy,
- future scaling risks,
- and readiness for structured AI-assisted critique.

Please avoid implementation-level code review unless a design choice clearly creates conceptual, product, or workflow risk.

---

## A. Executive Summary

AI Painter Studio is a painter-centered critique and correction environment. Its purpose is to help painters see better, simplify better, and make stronger repaint decisions. It is not intended to generate finished paintings automatically.

The app currently has a static PWA baseline: image upload, display, reset, theme persistence, service worker caching, and installability. The next planned stages add structured critique, a critique-to-edit bridge, and one controlled edit type: value simplification with shadow-mass correction.

AI Painter Studio is related to Painter's Reference Lab (PRL), but it has a different role. PRL is the deterministic analysis companion: grayscale studies, Notans, tonal masks, contour references, and compositional overlays. AI Painter Studio adds interpretive critique, controlled correction demonstrations, and repaint guidance. PRL should support structural seeing; AI Painter Studio should support visual reasoning and painterly decision-making.

The current project stage is conceptual and architectural stabilization. The knowledge base has been normalized, a glossary has been created, and a conceptual critique schema now exists. Implementation should follow this philosophy rather than replacing it.

The central doctrine is:
1. upload a painting,
2. diagnose structural problems,
3. demonstrate selective corrections,
4. compare alternatives,
5. repaint manually.

The repaint is not a fallback. It is the educational center of the system.

---

## B. System Philosophy

### Painter-Centered AI

AI acts as:
- diagnostic assistant,
- correction simulator,
- visual reasoning partner,
- and experimentation tool.

AI should not act as:
- replacement painter,
- one-click art generator,
- decorative filter,
- or generic image enhancer.

The guiding question is:
> Does this help the painter see and decide better?

### Selective Intervention

The system favors local, interpretable, visually explainable corrections over global transformations.

The correct unit of action is usually:
- a weak region,
- a structural issue,
- and the minimum useful intervention.

This keeps correction tied to learning. It also reduces the risk that AI edits become unrelated beautification.

### Painterliness over Photorealism

The system favors:
- abstraction,
- simplification,
- atmosphere,
- shape economy,
- edge economy,
- and visual authority through selection.

It avoids:
- literal copying,
- exhaustive detail,
- photographic rendering,
- style imitation as a goal.

Painterliness is not looseness for its own sake. It depends on stronger visual choices, not lower standards.

### Value-First Reasoning

The critique doctrine prioritizes:
1. shape design,
2. value structure,
3. edge economy,
4. atmospheric coherence,
5. color orchestration,
6. detail.

Value grouping, dominant masses, shadow architecture, and focal hierarchy are treated as foundational. Color and detail are important, but they should not outrun value structure.

### Multimodal Critique Philosophy

Multimodal outputs should teach by showing:
- value maps,
- simplified studies,
- selective correction demonstrations,
- edge economy overlays,
- side-by-side comparisons,
- and repaint planning views.

Corrections are teaching artifacts, not final works.

---

## C. Current Knowledge Architecture

### Core Philosophy

[painting_critique_philosophy.md](../knowledge-base/painting_critique_philosophy.md) defines the purpose of critique, the role of AI, anti-goals, painterliness over photorealism, and the critique -> correction -> repaint loop.

### Vocabulary and Schema

[glossary.md](../knowledge-base/glossary.md) stabilizes project terms such as value grouping, focal hierarchy, edge economy, chroma hierarchy, atmospheric simplification, selective intervention, repaint workflow, tonal cohesion, shadow architecture, and visual noise.

[critique_schema.md](../knowledge-base/critique_schema.md) defines a human-readable structure for future critique outputs. It covers overall read, design, value structure, focal hierarchy, edge economy, chroma hierarchy, atmosphere, watercolor handling, intervention priority, repaint guidance, and teaching point.

### Visual Reasoning

[visual_heuristics.md](../knowledge-base/visual_heuristics.md) turns doctrine into recurring visual checks: distance read, dominant masses, shadow merging, edge economy, focal hierarchy, chroma hierarchy, simplification, and AI-assisted critique boundaries.

[common_failure_modes.md](../knowledge-base/common_failure_modes.md) organizes recurring weaknesses: fragmented value structure, weak focal contrast, too many hard edges, edge equality, tangent clutter, corner noise, excessive chroma, detail addiction, overworking, flat depth, overdescribed petals, broken shadow architecture, and excessive structural precision.

### Critique Language and Prompting

[critique_patterns.md](../knowledge-base/critique_patterns.md) captures preferred diagnostic language, intervention phrasing, repaint guidance, and guiding questions.

[prompt_primitives.md](../knowledge-base/prompt_primitives.md) turns visual principles into reusable AI-assisted instruction modules, such as shadow mass simplification, midtone compression, edge reduction, secondary chroma reduction, corner quieting, focal reinforcement, freshness preservation, and controlled intervention.

### Medium and Influence

[watercolor_specific_doctrine.md](../knowledge-base/watercolor_specific_doctrine.md) constrains critique for watercolor: freshness, transparency, paper integrity, edge sensitivity, glazing, wash unity, and repainting fresh rather than patching endlessly.

[artist_influences.md](../knowledge-base/artist_influences.md) documents influences from Edward Wesson, Edward Seago, line-and-wash traditions, restrained palettes, and atmospheric simplification. These are principle sources, not imitation targets.

### Workflows

[multimodal_workflows.md](../knowledge-base/multimodal_workflows.md) defines the major AI-assisted critique workflows: value-only analysis, Notan and tonal masks, overlays, side-by-side comparisons, variant exploration, region-specific edit logic, and repaint planning.

[knowledge_base_plan.md](../knowledge-base/knowledge_base_plan.md) maps the full knowledge architecture and future direction.

---

## D. Current Intended Workflow

The intended user flow is:

1. Upload a painting.
2. Diagnose structural issues.
3. Compare the original against selective critique artifacts.
4. Correct only the chosen weakness, when correction helps clarify the lesson.
5. Repaint manually using the insight.

In milestone terms:
- M1 is complete: static PWA input and display baseline.
- M2a is planned: locked prompt set, critique schema, validation image set, instructor voice, and validation protocol.
- M2 is planned: app-integrated critique engine using the locked schema and prompts.
- M2.5 is planned: bridge one critique item into a concrete edit request.
- M3 is planned: first controlled edit, limited to value simplification and shadow-mass correction.

The workflow should remain critique-led and repaint-led. Image edits should demonstrate visual decisions, not replace the painter's act of painting.

---

## E. Key Architectural Decisions

### Deterministic vs Probabilistic Separation

PRL handles deterministic visual analysis: grayscale, Notan, tonal masks, contour references, and overlays.

AI Painter Studio handles probabilistic interpretation: critique, controlled correction, comparison, and repaint guidance.

Review concern:
- Is this separation strong enough, or should boundaries be made more explicit before workflows overlap?

### Local App Shell vs AI Workflows

The app is a static PWA with no build step and no backend. User images are held in memory. API key handling is browser-local and user-provided.

Review concern:
- Does this remain coherent as critique validation, edit requests, and image edit history become more complex?

### Selective Edits over Global Transformations

The planned edit workflow maps a single critique issue to a single controlled edit request. Global enhancement is discouraged.

Review concern:
- Does the current architecture protect against drift from "teach this issue" into "make the painting better"?

### Educational Focus over Image Generation

The app's value is not finished output. Its value is diagnostic clarity, comparison, and repaint learning.

Review concern:
- Are future milestones likely to preserve this educational center, or will image generation pressure distort the product?

### Schema as Pedagogical Structure

The critique schema is conceptual and human-readable. It should support future structured outputs without becoming software-first or brittle.

Review concern:
- Is the schema sufficiently structured for retrieval and evaluation while still preserving painterly nuance?

---

## F. Explicit Questions for Claude

Please critique the project along these dimensions:

1. Conceptual gaps:
   - What core painting concepts are missing or underdeveloped?
   - Are any concepts overrepresented relative to their importance?

2. Scaling risks:
   - What will become fragile as the system moves from documents to prompts to app workflows?
   - Where might the critique/edit loop fail at scale?

3. Over-engineering risks:
   - Is the schema too broad, too narrow, or too premature?
   - Are there abstractions that should be deferred until actual critique outputs exist?

4. Workflow coherence:
   - Does upload -> diagnose -> compare -> correct -> repaint form a coherent learning loop?
   - Is the critique-to-edit bridge conceptually sound?
   - Should "compare" happen before correction, after correction, or in both places?

5. UX philosophy:
   - How should the interface keep the painter in control?
   - What UI patterns would reinforce learning instead of passive acceptance?
   - What should be deliberately absent from the interface?

6. Retrieval / RAG readiness:
   - Are the glossary, schema, heuristics, failure modes, and prompt primitives organized well enough for later retrieval?
   - What metadata or document boundaries would help without overcomplicating the knowledge base?

7. Multimodal reasoning architecture:
   - How should deterministic PRL outputs and AI Painter Studio critiques be combined?
   - Should PRL analysis be visible to the AI model, the painter, or both?
   - What risks arise when image edits are generated from natural-language critique regions?

8. Missing abstractions:
   - Is there a missing middle layer between critique schema and edit request?
   - Should "repaint guidance" be separate from "AI correction guidance"?
   - Should medium-specific doctrine be modeled separately for watercolor, oil, gouache, etc.?

9. Long-term maintainability:
   - How should prompt versions, critique schema versions, examples, and validation results be kept coherent?
   - What should be locked before M2 implementation begins?
   - What should remain flexible until real painter testing?

10. Philosophical drift:
   - Where is the project most likely to drift into generic AI-art language?
   - What safeguards would keep the project painter-centered over time?

---

## G. Files To Review

### Priority 1: Orientation and Doctrine

1. [painting_critique_philosophy.md](../knowledge-base/painting_critique_philosophy.md)
2. [knowledge_base_plan.md](../knowledge-base/knowledge_base_plan.md)
3. [glossary.md](../knowledge-base/glossary.md)
4. [critique_schema.md](../knowledge-base/critique_schema.md)

### Priority 2: Visual Reasoning and Diagnostics

5. [visual_heuristics.md](../knowledge-base/visual_heuristics.md)
6. [common_failure_modes.md](../knowledge-base/common_failure_modes.md)
7. [critique_patterns.md](../knowledge-base/critique_patterns.md)
8. [prompt_primitives.md](../knowledge-base/prompt_primitives.md)

### Priority 3: Medium, Influence, and Workflow

9. [multimodal_workflows.md](../knowledge-base/multimodal_workflows.md)
10. [watercolor_specific_doctrine.md](../knowledge-base/watercolor_specific_doctrine.md)
11. [artist_influences.md](../knowledge-base/artist_influences.md)

### Priority 4: Milestone Context

12. [002-m1-input-display.md](../issues/002-m1-input-display.md)
13. [003-m2a-critique-design.md](../issues/003-m2a-critique-design.md)
14. [004-m2-critique-engine.md](../issues/004-m2-critique-engine.md)
15. [005-m2-5-critique-edit-bridge.md](../issues/005-m2-5-critique-edit-bridge.md)
16. [006-m3-value-simplification.md](../issues/006-m3-value-simplification.md)

### Optional Historical Context

17. [001-m0-repo-setup.md](../issues/001-m0-repo-setup.md)
18. [issue_004_knowledge_base_normalization.md](../issues/issue_004_knowledge_base_normalization.md)
19. [issue_005_glossary_and_schema.md](../issues/issue_005_glossary_and_schema.md)

---

## Suggested Reading Order

For the fastest deep review:

1. Read the executive summary in this package.
2. Read [painting_critique_philosophy.md](../knowledge-base/painting_critique_philosophy.md).
3. Read [glossary.md](../knowledge-base/glossary.md) and [critique_schema.md](../knowledge-base/critique_schema.md).
4. Skim [visual_heuristics.md](../knowledge-base/visual_heuristics.md), [common_failure_modes.md](../knowledge-base/common_failure_modes.md), and [prompt_primitives.md](../knowledge-base/prompt_primitives.md).
5. Read [multimodal_workflows.md](../knowledge-base/multimodal_workflows.md).
6. Read issues 003 through 006 to evaluate whether the planned milestones preserve the philosophy.

---

## Desired Output From Claude

Please return:
- top architectural strengths,
- top conceptual risks,
- missing or weak concepts,
- workflow coherence critique,
- schema and retrieval readiness critique,
- milestone sequencing concerns,
- recommended changes before M2,
- recommended changes to defer until after real critique examples exist.
