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
    filename: null    // original filename | null
  },
  semantic: null,       // narrowly scoped scene labels and value-family hints
  semanticStatus: {
    source: 'none',     // none | gemini | fallback
    state: 'unavailable'
  },
  critiqueStep: 'idle'  // idle | diagnosis | scope | demo | repaint
};

/* ── DOM refs ─────────────────────────────────────────────────────────────── */
const fileInput   = document.getElementById('file-input');
const uploadBtn   = document.getElementById('upload-btn');
const resetBtn    = document.getElementById('reset-btn');
const critiqueBtn = document.getElementById('critique-btn');
const themeBtn    = document.getElementById('theme-btn');
const canvas      = document.getElementById('main-canvas');
const emptyState  = document.getElementById('empty-state');
const critiquePanel   = document.getElementById('critique-panel');
const critiqueMessage = document.getElementById('critique-message');
const semanticSource  = document.getElementById('semantic-source');
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
    !canvas || !emptyState || !critiquePanel || !critiqueMessage ||
    !semanticSource || !semanticSection || !semanticCopy || !scopeSection ||
    !scopeCopy || !demoSection || !demoCopy || !repaintSection ||
    !repaintList || !nextStepBtn) {
  console.error('APS: one or more required DOM elements not found.');
}

const ctx = canvas.getContext('2d');

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
  protectedPassages: ['sky opening', 'main light shape', 'fresh outer washes']
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
    sceneSummary: String(safe.sceneSummary || fallback.sceneSummary),
    regions,
    valueFamilies,
    protectedPassages: Array.isArray(safe.protectedPassages) && safe.protectedPassages.length
      ? safe.protectedPassages.map(String)
      : fallback.protectedPassages
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

async function requestSemanticInterpretation(file, bitmap) {
  console.log('APS: semantic pass start');
  const fallback = getFallbackSemanticInterpretation(bitmap);
  const endpoint = getSemanticEndpoint();

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);

  try {
    const imageData = await fileToBase64(file);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageData,
        mimeType: file.type,
        filename: file.name,
        purpose: 'scene_regions_and_value_families_only',
        prompt: SEMANTIC_INTERPRETATION_PROMPT
      }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`semantic endpoint returned ${response.status}`);
    const payload = await response.json();
    const semantic = normalizeSemanticInterpretation(payload, bitmap);
    return {
      semantic,
      status: {
        source: semantic.source === 'gemini' ? 'gemini' : 'fallback',
        state: semantic.source === 'gemini' ? 'succeeded' : 'fallback',
        detail: ''
      }
    };
  } catch (err) {
    console.warn('APS: semantic interpretation fallback used:', err);
    console.log('APS: semantic pass fallback');
    return {
      semantic: fallback,
      status: {
        source: 'fallback',
        state: err.name === 'AbortError' ? 'unavailable' : 'fallback',
        detail: ''
      }
    };
  } finally {
    console.log('APS: semantic pass complete');
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
  return semantic.protectedPassages.join(', ');
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
  semanticSource.hidden = (status.source === 'none');

  if (status.source === 'gemini') {
    semanticSource.textContent = 'Semantic source: Gemini Vision - semantic pass succeeded';
  } else if (status.state === 'unavailable') {
    semanticSource.textContent = 'Semantic source: Local fallback interpretation - semantic unavailable';
  } else if (status.source === 'fallback') {
    semanticSource.textContent = 'Semantic source: Local fallback interpretation - semantic fallback used';
  } else {
    semanticSource.textContent = 'Semantic source: waiting for image';
  }
}

