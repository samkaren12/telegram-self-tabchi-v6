#!/usr/bin/env bash
# ==============================================================================
# TELEGRAM SELF & TABCHI — HACKER EDITION v6 PRO
# One-Click Autonomous Installer & 24/7 Permanent Background Daemon
# ==============================================================================
# Compatible with: Ubuntu, Debian, CentOS, AlmaLinux, Rocky, Alpine, macOS
# ==============================================================================

set -e

# ANSI Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear

echo -e "${CYAN}${BOLD}"
cat << "EOF"
======================================================================
  _____ _____ _     _____ _____ ____      _    __  __ _   _ _____ 
 |_   _| ____| |   | ____|  ___/ ___|    / \  |  \/  | | | | ____|
   | | |  _| | |   |  _| | |_ | |  _    / _ \ | |\/| | |_| |  _|  
   | | | |___| |___| |___|  _|| |_| |  / ___ \| |  | |  _  | |___ 
   |_| |_____|_____|_____|_|   \____| /_/   \_\_|  |_|_| |_|_____|
                                                                  
      ★ TELEGRAM SELF & TABCHI AUTOMATION — HACKER EDITION v6 ★   
          Autonomous 24/7 Deployment & Background Manager         
======================================================================
EOF
echo -e "${NC}"

# Detect root / sudo
SUDO=""
if [ "$EUID" -ne 0 ]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  fi
fi

# Detect package manager and install basic tools if missing
install_pkg() {
  PKG=$1
  if command -v apt-get >/dev/null 2>&1; then
    $SUDO apt-get update -y && $SUDO apt-get install -y "$PKG"
  elif command -v yum >/dev/null 2>&1; then
    $SUDO yum install -y "$PKG"
  elif command -v dnf >/dev/null 2>&1; then
    $SUDO dnf install -y "$PKG"
  elif command -v apk >/dev/null 2>&1; then
    $SUDO apk add --no-cache "$PKG"
  elif command -v brew >/dev/null 2>&1; then
    brew install "$PKG"
  fi
}

# Check essential utilities immediately
for tool in curl git lsof tar gzip; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚙ Installing required tool: $tool...${NC}"
    install_pkg "$tool" || true
  fi
done

# If executed via curl | bash outside the repo, auto-clone or pull project
if [ ! -f "package.json" ]; then
  echo -e "${CYAN}📥 Initializing Telegram Self & Tabchi v6 environment...${NC}"
  REPO_DIR="telegram-self-tabchi-v6"
  if [ -d "$REPO_DIR" ] && [ -f "$REPO_DIR/package.json" ]; then
    cd "$REPO_DIR"
  else
    echo -e "${BLUE}▶ Fetching repository from GitHub...${NC}"
    if git clone https://github.com/samkaren12/telegram-self-tabchi-v6.git "$REPO_DIR" 2>/dev/null; then
      cd "$REPO_DIR"
    else
      echo -e "${YELLOW}⚡ GitHub clone unavailable, retrieving cloud release bundle...${NC}"
      mkdir -p "$REPO_DIR"
      cd "$REPO_DIR"
      curl -fsSL "https://ais-pre-7f3kwsysmk5oau2mcbqqev-503749566645.europe-west2.run.app/api/download-bundle" -o bundle.tar.gz || \
      curl -fsSL "https://ais-dev-7f3kwsysmk5oau2mcbqqev-503749566645.europe-west2.run.app/api/download-bundle" -o bundle.tar.gz
      tar -xzf bundle.tar.gz --overwrite
      rm -f bundle.tar.gz
    fi
  fi
fi

PROJECT_DIR="$(pwd)"

# Check Node.js
echo -e "${BLUE}▶ [2/6] Checking Node.js (v18+ recommended)...${NC}"
NODE_NEED_INSTALL=false

if ! command -v node >/dev/null 2>&1; then
  NODE_NEED_INSTALL=true
else
  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VER" -lt 18 ]; then
    echo -e "${YELLOW}⚠️ Found Node.js v$(node -v), but v18+ or v20+ is required.${NC}"
    NODE_NEED_INSTALL=true
  else
    echo -e "${GREEN}✓ Node.js $(node -v) is installed.${NC}"
  fi
fi

