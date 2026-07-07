/* ==========================================================================
   AI Painter Studio — app.js
   AI-assisted painter workflow prototype: upload, analyze with Gemini,
   render critique or ideation, and generate annotated mockups.
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
  wipImage: {
    bitmap:   null,
    srcUrl:   null,
    filename: null,
    file:     null
  },
  finishedImage: {
    bitmap:   null,
    srcUrl:   null,
    filename: null,
    file:     null
  },
  studioCheckImage: {
    bitmap:   null,
    srcUrl:   null,
    filename: null,
    file:     null
  },
  workflowMode: 'reference-ideation',
  semantic: null,       // current AI critique or reference ideation payload
  semanticStatus: {
    source: 'none',     // none | gemini
    state: 'unavailable'
  },
  mockup: {
    status: 'idle',      // idle | loading | succeeded | failed
    bitmap: null,
    imageDataUrl: '',
    notes: '',
    error: ''
  },
  displayMode: 'original', // original | mockup
  semanticRequestId: 0,
  pendingEditRequest: null,  // edit request staged for M3 execution
  correction: {
    status: 'idle',          // idle | loading | succeeded | failed
    bitmap: null,
    imageDataUrl: '',
    error: '',
    sourceCritiqueKey: null
  },
  journal: {
    available: null,   // null = not probed yet | true | false
    entries: [],        // cached /api/journal/list summaries, newest first
    currentEntryId: null
  }
};

/* ── DOM refs ─────────────────────────────────────────────────────────────── */
const fileInput   = document.getElementById('file-input');
const uploadBtn   = document.getElementById('upload-btn');
const resetBtn    = document.getElementById('reset-btn');
const critiqueBtn = document.getElementById('critique-btn');
const themeBtn    = document.getElementById('theme-btn');
const modeTabs = document.querySelectorAll('.mode-tab');
const canvas      = document.getElementById('main-canvas');
const emptyState  = document.getElementById('empty-state');
const canvasToggle = document.getElementById('canvas-toggle');
const showOriginalBtn = document.getElementById('show-original-btn');
const showMockupBtn = document.getElementById('show-mockup-btn');
const showCorrectionBtn = document.getElementById('show-correction-btn');
const showCompareBtn    = document.getElementById('show-compare-btn');
const compareArea          = document.getElementById('compare-area');
const compareOriginalImg   = document.getElementById('compare-original-img');
const compareCorrectionImg = document.getElementById('compare-correction-img');
const critiquePanel   = document.getElementById('critique-panel');
const panelKicker = critiquePanel?.querySelector('.panel-kicker');
const panelTitle = critiquePanel?.querySelector('.panel-title');
const critiqueMessage = document.getElementById('critique-message');
const semanticSource  = document.getElementById('semantic-source');
const mockupBtn = document.getElementById('mockup-btn');
const printBtn  = document.getElementById('print-btn');
const mockupSection = document.getElementById('mockup-section');
const mockupStatus = document.getElementById('mockup-status');
const mockupImage = document.getElementById('mockup-image');
const mockupDownload = document.getElementById('mockup-download');
const aiCritiqueSection = document.getElementById('ai-critique-section');
const stepAnalyseHint  = document.getElementById('step-analyse-hint');
const stepAnnotateHint = document.getElementById('step-annotate-hint');
const aiSceneItem = document.getElementById('ai-scene-item');
const aiSceneRead = document.getElementById('ai-scene-read');
const aiValueItem = document.getElementById('ai-value-item');
const aiValueCritique = document.getElementById('ai-value-critique');
const aiFocalItem = document.getElementById('ai-focal-item');
const aiFocalCritique = document.getElementById('ai-focal-critique');
const aiEdgeItem = document.getElementById('ai-edge-item');
const aiEdgeCritique = document.getElementById('ai-edge-critique');
const aiChromaItem = document.getElementById('ai-chroma-item');
const aiChromaCritique = document.getElementById('ai-chroma-critique');
const aiWatercolorItem = document.getElementById('ai-watercolor-item');
const aiWatercolorHandling = document.getElementById('ai-watercolor-handling');
const aiScopeItem = document.getElementById('ai-scope-item');
const aiScope = document.getElementById('ai-scope');
const aiDemoItem = document.getElementById('ai-demo-item');
const aiDemo = document.getElementById('ai-demo');
const aiTeachingItem = document.getElementById('ai-teaching-item');
const aiTeachingPoint = document.getElementById('ai-teaching-point');
const aiRepaintItem = document.getElementById('ai-repaint-item');
const aiRepaint = document.getElementById('ai-repaint');
const aiPreserveItem = document.getElementById('ai-preserve-item');
const aiPreserve = document.getElementById('ai-preserve');
const aiAvoidItem = document.getElementById('ai-avoid-item');
const aiAvoid = document.getElementById('ai-avoid');
const aiUncertaintyItem = document.getElementById('ai-uncertainty-item');
const aiUncertainty = document.getElementById('ai-uncertainty');
const aiSigningItem = document.getElementById('ai-signing-recommendation-item');
const aiSigningRecommendation = document.getElementById('ai-signing-recommendation');
const aiFinalAdjItem = document.getElementById('ai-final-adjustments-item');
const aiFinalAdjustments = document.getElementById('ai-final-adjustments');
const aiMediaItem = document.getElementById('ai-media-options-item');
const aiMediaOptions = document.getElementById('ai-media-options');
const aiStrengthsItem = document.getElementById('ai-strengths-item');
const aiStrengths = document.getElementById('ai-strengths');
const aiStudyAreasItem = document.getElementById('ai-study-areas-item');
const aiStudyAreas = document.getElementById('ai-study-areas');
const aiNextExplItem = document.getElementById('ai-next-exploration-item');
const aiNextExploration = document.getElementById('ai-next-exploration');
const aiExhibitionItem = document.getElementById('ai-exhibition-note-item');
const aiExhibitionNote = document.getElementById('ai-exhibition-note');
const journalSection = document.getElementById('journal-section');
const journalStatus = document.getElementById('journal-status');
const journalTitleRow = document.getElementById('journal-title-row');
const journalPaintingTitle = document.getElementById('journal-painting-title');
const journalRatingRow = document.getElementById('journal-rating-row');
const journalRatingBtns = document.querySelectorAll('.journal-rating-btn');
const journalNoteRow = document.getElementById('journal-note-row');
const journalNote = document.getElementById('journal-note');

// Guard: abort early if any required element is missing (catches future renames)
if (!fileInput || !uploadBtn || !resetBtn || !critiqueBtn || !themeBtn ||
    !modeTabs.length ||
    !canvas || !emptyState || !canvasToggle || !showOriginalBtn ||
    !showMockupBtn || !showCorrectionBtn || !showCompareBtn ||
    !compareArea || !compareOriginalImg || !compareCorrectionImg ||
    !critiquePanel || !panelKicker || !panelTitle ||
    !critiqueMessage ||
    !semanticSource || !mockupBtn || !printBtn || !mockupSection || !mockupStatus ||
    !mockupImage || !mockupDownload ||
    !aiCritiqueSection || !aiSceneItem ||
    !aiSceneRead || !aiValueItem || !aiValueCritique ||
    !aiFocalItem || !aiFocalCritique ||
    !aiEdgeItem || !aiEdgeCritique ||
    !aiChromaItem || !aiChromaCritique ||
    !aiWatercolorItem || !aiWatercolorHandling ||
    !aiScopeItem || !aiScope || !aiDemoItem ||
    !aiDemo || !aiTeachingItem || !aiTeachingPoint ||
    !aiRepaintItem || !aiRepaint || !aiPreserveItem ||
    !aiPreserve || !aiAvoidItem || !aiAvoid || !aiUncertaintyItem ||
    !aiUncertainty ||
    !aiSigningItem || !aiSigningRecommendation ||
    !aiFinalAdjItem || !aiFinalAdjustments ||
    !aiMediaItem || !aiMediaOptions ||
    !aiStrengthsItem || !aiStrengths ||
    !aiStudyAreasItem || !aiStudyAreas ||
    !aiNextExplItem || !aiNextExploration ||
    !aiExhibitionItem || !aiExhibitionNote ||
    !journalSection || !journalStatus || !journalTitleRow || !journalPaintingTitle ||
    !journalRatingRow || !journalRatingBtns.length || !journalNoteRow || !journalNote) {
  console.error('APS: one or more required DOM elements not found.');
}

const ctx = canvas.getContext('2d');

/* ── Runtime config ──────────────────────────────────────────────────────── */

