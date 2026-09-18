#!/usr/bin/env bash
# ==============================================================================
# Telegram Self & Tabchi - Hacker Edition v6 (Background Launcher)
# Runs the application 24/7 in the background even after closing terminal/SSH.
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

PID_FILE="$PROJECT_DIR/data/server.pid"
LOG_DIR="$PROJECT_DIR/data/logs"
LOG_FILE="$LOG_DIR/server.log"

mkdir -p "$PROJECT_DIR/data" "$LOG_DIR"

# Check if PM2 is available
if command -v pm2 >/dev/null 2>&1; then
  echo "🚀 Starting Telegram Self & Tabchi with PM2 Process Manager (24/7 Daemon)..."
  if [ -f "$PROJECT_DIR/ecosystem.config.cjs" ]; then
    pm2 start "$PROJECT_DIR/ecosystem.config.cjs"
  else
    pm2 start dist/server.cjs --name "telegram-self-tabchi-v6" --node-args="--max-old-space-size=1024"
  fi
  pm2 save >/dev/null 2>&1 || true
  echo "✅ Process successfully started in PM2!"
  echo "📊 View status: pm2 status"
  echo "📜 View logs:   pm2 logs telegram-self-tabchi-v6"
  exit 0
fi

# Fallback: Background daemon using nohup
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if ps -p "$OLD_PID" > /dev/null 2>&1; then
    echo "⚠️  Telegram Self & Tabchi is already running (PID: $OLD_PID)."
    echo "🌐 Web Panel: http://localhost:3000"
    exit 0
  else
    rm -f "$PID_FILE"
  fi
fi

if [ ! -f "dist/server.cjs" ]; then
  echo "⚙️  Building production assets..."
  npm run build
fi

echo "🚀 Starting Telegram Self & Tabchi as a detached background daemon..."
nohup node dist/server.cjs >> "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"

sleep 1
if ps -p "$NEW_PID" > /dev/null 2>&1; then
  echo "✅ Server successfully started in background!"
  echo "🆔 Process PID: $NEW_PID"
  echo "🌐 Web Dashboard: http://localhost:3000"
  echo "📜 Live Log file: $LOG_FILE"
  echo "💡 The server will continue running permanently even if you exit this terminal."
else
  echo "❌ Failed to start server. Check $LOG_FILE for errors."
  exit 1
fi
