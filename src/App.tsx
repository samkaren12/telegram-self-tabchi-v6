import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Clock,
  Radio,
  Terminal,
  Server,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Infinity as InfinityIcon,
  Code2,
  ExternalLink,
  ShoppingBag,
  Headset,
  Sparkles,
  FolderPlus,
  Activity,
  Lightbulb,
  Heart,
} from "lucide-react";
import { Language, translations } from "./utils/i18n";
import { TelegramAccount, SystemHealth, AuthSession } from "./types";
import { Navbar } from "./components/Navbar";
import { AccountsList } from "./components/AccountsList";
import { SelfModule } from "./components/SelfModule";
import { TabchiModule } from "./components/TabchiModule";
import { LiveLogs } from "./components/LiveLogs";
import { SystemStatus } from "./components/SystemStatus";
import { StoreBotModule } from "./components/StoreBotModule";
import { SupportBotManager } from "./components/SupportBotManager";
import { BatchCreatorModule } from "./components/BatchCreatorModule";
import { DashboardAnalyticsModule } from "./components/DashboardAnalyticsModule";
import { AuditLogDashboard } from "./components/AuditLogDashboard";
import { ConnectAccountModal } from "./components/ConnectAccountModal";
import { StartupLockModal } from "./components/StartupLockModal";
import { ExtendSubscriptionModal } from "./components/ExtendSubscriptionModal";
import { OwnerPasswordModal } from "./components/OwnerPasswordModal";
import { VisualHelpModal, HelpSectionId } from "./components/VisualHelpModal";
import { DonateModal } from "./components/DonateModal";
import { MatrixRain } from "./components/MatrixRain";
import { useSoundNotification } from "./hooks/useSoundNotification";

const getInitialPortal = (): "admin" | "client" => {
  if (typeof window === "undefined") return "client";
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = new URLSearchParams(window.location.search).get("portal");

  if (path.includes("admin") || path.includes("owner") || hash.includes("admin") || search === "admin") {
    return "admin";
  }
  return "client";
};