const APP_CONFIG = {
  semanticEndpointStorageKey: 'aps:semanticEndpoint',
  localStaticFrontendPort: '8081',
  localSemanticProxyOrigin: 'http://127.0.0.1:8080',
  sameOriginSemanticPath: '/api/semantic',
  sameOriginMockupPath: '/api/mockup',
  sameOriginInProcessPath: '/api/in-process',
  sameOriginStudioCheckPath: '/api/studio-check',
  sameOriginFinishedPath: '/api/finished-critique',
  sameOriginImageEditPath: '/api/image-edit',
  sameOriginJournalSavePath: '/api/journal/save',
  sameOriginJournalListPath: '/api/journal/list',
  sameOriginJournalEntryPath: '/api/journal/entry',
  sameOriginJournalUpdatePath: '/api/journal/update'
};

const WORKFLOW_MODES = {
  REFERENCE_IDEATION: 'reference-ideation',
  IN_PROGRESS_GUIDANCE: 'in-progress-guidance',
  PRE_SIGN: 'pre-sign',
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
    sourceUnavailable: 'Semantic source: Gemini Vision - ideation unavailable'
  },
  [WORKFLOW_MODES.IN_PROGRESS_GUIDANCE]: {
    kicker: 'In-Process',
    title: 'WIP critique',
    empty: 'Upload a work-in-progress painting photo to get next-step guidance.',
    ready: 'WIP image is ready. Ask for critique and next painting actions.',
    action: 'Critique WIP',
    sourceReady: 'Semantic source: Gemini Vision - in-process critique succeeded',
    sourceUnavailable: 'Semantic source: Gemini Vision - in-process critique unavailable'
  },
  [WORKFLOW_MODES.PRE_SIGN]: {
    kicker: 'Studio Check',
    title: 'Signing decision',
    empty: 'Upload your near-final painting to check what (if anything) to do before signing.',
    ready: 'Painting is ready. Run a studio check to decide whether to sign.',
    action: 'Studio check',
    sourceReady: 'Semantic source: Gemini Vision - studio check succeeded',
    sourceUnavailable: 'Semantic source: Gemini Vision - studio check unavailable'
  },
  [WORKFLOW_MODES.FINISHED_REVIEW]: {
    kicker: 'Archive',
    title: 'Studio record',
    empty: 'Upload a signed painting for a retrospective critique and study record.',
    ready: 'Signed painting is ready. Generate an archive read when you want a studio record.',
    action: 'Archive read',
    sourceReady: 'Semantic source: Gemini Vision - archive read succeeded',
    sourceUnavailable: 'Semantic source: Gemini Vision - archive read unavailable'
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

function getSemanticEndpoint() {
  const override = localStorage.getItem(APP_CONFIG.semanticEndpointStorageKey);
  if (override) return override;

  return getApiEndpoint(APP_CONFIG.sameOriginSemanticPath);
}

function getMockupEndpoint() {
  return getApiEndpoint(APP_CONFIG.sameOriginMockupPath);
}

function getInProcessEndpoint() {
  return getApiEndpoint(APP_CONFIG.sameOriginInProcessPath);
}

function getFinishedEndpoint() {
  return getApiEndpoint(APP_CONFIG.sameOriginFinishedPath);
}

function getStudioCheckEndpoint() {
  return getApiEndpoint(APP_CONFIG.sameOriginStudioCheckPath);
}

function getImageEditEndpoint() {
  return getApiEndpoint(APP_CONFIG.sameOriginImageEditPath);
}

function getJournalSaveEndpoint() {
  return getApiEndpoint(APP_CONFIG.sameOriginJournalSavePath);
}

function getJournalListEndpoint() {
  return getApiEndpoint(APP_CONFIG.sameOriginJournalListPath);
}

function getJournalUpdateEndpoint() {
  return getApiEndpoint(APP_CONFIG.sameOriginJournalUpdatePath);
}

function getApiEndpoint(path) {
  const isLocalFrontend =
    ['127.0.0.1', 'localhost'].includes(window.location.hostname) &&
    window.location.port === APP_CONFIG.localStaticFrontendPort;

  if (isLocalFrontend) {
    return `${APP_CONFIG.localSemanticProxyOrigin}${path}`;
  }

  return path;
}

function getWorkflowMode() {
  return Object.values(WORKFLOW_MODES).includes(appState.workflowMode)
    ? appState.workflowMode
    : WORKFLOW_MODES.REFERENCE_IDEATION;
}

function isReferenceIdeationMode() {
  return getWorkflowMode() === WORKFLOW_MODES.REFERENCE_IDEATION;
}

function isInProcessMode() {
  return getWorkflowMode() === WORKFLOW_MODES.IN_PROGRESS_GUIDANCE;
}

function isFinishedMode() {
  return getWorkflowMode() === WORKFLOW_MODES.FINISHED_REVIEW;
}

function isStudioCheckMode() {
  return getWorkflowMode() === WORKFLOW_MODES.PRE_SIGN;
}

function getWorkflowCopy() {
  return WORKFLOW_COPY[getWorkflowMode()] || WORKFLOW_COPY[WORKFLOW_MODES.REFERENCE_IDEATION];
}

function makeEmptyImageState() {
  return { bitmap: null, srcUrl: null, filename: null, file: null };
}

function getActiveImageState() {
  if (isInProcessMode()) return appState.wipImage;
  if (isStudioCheckMode()) return appState.studioCheckImage;
  if (isFinishedMode()) return appState.finishedImage;
  return appState.image;
}

function cleanUiText(value) {
  return value === undefined || value === null
    ? ''
    : String(value).replace(/\s+/g, ' ').trim();
}

function normalizeSemanticInterpretation(raw) {
  const safe = (raw && typeof raw === 'object') ? raw : {};
  return {
    source: safe.source || 'gemini',
    workflowMode: WORKFLOW_MODES.REFERENCE_IDEATION,
    sceneSummary: cleanUiText(safe.sceneSummary),
    dominantRead: cleanUiText(safe.dominantRead),
    valueMasses: cleanUiText(safe.valueMasses),
    atmosphereOpportunities: cleanUiText(safe.atmosphereOpportunities),
    focalHierarchy: cleanUiText(safe.focalHierarchy),
    simplificationIdea: cleanUiText(safe.simplificationIdea),
    paletteDirection: cleanUiText(safe.paletteDirection),
    cropIdeas: cleanUiText(safe.cropIdeas),
    moodPossibilities: cleanUiText(safe.moodPossibilities),
    suppress: cleanUiText(safe.suppress),
    emphasize: cleanUiText(safe.emphasize),
    abstractionOpportunities: cleanUiText(safe.abstractionOpportunities),
    uncertaintyNote: cleanUiText(safe.uncertaintyNote),
    promptVersion: cleanUiText(safe.promptVersion),
    model: cleanUiText(safe.model)
  };
}

function normalizeInProcessCritique(raw) {
  const safe = (raw && typeof raw === 'object') ? raw : {};
  return {
    source: safe.source || 'gemini',
    workflowMode: WORKFLOW_MODES.IN_PROGRESS_GUIDANCE,
    promptVersion: cleanUiText(safe.promptVersion),
    model: cleanUiText(safe.model),
    priorityDiagnosis: cleanUiText(safe.priorityDiagnosis),
    sceneRead: cleanUiText(safe.sceneRead),
    valueStructureCritique: cleanUiText(safe.valueStructureCritique),
    focalHierarchyCritique: cleanUiText(safe.focalHierarchyCritique),
    edgeAtmosphereCritique: cleanUiText(safe.edgeAtmosphereCritique),
    chromaHierarchyCritique: cleanUiText(safe.chromaHierarchyCritique),
    watercolorHandling: cleanUiText(safe.watercolorHandling),
    interventionScope: cleanUiText(safe.interventionScope),
    demonstrationDescription: cleanUiText(safe.demonstrationDescription),
    teachingPoint: cleanUiText(safe.teachingPoint),
    repaintHandoff: cleanUiText(safe.repaintHandoff),
    preserve: cleanUiText(safe.preserve),
    avoid: cleanUiText(safe.avoid),
    uncertaintyNote: cleanUiText(safe.uncertaintyNote),
    sceneSummary: cleanUiText(safe.sceneSummary)
  };
}

function normalizeFinishedCritique(raw) {
  const safe = (raw && typeof raw === 'object') ? raw : {};
  return {
    source: safe.source || 'gemini',
    workflowMode: WORKFLOW_MODES.FINISHED_REVIEW,
    promptVersion: cleanUiText(safe.promptVersion),
    model: cleanUiText(safe.model),
    priorityDiagnosis: cleanUiText(safe.priorityDiagnosis),
    sceneRead: cleanUiText(safe.sceneRead),
    valueStructureCritique: cleanUiText(safe.valueStructureCritique),
    focalHierarchyCritique: cleanUiText(safe.focalHierarchyCritique),
    edgeAtmosphereCritique: cleanUiText(safe.edgeAtmosphereCritique),
    chromaHierarchyCritique: cleanUiText(safe.chromaHierarchyCritique),
    watercolorHandling: cleanUiText(safe.watercolorHandling),
    interventionScope: cleanUiText(safe.interventionScope),
    demonstrationDescription: cleanUiText(safe.demonstrationDescription),
    teachingPoint: cleanUiText(safe.teachingPoint),
    repaintHandoff: cleanUiText(safe.repaintHandoff),
    preserve: cleanUiText(safe.preserve),
    avoid: cleanUiText(safe.avoid),
    uncertaintyNote: cleanUiText(safe.uncertaintyNote),
    sceneSummary: cleanUiText(safe.sceneSummary),
    strengths: cleanUiText(safe.strengths),
    studyAreas: cleanUiText(safe.studyAreas),
    nextExploration: cleanUiText(safe.nextExploration),
    exhibitionNote: cleanUiText(safe.exhibitionNote)
  };
}

function normalizeStudioCheckCritique(raw) {
  const safe = (raw && typeof raw === 'object') ? raw : {};
  return {
    source: safe.source || 'gemini',
    workflowMode: WORKFLOW_MODES.PRE_SIGN,
    promptVersion: cleanUiText(safe.promptVersion),
    model: cleanUiText(safe.model),
    priorityDiagnosis: cleanUiText(safe.priorityDiagnosis),
    sceneRead: cleanUiText(safe.sceneRead),
    valueStructureCritique: cleanUiText(safe.valueStructureCritique),
    focalHierarchyCritique: cleanUiText(safe.focalHierarchyCritique),
    edgeAtmosphereCritique: cleanUiText(safe.edgeAtmosphereCritique),
    chromaHierarchyCritique: cleanUiText(safe.chromaHierarchyCritique),
    watercolorHandling: cleanUiText(safe.watercolorHandling),
    interventionScope: cleanUiText(safe.interventionScope),
    demonstrationDescription: cleanUiText(safe.demonstrationDescription),
    teachingPoint: cleanUiText(safe.teachingPoint),
    repaintHandoff: cleanUiText(safe.repaintHandoff),
    preserve: cleanUiText(safe.preserve),
    avoid: cleanUiText(safe.avoid),
    uncertaintyNote: cleanUiText(safe.uncertaintyNote),
    sceneSummary: cleanUiText(safe.sceneSummary),
    signingRecommendation: cleanUiText(safe.signingRecommendation),
    finalAdjustments: cleanUiText(safe.finalAdjustments),
    mediaOptions: cleanUiText(safe.mediaOptions)
  };
}

function hasReferenceIdeation(ideation) {
  return !!(ideation && [
    ideation.dominantRead,
    ideation.valueMasses,
    ideation.atmosphereOpportunities,
    ideation.focalHierarchy,
    ideation.simplificationIdea,
    ideation.paletteDirection,
    ideation.cropIdeas,
    ideation.moodPossibilities,
    ideation.suppress,
    ideation.emphasize,
    ideation.abstractionOpportunities
  ].some(Boolean));
}

async function requestSemanticInterpretation(file, bitmap, requestId) {
  if (isInProcessMode()) {
    return requestInProcessCritique(file, bitmap, requestId);
  }
  if (isStudioCheckMode()) {
    return requestStudioCheckCritique(file, bitmap, requestId);
  }
  if (isFinishedMode()) {
    return requestFinishedCritique(file, bitmap, requestId);
  }

  console.log(`APS: semantic pass start #${requestId}`);
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
        workflowMode
      }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`semantic endpoint returned ${response.status}`);
    const payload = await response.json();
    console.log(`APS: Gemini response received #${requestId}`);
    const semantic = normalizeSemanticInterpretation(payload);
    if (!hasReferenceIdeation(semantic)) {
      throw new Error('Gemini response incomplete');
    }
    console.log(`APS: critique object created #${requestId}`);
    return {
      semantic,
      status: {
        source: 'gemini',
        state: 'succeeded',
        detail: ''
      }
    };
  } catch (err) {
    console.warn(`APS: semantic interpretation unavailable #${requestId}:`, err);
    return {
      semantic: null,
      status: {
        source: 'none',
        state: 'unavailable',
        detail: err.name === 'AbortError'
          ? 'AI ideation timed out. Please retry.'
          : `AI ideation unavailable. ${err.message || 'Please retry.'}`
      }
    };
  } finally {
    console.log(`APS: semantic pass complete #${requestId}`);
    window.clearTimeout(timeoutId);
  }
}

