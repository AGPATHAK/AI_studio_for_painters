# Stage 2 Semantic Cleanup Plan

Date: 2026-05-28

Scope: investigation and planning only. No runtime cleanup was performed in this pass.

## Executive Summary

Stage 1 removed the unreachable stepped critique UI and deterministic overlays. The remaining deterministic machinery is now concentrated in the semantic fallback and normalization layer.

The key finding: `regions`, `valueFamilies`, `critiqueTarget`, `protectedPassages`, and old repaint template fields are no longer product primitives for the current AI-native UI. They mostly exist to keep `refreshAiCritiqueCopy()` from producing empty fields when Gemini omits direct text. Reference Ideation is the exception: it still uses `DEFAULT_SEMANTIC_INTERPRETATION` as a visible fallback and as backup prompt material for Annotated Mockups.

The safest Stage-2 cleanup should not start by deleting `DEFAULT_SEMANTIC_INTERPRETATION`. It should first make `refreshAiCritiqueCopy()` and mockup prompt construction null-safe without synthetic semantic families. Once those dependencies are gone, the fake orientation-derived region/value-family machinery becomes straightforward to remove.

## Live Dependency Trace

### `DEFAULT_SEMANTIC_INTERPRETATION`

Current callers:

- `getFallbackSemanticInterpretation(bitmap)` clones it.
- Indirectly used by `requestSemanticInterpretation()` when Reference Ideation Gemini fails.
- Indirectly used by `refreshReferenceIdeationCopy()` when no semantic object exists or fallback status is active.
- Indirectly used by `requestAnnotatedMockup()` when no `appState.semantic` exists.
- Indirectly used by `getTargetValueFamily()`, `getProtectedPassages()`, and `getRegionReadout()`.

Fields actually consumed:

- Reference Ideation visible panel: `dominantRead`, `sceneRead`, `sceneSummary`, `valueMasses`, `valueStructureCritique`, `atmosphereOpportunities`, `edgeAtmosphereCritique`, `cropIdeas`, `focalHierarchy`, `simplificationIdea`, `abstractionOpportunities`, `paletteDirection`, `moodPossibilities`, `emphasize`, `preserve`, `suppress`, `avoid`, `uncertaintyNote`.
- Mockup prompt fallback: `dominantRead`, `valueMasses`, `atmosphereOpportunities`, `focalHierarchy`, `simplificationIdea`, `cropIdeas`, `paletteDirection`, `suppress`, `emphasize`, `abstractionOpportunities`.
- AI critique fallback helpers: `valueFamilies`, `critiqueTarget`, `protectedPassages`, `repaintPreserve`, `regions`.

Classification:

- Still needed for Reference Ideation fallback UX and mockup fallback until replacement is designed.
- Semantic fields like `regions`, `valueFamilies`, `critiqueTarget`, `protectedPassages` are deterministic leftovers inside the object.

Null-safe simplification possible:

- Yes. Split the current fallback into a small Reference Ideation fallback object and stop using it as a generic critique fallback for In-Process/Finished.

### `getFallbackSemanticInterpretation(bitmap)`

Current callers:

- `normalizeSemanticInterpretation(raw, bitmap)`
- `requestSemanticInterpretation(file, bitmap, requestId)`
- `getTargetValueFamily()`
- `getProtectedPassages()`
- `getRegionReadout()`
- `refreshReferenceIdeationCopy()`
- `requestAnnotatedMockup()`

Fields actually consumed:

- Same as `DEFAULT_SEMANTIC_INTERPRETATION`.
- Its only behavior beyond cloning is orientation-derived fake `sceneSummary`, `regions`, and `valueFamilies` for tall images.

Classification:

- Partly needed for Reference Ideation fallback.
- Orientation-derived fake regions/value families are deterministic leftovers.

Null-safe simplification possible:

- Yes. Replace this with a name like `getFallbackReferenceIdeation(bitmap)` only after `refreshAiCritiqueCopy()` no longer calls helpers that reach this function.

### `normalizeSemanticInterpretation(raw, bitmap)`

Current callers:

- `requestSemanticInterpretation()` for Reference Ideation `/api/semantic`.

Fields actually consumed:

- For Reference Ideation UI: ideation fields listed above.
- For Annotated Mockup prompt: same subset used by `summarizeIdeationForMockup()`.
- Legacy fields returned but not needed for Reference Ideation UI: `regions`, `valueFamilies`, `primaryIssue`, `critiqueTarget`, `protectedPassages`, `repaintFirstAction`, `repaintPreserve`, `repaintCaution`, `uncertaintyNotes`.

Classification:

- Keep a normalizer for Reference Ideation strings.
- Remove old critique/repaint/semantic-label fields after mockup and UI are confirmed to consume only ideation fields.

Null-safe simplification possible:

- Yes. Canonicalize only Reference Ideation fields and `source`.

### `normalizeInProcessCritique(raw, bitmap)`

Current callers:

- `requestInProcessCritique()`.

Fields actually consumed:

- `hasInProcessCritique()`: `priorityDiagnosis`, `sceneRead`, `valueStructureCritique`, `edgeAtmosphereCritique`, `repaintHandoff`.
- `refreshAiCritiqueCopy()`: `priorityDiagnosis`, `primaryIssue`, `sceneRead`, `sceneSummary`, `valueStructureCritique`, `edgeAtmosphereCritique`, `interventionScope`, `demonstrationDescription`, `repaintHandoff`, `repaintFirstAction`, `preserve`, `avoid`, `repaintCaution`, `uncertaintyNote`, plus helper-derived `critiqueTarget`, `valueFamilies`, `protectedPassages`, `regions`.

Deterministic leftovers:

- Orientation-derived `fallbackRegions`.
- Synthetic `valueFamilies` fallback with `current_wip_value_structure`.
- `critiqueTarget` fallback from `valueFamilies[0].label`.
- Default `protectedPassages` of `fresh washes`, `clear light shapes`.
- Repaint-template compatibility fields: `primaryIssue`, `repaintFirstAction`, `repaintPreserve`, `repaintCaution`, `uncertaintyNotes`.

Classification:

- Keep direct AI critique fields.
- Remove synthetic regions/value families after `refreshAiCritiqueCopy()` no longer needs them.

Null-safe simplification possible:

- Yes. Direct display can hide empty optional items instead of manufacturing scope/preserve text.

### `normalizeFinishedCritique(raw, bitmap)`

Current callers:

- `requestFinishedCritique()`.

Fields actually consumed:

- `hasFinishedCritique()`: `priorityDiagnosis`, `sceneRead`, `valueStructureCritique`, `edgeAtmosphereCritique`, `repaintHandoff`.
- `refreshAiCritiqueCopy()`: same set as In-Process.

Deterministic leftovers:

- Orientation-derived `fallbackRegions`.
- Synthetic `valueFamilies` fallback with `finished_value_structure`.
- `critiqueTarget` fallback from `valueFamilies[0].label`.
- Default `protectedPassages` of `resolved passages`, `fresh strongest marks`.
- Repaint-template compatibility fields: `primaryIssue`, `repaintFirstAction`, `repaintPreserve`, `repaintCaution`, `uncertaintyNotes`.

Classification:

- Keep direct AI critique fields.
- Remove synthetic regions/value families after display fallback rewrite.

Null-safe simplification possible:

- Yes. Finished critique should display only model-provided final critique fields and hide missing optional sections.

### `getTargetValueFamily()`

Current callers:

- `refreshAiCritiqueCopy()` only.

Fields consumed:

- `semantic.valueFamilies[0].label`
- `semantic.valueFamilies[0].position`

Classification:

- Removable after helper rewrite.
- It exists only to support old `critiqueTarget`/scope fallback language.

Null-safe simplification possible:

- Yes. `refreshAiCritiqueCopy()` can use `critique.interventionScope` directly and omit the Scope section if it is empty.

### `getProtectedPassages()`

Current callers:

- `refreshAiCritiqueCopy()` only.

Fields consumed:

- `semantic.repaintPreserve`
- `semantic.protectedPassages`

Classification:

- Removable after helper rewrite.
- It exists only to produce fallback text for Preserve/Scope when Gemini omits direct `preserve`.

Null-safe simplification possible:

- Yes. `refreshAiCritiqueCopy()` can display `critique.preserve` only when Gemini supplies it.

### `getRegionReadout()`

Current callers:

- `refreshAiCritiqueCopy()` only.

Fields consumed:

- `semantic.regions[].label`
- `semantic.regions[].position`

Classification:

- Removable after helper rewrite.
- It exists only to manufacture a fallback scene read.

