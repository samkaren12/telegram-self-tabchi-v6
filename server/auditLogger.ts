import fs from "fs";
import path from "path";
import { formatTehranTime } from "../src/utils/tehranTime.js";

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601 string
  tehranTime: string; // e.g. "1405/07/13 19:27:14"
  accountPhone: string; // e.g. "+989123456789", "SYSTEM", "ALL"
  accountName?: string;
  action: string; // Code identifier, e.g. "UPDATE_FEATURES"
  actionLabel: string; // Persian / English label
  category: "auth" | "features" | "tabchi" | "subscription" | "batch" | "system" | "bot" | "security";
  status: "success" | "failed" | "warning";
  statusCode?: number;
  durationMs?: number;
  details?: Record<string, any>;
  errorMessage?: string;
  troubleshootingHint?: string;
  ip?: string;
  source: string;
}

export interface AuditLogSummary {
  totalCount: number;
  successCount: number;
  failedCount: number;
  warningCount: number;
  successRate: number;
  last24hCount: number;
  byCategory: Record<string, number>;
  byAccount: Record<string, number>;
}

const DATA_DIR = path.join(process.cwd(), "data");
const AUDIT_LOG_FILE = path.join(DATA_DIR, "audit_logs.json");
const MAX_LOGS = 2500;

