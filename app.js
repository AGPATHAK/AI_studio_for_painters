/* ==========================================================================
   AI Painter Studio — app.js
   Minimal critique loop prototype: upload, one value diagnosis,
   one semantic scene read, one quiet scope overlay, one demonstration,
   one repaint handoff.
   ========================================================================== */

'use strict';

/* ── State ────────────────────────────────────────────────────────────────
   Defined per SOP §8 state-model discipline.

   loadedImage:
     Session-state key:  window.appState.image (in-memory, not persisted)
     Type:               { bitmap: ImageBitmap|null, srcUrl: string|null,
                           filename: string|null }
     Default:            all nulls
     Invalid fallback:   discard, show empty-state placeholder

   themeMode:
     Session-state key:  localStorage["aps:theme"]
     Type:               "light" | "dark"
     Default:            match prefers-color-scheme; fall back to "light"
     Invalid fallback:   "light"
   ───────────────────────────────────────────────────────────────────────── */
const appState = {
  image: {
    bitmap:   null,   // ImageBitmap | null
    srcUrl:   null,   // ObjectURL string | null
    filename: null,   // original filename | null
    file:     null    // original File object | null, retained only for mode reruns
  },
  workflowMode: 'reference-ideation',
  semantic: null,       // narrowly scoped scene labels and value-family hints
  semanticStatus: {
    source: 'none',     // none | gemini | fallback
    state: 'unavailable'
  },
  semanticRequestId: 0,
  critiqueStep: 'idle'  // idle | diagnosis | scope | demo | repaint
};

/* ── DOM refs ─────────────────────────────────────────────────────────────── */
const fileInput   = document.getElementById('file-input');
const uploadBtn   = document.getElementById('upload-btn');
const resetBtn    = document.getElementById('reset-btn');
const critiqueBtn = document.getElementById('critique-btn');
const themeBtn    = document.getElementById('theme-btn');
const workflowModeSelect = document.getElementById('workflow-mode');
const canvas      = document.getElementById('main-canvas');
const emptyState  = document.getElementById('empty-state');
const critiquePanel   = document.getElementById('critique-panel');
const panelKicker = critiquePanel?.querySelector('.panel-kicker');
const panelTitle = critiquePanel?.querySelector('.panel-title');
const critiqueMessage = document.getElementById('critique-message');
const semanticSource  = document.getElementById('semantic-source');
const aiCritiqueSection = document.getElementById('ai-critique-section');
const aiSceneItem = document.getElementById('ai-scene-item');
const aiSceneRead = document.getElementById('ai-scene-read');
const aiValueItem = document.getElementById('ai-value-item');
const aiValueCritique = document.getElementById('ai-value-critique');
const aiEdgeItem = document.getElementById('ai-edge-item');
const aiEdgeCritique = document.getElementById('ai-edge-critique');
const aiScopeItem = document.getElementById('ai-scope-item');
const aiScope = document.getElementById('ai-scope');
const aiDemoItem = document.getElementById('ai-demo-item');
const aiDemo = document.getElementById('ai-demo');
const aiRepaintItem = document.getElementById('ai-repaint-item');
const aiRepaint = document.getElementById('ai-repaint');
const aiPreserveItem = document.getElementById('ai-preserve-item');
const aiPreserve = document.getElementById('ai-preserve');
const aiAvoidItem = document.getElementById('ai-avoid-item');
const aiAvoid = document.getElementById('ai-avoid');
const aiUncertaintyItem = document.getElementById('ai-uncertainty-item');
const aiUncertainty = document.getElementById('ai-uncertainty');
const semanticSection = document.getElementById('semantic-section');
const semanticCopy    = document.getElementById('semantic-copy');
const scopeSection    = document.getElementById('scope-section');
const scopeCopy       = document.getElementById('scope-copy');
const demoSection     = document.getElementById('demo-section');
const demoCopy        = document.getElementById('demo-copy');
const repaintSection  = document.getElementById('repaint-section');
const repaintList     = document.getElementById('repaint-list');
const nextStepBtn     = document.getElementById('next-step-btn');

// Guard: abort early if any required element is missing (catches future renames)
if (!fileInput || !uploadBtn || !resetBtn || !critiqueBtn || !themeBtn ||
    !workflowModeSelect ||
    !canvas || !emptyState || !critiquePanel || !panelKicker ||
    !panelTitle || !critiqueMessage ||
    !semanticSource || !aiCritiqueSection || !aiSceneItem ||
    !aiSceneRead || !aiValueItem || !aiValueCritique || !aiEdgeItem ||
    !aiEdgeCritique || !aiScopeItem || !aiScope || !aiDemoItem ||
    !aiDemo || !aiRepaintItem || !aiRepaint || !aiPreserveItem ||
    !aiPreserve || !aiAvoidItem || !aiAvoid || !aiUncertaintyItem ||
    !aiUncertainty || !semanticSection || !semanticCopy ||
    !scopeSection || !scopeCopy || !demoSection || !demoCopy ||
    !repaintSection || !repaintList || !nextStepBtn) {
  console.error('APS: one or more required DOM elements not found.');
}