Null-safe simplification possible:

- Yes. `refreshAiCritiqueCopy()` can use `critique.sceneRead || critique.sceneSummary`; if both are empty, hide the Scene/First Read item.

### `sourceFallback` copy paths

Current callers:

- `refreshSemanticSource()` via `copy.sourceFallback` when `appState.semanticStatus.source === 'fallback'`.

Current behavior:

- Reference Ideation can still set `source: fallback` on Gemini failure.
- In-Process and Finished Painting catch failures as `source: none`, `state: unavailable`; their `sourceFallback` strings are probably unreachable in normal current flows unless a future server response returns a non-`gemini` source.

Classification:

- Reference Ideation `sourceFallback`: keep until Reference Ideation fallback UX changes.
- In-Process/Finished `sourceFallback`: likely removable after confirming no code path returns fallback semantic objects for those modes.

Null-safe simplification possible:

- Yes. Make provenance copy explicit by mode and status: Reference Ideation may have fallback; In-Process/Finished are either Gemini, loading, unavailable, or waiting.

### `refreshAiCritiqueCopy()` assumptions

Current assumptions:

- `appState.semantic` is non-null.
- `getTargetValueFamily()` returns a first value family.
- `getProtectedPassages()` returns a usable string.
- `getRegionReadout()` returns a usable fallback scene read.
- Missing direct AI fields should be filled from old semantic/repaint fields.

Actual direct AI fields displayed:

- Header: `priorityDiagnosis || primaryIssue || valueCritique`
- Scene/First read: `sceneRead || sceneSummary || getRegionReadout()`
- Value structure: `valueStructureCritique || primaryIssue || priorityDiagnosis`
- Edge/atmosphere: `edgeAtmosphereCritique`
- Scope/final adjustment scope: `interventionScope || synthetic target/family/protectedPassages sentence`
- Demonstration/resolution test: `demonstrationDescription || synthetic target sentence`
- Repaint/final verdict: `repaintHandoff || repaintFirstAction`
- Preserve: `preserve || protectedPassages`
- Avoid: `avoid || repaintCaution`
- Uncertainty: `uncertaintyNote`

Classification:

- This is the main coupling to remove first.

Null-safe simplification possible:

- Yes. Replace synthetic fallbacks with direct field display:
  - `sceneRead || sceneSummary`
  - `valueStructureCritique || priorityDiagnosis`
  - `interventionScope`
  - `demonstrationDescription`
  - `repaintHandoff`
  - `preserve`
  - `avoid`
  - `uncertaintyNote`
- Let `setAiItem()` hide absent optional fields.
- Let `critiqueMessage` fall back to first available direct critique text or a neutral unavailable message.

### Annotated Mockup prompt dependencies

Current path:

- Frontend `requestAnnotatedMockup()` sends `ideation: appState.semantic || getFallbackSemanticInterpretation(sourceImage.bitmap)`.
- Server `buildAnnotatedMockupPrompt(ideation)` calls `summarizeIdeationForMockup(ideation)`.

Fields consumed by `summarizeIdeationForMockup()`:

- `dominantRead`
- `valueMasses`
- `atmosphereOpportunities`
- `focalHierarchy`
- `simplificationIdea`
- `cropIdeas`
- `paletteDirection`
- `suppress`
- `emphasize`
- `abstractionOpportunities`

Fields not consumed:

- `regions`
- `valueFamilies`
- `sceneSummary`
- `critiqueTarget`
- `protectedPassages`
- all old repaint-template fields

Classification:

- Mockup generation does not need old semantic baggage.
- It does need either real Reference Ideation fields or a non-empty fallback note strategy.

Null-safe simplification possible:

- Yes. Send a minimal ideation object with only the fields above. If no ideation is available, send `{}` and rely on the server's existing no-notes fallback text, or provide a neutral frontend-generated fallback note.

## Minimum Canonical Frontend Shapes

### Reference Ideation

Minimum fields for UI and mockup prompt:

```js
{
  source: 'gemini' | 'fallback',
  workflowMode: 'reference-ideation',
  sceneSummary: string,              // optional UI fallback/context only
  dominantRead: string,
  valueMasses: string,
  atmosphereOpportunities: string,
  focalHierarchy: string,
  simplificationIdea: string,
  paletteDirection: string,
  cropIdeas: string,
  moodPossibilities: string,
  suppress: string,
  emphasize: string,
  abstractionOpportunities: string,
  uncertaintyNote: string
}
```