function addOptionalContextImages(body) {
  const contextTasks = [];

  if (appState.image.file) {
    contextTasks.push(fileToBase64(appState.image.file).then(image => {
      body.referenceImage = image;
      body.referenceMimeType = appState.image.file.type;
      body.referenceFilename = appState.image.filename;
    }));
  }

  if (appState.wipImage.file) {
    contextTasks.push(fileToBase64(appState.wipImage.file).then(image => {
      body.wipImage = image;
      body.wipMimeType = appState.wipImage.file.type;
      body.wipFilename = appState.wipImage.filename;
    }));
  }

  if (appState.mockup.imageDataUrl) {
    const mockupData = dataUrlToImagePayload(appState.mockup.imageDataUrl);
    if (mockupData) {
      body.mockupImage = mockupData.image;
      body.mockupMimeType = mockupData.mimeType;
    }
  }

  return Promise.all(contextTasks);
}

async function requestInProcessCritique(file, bitmap, requestId) {
  console.log(`APS: in-process critique start #${requestId}`);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 60000);

  try {
    const body = {
      wipImage: await fileToBase64(file),
      wipMimeType: file.type,
      wipFilename: file.name,
      workflowMode: WORKFLOW_MODES.IN_PROGRESS_GUIDANCE
    };

    await addOptionalContextImages(body);

    const response = await fetch(getInProcessEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`in-process endpoint returned ${response.status}`);
    const payload = await response.json();
    console.log(`APS: Gemini in-process response received #${requestId}`);
    const semantic = normalizeInProcessCritique(payload);
    if (!hasInProcessCritique(semantic)) {
      throw new Error('Gemini response incomplete');
    }
    return {
      semantic,
      status: {
        source: 'gemini',
        state: 'succeeded',
        detail: ''
      }
    };
  } catch (err) {
    console.warn(`APS: in-process critique unavailable #${requestId}:`, err);
    return {
      semantic: null,
      status: {
        source: 'none',
        state: 'unavailable',
        detail: err.name === 'AbortError'
          ? 'Gemini in-process critique timed out.'
          : `Gemini in-process critique failed: ${err.message || 'unknown error'}`
      }
    };
  } finally {
    console.log(`APS: in-process critique complete #${requestId}`);
    window.clearTimeout(timeoutId);
  }
}

async function requestFinishedCritique(file, bitmap, requestId) {
  console.log(`APS: finished critique start #${requestId}`);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 60000);

  try {
    const body = {
      finishedImage: await fileToBase64(file),
      finishedMimeType: file.type,
      finishedFilename: file.name,
      workflowMode: WORKFLOW_MODES.FINISHED_REVIEW
    };

    await addOptionalContextImages(body);

    const response = await fetch(getFinishedEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`finished endpoint returned ${response.status}`);
    const payload = await response.json();
    console.log(`APS: Gemini finished response received #${requestId}`);
    const semantic = normalizeFinishedCritique(payload);
    if (!hasFinishedCritique(semantic)) {
      throw new Error('Gemini response incomplete');
    }
    return {
      semantic,
      status: {
        source: 'gemini',
        state: 'succeeded',
        detail: ''
      }
    };
  } catch (err) {
    console.warn(`APS: finished critique unavailable #${requestId}:`, err);
    return {
      semantic: null,
      status: {
        source: 'none',
        state: 'unavailable',
        detail: err.name === 'AbortError'
          ? 'Gemini finished critique timed out.'
          : `Gemini finished critique failed: ${err.message || 'unknown error'}`
      }
    };
  } finally {
    console.log(`APS: finished critique complete #${requestId}`);
    window.clearTimeout(timeoutId);
  }
}

