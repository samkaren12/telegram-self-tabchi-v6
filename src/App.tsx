import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Language, translations } from "./utils/i18n";
import { TelegramAccount, SystemHealth } from "./types";
import { Navbar } from "./components/Navbar";
import { AccountsList } from "./components/AccountsList";
import { SelfModule } from "./components/SelfModule";
import { TabchiModule } from "./components/TabchiModule";
import { LiveLogs } from "./components/LiveLogs";
import { SystemStatus } from "./components/SystemStatus";
import { ConnectAccountModal } from "./components/ConnectAccountModal";
import { StartupLockModal } from "./components/StartupLockModal";
import { ExtendSubscriptionModal } from "./components/ExtendSubscriptionModal";

export default function App() {
  const [lang, setLang] = useState<Language>("fa");
  const [activeTab, setActiveTab] = useState<
    "accounts" | "self" | "tabchi" | "logs" | "system"
  >("accounts");

  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem("hacker_v6_authenticated") === "true";
  });

  const [accounts, setAccounts] = useState<TelegramAccount[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [extendModalAccount, setExtendModalAccount] = useState<TelegramAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const t = translations[lang];

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
        setAccounts(accs);
        if (accs.length > 0 && (!selectedPhone || !accs.find((a) => a.phone === selectedPhone))) {
          setSelectedPhone(accs[0].phone);
        }
      }

      if (statusRes.ok) {
        const healthData = await statusRes.json();
        setSystemHealth(healthData);
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
  }, []);

  const selectedAccount =
    accounts.find((a) => a.phone === selectedPhone) || accounts[0] || null;

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

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-300"
      dir={lang === "fa" ? "rtl" : "ltr"}
    >
      {/* Top Navigation */}
      <Navbar
        lang={lang}
        onToggleLang={() => setLang(lang === "fa" ? "en" : "fa")}
        accounts={accounts}
        selectedPhone={selectedPhone}
        onSelectAccount={setSelectedPhone}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        systemHealth={systemHealth}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Active Account Quick Banner */}
        {selectedAccount && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white font-bold text-base shadow-md">
                  {selectedAccount.firstName ? selectedAccount.firstName[0].toUpperCase() : "U"}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                    selectedAccount.isOnline ? "bg-emerald-400" : "bg-slate-500"
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

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  selectedAccount.isOnline
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {selectedAccount.isOnline ? t.status.online : t.status.offline}
              </span>

              {/* Subscription Status Tag */}
              {selectedAccount.subscription?.is_unlimited ? (
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <InfinityIcon className="w-3.5 h-3.5" />
                  <span>{lang === "fa" ? "اشتراک نامحدود" : "Unlimited"}</span>
                </span>
              ) : selectedAccount.subscription?.expires_at &&
                new Date(selectedAccount.subscription.expires_at).getTime() <= Date.now() ? (
                <button
                  onClick={() => setExtendModalAccount(selectedAccount)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-1 animate-pulse hover:bg-rose-500/30 transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{lang === "fa" ? "⛔ اشتراک منقضی! تمدید" : "Expired! Extend"}</span>
                </button>
              ) : selectedAccount.subscription?.expires_at ? (
                <button
                  onClick={() => setExtendModalAccount(selectedAccount)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 hover:bg-cyan-500/20 transition-colors"
                  title="Click to extend"
                >
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{lang === "fa" ? "تمدید اشتراک" : "Extend Sub"}</span>
                </button>
              ) : null}

              {selectedAccount.features?.self_time?.active && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lang === "fa" ? "ساعت پروفایل" : "Self-Time"}</span>
                </span>
              )}

              {selectedAccount.features?.tabchi?.status === "broadcasting" && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1 animate-pulse">
                  <Radio className="w-3.5 h-3.5" />
                  <span>{lang === "fa" ? "تبچی درحال ارسال" : "Tabchi Active"}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 border-b border-slate-800 scrollbar-none">
          {[
            { id: "accounts", label: t.tabs.accounts, icon: Users, badge: accounts.length },
            { id: "self", label: t.tabs.self, icon: Clock },
            { id: "tabchi", label: t.tabs.tabchi, icon: Radio },
            { id: "logs", label: t.tabs.logs, icon: Terminal },
            { id: "system", label: t.tabs.system, icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-slate-800 text-cyan-400 border border-slate-700 shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
                {typeof tab.badge === "number" && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="pt-2">
          {activeTab === "accounts" && (
            <AccountsList
              accounts={accounts}
              selectedPhone={selectedPhone}
              onSelectAccount={setSelectedPhone}
              onOpenConnectModal={() => setIsConnectModalOpen(true)}
              onRefresh={fetchData}
              lang={lang}
            />
          )}

          {activeTab === "self" && (
            <SelfModule
              account={selectedAccount}
              lang={lang}
              onUpdateAccount={handleUpdateAccount}
            />
          )}

          {activeTab === "tabchi" && (
            <TabchiModule
              account={selectedAccount}
              lang={lang}
              onUpdateAccount={handleUpdateAccount}
            />
          )}

          {activeTab === "logs" && <LiveLogs lang={lang} />}

          {activeTab === "system" && (
            <SystemStatus health={systemHealth} lang={lang} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-5 text-center text-xs text-slate-400 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>Telegram Self & Tabchi Automation Engine • 24/7 Permanent Daemon</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500">سازنده پنل:</span>
            <a
              href="https://github.com/samkaren12"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 hover:text-cyan-300 font-mono text-xs transition-all shadow-sm group"
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>github.com/samkaren12</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </div>
        </div>
      </footer>

      {/* Startup Lock Modal for Hacker Edition v6 */}
      {!isUnlocked && (
        <StartupLockModal
          lang={lang}
          onUnlocked={() => setIsUnlocked(true)}
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
    </div>
  );
}
