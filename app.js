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
  semanticRequestId: 0
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

// Guard: abort early if any required element is missing (catches future renames)
if (!fileInput || !uploadBtn || !resetBtn || !critiqueBtn || !themeBtn ||
    !modeTabs.length ||
    !canvas || !emptyState || !canvasToggle || !showOriginalBtn ||
    !showMockupBtn || !critiquePanel || !panelKicker || !panelTitle ||
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
    !aiUncertainty) {
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
  sameOriginFinishedPath: '/api/finished-critique'
};

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
  [WORKFLOW_MODES.FINISHED_REVIEW]: {
    kicker: 'Finished Painting',
    title: 'Final critique',
    empty: 'Upload a finished painting for a juror-style critique.',
    ready: 'Finished painting is ready. Generate a final critique when you want a resolved read.',
    action: 'Generate critique',
    sourceReady: 'Semantic source: Gemini Vision - finished critique succeeded',
    sourceUnavailable: 'Semantic source: Gemini Vision - finished critique unavailable'
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

function getWorkflowCopy() {
  return WORKFLOW_COPY[getWorkflowMode()] || WORKFLOW_COPY[WORKFLOW_MODES.REFERENCE_IDEATION];
}

function makeEmptyImageState() {
  return { bitmap: null, srcUrl: null, filename: null, file: null };
}

function getActiveImageState() {
  if (isInProcessMode()) return appState.wipImage;
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
    uncertaintyNote: cleanUiText(safe.uncertaintyNote)
  };
}

function normalizeInProcessCritique(raw) {
  const safe = (raw && typeof raw === 'object') ? raw : {};
  return {
    source: safe.source || 'gemini',
    workflowMode: WORKFLOW_MODES.IN_PROGRESS_GUIDANCE,
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

function refreshSemanticSource() {
  const status = appState.semanticStatus;
  const copy = getWorkflowCopy();
  semanticSource.hidden = (status.source === 'none' && status.state !== 'loading' &&
                           !status.detail);

  if (status.state === 'loading') {
    if (isInProcessMode()) {
      semanticSource.textContent = 'Semantic source: asking Gemini for WIP critique';
    } else if (isFinishedMode()) {
      semanticSource.textContent = 'Semantic source: asking Gemini for finished critique';
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

function hasFinishedCritique(semantic = appState.semantic) {
  const critique = semantic || {};
  return !!(
    critique.priorityDiagnosis ||
    critique.sceneRead ||
    critique.valueStructureCritique ||
    critique.edgeAtmosphereCritique ||
    critique.repaintHandoff
  );
}

function refreshWorkflowChrome() {
  const copy = getWorkflowCopy();
  critiquePanel.dataset.workflow = getWorkflowMode();
  panelKicker.textContent = copy.kicker;
  panelTitle.textContent = copy.title;
  uploadBtn.textContent = isInProcessMode()
    ? 'Open WIP'
    : (isFinishedMode() ? 'Open painting' : 'Open reference');
  critiqueBtn.textContent = isReferenceIdeationMode()
    ? 'Explore'
    : (isInProcessMode() ? 'Read this painting' : 'Final read');
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
  setAiLabel(aiEdgeItem, isFinishedMode() ? 'Edges and finish' : 'Edges and atmosphere');
  setAiLabel(aiChromaItem, 'Chroma');
  setAiLabel(aiWatercolorItem, 'Watercolor handling');
  setAiLabel(aiScopeItem, isFinishedMode() ? 'Final adjustment scope' : 'Scope');
  setAiLabel(aiDemoItem, isFinishedMode() ? 'Resolution test' : 'Demonstration');
  setAiLabel(aiTeachingItem, 'Teaching point');
  setAiLabel(aiRepaintItem, isFinishedMode() ? 'Final verdict' : 'Repaint handoff');
  setAiLabel(aiPreserveItem, 'Preserve');
  setAiLabel(aiAvoidItem, 'Avoid');
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

  canvasToggle.hidden = !hasOriginal;
  showOriginalBtn.disabled = !hasOriginal;
  showMockupBtn.disabled = !hasMockup;
  showOriginalBtn.classList.toggle('is-active', appState.displayMode === 'original');
  showMockupBtn.classList.toggle('is-active', appState.displayMode === 'mockup');
}

function setDisplayMode(mode) {
  if (mode === 'mockup' && !appState.mockup.bitmap) return;
  appState.displayMode = mode === 'mockup' ? 'mockup' : 'original';
  refreshCanvasToggle();
  renderCurrentDisplay();
}

function getDisplayBitmap() {
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
  const bitmap = getDisplayBitmap();
  if (!bitmap) return;

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
  appState.semanticStatus = {
    source: 'none',
    state: 'loading',
    detail: isInProcessMode()
      ? 'Semantic source: asking Gemini for WIP critique'
      : (isFinishedMode()
        ? 'Semantic source: asking Gemini for finished critique'
        : 'Semantic source: asking Gemini Vision')
  };
  if (isReferenceIdeationMode()) resetMockup();
  refreshCritiquePanel('loading');

  const semanticResult = await requestSemanticInterpretation(file, bitmap, requestId);
  if (requestId !== appState.semanticRequestId || bitmap !== getActiveImageState().bitmap) {
    console.log(`APS: stale workflow result ignored #${requestId}`);
    return;
  }

  appState.semantic = semanticResult.semantic;
  appState.semanticStatus = semanticResult.status;
  refreshCritiquePanel('analysis-ready');
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
    if (supportsAnnotatedMockup()) resetMockup();

    showCanvas();
    renderCurrentDisplay();
    console.log(`APS: upload complete #${requestId}`);

    if (isInProcessMode() || isFinishedMode()) {
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

  } catch (err) {
    console.error('APS: failed to decode image:', err);
    URL.revokeObjectURL(url);
    if (isInProcessMode()) {
      appState.wipImage = makeEmptyImageState();
    } else if (isFinishedMode()) {
      appState.finishedImage = makeEmptyImageState();
    } else {
      appState.image = makeEmptyImageState();
    }
    appState.semantic = null;
    appState.semanticStatus = { source: 'none', state: 'unavailable' };
    appState.semanticRequestId += 1;
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
  } else if (isFinishedMode()) {
    appState.finishedImage = makeEmptyImageState();
  } else {
    appState.image = makeEmptyImageState();
  }
  appState.semantic = null;
  appState.semanticStatus = { source: 'none', state: 'unavailable' };
  appState.semanticRequestId += 1;
  if (supportsAnnotatedMockup()) resetMockup();
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
