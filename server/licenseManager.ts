process.env.TZ = "Asia/Tehran";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import os from "os";

const DATA_DIR = path.join(process.cwd(), "data");
const LICENSE_FILE = path.join(DATA_DIR, "system_license.json");
const KEYS_FILE = path.join(DATA_DIR, "license_keys.json");
const BURNED_KEYS_LOCAL_FILE = path.join(DATA_DIR, "burned_license_keys.json");
const BURNED_KEYS_SYSTEM_FILE = "/var/tmp/.samkaren_v6_burned_keys.json";

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const FREE_ACCOUNTS_LIMIT = 10;

export const OFFICIAL_CRYPTO_WALLETS = {
  tron: {
    name: "ترون (Tron TRX / USDT-TRC20)",
    symbol: "TRX / USDT",
    network: "TRON (TRC20)",
    address: "TBgTK3Png5D467cvCnwfA3xdLvUgJbpAfy",
  },
  ton: {
    name: "تون (The Open Network)",
    symbol: "TON",
    network: "TON",
    address: "UQAozwWDvLXgp4XWS0t8Z9xYdmN5iJ76anD5XD3y74rdhQP-",
  },
};

export const OFFICIAL_LICENSE_PLANS = [
  {
    id: "1m",
    durationDays: 30,
    titleFa: "اشتراک ۱ ماهه مولتی‌اکانت (+۱۰ شماره)",
    priceTon: 1.2,
    priceTrx: 26,
    equivalentUsdt: 6.6,
    badge: "محبوب",
  },
  {
    id: "3m",
    durationDays: 90,
    titleFa: "اشتراک ۳ ماهه مولتی‌اکانت (+۱۰ شماره)",
    priceTon: 3.6,
    priceTrx: 78,
    equivalentUsdt: 19.8,
    badge: "تخفیف ویژه",
  },
  {
    id: "1y",
    durationDays: 365,
    titleFa: "اشتراک ۱ ساله VIP نامحدود (+۱۰ شماره)",
    priceTon: 14.4,
    priceTrx: 312,
    equivalentUsdt: 79.2,
    badge: "پیشنهاد طلایی",
  },
];

export const OFFICIAL_SUPPORT_TELEGRAM = "@samkarendev";

export interface SystemLicense {
  status: "active" | "expired" | "none";
  key: string | null;
  planTitle: string;
  activatedAt: number | null;
  expiresAt: number | null;
  maxAccounts: number;
  features: string[];
  customerName?: string;
  customerPhone?: string;
}

export interface LicenseKeyRecord {
  key: string;
  durationDays: number;
  maxAccounts: number;
  createdAt: number;
  isUsed: boolean;
  isDisabled?: boolean;
  usedAt?: number;
  usedBy?: string;
  note?: string;
}

export interface LicenseStatusResult {
  status: "active" | "expired" | "none";
  isLicensed: boolean;
  planTitle: string;
  currentAccounts: number;
  freeLimit: number;
  maxAllowed: number;
  remainingSlots: number;
  canConnectMore: boolean;
  activatedAt: number | null;
  expiresAt: number | null;
  daysRemaining: number;
  formattedExpiresAt?: string;
  activeKeyMasked?: string;
  features: string[];
  wallets: typeof OFFICIAL_CRYPTO_WALLETS;
  plans: typeof OFFICIAL_LICENSE_PLANS;
  supportTelegram: string;
}

class LicenseManager {
  private currentLicense: SystemLicense;
  private keys: LicenseKeyRecord[] = [];
  private burnedKeys: Set<string> = new Set();

  constructor() {
    this.currentLicense = this.loadLicense();
    this.keys = this.loadKeys();
    this.burnedKeys = this.loadBurnedKeys();
    this.seedDefaultKeysIfEmpty();
  }

  private hashKey(rawKey: string): string {
    return crypto
      .createHash("sha256")
      .update((rawKey || "").trim().toUpperCase())
      .digest("hex");
  }

