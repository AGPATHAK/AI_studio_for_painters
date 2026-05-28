# Deterministic Cleanup Audit

Date: 2026-05-28

Scope: investigation only. No removals or refactors were performed.

## Executive Summary

The runtime has already moved away from PRL-style deterministic image processing. I found no active grayscale, notan, histogram, threshold, mask-generation, `getImageData`, `putImageData`, or pixel-analysis pipeline in the app. The remaining deterministic/fallback machinery is mostly:

- a legacy fallback semantic object and deterministic critique copy path in `app.js`
- a stepped "diagnosis -> scope -> demo -> repaint" panel loop
- deterministic canvas overlays for that stepped loop
- compatibility fields that preserve old `regions`, `valueFamilies`, `critiqueTarget`, and repaint-template concepts
- robust Gemini JSON parsing/recovery in `server/semantic-proxy.js`
- stale planning docs that still describe an older OpenAI/edit/mask architecture

The safest cleanup path is not to remove all fallback code at once. Some fallback-shaped helpers are still used as scaffolding for the current AI-native workflows, especially Reference Ideation and Annotated Mockups.

## Current AI-Native Workflow Map

Active workflows:

- Reference Ideation: `index.html` workflow option -> `app.js` `requestSemanticInterpretation()` -> `/api/semantic` -> `server/semantic-proxy.js` `callGeminiSemanticPass()` with `REFERENCE_IDEATION_PROMPT`.
- Annotated Mockups: `mockup-btn` -> `app.js` `requestAnnotatedMockup()` -> `/api/mockup` -> `server/semantic-proxy.js` `callGeminiMockupPass()`.
- In-Process critique: workflow option -> upload WIP -> `Crit` button -> `app.js` `requestInProcessCritique()` -> `/api/in-process` -> `server/semantic-proxy.js` `callGeminiInProcessPass()`.
- Finished Painting critique: workflow option -> upload finished image -> `Crit` button -> `app.js` `requestFinishedCritique()` -> `/api/finished-critique` -> `server/semantic-proxy.js` `callGeminiFinishedPass()`.

Important current behavior:

- Reference Ideation auto-runs after upload.
- In-Process and Finished Painting upload only loads the image; critique runs on explicit button click.
- In-Process and Finished Painting return `semantic: null` on Gemini failure rather than local deterministic critique.
- Reference Ideation still uses local fallback ideation text on Gemini failure.
- Mockup generation can use either real ideation or fallback ideation.

## Findings And Classification

### 1. Browser Image Loading And Canvas Rendering

Files:

- `app.js`: image state, upload/reset, `createImageBitmap`, ObjectURL cleanup, `renderCanvas()`, `renderCurrentDisplay()`, display toggle.
- `index.html`: file input, canvas, original/mockup toggle.
- `styles.css`: canvas area and toggle styles.

Classification: **A. Core infrastructure to KEEP**

Why:

- This is not deterministic critique. It is the core image display primitive for every workflow.
- `renderCanvas()` draws original and generated mockup bitmaps and handles resize-fit behavior.
- ObjectURL revocation and `ImageBitmap.close()` are important memory hygiene.

Dependency/risk:

- Removing these would break all workflows.
- The only removable part inside this area is the overlay hook, covered separately.

DO NOT REMOVE YET:

- `appState.image`, `appState.wipImage`, `appState.finishedImage`
- `makeEmptyImageState()`
- `getActiveImageState()`
- upload/reset handlers
- `renderCanvas()` and `renderCurrentDisplay()` base image drawing
- canvas original/mockup toggle while mockups remain part of the product

### 2. Local Semantic Fallback Object

Files:

- `app.js`: `DEFAULT_SEMANTIC_INTERPRETATION`, `getFallbackSemanticInterpretation()`, fallback source copy in `WORKFLOW_COPY`.

Classification: **C. Uncertain / needs validation**

Why:

- This is the most obvious deterministic fallback system, but it still has live dependencies.
- Reference Ideation uses it when Gemini fails.
- Annotated Mockup falls back to it when no current semantic ideation exists.
- Several UI helpers use it to avoid null access: `getTargetValueFamily()`, `getProtectedPassages()`, `getRegionReadout()`, `refreshReferenceIdeationCopy()`, `requestAnnotatedMockup()`.

Current callers:

- `normalizeSemanticInterpretation(raw, bitmap)`
- `requestSemanticInterpretation(file, bitmap, requestId)`
- `getTargetValueFamily()`
- `getProtectedPassages()`
- `getRegionReadout()`
- `refreshCritiqueCopy(step)` legacy branch
- `refreshReferenceIdeationCopy(step)`
- `requestAnnotatedMockup()`

What would break if removed immediately:

- Reference Ideation would no longer display usable content on Gemini failure.
- Mockup generation without a real ideation object would lose its prompt notes fallback.
- AI critique rendering may hit undefined fields through helper functions that assume `valueFamilies[0]`.

Risk:

- Moderate. Conceptually obsolete, but coupled to both fallback UX and old helper assumptions.

Recommended direction:

- Keep until an explicit AI-unavailable UX is in place for Reference Ideation and mockups.
- Later replace with tiny null-safe helper defaults, not painterly fake analysis.

### 3. Frontend Normalization That Backfills Old Semantic Fields

Files:

- `app.js`: `normalizeSemanticInterpretation()`, `normalizeInProcessCritique()`, `normalizeFinishedCritique()`.

Classification: **C. Uncertain / needs validation**

Why:

- These functions are partly useful response adapters and partly legacy semantic compression.
- They still backfill `regions`, `valueFamilies`, `critiqueTarget`, `protectedPassages`, and old repaint fields even though the AI-native panel mostly displays direct Gemini text.
- In-Process and Finished Painting create deterministic region/value-family placeholders from image orientation if Gemini omits those arrays.

Current callers:

- `requestSemanticInterpretation()` calls `normalizeSemanticInterpretation()`.
- `requestInProcessCritique()` calls `normalizeInProcessCritique()`.
- `requestFinishedCritique()` calls `normalizeFinishedCritique()`.

What would break if removed immediately:

- The frontend may display raw server payloads inconsistently.
- `refreshAiCritiqueCopy()` expects fields like `critique.valueStructureCritique`, `critique.edgeAtmosphereCritique`, and may call `getTargetValueFamily()` for fallback scope.
- Mockup prompt construction depends on the Reference Ideation normalized fields.

Risk:

- Moderate. Safe cleanup requires first deciding the canonical frontend AI response shape and updating display helpers.

Recommended direction:

- Keep the string cleanup and canonical AI fields.
- Later remove orientation-derived fallback `regions` and `valueFamilies` after `refreshAiCritiqueCopy()` no longer needs them.

### 4. Legacy Deterministic Critique Template Path

Files:

- `app.js`: non-AI branch of `refreshCritiqueCopy(step)`.
- `app.js`: `advanceCritiqueLoop()`.
- `index.html`: `semantic-section`, `scope-section`, `demo-section`, `repaint-section`, `next-step-btn`.
- `styles.css`: `.panel-section`, `.repaint-list`, `critique-panel[data-step=...]` generated title suffixes.

Classification: **B. Likely removable now**

Why:

- Current workflow modes are always `reference-ideation`, `in-progress-guidance`, or `finished-review`.
- `setCritiqueStep()` sets `useAiCritique` to true for all three modes, so the legacy panel sections and next-step button are hidden in the current product.
- The fallback branch in `refreshCritiqueCopy()` appears reachable only if a future/invalid workflow mode bypasses the three explicit modes. `getWorkflowMode()` currently coerces invalid modes back to Reference Ideation, so this branch is effectively dead.

Current callers:

- `setCritiqueStep(step)` always calls `refreshCritiqueCopy(step)`.
- The legacy portion of `refreshCritiqueCopy()` only runs after Reference Ideation, In-Process, Finished Painting, and AI-native checks all fail.
- `nextStepBtn` click calls `advanceCritiqueLoop()`, but `nextStepBtn.hidden = useAiCritique` hides it for all current modes.

What would break if removed:

- The old no-AI stepped deterministic demo would disappear.
- Existing current AI-native workflows should not break if removal is done with `setCritiqueStep()` simplified carefully.
- DOM guard must be updated if the old elements are removed from `index.html`; otherwise startup logs missing elements.

Risk:

- Low to moderate. Low product risk, moderate implementation risk because many DOM refs and hidden-state lines mention these elements.

Manual validation needed:

- Reference Ideation upload and ideation display.
- Generate Annotated Mockup after Reference Ideation.
- In-Process upload-only state, then critique state.
- Finished Painting upload-only state, then critique state.
- Reset and workflow switching with and without images.

### 5. Deterministic Canvas Scope/Demo Overlays

Files:

- `app.js`: `getCritiqueRegion()`, `drawRoundedRegion()`, `drawScopeOverlay()`, `drawDemonstrationOverlay()`, overlay branch inside `renderCanvas()`.

Classification: **B. Likely removable now**

Why:

- These overlays are tied to the legacy stepped critique loop.
- `renderCanvas()` explicitly disables overlays in In-Process and Finished Painting.
- Reference Ideation is marked as AI critique in `setCritiqueStep()`, so the old `scope/demo/repaint` progression is not exposed.
- There is no pixel-analysis overlay or mask logic here; it is just a hard-coded rectangular region.

Current callers:

- `renderCanvas()` calls `drawScopeOverlay()` when `appState.critiqueStep === 'scope'`.
- `renderCanvas()` calls `drawDemonstrationOverlay()` when `appState.critiqueStep === 'demo'` or `repaint`.
- Those states are only advanced by `advanceCritiqueLoop()`, whose button is hidden in all current workflows.

What would break if removed:

- The old hard-coded overlay demonstration would disappear.
- Current AI-native display should remain intact if `renderCanvas()` keeps base image drawing and mockup display.

Risk:

- Low. This is one of the safest runtime removals after confirming no hidden workflow mode is planned to use quiet overlays.

Manual validation needed:

- Verify original image renders.
- Verify mockup image renders.
- Resize window and confirm canvas still refits.

### 6. Mockup State, Mockup Rendering, And Original/Mockup Toggle

Files:

- `app.js`: `mockup` state, `supportsAnnotatedMockup()`, `canGenerateMockup()`, `refreshMockupUi()`, `requestAnnotatedMockup()`, `imageBitmapFromDataUrl()`, `getDisplayBitmap()`, display-mode handlers.
- `index.html`: mockup button, mockup image/download panel, original/mockup toggle.
- `server/semantic-proxy.js`: `/api/mockup`, `callGeminiMockupPass()`, `buildAnnotatedMockupPrompt()`.

Classification: **A. Core infrastructure to KEEP**

Why:

- Annotated Mockups are one of the current product workflows.
- This is AI image generation/editing, not deterministic fallback rendering.
- The original/mockup toggle is necessary once a mockup has been generated.

Dependency/risk:

- Removing this would break the active Annotated Mockup workflow and optional context image support for In-Process and Finished Painting.

DO NOT REMOVE YET:

- Mockup state and UI.
- `/api/mockup`.
- `buildAnnotatedMockupPrompt()` and `summarizeIdeationForMockup()`.
- `dataUrlToImagePayload()` because it sends mockup context to later workflows.

### 7. Server Gemini JSON Parsing And Recovery

Files:

- `server/semantic-proxy.js`: `parseSemanticJson()`, `buildJsonCandidates()`, `stripMarkdownFences()`, `extractBalancedJsonBlocks()`, `lightCleanupJson()`, `recoverSemanticFields()`, and helpers.

Classification: **C. Uncertain / needs validation**

Why:

