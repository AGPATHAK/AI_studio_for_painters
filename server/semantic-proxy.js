/* ==========================================================================
   AI Painter Studio — local Gemini semantic proxy
   Serves the static prototype and keeps the Gemini API key server-side.
   ========================================================================== */

'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const SERVER_DIR = __dirname;
const ROOT_DIR = path.resolve(SERVER_DIR, '..');
const MAX_BODY_BYTES = 12 * 1024 * 1024;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

loadEnv(path.join(SERVER_DIR, '.env'));
loadEnv(path.join(ROOT_DIR, '.env'));

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '127.0.0.1';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

const SEMANTIC_PROMPT = [
  'You are providing semantic interpretation for a painter critique prototype.',
  'Do not critique, improve, generate, beautify, or prescribe edits.',
  'Identify only major scene regions, spatial labels, connected shadow/value families,',
  'and passages that should be protected during a selective repaint lesson.',
  'Use concise painter-friendly labels such as distant mountain mass, shoreline darks,',
  'foreground vegetation band, water-shadow family, or sky opening.',
  'Return JSON only.'
].join(' ');

const SEMANTIC_SCHEMA = {
  type: 'OBJECT',
  properties: {
    sceneSummary: { type: 'STRING' },
    regions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          label: { type: 'STRING' },
          position: { type: 'STRING' }
        },
        required: ['id', 'label', 'position']
      }
    },
    valueFamilies: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          label: { type: 'STRING' },
          role: { type: 'STRING' },
          position: { type: 'STRING' },
          regionIds: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          }
        },
        required: ['id', 'label', 'role', 'position', 'regionIds']
      }
    },
    protectedPassages: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    }
  },
  required: ['sceneSummary', 'regions', 'valueFamilies', 'protectedPassages']
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/api/semantic') {
      await handleSemantic(req, res);
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendJson(res, 405, { error: 'method_not_allowed' });
      return;
    }

    serveStatic(url.pathname, req, res);
  } catch (err) {
    console.error('APS proxy: request failed:', err);
    sendJson(res, 500, { error: 'proxy_error' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`APS semantic proxy listening at http://${HOST}:${PORT}`);
  console.log(`Gemini model: ${GEMINI_MODEL}`);
});

async function handleSemantic(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method_not_allowed' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    sendJson(res, 503, { error: 'missing_gemini_api_key' });
    return;
  }

  const body = await readJsonBody(req);
  const image = typeof body.image === 'string' ? body.image.trim() : '';
  const mimeType = typeof body.mimeType === 'string' ? body.mimeType : '';

  if (!image || !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    sendJson(res, 400, { error: 'invalid_image' });
    return;
  }

  const semantic = await callGeminiSemanticPass(image, mimeType);
  sendJson(res, 200, semantic);
}

async function callGeminiSemanticPass(imageBase64, mimeType) {
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
            { text: SEMANTIC_PROMPT }
          ]
        }],
        generationConfig: {
          response_mime_type: 'application/json',
          response_schema: SEMANTIC_SCHEMA,
          temperature: 0.2,
          max_output_tokens: 900
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

  console.log(`APS proxy: Gemini response preview: ${previewText(text)}`);
  return normalizeSemanticResponse(parseSemanticJson(text));
}

function normalizeSemanticResponse(raw) {
  const safe = raw && typeof raw === 'object' ? raw : {};
  return {
    source: 'gemini',
    sceneSummary: stringOr(safe.sceneSummary, 'scene with major value masses'),
    regions: normalizeRegions(safe.regions),
    valueFamilies: normalizeValueFamilies(safe.valueFamilies),
    protectedPassages: normalizeStringArray(safe.protectedPassages, [
      'main light shape',
      'fresh outer washes'
    ])
  };
}

function normalizeRegions(regions) {
  if (!Array.isArray(regions) || regions.length === 0) {
    return [{ id: 'main_region', label: 'main scene mass', position: 'central field' }];
  }
  return regions.slice(0, 7).map((region, index) => ({
    id: stringOr(region.id, `region_${index + 1}`),
    label: stringOr(region.label, 'scene region'),
    position: stringOr(region.position, 'within the painting')
  }));
}

function normalizeValueFamilies(families) {
  if (!Array.isArray(families) || families.length === 0) {
    return [{
      id: 'target_shadow_family',
      label: 'connected shadow family',
      role: 'dominant shadow family',
      position: 'mid-ground',
      regionIds: []
    }];
  }
  return families.slice(0, 4).map((family, index) => ({
    id: stringOr(family.id, `value_family_${index + 1}`),
    label: stringOr(family.label, 'connected shadow family'),
    role: stringOr(family.role, 'value family'),
    position: stringOr(family.position, 'within the painting'),
    regionIds: normalizeStringArray(family.regionIds, [])
  }));
}

function normalizeStringArray(value, fallback) {
  return Array.isArray(value) && value.length
    ? value.map(item => String(item)).filter(Boolean)
    : fallback;
}

function stringOr(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
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
  return ['sceneSummary', 'regions', 'valueFamilies', 'protectedPassages']
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
  const sceneSummary = recoverStringValue(text, 'sceneSummary');
  const protectedPassages = recoverStringArray(text, 'protectedPassages');
  const regions = recoverObjectArray(text, 'regions');
  const valueFamilies = recoverObjectArray(text, 'valueFamilies');

  if (sceneSummary) recovered.sceneSummary = sceneSummary;
  if (protectedPassages.length) recovered.protectedPassages = protectedPassages;
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

  return readQuotedString(text, start).value;
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
