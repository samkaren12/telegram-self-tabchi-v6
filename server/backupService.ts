import fs from "fs";
import path from "path";
import crypto from "crypto";
import { TelegramAccount, SmartFilterRule } from "../src/types";

export interface AutoBackupConfig {
  enabled: boolean;
  schedule: "hourly" | "every_6_hours" | "daily" | "weekly";
  passphrase?: string;
  retentionCount: number;
  includeSessions: boolean;
  includeFilterRules: boolean;
  lastBackupAt?: string;
  nextBackupAt?: string;
  lastBackupFilename?: string;
  lastBackupStatus?: "success" | "error";
  lastBackupError?: string;
}

export interface StoredBackupInfo {
  filename: string;
  sizeBytes: number;
  createdAt: string;
  accountsCount: number;
  rulesCount: number;
  encrypted: boolean;
  algorithm: string;
}

const BACKUP_DIR = path.resolve(process.cwd(), "data", "backups");
const CONFIG_FILE = path.resolve(process.cwd(), "data", "backup_config.json");

export class BackupService {
  private config: AutoBackupConfig;
  private timer: NodeJS.Timeout | null = null;
  private telegramManager: any = null;

  constructor() {
    this.ensureDirectory();
    this.config = this.loadConfig();
  }

  private ensureDirectory() {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
  }

  private loadConfig(): AutoBackupConfig {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (_) {}

    return {
      enabled: true,
      schedule: "daily",
      passphrase: "",
      retentionCount: 10,
      includeSessions: true,
      includeFilterRules: true,
      lastBackupAt: undefined,
      nextBackupAt: this.calculateNextRun("daily"),
    };
  }

