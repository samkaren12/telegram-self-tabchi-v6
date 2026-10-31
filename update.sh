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
  git stash save "auto-update-backup-$(date +%s)" 2>/dev/null || true
  git fetch origin 2>/dev/null || true
  git pull --rebase origin main 2>/dev/null || git pull --rebase origin master 2>/dev/null || git pull 2>/dev/null || true
  COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "HEAD")
  echo "✓ Up to date with commit: $COMMIT"
else
  echo "ℹ️ Running in standalone mode."
fi

# 3. Reinstall dependencies if needed
echo "⚙️ Checking npm & Python aiogram dependencies..."
npm install --legacy-peer-deps --prefer-offline 2>/dev/null || npm install --legacy-peer-deps 2>/dev/null || true
if command -v pip3 >/dev/null 2>&1; then
  pip3 install -U aiogram --break-system-packages 2>/dev/null || pip3 install -U aiogram 2>/dev/null || true
fi

# 4. Update yt-dlp binary if present
if command -v yt-dlp >/dev/null 2>&1; then
  echo "📥 Updating yt-dlp media downloader..."
  yt-dlp -U 2>/dev/null || true
fi

# 5. Rebuild production bundles
echo "🔨 Rebuilding production server & frontend assets..."
npm run build

# 6. Reload PM2 Process or daemon
if command -v pm2 >/dev/null 2>&1; then
  if pm2 list 2>/dev/null | grep -q "telegram-self-tabchi-v6"; then
    echo "🔄 Reloading PM2 process seamlessly..."
    pm2 reload telegram-self-tabchi-v6 2>/dev/null || pm2 restart telegram-self-tabchi-v6
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
