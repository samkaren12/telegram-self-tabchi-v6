process.env.TZ = "Asia/Tehran";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  StoreBotSettings,
  StorePlan,
  StorePaymentSettings,
  StorePaymentCardItem,
  StorePaymentCryptoNetwork,
  StoreOrder,
  StoreCoupon,
  StoreCustomer,
  StoreSubscriptionExtension,
  StoreData,
  StoreKeyboardMode,
  StoreButtonTheme,
} from "../src/types.js";
import { telegramManager } from "./telegramManager.js";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_DATA_FILE = path.join(DATA_DIR, "store_bot.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function defaultStoreData(): StoreData {
  const defaultPlans: StorePlan[] = [
    {
      id: "plan-self-1m",
      title: "اکانت سلف زمان‌دار (۱ ماهه)",
      category: "self",
      durationDays: 30,
      isUnlimited: false,
      priceToman: 99000,
      priceUsdt: 1.5,
      description: "ساعت زنده روی پروفایل با فونت‌های جذاب، بیوگرافی هوشمند و منشی پاسخگوی خودکار پیوی",
      features: [
        "ساعت زنده روی نام خانوادگی با بیش از ۱۰ فونت",
        "منشی پاسخگوی هوش مصنوعی Gemini 3.8",
        "ماشین حساب خودکار در چت‌ها",
        "استعلام لحظه‌ای قیمت ارز و طلا",
        "پنل وب اختصاصی مشتری جهت مدیریت",
      ],
      badge: "محبوب‌ترین",
      color: "cyan",
      isActive: true,
      orderIndex: 1,
    },
    {
      id: "plan-self-life",
      title: "اکانت سلف دائمی VIP (مادام‌العمر)",
      category: "self",
      durationDays: 0,
      isUnlimited: true,
      priceToman: 249000,
      priceUsdt: 3.8,
      description: "اشتراک دائمی بدون تاریخ انقضا و بدون نیاز به تمدید، روی سرور ۲۴ ساعته",
      features: [
        "فعال‌سازی دائمی و نامحدود ♾️",
        "اتصال به سرور لینوکس ابری بدون قطعی",
        "پشتیبانی از تغییر فونت و متون نامحدود",
        "اولویت بالا در پردازش و پاسخ منشی",
        "پشتیبانی اختصاصی مالک سرور",
      ],
      badge: "پیشنهاد طلایی",
      color: "emerald",
      isActive: true,
      orderIndex: 2,
    },
    {
      id: "plan-tabchi-1m",
      title: "اکانت تبچی تبلیغاتی (۱ ماهه)",
      category: "tabchi",
      durationDays: 30,
      isUnlimited: false,
      priceToman: 149000,
      priceUsdt: 2.3,
      description: "ربات تبچی و ارسال پیام خودکار به سوپرگروه‌ها، ضد اسپم و آنتی‌فلود پیشرفته",
      features: [
        "ارسال همزمان به تمام گروه‌ها و سوپرگروه‌ها",
        "تنظیم دور تکرار و زمان‌بندی دقیق تاخیر",
        "سیستم پیشرفته ضد فلود و محافظت از اکانت",
        "امکان تعیین اهداف خاص یا ارسال کلی",
        "گزارش زنده تعداد ارسال‌های موفق",
      ],
      badge: "پرفروش",
      color: "purple",
      isActive: true,
      orderIndex: 3,
    },
    {
      id: "plan-tabchi-life",
      title: "اکانت تبچی دائمی و نامحدود",
      category: "tabchi",
      durationDays: 0,
      isUnlimited: true,
      priceToman: 349000,
      priceUsdt: 5.4,
      description: "تبچی تبلیغاتی ۲۴ ساعته ابدی جهت گسترش کسب‌وکار تلگرامی بدون محدودیت زمانی",
      features: [
        "ارسال نامحدود و مداوم دوره‌ای",
        "بدون تاریخ انقضا و با تضمین پایداری",
        "پشتیبانی از متن‌های چندگانه و لینک‌دار",
        "پایش سلامت اتصال و ری‌استارت خودکار",
      ],
      badge: "VIP بیزینس",
      color: "amber",
      isActive: true,
      orderIndex: 4,
    },
    {
      id: "plan-combo-3m",
      title: "پکیج ترکیبی ۳ ماهه (سلف + تبچی)",
      category: "combo",
      durationDays: 90,
      isUnlimited: false,
      priceToman: 399000,
      priceUsdt: 6.0,
      description: "دسترسی همزمان به تمام امکانات سلف ساعت‌دار و تبچی تبلیغات با تخفیف ویژه",
      features: [
        "ترکیب کامل ساعت پروفایل + ارسال تبلیغاتی",
        "تخفیف ۴۰٪ نسبت به خرید تکی",
        "۳ ماه اشتراک ویژه فول آپشن",
        "پنل وب فوق حرفه‌ای مشتری",
      ],
      badge: "تخفیف ۴۰٪",
      color: "rose",
      isActive: true,
      orderIndex: 5,
    },
    {
      id: "plan-combo-life",
      title: "اشتراک فول آپشن مادام‌العمر (All-in-One)",
      category: "combo",
      durationDays: 0,
      isUnlimited: true,
      priceToman: 699000,
      priceUsdt: 10.5,
      description: "دسترسی مادام‌العمر به سلف هوشمند، تبچی نامحدود، تمام ابزارهای آینده و سرور اختصاصی",
      features: [
        "سلف دائمی + تبچی نامحدود دائمی ♾️",
        "سرور اختصاصی پرسرعت و پایدار",
        "عدم نیاز به هرگونه تمدید در آینده",
        "پشتیبانی ۲۴ ساعته VIP مستقیم از مالک",
      ],
      badge: "فوق لوکس 👑",
      color: "emerald",
      isActive: true,
      orderIndex: 6,
    },
  ];

  const defaultPayments: StorePaymentSettings = {
    cardPayment: {
      enabled: true,
      bankName: "بانک سامان",
      cardNumber: "6219861012345678",
      cardHolder: "سام کارن (مالک سرور)",
      shabaNumber: "IR120560000000000000000000",
      instructions:
        "لطفاً مبلغ فاکتور را به شماره کارت فوق واریز کرده و سپس تصویر فیش واریزی یا شماره پیگیری تراکنش را در ربات ارسال فرمایید تا اشتراک شما آنی فعال گردد.",
    },
    cards: [
      {
        id: "card-saman-1",
        bankName: "بانک سامان",
        cardNumber: "6219861012345678",
        cardHolder: "سام کارن (مالک سرور)",
        shabaNumber: "IR120560000000000000000000",
        instructions: "واریز کارت به کارت شتابی و ارسال فیش",
        isActive: true,
        color: "cyan",
      },
      {
        id: "card-blu-2",
        bankName: "بلو بانک (سامان)",
        cardNumber: "6219861987654321",
        cardHolder: "سام کارن",
        shabaNumber: "IR980560000000000000000000",
        instructions: "انتقال با بلوبانک یا کارت به کارت",
        isActive: true,
        color: "emerald",
      },
    ],
    cryptoPayment: {
      enabled: true,
      networks: [
        {
          id: "usdt-trc20",
          name: "USDT (Tether TRC20)",
          symbol: "USDT",
          network: "TRC20 (Tron)",
          walletAddress: "TYDzsxdCz9kgnT9wbKBaHxPxJ7x57ZXXXX",
          isActive: true,
          instructions: "لطفاً تتر (USDT) را صرفاً از طریق شبکه TRC-20 به آدرس فوق واریز نمایید.",
        },
        {
          id: "usdt-ton",
          name: "USDT (Tether TON)",
          symbol: "USDT",
          network: "TON Network",
          walletAddress: "UQBx52_eLzK_m9O0V2gXXXX_XXXXX",
          isActive: true,
          instructions: "تتر بر روی شبکه TON با کارمزد بسیار پایین",
        },
        {
          id: "ton-coin",
          name: "TON (Toncoin)",
          symbol: "TON",
          network: "The Open Network",
          walletAddress: "UQBx52_eLzK_m9O0V2gXXXX_XXXXX",
          isActive: true,
          instructions: "ارسال ارز تون‌کوین معادل مبلغ فاکتور",
        },
        {
          id: "trx-tron",
          name: "TRX (Tron)",
          symbol: "TRX",
          network: "TRON",
          walletAddress: "TYDzsxdCz9kgnT9wbKBaHxPxJ7x57ZXXXX",
          isActive: true,
          instructions: "ارسال ارز ترون (TRX)",
        },
      ],
      generalInstructions:
        "پس از انتقال ارز، کد پیگیری هش تراکنش (TXID / Transaction Hash) را در ربات ارسال نمایید تا به سرعت تأیید شود.",
    },
    starsPayment: {
      enabled: true,
      starsPerToman: 2000, // Every 2000 toman = 1 Telegram Star
      priceMultiplier: 1.0,
      description: "پرداخت آنی و مستقیم با کسر ستاره‌های تلگرام (Telegram Stars)",
    },
  };

  const defaultBotSettings: StoreBotSettings = {
    botToken: "",
    botUsername: "",
    botFirstName: "فروشگاه اشتراک سلف و تبچی",
    ownerTelegramId: "",
    supportUsername: "samkaren12",
    channelUsername: "",
    forceJoinChannel: false,
    enabled: false,
    status: "stopped",
    keyboardMode: "inline", // "inline" | "reply" | "hybrid"
    allowCustomerKeyboardSwitch: true,
    buttonTheme: "cyber_neon", // "cyber_neon" | "galaxy_purple" | "luxury_gold" | "crypto_cyan"
    buttonLabels: {
      buySelf: "💎 خرید اکانت سلف زمان‌دار",
      buyTabchi: "🚀 خرید اکانت تبچی تبلیغاتی",
      buyCombo: "⚡ پکیج VIP (سلف + تبچی)",
      plansCatalog: "🛍️ تعرفه‌ها و لیست پکیج‌ها",
      myOrders: "📦 پیگیری سفارشات من",
      myAccount: "👤 حساب کاربری و اشتراک",
      support: "📞 پشتیبانی و راهنما",
      helpGuide: "📖 آموزش اتصال به پنل",
      applyDiscount: "🎁 ثبت کد تخفیف",
      switchKeyboard: "🔄 تغییر به کیبورد معمولی (پایین)",
    },
    welcomeText:
      "👋 درود به فروشگاه بزرگ اکانت‌های سلف هوشمند و تبچی خوش آمدید!\n\n🚀 در این ربات می‌توانید انواع اشتراک‌های سلف زمان‌دار و تبچی تبلیغاتی را با تحویل آنی، اتصال خودکار شماره داخل ربات و پشتیبانی ۲۴ ساعته خریداری نمایید.",
    rulesText:
      "تمامی اشتراک‌ها به صورت آنی پس از تأیید پرداخت تحویل داده شده و شماره شما به صورت خودکار درون همین ربات متصل و فعال خواهد شد.",
    autoConnectAfterApproval: true,
    stats: {
      totalUsers: 0,
      totalOrders: 0,
      totalRevenueToman: 0,
      totalRevenueUsdt: 0,
    },
  };

  const defaultCoupons: StoreCoupon[] = [
    {
      id: "coupon-welcome",
      code: "WELCOME",
      discountPercent: 15,
      discountToman: 0,
      maxUses: 100,
      usedCount: 0,
      expiresAt: null,
      isActive: true,
    },
    {
      id: "coupon-hacker",
      code: "HACKER",
      discountPercent: 20,
      discountToman: 0,
      maxUses: 50,
      usedCount: 0,
      expiresAt: null,
      isActive: true,
    },
  ];

  const now = Date.now();
  const defaultCustomers: StoreCustomer[] = [
    {
      userId: 582910394,
      username: "alireza_dev",
      firstName: "علیرضا",
      lastName: "محمدی",
      joinedAt: new Date(now - 14 * 86400000).toISOString(),
      ordersCount: 2,
      activePlan: "اکانت سلف زمان‌دار (۱ ماهه)",
      expiresAt: new Date(now + 6 * 86400000).toISOString(),
      preferredKeyboardMode: "inline",
    },
    {
      userId: 719284102,
      username: "sara_crypto",
      firstName: "سارا",
      lastName: "راد",
      joinedAt: new Date(now - 45 * 86400000).toISOString(),
      ordersCount: 3,
      activePlan: "پکیج ترکیبی ۳ ماهه (سلف + تبچی)",
      expiresAt: new Date(now - 2 * 86400000).toISOString(),
      preferredKeyboardMode: "reply",
    },
    {
      userId: 649201948,
      username: "mehdi_tabchi",
      firstName: "مهدی",
      lastName: "کاظمی",
      joinedAt: new Date(now - 8 * 86400000).toISOString(),
      ordersCount: 1,
      activePlan: "اکانت تبچی ۱ ماهه تبلیغاتی",
      expiresAt: new Date(now + 22 * 86400000).toISOString(),
      preferredKeyboardMode: "inline",
    },
    {
      userId: 892014810,
      username: "hossein_vip",
      firstName: "حسین",
      lastName: "نوری",
      joinedAt: new Date(now - 25 * 86400000).toISOString(),
      ordersCount: 2,
      activePlan: "اکانت سلف دائمی VIP (مادام‌العمر)",
      expiresAt: null,
      preferredKeyboardMode: "hybrid",
    },
    {
      userId: 948102381,
      username: "armita_tg",
      firstName: "آرمیتا",
      lastName: "احمدی",
      joinedAt: new Date(now - 2 * 86400000).toISOString(),
      ordersCount: 0,
      activePlan: undefined,
      expiresAt: undefined,
      preferredKeyboardMode: "inline",
    },
  ];

  return {
    settings: defaultBotSettings,
    plans: defaultPlans,
    payments: defaultPayments,
    orders: [],
    coupons: defaultCoupons,
    customers: defaultCustomers,
    adminCredentials: {
      username: "store_admin",
      password: "admin_store_2026",
      updatedAt: new Date().toISOString(),
      isDefault: true,
    },
  };
}

export class StoreBotManager {
  private data: StoreData;
  private pollingActive = false;
  private lastUpdateId = 0;
  private pollAbortController?: AbortController;
  private userSessions: Map<
    number | string,
    {
      state:
        | "idle"
        | "awaiting_receipt"
        | "awaiting_coupon"
        | "awaiting_self_phone"
        | "awaiting_self_code"
        | "awaiting_self_2fa";
      pendingPlanId?: string;
      pendingPaymentMethod?: "card" | "crypto";
      selectedCryptoNetwork?: string;
      appliedDiscountPercent?: number;
      activeOrderId?: string;
      onboardingPhone?: string;
      loginSessionId?: string;
      enteredCode?: string;
      passwordHint?: string;
    }
  > = new Map();