const ctx = canvas.getContext('2d');

const WORKFLOW_MODES = {
  REFERENCE_IDEATION: 'reference-ideation',
  IN_PROGRESS_GUIDANCE: 'in-progress-guidance',
  FINISHED_REVIEW: 'finished-review'
};

const WORKFLOW_COPY = {
  [WORKFLOW_MODES.REFERENCE_IDEATION]: {
    kicker: 'Reference ideation',
    title: 'Painterly possibilities',
    empty: 'Upload a reference photograph to explore painterly possibilities.',
    ready: 'Reference structure is ready. Run ideation when you want painterly directions.',
    action: 'Run ideation',
    sourceReady: 'Semantic source: Gemini Vision - ideation pass succeeded',
    sourceFallback: 'Semantic source: Local fallback interpretation - ideation fallback used',
    sourceUnavailable: 'Semantic source: Local fallback interpretation - ideation unavailable'
  },
  [WORKFLOW_MODES.IN_PROGRESS_GUIDANCE]: {
    kicker: 'In-progress guidance',
    title: 'One visual lesson',
    empty: 'Upload a painting, then run the minimal critique loop.',
    ready: 'Scene structure is labeled. Run the minimal critique loop when ready.',
    action: 'Run critique',
    sourceReady: 'Semantic source: Gemini Vision - guidance pass succeeded',
    sourceFallback: 'Semantic source: Local fallback interpretation - guidance fallback used',
    sourceUnavailable: 'Semantic source: Local fallback interpretation - guidance unavailable'
  },
  [WORKFLOW_MODES.FINISHED_REVIEW]: {
    kicker: 'Finished review',
    title: 'Reflective review',
    empty: 'Upload a finished painting for a lightweight review placeholder.',
    ready: 'Finished Review uses the current guidance behavior for now.',
    action: 'Run review',
    sourceReady: 'Semantic source: Gemini Vision - review placeholder used guidance pass',
    sourceFallback: 'Semantic source: Local fallback interpretation - review fallback used',
    sourceUnavailable: 'Semantic source: Local fallback interpretation - review unavailable'
  }
};

/* ── Theme ────────────────────────────────────────────────────────────────── */

// SVG icons use stroke="currentColor" so they inherit CSS color in both themes.
// Emoji (☀ 🌙) are unreliable: on macOS the system emoji font overrides CSS
// color with its own rendering, making the glyph invisible on dark backgrounds.
const _ICON_SUN  = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" '
  + 'stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">'
  + '<circle cx="12" cy="12" r="5"/>'
  + '<line x1="12" y1="1"  x2="12" y2="3"/>'
  + '<line x1="12" y1="21" x2="12" y2="23"/>'
  + '<line x1="1"  y1="12" x2="3"  y2="12"/>'
  + '<line x1="21" y1="12" x2="23" y2="12"/>'
  + '<line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"/>'
  + '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>'
  + '<line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>'
  + '<line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>'
  + '</svg>';

const _ICON_MOON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" '
  + 'stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">'
  + '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
  + '</svg>';

/**
 * Apply a theme mode to the document and persist it.
 * @param {string} mode  "light" | "dark" — anything else coerces to "light"
 */
function applyTheme(mode) {
  const safe = (mode === 'dark') ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', safe);
  // innerHTML instead of textContent so the SVG is parsed as markup
  themeBtn.innerHTML = (safe === 'dark') ? _ICON_SUN : _ICON_MOON;
  themeBtn.title     = (safe === 'dark')
    ? 'Switch to light theme'
    : 'Switch to dark theme';
  themeBtn.setAttribute('aria-label',
    (safe === 'dark') ? 'Switch to light theme' : 'Switch to dark theme');
  localStorage.setItem('aps:theme', safe);
}

/**
 * Read stored theme or system preference; apply before first paint.
 * Called synchronously before DOM is shown to avoid a flash.
 */
