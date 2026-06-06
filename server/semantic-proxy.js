/* ==========================================================================
   AI Painter Studio — local Gemini semantic proxy
   Serves the static prototype and keeps the Gemini API key server-side.
   ========================================================================== */

'use strict';

const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SERVER_DIR = __dirname;
const ROOT_DIR = path.resolve(SERVER_DIR, '..');
const MAX_BODY_BYTES = 30 * 1024 * 1024;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

loadEnv(path.join(SERVER_DIR, '.env'));
loadEnv(path.join(ROOT_DIR, '.env'));
loadEnv(path.join(os.homedir(), '.env'));

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '127.0.0.1';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview';
const LOCAL_DEV_ALLOWED_ORIGINS = new Set([
  'http://127.0.0.1:8081',
  'http://localhost:8081'
]);

const WORKFLOW_MODES = {
  REFERENCE_IDEATION: 'reference-ideation',
  IN_PROGRESS_GUIDANCE: 'in-progress-guidance',
  FINISHED_REVIEW: 'finished-review'
};

const SEMANTIC_PROMPT = [
  'You are a candid watercolor studio critic inside AI Painter Studio.',
  'Use painterly visual reasoning, not generic image captioning.',
  'Critique value structure first, then edge economy, atmosphere, focal hierarchy, and repaintability.',
  'Favor painterliness over photorealism: shape economy, connected washes, lost-and-found edges,',
  'atmospheric simplification, and Wesson/Seago-like restraint where relevant.',
  'Name visible forms concretely: mountain ridge, water band, shoreline dark accents,',
  'foreground fence shadows, vegetation cluster, cloud opening, reflected water strip, path shadows.',
  'Be candid and specific. Avoid vague praise, AI-art language, beautification, and global redesign.',
  'Teach one priority lesson. Defer secondary issues unless they support that lesson.',
  'Keep the correction selective and repaint-centered. Preserve freshness, light shapes, useful ambiguity,',
  'and successful washes. Warn against overworking, over-sharpening, or adding detail too soon.',
  'If object identity is uncertain, say so briefly rather than inventing certainty.',
  'Return JSON only, in the requested field order. Each field should be concise but painter-useful.'
].join(' ');

const SEMANTIC_SCHEMA = {
  type: 'OBJECT',
  properties: {
    sceneSummary: { type: 'STRING' },
    priorityDiagnosis: { type: 'STRING' },
    sceneRead: { type: 'STRING' },
    valueStructureCritique: { type: 'STRING' },
    focalHierarchyCritique: { type: 'STRING' },
    edgeAtmosphereCritique: { type: 'STRING' },
    chromaHierarchyCritique: { type: 'STRING' },
    watercolorHandling: { type: 'STRING' },
    interventionScope: { type: 'STRING' },
    demonstrationDescription: { type: 'STRING' },
    teachingPoint: { type: 'STRING' },
    repaintHandoff: { type: 'STRING' },
    preserve: { type: 'STRING' },
    avoid: { type: 'STRING' },
    uncertaintyNote: { type: 'STRING' }
  },
  required: [
    'priorityDiagnosis',
    'sceneRead',
    'valueStructureCritique',
    'focalHierarchyCritique',
    'edgeAtmosphereCritique',
    'chromaHierarchyCritique',
    'watercolorHandling',
    'interventionScope',
    'demonstrationDescription',
    'teachingPoint',
    'repaintHandoff',
    'preserve',
    'avoid',
    'uncertaintyNote'
  ]
};

const REFERENCE_IDEATION_PROMPT = [
  'You are a strong watercolor mentor, compositional designer, and painterly interpreter inside AI Painter Studio.',
  'This is Reference Ideation Mode. The input is a reference photograph before painting begins.',
  'Your task is to help the painter decide what the reference could become as a painting.',
  'Do not critique, score, rescue, repair, or give repaint guidance. Do not caption the image.',
  'Treat the photograph as raw painting material, not as a finished work, failed painting, travel subject, or prompt for image generation.',
  'Think first in design operations: connect shapes, merge small forms, compress values, subordinate busy passages,',
  'soften edges, suppress literal detail, crop for tension, and guide the eye through a clear visual pathway.',
  'Prefer painterly abstraction over description. Name visible forms only when they help explain a design decision.',
  'For dominantRead, state the main painting idea in terms of big shapes, directional movement, or tonal architecture.',
  'For sceneSummary, give only a terse motif anchor, not a caption or travel description.',
  'For valueMasses, identify 2 to 4 connected light/dark/mid-value families and suggest what should merge or compress.',
  'For atmosphereOpportunities, describe where omission, lost edges, softened distance, value compression, or muted chroma could create air.',
  'For focalHierarchy, choose one likely focal area and explain what surrounding passages should subordinate.',
  'For simplificationIdea, give a Wesson-esque interpretation: economy, atmosphere, connected washes, selective detail, mood through restraint, not imitation.',
  'For cropIdeas, offer 1 or 2 compositional alternatives based on balance, asymmetry, tension, silhouette, or pathway. Do not list generic crops.',
  'For suppress and emphasize, be specific about what to remove, merge, quiet, or make structurally dominant.',
  'Keep paletteDirection limited and practical: restrained pigments, warm/cool orchestration, chroma hierarchy, and atmospheric greys where useful.',
  'Avoid generic scene description, travel-writing tone, decorative adjectives, vague praise, AI-art phrasing, and phrases like beautiful, stunning, charming, picturesque, enhance, transform into, cinematic, masterpiece, highly detailed.',
  'Return JSON only, in the requested field order. Each field should be concise, visual, compositional, and useful before painting starts.'
].join(' ');