- This is fallback-like machinery, but it protects AI-native workflows from imperfect model formatting.
- Gemini is requested to return JSON with response schemas, but robust parsing is still valuable because model/API behavior can drift.
- The recovery function includes old and new fields, which may be broader than needed.

Current callers:

- `callGeminiSemanticPass()`
- `callGeminiInProcessPass()`
- `callGeminiFinishedPass()`

What would break if removed:

- Any markdown-wrapped or slightly malformed Gemini JSON could fail fully instead of recovering partial useful critique.
- More user-visible "Gemini did not complete" states.

Risk:

- Moderate to high if removed too early.

Recommended direction:

- Keep parse recovery initially.
- Later add fixture-style parser tests before narrowing recovered fields.

DO NOT REMOVE YET:

- `parseSemanticJson()` and core candidate extraction.
- `cleanText()`, `normalizeSemanticResponse()`, and MIME/body validation helpers.

### 8. Server Semantic Route Naming And Legacy Prompt Names

Files:

- `server/semantic-proxy.js`: `/api/semantic`, `SEMANTIC_PROMPT`, `SEMANTIC_SCHEMA`, `callGeminiSemanticPass()`.
- `app.js`: `getSemanticEndpoint()`, `sameOriginSemanticPath`, `requestSemanticInterpretation()`.

Classification: **C. Uncertain / needs validation**

Why:

- Names like "semantic" are legacy from the semantic-label phase.
- `/api/semantic` is still the active Reference Ideation endpoint and also has prompt selection for non-reference modes if called that way.
- Renaming would be conceptual cleanup, but it touches API contracts and local dev behavior.

Current callers:

- Reference Ideation upload path in `app.js`.
- `getSemanticEndpoint()` and `APP_CONFIG.sameOriginSemanticPath`.

What would break if removed/renamed:

- Reference Ideation unless frontend and backend are changed together.
- Any localStorage override for `aps:semanticEndpoint`.

Risk:

- Moderate. Better handled as a rename/migration after dead UI removal.

### 9. Workflow Mode Fallbacks And Feature Conditionals

Files:

- `app.js`: `getWorkflowMode()`, `isReferenceIdeationMode()`, `isInProcessMode()`, `isFinishedMode()`, `supportsAnnotatedMockup()`.
- `server/semantic-proxy.js`: `normalizeWorkflowMode()`, `promptForWorkflow()`, `schemaForWorkflow()`.

Classification: **A. Core infrastructure to KEEP**

Why:

- These conditionals are not obsolete fallback machinery; they are the current workflow router.
- `supportsAnnotatedMockup()` intentionally excludes Finished Painting.
- `normalizeWorkflowMode()` protects backend route behavior from invalid input.

Concern:

- The frontend defaults invalid mode to Reference Ideation; the backend defaults invalid mode to In-Process. This is worth documenting and possibly aligning later, but not part of removal.

Risk:

- Removing these would break all workflow-specific behavior.

### 10. Documentation Drift From Earlier Architecture

Files:

- `README.md`
- `docs/brief.md`
- `docs/roadmap.md`
- `docs/decisions.md`
- early issue files such as `docs/issues/004-m2-critique-engine.md`, `005-m2-5-critique-edit-bridge.md`, `006-m3-value-simplification.md`.

Classification: **C. Uncertain / needs validation**

Why:

- These docs still describe OpenAI BYO-key, `gpt-image-1`, masks, edit history, and planned deterministic/edit-bridge concepts that do not match the current Gemini proxy workflow.
- They are not runtime risk, but they can mislead future cleanup and implementation decisions.

What would break if removed:

- Historical planning context would be lost.

Recommended direction:

- Do not delete planning docs.
- Add a current architecture note or mark old milestone docs as superseded.

## Dependency Map For Removable Candidates