function initTheme() {
  const stored = localStorage.getItem('aps:theme');
  if (stored === 'dark' || stored === 'light') {
    applyTheme(stored);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
  // Enable CSS transitions only after first theme is set, preventing FOUC
  requestAnimationFrame(() => {
    document.body.classList.add('transitions-ready');
  });
}

themeBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ── Semantic interpretation ──────────────────────────────────────────────── */

const DEFAULT_SEMANTIC_INTERPRETATION = {
  source: 'fallback',
  sceneSummary: 'landscape with sky, distant land, water, and foreground growth',
  regions: [
    { id: 'sky', label: 'sky opening', position: 'upper field' },
    { id: 'distant_land', label: 'distant mountain or far shoreline', position: 'upper mid-ground' },
    { id: 'waterbody', label: 'central waterbody', position: 'middle field' },
    { id: 'shoreline', label: 'shoreline dark accents', position: 'mid-ground band' },
    { id: 'vegetation', label: 'foreground vegetation', position: 'lower field' }
  ],
  valueFamilies: [
    {
      id: 'target_shadow_family',
      label: 'shoreline and water-shadow band',
      role: 'dominant shadow family',
      position: 'mid-ground',
      regionIds: ['shoreline', 'waterbody']
    }
  ],
  primaryIssue: '',
  critiqueTarget: 'shoreline and water-shadow band',
  protectedPassages: ['sky opening', 'main light shape', 'fresh outer washes'],
  dominantRead: 'A broad light field, a middle value band, and a darker foreground can become the painting\'s main structure.',
  valueMasses: 'Group the scene into three or four large value families before considering detail.',
  atmosphereOpportunities: 'Let distance soften, merge small shapes, and keep edges quiet outside the focal passage.',
  focalHierarchy: 'Choose one dominant contrast area and let surrounding passages support it.',
  simplificationIdea: 'Use Wesson-like restraint: fewer shapes, broader washes, and accents saved for the final read.',
  paletteDirection: 'Start with a restrained warm/cool relationship instead of chasing local color.',
  cropIdeas: 'Test a tighter crop that removes weak margins and gives the main light/dark relationship more authority.',
  moodPossibilities: 'Consider calm atmospheric understatement before pushing drama.',
  suppress: 'Suppress incidental detail, equal contrast, and hard edges outside the main idea.',
  emphasize: 'Emphasize the largest value relationship, the cleanest silhouette, and one focal transition.',
  abstractionOpportunities: 'Translate repeated small forms into linked shapes and broken-edge passages.'
};

const SEMANTIC_INTERPRETATION_PROMPT = [
  'Identify only scene regions and connected shadow/value families.',
  'Do not critique, improve, generate, beautify, or prescribe edits.',
  'Return concise JSON: sceneSummary, regions[{id,label,position}],',
  'valueFamilies[{id,label,role,position,regionIds}], protectedPassages[].'
].join(' ');

function getSemanticEndpoint() {
  return localStorage.getItem('aps:semanticEndpoint') || '/api/semantic';
}

function getWorkflowMode() {
  return Object.values(WORKFLOW_MODES).includes(appState.workflowMode)
    ? appState.workflowMode
    : WORKFLOW_MODES.REFERENCE_IDEATION;
}

function isReferenceIdeationMode() {
  return getWorkflowMode() === WORKFLOW_MODES.REFERENCE_IDEATION;
}

function getWorkflowCopy() {
  return WORKFLOW_COPY[getWorkflowMode()] || WORKFLOW_COPY[WORKFLOW_MODES.REFERENCE_IDEATION];
}

function normalizeSemanticInterpretation(raw, bitmap) {
  const fallback = getFallbackSemanticInterpretation(bitmap);
  const safe = (raw && typeof raw === 'object') ? raw : {};
  const regions = Array.isArray(safe.regions) && safe.regions.length
    ? safe.regions.map((region, index) => ({
      id: String(region.id || `region_${index + 1}`),
      label: String(region.label || fallback.regions[index]?.label || 'scene region'),
      position: String(region.position || fallback.regions[index]?.position || 'within the painting')
    }))
    : fallback.regions;

  const valueFamilies = Array.isArray(safe.valueFamilies) && safe.valueFamilies.length
    ? safe.valueFamilies.map((family, index) => ({
      id: String(family.id || `value_family_${index + 1}`),
      label: String(family.label || fallback.valueFamilies[index]?.label || 'connected shadow family'),
      role: String(family.role || fallback.valueFamilies[index]?.role || 'value family'),
      position: String(family.position || fallback.valueFamilies[index]?.position || 'mid-ground'),
      regionIds: Array.isArray(family.regionIds) ? family.regionIds.map(String) : []
    }))
    : fallback.valueFamilies;

  return {
    source: safe.source || 'gemini',
    priorityDiagnosis: String(safe.priorityDiagnosis || ''),
    sceneRead: String(safe.sceneRead || ''),
    valueStructureCritique: String(safe.valueStructureCritique || ''),
    edgeAtmosphereCritique: String(safe.edgeAtmosphereCritique || ''),
    interventionScope: String(safe.interventionScope || ''),
    demonstrationDescription: String(safe.demonstrationDescription || ''),
    repaintHandoff: String(safe.repaintHandoff || ''),
    preserve: String(safe.preserve || ''),
    avoid: String(safe.avoid || ''),
    uncertaintyNote: String(safe.uncertaintyNote || ''),
    dominantRead: String(safe.dominantRead || fallback.dominantRead || safe.sceneRead || safe.sceneSummary || ''),
    valueMasses: String(safe.valueMasses || fallback.valueMasses || safe.valueStructureCritique || ''),
    atmosphereOpportunities: String(safe.atmosphereOpportunities || fallback.atmosphereOpportunities || safe.edgeAtmosphereCritique || ''),
    focalHierarchy: String(safe.focalHierarchy || fallback.focalHierarchy || ''),
    simplificationIdea: String(safe.simplificationIdea || fallback.simplificationIdea || safe.demonstrationDescription || ''),
    paletteDirection: String(safe.paletteDirection || fallback.paletteDirection || ''),
    cropIdeas: String(safe.cropIdeas || fallback.cropIdeas || ''),
    moodPossibilities: String(safe.moodPossibilities || fallback.moodPossibilities || ''),
    suppress: String(safe.suppress || fallback.suppress || safe.avoid || ''),
    emphasize: String(safe.emphasize || fallback.emphasize || safe.preserve || ''),
    abstractionOpportunities: String(safe.abstractionOpportunities || fallback.abstractionOpportunities || ''),
    sceneSummary: String(safe.sceneSummary || fallback.sceneSummary),
    regions,
    valueFamilies,
    primaryIssue: String(safe.primaryIssue || fallback.primaryIssue || ''),
    critiqueTarget: String(safe.critiqueTarget || fallback.critiqueTarget || valueFamilies[0].label),
    protectedPassages: Array.isArray(safe.protectedPassages) && safe.protectedPassages.length
      ? safe.protectedPassages.map(String)
      : fallback.protectedPassages,
    repaintFirstAction: String(safe.repaintFirstAction || fallback.repaintFirstAction || ''),
    repaintPreserve: Array.isArray(safe.repaintPreserve) && safe.repaintPreserve.length
      ? safe.repaintPreserve.map(String)
      : [],
    repaintCaution: String(safe.repaintCaution || fallback.repaintCaution || ''),
    uncertaintyNotes: Array.isArray(safe.uncertaintyNotes) && safe.uncertaintyNotes.length
      ? safe.uncertaintyNotes.map(String)
      : []
  };
}

function getFallbackSemanticInterpretation(bitmap) {
  const interpretation = JSON.parse(JSON.stringify(DEFAULT_SEMANTIC_INTERPRETATION));
  if (bitmap && bitmap.height > bitmap.width * 1.15) {
    interpretation.sceneSummary = 'vertical scene with upper background, central subject mass, and lower shadow base';
    interpretation.regions = [
      { id: 'upper_background', label: 'upper background plane', position: 'upper field' },
      { id: 'central_subject', label: 'central subject mass', position: 'middle field' },
      { id: 'lower_base', label: 'lower base shadow', position: 'lower field' }
    ];
    interpretation.valueFamilies = [
      {
        id: 'target_shadow_family',
        label: 'central subject and lower-base shadow family',
        role: 'dominant shadow family',
        position: 'middle-to-lower passage',
        regionIds: ['central_subject', 'lower_base']
      }
    ];
  }
  return interpretation;
}

async function requestSemanticInterpretation(file, bitmap, requestId) {
  console.log(`APS: semantic pass start #${requestId}`);
  const fallback = getFallbackSemanticInterpretation(bitmap);
  const endpoint = getSemanticEndpoint();
  const workflowMode = getWorkflowMode();

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 45000);

  try {
    const imageData = await fileToBase64(file);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageData,
        mimeType: file.type,
        filename: file.name,
        workflowMode,
        purpose: 'scene_regions_and_value_families_only',
        prompt: SEMANTIC_INTERPRETATION_PROMPT
      }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`semantic endpoint returned ${response.status}`);
    const payload = await response.json();
    console.log(`APS: Gemini response received #${requestId}`);
    const semantic = normalizeSemanticInterpretation(payload, bitmap);
    console.log(`APS: critique object created #${requestId}`);
    return {
      semantic,
      status: {
        source: semantic.source === 'gemini' ? 'gemini' : 'fallback',
        state: semantic.source === 'gemini' ? 'succeeded' : 'fallback',
        detail: ''
      }
    };
  } catch (err) {
    console.warn(`APS: semantic interpretation fallback used #${requestId}:`, err);
    console.log(`APS: semantic pass fallback #${requestId}`);
    return {
      semantic: fallback,
      status: {
        source: 'fallback',
        state: err.name === 'AbortError' ? 'unavailable' : 'fallback',
        detail: ''
      }
    };
  } finally {
    console.log(`APS: semantic pass complete #${requestId}`);
    window.clearTimeout(timeoutId);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',').pop() : result);
    };
    reader.onerror = () => reject(reader.error || new Error('failed to read image'));
    reader.readAsDataURL(file);
  });
}