const REFERENCE_IDEATION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    sceneSummary: { type: 'STRING' },
    dominantRead: { type: 'STRING' },
    valueMasses: { type: 'STRING' },
    atmosphereOpportunities: { type: 'STRING' },
    focalHierarchy: { type: 'STRING' },
    simplificationIdea: { type: 'STRING' },
    paletteDirection: { type: 'STRING' },
    cropIdeas: { type: 'STRING' },
    moodPossibilities: { type: 'STRING' },
    suppress: { type: 'STRING' },
    emphasize: { type: 'STRING' },
    abstractionOpportunities: { type: 'STRING' },
    uncertaintyNote: { type: 'STRING' }
  },
  required: [
    'sceneSummary',
    'dominantRead',
    'valueMasses',
    'atmosphereOpportunities',
    'focalHierarchy',
    'simplificationIdea',
    'paletteDirection',
    'cropIdeas',
    'moodPossibilities',
    'suppress',
    'emphasize',
    'abstractionOpportunities',
    'uncertaintyNote'
  ]
};

const ANNOTATED_MOCKUP_PROMPT = [
  'Create an annotated painterly planning mockup from the provided reference image and ideation notes.',
  'This must be a working watercolor design guide, not final artwork and not a decorative rendering.',
  'Preserve the original subject, basic composition, and major shape relationships.',
  'Visibly annotate the image with painter-useful marks: arrows, circled focal area, simplified value mass overlays,',
  'and short labels such as "merge darks", "soften", "suppress detail", "keep contrast here", "quiet edge", or "value mass".',
  'Show stronger value grouping, clearer focal hierarchy, reduced clutter, edge hierarchy, and compositional movement.',
  'Prefer restraint: broad connected shapes, value compression, lost edges, selective accents, and Wesson-like economy without imitation.',
  'Do not make fantasy art, photoreal enhancement, style-transfer imitation, unrelated repainting, or a polished finished painting.',
  'Keep labels legible and sparse. The result should look like a painter marked up a planning print before starting a painting.'
].join(' ');

const IN_PROCESS_PROMPT = [
  'You are a candid watercolor studio mentor reviewing a work-in-progress painting.',
  'This is In-Process Mode. Judge the WIP on its own painting terms.',
  'A reference photo and/or annotated mockup may follow as optional context only; use them to understand intent, then focus on the WIP.',
  'Teach ONE priority lesson: name the most structurally important issue and defer secondary critiques unless they directly support that lesson.',
  'Diagnose before prescribing: name what is happening visually, explain why it matters as painting, then state what to try next.',
  'Value structure: assess shadow mass coherence — are the darks connected into dominant families or scattered?',
  'Are midtones overactive? Does the painting hold its read at a squint or from a distance?',
  'Focal hierarchy: name where the eye lands, what competes with it, and whether edges and contrast are allocated to support one dominant claim.',
  'Edge economy: which edges are over-equal? Which should be lost or softened? Where should hard edges be reserved for the focal area only?',
  'Chroma hierarchy: is saturation supporting depth and focal emphasis, or competing everywhere?',
  'Watercolor handling: name whether key passages feel fresh or overworked.',
  'If paper integrity is damaged, say so and recommend repainting over patching.',
  'Intervention scope: name the scope class — local, regional, compositional, or global study —',
  'and identify the protected passages before prescribing anything.',
  'AI tightness bias: your guidance must not push the painting toward more explicit edges, more separated forms, or digital tightness.',
  'Preserve ambiguity, atmospheric merging, and lost edges where they serve the painting.',
  'Close with one transferable teaching point that the painter can carry into future work beyond this image.',
  'Return JSON only, in the requested field order. Each field should be concise but actionable in the studio.'
].join(' ');

const FINISHED_CRITIQUE_PROMPT = [
  'You are an experienced watercolor painter and juror reviewing a finished painting.',
  'This is Finished Painting Critique Mode. The first image is the completed painting and is sufficient by itself.',
  'A reference, annotated mockup, or WIP may follow as optional context only; judge the finished painting as the main work.',
  'Do not give a beginner tutorial. Give serious studio or exhibition-level feedback about whether the piece feels resolved.',
  'Name the one issue that most determines whether this painting succeeds or fails.',
  'Value structure: judge value organization, shadow mass architecture, and readability at distance.',
  'Focal hierarchy: does the eye know where to go? What competes with it? Are edges and contrast hierarchically allocated?',
  'Edge economy: assess edge variety, brush economy, and whether hard edges are spent wisely near the focal area.',
  'Chroma hierarchy: is saturation controlled, compositionally justified, and supporting depth?',
  'Watercolor handling: assess freshness, transparency, wash unity, and paper integrity. Name overworked passages directly.',
  'AI tightness bias: resist calling for more rendering, sharper definition, or finishing that would make the painting less painterly.',
  'Give explicit stop/continue guidance. If further changes risk overworking the painting, say so clearly.',
  'Close with one transferable teaching point.',
  'Be candid and specific. Avoid excessive positivity, decorative adjectives, AI-art phrasing, and generic encouragement.',
  'Return JSON only, in the requested field order. Each field should sound like a concise exhibition or studio critique.'
].join(' ');