async function requestStudioCheckCritique(file, bitmap, requestId) {
  console.log(`APS: studio check start #${requestId}`);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 60000);

  try {
    const body = {
      finishedImage: await fileToBase64(file),
      finishedMimeType: file.type,
      finishedFilename: file.name,
      workflowMode: WORKFLOW_MODES.PRE_SIGN
    };

    await addOptionalContextImages(body);

    const response = await fetch(getStudioCheckEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`studio-check endpoint returned ${response.status}`);
    const payload = await response.json();
    console.log(`APS: Gemini studio check response received #${requestId}`);
    const semantic = normalizeStudioCheckCritique(payload);
    if (!hasStudioCheckCritique(semantic)) {
      throw new Error('Gemini response incomplete');
    }
    return {
      semantic,
      status: {
        source: 'gemini',
        state: 'succeeded',
        detail: ''
      }
    };
  } catch (err) {
    console.warn(`APS: studio check unavailable #${requestId}:`, err);
    return {
      semantic: null,
      status: {
        source: 'none',
        state: 'unavailable',
        detail: err.name === 'AbortError'
          ? 'Gemini studio check timed out.'
          : `Gemini studio check failed: ${err.message || 'unknown error'}`
      }
    };
  } finally {
    console.log(`APS: studio check complete #${requestId}`);
    window.clearTimeout(timeoutId);
  }
}

function dataUrlToImagePayload(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    image: match[2]
  };
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

/* ── Studio journal ───────────────────────────────────────────────────────── */

async function initJournalFeatureDetection() {
  try {
    const response = await fetch(getJournalListEndpoint(), { method: 'GET' });
    if (!response.ok) throw new Error(`journal list returned ${response.status}`);
    const entries = await response.json();
    appState.journal.available = true;
    appState.journal.entries = Array.isArray(entries) ? entries : [];
  } catch (err) {
    console.warn('APS: studio journal unavailable:', err);
    appState.journal.available = false;
    journalSection.hidden = true;
  }
}

function findPreviousPaintingId(filename) {
  if (!filename) return '';
  const match = appState.journal.entries.find(e => e.filename === filename && e.paintingId);
  return match ? match.paintingId : '';
}

function makeThumbnailDataUrl(bitmap) {
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, 800 / longest);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  off.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  return off.toDataURL('image/jpeg', 0.85);
}

function setActiveRatingButton(rating) {
  journalRatingBtns.forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.rating === rating);
  });
}

function hideJournalSection() {
  appState.journal.currentEntryId = null;
  journalSection.hidden = true;
  journalTitleRow.hidden = true;
  journalRatingRow.hidden = true;
  journalNoteRow.hidden = true;
  journalPaintingTitle.value = '';
  journalNote.value = '';
  setActiveRatingButton(null);
}

async function saveJournalEntry(semantic, imageState, workflowMode) {
  if (!appState.journal.available) return;

  try {
    const thumbnail = imageState.bitmap ? makeThumbnailDataUrl(imageState.bitmap) : '';
    const prefill = findPreviousPaintingId(imageState.filename);
    const paintingId = (journalPaintingTitle.value.trim() || prefill || null);

    const response = await fetch(getJournalSaveEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflowMode,
        filename: imageState.filename || '',
        paintingId,
        promptVersion: semantic.promptVersion || '',
        model: semantic.model || '',
        critique: semantic,
        thumbnail,
        userNote: '',
        userRating: null,
        chat: []
      })
    });
    if (!response.ok) throw new Error(`journal save returned ${response.status}`);
    const result = await response.json();

    appState.journal.currentEntryId = result.id;
    journalPaintingTitle.value = paintingId || '';
    journalNote.value = '';
    setActiveRatingButton(null);
    journalStatus.textContent = 'Saved to studio journal';
    journalSection.hidden = false;
    journalTitleRow.hidden = false;
    journalRatingRow.hidden = false;
    journalNoteRow.hidden = false;
  } catch (err) {
    console.warn('APS: journal save failed:', err);
    appState.journal.currentEntryId = null;
    journalStatus.textContent = 'Journal unavailable (proxy offline)';
    journalSection.hidden = false;
    journalTitleRow.hidden = true;
    journalRatingRow.hidden = true;
    journalNoteRow.hidden = true;
  }
}

function updateJournalEntry(fields) {
  if (!appState.journal.available || !appState.journal.currentEntryId) return;
  fetch(getJournalUpdateEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: appState.journal.currentEntryId, ...fields })
  }).catch(err => console.warn('APS: journal update failed:', err));
}

journalRatingBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const rating = btn.dataset.rating;
    setActiveRatingButton(rating);
    updateJournalEntry({ userRating: rating });
  });
});

journalNote.addEventListener('blur', () => {
  updateJournalEntry({ userNote: journalNote.value });
});

journalPaintingTitle.addEventListener('blur', () => {
  updateJournalEntry({ paintingId: journalPaintingTitle.value.trim() || null });
});

function refreshSemanticSource() {
  const status = appState.semanticStatus;
  const copy = getWorkflowCopy();
  semanticSource.hidden = (status.source === 'none' && status.state !== 'loading' &&
                           !status.detail);

  if (status.state === 'loading') {
    if (isInProcessMode()) {
      semanticSource.textContent = 'Semantic source: asking Gemini for WIP critique';
    } else if (isStudioCheckMode()) {
      semanticSource.textContent = 'Semantic source: asking Gemini for studio check';
    } else if (isFinishedMode()) {
      semanticSource.textContent = 'Semantic source: asking Gemini for archive read';
    } else {
      semanticSource.textContent = 'Semantic source: asking Gemini Vision';
    }
  } else if (status.source === 'gemini') {
    semanticSource.textContent = copy.sourceReady;
  } else if (status.state === 'unavailable') {
    semanticSource.textContent = status.detail || copy.sourceUnavailable;
  } else {
    semanticSource.textContent = 'Semantic source: waiting for image';
  }
}

function refreshCritiqueCopy() {
  refreshWorkflowChrome();
  if (isReferenceIdeationMode()) {
    refreshReferenceIdeationCopy();
    return;
  }

  if (isInProcessMode()) {
    refreshInProcessCopy();
    return;
  }

  if (isStudioCheckMode()) {
    refreshStudioCheckCopy();
    return;
  }

  if (isFinishedMode()) {
    refreshFinishedCopy();
    return;
  }
}

function refreshInProcessCopy() {
  const copy = getWorkflowCopy();
  const hasWip = !!appState.wipImage.bitmap;
  const status = appState.semanticStatus;

  if (!hasWip) {
    critiqueMessage.textContent = copy.empty;
    aiCritiqueSection.hidden = true;
    return;
  }

  if (status.state === 'loading') {
    critiqueMessage.textContent = 'Asking Gemini to critique this WIP image...';
    aiCritiqueSection.hidden = true;
    return;
  }

  if (status.source === 'gemini' && hasInProcessCritique()) {
    refreshAiCritiqueCopy();
    return;
  }

  critiqueMessage.textContent = status.state === 'unavailable'
    ? 'Gemini critique did not complete. The WIP image is loaded, but no AI guidance was generated.'
    : copy.ready;
  aiCritiqueSection.hidden = true;
}

function hasInProcessCritique(semantic = appState.semantic) {
  const critique = semantic || {};
  return !!(
    critique.priorityDiagnosis ||
    critique.sceneRead ||
    critique.valueStructureCritique ||
    critique.edgeAtmosphereCritique ||
    critique.repaintHandoff
  );
}

function refreshFinishedCopy() {
  const copy = getWorkflowCopy();
  const hasFinished = !!appState.finishedImage.bitmap;
  const status = appState.semanticStatus;

  if (!hasFinished) {
    critiqueMessage.textContent = copy.empty;
    aiCritiqueSection.hidden = true;
    return;
  }

  if (status.state === 'loading') {
    critiqueMessage.textContent = 'Asking Gemini for a finished painting critique...';
    aiCritiqueSection.hidden = true;
    return;
  }

  if (status.source === 'gemini' && hasFinishedCritique()) {
    refreshAiCritiqueCopy();
    return;
  }

  critiqueMessage.textContent = status.state === 'unavailable'
    ? 'Gemini critique did not complete. The finished painting is loaded, but no final critique was generated.'
    : copy.ready;
  aiCritiqueSection.hidden = true;
}

function refreshStudioCheckCopy() {
  const copy = getWorkflowCopy();
  const hasImage = !!appState.studioCheckImage.bitmap;
  const status = appState.semanticStatus;

  if (!hasImage) {
    critiqueMessage.textContent = copy.empty;
    aiCritiqueSection.hidden = true;
    return;
  }

  if (status.state === 'loading') {
    critiqueMessage.textContent = 'Asking Gemini for a studio check...';
    aiCritiqueSection.hidden = true;
    return;
  }

  if (status.source === 'gemini' && hasStudioCheckCritique()) {
    refreshAiCritiqueCopy();
    return;
  }

  critiqueMessage.textContent = status.state === 'unavailable'
    ? 'Gemini studio check did not complete. The painting is loaded, but no studio check was generated.'
    : copy.ready;
  aiCritiqueSection.hidden = true;
}

