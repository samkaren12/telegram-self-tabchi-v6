process.env.TZ = "Asia/Tehran";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  SupportBotData,
  SupportBotSettings,
  SupportTicket,
  SupportTicketMessage,
  SupportFaqItem,
} from "../src/types.js";

const DATA_DIR = path.join(process.cwd(), "data");
const SUPPORT_DATA_FILE = path.join(DATA_DIR, "support_bot.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function defaultSupportData(): SupportBotData {
  const defaultSettings: SupportBotSettings = {
    enabled: true,
    botToken: "",
    adminChatId: "",
    welcomeMessage:
      "👋 سلام و درود به سامانه پشتیبانی و تیکتینگ ۲۴ ساعته خوش آمدید!\n\nلطفاً پیام، سوال یا مشکل خود را مطرح کنید تا تیکت اختصاصی شما ثبت و کارشناسان پاسخ دهند.",
    ticketSubmittedMessage:
      "✅ تیکت شما با شماره پیگیری #{{ticketNumber}} ثبت شد.\nبه محض پاسخ‌دهی کارشناسان پشتیبانی، همین‌جا به شما اطلاع‌رسانی خواهد شد.",
    closedTicketMessage:
      "🔒 تیکت #{{ticketNumber}} توسط پشتیبانی بسته شد. در صورت نیاز به راهنمایی بیشتر می‌توانید پیام جدید ارسال کنید.",
    supportName: "پشتیبانی فنی سام کِرن (Hacker Edition v6)",
    workingHoursText: "۲۴ ساعته / ۷ روز هفته بدون تعطیلی",
    autoFaqEnabled: true,
  };

  const defaultFaqs: SupportFaqItem[] = [
    {
      id: "faq-1",
      question: "چگونه ساعت زنده را روی اکانت تلگرام فعال کنم؟",
      answer: "از طریق تب سلف در پنل وب یا ارسال دستور به ربات فروشگاه، می‌توانید پکیج را تهیه و قابلیت را فعال کنید.",
      category: "سلف",
      order: 1,
    },
    {
      id: "faq-2",
      question: "آیا برای تبچی امکان محدودیت تاخیر وجود دارد؟",
      answer: "بله، در پنل می‌توانید تاخیر بین هر ارسال را بر حسب ثانیه تنظیم کنید تا اکانت شما دچار محدودیت فلود تلگرام نشود.",
      category: "تبچی",
      order: 2,
    },
    {
      id: "faq-3",
      question: "چگونه اشتراک خود را تمدید کنم؟",
      answer: "از طریق ربات فروشگاه با پرداخت کارت به کارت یا ارز تتر (TRC20/TON) می‌توانید در کمتر از ۳ دقیقه اشتراک را تمدید نمایید.",
      category: "مالی و اشتراک",
      order: 3,
    },
  ];

  const now = Date.now();
  const sampleTickets: SupportTicket[] = [
    {
      id: "ticket-1001",
      ticketNumber: 1001,
      userId: 582910394,
      userUsername: "alireza_dev",
      userFullName: "علیرضا محمدی",
      subject: "راهنمایی جهت اتصال اکانت دوم به سرور",
      status: "in_progress",
      priority: "medium",
      createdAt: new Date(now - 3 * 3600000).toISOString(),
      updatedAt: new Date(now - 45 * 60000).toISOString(),
      lastMessageSnippet: "در حال بررسی است، لطفاً کد دریافتی تلگرام را مجدد ارسال نمایید.",
      messages: [
        {
          id: "msg-1",
          sender: "user",
          senderName: "علیرضا محمدی",
          text: "سلام خسته نباشید، من یه اکانت جدید تلگرام دارم چطوری میتونم تو پنل فعالش کنم؟",
          timestamp: new Date(now - 3 * 3600000).toISOString(),
        },
        {
          id: "msg-2",
          sender: "admin",
          senderName: "پشتیبانی سرور",
          text: "سلام علیرضا عزیز. از منوی مدیریت حساب‌ها دکمه افزودن شماره جدید رو بزنید و شماره رو با +98 وارد کنید.",
          timestamp: new Date(now - 2 * 3600000).toISOString(),
        },
        {
          id: "msg-3",
          sender: "user",
          senderName: "علیرضا محمدی",
          text: "ممنون انجام دادم ولی کد اس‌ام‌اس نشد، روی تلگرامم اومد واردش کردم اوکی شد.",
          timestamp: new Date(now - 45 * 60000).toISOString(),
        },
      ],
    },
    {
      id: "ticket-1002",
      ticketNumber: 1002,
      userId: 719284102,
      userUsername: "sara_crypto",
      userFullName: "سارا راد",
      subject: "درخواست افزودن فونت سفارشی برای ساعت بیو",
      status: "open",
      priority: "high",
      createdAt: new Date(now - 55 * 60000).toISOString(),
      updatedAt: new Date(now - 55 * 60000).toISOString(),
      lastMessageSnippet: "سلام، فونت‌های نستعلیق و کشیده رو به ساعت اضافه میکنید؟",
      messages: [
        {
          id: "msg-101",
          sender: "user",
          senderName: "سارا راد",
          text: "سلام وقت بخیر، امکانش هست فونت‌های نستعلیق و کشیده انگلیسی رو برای ساعت بیوگرافی اضافه کنید؟ خیلی عالی میشه.",
          timestamp: new Date(now - 55 * 60000).toISOString(),
        },
      ],
    },
    {
      id: "ticket-1003",
      ticketNumber: 1003,
      userId: 649201948,
      userUsername: "mehdi_tabchi",
      userFullName: "مهدی کاظمی",
      subject: "استعلام تایید واریزی فیش شماره #ORD-4812",
      status: "resolved",
      priority: "low",
      createdAt: new Date(now - 24 * 3600000).toISOString(),
      updatedAt: new Date(now - 12 * 3600000).toISOString(),
      lastMessageSnippet: "فیش شما تایید و اکانت فعال شد. با تشکر.",
      messages: [
        {
          id: "msg-201",
          sender: "user",
          senderName: "مهدی کاظمی",
          text: "سلام من فیش کارت به کارت رو ارسال کردم تایید شده یا نه؟",
          timestamp: new Date(now - 24 * 3600000).toISOString(),
        },
        {
          id: "msg-202",
          sender: "admin",
          senderName: "مدیریت مالی",
          text: "سلام، سفارش شما بررسی و تأیید شد و لایسنس فعال گردید.",
          timestamp: new Date(now - 12 * 3600000).toISOString(),
        },
      ],
    },
  ];

  return {
    settings: defaultSettings,
    tickets: sampleTickets,
    faqs: defaultFaqs,
  };
}

