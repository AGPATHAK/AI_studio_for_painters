# Issue 003 — M2a Critique Design (Production Specification)

**Status: Planned**

## Goal

Produce a versioned prompt set and a critique JSON schema that, applied to a fixed test set of 10–15 painter-relevant images, generates critiques that are **non-generic, actionable, painter-aligned, and prioritized** ≥80% of the time. No app integration in this issue — this is prompt design and validation only.

## Why

This is the project's primary bottleneck. If the critique reads like generic AI commentary, every later milestone is worthless. Locking the prompt set and schema before building the critique engine prevents M2 from being a moving target.

## Scope

### Included

- A fixed validation image set committed under `test-fixtures/critique/` (10–15 images covering landscape, figure, still life; mix of finished references and in-progress paintings).
- A critique JSON schema definition (canonical version) committed to `docs/critique-schema.md`.
- Per-dimension prompt templates committed to `docs/prompts/` for: value structure, edge control, composition, chroma.
- An **instructor voice** definition documenting the painter-grade language register the prompts must enforce.
- A reproducible validation protocol (`docs/critique-validation.md`) that documents how prompts were scored on the image set and how iterations proceeded.
- An example library: `test-fixtures/critique-examples/<image>/critique-vN.json` showing input image → critique output pairs for each prompt iteration.

### Excluded

- Wiring critique into the running app. That's M2.
- Edit generation of any kind. That's M2.5 / M3.
- A UI for selecting critique items. M3.

## Data / State / API Model

Critique schema (canonical — locked in this issue):

```json
{
  "image_id": "string",
  "model": "string",
  "prompt_version": "string",
  "generated_at": "ISO-8601 timestamp",
  "issues": [
    {
      "issue_type": "value_structure | edge_control | composition | chroma",
      "region": "string (natural-language region descriptor, e.g. 'tree mass center-left')",
      "region_bbox": "[x, y, w, h] in normalized 0–1 coords, optional",
      "suggested_action": "string (imperative, painterly verb phrase)",
      "priority": "high | medium | low",
      "reasoning": "string (one or two sentences in painter vocabulary)"
    }
  ],
  "dominant_issue_index": "integer (which item in issues[] is the headline issue)"
}
```

API model:
- Provider: OpenAI
- Endpoint: Responses API or Chat Completions (whichever supports structured JSON + image input most cleanly at lock time)
- Mode: JSON schema-constrained output
- Input: image (as `image_url` data URL or hosted URL — TBD), system prompt (instructor voice), per-dimension user prompt
- Output: JSON conforming to schema above

## Acceptance Criteria

1. Schema is fully specified in `docs/critique-schema.md` with field-by-field semantics, allowed values, and one fully-worked example.
2. Per-dimension prompts exist and reference the schema by structure, not by re-stating it.
3. The instructor voice spec defines: forbidden phrases (generic AI tells), required vocabulary (specific painterly terms), and tone (rigorous, specific, non-prescriptive).
4. The validation set is committed: 10–15 images plus a `manifest.json` describing each image's expected dominant issue type.
5. Validation protocol document records, for each image, the critique outputs across prompt iterations and a manual pass/fail against the four criteria (non-generic, actionable, painter-aligned, prioritized).
6. Final pass rate is ≥80% on the validation set with a single locked prompt version.
7. The locked prompt version is tagged in `docs/prompts/` with a clear version string (e.g. `v1.0`).

## Validation Method

A script (`tools/run-critique-eval.mjs` — yes, one piece of tooling code, kept under `tools/`, not in app code) that:
- Iterates the validation set.
- Calls the OpenAI API with the locked system + user prompts.
- Writes JSON output to `test-fixtures/critique-examples/<image>/critique-vN.json`.
- Prints a manual evaluation worksheet to stdout.

The pass/fail call itself is human. The tool just makes iteration cheap.

```bash
node tools/run-critique-eval.mjs --version v1.0 --image-set test-fixtures/critique/
```

## Likely Files / Modules

- `docs/critique-schema.md`
- `docs/prompts/value-structure.md`
- `docs/prompts/edge-control.md`
- `docs/prompts/composition.md`
- `docs/prompts/chroma.md`
- `docs/prompts/instructor-voice.md`
- `docs/critique-validation.md`
- `test-fixtures/critique/*.jpg|png` and `test-fixtures/critique/manifest.json`
- `test-fixtures/critique-examples/<image>/critique-vN.json`
- `tools/run-critique-eval.mjs`

## Constraints

- The tool under `tools/` is **not** part of the app shell. It is allowed to use Node and read an OpenAI key from an env var. It must never be served by the PWA.
- The API key for evaluation is read from `OPENAI_API_KEY` env, never committed.
- The validation images must be the developer's own or licence-clear (no scraped third-party paintings).
- Prompts must not request structured output by repeating the schema in natural language; they must rely on the response_format / JSON schema mechanism so the schema is enforced once, in one place.

## Status / Next Action

Planned. Active after M1 (002) ships. Blocks M2 and M3.