function getTargetValueFamily() {
  const semantic = appState.semantic || getFallbackSemanticInterpretation(appState.image.bitmap);
  return semantic.valueFamilies[0];
}

function getProtectedPassages() {
  const semantic = appState.semantic || getFallbackSemanticInterpretation(appState.image.bitmap);
  const passages = semantic.repaintPreserve?.length
    ? semantic.repaintPreserve
    : semantic.protectedPassages;
  return passages.join(', ');
}

function getRegionReadout() {
  const semantic = appState.semantic || getFallbackSemanticInterpretation(appState.image.bitmap);
  return semantic.regions
    .slice(0, 5)
    .map(region => `${region.label} (${region.position})`)
    .join('; ');
}

function refreshSemanticCopy() {
  if (!appState.semantic) {
    semanticCopy.textContent = 'Scene labels will be used only to ground the value critique.';
    return;
  }
  semanticCopy.textContent = `Major regions: ${getRegionReadout()}.`;
}

function refreshSemanticSource() {
  const status = appState.semanticStatus;
  const copy = getWorkflowCopy();
  semanticSource.hidden = (status.source === 'none');

  if (status.source === 'gemini') {
    semanticSource.textContent = copy.sourceReady;
  } else if (status.state === 'unavailable') {
    semanticSource.textContent = copy.sourceUnavailable;
  } else if (status.source === 'fallback') {
    semanticSource.textContent = copy.sourceFallback;
  } else {
    semanticSource.textContent = 'Semantic source: waiting for image';
  }
}