Notes:

- `sceneSummary` is optional for current UI but harmless as a motif anchor.
- `regions`, `valueFamilies`, `critiqueTarget`, `protectedPassages`, and repaint fields are not needed.

### In-Process Critique

Minimum fields for UI:

```js
{
  source: 'gemini',
  workflowMode: 'in-progress-guidance',
  priorityDiagnosis: string,
  sceneRead: string,
  valueStructureCritique: string,
  edgeAtmosphereCritique: string,
  interventionScope: string,
  demonstrationDescription: string,
  repaintHandoff: string,
  preserve: string,
  avoid: string,
  uncertaintyNote: string
}
```

Optional tolerated fields:

- `sceneSummary` as a fallback for `sceneRead`.

Not needed:

- `regions`
- `valueFamilies`
- `critiqueTarget`
- `protectedPassages`
- `primaryIssue`
- `repaintFirstAction`
- `repaintPreserve`
- `repaintCaution`
- `uncertaintyNotes`

### Finished Painting Critique

Minimum fields for UI:

```js
{
  source: 'gemini',
  workflowMode: 'finished-review',
  priorityDiagnosis: string,
  sceneRead: string,
  valueStructureCritique: string,
  edgeAtmosphereCritique: string,
  interventionScope: string,
  demonstrationDescription: string,
  repaintHandoff: string,
  preserve: string,
  avoid: string,
  uncertaintyNote: string
}
```

Optional tolerated fields:

- `sceneSummary` as a fallback for `sceneRead`.

Not needed:

- same obsolete fields as In-Process.

### Annotated Mockup

Minimum ideation payload:

```js
{
  dominantRead: string,
  valueMasses: string,
  atmosphereOpportunities: string,
  focalHierarchy: string,
  simplificationIdea: string,
  cropIdeas: string,
  paletteDirection: string,
  suppress: string,
  emphasize: string,
  abstractionOpportunities: string
}
```

Notes:

- Server already has a fallback if `summarizeIdeationForMockup()` produces no notes.
- No region/value-family fields are needed for mockup generation.

## Obsolete Semantic Baggage

### `regions`

Status:

- Only used by `getRegionReadout()` to synthesize a fallback scene read.
- Server still normalizes and recovers it, but current prompts/schemas do not require it.

Conclusion:

- Removable after `refreshAiCritiqueCopy()` stops calling `getRegionReadout()`.
- Keep server parser recovery until a later parser-specific cleanup.

### `valueFamilies`

Status:

- Only used by `getTargetValueFamily()` to synthesize scope/demo target text.
- Server can derive it from `critiqueTarget`, but current schemas do not require it.

Conclusion:

- Removable after `refreshAiCritiqueCopy()` stops calling `getTargetValueFamily()`.

### `critiqueTarget`

Status:

- Used only in frontend normalization fallback and `refreshAiCritiqueCopy()` target fallback.
- Server can still recover/normalize it from older payloads.

Conclusion:

- Removable from frontend canonical shape after direct `interventionScope`/`demonstrationDescription` display is trusted.

### `protectedPassages`

Status:

- Used only by `getProtectedPassages()` to synthesize Preserve/Scope text.
- Server currently provides default `['main light shape', 'fresh outer washes']`.

Conclusion:

- Removable from frontend canonical In-Process/Finished shape after `preserve` is displayed directly.
- Reference Ideation fallback object can drop it once no helper needs it.

### Repaint template fields

Fields:

- `primaryIssue`
- `repaintFirstAction`
- `repaintPreserve`
- `repaintCaution`
- `uncertaintyNotes`

Status:

- Compatibility leftovers from older deterministic critique/repaint flow.
- `primaryIssue`, `repaintFirstAction`, and `repaintCaution` are still used as fallback display text in `refreshAiCritiqueCopy()`.

Conclusion:

- Removable after direct AI fields are the only fallback chain.
- Parser recovery may keep them temporarily to avoid weakening recovery.

### Orientation-derived fake regions

Status:

- Present in `getFallbackSemanticInterpretation()`, `normalizeInProcessCritique()`, and `normalizeFinishedCritique()`.
- Not based on image understanding; they only encode tall vs wide layout.

