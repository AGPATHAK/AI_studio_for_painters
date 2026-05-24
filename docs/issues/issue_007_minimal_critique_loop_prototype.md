# Issue 007 — Minimal Critique Loop Prototype

## Purpose

Build the smallest believable end-to-end prototype for AI Painter Studio.

This is NOT production architecture.

This is NOT a scalable implementation.

This is a workflow validation prototype.

The goal is to validate:
- painter cognition,
- critique sequencing,
- repaint handoff,
- and selective intervention philosophy.

---

# Core Principle

The prototype must teach:
ONE major visual lesson at a time.

Avoid:
- feature accumulation,
- multiple workflows,
- settings complexity,
- and optimization behavior.

---

# Scope

Implement ONLY:

1. image upload
2. value-structure critique
3. one priority diagnosis
4. one quiet scope overlay
5. one demonstrative correction
6. repaint guidance panel

Nothing more.

---

# Workflow

The prototype flow should be:

upload
→ priority diagnosis
→ scope reveal
→ demonstrative correction
→ repaint guidance

---

# Explicit Non-Goals

Do NOT implement:
- multiple critique categories
- workflow switching
- variant galleries
- edit histories
- settings panels
- model orchestration
- API abstraction layers
- multi-medium support
- prompt management UI
- comparison galleries
- auto-enhance behavior
- persistent storage systems

Keep everything intentionally small.

---

# UI Philosophy

The painting should dominate the interface.

Requirements:
- image-first layout
- restrained UI chrome
- minimal panels
- quiet overlays
- avoid dashboard aesthetics
- avoid chat-app aesthetics

The interface should feel:
- calm,
- focused,
- and painter-centered.

---

# Prototype Outputs

## 1. Priority Diagnosis

Short and focused.

Example:
"The dominant shadow structure fragments in the mid-ground, weakening the painting’s value cohesion."

Only ONE major diagnosis.

---

## 2. Scope Reveal Overlay

A subtle overlay showing:
- where the intervention applies,
- while preserving the painting visibility.

Avoid:
- aggressive red markup
- thick annotations
- noisy indicators

The overlay should guide attention quietly.

---

## 3. Demonstrative Correction

One controlled demonstration only.

Purpose:
- teaching artifact,
not:
- finished improvement.

Keep:
- selective intervention
- local/regional scope
- interpretability

Avoid:
- global redesign
- beautification
- over-rendering

---

## 4. Repaint Guidance

Short repaint-oriented guidance:
- what to repaint first
- what to preserve
- what principle matters

Keep concise.

---

# Technical Direction

Keep implementation lightweight.

Allowed:
- mock/semi-manual critique logic
- hardcoded prototype data
- deterministic overlays
- placeholder correction assets if needed

Avoid premature engineering.

---

# Suggested Initial Architecture

Simple static PWA structure is acceptable.

The goal is:
workflow validation,
not infrastructure design.

---

# Success Criteria

The prototype succeeds if:
- workflow feels cognitively clean
- critique sequencing feels natural
- repaint guidance feels actionable
- overlay feels quiet and useful
- correction feels educational rather than beautifying
- painter attention remains focused

---

# Validation Plan

The prototype should be tested on:
- 5–10 existing watercolor paintings

Focus on:
- usability
- repaint clarity
- painter reaction
- workflow pacing

NOT:
- automation quality
- model sophistication
- scalability

---

# Deliverables

Prototype should include:
- working upload flow
- basic critique display
- overlay rendering
- demonstrative correction panel
- repaint guidance panel

Provide:
- concise implementation summary
- known limitations
- suggested next validation steps

No commit.

