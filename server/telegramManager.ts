process.env.TZ = "Asia/Tehran";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
// @ts-ignore
import { computeCheck } from "telegram/Password.js";
import {
  TelegramAccount,
  TelegramAccountFeatures,
  LogEntry,
  BotSettings,
  MarketQuote,
} from "../src/types.js";
import { transformFont } from "../src/utils/fontStyler.js";
import {
  formatTehranTime,
  getTehranTimeParts,
} from "../src/utils/tehranTime.js";

const DATA_DIR = path.join(process.cwd(), "data");
const STATE_FILE = path.join(DATA_DIR, "state.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const DEFAULT_API_ID = Number(process.env.TELEGRAM_API_ID || 2496);
export const DEFAULT_API_HASH =
  process.env.TELEGRAM_API_HASH || "8da85b0d5bfe62527e5b244c209159c3";

export function defaultFeatures(): TelegramAccountFeatures {
  return {
    self_access: {
      enabled: true,
      expires_at: null,
    },
    tabchi_access: {
      enabled: true,
      expires_at: null,
    },
    self_time: {
      active: true,
      format: "HH:mm",
      font_style: "bold",
      original_last_name: null,
    },
    auto_reply: {
      active: false,
      messages: [
        "درود! در حال حاضر آنلاین نیستم، در اولین فرصت پاسخ خواهم داد. ⚡",
        "Hello! I am currently away from keyboard and will reply soon.",
      ],
      delay_seconds: 1,
    },
    mandatory_join: {
      active: false,
      channels: [],
    },
    broadcast: {
      active: false,
      message: "",
      interval_seconds: 20,
      max_recipients: 50,
      recipients: {},
      last_message_hash: null,
      status: "idle",
      total_sent: 0,
    },
    tools: {
      calculator_active: true,
      market_active: true,
    },
    font: {
      active: false,
      style: "bold",
      scopes: {
        self_time: true,
        manual_messages: true,
        auto_reply: true,
        mandatory_join: true,
        tabchi: true,
        remote_ui: false,
      },
    },
    tabchi: {
      active: false,
      message: "🚀 پیام تبلیغاتی و ارسال هوشمند خودکار از وب پنل تلگرام.",
      interval_seconds: 4,
      repeat_rounds: 3,
      repeat_infinite: false,
      total_sent: 0,
      total_failed: 0,
      status: "idle",
      target_mode: "all",
      targets: [],
    },
    keep_alive: true,
  };
}

interface LoginSession {
  client: TelegramClient;
  phoneNumber: string;
  phoneCodeHash: string;
  apiId: number;
  apiHash: string;
  createdAt: number;
}

interface AccountWorker {
  client: TelegramClient;
  timeTimer?: NodeJS.Timeout;
  tabchiAbortController?: AbortController;
  pmBroadcastAbortController?: AbortController;
  isBroadcasting?: boolean;
  isPmBroadcasting?: boolean;
  meId?: string;
  scriptMessageIds?: Set<string>;
}

// =============================================================
// SAFE MATH & CALCULATION ENGINE
// =============================================================

function normalizeDigits(text: string): string {
  const faDigits = "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩";
  const enDigits = "01234567890123456789";
  return text.replace(/[۰-۹٠-٩]/g, (char) => {
    const idx = faDigits.indexOf(char);
    return idx >= 0 ? enDigits[idx] : char;
  });
}

export function extractMathCalculation(text: string): string | null {
  const normalized = normalizeDigits(text).trim();
  if (!normalized) return null;
  const lower = normalized.toLowerCase();

  if (lower.startsWith("=")) {
    return normalized.slice(1).trim() || null;
  }
  if (lower.startsWith("calc ")) {
    return normalized.slice(5).trim() || null;
  }
  if (normalized.startsWith("حساب")) {
    return normalized.replace(/^حساب\s*:?\s*/, "").trim() || null;
  }

  const compact = normalized
    .replace(/\s+/g, "")
    .replace(/[,٬]/g, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/\^/g, "**");

  if (!/[+\-*/%]|(\*\*)/.test(compact)) {
    return null;
  }

  if (
    /^[+\-]?\d+(?:\.\d+)?(?:(?:\*\*|[+\-*/%])[+\-]?\d+(?:\.\d+)?)+$/.test(
      compact
    )
  ) {
    return compact;
  }
  return null;
}

export function evaluateMath(expression: string): number {
  const sanitized = normalizeDigits(expression)
    .replace(/\s+/g, "")
    .replace(/[,٬]/g, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/\^/g, "**");

  // Only allow digits, operators and parentheses
  if (!/^[\d+\-*/%().**]+$/.test(sanitized)) {
    throw new Error("عبارت ریاضی شامل کاراکترهای غیرمجاز است.");
  }

  // Safe recursive evaluator
  const fn = new Function(`"use strict"; return (${sanitized});`);
  const res = Number(fn());
  if (isNaN(res) || !isFinite(res)) {
    throw new Error("نتیجه محاسبه نامعتبر یا بیش از حد بزرگ است.");
  }
  return res;
}

// =============================================================
// MARKET & CRYPTO QUOTE ENGINE
// =============================================================

let cachedUsdIrrRate = 925000; // fallback IRR per USD (~92,500 Tomans)
let lastUsdIrrFetch = 0;

async function fetchUsdIrrRate(): Promise<number> {
  const now = Date.now();
  if (now - lastUsdIrrFetch < 10 * 60 * 1000 && cachedUsdIrrRate > 0) {
    return cachedUsdIrrRate;
  }

  // Try Nobitex USDT-IRT
  try {
    const res = await fetch("https://api.nobitex.ir/market/stats", {
      headers: { "User-Agent": "TelegramSelfTabchi/6.0" },
    });
    if (res.ok) {
      const data: any = await res.json();
      const usdt = data?.stats?.["USDT-IRT"] || data?.stats?.["usdt-irt"];
      const toman = Number(usdt?.latest || usdt?.bestSell || usdt?.bestBuy);
      if (toman && toman > 10000) {
        cachedUsdIrrRate = toman * 10;
        lastUsdIrrFetch = now;
        return cachedUsdIrrRate;
      }
    }
  } catch (_) {}

  // Fallback to open.er-api.com
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (res.ok) {
      const data: any = await res.json();
      const irr = Number(data?.rates?.IRR);
      if (irr && irr > 400000) {
        cachedUsdIrrRate = irr;
        lastUsdIrrFetch = now;
        return cachedUsdIrrRate;
      }
    }
  } catch (_) {}

  return cachedUsdIrrRate;
}

