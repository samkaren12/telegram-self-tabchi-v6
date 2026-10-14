#!/usr/bin/env bash
# ==============================================================================
# Telegram Self & Tabchi CLI Installer / Registerer
# Quickly installs or fixes the 'sudo selfandtabchi' global terminal command
# ==============================================================================

set -e

if [ "$EUID" -ne 0 ]; then
  echo -e "\033[1;31m[!] خطا: لطفاً این اسکریپت را با دسترسی روت یا sudo اجرا نمایید:\033[0m"
  echo "    sudo bash scripts/register-cli.sh"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ ! -f "$PROJECT_DIR/package.json" ]; then
  # Fallback candidate search
  for dir in "/root/telegram-self-tabchi-v6" "/var/www/telegram-self-tabchi-v6" "/opt/telegram-self-tabchi-v6" "$(pwd)"; do
    if [ -f "$dir/package.json" ]; then
      PROJECT_DIR="$dir"
      break
    fi
  done
fi

echo "$PROJECT_DIR" > /etc/selfandtabchi.conf
chmod 644 /etc/selfandtabchi.conf

cat << 'WRAPPER_EOF' > /tmp/selfandtabchi_wrapper
#!/usr/bin/env bash
# Global CLI launcher for Telegram Self & Tabchi
if [ "$EUID" -ne 0 ]; then
  echo -e "\033[1;31m[!] خطا: برای اجرای دستیار مدیریت لطفاً از دستور زیر با دسترسی روت یا sudo استفاده کنید:\033[0m"
  echo "    sudo selfandtabchi"
  exit 1
fi

PROJECT_DIR=""
if [ -f /etc/selfandtabchi.conf ]; then
  CONF_DIR=$(cat /etc/selfandtabchi.conf 2>/dev/null | tr -d '\r\n')
  if [ -d "$CONF_DIR" ] && [ -f "$CONF_DIR/scripts/selfandtabchi.sh" ]; then
    PROJECT_DIR="$CONF_DIR"
  fi
fi

if [ -z "$PROJECT_DIR" ]; then
  for dir in "/root/telegram-self-tabchi-v6" "/var/www/telegram-self-tabchi-v6" "/opt/telegram-self-tabchi-v6" "/home/*/telegram-self-tabchi-v6" "$(pwd)"; do
    for cand in $dir; do
      if [ -d "$cand" ] && [ -f "$cand/scripts/selfandtabchi.sh" ]; then
        PROJECT_DIR="$cand"
        echo "$PROJECT_DIR" > /etc/selfandtabchi.conf 2>/dev/null || true
        break 2
      fi
    done
  done
fi

if [ -n "$PROJECT_DIR" ] && [ -f "$PROJECT_DIR/scripts/selfandtabchi.sh" ]; then
  chmod +x "$PROJECT_DIR/scripts/selfandtabchi.sh" 2>/dev/null || true
  export PROJECT_DIR
  exec bash "$PROJECT_DIR/scripts/selfandtabchi.sh" "$@"
else
  echo -e "\033[1;31m[!] مسیر پروژه یافت نشد. لطفاً در پوشه پروژه دستور را اجرا کنید:\033[0m"
  echo "    cd /root/telegram-self-tabchi-v6 && sudo bash scripts/selfandtabchi.sh"
  exit 1
fi
WRAPPER_EOF

chmod +x "$PROJECT_DIR/scripts/selfandtabchi.sh"
cp -f "$PROJECT_DIR/scripts/selfandtabchi.sh" /usr/local/bin/selfandtabchi 2>/dev/null || true
cp -f "$PROJECT_DIR/scripts/selfandtabchi.sh" /usr/bin/selfandtabchi 2>/dev/null || true
cp -f "$PROJECT_DIR/scripts/selfandtabchi.sh" /bin/selfandtabchi 2>/dev/null || true
chmod 755 /usr/local/bin/selfandtabchi /usr/bin/selfandtabchi /bin/selfandtabchi 2>/dev/null || true
hash -r 2>/dev/null || true

echo -e "\033[1;32m✓ دستور sudo selfandtabchi با موفقیت فعال شد!\033[0m"
echo -e "\033[1;36mهم‌اکنون در هر کجای سرور می‌توانید تایپ کنید:\033[0m"
echo -e "   \033[1;33msudo selfandtabchi\033[0m"
