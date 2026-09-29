import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  CheckSquare,
  Square,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Zap,
  Send,
  RefreshCw,
  Copy,
  Check,
  UserPlus,
  Trash2,
  Edit3,
  Crown,
  ChevronDown,
  ArrowUpDown,
  Smartphone,
  ShieldAlert,
  History,
  ShoppingBag,
  Receipt,
} from "lucide-react";
import { StoreCustomer, StorePlan, StoreOrder } from "../../types";
import { CustomerTransactionsModal } from "./CustomerTransactionsModal";

interface CustomersManagerProps {
  customers: StoreCustomer[];
  plans: StorePlan[];
  orders?: StoreOrder[];
  onRefresh: () => void;
  showToast: (type: "success" | "error", text: string) => void;
}

export function CustomersManager({
  customers,
  plans,
  orders = [],
  onRefresh,
  showToast,
}: CustomersManagerProps) {
  // Selection state
  const [selectedUserIds, setSelectedUserIds] = useState<(string | number)[]>([]);
  const [viewingTransactionsCustomer, setViewingTransactionsCustomer] = useState<StoreCustomer | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "expiring_soon" | "expired" | "lifetime" | "none"
  >("all");
  const [sortBy, setSortBy] = useState<
    "recent_join" | "expiry_asc" | "expiry_desc" | "orders_count"
  >("recent_join");

  // Bulk action states
  const [bulkDurationDays, setBulkDurationDays] = useState<number>(30);
  const [bulkCustomDays, setBulkCustomDays] = useState<string>("");
  const [bulkPlanTitle, setBulkPlanTitle] = useState<string>("");
  const [bulkNotifyTelegram, setBulkNotifyTelegram] = useState<boolean>(true);
  const [isBulkExecuting, setIsBulkExecuting] = useState<boolean>(false);

  // Single customer extend / edit modal
  const [editingCustomer, setEditingCustomer] = useState<StoreCustomer | null>(null);
  const [singleDurationDays, setSingleDurationDays] = useState<number>(30);
  const [singleCustomDays, setSingleCustomDays] = useState<string>("");
  const [singlePlanTitle, setSinglePlanTitle] = useState<string>("");
  const [singleNotifyTelegram, setSingleNotifyTelegram] = useState<boolean>(true);
  const [isSingleSaving, setIsSingleSaving] = useState<boolean>(false);

  // Add customer modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newDurationDays, setNewDurationDays] = useState(30);

  // Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to calculate days remaining
  const getSubscriptionStatus = (customer: StoreCustomer) => {
    if (!customer.activePlan && !customer.expiresAt) {
      return { status: "none", label: "بدون اشتراک", days: null, badgeColor: "slate" };
    }
    if (customer.expiresAt === null && customer.activePlan) {
      return { status: "lifetime", label: "مادام‌العمر ♾️", days: null, badgeColor: "emerald" };
    }
    if (!customer.expiresAt) {
      return { status: "none", label: "بدون اشتراک", days: null, badgeColor: "slate" };
    }

    const expiryTime = new Date(customer.expiresAt).getTime();
    if (isNaN(expiryTime)) {
      return { status: "none", label: "نامشخص", days: null, badgeColor: "slate" };
    }

    const diffDays = Math.ceil((expiryTime - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      return {
        status: "expired",
        label: `منقضی شده (${Math.abs(diffDays)} روز پیش)`,
        days: diffDays,
        badgeColor: "rose",
      };
    }
    if (diffDays <= 7) {
      return {
        status: "expiring_soon",
        label: `رو به اتمام (${diffDays} روز باقی‌مانده)`,
        days: diffDays,
        badgeColor: "amber",
      };
    }
    return {
      status: "active",
      label: `فعال (${diffDays} روز باقی‌مانده)`,
      days: diffDays,
      badgeColor: "cyan",
    };
  };

  // Overall Statistics
  const stats = useMemo(() => {
    let active = 0;
    let expiringSoon = 0;
    let expired = 0;
    let lifetime = 0;
    let none = 0;

    customers.forEach((c) => {
      const { status } = getSubscriptionStatus(c);
      if (status === "active") active++;
      else if (status === "expiring_soon") expiringSoon++;
      else if (status === "expired") expired++;
      else if (status === "lifetime") lifetime++;
      else none++;
    });

    return { total: customers.length, active: active + expiringSoon, expiringSoon, expired, lifetime, none };
  }, [customers]);

  // Filtered & Sorted customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const name = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
          const username = (c.username || "").toLowerCase();
          const userIdStr = String(c.userId);
          const planStr = (c.activePlan || "").toLowerCase();
          if (
            !name.includes(q) &&
            !username.includes(q) &&
            !userIdStr.includes(q) &&
            !planStr.includes(q)
          ) {
            return false;
          }
        }

        // Status Filter
        if (statusFilter !== "all") {
          const { status } = getSubscriptionStatus(c);
          if (statusFilter === "active" && status !== "active" && status !== "expiring_soon" && status !== "lifetime") {
            return false;
          }
          if (statusFilter === "expiring_soon" && status !== "expiring_soon") return false;
          if (statusFilter === "expired" && status !== "expired") return false;
          if (statusFilter === "lifetime" && status !== "lifetime") return false;
          if (statusFilter === "none" && status !== "none") return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "recent_join") {
          return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        }
        if (sortBy === "orders_count") {
          return (b.ordersCount || 0) - (a.ordersCount || 0);
        }
        if (sortBy === "expiry_asc") {
          // Soonest expiry first (expired / soonest up top)
          const timeA = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
          const timeB = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
          return timeA - timeB;
        }
        if (sortBy === "expiry_desc") {
          // Furthest expiry first
          const timeA = a.expiresAt ? new Date(a.expiresAt).getTime() : 9999999999999;
          const timeB = b.expiresAt ? new Date(b.expiresAt).getTime() : 9999999999999;
          return timeB - timeA;
        }
        return 0;
      });
  }, [customers, searchQuery, statusFilter, sortBy]);

  // Master Checkbox Logic
  const allFilteredSelected =
    filteredCustomers.length > 0 &&
    filteredCustomers.every((c) => selectedUserIds.includes(c.userId));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      // Unselect filtered
      const filteredIdSet = new Set(filteredCustomers.map((c) => c.userId));
      setSelectedUserIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      // Select all filtered
      const newSelected = new Set([...selectedUserIds, ...filteredCustomers.map((c) => c.userId)]);
      setSelectedUserIds(Array.from(newSelected));
    }
  };

  const toggleSelectRow = (userId: string | number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Execute Bulk Extension with 1-Click
  const handleExecuteBulkExtend = async () => {
    if (selectedUserIds.length === 0) {
      showToast("error", "لطفاً ابتدا حداقل یک مشتری را انتخاب کنید.");
      return;
    }

    const durationToApply = bulkCustomDays ? parseInt(bulkCustomDays, 10) : bulkDurationDays;
    if (isNaN(durationToApply) || durationToApply < 0) {
      showToast("error", "مدت زمان تمدید نامعتبر است.");
      return;
    }

    setIsBulkExecuting(true);
    try {
      const res = await fetch("/api/store-bot/customers/bulk-extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: selectedUserIds,
          durationDays: durationToApply,
          planTitle: bulkPlanTitle.trim() || undefined,
          notifyTelegram: bulkNotifyTelegram,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          "success",
          `🎉 ${json.message || `اشتراک ${selectedUserIds.length} مشتری با موفقیت تمدید شد.`}`
        );
        setSelectedUserIds([]);
        setBulkCustomDays("");
        onRefresh();
      } else {
        showToast("error", json.message || "خطا در تمدید اشتراک گروهی");
      }
    } catch (err: any) {
      showToast("error", err.message || "خطای ارتباط با سرور");
    } finally {
      setIsBulkExecuting(false);
    }
  };

  // Single Customer Extend
  const handleExecuteSingleExtend = async () => {
    if (!editingCustomer) return;
    const durationToApply = singleCustomDays ? parseInt(singleCustomDays, 10) : singleDurationDays;
    if (isNaN(durationToApply) || durationToApply < 0) {
      showToast("error", "مدت زمان تمدید نامعتبر است.");
      return;
    }

    setIsSingleSaving(true);
    try {
      const res = await fetch("/api/store-bot/customers/bulk-extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: [editingCustomer.userId],
          durationDays: durationToApply,
          planTitle: singlePlanTitle.trim() || undefined,
          notifyTelegram: singleNotifyTelegram,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", `اشتراک مشتری ${editingCustomer.firstName || editingCustomer.userId} با موفقیت تمدید شد.`);
        setEditingCustomer(null);
        onRefresh();
      } else {
        showToast("error", json.message || "خطا در تمدید اشتراک");
      }
    } catch (err: any) {
      showToast("error", err.message || "خطای سرور");
    } finally {
      setIsSingleSaving(false);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async (userId: string | number, name?: string) => {
    if (!confirm(`آیا از حذف مشتری ${name || userId} اطمینان دارید؟`)) return;
    try {
      const res = await fetch(`/api/store-bot/customers/${userId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("success", "مشتری از لیست حذف گردید.");
        setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
        onRefresh();
      } else {
        showToast("error", json.message || "خطا در حذف");
      }
    } catch (err: any) {
      showToast("error", err.message || "خطا در برقراری ارتباط");
    }
  };

  // Add Manual Customer
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) {
      showToast("error", "شناسه عددی تلگرام الزامی است.");
      return;
    }

    try {
      const expiresAtDate =
        newDurationDays === 0
          ? null
          : new Date(Date.now() + newDurationDays * 86400000).toISOString();

      const res = await fetch("/api/store-bot/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(newUserId) || newUserId.trim(),
          username: newUsername.replace(/^@/, "").trim() || undefined,
          firstName: newFirstName.trim() || "کاربر جدید",
          activePlan: newPlanTitle.trim() || "اکانت سلف زمان‌دار (۱ ماهه)",
          expiresAt: expiresAtDate,
          ordersCount: 1,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "مشتری جدید با موفقیت اضافه شد.");
        setIsAddModalOpen(false);
        setNewUserId("");
        setNewUsername("");
        setNewFirstName("");
        onRefresh();
      } else {
        showToast("error", json.message || "خطا در ثبت مشتری");
      }
    } catch (err: any) {
      showToast("error", err.message || "خطای ارتباط با سرور");
    }
  };

  // Duration Presets Definition
  const durationPresets = [
    { days: 7, label: "۷ روز", badge: "کوتاه مدت" },
    { days: 15, label: "۱۵ روز", badge: "نیم‌ماه" },
    { days: 30, label: "۳۰ روز (۱ ماه)", badge: "استاندارد" },
    { days: 60, label: "۶۰ روز (۲ ماه)", badge: "ویژه" },
    { days: 90, label: "۹۰ روز (۳ ماه)", badge: "تخفیف فصلی" },
    { days: 180, label: "۶ ماه", badge: "VIP" },
    { days: 365, label: "۱ سال (۳۶۵ روز)", badge: "طلایی" },
    { days: 0, label: "مادام‌العمر ♾️", badge: "دائمی" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ========================================================= */}
      {/* 1. TOP STATS CARDS */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>کل مشتریان</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-bold font-mono text-cyan-300">
            {stats.total.toLocaleString("fa-IR")}
          </p>
          <span className="text-[10px] text-slate-500">مجموع ثبت‌نامی‌ها</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>اشتراک‌های فعال</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-300">
            {stats.active.toLocaleString("fa-IR")}
          </p>
          <span className="text-[10px] text-emerald-400/80">دارای سرویس فعال</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>رو به اتمام (۷ روز)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold font-mono text-amber-300">
            {stats.expiringSoon.toLocaleString("fa-IR")}
          </p>
          <span className="text-[10px] text-amber-400/80">نیاز به تمدید</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>منقضی شده</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-bold font-mono text-rose-300">
            {stats.expired.toLocaleString("fa-IR")}
          </p>
          <span className="text-[10px] text-rose-400/80">پایان یافته</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>مادام‌العمر VIP</span>
            <Crown className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl font-bold font-mono text-purple-300">
            {stats.lifetime.toLocaleString("fa-IR")}
          </p>
          <span className="text-[10px] text-purple-400/80">بدون تاریخ انقضا</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. DYNAMIC BULK ACTION BAR (ACTION-ORIENTED 1-CLICK BAR) */}
      {/* ========================================================= */}
      <div
        className={`rounded-2xl transition-all duration-300 p-4 border ${
          selectedUserIds.length > 0
            ? "bg-gradient-to-r from-cyan-950/80 via-slate-900/95 to-purple-950/80 border-cyan-500/50 shadow-2xl shadow-cyan-500/10"
            : "bg-slate-900/50 border-slate-800/80"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left info & count */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold ${
                allFilteredSelected
                  ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md"
                  : selectedUserIds.length > 0
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
              }`}
              title={allFilteredSelected ? "لغو انتخاب همه" : "انتخاب همه موارد"}
            >
              {allFilteredSelected ? (
                <CheckSquare className="w-4 h-4" />
              ) : selectedUserIds.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-cyan-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>
                {selectedUserIds.length > 0
                  ? `${selectedUserIds.length} مشتری انتخاب شده`
                  : "انتخاب گروهی مشتریان"}
              </span>
            </button>

            {selectedUserIds.length > 0 && (
              <button
                onClick={() => setSelectedUserIds([])}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors underline decoration-dotted"
              >
                لغو انتخاب
              </button>
            )}
          </div>

          {/* Right Duration Selection & 1-Click Extend Button */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-300 font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>مدت تمدید:</span>
            </span>

            {/* Duration Pills */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap">
              {[
                { days: 7, label: "۷ روز" },
                { days: 15, label: "۱۵ روز" },
                { days: 30, label: "۳۰ روز" },
                { days: 60, label: "۶۰ روز" },
                { days: 90, label: "۹۰ روز" },
                { days: 365, label: "۱ سال" },
                { days: 0, label: "♾️ دائم" },
              ].map((preset) => (
                <button
                  key={preset.days}
                  onClick={() => {
                    setBulkDurationDays(preset.days);
                    setBulkCustomDays("");
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    bulkDurationDays === preset.days && !bulkCustomDays
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  {preset.label}
                </button>
              ))}

              {/* Custom days input */}
              <input
                type="number"
                min="1"
                placeholder="دلخواه روز"
                value={bulkCustomDays}
                onChange={(e) => setBulkCustomDays(e.target.value)}
                className={`w-20 bg-slate-900 border rounded-lg px-2 py-0.5 text-xs text-white placeholder-slate-500 outline-none font-mono ${
                  bulkCustomDays ? "border-cyan-500 text-cyan-300" : "border-slate-800"
                }`}
              />
            </div>

            {/* Telegram Notification Toggle */}
            <label
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer select-none hover:border-slate-700 transition-colors"
              title="ارسال پیامک/اعلان تلگرامی اختصاصی به پی‌وی هر مشتری"
            >
              <input
                type="checkbox"
                checked={bulkNotifyTelegram}
                onChange={(e) => setBulkNotifyTelegram(e.target.checked)}
                className="rounded accent-cyan-500 w-3.5 h-3.5"
              />
              <Send className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">اعلان تلگرام</span>
            </label>

            {/* 1-Click Action Button */}
            <button
              onClick={handleExecuteBulkExtend}
              disabled={isBulkExecuting || selectedUserIds.length === 0}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
                selectedUserIds.length > 0
                  ? "bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-cyan-500/25 cursor-pointer transform hover:-translate-y-0.5"
                  : "bg-slate-800 text-slate-500 opacity-60 cursor-not-allowed"
              }`}
            >
              {isBulkExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>در حال تمدید اشتراک‌ها...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
                  <span>
                    تمدید اشتراک انتخاب‌شده‌ها (۱ کلیک)
                    {selectedUserIds.length > 0 && ` [${selectedUserIds.length}]`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SEARCH, FILTER & TOOLBAR */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو با نام، نام کاربری (@user)، شناسه تلگرام..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none">
            {[
              { id: "all", label: "همه", count: customers.length },
              { id: "active", label: "اشتراک فعال", count: stats.active },
              { id: "expiring_soon", label: "در آستانه انقضا", count: stats.expiringSoon },
              { id: "expired", label: "منقضی‌شده", count: stats.expired },
              { id: "lifetime", label: "مادام‌العمر", count: stats.lifetime },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === f.id
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>

        {/* Sort & Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="recent_join">جدیدترین عضویت</option>
              <option value="expiry_asc">نزدیک‌ترین به انقضا (اولویت تمدید)</option>
              <option value="expiry_desc">بیشترین اعتبار باقیمانده</option>
              <option value="orders_count">بیشترین خریدها</option>
            </select>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>افزودن دستی</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="بروزرسانی داده‌ها"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. CUSTOMERS TABLE */}
      {/* ========================================================= */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">مشتری با این مشخصات یافت نشد.</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            می‌توانید فیلترها را پاک کنید یا از دکمه «افزودن دستی» برای اضافه کردن اکانت جدید استفاده نمایید.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                  <th className="py-3.5 pr-4 pl-2 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-cyan-400 transition-colors"
                      title="انتخاب همه"
                    >
                      {allFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-3">مشخصات خریدار تلگرام</th>
                  <th className="py-3.5 px-3">شناسه کاربری (User ID)</th>
                  <th className="py-3.5 px-3">طرح فعال</th>
                  <th className="py-3.5 px-3">وضعیت و تاریخ انقضا</th>
                  <th className="py-3.5 px-3">استایل کیبورد</th>
                  <th className="py-3.5 px-3">تعداد سفارش</th>
                  <th className="py-3.5 pl-4 pr-2 text-center">عملیات تمدید</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCustomers.map((customer) => {
                  const isSelected = selectedUserIds.includes(customer.userId);
                  const subStatus = getSubscriptionStatus(customer);
                  const fullName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "کاربر تلگرام";

                  return (
                    <tr
                      key={String(customer.userId)}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isSelected ? "bg-cyan-950/20" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 pr-4 pl-2">
                        <button
                          onClick={() => toggleSelectRow(customer.userId)}
                          className="text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Name & Username */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-300">
                            {fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{fullName}</span>
                            {customer.username ? (
                              <a
                                href={`https://t.me/${customer.username}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-cyan-400 hover:underline font-mono text-[11px] block"
                                dir="ltr"
                              >
                                @{customer.username}
                              </a>
                            ) : (
                              <span className="text-slate-500 text-[10px]">بدون آیدی عمومی</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* User ID */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-mono text-slate-300">
                          <span>{String(customer.userId)}</span>
                          <button
                            onClick={() => copyToClipboard(String(customer.userId), String(customer.userId))}
                            className="text-slate-500 hover:text-cyan-400 transition-colors p-1"
                            title="کپی شناسه"
                          >
                            {copiedId === String(customer.userId) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Active Plan */}
                      <td className="py-3 px-3">
                        {customer.activePlan ? (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-200 border border-slate-700/80 inline-block">
                            {customer.activePlan}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">طرحی فعال نیست</span>
                        )}
                      </td>

                      {/* Expiration Status */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              subStatus.badgeColor === "emerald"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : subStatus.badgeColor === "cyan"
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                : subStatus.badgeColor === "amber"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                                : subStatus.badgeColor === "rose"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {subStatus.badgeColor === "emerald" && <Crown className="w-3 h-3" />}
                            {subStatus.badgeColor === "amber" && <Clock className="w-3 h-3" />}
                            {subStatus.badgeColor === "rose" && <AlertTriangle className="w-3 h-3" />}
                            <span>{subStatus.label}</span>
                          </span>

                          {customer.expiresAt && (
                            <span className="text-[10px] text-slate-500 block font-mono">
                              تا: {new Date(customer.expiresAt).toLocaleDateString("fa-IR")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Keyboard Preference */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            customer.preferredKeyboardMode === "reply"
                              ? "bg-purple-950/40 text-purple-300 border-purple-800"
                              : customer.preferredKeyboardMode === "hybrid"
                              ? "bg-amber-950/40 text-amber-300 border-amber-800"
                              : "bg-cyan-950/40 text-cyan-300 border-cyan-800"
                          }`}
                        >
                          {customer.preferredKeyboardMode === "reply"
                            ? "⌨️ کیبورد باتن"
                            : customer.preferredKeyboardMode === "hybrid"
                            ? "⚡ ترکیبی"
                            : "🪟 شیشه‌ای"}
                        </span>
                      </td>

                      {/* Orders Count */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setViewingTransactionsCustomer(customer)}
                          className="group flex items-center gap-1 hover:text-cyan-300 transition-colors"
                          title="مشاهده فاکتورها و خریدهای این مشتری"
                        >
                          <span className="font-mono font-bold text-slate-200 group-hover:text-cyan-300">
                            {customer.ordersCount || 0}
                          </span>{" "}
                          <span className="text-[10px] text-slate-500 group-hover:text-cyan-400">سفارش</span>
                        </button>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 pl-4 pr-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingTransactionsCustomer(customer)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-cyan-300 border border-slate-700 text-[11px] font-semibold transition-all flex items-center gap-1 shadow-sm"
                            title="مشاهده تاریخچه تراکنش‌ها، پرداخت‌ها و تمدیدها"
                          >
                            <History className="w-3 h-3 text-cyan-400" />
                            <span>تراکنش‌ها</span>
                          </button>

                          <button
                            onClick={() => {
                              setEditingCustomer(customer);
                              setSingleDurationDays(30);
                              setSingleCustomDays("");
                              setSinglePlanTitle(customer.activePlan || "");
                              setSingleNotifyTelegram(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
                            title="تمدید اختصاصی اشتراک این مشتری"
                          >
                            <Zap className="w-3 h-3" />
                            <span>تمدید</span>
                          </button>

                          <button
                            onClick={() => handleDeleteCustomer(customer.userId, fullName)}
                            className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                            title="حذف مشتری"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer info */}
          <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              نمایش {filteredCustomers.length} از {customers.length} مشتری
            </span>
            {selectedUserIds.length > 0 && (
              <span className="text-cyan-400 font-semibold">
                {selectedUserIds.length} کاربر برای تمدید یکجا انتخاب شده‌اند
              </span>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: SINGLE CUSTOMER EXTEND / EDIT */}
      {/* ========================================================= */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>
                  تمدید اشتراک برای {editingCustomer.firstName || "کاربر"} (@
                  {editingCustomer.username || editingCustomer.userId})
                </span>
              </h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Current Status Box */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div>
                  طرح فعلی:{" "}
                  <strong className="text-cyan-300">
                    {editingCustomer.activePlan || "بدون اشتراک فعال"}
                  </strong>
                </div>
                <div>
                  اعتبار فعلی:{" "}
                  <span className="font-mono text-slate-300">
                    {editingCustomer.expiresAt
                      ? new Date(editingCustomer.expiresAt).toLocaleDateString("fa-IR")
                      : editingCustomer.activePlan
                      ? "مادام‌العمر ♾️"
                      : "منقضی یا ثبت‌نشده"}
                  </span>
                </div>
              </div>

              {/* Duration Presets */}
              <div>
                <label className="text-slate-300 font-semibold block mb-2">
                  افزایش مدت اعتبار به میزان:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {durationPresets.map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => {
                        setSingleDurationDays(preset.days);
                        setSingleCustomDays("");
                      }}
                      className={`p-2 rounded-xl text-center border transition-all ${
                        singleDurationDays === preset.days && !singleCustomDays
                          ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20"
                          : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <span className="block font-bold">{preset.label}</span>
                      <span className="text-[9px] opacity-75">{preset.badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom days */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  یا وارد کردن تعداد روز دلخواه:
                </label>
                <input
                  type="number"
                  min="1"
                  value={singleCustomDays}
                  onChange={(e) => setSingleCustomDays(e.target.value)}
                  placeholder="مثال: ۴۵"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-cyan-500"
                />
              </div>

              {/* Plan Title assignment */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  عنوان طرح اشتراک (اختیاری):
                </label>
                <input
                  type="text"
                  value={singlePlanTitle}
                  onChange={(e) => setSinglePlanTitle(e.target.value)}
                  placeholder="مثال: اکانت سلف زمان‌دار (۱ ماهه)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              {/* Notify Telegram */}
              <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={singleNotifyTelegram}
                  onChange={(e) => setSingleNotifyTelegram(e.target.checked)}
                  className="rounded accent-cyan-500 w-4 h-4"
                />
                <span className="text-slate-300">
                  ارسال خودکار پیام تبریک و تمدید اشتراک در تلگرام خریدار
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingCustomer(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                onClick={handleExecuteSingleExtend}
                disabled={isSingleSaving}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
              >
                {isSingleSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>تمدید فوری اشتراک</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL: ADD MANUAL / TEST CUSTOMER */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                <span>ثبت مشتری جدید و تنظیم اشتراک</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  شناسه عددی تلگرام (Telegram User ID) *:
                </label>
                <input
                  type="text"
                  required
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="مثال: 582910394"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-cyan-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">نام کاربر:</label>
                <input
                  type="text"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="مثال: رضا کریمی"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">آیدی تلگرام (@username):</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="@username"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-mono outline-none focus:border-cyan-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">طرح اشتراک:</label>
                <input
                  type="text"
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  placeholder="اکانت سلف زمان‌دار (۱ ماهه)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">مدت اعتبار اولیه (روز):</label>
                <select
                  value={newDurationDays}
                  onChange={(e) => setNewDurationDays(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                >
                  <option value={7}>۷ روز</option>
                  <option value={15}>۱۵ روز</option>
                  <option value={30}>۳۰ روز (۱ ماه)</option>
                  <option value={60}>۶۰ روز (۲ ماه)</option>
                  <option value={90}>۹۰ روز (۳ ماه)</option>
                  <option value={365}>۱ سال (۳۶۵ روز)</option>
                  <option value={0}>مادام‌العمر ♾️</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ثبت مشتری</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. MODAL: DETAILED CUSTOMER TRANSACTIONS & EXTENSIONS */}
      {/* ========================================================= */}
      {viewingTransactionsCustomer && (
        <CustomerTransactionsModal
          customer={viewingTransactionsCustomer}
          allOrders={orders}
          plans={plans}
          isOpen={Boolean(viewingTransactionsCustomer)}
          onClose={() => setViewingTransactionsCustomer(null)}
          onOpenExtendModal={(cust) => {
            setViewingTransactionsCustomer(null);
            setEditingCustomer(cust);
            setSingleDurationDays(30);
            setSingleCustomDays("");
            setSinglePlanTitle(cust.activePlan || "");
            setSingleNotifyTelegram(true);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}
