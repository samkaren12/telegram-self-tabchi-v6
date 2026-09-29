import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  History,
  Calendar,
  Clock,
  CreditCard,
  Coins,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  ArrowRight,
  Copy,
  Check,
  Crown,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Key,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Smartphone,
  Layers,
} from "lucide-react";
import { StoreCustomer, StoreOrder, StoreSubscriptionExtension, StorePlan } from "../../types";

interface CustomerTransactionsModalProps {
  customer: StoreCustomer;
  allOrders?: StoreOrder[];
  plans?: StorePlan[];
  isOpen: boolean;
  onClose: () => void;
  onOpenExtendModal: (customer: StoreCustomer) => void;
  showToast: (type: "success" | "error", text: string) => void;
}

export function CustomerTransactionsModal({
  customer,
  allOrders = [],
  plans = [],
  isOpen,
  onClose,
  onOpenExtendModal,
  showToast,
}: CustomerTransactionsModalProps) {
  const [activeTab, setActiveTab] = useState<"all" | "orders" | "extensions">("all");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveOrders, setLiveOrders] = useState<StoreOrder[]>([]);
  const [liveExtensions, setLiveExtensions] = useState<StoreSubscriptionExtension[]>([]);

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    showToast("success", `${label} در کلیپ‌بورد کپی شد.`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Fetch updated transactions on open
  useEffect(() => {
    if (!isOpen || !customer) return;

    // Filter matching orders from passed-in orders
    const matchedOrders = allOrders
      .filter((o) => String(o.userId) === String(customer.userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setLiveOrders(matchedOrders);

    // Initial extensions from customer
    const initialExts = (customer.extensionsHistory || [])
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setLiveExtensions(initialExts);

    // Also fetch fresh from server
    setLoading(true);
    fetch(`/api/store-bot/customers/${customer.userId}/transactions`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (Array.isArray(data.orders)) setLiveOrders(data.orders);
          if (Array.isArray(data.extensions)) setLiveExtensions(data.extensions);
        }
      })
      .catch((err) => console.error("Error fetching transactions:", err))
      .finally(() => setLoading(false));
  }, [isOpen, customer.userId]);

  if (!isOpen) return null;

  // Format Persian Date & Time
  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return "---";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const datePart = d.toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const timePart = d.toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      return `${datePart} - ساعت ${timePart}`;
    } catch {
      return isoString;
    }
  };

  const formatDateOnly = (isoString?: string | null) => {
    if (!isoString) return "---";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  // Status calculation
  const getCustomerStatus = () => {
    if (!customer.activePlan && !customer.expiresAt) {
      return { label: "بدون اشتراک فعال", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" };
    }
    if (customer.expiresAt === null && customer.activePlan) {
      return {
        label: "اشتراک مادام‌العمر ♾️",
        badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      };
    }
    if (!customer.expiresAt) {
      return { label: "بدون تاریخ انقضا", badgeClass: "bg-slate-800 text-slate-400 border-slate-700" };
    }
    const expiryTime = new Date(customer.expiresAt).getTime();
    const diffDays = Math.ceil((expiryTime - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      return {
        label: `منقضی شده (${Math.abs(diffDays)} روز پیش)`,
        badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      };
    }
    if (diffDays <= 7) {
      return {
        label: `رو به اتمام (${diffDays} روز باقی‌مانده)`,
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse",
      };
    }
    return {
      label: `فعال (${diffDays} روز باقی‌مانده)`,
      badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    };
  };

  const customerStatus = getCustomerStatus();
  const fullName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "کاربر تلگرام";

  // Financial statistics
  const approvedOrders = liveOrders.filter((o) => o.status === "approved");
  const totalSpentToman = approvedOrders.reduce((sum, o) => sum + (o.finalPriceToman || 0), 0);
  const totalSpentUsdt = approvedOrders.reduce((sum, o) => sum + (o.finalPriceUsdt || 0), 0);

  // Combined timeline items
  type TimelineItem =
    | { type: "order"; data: StoreOrder; date: string }
    | { type: "extension"; data: StoreSubscriptionExtension; date: string };

  const timelineItems: TimelineItem[] = [
    ...liveOrders.map((o) => ({ type: "order" as const, data: o, date: o.createdAt })),
    ...liveExtensions.map((e) => ({ type: "extension" as const, data: e, date: e.timestamp })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* ========================================================= */}
        {/* 1. HEADER & CUSTOMER OVERVIEW */}
        {/* ========================================================= */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/60 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-cyan-500/20">
                {fullName.charAt(0)}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-white">{fullName}</h2>
                  {customer.username && (
                    <a
                      href={`https://t.me/${customer.username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 font-mono text-xs hover:underline flex items-center gap-0.5"
                      dir="ltr"
                    >
                      @{customer.username}
                      <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${customerStatus.badgeClass}`}
                  >
                    {customerStatus.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-mono flex-wrap">
                  <span className="flex items-center gap-1">
                    شناسه تلگرام: <strong className="text-slate-200">{String(customer.userId)}</strong>
                    <button
                      onClick={() => copyToClipboard(String(customer.userId), "شناسه کاربری")}
                      className="text-slate-500 hover:text-cyan-400 transition-colors p-0.5"
                    >
                      {copiedText === String(customer.userId) ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </span>
                  <span>•</span>
                  <span>
                    عضویت: {formatDateOnly(customer.joinedAt)}
                  </span>
                  <span>•</span>
                  <span className="text-purple-300">
                    کیبورد: {customer.preferredKeyboardMode === "reply" ? "باتن (پایین)" : "شیشه‌ای (Inline)"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenExtendModal(customer);
                }}
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>تمدید اشتراک</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="بستن پنجره"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 space-y-0.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>مجموع خرید ریالی</span>
              </span>
              <p className="text-sm font-bold font-mono text-emerald-300">
                {totalSpentToman.toLocaleString("fa-IR")} <span className="text-[10px] font-normal">تومان</span>
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 space-y-0.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-cyan-400" />
                <span>مجموع خرید ارزی</span>
              </span>
              <p className="text-sm font-bold font-mono text-cyan-300">
                ${totalSpentUsdt.toFixed(2)} <span className="text-[10px] font-normal">USDT</span>
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 space-y-0.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                <span>سفارشات ثبت‌شده</span>
              </span>
              <p className="text-sm font-bold font-mono text-purple-300">
                {liveOrders.length} <span className="text-[10px] font-normal">فاکتور</span>
                <span className="text-[10px] text-emerald-400 mr-1.5">({approvedOrders.length} تأییدشده)</span>
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 space-y-0.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>دفعات تمدید اکانت</span>
              </span>
              <p className="text-sm font-bold font-mono text-amber-300">
                {liveExtensions.length} <span className="text-[10px] font-normal">تمدید زمانی</span>
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. SUB-TAB SELECTOR */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-950/40">
          {[
            {
              id: "all",
              label: "📋 همه رویدادها و تراکنش‌ها",
              count: timelineItems.length,
            },
            {
              id: "orders",
              label: "🧾 خریدهای فروشگاهی و فاکتورها",
              count: liveOrders.length,
            },
            {
              id: "extensions",
              label: "⏳ تاریخچه دقیق تمدیدها و زمان‌ها",
              count: liveExtensions.length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
                {tab.count}
              </span>
            </button>
          ))}

          {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400 mr-auto" />}
        </div>

        {/* ========================================================= */}
        {/* 3. CONTENT AREA */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* ========================================================= */}
          {/* TAB 1: ALL EVENTS (COMBINED TIMELINE) */}
          {/* ========================================================= */}
          {activeTab === "all" && (
            <div className="space-y-4">
              {timelineItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                  <History className="w-10 h-10 text-slate-700 mx-auto" />
                  <p>هیچ تراکنش یا تمدیدی برای این مشتری ثبت نشده است.</p>
                </div>
              ) : (
                <div className="relative border-r-2 border-slate-800 pr-5 space-y-6 mr-3">
                  {timelineItems.map((item, idx) => {
                    if (item.type === "order") {
                      const ord = item.data;
                      return (
                        <div key={`ord-${ord.id}-${idx}`} className="relative group">
                          {/* Timeline node icon */}
                          <div
                            className={`absolute -right-[27px] top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                              ord.status === "approved"
                                ? "bg-emerald-950 border-emerald-500 text-emerald-400"
                                : ord.status === "rejected"
                                ? "bg-rose-950 border-rose-500 text-rose-400"
                                : "bg-amber-950 border-amber-500 text-amber-400"
                            }`}
                          >
                            <ShoppingBag className="w-3 h-3" />
                          </div>

                          {/* Order Card */}
                          <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-3 transition-all shadow-md">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-cyan-300 text-sm">
                                  #{ord.id}
                                </span>
                                <span className="text-slate-300 font-bold text-xs">{ord.planTitle}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                  {ord.paymentMethod === "card" ? "💳 کارت به کارت" : "🌐 ارز دیجیتال"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    ord.status === "approved"
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                      : ord.status === "rejected"
                                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                                  }`}
                                >
                                  {ord.status === "approved"
                                    ? "✅ تأیید و پرداخت شد"
                                    : ord.status === "rejected"
                                    ? "❌ رد شده"
                                    : "⏳ در انتظار بررسی فیش"}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {formatDateTime(ord.createdAt)}
                                </span>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                                <span className="text-slate-400 block text-[11px]">مبلغ پرداختی:</span>
                                <div className="font-mono font-bold text-emerald-400 mt-0.5">
                                  {ord.finalPriceToman.toLocaleString("fa-IR")} تومان
                                </div>
                                <div className="font-mono text-cyan-300 text-[11px]">
                                  ${ord.finalPriceUsdt} USDT
                                </div>
                              </div>

                              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 sm:col-span-2 space-y-1">
                                <span className="text-slate-400 block text-[11px]">رسید و پیگیری پرداخت:</span>
                                <div className="font-mono text-amber-300 text-[11px] break-all">
                                  {ord.paymentDetails?.receiptProof || "بدون متن فیش"}
                                </div>
                                {ord.paymentDetails?.cryptoNetwork && (
                                  <span className="text-[10px] text-purple-300 block">
                                    شبکه: {ord.paymentDetails.cryptoNetwork}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Generated License or Rejection */}
                            {ord.generatedCredentials && (
                              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-2.5 text-xs flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-slate-300 text-[11px]">کد لایسنس تحویل داده شده:</span>
                                  <span className="font-mono font-bold text-emerald-300">
                                    {ord.generatedCredentials.licenseCode}
                                  </span>
                                </div>
                                {ord.approvedAt && (
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    زمان تأیید: {formatDateTime(ord.approvedAt)}
                                  </span>
                                )}
                              </div>
                            )}

                            {ord.rejectionReason && (
                              <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-2.5 text-xs text-rose-300">
                                <strong>علت رد فاکتور:</strong> {ord.rejectionReason}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      const ext = item.data;
                      return (
                        <div key={`ext-${ext.id}-${idx}`} className="relative group">
                          {/* Timeline node icon */}
                          <div className="absolute -right-[27px] top-1 w-6 h-6 rounded-full border-2 bg-cyan-950 border-cyan-500 text-cyan-400 flex items-center justify-center text-xs shadow-md shadow-cyan-500/20">
                            <Zap className="w-3 h-3 fill-current" />
                          </div>

                          {/* Extension Card */}
                          <div className="bg-slate-900/90 border border-cyan-900/40 rounded-2xl p-4 space-y-2.5 transition-all shadow-md">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {ext.durationDays === 0
                                      ? "تمدید مادام‌العمر ♾️"
                                      : `تمدید اشتراک به میزان +${ext.durationDays} روز`}
                                  </span>
                                </span>
                                {ext.planTitle && (
                                  <span className="text-slate-300 text-xs font-semibold">
                                    طرح: {ext.planTitle}
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-cyan-300/80 font-mono flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-cyan-400" />
                                <span>{formatDateTime(ext.timestamp)}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                <span className="text-slate-400 text-[11px] block">تاریخ انقضای جدید:</span>
                                <span className="font-mono text-emerald-400 font-bold block mt-0.5">
                                  {ext.newExpiresAt ? formatDateTime(ext.newExpiresAt) : "مادام‌العمر ♾️"}
                                </span>
                              </div>

                              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                <span className="text-slate-400 text-[11px] block">نحوه اقدام:</span>
                                <span className="text-slate-200 block mt-0.5 font-medium">
                                  {ext.actionType === "manual_bulk"
                                    ? "⚡ تمدید گروهی با ۱ کلیک توسط مدیریت"
                                    : ext.actionType === "manual_single"
                                    ? "👤 تمدید اختصاصی مستقیم توسط مدیریت"
                                    : "🛒 خرید و تأیید فاکتور فروشگاه"}
                                </span>
                              </div>
                            </div>

                            {ext.adminNote && (
                              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                                💬 <em>{ext.adminNote}</em>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: STORE ORDERS ONLY (PAST PURCHASES & PAYMENT STATUS) */}
          {/* ========================================================= */}
          {activeTab === "orders" && (
            <div className="space-y-3.5">
              {liveOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                  <ShoppingBag className="w-10 h-10 text-slate-700 mx-auto" />
                  <p>هیچ سفارشی در ربات برای این کاربر یافت نشد.</p>
                </div>
              ) : (
                liveOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-black text-cyan-300 text-sm">#{ord.id}</span>
                        <h4 className="font-bold text-white text-xs">{ord.planTitle}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {ord.paymentMethod === "card" ? "💳 کارت به کارت شتاب" : "🌐 ارز دیجیتال"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : ord.status === "rejected"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                          }`}
                        >
                          {ord.status === "approved"
                            ? "✅ پرداخت تأیید شد"
                            : ord.status === "rejected"
                            ? "❌ رد شد"
                            : "⏳ در انتظار بررسی فیش"}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {formatDateTime(ord.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {/* Price box */}
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                        <span className="text-slate-400 text-[11px] block">مبلغ پرداختی:</span>
                        <div className="font-mono font-bold text-emerald-400 text-sm">
                          {ord.finalPriceToman.toLocaleString("fa-IR")} تومان
                        </div>
                        <div className="font-mono text-cyan-300 text-xs">${ord.finalPriceUsdt} USDT</div>
                        {ord.discountAmount ? (
                          <div className="text-[10px] text-amber-400">
                            تخفیف: {ord.discountAmount.toLocaleString("fa-IR")} تومان
                          </div>
                        ) : null}
                      </div>

                      {/* Payment proof */}
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 sm:col-span-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">اطلاعات رسید ارسالی مشتری:</span>
                          {ord.paymentDetails?.receiptProof && (
                            <button
                              onClick={() => copyToClipboard(ord.paymentDetails.receiptProof || "", "رسید پرداخت")}
                              className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              <span>کپی فیش/TXID</span>
                            </button>
                          )}
                        </div>
                        <div className="font-mono text-amber-300 text-xs break-all bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          {ord.paymentDetails?.receiptProof || "رسید ثبت نشده است"}
                        </div>
                        {ord.paymentDetails?.cryptoNetwork && (
                          <span className="text-[10px] text-purple-300 block">
                            شبکه واریزی: {ord.paymentDetails.cryptoNetwork}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* License credentials */}
                    {ord.generatedCredentials && (
                      <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-300 font-bold">لایسنس و دسترسی تحویل‌شده:</span>
                          </div>
                          {ord.approvedAt && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              زمان تحویل: {formatDateTime(ord.approvedAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-300">لایسنس:</span>
                          <span className="text-emerald-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-emerald-500/30">
                            {ord.generatedCredentials.licenseCode}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(ord.generatedCredentials?.licenseCode || "", "کد لایسنس")
                            }
                            className="p-1 hover:text-emerald-300 text-slate-500"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {ord.rejectionReason && (
                      <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
                        <strong>علت رد فاکتور:</strong> {ord.rejectionReason}
                        {ord.rejectedAt && (
                          <span className="text-[10px] text-rose-400/80 block mt-1 font-mono">
                            زمان ثبت رد: {formatDateTime(ord.rejectedAt)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: EXTENSIONS HISTORY (SPECIFIC TIMESTAMPS) */}
          {/* ========================================================= */}
          {activeTab === "extensions" && (
            <div className="space-y-3.5">
              {liveExtensions.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                  <Clock className="w-10 h-10 text-slate-700 mx-auto" />
                  <p>هنوز سابقه تمدیدی برای این اکانت به ثبت نرسیده است.</p>
                </div>
              ) : (
                liveExtensions.map((ext, idx) => (
                  <div
                    key={ext.id || idx}
                    className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/30 rounded-2xl p-4 space-y-3 transition-all shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 shadow-sm">
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>
                            {ext.durationDays === 0
                              ? "تمدید مادام‌العمر ♾️"
                              : `تمدید اشتراک (+${ext.durationDays} روز)`}
                          </span>
                        </span>
                        {ext.planTitle && (
                          <span className="text-slate-300 text-xs font-semibold">
                            {ext.planTitle}
                          </span>
                        )}
                      </div>

                      {/* Precise Timestamp Badge */}
                      <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-mono bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{formatDateTime(ext.timestamp)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {/* Previous expiry */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[11px] block">اعتبار پیش از تمدید:</span>
                        <span className="font-mono text-slate-300 block mt-0.5">
                          {ext.previousExpiresAt ? formatDateTime(ext.previousExpiresAt) : "بدون تاریخ قبلی / جدید"}
                        </span>
                      </div>

                      {/* New expiry */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[11px] block">اعتبار پس از تمدید:</span>
                        <span className="font-mono text-emerald-400 font-bold block mt-0.5">
                          {ext.newExpiresAt ? formatDateTime(ext.newExpiresAt) : "مادام‌العمر ♾️"}
                        </span>
                      </div>

                      {/* Extension mechanism */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[11px] block">روش انجام تمدید:</span>
                        <span className="text-slate-200 block mt-0.5 font-medium">
                          {ext.actionType === "manual_bulk"
                            ? "⚡ تمدید گروهی با ۱ کلیک"
                            : ext.actionType === "manual_single"
                            ? "👤 تمدید انفرادی مدیریت"
                            : "🛒 تأیید فاکتور خرید در ربات"}
                        </span>
                      </div>
                    </div>

                    {ext.adminNote && (
                      <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                        یادداشت سیستم / مدیریت: <em>{ext.adminNote}</em>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 4. FOOTER ACTIONS */}
        {/* ========================================================= */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            شناسه دیتابیس مشتری: <code className="text-slate-300">{String(customer.userId)}</code>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenExtendModal(customer);
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>تمدید مجدد این مشتری</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