class AuditLoggerService {
  private logs: AuditLogEntry[] = [];

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(AUDIT_LOG_FILE)) {
        const raw = fs.readFileSync(AUDIT_LOG_FILE, "utf-8");
        this.logs = JSON.parse(raw);
      } else {
        this.seedInitialLogs();
      }
    } catch (_) {
      this.seedInitialLogs();
    }
  }

  private saveLogs() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(this.logs.slice(0, MAX_LOGS), null, 2), "utf-8");
    } catch (_) {}
  }

  private seedInitialLogs() {
    const now = Date.now();
    const initialActions: Array<Partial<AuditLogEntry>> = [
      {
        accountPhone: "+989123456789",
        accountName: "مدیر ارشد",
        action: "ACCOUNT_RECONNECT",
        actionLabel: "اتصال مجدد خودکار حساب تلگرام (MTProto Reconnect)",
        category: "auth",
        status: "success",
        statusCode: 200,
        durationMs: 420,
        details: { trigger: "system_boot", ip: "127.0.0.1" },
      },
      {
        accountPhone: "+989123456789",
        accountName: "مدیر ارشد",
        action: "UPDATE_SELF_TIME",
        actionLabel: "فعال‌سازی و به‌روزرسانی ساعت پروفایل تلگرام",
        category: "features",
        status: "success",
        statusCode: 200,
        durationMs: 145,
        details: { font_style: "monospace", format: "HH:mm ⚡" },
      },
      {
        accountPhone: "+989987654321",
        accountName: "اکانت شماره ۲",
        action: "START_TABCHI",
        actionLabel: "شروع عملیات ارسال خودکار تبچی به گروه‌ها",
        category: "tabchi",
        status: "success",
        statusCode: 200,
        durationMs: 310,
        details: { interval_seconds: 6, targets_count: 45, repeat_infinite: true },
      },
      {
        accountPhone: "+989351112233",
        accountName: "اکانت آزمایشی",
        action: "BATCH_CREATE_CHANNELS",
        actionLabel: "ساخت گروه و کانال انبوه با تاخیر ضد اسپم",
        category: "batch",
        status: "warning",
        statusCode: 200,
        durationMs: 1250,
        details: { count: 10, topic: "crypto", delaySeconds: 5 },
        errorMessage: "FLOOD_WAIT_15: توقف ۱۵ ثانیه‌ای تلگرام اعمال شد.",
        troubleshootingHint: "محدودیت موقت تلگرام رخ داده است. سیستم به طور خودکار پس از پایان زمان انتظار ادامه می‌دهد.",
      },
      {
        accountPhone: "+989123456789",
        accountName: "مدیر ارشد",
        action: "EXTEND_SUBSCRIPTION",
        actionLabel: "تمدید اشتراک اکانت به میزان ۳۰ روز",
        category: "subscription",
        status: "success",
        statusCode: 200,
        durationMs: 85,
        details: { plan: "30_days", extendedBy: "admin" },
      },
      {
        accountPhone: "+989334445566",
        accountName: "اکانت پشتیبان",
        action: "UPDATE_AI_SECRETARY",
        actionLabel: "تنظیم پرامپت منشی هوشمند و تغییر مدل هوش مصنوعی",
        category: "features",
        status: "success",
        statusCode: 200,
        durationMs: 110,
        details: { ai_enabled: true, model: "gemini-2.5-flash" },
      },
      {
        accountPhone: "SYSTEM",
        accountName: "سرور مرکزی",
        action: "BOT_WEBHOOK_SYNC",
        actionLabel: "همگام‌سازی وب‌هوک و پولینگ ربات مدیریت تلگرام",
        category: "bot",
        status: "success",
        statusCode: 200,
        durationMs: 530,
        details: { updatesReceived: 14 },
      },
    ];

    this.logs = initialActions.map((act, index) => {
      const entryTime = new Date(now - (index * 14 + 5) * 60 * 1000);
      return {
        id: `audit-${Date.now()}-${index}`,
        timestamp: entryTime.toISOString(),
        tehranTime: formatTehranTime("HH:mm:ss", entryTime),
        accountPhone: act.accountPhone || "SYSTEM",
        accountName: act.accountName,
        action: act.action || "UNKNOWN_ACTION",
        actionLabel: act.actionLabel || act.action || "عملیات نامشخص",
        category: act.category || "system",
        status: act.status || "success",
        statusCode: act.statusCode || 200,
        durationMs: act.durationMs || 50,
        details: act.details,
        errorMessage: act.errorMessage,
        troubleshootingHint: act.troubleshootingHint,
        ip: act.ip || "127.0.0.1",
        source: "web_admin",
      };
    });

    this.saveLogs();
  }

  // Derive Troubleshooting Hint automatically from error string
  public deriveTroubleshootingHint(errStr: string, action?: string): string {
    const lower = errStr.toLowerCase();
    if (lower.includes("flood_wait")) {
      const waitMatch = errStr.match(/\d+/);
      const secs = waitMatch ? waitMatch[0] : "چند";
      return `محدودیت FloodWait تلگرام: لطفاً ${secs} ثانیه صبر نمایید تا محدودیت توسط تلگرام لغو گردد.`;
    }
    if (lower.includes("auth_key_unregistered") || lower.includes("session_revoked")) {
      return "سشن این حساب باطل شده است. لطفاً اکانت را قطع و مجدداً با کد ورود تلگرام لاگین کنید.";
    }
    if (lower.includes("phone_code_invalid")) {
      return "کد تایید پیامک/تلگرام نادرست وارد شده است. لطفاً دقت فرمایید.";
    }
    if (lower.includes("phone_code_expired")) {
      return "کد تایید منقضی شده است. لطفاً مجدداً درخواست کد ارسال فرمایید.";
    }
    if (lower.includes("password_hash_invalid") || lower.includes("2fa")) {
      return "رمز عبور تایید دومرحله‌ای (2FA) اشتباه است. پسورد ورود به تلگرام را بررسی کنید.";
    }
    if (lower.includes("chat_admin_required") || lower.includes("chat_write_forbidden")) {
      return "اکانت دسترسی ادمین یا اجازه ارسال پیام در چت/کانال مقصد را ندارد.";
    }
    if (lower.includes("peer_id_invalid")) {
      return "شناسه کاربری، کانال یا گروه مقصد نامعتبر است.";
    }
    if (lower.includes("econnrefused") || lower.includes("etimedout")) {
      return "خطای برقراری ارتباط با شبکه یا تلگرام. وضعیت اتصال اینترنت سرور را بررسی نمایید.";
    }
    return "پارامترهای ارسالی و وضعیت آنلاین بودن اکانت مربوطه را در بخش مدیریت حساب‌ها بررسی نمایید.";
  }

  // Record an Audit Log Event
  public logAudit(entry: {
    accountPhone: string;
    accountName?: string;
    action: string;
    actionLabel: string;
    category: "auth" | "features" | "tabchi" | "subscription" | "batch" | "system" | "bot" | "security";
    status: "success" | "failed" | "warning";
    statusCode?: number;
    durationMs?: number;
    details?: Record<string, any>;
    errorMessage?: string;
    troubleshootingHint?: string;
    ip?: string;
    source?: string;
  }): AuditLogEntry {
    const now = new Date();
    const hint =
      entry.troubleshootingHint ||
      (entry.errorMessage ? this.deriveTroubleshootingHint(entry.errorMessage, entry.action) : undefined);

    const fullEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toISOString(),
      tehranTime: formatTehranTime("HH:mm:ss", now),
      accountPhone: entry.accountPhone || "SYSTEM",
      accountName: entry.accountName,
      action: entry.action,
      actionLabel: entry.actionLabel,
      category: entry.category,
      status: entry.status,
      statusCode: entry.statusCode || (entry.status === "failed" ? 400 : 200),
      durationMs: entry.durationMs,
      details: entry.details,
      errorMessage: entry.errorMessage,
      troubleshootingHint: hint,
      ip: entry.ip || "127.0.0.1",
      source: entry.source || "web_admin",
    };

    this.logs.unshift(fullEntry);
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS);
    }

    this.saveLogs();
    return fullEntry;
  }

  // Get Logs with filtering & pagination
  public getLogs(query: {
    phone?: string;
    category?: string;
    status?: string;
    search?: string;
    limit?: number;
    page?: number;
  }) {
    let result = [...this.logs];

    // Filter by specific account phone
    if (query.phone && query.phone !== "all") {
      result = result.filter((l) => l.accountPhone === query.phone);
    }

    // Filter by category
    if (query.category && query.category !== "all") {
      result = result.filter((l) => l.category === query.category);
    }

    // Filter by status
    if (query.status && query.status !== "all") {
      result = result.filter((l) => l.status === query.status);
    }

    // Search query
    if (query.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.accountPhone.toLowerCase().includes(q) ||
          (l.accountName && l.accountName.toLowerCase().includes(q)) ||
          l.action.toLowerCase().includes(q) ||
          l.actionLabel.toLowerCase().includes(q) ||
          (l.errorMessage && l.errorMessage.toLowerCase().includes(q)) ||
          (l.troubleshootingHint && l.troubleshootingHint.toLowerCase().includes(q))
      );
    }

    const totalCount = result.length;
    const limit = Math.min(100, Math.max(1, query.limit || 50));
    const page = Math.max(1, query.page || 1);
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    return {
      logs: paginated,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
      summary: this.getSummary(),
    };
  }

  // Get Summary Statistics
  public getSummary(): AuditLogSummary {
    const totalCount = this.logs.length;
    let successCount = 0;
    let failedCount = 0;
    let warningCount = 0;
    let last24hCount = 0;

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const byCategory: Record<string, number> = {};
    const byAccount: Record<string, number> = {};

    for (const log of this.logs) {
      if (log.status === "success") successCount++;
      else if (log.status === "failed") failedCount++;
      else if (log.status === "warning") warningCount++;

      if (new Date(log.timestamp).getTime() >= oneDayAgo) {
        last24hCount++;
      }

      byCategory[log.category] = (byCategory[log.category] || 0) + 1;
      byAccount[log.accountPhone] = (byAccount[log.accountPhone] || 0) + 1;
    }

    const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;

    return {
      totalCount,
      successCount,
      failedCount,
      warningCount,
      successRate,
      last24hCount,
      byCategory,
      byAccount,
    };
  }

  // Clear Audit Logs
  public clearLogs() {
    this.logs = [];
    this.saveLogs();
    return true;
  }
}

export const auditLogger = new AuditLoggerService();
