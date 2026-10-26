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
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Language, translations } from "./utils/i18n";
import { TelegramAccount, SystemHealth, AuthSession } from "./types";
import { Navbar } from "./components/Navbar";
import { Sidebar, TabId } from "./components/Sidebar";
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
import { MobileBottomDock } from "./components/MobileBottomDock";
import { ActiveAccountBanner } from "./components/ActiveAccountBanner";
import { useSoundNotification } from "./hooks/useSoundNotification";
import { ConfirmProvider } from "./components/ui/ConfirmProvider";
import { motion, AnimatePresence } from "motion/react";

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
  const [activeTab, setActiveTab] = useState<TabId>(() => (getInitialPortal() === "client" ? "self" : "dashboard"));

  const [storePendingCount, setStorePendingCount] = useState<number>(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

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
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    sessionStorage.removeItem("hacker_v6_authenticated");
    sessionStorage.removeItem("hacker_v6_session");
    setAuthSession(null);
    setIsUnlocked(false);
  };

  // Fetch accounts and system health
  const fetchData = async () => {
    try {
      const headers = authSession?.token ? { "x-session-token": authSession.token } : undefined;
      const [accRes, statusRes] = await Promise.all([
        fetch("/api/accounts", { headers }),
        fetch("/api/status", { headers }),
      ]);

      const isJsonResponse = (res: Response) =>
        res.ok && (res.headers.get("content-type") || "").includes("application/json");

      if (isJsonResponse(accRes)) {
        const accData = await accRes.json();
        if (accData && Array.isArray(accData.accounts)) {
          const accs: TelegramAccount[] = accData.accounts;

          // Check if any tabchi broadcast or pm broadcast finished
          accs.forEach((acc) => {
            const isBroadcastingNow =
              acc.features?.tabchi?.status === "broadcasting" ||
              acc.features?.broadcast?.status === "broadcasting";
            const wasBroadcasting = prevBroadcastingMapRef.current.get(acc.phone) ?? false;

            if (wasBroadcasting && !isBroadcastingNow) {
              playSound("broadcast_completed");
            }
            prevBroadcastingMapRef.current.set(acc.phone, isBroadcastingNow);
          });

          setAccounts(accs);
          if (accs.length > 0 && (!selectedPhone || !accs.find((a) => a.phone === selectedPhone))) {
            setSelectedPhone(accs[0].phone);
          }
        }
      }

      if (isJsonResponse(statusRes)) {
        const healthData = await statusRes.json();
        if (healthData && typeof healthData.status === "string") {
          setSystemHealth(healthData);
        }
      }

      // Check store pending orders for owner
      if (authSession?.role !== "customer") {
        fetch("/api/store-bot/data")
          .then((res) => (isJsonResponse(res) ? res.json() : null))
          .then((storeJson) => {
            if (storeJson && storeJson.success && storeJson.data?.orders) {
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
    } catch {
      // Transient polling error (e.g., server restarting); silently retry on next interval
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
        { id: "self" as TabId, label: t.tabs.self, icon: Clock },
        { id: "tabchi" as TabId, label: t.tabs.tabchi, icon: Radio },
        {
          id: "batchCreator" as TabId,
          label: lang === "fa" ? "گروه‌ساز و کانال‌ساز انبوه" : "Batch Creator",
          icon: FolderPlus,
        },
        { id: "logs" as TabId, label: t.tabs.logs, icon: Terminal },
      ]
    : [
        {
          id: "dashboard" as TabId,
          label: lang === "fa" ? "داشبورد و تحلیل فعالیت" : "Activity Dashboard",
          icon: Activity,
        },
        { id: "accounts" as TabId, label: t.tabs.accounts, icon: Users, badge: visibleAccounts.length },
        {
          id: "store" as TabId,
          label: lang === "fa" ? "فروشگاه و ربات اشتراک" : "Store Bot",
          icon: ShoppingBag,
          badge: storePendingCount > 0 ? storePendingCount : undefined,
        },
        {
          id: "support" as TabId,
          label: lang === "fa" ? "ربات پشتیبانی و تیکتینگ" : "Support Bot",
          icon: Headset,
        },
        {
          id: "batchCreator" as TabId,
          label: lang === "fa" ? "گروه‌ساز و کانال‌ساز انبوه" : "Batch Creator",
          icon: FolderPlus,
        },
        { id: "self" as TabId, label: t.tabs.self, icon: Clock },
        { id: "tabchi" as TabId, label: t.tabs.tabchi, icon: Radio },
        {
          id: "audit" as TabId,
          label: lang === "fa" ? "بازرسی وقایع (Audit Log)" : "Audit Log",
          icon: ShieldCheck,
        },
        { id: "logs" as TabId, label: t.tabs.logs, icon: Terminal },
        { id: "system" as TabId, label: t.tabs.system, icon: Server },
      ];

  // Auto-switch away from owner-only tabs if customer
  useEffect(() => {
    if (isCustomer && (activeTab === "dashboard" || activeTab === "accounts" || activeTab === "store" || activeTab === "support" || activeTab === "audit" || activeTab === "system")) {
      setActiveTab("self");
    }
  }, [isCustomer, activeTab]);

  const activeTabMeta = tabs.find((t) => t.id === activeTab);
  const currentSectionTitle = activeTabMeta?.label;

  return (
    <ConfirmProvider>
    <div
      className="min-h-screen bg-[#050712] text-slate-100 flex flex-row font-sans selection:bg-violet-500/30 selection:text-violet-200 relative overflow-x-hidden cyber-matrix-grid"
      dir={lang === "fa" ? "rtl" : "ltr"}
    >
      {/* Ambient Animated Gradient Glows (Violet, Cyan, Indigo) */}
      <div className="fixed top-[-10%] right-[-5%] w-[580px] h-[580px] bg-violet-600/12 rounded-full blur-[160px] pointer-events-none z-0 animate-pulse-glow"></div>
      <div className="fixed bottom-[-10%] left-[-5%] w-[580px] h-[580px] bg-cyan-500/12 rounded-full blur-[160px] pointer-events-none z-0 animate-pulse-glow"></div>
      <div className="fixed top-[40%] left-[20%] w-[480px] h-[480px] bg-indigo-600/10 rounded-full blur-[180px] pointer-events-none z-0"></div>

      {/* Subtle Matrix Rain Texture Layer */}
      <MatrixRain opacity={0.06} speed={28} fontSize={14} />

      {/* Modern Desktop & Mobile Sidebar */}
      <Sidebar
        lang={lang}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCustomer={isCustomer}
        visibleAccountsCount={visibleAccounts.length}
        storePendingCount={storePendingCount}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        systemHealth={systemHealth}
        authSession={authSession}
        onOpenHelp={handleOpenHelp}
        onOpenDonate={() => setIsDonateModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10">
        {/* Top Header Navbar */}
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
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          currentSectionTitle={currentSectionTitle}
        />

        {/* Viewport Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-8 space-y-5">
          {/* Customer Access Alert if on admin URL */}
          {isUnlocked && isCustomer && portalMode === "admin" && (
            <div className="glass-panel border-rose-500/30 rounded-2xl p-4 text-center space-y-2.5 shadow-xl shadow-rose-950/20">
              <p className="text-xs sm:text-sm font-semibold text-rose-300 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>دسترسی به این بخش نیازمند مجوز مالک سرور است.</span>
              </p>
              <button
                onClick={() => {
                  window.history.pushState({}, "", "/client");
                  setPortalMode("client");
                  setActiveTab("self");
                }}
                className="px-4 py-2 rounded-xl saas-btn-primary text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                انتقال به پنل اختصاصی مشتریان
              </button>
            </div>
          )}

          {/* Active Account Cyber Banner */}
          {selectedAccount && (
            <ActiveAccountBanner
              account={selectedAccount}
              lang={lang}
              isCustomer={isCustomer}
              onSelectTab={(tab) => setActiveTab(tab)}
              onExtendSubscription={(acc) => setExtendModalAccount(acc)}
            />
          )}

          {/* Quick Tab Bar on Tablet / Mobile */}
          <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-violet-500/15">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {typeof tab.badge === "number" && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-200">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Tab View with Smooth Framer Motion Transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
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
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Clean Modern SaaS Footer */}
        <footer className="border-t border-violet-500/15 py-4 text-center text-xs text-slate-400 glass-header mt-auto relative z-10">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-400">Telegram Self & Tabchi Automation Engine • 24/7 Daemon</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-center">
              {/* Donate Button */}
              <button
                type="button"
                onClick={() => setIsDonateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/25 hover:border-rose-400 text-rose-300 hover:text-white font-medium text-xs transition-all cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>دونیت و حمایت مالی</span>
              </button>

              <span className="text-slate-400">توسعه‌دهنده:</span>
              <a
                href="https://github.com/samkaren12"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-violet-500/50 text-slate-200 hover:text-white font-mono text-xs transition-all group"
              >
                <svg
                  className="w-4 h-4 fill-current text-slate-400 group-hover:text-violet-400 transition-colors"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                <span className="font-semibold">github.com/samkaren12</span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-violet-400" />
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Startup Lock Modal */}
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

      {/* Owner Password Rotation Modal */}
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

      {/* Floating Cybernetic Mobile Navigation Dock */}
      <MobileBottomDock
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        isCustomer={isCustomer}
        onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        lang={lang}
        storePendingCount={storePendingCount}
        accountsCount={visibleAccounts.length}
      />
    </div>
    </ConfirmProvider>
  );
}
