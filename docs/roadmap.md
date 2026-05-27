# AI Painter Studio — Development Roadmap (Final v1.0)

---

## 0. Purpose

This roadmap operationalizes the design philosophy into an executable, critique-aligned plan.

Note: this v1 roadmap primarily describes the in-progress critique and repaint loop. The broader product roadmap is now organized around three workflows: Reference Ideation, In-Progress Guidance, and Finished Painting Review. See [Workflow-Oriented Roadmap Architecture](roadmap/workflow_architecture.md).

It incorporates:
- critique → edit linkage
- iteration-first UX
- repaint workflow completion
- structured AI reasoning
- disciplined scope control

---

## 1. Definition of v1 (Shippable Loop)

v1 is complete when the system supports:

1. Upload image
2. Generate structured critique (with reasoning)
3. Apply ONE controlled transformation (value simplification with shadow-mass understanding)
4. Manual user-triggered edit (no auto-edit)
5. Side-by-side comparison
6. Export “Reference Sheet” for repaint

---

## 2. Critique → Edit Contract (Enhanced)

The critique engine must output structured, interpretable data:

Fields:
- issue_type
- region
- suggested_action
- priority
- reasoning

Example:

{
  "issue_type": "value_structure",
  "region": "tree mass center-left",
  "suggested_action": "merge midtones into a single shadow mass",
  "priority": "high",
  "reasoning": "fragmented midtones weaken the main value grouping and reduce visual clarity"
}

---

## 3. Core Principles (Refined)

- Critique must precede edit
- User must trigger edits (no auto-execution)
- Edits must be traceable to critique
- Comparison is mandatory for evaluation
- AI acts as instructor, not creator

---

## 4. Milestone Plan (Final Sequencing)

M0 — Project Setup  
M1 — Input + Display  

M2a — Critique Design Phase (Production Specification)

Goals:
- Design painter-grade critique prompts grounded in value structure, edges, composition, and chroma
- Define and validate the "instructor voice" (rigorous, specific, non-generic, painterly)
- Produce structured outputs that are directly usable by the Edit Engine

Scope:
- Define schema (JSON): issue_type, region, suggested_action, priority, reasoning
- Create prompt templates per dimension:
  - Value structure (Notan, shadow masses, grouping)
  - Edge control (lost-and-found, focal hierarchy)
  - Composition (dominance, balance, directional flow)
  - Chroma (muting, hierarchy, focal saturation)

Validation Protocol (MANDATORY):
- Curate a fixed test set of 10–15 images (landscape, figure, still life)
- For each image, generate critique using current prompts
- Manually evaluate against criteria:
  - Non-generic (no boilerplate language)
  - Actionable (clear “what to change”)
  - Painter-aligned (uses correct visual vocabulary)
  - Prioritized (identifies the dominant issue)
- Iterate prompts until ≥80% of outputs meet criteria

Deliverables:
- Final prompt set (versioned)
- Critique schema definition
- Example library (input → critique pairs)

Success Criteria:
→ A painter can read the critique and independently attempt a correction without seeing the AI output

M2 — Critique Engine  
M2.5 — Critique → Edit Bridge  

M3 — First Controlled Edit + State (Production Specification)

Transformation (fixed for v1):
→ Value Simplification with Shadow Mass Correction

Requirements:
- Must go beyond simple posterization
- Must group values into coherent shadow/light masses
- Must reflect form and structure, not just tonal reduction

Edit Behavior:
- Region-first editing (preferred)
  - Use critique "region" field to localize edits
  - If region detection fails, fall back to global edit (explicitly logged)
- Edits must be traceable to critique (show source issue in UI)

State Management (minimal but sufficient):
- Maintain history stack:
  - original
  - last edit
  - current edit
- Allow revert to any stored state

UI Requirements:
- Show which critique item triggered the edit
- Allow user to select critique item (if multiple high-priority issues exist)

Failure Handling:
- If edit does not align with critique intent:
  - allow retry with adjusted prompt
  - expose prompt (debug mode optional)

Success Criteria:
→ User agrees that the edit reflects the critique AND improves clarity of value structure

M4 — Comparison UX  
M5 — Repaint Support (Production Specification)

Goal:
→ Complete the Critique → Correction → Repaint loop in a painter-usable form

Output Format: "Reference Sheet" (non-negotiable structure)
- Panel 1: Original image
- Panel 2: Edited image (post-correction)
- Panel 3: Difference emphasis (optional overlay highlighting changed regions)
- Panel 4: Key critique notes (short, distilled from reasoning field)

Optional Enhancements:
- Grid overlay toggle (aligned with PRL usage)
- Value map inset (if derived from edit)

Design Constraints:
- Must be printable (A4/Letter friendly layout)
- Must be readable at arm’s length (studio use)
- Minimal text; visual clarity prioritized

Purpose:
- Enable direct use at easel
- Reinforce learning by connecting critique → visual change → execution

Success Criteria:
→ User can place sheet beside canvas and execute a repaint without referring back to the app

M6 — Variations  
M7 — Style-Constrained Transformations  
M8 — Extended Session State  
M9 — Masking (Deferred)  
M10 — PRL Interoperability  

---

## 5. Anti-Drift Guardrails

Reject features that:
- create pretty outputs without insight
- add unnecessary detail or texture
- override user intent
- behave like autonomous creator
- increase UI complexity without decision support
- introduce artificial detail, texture, or "finishing" not requested by the critique (prevent beautification drift)

---

## 6. Measurement of Success

System is successful if:
→ user can repaint more effectively using output

---

## 7. Primary Bottleneck

Critique → Edit Bridge (M2.5)

---

## 8. Next Step

Lock M0–M3 and begin critique design phase.
