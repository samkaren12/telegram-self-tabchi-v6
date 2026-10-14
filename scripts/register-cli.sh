#!/usr/bin/env bash
# ==============================================================================
# Telegram Self & Tabchi CLI Installer / Registerer
# Quickly installs and activates 'sudo selfandtabchi' command on VPS
# ==============================================================================

set -e

if [ "$EUID" -ne 0 ]; then
  echo -e "\033[1;31m[!] خطا: لطفاً این اسکریپت را با دسترسی روت یا sudo اجرا نمایید:\033[0m"
  echo "    sudo bash scripts/register-cli.sh"
  exit 1
fi

# Detect project directory
PROJECT_DIR=""
CANDIDATES=(
  "$(pwd)"
  "$(dirname "$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || echo "$0")")/.."
  "/root/telegram-self-tabchi-v6"
  "/root/selfandtabchi"
  "/root/telegram-self"
  "/var/www/telegram-self-tabchi-v6"
  "/opt/telegram-self-tabchi-v6"
  /home/*/telegram-self-tabchi-v6
)

for cand in "${CANDIDATES[@]}"; do
  if [ -d "$cand" ] && ([ -f "$cand/package.json" ] || [ -f "$cand/self_tabchi.py" ] || [ -f "$cand/scripts/selfandtabchi.sh" ]); then
    PROJECT_DIR="$(cd "$cand" 2>/dev/null && pwd)"
    break
  fi
done

if [ -z "$PROJECT_DIR" ]; then
  PROJECT_DIR="$(pwd)"
fi

echo "$PROJECT_DIR" > /etc/selfandtabchi.conf
chmod 644 /etc/selfandtabchi.conf 2>/dev/null || true

# Obtain the full selfandtabchi script
CLI_TARGET_SRC=""
if [ -f "$PROJECT_DIR/scripts/selfandtabchi.sh" ]; then
  CLI_TARGET_SRC="$PROJECT_DIR/scripts/selfandtabchi.sh"
elif [ -f "./scripts/selfandtabchi.sh" ]; then
  CLI_TARGET_SRC="./scripts/selfandtabchi.sh"
fi

if [ -n "$CLI_TARGET_SRC" ] && [ -f "$CLI_TARGET_SRC" ]; then
  cp -f "$CLI_TARGET_SRC" /usr/local/bin/selfandtabchi
  cp -f "$CLI_TARGET_SRC" /usr/bin/selfandtabchi 2>/dev/null || true
  cp -f "$CLI_TARGET_SRC" /bin/selfandtabchi 2>/dev/null || true
else
  # Download directly from GitHub if not found locally
  curl -fsSL "https://raw.githubusercontent.com/samkaren12/telegram-self-tabchi-v6/main/scripts/selfandtabchi.sh" -o /usr/local/bin/selfandtabchi 2>/dev/null || true
  cp -f /usr/local/bin/selfandtabchi /usr/bin/selfandtabchi 2>/dev/null || true
fi

chmod 755 /usr/local/bin/selfandtabchi /usr/bin/selfandtabchi 2>/dev/null || true
hash -r 2>/dev/null || true

echo -e "\033[1;32m═══════════════════════════════════════════════════════════════════════════\033[0m"
echo -e "\033[1;32m✓ دستور سیستمی sudo selfandtabchi با موفقیت در سرور شما نصب و فعال شد!\033[0m"
echo -e "\033[1;36mمسیر پروژه:\033[0m \033[1;37m$PROJECT_DIR\033[0m"
echo -e "\033[1;32m═══════════════════════════════════════════════════════════════════════════\033[0m"
echo ""
echo -e "\033[1;33mهم‌اکنون کافیست در ترمینال دستور زیر را تایپ کنید:\033[0m"
echo -e "   \033[1;32msudo selfandtabchi\033[0m"
echo ""