export async function getMarketQuote(
  rawAsset: string,
  amount: number = 1.0,
  buyPriceUsd?: number
): Promise<MarketQuote & { profitLossText?: string }> {
  const key = normalizeDigits(rawAsset).trim().toLowerCase().replace("$", "");
  const aliases: Record<string, string> = {
    دلار: "usd",
    دالر: "usd",
    usd: "usd",
    dollar: "usd",
    usdt: "usd",
    تتر: "usd",
    طلا: "gold",
    gold: "gold",
    xau: "gold",
    بیتکوین: "bitcoin",
    "بیت کوین": "bitcoin",
    btc: "bitcoin",
    اتریوم: "ethereum",
    eth: "ethereum",
    ترون: "tron",
    trx: "tron",
    sol: "solana",
    سولانا: "solana",
  };

  const assetId = aliases[key] || key;
  const irrRate = await fetchUsdIrrRate();
  let unitUsd = 1.0;
  let label = assetId.toUpperCase();

  if (assetId === "usd") {
    unitUsd = 1.0;
    label = "USD (دلار)";
  } else if (assetId === "gold") {
    unitUsd = 94.5; // fallback gram USD (~$2940/oz)
    try {
      const res = await fetch("https://api.metals.live/v1/spot/gold");
      if (res.ok) {
        const data: any = await res.json();
        const ounce = Number(Array.isArray(data) ? data[data.length - 1]?.gold : data?.gold);
        if (ounce > 1000) {
          unitUsd = ounce / 31.1034768;
        }
      }
    } catch (_) {}
    label = "Gold (گرم طلا)";
  } else {
    // Crypto via CoinGecko or fallback
    const fallbackPrices: Record<string, number> = {
      bitcoin: 65400,
      ethereum: 3450,
      tron: 0.16,
      solana: 155,
    };
    unitUsd = fallbackPrices[assetId] || 1.0;

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
          assetId
        )}&vs_currencies=usd`
      );
      if (res.ok) {
        const data: any = await res.json();
        if (data[assetId]?.usd) {
          unitUsd = Number(data[assetId].usd);
        }
      }
    } catch (_) {}
  }

  const unitIrr = unitUsd * irrRate;
  const totalUsd = unitUsd * amount;
  const totalIrr = unitIrr * amount;
  const unitToman = Math.round(unitIrr / 10);
  const totalToman = Math.round(totalIrr / 10);

  let profitLossText: string | undefined;
  if (buyPriceUsd && buyPriceUsd > 0) {
    const diff = totalUsd - buyPriceUsd;
    const sign = diff >= 0 ? "+" : "";
    profitLossText = `سود/ضرر نسبت به خرید ${buyPriceUsd}$: ${sign}${diff.toFixed(
      2
    )}$`;
  }

  return {
    asset: label,
    amount,
    unit_usd: unitUsd,
    total_usd: totalUsd,
    unit_toman: unitToman,
    total_toman: totalToman,
    unit_irr: Math.round(unitIrr),
    total_irr: Math.round(totalIrr),
    updated_at: new Date().toLocaleTimeString("fa-IR", { timeZone: "Asia/Tehran" }),
    profitLossText,
  };
}

export { formatTehranTime, getTehranTimeParts };

// =============================================================
// MAIN TELEGRAM MANAGER CLASS
// =============================================================

export class TelegramManager {
  private accounts: Map<string, TelegramAccount> = new Map();
  private loginSessions: Map<string, LoginSession> = new Map();
  private workers: Map<string, AccountWorker> = new Map();
  private logs: LogEntry[] = [];
  private maxLogs = 400;
  private botSettings: BotSettings = {
    bot_token: "",
    owner_id: 0,
    enabled: false,
    api_id: DEFAULT_API_ID,
    api_hash: DEFAULT_API_HASH,
  };
  private botPollingActive = false;
  private botLastUpdateId = 0;

  constructor() {
    this.loadState();
    setInterval(() => this.cleanupStaleSessions(), 5 * 60 * 1000);
    if (this.botSettings.enabled && this.botSettings.bot_token) {
      setTimeout(() => this.startBotController(), 2000);
    }
  }

  public addLog(
    level: "info" | "success" | "warn" | "error",
    module: LogEntry["module"],
    message: string,
    accountPhone?: string,
    details?: any
  ) {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      accountPhone,
      details,
    };
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    console.log(`[${entry.level.toUpperCase()}][${entry.module}] ${entry.message}`);
  }

  public getLogs(): LogEntry[] {
    return this.logs;
  }

  public clearLogs() {
    this.logs = [];
    this.addLog("info", "system", "Logs cleared by user.");
  }

  private loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.accounts && typeof parsed.accounts === "object") {
          for (const [phone, acc] of Object.entries(parsed.accounts)) {
            const typedAcc = acc as TelegramAccount;
            typedAcc.isOnline = false;
            // Ensure defaults for new Hacker v6 features
            if (!typedAcc.features) {
              typedAcc.features = defaultFeatures();
            } else {
              typedAcc.features = {
                ...defaultFeatures(),
                ...typedAcc.features,
                mandatory_join: {
                  ...defaultFeatures().mandatory_join,
                  ...(typedAcc.features.mandatory_join || {}),
                },
                broadcast: {
                  ...defaultFeatures().broadcast,
                  ...(typedAcc.features.broadcast || {}),
                },
                tools: {
                  ...defaultFeatures().tools,
                  ...(typedAcc.features.tools || {}),
                },
                font: {
                  ...defaultFeatures().font,
                  ...(typedAcc.features.font || {}),
                  scopes: {
                    ...defaultFeatures().font.scopes,
                    ...(typedAcc.features.font?.scopes || {}),
                  },
                },
                tabchi: {
                  ...defaultFeatures().tabchi,
                  ...(typedAcc.features.tabchi || {}),
                },
              };
            }
            this.accounts.set(phone, typedAcc);
          }
          this.addLog("info", "system", `Loaded ${this.accounts.size} accounts from storage.`);
        }
        if (parsed.botSettings) {
          this.botSettings = parsed.botSettings;
        }
      }
    } catch (err: any) {
      this.addLog("error", "system", `Failed to load state: ${err?.message}`);
    }
  }

  private saveState() {
    try {
      const accountsObj: Record<string, TelegramAccount> = {};
      for (const [phone, acc] of this.accounts.entries()) {
        accountsObj[phone] = acc;
      }
      fs.writeFileSync(
        STATE_FILE,
        JSON.stringify(
          {
            accounts: accountsObj,
            botSettings: this.botSettings,
          },
          null,
          2
        ),
        "utf-8"
      );
    } catch (err: any) {
      this.addLog("error", "system", `Failed to save state: ${err?.message}`);
    }
  }

  public async initAllAccounts() {
    for (const [phone, acc] of this.accounts.entries()) {
      if (acc.sessionString && acc.features.keep_alive !== false) {
        this.startAccountWorker(phone).catch((err) => {
          this.addLog("error", "system", `Failed to auto-start account ${phone}: ${err?.message}`, phone);
        });
      }
    }
  }

  private cleanupStaleSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.loginSessions.entries()) {
      if (now - session.createdAt > 15 * 60 * 1000) {
        try {
          session.client.disconnect();
        } catch (_) {}
        this.loginSessions.delete(sessionId);
      }
    }
  }

  // -------------------------------------------------------------
  // REAL TELEGRAM AUTHENTICATION FLOW
  // -------------------------------------------------------------

  public async sendCode(phoneNumber: string, customApiId?: number, customApiHash?: string) {
    let cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
    if (!cleanPhone.startsWith("+")) {
      cleanPhone = "+" + cleanPhone;
    }

    if (cleanPhone.length < 8 || !/^\+[0-9]{7,16}$/.test(cleanPhone)) {
      throw new Error(
        "شماره تلفن وارد شده نامعتبر است. فرمت صحیح مانند: +989123456789 یا +12025550123"
      );
    }

    const apiId = customApiId && customApiId > 0 ? customApiId : DEFAULT_API_ID;
    const apiHash =
      customApiHash && customApiHash.trim().length > 5 ? customApiHash.trim() : DEFAULT_API_HASH;

    this.addLog("info", "auth", `Starting Telegram MTProto connection for ${cleanPhone}...`, cleanPhone);

    const stringSession = new StringSession("");
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
      retryDelay: 2000,
    });

    try {
      await client.connect();
      this.addLog("info", "auth", `Connected to Telegram DC. Requesting code for ${cleanPhone}...`, cleanPhone);

      const result = (await client.sendCode(
        {
          apiId,
          apiHash,
        },
        cleanPhone
      )) as any;

      const sessionId = crypto.randomUUID();
      this.loginSessions.set(sessionId, {
        client,
        phoneNumber: cleanPhone,
        phoneCodeHash: result.phoneCodeHash,
        apiId,
        apiHash,
        createdAt: Date.now(),
      });

      const isCodeViaApp = Boolean(result.isCodeViaApp);
      this.addLog(
        "success",
        "auth",
        `کد تایید ورود تلگرام با موفقیت ارسال شد (${isCodeViaApp ? "درون برنامه تلگرام" : "پیامک SMS"}).`,
        cleanPhone
      );

      return {
        success: true,
        sessionId,
        phoneCodeHash: result.phoneCodeHash,
        isCodeViaApp,
        timeout: result.timeout || 120,
        message: isCodeViaApp
          ? "کد تایید به اپلیکیشن تلگرام فعال شما ارسال شد."
          : "کد تایید از طریق پیامک ارسال شد.",
      };
    } catch (err: any) {
      try {
        await client.disconnect();
      } catch (_) {}

      const raw = err?.errorMessage || err?.message || String(err);
      this.addLog("error", "auth", `Failed to send code to ${cleanPhone}: ${raw}`, cleanPhone);

      if (raw.includes("PHONE_NUMBER_INVALID")) {
        throw new Error("شماره تلفن وارد شده در تلگرام ثبت نشده یا نامعتبر است.");
      }
      if (raw.includes("FLOOD_WAIT")) {
        const sec = raw.match(/\d+/)?.[0] || "چند";
        throw new Error(`محدودیت موقت ارسال کد تلگرام (FloodWait). لطفاً ${sec} ثانیه بعد تلاش کنید.`);
      }
      throw new Error(`خطای تلگرام در ارسال کد: ${raw}`);
    }
  }

  public async signIn(sessionId: string, phoneCode: string) {
    const session = this.loginSessions.get(sessionId);
    if (!session) {
      throw new Error("نشست ورود منقضی شده یا نامعتبر است. لطفاً مجدداً شماره تلفن خود را وارد کنید.");
    }

    const cleanCode = phoneCode.trim().replace(/\D/g, "");
    if (!cleanCode) {
      throw new Error("کد تایید الزامی است.");
    }

    this.addLog("info", "auth", `Signing in ${session.phoneNumber} with code...`, session.phoneNumber);

    try {
      await session.client.invoke(
        new Api.auth.SignIn({
          phoneNumber: session.phoneNumber,
          phoneCodeHash: session.phoneCodeHash,
          phoneCode: cleanCode,
        })
      );

      return await this.completeAuthentication(sessionId, session);
    } catch (err: any) {
      const rawError = err?.errorMessage || err?.message || String(err);

      if (rawError === "SESSION_PASSWORD_NEEDED" || rawError.includes("SESSION_PASSWORD_NEEDED")) {
        let hint = "";
        try {
          const pwdInfo = await session.client.invoke(new Api.account.GetPassword());
          hint = pwdInfo.hint || "";
        } catch (_) {}

        this.addLog("warn", "auth", `2FA password needed for ${session.phoneNumber}.`, session.phoneNumber);

        return {
          success: false,
          requires2FA: true,
          hint,
          message: "تایید دو مرحله‌ای (2FA) برای این حساب فعال است. لطفاً رمز عبور را وارد کنید.",
        };
      }

      this.addLog("error", "auth", `Verification code failed for ${session.phoneNumber}: ${rawError}`, session.phoneNumber);

      if (rawError.includes("PHONE_CODE_INVALID")) {
        throw new Error("کد تایید وارد شده اشتباه است. لطفاً مجدداً بررسی کنید.");
      }
      if (rawError.includes("PHONE_CODE_EXPIRED")) {
        throw new Error("کد تایید منقضی شده است. لطفاً دکمه ارسال مجدد را بزنید.");
      }

      throw new Error(`خطای ورود به تلگرام: ${rawError}`);
    }
  }

  public async verify2FA(sessionId: string, password: string) {
    const session = this.loginSessions.get(sessionId);
    if (!session) {
      throw new Error("نشست ورود منقضی شده یا نامعتبر است. لطفاً مجدداً شماره تلفن خود را وارد کنید.");
    }

    if (!password || !password.trim()) {
      throw new Error("لطفاً رمز عبور تایید دو مرحله‌ای (2FA) را وارد کنید.");
    }

    this.addLog("info", "auth", `Verifying 2FA password for ${session.phoneNumber}...`, session.phoneNumber);

    try {
      const passwordSrpResult = await session.client.invoke(new Api.account.GetPassword());
      const passwordSrpCheck = await computeCheck(passwordSrpResult, password.trim());

      await session.client.invoke(
        new Api.auth.CheckPassword({
          password: passwordSrpCheck,
        })
      );

      return await this.completeAuthentication(sessionId, session);
    } catch (err: any) {
      const rawError = err?.errorMessage || err?.message || String(err);
      this.addLog("error", "auth", `2FA password verification failed for ${session.phoneNumber}: ${rawError}`, session.phoneNumber);

      if (rawError.includes("PASSWORD_HASH_INVALID") || rawError.includes("SRP_ID_INVALID")) {
        throw new Error("رمز عبور دو مرحله‌ای (2FA) وارد شده نادرست است.");
      }

      throw new Error(`خطای تایید دو مرحله‌ای: ${rawError}`);
    }
  }

  public async importSession(sessionString: string, customApiId?: number, customApiHash?: string) {
    const cleanSession = sessionString.trim();
    if (!cleanSession) {
      throw new Error("لطفاً رشته نشست (Session String) تلگرام را وارد کنید.");
    }

    const apiId = customApiId && customApiId > 0 ? customApiId : DEFAULT_API_ID;
    const apiHash =
      customApiHash && customApiHash.trim().length > 5 ? customApiHash.trim() : DEFAULT_API_HASH;

    this.addLog("info", "auth", `Testing imported session string with API ID ${apiId}...`);

    const stringSession = new StringSession(cleanSession);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    try {
      await client.connect();
      const isAuth = await client.isUserAuthorized();
      if (!isAuth) {
        throw new Error("این رشته نشست منقضی یا باطل شده است و اجازه ورود به حساب را ندارد.");
      }

      const me = (await client.getMe()) as any;
      const phone = me.phone ? `+${me.phone}` : `user_${me.id}`;

      const account: TelegramAccount = {
        phone,
        userId: String(me.id),
        firstName: me.firstName || "",
        lastName: me.lastName || "",
        username: me.username || "",
        sessionString: cleanSession,
        connectedAt: new Date().toISOString(),
        isOnline: true,
        features: this.accounts.get(phone)?.features || defaultFeatures(),
        apiId,
        apiHash,
      };

      this.accounts.set(phone, account);
      this.saveState();

      await this.startAccountWorkerWithClient(phone, client);

      this.addLog(
        "success",
        "auth",
        `حساب ${phone} (${me.firstName || "کاربر"}) با موفقیت از طریق Session String متصل شد!`,
        phone
      );

      return {
        success: true,
        user: {
          id: String(me.id),
          firstName: me.firstName || "",
          lastName: me.lastName || "",
          username: me.username || "",
          phone,
        },
        sessionString: cleanSession,
        message: "حساب با موفقیت متصل شد!",
      };
    } catch (err: any) {
      try {
        await client.disconnect();
      } catch (_) {}
      this.addLog("error", "auth", `Failed to import session string: ${err?.message}`);
      throw new Error(`خطا در اتصال به سشن تلگرام: ${err?.message}`);
    }
  }

  private async completeAuthentication(sessionId: string, session: LoginSession) {
    const sessionString = session.client.session.save() as unknown as string;
    const me = (await session.client.getMe()) as any;
    const phone = session.phoneNumber;

    const account: TelegramAccount = {
      phone,
      userId: String(me.id),
      firstName: me.firstName || "",
      lastName: me.lastName || "",
      username: me.username || "",
      sessionString,
      connectedAt: new Date().toISOString(),
      isOnline: true,
      features: this.accounts.get(phone)?.features || defaultFeatures(),
      apiId: session.apiId,
      apiHash: session.apiHash,
    };

    this.accounts.set(phone, account);
    this.saveState();
    this.loginSessions.delete(sessionId);

    await this.startAccountWorkerWithClient(phone, session.client);

    this.addLog(
      "success",
      "auth",
      `🎉 حساب ${phone} (${me.firstName} @${me.username || "بدون یوزرنیم"}) با موفقیت متصل و فعال گردید!`,
      phone
    );

    return {
      success: true,
      user: {
        id: String(me.id),
        firstName: me.firstName || "",
        lastName: me.lastName || "",
        username: me.username || "",
        phone,
      },
      sessionString,
      message: "حساب تلگرام شما با موفقیت متصل شد و سرویس‌های سلف و تبچی فعال گردیدند.",
    };
  }

  // -------------------------------------------------------------
  // WORKER RUNTIME FOR CONNECTED ACCOUNTS
  // -------------------------------------------------------------

  public async startAccountWorker(phone: string) {
    const account = this.accounts.get(phone);
    if (!account || !account.sessionString) {
      throw new Error(`Account ${phone} not found or missing session.`);
    }

    this.stopAccountWorker(phone);

    const apiId = account.apiId || DEFAULT_API_ID;
    const apiHash = account.apiHash || DEFAULT_API_HASH;
    const stringSession = new StringSession(account.sessionString);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 10,
      retryDelay: 3000,
    });

    await client.connect();
    if (!await client.isUserAuthorized()) {
      account.isOnline = false;
      this.saveState();
      throw new Error(`Session for ${phone} is expired or invalid.`);
    }

    return await this.startAccountWorkerWithClient(phone, client);
  }

  private async startAccountWorkerWithClient(phone: string, client: TelegramClient) {
    const account = this.accounts.get(phone);
    if (!account) return;

    account.isOnline = true;
    this.saveState();

    const me = (await client.getMe()) as any;
    const worker: AccountWorker = {
      client,
      meId: String(me?.id || ""),
      scriptMessageIds: new Set<string>(),
    };
    this.workers.set(phone, worker);

    // Setup Message Listeners (Incoming & Outgoing)
    this.setupMessageListeners(phone, worker);

    // Setup Self-Time loop
    this.setupSelfTimeLoop(phone, worker);

    this.addLog("info", "system", `Background worker running for ${phone}. Self & Tabchi ready.`, phone);
  }

  public stopAccountWorker(phone: string) {
    const worker = this.workers.get(phone);
    if (worker) {
      if (worker.timeTimer) {
        clearInterval(worker.timeTimer);
      }
      if (worker.tabchiAbortController) {
        worker.tabchiAbortController.abort();
      }
      if (worker.pmBroadcastAbortController) {
        worker.pmBroadcastAbortController.abort();
      }
      try {
        worker.client.disconnect();
      } catch (_) {}
      this.workers.delete(phone);
    }

    const acc = this.accounts.get(phone);
    if (acc) {
      acc.isOnline = false;
      this.saveState();
    }
  }

  public async disconnectAccount(phone: string) {
    this.stopAccountWorker(phone);
    this.accounts.delete(phone);
    this.saveState();
    this.addLog("info", "system", `حساب ${phone} با موفقیت حذف و قطع ارتباط گردید.`, phone);
  }

  // -------------------------------------------------------------
  // MESSAGE LISTENERS (MANDATORY JOIN, TOOLS, AUTO-REPLY, FONT)
  // -------------------------------------------------------------

  private setupMessageListeners(phone: string, worker: AccountWorker) {
    const client = worker.client;

    // 1. Incoming Messages Handler
    client.addEventHandler(async (event: any) => {
      const account = this.accounts.get(phone);
      if (!account || !account.isOnline) return;

      const message = event.message;
      if (!message || message.out) return;

      const isPrivate = Boolean(event.isPrivate);
      const sender = await message.getSender();
      if (!sender || (sender as any).bot || (sender as any).isSelf) return;

      const senderId = String(sender.id);
      const incomingText = (message.text || message.message || "").trim();

      // Collect PM Recipient for broadcast messaging
      if (isPrivate) {
        if (!account.features.broadcast.recipients) {
          account.features.broadcast.recipients = {};
        }
        account.features.broadcast.recipients[senderId] = {
          last_seen: new Date().toISOString(),
        };
        this.saveState();
      }

      // 1A. SMART CHAT TOOLS: CALCULATOR
      if (account.features.tools?.calculator_active && incomingText) {
        const mathExpr = extractMathCalculation(incomingText);
        if (mathExpr) {
          try {
            const calcResult = evaluateMath(mathExpr);
            await client.sendMessage(message.chatId!, {
              message: `🧮 نتیجه: ${mathExpr} = ${calcResult}`,
              replyTo: message.id,
            });
            this.addLog("info", "tools", `محاسبه ریاضی انجام شد: ${mathExpr} = ${calcResult}`, phone);
            return;
          } catch (_) {}
        }
      }

      // 1B. SMART CHAT TOOLS: LIVE MARKET & CRYPTO QUOTE
      if (account.features.tools?.market_active && incomingText) {
        const lower = incomingText.toLowerCase();
        const assetMatch = lower.match(
          /(usd|usdt|dollar|دلار|دالر|تتر|طلا|gold|btc|بیت ?کوین|eth|اتریوم|trx|ترون|sol|سولانا)/
        );
        if (assetMatch) {
          const asset = assetMatch[1];
          const amountMatch = lower.match(/(?<![a-z])\d+(?:\.\d+)?/);
          const amount = amountMatch ? parseFloat(amountMatch[0]) : 1.0;

          // Check if buy price was included
          const buyMatch = lower.match(/(?:buy|خرید)\s*(\d+(?:\.\d+)?)/);
          const buyPrice = buyMatch ? parseFloat(buyMatch[1]) : undefined;

          try {
            const quote = await getMarketQuote(asset, amount, buyPrice);
            const quoteMsg =
              `💹 استعلام قیمت زنده:\n` +
              `• دارایی: ${quote.amount} ${quote.asset}\n` +
              `• معادل دلار: $${quote.total_usd.toLocaleString("en-US", { minimumFractionDigits: 2 })}\n` +
              `• معادل تومان: ${quote.total_toman.toLocaleString("fa-IR")} تومان\n` +
              `• معادل ریال: ${quote.total_irr.toLocaleString("fa-IR")} ریال\n` +
              `• به‌روزرسانی: ${quote.updated_at}` +
              (quote.profitLossText ? `\n• ${quote.profitLossText}` : "");

            await client.sendMessage(message.chatId!, {
              message: quoteMsg,
              replyTo: message.id,
            });
            this.addLog("info", "tools", `استعلام قیمت ارسال شد: ${quote.asset}`, phone);
            return;
          } catch (_) {}
        }
      }

      if (!isPrivate) return;

      // 1C. MANDATORY JOIN CHECK
      if (
        account.features.mandatory_join?.active &&
        account.features.mandatory_join.channels?.length > 0
      ) {
        const channels = account.features.mandatory_join.channels;
        const missingChannels: Array<{ name: string; ref: string }> = [];

        for (const ch of channels) {
          try {
            const cleanRef = ch.ref.replace(/^https?:\/\/t\.me\//, "").replace("@", "");
            await client.invoke(
              new Api.channels.GetParticipant({
                channel: cleanRef,
                participant: senderId,
              })
            );
          } catch (err: any) {
            const errMsg = String(err?.errorMessage || err?.message || "");
            if (
              errMsg.includes("USER_NOT_PARTICIPANT") ||
              errMsg.includes("UserNotParticipant") ||
              errMsg.includes("CHAT_ADMIN_REQUIRED") ||
              errMsg.includes("CHANNEL_PRIVATE")
            ) {
              missingChannels.push(ch);
            }
          }
        }

        if (missingChannels.length > 0) {
          const channelLinks = missingChannels
            .map((c) => `• ${c.name}: https://t.me/${c.ref.replace("@", "")}`)
            .join("\n");
          let joinNotice =
            `برای دریافت پاسخ ابتدا در کانال‌های زیر عضو شوید:\n` +
            `${channelLinks}\n\n` +
            `بعد از عضویت دوباره پیام بفرستید.`;

          if (
            account.features.font?.active &&
            account.features.font.scopes?.mandatory_join
          ) {
            joinNotice = transformFont(joinNotice, account.features.font.style);
          }

          try {
            await client.sendMessage(message.chatId!, {
              message: joinNotice,
              replyTo: message.id,
            });
            this.addLog("info", "mandatory_join", `اخطار عضویت اجباری به کاربر ${senderId} ارسال شد.`, phone);
          } catch (_) {}
          return;
        }
      }

      // 1D. AUTO-REPLY (SECRETARY)
      if (account.features.auto_reply?.active) {
        const templates = account.features.auto_reply.messages;
        if (templates && templates.length > 0) {
          let replyText = templates[Math.floor(Math.random() * templates.length)];
          if (
            account.features.font?.active &&
            account.features.font.scopes?.auto_reply
          ) {
            replyText = transformFont(replyText, account.features.font.style);
          }

          const delay = (account.features.auto_reply.delay_seconds || 1) * 1000;
          setTimeout(async () => {
            try {
              await client.sendMessage(message.chatId!, {
                message: replyText,
                replyTo: message.id,
              });
              account.features.auto_reply.last_replied_at = new Date().toISOString();
              this.saveState();
              this.addLog("info", "auto_reply", `پاسخ خودکار به کاربر ${message.chatId} ارسال شد.`, phone);
            } catch (err: any) {
              this.addLog("warn", "auto_reply", `خطا در ارسال پاسخ خودکار: ${err?.message}`, phone);
            }
          }, delay);
        }
      }
    }, new NewMessage({ incoming: true }));

    // 2. Outgoing Messages Handler (Saved Messages commands & Font transforms)
    client.addEventHandler(async (event: any) => {
      const account = this.accounts.get(phone);
      if (!account || !account.isOnline) return;

      const message = event.message;
      if (!message || !message.out) return;

      const text = (message.text || message.message || "").trim();
      if (!text) return;

      // Check for Saved Messages Remote Commands
      if (worker.meId && String(message.chatId) === worker.meId && text.startsWith("/")) {
        await this.handleSavedMessagesCommand(phone, worker, message, text);
        return;
      }

      // Check if Outgoing Font Transformation is enabled for manual messages
      if (
        account.features.font?.active &&
        account.features.font.scopes?.manual_messages &&
        account.features.font.style !== "default" &&
        account.features.font.style !== "normal"
      ) {
        // Prevent infinite loop on edited messages
        if (worker.scriptMessageIds?.has(String(message.id))) {
          worker.scriptMessageIds.delete(String(message.id));
          return;
        }

        const styledText = transformFont(text, account.features.font.style);
        if (styledText !== text) {
          try {
            worker.scriptMessageIds?.add(String(message.id));
            await client.editMessage(message.chatId!, {
              message: message.id,
              text: styledText,
            });
          } catch (_) {}
        }
      }
    }, new NewMessage({ outgoing: true }));
  }

  // -------------------------------------------------------------
  // SAVED MESSAGES TELEGRAM REMOTE CONTROL
  // -------------------------------------------------------------

  private async handleSavedMessagesCommand(
    phone: string,
    worker: AccountWorker,
    message: any,
    rawText: string
  ) {
    const account = this.accounts.get(phone);
    if (!account) return;

    const parts = rawText.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const sub = parts[1]?.toLowerCase();

    if (cmd === "/self") {
      if (sub === "time" && parts[2]) {
        const on = parts[2].toLowerCase() === "on";
        await this.updateSelfTimeConfig(
          phone,
          on,
          account.features.self_time.format || "HH:mm",
          account.features.self_time.font_style || "bold"
        );
        const { hours, minutes } = getTehranTimeParts();
        await worker.client.sendMessage("me", {
          message: `⏰ ساعت سلف پروفایل (تایم رسمی ایران): ${on ? `روشن شد ✅ (ساعت فعلی تهران: ${hours}:${minutes})` : "خاموش شد ⛔"}`,
        });
        return;
      }
      if (sub === "autoreply" && parts[2]) {
        const on = parts[2].toLowerCase() === "on";
        account.features.auto_reply.active = on;
        this.saveState();
        await worker.client.sendMessage("me", {
          message: `💬 منشی خودکار: ${on ? "روشن شد ✅" : "خاموش شد ⛔"}`,
        });
        return;
      }

      const statusMsg =
        `👤 وضعیت کنترل ماژول SELF (دائمی):\n\n` +
        `• ساعت روی پروفایل: ${account.features.self_time.active ? "روشن ✅" : "خاموش ⛔"}\n` +
        `• فونت پیام‌ها: ${account.features.font.active ? account.features.font.style : "خاموش"}\n` +
        `• منشی خودکار: ${account.features.auto_reply.active ? "روشن ✅" : "خاموش ⛔"}\n` +
        `• عضویت اجباری: ${account.features.mandatory_join.active ? "روشن ✅" : "خاموش ⛔"}\n` +
        `• ماشین‌حساب: ${account.features.tools.calculator_active ? "فعال ✅" : "خاموش"}\n` +
        `• نرخ ارز/کریپتو: ${account.features.tools.market_active ? "فعال ✅" : "خاموش"}\n` +
        `• مخاطبان پی‌وی: ${Object.keys(account.features.broadcast.recipients || {}).length} نفر`;

      await worker.client.sendMessage("me", { message: statusMsg });
      return;
    }

    if (cmd === "/tabchi") {
      if (sub === "start") {
        this.startBroadcast(phone).catch(() => {});
        await worker.client.sendMessage("me", {
          message: `🚀 ارسال سراسری تبچی آغاز شد.`,
        });
        return;
      }
      if (sub === "stop") {
        this.stopBroadcast(phone);
        await worker.client.sendMessage("me", {
          message: `🛑 ارسال تبچی متوقف شد.`,
        });
        return;
      }

      const tabchiMsg =
        `📨 وضعیت ماژول TABCHI (دائمی):\n\n` +
        `• وضعیت: ${account.features.tabchi.status}\n` +
        `• کل ارسال موفق: ${account.features.tabchi.total_sent}\n` +
        `• ارسال ناموفق: ${account.features.tabchi.total_failed}\n` +
        `• فاصله بین ارسال‌ها: ${account.features.tabchi.interval_seconds} ثانیه\n` +
        `• حالت مقصدها: ${account.features.tabchi.target_mode === "all" ? "تمام گروه‌ها" : "گروه‌های انتخابی"}\n\n` +
        `دستورات سریع:\n` +
        `/tabchi start — شروع ارسال\n` +
        `/tabchi stop — توقف ارسال`;

      await worker.client.sendMessage("me", { message: tabchiMsg });
      return;
    }
  }

  // -------------------------------------------------------------
  // SELF-TIME (PROFILE CLOCK) ENGINE
  // -------------------------------------------------------------

  private setupSelfTimeLoop(phone: string, worker: AccountWorker) {
    if (worker.timeTimer) {
      clearInterval(worker.timeTimer);
    }

    let lastClockStr = "";

    const updateClock = async () => {
      const account = this.accounts.get(phone);
      if (!account || !account.isOnline || !account.features.self_time.active) {
        return;
      }

      try {
        const fmt = account.features.self_time.format || "HH:mm";
        const timeStr = formatTehranTime(fmt);

        if (timeStr === lastClockStr) {
          return;
        }

        const fontStyle = account.features.self_time.font_style || "bold";
        const styledClock = transformFont(timeStr, fontStyle);

        if (account.features.self_time.original_last_name === null) {
          const me = (await worker.client.getMe()) as any;
          account.features.self_time.original_last_name = me.lastName || "";
          this.saveState();
        }

        await worker.client.invoke(
          new Api.account.UpdateProfile({
            lastName: styledClock,
          })
        );

        lastClockStr = timeStr;
        account.features.self_time.last_updated = new Date().toISOString();
        this.saveState();
      } catch (err: any) {
        if (!String(err).includes("FLOOD_WAIT")) {
          this.addLog("warn", "self_time", `Profile clock update error: ${err?.message}`, phone);
        }
      }
    };

    updateClock();
    worker.timeTimer = setInterval(updateClock, 30 * 1000);
  }

  public async updateSelfTimeConfig(
    phone: string,
    active: boolean,
    format: string,
    fontStyle: TelegramAccountFeatures["self_time"]["font_style"]
  ) {
    const account = this.accounts.get(phone);
    if (!account) throw new Error("Account not found");

    account.features.self_time.active = active;
    account.features.self_time.format = format;
    account.features.self_time.font_style = fontStyle;
    this.saveState();

    const worker = this.workers.get(phone);
    if (worker && worker.client.connected) {
      if (!active && account.features.self_time.original_last_name !== null) {
        try {
          await worker.client.invoke(
            new Api.account.UpdateProfile({
              lastName: account.features.self_time.original_last_name,
            })
          );
          this.addLog("info", "self_time", `ساعت پروفایل خاموش شد و نام قبلی بازگردانی گردید.`, phone);
        } catch (err: any) {
          this.addLog("warn", "self_time", `Could not restore last name: ${err?.message}`, phone);
        }
      } else if (active) {
        this.setupSelfTimeLoop(phone, worker);
        this.addLog("success", "self_time", `ساعت پروفایل با فرمت ${format} فعال گردید.`, phone);
      }
    }

    return account.features.self_time;
  }

  // -------------------------------------------------------------
  // AUTO-REPLY CONFIGURATION
  // -------------------------------------------------------------

  public updateAutoReplyConfig(
    phone: string,
    active: boolean,
    messages: string[],
    delaySeconds: number
  ) {
    const account = this.accounts.get(phone);
    if (!account) throw new Error("Account not found");

    account.features.auto_reply.active = active;
    account.features.auto_reply.messages = messages.filter((m) => m.trim().length > 0);
    account.features.auto_reply.delay_seconds = delaySeconds;
    this.saveState();

    this.addLog(
      "info",
      "auto_reply",
      `تنظیمات منشی خودکار بروز شد (وضعیت: ${active ? "فعال" : "غیرفعال"}).`,
      phone
    );
    return account.features.auto_reply;
  }

  // -------------------------------------------------------------
  // MANDATORY JOIN CONFIGURATION
  // -------------------------------------------------------------

  public updateMandatoryJoinConfig(
    phone: string,
    active: boolean,
    channels: Array<{ name: string; ref: string }>
  ) {
    const account = this.accounts.get(phone);
    if (!account) throw new Error("Account not found");

    account.features.mandatory_join.active = active;
    account.features.mandatory_join.channels = channels.filter(
      (c) => c.ref && c.ref.trim().length > 0
    );
    this.saveState();

    this.addLog(
      "info",
      "mandatory_join",
      `تنظیمات عضویت اجباری بروز شد (${channels.length} کانال).`,
      phone
    );
    return account.features.mandatory_join;
  }

  // -------------------------------------------------------------
  // SMART CHAT TOOLS CONFIGURATION
  // -------------------------------------------------------------

  public updateChatToolsConfig(
    phone: string,
    calculatorActive: boolean,
    marketActive: boolean
  ) {
    const account = this.accounts.get(phone);
    if (!account) throw new Error("Account not found");

    account.features.tools.calculator_active = calculatorActive;
    account.features.tools.market_active = marketActive;
    this.saveState();

    this.addLog(
      "info",
      "tools",
      `ابزارهای چت بروز شدند (ماشین‌حساب: ${calculatorActive ? "فعال" : "خاموش"} | قیمت‌ها: ${
        marketActive ? "فعال" : "خاموش"
      })`,
      phone
    );
    return account.features.tools;
  }

  // -------------------------------------------------------------
  // FONT CONFIGURATION WITH SCOPES
  // -------------------------------------------------------------

  public updateFontConfig(
    phone: string,
    active: boolean,
    style: TelegramAccountFeatures["font"]["style"],
    scopes: TelegramAccountFeatures["font"]["scopes"]
  ) {
    const account = this.accounts.get(phone);
    if (!account) throw new Error("Account not found");

    account.features.font.active = active;
    account.features.font.style = style;
    account.features.font.scopes = scopes;
    this.saveState();

    this.addLog("info", "system", `استایل فونت (${style}) و اسکوپ‌های اعمال بروز شد.`, phone);
    return account.features.font;
  }

  // -------------------------------------------------------------
  // PM BROADCASTER (MESSAGE ALL PRIVATE CONTACTS)
  // -------------------------------------------------------------

  public async startPmBroadcast(phone: string) {
    const account = this.accounts.get(phone);
    if (!account) throw new Error("Account not found");

    const worker = this.workers.get(phone);
    if (!worker || !worker.client.connected) {
      throw new Error("Telegram client is not connected for this account.");
    }

    if (worker.isPmBroadcasting) {
      throw new Error("PM Broadcasting is already active for this account.");
    }

    const message = account.features.broadcast.message?.trim();
    if (!message) {
      throw new Error("متن پیام همگانی پی‌وی خالی است.");
    }

    const recipients = Object.keys(account.features.broadcast.recipients || {});
    if (recipients.length === 0) {
      throw new Error("هیچ کاربری در لیست مخاطبان پی‌وی ثبت نشده است. با دریافت پیام‌های جدید مخاطبان افزوده می‌شوند.");
    }

    const abortController = new AbortController();
    worker.pmBroadcastAbortController = abortController;
    worker.isPmBroadcasting = true;
    account.features.broadcast.status = "broadcasting";
    this.saveState();

    const maxLimit = Math.min(recipients.length, account.features.broadcast.max_recipients || 50);
    const targetRecipients = recipients.slice(0, maxLimit);
    const intervalMs = Math.max(5, account.features.broadcast.interval_seconds || 20) * 1000;

    this.addLog("info", "broadcast", `شروع ارسال پیام همگانی به ${targetRecipients.length} مخاطب پی‌وی...`, phone);

    (async () => {
      let sentCount = 0;
      for (const recId of targetRecipients) {
        if (abortController.signal.aborted) break;

        try {
          let text = message;
          if (
            account.features.font?.active &&
            account.features.font.scopes?.auto_reply
          ) {
            text = transformFont(text, account.features.font.style);
          }

          await worker.client.sendMessage(recId, { message: text });
          sentCount++;
          account.features.broadcast.total_sent = (account.features.broadcast.total_sent || 0) + 1;
          this.addLog("success", "broadcast", `پیام به مخاطب ${recId} ارسال شد.`, phone);
        } catch (err: any) {
          const errMsg = String(err?.errorMessage || err?.message || "");
          this.addLog("warn", "broadcast", `ارسال به ${recId} ناموفق بود: ${errMsg}`, phone);
        }

        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }

      account.features.broadcast.status = "stopped";
      worker.isPmBroadcasting = false;
      this.saveState();
      this.addLog("success", "broadcast", `پایان ارسال پیام همگانی. تعداد کل ارسال: ${sentCount}`, phone);
    })().catch((err) => {
      this.addLog("error", "broadcast", `خطای کلی در پیام همگانی: ${err?.message}`, phone);
      account.features.broadcast.status = "stopped";
      worker.isPmBroadcasting = false;
      this.saveState();
    });

    return account.features.broadcast;
  }

  public stopPmBroadcast(phone: string) {
    const account = this.accounts.get(phone);
    const worker = this.workers.get(phone);
    if (worker) {
      if (worker.pmBroadcastAbortController) {
        worker.pmBroadcastAbortController.abort();
      }
      worker.isPmBroadcasting = false;
    }
    if (account) {
      account.features.broadcast.status = "stopped";
      this.saveState();
    }
    this.addLog("info", "broadcast", "ارسال پیام همگانی متوقف شد.", phone);
    return account?.features.broadcast;
  }

  public updatePmBroadcastSettings(
    phone: string,
    message: string,
    intervalSeconds: number,
    maxRecipients: number
  ) {
    const account = this.accounts.get(phone);
    if (!account) throw new Error("Account not found");

    account.features.broadcast.message = message;
    account.features.broadcast.interval_seconds = intervalSeconds;
    account.features.broadcast.max_recipients = maxRecipients;
    this.saveState();

    this.addLog("info", "broadcast", "تنظیمات پیام همگانی پی‌وی ذخیره گردید.", phone);
    return account.features.broadcast;
  }

  // -------------------------------------------------------------
  // TABCHI BROADCASTER ENGINE (GROUPS & CUSTOM TARGETS)
  // -------------------------------------------------------------

  public async startBroadcast(phone: string) {
    const account = this.accounts.get(phone);
    if (!account) throw new Error("Account not found");

    const worker = this.workers.get(phone);
    if (!worker || !worker.client.connected) {
      throw new Error("Telegram client is not connected for this account.");
    }

    if (worker.isBroadcasting) {
      throw new Error("Broadcasting is already active for this account.");
    }

    const broadcastMessage = account.features.tabchi.message?.trim();
    if (!broadcastMessage) {
      throw new Error("متن پیام ارسالی تبچی خالی است.");
    }

    const abortController = new AbortController();
    worker.tabchiAbortController = abortController;
    worker.isBroadcasting = true;
    account.features.tabchi.status = "broadcasting";
    this.saveState();

    this.addLog("info", "tabchi", `شروع ارسال هوشمند تبچی...`, phone);

    (async () => {
      try {
        let targets: any[] = [];

        if (account.features.tabchi.target_mode === "selected" && account.features.tabchi.targets?.length > 0) {
          // Resolve custom targets
          for (const ref of account.features.tabchi.targets) {
            try {
              const clean = ref.trim().replace(/^https?:\/\/t\.me\//, "");
              const entity = await worker.client.getEntity(clean);
              targets.push(entity);
            } catch (err: any) {
              this.addLog("warn", "tabchi", `مقصد ${ref} یافت نشد: ${err?.message}`, phone);
            }
          }
        } else {
          // All dialogs
          const dialogs = await worker.client.getDialogs({});
          targets = dialogs.filter((d) => d.isGroup || (d.entity as any)?.megagroup);
        }

        this.addLog("info", "tabchi", `تعداد ${targets.length} گروه مقصد شناسایی شد.`, phone);

        if (targets.length === 0) {
          this.addLog("warn", "tabchi", "هیچ گروهی برای ارسال پیدا نشد.", phone);
          account.features.tabchi.status = "stopped";
          worker.isBroadcasting = false;
          this.saveState();
          return;
        }

        const maxRounds = account.features.tabchi.repeat_infinite
          ? 999999
          : account.features.tabchi.repeat_rounds || 1;
        const intervalMs = (account.features.tabchi.interval_seconds || 4) * 1000;

        let outgoing = broadcastMessage;
        if (account.features.font?.active && account.features.font.scopes?.tabchi) {
          outgoing = transformFont(outgoing, account.features.font.style);
        }

        for (let round = 1; round <= maxRounds; round++) {
          if (abortController.signal.aborted) break;

          this.addLog("info", "tabchi", `درحال اجرای دور ${round} از ارسال تبچی...`, phone);

          for (const chat of targets) {
            if (abortController.signal.aborted) break;

            try {
              const entity = chat.inputEntity || chat;
              await worker.client.sendMessage(entity, { message: outgoing });
              account.features.tabchi.total_sent++;
              this.addLog("success", "tabchi", `ارسال موفق به ${chat.title || chat.id || "گروه"}`, phone);
            } catch (err: any) {
              account.features.tabchi.total_failed++;
              const msg = err?.errorMessage || err?.message || String(err);
              if (msg.includes("FLOOD_WAIT")) {
                const waitSec = Number(msg.match(/\d+/)?.[0] || 30);
                this.addLog("warn", "tabchi", `FloodWait تلگرام: ${waitSec} ثانیه توقف...`, phone);
                await new Promise((r) => setTimeout(r, waitSec * 1000));
              } else {
                this.addLog("warn", "tabchi", `خطا در ارسال به ${chat.title || chat.id}: ${msg}`, phone);
              }
            }

            account.features.tabchi.last_run = new Date().toISOString();
            this.saveState();

            await new Promise((resolve) => setTimeout(resolve, intervalMs));
          }
        }

        account.features.tabchi.status = "stopped";
        worker.isBroadcasting = false;
        this.saveState();
        this.addLog("success", "tabchi", "ارسال پیام‌های تبچی به پایان رسید.", phone);
      } catch (err: any) {
        account.features.tabchi.status = "error";
        worker.isBroadcasting = false;
        this.saveState();
        this.addLog("error", "tabchi", `خطا در فرآیند ارسال تبچی: ${err?.message}`, phone);
      }
    })();

    return account.features.tabchi;
  }

  public stopBroadcast(phone: string) {
    const account = this.accounts.get(phone);
    const worker = this.workers.get(phone);
    if (worker) {
      if (worker.tabchiAbortController) {
        worker.tabchiAbortController.abort();
      }
      worker.isBroadcasting = false;
    }
    if (account) {
      account.features.tabchi.status = "stopped";
      this.saveState();
    }
    this.addLog("info", "tabchi", `ارسال تبچی توسط کاربر متوقف شد.`, phone);
    return account?.features.tabchi;
  }

  public updateTabchiConfig(
    phone: string,
    message: string,
    intervalSeconds: number,
    repeatRounds: number,
    repeatInfinite: boolean,
    targetMode?: "all" | "selected",
    targets?: string[]
  ) {
    const account = this.accounts.get(phone);
    if (!account) throw new Error("Account not found");

    account.features.tabchi.message = message;
    account.features.tabchi.interval_seconds = intervalSeconds;
    account.features.tabchi.repeat_rounds = repeatRounds;
    account.features.tabchi.repeat_infinite = repeatInfinite;
    if (targetMode) {
      account.features.tabchi.target_mode = targetMode;
    }
    if (targets) {
      account.features.tabchi.targets = targets;
    }
    this.saveState();

    this.addLog("info", "tabchi", "تنظیمات ماژول تبچی بروز شد.", phone);
    return account.features.tabchi;
  }

  public async getAccountDialogsCount(phone: string) {
    const worker = this.workers.get(phone);
    if (!worker || !worker.client.connected) {
      return { total: 0, groups: 0, users: 0, channels: 0 };
    }

    try {
      const dialogs = await worker.client.getDialogs({});
      let groups = 0;
      let users = 0;
      let channels = 0;

      for (const d of dialogs) {
        if (d.isGroup || (d.entity as any)?.megagroup) groups++;
        else if (d.isUser) users++;
        else if (d.isChannel) channels++;
      }

      return { total: dialogs.length, groups, users, channels };
    } catch (_) {
      return { total: 0, groups: 0, users: 0, channels: 0 };
    }
  }

  // -------------------------------------------------------------
  // BOT CONTROLLER SETTINGS & RUNNER
  // -------------------------------------------------------------

  public getBotSettings(): BotSettings {
    return this.botSettings;
  }

  public async updateBotSettings(
    botToken: string,
    ownerId: number,
    enabled: boolean,
    apiId?: number,
    apiHash?: string
  ): Promise<BotSettings> {
    const cleanToken = (botToken || "").trim();
    const cleanOwnerId = Number(ownerId) || 0;
    let botUsername = this.botSettings.bot_username || "";

    if (enabled && cleanToken) {
      // Live test with Telegram Bot API
      try {
        const testRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
        const testData: any = await testRes.json();
        if (!testData.ok || !testData.result) {
          throw new Error(testData.description || "توکن ربات تلگرام نامعتبر است.");
        }
        botUsername = testData.result.username || "";
        this.addLog("success", "bot", `ربات کنترل تلگرام با موفقیت تایید شد: @${botUsername}`);
      } catch (err: any) {
        this.addLog("error", "bot", `خطا در اتصال به توکن ربات: ${err.message}`);
        throw new Error(`خطای تایید توکن تلگرام: ${err.message}`);
      }
    }

    this.botSettings = {
      bot_token: cleanToken,
      owner_id: cleanOwnerId,
      enabled: Boolean(enabled),
      bot_username: botUsername,
      api_id: apiId && apiId > 0 ? Number(apiId) : (this.botSettings.api_id || DEFAULT_API_ID),
      api_hash: apiHash && apiHash.trim() ? apiHash.trim() : (this.botSettings.api_hash || DEFAULT_API_HASH),
    };

    this.saveState();

    if (this.botSettings.enabled && this.botSettings.bot_token) {
      this.startBotController();
    } else {
      this.stopBotController();
    }

    this.addLog("info", "bot", `تنظیمات ربات ذخیره شد (مالک: ${cleanOwnerId}, ربات: @${botUsername || "ندارد"}).`);
    return this.botSettings;
  }

  public startBotController() {
    if (this.botPollingActive) return;
    if (!this.botSettings.enabled || !this.botSettings.bot_token) return;

    this.botPollingActive = true;
    this.addLog("info", "bot", `سرویس کنترل از راه دور ربات فعال شد.`);
    this.pollBotUpdates();
  }

  public stopBotController() {
    this.botPollingActive = false;
  }

  private async pollBotUpdates() {
    if (!this.botPollingActive || !this.botSettings.bot_token) return;

    try {
      const url = `https://api.telegram.org/bot${this.botSettings.bot_token}/getUpdates?offset=${this.botLastUpdateId + 1}&timeout=10`;
      const res = await fetch(url);
      if (res.ok) {
        const data: any = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.botLastUpdateId = Math.max(this.botLastUpdateId, update.update_id);
            if (update.message && update.message.text) {
              await this.handleBotMessage(update.message);
            }
          }
        }
      }
    } catch (_) {}

    if (this.botPollingActive) {
      setTimeout(() => this.pollBotUpdates(), 2000);
    }
  }

  private async sendBotMessage(chatId: number | string, text: string) {
    if (!this.botSettings.bot_token) return;
    try {
      await fetch(`https://api.telegram.org/bot${this.botSettings.bot_token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
        }),
      });
    } catch (_) {}
  }

  private async handleBotMessage(msg: any) {
    const fromId = msg.from?.id;
    const chatId = msg.chat?.id;
    const text = (msg.text || "").trim();

    // Security check: If owner_id is set, only respond to owner
    if (this.botSettings.owner_id > 0 && fromId !== this.botSettings.owner_id) {
      await this.sendBotMessage(chatId, `⛔ دسترسی غیرمجاز!\nآیدی کاربری شما (${fromId}) با آیدی مالک ثبت‌شده مطابقت ندارد.`);
      return;
    }

    const cmd = text.toLowerCase();

    if (cmd === "/start" || cmd === "/help") {
      const accountsCount = this.accounts.size;
      const onlineWorkers = Array.from(this.workers.values()).filter((w) => w.client?.connected).length;
      await this.sendBotMessage(
        chatId,
        `⚡ <b>پنل کنترل از راه دور ربات تلگرام v6 Pro</b>\n\n` +
        `👤 وضعیت مالک: تایید شده ✅\n` +
        `📱 اکانت‌های متصل: <b>${accountsCount}</b> (${onlineWorkers} فعال)\n\n` +
        `<b>📌 دستورات قابل اجرا:</b>\n` +
        `▫️ <code>/status</code> - وضعیت آنلاین سرور و اکانت‌ها\n` +
        `▫️ <code>/accounts</code> - لیست شماره‌های متصل\n` +
        `▫️ <code>/tabchi on</code> - روشن کردن ارسال تبچی همه اکانت‌ها\n` +
        `▫️ <code>/tabchi off</code> - خاموش کردن ارسال تبچی\n` +
        `▫️ <code>/self on</code> - فعال‌سازی قابلیت‌های سلف\n` +
        `▫️ <code>/self off</code> - غیرفعال‌سازی سلف\n` +
        `▫️ <code>/logs</code> - دریافت ۵ گزارش لاگ اخیر\n` +
        `▫️ <code>/ping</code> - تست سرعت پاسخگویی سرور`
      );
    } else if (cmd === "/status") {
      const accounts = Array.from(this.accounts.values());
      const onlineCount = Array.from(this.workers.values()).filter((w) => w.client?.connected).length;
      const memMb = Math.round(process.memoryUsage().rss / 1024 / 1024);
      const uptimeH = (process.uptime() / 3600).toFixed(1);

      await this.sendBotMessage(
        chatId,
        `📊 <b>وضعیت لحظه‌ای سرور و اسکریپت:</b>\n\n` +
        `🟢 سرور: آنلاین (آپتایم: ${uptimeH} ساعت)\n` +
        `💾 مصرف رم: ${memMb} مگابایت\n` +
        `📱 تعداد کل اکانت‌ها: ${accounts.length}\n` +
        `⚡ کارگرهای متصل: ${onlineCount}\n\n` +
        accounts.map((a) => `• ${a.firstName || a.phone} (<code>${a.phone}</code>): ${a.features.broadcast?.active ? "تبچی روشن 🚀" : "عادی 💤"}`).join("\n")
      );
    } else if (cmd === "/accounts") {
      const accounts = Array.from(this.accounts.values());
      if (accounts.length === 0) {
        await this.sendBotMessage(chatId, `هیچ اکانتی متصل نیست. از پنل وب اضافه کنید.`);
      } else {
        const textList = accounts.map((a, i) => `${i + 1}. <b>${a.firstName || "کاربر"}</b> (<code>${a.phone}</code>)\n   ساعت بیو: ${a.features?.self_time?.active ? "روشن" : "خاموش"} | تبچی: ${a.features?.broadcast?.active ? "روشن" : "خاموش"}`).join("\n\n");
        await this.sendBotMessage(chatId, `📱 <b>اکانت‌های تلگرام:</b>\n\n${textList}`);
      }
    } else if (cmd === "/tabchi on") {
      for (const phone of this.accounts.keys()) {
        this.startBroadcast(phone).catch(() => {});
      }
      await this.sendBotMessage(chatId, `🚀 تبچی و ارسال خودکار برای تمام اکانت‌ها <b>روشن</b> شد.`);
    } else if (cmd === "/tabchi off") {
      for (const phone of this.accounts.keys()) {
        this.stopBroadcast(phone);
      }
      await this.sendBotMessage(chatId, `⏸️ تبچی برای تمام اکانت‌ها <b>متوقف</b> شد.`);
    } else if (cmd === "/self on") {
      for (const [phone, acc] of this.accounts.entries()) {
        this.updateSelfTimeConfig(phone, true, acc.features?.self_time?.format || "HH:mm", acc.features?.self_time?.font_style || "bold").catch(() => {});
      }
      await this.sendBotMessage(chatId, ` ساعت و قابلیت‌های سلف برای تمام اکانت‌ها <b>فعال</b> شد.`);
    } else if (cmd === "/self off") {
      for (const [phone, acc] of this.accounts.entries()) {
        this.updateSelfTimeConfig(phone, false, acc.features?.self_time?.format || "HH:mm", acc.features?.self_time?.font_style || "bold").catch(() => {});
      }
      await this.sendBotMessage(chatId, `⏸️ ساعت و قابلیت‌های سلف <b>غیرفعال</b> شد.`);
    } else if (cmd === "/logs") {
      const lastLogs = this.logs.slice(-5).map((l) => `[${l.level.toUpperCase()}] ${l.message}`).join("\n");
      await this.sendBotMessage(chatId, `📋 <b>آخرین گزارشات:</b>\n\n<code>${lastLogs || "هیچ لاگی ثبت نشده است."}</code>`);
    } else if (cmd === "/ping") {
      await this.sendBotMessage(chatId, `🏓 پونگ! ربات و سرور با بالاترین سرعت متصل هستند.`);
    }
  }

  public getAccounts(): TelegramAccount[] {
    return Array.from(this.accounts.values());
  }

  public getAccount(phone: string): TelegramAccount | undefined {
    return this.accounts.get(phone);
  }
}

export const telegramManager = new TelegramManager();
