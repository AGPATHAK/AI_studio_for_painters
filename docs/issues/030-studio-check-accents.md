# Issue 030 — Studio Check: Proactive Mixed-Media Accent Guidance

## Goal

Have Studio Check actively consider whether one or two closing accents in
another medium (pen, pastel, gouache, charcoal) would strengthen a
near-final painting, on every painting — not only when the painter
happens to ask.

## Why

Owner-reported problem #5 from the v3 plan: Studio Check should
proactively suggest mixed-media accents as part of the closing verdict.
The current `mediaOptions` guidance is conditional/passive ("if a medium
... could achieve what watercolor alone cannot") and in practice returns
empty most of the time.

## Scope

### Included

Prompt-only. `server/semantic-proxy.js`, `STUDIO_CHECK_PROMPT`:

- Replace the current `mediaOptions` guidance with the plan's actively-
  considered version: on every painting, weigh a calligraphic pen/fine
  brush line, dry-dragged soft pastel, white/tinted gouache, or charcoal/
  water-soluble pencil — at most two accents, each naming the exact
  passage, medium, mark, and what to test on scrap paper first; economical
  and subordinate in the Wesson/Seago spirit, never outlining or a second
  campaign of work; explicit "watercolor alone" verdict with reason when
  nothing applies.
- Anti-spiral guard addition: one line so a "sign now" verdict can still
  carry one optional accent, clearly marked as optional — accent
  suggestions must never read as contradicting "sign now."
- `PROMPT_VERSION`: already bumped to `3.0` in Phase 4 — noting the shared
  bump here, not re-bumping.

### Verified, no code change needed

- `mediaOptions` already renders in the right panel (`setAiItem` in
  `app.js` hides the row only when empty) and in the print sheet
  (`printFields` for Studio Check mode already includes it). Since this
  field will now rarely be empty, both surfaces just start showing
  content more often — no markup or rendering logic changes required.

### Excluded

- No changes to `app.js`, `index.html`, or `styles.css`.
- No changes to In-Process, Archive, or Reference Ideation prompts.
- No changes to `finalAdjustments` (the watercolor-only adjustment list)
  — that field's guidance is unchanged; `mediaOptions` is the only field
  in scope.

## Data / State / API Model

None — pure prompt-text change to an existing field (`mediaOptions` was
already in `STUDIO_CHECK_SCHEMA`, already normalized in `app.js`, already
rendered and printed).

## Acceptance Criteria

- Studio Check on 2 test paintings returns `mediaOptions` with concrete
  passage-plus-medium suggestions, or an explicit "watercolor alone"
  verdict with a stated reason — never an empty string by default.
- Accent suggestions stay consistent with `signingRecommendation`: never
  contradict a "sign now" verdict; when paired with "sign now," any named
  accent reads as clearly optional.
- Suggestions stay economical (at most two) and read as closing accents,
  not a second painting campaign.

## Validation Method

- `node --check server/semantic-proxy.js`
- `node server/semantic-proxy.js` starts clean.
- Manual: run Studio Check on 2 near-final paintings, confirm
  `mediaOptions` populates with specific, testable suggestions consistent
  with the signing verdict; confirm the panel and print sheet display it.

### Manual run (2026-07-18)

Two near-final paintings, both real (`IMG_8593.jpeg`, and an Arc de
Triomphe watercolor already in the studio journal):

- **Painting 1** — `signingRecommendation`: *"One adjustment first: soften
  the outer roofline of the left barn and slightly knock back the
  starkness of the white gable wall."* `mediaOptions`: *"White gable
  wall: use a soft, light-grey or cream pastel dragged lightly over the
  lower half... Test the pastel's value on a scrap of toned paper first."*
- **Painting 2** — `signingRecommendation`: *"One adjustment first: anchor
  the isolated left figure to the foreground shadow mass with a small,
  dark dry-brush connection at the feet."* `mediaOptions`: *"Left figure
  feet: use a dark, water-soluble pencil (like 4B or 8B) to draw a quick,
  dry, horizontal shadow line... Test on scrap paper to ensure the line
  is soft and dry, not hard and graphic."*

Both: concrete passage + specific medium + scrap-paper test, one accent
each, consistent with the paired signing verdict, `promptVersion` `'3.0'`.
Confirmed in the browser that the "Media options" section renders in the
right panel when populated (previously usually empty and hidden).

## Likely Files / Modules

- `server/semantic-proxy.js` (modify — `STUDIO_CHECK_PROMPT` only)

## Constraints

- Prompt-only phase — no other files.
- Small, surgical edit — no restructuring of the existing prompt.

## Status / Next Action

Active. Implement on branch `issue-030-studio-check-accents`, branched
from `main` (after Phase 4 merge).