function refreshCritiqueCopy(step) {
  refreshWorkflowChrome();
  if (isReferenceIdeationMode()) {
    refreshReferenceIdeationCopy(step);
    return;
  }

  if (hasAiNativeCritique()) {
    refreshAiCritiqueCopy();
    return;
  }

  const semantic = appState.semantic || getFallbackSemanticInterpretation(appState.image.bitmap);
  const family = getTargetValueFamily();
  const protectedPassages = getProtectedPassages();
  const familyLabel = semantic.critiqueTarget || family.label;
  const familyPosition = family.position;
  const primaryIssue = semantic.primaryIssue || `The dominant shadow structure fragments through the ${familyLabel}, weakening the painting's value cohesion.`;
  const repaintFirstAction = semantic.repaintFirstAction || `Rebuild the ${familyLabel} as one connected value family.`;
  const repaintCaution = semantic.repaintCaution || 'Add accents only after the large shadow mass reads clearly.';

  scopeCopy.textContent = `${familyLabel}, in the ${familyPosition}. ${protectedPassages} stay untouched.`;
  demoCopy.textContent = `A quiet value grouping pass shows how the ${familyLabel} can behave as one calmer mass.`;

  repaintList.replaceChildren(
    makeListItem(repaintFirstAction),
    makeListItem(`Preserve the ${protectedPassages}.`),
    makeListItem(repaintCaution)
  );

  if (step === 'idle') {
    const copy = getWorkflowCopy();
    critiqueMessage.textContent = appState.image.bitmap
      ? copy.ready
      : copy.empty;
    nextStepBtn.textContent = copy.action;
  } else if (step === 'diagnosis') {
    critiqueMessage.textContent = primaryIssue;
    nextStepBtn.textContent = 'Reveal scope';
  } else if (step === 'scope') {
    critiqueMessage.textContent = `One regional intervention is proposed: group the ${familyLabel} while preserving the main light and outer passages.`;
    nextStepBtn.textContent = 'Show demonstration';
  } else if (step === 'demo') {
    critiqueMessage.textContent = `The demonstration quietly groups the ${familyPosition} values. It is a study aid, not a finished correction.`;
    nextStepBtn.textContent = 'Repaint guidance';
  } else if (step === 'repaint') {
    critiqueMessage.textContent = `Return to the painting with one task: ${trimTerminalPunctuation(lowercaseFirst(repaintFirstAction))}.`;
    nextStepBtn.textContent = 'Repaint next';
  }
}

function refreshWorkflowChrome() {
  const copy = getWorkflowCopy();
  critiquePanel.dataset.workflow = getWorkflowMode();
  panelKicker.textContent = copy.kicker;
  panelTitle.textContent = copy.title;
  critiqueBtn.textContent = isReferenceIdeationMode() ? 'Idea' : 'Crit';
}

