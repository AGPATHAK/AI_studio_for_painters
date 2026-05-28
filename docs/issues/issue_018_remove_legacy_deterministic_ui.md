# Issue 018 — Remove Legacy Deterministic Critique UI And Overlay Paths

## Goal

Execute Stage 1 from docs/audits/deterministic_cleanup_audit.md.

This is a SAFE cleanup pass only.

Remove legacy deterministic critique UI and overlay machinery that is no longer reachable in the current AI-native workflows.

## Important Constraints

Do NOT:
- touch Gemini request/response flows
- touch mockup generation
- touch upload/image state
- touch canvas base rendering
- touch parser recovery
- touch In-Process or Finished Painting critique architecture
- remove fallback semantic object yet
- rename routes/endpoints yet
- perform broad refactors

This pass should ONLY remove dead or effectively unreachable deterministic UI/render paths.

## Remove

### Legacy stepped critique loop

Remove:
- advanceCritiqueLoop()
- nextStepBtn logic
- old stepped critique progression

### Legacy panel sections

Remove:
- semantic-section
- scope-section
- demo-section
- repaint-section

Remove related:
- hidden/show logic
- DOM references
- refreshCritiqueCopy() deterministic branch
- critique-panel data-step machinery

### Deterministic overlays

Remove:
- getCritiqueRegion()
- drawRoundedRegion()
- drawScopeOverlay()
- drawDemonstrationOverlay()

Remove overlay branches from renderCanvas().

Keep:
- normal image rendering
- mockup rendering
- resize-fit behavior
- original/mockup toggle

### Related CSS cleanup

Remove unused CSS tied to:
- panel-section
- repaint-list
- critique-panel[data-step=...]

## Keep Intact

Must continue working:
- Reference Ideation
- Annotated Mockups
- In-Process critique
- Finished Painting critique
- main canvas rendering
- Original/Mockup toggle
- reset behavior
- workflow switching

## Validation

Run:
- node --check app.js
- node --check server/semantic-proxy.js
- git diff --check

Manual validation:
1. Fresh load.
2. Reference Ideation upload.
3. Generate mockup.
4. Toggle original/mockup.
5. In-Process upload + critique + mockup.
6. Finished Painting upload + critique.
7. Reset in each mode.
8. Resize window with images loaded.

## Deliverable

Keep implementation narrow.
No architectural cleanup beyond this issue.
