# Issue 017 — Finished Painting Critique Workflow

## Goal

Add a Finished Painting Critique workflow.

This should support critique of a completed painting independently of:
- reference image
- mockup
- WIP workflow

The user should be able to upload a finished painting and receive a focused final critique.

## Product Intent

This is not a tutorial critique.

This mode should function like:
- experienced painter feedback
- exhibition/juried review
- composition/value/readability critique
- finishing/pass quality assessment

The critique should help the painter decide:
- whether the painting is resolved
- where it succeeds
- where it weakens
- what could still be improved
- whether further changes may overwork the piece

## Required Workflow

Add a Finished Painting tab/mode.

User flow:
1. Open Finished Painting mode.
2. Upload finished painting.
3. Render image in main canvas.
4. Click Generate Critique.
5. Receive detailed critique.

## Optional Context

If reference/mockup/WIP already exists in session:
- include them as optional context

But the workflow must work independently with only a finished painting upload.

## Critique Focus

The critique should emphasize:
- first-read impact
- focal hierarchy
- value organization
- edge hierarchy
- compositional unity
- color harmony
- overworked vs fresh passages
- brush economy
- visual flow
- emotional read
- framing/cropping considerations
- whether to stop or continue

The response should feel like a serious painter critique, not generic praise.

Avoid:
- excessive positivity
- decorative adjectives
- beginner tutorial tone
- AI-art phrasing

## UI

Add:
- Finished Painting mode/tab
- upload control
- critique button
- critique output panel

Reuse:
- existing canvas rendering pipeline
- existing semantic request architecture

## Constraints

- Do not break existing:
  - Reference Ideation
  - Annotated Mockup
  - In-Process workflows

- Keep architecture lightweight.
- No framework/build system.
- No broad refactor.

## Suggested Backend

Reuse semantic proxy patterns.

Possible route:
POST /api/finished-critique

Input:
- finished painting image
- optional context images/text

Output:
- critique text

## Validation

Run:
- node --check app.js
- node --check server/semantic-proxy.js
- git diff --check

Manual test:
1. Open app fresh.
2. Go directly to Finished Painting mode.
3. Upload finished painting only.
4. Generate critique successfully.
5. Verify existing workflows still function.