function refreshReferenceIdeationCopy(step) {
  if (!appState.image.bitmap) {
    critiqueMessage.textContent = getWorkflowCopy().empty;
    aiCritiqueSection.hidden = true;
    nextStepBtn.hidden = true;
    return;
  }

  const ideation = appState.semantic || getFallbackSemanticInterpretation(appState.image.bitmap);
  const hasGeminiIdeation = appState.semanticStatus.source === 'gemini';
  const dominantRead = ideation.dominantRead || ideation.sceneRead || ideation.sceneSummary;
  const valueMasses = ideation.valueMasses || ideation.valueStructureCritique;
  const atmosphere = ideation.atmosphereOpportunities || ideation.edgeAtmosphereCritique;
  const compositionIdeas = [
    ideation.cropIdeas,
    ideation.focalHierarchy
  ].filter(Boolean).join(' ');
  const simplification = [
    ideation.simplificationIdea,
    ideation.abstractionOpportunities
  ].filter(Boolean).join(' ');
  const paletteMood = [
    ideation.paletteDirection,
    ideation.moodPossibilities
  ].filter(Boolean).join(' ');

  critiqueMessage.textContent = appState.image.bitmap
    ? (hasGeminiIdeation
      ? 'The reference is being treated as raw painting material, not as a work to critique.'
      : getWorkflowCopy().ready)
    : getWorkflowCopy().empty;

  aiCritiqueSection.hidden = false;
  setAiLabel(aiSceneItem, 'Dominant read');
  setAiLabel(aiValueItem, 'Dominant value masses');
  setAiLabel(aiEdgeItem, 'Atmosphere and edge economy');
  setAiLabel(aiScopeItem, 'Crop / composition ideas');
  setAiLabel(aiDemoItem, 'Wesson-esque simplification');
  setAiLabel(aiRepaintItem, 'Palette / mood direction');
  setAiLabel(aiPreserveItem, 'Emphasize');
  setAiLabel(aiAvoidItem, 'Suppress');
  setAiLabel(aiUncertaintyItem, 'Uncertainty');

  setAiItem(aiSceneItem, aiSceneRead, dominantRead);
  setAiItem(aiValueItem, aiValueCritique, valueMasses);
  setAiItem(aiEdgeItem, aiEdgeCritique, atmosphere);
  setAiItem(aiScopeItem, aiScope, compositionIdeas);
  setAiItem(aiDemoItem, aiDemo, simplification);
  setAiItem(aiRepaintItem, aiRepaint, paletteMood);
  setAiItem(aiPreserveItem, aiPreserve, ideation.emphasize || ideation.preserve);
  setAiItem(aiAvoidItem, aiAvoid, ideation.suppress || ideation.avoid);
  setAiItem(aiUncertaintyItem, aiUncertainty, ideation.uncertaintyNote);

  nextStepBtn.hidden = true;
}

function hasAiNativeCritique() {
  return appState.semanticStatus.source === 'gemini' &&
    !!appState.semantic?.priorityDiagnosis;
}

function refreshAiCritiqueCopy() {
  const critique = appState.semantic;
  const family = getTargetValueFamily();
  const protectedPassages = getProtectedPassages();
  const target = critique.critiqueTarget || family.label;
  const sceneRead = critique.sceneRead || critique.sceneSummary || getRegionReadout();
  const valueCritique = critique.valueStructureCritique || critique.primaryIssue || critique.priorityDiagnosis;
  const scope = critique.interventionScope ||
    `${target}, in the ${family.position || 'selected passage'}. ${protectedPassages} stay untouched.`;
  const demo = critique.demonstrationDescription ||
    (target ? `A useful demonstration would simplify ${target} without finishing the painting.` : '');
  const repaint = critique.repaintHandoff || critique.repaintFirstAction;
  const preserve = critique.preserve || protectedPassages;
  const avoid = critique.avoid || critique.repaintCaution;

  setAiLabel(aiSceneItem, 'Scene read');
  setAiLabel(aiValueItem, 'Value structure');
  setAiLabel(aiEdgeItem, 'Edges and atmosphere');
  setAiLabel(aiScopeItem, 'Scope');
  setAiLabel(aiDemoItem, 'Demonstration');
  setAiLabel(aiRepaintItem, 'Repaint handoff');
  setAiLabel(aiPreserveItem, 'Preserve');
  setAiLabel(aiAvoidItem, 'Avoid');
  setAiLabel(aiUncertaintyItem, 'Uncertainty');

  critiqueMessage.textContent = critique.priorityDiagnosis || critique.primaryIssue || valueCritique;
  setAiItem(aiSceneItem, aiSceneRead, sceneRead);
  setAiItem(aiValueItem, aiValueCritique, valueCritique);
  setAiItem(aiEdgeItem, aiEdgeCritique, critique.edgeAtmosphereCritique);
  setAiItem(aiScopeItem, aiScope, scope);
  setAiItem(aiDemoItem, aiDemo, demo);
  setAiItem(aiRepaintItem, aiRepaint, repaint);
  setAiItem(aiPreserveItem, aiPreserve, preserve);
  setAiItem(aiAvoidItem, aiAvoid, avoid);
  setAiItem(aiUncertaintyItem, aiUncertainty, critique.uncertaintyNote);
}

function setAiLabel(container, text) {
  const label = container.querySelector('.section-label');
  if (label) label.textContent = text;
}

function setAiItem(container, copy, text) {
  const cleaned = String(text || '').trim();
  copy.textContent = cleaned;
  container.hidden = !cleaned;
}

function makeListItem(text) {
  const item = document.createElement('li');
  item.textContent = text;
  return item;
}

