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
import { storeBotManager } from "./server/storeBotManager.js";
import { supportBotManager } from "./server/supportBotManager.js";
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
import { backupService } from "./server/backupService.js";
import { auditLogger } from "./server/auditLogger.js";
import { exec } from "child_process";

const startTime = Date.now();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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

  // Audit Logger Middleware: Intercepts all web commands triggered across accounts for auditing & troubleshooting
  app.use((req, res, next) => {
    if (req.method === "GET" || req.method === "OPTIONS" || req.method === "HEAD") {
      return next();
    }
    if (!req.path.startsWith("/api/")) {
      return next();
    }
    if (req.path.includes("/audit-logs") || req.path.includes("/status")) {
      return next();
    }

    const start = Date.now();
    const originalJson = res.json;
    let responseBody: any = null;

    res.json = function (body: any) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    res.on("finish", () => {
      try {
        const durationMs = Date.now() - start;
        const statusCode = res.statusCode;
        const isSuccess = statusCode >= 200 && statusCode < 400 && responseBody?.success !== false;
        const status = isSuccess ? "success" : "failed";

        // Extract Account Phone
        const phone =
          req.params?.phone ||
          req.body?.phone ||
          (req.path.match(/\/api\/accounts\/([^\/]+)/)?.[1]
            ? decodeURIComponent(req.path.match(/\/api\/accounts\/([^\/]+)/)![1])
            : undefined) ||
          "SYSTEM";

        const account = phone && phone !== "SYSTEM" ? telegramManager.getAccount(phone) : null;
        const accountName = account ? `${account.firstName || ""} ${account.lastName || ""}`.trim() : undefined;

        // Classify Action & Category
        let category: any = "system";
        let action = "COMMAND_TRIGGERED";
        let actionLabel = `اجرای دستور در مسیر ${req.path}`;

        if (req.path.includes("/features")) {
          category = "features";
          action = "UPDATE_ACCOUNT_FEATURES";
          actionLabel = "ویرایش تنظیمات و قابلیت‌های اکانت (Features)";
        } else if (req.path.includes("/disconnect")) {
          category = "auth";
          action = "DISCONNECT_ACCOUNT";
          actionLabel = "قطع اتصال حساب کاربری (Disconnect)";
        } else if (req.path.includes("/reconnect")) {
          category = "auth";
          action = "RECONNECT_ACCOUNT";
          actionLabel = "اتصال مجدد حساب کاربری (Reconnect)";
        } else if (req.path.includes("/subscription")) {
          category = "subscription";
          action = "UPDATE_SUBSCRIPTION";
          actionLabel = "تغییر و تمدید دوره اشتراک اکانت";
        } else if (req.path.includes("/tabchi/start")) {
          category = "tabchi";
          action = "START_TABCHI";
          actionLabel = "راه‌اندازی فرآیند ارسال خودکار تبچی";
        } else if (req.path.includes("/tabchi/stop")) {
          category = "tabchi";
          action = "STOP_TABCHI";
          actionLabel = "توقف فرآیند ارسال تبچی";
        } else if (req.path.includes("/batch-create/stop")) {
          category = "batch";
          action = "STOP_BATCH_CREATE";
          actionLabel = "توقف ساخت گروه و کانال انبوه";
        } else if (req.path.includes("/batch-create")) {
          category = "batch";
          action = "START_BATCH_CREATE";
          actionLabel = "آغاز ساخت خودکار گروه و کانال انبوه";
        } else if (req.path.includes("/batch-broadcast")) {
          category = "batch";
          action = "BATCH_BROADCAST";
          actionLabel = "ارسال همگانی به کانال‌ها و گروه‌ها (Broadcast)";
        } else if (req.path.includes("/send-message")) {
          category = "features";
          action = "SEND_DIRECT_MESSAGE";
          actionLabel = "ارسال پیام تلگرامی مستقیم";
        } else if (req.path.includes("/pm-broadcast")) {
          category = "features";
          action = "PM_BROADCAST";
          actionLabel = "ارسال پیام همگانی به چت‌های خصوصی (PV)";
        } else if (req.path.includes("/clock/sync")) {
          category = "features";
          action = "SYNC_PROFILE_CLOCK";
          actionLabel = "همگام‌سازی ساعت زنده پروفایل";
        } else if (req.path.includes("/auth/send-code")) {
          category = "auth";
          action = "AUTH_SEND_CODE";
          actionLabel = "درخواست کد تایید تلگرام برای شماره جدید";
        } else if (req.path.includes("/auth/sign-in")) {
          category = "auth";
          action = "AUTH_SIGN_IN";
          actionLabel = "تایید کد ورود و ثبت‌نام اکانت";
        } else if (req.path.includes("/bot/")) {
          category = "bot";
          action = "BOT_SETTINGS_UPDATE";
          actionLabel = "به‌روزرسانی تنظیمات ربات اختصاصی";
        } else if (req.path.includes("/credentials")) {
          category = "security";
          action = "UPDATE_CREDENTIALS";
          actionLabel = "ویرایش مشخصات ورود به پنل کاربری";
        }

        const errorMessage = !isSuccess ? responseBody?.message || `خطای سرور با کد ${statusCode}` : undefined;

        auditLogger.logAudit({
          accountPhone: phone,
          accountName,
          action,
          actionLabel,
          category,
          status,
          statusCode,
          durationMs,
          details: {
            method: req.method,
            path: req.path,
            bodySummary: typeof req.body === "object" ? Object.keys(req.body).slice(0, 6) : undefined,
          },
          errorMessage,
          ip: (req.headers["x-forwarded-for"] as string) || req.socket?.remoteAddress || "127.0.0.1",
          source: "web_interface",
        });
      } catch (_) {}
    });

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

  // Initialize Auto-Backup scheduled daemon
  backupService.initScheduler(telegramManager);

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

  // ==========================================
  // STORE BOT ADMIN CREDENTIALS & LOGIN APIS
  // ==========================================
  app.get("/api/store-bot/admin-credentials", (req, res) => {
    try {
      const credentials = storeBotManager.getAdminCredentials();
      return res.json({ success: true, credentials });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/store-bot/admin-credentials", (req, res) => {
    try {
      const { newUsername, newPassword, currentPassword } = req.body || {};
      const current = storeBotManager.getAdminCredentials();
      if (currentPassword && !storeBotManager.verifyAdminCredentials(current.username, currentPassword)) {
        return res.status(401).json({ success: false, message: "رمز عبور فعلی ادمین فروشگاه اشتباه است." });
      }
      if (!newPassword || newPassword.length < 4) {
        return res.status(400).json({ success: false, message: "رمز عبور جدید باید حداقل ۴ کاراکتر باشد." });
      }
      const result = storeBotManager.updateAdminCredentials(newUsername, newPassword);
      return res.json({
        success: true,
        credentials: result,
        message: "نام کاربری و رمز عبور اختصاصی پنل مدیریت ربات با موفقیت ذخیره شد.",
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/store-bot/admin-login", (req, res) => {
    try {
      const { username, password } = req.body || {};
      if (!storeBotManager.verifyAdminCredentials(username, password)) {
        return res.status(401).json({ success: false, message: "نام کاربری یا رمز عبور پنل فروشگاه نامعتبر است." });
      }
      return res.json({
        success: true,
        message: "ورود به پنل اختصاصی مدیریت ربات فروشگاه با موفقیت انجام شد.",
        session: { role: "owner", username, portal: "store" },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // STORE BOT (فروشگاه اشتراک و سلف/تبچی - مخصوص مالک)
  // ==========================================

  // Get all store data (Settings, Plans, Payments, Orders, Coupons, Customers, Stats)
  app.get("/api/store-bot/data", (req, res) => {
    try {
      const data = storeBotManager.getData();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Update store bot settings (Token, owner id, support username, keyboardMode, theme, welcome text, labels)
  app.put("/api/store-bot/settings", async (req, res) => {
    try {
      const settings = await storeBotManager.updateSettings(req.body);
      return res.json({ success: true, settings, message: "تنظیمات ربات فروشگاه با موفقیت بروزرسانی شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Test Store Bot Token
  app.post("/api/store-bot/test-token", async (req, res) => {
    try {
      const { token } = req.body;
      const result = await storeBotManager.testBotToken(token);
      return res.json({ success: result.valid, ...result });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Toggle Live Polling Service
  app.post("/api/store-bot/toggle-service", (req, res) => {
    try {
      const { enabled } = req.body;
      if (enabled) {
        storeBotManager.startPolling();
      } else {
        storeBotManager.stopPolling();
      }
      const data = storeBotManager.getData();
      return res.json({ success: true, status: data.settings.status, message: enabled ? "سرویس ربات فروشگاه روشن شد." : "سرویس ربات فروشگاه متوقف شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Plans CRUD
  app.post("/api/store-bot/plans", (req, res) => {
    try {
      const plan = storeBotManager.addPlan(req.body);
      return res.json({ success: true, plan, message: "پلن جدید با موفقیت اضافه شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  app.put("/api/store-bot/plans/:id", (req, res) => {
    try {
      const plan = storeBotManager.updatePlan(req.params.id, req.body);
      return res.json({ success: true, plan, message: "پلن با موفقیت ویرایش شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  app.delete("/api/store-bot/plans/:id", (req, res) => {
    try {
      storeBotManager.deletePlan(req.params.id);
      return res.json({ success: true, message: "پلن با موفقیت حذف گردید." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Toggle Plan Active / Disabled status
  app.patch("/api/store-bot/plans/:id/toggle", (req, res) => {
    try {
      const plan = storeBotManager.togglePlanActive(req.params.id);
      return res.json({
        success: true,
        plan,
        message: plan.isActive ? "پلن در ربات فعال شد." : "پلن از ربات پنهان شد.",
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Batch Update Pricing / Exchange rate
  app.post("/api/store-bot/plans/batch-pricing", (req, res) => {
    try {
      const { multiplier, usdRate } = req.body;
      const plans = storeBotManager.batchUpdatePricing({ multiplier, usdRate });
      return res.json({ success: true, plans, message: "تعرفه‌ها با موفقیت بروزرسانی شدند." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Payment Settings
  app.put("/api/store-bot/payments", (req, res) => {
    try {
      const payments = storeBotManager.updatePaymentSettings(req.body);
      return res.json({ success: true, payments, message: "تنظیمات درگاه‌های پرداخت با موفقیت ذخیره شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Bank Cards Management
  app.post("/api/store-bot/payments/cards", (req, res) => {
    try {
      const card = storeBotManager.addPaymentCard(req.body);
      return res.json({ success: true, card, message: "حساب بانکی جدید با موفقیت اضافه شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  app.put("/api/store-bot/payments/cards/:id", (req, res) => {
    try {
      const card = storeBotManager.updatePaymentCard(req.params.id, req.body);
      return res.json({ success: true, card, message: "اطلاعات حساب بانکی بروزرسانی شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  app.delete("/api/store-bot/payments/cards/:id", (req, res) => {
    try {
      storeBotManager.deletePaymentCard(req.params.id);
      return res.json({ success: true, message: "حساب بانکی با موفقیت حذف گردید." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  app.patch("/api/store-bot/payments/cards/:id/toggle", (req, res) => {
    try {
      const card = storeBotManager.togglePaymentCard(req.params.id);
      return res.json({ success: true, card, message: card.isActive ? "حساب فعال شد." : "حساب غیرفعال شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Crypto Networks Management
  app.post("/api/store-bot/payments/crypto", (req, res) => {
    try {
      const net = storeBotManager.addCryptoNetwork(req.body);
      return res.json({ success: true, network: net, message: "ارز / شبکه دیجیتال جدید با موفقیت اضافه شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  app.put("/api/store-bot/payments/crypto/:id", (req, res) => {
    try {
      const net = storeBotManager.updateCryptoNetwork(req.params.id, req.body);
      return res.json({ success: true, network: net, message: "اطلاعات والت کریپتو بروزرسانی شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  app.delete("/api/store-bot/payments/crypto/:id", (req, res) => {
    try {
      storeBotManager.deleteCryptoNetwork(req.params.id);
      return res.json({ success: true, message: "ارز دیجیتال با موفقیت حذف گردید." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  app.patch("/api/store-bot/payments/crypto/:id/toggle", (req, res) => {
    try {
      const net = storeBotManager.toggleCryptoNetwork(req.params.id);
      return res.json({ success: true, network: net, message: net.isActive ? "ارز فعال شد." : "ارز غیرفعال شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Orders: Approve with auto-generated credentials / license
  app.post("/api/store-bot/orders/:id/approve", async (req, res) => {
    try {
      const { credentials } = req.body;
      const order = await storeBotManager.approveOrder(req.params.id, credentials);
      return res.json({ success: true, order, message: "سفارش با موفقیت تأیید شد و اعلان آنی به مشتری ارسال گردید." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Orders: Reject with reason
  app.post("/api/store-bot/orders/:id/reject", async (req, res) => {
    try {
      const { reason } = req.body;
      const order = await storeBotManager.rejectOrder(req.params.id, reason);
      return res.json({ success: true, order, message: "سفارش با موفقیت رد شد و علت آن به کاربر اعلام شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Coupons
  app.post("/api/store-bot/coupons", (req, res) => {
    try {
      const coupon = storeBotManager.addCoupon(req.body);
      return res.json({ success: true, coupon, message: "کد تخفیف با موفقیت ایجاد شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  app.delete("/api/store-bot/coupons/:id", (req, res) => {
    try {
      storeBotManager.deleteCoupon(req.params.id);
      return res.json({ success: true, message: "کد تخفیف با موفقیت حذف شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Broadcast to all Store Bot users
  app.post("/api/store-bot/broadcast", async (req, res) => {
    try {
      const { message, buttonTitle, buttonUrl } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: "متن پیام الزامی است." });
      }
      const result = await storeBotManager.broadcastToBotUsers(message, buttonTitle, buttonUrl);
      return res.json({
        success: true,
        sent: result.sent,
        failed: result.failed,
        message: `پیام همگانی به ${result.sent} کاربر با موفقیت ارسال شد.`,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Store Customers: Bulk Extend Subscriptions
  app.post("/api/store-bot/customers/bulk-extend", async (req, res) => {
    try {
      const { userIds, durationDays, planTitle, notifyTelegram } = req.body;
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ success: false, message: "لطفاً حداقل یک مشتری را برای تمدید انتخاب کنید." });
      }
      if (typeof durationDays !== "number" || isNaN(durationDays) || durationDays < 0) {
        return res.status(400).json({ success: false, message: "مدت زمان تمدید نامعتبر است." });
      }
      const result = await storeBotManager.bulkExtendSubscriptions({
        userIds,
        durationDays,
        planTitle,
        notifyTelegram: notifyTelegram !== false,
      });
      return res.json({
        success: true,
        ...result,
        customers: storeBotManager.getData().customers,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Store Customers: Update Single Customer
  app.put("/api/store-bot/customers/:userId", (req, res) => {
    try {
      const customer = storeBotManager.updateCustomer(req.params.userId, req.body);
      return res.json({ success: true, customer, message: "اطلاعات مشتری و اشتراک با موفقیت بروزرسانی شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Store Customers: Get Detailed Transaction History (Purchases, Payments, Extensions)
  app.get("/api/store-bot/customers/:userId/transactions", (req, res) => {
    try {
      const data = storeBotManager.getCustomerTransactions(req.params.userId);
      return res.json({ success: true, ...data });
    } catch (err: any) {
      return res.status(404).json({ success: false, message: err.message });
    }
  });

  // Store Customers: Add Customer Manually
  app.post("/api/store-bot/customers", (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ success: false, message: "شناسه تلگرام مشتری الزامی است." });
      const customer = storeBotManager.addCustomer(req.body);
      return res.json({ success: true, customer, message: "مشتری جدید با موفقیت ثبت شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Store Customers: Delete Customer
  app.delete("/api/store-bot/customers/:userId", (req, res) => {
    try {
      storeBotManager.deleteCustomer(req.params.userId);
      return res.json({ success: true, message: "مشتری با موفقیت از لیست حذف گردید." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // SUPPORT BOT & TICKETING API ROUTES
  // ==========================================

  // Get full support bot data (settings, tickets, faqs)
  app.get("/api/support-bot/data", (_req, res) => {
    try {
      const data = supportBotManager.getData();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Update support bot settings
  app.put("/api/support-bot/settings", (req, res) => {
    try {
      const updated = supportBotManager.updateSettings(req.body);
      return res.json({ success: true, settings: updated, message: "تنظیمات ربات پشتیبانی با موفقیت ذخیره شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Reply to a support ticket from Web Panel
  app.post("/api/support-bot/tickets/:ticketId/reply", async (req, res) => {
    try {
      const { replyText, adminName } = req.body;
      if (!replyText || !replyText.trim()) {
        return res.status(400).json({ success: false, message: "متن پاسخ الزامی است." });
      }
      const ticket = await supportBotManager.replyToTicket(req.params.ticketId, replyText, adminName);
      return res.json({ success: true, ticket, message: "پاسخ به تیکت ثبت و برای کاربر ارسال گردید." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Update ticket status
  app.put("/api/support-bot/tickets/:ticketId/status", (req, res) => {
    try {
      const { status } = req.body;
      const ticket = supportBotManager.updateTicketStatus(req.params.ticketId, status);
      return res.json({ success: true, ticket, message: "وضعیت تیکت بروزرسانی شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Update ticket priority
  app.put("/api/support-bot/tickets/:ticketId/priority", (req, res) => {
    try {
      const { priority } = req.body;
      const ticket = supportBotManager.updateTicketPriority(req.params.ticketId, priority);
      return res.json({ success: true, ticket });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Delete ticket
  app.delete("/api/support-bot/tickets/:ticketId", (req, res) => {
    try {
      supportBotManager.deleteTicket(req.params.ticketId);
      return res.json({ success: true, message: "تیکت حذف شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Add FAQ
  app.post("/api/support-bot/faqs", (req, res) => {
    try {
      const faq = supportBotManager.addFaq(req.body);
      return res.json({ success: true, faq, message: "سوال متداول افزوده شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Update FAQ
  app.put("/api/support-bot/faqs/:id", (req, res) => {
    try {
      const faq = supportBotManager.updateFaq(req.params.id, req.body);
      return res.json({ success: true, faq, message: "سوال بروزرسانی شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Delete FAQ
  app.delete("/api/support-bot/faqs/:id", (req, res) => {
    try {
      supportBotManager.deleteFaq(req.params.id);
      return res.json({ success: true, message: "سوال حذف گردید." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // DASHBOARD ANALYTICS & ACTIVITY STATS API
  // ==========================================

  app.get("/api/dashboard/analytics", (_req, res) => {
    try {
      const data = telegramManager.getActivityDashboardData();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // BATCH CHANNEL & GROUP CREATOR API ROUTES
  // ==========================================

  // Start Batch Creation
  app.post("/api/accounts/:phone/batch-create", async (req, res) => {
    try {
      const task = await telegramManager.startBatchCreation(req.params.phone, req.body);
      return res.json({ success: true, task, sessionId: task.sessionId, message: "فرآیند ساخت خودکار آغاز شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Stop Batch Creation
  app.post("/api/accounts/:phone/batch-create/stop", (req, res) => {
    try {
      const task = telegramManager.stopBatchCreation(req.params.phone);
      return res.json({ success: true, task, message: "فرآیند ساخت متوقف گردید." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Get current batch creation task status
  app.get("/api/accounts/:phone/batch-create", (req, res) => {
    try {
      const task = telegramManager.getBatchCreationTask(req.params.phone);
      return res.json({ success: true, task });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Track task by Session ID (Live progress & status tracking)
  app.get("/api/batch-tasks/sessions/:sessionId", (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const result = telegramManager.getBatchTaskBySession(sessionId);
      if (!result) {
        return res.status(404).json({ success: false, message: "نشستی با این شناسه یافت نشد." });
      }
      return res.json({
        success: true,
        sessionId: result.sessionId,
        type: result.type,
        progressPercent: result.progressPercent,
        status: result.status,
        task: result.task,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // List all recent batch sessions (for session history & switching)
  app.get("/api/batch-tasks/sessions", (req, res) => {
    try {
      const phone = typeof req.query.phone === "string" ? req.query.phone : undefined;
      const sessions = telegramManager.getAllBatchSessions(phone);
      return res.json({ success: true, sessions });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Start Batch Group/Channel Broadcast
  app.post("/api/accounts/:phone/batch-broadcast", async (req, res) => {
    try {
      const task = await telegramManager.startBatchBroadcast(req.params.phone, req.body);
      return res.json({
        success: true,
        task,
        sessionId: task.sessionId,
        message: "فرآیند برودکست به گروه‌ها و کانال‌ها آغاز شد.",
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Stop Batch Group/Channel Broadcast
  app.post("/api/accounts/:phone/batch-broadcast/stop", (req, res) => {
    try {
      const sessionId = typeof req.body.sessionId === "string" ? req.body.sessionId : undefined;
      const task = telegramManager.stopBatchBroadcast(req.params.phone, sessionId);
      return res.json({ success: true, task, message: "فرآیند برودکست متوقف شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Get current batch broadcast status for account
  app.get("/api/accounts/:phone/batch-broadcast", (req, res) => {
    try {
      const task = telegramManager.getBatchBroadcastTask(req.params.phone);
      return res.json({ success: true, task });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
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

  // Self Module: Lock PV (قفل کردن پیوی و دایرکت)
  app.post("/api/accounts/:phone/lock-pv", (req, res) => {
    try {
      const { phone } = req.params;
      const { active, warningMessage, autoBlock, autoDelete, allowedUserIds } = req.body;
      const result = telegramManager.updateLockPvConfig(
        phone,
        Boolean(active),
        warningMessage,
        Boolean(autoBlock),
        autoDelete !== undefined ? Boolean(autoDelete) : true,
        Array.isArray(allowedUserIds) ? allowedUserIds : []
      );
      return res.json({ success: true, lock_pv: result, message: "تنظیمات قفل پیوی ذخیره شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Self Module: Automatic Media Saver (ذخیره‌ساز عکس، ویدیو، ویس و عکس تایم‌دار)
  app.post("/api/accounts/:phone/media-saver", (req, res) => {
    try {
      const { phone } = req.params;
      const {
        active,
        savePhotos,
        saveVideos,
        saveVoice,
        saveSelfDestruct,
        forwardTo,
        targetChannelId,
        captionSenderInfo,
      } = req.body;

      const result = telegramManager.updateMediaSaverConfig(
        phone,
        Boolean(active),
        savePhotos !== undefined ? Boolean(savePhotos) : true,
        saveVideos !== undefined ? Boolean(saveVideos) : true,
        saveVoice !== undefined ? Boolean(saveVoice) : true,
        saveSelfDestruct !== undefined ? Boolean(saveSelfDestruct) : true,
        forwardTo || "saved_messages",
        targetChannelId,
        captionSenderInfo !== undefined ? Boolean(captionSenderInfo) : true
      );
      return res.json({ success: true, media_saver: result, message: "تنظیمات ذخیره‌ساز رسانه ذخیره شد." });
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

  // Self Module: Smart Filters (Regex Rules, Delays, Ignore List)
  app.post("/api/accounts/:phone/smart-filters", (req, res) => {
    try {
      const { phone } = req.params;
      const { smart_filters } = req.body;
      const result = telegramManager.updateSmartFiltersConfig(phone, smart_filters);
      return res.json({ success: true, smart_filters: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // Smart Filters Simulator / Test Endpoint
  app.post("/api/smart-filters/test", (req, res) => {
    try {
      const { pattern, flags, testText, ignoreList, senderId } = req.body;
      // Check ignore list first
      if (Array.isArray(ignoreList) && senderId) {
        const cleanSender = String(senderId).trim().toLowerCase().replace(/^@/, "");
        const isIgnored = ignoreList.some((item: string) => {
          const cl = item.trim().toLowerCase().replace(/^@/, "");
          return cl && (cleanSender.includes(cl) || cl === cleanSender);
        });
        if (isIgnored) {
          return res.json({
            success: true,
            matched: false,
            ignored: true,
            reason: `شناسه فرستنده '${senderId}' در لیست سیاه نادیده‌گرفته‌شده‌ها (Ignore-List) قرار دارد.`,
          });
        }
      }

      if (!pattern || !pattern.trim()) {
        return res.status(400).json({ success: false, message: "الگوی رِجکس خالی است" });
      }

      const regex = new RegExp(pattern, flags || "i");
      const matched = regex.test(testText || "");
      const matches = matched ? (testText.match(regex) || []) : [];
      return res.json({
        success: true,
        matched,
        matches: Array.from(matches),
        message: matched ? "الگو با موفقیت تطبیق یافت ✅" : "الگو تطبیق نیافت ⛔",
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: `خطای سینتکس در الگوی رِجکس: ${err.message}`,
      });
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

  // Share crypto technical analysis snippet / image via Telegram Bot
  app.post("/api/analytics/crypto/share", async (req, res) => {
    try {
      const { symbol, textSnippet, photoDataUrl, chatId } = req.body;
      if (!symbol || !textSnippet) {
        return res.status(400).json({ success: false, message: "نماد ارز و متن تحلیل الزامی است." });
      }
      const result = await telegramManager.shareCryptoAnalysisViaBot({
        symbol,
        textSnippet,
        photoDataUrl,
        chatId,
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // AUDIT LOG DASHBOARD API ENDPOINTS
  // ==========================================

  // Get filtered Audit Logs with summary metrics & pagination
  app.get("/api/audit-logs", (req, res) => {
    try {
      const phone = typeof req.query.phone === "string" ? req.query.phone : undefined;
      const category = typeof req.query.category === "string" ? req.query.category : undefined;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const limit = Number(req.query.limit) || 50;
      const page = Number(req.query.page) || 1;

      const result = auditLogger.getLogs({ phone, category, status, search, limit, page });
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Clear Audit Logs
  app.post("/api/audit-logs/clear", (req, res) => {
    try {
      auditLogger.clearLogs();
      return res.json({ success: true, message: "تمامی لاگ‌های بازرسی با موفقیت پاکسازی شدند." });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Trigger a diagnostic / simulated audit event for testing
  app.post("/api/audit-logs/simulate", (req, res) => {
    try {
      const { type, phone } = req.body;
      const targetPhone = phone || "+989123456789";
      let entry;

      if (type === "error") {
        entry = auditLogger.logAudit({
          accountPhone: targetPhone,
          accountName: "اکانت آزمایشی",
          action: "DIAGNOSTIC_SIMULATED_ERROR",
          actionLabel: "شبیه‌سازی خطای اتصال به تلگرام (FLOOD_WAIT Diagnostic)",
          category: "tabchi",
          status: "failed",
          statusCode: 429,
          durationMs: 820,
          errorMessage: "FLOOD_WAIT_30: Too Many Requests from Telegram Server",
          details: { simulated: true, trigger: "admin_diagnostic" },
        });
      } else {
        entry = auditLogger.logAudit({
          accountPhone: targetPhone,
          accountName: "اکانت آزمایشی",
          action: "DIAGNOSTIC_VERIFICATION",
          actionLabel: "تست سلامت و اعتبارسنجی سرور بازرسی (Audit Health Check)",
          category: "system",
          status: "success",
          statusCode: 200,
          durationMs: 45,
          details: { simulated: true, trigger: "admin_diagnostic" },
        });
      }

      return res.json({ success: true, message: "رویداد تستی با موفقیت در سیستم ثبت گردید.", entry });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
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
        buttonLayout,
        button_layout,
      } = req.body;

      const tokenToUse = (botToken !== undefined ? botToken : bot_token || "").trim();
      const ownerToUse = ownerId !== undefined ? ownerId : (ownerUserId !== undefined ? ownerUserId : owner_id);
      const apiIdToUse = apiId !== undefined ? apiId : api_id;
      const apiHashToUse = apiHash !== undefined ? apiHash : api_hash;
      const enabledToUse = enabled !== undefined ? Boolean(enabled) : Boolean(tokenToUse);
      const layoutToUse = (buttonLayout || button_layout || "3-cols") as "3-cols" | "2-cols" | "1-col";

      const settings = await telegramManager.updateBotSettings(
        tokenToUse,
        Number(ownerToUse) || 0,
        enabledToUse,
        apiIdToUse ? Number(apiIdToUse) : undefined,
        apiHashToUse ? String(apiHashToUse).trim() : undefined,
        layoutToUse
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

# 7. Register sudo selfandtabchi global terminal command
if [ -f "$INSTALL_DIR/scripts/selfandtabchi.sh" ]; then
  chmod +x "$INSTALL_DIR/scripts/selfandtabchi.sh"
  mkdir -p /usr/local/bin /usr/bin 2>/dev/null || true
  ln -sf "$INSTALL_DIR/scripts/selfandtabchi.sh" /usr/local/bin/selfandtabchi 2>/dev/null || true
  ln -sf "$INSTALL_DIR/scripts/selfandtabchi.sh" /usr/bin/selfandtabchi 2>/dev/null || true
fi

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
echo ""
echo "🚀 TERMINAL ASSISTANT CLI:"
echo "   You can now run:      sudo selfandtabchi"
echo "   Features: Update, Uninstall, Change Domain, Issue SSL, View Logs"
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
      const { customIp, customDomain } = req.body || {};
      const status = await generateServerIpSsl(customIp, customDomain);
      // Try to attach HTTPS server if not already running
      attachHttpsServer(app, status.httpsPort || 3443);
      return res.json({
        success: true,
        ssl: status,
        message: `گواهی SSL امنیتی برای ${status.domain || status.serverIp} با موفقیت صادر و فعال شد.`,
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
  // AUTO-BACKUP & ENCRYPTED EXPORT/RESTORE APIS
  // ==========================================
  app.get("/api/backup/config", (_req, res) => {
    try {
      const cfg = backupService.getConfig();
      const backups = backupService.listBackups();
      return res.json({ success: true, config: cfg, totalStored: backups.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/backup/config", (req, res) => {
    try {
      const updated = backupService.updateConfig(req.body);
      return res.json({ success: true, config: updated, message: "تنظیمات بکاپ خودکار ذخیره شد." });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post("/api/backup/export", async (req, res) => {
    try {
      const { passphrase, download } = req.body || {};
      const result = await backupService.createBackup(telegramManager, passphrase, true);
      if (download) {
        res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        return res.send(result.fileContent);
      }
      return res.json({
        success: true,
        info: result.info,
        filename: result.filename,
        fileContent: result.fileContent,
        message: "فایل پشتیبان رمزنگاری‌شده با موفقیت ایجاد شد.",
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/backup/list", (_req, res) => {
    try {
      const list = backupService.listBackups();
      return res.json({ success: true, backups: list });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/backup/download/:filename", (req, res) => {
    try {
      const filepath = backupService.getBackupFilePath(req.params.filename);
      if (!filepath) {
        return res.status(404).json({ success: false, message: "فایل بکاپ یافت نشد." });
      }
      res.setHeader("Content-Disposition", `attachment; filename="${path.basename(filepath)}"`);
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.sendFile(filepath);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete("/api/backup/:filename", (req, res) => {
    try {
      const ok = backupService.deleteBackup(req.params.filename);
      if (!ok) return res.status(404).json({ success: false, message: "فایل بکاپ یافت نشد." });
      return res.json({ success: true, message: "فایل بکاپ با موفقیت حذف شد." });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/backup/restore", (req, res) => {
    try {
      const { backupData, passphrase } = req.body || {};
      if (!backupData) {
        return res.status(400).json({ success: false, message: "داده‌های فایل بکاپ ارسال نشده است." });
      }
      const envelope = typeof backupData === "string" ? JSON.parse(backupData) : backupData;
      const result = backupService.restoreBackup(envelope, passphrase, telegramManager);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
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