| Candidate | Classification | Current callers | If removed now | Validation needed |
|---|---:|---|---|---|
| Legacy deterministic critique branch inside `refreshCritiqueCopy()` | B | `setCritiqueStep()` | Current workflows likely okay, but panel copy logic must be simplified carefully | All three workflow upload/critique states |
| `advanceCritiqueLoop()` | B | `nextStepBtn` click listener | Current workflows likely okay because button is hidden; remove listener with button | Check no visible "Run critique" dead button remains |
| `nextStepBtn` DOM/UI | B | DOM guard, `showCanvas()`, `showEmptyState()`, `setCritiqueStep()`, `refresh*Copy()` | DOM guard and state code will need edits together | Startup, reset, mode switching |
| `semantic-section`, `scope-section`, `demo-section`, `repaint-section` | B | DOM guard, `setCritiqueStep()`, CSS | Current AI panel should remain; old fallback display gone | AI panel still renders all fields |
| `drawScopeOverlay()`, `drawDemonstrationOverlay()`, `getCritiqueRegion()`, `drawRoundedRegion()` | B | `renderCanvas()` overlay branch | Old hard-coded overlay gone; base canvas should remain | Original/mockup rendering and resize |
| `.panel-section`, `.repaint-list`, `critique-panel[data-step=scope/demo/repaint]` CSS | B | HTML and `data-step` attrs | Remove after corresponding HTML/JS removal | Visual check panel spacing |
| `sourceFallback` copy for In-Process/Finished | B/C | `refreshSemanticSource()` | Probably no longer shown because failures use `source: none`, but server could return non-gemini source in future | Failed Gemini/manual 503 states |
| Orientation-based fallback regions/value families in `normalizeInProcessCritique()` and `normalizeFinishedCritique()` | C | `refreshAiCritiqueCopy()` helpers | Scope/preserve fallback text may weaken or error if fields missing | Test Gemini payloads omitting regions/valueFamilies |
| `DEFAULT_SEMANTIC_INTERPRETATION` | C | Many helpers and mockup fallback | Reference Ideation fallback and mockup prompt fallback break | Need replacement unavailable UX first |
| Server `recoverSemanticFields()` broad legacy field list | C | `parseSemanticJson()` | Malformed Gemini JSON recovery becomes weaker if removed | Parser fixtures before narrowing |

## Staged Cleanup Roadmap

### Stage 1: Safest Removals

Goal: remove UI/render paths that are unreachable in the current three-workflow product while preserving all AI request/response paths.

Files affected:

- `app.js`
- `index.html`
- `styles.css`

Candidate removals:

- `nextStepBtn` and `advanceCritiqueLoop()`
- legacy panel sections: `semantic-section`, `scope-section`, `demo-section`, `repaint-section`
- non-AI stepped branch in `refreshCritiqueCopy()`
- deterministic overlay functions and the overlay branch in `renderCanvas()`
- related CSS for `.panel-section`, `.repaint-list`, and `critique-panel[data-step=scope/demo/repaint]`

Estimated risk: **Low to moderate**

Why not zero:

- The app has a strict DOM guard; JS, HTML, and CSS must be changed together.
- `setCritiqueStep()` currently centralizes a lot of UI refresh behavior, so it should be simplified cautiously rather than removed wholesale.

Manual validation checklist:

- Fresh app opens with no console missing-element errors.
- Reference Ideation: upload image -> Gemini ideation appears.
- Reference Ideation: generate annotated mockup -> mockup appears -> toggle original/mockup works.
- In-Process: switch mode -> upload WIP -> no critique until `Crit` -> Gemini critique appears.
- Finished Painting: switch mode -> upload final -> no critique until `Crit` -> Gemini critique appears.
- Reset works in every mode.
- Resize window with original and mockup images.

### Stage 2: Moderate-Risk Simplification

Goal: remove old semantic-label compression from AI-native display while keeping minimal null-safe response handling.

Files affected:

- `app.js`
- possibly `server/semantic-proxy.js` if frontend/server response contracts are tightened together

Candidate changes:

