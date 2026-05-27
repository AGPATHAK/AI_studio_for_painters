#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-8080}"
HOST="${HOST:-127.0.0.1}"
RESET_PAGE="$ROOT_DIR/.local-reset.html"
LOG_FILE="$ROOT_DIR/.semantic-proxy.log"

cd "$ROOT_DIR"

echo "Stopping anything listening on port $PORT..."
PIDS="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
if [[ -n "$PIDS" ]]; then
  kill $PIDS 2>/dev/null || true
  sleep 1
fi

cat > "$RESET_PAGE" <<'HTML'
<!doctype html>
<meta charset="utf-8">
<title>Resetting AI Painter Studio</title>
<body style="font-family: system-ui; padding: 24px;">
  <p>Resetting local AI Painter Studio cache...</p>
  <script>
    (async function resetLocalApp() {
      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(registration => registration.unregister()));
        }
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(key => caches.delete(key)));
        }
        localStorage.clear();
        sessionStorage.clear();
      } finally {
        location.replace('/?reset=' + Date.now());
      }
    }());
  </script>
</body>
HTML

cleanup() {
  rm -f "$RESET_PAGE"
}
trap cleanup EXIT

echo "Starting Gemini semantic proxy..."
HOST="$HOST" PORT="$PORT" node server/semantic-proxy.js > "$LOG_FILE" 2>&1 &
PROXY_PID="$!"

for _ in {1..40}; do
  if curl -fsS "http://$HOST:$PORT/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

if ! kill -0 "$PROXY_PID" 2>/dev/null; then
  echo "Proxy failed to start. Last log lines:"
  tail -40 "$LOG_FILE" || true
  exit 1
fi

echo "Opening reset page in browser..."
open "http://$HOST:$PORT/.local-reset.html"

echo
echo "Done. Proxy is running as PID $PROXY_PID."
echo "Logs: $LOG_FILE"
echo "When finished, stop it with:"
echo "  kill $PROXY_PID"
