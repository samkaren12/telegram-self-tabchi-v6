process.env.TZ = "Asia/Tehran";

import express from "express";
import path from "path";
import os from "os";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import {
  telegramManager,
  DEFAULT_API_ID,
  DEFAULT_API_HASH,
  getMarketQuote,
  getFeaturedMarketList,
} from "./server/telegramManager.js";
import { testAiApiKey } from "./server/aiSecretary.js";

const startTime = Date.now();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Normalize and clean phone route parameter across all endpoints
  app.param("phone", (req, _res, next, phone) => {
    if (phone) {
      let cleaned = decodeURIComponent(phone).trim();
      if (!cleaned.startsWith("+")) {
        cleaned = "+" + cleaned.replace(/^[\s]+/, "");
      }
      req.params.phone = cleaned;
    }
    next();
  });

  // Automatically detect public container/tunnel URL for Telegram Bots
  app.use((req, res, next) => {
    const proto = (req.headers["x-forwarded-proto"] as string) || "https";
    const host = (req.headers["x-forwarded-host"] as string) || req.headers.host;
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1") && !host.includes("0.0.0.0")) {
      telegramManager.setDetectedAppUrl(`${proto}://${host}`);
    }
    next();
  });

  // Initialize all stored accounts on server startup
  telegramManager.initAllAccounts().catch((err) => {
    console.error("Error initializing accounts:", err);
  });

  // ==========================================
  // API ROUTES
  // ==========================================

  // System Health & Status
  app.get("/api/status", (req, res) => {
    const accounts = telegramManager.getAccounts();
    const onlineAccounts = accounts.filter((a) => a.isOnline);
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const bot = telegramManager.getBotSettings();

    res.json({
      status: "online",
      uptimeSeconds,
      connectedAccountsCount: accounts.length,
      activeAccounts: onlineAccounts.map((a) => a.phone),
      nodeVersion: process.version,
      memoryUsageMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      defaultApiId: DEFAULT_API_ID,
      defaultApiHash: DEFAULT_API_HASH ? `${DEFAULT_API_HASH.slice(0, 4)}...${DEFAULT_API_HASH.slice(-4)}` : "",
      hasCustomBotToken: Boolean(bot.bot_token),
      botStatus: {
        configured: Boolean(bot.bot_token),
        enabled: bot.enabled,
        owner_id: bot.owner_id,
        token_masked: bot.bot_token ? `${bot.bot_token.slice(0, 6)}...` : undefined,
      },
      serverTime: new Date().toISOString(),
    });
  });

  // Accounts list
  app.get("/api/accounts", (req, res) => {
    const accounts = telegramManager.getAccounts();
    res.json({ accounts });
  });

  // Web Panel Authentication: Owner & Customer Logins
  app.post("/api/auth/login", (req, res) => {
    try {
      const { role, username, password } = req.body;
      const cleanUser = (username || "").trim();
      const cleanPass = (password || "").trim();

      if (!cleanPass) {
        return res.status(400).json({ success: false, message: "رمز عبور الزامی است." });
      }

      if (role === "owner" || (!role && (cleanUser === "samkaren12" || cleanPass === "samkaren12" || cleanPass === "selfsamkaren12"))) {
        // Owner verification (samkaren12 / samkaren12 or legacy selfsamkaren12)
        if (
          (cleanUser === "samkaren12" && cleanPass === "samkaren12") ||
          cleanPass === "samkaren12" ||
          cleanPass === "selfsamkaren12"
        ) {
          return res.json({
            success: true,
            session: {
              role: "owner",
              username: "samkaren12",
              token: crypto.randomUUID(),
            },
          });
        }
        return res.status(401).json({
          success: false,
          message: "نام کاربری یا رمز عبور مالک نادرست است. نام کاربری و رمز پیش‌فرض: samkaren12",
        });
      }

      // Customer Login verification
      if (!cleanUser) {
        return res.status(400).json({ success: false, message: "شماره تلفن یا نام کاربری مشتری الزامی است." });
      }

      const acc = telegramManager.findAccountByCredentials(cleanUser, cleanPass);
      if (acc) {
        return res.json({
          success: true,
          session: {
            role: "customer",
            username: acc.client_credentials?.username || acc.phone,
            customerPhone: acc.phone,
            token: crypto.randomUUID(),
          },
        });
      }

      return res.status(401).json({
        success: false,
        message: "مشخصات ورود مشتری نامعتبر است! رمز عبور را با ارسال دستور /login در ربات تلگرام اختصاصی شماره خود یا بخش Saved Messages دریافت کنید.",
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Account Customer Credentials Management
  app.get("/api/accounts/:phone/credentials", (req, res) => {
    try {
      const { phone } = req.params;
      const credentials = telegramManager.getAccountCredentials(phone);
      if (!credentials) return res.status(404).json({ success: false, message: "حساب یافت نشد." });
      return res.json({ success: true, credentials });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post("/api/accounts/:phone/credentials", (req, res) => {
    try {
      const { phone } = req.params;
      const { username, password } = req.body;
      const credentials = telegramManager.updateAccountCredentials(phone, username, password);
      return res.json({ success: true, credentials });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Dedicated Per-Account Bot endpoints
  app.get("/api/accounts/:phone/bot", (req, res) => {
    try {
      const { phone } = req.params;
      const acc = telegramManager.getAccount(phone);
      if (!acc) return res.status(404).json({ success: false, message: "حساب یافت نشد." });
      return res.json({ success: true, bot: acc.bot || { bot_token: "", enabled: false, status: "disconnected" } });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post("/api/accounts/:phone/bot", async (req, res) => {
    try {
      const { phone } = req.params;
      const { botToken, enabled } = req.body;
      const bot = await telegramManager.updateAccountBot(phone, botToken, Boolean(enabled));
      return res.json({ success: true, bot, message: "تنظیمات ربات اختصاصی شماره با موفقیت ذخیره شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post("/api/accounts/:phone/bot/test", async (req, res) => {
    try {
      const { token } = req.body;
      const info = await telegramManager.testAccountBotToken(token);
      return res.json({ success: true, ...info });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Telegram Auth: Step 1 - Send Code to Phone Number
  app.post("/api/telegram/auth/send-code", async (req, res) => {
    try {
      const { phoneNumber, apiId, apiHash } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ success: false, message: "شماره تلفن الزامی است." });
      }

      const result = await telegramManager.sendCode(phoneNumber, apiId ? Number(apiId) : undefined, apiHash);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || "خطا در ارسال کد تایید تلگرام",
      });
    }
  });

  // Telegram Auth: Step 2 - Sign in with code
  app.post("/api/telegram/auth/sign-in", async (req, res) => {
    try {
      const { sessionId, phoneCode } = req.body;
      if (!sessionId || !phoneCode) {
        return res.status(400).json({
          success: false,
          message: "شناسه نشست (sessionId) و کد تایید (phoneCode) الزامی هستند.",
        });
      }

      const result = await telegramManager.signIn(sessionId, phoneCode);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || "خطا در بررسی کد تایید",
      });
    }
  });

  // Telegram Auth: Step 3 - Two-Step Verification (2FA Password)
  app.post("/api/telegram/auth/2fa", async (req, res) => {
    try {
      const { sessionId, password } = req.body;
      if (!sessionId || !password) {
        return res.status(400).json({
          success: false,
          message: "شناسه نشست و رمز عبور دو مرحله‌ای الزامی هستند.",
        });
      }

      const result = await telegramManager.verify2FA(sessionId, password);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || "خطا در تایید رمز عبور دو مرحله‌ای",
      });
    }
  });

  // Telegram Auth: Direct Session String Import
  app.post("/api/telegram/auth/import-session", async (req, res) => {
    try {
      const { sessionString, apiId, apiHash } = req.body;
      if (!sessionString) {
        return res.status(400).json({
          success: false,
          message: "رشته سشن (sessionString) الزامی است.",
        });
      }

      const result = await telegramManager.importSession(
        sessionString,
        apiId ? Number(apiId) : undefined,
        apiHash
      );
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || "خطا در واردسازی سشن تلگرام",
      });
    }
  });

  // Account Operations
  app.post("/api/accounts/:phone/disconnect", async (req, res) => {
    try {
      const { phone } = req.params;
      await telegramManager.disconnectAccount(phone);
      return res.json({ success: true, message: "حساب با موفقیت قطع ارتباط شد." });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/accounts/:phone/reconnect", async (req, res) => {
    try {
      const { phone } = req.params;
      await telegramManager.startAccountWorker(phone);
      return res.json({ success: true, message: "اتصال حساب مجدداً برقرار گردید." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Account Subscription Management
  app.post("/api/accounts/:phone/subscription", async (req, res) => {
    try {
      const { phone } = req.params;
      const { is_unlimited, days_to_add, days_total, notes, requester_role } = req.body;

      if (requester_role === "customer") {
        return res.status(403).json({
          success: false,
          message: "دسترسی غیرمجاز: تغییر یا تمدید اشتراک فقط توسط مالک سیستم امکان‌پذیر است.",
        });
      }

      const sub = telegramManager.updateAccountSubscription(phone, {
        is_unlimited: Boolean(is_unlimited),
        days_to_add: days_to_add ? Number(days_to_add) : undefined,
        days_total: days_total ? Number(days_total) : undefined,
        notes: notes ? String(notes) : undefined,
      });
      return res.json({
        success: true,
        message: is_unlimited
          ? "اشتراک حساب به وضعیت نامحدود (دائمی) ارتقا یافت."
          : `اشتراک حساب با موفقیت تمدید شد.`,
        subscription: sub,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Self Module: Self-Time Clock
  app.post("/api/accounts/:phone/self-time", async (req, res) => {
    try {
      const { phone } = req.params;
      const { active, format, fontStyle } = req.body;
      const result = await telegramManager.updateSelfTimeConfig(phone, Boolean(active), format, fontStyle);
      return res.json({ success: true, self_time: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Self Module: Auto-Reply
  app.post("/api/accounts/:phone/auto-reply", async (req, res) => {
    try {
      const { phone } = req.params;
      const {
        active,
        messages,
        delaySeconds,
        aiEnabled,
        aiApiKey,
        aiPrompt,
        aiModel,
      } = req.body;
      const result = telegramManager.updateAutoReplyConfig(
        phone,
        Boolean(active),
        Array.isArray(messages) ? messages : [],
        Number(delaySeconds) || 1,
        aiEnabled !== undefined ? Boolean(aiEnabled) : undefined,
        aiApiKey !== undefined ? String(aiApiKey) : undefined,
        aiPrompt !== undefined ? String(aiPrompt) : undefined,
        aiModel !== undefined ? String(aiModel) : undefined
      );
      return res.json({ success: true, auto_reply: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // AI Secretary Key Test Endpoint
  app.post("/api/ai/test", async (req, res) => {
    try {
      const { apiKey, customPrompt } = req.body;
      const result = await testAiApiKey(apiKey, customPrompt);
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Tabchi Module: Start Broadcast
  app.post("/api/accounts/:phone/tabchi/start", async (req, res) => {
    try {
      const { phone } = req.params;
      const result = await telegramManager.startBroadcast(phone);
      return res.json({ success: true, tabchi: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Tabchi Module: Stop Broadcast
  app.post("/api/accounts/:phone/tabchi/stop", (req, res) => {
    try {
      const { phone } = req.params;
      const result = telegramManager.stopBroadcast(phone);
      return res.json({ success: true, tabchi: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Tabchi Module: Settings
  app.post("/api/accounts/:phone/tabchi/settings", (req, res) => {
    try {
      const { phone } = req.params;
      const { message, intervalSeconds, repeatRounds, repeatInfinite, targetMode, targets } = req.body;
      const result = telegramManager.updateTabchiConfig(
        phone,
        message,
        Number(intervalSeconds) || 4,
        Number(repeatRounds) || 3,
        Boolean(repeatInfinite),
        targetMode,
        Array.isArray(targets) ? targets : undefined
      );
      return res.json({ success: true, tabchi: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Self Module: Mandatory Join
  app.post("/api/accounts/:phone/mandatory-join", (req, res) => {
    try {
      const { phone } = req.params;
      const { active, channels } = req.body;
      const result = telegramManager.updateMandatoryJoinConfig(
        phone,
        Boolean(active),
        Array.isArray(channels) ? channels : []
      );
      return res.json({ success: true, mandatory_join: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Self Module: Chat Tools (Calculator & Market)
  app.post("/api/accounts/:phone/chat-tools", (req, res) => {
    try {
      const { phone } = req.params;
      const { calculatorActive, marketActive } = req.body;
      const result = telegramManager.updateChatToolsConfig(
        phone,
        Boolean(calculatorActive),
        Boolean(marketActive)
      );
      return res.json({ success: true, tools: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Self Module: Font Scopes
  app.post("/api/accounts/:phone/font-scopes", (req, res) => {
    try {
      const { phone } = req.params;
      const { active, style, scopes } = req.body;
      const result = telegramManager.updateFontConfig(
        phone,
        Boolean(active),
        style,
        scopes || {}
      );
      return res.json({ success: true, font: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // PM Broadcaster: Start
  app.post("/api/accounts/:phone/pm-broadcast/start", async (req, res) => {
    try {
      const { phone } = req.params;
      const result = await telegramManager.startPmBroadcast(phone);
      return res.json({ success: true, broadcast: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // PM Broadcaster: Stop
  app.post("/api/accounts/:phone/pm-broadcast/stop", (req, res) => {
    try {
      const { phone } = req.params;
      const result = telegramManager.stopPmBroadcast(phone);
      return res.json({ success: true, broadcast: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // PM Broadcaster: Settings
  app.post("/api/accounts/:phone/pm-broadcast/settings", (req, res) => {
    try {
      const { phone } = req.params;
      const { message, intervalSeconds, maxRecipients } = req.body;
      const result = telegramManager.updatePmBroadcastSettings(
        phone,
        message,
        Number(intervalSeconds) || 20,
        Number(maxRecipients) || 50
      );
      return res.json({ success: true, broadcast: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Live Market & Currency Quote preview API
  app.get("/api/market/quote", async (req, res) => {
    try {
      const asset = String(req.query.asset || "usd");
      const amount = Number(req.query.amount) || 1.0;
      const buyPrice = req.query.buyPrice ? Number(req.query.buyPrice) : undefined;
      const quote = await getMarketQuote(asset, amount, buyPrice);
      return res.json({ success: true, quote });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Featured market items list for quick exploration
  app.get("/api/market/featured", (_req, res) => {
    return res.json({ success: true, items: getFeaturedMarketList() });
  });

  // Direct chart image generation (SVG format)
  app.get("/api/market/chart/:asset", async (req, res) => {
    try {
      const asset = String(req.params.asset || "usd");
      const quote = await getMarketQuote(asset);
      if (req.query.format === "png" && quote.chart_url) {
        return res.redirect(quote.chart_url);
      }
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=60");
      return res.send(quote.chart_svg);
    } catch (err: any) {
      return res.status(400).send(`<svg><text>Error generating chart</text></svg>`);
    }
  });

  // Bot Controller Settings (Supporting both /api/bot-settings and /api/bot/settings)
  const handleGetBotSettings = (req: any, res: any) => {
    const settings = telegramManager.getBotSettings();
    return res.json({ success: true, settings, bot: settings });
  };

  const handlePostBotTest = async (req: any, res: any) => {
    try {
      const { botToken, bot_token } = req.body;
      const token = (botToken || bot_token || "").trim();
      const info = await telegramManager.testBotToken(token);
      return res.json({ success: true, ...info });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  };

  const handlePostBotSettings = async (req: any, res: any) => {
    try {
      const {
        botToken,
        bot_token,
        ownerId,
        ownerUserId,
        owner_id,
        enabled,
        apiId,
        api_id,
        apiHash,
        api_hash,
      } = req.body;

      const tokenToUse = (botToken !== undefined ? botToken : bot_token || "").trim();
      const ownerToUse = ownerId !== undefined ? ownerId : (ownerUserId !== undefined ? ownerUserId : owner_id);
      const apiIdToUse = apiId !== undefined ? apiId : api_id;
      const apiHashToUse = apiHash !== undefined ? apiHash : api_hash;
      const enabledToUse = enabled !== undefined ? Boolean(enabled) : Boolean(tokenToUse);

      const settings = await telegramManager.updateBotSettings(
        tokenToUse,
        Number(ownerToUse) || 0,
        enabledToUse,
        apiIdToUse ? Number(apiIdToUse) : undefined,
        apiHashToUse ? String(apiHashToUse).trim() : undefined
      );

      return res.json({ success: true, settings, bot: settings, message: "تنظیمات ربات با موفقیت تایید و ذخیره شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  };

  app.get("/api/bot-settings", handleGetBotSettings);
  app.get("/api/bot/settings", handleGetBotSettings);
  app.post("/api/bot/test", handlePostBotTest);
  app.post("/api/bot-test", handlePostBotTest);
  app.post("/api/bot-settings", handlePostBotSettings);
  app.post("/api/bot/settings", handlePostBotSettings);

  // Dialogs count
  app.get("/api/accounts/:phone/dialogs", async (req, res) => {
    try {
      const { phone } = req.params;
      const stats = await telegramManager.getAccountDialogsCount(phone);
      return res.json(stats);
    } catch (err: any) {
      return res.status(500).json({ total: 0, groups: 0, users: 0, channels: 0 });
    }
  });

  // Direct One-Click Deployment Bundle & Script
  app.get("/api/download-bundle", (req, res) => {
    const bundlePath = path.join(process.cwd(), "public", "project-bundle.tar.gz");
    res.download(bundlePath, "telegram-self-tabchi-v6.tar.gz");
  });

  app.get("/api/deploy.sh", (req, res) => {
    const host = (req.headers["x-forwarded-host"] as string) || req.get("host") || (process.env.APP_URL ? new URL(process.env.APP_URL).host : "localhost:3000");
    const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;

    const script = `#!/usr/bin/env bash
# ==============================================================================
# Autonomous 1-Click Installer for Telegram Self & Tabchi v6
# ==============================================================================
set -e

echo "🚀 Starting 1-Click Telegram Self & Tabchi v6 Installation..."

# 1. Update and install prerequisites
if command -v apt-get >/dev/null 2>&1; then
  apt-get update -y && apt-get install -y curl tar gzip lsof
elif command -v yum >/dev/null 2>&1; then
  yum install -y curl tar gzip lsof
elif command -v dnf >/dev/null 2>&1; then
  dnf install -y curl tar gzip lsof
fi

# 2. Check or install Node.js 20 LTS
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | sed 's/v//' | cut -d. -f1)" -lt 18 ]; then
  echo "📦 Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs || yum install -y nodejs || dnf install -y nodejs
fi
echo "✓ Node.js $(node -v) is ready."

# 3. Create destination folder and extract project
INSTALL_DIR="/root/telegram-self-tabchi-v6"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "📥 Downloading project bundle from cloud..."
curl -fsSL "${baseUrl}/api/download-bundle" -o bundle.tar.gz

echo "📦 Extracting files..."
tar -xzf bundle.tar.gz --overwrite
rm -f bundle.tar.gz

# 4. Install dependencies and PM2
echo "⚙️ Installing dependencies..."
npm install --no-audit --prefer-offline 2>/dev/null || npm install

if ! command -v pm2 >/dev/null 2>&1; then
  echo "⚡ Installing PM2 24/7 process manager..."
  npm install -g pm2
fi

# 5. Build and launch daemon
echo "🔨 Building production assets..."
npm run build

echo "🚀 Starting 24/7 Background Daemon..."
chmod +x start.sh stop.sh status.sh
./start.sh

# 6. Setup auto-start on reboot
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || pm2 startup >/dev/null 2>&1 || true
pm2 save >/dev/null 2>&1 || true

SERVER_IP=$(curl -s --max-time 3 https://api.ipify.org 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")

echo ""
echo "======================================================================"
echo "🎉 INSTALLATION COMPLETED SUCCESSFULLY!"
echo "======================================================================"
echo "🌐 Web Dashboard:        http://$SERVER_IP:3000"
echo "🔑 Login Password:       selfsamkaren12"
echo "🛡️ 24/7 Daemon:          ACTIVE (Runs even if you exit SSH)"
echo "📜 View live logs:       pm2 logs telegram-self-tabchi-v6"
echo "📊 Check status:         pm2 status"
echo "======================================================================"
`;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(script);
  });

  // Live Logs
  app.get("/api/logs", (req, res) => {
    const logs = telegramManager.getLogs();
    res.json({ logs });
  });

  app.post("/api/logs/clear", (req, res) => {
    telegramManager.clearLogs();
    res.json({ success: true });
  });

  // ==========================================
  // VITE MIDDLEWARE SETUP
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Telegram Automation Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal server error:", err);
  process.exit(1);
});
