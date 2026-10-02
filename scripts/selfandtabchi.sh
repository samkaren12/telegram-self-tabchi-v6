#!/usr/bin/env bash
# ==============================================================================
# Telegram Self & Tabchi CLI Assistant (sudo selfandtabchi)
# Developed for High-Performance VPS Automation & Maintenance
# ==============================================================================

# Ensure script is run with root/sudo privileges
if [ "$EUID" -ne 0 ]; then
  echo -e "\033[1;31m[!] خطا: این دستور باید با دسترسی روت اجرا شود:\033[0m"
  echo "    sudo selfandtabchi"
  exit 1
fi

PROJECT_DIR="/root/telegram-self-tabchi-v6"
if [ ! -d "$PROJECT_DIR" ]; then
  # Fallback to current working directory if script executed locally
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  if [ -f "$SCRIPT_DIR/package.json" ]; then
    PROJECT_DIR="$SCRIPT_DIR"
  elif [ -d "/var/www/telegram-self-tabchi-v6" ]; then
    PROJECT_DIR="/var/www/telegram-self-tabchi-v6"
  fi
fi

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color
BOLD='\033[1m'

get_public_ip() {
  curl -s --max-time 3 https://api.ipify.org 2>/dev/null || \
  curl -s --max-time 3 https://icanhazip.com 2>/dev/null || \
  hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1"
}

get_ssl_info() {
  if [ -f "$PROJECT_DIR/data/ssl/ssl-config.json" ]; then
    local domain=$(grep -o '"domain": *"[^"]*"' "$PROJECT_DIR/data/ssl/ssl-config.json" | head -n1 | cut -d'"' -f4)
    local days=$(grep -o '"daysRemaining": *[0-9]*' "$PROJECT_DIR/data/ssl/ssl-config.json" | head -n1 | grep -o '[0-9]*')
    if [ -n "$domain" ]; then
      echo -e "${GREEN}فعال (${domain} - ${days:-365} روز اعتبار)${NC}"
      return
    fi
  fi
  echo -e "${YELLOW}غیرفعال یا پیش‌فرض IP${NC}"
}

get_service_status() {
  if command -v pm2 >/dev/null 2>&1; then
    if pm2 list 2>/dev/null | grep -q "telegram-self-tabchi-v6.*online"; then
      echo -e "${GREEN}آنلاین و در حال اجرا (PM2)${NC}"
      return
    fi
  fi
  if [ -f "$PROJECT_DIR/data/server.pid" ]; then
    local pid=$(cat "$PROJECT_DIR/data/server.pid" 2>/dev/null)
    if [ -n "$pid" ] && ps -p "$pid" >/dev/null 2>&1; then
      echo -e "${GREEN}آنلاین و در حال اجرا (PID: $pid)${NC}"
      return
    fi
  fi
  if lsof -ti:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}فعال روی پورت 3000${NC}"
    return
  fi
  echo -e "${RED}متوقف (Offline)${NC}"
}