  private loadBurnedKeys(): Set<string> {
    const set = new Set<string>();
    for (const file of [BURNED_KEYS_LOCAL_FILE, BURNED_KEYS_SYSTEM_FILE]) {
      try {
        if (fs.existsSync(file)) {
          const arr = JSON.parse(fs.readFileSync(file, "utf-8"));
          if (Array.isArray(arr)) {
            arr.forEach((item) => {
              if (typeof item === "string") set.add(item);
            });
          }
        }
      } catch (_) {}
    }
    // Also sync any already-used keys from this.keys
    for (const k of this.keys) {
      if (k.isUsed) {
        set.add(k.key.toUpperCase());
        set.add(this.hashKey(k.key));
      }
    }
    return set;
  }

  private markKeyBurnedPermanently(rawKey: string) {
    const clean = (rawKey || "").trim().toUpperCase();
    const hashed = this.hashKey(clean);
    this.burnedKeys.add(clean);
    this.burnedKeys.add(hashed);
    const serialized = JSON.stringify(Array.from(this.burnedKeys), null, 2);
    for (const file of [BURNED_KEYS_LOCAL_FILE, BURNED_KEYS_SYSTEM_FILE]) {
      try {
        fs.writeFileSync(file, serialized, "utf-8");
      } catch (_) {}
    }
  }

  private isKeyBurned(rawKey: string): boolean {
    const clean = (rawKey || "").trim().toUpperCase();
    const hashed = this.hashKey(clean);
    return this.burnedKeys.has(clean) || this.burnedKeys.has(hashed);
  }

