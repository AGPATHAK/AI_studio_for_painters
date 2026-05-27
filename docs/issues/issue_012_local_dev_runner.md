# Issue 012 — Simplify Local Dev Runner and Trace UI Render Failure

## Purpose

The current local startup/reset workflow is overcomplicated and solving the wrong problem.

Primary requirement:
- one reliable command
- that launches the app cleanly
- and makes Gemini/UI failures easy to diagnose.

The current script:
- mixes startup
- cache reset
- service worker cleanup
- redirect logic
- and debugging

This creates unnecessary fragility.

The actual remaining issue is:
Gemini responses are often visible in terminal logs but not rendered correctly in the UI.

That indicates:
- frontend async/render/state problems,
NOT:
- browser cache problems.

---

# Goals

Create:
- one clean startup command
- one optional reset command
- lightweight runtime diagnostics
- reliable Gemini→UI tracing

---

# Required Direction

## Primary startup script

Create or simplify:

./run-local.sh

It should ONLY:
1. stop anything on 8080
2. start semantic proxy
3. open browser
4. show concise runtime logs

No cache-reset logic.

No redirect page.

No localStorage clearing.

No service-worker manipulation.

Keep it predictable.

---

## Optional recovery/reset script

Keep reset behavior separate.

If needed:
./reset-local-dev.sh

can remain as an advanced recovery tool.

But it should NOT be the normal startup path.

---

# Trace the Real Problem

Current suspected issue:
Gemini response successfully arrives,
but frontend state/render flow intermittently fails.

Investigate:
- async sequencing
- stale state
- render timing
- promise race conditions
- critique panel update ordering
- fallback/Gemini overwrite timing
- service-worker stale asset usage if still relevant

---

# Required Runtime Visibility

Add lightweight runtime visibility in terminal logs and optionally UI:

- Gemini response received
- Gemini parse success
- critique object created
- critique render triggered
- critique render completed

Keep concise.

No noisy debug spam.

---

# Important Constraint

Do NOT:
- redesign architecture
- add frameworks
- add build systems
- add Electron/dev servers
- add npm tooling complexity

Keep:
- lightweight local workflow
- simple shell scripts
- direct browser launch

---

# Desired User Experience

Normal usage should become:

./run-local.sh

Then:
- browser opens
- app works
- Gemini critique appears
- logs are readable

Nothing else should normally be needed.

---

# Deliverables

- simplified run-local.sh
- cleanup of reset-local-dev.sh responsibilities
- tracing of Gemini→UI render path
- concise implementation summary
- explanation of root cause if found
- no commit

