# Issue 009 — Gemini Semantic Proxy

## Purpose

Replace the mock/fallback semantic interpretation layer with a real Gemini Vision semantic pass.

This phase introduces:
- secure API mediation,
- real multimodal scene grounding,
- and structured semantic interpretation.

The goal is:
- improve critique specificity,
- improve repaint guidance grounding,
- and eliminate unreliable semantic guessing.

---

# Important Constraints

This is NOT:
- autonomous critique generation,
- generalized image editing,
- or multi-agent orchestration.

Gemini should ONLY provide:
- scene understanding,
- region labeling,
- connected value-family interpretation,
- and painter-friendly spatial grounding.

The doctrine/workflow system still controls:
- pacing,
- overlays,
- critique sequencing,
- repaint philosophy,
- and painter agency.

---

# Security Requirements

The Gemini API key MUST NOT:
- appear in frontend JS,
- be committed to GitHub,
- or be exposed to the browser.

Implement:
- a tiny local proxy layer.

---

# Required Architecture

Browser/PWA
→ local semantic proxy
→ Gemini Vision API
→ structured semantic JSON
→ frontend workflow

---

# Implementation Requirements

Create:
- server/semantic-proxy.js
- server/.env.example

Add:
- .env support
- Gemini API integration
- minimal POST endpoint

Suggested endpoint:
POST /api/semantic

---

# Frontend Integration

Update frontend semantic pass to:
- call local proxy endpoint
- gracefully handle failures
- preserve current workflow sequencing

Fallback behavior:
- if proxy unavailable,
  continue using existing deterministic fallback semantics

---

# Semantic Output Goals

Examples:
- distant mountain mass
- connected shoreline darks
- foreground vegetation band
- water-shadow family
- sky opening

Keep outputs:
- concise
- painter-friendly
- spatially meaningful

---

# Technical Direction

Keep implementation intentionally lightweight.

Avoid:
- framework-heavy backend systems
- orchestration architecture
- authentication systems
- cloud deployment logic
- feature creep

Simple local proxy only.

---

# Validation

Verify:
- API key never appears in frontend
- semantic pass works locally
- critique wording improves
- repaint guidance becomes more spatially grounded
- fallback still works safely

---

# Deliverables

Implement:
1. local semantic proxy
2. Gemini Vision integration
3. secure API key handling
4. frontend proxy integration
5. graceful fallback behavior

Provide:
- concise implementation summary
- setup instructions
- required local env variables
- known limitations

No commit.