show_banner() {
  clear
  local ip=$(get_public_ip)
  local status=$(get_service_status)
  local ssl_info=$(get_ssl_info)

  echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${WHITE}${BOLD}   ⚡ TELEGRAM SELF & TABCHI v6 - SERVER MANAGEMENT ASSISTANT          ${CYAN}║${NC}"
  echo -e "${CYAN}║${PURPLE}   سیستم یکپارچه مدیریت سرور، بروزرسانی، دامنه و گواهی امنیتی SSL      ${CYAN}║${NC}"
  echo -e "${CYAN}╠═══════════════════════════════════════════════════════════════════════════╣${NC}"
  echo -e "${CYAN}║${NC} 🌐 ${BOLD}آی‌پی عمومی سرور:${NC}   ${YELLOW}${ip}${NC}"
  echo -e "${CYAN}║${NC} 📊 ${BOLD}وضعیت سرویس:${NC}       ${status}"
  echo -e "${CYAN}║${NC} 🔒 ${BOLD}وضعیت SSL:${NC}         ${ssl_info}"
  echo -e "${CYAN}║${NC} 📁 ${BOLD}مسیر پروژه:${NC}        ${WHITE}${PROJECT_DIR}${NC}"
  echo -e "${CYAN}║${NC} 🔗 ${BOLD}لینک وب پنل:${NC}       ${CYAN}http://${ip}:3000${NC} یا ${CYAN}https://${ip}:3443${NC}"
  echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

show_menu() {
  show_banner
  echo -e "${WHITE}${BOLD}لطفاً یکی از گزینه‌های زیر را با وارد کردن شماره انتخاب نمایید:${NC}"
  echo ""
  echo -e "  ${GREEN}[1]${NC} 🚀 ${BOLD}شروع / راه‌اندازی مجدد سرویس (Start / Restart)${NC}"
  echo -e "  ${YELLOW}[2]${NC} 🛑 ${BOLD}توقف سرویس تلگرام (Stop Service)${NC}"
  echo -e "  ${CYAN}[3]${NC} 🔄 ${BOLD}بروزرسانی اسکریپت به آخرین نسخه (Update Script)${NC}"
  echo -e "  ${PURPLE}[4]${NC} 🌐 ${BOLD}تنظیم و تغییر دامنه سرور (Set / Change Domain)${NC}"
  echo -e "  ${GREEN}[5]${NC} 🔒 ${BOLD}دریافت و نصب گواهی SSL روی دامنه یا آی‌پی (Issue SSL Certificate)${NC}"
  echo -e "  ${BLUE}[6]${NC} 🛡️ ${BOLD}فعال‌سازی سرویس تمدید خودکار SSL (Auto-Renewal Daemon)${NC}"
  echo -e "  ${YELLOW}[7]${NC} 📜 ${BOLD}مشاهده لاگ‌های زنده سیستم (View Live Logs)${NC}"
  echo -e "  ${CYAN}[8]${NC} 🔑 ${BOLD}تغییر رمز ورود مالک و احراز هویت (Change Admin Password)${NC}"
  echo -e "  ${RED}[9]${NC} 🗑️ ${BOLD}حذف کامل اسکریپت و پاکسازی سرور (Uninstall Script)${NC}"
  echo -e "  ${WHITE}[0]${NC} 🚪 ${BOLD}خروج (Exit)${NC}"
  echo ""
  echo -ne "${CYAN}👉 شماره مورد نظر را وارد کرده و Enter بزنید: ${NC}"
}

do_start_restart() {
  echo ""
  echo -e "${CYAN}[*] در حال بررسی و راه‌اندازی سرویس...${NC}"
  cd "$PROJECT_DIR"
  if [ -f "./start.sh" ]; then
    chmod +x ./start.sh ./stop.sh
    ./stop.sh >/dev/null 2>&1 || true
    sleep 1
    ./start.sh
  elif command -v pm2 >/dev/null 2>&1; then
    pm2 restart telegram-self-tabchi-v6 2>/dev/null || pm2 start dist/server.cjs --name "telegram-self-tabchi-v6"
  else
    npm run build
    nohup node dist/server.cjs > data/logs/server.log 2>&1 &
  fi
  echo -e "${GREEN}✓ سرویس با موفقیت راه‌اندازی و در پس‌زمینه فعال شد.${NC}"
  read -p "برای ادامه Enter بزنید..."
}

do_stop() {
  echo ""
  echo -e "${YELLOW}[*] در حال متوقف کردن سرویس...${NC}"
  cd "$PROJECT_DIR"
  if [ -f "./stop.sh" ]; then
    chmod +x ./stop.sh
    ./stop.sh
  else
    pm2 stop telegram-self-tabchi-v6 >/dev/null 2>&1 || true
    pm2 delete telegram-self-tabchi-v6 >/dev/null 2>&1 || true
    fuser -k 3000/tcp >/dev/null 2>&1 || true
  fi
  echo -e "${GREEN}✓ سرویس با موفقیت متوقف شد.${NC}"
  read -p "برای ادامه Enter بزنید..."
}

do_update() {
  echo ""
  echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${WHITE}             🔄 بروزرسانی خودکار اسکریپت                     ${CYAN}║${NC}"
  echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
  echo -e "${YELLOW}[*] در حال دریافت آخرین تغییرات و پکیج‌ها...${NC}"

  cd "$PROJECT_DIR"

  # If git repo exists
  if [ -d ".git" ]; then
    echo -e "${BLUE}[1/4] دریافت سورس جدید از مخزن Git...${NC}"
    git fetch origin 2>/dev/null || true
    git reset --hard origin/main 2>/dev/null || git pull --rebase 2>/dev/null || true
  fi

  echo -e "${BLUE}[2/4] نصب و همگام‌سازی وابستگی‌ها (npm install)...${NC}"
  npm install --legacy-peer-deps --no-audit 2>/dev/null || npm install

  echo -e "${BLUE}[3/4] کامپایل و بیلد مجدد پروژه (npm run build)...${NC}"
  npm run build

  echo -e "${BLUE}[4/4] ری‌استارت پروسه سرور در PM2...${NC}"
  if command -v pm2 >/dev/null 2>&1; then
    pm2 restart telegram-self-tabchi-v6 2>/dev/null || ./start.sh
  else
    ./start.sh
  fi

  echo ""
  echo -e "${GREEN}🎉 بروزرسانی با موفقیت کامل انجام شد و سرویس در حال اجرا است!${NC}"
  read -p "برای ادامه Enter بزنید..."
}

do_domain_setup() {
  echo ""
  echo -e "${PURPLE}╔═══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${PURPLE}║${WHITE}             🌐 تنظیم و چنج کردن دامنه سرور                 ${PURPLE}║${NC}"
  echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════════╝${NC}"
  local ip=$(get_public_ip)
  echo -e "آی‌پی سرور شما: ${YELLOW}${ip}${NC}"
  echo -e "${WHITE}توجه: پیش از ثبت دامنه، در پنل کلودفلر یا هاستینگ خود یک رکورد A با مقدار ${YELLOW}${ip}${NC} ایجاد نمایید.${NC}"
  echo ""
  echo -ne "${CYAN}نام دامنه یا ساب‌دامین جدید را وارد کنید (مثال: panel.example.com): ${NC}"
  read DOMAIN_INPUT

  DOMAIN_INPUT=$(echo "$DOMAIN_INPUT" | tr -d ' ' | tr '[:upper:]' '[:lower:]' | sed 's|https://||' | sed 's|http://||' | sed 's|/.*||')

  if [ -z "$DOMAIN_INPUT" ]; then
    echo -e "${RED}[!] نام دامنه نمی‌تواند خالی باشد.${NC}"
    read -p "برای ادامه Enter بزنید..."
    return
  fi

  echo ""
  echo -e "${YELLOW}[*] در حال بررسی و ذخیره تنظیمات دامنه: ${DOMAIN_INPUT}...${NC}"

  # Update internal ssl/domain config
  mkdir -p "$PROJECT_DIR/data/ssl"
  node -e "
    const fs = require('fs');
    const path = '$PROJECT_DIR/data/ssl/ssl-config.json';
    let cfg = {};
    if (fs.existsSync(path)) {
      try { cfg = JSON.parse(fs.readFileSync(path, 'utf8')); } catch(e){}
    }
    cfg.domain = '$DOMAIN_INPUT';
    cfg.serverIp = '$ip';
    fs.writeFileSync(path, JSON.stringify(cfg, null, 2));
  " 2>/dev/null || true

  echo -e "${GREEN}✓ دامنه با موفقیت به عنوان دامنه رسمی سرور ثبت گردید.${NC}"
  echo ""
  echo -ne "${CYAN}آیا تمایل دارید هم‌اکنون گواهی امنیتی SSL معتبر برای ${DOMAIN_INPUT} دریافت شود؟ (y/n): ${NC}"
  read ISSUE_SSL_NOW
  if [[ "$ISSUE_SSL_NOW" =~ ^[Yy]$ ]]; then
    issue_ssl_for_target "$DOMAIN_INPUT" "$ip"
  fi

  read -p "برای ادامه Enter بزنید..."
}

issue_ssl_for_target() {
  local target="$1"
  local ip="$2"
  echo ""
  echo -e "${CYAN}[*] در حال درخواست و صدور گواهی SSL برای: ${target}...${NC}"

  # Install certbot if not present
  if ! command -v certbot >/dev/null 2>&1; then
    echo -e "${BLUE}[*] در حال نصب ابزار Certbot...${NC}"
    if command -v apt-get >/dev/null 2>&1; then
      apt-get update -y && apt-get install -y certbot || true
    elif command -v yum >/dev/null 2>&1; then
      yum install -y certbot || true
    fi
  fi

  mkdir -p "$PROJECT_DIR/data/ssl"
  local certPath="$PROJECT_DIR/data/ssl/server.crt"
  local keyPath="$PROJECT_DIR/data/ssl/server.key"

  # Attempt Certbot Standalone or OpenSSL SAN
  local certbot_ok=false
  if [[ "$target" != *"nip.io"* && "$target" != *"sslip.io"* && "$target" =~ \. ]]; then
    echo -e "${YELLOW}[*] تلاش برای دریافت گواهی بین‌المللی رایگان Let's Encrypt...${NC}"
    fuser -k 80/tcp >/dev/null 2>&1 || true
    certbot certonly --standalone -d "$target" --non-interactive --agree-tos -m "admin@${target}" --keep-until-expiring 2>/dev/null || true
    if [ -f "/etc/letsencrypt/live/${target}/fullchain.pem" ]; then
      cp "/etc/letsencrypt/live/${target}/fullchain.pem" "$certPath"
      cp "/etc/letsencrypt/live/${target}/privkey.pem" "$keyPath"
      certbot_ok=true
      echo -e "${GREEN}✓ گواهی رسمی معتبر Let's Encrypt دریافت و نصب گردید.${NC}"
    fi
  fi

  if [ "$certbot_ok" = false ]; then
    echo -e "${YELLOW}[*] ایجاد گواهی امنیتی پیشرفته High-Grade OpenSSL SAN...${NC}"
    local cnfPath="$PROJECT_DIR/data/ssl/openssl.cnf"
    cat <<EOF > "$cnfPath"
[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[dn]
C = IR
ST = Tehran
L = Tehran
O = Telegram Automation Security
OU = VPS SSL
CN = ${target}

[req_ext]
subjectAltName = @alt_names

[alt_names]
IP.1 = ${ip}
IP.2 = 127.0.0.1
DNS.1 = ${target}
DNS.2 = ${ip}
DNS.3 = ${ip}.nip.io
DNS.4 = localhost
EOF
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "$keyPath" -out "$certPath" -config "$cnfPath" >/dev/null 2>&1
    echo -e "${GREEN}✓ گواهی امنیتی با موفقیت صادر و فعال گردید.${NC}"
  fi

  # Update JSON configuration
  node -e "
    const fs = require('fs');
    const path = '$PROJECT_DIR/data/ssl/ssl-config.json';
    let cfg = {};
    if (fs.existsSync(path)) {
      try { cfg = JSON.parse(fs.readFileSync(path, 'utf8')); } catch(e){}
    }
    cfg.enabled = true;
    cfg.domain = '$target';
    cfg.serverIp = '$ip';
    cfg.certPath = '$certPath';
    cfg.keyPath = '$keyPath';
    cfg.autoRenew = true;
    cfg.httpsPort = 3443;
    cfg.daysRemaining = 365;
    fs.writeFileSync(path, JSON.stringify(cfg, null, 2));
  " 2>/dev/null || true

  # Restart server to attach HTTPS port
  pm2 restart telegram-self-tabchi-v6 >/dev/null 2>&1 || true

  echo ""
  echo -e "${GREEN}🔒 دسترسی امن SSL اکنون فعال است:${NC}"
  echo -e "   🔗 https://${target}:3443"
  echo -e "   🔗 https://${ip}:3443"
}

do_ssl_menu() {
  echo ""
  echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${WHITE}             🔒 صدور و مدیریت گواهی امنیتی SSL                ${CYAN}║${NC}"
  echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
  local ip=$(get_public_ip)
  echo -e "  [1] صدور SSL برای دامنه اختصاصی"
  echo -e "  [2] صدور SSL فوری برای آی‌پی سرور (${ip})"
  echo -e "  [3] بازگشت به منوی قبل"
  echo ""
  echo -ne "${CYAN}👉 انتخاب کنید: ${NC}"
  read SSL_CHOICE

  case $SSL_CHOICE in
    1)
      echo -ne "${CYAN}دامنه را وارد کنید: ${NC}"
      read TARGET_DOM
      if [ -n "$TARGET_DOM" ]; then
        issue_ssl_for_target "$TARGET_DOM" "$ip"
      fi
      ;;
    2)
      issue_ssl_for_target "$ip" "$ip"
      ;;
    *)
      return
      ;;
  esac
  read -p "برای ادامه Enter بزنید..."
}