function lowercaseFirst(text) {
  if (!text) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function trimTerminalPunctuation(text) {
  return String(text || '').replace(/[.!?]\s*$/, '');
}

/* ── Canvas render ────────────────────────────────────────────────────────── */

/**
 * Render an ImageBitmap into the canvas, filling the container while
 * preserving the source aspect ratio.  Never upscales beyond 1:1.
 * @param {ImageBitmap} bitmap
 */
function renderCanvas(bitmap) {
  if (!bitmap) return;

  const container = canvas.parentElement;
  const cw = container.clientWidth;
  const ch = container.clientHeight;

  // Scale to fit, preserving aspect ratio, no upscaling beyond native size
  const scaleToFit  = Math.min(cw / bitmap.width, ch / bitmap.height);
  const scale       = Math.min(scaleToFit, 1);           // no upscale
  const drawW       = Math.round(bitmap.width  * scale);
  const drawH       = Math.round(bitmap.height * scale);

  // Resize canvas backing store to match draw dimensions
  canvas.width  = drawW;
  canvas.height = drawH;

  ctx.clearRect(0, 0, drawW, drawH);
  ctx.drawImage(bitmap, 0, 0, drawW, drawH);

  if (appState.critiqueStep === 'scope') {
    drawScopeOverlay();
  } else if (appState.critiqueStep === 'demo' ||
             appState.critiqueStep === 'repaint') {
    drawDemonstrationOverlay();
  }
}

function getCritiqueRegion() {
  return {
    x: Math.round(canvas.width * 0.18),
    y: Math.round(canvas.height * 0.48),
    w: Math.round(canvas.width * 0.64),
    h: Math.round(canvas.height * 0.22)
  };
}

function drawRoundedRegion(region, radius) {
  const r = Math.min(radius, region.w / 2, region.h / 2);
  ctx.beginPath();
  ctx.moveTo(region.x + r, region.y);
  ctx.lineTo(region.x + region.w - r, region.y);
  ctx.quadraticCurveTo(region.x + region.w, region.y, region.x + region.w, region.y + r);
  ctx.lineTo(region.x + region.w, region.y + region.h - r);
  ctx.quadraticCurveTo(region.x + region.w, region.y + region.h, region.x + region.w - r, region.y + region.h);
  ctx.lineTo(region.x + r, region.y + region.h);
  ctx.quadraticCurveTo(region.x, region.y + region.h, region.x, region.y + region.h - r);
  ctx.lineTo(region.x, region.y + r);
  ctx.quadraticCurveTo(region.x, region.y, region.x + r, region.y);
  ctx.closePath();
}

function drawScopeOverlay() {
  const region = getCritiqueRegion();
  ctx.save();
  drawRoundedRegion(region, 18);
  ctx.fillStyle = 'rgba(124, 92, 74, 0.10)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(124, 92, 74, 0.55)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.stroke();
  ctx.restore();
}

function drawDemonstrationOverlay() {
  const region = getCritiqueRegion();
  ctx.save();
  drawRoundedRegion(region, 18);
  ctx.clip();
  ctx.fillStyle = 'rgba(62, 55, 48, 0.18)';
  ctx.fillRect(region.x, region.y, region.w, region.h);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(118, 100, 82, 0.18)';
  ctx.fillRect(region.x, region.y, region.w, region.h);
  ctx.restore();

  ctx.save();
  drawRoundedRegion(region, 18);
  ctx.strokeStyle = 'rgba(124, 92, 74, 0.38)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

/* ── View helpers ─────────────────────────────────────────────────────────── */

function showCanvas() {
  canvas.hidden       = false;
  emptyState.hidden   = true;
  resetBtn.disabled   = false;
  critiqueBtn.disabled = false;
  nextStepBtn.disabled = false;
}

function showEmptyState() {
  canvas.hidden       = true;
  emptyState.hidden   = false;
  resetBtn.disabled   = true;
  critiqueBtn.disabled = true;
  nextStepBtn.disabled = true;
  canvas.width        = 0;
  canvas.height       = 0;
  setCritiqueStep('idle');
}

function setCritiqueStep(step) {
  console.log(`APS: critique render trigger: ${step}`);
  appState.critiqueStep = step;

  const useAiCritique = isReferenceIdeationMode() || hasAiNativeCritique();
  aiCritiqueSection.hidden = !useAiCritique;
  semanticSection.hidden = useAiCritique || !(step === 'diagnosis' || step === 'scope' ||
                                              step === 'demo' || step === 'repaint');
  scopeSection.hidden = useAiCritique || !(step === 'scope' || step === 'demo' || step === 'repaint');
  demoSection.hidden = useAiCritique || !(step === 'demo' || step === 'repaint');
  repaintSection.hidden = useAiCritique || (step !== 'repaint');

  critiquePanel.dataset.step = step;

  refreshSemanticCopy();
  refreshSemanticSource();
  refreshCritiqueCopy(step);

  nextStepBtn.hidden = useAiCritique;
  nextStepBtn.disabled = !appState.image.bitmap || step === 'repaint';

  if (appState.image.bitmap) {
    renderCanvas(appState.image.bitmap);
  }
  console.log(`APS: critique render complete: ${step}${useAiCritique ? ' (Gemini)' : ' (fallback)'}`);
}

function advanceCritiqueLoop() {
  if (!appState.image.bitmap) return;

  if (appState.critiqueStep === 'idle') {
    setCritiqueStep('diagnosis');
  } else if (appState.critiqueStep === 'diagnosis') {
    setCritiqueStep('scope');
  } else if (appState.critiqueStep === 'scope') {
    setCritiqueStep('demo');
  } else if (appState.critiqueStep === 'demo') {
    setCritiqueStep('repaint');
  }
}

async function rerunWorkflowAnalysis() {
  if (!appState.image.bitmap || !appState.image.file) {
    setCritiqueStep(appState.image.bitmap ? 'diagnosis' : 'idle');
    return;
  }

  const requestId = appState.semanticRequestId + 1;
  const bitmap = appState.image.bitmap;
  const file = appState.image.file;
  appState.semanticRequestId = requestId;
  appState.semantic = null;
  appState.semanticStatus = { source: 'none', state: 'unavailable' };
  appState.critiqueStep = 'idle';
  setCritiqueStep('idle');

  const semanticResult = await requestSemanticInterpretation(file, bitmap, requestId);
  if (requestId !== appState.semanticRequestId || bitmap !== appState.image.bitmap) {
    console.log(`APS: stale workflow result ignored #${requestId}`);
    return;
  }

  appState.semantic = semanticResult.semantic;
  appState.semanticStatus = semanticResult.status;
  setCritiqueStep('diagnosis');
}

/* ── File upload ──────────────────────────────────────────────────────────── */

// Clicking Upload triggers the hidden file input
uploadBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', async () => {
  console.log('APS: upload event fired');
  const file = fileInput.files[0];
  if (!file) return;
  const requestId = appState.semanticRequestId + 1;
  appState.semanticRequestId = requestId;

  // Revoke any previous ObjectURL to free memory
  if (appState.image.srcUrl) {
    URL.revokeObjectURL(appState.image.srcUrl);
    appState.image.srcUrl = null;
  }

  const url = URL.createObjectURL(file);

  try {
    const bitmap = await createImageBitmap(file);
    if (requestId !== appState.semanticRequestId) {
      bitmap.close();
      URL.revokeObjectURL(url);
      fileInput.value = '';
      console.log(`APS: stale upload ignored #${requestId}`);
      return;
    }

    appState.image.bitmap   = bitmap;
    appState.image.srcUrl   = url;
    appState.image.filename = file.name;
    appState.image.file     = file;
    appState.semantic       = null;
    appState.semanticStatus = { source: 'none', state: 'unavailable' };
    appState.critiqueStep   = 'idle';

    showCanvas();
    renderCanvas(bitmap);
    console.log(`APS: upload complete #${requestId}`);

    const semanticResult = await requestSemanticInterpretation(file, bitmap, requestId);
    if (requestId !== appState.semanticRequestId || bitmap !== appState.image.bitmap) {
      console.log(`APS: stale semantic result ignored #${requestId}`);
      fileInput.value = '';
      return;
    }
    appState.semantic = semanticResult.semantic;
    appState.semanticStatus = semanticResult.status;

    console.log(`APS: critique render trigger from semantic completion #${requestId}`);
    setCritiqueStep('diagnosis');

  } catch (err) {
    console.error('APS: failed to decode image:', err);
    URL.revokeObjectURL(url);
    appState.image = { bitmap: null, srcUrl: null, filename: null, file: null };
    appState.semantic = null;
    appState.semanticStatus = { source: 'none', state: 'unavailable' };
    appState.semanticRequestId += 1;
    appState.critiqueStep = 'idle';
    showEmptyState();
  }

  // Reset input value so re-uploading the same file fires the change event
  fileInput.value = '';
});

