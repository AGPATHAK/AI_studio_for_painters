#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-8080}"
HOST="${HOST:-127.0.0.1}"
URL="http://$HOST:$PORT/"

cd "$ROOT_DIR"

echo "AI Painter Studio local runner"
echo "Stopping anything listening on port $PORT..."
PIDS="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
if [[ -n "$PIDS" ]]; then
  kill $PIDS 2>/dev/null || true
  sleep 1
fi

if lsof -tiTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT is still busy. Stop that process and run ./run-local.sh again."
  exit 1
fi

echo "Starting semantic proxy at $URL"
echo "Trace: upload -> Gemini response -> parse -> critique object -> render"
HOST="$HOST" PORT="$PORT" node server/semantic-proxy.js &
PROXY_PID="$!"

cleanup() {
  if kill -0 "$PROXY_PID" 2>/dev/null; then
    echo
    echo "Stopping semantic proxy..."
    kill "$PROXY_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

for _ in {1..40}; do
  if curl -fsS "$URL" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

if ! kill -0 "$PROXY_PID" 2>/dev/null; then
  echo "Semantic proxy exited during startup."
  exit 1
fi

if ! curl -fsS "$URL" >/dev/null 2>&1; then
  echo "Semantic proxy started but did not become ready at $URL."
  exit 1
fi

echo "Opening browser..."
open "$URL"
echo "Logs below. Press Ctrl+C here to stop the local server."
echo

wait "$PROXY_PID"
