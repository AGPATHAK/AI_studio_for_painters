# Issue 016 — In-Process Workflow

## Goal

Add an In-Process workflow for uploaded work-in-progress painting images.

## Key Product Rule

The In-Process workflow must work even when there is no reference image and no generated mockup.

Valid use cases:
1. WIP image only
2. WIP + reference
3. WIP + mockup
4. WIP + reference + mockup

Do not require Reference Ideation or Annotated Mockup before using In-Process.

## UX Goal

Create an In-Process tab or mode where the painter can upload a current painting progress photo and receive critique/guidance.

## Required Behavior

- Add an In-Process tab/mode.
- Allow upload of a WIP image independently.
- Render WIP image in main canvas.
- Provide an AI critique/action guidance button for the WIP.
- If reference/mockup exists, include it in the backend request as context.
- If reference/mockup does not exist, send only the WIP image and ask Gemini for standalone progress critique.

## Critique Focus

The response should focus on:
- what is working
- what to adjust next
- value structure
- edge control
- focal hierarchy
- overworked areas
- lost-and-found edges
- next 3–5 painting actions

## Constraints

- Do not break existing Reference Ideation workflow.
- Do not break Annotated Mockup workflow.
- Do not force linear sequence.
- Keep lightweight architecture.
- No framework/build system.
- No broad refactor.

## Validation

Run:

node --check app.js
node --check server/semantic-proxy.js
git diff --check

Manual test:
1. Open app fresh.
2. Go directly to In-Process.
3. Upload WIP only.
4. Generate critique successfully.
5. Then test WIP with existing reference/mockup context.
