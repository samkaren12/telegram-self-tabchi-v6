import React from "react";
import {
  Users,
  Clock,
  Radio,
  Terminal,
  Server,
  ShieldCheck,
  ShoppingBag,
  Headset,
  FolderPlus,
  Activity,
  Lightbulb,
  Heart,
  ChevronLeft,
  ChevronRight,
  Send,
  Zap,
  ExternalLink,
  Crown,
  Bot,
  Copy,
  Check,
  X,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { SystemHealth, AuthSession } from "../types";

export type TabId =
  | "dashboard"
  | "accounts"
  | "store"
  | "support"
  | "batchCreator"
  | "self"
  | "tabchi"
  | "audit"
  | "logs"
  | "system";

interface SidebarProps {
  lang: Language;
  activeTab: TabId;
  onSelectTab: (tabId: TabId) => void;
  isCustomer: boolean;
  visibleAccountsCount: number;
  storePendingCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  systemHealth: SystemHealth | null;
  authSession?: AuthSession | null;
  onOpenHelp?: (section?: any) => void;
  onOpenDonate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  lang,
  activeTab,
  onSelectTab,
  isCustomer,
  visibleAccountsCount,
  storePendingCount,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  systemHealth,
  authSession,
  onOpenHelp,
  onOpenDonate,
}) => {
  const t = translations[lang];
  const [copiedCli, setCopiedCli] = React.useState(false);

  interface SidebarNavItem {
    id: TabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  interface SidebarNavGroup {
    group: string;
    items: SidebarNavItem[];
  }

  // Group items by purpose
  const customerTabs: SidebarNavGroup[] = [
    {
      group: lang === "fa" ? "امکانات کاربری" : "Core Features",
      items: [
        { id: "self" as TabId, label: t.tabs.self, icon: Clock },
        { id: "tabchi" as TabId, label: t.tabs.tabchi, icon: Radio },
        {
          id: "batchCreator" as TabId,
          label: lang === "fa" ? "گروه‌ساز انبوه" : "Batch Creator",
          icon: FolderPlus,
        },
      ],
    },
    {
      group: lang === "fa" ? "سیستم و لاگ" : "System & Logs",
      items: [{ id: "logs" as TabId, label: t.tabs.logs, icon: Terminal }],
    },
  ];

  const ownerTabs: SidebarNavGroup[] = [
    {
      group: lang === "fa" ? "مرکز مدیریت" : "Overview & Management",
      items: [
        {
          id: "dashboard" as TabId,
          label: lang === "fa" ? "داشبورد و تحلیل" : "Activity Dashboard",
          icon: Activity,
        },
        {
          id: "accounts" as TabId,
          label: t.tabs.accounts,
          icon: Users,
          badge: visibleAccountsCount,
        },
        {
          id: "store" as TabId,
          label: lang === "fa" ? "فروشگاه و اشتراک" : "Store Bot",
          icon: ShoppingBag,
          badge: storePendingCount > 0 ? storePendingCount : undefined,
        },
        {
          id: "support" as TabId,
          label: lang === "fa" ? "پشتیبانی و تیکت" : "Support Bot",
          icon: Headset,
        },
      ],
    },
    {
      group: lang === "fa" ? "اتوماسیون تلگرام" : "Telegram Automation",
      items: [
        {
          id: "batchCreator" as TabId,
          label: lang === "fa" ? "گروه‌ساز و کانال‌ساز" : "Batch Creator",
          icon: FolderPlus,
        },
        { id: "self" as TabId, label: t.tabs.self, icon: Clock },
        { id: "tabchi" as TabId, label: t.tabs.tabchi, icon: Radio },
      ],
    },
    {
      group: lang === "fa" ? "امنیت و سرور" : "Security & System",
      items: [
        {
          id: "audit" as TabId,
          label: lang === "fa" ? "بازرسی وقایع (Audit)" : "Audit Log",
          icon: ShieldCheck,
        },
        { id: "logs" as TabId, label: t.tabs.logs, icon: Terminal },
        { id: "system" as TabId, label: t.tabs.system, icon: Server },
      ],
    },
  ];

  const tabGroups: SidebarNavGroup[] = isCustomer ? customerTabs : ownerTabs;

  const copyCliCommand = () => {
    navigator.clipboard.writeText("sudo selfandtabchi");
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full select-none" dir={lang === "fa" ? "rtl" : "ltr"}>
      {/* Top Brand Bar */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-violet-500/15 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-[2px] shadow-[0_0_15px_rgba(139,92,246,0.35)] shrink-0 group">
            <div className="w-full h-full bg-[#0a0e20] rounded-[10px] overflow-hidden flex items-center justify-center">
              <Send className="w-4 h-4 text-violet-400 transform -rotate-12 group-hover:scale-110 transition-transform" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#0a0e20]" />
          </div>

          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-white tracking-tight truncate">
                  Self & Tabchi
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                  v6.2
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Automation Daemon</p>
            </div>
          )}
        </div>

        {/* Desktop Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-violet-950/30 border border-transparent hover:border-violet-500/30 transition-all cursor-pointer"
          title={isCollapsed ? (lang === "fa" ? "باز کردن سایدبار" : "Expand sidebar") : (lang === "fa" ? "جمع کردن سایدبار" : "Collapse sidebar")}
        >
          {lang === "fa" ? (
            isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links Scroll Container */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-none">
        {tabGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                {group.group}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative group ${
                      isActive
                        ? "bg-gradient-to-r from-violet-600/25 via-violet-500/20 to-indigo-600/15 text-white border border-violet-500/50 shadow-[0_4px_16px_rgba(139,92,246,0.2)]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-violet-950/20 border border-transparent hover:border-violet-500/20"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? "text-violet-400" : "text-slate-400 group-hover:text-violet-300"
                      }`}
                    />

                    {!isCollapsed && (
                      <span className="truncate flex-1 text-start">{item.label}</span>
                    )}

                    {!isCollapsed && typeof item.badge === "number" && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isActive
                            ? "bg-violet-500 text-white shadow-sm"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Active Pip Indicator */}
                    {isActive && (
                      <span
                        className={`absolute top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-violet-400 shadow-[0_0_8px_#8b5cf6] ${
                          lang === "fa" ? "left-1.5" : "right-1.5"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Sticky Utility Controls */}
      <div className="p-3 border-t border-violet-500/15 bg-[#060815]/95 shrink-0 space-y-2">
        {/* CLI Quick Copy Pill */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={copyCliCommand}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-900/60 border border-violet-500/20 hover:border-violet-500/40 text-[11px] font-mono text-violet-300 transition-all cursor-pointer group"
            title="کپی دستور ترمینال"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Terminal className="w-3.5 h-3.5 text-violet-400" />
              <span className="truncate">sudo selfandtabchi</span>
            </div>
            {copiedCli ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-300 shrink-0" />
            )}
          </button>
        )}

        {/* Quick Visual Help & Donate Buttons */}
        <div className={`grid ${isCollapsed ? "grid-cols-1" : "grid-cols-2"} gap-1.5`}>
          {onOpenHelp && (
            <button
              type="button"
              onClick={() => onOpenHelp()}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-violet-950/30 hover:bg-violet-900/40 border border-violet-500/20 text-violet-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
              title={lang === "fa" ? "آموزش تصویری" : "Visual Guide"}
            >
              <Lightbulb className="w-3.5 h-3.5 text-violet-400" />
              {!isCollapsed && <span className="truncate">{lang === "fa" ? "راهنما" : "Guide"}</span>}
            </button>
          )}

          {onOpenDonate && (
            <button
              type="button"
              onClick={onOpenDonate}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-rose-950/25 hover:bg-rose-900/35 border border-rose-500/20 text-rose-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
              title={lang === "fa" ? "حمایت مالی" : "Donate"}
            >
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              {!isCollapsed && <span className="truncate">{lang === "fa" ? "دونیت" : "Donate"}</span>}
            </button>
          )}
        </div>

        {/* Active Session Info Card */}
        {!isCollapsed && authSession && (
          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 min-w-0">
              {authSession.role === "owner" ? (
                <Crown className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              )}
              <span className="font-mono truncate">
                {authSession.username || authSession.customerPhone}
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block glass-sidebar h-screen sticky top-0 shrink-0 transition-all duration-300 z-30 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Out Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 md:hidden animate-in fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Slide-Out Drawer */}
      <div
        className={`fixed top-0 bottom-0 z-50 w-72 glass-sidebar md:hidden transition-transform duration-300 ease-in-out ${
          lang === "fa"
            ? isMobileOpen
              ? "right-0"
              : "translate-x-full right-0"
            : isMobileOpen
            ? "left-0"
            : "-translate-x-full left-0"
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