if [ "$NODE_NEED_INSTALL" = true ]; then
  echo -e "${YELLOW}⚡ Installing Node.js 20 LTS...${NC}"
  if command -v apt-get >/dev/null 2>&1; then
    if [ "$EUID" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
      sudo apt-get install -y nodejs
    else
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      apt-get install -y nodejs
    fi
  elif command -v yum >/dev/null 2>&1 || command -v dnf >/dev/null 2>&1; then
    if [ "$EUID" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
      curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
      sudo yum install -y nodejs || sudo dnf install -y nodejs
    else
      curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
      yum install -y nodejs || dnf install -y nodejs
    fi
  elif command -v brew >/dev/null 2>&1; then
    brew install node@20
  else
    echo -e "${RED}❌ Please install Node.js 18+ or 20+ manually and run this script again.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Node.js $(node -v) successfully installed!${NC}"
fi

# Prepare environment file
echo -e "${BLUE}▶ [3/6] Setting up configuration & environment files...${NC}"
mkdir -p "$PROJECT_DIR/data" "$PROJECT_DIR/data/logs"

if [ ! -f "$PROJECT_DIR/.env" ]; then
  if [ -f "$PROJECT_DIR/.env.example" ]; then
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
    echo -e "${GREEN}✓ Created .env file from .env.example.${NC}"
  else
    cat << 'ENVEOF' > "$PROJECT_DIR/.env"
TELEGRAM_API_ID="2496"
TELEGRAM_API_HASH="8da85b0d5bfe62527e5b244c209159c3"
PORT=3000
NODE_ENV=production
ENVEOF
    echo -e "${GREEN}✓ Generated default .env file.${NC}"
  fi
fi

# Install dependencies
echo -e "${BLUE}▶ [4/6] Installing project packages via npm...${NC}"
npm install --no-audit --prefer-offline 2>/dev/null || npm install

# Build production bundle
echo -e "${BLUE}▶ [5/6] Building high-performance production distribution...${NC}"
npm run build

# Install PM2 Process Manager for 24/7 background execution
echo -e "${BLUE}▶ [6/6] Configuring 24/7 Permanent Background Daemon (PM2)...${NC}"
if ! command -v pm2 >/dev/null 2>&1; then
  echo -e "${YELLOW}⚙ Installing PM2 process manager globally...${NC}"
  if [ "$EUID" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
    sudo npm install -g pm2 || npm install pm2
  else
    npm install -g pm2 || npm install pm2
  fi
fi

# Release port 3000 if occupied
OLD_3000_PID=$(lsof -ti:3000 2>/dev/null || true)
if [ -n "$OLD_3000_PID" ]; then
  echo -e "${YELLOW}Releasing port 3000 (killing previous PID $OLD_3000_PID)...${NC}"
  kill -9 "$OLD_3000_PID" 2>/dev/null || true
  sleep 1
fi

# Start with PM2
if command -v pm2 >/dev/null 2>&1; then
  pm2 delete telegram-self-tabchi-v6 >/dev/null 2>&1 || true
  if [ -f "$PROJECT_DIR/ecosystem.config.cjs" ]; then
    pm2 start "$PROJECT_DIR/ecosystem.config.cjs"
  else
    pm2 start dist/server.cjs --name "telegram-self-tabchi-v6" --node-args="--max-old-space-size=1024"
  fi
  pm2 save >/dev/null 2>&1 || true
else
  # Fallback to detached nohup daemon
  ./start.sh
fi

# Determine Server IP
SERVER_IP=$(curl -s --max-time 3 https://api.ipify.org 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")

chmod +x "$PROJECT_DIR/start.sh" "$PROJECT_DIR/stop.sh" "$PROJECT_DIR/status.sh"

echo -e "\n${GREEN}${BOLD}======================================================================${NC}"
echo -e "${GREEN}${BOLD}   🎉 INSTALLATION COMPLETED — 24/7 DAEMON ACTIVATED PERMANENTLY!    ${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo ""
echo -e " ${BOLD}🌐 Web Dashboard URL:${NC}       ${CYAN}http://localhost:3000${NC}"
echo -e " ${BOLD}🌍 Public Server URL:${NC}       ${CYAN}http://${SERVER_IP}:3000${NC}"
echo -e " ${BOLD}🔑 Startup Security Key:${NC}    ${YELLOW}selfsamkaren12${NC}"
echo -e " ${BOLD}🤖 Telegram Saved Messages:${NC} ${MAGENTA}/self, /tabchi, /help${NC}"
echo ""
echo -e "${BOLD}📌 Important (24/7 Background Persistence):${NC}"
echo -e " ✔ The application runs independently as a ${GREEN}PM2 background daemon${NC}."
echo -e " ✔ ${BOLD}You can safely CLOSE your terminal, SSH, or PuTTY window now.${NC}"
echo -e " ✔ To enable automatic startup upon server reboot, run:"
echo -e "     ${YELLOW}pm2 startup && pm2 save${NC}"
echo ""
echo -e "${BOLD}🛠 Management Commands:${NC}"
echo -e " • Status check:   ${CYAN}pm2 status${NC}  or  ${CYAN}./status.sh${NC}"
echo -e " • View live logs: ${CYAN}pm2 logs telegram-self-tabchi-v6${NC}"
echo -e " • Restart panel:  ${CYAN}pm2 restart telegram-self-tabchi-v6${NC}"
echo -e " • Stop panel:     ${CYAN}pm2 stop telegram-self-tabchi-v6${NC}  or  ${CYAN}./stop.sh${NC}"
echo ""
echo -e "${GREEN}======================================================================${NC}"