Conclusion:

- Fully removable after helper rewrite.
- This is the clearest deterministic leftover in Stage 2.

## Proposed Replacement / Null-Safe Strategy

1. Keep `setAiItem()` as the primary null-safe display mechanism.
2. Rewrite `refreshAiCritiqueCopy()` to display only direct AI fields and hide missing items:
   - no `getTargetValueFamily()`
   - no `getProtectedPassages()`
   - no `getRegionReadout()`
   - no synthetic scope/demo/preserve sentences
3. Use a neutral `critiqueMessage` fallback:
   - `priorityDiagnosis || valueStructureCritique || sceneRead || repaintHandoff || 'Gemini returned a critique with no displayable text.'`
4. Keep `hasInProcessCritique()` and `hasFinishedCritique()` focused on direct AI fields.
5. Narrow frontend normalizers only after the UI no longer requires synthetic fields.
6. Keep server parser recovery unchanged during Stage 2.

## Recommended Cleanup Order

### Step 1: Rewrite AI Critique Display Fallbacks

Files:

- `app.js`

Change:

- Update `refreshAiCritiqueCopy()` to use direct fields only.
- Remove calls to `getTargetValueFamily()`, `getProtectedPassages()`, and `getRegionReadout()`.

Risk:

- Low to moderate.

Manual validation:

- In-Process complete Gemini response.
- In-Process partial Gemini response missing `interventionScope`, `preserve`, or `avoid`.
- Finished complete Gemini response.
- Finished partial Gemini response missing optional fields.

### Step 2: Remove Frontend Helper Functions

Files:

- `app.js`

Change:

- Remove `getTargetValueFamily()`.
- Remove `getProtectedPassages()`.
- Remove `getRegionReadout()`.

Risk:

- Low after Step 1.

Manual validation:

- Same as Step 1.
- Verify no console errors when Gemini returns sparse but valid critique JSON.

### Step 3: Remove Orientation-Derived In-Process/Finished Fallback Fields

Files:

- `app.js`

Change:

- In `normalizeInProcessCritique()`, stop creating `fallbackRegions` and synthetic `valueFamilies`.
- In `normalizeFinishedCritique()`, stop creating `fallbackRegions` and synthetic `valueFamilies`.
- Remove fallback `critiqueTarget` from those normalizers.
- Remove default `protectedPassages` from those normalizers if no display path needs it.

Risk:

- Moderate if any hidden display path still expects those arrays.

Manual validation:

- Test with Gemini payloads that omit `regions` and `valueFamilies`.
- Test with Gemini payloads that include old extra fields; they should be ignored or harmless.

### Step 4: Narrow Reference Ideation Normalization

Files:

- `app.js`

Change:

- Reduce `normalizeSemanticInterpretation()` to the Reference Ideation canonical shape.
- Keep `sceneSummary` and all visible/mockup ideation fields.
- Remove legacy critique/repaint/semantic-label fields from the returned frontend object.

Risk:

- Moderate because Reference Ideation and mockups share this object.

Manual validation:

- Reference Ideation Gemini success.
- Reference Ideation Gemini failure.
- Mockup generation after Gemini ideation.
- Mockup generation when only fallback/no ideation notes are available.

### Step 5: Replace Generic Fallback Semantic Object With Reference-Ideation Fallback

Files:

- `app.js`

Change:

- Rename conceptually in a narrow way, for example:
  - `DEFAULT_REFERENCE_IDEATION_FALLBACK`
  - `getFallbackReferenceIdeation(bitmap)`
- Keep route names and endpoint names unchanged.
- Remove `regions`, `valueFamilies`, `critiqueTarget`, `protectedPassages`, and repaint fields from the fallback object.
- Preserve visible Reference Ideation fallback fields until product decides that failed Gemini should show no ideation.

Risk:

- Moderate.

Manual validation:

- Reference Ideation with proxy unavailable should still avoid crashes.
- Decide whether fallback text is acceptable or whether UI should show "Gemini unavailable" only.

### Step 6: Clean Up `sourceFallback` Copy

Files:

- `app.js`

Change:

- Keep Reference Ideation fallback provenance while fallback ideation exists.
- Remove or ignore In-Process/Finished `sourceFallback` strings once confirmed unreachable.

Risk:

- Low.

Manual validation:

- Missing API key / proxy unavailable in each workflow.
- Provenance text remains truthful.

