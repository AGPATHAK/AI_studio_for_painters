# Issue 014 — Reference Ideation Mode (M2A)

## Purpose

Begin the first implementation of the new workflow-oriented roadmap:

M2A — Reference Ideation Mode

This mode is fundamentally different from critique mode.

The goal is NOT:
- critique,
- rescue,
- repaint guidance,
- or rating.

The goal IS:
- painterly exploration BEFORE painting begins.

This mode should help the painter:
- interpret a reference photo,
- simplify it,
- explore atmosphere,
- explore composition,
- and generate painterly possibilities.

---

# Important Philosophy

The reference photo is NOT sacred.

The purpose is not:
- photo copying,
- literal transcription,
- or photorealistic optimization.

The AI should help create:
- unique painterly interpretations,
- stronger value grouping,
- compositional clarity,
- atmospheric simplification,
- and painterly mood.

The philosophy should align with:
- Edward Wesson
- Edward Seago
- painterly restraint
- atmospheric suggestion
- edge economy
- value-first organization

---

# Scope of This Issue

This is a FIRST PROTOTYPE ONLY.

Do NOT attempt:
- full workflow completion
- multiple tabs/panels polished perfectly
- image generation systems
- advanced editing pipelines

Goal:
establish the workflow foundation.

---

# Required UX Direction

Add a lightweight workflow selector or mode selector.

At minimum:
- Reference Ideation
- In-Progress Guidance
- Finished Review

Only Reference Ideation needs meaningful behavior in this issue.

The others may remain placeholder or current behavior.

---

# Reference Ideation Prototype

Input:
- reference photograph

Output:
- AI-native painterly ideation response

The response should explore:
- compositional simplification
- dominant value masses
- atmospheric opportunities
- focal hierarchy
- painterly abstraction opportunities
- Wesson-esque simplification
- palette suggestions
- possible crop/composition variants
- mood suggestions

---

# Important Constraint

Do NOT yet implement:
- actual generated image variants
- image editing pipelines
- diffusion workflows
- server-side image generation

This issue is critique/ideation intelligence only.

Text-first ideation is acceptable initially.

---

# Prompt Direction

Gemini should behave as:
- a painterly composition mentor
- not a critic
- not an image captioner

The response should feel:
- exploratory
- suggestive
- painterly
- idea-generating

NOT:
- judgmental
- repair-oriented
- scoring-oriented

---

# UI Direction

Keep:
- image-first layout
- restrained UI
- provenance visibility

Allow the ideation response to be richer and more exploratory than critique mode.

---

# Suggested Sections

Gemini may return sections such as:
- dominant read
- strongest simplification opportunity
- compositional variation ideas
- atmosphere opportunities
- palette direction
- Wesson-esque interpretation ideas
- possible focal restructuring
- what to suppress/remove
- what to emphasize

---

# Architecture Direction

This issue begins:
- workflow-aware prompting

The prompt and AI behavior should now depend on:
- selected workflow mode.

---

# Non-Goals

Do NOT:
- redesign the entire app
- add persistence/history
- add scoring systems
- add image generation
- add multi-model orchestration
- add backend complexity

Keep architecture lightweight.

---

# Deliverables

Implement:
- lightweight workflow selector
- first Reference Ideation workflow
- workflow-aware prompting
- ideation response rendering

Provide:
- concise implementation summary
- known limitations
- no commit