function hasFinishedCritique(semantic = appState.semantic) {
  const critique = semantic || {};
  return !!(
    critique.priorityDiagnosis ||
    critique.sceneRead ||
    critique.valueStructureCritique ||
    critique.edgeAtmosphereCritique ||
    critique.strengths
  );
}

function hasStudioCheckCritique(semantic = appState.semantic) {
  const critique = semantic || {};
  return !!(
    critique.priorityDiagnosis ||
    critique.sceneRead ||
    critique.valueStructureCritique ||
    critique.edgeAtmosphereCritique ||
    critique.signingRecommendation
  );
}

function refreshWorkflowChrome() {
  const copy = getWorkflowCopy();
  critiquePanel.dataset.workflow = getWorkflowMode();
  panelKicker.textContent = copy.kicker;
  panelTitle.textContent = copy.title;
  uploadBtn.textContent = isInProcessMode()
    ? 'Open WIP'
    : (isStudioCheckMode() ? 'Open painting'
    : (isFinishedMode() ? 'Open signed work' : 'Open reference'));
  critiqueBtn.textContent = isReferenceIdeationMode()
    ? 'Explore'
    : (isInProcessMode() ? 'Read this painting'
    : (isStudioCheckMode() ? 'Studio check' : 'Archive read'));
}

function refreshReferenceIdeationCopy() {
  if (!appState.image.bitmap) {
    critiqueMessage.textContent = getWorkflowCopy().empty;
    aiCritiqueSection.hidden = true;
    refreshMockupUi();
    return;
  }

  const ideation = appState.semantic;
  if (!hasReferenceIdeation(ideation)) {
    critiqueMessage.textContent = appState.semanticStatus.state === 'unavailable'
      ? (appState.semanticStatus.detail || 'AI ideation unavailable. Please retry.')
      : getWorkflowCopy().ready;
    aiCritiqueSection.hidden = true;
    refreshMockupUi();
    return;
  }

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
  setAiItem(aiFocalItem, aiFocalCritique, '');
  setAiItem(aiEdgeItem, aiEdgeCritique, atmosphere);
  setAiItem(aiChromaItem, aiChromaCritique, '');
  setAiItem(aiWatercolorItem, aiWatercolorHandling, '');
  setAiItem(aiScopeItem, aiScope, compositionIdeas);
  setAiItem(aiDemoItem, aiDemo, simplification);
  setAiItem(aiTeachingItem, aiTeachingPoint, '');
  setAiItem(aiRepaintItem, aiRepaint, paletteMood);
  setAiItem(aiPreserveItem, aiPreserve, ideation.emphasize);
  setAiItem(aiAvoidItem, aiAvoid, ideation.suppress);
  setAiItem(aiUncertaintyItem, aiUncertainty, ideation.uncertaintyNote);

  refreshMockupUi();
}