## Safe Removals

Safe after Step 1:

- `getTargetValueFamily()`
- `getProtectedPassages()`
- `getRegionReadout()`

Safe after Step 3:

- `fallbackRegions` in `normalizeInProcessCritique()`
- `fallbackRegions` in `normalizeFinishedCritique()`
- synthetic default `valueFamilies` in those two normalizers
- fallback `critiqueTarget` in those two normalizers

Safe after Step 4:

- `regions`, `valueFamilies`, `critiqueTarget`, `protectedPassages`, `primaryIssue`, `repaintFirstAction`, `repaintPreserve`, `repaintCaution`, `uncertaintyNotes` from `normalizeSemanticInterpretation()` frontend return object.

## Risky Removals

Do not remove first:

- `DEFAULT_SEMANTIC_INTERPRETATION`
- `getFallbackSemanticInterpretation()`
- Reference Ideation fallback fields used by the visible UI.
- server `parseSemanticJson()` recovery fields.
- server `normalizeSemanticResponse()` compatibility fields.

Why:

- Reference Ideation fallback and mockup prompt fallback are still live.
- Parser recovery is intentionally out of scope and protects AI-native flows.

## Dependency Graph

```text
Reference upload
  -> requestSemanticInterpretation()
    -> getFallbackSemanticInterpretation() [failure fallback]
    -> normalizeSemanticInterpretation()
      -> fallback object for missing ideation fields
  -> refreshReferenceIdeationCopy()
    -> visible ideation fields
  -> requestAnnotatedMockup()
    -> appState.semantic OR getFallbackSemanticInterpretation()
    -> server summarizeIdeationForMockup()
      -> ideation text fields only

In-Process critique
  -> requestInProcessCritique()
    -> normalizeInProcessCritique()
      -> direct AI fields
      -> synthetic regions/valueFamilies/protectedPassages
  -> refreshAiCritiqueCopy()
    -> direct AI fields
    -> getTargetValueFamily()
    -> getProtectedPassages()
    -> getRegionReadout()

Finished critique
  -> requestFinishedCritique()
    -> normalizeFinishedCritique()
      -> direct AI fields
      -> synthetic regions/valueFamilies/protectedPassages
  -> refreshAiCritiqueCopy()
    -> same helper dependencies as In-Process
```

## Manual Validation Checklist

Run after each Stage-2 implementation step:

- Fresh app load: no missing DOM or console errors.
- Reference Ideation:
  - upload image
  - Gemini success displays ideation fields
  - Gemini unavailable/failure state remains truthful and non-crashing
- Annotated Mockup:
  - generate mockup after Gemini ideation
  - generate/attempt mockup when ideation is missing or fallback-only
  - original/mockup toggle still works
- In-Process:
  - upload WIP only
  - run critique with full Gemini response
  - run critique with missing optional fields if a mock response path/test harness is available
  - verify no synthetic region text appears
- Finished Painting:
  - upload finished image only
  - run critique with full Gemini response
  - run critique with missing optional fields if possible
  - verify final critique labels remain correct
- Reset in every mode.
- Workflow switching with images already loaded.

Required command validation:

```bash
node --check app.js
node --check server/semantic-proxy.js
git diff --check
```

## Explicit DO NOT REMOVE YET

- Do not remove `DEFAULT_SEMANTIC_INTERPRETATION` until Reference Ideation fallback UX is replaced or narrowed.
- Do not remove `getFallbackSemanticInterpretation()` until all non-Reference uses are gone and mockup fallback behavior is decided.
- Do not remove server parser recovery or recovered legacy fields in this stage.
- Do not rename `/api/semantic` or `semantic` route/config names.
- Do not change Gemini prompts/schemas as part of this cleanup unless a later issue explicitly asks for contract revision.
- Do not remove `sourceFallback` for Reference Ideation while fallback ideation remains.
- Do not remove mockup prompt fallback text in `buildAnnotatedMockupPrompt()`.

## Final Recommendation

Start Stage 2 with the display layer, not the data layer. Make `refreshAiCritiqueCopy()` trust direct Gemini fields and hide missing optional sections. Once the UI no longer depends on fake `regions`, `valueFamilies`, and `protectedPassages`, remove those synthetic fields from frontend normalizers. Only then narrow the Reference Ideation fallback object.
