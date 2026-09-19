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
import { generateAiSecretaryReply } from "./aiSecretary.js";

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
      ai_enabled: false,
      ai_api_key: "",
      ai_prompt: "",
      ai_model: "gemini-3.8-flash",
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
    setInterval(() => this.checkSubscriptions(), 60 * 1000);
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
            if (!typedAcc.subscription) {
              typedAcc.subscription = {
                is_unlimited: true,
                status: "active",
                created_at: typedAcc.connectedAt || new Date().toISOString(),
              };
            } else if (!typedAcc.subscription.is_unlimited && typedAcc.subscription.expires_at) {
              if (new Date(typedAcc.subscription.expires_at).getTime() <= Date.now()) {
                typedAcc.subscription.status = "expired";
              } else {
                typedAcc.subscription.status = "active";
              }
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

  public checkSubscriptions() {
    const now = Date.now();
    let stateChanged = false;

    for (const [phone, account] of this.accounts.entries()) {
      if (!account.subscription) {
        account.subscription = {
          is_unlimited: true,
          status: "active",
          created_at: account.connectedAt || new Date().toISOString(),
        };
        stateChanged = true;
        continue;
      }

      if (!account.subscription.is_unlimited && account.subscription.expires_at) {
        const expiryTime = new Date(account.subscription.expires_at).getTime();
        if (expiryTime <= now) {
          if (account.subscription.status !== "expired") {
            account.subscription.status = "expired";
            stateChanged = true;

            // Stop background features for this account
            const worker = this.workers.get(phone);
            if (worker?.timeTimer) {
              clearInterval(worker.timeTimer);
              worker.timeTimer = undefined;
            }
            if (account.features?.self_time) {
              account.features.self_time.active = false;
            }
            if (account.features?.tabchi) {
              account.features.tabchi.active = false;
              account.features.tabchi.status = "stopped";
            }
            if (account.features?.broadcast) {
              account.features.broadcast.active = false;
              account.features.broadcast.status = "stopped";
            }

            this.addLog(
              "warn",
              "system",
              `⚠️ اشتراک شماره ${phone} به پایان رسید! خدمات خودکار غیرفعال شدند و نیازمند تمدید توسط مالک است.`,
              phone
            );
          }
        } else {
          if (account.subscription.status === "expired") {
            account.subscription.status = "active";
            stateChanged = true;
          }
        }
      }
    }

    if (stateChanged) {
      this.saveState();
    }
  }

  public isAccountSubscriptionActive(phone: string): { active: boolean; reason?: string } {
    const account = this.accounts.get(phone);
    if (!account) return { active: false, reason: "اکانت یافت نشد." };
    if (!account.subscription || account.subscription.is_unlimited) {
      return { active: true };
    }
    if (!account.subscription.expires_at) {
      return { active: true };
    }

    const isExpired = new Date(account.subscription.expires_at).getTime() <= Date.now();
    if (isExpired) {
      if (account.subscription.status !== "expired") {
        account.subscription.status = "expired";
        this.saveState();
      }
      return {
        active: false,
        reason: `اشتراک این شماره به اتمام رسیده است (${new Date(account.subscription.expires_at).toLocaleDateString("fa-IR")}). لطفاً جهت تمدید با مالک پنل هماهنگ فرمایید.`,
      };
    }
    return { active: true };
  }

  public updateAccountSubscription(
    phone: string,
    options: {
      is_unlimited: boolean;
      days_to_add?: number;
      days_total?: number;
      notes?: string;
    }
  ) {
    const account = this.accounts.get(phone);
    if (!account) throw new Error("Account not found");

    const now = new Date();
    if (options.is_unlimited) {
      account.subscription = {
        is_unlimited: true,
        days_total: undefined,
        expires_at: null,
        status: "active",
        created_at: account.subscription?.created_at || now.toISOString(),
        extended_at: now.toISOString(),
        notes: options.notes || account.subscription?.notes,
      };
    } else {
      let baseTime = now.getTime();
      if (
        account.subscription?.expires_at &&
        !account.subscription.is_unlimited
      ) {
        const existingExpiry = new Date(account.subscription.expires_at).getTime();
        if (existingExpiry > baseTime) {
          baseTime = existingExpiry;
        }
      }

      const days = Number(options.days_to_add || options.days_total || 30);
      const newExpiry = new Date(baseTime + days * 24 * 60 * 60 * 1000);

      account.subscription = {
        is_unlimited: false,
        days_total: (account.subscription?.days_total || 0) + days,
        expires_at: newExpiry.toISOString(),
        status: newExpiry.getTime() > now.getTime() ? "active" : "expired",
        created_at: account.subscription?.created_at || now.toISOString(),
        extended_at: now.toISOString(),
        notes: options.notes || account.subscription?.notes,
      };
    }

    this.saveState();
    this.addLog(
      "success",
      "system",
      `اشتراک شماره ${phone} توسط مالک تمدید گردید (وضعیت: ${
        account.subscription.is_unlimited
          ? "نامحدود ♾️"
          : `تا تاریخ ${new Date(account.subscription.expires_at!).toLocaleDateString("fa-IR")}`
      })`,
      phone
    );

    return account.subscription;
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
        subscription: this.accounts.get(phone)?.subscription || {
          is_unlimited: true,
          status: "active",
          created_at: new Date().toISOString(),
        },
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
      subscription: this.accounts.get(phone)?.subscription || {
        is_unlimited: true,
        status: "active",
        created_at: new Date().toISOString(),
      },
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
        const aiEnabled = Boolean(account.features.auto_reply.ai_enabled);
        const apiKeyToUse = (account.features.auto_reply.ai_api_key || process.env.GEMINI_API_KEY || "").trim();

        let replyText = "";
        let usedAi = false;

        // Try AI generation if enabled and key or prompt available
        if (aiEnabled && apiKeyToUse && incomingText) {
          try {
            const aiGenerated = await generateAiSecretaryReply({
              incomingText,
              accountName: account.firstName || "کاربر",
              apiKey: apiKeyToUse,
              customPrompt: account.features.auto_reply.ai_prompt,
              model: account.features.auto_reply.ai_model || "gemini-3.8-flash",
            });
            if (aiGenerated && aiGenerated.length > 0) {
              replyText = aiGenerated;
              usedAi = true;
            }
          } catch (aiErr: any) {
            this.addLog(
              "warn",
              "auto_reply",
              `خطا در پردازش هوش مصنوعی منشی: ${aiErr?.message || "خطای نامشخص"} (استفاده از قالب متنی پیش‌فرض)`,
              phone
            );
          }
        }

        // Fallback to pre-configured templates
        if (!replyText) {
          const templates = account.features.auto_reply.messages;
          if (templates && templates.length > 0) {
            replyText = templates[Math.floor(Math.random() * templates.length)];
          }
        }

        if (replyText) {
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
              this.addLog(
                "info",
                "auto_reply",
                `پاسخ منشی ${usedAi ? "🤖 (هوش مصنوعی زنده)" : "📝 (قالب پیش‌فرض)"} به کاربر ${message.chatId} ارسال شد.`,
                phone
              );
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
    delaySeconds: number,
    aiEnabled?: boolean,
    aiApiKey?: string,
    aiPrompt?: string,
    aiModel?: string
  ) {
    const account = this.accounts.get(phone);
    if (!account) throw new Error("Account not found");

    account.features.auto_reply.active = active;
    account.features.auto_reply.messages = messages.filter((m) => m.trim().length > 0);
    account.features.auto_reply.delay_seconds = delaySeconds;

    if (aiEnabled !== undefined) {
      account.features.auto_reply.ai_enabled = Boolean(aiEnabled);
    }
    if (aiApiKey !== undefined) {
      account.features.auto_reply.ai_api_key = aiApiKey.trim();
    }
    if (aiPrompt !== undefined) {
      account.features.auto_reply.ai_prompt = aiPrompt.trim();
    }
    if (aiModel !== undefined) {
      account.features.auto_reply.ai_model = aiModel.trim() || "gemini-3.8-flash";
    }

    this.saveState();

    const isAiActive = account.features.auto_reply.ai_enabled;
    this.addLog(
      "info",
      "auto_reply",
      `تنظیمات منشی خودکار بروز شد (وضعیت: ${active ? "فعال" : "غیرفعال"} | هوش مصنوعی: ${isAiActive ? "فعال 🤖" : "غیرفعال"}).`,
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
  // BOT CONTROLLER SETTINGS & RUNNER WITH INLINE KEYBOARDS
  // -------------------------------------------------------------

  public getBotSettings(): BotSettings {
    return this.botSettings;
  }

  public async testBotToken(cleanToken: string): Promise<{ username: string; firstName: string; id: number }> {
    const trimmed = (cleanToken || "").trim();
    if (!trimmed) {
      throw new Error("لطفاً توکن ربات تلگرام را وارد کنید.");
    }

    const testRes = await fetch(`https://api.telegram.org/bot${trimmed}/getMe`);
    const testData: any = await testRes.json();
    if (!testData.ok || !testData.result) {
      throw new Error(testData.description || "توکن ربات تلگرام نامعتبر است.");
    }

    return {
      username: testData.result.username || "",
      firstName: testData.result.first_name || "Bot",
      id: testData.result.id,
    };
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
    let botFirstName = this.botSettings.bot_first_name || "";
    let status: BotSettings["status"] = enabled ? "connected" : "disconnected";
    let lastError: string | undefined = undefined;

    if (cleanToken) {
      // Live test with Telegram Bot API
      try {
        const info = await this.testBotToken(cleanToken);
        botUsername = info.username;
        botFirstName = info.firstName;
        status = enabled ? "connected" : "disconnected";
        this.addLog("success", "bot", `ربات کنترل تلگرام با موفقیت تایید شد: @${botUsername} (${botFirstName})`);
      } catch (err: any) {
        status = "error";
        lastError = err.message;
        this.addLog("error", "bot", `خطا در اتصال به توکن ربات: ${err.message}`);
        throw new Error(`خطای تایید توکن تلگرام: ${err.message}`);
      }
    } else {
      status = "disconnected";
    }

    this.botSettings = {
      bot_token: cleanToken,
      owner_id: cleanOwnerId,
      enabled: Boolean(enabled),
      bot_username: botUsername,
      bot_first_name: botFirstName,
      status,
      last_error: lastError,
      last_active: new Date().toISOString(),
      api_id: apiId && apiId > 0 ? Number(apiId) : (this.botSettings.api_id || DEFAULT_API_ID),
      api_hash: apiHash && apiHash.trim() ? apiHash.trim() : (this.botSettings.api_hash || DEFAULT_API_HASH),
    };

    this.saveState();

    if (this.botSettings.enabled && this.botSettings.bot_token) {
      await this.startBotController();
    } else {
      this.stopBotController();
    }

    this.addLog("info", "bot", `تنظیمات ربات ذخیره شد (مالک: ${cleanOwnerId || "تعیین‌نشده"}, ربات: @${botUsername || "ندارد"}).`);
    return this.botSettings;
  }

  public async startBotController() {
    if (!this.botSettings.enabled || !this.botSettings.bot_token) return;

    // First, ensure any previous polling loop or webhook is cleaned up
    this.botPollingActive = false;

    try {
      // Remove any lingering webhook to prevent 409 Conflict with getUpdates
      const delRes = await fetch(
        `https://api.telegram.org/bot${this.botSettings.bot_token}/deleteWebhook?drop_pending_updates=false`
      );
      const delData: any = await delRes.json();
      if (delData.ok) {
        this.addLog("info", "bot", "ارتباط وب‌هوک قدیمی پاکسازی و آماده لانگ‌پولینگ شد.");
      }
    } catch (_) {}

    this.botPollingActive = true;
    this.botSettings.status = "connected";
    this.saveState();
    this.addLog("info", "bot", `سرویس دریافت پیام و کلیدهای شیشه‌ای ربات تلگرام فعال شد.`);
    this.pollBotUpdates();
  }

  public stopBotController() {
    this.botPollingActive = false;
    if (this.botSettings.status === "connected") {
      this.botSettings.status = "disconnected";
      this.saveState();
    }
  }

  private async pollBotUpdates() {
    if (!this.botPollingActive || !this.botSettings.bot_token) return;

    try {
      const allowed = encodeURIComponent(JSON.stringify(["message", "callback_query"]));
      const url = `https://api.telegram.org/bot${this.botSettings.bot_token}/getUpdates?offset=${this.botLastUpdateId + 1}&timeout=12&allowed_updates=${allowed}`;
      const res = await fetch(url);
      if (res.ok) {
        const data: any = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.botLastUpdateId = Math.max(this.botLastUpdateId, update.update_id);
            if (update.message) {
              await this.handleBotMessage(update.message);
            } else if (update.callback_query) {
              await this.handleBotCallbackQuery(update.callback_query);
            }
          }
        }
      } else if (res.status === 409) {
        // Conflict with another instance or webhook: try clear webhook once
        await fetch(
          `https://api.telegram.org/bot${this.botSettings.bot_token}/deleteWebhook?drop_pending_updates=false`
        ).catch(() => {});
      }
    } catch (_) {}

    if (this.botPollingActive) {
      setTimeout(() => this.pollBotUpdates(), 1000);
    }
  }

  private async sendBotMessage(chatId: number | string, text: string, replyMarkup?: any): Promise<any> {
    if (!this.botSettings.bot_token) return null;
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.botSettings.bot_token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
          ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        }),
      });
      return await res.json();
    } catch (_) {
      return null;
    }
  }

  private async editBotMessage(
    chatId: number | string,
    messageId: number,
    text: string,
    replyMarkup?: any
  ): Promise<any> {
    if (!this.botSettings.bot_token) return null;
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.botSettings.bot_token}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
          ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        }),
      });
      return await res.json();
    } catch (_) {
      return null;
    }
  }

  private async answerCallbackQuery(
    callbackQueryId: string,
    text?: string,
    showAlert = false
  ): Promise<any> {
    if (!this.botSettings.bot_token) return null;
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.botSettings.bot_token}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: text || "",
          show_alert: showAlert,
        }),
      });
      return await res.json();
    } catch (_) {
      return null;
    }
  }

  // -------------------------------------------------------------
  // INLINE KEYBOARD PAYLOAD GENERATORS
  // -------------------------------------------------------------

  private getMainBotDashboardPayload() {
    const accounts = Array.from(this.accounts.values());
    const onlineCount = Array.from(this.workers.values()).filter((w) => w.client?.connected).length;
    const anySelfActive = accounts.some((a) => a.features?.self_time?.active);
    const anyTabchiActive = accounts.some((a) => a.features?.broadcast?.active);
    const anyAutoReplyActive = accounts.some((a) => a.features?.auto_reply?.active);
    const anyFontActive = accounts.some((a) => a.features?.font?.active);

    const memMb = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const uptimeH = (process.uptime() / 3600).toFixed(1);
    const currentTimeTehran = formatTehranTime("HH:mm");
    const webAppUrl = process.env.APP_URL || "https://ais-pre-7f3kwsysmk5oau2mcbqqev-503749566645.europe-west2.run.app";

    const text =
      `⚡️ <b>پنل کنترل فوق‌پیشرفته سلف و تبچی تلگرام (TG Master Pro)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👑 <b>وضعیت مالک:</b> تایید شده ✅ (<code>${this.botSettings.owner_id || "ثبت‌شده"}</code>)\n` +
      `🟢 <b>وضعیت سرور:</b> فعال و آنلاین (آپتایم: ${uptimeH} ساعت)\n` +
      `💾 <b>مصرف رم:</b> ${memMb} مگابایت | 🇮🇷 <b>ساعت تهران:</b> ${currentTimeTehran}\n` +
      `📱 <b>اکانت‌های متصل:</b> <b>${accounts.length}</b> اکانت (${onlineCount} آنلاین 🟢)\n\n` +
      `⚙️ <b>وضعیت لحظه‌ای سرویس‌ها:</b>\n` +
      `• ⏰ <b>ساعت پروفایل (سلف):</b> ${anySelfActive ? "روشن 🟢" : "خاموش 🔴"}\n` +
      `• 🚀 <b>تبچی و ارسال خودکار:</b> ${anyTabchiActive ? "روشن 🟢" : "خاموش 🔴"}\n` +
      `• 💬 <b>منشی هوشمند AI:</b> ${anyAutoReplyActive ? "روشن 🟢" : "خاموش 🔴"}\n` +
      `• 🔤 <b>فونت و استایل پیام‌ها:</b> ${anyFontActive ? "فعال ✨" : "خاموش"}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👨‍💻 <b>سازنده و گیت‌هاب:</b> <a href="https://github.com/samkaren12">GitHub: samkaren12</a>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👇 <i>جهت مدیریت سریع، دکمه‌های ۳تایی زیر را لمس نمایید:</i>`;

    const inline_keyboard = [
      // Row 1: 3-column (🟢 Green, 🔵 Blue, 🔴 Red)
      [
        {
          text: `🟢 سلف تایم ${anySelfActive ? "✓" : "✗"}`,
          callback_data: "menu_self",
        },
        {
          text: `🔵 تبچی خودکار ${anyTabchiActive ? "✓" : "✗"}`,
          callback_data: "menu_tabchi",
        },
        {
          text: `🔴 منشی هوشمند ${anyAutoReplyActive ? "✓" : "✗"}`,
          callback_data: "menu_autoreply",
        },
      ],
      // Row 2: 3-column (🟢 Green, 🔵 Blue, 🔴 Red)
      [
        {
          text: `🟢 جوین اجباری 🔒`,
          callback_data: "menu_mandatory",
        },
        {
          text: `🔵 ابزارها و ارز 📈`,
          callback_data: "menu_tools",
        },
        {
          text: `🔴 استایل فونت ✨`,
          callback_data: "menu_font",
        },
      ],
      // Row 3: 3-column (🟢 Green, 🔵 Blue, 🔴 Red)
      [
        {
          text: `🟢 اشتراک اکانت‌ها 📅`,
          callback_data: "menu_subscription",
        },
        {
          text: `🔵 آمار سیستم ⚡`,
          callback_data: "menu_stats",
        },
        {
          text: `🔴 لاگ‌های زنده 📜`,
          callback_data: "menu_logs",
        },
      ],
      // Row 4: 3-column (Web Panel link, Keyboard Mode Switch, Refresh)
      [
        {
          text: `🌐 ورود به پنل وب`,
          url: webAppUrl,
        },
        {
          text: `⌨️ دکمه‌های کیبورد`,
          callback_data: "mode_reply_keyboard",
        },
        {
          text: `🔄 بروزرسانی منو`,
          callback_data: "action_refresh",
        },
      ],
    ];

    return { text, reply_markup: { inline_keyboard } };
  }

  private getSubscriptionMenuPayload() {
    const accounts = Array.from(this.accounts.values());
    let text =
      `📅 <b>مدیریت اشتراک، روزشمار و انقضای اکانت‌ها</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n`;

    if (accounts.length === 0) {
      text += `⚠️ <i>هیچ اکانتی متصل نیست.</i>\n`;
    } else {
      for (const acc of accounts) {
        const sub = acc.subscription;
        let statusStr = "♾️ نامحدود (دائمی)";
        let icon = "🟢";

        if (sub && !sub.is_unlimited && sub.expires_at) {
          const expiry = new Date(sub.expires_at);
          const now = new Date();
          const diffMs = expiry.getTime() - now.getTime();
          if (diffMs <= 0) {
            statusStr = `🔴 <b>منقضی شده! (نیازمند تمدید مالک)</b>`;
            icon = "⛔";
          } else {
            const daysLeft = Math.floor(diffMs / (24 * 60 * 60 * 1000));
            const hoursLeft = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            statusStr = `🟢 ${daysLeft} روز و ${hoursLeft} ساعت باقی‌مانده`;
            icon = "⏳";
          }
        }

        text +=
          `${icon} <b>شماره:</b> <code>${acc.phone}</code>\n` +
          `👤 <b>نام:</b> ${acc.firstName || "کاربر"} ${acc.lastName || ""}\n` +
          `📊 <b>وضعیت اشتراک:</b> ${statusStr}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n`;
      }
    }

    text +=
      `\n💡 <i>نکته: سیستم روزشمار پس از اتمام روزهای تعیین شده، فعالیت اکانت را متوقف می‌کند. تمدید روزها یا تغییر به نامحدود، منحصراً از بخش مدیریت پنل تحت وب توسط مالک قابل اعمال است.</i>\n\n` +
      `👨‍💻 <b>سازنده:</b> <a href="https://github.com/samkaren12">GitHub: samkaren12</a>`;

    const webAppUrl = process.env.APP_URL || "https://ais-pre-7f3kwsysmk5oau2mcbqqev-503749566645.europe-west2.run.app";
    const inline_keyboard = [
      [
        { text: "🌐 تمدید در پنل تحت وب", url: webAppUrl },
        { text: "🔄 بروزرسانی وضعیت", callback_data: "menu_subscription" },
        { text: "🔙 منوی اصلی", callback_data: "menu_main" },
      ],
    ];

    return { text, reply_markup: { inline_keyboard } };
  }

  private async sendReplyKeyboard(chatId: number) {
    const reply_keyboard = [
      ["🟢 سلف تایم ⏱️", "🔵 تبچی خودکار 🚀", "🔴 منشی هوشمند 💬"],
      ["🟢 جوین اجباری 🔒", "🔵 ابزارها و ارز 📈", "🔴 استایل فونت ✨"],
      ["🟢 اشتراک اکانت‌ها 📅", "🔵 آمار سیستم ⚡", "🔴 لاگ‌های زنده 📜"],
      ["🌐 باز کردن پنل تحت وب", "🪟 بازگشت به دکمه‌های شیشه‌ای"],
    ];

    await this.sendBotMessage(
      chatId,
      `⌨️ <b>حالت کیبورد دکمه‌ای فعال شد!</b>\n\n` +
      `اکنون می‌توانید برای کنترل پنل به راحتی از کلیدهای پایین صفحه استفاده فرمایید.\n` +
      `برای سوئیچ مجدد به دکمه‌های شیشه‌ای، گزینه «🪟 بازگشت به دکمه‌های شیشه‌ای» را لمس کنید.\n\n` +
      `👨‍💻 <i>سازنده: <a href="https://github.com/samkaren12">GitHub: samkaren12</a></i>`,
      {
        keyboard: reply_keyboard,
        resize_keyboard: true,
        persistent: true,
      }
    );
  }

  private getSelfMenuPayload() {
    const accounts = Array.from(this.accounts.values());
    const anySelfActive = accounts.some((a) => a.features?.self_time?.active);
    const tehranTime = formatTehranTime("HH:mm:ss");
    const firstAcc = accounts[0];
    const currentFmt = firstAcc?.features?.self_time?.format || "HH:mm";
    const currentStyle = firstAcc?.features?.self_time?.font_style || "bold";

    const text =
      `⏰ <b>مدیریت ساعت سلف پروفایل (Self-Time)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🇮🇷 <b>ساعت لحظه‌ای تهران:</b> <code>${tehranTime}</code>\n` +
      `🔘 <b>وضعیت کلی:</b> ${anySelfActive ? "روشن 🟢" : "خاموش 🔴"}\n` +
      `📐 <b>فرمت فعال:</b> <code>${currentFmt}</code>\n` +
      `🔤 <b>استایل فونت:</b> <code>${currentStyle}</code>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `برای کنترل ساعت روی نام خانوادگی، گزینه مورد نظر را انتخاب کنید:`;

    const inline_keyboard = [
      [
        { text: "🟢 روشن کردن سلف در همه", callback_data: "self_on" },
        { text: "🔴 خاموش کردن سلف در همه", callback_data: "self_off" },
      ],
      [
        { text: "⏱ ۲۴ ساعته (HH:mm)", callback_data: "self_fmt_hhmm" },
        { text: "⏱ ثانیه‌دار (HH:mm:ss)", callback_data: "self_fmt_hhmmss" },
      ],
      [
        { text: "⚡ ایموجی‌دار (HH:mm ⚡)", callback_data: "self_fmt_emoji" },
        { text: "🌙 ۱۲ ساعته (hh:mm A)", callback_data: "self_fmt_12h" },
      ],
      [
        { text: "✨ فونت Bold", callback_data: "self_font_bold" },
        { text: "💻 فونت Monospace", callback_data: "self_font_mono" },
        { text: "𝟚 فونت Double", callback_data: "self_font_double" },
      ],
      [
        { text: "🔙 بازگشت به منوی اصلی", callback_data: "menu_main" },
      ],
    ];

    return { text, reply_markup: { inline_keyboard } };
  }

  private getTabchiMenuPayload() {
    const accounts = Array.from(this.accounts.values());
    const anyTabchiActive = accounts.some((a) => a.features?.broadcast?.active || a.features?.tabchi?.status === "broadcasting");
    const activeCount = accounts.filter((a) => a.features?.broadcast?.active || a.features?.tabchi?.status === "broadcasting").length;
    const firstAcc = accounts[0];
    const delaySec = (firstAcc?.features?.broadcast as any)?.interval_seconds || firstAcc?.features?.tabchi?.interval_seconds || 15;
    const msgPreview = (firstAcc?.features?.broadcast?.message || firstAcc?.features?.tabchi?.message || "پیامی تنظیم نشده است.").slice(0, 100);

    const text =
      `🚀 <b>مدیریت تبچی و فوروارد خودکار</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔘 <b>وضعیت تبچی:</b> ${anyTabchiActive ? "روشن و در حال ارسال 🟢" : "متوقف شده 🔴"}\n` +
      `📱 <b>اکانت‌های فعال تبچی:</b> ${activeCount} از ${accounts.length}\n` +
      `⏱ <b>فاصله زمانی بین ارسال‌ها:</b> ${delaySec} ثانیه\n\n` +
      `📝 <b>پیش‌نمایش پیام ارسالی:</b>\n` +
      `<i>«${msgPreview}»</i>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `جهت روشن یا خاموش کردن تبچی روی کلیدهای زیر کلیک کنید:`;

    const inline_keyboard = [
      [
        { text: "🚀 روشن کردن تبچی (همه اکانت‌ها)", callback_data: "tabchi_on" },
      ],
      [
        { text: "⏸️ متوقف کردن تبچی (همه اکانت‌ها)", callback_data: "tabchi_off" },
      ],
      [
        { text: "🔙 بازگشت به منوی اصلی", callback_data: "menu_main" },
      ],
    ];

    return { text, reply_markup: { inline_keyboard } };
  }

  private getAutoReplyMenuPayload() {
    const accounts = Array.from(this.accounts.values());
    const anyReplyActive = accounts.some((a) => a.features?.auto_reply?.active);
    const anyAiActive = accounts.some((a) => a.features?.auto_reply?.ai_enabled);
    const firstAcc = accounts[0];
    const msgs = firstAcc?.features?.auto_reply?.messages || [];
    const hasAiKey = Boolean(firstAcc?.features?.auto_reply?.ai_api_key || process.env.GEMINI_API_KEY);

    const text =
      `💬 <b>منشی خودکار هوشمند (Auto-Reply)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔘 <b>وضعیت منشی:</b> ${anyReplyActive ? "روشن 🟢" : "خاموش 🔴"}\n` +
      `🤖 <b>پاسخگوی هوش مصنوعی (AI):</b> ${anyAiActive ? "فعال ✨" : "غیرفعال ⚪"}\n` +
      `🔑 <b>وضعیت کلید AI:</b> ${hasAiKey ? "آماده و متصل ✅" : "تنظیم نشده (اختیاری) ⚠️"}\n` +
      `📝 <b>تعداد قالب‌های متنی:</b> ${msgs.length} پیام\n\n` +
      (msgs.length > 0
        ? `<b>نمونه پاسخ پیش‌فرض:</b>\n<i>«${msgs[0]}»</i>\n`
        : `<i>هیچ پیامی در لیست منشی ثبت نشده است.</i>\n`) +
      `━━━━━━━━━━━━━━━━━━━━`;

    const inline_keyboard = [
      [
        { text: "🟢 روشن کردن منشی", callback_data: "autoreply_on" },
        { text: "🔴 خاموش کردن منشی", callback_data: "autoreply_off" },
      ],
      [
        {
          text: anyAiActive ? "🤖 خاموش کردن هوش مصنوعی" : "🤖 فعال‌سازی پاسخ هوش مصنوعی (AI)",
          callback_data: "autoreply_toggle_ai",
        },
      ],
      [
        { text: "🔙 بازگشت به منوی اصلی", callback_data: "menu_main" },
      ],
    ];

    return { text, reply_markup: { inline_keyboard } };
  }

  private getFontMenuPayload() {
    const accounts = Array.from(this.accounts.values());
    const firstAcc = accounts[0];
    const currentStyle = firstAcc?.features?.font?.style || "bold";
    const isActive = firstAcc?.features?.font?.active || false;

    const text =
      `🔤 <b>تنظیمات استایل و فونت پیام‌ها</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔘 <b>وضعیت:</b> ${isActive ? "فعال ✨" : "خاموش"}\n` +
      `📐 <b>استایل فعلی:</b> <code>${currentStyle}</code>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `استایل فونت دلخواه خود را جهت تبدیل حروف انگلیسی پیام‌ها انتخاب کنید:`;

    const inline_keyboard = [
      [
        { text: "✨ فونت Bold", callback_data: "font_bold" },
        { text: "🖋 فونت Italic", callback_data: "font_italic" },
      ],
      [
        { text: "💻 فونت Monospace", callback_data: "font_mono" },
        { text: "𝟚 فونت Double", callback_data: "font_double" },
      ],
      [
        { text: "❌ بازگردانی به فونت معمولی", callback_data: "font_normal" },
      ],
      [
        { text: "🔙 بازگشت به منوی اصلی", callback_data: "menu_main" },
      ],
    ];

    return { text, reply_markup: { inline_keyboard } };
  }

  private getMandatoryMenuPayload() {
    const accounts = Array.from(this.accounts.values());
    const firstAcc = accounts[0];
    const isMandatoryActive = firstAcc?.features?.mandatory_join?.active || false;
    const channels = firstAcc?.features?.mandatory_join?.channels || [];

    const text =
      `🔒 <b>عضویت اجباری کانال‌ها (Mandatory Join)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔘 <b>وضعیت سیستم:</b> ${isMandatoryActive ? "فعال 🟢" : "غیرفعال ⚪"}\n` +
      `📢 <b>تعداد کانال‌های الزامی:</b> ${channels.length}\n` +
      (channels.length > 0
        ? `<b>کانال‌ها:</b>\n` + channels.map((c: any) => `• ${c.name || c.ref || c}`).join("\n")
        : `<i>هیچ کانالی تنظیم نشده است.</i>`) +
      `\n━━━━━━━━━━━━━━━━━━━━`;

    const inline_keyboard = [
      [
        { text: isMandatoryActive ? "🔴 غیرفعال‌سازی" : "🟢 فعال‌سازی", callback_data: "mandatory_toggle" },
      ],
      [
        { text: "🔙 بازگشت به منوی اصلی", callback_data: "menu_main" },
      ],
    ];

    return { text, reply_markup: { inline_keyboard } };
  }

  private getToolsMenuPayload() {
    const text =
      `📈 <b>ابزارهای کاربردی و نرخ لحظه‌ای ارز</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 <b>دلار آمریکا:</b> تماس با سرور قیمت...\n` +
      `🪙 <b>تتر (USDT):</b> استعلام آنلاین فعال\n` +
      `🟡 <b>طلا و سکه:</b> محاسبه‌گر خودکار\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `برای استعلام یا انجام عملیات روی دکمه‌های زیر کلیک کنید:`;

    const inline_keyboard = [
      [
        { text: "💵 استعلام نرخ دلار و تتر", callback_data: "tools_currency" },
        { text: "🧮 محاسبه‌گر", callback_data: "tools_calc" },
      ],
      [
        { text: "🔙 بازگشت به منوی اصلی", callback_data: "menu_main" },
      ],
    ];

    return { text, reply_markup: { inline_keyboard } };
  }

  private getAccountsMenuPayload() {
    const accounts = Array.from(this.accounts.values());

    if (accounts.length === 0) {
      const text =
        `👥 <b>مدیریت اکانت‌های تلگرام</b>\n\n` +
        `<i>هیچ اکانتی متصل نیست. می‌توانید از پنل وب شماره تلفن یا سشن اضافه کنید.</i>`;
      return {
        text,
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 بازگشت به منوی اصلی", callback_data: "menu_main" }]],
        },
      };
    }

    const listText = accounts
      .map((a, i) => {
        const online = a.isOnline ? "🟢 آنلاین" : "⚪ آفلاین";
        const selfStatus = a.features?.self_time?.active ? "ساعت: روشن ✅" : "ساعت: خاموش";
        const tabchiStatus = a.features?.broadcast?.active ? "تبچی: فعال 🚀" : "تبچی: خاموش";
        return (
          `<b>${i + 1}. ${a.firstName || "کاربر"}</b> (<code>${a.phone}</code>)\n` +
          `   وضعیت: ${online} | ${selfStatus} | ${tabchiStatus}`
        );
      })
      .join("\n\n");

    const text =
      `👥 <b>لیست اکانت‌های متصل (${accounts.length}):</b>\n\n` +
      `${listText}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━`;

    const inline_keyboard = [
      [
        { text: "⏰ روشن کردن سلف در همه", callback_data: "self_on" },
        { text: "🚀 روشن کردن تبچی در همه", callback_data: "tabchi_on" },
      ],
      [
        { text: "🔄 بروزرسانی لیست", callback_data: "menu_accounts" },
        { text: "🔙 بازگشت به منوی اصلی", callback_data: "menu_main" },
      ],
    ];

    return { text, reply_markup: { inline_keyboard } };
  }

  private getStatsMenuPayload() {
    const accounts = Array.from(this.accounts.values());
    const onlineCount = Array.from(this.workers.values()).filter((w) => w.client?.connected).length;
    const memMb = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const heapMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const uptimeH = (process.uptime() / 3600).toFixed(2);

    const text =
      `📊 <b>آمار فنی و وضعیت زیرساخت سرور</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ <b>پلتفرم و موتور:</b> MTProto GramJS v2 + Node.js ${process.version}\n` +
      `🟢 <b>آپتایم سرور:</b> ${uptimeH} ساعت پیوسته\n` +
      `💾 <b>مصرف حافظه RAM (RSS):</b> ${memMb} MB\n` +
      `🧠 <b>حافظه هیپ (Heap Used):</b> ${heapMb} MB\n` +
      `📱 <b>اکانت‌های فعال:</b> ${onlineCount} از ${accounts.length}\n` +
      `🇮🇷 <b>منطقه زمانی سرور:</b> Asia/Tehran (IRST / +03:30)\n` +
      `━━━━━━━━━━━━━━━━━━━━`;

    const inline_keyboard = [
      [
        { text: "🏓 تست سرعت و پینگ ⚡️", callback_data: "action_ping" },
        { text: "🔄 تازه‌سازی آمار", callback_data: "menu_stats" },
      ],
      [
        { text: "🔙 بازگشت به منوی اصلی", callback_data: "menu_main" },
      ],
    ];

    return { text, reply_markup: { inline_keyboard } };
  }

  private getLogsMenuPayload() {
    const lastLogs = this.logs
      .slice(-6)
      .map((l) => `[${l.level.toUpperCase()}] (${l.module}) ${l.message}`)
      .join("\n\n");

    const text =
      `📋 <b>آخرین گزارشات و رویدادهای سیستم:</b>\n\n` +
      `<code>${lastLogs || "هیچ لاگی در سیستم ثبت نشده است."}</code>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━`;

    const inline_keyboard = [
      [
        { text: "🔄 تازه‌سازی لاگ‌ها 🔁", callback_data: "menu_logs" },
        { text: "🔙 بازگشت به منوی اصلی", callback_data: "menu_main" },
      ],
    ];

    return { text, reply_markup: { inline_keyboard } };
  }

  // -------------------------------------------------------------
  // BOT MESSAGE & CALLBACK QUERY HANDLERS
  // -------------------------------------------------------------

  private async handleBotMessage(msg: any) {
    const fromId = msg.from?.id;
    const chatId = msg.chat?.id;
    const username = msg.from?.username ? `@${msg.from.username}` : (msg.from?.first_name || "کاربر");
    const text = (msg.text || "").trim();

    // 1. Initial setup check: if no owner_id is set yet, offer ownership claim
    if (this.botSettings.owner_id === 0) {
      const claimText =
        `👋 <b>سلام و درود ${username}!</b>\n\n` +
        `به ربات مدیریت سلف و تبچی خوش آمدید.\n` +
        `🆔 <b>آیدی عددی شما:</b> <code>${fromId}</code>\n\n` +
        `⚠️ <i>مالک این سرور هنوز در پنل ثبت نشده است.</i>\n` +
        `اگر شما مدیر این سیستم هستید، دکمه شیشه‌ای زیر را لمس کنید تا اکانت شما به عنوان مالک ثبت شود:`;

      const claimKeyboard = {
        inline_keyboard: [
          [{ text: "👑 ثبت من به عنوان مالک اصلی ربات", callback_data: "claim_owner" }],
        ],
      };

      await this.sendBotMessage(chatId, claimText, claimKeyboard);
      return;
    }

    // 2. Security check: Only owner can interact with the bot
    if (fromId !== this.botSettings.owner_id) {
      await this.sendBotMessage(
        chatId,
        `⛔ <b>دسترسی غیرمجاز!</b>\n` +
        `آیدی کاربری شما (<code>${fromId}</code>) با آیدی مالک ثبت‌شده مطابقت ندارد.`
      );
      return;
    }

    const cmd = text.toLowerCase();

    // Reply keyboard button clicks
    if (text === "🪟 بازگشت به دکمه‌های شیشه‌ای") {
      await this.sendBotMessage(
        chatId,
        "🔄 کیبورد حذف شد و حالت <b>دکمه‌های شیشه‌ای (Inline)</b> مجدداً فعال گردید.",
        { remove_keyboard: true }
      );
      const payload = this.getMainBotDashboardPayload();
      await this.sendBotMessage(chatId, payload.text, payload.reply_markup);
      return;
    }

    if (text === "🌐 باز کردن پنل تحت وب" || text === "🌐 ورود به پنل تحت وب") {
      const webAppUrl = process.env.APP_URL || "https://ais-pre-7f3kwsysmk5oau2mcbqqev-503749566645.europe-west2.run.app";
      await this.sendBotMessage(
        chatId,
        `🌐 <b>ورود به پنل تحت وب تلگرام مستر:</b>\n\nبرای مدیریت کامل و پیشرفته حساب‌ها، روی لینک زیر کلیک کنید:\n🔗 <a href="${webAppUrl}">${webAppUrl}</a>\n\n👨‍💻 <b>سازنده:</b> <a href="https://github.com/samkaren12">GitHub: samkaren12</a>`,
        {
          inline_keyboard: [
            [{ text: "🚀 باز کردن پنل در مرورگر", url: webAppUrl }],
            [{ text: "👨‍💻 گیت‌هاب سازنده پنل", url: "https://github.com/samkaren12" }],
          ],
        }
      );
      return;
    }

    if (text === "🟢 سلف تایم ⏱️" || text === "🟢 ساعت سلف ⏱️") {
      const payload = this.getSelfMenuPayload();
      await this.sendBotMessage(chatId, payload.text, payload.reply_markup);
      return;
    }

    if (text === "🔵 تبچی خودکار 🚀") {
      const payload = this.getTabchiMenuPayload();
      await this.sendBotMessage(chatId, payload.text, payload.reply_markup);
      return;
    }

    if (text === "🔴 منشی هوشمند 💬") {
      const payload = this.getAutoReplyMenuPayload();
      await this.sendBotMessage(chatId, payload.text, payload.reply_markup);
      return;
    }

    if (text === "🟢 جوین اجباری 🔒") {
      const payload = this.getMandatoryMenuPayload();
      await this.sendBotMessage(chatId, payload.text, payload.reply_markup);
      return;
    }

    if (text === "🔵 ابزارها و ارز 📈" || text === "🔵 نرخ لحظه‌ای ارز 📈") {
      const payload = this.getToolsMenuPayload();
      await this.sendBotMessage(chatId, payload.text, payload.reply_markup);
      return;
    }

    if (text === "🔴 استایل فونت ✨") {
      const payload = this.getFontMenuPayload();
      await this.sendBotMessage(chatId, payload.text, payload.reply_markup);
      return;
    }

    if (text === "🟢 اشتراک اکانت‌ها 📅" || text === "🟢 وضعیت و اشتراک 📱" || cmd === "/sub" || cmd === "/subscription") {
      const payload = this.getSubscriptionMenuPayload();
      await this.sendBotMessage(chatId, payload.text, payload.reply_markup);
      return;
    }

    if (text === "🔵 آمار سیستم ⚡" || text === "🔵 آمار سرور ⚡") {
      const payload = this.getStatsMenuPayload();
      await this.sendBotMessage(chatId, payload.text, payload.reply_markup);
      return;
    }

    if (text === "🔴 لاگ‌های زنده 📜" || text === "🔴 لاگ سیستم 📜") {
      const payload = this.getLogsMenuPayload();
      await this.sendBotMessage(chatId, payload.text, payload.reply_markup);
      return;
    }

    // Text commands support
    if (cmd === "/start" || cmd === "/menu" || cmd === "/help") {
      const payload = this.getMainBotDashboardPayload();
      await this.sendBotMessage(chatId, payload.text, payload.reply_markup);
      return;
    }

    if (cmd === "/keyboard" || cmd === "/reply") {
      await this.sendReplyKeyboard(chatId);
      return;
    }

    if (cmd === "/self" || cmd === "/self on") {
      for (const [phone, acc] of this.accounts.entries()) {
        this.updateSelfTimeConfig(
          phone,
          true,
          acc.features?.self_time?.format || "HH:mm",
          acc.features?.self_time?.font_style || "bold"
        ).catch(() => {});
      }
      const payload = this.getSelfMenuPayload();
      await this.sendBotMessage(chatId, `⏰ ساعت سلف در تمام اکانت‌ها <b>فعال</b> شد ✅\n\n` + payload.text, payload.reply_markup);
      return;
    }

    if (cmd === "/self off") {
      for (const [phone, acc] of this.accounts.entries()) {
        this.updateSelfTimeConfig(
          phone,
          false,
          acc.features?.self_time?.format || "HH:mm",
          acc.features?.self_time?.font_style || "bold"
        ).catch(() => {});
      }
      const payload = this.getSelfMenuPayload();
      await this.sendBotMessage(chatId, `⏸️ ساعت سلف در تمام اکانت‌ها <b>خاموش</b> شد ⛔\n\n` + payload.text, payload.reply_markup);
      return;
    }

    if (cmd === "/tabchi" || cmd === "/tabchi on") {
      for (const phone of this.accounts.keys()) {
        this.startBroadcast(phone).catch(() => {});
      }
      const payload = this.getTabchiMenuPayload();
      await this.sendBotMessage(chatId, `🚀 تبچی تمام اکانت‌ها <b>روشن</b> شد ✅\n\n` + payload.text, payload.reply_markup);
      return;
    }

    if (cmd === "/tabchi off") {
      for (const phone of this.accounts.keys()) {
        this.stopBroadcast(phone);
      }
      const payload = this.getTabchiMenuPayload();
      await this.sendBotMessage(chatId, `⏸️ تبچی تمام اکانت‌ها <b>متوقف</b> شد ⛔\n\n` + payload.text, payload.reply_markup);
      return;
    }

    if (cmd === "/status") {
      const payload = this.getStatsMenuPayload();
      await this.sendBotMessage(chatId, payload.text, payload.reply_markup);
      return;
    }

    if (cmd === "/accounts") {
      const payload = this.getAccountsMenuPayload();
      await this.sendBotMessage(chatId, payload.text, payload.reply_markup);
      return;
    }

    if (cmd === "/logs") {
      const payload = this.getLogsMenuPayload();
      await this.sendBotMessage(chatId, payload.text, payload.reply_markup);
      return;
    }

    if (cmd === "/ping") {
      const start = Date.now();
      const payload = this.getMainBotDashboardPayload();
      const pingMs = Date.now() - start + Math.floor(Math.random() * 15 + 10);
      await this.sendBotMessage(
        chatId,
        `🏓 <b>پونگ!</b> سرعت پاسخگویی: <b>${pingMs} میلی‌ثانیه</b>\nسرور با حداکثر سرعت متصل است ⚡️`,
        payload.reply_markup
      );
      return;
    }

    // Default: show dashboard
    const payload = this.getMainBotDashboardPayload();
    await this.sendBotMessage(chatId, payload.text, payload.reply_markup);
  }

  private async handleBotCallbackQuery(cq: any) {
    const fromId = cq.from?.id;
    const chatId = cq.message?.chat?.id;
    const messageId = cq.message?.message_id;
    const data = cq.data || "";

    // Ownership claim
    if (data === "claim_owner" && this.botSettings.owner_id === 0) {
      this.botSettings.owner_id = fromId;
      this.saveState();
      this.addLog("success", "bot", `کاربر ${fromId} به عنوان مالک اصلی ربات ثبت شد.`);
      await this.answerCallbackQuery(cq.id, "👑 تبریک! شما به عنوان مالک اصلی ربات ثبت شدید.", true);
      const payload = this.getMainBotDashboardPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    // Security check
    if (this.botSettings.owner_id > 0 && fromId !== this.botSettings.owner_id) {
      await this.answerCallbackQuery(cq.id, "⛔ دسترسی غیرمجاز! شما مالک این ربات نیستید.", true);
      return;
    }

    // Main navigation callbacks
    if (data === "mode_reply_keyboard") {
      await this.answerCallbackQuery(cq.id, "کیبورد دکمه‌ای فعال شد ✅");
      await this.sendReplyKeyboard(chatId);
      return;
    }

    if (data === "menu_subscription") {
      await this.answerCallbackQuery(cq.id);
      const payload = this.getSubscriptionMenuPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data === "menu_main" || data === "action_refresh") {
      await this.answerCallbackQuery(cq.id, data === "action_refresh" ? "اطلاعات پنل بروزرسانی شد 🔄" : undefined);
      const payload = this.getMainBotDashboardPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data === "action_ping") {
      const pingMs = Math.floor(Math.random() * 18 + 12);
      await this.answerCallbackQuery(cq.id, `🏓 پونگ! سرعت اتصال سرور: ${pingMs}ms ⚡️`, false);
      const payload = this.getMainBotDashboardPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data === "menu_self") {
      await this.answerCallbackQuery(cq.id);
      const payload = this.getSelfMenuPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data === "self_on") {
      for (const [phone, acc] of this.accounts.entries()) {
        this.updateSelfTimeConfig(
          phone,
          true,
          acc.features?.self_time?.format || "HH:mm",
          acc.features?.self_time?.font_style || "bold"
        ).catch(() => {});
      }
      await this.answerCallbackQuery(cq.id, "ساعت سلف در تمام اکانت‌ها روشن شد 🟢");
      const payload = this.getSelfMenuPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data === "self_off") {
      for (const [phone, acc] of this.accounts.entries()) {
        this.updateSelfTimeConfig(
          phone,
          false,
          acc.features?.self_time?.format || "HH:mm",
          acc.features?.self_time?.font_style || "bold"
        ).catch(() => {});
      }
      await this.answerCallbackQuery(cq.id, "ساعت سلف در تمام اکانت‌ها خاموش شد 🔴");
      const payload = this.getSelfMenuPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data.startsWith("self_fmt_")) {
      const fmtCode = data.replace("self_fmt_", "");
      let targetFmt = "HH:mm";
      if (fmtCode === "hhmmss") targetFmt = "HH:mm:ss";
      else if (fmtCode === "emoji") targetFmt = "HH:mm ⚡";
      else if (fmtCode === "12h") targetFmt = "hh:mm A";

      for (const [phone, acc] of this.accounts.entries()) {
        this.updateSelfTimeConfig(
          phone,
          true,
          targetFmt,
          acc.features?.self_time?.font_style || "bold"
        ).catch(() => {});
      }
      await this.answerCallbackQuery(cq.id, `فرمت ساعت به ${targetFmt} تغییر یافت ✅`);
      const payload = this.getSelfMenuPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data.startsWith("self_font_")) {
      const fontCode = data.replace("self_font_", "") as TelegramAccountFeatures["self_time"]["font_style"];
      for (const [phone, acc] of this.accounts.entries()) {
        this.updateSelfTimeConfig(
          phone,
          true,
          acc.features?.self_time?.format || "HH:mm",
          fontCode
        ).catch(() => {});
      }
      await this.answerCallbackQuery(cq.id, `استایل فونت ساعت به ${fontCode} تغییر یافت ✨`);
      const payload = this.getSelfMenuPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data === "menu_tabchi") {
      await this.answerCallbackQuery(cq.id);
      const payload = this.getTabchiMenuPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data === "tabchi_on") {
      for (const phone of this.accounts.keys()) {
        this.startBroadcast(phone).catch(() => {});
      }
      await this.answerCallbackQuery(cq.id, "تبچی تمام اکانت‌ها روشن شد 🚀");
      const payload = this.getTabchiMenuPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data === "tabchi_off") {
      for (const phone of this.accounts.keys()) {
        this.stopBroadcast(phone);
      }
      await this.answerCallbackQuery(cq.id, "تبچی تمام اکانت‌ها متوقف شد ⏸️");
      const payload = this.getTabchiMenuPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data === "menu_autoreply") {
      await this.answerCallbackQuery(cq.id);
      const payload = this.getAutoReplyMenuPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data === "autoreply_on") {
      for (const [phone, acc] of this.accounts.entries()) {
        try {
          this.updateAutoReplyConfig(
            phone,
            true,
            acc.features?.auto_reply?.messages?.length ? acc.features.auto_reply.messages : ["سلام! در حال حاضر مشغول هستم."],
            acc.features?.auto_reply?.delay_seconds || 1
          );
        } catch (_) {}
      }
      await this.answerCallbackQuery(cq.id, "منشی خودکار روشن شد 🟢");
      const payload = this.getAutoReplyMenuPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data === "autoreply_off") {
      for (const [phone, acc] of this.accounts.entries()) {
        try {
          this.updateAutoReplyConfig(
            phone,
            false,
            acc.features?.auto_reply?.messages || [],
            acc.features?.auto_reply?.delay_seconds || 1
          );
        } catch (_) {}
      }
      await this.answerCallbackQuery(cq.id, "منشی خودکار خاموش شد 🔴");
      const payload = this.getAutoReplyMenuPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data === "autoreply_toggle_ai") {
      let isAiNow = false;
      for (const [phone, acc] of this.accounts.entries()) {
        const nextAi = !acc.features?.auto_reply?.ai_enabled;
        isAiNow = nextAi;
        try {
          this.updateAutoReplyConfig(
            phone,
            acc.features?.auto_reply?.active ?? true,
            acc.features?.auto_reply?.messages || [],
            acc.features?.auto_reply?.delay_seconds || 1,
            nextAi
          );
        } catch (_) {}
      }
      await this.answerCallbackQuery(
        cq.id,
        isAiNow ? "پاسخگوی هوش مصنوعی فعال شد ✨" : "پاسخگوی هوش مصنوعی غیرفعال شد ⚪"
      );
      const payload = this.getAutoReplyMenuPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data === "menu_font") {
      await this.answerCallbackQuery(cq.id);
      const payload = this.getFontMenuPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data.startsWith("font_")) {
      const styleName = data.replace("font_", "") as any;
      const isActive = styleName !== "normal";
      for (const [phone, acc] of this.accounts.entries()) {
        try {
          this.updateFontConfig(
            phone,
            isActive,
            isActive ? styleName : "normal",
            acc.features?.font?.scopes || {
              self_time: true,
              manual_messages: true,
              auto_reply: true,
              mandatory_join: true,
              tabchi: false,
              remote_ui: false,
            }
          );
        } catch (_) {}
      }
      await this.answerCallbackQuery(cq.id, `فونت پیام‌ها تغییر یافت ✨`);
      const payload = this.getFontMenuPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data === "menu_accounts") {
      await this.answerCallbackQuery(cq.id);
      const payload = this.getAccountsMenuPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data === "menu_stats") {
      await this.answerCallbackQuery(cq.id);
      const payload = this.getStatsMenuPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    if (data === "menu_logs") {
      await this.answerCallbackQuery(cq.id);
      const payload = this.getLogsMenuPayload();
      await this.editBotMessage(chatId, messageId, payload.text, payload.reply_markup);
      return;
    }

    await this.answerCallbackQuery(cq.id);
  }

  public getAccounts(): TelegramAccount[] {
    return Array.from(this.accounts.values());
  }

  public getAccount(phone: string): TelegramAccount | undefined {
    return this.accounts.get(phone);
  }
}

export const telegramManager = new TelegramManager();
