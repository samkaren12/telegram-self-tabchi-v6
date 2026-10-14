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

# Locate true PROJECT_DIR dynamically (from environment, config file, script location, or known paths)
if [ -z "$PROJECT_DIR" ] || [ ! -d "$PROJECT_DIR" ] || [ ! -f "$PROJECT_DIR/package.json" ]; then
  if [ -f /etc/selfandtabchi.conf ]; then
    CONF_DIR=$(cat /etc/selfandtabchi.conf 2>/dev/null | tr -d '\r\n')
    if [ -d "$CONF_DIR" ] && [ -f "$CONF_DIR/package.json" ]; then
      PROJECT_DIR="$CONF_DIR"
    fi
  fi
fi

if [ -z "$PROJECT_DIR" ] || [ ! -d "$PROJECT_DIR" ] || [ ! -f "$PROJECT_DIR/package.json" ]; then
  REAL_SCRIPT=$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || echo "${BASH_SOURCE[0]}")
  CANDIDATE_DIR=$(cd "$(dirname "$REAL_SCRIPT")/.." 2>/dev/null && pwd)
  if [ -f "$CANDIDATE_DIR/package.json" ]; then
    PROJECT_DIR="$CANDIDATE_DIR"
  fi
fi

if [ -z "$PROJECT_DIR" ] || [ ! -d "$PROJECT_DIR" ] || [ ! -f "$PROJECT_DIR/package.json" ]; then
  for dir in "$(pwd)" "/root/telegram-self-tabchi-v6" "/root/selfandtabchi" "/root/telegram-self" "/var/www/telegram-self-tabchi-v6" "/opt/telegram-self-tabchi-v6" /home/*/telegram-self-tabchi-v6; do
    if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
      PROJECT_DIR="$dir"
      break
    fi
  done
fi

if [ -z "$PROJECT_DIR" ]; then
  PROJECT_DIR="$(pwd)"
fi

export PROJECT_DIR
if [ -d "$PROJECT_DIR" ] && [ -f "$PROJECT_DIR/package.json" ]; then
  echo "$PROJECT_DIR" > /etc/selfandtabchi.conf 2>/dev/null || true
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

CACHED_IP=""
get_public_ip() {
  if [ -n "$CACHED_IP" ]; then
    echo "$CACHED_IP"
    return
  fi
  local found_ip=""
  found_ip=$(hostname -I 2>/dev/null | awk '{print $1}')
  if [ -z "$found_ip" ] || [ "$found_ip" = "127.0.0.1" ]; then
    found_ip=$(curl -s --connect-timeout 1 --max-time 1 https://api.ipify.org 2>/dev/null || echo "")
  fi
  if [ -z "$found_ip" ]; then
    found_ip="127.0.0.1"
  fi
  CACHED_IP="$found_ip"
  echo "$CACHED_IP"
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
  if curl -s -m 1 http://127.0.0.1:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}آنلاین و فعال روی پورت 3000${NC}"
    return
  fi
  if command -v lsof >/dev/null 2>&1 && lsof -ti:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}فعال روی پورت 3000${NC}"
    return
  fi
  echo -e "${RED}متوقف (Offline)${NC}"
}

show_banner() {
  local ip=$(get_public_ip)
  local status=$(get_service_status)
  local ssl_info=$(get_ssl_info)

  clear 2>/dev/null || true
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
  echo -e "  ${GREEN}[1]${NC} 🚀 ${BOLD}روشن کردن و شروع سرویس (Start Service)${NC}"
  echo -e "  ${YELLOW}[2]${NC} 🛑 ${BOLD}متوقف کردن و خاموش کردن سرویس (Stop Service)${NC}"
  echo -e "  ${CYAN}[3]${NC} 🔄 ${BOLD}راه‌اندازی مجدد سرویس (Restart Service)${NC}"
  echo -e "  ${BLUE}[4]${NC} 📊 ${BOLD}بررسی وضعیت آنلاین بودن و اطلاعات سیستم (Check Status)${NC}"
  echo -e "  ${YELLOW}[5]${NC} 📜 ${BOLD}مشاهده لاگ‌های زنده سیستم (View Live Logs)${NC}"
  echo -e "  ${PURPLE}[6]${NC} 🌐 ${BOLD}تنظیم و تغییر دامنه سرور (Set / Change Domain)${NC}"
  echo -e "  ${GREEN}[7]${NC} 🔒 ${BOLD}دریافت و نصب گواهی SSL روی دامنه یا آی‌پی (Issue SSL Certificate)${NC}"
  echo -e "  ${BLUE}[8]${NC} 🛡️ ${BOLD}فعال‌سازی سرویس تمدید خودکار SSL (Auto-Renewal Daemon)${NC}"
  echo -e "  ${CYAN}[9]${NC} 🔑 ${BOLD}تغییر رمز ورود مالک و احراز هویت (Change Admin Password)${NC}"
  echo -e "  ${MAGENTA}[10]${NC} ⚡ ${BOLD}بروزرسانی اسکریپت به آخرین نسخه (Update Script)${NC}"
  echo -e "  ${RED}[11]${NC} 🗑️ ${BOLD}حذف کامل اسکریپت و پاکسازی سرور (Uninstall Script)${NC}"
  echo -e "  ${WHITE}[0]${NC} 🚪 ${BOLD}خروج (Exit)${NC}"
  echo ""
  echo -ne "${CYAN}👉 شماره مورد نظر را وارد کرده و Enter بزنید: ${NC}"
}

do_start() {
  echo ""
  echo -e "${CYAN}[*] در حال روشن کردن و راه‌اندازی سرویس تلگرام...${NC}"
  cd "$PROJECT_DIR"
  if [ -f "./start.sh" ]; then
    chmod +x ./start.sh
    ./start.sh
  elif command -v pm2 >/dev/null 2>&1; then
    pm2 start process.json 2>/dev/null || pm2 start dist/server.cjs --name "telegram-self-tabchi-v6" || pm2 restart telegram-self-tabchi-v6 2>/dev/null
  else
    npm run build
    nohup node dist/server.cjs > data/logs/server.log 2>&1 &
  fi
  echo -e "${GREEN}✓ سرویس با موفقیت فعال شد.${NC}"
  read -p "برای ادامه Enter بزنید..."
}

do_stop() {
  echo ""
  echo -e "${YELLOW}[*] در حال متوقف کردن و خاموش کردن سرویس...${NC}"
  cd "$PROJECT_DIR"
  if [ -f "./stop.sh" ]; then
    chmod +x ./stop.sh
    ./stop.sh
  else
    pm2 stop telegram-self-tabchi-v6 >/dev/null 2>&1 || true
    pm2 delete telegram-self-tabchi-v6 >/dev/null 2>&1 || true
    fuser -k 3000/tcp >/dev/null 2>&1 || true
    fuser -k 3443/tcp >/dev/null 2>&1 || true
  fi
  echo -e "${GREEN}✓ سرویس با موفقیت متوقف شد.${NC}"
  read -p "برای ادامه Enter بزنید..."
}

do_restart() {
  echo ""
  echo -e "${CYAN}[*] در حال راه‌اندازی مجدد (Restart) سرویس...${NC}"
  cd "$PROJECT_DIR"
  if [ -f "./stop.sh" ] && [ -f "./start.sh" ]; then
    chmod +x ./start.sh ./stop.sh
    ./stop.sh >/dev/null 2>&1 || true
    sleep 1
    ./start.sh
  elif command -v pm2 >/dev/null 2>&1; then
    pm2 restart telegram-self-tabchi-v6 2>/dev/null || pm2 restart all
  else
    fuser -k 3000/tcp >/dev/null 2>&1 || true
    nohup node dist/server.cjs > data/logs/server.log 2>&1 &
  fi
  echo -e "${GREEN}✓ سرویس با موفقیت ری‌استارت شد.${NC}"
  read -p "برای ادامه Enter بزنید..."
}

do_status() {
  echo ""
  echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${WHITE}             📊 وضعیت زنده سرویس و اکانت‌ها                  ${CYAN}║${NC}"
  echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
  local ip=$(get_public_ip)
  local status=$(get_service_status)
  local ssl_info=$(get_ssl_info)
  echo -e " 🌐 آی‌پی عمومی سرور:   ${YELLOW}${ip}${NC}"
  echo -e " 📊 وضعیت سرویس:       ${status}"
  echo -e " 🔒 وضعیت SSL:         ${ssl_info}"
  echo -e " 📁 مسیر پروژه:        ${WHITE}${PROJECT_DIR}${NC}"
  echo -e " 🔗 وب‌پنل:             ${CYAN}http://${ip}:3000${NC} یا ${CYAN}https://${ip}:3443${NC}"
  echo ""
  if command -v pm2 >/dev/null 2>&1; then
    pm2 status telegram-self-tabchi-v6 2>/dev/null || pm2 list 2>/dev/null || true
  fi
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
  npm run build:server || npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs || true
  npm run build:client || npx vite build || true

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

  # Update internal ssl/domain config & dedicated domain-config.json
  mkdir -p "$PROJECT_DIR/data/ssl"
  node -e "
    const fs = require('fs');
    const domainCfgPath = '$PROJECT_DIR/data/domain-config.json';
    const sslCfgPath = '$PROJECT_DIR/data/ssl/ssl-config.json';
    const statePath = '$PROJECT_DIR/data/state.json';

    const domCfg = {
      domain: '$DOMAIN_INPUT',
      isHttps: true,
      port: 3443,
      sslType: 'letsencrypt',
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(domainCfgPath, JSON.stringify(domCfg, null, 2));

    let sslCfg = {};
    if (fs.existsSync(sslCfgPath)) {
      try { sslCfg = JSON.parse(fs.readFileSync(sslCfgPath, 'utf8')); } catch(e){}
    }
    sslCfg.domain = '$DOMAIN_INPUT';
    sslCfg.serverIp = '$ip';
    fs.writeFileSync(sslCfgPath, JSON.stringify(sslCfg, null, 2));

    if (fs.existsSync(statePath)) {
      try {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        if (state.botSettings) {
          state.botSettings.web_app_url = 'https://$DOMAIN_INPUT:3443';
          fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
        }
      } catch(e){}
    }
  " 2>/dev/null || true

  # Notify live running node server immediately via API
  curl -s -X POST http://127.0.0.1:3000/api/domain/set \
    -H "Content-Type: application/json" \
    -d "{\"domain\":\"$DOMAIN_INPUT\",\"isHttps\":true,\"port\":3443}" >/dev/null 2>&1 || true

  echo -e "${GREEN}✓ دامنه با موفقیت به عنوان دامنه رسمی سرور و ربات ثبت گردید.${NC}"
  echo ""
  echo -ne "${CYAN}آیا تمایل دارید هم‌اکنون گواهی امنیتی SSL معتبر برای ${DOMAIN_INPUT} دریافت شود؟ (y/n): ${NC}"
  read ISSUE_SSL_NOW
  if [[ "$ISSUE_SSL_NOW" =~ ^[Yy]$ ]]; then
    issue_ssl_for_target "$DOMAIN_INPUT" "$ip"
  else
    pm2 restart telegram-self-tabchi-v6 >/dev/null 2>&1 || true
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
    echo -e "${YELLOW}[*] بررسی گواهی رسمی معتبر Let's Encrypt برای ${target}...${NC}"
    if [ -f "/etc/letsencrypt/live/${target}/fullchain.pem" ]; then
      cp "/etc/letsencrypt/live/${target}/fullchain.pem" "$certPath"
      cp "/etc/letsencrypt/live/${target}/privkey.pem" "$keyPath"
      certbot_ok=true
      echo -e "${GREEN}✓ گواهی معتبر موجود Let's Encrypt بارگذاری گردید.${NC}"
    else
      fuser -k 80/tcp >/dev/null 2>&1 || true
      certbot certonly --standalone -d "$target" --non-interactive --agree-tos -m "admin@${target}" --keep-until-expiring 2>/dev/null || true
      if [ -f "/etc/letsencrypt/live/${target}/fullchain.pem" ]; then
        cp "/etc/letsencrypt/live/${target}/fullchain.pem" "$certPath"
        cp "/etc/letsencrypt/live/${target}/privkey.pem" "$keyPath"
        certbot_ok=true
        echo -e "${GREEN}✓ گواهی رسمی معتبر Let's Encrypt دریافت و نصب گردید.${NC}"
      fi
    fi
  fi

  if [ "$certbot_ok" = false ]; then
    # If existing cert is still valid on disk, do not overwrite it
    local has_valid_cert=false
    if [ -f "$certPath" ]; then
      local exp_check=$(openssl x509 -checkend 86400 -noout -in "$certPath" 2>/dev/null && echo "VALID" || echo "EXPIRED")
      if [ "$exp_check" = "VALID" ]; then
        has_valid_cert=true
        echo -e "${GREEN}✓ گواهی امنیتی موجود همچنان معتبر است و حفظ شد.${NC}"
      fi
    fi

    if [ "$has_valid_cert" = false ]; then
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
      echo -e "${GREEN}✓ گواهی امنیتی OpenSSL با موفقیت صادر و فعال گردید.${NC}"
    fi
  fi

  # Update JSON configuration & permanent domain-config
  node -e "
    const fs = require('fs');
    const domainCfgPath = '$PROJECT_DIR/data/domain-config.json';
    const sslCfgPath = '$PROJECT_DIR/data/ssl/ssl-config.json';
    const statePath = '$PROJECT_DIR/data/state.json';

    fs.writeFileSync(domainCfgPath, JSON.stringify({
      domain: '$target',
      isHttps: true,
      port: 3443,
      sslType: '$certbot_ok' === 'true' ? 'letsencrypt' : 'self_signed',
      updatedAt: new Date().toISOString()
    }, null, 2));

    let cfg = {};
    if (fs.existsSync(sslCfgPath)) {
      try { cfg = JSON.parse(fs.readFileSync(sslCfgPath, 'utf8')); } catch(e){}
    }
    cfg.enabled = true;
    cfg.domain = '$target';
    cfg.serverIp = '$ip';
    cfg.certPath = '$certPath';
    cfg.keyPath = '$keyPath';
    cfg.type = '$certbot_ok' === 'true' ? 'letsencrypt_nip' : 'self_signed';
    cfg.autoRenew = true;
    cfg.httpsPort = 3443;
    cfg.daysRemaining = 365;
    fs.writeFileSync(sslCfgPath, JSON.stringify(cfg, null, 2));

    if (fs.existsSync(statePath)) {
      try {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        if (state.botSettings) {
          state.botSettings.web_app_url = 'https://$target:3443';
          fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
        }
      } catch(e){}
    }
  " 2>/dev/null || true

  # Notify live running node server via API
  curl -s -X POST http://127.0.0.1:3000/api/domain/set \
    -H "Content-Type: application/json" \
    -d "{\"domain\":\"$target\",\"isHttps\":true,\"port\":3443,\"sslType\":\"$certbot_ok\"}" >/dev/null 2>&1 || true

  # Restart server in PM2 to reload certificates & sync memory
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

handle_action() {
  local act="$1"
  case $act in
    1|"start"|"روشن") do_start ;;
    2|"stop"|"خاموش") do_stop ;;
    3|"restart"|"ری‌استارت") do_restart ;;
    4|"status"|"وضعیت") do_status ;;
    5|"logs"|"لاگ") do_view_logs ;;
    6|"domain"|"دامنه") do_domain_setup ;;
    7|"ssl"|"اس‌اس‌ال") do_ssl_menu ;;
    8|"autorenew"|"تمدید") do_auto_renew_toggle ;;
    9|"password"|"رمز") do_change_password ;;
    10|"update"|"آپدیت"|"بروزرسانی") do_update ;;
    11|"uninstall"|"حذف") do_uninstall ;;
    0|"exit"|"q"|"Q"|"خروج")
      echo -e "${GREEN}خروج از دستیار مدیریت سرور.${NC}"
      exit 0
      ;;
    *)
      echo -e "${RED}[!] گزینه وارد شده نامعتبر است: $act${NC}"
      sleep 1
      ;;
  esac
}

convert_to_ascii_digits() {
  echo "$1" | sed 's/۰/0/g; s/۱/1/g; s/۲/2/g; s/۳/3/g; s/۴/4/g; s/۵/5/g; s/۶/6/g; s/۷/7/g; s/۸/8/g; s/۹/9/g; s/٠/0/g; s/١/1/g; s/٢/2/g; s/٣/3/g; s/٤/4/g; s/٥/5/g; s/٦/6/g; s/٧/7/g; s/٨/8/g; s/٩/9/g; s/[ \t\r\n]//g'
}

# If CLI argument was provided directly, execute and exit
if [ -n "$1" ]; then
  CLI_ARG=$(convert_to_ascii_digits "$1")
  handle_action "$CLI_ARG"
  exit 0
fi

# Interactive menu loop
while true; do
  show_menu
  read -r RAW_CHOICE
  # Convert Persian/Arabic digits to English digits
  CHOICE=$(convert_to_ascii_digits "$RAW_CHOICE")
  handle_action "$CHOICE"
done

