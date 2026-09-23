#!/usr/bin/env bash
# ==============================================================================
# Telegram Self & Tabchi v6 - Autonomous Updater & System Inspector
# ==============================================================================
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "=========================================================="
echo "⚡ Telegram Self & Tabchi v6 — Auto-Update & Diagnostics"
echo "=========================================================="

# 1. Fetch public server IP
SERVER_IP=$(curl -s --max-time 3 https://api.ipify.org 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
echo "🌐 Server Public IP: $SERVER_IP"

# 2. Check Git and pull updates if in git repo
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "📦 Git Repository detected. Fetching latest updates..."
  git pull --rebase || true
  COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "HEAD")
  echo "✓ Up to date with commit: $COMMIT"
else
  echo "ℹ️ Running in standalone mode."
fi

# 3. Reinstall dependencies if package.json changed
echo "⚙️ Checking npm dependencies..."
npm install --legacy-peer-deps --prefer-offline 2>/dev/null || npm install

# 4. Rebuild production bundles
echo "🔨 Rebuilding production server & frontend assets..."
npm run build

# 5. Reload PM2 Process or daemon
if command -v pm2 >/dev/null 2>&1; then
  if pm2 list | grep -q "telegram-self-tabchi-v6"; then
    echo "🔄 Reloading PM2 process seamlessly..."
    pm2 restart telegram-self-tabchi-v6
  else
    echo "🚀 Starting PM2 process..."
    ./start.sh
  fi
else
  ./start.sh
fi

echo "=========================================================="
echo "✅ Update & Verification Completed Successfully!"
echo "=========================================================="
./status.sh
