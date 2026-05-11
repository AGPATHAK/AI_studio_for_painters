# AI Painter Studio — Development Roadmap (Draft v0.2)

## 0. Purpose of This Document
This roadmap operationalizes the design philosophy into an executable plan.

This version explicitly addresses:
- critique → edit linkage
- iteration-first UX
- session state timing
- repaint workflow completion

This is still a pre-implementation document.

---

## 1. Definition of v1 (Shippable Loop)

A working system is considered v1-ready when it supports:

1. Upload image
2. Generate structured critique
3. Apply ONE controlled transformation (value simplification)
4. View before/after side-by-side
5. Export as painting reference

---

## 2. Critique → Edit Contract

The critique engine must produce structured output:

- issue_type (value / edges / composition / chroma)
- region
- suggested_action
- priority

Example:

{
  "issue_type": "value_structure",
  "region": "tree mass center-left",
  "suggested_action": "merge midtones into single shadow mass",
  "priority": "high"
}

---

## 3. Development Principles

- Iteration requires comparison
- Critique drives edit
- State before iteration

---

## 4. Milestones

### M0 — Project Setup

### M1 — Input + Display

### M2a — Critique Design Phase
- Design prompts
- Validate usefulness

### M2 — Critique Engine
- Structured critique output

### M2.5 — Critique → Edit Bridge
- Map critique to edit

### M3 — First Edit + State
- Value simplification
- Basic history

### M4 — Comparison UX
- Side-by-side comparison

### M5 — Repaint Support
- Export reference sheets

### M6 — Variations
- Generate and compare variations

### M7 — Style Transformations
- Painterly transformations

### M8 — Extended State

### M9 — Masking (Post-v1)

### M10 — PRL Interoperability

---

## 5. Anti-Drift Guardrails

Reject features that:
- create pretty outputs without insight
- add UI clutter
- break critique-edit linkage

---

## 6. Open Questions

- Should critique auto-trigger edits?
- How much user control is needed?
- How to measure painter usefulness?

---

## 7. Next Step

Critique this roadmap before implementation.
