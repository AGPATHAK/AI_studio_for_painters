# AI Painter Studio — Design Philosophy

## 1. Purpose

This project exists to build an AI-assisted visual exploration tool for painters.

It is explicitly **not** an image generator in the conventional sense.

Its purpose is to support:

- visual interpretation
- compositional decision-making
- value structure understanding
- guided repaint workflows

The system acts as a **studio assistant**, not a creator.

---

## 2. Relationship with Painter’s Reference Lab (PRL)

This project is intentionally **separate** from Painter’s Reference Lab.

### PRL
- deterministic
- local-first
- fast and predictable
- structured pipeline (grayscale, notan, masks, outline)
- a *thinking tool*

### AI Painter Studio
- probabilistic
- interpretive
- exploratory
- iteration-driven
- a *visual reasoning and experimentation tool*

### Design Principle

> Do not mix deterministic and probabilistic systems in the same tool.

Separation preserves:
- clarity of purpose
- reliability of PRL
- freedom to experiment in AI system

---

## 3. Core Philosophy

### 3.1 AI as a Teaching Instrument

The system must help the painter **see better**, not replace decision-making.

It should:
- suggest alternatives
- expose structural weaknesses
- demonstrate corrections

It should not:
- produce “finished art” as an endpoint
- encourage passive consumption

---

### 3.2 Critique → Correction → Repaint Loop

This is the central workflow.

1. Upload painting or reference
2. Diagnose issues
3. Apply targeted corrections
4. Generate revised version
5. User repaints based on insight

> The output is not the goal.  
> The **learning from the output** is the goal.

---

### 3.3 Controlled Intervention

Edits must be:

- selective (region-specific where possible)
- interpretable (user understands what changed)
- reversible (iteration-friendly)

Avoid:
- global opaque transformations
- “black box” outputs without explanation

---

### 3.4 Painterly Abstraction over Photorealism

The system prioritizes:

- value grouping (Notan thinking)
- edge control (lost and found)
- shape simplification
- chroma hierarchy

Not priorities:
- hyper-detail
- photoreal rendering
- texture synthesis for its own sake

---

### 3.5 Multiple Valid Interpretations

The system should encourage:

- alternate compositions
- value reinterpretations
- stylistic variations

There is no single “correct” answer.

---

## 4. Functional Orientation

### 4.1 Core Features (MVP Direction)

- Structured critique of image
- Targeted visual edits:
  - value simplification
  - shadow mass correction
  - chroma control
  - edge hierarchy
- Style-informed transformations (painterly, not decorative)
- Variation generation (controlled diversity)

---

### 4.2 Secondary Features (Later)

- A/B comparison views
- Version history
- Crop exploration
- Light direction experiments
- Composition alternatives

---

## 5. User Experience Philosophy

### 5.1 Iterative, Not Linear

The workflow is not a fixed pipeline.

Users should:
- try → compare → refine → repeat

---

### 5.2 Minimal but Expressive UI

Avoid:
- clutter
- excessive controls
- parameter overload

Prefer:
- intent-driven interactions
- clear visual outcomes

---

### 5.3 Visual First, Text Second

Outputs must prioritize:
- visual clarity
- side-by-side comparison
- direct perceptual insight

Text supports understanding, but does not dominate.

---

## 6. Integration Strategy with PRL

Integration is **loose, not tight**.

Allowed:
- export image from PRL → use here
- export AI result → use as reference in PRL

Avoid:
- shared runtime
- shared UI
- interdependent state

---

## 7. Technical Direction (High-Level)

### Phase 1
- API-based image editing (external models)

### Phase 2 (optional)
- local model experimentation

### Phase 3 (optional)
- hybrid workflows

Key constraint:
> Do not compromise usability for technical ambition.

---

## 8. Anti-Goals

This system should NOT become:

- a generic AI art generator
- a Midjourney-style prompt playground
- a feature-heavy image editor
- a replacement for painting practice

---

## 9. Guiding Heuristic

When in doubt, ask:

> “Does this help the painter see and decide better?”

If not, it does not belong.

---

## 10. One-Line Definition

AI Painter Studio is:

> A visual reasoning system that helps painters explore, diagnose, and refine their artistic decisions through AI-assisted transformations.