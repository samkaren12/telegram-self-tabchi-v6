import React from "react";
import {
  Activity,
  Users,
  ShoppingBag,
  Headset,
  FolderPlus,
  Clock,
  Radio,
  ShieldCheck,
  Terminal,
  Server,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Heart,
  X,
  Zap,
  Sparkles,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { SystemHealth, AuthSession } from "../types";
import { motion } from "motion/react";

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
  onSelectTab: (tab: TabId) => void;
  isCustomer: boolean;
  visibleAccountsCount: number;
  storePendingCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  systemHealth: SystemHealth | null;
  authSession: AuthSession | null;
  onOpenHelp: () => void;
  onOpenDonate: () => void;
}

interface NavGroup {
  groupTitle: string;
  items: {
    id: TabId;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
    customerAllowed?: boolean;
  }[];
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
  onOpenHelp,
  onOpenDonate,
}) => {
  const t = translations[lang];
  const isRtl = lang === "fa";

  const groups: NavGroup[] = [
    {
      groupTitle: lang === "fa" ? "مرکز فرماندهی و تحلیل" : "Command & Analytics",
      items: [
        {
          id: "dashboard",
          label: lang === "fa" ? "داشبورد و تحلیل فعالیت" : "Activity Dashboard",
          icon: Activity,
          customerAllowed: false,
        },
        {
          id: "accounts",
          label: t.tabs.accounts,
          icon: Users,
          badge: visibleAccountsCount,
          customerAllowed: false,
        },
      ],
    },
    {
      groupTitle: lang === "fa" ? "اتوماسیون و ربات‌ها" : "Automation & Bots",
      items: [
        {
          id: "self",
          label: t.tabs.self,
          icon: Clock,
          badge: "200+",
          badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          customerAllowed: true,
        },
        {
          id: "tabchi",
          label: t.tabs.tabchi,
          icon: Radio,
          customerAllowed: true,
        },
        {
          id: "batchCreator",
          label: lang === "fa" ? "گروه‌ساز و کانال‌ساز انبوه" : "Batch Creator",
          icon: FolderPlus,
          customerAllowed: true,
        },
      ],
    },
    {
      groupTitle: lang === "fa" ? "فروشگاه و مشتریان" : "Commerce & Support",
      items: [
        {
          id: "store",
          label: lang === "fa" ? "فروشگاه و ربات اشتراک" : "Store Bot",
          icon: ShoppingBag,
          badge: storePendingCount > 0 ? storePendingCount : undefined,
          badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse",
          customerAllowed: false,
        },
        {
          id: "support",
          label: lang === "fa" ? "ربات پشتیبانی و تیکتینگ" : "Support Bot",
          icon: Headset,
          customerAllowed: false,
        },
      ],
    },
    {
      groupTitle: lang === "fa" ? "امنیت و مانیتورینگ" : "Security & Logs",
      items: [
        {
          id: "audit",
          label: lang === "fa" ? "بازرسی وقایع (Audit Log)" : "Audit Log",
          icon: ShieldCheck,
          customerAllowed: false,
        },
        {
          id: "logs",
          label: t.tabs.logs,
          icon: Terminal,
          customerAllowed: true,
        },
        {
          id: "system",
          label: t.tabs.system,
          icon: Server,
          customerAllowed: false,
        },
      ],
    },
  ];

  const filteredGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => (isCustomer ? item.customerAllowed : true)),
    }))
    .filter((group) => group.items.length > 0);

  const renderSidebarContent = (mobile = false) => {
    const collapsed = mobile ? false : isCollapsed;

    return (
      <div className="flex flex-col h-full justify-between select-none">
        {/* Top Brand Header */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-violet-500/15">
            <div className="flex items-center gap-3 overflow-hidden">
              <motion.div
                whileHover={{ scale: 1.06, rotate: -3 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-[1.5px] shrink-0 shadow-lg shadow-violet-600/30"
              >
                <div className="w-full h-full bg-[#070a18] rounded-[10px] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                </div>
              </motion.div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm tracking-tight text-white truncate">
                      CYBER SELF
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-extrabold rounded-md bg-gradient-to-r from-violet-500/25 to-cyan-500/25 text-cyan-300 border border-cyan-500/35 shadow-sm">
                      v6.5
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-violet-400" />
                    <span>{lang === "fa" ? "اتوماسیون نسل شش" : "Automation Suite"}</span>
                  </p>
                </div>
              )}
            </div>

            {mobile ? (
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onToggleCollapse}
                title={collapsed ? "باز کردن منو" : "جمع کردن منو"}
                className="w-7 h-7 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-violet-500/40 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
              >
                {isRtl ? (
                  collapsed ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )
                ) : collapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Navigation Groups */}
          <div className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-190px)] scrollbar-none">
            {filteredGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {!collapsed && (
                  <div className="px-2.5 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <span>{group.groupTitle}</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-violet-500/15 to-transparent" />
                  </div>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ x: collapsed ? 0 : isRtl ? -3 : 3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onSelectTab(item.id);
                        if (mobile) onCloseMobile();
                      }}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center ${
                        collapsed ? "justify-center px-2" : "justify-between px-3"
                      } py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer group relative overflow-hidden ${
                        isActive
                          ? "bg-gradient-to-l from-violet-600/25 via-indigo-600/15 to-cyan-500/10 text-white border border-violet-500/40 shadow-lg shadow-violet-950/50"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/70 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg transition-all ${
                            isActive
                              ? "bg-gradient-to-br from-violet-500/30 to-cyan-500/20 text-cyan-300 shadow-sm"
                              : "text-slate-400 group-hover:text-violet-300"
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                        </div>
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!collapsed && item.badge !== undefined && (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border ${
                            item.badgeColor
                              ? item.badgeColor
                              : isActive
                              ? "bg-violet-500/30 text-violet-200 border-violet-400/40"
                              : "bg-slate-800/90 text-slate-300 border-slate-700"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {isActive && (
                        <span
                          className={`absolute ${
                            isRtl ? "right-0" : "left-0"
                          } top-2 bottom-2 w-1 rounded-full bg-gradient-to-b from-cyan-400 to-violet-500 shadow-[0_0_10px_rgba(34,211,238,0.8)]`}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions & Daemon Status */}
        <div className="p-3 border-t border-violet-500/15 space-y-2 bg-[#060916]/60">
          {!collapsed && systemHealth && (
            <div className="px-3 py-2.5 rounded-xl bg-slate-900/80 border border-violet-500/15 flex items-center justify-between text-[11px] animate-shimmer">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span>{lang === "fa" ? "هسته ۲۴/۷ آنلاین" : "Daemon Online"}</span>
              </span>
              <span className="font-mono text-cyan-400 font-bold">
                {systemHealth.connectedAccountsCount}/{visibleAccountsCount}
              </span>
            </div>
          )}

          <div className={`flex ${collapsed ? "flex-col" : "flex-row"} gap-1.5`}>
            <button
              onClick={onOpenHelp}
              title={lang === "fa" ? "راهنمای تصویری" : "Visual Guide"}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/25 text-cyan-300 text-xs font-medium transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{lang === "fa" ? "راهنما" : "Help"}</span>}
            </button>

            <button
              onClick={onOpenDonate}
              title={lang === "fa" ? "حمایت مالی" : "Donate"}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/25 text-rose-300 text-xs font-medium transition-all cursor-pointer"
            >
              <Heart className="w-4 h-4 shrink-0 text-rose-400" />
              {!collapsed && <span>{lang === "fa" ? "حمایت" : "Donate"}</span>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 glass-header border-l border-violet-500/20 transition-all duration-300 z-30 sticky top-0 h-screen ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside className="relative w-72 max-w-[85vw] glass-header border-l border-violet-500/30 h-full z-10 flex flex-col">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
