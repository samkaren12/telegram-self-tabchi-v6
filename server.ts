import express from "express";
import path from "path";
import os from "os";
import { createServer as createViteServer } from "vite";
import {
  telegramManager,
  DEFAULT_API_ID,
  DEFAULT_API_HASH,
  getMarketQuote,
} from "./server/telegramManager.js";

const startTime = Date.now();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
      const { active, messages, delaySeconds } = req.body;
      const result = telegramManager.updateAutoReplyConfig(
        phone,
        Boolean(active),
        Array.isArray(messages) ? messages : [],
        Number(delaySeconds) || 1
      );
      return res.json({ success: true, auto_reply: result });
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

  // Bot Controller Settings
  app.get("/api/bot-settings", (req, res) => {
    const settings = telegramManager.getBotSettings();
    return res.json({ success: true, settings });
  });

  app.post("/api/bot-settings", (req, res) => {
    try {
      const { botToken, ownerId, enabled } = req.body;
      const settings = telegramManager.updateBotSettings(
        botToken || "",
        Number(ownerId) || 0,
        Boolean(enabled)
      );
      return res.json({ success: true, settings });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  });

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