function refreshCritiqueCopy(step) {
  const family = getTargetValueFamily();
  const protectedPassages = getProtectedPassages();
  const familyLabel = family.label;
  const familyPosition = family.position;

  scopeCopy.textContent = `${familyLabel}, in the ${familyPosition}. ${protectedPassages} stay untouched.`;
  demoCopy.textContent = `A quiet value grouping pass shows how the ${familyLabel} can behave as one calmer mass.`;

  repaintList.replaceChildren(
    makeListItem(`Rebuild the ${familyLabel} as one connected value family.`),
    makeListItem(`Preserve the ${protectedPassages}.`),
    makeListItem('Add accents only after the large shadow mass reads clearly.')
  );

  if (step === 'idle') {
    critiqueMessage.textContent = appState.image.bitmap
      ? 'Scene structure is labeled. Run the minimal critique loop when ready.'
      : 'Upload a painting, then run the minimal critique loop.';
    nextStepBtn.textContent = 'Run critique';
  } else if (step === 'diagnosis') {
    critiqueMessage.textContent = `The dominant shadow structure fragments through the ${familyLabel}, weakening the painting's value cohesion.`;
    nextStepBtn.textContent = 'Reveal scope';
  } else if (step === 'scope') {
    critiqueMessage.textContent = `One regional intervention is proposed: group the ${familyLabel} while preserving the main light and outer passages.`;
    nextStepBtn.textContent = 'Show demonstration';
  } else if (step === 'demo') {
    critiqueMessage.textContent = `The demonstration quietly groups the ${familyPosition} values. It is a study aid, not a finished correction.`;
    nextStepBtn.textContent = 'Repaint guidance';
  } else if (step === 'repaint') {
    critiqueMessage.textContent = `Return to the painting with one task: rebuild the ${familyLabel} before adding accents.`;
    nextStepBtn.textContent = 'Repaint next';
  }
}

function makeListItem(text) {
  const item = document.createElement('li');
  item.textContent = text;
  return item;
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

  semanticSection.hidden = !(step === 'diagnosis' || step === 'scope' ||
                             step === 'demo' || step === 'repaint');
  scopeSection.hidden = !(step === 'scope' || step === 'demo' || step === 'repaint');
  demoSection.hidden = !(step === 'demo' || step === 'repaint');
  repaintSection.hidden = (step !== 'repaint');

  critiquePanel.dataset.step = step;

  refreshSemanticCopy();
  refreshSemanticSource();
  refreshCritiqueCopy(step);

  nextStepBtn.disabled = !appState.image.bitmap || step === 'repaint';

  if (appState.image.bitmap) {
    renderCanvas(appState.image.bitmap);
  }
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

/* ── File upload ──────────────────────────────────────────────────────────── */

// Clicking Upload triggers the hidden file input
uploadBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', async () => {
  console.log('APS: upload event fired');
  const file = fileInput.files[0];
  if (!file) return;

  // Revoke any previous ObjectURL to free memory
  if (appState.image.srcUrl) {
    URL.revokeObjectURL(appState.image.srcUrl);
    appState.image.srcUrl = null;
  }

  const url = URL.createObjectURL(file);

  try {
    const bitmap = await createImageBitmap(file);

    appState.image.bitmap   = bitmap;
    appState.image.srcUrl   = url;
    appState.image.filename = file.name;
    appState.semantic       = null;
    appState.semanticStatus = { source: 'none', state: 'unavailable' };
    appState.critiqueStep   = 'idle';

    showCanvas();
    renderCanvas(bitmap);
    console.log('APS: upload complete');

    const semanticResult = await requestSemanticInterpretation(file, bitmap);
    appState.semantic = semanticResult.semantic;
    appState.semanticStatus = semanticResult.status;

    setCritiqueStep('diagnosis');
    renderCanvas(bitmap);

  } catch (err) {
    console.error('APS: failed to decode image:', err);
    URL.revokeObjectURL(url);
    appState.image = { bitmap: null, srcUrl: null, filename: null };
    appState.semantic = null;
    appState.semanticStatus = { source: 'none', state: 'unavailable' };
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
  appState.image = { bitmap: null, srcUrl: null, filename: null };
  appState.semantic = null;
  appState.semanticStatus = { source: 'none', state: 'unavailable' };
  appState.critiqueStep = 'idle';
  showEmptyState();
});

critiqueBtn.addEventListener('click', () => {
  if (!appState.image.bitmap) return;
  setCritiqueStep('diagnosis');
});

nextStepBtn.addEventListener('click', advanceCritiqueLoop);

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
showEmptyState();