const server = http.createServer(async (req, res) => {
  let isApiRequest = false;

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    isApiRequest = ['/api/semantic', '/api/mockup', '/api/in-process',
      '/api/finished-critique'].includes(url.pathname);

    if (isApiRequest && req.method === 'OPTIONS') {
      sendApiPreflight(req, res);
      return;
    }

    if (url.pathname === '/api/semantic') {
      await handleSemantic(req, res);
      return;
    }

    if (url.pathname === '/api/mockup') {
      await handleMockup(req, res);
      return;
    }

    if (url.pathname === '/api/in-process') {
      await handleInProcess(req, res);
      return;
    }

    if (url.pathname === '/api/finished-critique') {
      await handleFinishedCritique(req, res);
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendJson(res, 405, { error: 'method_not_allowed' });
      return;
    }

    serveStatic(url.pathname, req, res);
  } catch (err) {
    console.error('APS proxy: request failed:', err);
    if (isApiRequest) {
      sendApiJson(req, res, 500, { error: 'proxy_error' });
    } else {
      sendJson(res, 500, { error: 'proxy_error' });
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`APS semantic proxy listening at http://${HOST}:${PORT}`);
  console.log(`Gemini model: ${GEMINI_MODEL}`);
  console.log(`Gemini image model: ${GEMINI_IMAGE_MODEL}`);
});

