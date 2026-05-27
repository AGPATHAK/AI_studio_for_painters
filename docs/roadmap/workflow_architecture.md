# AI Painter Studio — Workflow-Oriented Roadmap Architecture

## 1. Purpose

AI Painter Studio has evolved beyond a single critique-and-repaint loop.

The product is now best understood as an AI-native painterly reasoning system organized around three distinct workflows:

1. Reference Ideation
2. In-Progress Guidance
3. Finished Painting Review

These workflows share infrastructure, visual language, and painter-centered doctrine, but they do not share the same psychological contract. Each mode asks a different question, needs a different AI role, and should surface a different UI.

The roadmap should therefore be organized around workflow intent, not around a generic image-processing pipeline.

---

## 2. Product Clarification

AI Painter Studio is:

- an AI-native painterly reasoning system,
- a studio assistant for visual interpretation,
- a tool for seeing, deciding, comparing, and learning,
- and a system for supporting painterly judgment across the life of a work.

AI Painter Studio is not:

- a deterministic image utility,
- a generic AI art generator,
- a one-click enhancement tool,
- or a replacement for painting practice.

Deterministic visual scaffolding still has supporting value. Overlays, masks, tonal comparisons, grids, notan studies, and lightweight visual aids can clarify looking. They should remain subordinate to the interpretive AI layer and should not redefine the product as a deterministic utility.

---

## 3. The Three Workflows

### 3.1 Reference Ideation Mode

Reference Ideation begins with a source photograph or visual reference before painting starts.

Its goal is painterly exploration, not critique. The system helps the painter ask: "What could this become as a painting?"

This mode should support:

- Wesson-esque simplification,
- Seago-like atmosphere exploration,
- compositional variation,
- cropping and focal hierarchy studies,
- value grouping and notan exploration,
- palette and mood variants,
- atmospheric compression,
- selective abstraction,
- and alternate interpretations of the same motif.

The input is not treated as a failed painting. It is treated as raw visual material. The AI should not diagnose mistakes, assign weaknesses, or imply that the photograph needs correction. Its role is exploratory, suggestive, compositional, and painterly.

The psychological posture is permissive. The painter is still forming intent. The system should widen possibilities while keeping them grounded in painterly structure.

Prompting should emphasize:

- interpretation over accuracy,
- simplification over copying,
- atmospheric and compositional alternatives,
- multiple valid readings,
- and visual questions rather than verdicts.

The UI should privilege fast comparison among a small number of meaningful alternatives. Useful surfaces include crop candidates, value studies, palette directions, compositional thumbnails, and short rationale notes. It should avoid critique panels, weakness lists, and repair language.

### 3.2 In-Progress Guidance Mode

In-Progress Guidance begins with a painting currently underway.

Its goal is to improve, redirect, or rescue the work while protecting what is already successful. This is where the repaint-first doctrine most strongly applies.

This mode should support:

- value structure critique,
- edge economy critique,
- selective repaint guidance,
- intervention scope selection,
- protected passage identification,
- salvageability assessment,
- repaint vs continue recommendations,
- localized corrections,
- and reference-sheet style handoff for the next manual pass.

The system should ask: "What is the smallest useful intervention that helps this painting survive and teach the painter something?"

The psychological posture is careful. The painter may already be invested in fragile passages. The AI should not casually replace, over-finish, or globally improve the image. It should preserve successful areas, name the dominant problem, and recommend the lightest effective intervention.

Prompting should emphasize:

- selective intervention,
- protected passages,
- salvageability,
- repaint guidance,
- value and edge hierarchy,
- one major lesson at a time,
- and clear limits on what should not be changed.

The UI should show diagnosis, scope, preserved areas, proposed intervention, and repaint guidance in that order. The painting should remain visually dominant. Any AI demonstration should be traceable to a specific critique issue and should return the painter toward manual repainting.

### 3.3 Finished Painting Review Mode

Finished Painting Review begins with a completed painting.