function refreshAiCritiqueCopy() {
  const critique = appState.semantic;
  if (!critique) {
    critiqueMessage.textContent = 'AI critique unavailable. Please retry.';
    aiCritiqueSection.hidden = true;
    refreshMockupUi();
    return;
  }

  const sceneRead = critique.sceneRead || critique.sceneSummary;
  const valueCritique = critique.valueStructureCritique || critique.priorityDiagnosis;
  const scope = critique.interventionScope;
  const demo = critique.demonstrationDescription;
  const repaint = critique.repaintHandoff;
  const preserve = critique.preserve;
  const avoid = critique.avoid;

  setAiLabel(aiSceneItem, isFinishedMode() ? 'First read' : 'Scene read');
  setAiLabel(aiValueItem, 'Value structure');
  setAiLabel(aiFocalItem, 'Focal hierarchy');
  setAiLabel(aiEdgeItem, isFinishedMode() ? 'Edges — retrospective' : 'Edges and atmosphere');
  setAiLabel(aiChromaItem, 'Chroma');
  setAiLabel(aiWatercolorItem, 'Watercolor handling');
  setAiLabel(aiScopeItem, isStudioCheckMode() ? 'Final adjustment scope'
    : (isFinishedMode() ? 'Resolution level' : 'Scope'));
  setAiLabel(aiDemoItem, (isStudioCheckMode() || isFinishedMode()) ? 'Last test' : 'Demonstration');
  setAiLabel(aiTeachingItem, 'Teaching point');
  setAiLabel(aiRepaintItem, isStudioCheckMode() ? 'Final actions'
    : (isFinishedMode() ? 'Final verdict' : 'Repaint handoff'));
  setAiLabel(aiPreserveItem, isFinishedMode() ? 'What succeeded' : 'Preserve');
  setAiLabel(aiAvoidItem, isFinishedMode() ? 'What weakened it' : 'Avoid');
  setAiLabel(aiUncertaintyItem, 'Uncertainty');

  critiqueMessage.textContent = critique.priorityDiagnosis ||
    valueCritique ||
    sceneRead ||
    repaint ||
    'AI critique unavailable. Please retry.';
  aiCritiqueSection.hidden = false;
  setAiItem(aiSceneItem, aiSceneRead, sceneRead);
  setAiItem(aiValueItem, aiValueCritique, valueCritique);
  setAiItem(aiFocalItem, aiFocalCritique, critique.focalHierarchyCritique);
  setAiItem(aiEdgeItem, aiEdgeCritique, critique.edgeAtmosphereCritique);
  setAiItem(aiChromaItem, aiChromaCritique, critique.chromaHierarchyCritique);
  setAiItem(aiWatercolorItem, aiWatercolorHandling, critique.watercolorHandling);
  setAiItem(aiScopeItem, aiScope, scope);
  setAiItem(aiDemoItem, aiDemo, demo);
  setAiItem(aiTeachingItem, aiTeachingPoint, critique.teachingPoint);
  setAiItem(aiRepaintItem, aiRepaint, repaint);
  setAiItem(aiPreserveItem, aiPreserve, preserve);
  setAiItem(aiAvoidItem, aiAvoid, avoid);
  setAiItem(aiUncertaintyItem, aiUncertainty, critique.uncertaintyNote);

  // Studio Check fields
  setAiItem(aiSigningItem, aiSigningRecommendation, isStudioCheckMode() ? critique.signingRecommendation : '');
  setAiItem(aiFinalAdjItem, aiFinalAdjustments, isStudioCheckMode() ? critique.finalAdjustments : '');
  setAiItem(aiMediaItem, aiMediaOptions, isStudioCheckMode() ? critique.mediaOptions : '');

  // Archive fields
  setAiItem(aiStrengthsItem, aiStrengths, isFinishedMode() ? critique.strengths : '');
  setAiItem(aiStudyAreasItem, aiStudyAreas, isFinishedMode() ? critique.studyAreas : '');
  setAiItem(aiNextExplItem, aiNextExploration, isFinishedMode() ? critique.nextExploration : '');
  setAiItem(aiExhibitionItem, aiExhibitionNote, isFinishedMode() ? critique.exhibitionNote : '');

  refreshEditButtons();
  refreshMockupUi();
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

/* ── M2.5 Critique → Edit Bridge ─────────────────────────────────────────── */

const CRITIQUE_ITEM_CONFIG = {
  valueStructureCritique:  { issueType: 'value_structure', domRef: () => aiValueItem },
  focalHierarchyCritique:  { issueType: 'composition',     domRef: () => aiFocalItem },
  edgeAtmosphereCritique:  { issueType: 'edge_control',    domRef: () => aiEdgeItem  },
  chromaHierarchyCritique: { issueType: 'chroma',          domRef: () => aiChromaItem },
};

const REGION_KEYWORDS = {
  upper:      [0.0, 0.0, 1.0, 0.5],
  lower:      [0.0, 0.5, 1.0, 0.5],
  sky:        [0.0, 0.0, 1.0, 0.4],
  background: [0.0, 0.0, 1.0, 0.5],
  foreground: [0.0, 0.5, 1.0, 0.5],
  corner:     [0.0, 0.0, 0.35, 0.35],
  left:       [0.0, 0.0, 0.5, 1.0],
  right:      [0.5, 0.0, 0.5, 1.0],
};

function resolveRegion(semantic, itemKey) {
  const scopeText  = (semantic.interventionScope || '').toLowerCase();
  const critiqueText = (semantic[itemKey] || '').toLowerCase();
  const fullText   = critiqueText + ' ' + scopeText;

  let scopeClass = 'global-study';
  if      (scopeText.includes('local'))         scopeClass = 'local';
  else if (scopeText.includes('regional'))      scopeClass = 'regional';
  else if (scopeText.includes('composit'))      scopeClass = 'compositional';

  for (const [kw, bbox] of Object.entries(REGION_KEYWORDS)) {
    if (fullText.includes(kw)) {
      return { mode: 'bbox', bbox, scopeClass, description: kw, confidence: 'medium', fallbackReason: '' };
    }
  }

  return {
    mode: 'global', bbox: null, scopeClass,
    description: 'full image', confidence: 'low',
    fallbackReason: 'No locatable region found in critique text'
  };
}

function buildEditPrompt(issueType, diagnosis, preserve, avoid) {
  const primitives = {
    value_structure: 'unify scattered value masses into a calmer shadow architecture',
    composition:     'suppress competing focal claims and anchor the dominant focal area',
    edge_control:    'reduce over-equal edges; soften atmospheric passages',
    chroma:          'mute secondary chroma to restore a single saturation priority',
  };
  const primitive = primitives[issueType] || 'apply the correction described below';
  return [
    `Demonstrate one limited painterly correction: ${primitive}.`,
    `Diagnosis: ${diagnosis}`,
    preserve ? `Preserve: ${preserve}.` : '',
    avoid    ? `Avoid: ${avoid}.`       : '',
    'Do not add detail, texture, or finish. Do not beautify. Painterly simplification only.',
  ].filter(Boolean).join(' ');
}

function critiqueItemToEditRequest(semantic, itemKey) {
  const cfg = CRITIQUE_ITEM_CONFIG[itemKey];
  if (!cfg) return null;
  const diagnosis = semantic[itemKey] || '';
  const region    = resolveRegion(semantic, itemKey);
  const prompt    = buildEditPrompt(cfg.issueType, diagnosis, semantic.preserve, semantic.avoid);
  return {
    editId:            crypto.randomUUID(),
    sourceCritiqueKey: itemKey,
    issueType:         cfg.issueType,
    region,
    editModel:  'gemini',
    prompt,
    preserve:   semantic.preserve || '',
    avoid:      semantic.avoid    || '',
    constraints: [
      'no added detail',
      'preserve drawing',
      'no beautification',
      'painterly verbs only: simplify, group, suppress, anchor, mute',
    ],
  };
}

function refreshEditButtons() {
  // Remove any stale buttons first (idempotent)
  aiCritiqueSection.querySelectorAll('.critique-action-btn').forEach(b => b.remove());

  if (!appState.semantic || isReferenceIdeationMode() || isFinishedMode()) return;

  for (const [key, cfg] of Object.entries(CRITIQUE_ITEM_CONFIG)) {
    const container = cfg.domRef();
    if (!container || container.hidden) continue;
    const btn = document.createElement('button');
    btn.className = 'critique-action-btn';
    btn.type = 'button';
    btn.dataset.critiqueKey = key;
    btn.textContent = '→ suggest edit';
    container.appendChild(btn);
  }
}

function showEditRequestPreview(itemEl, request) {
  // Close any other open preview first
  aiCritiqueSection.querySelectorAll('.edit-request-preview').forEach(p => {
    p.hidden = true;
  });

  let preview = itemEl.querySelector('.edit-request-preview');
  if (!preview) {
    preview = document.createElement('div');
    preview.className = 'edit-request-preview';
    itemEl.appendChild(preview);
  }

  // Toggle: if same item reopened, just close
  if (!preview.hidden && appState.pendingEditRequest?.editId === request.editId) {
    preview.hidden = true;
    appState.pendingEditRequest = null;
    return;
  }

  const regionLabel = request.region.mode === 'bbox'
    ? `${request.region.scopeClass} · ${request.region.description}`
    : `${request.region.scopeClass} · full image`;

  const firstSentence = (request.prompt.split('.')[0] + '.').trim();

  const rows = [
    ['Scope',  regionLabel],
    ['Change', firstSentence],
    ...(request.preserve ? [['Keep',  request.preserve]] : []),
    ...(request.avoid    ? [['Avoid', request.avoid]]    : []),
  ];

  const dl = document.createElement('dl');
  rows.forEach(([label, value]) => {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    dl.appendChild(dt);
    dl.appendChild(dd);
  });

  const applyBtn = document.createElement('button');
  applyBtn.className = 'btn-apply-edit';
  applyBtn.type = 'button';
  applyBtn.textContent = 'Apply correction';

  const dismissBtn = document.createElement('button');
  dismissBtn.className = 'btn-dismiss-preview';
  dismissBtn.type = 'button';
  dismissBtn.textContent = 'dismiss';

  const actions = document.createElement('div');
  actions.className = 'preview-actions';
  actions.appendChild(applyBtn);
  actions.appendChild(dismissBtn);

  preview.replaceChildren(dl, actions);
  preview.hidden = false;
  appState.pendingEditRequest = request;

  applyBtn.addEventListener('click', async () => {
    applyBtn.disabled = true;
    applyBtn.textContent = 'Applying…';
    await requestImageEdit(request);
    if (appState.correction.status === 'failed') {
      applyBtn.disabled = false;
      applyBtn.textContent = 'Retry';
    } else {
      preview.hidden = true;
      appState.pendingEditRequest = null;
    }
  });

  dismissBtn.addEventListener('click', () => {
    preview.hidden = true;
    appState.pendingEditRequest = null;
  });
}

// Delegated click handler for edit buttons in the critique section
aiCritiqueSection.addEventListener('click', e => {
  const btn = e.target.closest('.critique-action-btn');
  if (!btn || !appState.semantic) return;
  const key     = btn.dataset.critiqueKey;
  const request = critiqueItemToEditRequest(appState.semantic, key);
  if (!request) return;
  const itemEl = btn.closest('.ai-critique-item');
  showEditRequestPreview(itemEl, request);
});

function resetPendingEdit() {
  appState.pendingEditRequest = null;
  aiCritiqueSection.querySelectorAll('.edit-request-preview').forEach(p => { p.hidden = true; });
  resetCorrection();
}

function resetCorrection() {
  if (appState.correction.bitmap) {
    appState.correction.bitmap.close();
  }
  appState.correction = {
    status: 'idle',
    bitmap: null,
    imageDataUrl: '',
    error: '',
    sourceCritiqueKey: null
  };
  if (appState.displayMode === 'correction' || appState.displayMode === 'compare') {
    appState.displayMode = 'original';
  }
}

async function requestImageEdit(request) {
  const sourceImage = getActiveImageState();
  if (!sourceImage.file) return;

  if (appState.correction.bitmap) {
    appState.correction.bitmap.close();
  }
  appState.correction = {
    status: 'loading',
    bitmap: null,
    imageDataUrl: '',
    error: '',
    sourceCritiqueKey: request.sourceCritiqueKey
  };
  refreshCanvasToggle();

  try {
    const imageData = await fileToBase64(sourceImage.file);
    const response = await fetch(getImageEditEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageData,
        mimeType: sourceImage.file.type,
        prompt: request.prompt
      })
    });

    if (!response.ok) throw new Error(`image-edit endpoint returned ${response.status}`);
    const payload = await response.json();
    if (!payload.imageDataUrl) throw new Error('image-edit endpoint returned no image');
    const correctionBitmap = await imageBitmapFromDataUrl(payload.imageDataUrl);

    appState.correction = {
      status: 'succeeded',
      bitmap: correctionBitmap,
      imageDataUrl: payload.imageDataUrl,
      error: '',
      sourceCritiqueKey: request.sourceCritiqueKey
    };
    appState.displayMode = 'correction';
  } catch (err) {
    console.warn('APS: image edit failed:', err);
    appState.correction = {
      status: 'failed',
      bitmap: null,
      imageDataUrl: '',
      error: String(err.message || err),
      sourceCritiqueKey: request.sourceCritiqueKey
    };
    appState.displayMode = 'original';
  }

  refreshCanvasToggle();
  renderCurrentDisplay();
}

function resetMockup() {
  if (appState.mockup.bitmap) {
    appState.mockup.bitmap.close();
  }
  appState.mockup = {
    status: 'idle',
    bitmap: null,
    imageDataUrl: '',
    notes: '',
    error: ''
  };
  appState.displayMode = 'original';
  refreshMockupUi();
  renderCurrentDisplay();
}

function supportsAnnotatedMockup() {
  return isReferenceIdeationMode() || isInProcessMode();
}

function canGenerateMockup() {
  if (!supportsAnnotatedMockup() || appState.mockup.status === 'loading') {
    return false;
  }

  if (isReferenceIdeationMode()) {
    return !!appState.image.bitmap && !!appState.semantic;
  }

  return !!appState.wipImage.bitmap;
}