do_auto_renew_toggle() {
  echo ""
  echo -e "${BLUE}[*] در حال فعال‌سازی دیمون تمدید خودکار SSL...${NC}"
  cd "$PROJECT_DIR"
  curl -s -X POST http://localhost:3000/api/ssl/daemon-toggle -H "Content-Type: application/json" -d '{"action":"start"}' >/dev/null 2>&1 || true
  echo -e "${GREEN}✓ سرویس پس‌زمینه تمدید و بازرسی خودکار SSL با موفقیت فعال شد.${NC}"
  read -p "برای ادامه Enter بزنید..."
}

do_view_logs() {
  echo ""
  echo -e "${YELLOW}📜 نمایش لاگ‌های زنده تلگرام (جهت خروج Ctrl+C بزنید)...${NC}"
  sleep 1
  if command -v pm2 >/dev/null 2>&1; then
    pm2 logs telegram-self-tabchi-v6 --lines 50
  elif [ -f "$PROJECT_DIR/data/logs/server.log" ]; then
    tail -n 60 -f "$PROJECT_DIR/data/logs/server.log"
  else
    echo "لاگی یافت نشد."
  fi
  read -p "برای بازگشت به منو Enter بزنید..."
}

do_change_password() {
  echo ""
  echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${WHITE}             🔑 تغییر رمز عبور ورود مالک به وب پنل           ${CYAN}║${NC}"
  echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
  echo -ne "${YELLOW}رمز عبور جدید را وارد کنید (حداقل ۵ کاراکتر): ${NC}"
  read -s NEW_PASS
  echo ""
  echo -ne "${YELLOW}تکرار رمز عبور جدید: ${NC}"
  read -s CONFIRM_PASS
  echo ""

  if [ "$NEW_PASS" != "$CONFIRM_PASS" ]; then
    echo -e "${RED}[!] رمزها مطابقت ندارند.${NC}"
    read -p "برای ادامه Enter بزنید..."
    return
  fi

  if [ ${#NEW_PASS} -lt 5 ]; then
    echo -e "${RED}[!] طول رمز باید حداقل ۵ کاراکتر باشد.${NC}"
    read -p "برای ادامه Enter بزنید..."
    return
  fi

  mkdir -p "$PROJECT_DIR/data"
  node -e "
    const fs = require('fs');
    const path = '$PROJECT_DIR/data/owner_credentials.json';
    const data = { username: 'admin', password: '$NEW_PASS', updated_at: new Date().toISOString() };
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  " 2>/dev/null || true

  echo -e "${GREEN}✓ رمز عبور مالک با موفقیت بروزرسانی شد.${NC}"
  read -p "برای ادامه Enter بزنید..."
}

do_uninstall() {
  echo ""
  echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║${WHITE}             ⚠️  حذف کامل اسکریپت و پاکسازی سرور              ${RED}║${NC}"
  echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
  echo -e "${RED}هشدار: تمامی نشست‌های اکانت‌های تلگرام، دیتابیس ربات و فایل‌های پروژه حذف خواهند شد.${NC}"
  echo -ne "${YELLOW}آیا کاملاً اطمینان دارید؟ عبارت ${RED}DELETE${YELLOW} را تایپ کنید: ${NC}"
  read CONFIRM_UNINSTALL

  if [ "$CONFIRM_UNINSTALL" != "DELETE" ]; then
    echo -e "${GREEN}عملیات حذف لغو شد.${NC}"
    read -p "برای ادامه Enter بزنید..."
    return
  fi

  echo ""
  echo -e "${YELLOW}[1/4] متوقف کردن پردازش‌های PM2...${NC}"
  pm2 stop telegram-self-tabchi-v6 >/dev/null 2>&1 || true
  pm2 delete telegram-self-tabchi-v6 >/dev/null 2>&1 || true
  pm2 save >/dev/null 2>&1 || true

  echo -e "${YELLOW}[2/4] آزادسازی پورت‌ها و تسک‌های پس‌زمینه...${NC}"
  fuser -k 3000/tcp >/dev/null 2>&1 || true
  fuser -k 3443/tcp >/dev/null 2>&1 || true

  echo -e "${YELLOW}[3/4] حذف فایل‌های پروژه از سرور...${NC}"
  rm -rf "$PROJECT_DIR"

  echo -e "${YELLOW}[4/4] حذف دستور sudo selfandtabchi از سیستم...${NC}"
  rm -f /usr/local/bin/selfandtabchi /usr/bin/selfandtabchi

  echo ""
  echo -e "${GREEN}✓ اسکریپت با موفقیت به طور کامل از سرور پاکسازی شد.${NC}"
  exit 0
}

# Main event loop
while true; do
  show_menu
  read CHOICE
  case $CHOICE in
    1) do_start_restart ;;
    2) do_stop ;;
    3) do_update ;;
    4) do_domain_setup ;;
    5) do_ssl_menu ;;
    6) do_auto_renew_toggle ;;
    7) do_view_logs ;;
    8) do_change_password ;;
    9) do_uninstall ;;
    0|q|Q)
      echo -e "${GREEN}خروج از دستیار مدیریت سرور.${NC}"
      exit 0
      ;;
    *)
      echo -e "${RED}[!] گزینه نامعتبر است.${NC}"
      sleep 1
      ;;
  esac
done
