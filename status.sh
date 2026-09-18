#!/usr/bin/env bash
# ==============================================================================
# Telegram Self & Tabchi - Hacker Edition v6 (Status & Health Inspector)
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

PID_FILE="$PROJECT_DIR/data/server.pid"
LOG_FILE="$PROJECT_DIR/data/logs/server.log"

echo "=========================================================="
echo "⚡ Telegram Self & Tabchi v6 — Status Check"
echo "=========================================================="

RUNNING=false

# PM2 status check
if command -v pm2 >/dev/null 2>&1; then
  if pm2 list | grep -q "telegram-self-tabchi-v6"; then
    echo "🟢 Status: ACTIVE via PM2 Process Manager"
    pm2 show telegram-self-tabchi-v6
    RUNNING=true
  fi
fi

# Daemon status check
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if ps -p "$PID" > /dev/null 2>&1; then
    echo "🟢 Status: ACTIVE (Background Daemon PID: $PID)"
    RUNNING=true
  fi
fi

# Port 3000 check
if curl -s http://localhost:3000/api/status > /dev/null 2>&1; then
  echo "🌐 API Endpoint: Online (http://localhost:3000)"
  API_RESPONSE=$(curl -s http://localhost:3000/api/status)
  echo "📊 Live Stats: $API_RESPONSE"
else
  if [ "$RUNNING" = true ]; then
    echo "🟡 Process is running, but port 3000 is still binding or compiling."
  else
    echo "🔴 Status: INACTIVE (Service is stopped)"
  fi
fi

echo "----------------------------------------------------------"
if [ -f "$LOG_FILE" ]; then
  echo "📜 Last 10 log entries ($LOG_FILE):"
  tail -n 10 "$LOG_FILE"
elif command -v pm2 >/dev/null 2>&1; then
  echo "💡 To see real-time PM2 logs, run: pm2 logs telegram-self-tabchi-v6"
fi
echo "=========================================================="