/* ── Reset ────────────────────────────────────────────────────────────────── */

resetBtn.addEventListener('click', () => {
  if (appState.image.bitmap) {
    appState.image.bitmap.close();   // release GPU/memory
  }
  if (appState.image.srcUrl) {
    URL.revokeObjectURL(appState.image.srcUrl);
  }
  appState.image = { bitmap: null, srcUrl: null, filename: null, file: null };
  appState.semantic = null;
  appState.semanticStatus = { source: 'none', state: 'unavailable' };
  appState.semanticRequestId += 1;
  appState.critiqueStep = 'idle';
  showEmptyState();
});

critiqueBtn.addEventListener('click', () => {
  if (!appState.image.bitmap) return;
  rerunWorkflowAnalysis();
});

nextStepBtn.addEventListener('click', advanceCritiqueLoop);

workflowModeSelect.addEventListener('change', () => {
  appState.workflowMode = workflowModeSelect.value;
  rerunWorkflowAnalysis();
});

/* ── Resize re-fit ────────────────────────────────────────────────────────── */

let _resizeTimer = null;

window.addEventListener('resize', () => {
  if (_resizeTimer) clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    if (appState.image.bitmap) {
      renderCanvas(appState.image.bitmap);
    }
  }, 80);   // debounce — enough for smooth drag-resize
});

/* ── Initialise ───────────────────────────────────────────────────────────── */

initTheme();
workflowModeSelect.value = getWorkflowMode();
showEmptyState();
