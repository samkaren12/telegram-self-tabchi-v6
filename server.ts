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
import {
  getSslConfig,
  generateServerIpSsl,
  performAutoRenewCheck,
  startSslAutoRenewDaemon,
  stopSslAutoRenewDaemon,
  updateSslConfigSettings,
  attachHttpsServer,
  getPublicServerIp,
} from "./server/sslManager.js";
import { exec } from "child_process";

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

      const isOwnerAttempt =
        role === "owner" ||
        (!role && (cleanUser === "samkaren12" || telegramManager.verifyOwnerCredentials(cleanUser, cleanPass)));

      if (isOwnerAttempt) {
        if (telegramManager.verifyOwnerCredentials(cleanUser, cleanPass)) {
          const ownerInfo = telegramManager.getOwnerCredentials();
          return res.json({
            success: true,
            session: {
              role: "owner",
              username: ownerInfo.username,
              token: crypto.randomUUID(),
            },
          });
        }
        return res.status(401).json({
          success: false,
          message: "نام کاربری یا رمز عبور مالک نادرست است.",
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

  // Owner Credentials APIs (GET current username & PUT to change username/password)
  app.get("/api/auth/owner-credentials", (req, res) => {
    const creds = telegramManager.getOwnerCredentials();
    res.json({ success: true, credentials: creds });
  });

  app.put("/api/auth/owner-credentials", (req, res) => {
    try {
      const { currentPassword, newUsername, newPassword } = req.body;

      if (!currentPassword || !telegramManager.verifyOwnerPassword(currentPassword)) {
        return res.status(403).json({
          success: false,
          message: "رمز عبور فعلی مالک نادرست است. جهت تغییر مشخصات باید رمز فعلی را صحیح وارد کنید.",
        });
      }

      if (newUsername && newUsername.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: "نام کاربری جدید باید حداقل ۳ کاراکتر باشد.",
        });
      }

      if (newPassword && newPassword.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: "رمز عبور جدید باید حداقل ۵ کاراکتر باشد.",
        });
      }

      const result = telegramManager.updateOwnerCredentials(newUsername, newPassword);
      return res.json({
        success: true,
        message: "مشخصات ورود مالک سرور با موفقیت بروزرسانی و ذخیره شد.",
        username: result.username,
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
  // SSL ON SERVER IP & AUTO-RENEWAL APIS
  // ==========================================
  app.get("/api/ssl/status", async (_req, res) => {
    try {
      const cfg = getSslConfig();
      const detectedIp = await getPublicServerIp();
      return res.json({ success: true, ssl: { ...cfg, detectedIp } });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/ssl/generate", async (req, res) => {
    try {
      const { customIp } = req.body || {};
      const status = await generateServerIpSsl(customIp);
      // Try to attach HTTPS server if not already running
      attachHttpsServer(app, status.httpsPort || 3443);
      return res.json({
        success: true,
        ssl: status,
        message: `گواهی SSL امنیتی برای آی‌پی ${status.serverIp} با موفقیت صادر و فعال شد.`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/ssl/renew", async (req, res) => {
    try {
      const { force } = req.body || {};
      const result = await performAutoRenewCheck(!!force);
      const cfg = getSslConfig();
      return res.json({ success: true, ...result, ssl: cfg });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/ssl/config", async (req, res) => {
    try {
      const { autoRenew, checkIntervalHours, thresholdDays } = req.body || {};
      const updated = updateSslConfigSettings({
        ...(autoRenew !== undefined ? { autoRenew: Boolean(autoRenew) } : {}),
        ...(checkIntervalHours ? { checkIntervalHours: Number(checkIntervalHours) } : {}),
        ...(thresholdDays ? { thresholdDays: Number(thresholdDays) } : {}),
      });
      return res.json({ success: true, ssl: updated, message: "تنظیمات سرویس پس‌زمینه SSL بروز شد." });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/ssl/daemon-toggle", async (req, res) => {
    try {
      const { action } = req.body || {};
      const cfg = getSslConfig();
      if (action === "start") {
        startSslAutoRenewDaemon(cfg.checkIntervalHours || 6);
      } else if (action === "stop") {
        stopSslAutoRenewDaemon();
      } else {
        // restart
        startSslAutoRenewDaemon(cfg.checkIntervalHours || 6);
      }
      const updated = getSslConfig();
      return res.json({
        success: true,
        ssl: updated,
        message: action === "stop" ? "سرویس مانیتورینگ متوقف شد." : "سرویس پس‌زمینه مانیتورینگ SSL فعال شد.",
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // SERVER SCRIPT UPDATE & SYSTEM METRICS API
  // ==========================================
  app.get("/api/system/update-check", async (_req, res) => {
    const gitAvailable = await new Promise<boolean>((resolve) => {
      exec("git --version", (err) => resolve(!err));
    });

    const isGitRepo = await new Promise<boolean>((resolve) => {
      exec("git rev-parse --is-inside-work-tree", (err) => resolve(!err));
    });

    let currentCommit = "v6.0.0-production";
    let remoteCommit = "";
    let commitsBehind = 0;
    let remoteUpdates = false;
    let changelog: Array<{ hash: string; message: string; date?: string }> = [];

    const defaultChangelog = [
      {
        hash: "v6.0.0-pro",
        message: "انتشار نسخه ۶.۰.۰ پرو: سیستم تمدید خودکار SSL بر روی آی‌پی سرور + رفع باگ ورودی مقادیر ارز و ماشین حساب",
        date: "امروز",
      },
      {
        hash: "v5.9.8",
        message: "افزودن ماژول استعلام زنده و رسمی قیمت‌های بازار جهانی، نرخ برابری تومان و تولید نمودار تصویری",
        date: "دیروز",
      },
      {
        hash: "v5.9.5",
        message: "بهینه‌سازی لینک‌های ورود مشتری بدون پسوند اضافی client و ارتقای امنیت احراز هویت",
        date: "۳ روز پیش",
      },
    ];

    if (isGitRepo) {
      try {
        currentCommit = await new Promise<string>((resolve) => {
          exec("git rev-parse --short HEAD", (_e, out) => resolve(out?.trim() || "HEAD"));
        });

        // Fetch remote if remote origin exists (timeout 5s)
        await new Promise<void>((resolve) => {
          exec("git fetch origin 2>/dev/null", { timeout: 6000 }, () => resolve());
        });

        // Check if behind
        const statusOutput = await new Promise<string>((resolve) => {
          exec("git rev-list --count HEAD..@{u} 2>/dev/null", { timeout: 3000 }, (_e, out) => resolve(out?.trim() || "0"));
        });
        commitsBehind = parseInt(statusOutput, 10) || 0;
        remoteUpdates = commitsBehind > 0;

        // Fetch recent git log
        const logOutput = await new Promise<string>((resolve) => {
          exec('git log -n 5 --pretty=format:"%h||%s||%cr" 2>/dev/null', { timeout: 3000 }, (_e, out) => resolve(out?.trim() || ""));
        });

        if (logOutput) {
          changelog = logOutput
            .split("\n")
            .filter(Boolean)
            .map((line) => {
              const [hash, message, date] = line.split("||");
              return { hash: hash || "", message: message || "", date: date || "" };
            });
        }
      } catch (_) {}
    }

    if (changelog.length === 0) {
      changelog = defaultChangelog;
    }

    const publicIp = await getPublicServerIp();

    return res.json({
      success: true,
      gitAvailable,
      isGitRepo,
      version: "6.0.0 Pro",
      currentCommit,
      remoteCommit,
      commitsBehind,
      remoteUpdates,
      changelog,
      serverIp: publicIp,
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      memoryUsage: process.memoryUsage(),
    });
  });

  app.post("/api/system/update", async (req, res) => {
    const commands = [
      "git pull --rebase 2>/dev/null || true",
      "npm install --legacy-peer-deps 2>/dev/null || true",
      "npm run build 2>/dev/null || true",
      "pm2 restart telegram-self-tabchi-v6 2>/dev/null || true",
    ].join(" && ");

    exec(commands, { timeout: 60000 }, (error, stdout, stderr) => {
      if (error) {
        return res.json({
          success: false,
          message: `فرآیند بروزرسانی با خطا مواجه شد: ${error.message}`,
          output: stdout + "\n" + stderr,
        });
      }
      return res.json({
        success: true,
        message: "اسکریپت با موفقیت به آخرین نسخه بروزرسانی شد و سرویس ری‌استارت گردید.",
        output: stdout,
      });
    });
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
    // Start background SSL auto-renewal worker
    startSslAutoRenewDaemon();
    // Try mounting HTTPS server if SSL certificate exists
    attachHttpsServer(app, 3443);
  });
}

startServer().catch((err) => {
  console.error("Fatal server error:", err);
  process.exit(1);
});