Its goal is long-term artistic growth, not rescue. The system helps the painter ask: "What does this work reveal about my habits, strengths, and next areas of study?"

This mode should support:

- structured critique,
- strengths and weaknesses,
- dimension ratings when useful,
- recurring mistake tracking,
- recurring strength tracking,
- longitudinal learning,
- pattern recognition across works,
- and mentorship-oriented review.

Potential review dimensions include:

- composition,
- focal hierarchy,
- values,
- structure,
- atmosphere,
- brushwork,
- edge control,
- color harmony,
- and painterly economy.

The psychological posture is reflective. The painting is finished, so the system should not assume the painter wants to repaint it. It may suggest future studies or principles to carry forward, but it should not frame the completed work as a rescue target unless the user explicitly asks for that.

Prompting should emphasize:

- balanced critique,
- strengths before prescriptions when appropriate,
- pedagogical explanation,
- patterns over one-off fixes,
- longitudinal memory,
- and future-facing practice recommendations.

The UI should support review history, recurring themes, critique summaries, comparison across paintings, and progress over time. This is the mode where memory becomes central.

---

## 4. Critical Philosophical Clarification

The current critique system incorrectly assumes that the user intends to repaint the same work.

That assumption is valid only for In-Progress Guidance.

It is not valid for Reference Ideation, where no painting exists yet and the goal is visual exploration. It is also not valid for Finished Painting Review, where the painting may be complete and the goal is reflection, mentorship, and long-term growth.

The critique-to-correction-to-repaint loop remains essential, but it is not the universal product model. It is the governing doctrine for the in-progress rescue workflow.

The broader product doctrine is:

- ideate before painting,
- guide selectively during painting,
- review reflectively after painting.

---

## 5. Prompting Philosophy by Workflow

The three workflows require distinct prompting strategies.

Reference Ideation prompts should behave like a painterly exploration partner. They should produce possible interpretations, simplifications, compositional directions, and atmosphere/palette options. They should avoid judgmental critique language.

In-Progress Guidance prompts should behave like a restrained studio instructor. They should diagnose the dominant issue, identify protected passages, recommend a limited intervention, and return the user toward repaint action. They should avoid global beautification and over-rendered correction.

Finished Painting Review prompts should behave like a mentor. They should evaluate the work as a completed artifact, identify strengths and weaknesses, connect observations to recurring patterns, and suggest future practice. They should avoid assuming immediate repaint unless the user requests it.

Shared painterly vocabulary remains valuable across all modes: value grouping, shape design, edge economy, focal hierarchy, atmosphere, chroma restraint, and simplification. The difference is not vocabulary; it is intent.

---

## 6. UI Implications

The product should expose workflow intent clearly before generating AI output.

Reference Ideation UI should feel exploratory:

- input reference image,
- generate a few purposeful alternatives,
- compare compositions, palettes, value studies, and atmosphere directions,
- preserve ambiguity and choice.

In-Progress Guidance UI should feel protective:

- input current painting,
- identify the dominant problem,
- reveal intervention scope,
- mark protected passages,
- offer a controlled demonstration only when useful,
- produce repaint guidance.

Finished Painting Review UI should feel reflective:

- input completed painting,
- provide structured critique,
- record strengths and weaknesses,
- track recurring patterns,
- support review history and growth over time.

All modes should remain image-first. Text should guide looking, not replace it.

---

## 7. Shared Infrastructure

The workflows can share a meaningful technical foundation:

- image upload and display,
- model invocation and response handling,
- structured output validation,
- painterly vocabulary and knowledge base,
- visual comparison surfaces,
- annotation and overlay primitives,
- exportable reference/review artifacts,
- version/session state,
- and common safety rails against generic AI-art drift.

The shared infrastructure should not force a shared product behavior. A single image pipeline can support multiple modes only if workflow intent is explicit and passed into prompting, schema selection, UI layout, and persistence.

---

## 8. Divergent Architecture

The workflows diverge in four important ways.

First, they need different AI roles:

- Reference Ideation: exploratory interpreter.
- In-Progress Guidance: restrained repaint instructor.
- Finished Painting Review: reflective mentor.

Second, they need different schemas:

- Reference Ideation needs variants, rationale, compositional options, value/palette alternatives, and painterly intent.
- In-Progress Guidance needs diagnosis, intervention scope, protected passages, salvageability, repaint plan, and traceable correction requests.
- Finished Painting Review needs strengths, weaknesses, dimension notes, recurring patterns, progress markers, and future study recommendations.

Third, they need different memory:

- Reference Ideation benefits from lightweight session memory and selected direction tracking.
- In-Progress Guidance benefits from state/history for the current painting and repaint iterations.
- Finished Painting Review requires longitudinal memory across paintings, recurring themes, and growth tracking.

Fourth, they need different UI emphasis:

- Reference Ideation emphasizes small sets of alternatives.
- In-Progress Guidance emphasizes controlled diagnosis and intervention.
- Finished Painting Review emphasizes structured reflection and historical continuity.

---

## 9. Roadmap Structure

The M2 roadmap should split into three workflow milestones.

### M2A — Reference Ideation

Goal: help the painter transform a reference photograph into painterly possibilities before beginning.

Initial scope:

- workflow selection for reference ideation,
- prompt set for painterly exploration,
- compositional and value simplification variants,
- atmosphere and palette alternatives,
- comparison layout for a small number of options,
- and explicit avoidance of critique language.

Success criterion:

The painter can choose a clearer painting direction without feeling pushed toward copying the photo or accepting a single AI answer.

### M2B — In-Progress Guidance

Goal: support selective intervention and repaint guidance for paintings underway.

Initial scope:

- structured diagnosis,
- intervention scope framework,
- protected passage detection,
- salvageability assessment,
- repaint vs continue recommendation,
- controlled demonstration when useful,
- and printable/reference-sheet handoff.

Success criterion:

The painter can understand what to preserve, what to change, and how to repaint the next pass with greater clarity.

### M2C — Finished Painting Review

Goal: support reflective critique and long-term growth after a painting is complete.

Initial scope:

- structured review schema,
- strengths and weaknesses,
- critique dimension tracking,
- recurring pattern capture,
- review history,
- and mentor-style future practice recommendations.

Success criterion:

The painter can see both the individual painting and their developing habits more clearly over time.

---

## 10. Sequencing Recommendation

M2B should remain the strongest near-term continuation of the current implemented workflow, because existing critique, intervention, repaintability, and comparison doctrine already point there.

M2A should be developed early enough to prevent the product from being framed only as a critique tool. It can reuse visual comparison infrastructure while requiring a distinct prompt layer and lighter persistence.

M2C should follow once review history, identity of recurring patterns, and longitudinal storage are ready. It is strategically important, but it should not be faked with single-session critique language. Finished review becomes powerful when the system remembers.

A practical sequence is:

1. M2B: stabilize in-progress guidance and repaint handoff.
2. M2A: add reference ideation as a separate pre-painting workflow.
3. M2C: add finished review with longitudinal memory.

This sequence preserves current momentum while making the multi-workflow architecture explicit.

---

## 11. Guardrails

The painter-centered philosophy remains constant across all modes.

Preserve:

- painter agency,
- image-first review,
- selective intervention where intervention is appropriate,
- repaint-first doctrine for in-progress guidance,
- multiple valid interpretations,
- AI-native visual reasoning,
- and resistance to generic AI beautification.

Avoid:

- treating every image as a failed painting,
- treating every output as a correction,
- collapsing ideation, rescue, and review into one prompt,
- using deterministic tools as the product center,
- rewarding prettier outputs over better decisions,
- and building UI that makes the painter manage the system instead of looking at the work.

---

## 12. Governing Principle

The product should know where the painter is in the life of the work.

Before the painting, AI helps imagine possibilities.

During the painting, AI helps intervene selectively.

After the painting, AI helps the painter learn from the work.

That distinction should govern prompts, schemas, UI, memory, and roadmap sequencing.
