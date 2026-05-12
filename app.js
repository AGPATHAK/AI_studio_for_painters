/* ==========================================================================
   AI Painter Studio — app.js
   M1: upload, canvas render, resize re-fit, reset, theme toggle.
   No AI calls in M1 — that's M2.
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
  }
};

/* ── DOM refs ─────────────────────────────────────────────────────────────── */
const fileInput   = document.getElementById('file-input');
const uploadBtn   = document.getElementById('upload-btn');
const resetBtn    = document.getElementById('reset-btn');
const themeBtn    = document.getElementById('theme-btn');
const settingsBtn = document.getElementById('settings-btn');
const canvas      = document.getElementById('main-canvas');
const emptyState  = document.getElementById('empty-state');

// Guard: abort early if any required element is missing (catches future renames)
if (!fileInput || !uploadBtn || !resetBtn || !themeBtn ||
    !settingsBtn || !canvas || !emptyState) {
  console.error('APS: one or more required DOM elements not found.');
}

const ctx = canvas.getContext('2d');

/* ── Theme ────────────────────────────────────────────────────────────────── */

/**
 * Apply a theme mode to the document and persist it.
 * @param {string} mode  "light" | "dark" — anything else coerces to "light"
 */
function applyTheme(mode) {
  const safe = (mode === 'dark') ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', safe);
  themeBtn.textContent  = (safe === 'dark') ? '☀' : '🌙';
  themeBtn.title        = (safe === 'dark')
    ? 'Switch to light theme'
    : 'Switch to dark theme';
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

/* ── View helpers ─────────────────────────────────────────────────────────── */

function showCanvas() {
  canvas.hidden       = false;
  emptyState.hidden   = true;
  resetBtn.disabled   = false;
}

function showEmptyState() {
  canvas.hidden       = true;
  emptyState.hidden   = false;
  resetBtn.disabled   = true;
  canvas.width        = 0;
  canvas.height       = 0;
}

/* ── File upload ──────────────────────────────────────────────────────────── */

// Clicking Upload triggers the hidden file input
uploadBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', async () => {
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

    showCanvas();
    renderCanvas(bitmap);

  } catch (err) {
    console.error('APS: failed to decode image:', err);
    URL.revokeObjectURL(url);
    appState.image = { bitmap: null, srcUrl: null, filename: null };
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
  showEmptyState();
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

/* ── Settings stub ────────────────────────────────────────────────────────── */

settingsBtn.addEventListener('click', () => {
  // Settings panel (OpenAI key entry) wired in M2.
  console.info('APS: Settings panel coming in M2.');
});

/* ── Initialise ───────────────────────────────────────────────────────────── */

initTheme();
showEmptyState();
