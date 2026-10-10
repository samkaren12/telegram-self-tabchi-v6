import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Bot,
  CreditCard,
  Coins,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  AlertTriangle,
  Users,
  TrendingUp,
  Tag,
  Radio,
  MessageSquare,
  Smartphone,
  Play,
  Square,
  Zap,
  DollarSign,
  ChevronDown,
  Layers,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  Sliders,
  Calculator,
  Eye,
  EyeOff,
  Lightbulb,
  Lock,
  Key,
  KeyRound,
  Shield,
} from "lucide-react";
import {
  StoreData,
  StorePlan,
  StoreOrder,
  StoreKeyboardMode,
  StoreButtonTheme,
  StorePaymentSettings,
  StoreBotSettings,
} from "../types";
import { Language } from "../utils/i18n";
import { PaymentMethodsManager } from "./store/PaymentMethodsManager";
import { BatchPricingModal } from "./store/BatchPricingModal";
import { CustomersManager } from "./store/CustomersManager";

interface StoreBotModuleProps {
  lang: Language;
  onOpenHelp?: (section?: any) => void;
}

export function StoreBotModule({ lang, onOpenHelp }: StoreBotModuleProps) {
  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "customers" | "orders" | "plans" | "payments" | "bot_config" | "simulator" | "coupons" | "broadcast"
  >("overview");

  // Form states
  const [botToken, setBotToken] = useState("");
  const [ownerTelegramId, setOwnerTelegramId] = useState("");
  const [supportUsername, setSupportUsername] = useState("");
  const [channelUsername, setChannelUsername] = useState("");
  const [welcomeText, setWelcomeText] = useState("");
  const [keyboardMode, setKeyboardMode] = useState<StoreKeyboardMode>("inline");
  const [keyboardColumns, setKeyboardColumns] = useState<1 | 2 | 3>(2);
  const [replyKeyboardColumns, setReplyKeyboardColumns] = useState<1 | 2 | 3>(2);
  const [allowCustomerKeyboardSwitch, setAllowCustomerKeyboardSwitch] = useState<boolean>(true);
  const [simEffectiveMode, setSimEffectiveMode] = useState<StoreKeyboardMode>("inline");
  const [buttonTheme, setButtonTheme] = useState<StoreButtonTheme>("cyber_neon");
  const [buttonLabels, setButtonLabels] = useState<any>({});

  // Action status states
  const [testingToken, setTestingToken] = useState(false);
  const [tokenTestResult, setTokenTestResult] = useState<{ valid: boolean; bot?: any; error?: string } | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Order modals
  const [approvingOrder, setApprovingOrder] = useState<StoreOrder | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<StoreOrder | null>(null);
  const [approvalLicense, setApprovalLicense] = useState("");
  const [approvalAccountPhone, setApprovalAccountPhone] = useState("");
  const [approvalPassword, setApprovalPassword] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingOrder, setProcessingOrder] = useState(false);
  const [orderFilter, setOrderFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // Plan modal
  const [editingPlan, setEditingPlan] = useState<StorePlan | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState<Partial<StorePlan>>({
    title: "",
    category: "self",
    durationDays: 30,
    isUnlimited: false,
    priceToman: 99000,
    priceUsdt: 1.5,
    description: "",
    features: [],
    badge: "جدید",
    color: "cyan",
    isActive: true,
  });
  const [planFeaturesText, setPlanFeaturesText] = useState("");
  const [plansFilter, setPlansFilter] = useState<"all" | "active" | "inactive">("all");
  const [isBatchPricingOpen, setIsBatchPricingOpen] = useState(false);
  const [quickEditPlanId, setQuickEditPlanId] = useState<string | null>(null);
  const [quickPriceToman, setQuickPriceToman] = useState<number>(0);
  const [quickPriceUsdt, setQuickPriceUsdt] = useState<number>(0);

  // Payment form states
  const [paymentsState, setPaymentsState] = useState<StorePaymentSettings | null>(null);
  const [savingPayments, setSavingPayments] = useState(false);

  // Coupon form states
  const [couponCode, setCouponCode] = useState("");
  const [couponPercent, setCouponPercent] = useState<number>(15);
  const [couponMaxUses, setCouponMaxUses] = useState<number>(50);

  // Broadcast form states
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastBtnTitle, setBroadcastBtnTitle] = useState("");
  const [broadcastBtnUrl, setBroadcastBtnUrl] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Simulator state
  const [simStep, setSimStep] = useState<"menu" | "category" | "plan_details" | "card_pay" | "crypto_pay" | "receipt_sent">("menu");
  const [simSelectedPlan, setSimSelectedPlan] = useState<StorePlan | null>(null);
  const [simCategory, setSimCategory] = useState<"self" | "tabchi" | "combo">("self");

  // Store Admin Credentials & Web Panel Security Gate
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState("store_admin");
  const [adminPassword, setAdminPassword] = useState("admin_store_2026");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [savingAdminCreds, setSavingAdminCreds] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isStorePanelLocked, setIsStorePanelLocked] = useState(false);
  const [storeLoginUser, setStoreLoginUser] = useState("");
  const [storeLoginPass, setStoreLoginPass] = useState("");
  const [storeLoginError, setStoreLoginError] = useState<string | null>(null);
  const [storeLoginLoading, setStoreLoginLoading] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getThemeDetails = (theme: StoreButtonTheme) => {
    switch (theme) {
      case "fire_red":
        return {
          selfIcon: "🔴",
          tabchiIcon: "🔥",
          comboIcon: "💥",
          catalogIcon: "🏮",
          ordersIcon: "📦",
          accountIcon: "👤",
          supportIcon: "🚨",
          selfColor: "text-rose-400 border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/50",
          tabchiColor: "text-red-400 border-red-500/40 bg-red-950/40 hover:bg-red-900/50",
          comboColor: "text-orange-400 border-orange-500/40 bg-orange-950/40 hover:bg-orange-900/50",
          catalogColor: "text-amber-400 border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/50",
        };
      case "emerald_matrix":
        return {
          selfIcon: "🟢",
          tabchiIcon: "⚡",
          comboIcon: "❇️",
          catalogIcon: "🌿",
          ordersIcon: "📥",
          accountIcon: "👤",
          supportIcon: "📞",
          selfColor: "text-emerald-400 border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50",
          tabchiColor: "text-teal-400 border-teal-500/40 bg-teal-950/40 hover:bg-teal-900/50",
          comboColor: "text-green-400 border-green-500/40 bg-green-950/40 hover:bg-green-900/50",
          catalogColor: "text-lime-400 border-lime-500/40 bg-lime-950/40 hover:bg-lime-900/50",
        };
      case "rainbow_vivid":
        return {
          selfIcon: "🟢",
          tabchiIcon: "🔵",
          comboIcon: "🟣",
          catalogIcon: "🟡",
          ordersIcon: "🟠",
          accountIcon: "👤",
          supportIcon: "🔴",
          selfColor: "text-emerald-400 border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50",
          tabchiColor: "text-sky-400 border-sky-500/40 bg-sky-950/40 hover:bg-sky-900/50",
          comboColor: "text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-950/40 hover:bg-fuchsia-900/50",
          catalogColor: "text-amber-400 border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/50",
        };
      case "galaxy_purple":
        return {
          selfIcon: "🔮",
          tabchiIcon: "🌌",
          comboIcon: "✨",
          catalogIcon: "🪐",
          ordersIcon: "📦",
          accountIcon: "👤",
          supportIcon: "🛰️",
          selfColor: "text-purple-400 border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/50",
          tabchiColor: "text-indigo-400 border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/50",
          comboColor: "text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-950/40 hover:bg-fuchsia-900/50",
          catalogColor: "text-violet-400 border-violet-500/40 bg-violet-950/40 hover:bg-violet-900/50",
        };
      case "luxury_gold":
        return {
          selfIcon: "👑",
          tabchiIcon: "⚜️",
          comboIcon: "🏆",
          catalogIcon: "💼",
          ordersIcon: "🏷️",
          accountIcon: "💎",
          supportIcon: "🛎️",
          selfColor: "text-amber-300 border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/50",
          tabchiColor: "text-yellow-300 border-yellow-500/40 bg-yellow-950/40 hover:bg-yellow-900/50",
          comboColor: "text-amber-400 border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/50",
          catalogColor: "text-orange-300 border-orange-500/40 bg-orange-950/40 hover:bg-orange-900/50",
        };
      case "crypto_cyan":
        return {
          selfIcon: "💠",
          tabchiIcon: "🌐",
          comboIcon: "⚡",
          catalogIcon: "📊",
          ordersIcon: "🔗",
          accountIcon: "💳",
          supportIcon: "💬",
          selfColor: "text-cyan-400 border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50",
          tabchiColor: "text-blue-400 border-blue-500/40 bg-blue-950/40 hover:bg-blue-900/50",
          comboColor: "text-sky-400 border-sky-500/40 bg-sky-950/40 hover:bg-sky-900/50",
          catalogColor: "text-teal-400 border-teal-500/40 bg-teal-950/40 hover:bg-teal-900/50",
        };
      case "aiogram_colored":
        return {
          selfIcon: "🟢", // success
          tabchiIcon: "🔵", // primary
          comboIcon: "🔴", // danger
          catalogIcon: "🔵", // primary
          ordersIcon: "🟢", // success
          accountIcon: "🔵", // primary
          supportIcon: "🔴", // danger
          selfColor: "text-emerald-200 border-emerald-400/60 bg-emerald-500/20 hover:bg-emerald-500/30 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95",
          tabchiColor: "text-blue-200 border-blue-400/60 bg-blue-500/20 hover:bg-blue-500/30 font-bold shadow-[0_0_12px_rgba(59,130,246,0.3)] active:scale-95",
          comboColor: "text-rose-200 border-rose-400/60 bg-rose-500/20 hover:bg-rose-500/30 font-bold shadow-[0_0_12px_rgba(244,63,94,0.3)] active:scale-95",
          catalogColor: "text-indigo-200 border-indigo-400/60 bg-indigo-500/20 hover:bg-indigo-500/30 font-bold shadow-[0_0_12px_rgba(99,102,241,0.3)] active:scale-95",
        };
      case "cyber_neon":
      default:
        return {
          selfIcon: "💎",
          tabchiIcon: "🚀",
          comboIcon: "⚡",
          catalogIcon: "🛍️",
          ordersIcon: "📦",
          accountIcon: "👤",
          supportIcon: "📞",
          selfColor: "text-cyan-300 border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50",
          tabchiColor: "text-emerald-300 border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50",
          comboColor: "text-purple-300 border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/50",
          catalogColor: "text-amber-300 border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/50",
        };
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Track whether form fields have been initially loaded from server
  const isFormInitializedRef = useRef(false);

  // Fetch store data
  const fetchStoreData = async (forceFormUpdate = false) => {
    try {
      const res = await fetch("/api/store-bot/data");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);

          // Update form states only on first load or when explicitly forced (e.g. after save)
          if (!isFormInitializedRef.current || forceFormUpdate) {
            isFormInitializedRef.current = true;
            setPaymentsState(json.data.payments);
            setBotToken(json.data.settings.botToken || "");
            setOwnerTelegramId(String(json.data.settings.ownerTelegramId || ""));
            setSupportUsername(json.data.settings.supportUsername || "");
            setChannelUsername(json.data.settings.channelUsername || "");
            setWelcomeText(json.data.settings.welcomeText || "");
            const km = json.data.settings.keyboardMode || "inline";
            setKeyboardMode(km);
            setSimEffectiveMode(km);
            setKeyboardColumns(Number(json.data.settings.keyboardColumns || 2) as any);
            setReplyKeyboardColumns(Number(json.data.settings.replyKeyboardColumns || json.data.settings.keyboardColumns || 2) as any);
            setAllowCustomerKeyboardSwitch(
              json.data.settings.allowCustomerKeyboardSwitch !== undefined
                ? Boolean(json.data.settings.allowCustomerKeyboardSwitch)
                : true
            );
            setButtonTheme(json.data.settings.buttonTheme || "cyber_neon");
            setButtonLabels(json.data.settings.buttonLabels || {});
          }
        }
      }
    } catch (err) {
      console.error("Error fetching store data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData(true);
    const interval = setInterval(() => fetchStoreData(false), 7000);
    return () => clearInterval(interval);
  }, []);

  const fetchAdminCredentials = async () => {
    try {
      const res = await fetch("/api/store-bot/admin-credentials");
      const json = await res.json();
      if (json.success && json.credentials) {
        setAdminUsername(json.credentials.username || "store_admin");
        if (json.credentials.password) setAdminPassword(json.credentials.password);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchAdminCredentials();
  }, []);

  const handleSaveAdminCredentials = async () => {
    if (!newAdminUsername.trim() || !newAdminPassword.trim()) {
      showToast("error", "نام کاربری و کلمه عبور جدید را کامل وارد نمایید.");
      return;
    }
    setSavingAdminCreds(true);
    try {
      const res = await fetch("/api/store-bot/admin-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newUsername: newAdminUsername.trim(),
          newPassword: newAdminPassword.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "مشخصات ورود وب پنل مدیریت ربات با موفقیت ذخیره شد ✅");
        setAdminUsername(newAdminUsername.trim());
        setAdminPassword(newAdminPassword.trim());
        setNewAdminUsername("");
        setNewAdminPassword("");
        setIsCredentialsModalOpen(false);
      } else {
        showToast("error", json.message || "خطا در تغییر مشخصات");
      }
    } catch (err: any) {
      showToast("error", err.message || "خطا در برقراری ارتباط با سرور");
    } finally {
      setSavingAdminCreds(false);
    }
  };

  const handleStorePanelLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoreLoginLoading(true);
    setStoreLoginError(null);
    try {
      const res = await fetch("/api/store-bot/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: storeLoginUser.trim(),
          password: storeLoginPass.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsStorePanelLocked(false);
        showToast("success", "احراز هویت موفقیت‌آمیز بود. خوش آمدید!");
        setStoreLoginUser("");
        setStoreLoginPass("");
      } else {
        setStoreLoginError(json.message || "نام کاربری یا کلمه عبور نامعتبر است.");
      }
    } catch (_) {
      setStoreLoginError("خطا در برقراری ارتباط با سرور");
    } finally {
      setStoreLoginLoading(false);
    }
  };

  // Save Bot Configuration
  const handleSaveBotSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/store-bot/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken,
          ownerTelegramId,
          supportUsername,
          channelUsername,
          welcomeText,
          keyboardMode,
          keyboardColumns,
          replyKeyboardColumns,
          allowCustomerKeyboardSwitch,
          buttonTheme,
          buttonLabels,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message || "تنظیمات ربات ذخیره شد.");
        fetchStoreData();
      } else {
        showToast("error", json.message || "خطا در ذخیره تنظیمات");
      }
    } catch (err: any) {
      showToast("error", err.message || "خطای سرور");
    } finally {
      setSavingSettings(false);
    }
  };

  // Test Bot Token
  const handleTestToken = async () => {
    if (!botToken.trim()) {
      showToast("error", "ابتدا توکن ربات تلگرام را وارد کنید.");
      return;
    }
    setTestingToken(true);
    setTokenTestResult(null);
    try {
      const res = await fetch("/api/store-bot/test-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: botToken }),
      });
      const json = await res.json();
      setTokenTestResult(json);
      if (json.success) {
        showToast("success", `ربات @${json.bot?.username} تایید و تنظیمات ذخیره شد.`);
        // Auto-persist verified bot token to ensure it never gets lost
        fetch("/api/store-bot/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            botToken: botToken.trim(),
            botUsername: json.bot?.username,
            botFirstName: json.bot?.firstName,
            ownerTelegramId,
            supportUsername,
            channelUsername,
            welcomeText,
            keyboardMode,
            keyboardColumns,
            replyKeyboardColumns,
            allowCustomerKeyboardSwitch,
            buttonTheme,
            buttonLabels,
          }),
        }).catch(() => {});
      } else {
        showToast("error", json.error || "توکن ربات نامعتبر است.");
      }
    } catch (err: any) {
      setTokenTestResult({ valid: false, error: err.message });
      showToast("error", err.message);
    } finally {
      setTestingToken(false);
    }
  };

  // Toggle Bot Service (Start / Stop)
  const handleToggleService = async (enable: boolean) => {
    try {
      const res = await fetch("/api/store-bot/toggle-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: enable }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message);
        fetchStoreData();
      } else {
        showToast("error", json.message);
      }
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Save Payments
  const handleSavePayments = async () => {
    if (!paymentsState) return;
    setSavingPayments(true);
    try {
      const res = await fetch("/api/store-bot/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentsState),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "تنظیمات درگاه‌های پرداخت با موفقیت ذخیره شد.");
        fetchStoreData();
      } else {
        showToast("error", json.message);
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setSavingPayments(false);
    }
  };

  // Approve Order
  const handleConfirmApproval = async () => {
    if (!approvingOrder) return;
    setProcessingOrder(true);
    try {
      const res = await fetch(`/api/store-bot/orders/${approvingOrder.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentials: {
            licenseCode: approvalLicense.trim() || undefined,
            accountPhone: approvalAccountPhone.trim() || undefined,
            password: approvalPassword.trim() || undefined,
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "سفارش با موفقیت تأیید و اعلان تلگرام برای کاربر ارسال شد.");
        setApprovingOrder(null);
        setApprovalLicense("");
        setApprovalAccountPhone("");
        setApprovalPassword("");
        fetchStoreData();
      } else {
        showToast("error", json.message);
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setProcessingOrder(false);
    }
  };

  // Reject Order
  const handleConfirmRejection = async () => {
    if (!rejectingOrder) return;
    setProcessingOrder(true);
    try {
      const res = await fetch(`/api/store-bot/orders/${rejectingOrder.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "سفارش رد شد و پیام توضیح برای کاربر ارسال گردید.");
        setRejectingOrder(null);
        setRejectionReason("");
        fetchStoreData();
      } else {
        showToast("error", json.message);
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setProcessingOrder(false);
    }
  };

  // Plan Save (Create / Update)
  const handleSavePlan = async () => {
    const featuresArray = planFeaturesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      ...planForm,
      features: featuresArray,
    };

    try {
      let res;
      if (editingPlan) {
        res = await fetch(`/api/store-bot/plans/${editingPlan.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/store-bot/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message);
        setIsPlanModalOpen(false);
        setEditingPlan(null);
        fetchStoreData();
      } else {
        showToast("error", json.message);
      }
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Delete Plan
  const handleDeletePlan = async (planId: string) => {
    if (!confirm("آیا از حذف این پلن فروشگاهی اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/store-bot/plans/${planId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("success", "پلن حذف شد.");
        fetchStoreData();
      } else {
        showToast("error", json.message);
      }
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Toggle Plan Active (Enable / Disable Subscription Tier for Customers)
  const handleTogglePlan = async (planId: string) => {
    try {
      const res = await fetch(`/api/store-bot/plans/${planId}/toggle`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message);
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            plans: prev.plans.map((p) => (p.id === planId ? json.plan : p)),
          };
        });
      } else {
        showToast("error", json.message || "خطا در تغییر وضعیت پلن");
      }
    } catch (_) {
      showToast("error", "خطا در برقراری ارتباط با سرور");
    }
  };

  // Save Quick Custom Pricing
  const handleQuickPriceSave = async (planId: string) => {
    try {
      const res = await fetch(`/api/store-bot/plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceToman: quickPriceToman, priceUsdt: quickPriceUsdt }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "قیمت جدید پلن ذخیره شد.");
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            plans: prev.plans.map((p) => (p.id === planId ? json.plan : p)),
          };
        });
        setQuickEditPlanId(null);
      } else {
        showToast("error", json.message);
      }
    } catch (_) {
      showToast("error", "خطا در ذخیره قیمت");
    }
  };

  // Add Coupon
  const handleAddCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch("/api/store-bot/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          discountPercent: Number(couponPercent) || 10,
          discountToman: 0,
          maxUses: Number(couponMaxUses) || 50,
          isActive: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "کد تخفیف جدید ایجاد شد.");
        setCouponCode("");
        fetchStoreData();
      } else {
        showToast("error", json.message);
      }
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (id: string) => {
    try {
      const res = await fetch(`/api/store-bot/coupons/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("success", "کد تخفیف حذف شد.");
        fetchStoreData();
      }
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Send Broadcast
  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) {
      showToast("error", "متن پیام همگانی الزامی است.");
      return;
    }
    setSendingBroadcast(true);
    try {
      const res = await fetch("/api/store-bot/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: broadcastText,
          buttonTitle: broadcastBtnTitle.trim() || undefined,
          buttonUrl: broadcastBtnUrl.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message);
        setBroadcastText("");
        setBroadcastBtnTitle("");
        setBroadcastBtnUrl("");
      } else {
        showToast("error", json.message);
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setSendingBroadcast(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-slate-400 text-sm">در حال بارگذاری ماژول پیشرفته فروشگاه ربات تلگرام...</p>
      </div>
    );
  }

  const settings = data?.settings;
  const plans = data?.plans || [];
  const orders = data?.orders || [];
  const coupons = data?.coupons || [];
  const customers = data?.customers || [];
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const filteredOrders = orders.filter((o) => (orderFilter === "all" ? true : o.status === orderFilter));

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-semibold flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
              : "bg-rose-950/90 text-rose-200 border-rose-500/40"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner - Owner Special */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 shadow-xl shadow-cyan-500/25 flex-shrink-0 group hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center text-cyan-400">
                <ShoppingBag className="w-7 h-7" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-wide">
                  فروشگاه ربات تلگرام • فروش اشتراک، سلف و تبچی
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  مخصوص مالک سرور 👑
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                مدیریت خودکار فروش اشتراک به مشتریان، درگاه پرداخت شتاب و ارز دیجیتال، تحویل آنی و دکمه‌های رنگی شیشه‌ای و کیبوردی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Store Web Admin Credentials & Security Button */}
            <button
              type="button"
              onClick={() => setIsCredentialsModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-200 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.25)] transition-all active:scale-95 cursor-pointer"
              title="مشاهده و تغییر نام کاربری و کلمه عبور اختصاصی پنل مدیریت ربات"
            >
              <Key className="w-3.5 h-3.5 text-purple-400" />
              <span>مشخصات وب پنل ادمین 🔐</span>
              <span className="font-mono text-[10px] bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800 text-purple-300">
                {adminUsername}
              </span>
            </button>

            {/* Quick Lock Button */}
            <button
              type="button"
              onClick={() => {
                const next = !isStorePanelLocked;
                setIsStorePanelLocked(next);
                showToast("success", next ? "پنل فروشگاه قفل شد 🔒" : "پنل فروشگاه باز شد 🔓");
              }}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                isStorePanelLocked
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-500/20 shadow-md"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
              title={isStorePanelLocked ? "پنل قفل است (کلیک برای بازگشایی)" : "قفل کردن پنل مدیریت با کلمه عبور"}
            >
              <Lock className="w-3.5 h-3.5" />
            </button>

            {onOpenHelp && (
              <button
                type="button"
                onClick={() => onOpenHelp("store")}
                className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all active:scale-95 cursor-pointer"
                title="آموزش تصویری ربات فروشگاهی و دکمه‌های رنگی"
              >
                <Lightbulb className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>راهنمای فروشگاه 💡</span>
              </button>
            )}

            {/* Quick Engine Status & Switch */}
            <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800/80 p-2 rounded-2xl shadow-inner">
            <div className="flex items-center gap-2 px-3 py-1.5">
              <span
                className={`w-3 h-3 rounded-full ${
                  settings?.status === "online"
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-slate-600"
                }`}
              ></span>
              <span className="text-xs font-mono font-bold text-slate-300">
                {settings?.status === "online" ? "ربات فعال و آنلاین" : "سرویس متوقف"}
              </span>
            </div>

            {settings?.enabled ? (
              <button
                onClick={() => handleToggleService(false)}
                className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Square className="w-3.5 h-3.5" />
                <span>توقف ربات</span>
              </button>
            ) : (
              <button
                onClick={() => handleToggleService(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>روشن کردن ربات</span>
              </button>
            )}
          </div>
        </div>
      </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="glass-card rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>فروش ریالی</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-base sm:text-lg font-bold font-mono text-emerald-300">
              {(settings?.stats?.totalRevenueToman || 0).toLocaleString("fa-IR")} <span className="text-xs font-normal">تومان</span>
            </p>
          </div>

          <div className="glass-card rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>درآمد ارزی (USDT)</span>
              <Coins className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-base sm:text-lg font-bold font-mono text-cyan-300">
              ${(settings?.stats?.totalRevenueUsdt || 0).toFixed(2)} <span className="text-xs font-normal">USDT</span>
            </p>
          </div>

          <div className="glass-card rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>سفارشات در انتظار</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-base sm:text-lg font-bold font-mono text-amber-300">
                {pendingOrders.length}
              </p>
              {pendingOrders.length > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                  بررسی فوری!
                </span>
              )}
            </div>
          </div>

          <div
            onClick={() => setActiveSubTab("customers")}
            className="glass-card rounded-2xl p-4 space-y-1 cursor-pointer group hover:border-purple-500/50 hover:shadow-purple-500/10 shadow-sm"
          >
            <div className="flex items-center justify-between text-slate-400 group-hover:text-purple-300 text-xs">
              <span>مشتریان ربات</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-base sm:text-lg font-bold font-mono text-purple-300">
                {customers.length} <span className="text-xs font-normal">کاربر</span>
              </p>
              <span className="text-[10px] text-purple-400 opacity-80 group-hover:opacity-100 group-hover:underline">
                مدیریت و تمدید ←
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
        {[
          { id: "overview", label: "📊 داشبورد و آمار", icon: TrendingUp },
          {
            id: "customers",
            label: "👥 مشتریان و تمدید اشتراک",
            icon: Users,
            count: customers.length,
          },
          {
            id: "orders",
            label: "🧾 سفارشات و فاکتورها",
            icon: ShoppingBag,
            badge: pendingOrders.length > 0 ? pendingOrders.length : undefined,
          },
          { id: "plans", label: "💎 مدیریت پکیج‌ها (سلف و تبچی)", icon: Layers, count: plans.length },
          { id: "payments", label: "💳 درگاه کارت و ارز دیجیتال", icon: CreditCard },
          { id: "bot_config", label: "⚙️ تنظیمات ربات و دکمه‌ها", icon: Bot },
          { id: "simulator", label: "📱 پیش‌نمایش زنده ربات تلگرام", icon: Smartphone },
          { id: "coupons", label: "🎁 کدهای تخفیف", icon: Tag, count: coupons.length },
          { id: "broadcast", label: "📢 ارسال پیام همگانی", icon: Send },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
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

      {/* ========================================================= */}
      {/* 1. OVERVIEW & QUICK ACTIONS */}
      {/* ========================================================= */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          {/* Pending Orders Alert Box */}
          {pendingOrders.length > 0 && (
            <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-200">
                      شما {pendingOrders.length} سفارش جدید در انتظار بررسی و تأیید دارید!
                    </h3>
                    <p className="text-xs text-amber-300/80">
                      کاربران فیش واریزی ارسال کرده‌اند و منتظر دریافت لایسنس و فعال‌سازی اکانت هستند.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubTab("orders")}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <span>بررسی سفارشات</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Quick Guide / Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">اتصال به BotFather</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                کافیست یکبار توکن ربات فروشگاه خود را از @BotFather دریافت کرده و در بخش تنظیمات وارد نمایید تا ربات فروشنده ۲۴ ساعته شما شروع به کار کند.
              </p>
              <button
                onClick={() => setActiveSubTab("bot_config")}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
              >
                <span>تنظیمات ربات و دکمه‌ها</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">درگاه‌های پرداخت دوگانه</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                پشتیبانی کامل از پرداخت کارت به کارت بانکی شتاب با شماره کارت و شبا، به همراه پرداخت ارزی با تتر (USDT)، تون (TON) و ترون (TRX).
              </p>
              <button
                onClick={() => setActiveSubTab("payments")}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-1"
              >
                <span>مدیریت حساب‌ها و والت‌ها</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">دکمه‌های رنگی و کیبوردی</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                قابلیت سوییچ سریع میان دکمه‌های شیشه‌ای (Inline Buttons) و کیبورد معمولی (Reply Keyboard) با استایل‌های جذاب نئونی، کیهانی و لوکس.
              </p>
              <button
                onClick={() => setActiveSubTab("simulator")}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1"
              >
                <span>مشاهده پیش‌نمایش زنده</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Recent Orders Preview */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-cyan-400" />
                <span>آخرین سفارشات ثبت‌شده در ربات</span>
              </h3>
              <button
                onClick={() => setActiveSubTab("orders")}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                مشاهده همه ({orders.length})
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                هنوز سفارشی در ربات ثبت نشده است. پس از روشن کردن ربات و انتشار آن به کاربران، سفارشات در اینجا نمایش داده خواهند شد.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 pr-2">شماره فاکتور</th>
                      <th className="pb-3">مشتری</th>
                      <th className="pb-3">طرح انتخابی</th>
                      <th className="pb-3">روش پرداخت</th>
                      <th className="pb-3">مبلغ</th>
                      <th className="pb-3">وضعیت</th>
                      <th className="pb-3 pl-2">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {orders.slice(0, 5).map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 pr-2 font-mono font-bold text-white">{ord.id}</td>
                        <td className="py-3">
                          <span className="text-slate-200">{ord.userFirstName || "کاربر"}</span>
                          {ord.userUsername && (
                            <span className="text-cyan-400 font-mono text-[11px] block" dir="ltr">
                              @{ord.userUsername}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-slate-300 font-medium">{ord.planTitle}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {ord.paymentMethod === "card" ? "💳 کارت به کارت" : "🌐 کریپتو"}
                          </span>
                        </td>
                        <td className="py-3 font-mono font-bold text-emerald-400">
                          {ord.finalPriceToman.toLocaleString("fa-IR")} تومان
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.status === "approved"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : ord.status === "rejected"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                            }`}
                          >
                            {ord.status === "approved"
                              ? "تأیید شد"
                              : ord.status === "rejected"
                              ? "رد شد"
                              : "در انتظار بررسی"}
                          </span>
                        </td>
                        <td className="py-3 pl-2">
                          {ord.status === "pending" ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setApprovingOrder(ord)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] shadow-sm"
                              >
                                تأیید
                              </button>
                              <button
                                onClick={() => setRejectingOrder(ord)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px]"
                              >
                                رد
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">پایان یافته</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CUSTOMERS & SUBSCRIPTIONS (BULK ACTION EXTENSION) */}
      {/* ========================================================= */}
      {activeSubTab === "customers" && (
        <CustomersManager
          customers={customers}
          plans={plans}
          orders={orders}
          onRefresh={fetchStoreData}
          showToast={showToast}
        />
      )}

      {/* ========================================================= */}
      {/* 3. ORDERS MANAGEMENT */}
      {/* ========================================================= */}
      {activeSubTab === "orders" && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">فیلتر سفارشات:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[
                  { id: "all", label: "همه", count: orders.length },
                  { id: "pending", label: "در انتظار", count: pendingOrders.length },
                  { id: "approved", label: "تأیید شده", count: orders.filter((o) => o.status === "approved").length },
                  { id: "rejected", label: "رد شده", count: orders.filter((o) => o.status === "rejected").length },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOrderFilter(f.id as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      orderFilter === f.id
                        ? "bg-cyan-500 text-slate-950 shadow-md font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={fetchStoreData}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors self-end sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>بروزرسانی لیست</span>
            </button>
          </div>

          {/* Orders Cards / Table */}
          {filteredOrders.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold">هیچ سفارشی در این بخش یافت نشد.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className={`bg-slate-900/80 border rounded-2xl p-5 space-y-4 transition-all shadow-xl ${
                    ord.status === "pending"
                      ? "border-amber-500/40 shadow-amber-500/5"
                      : ord.status === "approved"
                      ? "border-emerald-500/30"
                      : "border-slate-800"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-black text-cyan-300">#{ord.id}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          ord.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : ord.status === "rejected"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                        }`}
                      >
                        {ord.status === "approved"
                          ? "✅ تأیید و تحویل داده شد"
                          : ord.status === "rejected"
                          ? "❌ رد شده"
                          : "⏳ در انتظار بررسی و تأیید فیش"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 font-mono">
                      {new Date(ord.createdAt).toLocaleDateString("fa-IR")} - {new Date(ord.createdAt).toLocaleTimeString("fa-IR")}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Customer info */}
                    <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-bold block">مشخصات خریدار تلگرام:</span>
                      <div className="text-slate-200">
                        {ord.userFirstName} {ord.userUsername ? `(@${ord.userUsername})` : ""}
                      </div>
                      <div className="text-slate-400 font-mono">شناسه تلگرام: {String(ord.userId)}</div>
                    </div>

                    {/* Plan & Price info */}
                    <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-bold block">پکیج و فاکتور:</span>
                      <div className="text-cyan-300 font-bold">{ord.planTitle}</div>
                      <div className="text-emerald-400 font-mono font-bold">
                        {ord.finalPriceToman.toLocaleString("fa-IR")} تومان ({ord.finalPriceUsdt} USDT)
                      </div>
                      {ord.discountAmount ? (
                        <div className="text-amber-400 text-[11px]">
                          تخفیف اعمال شده: {ord.discountAmount.toLocaleString("fa-IR")} ت
                        </div>
                      ) : null}
                    </div>

                    {/* Payment & Receipt proof */}
                    <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-bold block">رسید و اطلاعات پرداخت:</span>
                      <div className="text-slate-300">
                        روش: {ord.paymentMethod === "card" ? "💳 کارت به کارت شتاب" : "🌐 ارز دیجیتال"}
                      </div>
                      <div className="text-amber-300 font-mono text-[11px] break-all bg-slate-900 p-2 rounded border border-slate-800">
                        {ord.paymentDetails?.receiptProof || "بدون متن فیش"}
                      </div>
                    </div>
                  </div>

                  {/* Credentials if approved */}
                  {ord.generatedCredentials && (
                    <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <span className="text-emerald-300 font-bold">اطلاعات تحویل داده شده به مشتری:</span>
                        <div className="font-mono text-white">
                          کد لایسنس: <span className="text-emerald-400 font-bold">{ord.generatedCredentials.licenseCode}</span>
                        </div>
                        {ord.generatedCredentials.password && (
                          <div className="font-mono text-slate-300">
                            رمز وب پنل: {ord.generatedCredentials.password}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rejection reason if rejected */}
                  {ord.rejectionReason && (
                    <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
                      <strong>علت رد فاکتور:</strong> {ord.rejectionReason}
                    </div>
                  )}

                  {/* Action buttons if pending */}
                  {ord.status === "pending" && (
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => {
                          setRejectingOrder(ord);
                          setRejectionReason("فیش واریزی نامعتبر است یا وجهی به حساب واریز نگردیده است.");
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>رد سفارش</span>
                      </button>

                      <button
                        onClick={() => {
                          setApprovingOrder(ord);
                          setApprovalLicense(`VIP-${ord.category.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`);
                        }}
                        className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تأیید سفارش و ارسال آنی لایسنس به تلگرام</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. PLANS & PRICING MANAGEMENT */}
      {/* ========================================================= */}
      {activeSubTab === "plans" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">مدیریت تعرفه‌ها و پکیج‌های فروشگاهی</h2>
              <p className="text-xs text-slate-400">
                تعریف پلن‌ها، تنظیم دلخواه قیمت‌ها، و فعال/غیرفعال‌سازی نمایش پکیج‌ها برای مشتریان در ربات
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => setIsBatchPricingOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Calculator className="w-4 h-4 text-cyan-400" />
                <span>تنظیم هوشمند نرخ و تخفیف گروهی</span>
              </button>

              <button
                onClick={() => {
                  setEditingPlan(null);
                  setPlanForm({
                    title: "",
                    category: "self",
                    durationDays: 30,
                    isUnlimited: false,
                    priceToman: 120000,
                    priceUsdt: 1.8,
                    description: "",
                    features: [],
                    badge: "جدید",
                    color: "cyan",
                    isActive: true,
                    orderIndex: plans.length + 1,
                  });
                  setPlanFeaturesText("ساعت زنده روی پروفایل\nمنشی هوش مصنوعی ۲۴ ساعته");
                  setIsPlanModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن پکیج جدید</span>
              </button>
            </div>
          </div>

          {/* Filter Pills for Plans */}
          <div className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-2.5 rounded-2xl">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 ml-1">نمایش تعرفه‌ها:</span>
              {[
                { id: "all", label: "همه پکیج‌ها", count: plans.length },
                { id: "active", label: "فقط فعال در ربات", count: plans.filter((p) => p.isActive).length },
                { id: "inactive", label: "پنهان از مشتریان", count: plans.filter((p) => !p.isActive).length },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPlansFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    plansFilter === f.id
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 hidden sm:block">
              نکته: پکیج‌های غیرفعال از لیست خرید ربات تلگرام کاملاً مخفی می‌شوند.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans
              .filter((p) => (plansFilter === "active" ? p.isActive : plansFilter === "inactive" ? !p.isActive : true))
              .map((p) => {
                const isQuickEditing = quickEditPlanId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`bg-slate-900/80 border rounded-2xl p-5 space-y-4 relative flex flex-col justify-between transition-all ${
                      p.isActive
                        ? "border-slate-800 hover:border-cyan-500/50 shadow-md"
                        : "border-rose-950/40 bg-slate-950/60 opacity-75"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {p.category === "self" ? "💎 اکانت سلف" : p.category === "tabchi" ? "🚀 اکانت تبچی" : "⚡ پکیج ترکیبی"}
                          </span>
                          <h3 className="text-sm font-bold text-white mt-1.5">{p.title}</h3>
                        </div>

                        {/* Direct 1-Click Active / Disabled Toggle */}
                        <button
                          onClick={() => handleTogglePlan(p.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                            p.isActive
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30"
                          }`}
                          title={p.isActive ? "کلیک کنید تا از ربات پنهان شود" : "کلیک کنید تا در ربات فعال شود"}
                        >
                          {p.isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-rose-400" />}
                          <span>{p.isActive ? "فعال در ربات" : "مخفی از ربات"}</span>
                        </button>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">{p.description}</p>

                      {/* Pricing block with Inline Quick Edit */}
                      <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">مدت اعتبار:</span>
                          <span className="font-semibold text-white">
                            {p.isUnlimited ? "♾️ دائمی و نامحدود" : `${p.durationDays} روزه`}
                          </span>
                        </div>

                        {isQuickEditing ? (
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-cyan-500/40 space-y-2 animate-in fade-in">
                            <span className="text-[10px] text-cyan-400 font-bold block">ویرایش سریع قیمت:</span>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">تومان:</label>
                                <input
                                  type="number"
                                  value={quickPriceToman}
                                  onChange={(e) => setQuickPriceToman(Number(e.target.value))}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 font-mono text-emerald-300 text-xs outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-0.5">USDT:</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={quickPriceUsdt}
                                  onChange={(e) => setQuickPriceUsdt(Number(e.target.value))}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 font-mono text-cyan-300 text-xs outline-none"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-1.5 pt-1">
                              <button
                                onClick={() => setQuickEditPlanId(null)}
                                className="px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-white"
                              >
                                انصراف
                              </button>
                              <button
                                onClick={() => handleQuickPriceSave(p.id)}
                                className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 font-bold text-[10px]"
                              >
                                ذخیره قیمت
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">قیمت تومانی:</span>
                              <span className="font-mono font-bold text-emerald-400">
                                {p.priceToman.toLocaleString("fa-IR")} تومان
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">قیمت ارزی (تتر):</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-cyan-400">${p.priceUsdt} USDT</span>
                                <button
                                  onClick={() => {
                                    setQuickEditPlanId(p.id);
                                    setQuickPriceToman(p.priceToman);
                                    setQuickPriceUsdt(p.priceUsdt);
                                  }}
                                  className="text-[10px] text-cyan-400 hover:text-cyan-300 underline"
                                  title="تغییر سریع قیمت"
                                >
                                  (تغییر)
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Features Bullet List */}
                      <div className="space-y-1 pt-2 border-t border-slate-800/60 text-[11px] text-slate-300">
                        {p.features?.slice(0, 3).map((feat, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {p.badge || "استاندارد"}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingPlan(p);
                            setPlanForm(p);
                            setPlanFeaturesText((p.features || []).join("\n"));
                            setIsPlanModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>ویرایش کامل</span>
                        </button>

                        <button
                          onClick={() => handleDeletePlan(p.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="حذف پلن"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. PAYMENT SETTINGS (CARD & CRYPTO) */}
      {/* ========================================================= */}
      {activeSubTab === "payments" && paymentsState && (
        <PaymentMethodsManager
          payments={paymentsState}
          onUpdatePayments={(updated) => setPaymentsState(updated)}
          showToast={showToast}
        />
      )}

      {/* ========================================================= */}
      {/* 5. BOT CONFIGURATION & BUTTON STYLING (SHISHEEI VS KEYBOARD) */}
      {/* ========================================================= */}
      {activeSubTab === "bot_config" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">تنظیمات ربات، توکن تلگرام و استایل دکمه‌ها</h2>
              <p className="text-xs text-slate-400">
                سوییچ میان دکمه‌های شیشه‌ای (Inline) و کیبورد معمولی (Reply)، تم رنگی و عناوین دکمه‌ها
              </p>
            </div>

            <button
              onClick={handleSaveBotSettings}
              disabled={savingSettings}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>ذخیره تنظیمات ربات</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bot Credentials Box */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">اطلاعات اتصال ربات تلگرام</h3>
                  <p className="text-xs text-slate-400">توکن ارسالی توسط BotFather@</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    توکن ربات تلگرام (Bot Token)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value.trim())}
                      placeholder="1234567890:ABCdefGhIJKlmNoPQRstuvwxYZ"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 focus:border-cyan-500 outline-none"
                      dir="ltr"
                    />
                    <button
                      onClick={handleTestToken}
                      disabled={testingToken}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0"
                    >
                      {testingToken ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      <span>تست توکن</span>
                    </button>
                  </div>

                  {tokenTestResult && (
                    <div
                      className={`mt-2 text-xs p-2.5 rounded-xl border flex items-center gap-2 ${
                        tokenTestResult.valid
                          ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                          : "bg-rose-950/40 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {tokenTestResult.valid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>
                            اتصال موفق: ربات <strong>{tokenTestResult.bot?.firstName}</strong> (@{tokenTestResult.bot?.username})
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          <span>خطا: {tokenTestResult.error}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    شناسه تلگرام مالک سرور (Admin Telegram ID)
                  </label>
                  <input
                    type="text"
                    value={ownerTelegramId}
                    onChange={(e) => setOwnerTelegramId(e.target.value)}
                    placeholder="مثال: 123456789 (جهت دریافت اعلان فیش‌های جدید در پیوی مالک)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-300 focus:border-cyan-500 outline-none"
                    dir="ltr"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    برای پیدا کردن عددی آیدی تلگرام خود به ربات userinfobot@ پیام دهید.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      آیدی پشتیبانی تلگرام
                    </label>
                    <input
                      type="text"
                      value={supportUsername}
                      onChange={(e) => setSupportUsername(e.target.value)}
                      placeholder="samkaren12"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      کانال تلگرام فروشگاه
                    </label>
                    <input
                      type="text"
                      value={channelUsername}
                      onChange={(e) => setChannelUsername(e.target.value)}
                      placeholder="@ChannelUsername"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    متن پیام خوش‌آمدگویی استارت ربات (/start)
                  </label>
                  <textarea
                    rows={4}
                    value={welcomeText}
                    onChange={(e) => setWelcomeText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:border-cyan-500 outline-none leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Keyboard Mode & Button Themes (User Special Request!) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">تنظیم استایل دکمه‌ها و کیبورد تلگرام</h3>
                  <p className="text-xs text-slate-400">قابلیت تغییر از دکمه شیشه‌ای به کیبورد باتن و تم‌های رنگی</p>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-200 block">
                  نوع نمایش دکمه‌ها در تلگرام:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: "inline",
                      title: "دکمه‌های شیشه‌ای",
                      desc: "Inline Keyboard زیر پیام",
                      icon: Layers,
                    },
                    {
                      id: "reply",
                      title: "کیبورد باتن عادی",
                      desc: "Reply Keyboard پایین صفحه",
                      icon: Smartphone,
                    },
                    {
                      id: "hybrid",
                      title: "ترکیبی هوشمند",
                      desc: "کیبورد پایین + شیشه‌ای",
                      icon: Zap,
                    },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = keyboardMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setKeyboardMode(m.id as any)}
                        className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                          isSelected
                            ? "bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-md"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`w-4 h-4 ${isSelected ? "text-cyan-400" : "text-slate-500"}`} />
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected ? "border-cyan-400 bg-cyan-400" : "border-slate-600"
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-slate-950"></span>}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-white">{m.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{m.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Button Column Grid Arrangement (User Request: 2-tayi, 3-tayi, 1-tayi) */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 block">
                    چینش دکمه‌ها در هر ردیف (تعداد ستون‌ها):
                  </label>
                  <span className="text-[11px] text-cyan-400 font-mono">
                    {keyboardColumns === 1 ? "تکی (۱ ستونه)" : keyboardColumns === 2 ? "دوتایی (۲ ستونه)" : "سه‌تایی (۳ ستونه)"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 1, title: "تک‌ستونه (۱ تایی)", desc: "هر دکمه یک ردیف کامل" },
                    { id: 2, title: "دوتایی (۲ ستونه)", desc: "چینش متوازن ۲ دکمه در هر ردیف" },
                    { id: 3, title: "سه‌تایی (۳ ستونه)", desc: "فشرده و حرفه‌ای ۳ دکمه در هر ردیف" },
                  ].map((col) => {
                    const isSelected = keyboardColumns === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => {
                          setKeyboardColumns(col.id as any);
                          setReplyKeyboardColumns(col.id as any);
                        }}
                        className={`p-3 rounded-2xl border text-right transition-all ${
                          isSelected
                            ? "bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-md"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{col.title}</span>
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected ? "border-cyan-400 bg-cyan-400" : "border-slate-600"
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-slate-950"></span>}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">{col.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Switchable Keyboard Toggle (User Request #3) */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-cyan-400" />
                        امکان تغییر حالت دکمه‌ها توسط مشتری در تلگرام
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                          allowCustomerKeyboardSwitch
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {allowCustomerKeyboardSwitch ? "مجاز و فعال ✓" : "قفل شده توسط مالک ✕"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      به مشتریان اجازه می‌دهد در چت ربات تلگرام با زدن دکمه تعویض یا دستورات{" "}
                      <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded text-[11px]">/inline</code> و{" "}
                      <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded text-[11px]">/reply</code>، سبک
                      منوی خود را بین دکمه‌های شیشه‌ای و کیبورد باتن معمولی تغییر دهند. انتخاب هر مشتری به طور دائم در تنظیمات ذخیره خواهد شد.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <span className="text-xs font-semibold text-slate-300">
                      {allowCustomerKeyboardSwitch ? "فعال" : "غیرفعال"}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={allowCustomerKeyboardSwitch}
                      onClick={() => setAllowCustomerKeyboardSwitch(!allowCustomerKeyboardSwitch)}
                      className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        allowCustomerKeyboardSwitch ? "bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]" : "bg-slate-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          allowCustomerKeyboardSwitch ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {allowCustomerKeyboardSwitch && (
                  <div className="pt-3 border-t border-slate-800 space-y-2 animate-in fade-in duration-200">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                      <span>عنوان دکمه تغییر به کیبورد باتن (در منوی شیشه‌ای ربات):</span>
                      <span className="text-[10px] text-slate-500 font-mono">switchKeyboard label</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={buttonLabels.switchKeyboard || "🔄 تغییر به کیبورد معمولی (پایین)"}
                        onChange={(e) =>
                          setButtonLabels({ ...buttonLabels, switchKeyboard: e.target.value })
                        }
                        placeholder="مثال: 🔄 تغییر به کیبورد معمولی (پایین)"
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setButtonLabels({
                            ...buttonLabels,
                            switchKeyboard: "🔄 تغییر به کیبورد معمولی (پایین)",
                          })
                        }
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 whitespace-nowrap"
                      >
                        پیش‌فرض
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Button Color Themes */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-200 block">
                  تم رنگی و اموجی‌های دکمه‌ها:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    {
                      id: "cyber_neon",
                      title: "نئون سایبری 💎",
                      colors: "از رنگ‌های سبز، فیروزه‌ای و الماس",
                      gradient: "from-cyan-500 to-emerald-500",
                    },
                    {
                      id: "galaxy_purple",
                      title: "کیهانی و بنفش 🔮",
                      colors: "تم دارک و بنفش کریستالی",
                      gradient: "from-purple-500 to-indigo-500",
                    },
                    {
                      id: "luxury_gold",
                      title: "طلایی و سلطنتی 👑",
                      colors: "تم طلایی لوکس VIP",
                      gradient: "from-amber-400 to-yellow-600",
                    },
                    {
                      id: "crypto_cyan",
                      title: "کریپتو و وب‌۳ 💠",
                      colors: "اموجی‌های شبکه و ارز دیجیتال",
                      gradient: "from-cyan-400 to-blue-600",
                    },
                    {
                      id: "fire_red",
                      title: "آتشین و سرخ 🔴",
                      colors: "دکمه‌های داغ قرمز و شعله‌ای",
                      gradient: "from-rose-500 to-red-600",
                    },
                    {
                      id: "emerald_matrix",
                      title: "زمردی و ماتریکس 🟢",
                      colors: "دکمه‌های سبز نئونی و درخشان",
                      gradient: "from-emerald-400 to-teal-600",
                    },
                    {
                      id: "rainbow_vivid",
                      title: "رنگین‌کمانی شاد 🌈",
                      colors: "ترکیب رنگارنگ و فانتزی برای هر دکمه",
                      gradient: "from-pink-500 via-amber-400 to-cyan-500",
                    },
                    {
                      id: "aiogram_colored",
                      title: "پالت اختصاصی aiogram 🤖",
                      colors: "سبز (Success)، آبی (Primary)، قرمز (Danger)",
                      gradient: "from-emerald-500 via-blue-500 to-rose-500",
                    },
                  ].map((theme) => {
                    const isSelected = buttonTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setButtonTheme(theme.id as any)}
                        className={`p-3 rounded-2xl border text-right transition-all ${
                          isSelected
                            ? "bg-slate-950 border-cyan-500 shadow-md"
                            : "bg-slate-950 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white">{theme.title}</span>
                          <span
                            className={`w-3 h-3 rounded-full bg-gradient-to-r ${theme.gradient}`}
                          ></span>
                        </div>
                        <div className="text-[10px] text-slate-400">{theme.colors}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customizable Button Labels */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-200 block">
                  ویرایش متن روی دکمه‌های اصلی ربات:
                </label>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-0.5">دکمه خرید سلف</label>
                    <input
                      type="text"
                      value={buttonLabels.buySelf || "خرید اکانت سلف زمان‌دار"}
                      onChange={(e) => setButtonLabels({ ...buttonLabels, buySelf: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-0.5">دکمه خرید تبچی</label>
                    <input
                      type="text"
                      value={buttonLabels.buyTabchi || "خرید اکانت تبچی تبلیغاتی"}
                      onChange={(e) => setButtonLabels({ ...buttonLabels, buyTabchi: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-0.5">دکمه پکیج ترکیبی</label>
                    <input
                      type="text"
                      value={buttonLabels.buyCombo || "پکیج VIP (سلف + تبچی)"}
                      onChange={(e) => setButtonLabels({ ...buttonLabels, buyCombo: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. LIVE SIMULATOR & VISUAL PREVIEW */}
      {/* ========================================================= */}
      {activeSubTab === "simulator" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">پیش‌نمایش زنده و شبیه‌ساز چت ربات تلگرام</h2>
              <p className="text-xs text-slate-400">
                مشاهده ظاهر دکمه‌های شیشه‌ای و کیبوردی همان‌گونه که مشتری در نرم‌افزار تلگرام می‌بیند
              </p>
            </div>

            <button
              onClick={() => {
                setSimStep("menu");
                setSimSelectedPlan(null);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>ریستارت به منوی اول (/start)</span>
            </button>
          </div>

          <div className="max-w-xl mx-auto bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
            {/* Phone Notch & Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                  🤖
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {settings?.botFirstName || "فروشگاه سلف و تبچی"}
                  </h4>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    @{settings?.botUsername || "StoreBot"} • bot
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  حالت:{" "}
                  <span className="text-cyan-400 font-bold">
                    {simEffectiveMode === "inline"
                      ? "شیشه‌ای (Inline)"
                      : simEffectiveMode === "reply"
                      ? "کیبورد باتن (Reply)"
                      : "ترکیبی"}
                  </span>
                </span>
                {allowCustomerKeyboardSwitch && (
                  <button
                    onClick={() => {
                      const next = simEffectiveMode === "inline" ? "reply" : "inline";
                      setSimEffectiveMode(next);
                      showToast(
                        "success",
                        `تغییر آزمایشی: حالت به ${next === "inline" ? "دکمه شیشه‌ای" : "کیبورد معمولی"} تغییر یافت.`
                      );
                    }}
                    className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center gap-1 hover:bg-cyan-500/30 transition-all"
                    title="شبیه‌سازی تغییر کیبورد توسط خریدار"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>سوئیچ دستی</span>
                  </button>
                )}
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="space-y-4 min-h-[380px] p-2">
              {/* User Start command */}
              <div className="flex justify-end">
                <div className="bg-cyan-600 text-slate-950 font-mono text-xs px-3.5 py-2 rounded-2xl rounded-tr-none shadow-md">
                  /start
                </div>
              </div>

              {/* Bot Welcome Bubble */}
              <div className="flex justify-start">
                <div className="max-w-[90%] bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 space-y-3 shadow-lg">
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                    {welcomeText ||
                      "👋 درود به فروشگاه بزرگ اکانت‌های سلف هوشمند و تبچی خوش آمدید!\n\nلطفاً یکی از گزینه‌های زیر را انتخاب نمایید:"}
                  </p>

                  {/* If mode is Inline or Hybrid -> render inline buttons inside message */}
                  {(simEffectiveMode === "inline" || simEffectiveMode === "hybrid") && simStep === "menu" && (() => {
                    const themeObj = getThemeDetails(buttonTheme);
                    const gridClass =
                      keyboardColumns === 1
                        ? "grid-cols-1"
                        : keyboardColumns === 3
                        ? "grid-cols-3"
                        : "grid-cols-2";

                    const buttonsList = [
                      {
                        label: buttonLabels.buySelf || "خرید اکانت سلف",
                        icon: themeObj.selfIcon,
                        color: themeObj.selfColor,
                        action: () => {
                          setSimCategory("self");
                          setSimStep("category");
                        },
                      },
                      {
                        label: buttonLabels.buyTabchi || "خرید اکانت تبچی",
                        icon: themeObj.tabchiIcon,
                        color: themeObj.tabchiColor,
                        action: () => {
                          setSimCategory("tabchi");
                          setSimStep("category");
                        },
                      },
                      {
                        label: buttonLabels.buyCombo || "پکیج VIP ترکیبی",
                        icon: themeObj.comboIcon,
                        color: themeObj.comboColor,
                        action: () => {
                          setSimCategory("combo");
                          setSimStep("category");
                        },
                      },
                      {
                        label: buttonLabels.plansCatalog || "تمام تعرفه‌ها",
                        icon: themeObj.catalogIcon,
                        color: themeObj.catalogColor,
                        action: () => {
                          setSimCategory("self");
                          setSimStep("category");
                        },
                      },
                      {
                        label: buttonLabels.myAccount || "حساب کاربری",
                        icon: themeObj.accountIcon,
                        color: themeObj.catalogColor,
                        action: () => setSimStep("menu"),
                      },
                      {
                        label: buttonLabels.myOrders || "پیگیری سفارشات",
                        icon: themeObj.ordersIcon,
                        color: themeObj.selfColor,
                        action: () => setSimStep("menu"),
                      },
                    ];

                    return (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800">
                        <div className={`grid ${gridClass} gap-1.5`}>
                          {buttonsList.map((btn, idx) => (
                            <button
                              key={idx}
                              onClick={btn.action}
                              className={`px-2.5 py-2 rounded-xl font-bold text-[11px] border transition-all text-center truncate ${btn.color}`}
                            >
                              {btn.icon} {btn.label}
                            </button>
                          ))}
                        </div>

                        {/* Customer Switch Button in Inline Menu */}
                        {allowCustomerKeyboardSwitch && (
                          <div className="pt-1">
                            <button
                              onClick={() => {
                                setSimEffectiveMode("reply");
                                showToast(
                                  "success",
                                  "شبیه‌ساز: مشتری دکمه را فشرد و منو به «کیبورد باتن (پایین صفحه)» تغییر یافت!"
                                );
                              }}
                              className="w-full py-2 px-3 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 font-bold text-[11px] border border-cyan-500/40 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{buttonLabels.switchKeyboard || "🔄 تغییر به کیبورد معمولی (پایین)"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Step: Category plans */}
              {simStep === "category" && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="max-w-[90%] bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 space-y-3 shadow-lg">
                    <p className="text-xs font-bold text-white">
                      لیست پکیج‌های موجود در این دسته‌بندی:
                    </p>
                    <div className="space-y-1.5">
                      {plans
                        .filter((p) => p.category === simCategory)
                        .map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setSimSelectedPlan(p);
                              setSimStep("plan_details");
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-right text-xs text-white border border-slate-700 flex items-center justify-between"
                          >
                            <span>{p.title}</span>
                            <span className="text-emerald-400 font-mono text-[11px]">
                              {p.priceToman.toLocaleString("fa-IR")} ت
                            </span>
                          </button>
                        ))}
                      <button
                        onClick={() => setSimStep("menu")}
                        className="w-full text-center text-xs text-slate-400 hover:text-white py-1.5"
                      >
                        🔙 بازگشت به منو
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Plan Details & Checkout */}
              {simStep === "plan_details" && simSelectedPlan && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="max-w-[90%] bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 space-y-3 shadow-lg text-xs">
                    <h5 className="font-bold text-cyan-300 text-sm">{simSelectedPlan.title}</h5>
                    <p className="text-slate-300">{simSelectedPlan.description}</p>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">قیمت تومانی:</span>
                        <span className="text-emerald-400 font-bold font-mono">
                          {simSelectedPlan.priceToman.toLocaleString("fa-IR")} تومان
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">قیمت ارزی:</span>
                        <span className="text-cyan-400 font-bold font-mono">
                          ${simSelectedPlan.priceUsdt} USDT
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <button
                        onClick={() => setSimStep("card_pay")}
                        className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-center shadow-md"
                      >
                        💳 پرداخت با کارت به کارت شتاب
                      </button>
                      <button
                        onClick={() => setSimStep("crypto_pay")}
                        className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-center shadow-md"
                      >
                        🌐 پرداخت ارزی با تتر / کریپتو
                      </button>
                      <button
                        onClick={() => setSimStep("category")}
                        className="w-full text-center text-slate-400 hover:text-white py-1"
                      >
                        🔙 بازگشت
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Card Payment simulation */}
              {simStep === "card_pay" && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="max-w-[90%] bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 space-y-3 text-xs">
                    <h5 className="font-bold text-emerald-300">اطلاعات واریز کارت به کارت:</h5>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 font-mono">
                      <div>بانک: {paymentsState?.cardPayment.bankName || "بانک سامان"}</div>
                      <div className="text-cyan-300 font-bold text-sm">
                        {paymentsState?.cardPayment.cardNumber || "6219861012345678"}
                      </div>
                      <div className="text-slate-300">به نام: {paymentsState?.cardPayment.cardHolder}</div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      📸 تصویر فیش یا کد رهگیری را در این مرحله ارسال نمایید:
                    </p>
                    <button
                      onClick={() => setSimStep("receipt_sent")}
                      className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-center"
                    >
                      📎 شبیه‌سازی ارسال فیش توسط کاربر
                    </button>
                  </div>
                </div>
              )}

              {/* Step: Crypto Payment simulation */}
              {simStep === "crypto_pay" && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="max-w-[90%] bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 space-y-3 text-xs">
                    <h5 className="font-bold text-purple-300">آدرس کیف‌پول ارز دیجیتال:</h5>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px] break-all">
                      <div>شبکه: USDT (TRC20)</div>
                      <div className="text-purple-300">TYDzsxdCz9kgnT9wbKBaHxPxJ7x57ZXXXX</div>
                    </div>
                    <p className="text-[11px] text-slate-400">🔗 هش تراکنش (TXID) را ارسال نمایید:</p>
                    <button
                      onClick={() => setSimStep("receipt_sent")}
                      className="w-full py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-center"
                    >
                      📎 شبیه‌سازی ارسال هش تراکنش (TXID)
                    </button>
                  </div>
                </div>
              )}

              {/* Step: Receipt Submitted Successfully */}
              {simStep === "receipt_sent" && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="max-w-[90%] bg-emerald-950/40 border border-emerald-500/40 rounded-2xl rounded-tl-none p-4 space-y-2 text-xs">
                    <h5 className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>فیش واریزی با موفقیت دریافت شد!</span>
                    </h5>
                    <p className="text-slate-300 text-[11px]">
                      سفارش شما در صف بررسی مدیریت پنل قرار گرفت. به محض تأیید، اکانت شما فعال خواهد شد.
                    </p>
                    <button
                      onClick={() => setSimStep("menu")}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-bold pt-2 block"
                    >
                      🏠 بازگشت به منوی اصلی
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Keyboard Buttons Area (If Reply or Hybrid) */}
            {(simEffectiveMode === "reply" || simEffectiveMode === "hybrid") && (() => {
              const themeObj = getThemeDetails(buttonTheme);
              const gridClass =
                (replyKeyboardColumns || keyboardColumns) === 1
                  ? "grid-cols-1"
                  : (replyKeyboardColumns || keyboardColumns) === 3
                  ? "grid-cols-3"
                  : "grid-cols-2";

              const replyButtonsList = [
                {
                  label: buttonLabels.buySelf || "خرید سلف",
                  icon: themeObj.selfIcon,
                  color: themeObj.selfColor,
                  action: () => {
                    setSimCategory("self");
                    setSimStep("category");
                  },
                },
                {
                  label: buttonLabels.buyTabchi || "خرید تبچی",
                  icon: themeObj.tabchiIcon,
                  color: themeObj.tabchiColor,
                  action: () => {
                    setSimCategory("tabchi");
                    setSimStep("category");
                  },
                },
                {
                  label: buttonLabels.buyCombo || "پکیج VIP",
                  icon: themeObj.comboIcon,
                  color: themeObj.comboColor,
                  action: () => {
                    setSimCategory("combo");
                    setSimStep("category");
                  },
                },
                {
                  label: buttonLabels.plansCatalog || "تعرفه‌ها",
                  icon: themeObj.catalogIcon,
                  color: themeObj.catalogColor,
                  action: () => setSimStep("menu"),
                },
                {
                  label: buttonLabels.myAccount || "حساب من",
                  icon: themeObj.accountIcon,
                  color: themeObj.catalogColor,
                  action: () => setSimStep("menu"),
                },
                {
                  label: buttonLabels.myOrders || "پیگیری",
                  icon: themeObj.ordersIcon,
                  color: themeObj.selfColor,
                  action: () => setSimStep("menu"),
                },
              ];

              return (
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 bg-slate-900/60 p-2.5 rounded-2xl">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>کیبورد ثابت پایین چت تلگرام (Reply Keyboard)</span>
                    <span className="font-mono text-cyan-400">
                      {(replyKeyboardColumns || keyboardColumns) === 1
                        ? "چینش: ۱ ستونه"
                        : (replyKeyboardColumns || keyboardColumns) === 3
                        ? "چینش: ۳ ستونه"
                        : "چینش: ۲ ستونه"}
                    </span>
                  </div>
                  <div className={`grid ${gridClass} gap-1.5`}>
                    {replyButtonsList.map((btn, idx) => (
                      <button
                        key={idx}
                        onClick={btn.action}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all truncate text-center ${btn.color}`}
                      >
                        {btn.icon} {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Switch to inline button for customer in simulator */}
                  {allowCustomerKeyboardSwitch && (
                    <button
                      onClick={() => {
                        setSimEffectiveMode("inline");
                        showToast(
                          "success",
                          "شبیه‌ساز: مشتری دکمه را فشرد و منو به «دکمه‌های شیشه‌ای (Inline)» تغییر یافت!"
                        );
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 text-xs font-bold text-purple-300 border border-purple-500/40 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>🪟 تغییر به دکمه‌های شیشه‌ای (Inline)</span>
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. COUPONS MANAGEMENT */}
      {/* ========================================================= */}
      {activeSubTab === "coupons" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">مدیریت کدهای تخفیف فروشگاه</h2>
              <p className="text-xs text-slate-400">
                ایجاد کوپن‌های تخفیف درصدی جهت افزایش فروش و کمپین‌های تبلیغاتی در ربات تلگرام
              </p>
            </div>

            {/* Create Coupon Form */}
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="کد تخفیف (مثال: OFF20)"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 uppercase outline-none focus:border-cyan-500"
              />
              <input
                type="number"
                value={couponPercent}
                onChange={(e) => setCouponPercent(Number(e.target.value))}
                placeholder="درصد"
                className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-center text-white outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-slate-400">٪</span>
              <button
                onClick={handleAddCoupon}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن کد</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-black text-cyan-400 tracking-wider">
                    {c.code}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {c.discountPercent}٪ تخفیف
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-400 font-mono">
                  <div>تعداد دفعات استفاده: {c.usedCount} از {c.maxUses || "نامحدود"}</div>
                  <div>وضعیت: {c.isActive ? "✅ فعال" : "⛔ غیرفعال"}</div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => handleDeleteCoupon(c.id)}
                    className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. BROADCAST TO BOT USERS */}
      {/* ========================================================= */}
      {activeSubTab === "broadcast" && (
        <div className="max-w-2xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ارسال پیام همگانی به کاربران ربات فروشگاه</h3>
              <p className="text-xs text-slate-400">
                ارسال اعلان، تخفیف‌های مناسبتی یا اطلاع‌رسانی به تمام کاربرانی که ربات را استارت زده‌اند ({customers.length} کاربر)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                متن پیام همگانی (پشتیبانی از Markdown)
              </label>
              <textarea
                rows={5}
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="🔥 تخفیف ویژه آخر هفته روی پکیج‌های سلف و تبچی! با استفاده از کد OFF30 از ۳۰٪ تخفیف بهره‌مند شوید..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  متن دکمه شیشه‌ای (اختیاری)
                </label>
                <input
                  type="text"
                  value={broadcastBtnTitle}
                  onChange={(e) => setBroadcastBtnTitle(e.target.value)}
                  placeholder="مثال: 🛍️ ورود به فروشگاه"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  لینک دکمه (اختیاری)
                </label>
                <input
                  type="text"
                  value={broadcastBtnUrl}
                  onChange={(e) => setBroadcastBtnUrl(e.target.value)}
                  placeholder="https://t.me/YourBot"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 focus:border-cyan-500 outline-none font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              onClick={handleSendBroadcast}
              disabled={sendingBroadcast || customers.length === 0}
              className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              {sendingBroadcast ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>ارسال فوری به تمام {customers.length} کاربر ربات</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: APPROVE ORDER WITH LICENSE / CREDENTIALS */}
      {/* ========================================================= */}
      {approvingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>تأیید سفارش #{approvingOrder.id} و تحویل به مشتری</span>
              </h3>
              <button
                onClick={() => setApprovingOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div>طرح: <strong className="text-cyan-300">{approvingOrder.planTitle}</strong></div>
                <div>خریدار: {approvingOrder.userFirstName} (@{approvingOrder.userUsername || "ندارد"})</div>
                <div>مبلغ: {approvingOrder.finalPriceToman.toLocaleString("fa-IR")} تومان</div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  کد لایسنس اختصاصی (تولید خودکار):
                </label>
                <input
                  type="text"
                  value={approvalLicense}
                  onChange={(e) => setApprovalLicense(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-emerald-400 outline-none focus:border-emerald-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  شماره تلگرام یا شناسه اکانت (اختیاری):
                </label>
                <input
                  type="text"
                  value={approvalAccountPhone}
                  onChange={(e) => setApprovalAccountPhone(e.target.value)}
                  placeholder="+98912..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white outline-none focus:border-cyan-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  رمز عبور پنل مشتری (اختیاری):
                </label>
                <input
                  type="text"
                  value={approvalPassword}
                  onChange={(e) => setApprovalPassword(e.target.value)}
                  placeholder="SK-..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white outline-none focus:border-cyan-500"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setApprovingOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmApproval}
                disabled={processingOrder}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20"
              >
                {processingOrder ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>تأیید و ارسال به تلگرام خریدار</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REJECT ORDER WITH REASON */}
      {/* ========================================================= */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                <span>رد سفارش #{rejectingOrder.id}</span>
              </h3>
              <button onClick={() => setRejectingOrder(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="text-slate-300 font-semibold block">
                علت رد فاکتور (در پیام تلگرام به خریدار ارسال خواهد شد):
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="مثال: فیش واریزی نامعتبر است یا مبلغ واریزی با فاکتور همخوانی ندارد."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setRejectingOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmRejection}
                disabled={processingOrder}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-2"
              >
                {processingOrder ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                <span>رد قطعی سفارش</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT PLAN */}
      {/* ========================================================= */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingPlan ? "ویرایش پکیج فروشگاهی" : "تعریف پکیج جدید برای ربات"}
              </h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">عنوان پلن</label>
                <input
                  type="text"
                  value={planForm.title || ""}
                  onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                  placeholder="مثال: اکانت سلف زمان‌دار ۶ ماهه"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">دسته‌بندی</label>
                  <select
                    value={planForm.category || "self"}
                    onChange={(e) => setPlanForm({ ...planForm, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  >
                    <option value="self">سلف زمان‌دار (Self)</option>
                    <option value="tabchi">تبچی تبلیغاتی (Tabchi)</option>
                    <option value="combo">پکیج ترکیبی (Combo)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">مدت اعتبار</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      disabled={planForm.isUnlimited}
                      value={planForm.durationDays || 30}
                      onChange={(e) => setPlanForm({ ...planForm, durationDays: Number(e.target.value) })}
                      className="w-20 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 disabled:opacity-40"
                    />
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.isUnlimited}
                        onChange={(e) => setPlanForm({ ...planForm, isUnlimited: e.target.checked })}
                        className="rounded bg-slate-800"
                      />
                      <span className="text-[11px] text-slate-300">دائمی ♾️</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">قیمت به تومان</label>
                  <input
                    type="number"
                    value={planForm.priceToman || 0}
                    onChange={(e) => setPlanForm({ ...planForm, priceToman: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-emerald-400 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">قیمت ارزی (USDT)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={planForm.priceUsdt || 0}
                    onChange={(e) => setPlanForm({ ...planForm, priceUsdt: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-cyan-400 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">توضیحات کوتاه</label>
                <input
                  type="text"
                  value={planForm.description || ""}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="توضیح مختصر در خصوص این اشتراک..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  امکانات و ویژگی‌ها (هر ویژگی در یک خط)
                </label>
                <textarea
                  rows={4}
                  value={planFeaturesText}
                  onChange={(e) => setPlanFeaturesText(e.target.value)}
                  placeholder="ساعت زنده با فونت دلخواه&#10;منشی هوش مصنوعی ۲۴ ساعته&#10;ارسال نامحدود به گروه‌ها"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.isActive}
                    onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                    className="rounded bg-slate-800 text-cyan-500"
                  />
                  <span className="text-xs text-slate-300 font-semibold">این پکیج برای خرید فعال باشد</span>
                </label>

                <input
                  type="text"
                  value={planForm.badge || ""}
                  onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                  placeholder="برچسب (VIP / محبوب)"
                  className="w-32 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-amber-300 text-center outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                onClick={handleSavePlan}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
              >
                ذخیره پکیج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BATCH PRICING & EXCHANGE RATE */}
      <BatchPricingModal
        isOpen={isBatchPricingOpen}
        onClose={() => setIsBatchPricingOpen(false)}
        plans={plans}
        onBatchUpdated={(updated) => {
          setData((prev) => (prev ? { ...prev, plans: updated } : prev));
          showToast("success", "تعرفه‌ها با موفقیت بروز شدند.");
        }}
        showToast={showToast}
      />
    </div>
  );
}