- Replace `getTargetValueFamily()`, `getProtectedPassages()`, and `getRegionReadout()` with small direct-text fallbacks in `refreshAiCritiqueCopy()`.
- Remove orientation-derived fallback regions/value families from `normalizeInProcessCritique()` and `normalizeFinishedCritique()`.
- Narrow `normalizeSemanticInterpretation()` to Reference Ideation fields actually displayed or sent to mockup.
- Remove `sourceFallback` copy for workflows that no longer render local fallback critique.

Estimated risk: **Moderate**

Manual validation checklist:

- Test with complete Gemini responses.
- Test with partial Gemini responses missing optional fields.
- Test In-Process and Finished Painting when Gemini returns valid JSON but omits `regions` and `valueFamilies`.
- Test failed Gemini calls; UI should show unavailable state rather than fake critique.
- Generate mockup after Reference Ideation with and without complete ideation fields.

Recommended automated validation before this stage:

- Add lightweight fixtures or dev-only tests for `normalize*Critique()` inputs and expected UI-safe outputs.

### Stage 3: Deeper Architectural Simplifications

Goal: align names and docs with the product's AI-native architecture after runtime dead paths are gone.

Files affected:

- `app.js`
- `server/semantic-proxy.js`
- `README.md`
- `docs/brief.md`
- `docs/roadmap.md`
- `docs/decisions.md`
- possibly issue files or a new architecture note

Candidate changes:

- Rename "semantic" concepts to "analysis", "ideation", or "critique" where appropriate.
- Consider replacing `/api/semantic` with `/api/reference-ideation` while preserving a compatibility shim for one release/pass.
- Align frontend and backend invalid workflow defaults.
- Narrow server recovery fields after parser fixtures exist.
- Mark older OpenAI/BYO-key/mask/edit-history docs as superseded by the Gemini proxy workflow, or add a current architecture document that future work treats as canonical.

Estimated risk: **Moderate to high**

Manual validation checklist:

- Same workflow checks as Stage 1.
- Verify local static frontend port `8081` still routes API calls to proxy `8080`.
- Verify same-origin proxy serving still works at `http://127.0.0.1:8080`.
- Verify any `localStorage["aps:semanticEndpoint"]` override behavior is either migrated or intentionally removed.

## Explicit DO NOT REMOVE YET

Do not remove these during the first cleanup pass:

- Core upload/image state: `image`, `wipImage`, `finishedImage`, `fileToBase64()`, `createImageBitmap` flow.
- Base canvas renderer: `renderCanvas()` image drawing and resize-fit logic.
- Mockup workflow: UI, state, `/api/mockup`, `callGeminiMockupPass()`, original/mockup toggle.
- Optional context image plumbing: `addOptionalContextImages()` and `dataUrlToImagePayload()`.
- Gemini workflow routes: `/api/semantic`, `/api/in-process`, `/api/finished-critique`.
- Server body/MIME/CORS/static hosting helpers.
- Server JSON parsing and recovery until fixtures exist.
- Reference Ideation fallback object until a replacement unavailable-state UX and mockup prompt fallback are designed.
- Knowledge-base doctrine docs. They are conceptual source material, not runtime deterministic code.

## Notes On What Was Not Found

I did not find active runtime implementations of:

- grayscale conversion
- notan generation
- value masks
- histogram analysis
- edge detection
- thresholding/posterization
- mask drawing or brush UI
- `getImageData()` / `putImageData()` pixel-processing loops
- OpenAI image-edit calls
- deterministic region resolver for masks/bounding boxes

Those concepts remain in planning and knowledge-base documents, but not as active app code.

## Recommended Next Cleanup Commit Shape

When removal begins, keep the first commit narrow:

1. Remove only the legacy stepped critique UI and hard-coded overlay renderer.
2. Do not touch Gemini prompts, endpoints, parser recovery, mockup logic, or upload state.
3. Run the syntax checks plus a manual smoke pass across all three workflows.

This gives the product an immediate simplification win without endangering the working AI-native paths.