async function handleSemantic(req, res) {
  console.log('APS proxy: semantic request received');
  if (req.method !== 'POST') {
    sendApiJson(req, res, 405, { error: 'method_not_allowed' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    sendApiJson(req, res, 503, { error: 'missing_gemini_api_key' });
    return;
  }

  const body = await readJsonBody(req);
  const image = typeof body.image === 'string' ? body.image.trim() : '';
  const mimeType = typeof body.mimeType === 'string' ? body.mimeType : '';
  const workflowMode = normalizeWorkflowMode(body.workflowMode);

  if (!image || !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    sendApiJson(req, res, 400, { error: 'invalid_image' });
    return;
  }

  const semantic = await callGeminiSemanticPass(image, mimeType, workflowMode);
  console.log(`APS proxy: ${workflowMode} object created`);
  sendApiJson(req, res, 200, semantic);
}

async function handleMockup(req, res) {
  console.log('APS proxy: mockup request received');
  if (req.method !== 'POST') {
    sendApiJson(req, res, 405, { error: 'method_not_allowed' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    sendApiJson(req, res, 503, { error: 'missing_gemini_api_key' });
    return;
  }

  const body = await readJsonBody(req);
  const image = typeof body.image === 'string' ? body.image.trim() : '';
  const mimeType = typeof body.mimeType === 'string' ? body.mimeType : '';
  const ideation = body.ideation && typeof body.ideation === 'object' ? body.ideation : {};

  if (!image || !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    sendApiJson(req, res, 400, { error: 'invalid_image' });
    return;
  }

  const mockup = await callGeminiMockupPass(image, mimeType, ideation);
  console.log('APS proxy: annotated mockup image created');
  sendApiJson(req, res, 200, mockup);
}

async function handleInProcess(req, res) {
  console.log('APS proxy: in-process request received');
  if (req.method !== 'POST') {
    sendApiJson(req, res, 405, { error: 'method_not_allowed' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    sendApiJson(req, res, 503, { error: 'missing_gemini_api_key' });
    return;
  }

  const body = await readJsonBody(req);
  const wipImage = typeof body.wipImage === 'string' ? body.wipImage.trim() : '';
  const wipMimeType = typeof body.wipMimeType === 'string' ? body.wipMimeType : '';
  const referenceImage = typeof body.referenceImage === 'string' ? body.referenceImage.trim() : '';
  const referenceMimeType = typeof body.referenceMimeType === 'string' ? body.referenceMimeType : '';
  const mockupImage = typeof body.mockupImage === 'string' ? body.mockupImage.trim() : '';
  const mockupMimeType = typeof body.mockupMimeType === 'string' ? body.mockupMimeType : '';

  if (!wipImage || !isSupportedImageMimeType(wipMimeType)) {
    sendApiJson(req, res, 400, { error: 'invalid_wip_image' });
    return;
  }

  if ((referenceImage && !isSupportedImageMimeType(referenceMimeType)) ||
      (mockupImage && !isSupportedImageMimeType(mockupMimeType))) {
    sendApiJson(req, res, 400, { error: 'invalid_context_image' });
    return;
  }

  const critique = await callGeminiInProcessPass({
    wipImage,
    wipMimeType,
    referenceImage,
    referenceMimeType,
    mockupImage,
    mockupMimeType
  });
  console.log('APS proxy: in-process critique object created');
  sendApiJson(req, res, 200, critique);
}

async function handleFinishedCritique(req, res) {
  console.log('APS proxy: finished critique request received');
  if (req.method !== 'POST') {
    sendApiJson(req, res, 405, { error: 'method_not_allowed' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    sendApiJson(req, res, 503, { error: 'missing_gemini_api_key' });
    return;
  }

  const body = await readJsonBody(req);
  const finishedImage = typeof body.finishedImage === 'string' ? body.finishedImage.trim() : '';
  const finishedMimeType = typeof body.finishedMimeType === 'string' ? body.finishedMimeType : '';
  const referenceImage = typeof body.referenceImage === 'string' ? body.referenceImage.trim() : '';
  const referenceMimeType = typeof body.referenceMimeType === 'string' ? body.referenceMimeType : '';
  const wipImage = typeof body.wipImage === 'string' ? body.wipImage.trim() : '';
  const wipMimeType = typeof body.wipMimeType === 'string' ? body.wipMimeType : '';
  const mockupImage = typeof body.mockupImage === 'string' ? body.mockupImage.trim() : '';
  const mockupMimeType = typeof body.mockupMimeType === 'string' ? body.mockupMimeType : '';

  if (!finishedImage || !isSupportedImageMimeType(finishedMimeType)) {
    sendApiJson(req, res, 400, { error: 'invalid_finished_image' });
    return;
  }

  if ((referenceImage && !isSupportedImageMimeType(referenceMimeType)) ||
      (wipImage && !isSupportedImageMimeType(wipMimeType)) ||
      (mockupImage && !isSupportedImageMimeType(mockupMimeType))) {
    sendApiJson(req, res, 400, { error: 'invalid_context_image' });
    return;
  }

  const critique = await callGeminiFinishedPass({
    finishedImage,
    finishedMimeType,
    referenceImage,
    referenceMimeType,
    wipImage,
    wipMimeType,
    mockupImage,
    mockupMimeType
  });
  console.log('APS proxy: finished critique object created');
  sendApiJson(req, res, 200, critique);
}

async function callGeminiSemanticPass(imageBase64, mimeType, workflowMode) {
  const prompt = promptForWorkflow(workflowMode);
  const schema = schemaForWorkflow(workflowMode);
  const temperature = workflowMode === WORKFLOW_MODES.REFERENCE_IDEATION ? 0.45 : 0.2;

  const response = await fetch(
    `${GEMINI_ENDPOINT}/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64
              }
            },
            { text: prompt }
          ]
        }],
        generationConfig: {
          response_mime_type: 'application/json',
          response_schema: schema,
          temperature,
          max_output_tokens: 2400
        }
      })
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error?.message || `Gemini returned ${response.status}`;
    throw new Error(message);
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map(part => part.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini returned no semantic JSON');
  }

  console.log(`APS proxy: Gemini response received: ${previewText(text)}`);
  const parsed = parseSemanticJson(text);
  console.log('APS proxy: parse completed');
  return normalizeSemanticResponse(parsed, workflowMode);
}

async function callGeminiInProcessPass(context) {
  const parts = [
    { text: buildInProcessPrompt(context) },
    { text: 'WIP painting image:' },
    {
      inline_data: {
        mime_type: context.wipMimeType,
        data: context.wipImage
      }
    }
  ];

  if (context.referenceImage) {
    parts.push(
      { text: 'Optional reference context image:' },
      {
        inline_data: {
          mime_type: context.referenceMimeType,
          data: context.referenceImage
        }
      }
    );
  }

  if (context.mockupImage) {
    parts.push(
      { text: 'Optional annotated mockup context image:' },
      {
        inline_data: {
          mime_type: context.mockupMimeType,
          data: context.mockupImage
        }
      }
    );
  }

  const response = await fetch(
    `${GEMINI_ENDPOINT}/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          response_mime_type: 'application/json',
          response_schema: SEMANTIC_SCHEMA,
          temperature: 0.2,
          max_output_tokens: 3200
        }
      })
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error?.message || `Gemini returned ${response.status}`;
    throw new Error(message);
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map(part => part.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini returned no in-process JSON');
  }

  console.log(`APS proxy: Gemini in-process response received: ${previewText(text)}`);
  const parsed = parseSemanticJson(text);
  return normalizeSemanticResponse(parsed, WORKFLOW_MODES.IN_PROGRESS_GUIDANCE);
}

async function callGeminiFinishedPass(context) {
  const parts = [
    { text: buildFinishedCritiquePrompt(context) },
    { text: 'Finished painting image:' },
    {
      inline_data: {
        mime_type: context.finishedMimeType,
        data: context.finishedImage
      }
    }
  ];

  if (context.referenceImage) {
    parts.push(
      { text: 'Optional reference context image:' },
      {
        inline_data: {
          mime_type: context.referenceMimeType,
          data: context.referenceImage
        }
      }
    );
  }

  if (context.wipImage) {
    parts.push(
      { text: 'Optional WIP context image:' },
      {
        inline_data: {
          mime_type: context.wipMimeType,
          data: context.wipImage
        }
      }
    );
  }

  if (context.mockupImage) {
    parts.push(
      { text: 'Optional annotated mockup context image:' },
      {
        inline_data: {
          mime_type: context.mockupMimeType,
          data: context.mockupImage
        }
      }
    );
  }

  const response = await fetch(
    `${GEMINI_ENDPOINT}/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          response_mime_type: 'application/json',
          response_schema: SEMANTIC_SCHEMA,
          temperature: 0.25,
          max_output_tokens: 3200
        }
      })
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error?.message || `Gemini returned ${response.status}`;
    throw new Error(message);
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map(part => part.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini returned no finished critique JSON');
  }

  console.log(`APS proxy: Gemini finished response received: ${previewText(text)}`);
  const parsed = parseSemanticJson(text);
  return normalizeSemanticResponse(parsed, WORKFLOW_MODES.FINISHED_REVIEW);
}

async function callGeminiMockupPass(imageBase64, mimeType, ideation) {
  const prompt = buildAnnotatedMockupPrompt(ideation);
  const response = await fetch(
    `${GEMINI_ENDPOINT}/${encodeURIComponent(GEMINI_IMAGE_MODEL)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64
              }
            }
          ]
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      })
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error?.message || `Gemini image model returned ${response.status}`;
    throw new Error(message);
  }

  const parts = payload.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(part => part.inlineData || part.inline_data);
  if (!imagePart) {
    throw new Error('Gemini image model returned no image');
  }

  const inlineData = imagePart.inlineData || imagePart.inline_data;
  const data = inlineData.data;
  const outputMimeType = inlineData.mimeType || inlineData.mime_type || 'image/png';
  if (!data) {
    throw new Error('Gemini image model returned empty image data');
  }

  const notes = parts
    .map(part => cleanText(part.text, ''))
    .filter(Boolean)
    .join(' ');

  return {
    source: 'gemini',
    model: GEMINI_IMAGE_MODEL,
    mimeType: outputMimeType,
    image: data,
    imageDataUrl: `data:${outputMimeType};base64,${data}`,
    notes
  };
}

function buildAnnotatedMockupPrompt(ideation) {
  const notes = summarizeIdeationForMockup(ideation);
  return [
    ANNOTATED_MOCKUP_PROMPT,
    '',
    'Current Reference Ideation notes:',
    notes || 'No structured ideation notes were available. Infer a restrained painterly planning mockup from the image itself.'
  ].join('\n');
}

function buildInProcessPrompt(context) {
  const contextLine = [
    context.referenceImage ? 'reference photo available' : 'no reference photo supplied',
    context.mockupImage ? 'annotated mockup available' : 'no annotated mockup supplied'
  ].join('; ');

  return [
    IN_PROCESS_PROMPT,
    '',
    `Context: ${contextLine}.`,
    'For priorityDiagnosis, name the single most structurally important lesson in one or two sentences.',
    'For sceneRead, describe what the current painting reads as from a distance, including uncertainty if needed.',
    'For valueStructureCritique, assess shadow mass coherence, midtone activity, and whether darks are connected into dominant families.',
    'For focalHierarchyCritique, name the dominant focal claim, what competes with it, and whether edges and contrast support or undermine it.',
    'For edgeAtmosphereCritique, identify over-equal edges, passages to lose or soften, and where hard edges are misallocated.',
    'For chromaHierarchyCritique, say whether saturation is supporting depth and focal emphasis or competing across the painting.',
    'For watercolorHandling, name specific passages that feel fresh or overworked. If paper integrity is damaged, say so and recommend repainting.',
    'For interventionScope, name the scope class (local, regional, compositional, or global study), the target passage, and the protected passages.',
    'For demonstrationDescription, describe a small mental overlay or study mark that would clarify the correction without over-rendering.',
    'For teachingPoint, name one transferable principle the painter can carry beyond this image.',
    'For repaintHandoff, give 3 to 5 ordered next painting actions in one compact paragraph.',
    'For preserve and avoid, be specific about what should stay fresh and what action would damage the WIP further.'
  ].join('\n');
}

function buildFinishedCritiquePrompt(context) {
  const contextLine = [
    context.referenceImage ? 'reference photo available' : 'no reference photo supplied',
    context.wipImage ? 'WIP image available' : 'no WIP image supplied',
    context.mockupImage ? 'annotated mockup available' : 'no annotated mockup supplied'
  ].join('; ');

  return [
    FINISHED_CRITIQUE_PROMPT,
    '',
    `Context: ${contextLine}.`,
    'For priorityDiagnosis, state the single strongest critique: what determines whether this painting succeeds or fails.',
    'For sceneRead, describe the first read of the finished painting — what the eye does, where it lands, what it feels.',
    'For valueStructureCritique, judge value organization, shadow mass architecture, and readability at distance.',
    'For focalHierarchyCritique, say whether focal contrast, edge emphasis, and chroma are hierarchically allocated to one dominant area.',
    'For edgeAtmosphereCritique, judge edge variety, atmospheric freshness, and whether hard edges are spent wisely.',
    'For chromaHierarchyCritique, judge whether saturation is compositionally justified and supporting depth.',
    'For watercolorHandling, assess freshness, transparency, wash unity, paper integrity, and name any overworked passages directly.',
    'For interventionScope, say whether any final adjustment is narrow enough to attempt, or whether the painting should stop.',
    'For demonstrationDescription, describe a mental comparison or small test that would clarify whether a change is worth risking.',
    'For teachingPoint, name one transferable lesson from this painting.',
    'For repaintHandoff, give explicit stop/continue guidance and any final limited actions.',
    'For preserve and avoid, identify what must remain untouched and what action would weaken or overwork the finished painting.'
  ].join('\n');
}

function summarizeIdeationForMockup(ideation) {
  const fields = [
    ['Dominant read', ideation.dominantRead],
    ['Value masses', ideation.valueMasses],
    ['Atmosphere', ideation.atmosphereOpportunities],
    ['Focal hierarchy', ideation.focalHierarchy],
    ['Simplification', ideation.simplificationIdea],
    ['Crop ideas', ideation.cropIdeas],
    ['Palette direction', ideation.paletteDirection],
    ['Suppress', ideation.suppress],
    ['Emphasize', ideation.emphasize],
    ['Abstraction', ideation.abstractionOpportunities]
  ];

  return fields
    .map(([label, value]) => {
      const cleaned = cleanText(value, '');
      return cleaned ? `${label}: ${cleaned}` : '';
    })
    .filter(Boolean)
    .join('\n')
    .slice(0, 4000);
}

function normalizeSemanticResponse(raw, workflowMode = WORKFLOW_MODES.IN_PROGRESS_GUIDANCE) {
  const safe = raw && typeof raw === 'object' ? raw : {};
  return {
    source: 'gemini',
    workflowMode,
    sceneSummary: cleanText(safe.sceneSummary, ''),
    priorityDiagnosis: cleanText(safe.priorityDiagnosis, ''),
    sceneRead: cleanText(safe.sceneRead, ''),
    valueStructureCritique: cleanText(safe.valueStructureCritique, ''),
    focalHierarchyCritique: cleanText(safe.focalHierarchyCritique, ''),
    edgeAtmosphereCritique: cleanText(safe.edgeAtmosphereCritique, ''),
    chromaHierarchyCritique: cleanText(safe.chromaHierarchyCritique, ''),
    watercolorHandling: cleanText(safe.watercolorHandling, ''),
    interventionScope: cleanText(safe.interventionScope, ''),
    demonstrationDescription: cleanText(safe.demonstrationDescription, ''),
    teachingPoint: cleanText(safe.teachingPoint, ''),
    repaintHandoff: cleanText(safe.repaintHandoff, ''),
    preserve: cleanText(safe.preserve, ''),
    avoid: cleanText(safe.avoid, ''),
    uncertaintyNote: cleanText(safe.uncertaintyNote, ''),
    regions: normalizeRegions(safe.regions),
    valueFamilies: normalizeValueFamilies(safe.valueFamilies, safe),
    primaryIssue: cleanText(safe.primaryIssue, ''),
    critiqueTarget: cleanText(safe.critiqueTarget, ''),
    protectedPassages: normalizeStringArray(safe.protectedPassages, [
      'main light shape',
      'fresh outer washes'
    ]),
    repaintFirstAction: cleanText(safe.repaintFirstAction, ''),
    repaintPreserve: normalizeStringArray(safe.repaintPreserve, []),
    repaintCaution: cleanText(safe.repaintCaution, ''),
    uncertaintyNotes: normalizeStringArray(safe.uncertaintyNotes, []),
    dominantRead: cleanText(safe.dominantRead, ''),
    valueMasses: cleanText(safe.valueMasses, ''),
    atmosphereOpportunities: cleanText(safe.atmosphereOpportunities, ''),
    focalHierarchy: cleanText(safe.focalHierarchy, ''),
    simplificationIdea: cleanText(safe.simplificationIdea, ''),
    paletteDirection: cleanText(safe.paletteDirection, ''),
    cropIdeas: cleanText(safe.cropIdeas, ''),
    moodPossibilities: cleanText(safe.moodPossibilities, ''),
    suppress: cleanText(safe.suppress, ''),
    emphasize: cleanText(safe.emphasize, ''),
    abstractionOpportunities: cleanText(safe.abstractionOpportunities, '')
  };
}

function normalizeWorkflowMode(value) {
  return Object.values(WORKFLOW_MODES).includes(value)
    ? value
    : WORKFLOW_MODES.IN_PROGRESS_GUIDANCE;
}

function isSupportedImageMimeType(mimeType) {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(mimeType);
}

function promptForWorkflow(workflowMode) {
  if (workflowMode === WORKFLOW_MODES.REFERENCE_IDEATION) {
    return REFERENCE_IDEATION_PROMPT;
  }
  return SEMANTIC_PROMPT;
}

function schemaForWorkflow(workflowMode) {
  if (workflowMode === WORKFLOW_MODES.REFERENCE_IDEATION) {
    return REFERENCE_IDEATION_SCHEMA;
  }
  return SEMANTIC_SCHEMA;
}

function normalizeRegions(regions) {
  if (!Array.isArray(regions) || regions.length === 0) {
    return [];
  }
  return regions
    .slice(0, 10)
    .map((region, index) => normalizeRegion(region, index))
    .filter(region => region.label);
}

function normalizeRegion(region, index) {
  if (typeof region === 'string') {
    return {
      id: `region_${index + 1}`,
      label: cleanText(region, ''),
      position: ''
    };
  }

  const safe = region && typeof region === 'object' ? region : {};
  return {
    id: cleanIdentifier(safe.id, `region_${index + 1}`),
    label: cleanText(
      safe.label || safe.name || safe.description || safe.sceneForm || safe.form,
      ''
    ),
    position: cleanText(safe.position || safe.location || safe.spatialPosition, '')
  };
}

function normalizeValueFamilies(families, semanticRoot) {
  if (!Array.isArray(families) || families.length === 0) {
    const critiqueTarget = cleanText(semanticRoot?.critiqueTarget, '');
    return critiqueTarget
      ? [{
        id: 'target_shadow_family',
        label: critiqueTarget,
        role: 'dominant value/shadow family',
        position: '',
        regionIds: []
      }]
      : [];
  }
  return families
    .slice(0, 6)
    .map((family, index) => normalizeValueFamily(family, index))
    .filter(family => family.label);
}

function normalizeValueFamily(family, index) {
  if (typeof family === 'string') {
    return {
      id: `value_family_${index + 1}`,
      label: cleanText(family, ''),
      role: '',
      position: '',
      regionIds: []
    };
  }

  const safe = family && typeof family === 'object' ? family : {};
  return {
    id: cleanIdentifier(safe.id, `value_family_${index + 1}`),
    label: cleanText(
      safe.label || safe.name || safe.description || safe.valueGroup || safe.shadowFamily,
      ''
    ),
    role: cleanText(safe.role || safe.function || safe.valueRole, ''),
    position: cleanText(safe.position || safe.location || safe.spatialPosition, ''),
    regionIds: normalizeStringArray(safe.regionIds, [])
  };
}

function normalizeStringArray(value, fallback) {
  return Array.isArray(value) && value.length
    ? value.map(item => cleanText(item, '')).filter(Boolean)
    : fallback;
}

function cleanText(value, fallback) {
  if (value === undefined || value === null) return fallback;
  const cleaned = String(value)
    .replace(/\s+/g, ' ')
    .replace(/^[\s"'-]+|[\s"'-]+$/g, '')
    .trim();
  return cleaned || fallback;
}

function cleanIdentifier(value, fallback) {
  const cleaned = cleanText(value, fallback)
    .toLowerCase()
    .replace(/[^a-z0-9_ -]/g, '')
    .replace(/\s+/g, '_');
  return cleaned || fallback;
}

function parseSemanticJson(text) {
  const candidates = buildJsonCandidates(text);
  let firstError = null;

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (isSemanticRoot(parsed)) return parsed;
    } catch (err) {
      firstError ||= err;
    }

    try {
      const parsed = JSON.parse(lightCleanupJson(candidate));
      if (isSemanticRoot(parsed)) return parsed;
    } catch (err) {
      firstError ||= err;
    }
  }

  const recovered = recoverSemanticFields(text);
  if (recovered) {
    console.warn('APS proxy: semantic JSON parse recovered partial fields');
    return recovered;
  }

  console.warn(`APS proxy: semantic JSON parse failed: ${firstError?.message || 'unknown error'}`);
  throw firstError || new Error('failed to parse semantic JSON');
}

function isSemanticRoot(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return [
    'priorityDiagnosis',
    'sceneRead',
    'valueStructureCritique',
    'edgeAtmosphereCritique',
    'interventionScope',
    'demonstrationDescription',
    'repaintHandoff',
    'preserve',
    'avoid',
    'uncertaintyNote',
    'sceneSummary',
    'dominantRead',
    'valueMasses',
    'atmosphereOpportunities',
    'focalHierarchy',
    'simplificationIdea',
    'paletteDirection',
    'cropIdeas',
    'moodPossibilities',
    'suppress',
    'emphasize',
    'abstractionOpportunities',
    'regions',
    'valueFamilies',
    'protectedPassages'
  ]
    .some(key => Object.prototype.hasOwnProperty.call(value, key));
}

function buildJsonCandidates(text) {
  const stripped = stripMarkdownFences(text).trim();
  const candidates = [stripped];
  const balanced = extractBalancedJsonBlocks(stripped);
  candidates.push(...balanced);

  const firstBrace = stripped.indexOf('{');
  const lastBrace = stripped.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(stripped.slice(firstBrace, lastBrace + 1));
  }

  return [...new Set(candidates.map(item => item.trim()).filter(Boolean))]
    .sort((a, b) => b.length - a.length);
}

function stripMarkdownFences(text) {
  return text
    .replace(/^\s*```(?:json|javascript|js)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .replace(/```(?:json|javascript|js)?/gi, '')
    .replace(/```/g, '');
}

function extractBalancedJsonBlocks(text) {
  const blocks = [];

  for (let start = text.indexOf('{'); start !== -1; start = text.indexOf('{', start + 1)) {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < text.length; index += 1) {
      const char = text[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
      } else if (char === '{') {
        depth += 1;
      } else if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          blocks.push(text.slice(start, index + 1));
          break;
        }
      }
    }
  }

  return blocks;
}

function lightCleanupJson(text) {
  return text
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\bundefined\b/g, 'null');
}

function recoverSemanticFields(text) {
  const recovered = {};
  const priorityDiagnosis = recoverStringValue(text, 'priorityDiagnosis');
  const sceneRead = recoverStringValue(text, 'sceneRead');
  const valueStructureCritique = recoverStringValue(text, 'valueStructureCritique');
  const edgeAtmosphereCritique = recoverStringValue(text, 'edgeAtmosphereCritique');
  const interventionScope = recoverStringValue(text, 'interventionScope');
  const demonstrationDescription = recoverStringValue(text, 'demonstrationDescription');
  const repaintHandoff = recoverStringValue(text, 'repaintHandoff');
  const preserve = recoverStringValue(text, 'preserve');
  const avoid = recoverStringValue(text, 'avoid');
  const uncertaintyNote = recoverStringValue(text, 'uncertaintyNote');
  const sceneSummary = recoverStringValue(text, 'sceneSummary');
  const primaryIssue = recoverStringValue(text, 'primaryIssue');
  const critiqueTarget = recoverStringValue(text, 'critiqueTarget');
  const repaintFirstAction = recoverStringValue(text, 'repaintFirstAction');
  const repaintCaution = recoverStringValue(text, 'repaintCaution');
  const protectedPassages = recoverStringArray(text, 'protectedPassages');
  const repaintPreserve = recoverStringArray(text, 'repaintPreserve');
  const uncertaintyNotes = recoverStringArray(text, 'uncertaintyNotes');
  const dominantRead = recoverStringValue(text, 'dominantRead');
  const valueMasses = recoverStringValue(text, 'valueMasses');
  const atmosphereOpportunities = recoverStringValue(text, 'atmosphereOpportunities');
  const focalHierarchy = recoverStringValue(text, 'focalHierarchy');
  const simplificationIdea = recoverStringValue(text, 'simplificationIdea');
  const paletteDirection = recoverStringValue(text, 'paletteDirection');
  const cropIdeas = recoverStringValue(text, 'cropIdeas');
  const moodPossibilities = recoverStringValue(text, 'moodPossibilities');
  const suppress = recoverStringValue(text, 'suppress');
  const emphasize = recoverStringValue(text, 'emphasize');
  const abstractionOpportunities = recoverStringValue(text, 'abstractionOpportunities');
  const regions = recoverObjectArray(text, 'regions');
  const valueFamilies = recoverObjectArray(text, 'valueFamilies');

  if (priorityDiagnosis) recovered.priorityDiagnosis = priorityDiagnosis;
  if (sceneRead) recovered.sceneRead = sceneRead;
  if (valueStructureCritique) recovered.valueStructureCritique = valueStructureCritique;
  if (edgeAtmosphereCritique) recovered.edgeAtmosphereCritique = edgeAtmosphereCritique;
  if (interventionScope) recovered.interventionScope = interventionScope;
  if (demonstrationDescription) recovered.demonstrationDescription = demonstrationDescription;
  if (repaintHandoff) recovered.repaintHandoff = repaintHandoff;
  if (preserve) recovered.preserve = preserve;
  if (avoid) recovered.avoid = avoid;
  if (uncertaintyNote) recovered.uncertaintyNote = uncertaintyNote;
  if (sceneSummary) recovered.sceneSummary = sceneSummary;
  if (primaryIssue) recovered.primaryIssue = primaryIssue;
  if (critiqueTarget) recovered.critiqueTarget = critiqueTarget;
  if (repaintFirstAction) recovered.repaintFirstAction = repaintFirstAction;
  if (repaintCaution) recovered.repaintCaution = repaintCaution;
  if (protectedPassages.length) recovered.protectedPassages = protectedPassages;
  if (repaintPreserve.length) recovered.repaintPreserve = repaintPreserve;
  if (uncertaintyNotes.length) recovered.uncertaintyNotes = uncertaintyNotes;
  if (dominantRead) recovered.dominantRead = dominantRead;
  if (valueMasses) recovered.valueMasses = valueMasses;
  if (atmosphereOpportunities) recovered.atmosphereOpportunities = atmosphereOpportunities;
  if (focalHierarchy) recovered.focalHierarchy = focalHierarchy;
  if (simplificationIdea) recovered.simplificationIdea = simplificationIdea;
  if (paletteDirection) recovered.paletteDirection = paletteDirection;
  if (cropIdeas) recovered.cropIdeas = cropIdeas;
  if (moodPossibilities) recovered.moodPossibilities = moodPossibilities;
  if (suppress) recovered.suppress = suppress;
  if (emphasize) recovered.emphasize = emphasize;
  if (abstractionOpportunities) recovered.abstractionOpportunities = abstractionOpportunities;
  if (regions.length) recovered.regions = regions;
  if (valueFamilies.length) recovered.valueFamilies = valueFamilies;

  return Object.keys(recovered).length ? recovered : null;
}

function recoverStringValue(text, key) {
  const keyIndex = text.indexOf(`"${key}"`);
  if (keyIndex === -1) return '';

  const colon = text.indexOf(':', keyIndex);
  const start = text.indexOf('"', colon + 1);
  if (colon === -1 || start === -1) return '';

  const quoted = readQuotedString(text, start);
  return quoted.closed ? quoted.value : '';
}

function recoverStringArray(text, key) {
  const body = extractArrayBody(text, key);
  if (!body) return [];

  const values = [];
  const regex = /"([^"]+)"/g;
  let match = regex.exec(body);
  while (match) {
    values.push(sanitizeRecoveredString(match[1]));
    match = regex.exec(body);
  }
  return values;
}

function recoverObjectArray(text, key) {
  const body = extractArrayBody(text, key);
  if (!body) return [];

  return extractBalancedJsonBlocks(body)
    .map(block => {
      try {
        return JSON.parse(lightCleanupJson(block));
      } catch (_err) {
        return null;
      }
    })
    .filter(Boolean);
}

function extractArrayBody(text, key) {
  const keyIndex = text.indexOf(`"${key}"`);
  if (keyIndex === -1) return '';

  const start = text.indexOf('[', keyIndex);
  if (start === -1) return '';

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === '[') {
      depth += 1;
    } else if (char === ']') {
      depth -= 1;
      if (depth === 0) return text.slice(start + 1, index);
    }
  }

  const nextTopLevelKey = text.slice(start + 1).search(/\n\s*"[A-Za-z][A-Za-z0-9_]*"\s*:/);
  if (nextTopLevelKey !== -1) {
    return text.slice(start + 1, start + 1 + nextTopLevelKey);
  }
  return text.slice(start + 1);
}

function sanitizeRecoveredString(value) {
  return String(value)
    .replace(/\\"/g, '"')
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readQuotedString(text, quoteIndex) {
  let value = '';
  let escaped = false;

  for (let index = quoteIndex + 1; index < text.length; index += 1) {
    const char = text[index];
    if (escaped) {
      value += char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === '"') {
      return { value: sanitizeRecoveredString(value), closed: true };
    } else {
      value += char;
    }
  }

  return { value: sanitizeRecoveredString(value), closed: false };
}

function previewText(text) {
  return String(text)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytes = 0;

    req.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        reject(new Error('request body too large'));
        req.destroy();
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });

    req.on('error', reject);
  });
}

function serveStatic(urlPath, req, res) {
  const safePath = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = safePath === '/' ? '/index.html' : safePath;
  const filePath = path.resolve(ROOT_DIR, `.${normalized}`);

  if (!filePath.startsWith(ROOT_DIR) || filePath.includes(`${path.sep}.env`)) {
    sendText(res, 403, 'Forbidden');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      sendText(res, 404, 'Not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentTypeFor(filePath),
      'Cache-Control': 'no-store'
    });
    if (req.method === 'HEAD') {
      res.end();
    } else {
      res.end(content);
    }
  });
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon'
  }[ext] || 'application/octet-stream';
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function sendApiJson(req, res, status, payload) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  };
  addLocalDevCorsHeaders(req, headers);
  res.writeHead(status, headers);
  res.end(JSON.stringify(payload));
}

function sendApiPreflight(req, res) {
  const headers = { 'Cache-Control': 'no-store' };
  addLocalDevCorsHeaders(req, headers);
  res.writeHead(204, headers);
  res.end();
}

function addLocalDevCorsHeaders(req, headers) {
  const origin = req.headers.origin;
  if (!LOCAL_DEV_ALLOWED_ORIGINS.has(origin)) return;

  headers['Access-Control-Allow-Origin'] = origin;
  headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  headers['Access-Control-Allow-Headers'] = 'Content-Type';
  headers.Vary = 'Origin';
}

function sendText(res, status, text) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(text);
}

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