export default function App() {
  const [lang, setLang] = useState<Language>("fa");
  const [portalMode, setPortalMode] = useState<"admin" | "client">(getInitialPortal);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "accounts" | "store" | "support" | "batchCreator" | "self" | "tabchi" | "audit" | "logs" | "system"
  >(() => (getInitialPortal() === "client" ? "self" : "dashboard"));

  const [storePendingCount, setStorePendingCount] = useState<number>(0);

  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem("hacker_v6_authenticated") === "true";
  });

  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    try {
      const raw = sessionStorage.getItem("hacker_v6_session");
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  });

  const [accounts, setAccounts] = useState<TelegramAccount[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [extendModalAccount, setExtendModalAccount] = useState<TelegramAccount | null>(null);
  const [isOwnerPasswordModalOpen, setIsOwnerPasswordModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [helpInitialSection, setHelpInitialSection] = useState<HelpSectionId>("accounts");
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleOpenHelp = (section?: HelpSectionId) => {
    if (section) {
      setHelpInitialSection(section);
    } else {
      const map: Record<string, HelpSectionId> = {
        accounts: "accounts",
        self: "self",
        tabchi: "tabchi",
        store: "store",
        system: "system",
        batchCreator: "broadcast",
      };
      setHelpInitialSection(map[activeTab] || "accounts");
    }
    setIsHelpModalOpen(true);
  };

  // Sound Notifications Hook
  const { soundEnabled, volume, toggleSound, updateVolume, playSound } = useSoundNotification();
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const prevBroadcastingMapRef = useRef<Map<string, boolean>>(new Map());
  const isInitialFetchRef = useRef<boolean>(true);

  // Sync portal from URL / history changes
  useEffect(() => {
    const handlePortalChange = () => {
      const mode = getInitialPortal();
      setPortalMode(mode);
      if (mode === "client") {
        setActiveTab("self");
      }
    };
    window.addEventListener("popstate", handlePortalChange);
    window.addEventListener("hashchange", handlePortalChange);
    return () => {
      window.removeEventListener("popstate", handlePortalChange);
      window.removeEventListener("hashchange", handlePortalChange);
    };
  }, []);

  const t = translations[lang];

  const handleLogout = () => {
    sessionStorage.removeItem("hacker_v6_authenticated");
    sessionStorage.removeItem("hacker_v6_session");
    setAuthSession(null);
    setIsUnlocked(false);
  };

  // Fetch accounts and system health
  const fetchData = async () => {
    try {
      const [accRes, statusRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/status"),
      ]);

      if (accRes.ok) {
        const accData = await accRes.json();
        const accs: TelegramAccount[] = accData.accounts || [];

        // Check if any tabchi broadcast or pm broadcast finished
        accs.forEach((acc) => {
          const isBroadcastingNow =
            acc.features?.tabchi?.status === "broadcasting" ||
            acc.features?.broadcast?.status === "broadcasting";
          const wasBroadcasting = prevBroadcastingMapRef.current.get(acc.phone) ?? false;

          if (wasBroadcasting && !isBroadcastingNow) {
            // Task has completed!
            playSound("broadcast_completed");
          }
          prevBroadcastingMapRef.current.set(acc.phone, isBroadcastingNow);
        });

        setAccounts(accs);
        if (accs.length > 0 && (!selectedPhone || !accs.find((a) => a.phone === selectedPhone))) {
          setSelectedPhone(accs[0].phone);
        }
      }

      if (statusRes.ok) {
        const healthData = await statusRes.json();
        setSystemHealth(healthData);
      }

      // Check store pending orders for owner and trigger chime on new arrivals
      if (authSession?.role !== "customer") {
        fetch("/api/store-bot/data")
          .then((res) => res.json())
          .then((storeJson) => {
            if (storeJson.success && storeJson.data?.orders) {
              const orders = storeJson.data.orders;
              const pending = orders.filter((o: any) => o.status === "pending").length;
              setStorePendingCount(pending);

              // Sound notification check for newly placed store orders
              let hasNewArrival = false;
              orders.forEach((o: any) => {
                if (!knownOrderIdsRef.current.has(o.id)) {
                  knownOrderIdsRef.current.add(o.id);
                  if (!isInitialFetchRef.current && o.status === "pending") {
                    hasNewArrival = true;
                  }
                }
              });

              if (hasNewArrival) {
                playSound("store_order");
              }

              if (isInitialFetchRef.current) {
                isInitialFetchRef.current = false;
              }
            }
          })
          .catch(() => {});
      }
    } catch (err) {
      console.error("Error polling server:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [authSession?.role]);

  const visibleAccounts =
    authSession?.role === "customer" && authSession.customerPhone
      ? accounts.filter((a) => a.phone === authSession.customerPhone)
      : accounts;

  const selectedAccount =
    visibleAccounts.find((a) => a.phone === selectedPhone) || visibleAccounts[0] || null;

  const handleAccountConnected = (newAccount: TelegramAccount) => {
    setAccounts((prev) => {
      const existing = prev.findIndex((a) => a.phone === newAccount.phone);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = newAccount;
        return copy;
      }
      return [newAccount, ...prev];
    });
    setSelectedPhone(newAccount.phone);
    fetchData();
  };

  const handleUpdateAccount = (updated: TelegramAccount) => {
    setAccounts((prev) =>
      prev.map((a) => (a.phone === updated.phone ? updated : a))
    );
  };

  const isCustomer = authSession?.role === "customer";
  const tabs = isCustomer
    ? [
        { id: "self", label: t.tabs.self, icon: Clock },
        { id: "tabchi", label: t.tabs.tabchi, icon: Radio },
        {
          id: "batchCreator",
          label: lang === "fa" ? "گروه‌ساز و کانال‌ساز انبوه" : "Batch Creator",
          icon: FolderPlus,
        },
        { id: "logs", label: t.tabs.logs, icon: Terminal },
      ]
    : [
        {
          id: "dashboard",
          label: lang === "fa" ? "داشبورد و تحلیل فعالیت 📊" : "Activity Dashboard",
          icon: Activity,
        },
        { id: "accounts", label: t.tabs.accounts, icon: Users, badge: visibleAccounts.length },
        {
          id: "store",
          label: lang === "fa" ? "فروشگاه و ربات اشتراک" : "Store Bot",
          icon: ShoppingBag,
          badge: storePendingCount > 0 ? storePendingCount : undefined,
        },
        {
          id: "support",
          label: lang === "fa" ? "ربات پشتیبانی و تیکتینگ" : "Support Bot",
          icon: Headset,
        },
        {
          id: "batchCreator",
          label: lang === "fa" ? "گروه‌ساز و کانال‌ساز انبوه" : "Batch Creator",
          icon: FolderPlus,
        },
        { id: "self", label: t.tabs.self, icon: Clock },
        { id: "tabchi", label: t.tabs.tabchi, icon: Radio },
        {
          id: "audit",
          label: lang === "fa" ? "بازرسی وقایع (Audit Log) 🛡️" : "Audit Log",
          icon: ShieldCheck,
        },
        { id: "logs", label: t.tabs.logs, icon: Terminal },
        { id: "system", label: t.tabs.system, icon: Server },
      ];

  // Auto-switch away from owner-only tabs if customer
  useEffect(() => {
    if (isCustomer && (activeTab === "dashboard" || activeTab === "accounts" || activeTab === "store" || activeTab === "support" || activeTab === "audit" || activeTab === "system")) {
      setActiveTab("self");
    }
  }, [isCustomer, activeTab]);

  return (
    <div
      className="min-h-screen bg-[#020504] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300 relative overflow-x-hidden cyber-matrix-grid"
      dir={lang === "fa" ? "rtl" : "ltr"}
    >
      {/* High-Contrast Cyber Emerald & Crimson Ambient Background Glow */}
      <div className="fixed top-[-10%] right-[-5%] w-[550px] h-[550px] bg-emerald-500/12 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] left-[-5%] w-[550px] h-[550px] bg-rose-500/12 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="fixed top-[35%] left-[25%] w-[450px] h-[450px] bg-emerald-600/8 rounded-full blur-[160px] pointer-events-none z-0"></div>

      {/* Subtle Canvas-Based Animated Matrix Rain Background Layer */}
      <MatrixRain opacity={0.16} speed={36} fontSize={14} />

      {/* Top Navigation */}
      <Navbar
        lang={lang}
        onToggleLang={() => setLang(lang === "fa" ? "en" : "fa")}
        accounts={visibleAccounts}
        selectedPhone={selectedPhone}
        onSelectAccount={setSelectedPhone}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        systemHealth={systemHealth}
        authSession={authSession}
        onLogout={handleLogout}
        onOpenOwnerPasswordModal={() => setIsOwnerPasswordModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onOpenHelpModal={handleOpenHelp}
        onOpenDonateModal={() => setIsDonateModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        {/* Customer Access Alert if on admin URL */}
        {isUnlocked && isCustomer && portalMode === "admin" && (
          <div className="glass-panel border-rose-500/40 rounded-3xl p-5 text-center space-y-3 shadow-xl shadow-rose-950/20">
            <p className="text-sm font-bold text-rose-300 flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span>⚠️ دسترسی غیرمجاز: این بخش منحصراً متعلق به پنل مدیریت مالک سرور است.</span>
            </p>
            <button
              onClick={() => {
                window.history.pushState({}, "", "/client");
                setPortalMode("client");
                setActiveTab("self");
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-emerald-400 transition-all active:scale-95"
            >
              انتقال به پنل اختصاصی مشتریان
            </button>
          </div>
        )}

        {/* Customer Welcome & Subscription Info Banner */}
        {isCustomer && selectedAccount && (
          <div className="glass-panel rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/10">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  پنل اختصاصی کاربر تلگرام ({selectedAccount.phone})
                </h3>
                <p className="text-xs text-slate-400">
                  مدیریت ساعت زنده روی پروفایل، تبچی و منشی اختصاصی اکانت شما
                </p>
              </div>
            </div>

            <div className="text-xs font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-inner">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>
                {selectedAccount.subscription?.is_unlimited ? (
                  "اعتبار اشتراک: دائمی و نامحدود ♾️"
                ) : selectedAccount.subscription?.expires_at ? (
                  (() => {
                    const diffMs = new Date(selectedAccount.subscription.expires_at).getTime() - Date.now();
                    if (diffMs <= 0) return "⛔ وضعیت اشتراک: منقضی شده (جهت تمدید به مالک پیام دهید)";
                    const days = Math.floor(diffMs / (24 * 3600 * 1000));
                    const hours = Math.floor((diffMs % (24 * 3600 * 1000)) / (3600 * 1000));
                    return `⏳ روزشمار اعتبار: ${days} روز و ${hours} ساعت باقی‌مانده`;
                  })()
                ) : (
                  "اعتبار اشتراک: نامحدود"
                )}
              </span>
            </div>
          </div>
        )}

        {/* Active Account Quick Banner */}
        {selectedAccount && (
          <div className="glass-panel rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="relative group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center text-white font-black text-lg">
                    {selectedAccount.firstName ? selectedAccount.firstName[0].toUpperCase() : "U"}
                  </div>
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                    selectedAccount.isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                  }`}
                ></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-white">
                    {selectedAccount.firstName} {selectedAccount.lastName}
                  </h2>
                  <span className="text-xs text-cyan-400 font-mono">
                    {selectedAccount.username ? `@${selectedAccount.username}` : ""}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono" dir="ltr">
                  {selectedAccount.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border backdrop-blur-md ${
                  selectedAccount.isOnline
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-slate-900/60 text-slate-400 border-slate-800"
                }`}
              >
                {selectedAccount.isOnline ? t.status.online : t.status.offline}
              </span>

              {/* Subscription Status Tag */}
              {selectedAccount.subscription?.is_unlimited ? (
                <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 backdrop-blur-md">
                  <InfinityIcon className="w-3.5 h-3.5" />
                  <span>{lang === "fa" ? "اشتراک نامحدود" : "Unlimited"}</span>
                </span>
              ) : selectedAccount.subscription?.expires_at &&
                new Date(selectedAccount.subscription.expires_at).getTime() <= Date.now() ? (
                isCustomer ? (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{lang === "fa" ? "⛔ اشتراک منقضی شده" : "Expired"}</span>
                  </span>
                ) : (
                  <button
                    onClick={() => setExtendModalAccount(selectedAccount)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-1.5 animate-pulse hover:bg-rose-500/30 transition-colors shadow-md"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{lang === "fa" ? "⛔ اشتراک منقضی! تمدید" : "Expired! Extend"}</span>
                  </button>
                )
              ) : selectedAccount.subscription?.expires_at ? (
                isCustomer ? (
                  <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 backdrop-blur-md">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {(() => {
                        const diffMs = new Date(selectedAccount.subscription.expires_at).getTime() - Date.now();
                        const days = Math.max(0, Math.floor(diffMs / (24 * 3600 * 1000)));
                        const hours = Math.max(0, Math.floor((diffMs % (24 * 3600 * 1000)) / (3600 * 1000)));
                        return `${days} روز و ${hours} ساعت باقی‌مانده`;
                      })()}
                    </span>
                  </span>
                ) : (
                  <button
                    onClick={() => setExtendModalAccount(selectedAccount)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 hover:bg-cyan-500/20 transition-all backdrop-blur-md"
                    title="Click to extend"
                  >
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{lang === "fa" ? "تمدید اشتراک" : "Extend Sub"}</span>
                  </button>
                )
              ) : null}

              {selectedAccount.features?.self_time?.active && (
                <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 backdrop-blur-md">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lang === "fa" ? "ساعت پروفایل" : "Self-Time"}</span>
                </span>
              )}

              {selectedAccount.features?.tabchi?.status === "broadcasting" && (
                <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 animate-pulse backdrop-blur-md">
                  <Radio className="w-3.5 h-3.5 text-purple-400" />
                  <span>{lang === "fa" ? "تبچی درحال ارسال" : "Tabchi Active"}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation Menu (Hacker Green & Black with Glowing Active State & Visual Guide) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-emerald-500/20">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap active:scale-95 ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500/25 via-emerald-500/15 to-rose-500/15 text-emerald-300 border border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-black/60 border border-transparent hover:border-emerald-500/30"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                  <span>{tab.label}</span>
                  {typeof tab.badge === "number" && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive ? "bg-emerald-400 text-slate-950 shadow-sm" : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Visual Help for current section */}
          <button
            type="button"
            onClick={() => handleOpenHelp()}
            className="self-end sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-rose-500/20 hover:from-emerald-500/30 hover:to-rose-500/30 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.45)] active:scale-95 whitespace-nowrap"
            title="آموزش تصویری و راهنمای خیلی راحت این بخش"
          >
            <Lightbulb className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>راهنمای تصویری و خودمونی 💡</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="pt-2 animate-in fade-in duration-300">
          {activeTab === "dashboard" && !isCustomer && (
            <DashboardAnalyticsModule lang={lang} onOpenHelp={() => handleOpenHelp("analytics")} />
          )}

          {activeTab === "accounts" && (
            <AccountsList
              accounts={visibleAccounts}
              selectedPhone={selectedPhone}
              onSelectAccount={setSelectedPhone}
              onOpenConnectModal={() => setIsConnectModalOpen(true)}
              onRefresh={fetchData}
              lang={lang}
              onOpenHelp={() => handleOpenHelp("accounts")}
            />
          )}

          {activeTab === "store" && !isCustomer && (
            <StoreBotModule lang={lang} onOpenHelp={() => handleOpenHelp("store")} />
          )}

          {activeTab === "support" && !isCustomer && (
            <SupportBotManager lang={lang} />
          )}

          {activeTab === "batchCreator" && (
            <BatchCreatorModule
              account={selectedAccount}
              lang={lang}
            />
          )}

          {activeTab === "self" && (
            <SelfModule
              account={selectedAccount}
              lang={lang}
              onUpdateAccount={handleUpdateAccount}
              onOpenHelp={(sec) => handleOpenHelp(sec || "self")}
            />
          )}

          {activeTab === "tabchi" && (
            <TabchiModule
              account={selectedAccount}
              lang={lang}
              onUpdateAccount={handleUpdateAccount}
              onOpenHelp={(sec) => handleOpenHelp(sec || "tabchi")}
            />
          )}

          {activeTab === "audit" && !isCustomer && (
            <AuditLogDashboard
              lang={lang}
              accounts={visibleAccounts}
              onOpenHelp={() => handleOpenHelp("system")}
            />
          )}

          {activeTab === "logs" && (
            <LiveLogs lang={lang} onOpenHelp={() => handleOpenHelp("system")} />
          )}

          {activeTab === "system" && !isCustomer && (
            <SystemStatus
              health={systemHealth}
              lang={lang}
              onOpenOwnerPasswordModal={() => setIsOwnerPasswordModalOpen(true)}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
              onTestSound={() => playSound("test")}
              volume={volume}
              onVolumeChange={updateVolume}
              onOpenHelp={(sec) => handleOpenHelp(sec || "system")}
            />
          )}
        </div>
      </main>

      {/* Footer with Glassmorphism and Official GitHub SVG Logo */}
      <footer className="border-t border-slate-800/80 py-5 text-center text-xs text-slate-400 glass-header mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">Telegram Self & Tabchi Automation Engine • 24/7 Permanent Daemon</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {/* Donate & Support Button in Footer */}
            <button
              type="button"
              onClick={() => setIsDonateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/20 to-rose-600/30 hover:from-rose-500/30 hover:to-rose-600/40 border border-rose-500/40 hover:border-rose-400 text-rose-300 hover:text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/30 animate-pulse" />
              <span>دونیت و حمایت مالی 💖</span>
            </button>

            <span className="text-slate-400">سازنده و توسعه‌دهنده پنل:</span>
            <a
              href="https://github.com/samkaren12"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 hover:text-white font-mono text-xs transition-all shadow-md group"
            >
              {/* Official GitHub SVG Logo */}
              <svg
                className="w-4 h-4 fill-current text-slate-300 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-300"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span className="font-bold">github.com/samkaren12</span>
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </a>
          </div>
        </div>
      </footer>

      {/* Startup Lock Modal for Hacker Edition v6 */}
      {!isUnlocked && (
        <StartupLockModal
          portalMode={portalMode}
          lang={lang}
          onUnlocked={(session) => {
            setAuthSession(session);
            setIsUnlocked(true);
            if (session.role === "customer") {
              setActiveTab("self");
              if (session.customerPhone) {
                setSelectedPhone(session.customerPhone);
              }
            }
          }}
        />
      )}

      {/* Connect Account Modal */}
      <ConnectAccountModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        lang={lang}
        onAccountConnected={handleAccountConnected}
      />

      {/* Extend Subscription Modal */}
      <ExtendSubscriptionModal
        isOpen={Boolean(extendModalAccount)}
        onClose={() => setExtendModalAccount(null)}
        account={extendModalAccount}
        onSuccess={fetchData}
        lang={lang}
      />

      {/* Owner Password & Username Rotation Modal */}
      <OwnerPasswordModal
        isOpen={isOwnerPasswordModalOpen}
        onClose={() => setIsOwnerPasswordModalOpen(false)}
        lang={lang}
        onCredentialsUpdated={(newUsername) => {
          if (authSession) {
            setAuthSession({
              ...authSession,
              username: newUsername,
            });
          }
        }}
      />

      {/* Visual Help & Friendly Tutorial Modal */}
      <VisualHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        lang={lang}
        initialSection={helpInitialSection}
      />

      {/* Donation Modal */}
      <DonateModal
        isOpen={isDonateModalOpen}
        onClose={() => setIsDonateModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