  private saveConfig() {
    try {
      this.ensureDirectory();
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), "utf-8");
    } catch (err: any) {
      console.error("Failed to save backup config:", err.message);
    }
  }

  public getConfig(): AutoBackupConfig {
    return {
      ...this.config,
      // Do not expose plaintext passphrase unless needed
      passphrase: this.config.passphrase ? "********" : "",
    };
  }

  public getRawPassphrase(): string {
    return this.config.passphrase || "";
  }

  public updateConfig(newConfig: Partial<AutoBackupConfig>): AutoBackupConfig {
    const prevSchedule = this.config.schedule;
    const prevEnabled = this.config.enabled;

    this.config = {
      ...this.config,
      ...newConfig,
    };

    // If schedule changed or re-enabled, recalculate next backup run
    if (newConfig.schedule !== prevSchedule || (newConfig.enabled && !prevEnabled)) {
      this.config.nextBackupAt = this.calculateNextRun(this.config.schedule);
    }

    if (!this.config.enabled) {
      this.config.nextBackupAt = undefined;
    }

    this.saveConfig();
    return this.getConfig();
  }

  private calculateNextRun(schedule: AutoBackupConfig["schedule"]): string {
    const now = new Date();
    switch (schedule) {
      case "hourly":
        now.setHours(now.getHours() + 1);
        break;
      case "every_6_hours":
        now.setHours(now.getHours() + 6);
        break;
      case "weekly":
        now.setDate(now.getDate() + 7);
        break;
      case "daily":
      default:
        now.setDate(now.getDate() + 1);
        break;
    }
    return now.toISOString();
  }

  /**
   * AES-256-GCM encryption with PBKDF2 key derivation
   */
  public encryptPayload(payload: any, passphrase: string): any {
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
    const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, "sha256");

    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const plaintext = JSON.stringify(payload);
    let ciphertext = cipher.update(plaintext, "utf8", "hex");
    ciphertext += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return {
      version: "2.0",
      encrypted: true,
      algorithm: "AES-256-GCM",
      salt: salt.toString("hex"),
      iv: iv.toString("hex"),
      authTag,
      ciphertext,
      metadata: {
        created_at: new Date().toISOString(),
        accounts_count: Object.keys(payload.accounts || {}).length,
        rules_count: payload.all_filter_rules?.length || 0,
        appName: "Telegram Self & Tabchi Web Panel",
      },
    };
  }

  /**
   * AES-256-GCM decryption with PBKDF2 key derivation
   */
  public decryptPayload(envelope: any, passphrase: string): any {
    if (!envelope || !envelope.encrypted) {
      // Not encrypted, return as is
      return envelope;
    }

    if (envelope.algorithm !== "AES-256-GCM") {
      throw new Error(`Unsupported encryption algorithm: ${envelope.algorithm}`);
    }

    const salt = Buffer.from(envelope.salt, "hex");
    const iv = Buffer.from(envelope.iv, "hex");
    const authTag = Buffer.from(envelope.authTag, "hex");
    const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, "sha256");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(envelope.ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
  }

  /**
   * Compile backup data object from TelegramManager state
   */
  public compileBackupData(
    telegramManager: any,
    includeSessions = true,
    includeFilterRules = true
  ): any {
    const rawAccounts = telegramManager.getAccounts();
    const accountsExport: Record<string, any> = {};
    const allRules: SmartFilterRule[] = [];

    for (const acc of rawAccounts) {
      const sanitized: any = {
        phone: acc.phone,
        firstName: acc.firstName,
        lastName: acc.lastName,
        userId: acc.userId,
        username: acc.username,
        subscription: acc.subscription,
        client_credentials: acc.client_credentials,
        bot: acc.bot,
        features: { ...acc.features },
      };

      if (includeSessions) {
        sanitized.sessionString = acc.sessionString;
      } else {
        delete sanitized.sessionString;
      }

      if (includeFilterRules && acc.features?.smart_filters?.rules) {
        allRules.push(...acc.features.smart_filters.rules);
      }

      accountsExport[acc.phone] = sanitized;
    }

    return {
      exported_at: new Date().toISOString(),
      generator: "Telegram Self & Tabchi Auto-Backup Engine",
      botSettings: telegramManager.getBotSettings(),
      accounts: accountsExport,
      all_filter_rules: allRules,
      stats: {
        total_accounts: rawAccounts.length,
        total_filter_rules: allRules.length,
      },
    };
  }

  /**
   * Create and write a backup file to disk
   */
  public async createBackup(
    telegramManager: any,
    customPassphrase?: string,
    isManual = false
  ): Promise<{ filename: string; filepath: string; info: StoredBackupInfo; fileContent: string }> {
    this.ensureDirectory();

    const data = this.compileBackupData(
      telegramManager,
      this.config.includeSessions,
      this.config.includeFilterRules
    );

    const passphrase = (customPassphrase || this.config.passphrase || "").trim();
    let finalPayload: any;
    let isEncrypted = false;

    if (passphrase) {
      finalPayload = this.encryptPayload(data, passphrase);
      isEncrypted = true;
    } else {
      finalPayload = {
        version: "2.0",
        encrypted: false,
        algorithm: "NONE",
        metadata: {
          created_at: new Date().toISOString(),
          accounts_count: Object.keys(data.accounts || {}).length,
          rules_count: data.all_filter_rules?.length || 0,
        },
        payload: data,
      };
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${isEncrypted ? "encrypted" : "plain"}-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    const fileContent = JSON.stringify(finalPayload, null, 2);

    fs.writeFileSync(filepath, fileContent, "utf-8");

    // Update config status
    this.config.lastBackupAt = new Date().toISOString();
    this.config.lastBackupFilename = filename;
    this.config.lastBackupStatus = "success";
    this.config.lastBackupError = undefined;
    if (!isManual) {
      this.config.nextBackupAt = this.calculateNextRun(this.config.schedule);
    }
    this.saveConfig();

    // Prune old backups
    this.pruneOldBackups();

    const stat = fs.statSync(filepath);
    const info: StoredBackupInfo = {
      filename,
      sizeBytes: stat.size,
      createdAt: new Date().toISOString(),
      accountsCount: Object.keys(data.accounts || {}).length,
      rulesCount: data.all_filter_rules?.length || 0,
      encrypted: isEncrypted,
      algorithm: isEncrypted ? "AES-256-GCM" : "NONE",
    };

    return {
      filename,
      filepath,
      info,
      fileContent,
    };
  }

  /**
   * List all stored backup files in data/backups/
   */
  public listBackups(): StoredBackupInfo[] {
    this.ensureDirectory();
    try {
      const files = fs.readdirSync(BACKUP_DIR);
      const list: StoredBackupInfo[] = [];

      for (const f of files) {
        if (!f.endsWith(".json")) continue;
        const filepath = path.join(BACKUP_DIR, f);
        try {
          const stat = fs.statSync(filepath);
          const raw = fs.readFileSync(filepath, "utf-8");
          const parsed = JSON.parse(raw);
          const meta = parsed.metadata || {};

          list.push({
            filename: f,
            sizeBytes: stat.size,
            createdAt: meta.created_at || stat.mtime.toISOString(),
            accountsCount: meta.accounts_count ?? 0,
            rulesCount: meta.rules_count ?? 0,
            encrypted: Boolean(parsed.encrypted),
            algorithm: parsed.algorithm || (parsed.encrypted ? "AES-256-GCM" : "NONE"),
          });
        } catch (_) {}
      }

      // Sort newest first
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (_) {
      return [];
    }
  }

  /**
   * Prune backups older than retention limit
   */
  private pruneOldBackups() {
    const list = this.listBackups();
    const limit = this.config.retentionCount || 10;
    if (list.length > limit) {
      const toDelete = list.slice(limit);
      for (const item of toDelete) {
        try {
          const p = path.join(BACKUP_DIR, item.filename);
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch (_) {}
      }
    }
  }

  /**
   * Delete a specific backup file
   */
  public deleteBackup(filename: string): boolean {
    const safeName = path.basename(filename);
    const filepath = path.join(BACKUP_DIR, safeName);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  }

  /**
   * Read raw content of a specific backup file for download
   */
  public getBackupFilePath(filename: string): string | null {
    const safeName = path.basename(filename);
    const filepath = path.join(BACKUP_DIR, safeName);
    if (fs.existsSync(filepath)) {
      return filepath;
    }
    return null;
  }

  /**
   * Restore state from a backup JSON file or envelope
   */
  public restoreBackup(
    envelope: any,
    passphrase?: string,
    telegramManager?: any
  ): {
    success: boolean;
    accountsRestored: number;
    rulesRestored: number;
    restoredPhones: string[];
    message: string;
  } {
    let payload: any = envelope;

    if (envelope.encrypted) {
      if (!passphrase) {
        throw new Error("این فایل با رمزعبور رمزنگاری شده است؛ لطفاً کلید امنیتی را وارد کنید.");
      }
      try {
        payload = this.decryptPayload(envelope, passphrase);
      } catch (err: any) {
        throw new Error("رمز عبور اشتباه است یا فایل بکاپ مخدوش می‌باشد.");
      }
    } else if (envelope.payload) {
      payload = envelope.payload;
    }

    if (!payload.accounts || typeof payload.accounts !== "object") {
      throw new Error("فرمت فایل بکاپ نامعتبر است (بخش حساب‌ها یافت نشد).");
    }

    const restoredPhones: string[] = [];
    let rulesCount = 0;

    if (telegramManager) {
      // Merge restored accounts into telegramManager state
      for (const [phone, accData] of Object.entries<any>(payload.accounts)) {
        if (!phone || !accData) continue;
        const existing = telegramManager.getAccount(phone);

        if (existing) {
          // Update features and credentials
          if (accData.features) existing.features = { ...existing.features, ...accData.features };
          if (accData.sessionString) existing.sessionString = accData.sessionString;
          if (accData.subscription) existing.subscription = accData.subscription;
          if (accData.client_credentials) existing.client_credentials = accData.client_credentials;
          if (accData.bot) existing.bot = accData.bot;
        } else {
          // Add newly restored account
          const newAcc: TelegramAccount = {
            phone,
            sessionString: accData.sessionString || "",
            isOnline: false,
            firstName: accData.firstName || "",
            lastName: accData.lastName || "",
            userId: String(accData.userId || ""),
            username: accData.username || "",
            connectedAt: accData.connectedAt || new Date().toISOString(),
            subscription: accData.subscription || { is_unlimited: true, status: "active", created_at: new Date().toISOString() },
            features: accData.features || {
              self_time: { active: false, format: "HH:mm", font_style: "bold", original_last_name: null },
              auto_reply: { active: false, messages: [], delay_seconds: 1 },
              mandatory_join: { active: false, channels: [] },
              broadcast: { active: false, message: "", interval_seconds: 60, max_recipients: 50, recipients: {} },
              tools: { calculator_active: true, market_active: true },
              font: { active: false, style: "bold", scopes: { self_time: true, manual_messages: true, auto_reply: true, mandatory_join: true, tabchi: true, remote_ui: true } },
              tabchi: { active: false, message: "", interval_seconds: 180, repeat_rounds: 1, repeat_infinite: false, total_sent: 0, total_failed: 0, status: "idle", target_mode: "all", targets: [] },
              keep_alive: true,
            },
            client_credentials: accData.client_credentials,
            bot: accData.bot,
          };
          telegramManager.addExistingAccount(newAcc);
        }

        restoredPhones.push(phone);
        if (accData.features?.smart_filters?.rules) {
          rulesCount += accData.features.smart_filters.rules.length;
        }
      }

      if (payload.botSettings) {
        telegramManager.updateBotSettings(payload.botSettings);
      }

      telegramManager.saveStateDirectly?.();
      telegramManager.addLog(
        "success",
        "system",
        `📥 بازیابی اطلاعات از بکاپ انجام شد: ${restoredPhones.length} اکانت و ${rulesCount} فیلتر هوشمند بازیابی گردید.`
      );
    }

    return {
      success: true,
      accountsRestored: restoredPhones.length,
      rulesRestored: rulesCount,
      restoredPhones,
      message: `اطلاعات ${restoredPhones.length} اکانت و ${rulesCount} فیلتر هوشمند با موفقیت بازیابی شد.`,
    };
  }

  /**
   * Initialize automated timer daemon that runs periodically
   */
  public initScheduler(telegramManager: any) {
    this.telegramManager = telegramManager;

    if (this.timer) {
      clearInterval(this.timer);
    }

    // Check schedule every 60 seconds
    this.timer = setInterval(async () => {
      try {
        if (!this.config.enabled || !this.config.nextBackupAt) return;

        const now = new Date().getTime();
        const next = new Date(this.config.nextBackupAt).getTime();

        if (now >= next) {
          console.log("[Auto-Backup] Running scheduled backup...");
          const res = await this.createBackup(this.telegramManager, this.config.passphrase, false);

          this.telegramManager?.addLog(
            "info",
            "system",
            `💾 بکاپ خودکار زمان‌بندی‌شده سرور با موفقیت ایجاد شد: ${res.filename} (${res.info.accountsCount} اکانت | ${res.info.rulesCount} فیلتر هوشمند).`
          );
        }
      } catch (err: any) {
        console.error("[Auto-Backup] Scheduled backup failed:", err.message);
        this.config.lastBackupStatus = "error";
        this.config.lastBackupError = err.message;
        this.saveConfig();
        this.telegramManager?.addLog(
          "warn",
          "system",
          `⚠️ بروز خطا در بکاپ‌گیری خودکار زمان‌بندی‌شده: ${err.message}`
        );
      }
    }, 60 * 1000);
  }
}

export const backupService = new BackupService();
