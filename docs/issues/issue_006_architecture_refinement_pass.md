# Issue 006 — Architecture Refinement Pass

## Purpose

Refine the conceptual architecture of AI Painter Studio based on the external Claude review.

This issue focuses on:
- operational clarity,
- workflow structure,
- critique taxonomy,
- repaint guidance architecture,
- and critique-to-edit translation logic.

This is an architecture refinement pass.

Not implementation.

Not UI polish.

Not prompt tuning.

---

# Primary Goals

## 1. Separate Critique Types

The current system overloads the term "critique."

Create explicit distinctions between:

- diagnostic critique
- teaching critique
- prescriptive critique
- demonstrative critique

Clarify:
- purpose
- structure
- output type
- and workflow role.

Update:
- critique_schema.md
- critique_patterns.md
- multimodal_workflows.md
- glossary.md

as appropriate.

---

## 2. Define Repaintability Framework

The project repeatedly emphasizes repainting,
but repaintability is not operationalized clearly.

Create a structured framework defining:

- what makes critique actionable,
- what makes guidance repaintable,
- how painters move from critique to repaint,
- and how repaint success might be evaluated.

Create:
- repaintability_framework.md

---

## 3. Create Edit Request Schema

There is currently no explicit bridge between:
- critique output
and
- operational edit instructions.

Create:
- edit_request_schema.md

The schema should define:
- critique linkage
- selected primitive
- region/scope
- interpretability requirements
- success criteria
- fallback behavior

Keep:
- human-readable,
- conceptual,
- and implementation-agnostic.

---

## 4. Define Intervention Scope Rules

Operationalize:
- selective intervention,
- local vs regional vs global edits,
- interpretability limits,
- and compositional safety.

Create:
- intervention_scope_framework.md

Include:
- scope classifications
- allowed behaviors
- prohibited behaviors
- escalation rules
- and interpretability doctrine.

---

## 5. Define Workflow Selection Logic

The project currently supports many workflow concepts:
- overlays
- value-only workflows
- repaint simulations
- comparison systems
- variants

But lacks explicit decision logic.

Create:
- workflow_selection_logic.md

Define:
- when each workflow type should be used,
- based on failure mode,
- critique type,
- medium,
- and pedagogical intent.

---

# Secondary Goals

## Optional

If appropriate:
- add cross-links,
- refine glossary entries,
- improve schema references,
- add lightweight examples.

Avoid:
- implementation details,
- UI mockups,
- prompt engineering,
- or backend speculation.

---

# Constraints

Preserve:
- painter-centered philosophy,
- pedagogical orientation,
- selective intervention doctrine,
- repaint-centered learning model,
- and watercolor sensitivity.

Avoid:
- generic AI-art framing,
- automation-centric language,
- and feature creep.

---

# Deliverables

Create:

- repaintability_framework.md
- edit_request_schema.md
- intervention_scope_framework.md
- workflow_selection_logic.md

Update existing docs where appropriate.

Provide:
- concise architecture refinement summary
- unresolved questions if any

No commit.