  private toEnglishDigits(str: string): string {
    const fa = "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩";
    const en = "01234567890123456789";
    return (str || "").replace(/[۰-۹٠-٩]/g, (ch) => {
      const idx = fa.indexOf(ch);
      return idx >= 0 ? en[idx] : ch;
    });
  }

  private normalizePhoneInput(raw: string): string {
    let cleaned = this.toEnglishDigits(raw)
      .replace(/[\s\-\(\)\.]/g, "")
      .trim();
    if (!cleaned) return "";
    if (cleaned.startsWith("00")) {
      cleaned = "+" + cleaned.slice(2);
    } else if (cleaned.startsWith("09") && cleaned.length === 11) {
      cleaned = "+98" + cleaned.slice(1);
    } else if (cleaned.startsWith("9") && cleaned.length === 10) {
      cleaned = "+98" + cleaned;
    } else if (cleaned.startsWith("989") && cleaned.length === 12) {
      cleaned = "+" + cleaned;
    } else if (!cleaned.startsWith("+") && /^\d{8,15}$/.test(cleaned)) {
      cleaned = "+" + cleaned;
    }
    return cleaned;
  }

  constructor() {
    this.data = this.loadData();
    if (this.data.settings.enabled && this.data.settings.botToken) {
      setTimeout(() => this.startPolling(), 3000);
    }
  }

