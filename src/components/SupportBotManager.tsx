import React, { useState, useEffect } from "react";
import {
  Bot,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HelpCircle,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  User,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Settings,
  Sparkles,
  Check,
  XCircle,
  BellRing,
} from "lucide-react";
import { Language } from "../utils/i18n";
import {
  SupportBotData,
  SupportBotSettings,
  SupportTicket,
  SupportFaqItem,
} from "../types";

interface SupportBotManagerProps {
  lang: Language;
}

export const SupportBotManager: React.FC<SupportBotManagerProps> = ({ lang }) => {
  const [data, setData] = useState<SupportBotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tickets" | "settings" | "faqs">("tickets");

  // Ticket selection & reply state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in_progress" | "resolved" | "closed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<SupportBotSettings>({
    enabled: true,
    botToken: "",
    adminChatId: "",
    welcomeMessage: "",
    ticketSubmittedMessage: "",
    closedTicketMessage: "",
    supportName: "پشتیبانی فنی سام کِرن",
    workingHoursText: "۲۴ ساعته / ۷ روز هفته",
    autoFaqEnabled: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // FAQ Modal / Form
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");
  const [newFaqCategory, setNewFaqCategory] = useState("عمومی");
  const [isAddingFaq, setIsAddingFaq] = useState(false);

  // Toast feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/support-bot/data");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setSettingsForm(json.data.settings);
        if (json.data.tickets.length > 0 && !selectedTicketId) {
          setSelectedTicketId(json.data.tickets[0].id);
        }
      }
    } catch (err: any) {
      console.error("Error fetching support bot data:", err);
      showToast("error", "خطا در دریافت اطلاعات ربات پشتیبانی");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/support-bot/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "تنظیمات ربات پشتیبانی ذخیره شد.");
        fetchData();
      } else {
        showToast("error", json.message || "خطا در ذخیره تنظیمات");
      }
    } catch (err: any) {
      showToast("error", err.message || "خطای ارتباط با سرور");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicketId || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/support-bot/tickets/${selectedTicketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replyText: replyText.trim(),
          adminName: "مدیر پشتیبانی سرور",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setReplyText("");
        showToast("success", "پاسخ با موفقیت ارسال شد و به کاربر تلگرام تحویل گردید.");
        fetchData();
      } else {
        showToast("error", json.message || "خطا در ارسال پاسخ");
      }
    } catch (err: any) {
      showToast("error", err.message || "خطای شبکه");
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: SupportTicket["status"]) => {
    try {
      const res = await fetch(`/api/support-bot/tickets/${ticketId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "وضعیت تیکت تغییر یافت.");
        fetchData();
      }
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("آیا از حذف این تیکت اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/support-bot/tickets/${ticketId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("success", "تیکت با موفقیت حذف شد.");
        if (selectedTicketId === ticketId) setSelectedTicketId(null);
        fetchData();
      }
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    try {
      const res = await fetch("/api/support-bot/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: newFaqQuestion.trim(),
          answer: newFaqAnswer.trim(),
          category: newFaqCategory.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNewFaqQuestion("");
        setNewFaqAnswer("");
        setIsAddingFaq(false);
        showToast("success", "سوال متداول جدید افزوده شد.");
        fetchData();
      }
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("آیا از حذف این سوال متداول اطمینان دارید؟")) return;
    try {
      await fetch(`/api/support-bot/faqs/${id}`, { method: "DELETE" });
      showToast("success", "سوال حذف شد.");
      fetchData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const filteredTickets = (data?.tickets || []).filter((ticket) => {
    if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ticket.userFullName?.toLowerCase().includes(q);
      const matchSubject = ticket.subject?.toLowerCase().includes(q);
      const matchUser = String(ticket.userId).includes(q) || (ticket.userUsername && ticket.userUsername.toLowerCase().includes(q));
      const matchNum = String(ticket.ticketNumber).includes(q);
      return matchName || matchSubject || matchUser || matchNum;
    }
    return true;
  });

  const selectedTicket = data?.tickets.find((t) => t.id === selectedTicketId);

  const openTicketsCount = (data?.tickets || []).filter((t) => t.status === "open").length;

  return (
    <div className="space-y-6" dir={lang === "fa" ? "rtl" : "ltr"}>
      {/* Toast Alert */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom duration-300 ${
            feedback.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
              : "bg-rose-950/80 border-rose-500/50 text-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* TOP HERO BANNER */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-500 p-0.5 shadow-xl shadow-cyan-500/25 flex-shrink-0">
              <div className="w-full h-full bg-slate-950/80 backdrop-blur-md rounded-[14px] flex items-center justify-center text-cyan-400">
                <Bot className="w-7 h-7" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">
                  ربات پشتیبانی و تیکتینگ هوشمند
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                  SUPPORT 24/7
                </span>
                {settingsForm.enabled && settingsForm.botToken ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    ربات آنلاین و پاسخگو
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    نیازمند توکن در تب تنظیمات
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                ارتباط دوطرفه تلگرام و پنل وب: کاربران به ربات پیام می‌دهند، تیکت در پنل ثبت می‌شود و شما مستقیماً از اینجا به پی‌وی آن‌ها پاسخ می‌دهید.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition-all text-xs font-medium flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
              <span>بروزرسانی</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: "tickets", label: "تیکت‌ها و پیام‌های کاربران", icon: MessageSquare, badge: openTicketsCount > 0 ? openTicketsCount : undefined },
          { id: "settings", label: "تنظیمات و راه‌اندازی ربات", icon: Settings },
          { id: "faqs", label: "سوالات متداول (FAQ)", icon: HelpCircle, count: data?.faqs?.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.badge === "number" && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500 text-white font-bold animate-pulse">
                  {tab.badge}
                </span>
              )}
              {typeof tab.count === "number" && !tab.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: TICKETS INTERFACE */}
      {activeTab === "tickets" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Tickets List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Filter and Search */}
            <div className="glass-card rounded-2xl p-3.5 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی تیکت، شماره، کاربر..."
                  className="w-full bg-slate-950/70 border border-slate-800/80 focus:border-cyan-500/60 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {[
                  { id: "all", label: "همه" },
                  { id: "open", label: "جدید (باز)" },
                  { id: "in_progress", label: "در حال بررسی" },
                  { id: "resolved", label: "پاسخ‌داده" },
                  { id: "closed", label: "بسته‌شده" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      statusFilter === f.id
                        ? "bg-cyan-500 text-slate-950 font-bold"
                        : "bg-slate-900/60 text-slate-400 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket Cards List */}
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
              {filteredTickets.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center text-slate-400 text-xs">
                  هیچ تیکتی با این فیلتر یافت نشد.
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const isSelected = ticket.id === selectedTicketId;
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`glass-card-interactive rounded-2xl p-4 cursor-pointer ${
                        isSelected
                          ? "border-cyan-500/80 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/40 bg-slate-900/90"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-cyan-400">
                            #{ticket.ticketNumber}
                          </span>
                          <span className="font-bold text-xs text-white truncate max-w-[140px]">
                            {ticket.userFullName}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            ticket.status === "open"
                              ? "bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse"
                              : ticket.status === "in_progress"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : ticket.status === "resolved"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {ticket.status === "open"
                            ? "جدید"
                            : ticket.status === "in_progress"
                            ? "پاسخ داده شد"
                            : ticket.status === "resolved"
                            ? "حل شده"
                            : "بسته"}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-semibold line-clamp-1 mb-1">
                        {ticket.subject}
                      </p>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 font-sans">
                        {ticket.lastMessageSnippet || "پیامی ثبت نشده است."}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                        <span>{ticket.userUsername ? `@${ticket.userUsername}` : `ID: ${ticket.userId}`}</span>
                        <span>{new Date(ticket.updatedAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right / Active Ticket Chat View (7 cols) */}
          <div className="lg:col-span-7">
            {selectedTicket ? (
              <div className="glass-panel rounded-3xl p-5 sm:p-6 flex flex-col h-[700px] shadow-2xl">
                {/* Chat Top Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {selectedTicket.userFullName ? selectedTicket.userFullName[0] : "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{selectedTicket.userFullName}</h3>
                        <span className="font-mono text-xs text-cyan-400">#{selectedTicket.ticketNumber}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        {selectedTicket.userUsername ? `@${selectedTicket.userUsername}` : `Telegram ID: ${selectedTicket.userId}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500 cursor-pointer font-medium"
                    >
                      <option value="open">تغییر به: جدید (Open)</option>
                      <option value="in_progress">در حال بررسی (In Progress)</option>
                      <option value="resolved">حل شد (Resolved)</option>
                      <option value="closed">بستن تیکت (Closed)</option>
                    </select>

                    <button
                      onClick={() => handleDeleteTicket(selectedTicket.id)}
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-all"
                      title="حذف تیکت"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 p-2">
                  {selectedTicket.messages.map((msg) => {
                    const isAdmin = msg.sender === "admin";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 font-mono">
                          <span>{msg.senderName}</span>
                          <span>•</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-md ${
                            isAdmin
                              ? "bg-gradient-to-r from-cyan-600 to-sky-600 text-white rounded-tr-none font-medium"
                              : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none font-normal"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Input Box */}
                <div className="pt-4 border-t border-slate-800 mt-2">
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="پاسخ خود را بنویسید (بلافاصله به پی‌وی تلگرام کاربر ارسال می‌شود)..."
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500/60 outline-none resize-none transition-all"
                    />
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-slate-500">
                        ارسال پاسخ با پیام اعلان به تلگرام کاربر همراه است.
                      </span>
                      <button
                        onClick={handleSendReply}
                        disabled={sendingReply || !replyText.trim()}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5 transform -rotate-12" />
                        <span>{sendingReply ? "در حال ارسال..." : "ارسال پاسخ به تلگرام"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center h-[500px] space-y-3">
                <MessageSquare className="w-12 h-12 text-slate-600" />
                <h4 className="text-sm font-bold text-slate-300">یک تیکت را از لیست سمت راست انتخاب کنید</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  شما می‌توانید تاریخچه پیام‌ها را مشاهده کنید و با ارسال پاسخ، کاربر در تلگرام اعلان دریافت کند.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SETTINGS */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 max-w-4xl mx-auto shadow-2xl">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">پیکربندی و راه‌اندازی ربات پشتیبانی</h3>
              <p className="text-xs text-slate-400">توکن بات تلگرام خود را از @BotFather دریافت کرده و در فیلد زیر قرار دهید.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Enable toggle */}
            <div className="md:col-span-2 flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-bold text-xs text-white block">وضعیت ربات پشتیبانی</span>
                <span className="text-[11px] text-slate-400">در صورت فعال بودن، ربات پیام‌های دریافتی از کاربران تلگرام را به عنوان تیکت ثبت می‌کند.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.enabled}
                  onChange={(e) => setSettingsForm({ ...settingsForm, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            {/* Bot Token */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>توکن اختصاصی ربات پشتیبانی (Telegram Bot Token)</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={settingsForm.botToken}
                onChange={(e) => setSettingsForm({ ...settingsForm, botToken: e.target.value.trim() })}
                placeholder="مثال: 7891234567:AAHAbcdefghijk123456"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:border-cyan-500 outline-none"
                dir="ltr"
              />
            </div>

            {/* Admin Telegram ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">شناسه عددی تلگرام ادمین (اختیاری جهت دریافت هشدار)</label>
              <input
                type="text"
                value={settingsForm.adminChatId || ""}
                onChange={(e) => setSettingsForm({ ...settingsForm, adminChatId: e.target.value.trim() })}
                placeholder="مثال: 123456789"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:border-cyan-500 outline-none"
                dir="ltr"
              />
            </div>

            {/* Support Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">عنوان و نام سامانه پشتیبانی</label>
              <input
                type="text"
                value={settingsForm.supportName}
                onChange={(e) => setSettingsForm({ ...settingsForm, supportName: e.target.value })}
                placeholder="پشتیبانی فنی سام کِرن"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 outline-none"
              />
            </div>

            {/* Working Hours */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-300">متن ساعات کاری</label>
              <input
                type="text"
                value={settingsForm.workingHoursText || ""}
                onChange={(e) => setSettingsForm({ ...settingsForm, workingHoursText: e.target.value })}
                placeholder="۲۴ ساعته / ۷ روز هفته بدون تعطیلی"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 outline-none"
              />
            </div>

            {/* Welcome message */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-300">پیام خوش‌آمدگویی استارت ربات (/start)</label>
              <textarea
                rows={3}
                value={settingsForm.welcomeMessage}
                onChange={(e) => setSettingsForm({ ...settingsForm, welcomeMessage: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:border-cyan-500 outline-none"
              />
            </div>

            {/* Ticket submitted confirmation */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-300">پیام تایید ثبت تیکت (از برچسب {'{{ticketNumber}}'} برای درج شماره استفاده کنید)</label>
              <textarea
                rows={2}
                value={settingsForm.ticketSubmittedMessage}
                onChange={(e) => setSettingsForm({ ...settingsForm, ticketSubmittedMessage: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>ذخیره تنظیمات ربات پشتیبانی</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: FAQS */}
      {activeTab === "faqs" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">سوالات متداول و پاسخ‌های خودکار ربات</h3>
              <p className="text-xs text-slate-400">کاربران با فشردن دکمه «سوالات متداول» در ربات تلگرام می‌توانند این راهنماها را دریافت کنند.</p>
            </div>
            <button
              onClick={() => setIsAddingFaq(!isAddingFaq)}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md hover:bg-cyan-400 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن سوال متداول</span>
            </button>
          </div>

          {/* Add FAQ Form */}
          {isAddingFaq && (
            <form onSubmit={handleAddFaq} className="glass-panel rounded-2xl p-5 space-y-4 animate-in fade-in">
              <h4 className="font-bold text-xs text-cyan-300">افزودن سوال و پاسخ جدید</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-300 block mb-1">متن سوال:</label>
                  <input
                    type="text"
                    required
                    value={newFaqQuestion}
                    onChange={(e) => setNewFaqQuestion(e.target.value)}
                    placeholder="مثال: ساعت زنده چگونه تنظیم می‌شود؟"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">دسته‌بندی:</label>
                  <input
                    type="text"
                    value={newFaqCategory}
                    onChange={(e) => setNewFaqCategory(e.target.value)}
                    placeholder="سلف، تبچی، عمومی..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[11px] text-slate-300 block mb-1">پاسخ راهنما:</label>
                  <textarea
                    rows={3}
                    required
                    value={newFaqAnswer}
                    onChange={(e) => setNewFaqAnswer(e.target.value)}
                    placeholder="توضیح مرحله به مرحله برای کاربر تلگرام..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingFaq(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                >
                  ثبت سوال
                </button>
              </div>
            </form>
          )}

          {/* FAQ Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data?.faqs || []).map((faq, idx) => (
              <div key={faq.id} className="glass-card rounded-2xl p-5 relative group">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/15 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <h4 className="font-bold text-xs text-white">{faq.question}</h4>
                  </div>
                  <button
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-8 pr-2">
                  {faq.answer}
                </p>
                {faq.category && (
                  <span className="mt-3 inline-block px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700/60">
                    {faq.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