function refreshMockupUi() {
  mockupBtn.hidden = !supportsAnnotatedMockup();
  mockupBtn.disabled = !canGenerateMockup();
  if (stepAnnotateHint) {
    stepAnnotateHint.textContent = canGenerateMockup() ? '' :
      (supportsAnnotatedMockup() && !!getActiveImageState().bitmap ? 'Analyse first' : '');
  }

  const mockup = appState.mockup;
  const shouldShow = supportsAnnotatedMockup() &&
    !!getActiveImageState().bitmap &&
    (mockup.status !== 'idle' || !!mockup.imageDataUrl);
  mockupSection.hidden = !shouldShow;
  mockupImage.hidden = !mockup.imageDataUrl;
  mockupDownload.hidden = !mockup.imageDataUrl;

  if (mockup.imageDataUrl) {
    mockupImage.src = mockup.imageDataUrl;
    mockupDownload.href = mockup.imageDataUrl;
  } else {
    mockupImage.removeAttribute('src');
    mockupDownload.removeAttribute('href');
  }

  if (mockup.status === 'loading') {
    mockupStatus.textContent = 'Generating annotated mockup with Gemini...';
  } else if (mockup.status === 'succeeded') {
    mockupStatus.textContent = mockup.notes || 'Annotated mockup generated.';
  } else if (mockup.status === 'failed') {
    mockupStatus.textContent = mockup.error || 'Mockup generation failed.';
  } else {
    mockupStatus.textContent = 'Waiting for mockup.';
  }
}

function refreshCanvasToggle() {
  const hasOriginal = !!getActiveImageState().bitmap;
  const hasMockup = supportsAnnotatedMockup() && !!appState.mockup.bitmap;
  const hasCorrection = !!appState.correction.bitmap;

  canvasToggle.hidden = !hasOriginal;
  showOriginalBtn.disabled = !hasOriginal;
  showMockupBtn.disabled = !hasMockup;
  showCorrectionBtn.hidden = !hasCorrection;
  showCorrectionBtn.disabled = !hasCorrection;
  showCompareBtn.hidden = !hasCorrection;
  showCompareBtn.disabled = !hasCorrection;
  showOriginalBtn.classList.toggle('is-active', appState.displayMode === 'original');
  showMockupBtn.classList.toggle('is-active', appState.displayMode === 'mockup');
  showCorrectionBtn.classList.toggle('is-active', appState.displayMode === 'correction');
  showCompareBtn.classList.toggle('is-active', appState.displayMode === 'compare');
}

function setDisplayMode(mode) {
  if (mode === 'mockup' && !appState.mockup.bitmap) return;
  if ((mode === 'correction' || mode === 'compare') && !appState.correction.bitmap) return;
  appState.displayMode = ['mockup', 'correction', 'compare'].includes(mode) ? mode : 'original';
  refreshCanvasToggle();
  renderCurrentDisplay();
}

function getDisplayBitmap() {
  if (appState.displayMode === 'correction' && appState.correction.bitmap) {
    return appState.correction.bitmap;
  }
  if (supportsAnnotatedMockup() && appState.displayMode === 'mockup' && appState.mockup.bitmap) {
    return appState.mockup.bitmap;
  }
  return getActiveImageState().bitmap;
}

async function requestAnnotatedMockup() {
  const sourceImage = getActiveImageState();
  if (!sourceImage.file || !supportsAnnotatedMockup()) return;

  if (appState.mockup.bitmap) {
    appState.mockup.bitmap.close();
  }
  appState.mockup = {
    status: 'loading',
    bitmap: null,
    imageDataUrl: '',
    notes: '',
    error: ''
  };
  appState.displayMode = 'original';
  refreshMockupUi();
  refreshCanvasToggle();
  renderCurrentDisplay();

  try {
    const imageData = await fileToBase64(sourceImage.file);
    const response = await fetch(getMockupEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageData,
        mimeType: sourceImage.file.type,
        filename: sourceImage.filename,
        workflowMode: getWorkflowMode(),
        mode: 'annotated_mockup',
        ideation: appState.semantic || {}
      })
    });

    if (!response.ok) throw new Error(`mockup endpoint returned ${response.status}`);
    const payload = await response.json();
    if (!payload.imageDataUrl) throw new Error('mockup endpoint returned no image');
    const mockupBitmap = await imageBitmapFromDataUrl(payload.imageDataUrl);

    appState.mockup = {
      status: 'succeeded',
      bitmap: mockupBitmap,
      imageDataUrl: payload.imageDataUrl,
      notes: payload.notes || '',
      error: ''
    };
    appState.displayMode = 'mockup';
  } catch (err) {
    console.warn('APS: annotated mockup failed:', err);
    appState.mockup = {
      status: 'failed',
      bitmap: null,
      imageDataUrl: '',
      notes: '',
      error: 'Could not generate annotated mockup. Check the semantic proxy and Gemini image model.'
    };
    appState.displayMode = 'original';
  }

  refreshMockupUi();
  refreshCanvasToggle();
  renderCurrentDisplay();
}

async function imageBitmapFromDataUrl(dataUrl) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return createImageBitmap(blob);
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
}

function renderCurrentDisplay() {
  if (appState.displayMode === 'compare' && appState.correction.bitmap) {
    canvas.hidden = true;
    compareArea.hidden = false;
    const srcUrl = getActiveImageState().srcUrl;
    compareOriginalImg.src = srcUrl || '';
    compareCorrectionImg.src = appState.correction.imageDataUrl || '';
    return;
  }

  compareArea.hidden = true;
  const bitmap = getDisplayBitmap();
  if (!bitmap) return;
  canvas.hidden = false;
  renderCanvas(bitmap);
}

/* ── View helpers ─────────────────────────────────────────────────────────── */

function showCanvas() {
  canvas.hidden       = false;
  emptyState.hidden   = true;
  resetBtn.disabled   = false;
  critiqueBtn.disabled = false;
  stepAnalyseHint.textContent = 'Tap to analyse';
  refreshCanvasToggle();
  refreshWorkflowChrome();
}

function showEmptyState() {
  canvas.hidden       = true;
  compareArea.hidden  = true;
  emptyState.hidden   = false;
  canvasToggle.hidden = true;
  resetBtn.disabled   = true;
  critiqueBtn.disabled = true;
  stepAnalyseHint.textContent = '';
  canvas.width        = 0;
  canvas.height       = 0;
  refreshCritiquePanel('empty');
}

function refreshCritiquePanel(reason) {
  console.log(`APS: critique render trigger: ${reason}`);

  refreshSemanticSource();
  refreshCritiqueCopy();
  refreshMockupUi();
  printBtn.hidden = !appState.semantic;

  renderCurrentDisplay();
  console.log(`APS: critique render complete: ${reason}`);
}

async function rerunWorkflowAnalysis() {
  const activeImage = getActiveImageState();
  if (!activeImage.bitmap || !activeImage.file) {
    refreshCritiquePanel(activeImage.bitmap ? 'loaded' : 'empty');
    return;
  }

  const requestId = appState.semanticRequestId + 1;
  const bitmap = activeImage.bitmap;
  const file = activeImage.file;
  appState.semanticRequestId = requestId;
  appState.semantic = null;
  resetPendingEdit();
  appState.semanticStatus = {
    source: 'none',
    state: 'loading',
    detail: isInProcessMode()
      ? 'Semantic source: asking Gemini for WIP critique'
      : (isStudioCheckMode()
        ? 'Semantic source: asking Gemini for studio check'
        : (isFinishedMode()
          ? 'Semantic source: asking Gemini for archive read'
          : 'Semantic source: asking Gemini Vision'))
  };
  if (isReferenceIdeationMode()) resetMockup();
  hideJournalSection();
  refreshCritiquePanel('loading');

  const semanticResult = await requestSemanticInterpretation(file, bitmap, requestId);
  if (requestId !== appState.semanticRequestId || bitmap !== getActiveImageState().bitmap) {
    console.log(`APS: stale workflow result ignored #${requestId}`);
    return;
  }

  appState.semantic = semanticResult.semantic;
  appState.semanticStatus = semanticResult.status;
  refreshCritiquePanel('analysis-ready');
  if (semanticResult.status.source === 'gemini') {
    saveJournalEntry(appState.semantic, activeImage, getWorkflowMode());
  }
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
  const activeImage = getActiveImageState();
  const requestId = appState.semanticRequestId + 1;
  appState.semanticRequestId = requestId;

  // Revoke any previous ObjectURL to free memory
  if (activeImage.srcUrl) {
    URL.revokeObjectURL(activeImage.srcUrl);
    activeImage.srcUrl = null;
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

    if (activeImage.bitmap) {
      activeImage.bitmap.close();
    }
    activeImage.bitmap   = bitmap;
    activeImage.srcUrl   = url;
    activeImage.filename = file.name;
    activeImage.file     = file;
    appState.semantic       = null;
    appState.semanticStatus = { source: 'none', state: 'unavailable' };
    resetPendingEdit();
    if (supportsAnnotatedMockup()) resetMockup();
    hideJournalSection();

    showCanvas();
    renderCurrentDisplay();
    console.log(`APS: upload complete #${requestId}`);

    if (isInProcessMode() || isStudioCheckMode() || isFinishedMode()) {
      refreshCritiquePanel('loaded');
      fileInput.value = '';
      return;
    }

    const semanticResult = await requestSemanticInterpretation(file, bitmap, requestId);
    if (requestId !== appState.semanticRequestId || bitmap !== getActiveImageState().bitmap) {
      console.log(`APS: stale semantic result ignored #${requestId}`);
      fileInput.value = '';
      return;
    }
    appState.semantic = semanticResult.semantic;
    appState.semanticStatus = semanticResult.status;

    console.log(`APS: critique render trigger from semantic completion #${requestId}`);
    refreshCritiquePanel('analysis-ready');
    if (semanticResult.status.source === 'gemini') {
      saveJournalEntry(appState.semantic, activeImage, getWorkflowMode());
    }

  } catch (err) {
    console.error('APS: failed to decode image:', err);
    URL.revokeObjectURL(url);
    if (isInProcessMode()) {
      appState.wipImage = makeEmptyImageState();
    } else if (isStudioCheckMode()) {
      appState.studioCheckImage = makeEmptyImageState();
    } else if (isFinishedMode()) {
      appState.finishedImage = makeEmptyImageState();
    } else {
      appState.image = makeEmptyImageState();
    }
    appState.semantic = null;
    appState.semanticStatus = { source: 'none', state: 'unavailable' };
    appState.semanticRequestId += 1;
    resetPendingEdit();
    if (supportsAnnotatedMockup()) resetMockup();
    showEmptyState();
  }

  // Reset input value so re-uploading the same file fires the change event
  fileInput.value = '';
});