  private loadLicense(): SystemLicense {
    try {
      if (fs.existsSync(LICENSE_FILE)) {
        const raw = fs.readFileSync(LICENSE_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        return {
          status: parsed.status || "none",
          key: parsed.key || null,
          planTitle: parsed.planTitle || "نسخه رایگان (محدود به ۱۰ اکانت)",
          activatedAt: parsed.activatedAt || null,
          expiresAt: parsed.expiresAt || null,
          maxAccounts: parsed.maxAccounts || FREE_ACCOUNTS_LIMIT,
          features: Array.isArray(parsed.features) ? parsed.features : [],
          customerName: parsed.customerName,
          customerPhone: parsed.customerPhone,
        };
      }
    } catch (e) {
      console.error("[LicenseManager] Error loading license:", e);
    }

    return {
      status: "none",
      key: null,
      planTitle: "نسخه رایگان (محدود به ۱۰ اکانت)",
      activatedAt: null,
      expiresAt: null,
      maxAccounts: FREE_ACCOUNTS_LIMIT,
      features: ["basic_self", "basic_tabchi", "up_to_10_accounts"],
    };
  }

  private saveLicense() {
    try {
      fs.writeFileSync(LICENSE_FILE, JSON.stringify(this.currentLicense, null, 2), "utf-8");
    } catch (e) {
      console.error("[LicenseManager] Error saving license:", e);
    }
  }

  private loadKeys(): LicenseKeyRecord[] {
    try {
      if (fs.existsSync(KEYS_FILE)) {
        const raw = fs.readFileSync(KEYS_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error("[LicenseManager] Error loading keys:", e);
    }
    return [];
  }

  private saveKeys() {
    try {
      fs.writeFileSync(KEYS_FILE, JSON.stringify(this.keys, null, 2), "utf-8");
    } catch (e) {
      console.error("[LicenseManager] Error saving keys:", e);
    }
  }

  private seedDefaultKeysIfEmpty() {
    if (this.keys.length === 0) {
      this.generateKey(30, 9999, "لایسنس ۱ ماهه آماده فروش (۳۰ روزه)");
      this.generateKey(90, 9999, "لایسنس ۳ ماهه آماده فروش (۹۰ روزه)");
      this.generateKey(365, 9999, "لایسنس ۱ ساله VIP آماده فروش (۳۶۵ روزه)");
    }
  }

  /**
   * Evaluates active status and auto-expires if time is past.
   */
  public getStatus(currentAccountsCount: number): LicenseStatusResult {
    const now = Date.now();

    // Check if the active key was disabled by creator
    if (this.currentLicense.status === "active" && this.currentLicense.key) {
      const activeRec = this.keys.find(
        (k) => k.key.toUpperCase() === this.currentLicense.key?.toUpperCase()
      );
      if (activeRec && activeRec.isDisabled) {
        this.currentLicense.status = "expired";
        this.currentLicense.planTitle = "لایسنس غیرفعال‌شده توسط سازنده";
        this.saveLicense();
      }
    }

    // Check expiration
    if (
      this.currentLicense.status === "active" &&
      this.currentLicense.expiresAt &&
      now > this.currentLicense.expiresAt
    ) {
      this.currentLicense.status = "expired";
      this.currentLicense.planTitle = "لایسنس ماهانه منقضی‌شده";
      this.saveLicense();
    }

    const isLicensed = this.currentLicense.status === "active";
    const maxAllowed = isLicensed ? (this.currentLicense.maxAccounts || 9999) : FREE_ACCOUNTS_LIMIT;
    const remainingSlots = Math.max(0, maxAllowed - currentAccountsCount);
    const canConnectMore = currentAccountsCount < maxAllowed;

    let daysRemaining = 0;
    let formattedExpiresAt: string | undefined = undefined;

    if (this.currentLicense.expiresAt && isLicensed) {
      const msLeft = this.currentLicense.expiresAt - now;
      daysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
      formattedExpiresAt = new Date(this.currentLicense.expiresAt).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    let activeKeyMasked: string | undefined = undefined;
    if (this.currentLicense.key) {
      const k = this.currentLicense.key;
      activeKeyMasked = k.length > 8 ? `${k.slice(0, 4)}...${k.slice(-4)}` : k;
    }

    return {
      status: this.currentLicense.status,
      isLicensed,
      planTitle: isLicensed
        ? this.currentLicense.planTitle || "لایسنس ماهانه مولتی‌اکانت فعال"
        : `پلن رایگان (حداکثر ${FREE_ACCOUNTS_LIMIT} اکانت)`,
      currentAccounts: currentAccountsCount,
      freeLimit: FREE_ACCOUNTS_LIMIT,
      maxAllowed,
      remainingSlots,
      canConnectMore,
      activatedAt: this.currentLicense.activatedAt,
      expiresAt: this.currentLicense.expiresAt,
      daysRemaining,
      formattedExpiresAt,
      activeKeyMasked,
      features: isLicensed
        ? [
            "اتصال نامحدود و بدون سقف شماره‌ها (> ۱۰ اکانت)",
            "استفاده همزمان از تمام قابلیت‌های سلف و تبچی",
            "سرعت و اولویت پردازش بالاتر در صف پیام‌ها",
            "مانیتورینگ و پشتیبان‌گیری ابری خودکار",
          ]
        : [`امکان اتصال حداکثر ${FREE_ACCOUNTS_LIMIT} شماره تلفن`],
      wallets: OFFICIAL_CRYPTO_WALLETS,
      plans: OFFICIAL_LICENSE_PLANS,
      supportTelegram: OFFICIAL_SUPPORT_TELEGRAM,
    };
  }

  /**
   * Verifies if adding a new account is allowed.
   */
  public checkAccountLimit(currentAccountsCount: number, targetPhone?: string, existingPhones: string[] = []): {
    allowed: boolean;
    reason?: string;
    code?: string;
    freeLimit: number;
    currentAccounts: number;
    maxAllowed: number;
  } {
    const status = this.getStatus(currentAccountsCount);

    // If the phone is already in the system, allow re-authentication/refresh
    if (targetPhone && existingPhones.some((p) => p.replace(/\D/g, "") === targetPhone.replace(/\D/g, ""))) {
      return {
        allowed: true,
        freeLimit: FREE_ACCOUNTS_LIMIT,
        currentAccounts: currentAccountsCount,
        maxAllowed: status.maxAllowed,
      };
    }

    if (!status.canConnectMore) {
      return {
        allowed: false,
        code: "LICENSE_LIMIT_EXCEEDED",
        reason: `🔒 شما به سقف مجاز ${FREE_ACCOUNTS_LIMIT} اکانت رایگان رسیده‌اید. برای اتصال شماره ${currentAccountsCount + 1} به بعد، لطفاً لایسنس ماهانه (اتصال نامحدود اکانت) را تهیه یا فعال کنید.`,
        freeLimit: FREE_ACCOUNTS_LIMIT,
        currentAccounts: currentAccountsCount,
        maxAllowed: status.maxAllowed,
      };
    }

    return {
      allowed: true,
      freeLimit: FREE_ACCOUNTS_LIMIT,
      currentAccounts: currentAccountsCount,
      maxAllowed: status.maxAllowed,
    };
  }

  private computeKeySignature(durationDays: number, nonce: string): string {
    const secret = "SAMKAREN12_OFFICIAL_CREATOR_MASTER_KEY_V6";
    return crypto
      .createHmac("sha256", secret)
      .update(`${durationDays}:${nonce.toUpperCase()}`)
      .digest("hex")
      .slice(0, 8)
      .toUpperCase();
  }

  public verifyCreatorCredentials(username?: string, password?: string): boolean {
    const u = (username || "").trim();
    const p = (password || "").trim();
    if (!u || !p) return false;
    const validUser = u === "@Samkaren12" || u.toLowerCase() === "@samkaren12";
    const validPass = p === "@Samkaren12" || p.toLowerCase() === "@samkaren12";
    return validUser && validPass;
  }

  /**
   * Activates a license key on the server owner's panel.
   * Supports both locally generated keys and cryptographically signed keys issued by @Samkaren12 for any remote server.
   */
  public activateLicense(
    rawKey: string,
    customerInfo?: { name?: string; phone?: string; currentAccountsCount?: number }
  ): {
    success: boolean;
    message: string;
    license?: LicenseStatusResult;
  } {
    const cleanKey = (rawKey || "").trim().toUpperCase();
    if (!cleanKey) {
      return { success: false, message: "لطفاً کد لایسنس دریافتی از سازنده را وارد کنید." };
    }

    // Check in registered / previously used keys or system-level burned keys ledger
    let matchedRecord = this.keys.find((k) => k.key.toUpperCase() === cleanKey);
    if (matchedRecord && matchedRecord.isDisabled) {
      return {
        success: false,
        message: "این کد لایسنس توسط سازنده غیرفعال (مسدود) شده است. جهت بررسی با پشتیبانی در ارتباط باشید.",
      };
    }
    if ((matchedRecord && matchedRecord.isUsed) || this.isKeyBurned(cleanKey)) {
      return {
        success: false,
        message: `❌ این کد لایسنس یک‌بار مصرف بوده و قبلاً استفاده و سوزانده شده است! هر کد لایسنس فقط یک بار قابل فعال‌سازی می‌باشد.`,
      };
    }

    let durationDays = 30;
    let maxAccounts = 9999;
    let isValidKey = false;

    // 1. Check cryptographic signature format: SAM-<DAYS>D-<NONCE6>-<SIG8>
    const signedMatch = cleanKey.match(/^SAM-(\d+)D-([A-F0-9]{6})-([A-F0-9]{8})$/);
    if (signedMatch) {
      const parsedDays = parseInt(signedMatch[1], 10);
      const nonce = signedMatch[2];
      const providedSig = signedMatch[3];
      const expectedSig = this.computeKeySignature(parsedDays, nonce);
      if (parsedDays > 0 && providedSig === expectedSig) {
        durationDays = parsedDays;
        isValidKey = true;
      }
    }

    // 2. Check if stored in local keys list
    if (!isValidKey && matchedRecord && !matchedRecord.isUsed) {
      durationDays = matchedRecord.durationDays || 30;
      maxAccounts = matchedRecord.maxAccounts || 9999;
      isValidKey = true;
    }

    if (!isValidKey) {
      return {
        success: false,
        message: "کد لایسنس وارد شده نامعتبر است! لطفاً کد لایسنس معتبر را از سازنده اسکریپت (@samkarendev) تهیه نمایید.",
      };
    }

    const now = Date.now();
    const expiresAt = now + durationDays * 24 * 60 * 60 * 1000;

    let planLabel = `لایسنس VIP مولتی‌اکانت (${durationDays} روزه - اکانت نامحدود)`;
    if (durationDays === 30) {
      planLabel = "لایسنس ۱ ماهه VIP (۳۰ روزه - اتصال نامحدود اکانت)";
    } else if (durationDays === 90) {
      planLabel = "لایسنس ۳ ماهه VIP (۹۰ روزه - اتصال نامحدود اکانت)";
    } else if (durationDays === 365) {
      planLabel = "لایسنس ۱ ساله طلایی VIP (۳۶۵ روزه - اتصال نامحدود اکانت)";
    }

    this.currentLicense = {
      status: "active",
      key: cleanKey,
      planTitle: planLabel,
      activatedAt: now,
      expiresAt,
      maxAccounts,
      features: [
        "اتصال نامحدود اکانت‌های تلگرام (> ۱۰ شماره)",
        "ارسال همزمان و بدون تاخیر تبچی",
        "ساعت زنده و تمام ماژول‌های کازمیک",
        "پشتیبان‌گیری ابری و لاگ حسابرسی",
      ],
      customerName: customerInfo?.name,
      customerPhone: customerInfo?.phone,
    };

    this.saveLicense();

    if (matchedRecord) {
      matchedRecord.isUsed = true;
      matchedRecord.usedAt = now;
      matchedRecord.usedBy = customerInfo?.phone || customerInfo?.name || "server_owner";
    } else {
      // Record remote signed key so it cannot be reused on this server
      this.keys.unshift({
        key: cleanKey,
        durationDays,
        maxAccounts,
        createdAt: now,
        isUsed: true,
        usedAt: now,
        usedBy: customerInfo?.phone || customerInfo?.name || "server_owner",
        note: `فعال‌شده روی سرور (${durationDays} روزه - یک‌بار مصرف)`,
      });
    }
    this.saveKeys();
    this.markKeyBurnedPermanently(cleanKey);

    const accountsCount = customerInfo?.currentAccountsCount || 0;
    return {
      success: true,
      message: `🎉 لایسنس یک‌بار مصرف شما با موفقیت به مدت ${durationDays} روز فعال شد! محدودیت ۱۰ اکانت برداشته شد و اکنون می‌توانید بدون سقف شماره به سرور خود متصل کنید.`,
      license: this.getStatus(accountsCount),
    };
  }

  /**
   * Generates a new cryptographically signed license key for sales by @Samkaren12.
   * Works on both this server and any customer's remote server!
   */
  public generateKey(durationDays: number = 30, maxAccounts: number = 9999, note?: string): LicenseKeyRecord {
    const validDays = Math.max(1, Math.floor(Number(durationDays) || 30));
    const nonce = crypto.randomBytes(3).toString("hex").toUpperCase();
    const sig = this.computeKeySignature(validDays, nonce);
    const key = `SAM-${validDays}D-${nonce}-${sig}`;

    const record: LicenseKeyRecord = {
      key,
      durationDays: validDays,
      maxAccounts,
      createdAt: Date.now(),
      isUsed: false,
      note: note || `لایسنس ${validDays} روزه مولتی‌اکانت`,
    };

    this.keys.unshift(record);
    this.saveKeys();
    return record;
  }

  public deleteKey(targetKey: string): boolean {
    const before = this.keys.length;
    this.keys = this.keys.filter((k) => k.key !== targetKey);
    if (this.keys.length !== before) {
      if (this.currentLicense.key?.toUpperCase() === targetKey.toUpperCase()) {
        this.revokeLicense();
      }
      this.saveKeys();
      return true;
    }
    return false;
  }

  /**
   * Toggles a specific license key between Enabled and Disabled (Suspended),
   * and syncs with the server's active license if it matches.
   */
  public toggleKeyStatus(
    targetKey: string,
    currentAccountsCount: number = 0
  ): {
    success: boolean;
    key?: LicenseKeyRecord;
    keys: LicenseKeyRecord[];
    license: LicenseStatusResult;
    message: string;
  } {
    const cleanKey = (targetKey || "").trim().toUpperCase();
    const record = this.keys.find((k) => k.key.toUpperCase() === cleanKey);
    if (!record) {
      return {
        success: false,
        keys: this.keys,
        license: this.getStatus(currentAccountsCount),
        message: "کلید لایسنس مورد نظر یافت نشد.",
      };
    }

    record.isDisabled = !record.isDisabled;
    const now = Date.now();

    if (record.isDisabled) {
      // If this key is currently active on the server, immediately disable the server license
      if (this.currentLicense.key?.toUpperCase() === cleanKey) {
        this.currentLicense.status = "expired";
        this.currentLicense.planTitle = "لایسنس غیرفعال‌شده توسط سازنده";
        this.saveLicense();
      }
    } else {
      // Re-enabled by creator! If it was the server's key (or if creator wants it active), restore active status
      if (this.currentLicense.key?.toUpperCase() === cleanKey) {
        const remainingValid =
          this.currentLicense.expiresAt && this.currentLicense.expiresAt > now
            ? this.currentLicense.expiresAt
            : now + (record.durationDays || 30) * 24 * 60 * 60 * 1000;
        this.currentLicense.status = "active";
        this.currentLicense.expiresAt = remainingValid;
        this.currentLicense.planTitle = `لایسنس VIP مولتی‌اکانت (${record.durationDays} روزه - فعال)`;
        this.saveLicense();
      }
    }

    this.saveKeys();
    return {
      success: true,
      key: record,
      keys: this.keys,
      license: this.getStatus(currentAccountsCount),
      message: record.isDisabled
        ? `کد لایسنس ${record.key} غیرفعال (مسدود) شد.`
        : `کد لایسنس ${record.key} مجدداً فعال شد و قابل استفاده است.`,
    };
  }

  /**
   * Directly enables or disables the active license on the current server by the Creator.
   */
  public setServerLicenseActive(
    enable: boolean,
    durationDays: number = 30,
    currentAccountsCount: number = 0,
    targetKey?: string
  ): {
    success: boolean;
    keys: LicenseKeyRecord[];
    license: LicenseStatusResult;
    message: string;
  } {
    const now = Date.now();

    if (!enable) {
      if (this.currentLicense.key) {
        const rec = this.keys.find(
          (k) => k.key.toUpperCase() === this.currentLicense.key?.toUpperCase()
        );
        if (rec) {
          rec.isDisabled = true;
          this.saveKeys();
        }
      }
      this.currentLicense.status = "expired";
      this.currentLicense.planTitle = "لایسنس غیرفعال‌شده توسط سازنده";
      this.saveLicense();
      return {
        success: true,
        keys: this.keys,
        license: this.getStatus(currentAccountsCount),
        message: "لایسنس سرور با موفقیت غیرفعال شد و محدودیت ۱۰ اکانت اعمال گردید.",
      };
    }

    // Enabling server license
    let keyToUse = targetKey || this.currentLicense.key;
    let days = Math.max(1, Number(durationDays) || 30);

    if (keyToUse) {
      const rec = this.keys.find((k) => k.key.toUpperCase() === keyToUse!.toUpperCase());
      if (rec) {
        rec.isDisabled = false;
        rec.isUsed = true;
        rec.usedAt = now;
        days = rec.durationDays || days;
        this.saveKeys();
      }
    } else {
      const generated = this.generateKey(days, 9999, `فعال‌سازی مستقیم توسط سازنده (${days} روزه)`);
      generated.isUsed = true;
      generated.usedAt = now;
      keyToUse = generated.key;
      this.saveKeys();
    }

    const expiresAt = now + days * 24 * 60 * 60 * 1000;
    this.currentLicense = {
      status: "active",
      key: keyToUse,
      planTitle: `لایسنس VIP مولتی‌اکانت (${days} روزه - فعال توسط سازنده)`,
      activatedAt: now,
      expiresAt,
      maxAccounts: 9999,
      features: [
        "اتصال نامحدود اکانت‌های تلگرام (> ۱۰ شماره)",
        "ارسال همزمان و بدون تاخیر تبچی",
        "ساعت زنده و تمام ماژول‌های کازمیک",
      ],
    };
    this.saveLicense();

    return {
      success: true,
      keys: this.keys,
      license: this.getStatus(currentAccountsCount),
      message: `لایسنس سرور با موفقیت به مدت ${days} روز فعال شد!`,
    };
  }

  /**
   * Revokes the current license back to free.
   */
  public revokeLicense(currentAccountsCount: number = 0): LicenseStatusResult {
    this.currentLicense = {
      status: "none",
      key: null,
      planTitle: "نسخه رایگان (محدود به ۱۰ اکانت)",
      activatedAt: null,
      expiresAt: null,
      maxAccounts: FREE_ACCOUNTS_LIMIT,
      features: ["basic_self", "basic_tabchi", "up_to_10_accounts"],
    };
    this.saveLicense();
    return this.getStatus(currentAccountsCount);
  }

  public getKeysList(): LicenseKeyRecord[] {
    return this.keys;
  }
}

export const licenseManager = new LicenseManager();
