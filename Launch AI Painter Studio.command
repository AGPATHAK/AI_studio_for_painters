#!/bin/bash
# AI Painter Studio — double-click launcher
# Works on MacBook Air and iMac (same iCloud folder).
# iPad: open the URL shown under "On your network" in Safari on the same Wi-Fi.

cd "$(dirname "$0")"

# ── Check Node.js ────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  osascript -e 'display alert "Node.js not found" message "Install Node.js from nodejs.org, then try again."'
  exit 1
fi

# ── Free port 8080 if something is already there ─────────────────────────────
if lsof -ti:8080 &>/dev/null; then
  echo "Port 8080 is in use — stopping previous server..."
  lsof -ti:8080 | xargs kill -9 2>/dev/null || true
  sleep 0.6
fi

# ── Start server (bound to all interfaces so iPad can reach it) ──────────────
export HOST=0.0.0.0
node server/semantic-proxy.js &
SERVER_PID=$!

# Give the server a moment to start
sleep 1.2

# ── Open in default browser ───────────────────────────────────────────────────
open "http://127.0.0.1:8080"

# ── Show connection info ──────────────────────────────────────────────────────
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null \
      || ipconfig getifaddr en1 2>/dev/null \
      || echo "")

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  AI Painter Studio — running"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  This Mac :  http://127.0.0.1:8080"
if [[ -n "$LAN_IP" ]]; then
echo "  On your network (iPad / iMac):  http://${LAN_IP}:8080"
fi
echo ""
echo "  Close this window (or press Ctrl+C) to stop."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Keep running until user closes the window ────────────────────────────────
wait $SERVER_PID
