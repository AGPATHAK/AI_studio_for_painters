# AI Painter Studio — Development Roadmap (Draft v0.1)

## 0. Purpose of This Document

This roadmap translates the design philosophy into an executable development plan.

It is intentionally:
- staged
- critique-friendly
- minimal in assumptions
- aligned with solo AI-assisted workflow (ChatGPT + Codex)

This is NOT final.  
It is meant to be reviewed, challenged, and refined before implementation.

---

## 1. Product Definition (Operational)

AI Painter Studio is a **visual reasoning tool for painters**, not a generator.

Primary job:
→ Help user **see better and repaint better**

Core loop:
1. Input (photo or painting)
2. Diagnosis (structured critique)
3. Controlled transformation
4. Visual comparison
5. Repaint by user

---

## 2. Development Principles

### 2.1 Separation from PRL (Non-Negotiable)
- No shared runtime
- No shared UI
- Only image-level interoperability

### 2.2 Intervention > Generation
- Every feature must answer:
  → “What decision does this help the painter make?”

### 2.3 Controlled Edits Only
- Region-specific preferred
- Parameter-light
- Reversible / comparable

### 2.4 Visual Output Priority
- Side-by-side comparisons mandatory
- Text = supporting layer only

---

## 3. System Architecture (v0 Direction)

### 3.1 High-Level Modules

1. Input Layer
   - image upload
   - basic normalization

2. Critique Engine (LLM-based)
   - structured critique generation
   - domain-specific prompts (value, edges, composition)

3. Edit Engine (Image Model API)
   - targeted transformations via prompts + masks
   - version generation

4. Comparison Layer
   - side-by-side views
   - iteration tracking (lightweight)

5. Session State
   - local (browser storage or lightweight backend)
   - no heavy DB initially

---

## 4. Milestone Plan

---

## M0 — Project Setup (1–2 days)

### Goals
- Repo initialization
- Workflow alignment (ChatGPT ↔ Codex)
- Minimal scaffold

### Deliverables
- repo structure
- README.md
- roadmap.md (this file)
- decisions.md

### Non-Goals
- no UI
- no API integration

---

## M1 — Input + Display Baseline (3–5 days)

### Goals
- Load image
- Display reliably
- Prepare for transformations

### Features
- upload image
- canvas display (responsive)
- basic reset

### Deliverables
- working web UI (minimal)
- stable image handling

### Risks
- over-designing UI early

---

## M2 — Structured Critique Engine (5–7 days)

### Goals
- Generate **useful painter critique**
- Not generic AI commentary

### Features
- prompt templates:
  - value structure
  - edge control
  - composition
- structured output (sections, not paragraphs)

### Deliverables
- critique panel
- reusable prompt system

### Key Constraint
- critique must be **actionable**

---

## M3 — First Controlled Edit (Core Breakthrough) (7–10 days)

### Goals
- Implement ONE high-quality transformation

### Candidate (pick ONE only):
- value simplification (Notan-like)
OR
- shadow mass correction
OR
- edge simplification

### Features
- prompt-driven edit
- optional mask (if supported)
- before/after comparison

### Deliverables
- first "critique → correction" loop

### Critical Success Metric
→ User says: “Yes, this helps me repaint better”

---

## M4 — Iteration & Variations (5–8 days)

### Goals
- Enable exploration, not just single output

### Features
- generate 2–3 variations
- simple version selector
- retain original always

### Deliverables
- variation workflow

### Risks
- drifting into “image generator mode”

---

## M5 — Comparison UX (High Value) (5–7 days)

### Goals
- Make visual judgment easier

### Features
- side-by-side layout
- toggle views
- optional grid overlay (borrow conceptually from PRL, not code)

### Deliverables
- painter-friendly comparison

---

## M6 — Targeted Edits (Advanced Control) (7–12 days)

### Goals
- Introduce **localized control**

### Features
- region selection (brush / box)
- apply edit only to region

### Deliverables
- first “controlled intervention” system

### Risks
- UI complexity explosion

---

## M7 — Style-Constrained Transformations (Optional) (7–10 days)

### Goals
- painterly reinterpretations (not decorative)

### Examples
- Wesson-like simplification
- high-key grouping
- muted chroma version

### Constraint
- must preserve structure, not hallucinate

---

## M8 — Session & Version Tracking (Lightweight) (3–5 days)

### Goals
- support iterative workflow

### Features
- history stack
- label versions
- quick revert

---

## M9 — PRL Interoperability (Optional but Strategic) (3–5 days)

### Goals
- loose integration

### Features
- export image for PRL
- import PRL output

---

## 5. Technical Strategy

### Phase 1
- API-based models (fastest path)

### Phase 2 (optional)
- evaluate local models

### Phase 3 (optional)
- hybrid workflows

---

## 6. Anti-Drift Guardrails

Reject features that:
- increase prompt complexity without visual clarity
- produce “pretty images” but no learning value
- add UI clutter without decision support

---

## 7. Open Questions (For Critique)

1. Should critique precede *every* edit?
2. How strict should "controlled edits only" be?
3. Is variation generation necessary early?
4. Should masking be delayed further?
5. How do we define “success” in user terms?

---

## 8. Immediate Next Step

→ Critique this roadmap

Focus areas:
- milestone ordering
- missing risks
- over/under scoping
- alignment with philosophy