export class SupportBotManager {
  private data: SupportBotData;
  private pollingActive = false;
  private lastUpdateId = 0;
  private pollAbortController?: AbortController;

  constructor() {
    this.data = this.loadData();
    if (this.data.settings.enabled && this.data.settings.botToken) {
      setTimeout(() => this.startPolling(), 4000);
    }
  }

  private loadData(): SupportBotData {
    try {
      if (fs.existsSync(SUPPORT_DATA_FILE)) {
        const raw = fs.readFileSync(SUPPORT_DATA_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        const defaults = defaultSupportData();
        return {
          settings: { ...defaults.settings, ...(parsed.settings || {}) },
          tickets: Array.isArray(parsed.tickets) ? parsed.tickets : defaults.tickets,
          faqs: Array.isArray(parsed.faqs) ? parsed.faqs : defaults.faqs,
        };
      }
    } catch (err) {
      console.error("Error reading support bot data:", err);
    }
    const fresh = defaultSupportData();
    this.saveData(fresh);
    return fresh;
  }

  private saveData(dataToSave?: SupportBotData) {
    try {
      const target = dataToSave || this.data;
      fs.writeFileSync(SUPPORT_DATA_FILE, JSON.stringify(target, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing support bot data:", err);
    }
  }

  public getData(): SupportBotData {
    return this.data;
  }

  public updateSettings(settings: Partial<SupportBotSettings>): SupportBotSettings {
    const prevToken = this.data.settings.botToken;
    this.data.settings = { ...this.data.settings, ...settings };
    this.saveData();

    if (settings.botToken !== undefined && settings.botToken !== prevToken) {
      this.stopPolling();
      if (this.data.settings.enabled && this.data.settings.botToken) {
        this.startPolling();
      }
    } else if (settings.enabled !== undefined) {
      if (settings.enabled && this.data.settings.botToken) {
        this.startPolling();
      } else {
        this.stopPolling();
      }
    }

    return this.data.settings;
  }

  // Telegram API wrapper
  private async telegramCall(method: string, body: any): Promise<any> {
    const token = this.data.settings.botToken;
    if (!token) throw new Error("توکن ربات پشتیبانی تنظیم نشده است.");

    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!json.ok) {
      throw new Error(json.description || `Telegram API error on ${method}`);
    }
    return json.result;
  }

  public async sendMessage(chatId: string | number, text: string, extra: any = {}): Promise<any> {
    return this.telegramCall("sendMessage", {
      chat_id: chatId,
      text,
      ...extra,
    });
  }

  // Polling loop for Support Bot
  public startPolling() {
    if (this.pollingActive) return;
    if (!this.data.settings.botToken) return;

    this.pollingActive = true;
    this.pollAbortController = new AbortController();
    this.pollUpdates();
    console.log("Support bot polling daemon started.");
  }

  public stopPolling() {
    this.pollingActive = false;
    if (this.pollAbortController) {
      this.pollAbortController.abort();
      this.pollAbortController = undefined;
    }
    console.log("Support bot polling stopped.");
  }

  private async pollUpdates() {
    while (this.pollingActive) {
      try {
        const token = this.data.settings.botToken;
        if (!token) break;

        const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=20`;
        const res = await fetch(url, { signal: this.pollAbortController?.signal });
        const json = await res.json();

        if (json.ok && Array.isArray(json.result)) {
          for (const update of json.result) {
            this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
            await this.handleTelegramUpdate(update);
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") break;
        await new Promise((r) => setTimeout(r, 4000));
      }
    }
  }

  private async handleTelegramUpdate(update: any) {
    try {
      if (update.message) {
        await this.handleIncomingMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }
    } catch (e) {
      console.error("Support bot update handling error:", e);
    }
  }

  private async handleIncomingMessage(msg: any) {
    const chatId = msg.chat.id;
    const text = (msg.text || "").trim();
    const from = msg.from || {};
    const userId = from.id;
    const userFullName = `${from.first_name || ""} ${from.last_name || ""}`.trim() || "کاربر تلگرام";
    const userUsername = from.username;

    if (text === "/start") {
      const welcome = this.data.settings.welcomeMessage;
      await this.sendMessage(chatId, welcome, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "📝 ثبت تیکت و پیام جدید", callback_data: "new_ticket" }],
            [{ text: "❓ سوالات متداول و راهنما", callback_data: "show_faqs" }],
            [{ text: "🕒 ساعت کاری و وضعیت", callback_data: "show_info" }],
          ],
        },
      });
      return;
    }

    // Check if user has an open or in_progress ticket
    let activeTicket = this.data.tickets.find(
      (t) => String(t.userId) === String(userId) && (t.status === "open" || t.status === "in_progress")
    );

    if (!activeTicket) {
      // Create new ticket automatically
      const nextNumber = (this.data.tickets.length > 0 ? Math.max(...this.data.tickets.map((t) => t.ticketNumber || 1000)) : 1000) + 1;
      activeTicket = {
        id: `ticket-${Date.now()}`,
        ticketNumber: nextNumber,
        userId,
        userUsername,
        userFullName,
        subject: text.slice(0, 60) || "درخواست پشتیبانی",
        status: "open",
        priority: "medium",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessageSnippet: text.slice(0, 80),
        messages: [],
      };
      this.data.tickets.unshift(activeTicket);

      // Confirm to user
      const confirmText = this.data.settings.ticketSubmittedMessage.replace(
        "{{ticketNumber}}",
        String(nextNumber)
      );
      await this.sendMessage(chatId, confirmText);

      // Notify admin if adminChatId configured
      if (this.data.settings.adminChatId) {
        const adminAlert =
          `🚨 *تیکت پشتیبانی جدید (#${nextNumber})*\n\n` +
          `👤 کاربر: ${userFullName} (@${userUsername || "بدون آیدی"})\n` +
          `💬 متن: ${text}`;
        await this.sendMessage(this.data.settings.adminChatId, adminAlert, { parse_mode: "Markdown" }).catch(() => {});
      }
    }

    // Add message to active ticket
    const newMsg: SupportTicketMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      senderName: userFullName,
      text,
      timestamp: new Date().toISOString(),
      telegramMessageId: msg.message_id,
    };

    activeTicket.messages.push(newMsg);
    activeTicket.updatedAt = new Date().toISOString();
    activeTicket.lastMessageSnippet = text.slice(0, 80);
    this.saveData();
  }

  private async handleCallbackQuery(cb: any) {
    const chatId = cb.message?.chat?.id;
    const data = cb.data;

    if (data === "new_ticket") {
      await this.sendMessage(chatId, "✍️ لطفاً پیام، گزارش مشکل یا درخواست خود را در قالب یک پیام تایپ کرده و بفرستید:");
    } else if (data === "show_faqs") {
      const faqs = this.data.faqs;
      let text = "📚 *سوالات متداول و پاسخ‌های پرکاربرد:*\n\n";
      faqs.forEach((f, idx) => {
        text += `*${idx + 1}. ${f.question}*\n💡 ${f.answer}\n\n`;
      });
      await this.sendMessage(chatId, text, { parse_mode: "Markdown" });
    } else if (data === "show_info") {
      const text =
        `ℹ️ *اطلاعات سامانه پشتیبانی:*\n\n` +
        `🏢 ${this.data.settings.supportName}\n` +
        `⏰ ساعات پاسخگویی: ${this.data.settings.workingHoursText || "۲۴/۷ شبانه‌روزی"}\n` +
        `⚡ پاسخگویی معمولاً در کمتر از ۱۵ دقیقه صورت می‌گیرد.`;
      await this.sendMessage(chatId, text, { parse_mode: "Markdown" });
    }

    try {
      await this.telegramCall("answerCallbackQuery", { callback_query_id: cb.id });
    } catch (_) {}
  }

  // Admin replies to a ticket from Web Panel
  public async replyToTicket(ticketId: string, replyText: string, adminName = "مدیر سرور"): Promise<SupportTicket> {
    const ticket = this.data.tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error("تیکت یافت نشد.");

    const newMsg: SupportTicketMessage = {
      id: `msg-admin-${Date.now()}`,
      sender: "admin",
      senderName: adminName,
      text: replyText,
      timestamp: new Date().toISOString(),
    };

    ticket.messages.push(newMsg);
    ticket.updatedAt = new Date().toISOString();
    ticket.status = "in_progress";
    ticket.lastMessageSnippet = `پاسخ مدیر: ${replyText.slice(0, 60)}`;
    this.saveData();

    // Send Telegram message to user
    if (this.data.settings.botToken && ticket.userId) {
      const userTelegramMsg =
        `💬 *پاسخ پشتیبانی به تیکت #${ticket.ticketNumber}:*\n\n` +
        `${replyText}\n\n` +
        `👨‍💼 پاسخ‌دهنده: ${adminName}`;

      await this.sendMessage(ticket.userId, userTelegramMsg, { parse_mode: "Markdown" }).catch(() => {});
    }

    return ticket;
  }

  public updateTicketStatus(ticketId: string, status: SupportTicket["status"]): SupportTicket {
    const ticket = this.data.tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error("تیکت یافت نشد.");

    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    this.saveData();

    if (status === "closed" && this.data.settings.botToken && ticket.userId) {
      const closedText = this.data.settings.closedTicketMessage.replace(
        "{{ticketNumber}}",
        String(ticket.ticketNumber)
      );
      this.sendMessage(ticket.userId, closedText).catch(() => {});
    }

    return ticket;
  }

  public updateTicketPriority(ticketId: string, priority: SupportTicket["priority"]): SupportTicket {
    const ticket = this.data.tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error("تیکت یافت نشد.");
    ticket.priority = priority;
    ticket.updatedAt = new Date().toISOString();
    this.saveData();
    return ticket;
  }

  public deleteTicket(ticketId: string) {
    this.data.tickets = this.data.tickets.filter((t) => t.id !== ticketId);
    this.saveData();
  }

  // FAQs
  public addFaq(faq: Omit<SupportFaqItem, "id">): SupportFaqItem {
    const newFaq: SupportFaqItem = {
      id: `faq-${Date.now()}`,
      ...faq,
      order: this.data.faqs.length + 1,
    };
    this.data.faqs.push(newFaq);
    this.saveData();
    return newFaq;
  }

  public updateFaq(id: string, updates: Partial<SupportFaqItem>): SupportFaqItem {
    const idx = this.data.faqs.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error("سوال یافت نشد.");
    this.data.faqs[idx] = { ...this.data.faqs[idx], ...updates };
    this.saveData();
    return this.data.faqs[idx];
  }

  public deleteFaq(id: string) {
    this.data.faqs = this.data.faqs.filter((f) => f.id !== id);
    this.saveData();
  }
}

export const supportBotManager = new SupportBotManager();
