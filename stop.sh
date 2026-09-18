#!/usr/bin/env bash
# ==============================================================================
# Telegram Self & Tabchi - Stop Background Service
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

PID_FILE="$PROJECT_DIR/data/server.pid"

STOPPED=false

# Check PM2
if command -v pm2 >/dev/null 2>&1; then
  if pm2 list | grep -q "telegram-self-tabchi-v6"; then
    echo "🛑 Stopping PM2 daemon process (telegram-self-tabchi-v6)..."
    pm2 stop telegram-self-tabchi-v6 >/dev/null 2>&1 || true
    pm2 delete telegram-self-tabchi-v6 >/dev/null 2>&1 || true
    STOPPED=true
  fi
fi

# Check PID file
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if ps -p "$PID" > /dev/null 2>&1; then
    echo "🛑 Terminating background daemon process (PID: $PID)..."
    kill "$PID" 2>/dev/null || kill -9 "$PID" 2>/dev/null
    STOPPED=true
  fi
  rm -f "$PID_FILE"
fi

# Check any remaining node server on port 3000
LSOF_PID=$(lsof -ti:3000 2>/dev/null || true)
if [ -n "$LSOF_PID" ]; then
  echo "🛑 Releasing port 3000 (PID: $LSOF_PID)..."
  kill "$LSOF_PID" 2>/dev/null || kill -9 "$LSOF_PID" 2>/dev/null
  STOPPED=true
fi

if [ "$STOPPED" = true ]; then
  echo "✅ Telegram Self & Tabchi service has been stopped."
else
  echo "ℹ️  No running Telegram Self & Tabchi service was found."
fi
