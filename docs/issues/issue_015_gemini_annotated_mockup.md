# Issue 015 — Gemini Annotated Visual Mockup

## Goal

Implement the first AI-assisted visual mockup loop.

The app should convert the current long text-based Reference Ideation / composition analysis into an annotated visual mockup using Gemini image generation/editing.

## Product Intent

This app is not only a text critique tool. Its core purpose is AI-assisted painterly visual correction.

The mockup should help the painter see:
- stronger value grouping
- simplified composition
- clearer focal hierarchy
- reduced clutter
- suggested edge hierarchy
- annotated compositional guidance

## Scope

Add a first implementation of a Gemini-powered annotated mockup.

Current flow:

1. User uploads image.
2. App generates Reference Ideation text.
3. App should now support generating a visual mockup from that analysis.

## Required Behavior

Add a visible control such as:

- Generate Annotated Mockup

When clicked:

1. Send uploaded image plus current Reference Ideation output to backend.
2. Backend calls Gemini image-capable API.
3. Return a generated/edited image.
4. Display it in the UI as an output panel.

## Mockup Requirements

The generated image should be an annotated painterly planning mockup, not final artwork.

It should preserve:
- original subject
- basic composition
- major shape relationships

It may modify or annotate:
- value masses
- focal area
- dark/light grouping
- compositional movement
- edges to soften/lose
- details to suppress
- accents to keep

Prefer visible annotations:
- arrows
- circled focal areas
- simplified value overlays
- labels such as “merge darks”, “soften”, “suppress detail”, “keep contrast here”

## Guardrails

Do not turn this into:
- generic image generation
- decorative fantasy rendering
- photoreal enhancement
- style-transfer imitation
- unrelated repainting

The mockup should function as a painter’s working visual guide.

## Technical Constraints

- Keep current lightweight architecture.
- Reuse semantic proxy where appropriate.
- Do not introduce build systems.
- Do not refactor unrelated code.
- Keep API key server-side only.
- Add minimal CORS changes only if required.
- Keep current Reference Ideation flow working.

## Suggested Backend Shape

Add a new backend route if appropriate, for example:

POST /api/mockup

Input:
- uploaded image data
- reference ideation text / structured object
- optional mode: annotated_mockup

Output:
- image data URL or base64 image payload
- optional notes

## Suggested Frontend Shape

Add:
- mockup button
- loading state
- error state
- mockup output panel
- ability to download generated mockup if simple to add

## Validation

Run:

node --check app.js
node --check server/semantic-proxy.js
git diff --check

Manual test:

1. Start proxy on 8080.
2. Start frontend on 8081.
3. Upload image.
4. Generate Reference Ideation.
5. Click Generate Annotated Mockup.
6. Confirm visual mockup appears.
7. Confirm existing text ideation still works.