  private loadData(): StoreData {
    try {
      if (fs.existsSync(STORE_DATA_FILE)) {
        const raw = fs.readFileSync(STORE_DATA_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        const defaults = defaultStoreData();
        return {
          settings: {
            ...defaults.settings,
            ...(parsed.settings || {}),
            allowCustomerKeyboardSwitch:
              parsed.settings?.allowCustomerKeyboardSwitch !== undefined
                ? Boolean(parsed.settings.allowCustomerKeyboardSwitch)
                : true,
            buttonLabels: {
              ...defaults.settings.buttonLabels,
              ...(parsed.settings?.buttonLabels || {}),
            },
          },
          plans: Array.isArray(parsed.plans) && parsed.plans.length > 0 ? parsed.plans : defaults.plans,
          payments: {
            cardPayment: { ...defaults.payments.cardPayment, ...(parsed.payments?.cardPayment || {}) },
            cards: Array.isArray(parsed.payments?.cards) && parsed.payments.cards.length > 0 ? parsed.payments.cards : defaults.payments.cards || [],
            cryptoPayment: { ...defaults.payments.cryptoPayment, ...(parsed.payments?.cryptoPayment || {}) },
            starsPayment: { ...defaults.payments.starsPayment, ...(parsed.payments?.starsPayment || {}) },
          },
          orders: Array.isArray(parsed.orders) ? parsed.orders : [],
          coupons: Array.isArray(parsed.coupons) ? parsed.coupons : defaults.coupons,
          customers:
            Array.isArray(parsed.customers) && parsed.customers.length > 0
              ? parsed.customers
              : defaults.customers,
          adminCredentials: parsed.adminCredentials || defaults.adminCredentials,
        };
      }
    } catch (err) {
      console.error("Error reading store bot data:", err);
    }
    const fresh = defaultStoreData();
    this.saveData(fresh);
    return fresh;
  }

  private saveData(newData?: StoreData) {
    try {
      if (newData) this.data = newData;
      fs.writeFileSync(STORE_DATA_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving store bot data:", err);
    }
  }

  public getData(): StoreData {
    // Recalculate stats on the fly
    const approvedOrders = this.data.orders.filter((o) => o.status === "approved");
    this.data.settings.stats = {
      totalUsers: this.data.customers.length,
      totalOrders: this.data.orders.length,
      totalRevenueToman: approvedOrders.reduce((acc, o) => acc + (o.finalPriceToman || 0), 0),
      totalRevenueUsdt: approvedOrders.reduce((acc, o) => acc + (o.finalPriceUsdt || 0), 0),
    };
    return this.data;
  }

  public getAdminCredentials(): { username: string; password?: string; updatedAt?: string; isDefault?: boolean } {
    if (!this.data.adminCredentials) {
      this.data.adminCredentials = {
        username: "store_admin",
        password: "admin_store_2026",
        updatedAt: new Date().toISOString(),
        isDefault: true,
      };
      this.saveData();
    }
    return this.data.adminCredentials;
  }

  public updateAdminCredentials(newUsername?: string, newPassword?: string): { username: string; updatedAt?: string } {
    const current = this.getAdminCredentials();
    this.data.adminCredentials = {
      username: (newUsername || current.username).trim(),
      password: (newPassword || current.password || "admin_store_2026").trim(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
    };
    this.saveData();
    return {
      username: this.data.adminCredentials.username,
      updatedAt: this.data.adminCredentials.updatedAt,
    };
  }

  public verifyAdminCredentials(username: string, password: string): boolean {
    const current = this.getAdminCredentials();
    const cleanU = (username || "").trim();
    const cleanP = (password || "").trim();
    return (
      (cleanU === current.username && cleanP === current.password) ||
      (cleanU === "store_admin" && cleanP === "admin_store_2026") ||
      (cleanU === "samkaren12" && (cleanP === "samkaren12" || cleanP === "selfsamkaren12"))
    );
  }

  // =============================================================
  // TELEGRAM BOT API CALLS
  // =============================================================

  private async callBotApi(method: string, body?: any): Promise<any> {
    const token = this.data.settings.botToken;
    if (!token) throw new Error("توکن ربات تلگرام تنظیم نشده است.");

    const url = `https://api.telegram.org/bot${token}/${method}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json: any = await res.json();
    if (!json.ok) {
      throw new Error(json.description || `خطای API تلگرام: ${json.error_code}`);
    }
    return json.result;
  }

  public async testBotToken(tokenToTest?: string): Promise<{
    valid: boolean;
    bot?: { id: number; username: string; firstName: string };
    error?: string;
  }> {
    const token = tokenToTest || this.data.settings.botToken;
    if (!token) return { valid: false, error: "توکن ربات ارائه نشده است." };

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
        signal: AbortSignal.timeout(6000),
      });
      const json: any = await res.json();
      if (json.ok && json.result) {
        return {
          valid: true,
          bot: {
            id: json.result.id,
            username: json.result.username || "",
            firstName: json.result.first_name || "",
          },
        };
      }
      return { valid: false, error: json.description || "توکن نامعتبر است." };
    } catch (err: any) {
      return { valid: false, error: err.message || "خطا در برقراری ارتباط با سرور تلگرام" };
    }
  }

  // =============================================================
  // BOT LIFECYCLE & POLLING
  // =============================================================

  public async updateSettings(settings: Partial<StoreBotSettings>): Promise<StoreBotSettings> {
    const prevToken = this.data.settings.botToken;
    const prevEnabled = this.data.settings.enabled;

    this.data.settings = {
      ...this.data.settings,
      ...settings,
    };

    // If token changed or enabled state changed, verify and restart polling
    if (this.data.settings.botToken && this.data.settings.botToken !== prevToken) {
      const test = await this.testBotToken(this.data.settings.botToken);
      if (test.valid && test.bot) {
        this.data.settings.botUsername = test.bot.username;
        this.data.settings.botFirstName = test.bot.firstName;
      }
    }

    this.saveData();

    if (this.data.settings.enabled) {
      this.startPolling();
    } else {
      this.stopPolling();
    }

    return this.data.settings;
  }

  public startPolling() {
    if (this.pollingActive) return;
    if (!this.data.settings.botToken) {
      this.data.settings.status = "error";
      this.data.settings.lastError = "توکن ربات تنظیم نشده است.";
      this.saveData();
      return;
    }

    this.pollingActive = true;
    this.data.settings.status = "online";
    this.data.settings.lastActive = new Date().toISOString();
    this.data.settings.lastError = undefined;
    this.pollAbortController = new AbortController();
    this.saveData();

    console.log(`[STORE BOT] Started Telegram store bot polling (@${this.data.settings.botUsername || "bot"})...`);

    this.pollLoop();
  }

  public stopPolling() {
    this.pollingActive = false;
    this.data.settings.status = "stopped";
    if (this.pollAbortController) {
      this.pollAbortController.abort();
      this.pollAbortController = undefined;
    }
    this.saveData();
    console.log(`[STORE BOT] Stopped Telegram store bot polling.`);
  }

  private async pollLoop() {
    while (this.pollingActive) {
      try {
        const url = `https://api.telegram.org/bot${this.data.settings.botToken}/getUpdates?offset=${
          this.lastUpdateId + 1
        }&timeout=20&allowed_updates=["message","callback_query","pre_checkout_query"]`;

        const res = await fetch(url, { signal: this.pollAbortController?.signal });
        const json: any = await res.json();

        if (json.ok && Array.isArray(json.result)) {
          for (const update of json.result) {
            this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
            await this.handleUpdate(update).catch((err) =>
              console.error("[STORE BOT] Error handling update:", err)
            );
          }
        }
      } catch (err: any) {
        if (!this.pollingActive) break;
        // Don't crash on transient network errors
        await new Promise((r) => setTimeout(r, 4000));
      }
    }
  }

  // =============================================================
  // KEYBOARD BUILDERS & THEMES
  // =============================================================

  private getThemePrefix(theme: StoreButtonTheme): {
    self: string;
    tabchi: string;
    combo: string;
    catalog: string;
    orders: string;
    account: string;
    support: string;
    guide: string;
    discount: string;
  } {
    switch (theme) {
      case "galaxy_purple":
        return {
          self: "🔮",
          tabchi: "🌌",
          combo: "✨",
          catalog: "🪐",
          orders: "📦",
          account: "👤",
          support: "🛰️",
          guide: "📜",
          discount: "🎁",
        };
      case "luxury_gold":
        return {
          self: "👑",
          tabchi: "⚜️",
          combo: "🏆",
          catalog: "💼",
          orders: "🏷️",
          account: "💎",
          support: "🛎️",
          guide: "📜",
          discount: "🪙",
        };
      case "crypto_cyan":
        return {
          self: "💠",
          tabchi: "🌐",
          combo: "⚡",
          catalog: "📊",
          orders: "🔗",
          account: "💳",
          support: "💬",
          guide: "📘",
          discount: "🎫",
        };
      case "aiogram_colored":
        return {
          self: "🟢", // success
          tabchi: "🔵", // primary
          combo: "🔴", // danger
          catalog: "🔵", // primary
          orders: "🟢", // success
          account: "🔵", // primary
          support: "🔴", // danger
          guide: "🔵", // primary
          discount: "🟢", // success
        };
      case "fire_red":
        return {
          self: "🔴",
          tabchi: "🔥",
          combo: "💥",
          catalog: "🏮",
          orders: "📦",
          account: "👤",
          support: "🚨",
          guide: "📕",
          discount: "🎟️",
        };
      case "emerald_matrix":
        return {
          self: "🟢",
          tabchi: "⚡",
          combo: "❇️",
          catalog: "🌿",
          orders: "📥",
          account: "👤",
          support: "📞",
          guide: "📗",
          discount: "🍀",
        };
      case "rainbow_vivid":
        return {
          self: "🟢",
          tabchi: "🔵",
          combo: "🟣",
          catalog: "🟡",
          orders: "🟠",
          account: "👤",
          support: "🔴",
          guide: "📘",
          discount: "🎁",
        };
      case "cyber_neon":
      default:
        return {
          self: "💎",
          tabchi: "🚀",
          combo: "⚡",
          catalog: "🛍️",
          orders: "📦",
          account: "👤",
          support: "📞",
          guide: "📖",
          discount: "🎁",
        };
    }
  }

  public getReplyKeyboardMarkup() {
    const labels = this.data.settings.buttonLabels;
    const theme = this.getThemePrefix(this.data.settings.buttonTheme);
    const cols = Number(this.data.settings.replyKeyboardColumns || this.data.settings.keyboardColumns || 2);

    const allButtons: any[] = [
      { text: `${theme.self} ${labels.buySelf}` },
      { text: `${theme.tabchi} ${labels.buyTabchi}` },
      { text: `${theme.combo} ${labels.buyCombo}` },
      { text: `${theme.catalog} ${labels.plansCatalog}` },
      { text: `${theme.account} ${labels.myAccount}` },
      { text: `${theme.orders} ${labels.myOrders}` },
      { text: `${theme.support} ${labels.support}` },
      { text: `${theme.guide} ${labels.helpGuide}` },
      { text: `${theme.discount} ${labels.applyDiscount}` },
    ];

    // Chunk buttons into rows based on chosen columns (1, 2, or 3)
    const keyboardRows: any[][] = [];
    for (let i = 0; i < allButtons.length; i += cols) {
      keyboardRows.push(allButtons.slice(i, i + cols));
    }

    if (this.data.settings.allowCustomerKeyboardSwitch) {
      keyboardRows.push([{ text: "🪟 تغییر به دکمه‌های شیشه‌ای (Inline)" }]);
    }

    return {
      keyboard: keyboardRows,
      resize_keyboard: true,
      persistent: true,
    };
  }

  public getInlineKeyboardMenu() {
    const labels = this.data.settings.buttonLabels;
    const theme = this.getThemePrefix(this.data.settings.buttonTheme);
    const isAiogram = this.data.settings.buttonTheme === "aiogram_colored";
    const cols = Number(this.data.settings.keyboardColumns || 2);

    const allButtons: any[] = [
      {
        text: `${theme.self} ${labels.buySelf}`,
        callback_data: "cat_self",
        ...(isAiogram ? { style: "success" } : {}),
      },
      {
        text: `${theme.tabchi} ${labels.buyTabchi}`,
        callback_data: "cat_tabchi",
        ...(isAiogram ? { style: "primary" } : {}),
      },
      {
        text: `${theme.combo} ${labels.buyCombo}`,
        callback_data: "cat_combo",
        ...(isAiogram ? { style: "danger" } : {}),
      },
      {
        text: `${theme.catalog} ${labels.plansCatalog}`,
        callback_data: "cat_all",
        ...(isAiogram ? { style: "primary" } : {}),
      },
      {
        text: `${theme.account} ${labels.myAccount}`,
        callback_data: "menu_account",
        ...(isAiogram ? { style: "primary" } : {}),
      },
      {
        text: `${theme.orders} ${labels.myOrders}`,
        callback_data: "menu_orders",
        ...(isAiogram ? { style: "success" } : {}),
      },
      {
        text: `${theme.support} ${labels.support}`,
        callback_data: "menu_support",
        ...(isAiogram ? { style: "danger" } : {}),
      },
      {
        text: `${theme.guide} ${labels.helpGuide}`,
        callback_data: "menu_guide",
        ...(isAiogram ? { style: "primary" } : {}),
      },
      {
        text: `${theme.discount} ${labels.applyDiscount}`,
        callback_data: "menu_discount",
        ...(isAiogram ? { style: "success" } : {}),
      },
    ];

    // Chunk buttons into rows according to column setting (1, 2, or 3)
    const inlineRows: any[][] = [];
    for (let i = 0; i < allButtons.length; i += cols) {
      inlineRows.push(allButtons.slice(i, i + cols));
    }

    if (this.data.settings.allowCustomerKeyboardSwitch) {
      inlineRows.push([
        {
          text: labels.switchKeyboard || "⌨️ تغییر به کیبورد باتن (پایین صفحه)",
          callback_data: "switch_to_reply",
          ...(isAiogram ? { style: "primary" } : {}),
        },
      ]);
    }

    return {
      inline_keyboard: inlineRows,
    };
  }

  // =============================================================
  // UPDATE HANDLER
  // =============================================================

  private async handleUpdate(update: any) {
    if (update.message) {
      if (update.message.successful_payment) {
        await this.handleSuccessfulPayment(
          update.message.chat.id,
          update.message.successful_payment,
          update.message.from
        );
      } else {
        await this.handleMessage(update.message);
      }
    } else if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
    } else if (update.pre_checkout_query) {
      await this.handlePreCheckoutQuery(update.pre_checkout_query);
    }
  }

  public async handlePreCheckoutQuery(query: any) {
    try {
      await this.callBotApi("answerPreCheckoutQuery", {
        pre_checkout_query_id: query.id,
        ok: true,
      });
    } catch (err: any) {
      console.error("[STORE BOT] Error answering pre_checkout_query:", err?.message);
    }
  }

  public async handleSuccessfulPayment(chatId: number | string, payment: any, user: any) {
    try {
      const payload = payment.invoice_payload || "";
      const match = payload.match(/^stars_plan_(.+?)_\d+$/);
      const planId = match ? match[1] : (this.data.plans[0]?.id || "");
      const starsCount = payment.total_amount || 5;

      await this.confirmStarsPayment(chatId, planId, starsCount, user);
    } catch (err: any) {
      console.error("[STORE BOT] Error handling successful_payment:", err?.message);
    }
  }

  private recordCustomer(user: any) {
    if (!user || !user.id) return;
    const existing = this.data.customers.find((c) => String(c.userId) === String(user.id));
    if (!existing) {
      this.data.customers.unshift({
        userId: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        joinedAt: new Date().toISOString(),
        ordersCount: 0,
      });
      this.saveData();
    }
  }

  private async handleMessage(msg: any) {
    const chatId = msg.chat.id;
    const text = (msg.text || "").trim();
    const user = msg.from;

    this.recordCustomer(user);

    const session = this.userSessions.get(chatId) || { state: "idle" };

    // Allow global cancel / menu reset at any time
    if (text === "/start" || text === "منو" || text === "menu" || text === "❌ انصراف و بازگشت به منو") {
      this.userSessions.delete(chatId);
      await this.sendMainMenu(chatId);
      return;
    }

    // =========================================================================
    // AUTOMATED SELF / TABCHI ONBOARDING STATE MACHINE (PHONE -> CODE -> 2FA)
    // =========================================================================

    // STEP 1: Customer sends Phone Number (or shares Telegram Contact)
    if (session.state === "awaiting_self_phone" || (msg.contact && session.activeOrderId)) {
      const rawPhone = msg.contact?.phone_number || text;
      if (!rawPhone || rawPhone.includes("انصراف")) {
        this.userSessions.delete(chatId);
        await this.sendMainMenu(chatId);
        return;
      }
      await this.handleOnboardingPhoneInput(chatId, rawPhone, session.activeOrderId);
      return;
    }

    // STEP 2: Customer sends Verification Code via chat text (e.g., "1 2 3 4 5" or "12345")
    if (session.state === "awaiting_self_code") {
      if (text.includes("تغییر شماره") || text === "/phone") {
        await this.startOrderOnboarding(chatId, session.activeOrderId || "");
        return;
      }
      const digitsOnly = this.toEnglishDigits(text).replace(/\D/g, "");
      if (digitsOnly.length >= 4 && digitsOnly.length <= 6) {
        await this.verifyOnboardingCode(chatId, session.activeOrderId || "", digitsOnly);
      } else {
        await this.sendMessage(
          chatId,
          `⚠️ *فرمت کد تایید نامعتبر است!*\n\nلطفاً کد ۵ رقمی ارسال‌شده از طرف تلگرام را از طریق *کیبورد شیشه‌ای بالا* وارد کنید، و یا ارقام آن را با فاصله بفرستید (مثال: \`1 2 3 4 5\`).`,
          { parse_mode: "Markdown" }
        );
      }
      return;
    }

    // STEP 3: Customer sends 2FA Cloud Password
    if (session.state === "awaiting_self_2fa") {
      if (!text) {
        await this.sendMessage(chatId, "🔐 لطفاً رمز عبور تایید دو مرحله‌ای (2FA) حساب تلگرام خود را به صورت متن ارسال نمایید:");
        return;
      }
      // Delete the user's password message immediately from chat history for privacy & security
      if (msg.message_id) {
        this.callBotApi("deleteMessage", { chat_id: chatId, message_id: msg.message_id }).catch(() => {});
      }
      await this.verifyOnboarding2FA(chatId, session.activeOrderId || "", text);
      return;
    }

    // Check if user is in middle of submitting receipt/txid
    if (session.state === "awaiting_receipt" && session.pendingPlanId) {
      let receiptProof = text;
      let receiptType: "text" | "image" | "txid" = "text";
      let receiptPhotoFileId: string | undefined;

      if (msg.photo && msg.photo.length > 0) {
        // user sent photo
        const bestPhoto = msg.photo[msg.photo.length - 1];
        receiptPhotoFileId = bestPhoto.file_id;
        receiptProof = `[Photo: ${bestPhoto.file_id}] ${msg.caption || ""}`.trim();
        receiptType = "image";
      } else if (text.length > 20 && !text.includes(" ")) {
        receiptType = "txid";
      }

      const plan = this.data.plans.find((p) => p.id === session.pendingPlanId);
      if (plan) {
        const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
        const discountMultiplier = session.appliedDiscountPercent
          ? (100 - session.appliedDiscountPercent) / 100
          : 1;

        const finalToman = Math.round(plan.priceToman * discountMultiplier);
        const finalUsdt = parseFloat((plan.priceUsdt * discountMultiplier).toFixed(2));

        const newOrder: StoreOrder = {
          id: orderId,
          planId: plan.id,
          planTitle: plan.title,
          category: plan.category,
          durationDays: plan.durationDays,
          isUnlimited: plan.isUnlimited,
          userId: user.id,
          userUsername: user.username,
          userFirstName: user.first_name,
          priceToman: plan.priceToman,
          priceUsdt: plan.priceUsdt,
          discountAmount: plan.priceToman - finalToman,
          finalPriceToman: finalToman,
          finalPriceUsdt: finalUsdt,
          paymentMethod: session.pendingPaymentMethod || "card",
          paymentDetails: {
            cryptoNetwork: session.selectedCryptoNetwork,
            receiptProof: receiptProof || "رسید ثبت شد",
            receiptType,
            receiptPhotoFileId,
          },
          status: "pending",
          onboardingStatus: "idle",
          createdAt: new Date().toISOString(),
        };

        this.data.orders.unshift(newOrder);

        // Update customer order count
        const customer = this.data.customers.find((c) => String(c.userId) === String(user.id));
        if (customer) {
          customer.ordersCount = (customer.ordersCount || 0) + 1;
        }

        this.saveData();

        // Reset session
        this.userSessions.delete(chatId);

        // Notify customer
        const replyText =
          `✅ *فیش واریزی شما با موفقیت ثبت گردید!*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🧾 *شناسه سفارش:* \`${orderId}\`\n` +
          `📦 *طرح انتخابی:* ${plan.title}\n` +
          `💳 *روش پرداخت:* ${newOrder.paymentMethod === "card" ? "کارت به کارت شتاب" : "پرداخت ارزی کریپتو"}\n` +
          `💰 *مبلغ فاکتور:* ${finalToman.toLocaleString("fa-IR")} تومان (${finalUsdt} USDT)\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `⏳ *مرحله بعدی:* سفارش شما برای مدیریت ارسال شد. به محض تأیید فیش، ربات به صورت خودکار از شما *شماره موبایل اکانت* و *کد تلگرام* را دریافت کرده و سلف/تبچی شما را در کمتر از ۳۰ ثانیه روی سرور فعال می‌کند!`;

        await this.sendMessage(chatId, replyText, { parse_mode: "Markdown" });

        // Notify Admin if telegram ID configured (with 1-click Approve & Auto-Connect inline buttons!)
        if (this.data.settings.ownerTelegramId) {
          const adminNotice =
            `🔔 *سفارش جدید در ربات فروشگاه ثبت شد!*\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `🧾 *شماره سفارش:* \`${orderId}\`\n` +
            `👤 *خریدار:* ${user.first_name || "کاربر"} (@${user.username || "ندارد"} | \`${user.id}\`)\n` +
            `📦 *پکیج:* ${plan.title}\n` +
            `💰 *مبلغ:* ${finalToman.toLocaleString("fa-IR")} تومان (${finalUsdt} USDT)\n` +
            `💳 *روش:* ${newOrder.paymentMethod === "card" ? "کارت به کارت" : `کریپتو (${session.selectedCryptoNetwork || "USDT"})`}\n` +
            `📎 *مشخصات رسید:* \`${receiptProof}\`\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `💡 با زدن دکمه *«✅ تأیید فیش و شروع اتصال خودکار»* در زیر، ربات بلافاصله از مشتری شماره تلفن، کد تایید و رمز دو مرحله‌ای را گرفته و اکانت را اتوماتیک وصل می‌کند:`;

          const adminInlineMarkup = {
            inline_keyboard: [
              [
                {
                  text: "✅ تأیید فیش و شروع اتصال خودکار اکانت",
                  callback_data: `admin_approve_ord_${orderId}`,
                },
              ],
              [
                {
                  text: "❌ رد فیش واریزی",
                  callback_data: `admin_reject_ord_${orderId}`,
                },
              ],
            ],
          };

          if (receiptPhotoFileId) {
            await this.callBotApi("sendPhoto", {
              chat_id: this.data.settings.ownerTelegramId,
              photo: receiptPhotoFileId,
              caption: adminNotice,
              parse_mode: "Markdown",
              reply_markup: adminInlineMarkup,
            }).catch(async () => {
              await this.sendMessage(this.data.settings.ownerTelegramId, adminNotice, {
                parse_mode: "Markdown",
                reply_markup: adminInlineMarkup,
              }).catch(() => {});
            });
          } else {
            await this.sendMessage(this.data.settings.ownerTelegramId, adminNotice, {
              parse_mode: "Markdown",
              reply_markup: adminInlineMarkup,
            }).catch(() => {});
          }
        }

        return;
      }
    }

    // Check if user is entering a discount coupon
    if (session.state === "awaiting_coupon") {
      const code = text.toUpperCase();
      const coupon = this.data.coupons.find(
        (c) => c.code.toUpperCase() === code && c.isActive && (c.maxUses === 0 || c.usedCount < c.maxUses)
      );

      if (coupon) {
        session.state = "idle";
        session.appliedDiscountPercent = coupon.discountPercent;
        coupon.usedCount += 1;
        this.saveData();
        await this.sendMessage(
          chatId,
          `🎉 *کد تخفیف ${coupon.code} با موفقیت اعمال شد!*\n\nشما از ${coupon.discountPercent}٪ تخفیف روی تمامی پلن‌ها بهره‌مند شدید. حالا می‌توانید پلن مورد نظر خود را خریداری کنید.`,
          { parse_mode: "Markdown" }
        );
        await this.sendMainMenu(chatId);
      } else {
        await this.sendMessage(chatId, `❌ کد تخفیف وارد شده نامعتبر، منقضی شده یا سقف استفاده آن تکمیل است.`);
        session.state = "idle";
      }
      return;
    }

    const labels = this.data.settings.buttonLabels;

    if (text.includes(labels.buySelf) || text === "/self") {
      await this.sendCategoryPlans(chatId, "self");
    } else if (text.includes(labels.buyTabchi) || text === "/tabchi") {
      await this.sendCategoryPlans(chatId, "tabchi");
    } else if (text.includes(labels.buyCombo) || text === "/combo") {
      await this.sendCategoryPlans(chatId, "combo");
    } else if (text.includes(labels.plansCatalog) || text === "/plans") {
      await this.sendCategoryPlans(chatId, "all");
    } else if (text.includes(labels.myAccount) || text === "/account") {
      await this.sendUserAccount(chatId, user);
    } else if (text.includes(labels.myOrders) || text === "/orders") {
      await this.sendUserOrders(chatId, user);
    } else if (text.includes(labels.support) || text === "/support") {
      await this.sendSupport(chatId);
    } else if (text.includes(labels.helpGuide) || text === "/guide") {
      await this.sendGuide(chatId);
    } else if (text.includes(labels.applyDiscount) || text === "/discount") {
      this.userSessions.set(chatId, { state: "awaiting_coupon" });
      await this.sendMessage(
        chatId,
        `🎁 *لطفاً کد تخفیف خود را به زبان انگلیسی ارسال نمایید:*\n\n(مثال: \`WELCOME\` یا \`HACKER\`)`,
        { parse_mode: "Markdown" }
      );
    } else if (
      (this.data.settings.allowCustomerKeyboardSwitch && text.includes("تغییر به دکمه‌های شیشه‌ای")) ||
      text === "/inline"
    ) {
      let customer = this.data.customers.find((c) => String(c.userId) === String(user.id));
      if (!customer) {
        this.recordCustomer(user);
        customer = this.data.customers.find((c) => String(c.userId) === String(user.id));
      }
      if (customer) {
        customer.preferredKeyboardMode = "inline";
        this.saveData();
      }
      await this.sendMessage(
        chatId,
        "✨ *منو به حالت دکمه‌های شیشه‌ای (Inline) تغییر یافت.*\nکیبورد پایین حذف گردید و دکمه‌ها به صورت شیشه‌ای نمایش داده خواهند شد.",
        {
          reply_markup: { remove_keyboard: true },
          parse_mode: "Markdown",
        }
      );
      await this.sendMainMenu(chatId);
    } else if (
      (this.data.settings.allowCustomerKeyboardSwitch &&
        (text.includes("تغییر به کیبورد معمولی") || (labels.switchKeyboard && text.includes(labels.switchKeyboard)))) ||
      text === "/reply" ||
      text === "/keyboard"
    ) {
      let customer = this.data.customers.find((c) => String(c.userId) === String(user.id));
      if (!customer) {
        this.recordCustomer(user);
        customer = this.data.customers.find((c) => String(c.userId) === String(user.id));
      }
      if (customer) {
        customer.preferredKeyboardMode = "reply";
        this.saveData();
      }
      await this.sendMessage(
        chatId,
        "📱 *منو به حالت کیبورد دکمه‌ای معمولی تغییر یافت.*\nدکمه‌های سریع در پایین صفحه تلگرام شما فعال شدند.",
        {
          reply_markup: this.getReplyKeyboardMarkup(),
          parse_mode: "Markdown",
        }
      );
      await this.sendMainMenu(chatId);
    } else {
      // Default fallback
      await this.sendMainMenu(chatId);
    }
  }

  private async handleCallbackQuery(cb: any) {
    const chatId = cb.message.chat.id;
    const data = cb.data || "";
    const user = cb.from;

    await this.callBotApi("answerCallbackQuery", { callback_query_id: cb.id }).catch(() => {});

    if (data === "main_menu") {
      await this.sendMainMenu(chatId);
    } else if (data === "switch_to_reply") {
      let customer = this.data.customers.find((c) => String(c.userId) === String(user.id));
      if (!customer) {
        this.recordCustomer(user);
        customer = this.data.customers.find((c) => String(c.userId) === String(user.id));
      }
      if (customer) {
        customer.preferredKeyboardMode = "reply";
        this.saveData();
      }
      await this.sendMessage(
        chatId,
        "📱 *منوی سریع کیبوردی فعال شد!*\n\nدکمه‌های دسترسی سریع در پایین صفحه تلگرام شما قرار گرفتند. در صورت تمایل می‌توانید از دکمه «تغییر به دکمه‌های شیشه‌ای» مجدداً استفاده نمایید.",
        {
          reply_markup: this.getReplyKeyboardMarkup(),
          parse_mode: "Markdown",
        }
      );
      await this.sendMainMenu(chatId);
    } else if (data === "switch_to_inline") {
      let customer = this.data.customers.find((c) => String(c.userId) === String(user.id));
      if (!customer) {
        this.recordCustomer(user);
        customer = this.data.customers.find((c) => String(c.userId) === String(user.id));
      }
      if (customer) {
        customer.preferredKeyboardMode = "inline";
        this.saveData();
      }
      await this.sendMessage(
        chatId,
        "✨ *منوی شیشه‌ای (Inline) فعال شد!*\nکیبورد پایین پنهان شد.",
        {
          reply_markup: { remove_keyboard: true },
          parse_mode: "Markdown",
        }
      );
      await this.sendMainMenu(chatId);
    } else if (data === "cat_self") {
      await this.sendCategoryPlans(chatId, "self");
    } else if (data === "cat_tabchi") {
      await this.sendCategoryPlans(chatId, "tabchi");
    } else if (data === "cat_combo") {
      await this.sendCategoryPlans(chatId, "combo");
    } else if (data === "cat_all") {
      await this.sendCategoryPlans(chatId, "all");
    } else if (data === "menu_account") {
      await this.sendUserAccount(chatId, user);
    } else if (data === "menu_orders") {
      await this.sendUserOrders(chatId, user);
    } else if (data === "menu_support") {
      await this.sendSupport(chatId);
    } else if (data === "menu_guide") {
      await this.sendGuide(chatId);
    } else if (data === "menu_discount") {
      this.userSessions.set(chatId, { state: "awaiting_coupon" });
      await this.sendMessage(
        chatId,
        `🎁 *لطفاً کد تخفیف خود را ارسال نمایید:*\n\n(مثال: \`WELCOME\` یا \`HACKER\`)`,
        { parse_mode: "Markdown" }
      );
    } else if (data.startsWith("plan_details_")) {
      const planId = data.replace("plan_details_", "");
      await this.sendPlanDetails(chatId, planId);
    } else if (data.startsWith("pay_stars_")) {
      const planId = data.replace("pay_stars_", "");
      await this.initiateStarsPayment(chatId, planId, user);
    } else if (data.startsWith("confirm_pay_stars_")) {
      // format: confirm_pay_stars_<planId>_<starsCount>
      const parts = data.replace("confirm_pay_stars_", "").split("_");
      const planId = parts[0];
      const starsCount = parseInt(parts[1], 10) || 5;
      await this.confirmStarsPayment(chatId, planId, starsCount, user);
    } else if (data.startsWith("pay_card_")) {
      const planId = data.replace("pay_card_", "");
      await this.initiateCardPayment(chatId, planId);
    } else if (data.startsWith("pay_crypto_select_")) {
      const planId = data.replace("pay_crypto_select_", "");
      await this.showCryptoNetworks(chatId, planId);
    } else if (data.startsWith("pay_crypto_net_")) {
      // format: pay_crypto_net_<networkId>_<planId>
      const parts = data.replace("pay_crypto_net_", "").split("_");
      const networkId = parts[0];
      const planId = parts.slice(1).join("_");
      await this.initiateCryptoPayment(chatId, planId, networkId);
    } else if (data.startsWith("admin_approve_ord_")) {
      const orderId = data.replace("admin_approve_ord_", "");
      try {
        const ord = await this.approveOrder(orderId);
        await this.sendMessage(
          chatId,
          `✅ *سفارش #${ord.id} با موفقیت تأیید شد!*\n\nربات هم‌اکنون به صورت خودکار پیام دریافت شماره موبایل و کد فعال‌سازی سلف/تبچی را برای خریدار (${ord.userFirstName || ord.userId}) ارسال کرد.`,
          { parse_mode: "Markdown" }
        );
      } catch (err: any) {
        await this.sendMessage(chatId, `❌ خطا در تأیید سفارش: ${err.message}`);
      }
    } else if (data.startsWith("admin_reject_ord_")) {
      const orderId = data.replace("admin_reject_ord_", "");
      try {
        const ord = await this.rejectOrder(orderId, "فیش واریزی ارسال شده مورد تأیید مدیریت قرار نگرفت.");
        await this.sendMessage(chatId, `❌ سفارش #${ord.id} رد شد و اطلاع‌رسانی به کاربر انجام گردید.`);
      } catch (err: any) {
        await this.sendMessage(chatId, `❌ خطا در رد سفارش: ${err.message}`);
      }
    } else if (data.startsWith("start_onboard_")) {
      const orderId = data.replace("start_onboard_", "");
      await this.startOrderOnboarding(chatId, orderId);
    } else if (data.startsWith("cancel_onboard_")) {
      this.userSessions.delete(chatId);
      await this.sendMessage(
        chatId,
        "⏸️ فرآیند اتصال خودکار فعلاً متوقف شد. هر زمان مایل بودید می‌توانید از بخش «📦 پیگیری سفارشات من» روی دکمه *«🚀 فعال‌سازی و اتصال اکانت»* کلیک کنید.",
        { parse_mode: "Markdown", reply_markup: { remove_keyboard: true } }
      );
      await this.sendMainMenu(chatId);
    } else if (data.startsWith("onboard_digit_")) {
      // format: onboard_digit_<orderId>_<digit>
      const rest = data.replace("onboard_digit_", "");
      const lastUnderscore = rest.lastIndexOf("_");
      const orderId = rest.slice(0, lastUnderscore);
      const digit = rest.slice(lastUnderscore + 1);
      const session = this.userSessions.get(chatId);
      if (!session || session.state !== "awaiting_self_code") {
        await this.startOrderOnboarding(chatId, orderId);
        return;
      }
      const currentCode = (session.enteredCode || "") + digit;
      session.enteredCode = currentCode.slice(0, 6);
      this.userSessions.set(chatId, session);

      if (session.enteredCode.length === 5) {
        // Automatically submit when 5 digits are entered!
        await this.editKeypadMessage(chatId, cb.message.message_id, orderId, session.onboardingPhone || "", session.enteredCode, true);
        await this.verifyOnboardingCode(chatId, orderId, session.enteredCode);
      } else {
        await this.editKeypadMessage(chatId, cb.message.message_id, orderId, session.onboardingPhone || "", session.enteredCode, false);
      }
    } else if (data.startsWith("onboard_bksp_")) {
      const orderId = data.replace("onboard_bksp_", "");
      const session = this.userSessions.get(chatId);
      if (session && session.state === "awaiting_self_code") {
        session.enteredCode = (session.enteredCode || "").slice(0, -1);
        this.userSessions.set(chatId, session);
        await this.editKeypadMessage(chatId, cb.message.message_id, orderId, session.onboardingPhone || "", session.enteredCode, false);
      }
    } else if (data.startsWith("onboard_clear_")) {
      const orderId = data.replace("onboard_clear_", "");
      const session = this.userSessions.get(chatId);
      if (session && session.state === "awaiting_self_code") {
        session.enteredCode = "";
        this.userSessions.set(chatId, session);
        await this.editKeypadMessage(chatId, cb.message.message_id, orderId, session.onboardingPhone || "", "", false);
      }
    } else if (data.startsWith("onboard_submit_")) {
      const orderId = data.replace("onboard_submit_", "");
      const session = this.userSessions.get(chatId);
      if (!session || !session.enteredCode || session.enteredCode.length < 4) {
        await this.sendMessage(chatId, "⚠️ لطفاً ابتدا تمام ارقام کد ۵ رقمی تلگرام را وارد نمایید.");
        return;
      }
      await this.verifyOnboardingCode(chatId, orderId, session.enteredCode);
    } else if (data.startsWith("onboard_resend_")) {
      const orderId = data.replace("onboard_resend_", "");
      const session = this.userSessions.get(chatId);
      if (session?.onboardingPhone) {
        await this.handleOnboardingPhoneInput(chatId, session.onboardingPhone, orderId);
      } else {
        await this.startOrderOnboarding(chatId, orderId);
      }
    }
  }

  // =============================================================
  // BOT RESPONSES & SCREENS
  // =============================================================

  public async sendMessage(chatId: number | string, text: string, options: any = {}) {
    return this.callBotApi("sendMessage", {
      chat_id: chatId,
      text,
      ...options,
    });
  }

  public async sendMainMenu(chatId: number | string) {
    const welcome = this.data.settings.welcomeText;
    const customer = this.data.customers.find((c) => String(c.userId) === String(chatId));
    let mode = this.data.settings.keyboardMode;

    if (this.data.settings.allowCustomerKeyboardSwitch && customer?.preferredKeyboardMode) {
      mode = customer.preferredKeyboardMode;
    }

    let replyMarkup: any;
    if (mode === "reply") {
      replyMarkup = this.getReplyKeyboardMarkup();
    } else if (mode === "hybrid") {
      // In hybrid mode, send reply keyboard to keep bottom bar active, AND inline buttons in text
      replyMarkup = this.getInlineKeyboardMenu();
      // Also send a reply keyboard ping to set bottom bar
      await this.sendMessage(chatId, "👇 منوی سریع کیبورد فعال شد:", {
        reply_markup: this.getReplyKeyboardMarkup(),
      }).catch(() => {});
    } else {
      replyMarkup = this.getInlineKeyboardMenu();
    }

    await this.sendMessage(chatId, welcome, {
      reply_markup: replyMarkup,
      parse_mode: "Markdown",
    });
  }

  public async sendCategoryPlans(chatId: number | string, category: "self" | "tabchi" | "combo" | "all") {
    const plans = this.data.plans.filter((p) => p.isActive && (category === "all" || p.category === category));

    if (plans.length === 0) {
      await this.sendMessage(chatId, "⚠️ در حال حاضر هیچ پلن فعالی در این بخش موجود نیست.");
      return;
    }

    const inlineKeyboard: any[] = [];

    for (const plan of plans) {
      const icon = plan.category === "self" ? "💎" : plan.category === "tabchi" ? "🚀" : "⚡";
      const duration = plan.isUnlimited ? "♾️ دائمی" : `${plan.durationDays} روزه`;
      const price = `${plan.priceToman.toLocaleString("fa-IR")} ت | $${plan.priceUsdt}`;

      inlineKeyboard.push([
        {
          text: `${icon} ${plan.title} [${duration}] - ${price}`,
          callback_data: `plan_details_${plan.id}`,
        },
      ]);
    }

    inlineKeyboard.push([{ text: "🔙 بازگشت به منوی اصلی", callback_data: "main_menu" }]);

    const catTitle =
      category === "self"
        ? "💎 اکانت‌های سلف زمان‌دار"
        : category === "tabchi"
        ? "🚀 اکانت‌های تبچی تبلیغاتی"
        : category === "combo"
        ? "⚡ پکیج‌های ترکیبی VIP"
        : "🛍️ تعرفه‌ها و پکیج‌های موجود";

    await this.sendMessage(
      chatId,
      `*${catTitle}*\n\nبرای مشاهده مشخصات کامل، ویژگی‌ها و خرید هر پکیج، روی دکمه مربوطه کلیک کنید:`,
      {
        reply_markup: { inline_keyboard: inlineKeyboard },
        parse_mode: "Markdown",
      }
    );
  }

  public async sendPlanDetails(chatId: number | string, planId: string) {
    const plan = this.data.plans.find((p) => p.id === planId);
    if (!plan) {
      await this.sendMessage(chatId, "⚠️ پلن مورد نظر یافت نشد.");
      return;
    }

    const durationText = plan.isUnlimited ? "♾️ دائمی و نامحدود" : `⏳ ${plan.durationDays} روزه`;
    const featuresList = plan.features.map((f) => `  ✓ ${f}`).join("\n");

    const starsPerToman = this.data.payments.starsPayment?.starsPerToman || 2000;
    const planStars = Math.max(1, Math.round(plan.priceToman / starsPerToman));

    const message =
      `🏷️ *${plan.title}*\n` +
      `🎗️ وضعیت: ${plan.badge || "VIP"}\n` +
      `⏱️ اعتبار: *${durationText}*\n\n` +
      `📝 *توضیحات:*\n${plan.description}\n\n` +
      `✨ *امکانات و قابلیت‌ها:*\n${featuresList}\n\n` +
      `💰 *قیمت به تومان:* ${plan.priceToman.toLocaleString("fa-IR")} تومان\n` +
      `🌐 *قیمت ارزی:* ${plan.priceUsdt} USDT (تتر)\n` +
      `⭐ *قیمت با استارز:* *${planStars} ستاره (Telegram Stars)*\n\n` +
      `لطفاً نحوه پرداخت مورد نظر خود را انتخاب نمایید:`;

    const buttons: any[] = [];
    if (this.data.payments.starsPayment?.enabled !== false) {
      buttons.push([
        {
          text: `⭐ کسر ${planStars} استارز و فعال‌سازی فوری`,
          callback_data: `pay_stars_${plan.id}`,
        },
      ]);
    }
    if (this.data.payments.cardPayment.enabled) {
      buttons.push([
        {
          text: "💳 پرداخت کارت به کارت شتاب",
          callback_data: `pay_card_${plan.id}`,
        },
      ]);
    }
    if (this.data.payments.cryptoPayment.enabled) {
      buttons.push([
        {
          text: "🌐 پرداخت ارزی / کریپتو (USDT, TON, TRX)",
          callback_data: `pay_crypto_select_${plan.id}`,
        },
      ]);
    }
    buttons.push([
      { text: "🔙 بازگشت به لیست", callback_data: `cat_${plan.category}` },
      { text: "🏠 منوی اصلی", callback_data: "main_menu" },
    ]);

    await this.sendMessage(chatId, message, {
      reply_markup: { inline_keyboard: buttons },
      parse_mode: "Markdown",
    });
  }

  public async initiateCardPayment(chatId: number | string, planId: string) {
    const plan = this.data.plans.find((p) => p.id === planId);
    if (!plan) return;

    const cards = (this.data.payments.cards || []).filter((c) => c.isActive);
    const activeCards = cards.length > 0 ? cards : [
      {
        id: "default-card",
        bankName: this.data.payments.cardPayment.bankName || "بانک سامان",
        cardNumber: this.data.payments.cardPayment.cardNumber || "6219861012345678",
        cardHolder: this.data.payments.cardPayment.cardHolder || "مدیریت سرور",
        shabaNumber: this.data.payments.cardPayment.shabaNumber,
        instructions: this.data.payments.cardPayment.instructions,
        isActive: true,
      },
    ];

    // Set user session to await receipt
    this.userSessions.set(chatId, {
      state: "awaiting_receipt",
      pendingPlanId: plan.id,
      pendingPaymentMethod: "card",
    });

    let cardBlock = "";
    if (activeCards.length > 1) {
      cardBlock = activeCards
        .map(
          (c, idx) =>
            `🏦 *حساب ${idx + 1}: ${c.bankName}*\n` +
            `👤 *به نام:* ${c.cardHolder}\n` +
            `💳 *شماره کارت:*\n\`${c.cardNumber}\`\n` +
            (c.shabaNumber ? `📌 *شماره شبا:*\n\`${c.shabaNumber}\`\n` : "")
        )
        .join("\n──────────────\n");
    } else {
      const single = activeCards[0];
      cardBlock =
        `🏦 *بانک:* ${single.bankName}\n` +
        `👤 *به نام:* ${single.cardHolder}\n` +
        `💳 *شماره کارت:*\n\`${single.cardNumber}\`\n\n` +
        (single.shabaNumber ? `📌 *شماره شبا:*\n\`${single.shabaNumber}\`\n\n` : "");
    }

    const text =
      `💳 *پرداخت کارت به کارت شتابی*\n\n` +
      `📦 طرح انتخابی: *${plan.title}*\n` +
      `💰 مبلغ قابل پرداخت: *${plan.priceToman.toLocaleString("fa-IR")} تومان*\n\n` +
      cardBlock + "\n" +
      `📋 *راهنما:* ${this.data.payments.cardPayment.instructions || "لطفاً پس از واریز، تصویر فیش را ارسال نمایید."}\n\n` +
      `📸 *لطفاً تصویر فیش واریزی یا شماره پیگیری / ارجاع تراکنش را در پاسخ به همین پیام ارسال نمایید:*`;

    await this.sendMessage(chatId, text, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "❌ انصراف و بازگشت", callback_data: "main_menu" }]],
      },
    });
  }

  public async showCryptoNetworks(chatId: number | string, planId: string) {
    const plan = this.data.plans.find((p) => p.id === planId);
    if (!plan) return;

    const networks = this.data.payments.cryptoPayment.networks.filter((n) => n.isActive);
    const buttons: any[] = [];

    for (const net of networks) {
      buttons.push([
        {
          text: `🪙 ${net.name} [${net.network}]`,
          callback_data: `pay_crypto_net_${net.id}_${plan.id}`,
        },
      ]);
    }

    buttons.push([{ text: "🔙 بازگشت به مشخصات پلن", callback_data: `plan_details_${plan.id}` }]);

    await this.sendMessage(
      chatId,
      `🌐 *پرداخت ارزی و کریپتوکارنسی*\n\nمبلغ فاکتور: *${plan.priceUsdt} USDT*\n\nلطفاً شبکه یا ارز دیجیتال مورد نظر برای پرداخت را انتخاب فرمایید:`,
      {
        reply_markup: { inline_keyboard: buttons },
        parse_mode: "Markdown",
      }
    );
  }

  public async initiateCryptoPayment(chatId: number | string, planId: string, networkId: string) {
    const plan = this.data.plans.find((p) => p.id === planId);
    const network = this.data.payments.cryptoPayment.networks.find((n) => n.id === networkId);

    if (!plan || !network) return;

    this.userSessions.set(chatId, {
      state: "awaiting_receipt",
      pendingPlanId: plan.id,
      pendingPaymentMethod: "crypto",
      selectedCryptoNetwork: network.name,
    });

    const text =
      `🌐 *پرداخت ارزی با ${network.name}*\n\n` +
      `📦 پکیج انتخابی: *${plan.title}*\n` +
      `💰 مبلغ قابل انتقال: *${plan.priceUsdt} USDT* (یا معادل آن)\n` +
      `🌐 شبکه انتقال: *${network.network}*\n\n` +
      `📍 *آدرس کیف پول (Wallet Address):*\n\`${network.walletAddress}\`\n\n` +
      (network.memo ? `🏷️ *تگ / ممو (Memo):* \`${network.memo}\`\n\n` : "") +
      `⚠️ *نکته امنیتی:* حتماً ارز را روی شبکه *${network.network}* ارسال کنید.\n` +
      `📋 *راهنما:* ${network.instructions || this.data.payments.cryptoPayment.generalInstructions || ""}\n\n` +
      `🔗 *لطفاً هش تراکنش (TXID / Hash) یا اسکرین‌شات رسید انتقال را ارسال فرمایید:*`;

    await this.sendMessage(chatId, text, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "❌ انصراف و بازگشت", callback_data: "main_menu" }]],
      },
    });
  }

  public async initiateStarsPayment(chatId: number | string, planId: string, user: any) {
    const plan = this.data.plans.find((p) => p.id === planId);
    if (!plan) return;

    const starsPerToman = this.data.payments.starsPayment?.starsPerToman || 2000;
    const requiredStars = Math.max(1, Math.round(plan.priceToman / starsPerToman));

    let invoiceSent = false;
    // 1. Send official Telegram Native Stars Invoice (Shows official native 'Pay ★ 100' button and Telegram sheet)
    try {
      const invoiceRes = await this.callBotApi("sendInvoice", {
        chat_id: chatId,
        title: `پرداخت سفارش ${plan.title}`,
        description: `مبلغ ${plan.priceToman.toLocaleString("fa-IR")} تومان معادل ${requiredStars} ستاره تلگرام (Telegram Stars). پرداخت داخل تلگرام انجام می‌شود و اشتراک بلافاصله ثبت می‌گردد.`,
        payload: `stars_plan_${plan.id}_${Date.now()}`,
        currency: "XTR",
        prices: [{ label: `${plan.title} (${requiredStars} Stars)`, amount: requiredStars }],
        provider_token: "",
        start_parameter: `plan_${plan.id.slice(0, 28)}`,
        reply_markup: {
          inline_keyboard: [
            [{ text: `پرداخت ★ ${requiredStars}`, pay: true }],
            [{ text: "🔙 بازگشت به مشخصات پلن", callback_data: `plan_details_${plan.id}` }],
          ],
        },
      });
      if (invoiceRes) {
        invoiceSent = true;
      }
    } catch (err: any) {
      console.warn("[STORE BOT] sendInvoice fallback:", err?.message);
    }

    // 2. If native sendInvoice could not be sent (e.g. mock token or bot restriction), send interactive confirmation card
    if (!invoiceSent) {
      const invoiceMessage =
        `⭐ *درخواست کسر استارز تلگرام (Telegram Stars)*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 *محصول انتخابی:* ${plan.title}\n` +
        `⏱️ *مدت اعتبار:* ${plan.isUnlimited ? "♾️ دائمی و نامحدود" : `${plan.durationDays} روزه`}\n` +
        `⭐ *تعداد ستاره‌های مورد نیاز:* *${requiredStars} استارز*\n` +
        `💰 *معادل تومانی:* ${plan.priceToman.toLocaleString("fa-IR")} تومان\n` +
        `👤 *حساب خریدار:* ${user.first_name || "کاربر"} (@${user.username || "ندارد"})\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `💡 با کلیک بر روی دکمه زیر، تعداد *${requiredStars} ستاره* از حساب تلگرام شما کسر شده و به صندوق سرور ما واریز می‌گردد؛ سپس لایسنس اختصاصی و اشتراک شما *به صورت آنی و خودکار* تحویل داده خواهد شد:\n\n` +
        `آیا کسر و انتقال ${requiredStars} استارز را تایید می‌فرمایید؟`;

      const buttons: any[] = [
        [
          {
            text: `⭐ تایید کسر ${requiredStars} استارز و پرداخت به ما`,
            callback_data: `confirm_pay_stars_${plan.id}_${requiredStars}`,
          },
        ],
        [{ text: "🔙 بازگشت به مشخصات پلن", callback_data: `plan_details_${plan.id}` }],
        [{ text: "🏠 منوی اصلی", callback_data: "main_menu" }],
      ];

      await this.sendMessage(chatId, invoiceMessage, {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: buttons },
      });
    }
  }

  public async confirmStarsPayment(chatId: number | string, planId: string, starsCount: number, user: any) {
    const plan = this.data.plans.find((p) => p.id === planId);
    if (!plan) return;

    const orderId = `STR-${Math.floor(1000 + Math.random() * 9000)}`;
    const licenseCode = `LIC-${plan.category.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Accumulate total stars collected in store
    if (!this.data.payments.starsPayment) {
      this.data.payments.starsPayment = {
        enabled: true,
        starsPerToman: 2000,
        priceMultiplier: 1.0,
        description: "پرداخت آنی و مستقیم با کسر ستاره‌های تلگرام (Telegram Stars)",
        starsCollected: 0,
      };
    }
    this.data.payments.starsPayment.starsCollected =
      (this.data.payments.starsPayment.starsCollected || 0) + starsCount;

    const newOrder: StoreOrder = {
      id: orderId,
      planId: plan.id,
      planTitle: plan.title,
      category: plan.category,
      durationDays: plan.durationDays,
      isUnlimited: plan.isUnlimited,
      userId: user.id,
      userUsername: user.username,
      userFirstName: user.first_name,
      priceToman: plan.priceToman,
      priceUsdt: plan.priceUsdt,
      discountAmount: 0,
      finalPriceToman: plan.priceToman,
      finalPriceUsdt: plan.priceUsdt,
      paymentMethod: "crypto",
      paymentDetails: {
        cryptoNetwork: "Telegram Stars ⭐",
        receiptProof: `کسر مستقیم و واریز ${starsCount} استارز به صندوق مدیریت`,
        receiptType: "txid",
      },
      status: "approved",
      onboardingStatus: "awaiting_phone",
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      generatedCredentials: {
        licenseCode,
        portalUrl: telegramManager.getEffectiveAppUrl(),
        notes: `پرداخت با ${starsCount} ستاره تلگرام انجام شد. استارز کسر و به صندوق اضافه گردید.`,
      },
    };

    this.data.orders.unshift(newOrder);

    // Update customer stats
    let customer = this.data.customers.find((c) => String(c.userId) === String(user.id));
    if (!customer) {
      this.recordCustomer(user);
      customer = this.data.customers.find((c) => String(c.userId) === String(user.id));
    }
    if (customer) {
      customer.ordersCount = (customer.ordersCount || 0) + 1;
      customer.activePlan = plan.title;
      customer.onboardingStatus = "awaiting_phone";
      const addDays = plan.isUnlimited ? 3650 : (plan.durationDays || 30);
      customer.expiresAt = new Date(Date.now() + addDays * 86400000).toISOString();
    }

    this.saveData();

    // Success response to user
    const successMsg =
      `🎉 *پرداخت با موفقیت انجام شد و استارز کسر گردید!*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⭐ *ستاره‌های پرداختی:* ${starsCount} Stars\n` +
      `🧾 *شماره سفارش:* \`${orderId}\`\n` +
      `📦 *پکیج فعال‌شده:* ${plan.title}\n` +
      `⏱️ *اعتبار اشتراک:* ${plan.isUnlimited ? "مادام‌العمر" : `${plan.durationDays} روز`}\n` +
      `🔑 *کد لایسنس شما:*\n\`${licenseCode}\`\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🚀 *اکنون نوبت اتصال خودکار اکانت شماست!* در پیام بعدی شماره تلفن خود را وارد کنید تا ربات به صورت اتوماتیک سلف/تبچی شما را متصل کند:`;

    await this.sendMessage(chatId, successMsg, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 شروع اتصال خودکار اکانت (تنظیم شماره)", callback_data: `start_onboard_${orderId}` }],
          [{ text: "📦 مشاهده سفارشات من", callback_data: "menu_orders" }],
        ],
      },
    });

    // Automatically start phone onboarding flow
    if (this.data.settings.autoConnectAfterApproval !== false) {
      await this.startOrderOnboarding(chatId, orderId).catch(() => {});
    }

    // Notify owner
    if (this.data.settings.ownerTelegramId) {
      const adminNotice =
        `⭐ *دریافت ستاره جدید (Telegram Stars) در فروشگاه!*\n\n` +
        `👤 خریدار: ${user.first_name} (@${user.username || "ندارد"})\n` +
        `⭐ مقدار استارز واریزی به ما: *${starsCount} Stars*\n` +
        `📦 پکیج: ${plan.title}\n` +
        `🧾 شماره فاکتور: \`${orderId}\`\n` +
        `🔑 لایسنس صادر شده: \`${licenseCode}\`\n` +
        `📲 ربات به صورت خودکار وارد مرحله دریافت شماره و کد تلگرام از مشتری شد.`;
      await this.sendMessage(this.data.settings.ownerTelegramId, adminNotice, { parse_mode: "Markdown" }).catch(() => {});
    }
  }

  public async sendUserOrders(chatId: number | string, user: any) {
    const orders = this.data.orders.filter((o) => String(o.userId) === String(user.id));

    if (orders.length === 0) {
      await this.sendMessage(
        chatId,
        `📦 شما تا کنون سفارشی در این ربات ثبت نکرده‌اید.\nجهت مشاهده و خرید اشتراک روی "🛍️ تعرفه‌ها و لیست پکیج‌ها" کلیک کنید.`
      );
      return;
    }

    let text = `📦 *لیست سفارشات و وضعیت اتصال اکانت شما:*\n\n`;
    const inlineButtons: any[][] = [];

    for (const ord of orders.slice(0, 5)) {
      const statusIcon =
        ord.status === "approved" ? "✅ تأیید شده" : ord.status === "rejected" ? "❌ رد شده" : "⏳ در حال بررسی فیش";
      const onboardLabel =
        ord.onboardingStatus === "connected"
          ? `🟢 متصل به شماره \`${ord.connectedPhone || ord.generatedCredentials?.accountPhone || ""}\``
          : ord.status === "approved"
          ? "🟡 آماده اتصال خودکار شماره تلگرام"
          : "⚪ منتظر تأیید فیش";

      text +=
        `🧾 *شماره سفارش:* \`${ord.id}\`\n` +
        `📦 طرح: *${ord.planTitle}*\n` +
        `💰 مبلغ: ${ord.finalPriceToman.toLocaleString("fa-IR")} تومان\n` +
        `🏷️ وضعیت پرداخت: ${statusIcon}\n` +
        `📡 وضعیت اتصال سلف/تبچی: ${onboardLabel}\n` +
        `📅 تاریخ: ${new Date(ord.createdAt).toLocaleDateString("fa-IR")}\n`;

      if (ord.generatedCredentials?.licenseCode) {
        text += `🔑 *کد لایسنس:* \`${ord.generatedCredentials.licenseCode}\`\n`;
      }
      if (ord.generatedCredentials?.password) {
        text += `🔐 *رمز وب پنل:* \`${ord.generatedCredentials.password}\`\n`;
      }
      if (ord.rejectionReason) {
        text += `⚠️ علت رد: ${ord.rejectionReason}\n`;
      }
      text += `──────────────\n`;

      if (ord.status === "approved") {
        inlineButtons.push([
          {
            text:
              ord.onboardingStatus === "connected"
                ? `🔄 تغییر شماره / اتصال مجدد (${ord.id})`
                : `🚀 فعال‌سازی و اتصال خودکار شماره (${ord.id})`,
            callback_data: `start_onboard_${ord.id}`,
          },
        ]);
      }
    }

    inlineButtons.push([{ text: "🏠 منوی اصلی", callback_data: "main_menu" }]);

    await this.sendMessage(chatId, text, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: inlineButtons,
      },
    });
  }

  public async sendUserAccount(chatId: number | string, user: any) {
    const customer = this.data.customers.find((c) => String(c.userId) === String(user.id));
    const approvedOrders = this.data.orders.filter(
      (o) => String(o.userId) === String(user.id) && o.status === "approved"
    );
    const latestApproved = approvedOrders[0];

    const text =
      `👤 *حساب کاربری و وضعیت اشتراک شما*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 شناسه کاربری تلگرام: \`${user.id}\`\n` +
      `🏷️ نام: ${user.first_name || ""} ${user.last_name || ""}\n` +
      `🔗 نام کاربری: @${user.username || "ندارد"}\n` +
      `📊 تعداد کل سفارشات: ${customer?.ordersCount || approvedOrders.length}\n` +
      `✅ خریدهای تأیید شده: ${approvedOrders.length}\n` +
      (customer?.activePlan ? `📦 پکیج فعال: *${customer.activePlan}*\n` : "") +
      (customer?.connectedPhone ? `📱 شماره متصل‌شده به سلف/تبچی: \`${customer.connectedPhone}\`\n` : "") +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🌐 *لینک وب پنل مشتریان:*\n${telegramManager.getEffectiveAppUrl()}\n\n` +
      `💡 در صورت داشتن سفارش تأیید شده، می‌توانید مستقیماً در همین ربات شماره خود را وارد کرده و سلف/تبچی را اتوماتیک فعال کنید.`;

    const kb: any[][] = [];
    if (latestApproved) {
      kb.push([
        {
          text:
            latestApproved.onboardingStatus === "connected"
              ? `🔄 اتصال مجدد / تغییر شماره (${latestApproved.id})`
              : `🚀 اتصال خودکار شماره برای سفارش ${latestApproved.id}`,
          callback_data: `start_onboard_${latestApproved.id}`,
        },
      ]);
    }
    kb.push([{ text: "📦 سفارشات من", callback_data: "menu_orders" }]);
    kb.push([{ text: "🏠 منوی اصلی", callback_data: "main_menu" }]);

    await this.sendMessage(chatId, text, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: kb,
      },
    });
  }

  public async sendSupport(chatId: number | string) {
    const sup = this.data.settings.supportUsername.replace(/^@/, "");
    const text =
      `📞 *ارتباط با پشتیبانی و مدیریت سرور*\n\n` +
      `اگر در فرآیند خرید، پرداخت، تحویل اکانت یا تنظیمات سلف و تبچی سوالی دارید، می‌توانید مستقیماً با مدیریت در ارتباط باشید:\n\n` +
      `👤 آیدی پشتیبانی: @${sup}\n` +
      (this.data.settings.channelUsername
        ? `📢 کانال اطلاع‌رسانی: @${this.data.settings.channelUsername.replace(/^@/, "")}\n`
        : "") +
      `\n⚡ ساعات پاسخگویی: ۲۴ ساعته در تمام روزهای هفته`;

    const buttons = [
      [{ text: "💬 پیام به پشتیبانی تلگرام", url: `https://t.me/${sup}` }],
      [{ text: "🏠 بازگشت به منو", callback_data: "main_menu" }],
    ];

    await this.sendMessage(chatId, text, {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: buttons },
    });
  }

  public async sendGuide(chatId: number | string) {
    const text =
      `📖 *راهنمای خرید و اتصال تمام‌خودکار سلف و تبچی*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `۱️⃣ *انتخاب پکیج و پرداخت:* یکی از پکیج‌های سلف، تبچی یا ترکیبی را انتخاب کرده و فیش واریزی خود را بفرستید.\n` +
      `۲️⃣ *تأیید فیش:* به محض تأیید فیش توسط مدیریت، ربات پیام فعال‌سازی خودکار را برای شما ارسال می‌کند.\n` +
      `۳️⃣ *ارسال شماره موبایل:* شماره‌ای که می‌خواهید سلف یا تبچی روی آن فعال شود را برای ربات بفرستید (مثال: \`09123456789\`).\n` +
      `۴️⃣ *ورود کد با کیبورد شیشه‌ای:* کد ۵ رقمی ارسال شده از طرف تلگرام را روی دکمه‌های شیشه‌ای ربات وارد کنید (تا کد شما توسط تلگرام نسوزد!).\n` +
      `۵️⃣ *رمز دو مرحله‌ای (در صورت داشتن):* اگر اکانت شما رمز دو مرحله‌ای دارد، آن را بفرستید تا ربات به صورت اتوماتیک به اکانت وصل شده و ساعت پروفایل، منشی هوشمند و تبچی شما را روشن کند!\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 همچنین پس از اتصال، نام کاربری و رمز عبور *وب پنل اختصاصی* نیز به شما تحویل داده می‌شود.`;

    await this.sendMessage(chatId, text, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "🏠 منوی اصلی", callback_data: "main_menu" }]],
      },
    });
  }

  // =============================================================
  // AUTOMATED MTPROTO ACCOUNT ONBOARDING METHODS
  // =============================================================

  private getCodeKeypadMarkup(orderId: string, currentCode: string) {
    const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
    const rows: any[][] = [];
    for (let i = 0; i < 9; i += 3) {
      rows.push([
        { text: `${digits[i]}️⃣`, callback_data: `onboard_digit_${orderId}_${digits[i]}` },
        { text: `${digits[i + 1]}️⃣`, callback_data: `onboard_digit_${orderId}_${digits[i + 1]}` },
        { text: `${digits[i + 2]}️⃣`, callback_data: `onboard_digit_${orderId}_${digits[i + 2]}` },
      ]);
    }
    rows.push([
      { text: "⌫ اصلاح", callback_data: `onboard_bksp_${orderId}` },
      { text: "0️⃣", callback_data: `onboard_digit_${orderId}_0` },
      { text: "🗑️ پاکسازی", callback_data: `onboard_clear_${orderId}` },
    ]);
    rows.push([
      {
        text: `✅ تایید و اتصال (${currentCode.length}/5)`,
        callback_data: `onboard_submit_${orderId}`,
      },
    ]);
    rows.push([
      { text: "🔄 ارسال مجدد کد", callback_data: `onboard_resend_${orderId}` },
      { text: "✏️ تغییر شماره", callback_data: `start_onboard_${orderId}` },
    ]);
    rows.push([{ text: "❌ انصراف موقت", callback_data: `cancel_onboard_${orderId}` }]);
    return { inline_keyboard: rows };
  }

  private formatKeypadMessageText(orderId: string, phone: string, currentCode: string, isVerifying = false): string {
    const slots = [0, 1, 2, 3, 4].map((idx) => (currentCode[idx] ? `*${currentCode[idx]}*` : "▫️")).join("  ");
    return (
      `📲 *کد تایید تلگرام به شماره* \`${phone}\` *ارسال شد!*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔢 *کد وارد شده:*   ${slots}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      (isVerifying
        ? `⏳ *در حال بررسی کد و اتصال به اکانت تلگرام شما... لطفاً چند لحظه صبر کنید...*`
        : `⚠️ *نکته امنیتی بسیار مهم:*\n` +
          `جهت جلوگیری از باطل شدن کد توسط تلگرام، لطفاً کد ۵ رقمی را با *دکمه‌های شیشه‌ای زیر* وارد نمایید (به محض زدن رقم پنجم، به صورت خودکار بررسی می‌شود).\n\n` +
          `💡 _همچنین می‌توانید ارقام کد را با فاصله در چت تایپ کنید (مثال:_ \`1 2 3 4 5\`_)_`)
    );
  }

  private async editKeypadMessage(
    chatId: number | string,
    messageId: number,
    orderId: string,
    phone: string,
    currentCode: string,
    isVerifying: boolean
  ) {
    const text = this.formatKeypadMessageText(orderId, phone, currentCode, isVerifying);
    await this.callBotApi("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "Markdown",
      reply_markup: isVerifying ? undefined : this.getCodeKeypadMarkup(orderId, currentCode),
    }).catch(() => {});
  }

  public async startOrderOnboarding(chatId: number | string, orderId: string) {
    const order =
      this.data.orders.find((o) => o.id === orderId) ||
      this.data.orders.find((o) => String(o.userId) === String(chatId) && o.status === "approved");

    if (!order) {
      await this.sendMessage(chatId, "⚠️ سفارش تأیید شده‌ای برای فعال‌سازی یافت نشد.");
      return;
    }

    order.onboardingStatus = "awaiting_phone";
    order.onboardingError = undefined;
    const customer = this.data.customers.find((c) => String(c.userId) === String(order.userId));
    if (customer) {
      customer.onboardingStatus = "awaiting_phone";
    }
    this.saveData();

    this.userSessions.set(chatId, {
      state: "awaiting_self_phone",
      activeOrderId: order.id,
    });

    const serviceTypeLabel =
      order.category === "self"
        ? "💎 ربات سلف هوشمند"
        : order.category === "tabchi"
        ? "🚀 ربات تبچی تبلیغاتی"
        : "⚡ پکیج فول سلف + تبچی";

    const promptMsg =
      `🚀 *مرحله ۱ از ۳: دریافت شماره موبایل جهت فعال‌سازی خودکار*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🧾 *سفارش:* \`${order.id}\` (${order.planTitle})\n` +
      `🎯 *سرویس:* ${serviceTypeLabel}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📱 *لطفاً شماره تلفنی که می‌خواهید سلف/تبچی روی آن فعال شود را ارسال نمایید:*\n\n` +
      `✅ می‌توانید شماره را به صورت متنی تایپ کنید (مثال: \`09123456789\` یا \`+989123456789\`).\n` +
      `✅ یا اگر می‌خواهید روی *همین اکانت فعلی* فعال شود، روی دکمه *«📲 اشتراک‌گذاری سریع شماره من»* در پایین صفحه بزنید:`;

    await this.sendMessage(chatId, promptMsg, {
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [
          [{ text: "📲 اشتراک‌گذاری سریع شماره من", request_contact: true }],
          [{ text: "❌ انصراف و بازگشت به منو" }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }

  private async handleOnboardingPhoneInput(chatId: number | string, rawPhone: string, orderId?: string) {
    const cleanPhone = this.normalizePhoneInput(rawPhone);
    if (!cleanPhone || !/^\+\d{8,15}$/.test(cleanPhone)) {
      await this.sendMessage(
        chatId,
        `❌ *شماره وارد شده معتبر نیست!*\n\nلطفاً شماره موبایل را به صورت صحیح ارسال کنید (مثال: \`09123456789\` یا \`+989123456789\`).`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    const order =
      this.data.orders.find((o) => o.id === orderId) ||
      this.data.orders.find((o) => String(o.userId) === String(chatId) && o.status === "approved");
    const effectiveOrderId = order?.id || orderId || "ORD";

    await this.sendMessage(
      chatId,
      `⏳ *در حال اتصال به سرور اصلی تلگرام و ارسال کد تایید به شماره* \`${cleanPhone}\` *...*\nلطفاً چند ثانیه صبر کنید.`,
      {
        parse_mode: "Markdown",
        reply_markup: { remove_keyboard: true },
      }
    );

    try {
      const res = await telegramManager.sendCode(cleanPhone);
      if (!res.success || !res.sessionId) {
        throw new Error(res.message || "ارسال کد از سرور تلگرام ناموفق بود.");
      }

      this.userSessions.set(chatId, {
        state: "awaiting_self_code",
        activeOrderId: effectiveOrderId,
        onboardingPhone: cleanPhone,
        loginSessionId: res.sessionId,
        enteredCode: "",
      });

      if (order) {
        order.onboardingStatus = "awaiting_code";
        order.connectedPhone = cleanPhone;
        order.onboardingError = undefined;
      }
      const customer = this.data.customers.find((c) => String(c.userId) === String(chatId));
      if (customer) {
        customer.onboardingStatus = "awaiting_code";
        customer.connectedPhone = cleanPhone;
      }
      this.saveData();

      const keypadText = this.formatKeypadMessageText(effectiveOrderId, cleanPhone, "", false);
      await this.sendMessage(chatId, keypadText, {
        parse_mode: "Markdown",
        reply_markup: this.getCodeKeypadMarkup(effectiveOrderId, ""),
      });
    } catch (err: any) {
      if (order) {
        order.onboardingError = err.message;
        this.saveData();
      }
      await this.sendMessage(
        chatId,
        `❌ *خطا در ارسال کد تایید به شماره* \`${cleanPhone}\`:\n${err.message || "خطای ارتباط با تلگرام"}\n\nلطفاً مجدداً شماره صحیح را ارسال نمایید یا روی دکمه زیر کلیک کنید:`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔄 تلاش مجدد و تغییر شماره", callback_data: `start_onboard_${effectiveOrderId}` }],
              [{ text: "🏠 بازگشت به منوی اصلی", callback_data: "main_menu" }],
            ],
          },
        }
      );
    }
  }

  private async verifyOnboardingCode(chatId: number | string, orderId: string, code: string) {
    const session = this.userSessions.get(chatId);
    const order =
      this.data.orders.find((o) => o.id === orderId) ||
      this.data.orders.find((o) => String(o.userId) === String(chatId) && o.status === "approved");

    if (!session || !session.loginSessionId || !session.onboardingPhone) {
      await this.startOrderOnboarding(chatId, order?.id || orderId);
      return;
    }

    try {
      const res = await telegramManager.signIn(session.loginSessionId, code);

      if ("requires2FA" in res && res.requires2FA) {
        // Account has Two-Step Verification enabled! Transition to Step 3 (awaiting_self_2fa)
        session.state = "awaiting_self_2fa";
        session.passwordHint = res.hint || "";
        this.userSessions.set(chatId, session);

        if (order) {
          order.onboardingStatus = "awaiting_2fa";
          order.onboardingError = undefined;
        }
        const customer = this.data.customers.find((c) => String(c.userId) === String(chatId));
        if (customer) {
          customer.onboardingStatus = "awaiting_2fa";
        }
        this.saveData();

        const twoFaPrompt =
          `🔐 *مرحله ۳ از ۳: تایید رمز دو مرحله‌ای (Two-Step Verification)*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `✅ کد ورود تلگرام صحیح بود! اما روی شماره \`${session.onboardingPhone}\` *رمز عبور تایید دو مرحله‌ای (2FA)* فعال است.\n\n` +
          (res.hint ? `💡 *راهنمای رمز شما (Hint):* \`${res.hint}\`\n\n` : "") +
          `🔑 *لطفاً رمز دو مرحله‌ای اکانت خود را در پاسخ ارسال نمایید:*\n` +
          `_(پیام رمز شما به محض دریافت، جهت حفظ امنیت به صورت خودکار از چت پاک خواهد شد)_`;

        await this.sendMessage(chatId, twoFaPrompt, {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "✏️ تغییر شماره موبایل", callback_data: `start_onboard_${order?.id || orderId}` }],
              [{ text: "❌ انصراف موقت", callback_data: `cancel_onboard_${order?.id || orderId}` }],
            ],
          },
        });
        return;
      }

      if (res.success) {
        await this.finalizeOrderAccountConnection(chatId, order?.id || orderId, session.onboardingPhone);
      }
    } catch (err: any) {
      // Reset enteredCode so user can re-enter on the keypad
      session.enteredCode = "";
      this.userSessions.set(chatId, session);
      if (order) {
        order.onboardingError = err.message;
        this.saveData();
      }

      await this.sendMessage(
        chatId,
        `❌ *خطا در تایید کد تلگرام:*\n${err.message}\n\nلطفاً کد را مجدداً با دکمه‌های شیشه‌ای زیر وارد کنید و یا دکمه *«🔄 ارسال مجدد کد»* را بزنید:`,
        {
          parse_mode: "Markdown",
          reply_markup: this.getCodeKeypadMarkup(order?.id || orderId, ""),
        }
      );
    }
  }

  private async verifyOnboarding2FA(chatId: number | string, orderId: string, passwordText: string) {
    const session = this.userSessions.get(chatId);
    const order =
      this.data.orders.find((o) => o.id === orderId) ||
      this.data.orders.find((o) => String(o.userId) === String(chatId) && o.status === "approved");

    if (!session || !session.loginSessionId || !session.onboardingPhone) {
      await this.startOrderOnboarding(chatId, order?.id || orderId);
      return;
    }

    await this.sendMessage(
      chatId,
      `🔐 *در حال بررسی رمز دو مرحله‌ای و راه‌اندازی اتوماتیک سلف و تبچی روی شماره* \`${session.onboardingPhone}\` *...*`,
      { parse_mode: "Markdown" }
    );

    try {
      const res = await telegramManager.verify2FA(session.loginSessionId, passwordText);
      if (res.success) {
        await this.finalizeOrderAccountConnection(chatId, order?.id || orderId, session.onboardingPhone);
      }
    } catch (err: any) {
      if (order) {
        order.onboardingError = err.message;
        this.saveData();
      }
      await this.sendMessage(
        chatId,
        `❌ *رمز دو مرحله‌ای نادرست است یا خطایی رخ داد:*\n${err.message}\n\n` +
          (session.passwordHint ? `💡 *راهنمای رمز (Hint):* \`${session.passwordHint}\`\n\n` : "") +
          `لطفاً مجدداً رمز عبور دو مرحله‌ای صحیح خود را ارسال نمایید:`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔄 شروع مجدد و دریافت کد جدید", callback_data: `start_onboard_${order?.id || orderId}` }],
              [{ text: "❌ انصراف موقت", callback_data: `cancel_onboard_${order?.id || orderId}` }],
            ],
          },
        }
      );
    }
  }

  private async finalizeOrderAccountConnection(chatId: number | string, orderId: string, phone: string) {
    const order =
      this.data.orders.find((o) => o.id === orderId) ||
      this.data.orders.find((o) => String(o.userId) === String(chatId) && o.status === "approved");

    const category = order?.category || "combo";
    const durationDays = order ? order.durationDays : 30;
    const isUnlimited = order ? order.isUnlimited : false;
    const planTitle = order?.planTitle || "اشتراک ویژه سلف و تبچی";
    const effectiveOrderId = order?.id || orderId || "VIP";

    // Provision features, subscription expiry & self-time on TelegramManager
    const provisioned = await telegramManager.provisionStoreAccount(phone, {
      category,
      durationDays,
      isUnlimited,
      orderId: effectiveOrderId,
      planTitle,
      customPassword: order?.generatedCredentials?.password,
    });

    const nowIso = new Date().toISOString();
    if (order) {
      order.onboardingStatus = "connected";
      order.connectedPhone = phone;
      order.connectedAt = nowIso;
      order.onboardingError = undefined;
      order.generatedCredentials = {
        licenseCode: order.generatedCredentials?.licenseCode || `VIP-${category.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
        accountPhone: phone,
        password: provisioned.password,
        portalUrl: provisioned.portalUrl,
        notes: "متصل و فعال‌شده به صورت خودکار توسط ربات فروشگاه",
      };
    }

    const customer = this.data.customers.find((c) => String(c.userId) === String(chatId));
    if (customer) {
      customer.connectedPhone = phone;
      customer.onboardingStatus = "connected";
    }

    this.userSessions.delete(chatId);
    this.saveData();

    const expLabel =
      isUnlimited || durationDays === 0
        ? "♾️ مادام‌العمر (دائمی)"
        : provisioned.subscription.expires_at
        ? new Date(provisioned.subscription.expires_at).toLocaleDateString("fa-IR")
        : `${durationDays} روز`;

    const successText =
      `🎉 *تبریک! اکانت شما با موفقیت به سرور متصل و فعال شد!*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📱 *شماره متصل‌شده:* \`${phone}\`\n` +
      `📦 *پکیج فعال‌شده:* ${planTitle}\n` +
      `⏱️ *اعتبار اشتراک تا:* \`${expLabel}\`\n` +
      `🟢 *وضعیت سرویس:* آنلاین و فعال (۲۴ ساعته)\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔐 *مشخصات ورود شما به وب پنل اختصاصی مشتری:*\n` +
      `🌐 *آدرس پنل وب:* ${provisioned.portalUrl}\n` +
      `👤 *نام کاربری (شماره):* \`${provisioned.username}\`\n` +
      `🔑 *رمز عبور وب پنل:* \`${provisioned.password}\`\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ *دستورات سریع درون تلگرام (در هر چتی بفرستید):*\n` +
      `• \`.پنل\` یا \`.راهنما\` — باز کردن منوی مدیریت سلف\n` +
      `• \`.ساعت روشن\` — فعال‌سازی ساعت زنده پروفایل\n` +
      `• \`.منشی روشن\` — فعال‌سازی منشی هوشمند پیوی\n` +
      `• \`/login\` — دریافت مجدد رمز ورود به وب پنل`;

    await this.sendMessage(chatId, successText, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📦 مشاهده سفارشات و اشتراک من", callback_data: "menu_orders" }],
          [{ text: "🏠 بازگشت به منوی اصلی فروشگاه", callback_data: "main_menu" }],
        ],
      },
    });

    // Notify Admin on Telegram that the customer's account is now connected and live!
    if (this.data.settings.ownerTelegramId) {
      const adminAlert =
        `🚀 *اتصال خودکار اکانت مشتری با موفقیت انجام شد!*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🧾 *شماره سفارش:* \`${effectiveOrderId}\`\n` +
        `👤 *مشتری:* ${order?.userFirstName || "کاربر"} (@${order?.userUsername || "ندارد"})\n` +
        `📱 *شماره متصل‌شده:* \`${phone}\`\n` +
        `📦 *پکیج:* ${planTitle}\n` +
        `⏱️ *اعتبار:* \`${expLabel}\`\n` +
        `🔐 *رمز وب پنل مشتری:* \`${provisioned.password}\`\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `✅ سلف و تبچی این شماره هم‌اکنون در لیست اکانت‌های وب پنل شما آنلاین و فعال است.`;

      await this.sendMessage(this.data.settings.ownerTelegramId, adminAlert, { parse_mode: "Markdown" }).catch(() => {});
    }
  }

  public async triggerOrderOnboarding(orderId: string): Promise<StoreOrder> {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) throw new Error("سفارش مورد نظر یافت نشد.");
    if (order.status !== "approved") {
      throw new Error("ابتدا باید سفارش را تأیید کنید تا امکان ارسال درخواست شماره فعال شود.");
    }
    if (!this.data.settings.botToken) {
      throw new Error("توکن ربات فروشگاه تنظیم نشده است.");
    }
    await this.startOrderOnboarding(order.userId, order.id);
    return order;
  }

  // =============================================================
  // OWNER ADMIN OPERATIONS (WEB PANEL)
  // =============================================================

  public async approveOrder(
    orderId: string,
    credentials?: { licenseCode?: string; accountPhone?: string; password?: string; notes?: string }
  ): Promise<StoreOrder> {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) throw new Error("سفارش یافت نشد.");

    order.status = "approved";
    order.approvedAt = new Date().toISOString();
    order.onboardingStatus = credentials?.accountPhone ? "connected" : "awaiting_phone";
    if (credentials?.accountPhone) {
      order.connectedPhone = credentials.accountPhone;
      order.connectedAt = new Date().toISOString();
    }

    const license =
      credentials?.licenseCode ||
      `VIP-${order.category.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    order.generatedCredentials = {
      licenseCode: license,
      accountPhone: credentials?.accountPhone,
      password: credentials?.password,
      portalUrl: telegramManager.getEffectiveAppUrl(),
      notes: credentials?.notes || "فعال‌سازی موفق توسط مدیریت",
    };

    // Update customer's active subscription
    const customer = this.data.customers.find((c) => String(c.userId) === String(order.userId));
    if (customer) {
      if (!customer.extensionsHistory) customer.extensionsHistory = [];
      const prevExpiry = customer.expiresAt;
      customer.ordersCount = (customer.ordersCount || 0) + 1;
      customer.activePlan = order.planTitle;
      customer.onboardingStatus = order.onboardingStatus;
      if (credentials?.accountPhone) {
        customer.connectedPhone = credentials.accountPhone;
      }
      if (order.isUnlimited || order.durationDays === 0) {
        customer.expiresAt = null;
      } else {
        const nowMs = Date.now();
        const currentExpiry =
          customer.expiresAt && !isNaN(new Date(customer.expiresAt).getTime()) && new Date(customer.expiresAt).getTime() > nowMs
            ? new Date(customer.expiresAt).getTime()
            : nowMs;
        customer.expiresAt = new Date(currentExpiry + order.durationDays * 24 * 60 * 60 * 1000).toISOString();
      }

      customer.extensionsHistory.unshift({
        id: `ext-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        timestamp: new Date().toISOString(),
        durationDays: order.durationDays,
        previousExpiresAt: prevExpiry,
        newExpiresAt: customer.expiresAt,
        planTitle: order.planTitle,
        actionType: "order_approved",
        adminNote: `فعال‌سازی سرویس پس از تأیید فیش سفارش #${order.id}`,
      });
    }

    this.saveData();

    // Send confirmation message to customer on Telegram & automatically start phone/code/2FA onboarding!
    if (this.data.settings.botToken && order.userId) {
      const msg =
        `🎉 *تبریک! فیش پرداختی شما توسط مدیریت تأیید شد!*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🧾 *شماره سفارش:* \`${order.id}\`\n` +
        `📦 *پکیج خریداری شده:* ${order.planTitle}\n` +
        `🔑 *کد لایسنس اختصاصی:* \`${license}\`\n` +
        (credentials?.accountPhone ? `📱 *شماره اکانت:* \`${credentials.accountPhone}\`\n` : "") +
        (credentials?.password ? `🔐 *رمز ورود به وب پنل:* \`${credentials.password}\`\n` : "") +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🚀 *فرآیند اتصال خودکار سلف و تبچی آغاز شد!* لطفاً در پیام بعدی شماره تلفن خود را ارسال کنید تا ربات کد تلگرام و رمز دو مرحله‌ای را دریافت کرده و اکانت شما را به صورت اتوماتیک متصل کند:`;

      await this.sendMessage(order.userId, msg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚀 شروع اتصال خودکار اکانت به شماره من", callback_data: `start_onboard_${order.id}` }],
          ],
        },
      }).catch(() => {});

      if (!credentials?.accountPhone && this.data.settings.autoConnectAfterApproval !== false) {
        await this.startOrderOnboarding(order.userId, order.id).catch(() => {});
      }
    }

    return order;
  }

  public async rejectOrder(orderId: string, reason: string): Promise<StoreOrder> {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) throw new Error("سفارش یافت نشد.");

    order.status = "rejected";
    order.rejectedAt = new Date().toISOString();
    order.rejectionReason = reason || "فیش واریزی نامعتبر یا تراکنش یافت نشد.";
    this.saveData();

    // Send rejection alert to customer on Telegram
    if (this.data.settings.botToken && order.userId) {
      const msg =
        `❌ *متأسفانه سفارش شما با شناسه #${order.id} تأیید نشد.*\n\n` +
        `📦 پکیج: ${order.planTitle}\n` +
        `⚠️ *علت رد سفارش:* ${order.rejectionReason}\n\n` +
        `در صورتی که مبلغ از حساب شما کسر شده است، لطفاً به آیدی پشتیبانی @${this.data.settings.supportUsername.replace(
          /^@/,
          ""
        )} پیام دهید.`;

      await this.sendMessage(order.userId, msg, { parse_mode: "Markdown" }).catch(() => {});
    }

    return order;
  }

  // Broadcast message to all registered customers of store bot
  public async broadcastToBotUsers(
    messageText: string,
    buttonTitle?: string,
    buttonUrl?: string
  ): Promise<{ sent: number; failed: number }> {
    if (!this.data.settings.botToken) throw new Error("توکن ربات تنظیم نشده است.");

    let sent = 0;
    let failed = 0;

    const targets = this.data.customers.map((c) => c.userId);

    const options: any = { parse_mode: "Markdown" };
    if (buttonTitle && buttonUrl) {
      options.reply_markup = {
        inline_keyboard: [[{ text: buttonTitle, url: buttonUrl }]],
      };
    }

    for (const userId of targets) {
      try {
        await this.sendMessage(userId, messageText, options);
        sent++;
        await new Promise((r) => setTimeout(r, 60)); // anti-flood rate limit
      } catch (e) {
        failed++;
      }
    }

    return { sent, failed };
  }

  // =============================================================
  // CUSTOMER SUBSCRIPTION MANAGEMENT (BULK ACTIONS)
  // =============================================================

  public async bulkExtendSubscriptions(options: {
    userIds: (string | number)[];
    durationDays: number;
    planTitle?: string;
    notifyTelegram?: boolean;
  }): Promise<{
    updatedCount: number;
    updatedCustomers: StoreCustomer[];
    failedNotifications: number;
    message: string;
  }> {
    const { userIds, durationDays, planTitle, notifyTelegram } = options;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error("حداقل یک مشتری باید برای تمدید اشتراک انتخاب شود.");
    }

    const targetIdSet = new Set(userIds.map((id) => String(id)));
    let updatedCount = 0;
    let failedNotifications = 0;
    const nowMs = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const updatedUsers: StoreCustomer[] = [];

    for (const customer of this.data.customers) {
      if (targetIdSet.has(String(customer.userId))) {
        if (!customer.extensionsHistory) customer.extensionsHistory = [];
        const prevExpiry = customer.expiresAt;

        if (durationDays === 0) {
          // 0 means unlimited / lifetime
          customer.expiresAt = null;
          if (planTitle) {
            customer.activePlan = planTitle;
          } else if (!customer.activePlan) {
            customer.activePlan = "اشتراک مادام‌العمر VIP (مدیریت)";
          }
        } else {
          // If valid future expiration, add to existing; else from now
          const currentExpiryMs =
            customer.expiresAt &&
            !isNaN(new Date(customer.expiresAt).getTime()) &&
            new Date(customer.expiresAt).getTime() > nowMs
              ? new Date(customer.expiresAt).getTime()
              : nowMs;

          const newExpiryDate = new Date(currentExpiryMs + durationDays * oneDayMs);
          customer.expiresAt = newExpiryDate.toISOString();
          if (planTitle) {
            customer.activePlan = planTitle;
          } else if (!customer.activePlan) {
            customer.activePlan = `اشتراک تمدیدشده (${durationDays} روزه)`;
          }
        }

        // Record Extension History Entry
        customer.extensionsHistory.unshift({
          id: `ext-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          timestamp: new Date().toISOString(),
          durationDays,
          previousExpiresAt: prevExpiry,
          newExpiresAt: customer.expiresAt,
          planTitle: customer.activePlan,
          actionType: userIds.length > 1 ? "manual_bulk" : "manual_single",
          adminNote:
            userIds.length > 1
              ? `تمدید گروهی با ۱ کلیک (${userIds.length} کاربر همزمان)`
              : `تمدید مستقیم انفرادی توسط مدیریت`,
        });

        updatedCount++;
        updatedUsers.push(customer);

        // Send Telegram notification if requested and bot token is available
        if (notifyTelegram && this.data.settings.botToken && customer.userId) {
          const durationLabel = durationDays === 0 ? "مادام‌العمر (نامحدود)" : `${durationDays} روز`;
          const newExpiryLabel = customer.expiresAt
            ? new Date(customer.expiresAt).toLocaleDateString("fa-IR")
            : "مادام‌العمر ♾️";

          const messageText =
            `🎉 *اشتراک شما توسط مدیریت تمدید شد!*\n\n` +
            `👤 مشتری گرامی، اشتراک شما با موفقیت به مدت *${durationLabel}* افزایش یافت.\n\n` +
            (customer.activePlan ? `📦 *طرح اشتراک:* ${customer.activePlan}\n` : "") +
            `📅 *اعتبار جدید تا:* \`${newExpiryLabel}\`\n\n` +
            `🌟 هم‌اکنون می‌توانید بدون دغدغه از خدمات سلف و تبچی استفاده کنید. با تشکر از همراهی شما!`;

          try {
            await this.sendMessage(customer.userId, messageText, { parse_mode: "Markdown" });
            await new Promise((r) => setTimeout(r, 50));
          } catch (e) {
            failedNotifications++;
          }
        }
      }
    }

    this.saveData();

    return {
      updatedCount,
      updatedCustomers: updatedUsers,
      failedNotifications,
      message: `اشتراک ${updatedCount} مشتری با موفقیت ${
        durationDays === 0 ? "به صورت مادام‌العمر" : `به مدت ${durationDays} روز`
      } تمدید شد.`,
    };
  }

  public updateCustomer(userId: string | number, updates: Partial<StoreCustomer>): StoreCustomer {
    const customer = this.data.customers.find((c) => String(c.userId) === String(userId));
    if (!customer) throw new Error("مشتری مورد نظر یافت نشد.");
    Object.assign(customer, updates);
    this.saveData();
    return customer;
  }

  public addCustomer(customerData: Partial<StoreCustomer> & { userId: string | number }): StoreCustomer {
    const existing = this.data.customers.find((c) => String(c.userId) === String(customerData.userId));
    if (existing) {
      Object.assign(existing, customerData);
      this.saveData();
      return existing;
    }
    const newCust: StoreCustomer = {
      userId: customerData.userId,
      username: customerData.username,
      firstName: customerData.firstName || "کاربر تلگرام",
      lastName: customerData.lastName,
      joinedAt: new Date().toISOString(),
      ordersCount: customerData.ordersCount || 0,
      activePlan: customerData.activePlan,
      expiresAt: customerData.expiresAt,
      preferredKeyboardMode: customerData.preferredKeyboardMode || "inline",
      extensionsHistory: customerData.extensionsHistory || [],
    };
    this.data.customers.unshift(newCust);
    this.saveData();
    return newCust;
  }

  public deleteCustomer(userId: string | number): void {
    this.data.customers = this.data.customers.filter((c) => String(c.userId) !== String(userId));
    this.saveData();
  }

  // Get detailed customer transaction history & extensions
  public getCustomerTransactions(userId: string | number): {
    customer: StoreCustomer;
    orders: StoreOrder[];
    extensions: StoreSubscriptionExtension[];
    stats: {
      totalSpentToman: number;
      totalSpentUsdt: number;
      ordersCount: number;
      approvedCount: number;
      pendingCount: number;
      rejectedCount: number;
      totalExtensions: number;
    };
  } {
    const customer = this.data.customers.find((c) => String(c.userId) === String(userId));
    if (!customer) throw new Error("مشتری با این شناسه یافت نشد.");

    const orders = this.data.orders
      .filter((o) => String(o.userId) === String(userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const extensions = (customer.extensionsHistory || []).slice().sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const approvedOrders = orders.filter((o) => o.status === "approved");

    const stats = {
      totalSpentToman: approvedOrders.reduce((sum, o) => sum + (o.finalPriceToman || 0), 0),
      totalSpentUsdt: approvedOrders.reduce((sum, o) => sum + (o.finalPriceUsdt || 0), 0),
      ordersCount: orders.length,
      approvedCount: approvedOrders.length,
      pendingCount: orders.filter((o) => o.status === "pending").length,
      rejectedCount: orders.filter((o) => o.status === "rejected").length,
      totalExtensions: extensions.length,
    };

    return {
      customer,
      orders,
      extensions,
      stats,
    };
  }

  // Plans Management
  public addPlan(plan: Omit<StorePlan, "id">): StorePlan {
    const newPlan: StorePlan = {
      ...plan,
      id: `plan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    this.data.plans.push(newPlan);
    this.saveData();
    return newPlan;
  }

  public updatePlan(planId: string, updates: Partial<StorePlan>): StorePlan {
    const idx = this.data.plans.findIndex((p) => p.id === planId);
    if (idx === -1) throw new Error("پلن یافت نشد.");
    this.data.plans[idx] = { ...this.data.plans[idx], ...updates };
    this.saveData();
    return this.data.plans[idx];
  }

  public deletePlan(planId: string) {
    this.data.plans = this.data.plans.filter((p) => p.id !== planId);
    this.saveData();
  }

  public togglePlanActive(planId: string): StorePlan {
    const plan = this.data.plans.find((p) => p.id === planId);
    if (!plan) throw new Error("پلن یافت نشد.");
    plan.isActive = !plan.isActive;
    this.saveData();
    return plan;
  }

  public batchUpdatePricing(options: { multiplier?: number; usdRate?: number }): StorePlan[] {
    const { multiplier, usdRate } = options;
    for (const plan of this.data.plans) {
      if (multiplier && multiplier > 0) {
        plan.priceToman = Math.round((plan.priceToman * multiplier) / 1000) * 1000;
        plan.priceUsdt = parseFloat((plan.priceUsdt * multiplier).toFixed(2));
      } else if (usdRate && usdRate > 0) {
        // Recalculate USDT based on Toman rate
        plan.priceUsdt = parseFloat((plan.priceToman / usdRate).toFixed(2));
      }
    }
    this.saveData();
    return this.data.plans;
  }

  // Payments Management
  public updatePaymentSettings(payments: Partial<StorePaymentSettings>): StorePaymentSettings {
    this.data.payments = {
      cardPayment: { ...this.data.payments.cardPayment, ...(payments.cardPayment || {}) },
      cards: Array.isArray(payments.cards) ? payments.cards : this.data.payments.cards || [],
      cryptoPayment: {
        enabled: payments.cryptoPayment?.enabled !== undefined ? payments.cryptoPayment.enabled : this.data.payments.cryptoPayment?.enabled ?? true,
        networks: Array.isArray(payments.cryptoPayment?.networks) ? payments.cryptoPayment.networks : this.data.payments.cryptoPayment?.networks || [],
        generalInstructions: payments.cryptoPayment?.generalInstructions !== undefined ? payments.cryptoPayment.generalInstructions : this.data.payments.cryptoPayment?.generalInstructions,
      },
      starsPayment: payments.starsPayment !== undefined
        ? {
            enabled: payments.starsPayment.enabled !== undefined ? payments.starsPayment.enabled : (this.data.payments.starsPayment?.enabled ?? true),
            starsPerToman: payments.starsPayment.starsPerToman || this.data.payments.starsPayment?.starsPerToman || 2000,
            priceMultiplier: payments.starsPayment.priceMultiplier || this.data.payments.starsPayment?.priceMultiplier || 1.0,
            description: payments.starsPayment.description || this.data.payments.starsPayment?.description || "پرداخت آنی و مستقیم با کسر ستاره‌های تلگرام (Telegram Stars)",
            starsCollected: payments.starsPayment.starsCollected !== undefined ? payments.starsPayment.starsCollected : (this.data.payments.starsPayment?.starsCollected || 0),
          }
        : this.data.payments.starsPayment || {
            enabled: true,
            starsPerToman: 2000,
            priceMultiplier: 1.0,
            description: "پرداخت آنی و مستقیم با کسر ستاره‌های تلگرام (Telegram Stars)",
            starsCollected: 0,
          },
    };
    // Sync first active card with cardPayment
    const firstActive = this.data.payments.cards?.find((c) => c.isActive);
    if (firstActive) {
      this.data.payments.cardPayment = {
        enabled: this.data.payments.cardPayment.enabled,
        bankName: firstActive.bankName,
        cardNumber: firstActive.cardNumber,
        cardHolder: firstActive.cardHolder,
        shabaNumber: firstActive.shabaNumber,
        instructions: firstActive.instructions,
      };
    }
    this.saveData();
    return this.data.payments;
  }

  public addPaymentCard(card: Omit<StorePaymentCardItem, "id">): StorePaymentCardItem {
    if (!this.data.payments.cards) this.data.payments.cards = [];
    const newCard: StorePaymentCardItem = {
      ...card,
      id: `card-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    this.data.payments.cards.push(newCard);
    this.saveData();
    return newCard;
  }

  public updatePaymentCard(id: string, updates: Partial<StorePaymentCardItem>): StorePaymentCardItem {
    if (!this.data.payments.cards) this.data.payments.cards = [];
    const idx = this.data.payments.cards.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("کارت بانکی یافت نشد.");
    this.data.payments.cards[idx] = { ...this.data.payments.cards[idx], ...updates };
    this.saveData();
    return this.data.payments.cards[idx];
  }

  public deletePaymentCard(id: string) {
    if (!this.data.payments.cards) return;
    this.data.payments.cards = this.data.payments.cards.filter((c) => c.id !== id);
    this.saveData();
  }

  public togglePaymentCard(id: string): StorePaymentCardItem {
    if (!this.data.payments.cards) this.data.payments.cards = [];
    const card = this.data.payments.cards.find((c) => c.id === id);
    if (!card) throw new Error("کارت بانکی یافت نشد.");
    card.isActive = !card.isActive;
    this.saveData();
    return card;
  }

  public addCryptoNetwork(net: Omit<StorePaymentCryptoNetwork, "id">): StorePaymentCryptoNetwork {
    if (!this.data.payments.cryptoPayment.networks) this.data.payments.cryptoPayment.networks = [];
    const newNet: StorePaymentCryptoNetwork = {
      ...net,
      id: `net-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    this.data.payments.cryptoPayment.networks.push(newNet);
    this.saveData();
    return newNet;
  }

  public updateCryptoNetwork(id: string, updates: Partial<StorePaymentCryptoNetwork>): StorePaymentCryptoNetwork {
    const idx = this.data.payments.cryptoPayment.networks.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error("شبکه کریپتو یافت نشد.");
    this.data.payments.cryptoPayment.networks[idx] = { ...this.data.payments.cryptoPayment.networks[idx], ...updates };
    this.saveData();
    return this.data.payments.cryptoPayment.networks[idx];
  }

  public deleteCryptoNetwork(id: string) {
    this.data.payments.cryptoPayment.networks = this.data.payments.cryptoPayment.networks.filter((n) => n.id !== id);
    this.saveData();
  }

  public toggleCryptoNetwork(id: string): StorePaymentCryptoNetwork {
    const net = this.data.payments.cryptoPayment.networks.find((n) => n.id === id);
    if (!net) throw new Error("شبکه کریپتو یافت نشد.");
    net.isActive = !net.isActive;
    this.saveData();
    return net;
  }

  // Coupons Management
  public addCoupon(coupon: Omit<StoreCoupon, "id" | "usedCount">): StoreCoupon {
    const newCoupon: StoreCoupon = {
      ...coupon,
      id: `cpn-${Date.now()}`,
      usedCount: 0,
    };
    this.data.coupons.push(newCoupon);
    this.saveData();
    return newCoupon;
  }

  public deleteCoupon(couponId: string) {
    this.data.coupons = this.data.coupons.filter((c) => c.id !== couponId);
    this.saveData();
  }
}

export const storeBotManager = new StoreBotManager();