/* ── Reset ────────────────────────────────────────────────────────────────── */

resetBtn.addEventListener('click', () => {
  const activeImage = getActiveImageState();
  if (activeImage.bitmap) {
    activeImage.bitmap.close();   // release GPU/memory
  }
  if (activeImage.srcUrl) {
    URL.revokeObjectURL(activeImage.srcUrl);
  }
  if (isInProcessMode()) {
    appState.wipImage = makeEmptyImageState();
  } else if (isStudioCheckMode()) {
    appState.studioCheckImage = makeEmptyImageState();
  } else if (isFinishedMode()) {
    appState.finishedImage = makeEmptyImageState();
  } else {
    appState.image = makeEmptyImageState();
  }
  appState.semantic = null;
  appState.semanticStatus = { source: 'none', state: 'unavailable' };
  appState.semanticRequestId += 1;
  resetPendingEdit();
  if (supportsAnnotatedMockup()) resetMockup();
  hideJournalSection();
  showEmptyState();
});

critiqueBtn.addEventListener('click', () => {
  if (!getActiveImageState().bitmap) return;
  rerunWorkflowAnalysis();
});

function setActiveTab(mode) {
  document.querySelectorAll('.mode-group').forEach(g => {
    g.classList.toggle('is-active', g.dataset.mode === mode);
  });
  modeTabs.forEach(tab => {
    tab.classList.toggle('is-active', tab.dataset.mode === mode);
  });
}

modeTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const mode = tab.dataset.mode;
    if (mode === appState.workflowMode) return;
    appState.workflowMode = mode;
    setActiveTab(mode);
    const modeActions = document.querySelector('.mode-actions');
    const activeGroup = document.querySelector(`.mode-group[data-mode="${mode}"]`);
    if (modeActions && activeGroup) activeGroup.appendChild(modeActions);
    appState.displayMode = 'original';
    appState.semantic = null;
    appState.semanticStatus = { source: 'none', state: 'unavailable' };
    resetPendingEdit();
    hideJournalSection();
    renderCurrentDisplay();
    refreshCanvasToggle();
    if (getActiveImageState().bitmap) {
      showCanvas();
    } else {
      showEmptyState();
    }
    rerunWorkflowAnalysis();
  });
});

mockupBtn.addEventListener('click', requestAnnotatedMockup);
printBtn.addEventListener('click', () => window.print());

showOriginalBtn.addEventListener('click', () => {
  setDisplayMode('original');
});

showMockupBtn.addEventListener('click', () => {
  setDisplayMode('mockup');
});

showCorrectionBtn.addEventListener('click', () => {
  setDisplayMode('correction');
});

showCompareBtn.addEventListener('click', () => {
  setDisplayMode('compare');
});

/* ── M5: Print reference sheet ───────────────────────────────────────────── */

function preparePrintSheet() {
  if (!getActiveImageState().bitmap) return;

  const psFilename = document.getElementById('ps-filename');
  const psMode     = document.getElementById('ps-mode');
  const psDate     = document.getElementById('ps-date');
  const psImages   = document.getElementById('ps-images');
  const psCritique = document.getElementById('ps-critique');

  // Header
  psFilename.textContent = getActiveImageState().filename || 'Untitled';
  psMode.textContent = {
    'reference-ideation':   'Reference Ideation',
    'in-progress-guidance': 'In-Process',
    'pre-sign':             'Studio Check',
    'finished-review':      'Archive'
  }[getWorkflowMode()] || '';
  psDate.textContent = new Date().toLocaleDateString();

  // Images — only slots that have content
  psImages.replaceChildren();
  const imageLabel = isReferenceIdeationMode() ? 'Reference Photo'
    : isFinishedMode() ? 'Signed Painting'
    : (isStudioCheckMode() ? 'Near-final Painting' : 'WIP Painting');

  const slots = [
    { label: imageLabel,        src: getActiveImageState().srcUrl },
    appState.mockup.imageDataUrl
      ? { label: 'Annotated Mockup', src: appState.mockup.imageDataUrl } : null,
    appState.correction.imageDataUrl
      ? { label: 'Correction',       src: appState.correction.imageDataUrl } : null,
  ].filter(Boolean);

  slots.forEach(({ label, src }) => {
    const fig = document.createElement('figure');
    fig.className = 'ps-figure';
    const cap = document.createElement('figcaption');
    cap.textContent = label;
    const img = document.createElement('img');
    img.src = src;
    img.alt = label;
    fig.appendChild(cap);
    fig.appendChild(img);
    psImages.appendChild(fig);
  });

  // Critique fields
  psCritique.replaceChildren();
  const semantic = appState.semantic;
  if (!semantic) return;

  if (semantic.priorityDiagnosis) {
    const p = document.createElement('p');
    p.className = 'ps-diagnosis';
    p.textContent = semantic.priorityDiagnosis;
    psCritique.appendChild(p);
  }

  const printFields = isStudioCheckMode() ? [
    ['Signing',          semantic.signingRecommendation],
    ['Final steps',      semantic.finalAdjustments],
    ['Media options',    semantic.mediaOptions],
    ['Preserve',         semantic.preserve],
    ['Avoid',            semantic.avoid],
    ['Teaching point',   semantic.teachingPoint],
  ] : isFinishedMode() ? [
    ['Strengths',        semantic.strengths],
    ['Study areas',      semantic.studyAreas],
    ['Next exploration', semantic.nextExploration],
    ['Exhibition',       semantic.exhibitionNote],
    ['Teaching point',   semantic.teachingPoint],
  ] : [
    ['Repaint',          semantic.repaintHandoff],
    ['Preserve',         semantic.preserve],
    ['Avoid',            semantic.avoid],
    ['Teaching point',   semantic.teachingPoint],
  ];

  printFields.filter(([, v]) => v).forEach(([label, value]) => {
    const div = document.createElement('div');
    div.className = 'ps-field';
    const lbl = document.createElement('span');
    lbl.className = 'ps-field-label';
    lbl.textContent = label;
    const txt = document.createElement('p');
    txt.className = 'ps-field-text';
    txt.textContent = value;
    div.appendChild(lbl);
    div.appendChild(txt);
    psCritique.appendChild(div);
  });
}

window.addEventListener('beforeprint', preparePrintSheet);

/* ── Resize re-fit ────────────────────────────────────────────────────────── */

let _resizeTimer = null;

window.addEventListener('resize', () => {
  if (_resizeTimer) clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    if (getActiveImageState().bitmap) {
      renderCurrentDisplay();
    }
  }, 80);   // debounce — enough for smooth drag-resize
});

/* ── Initialise ───────────────────────────────────────────────────────────── */

initTheme();
setActiveTab(getWorkflowMode());
showEmptyState();
initJournalFeatureDetection();
