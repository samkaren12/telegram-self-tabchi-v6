import React from "react";
import {
  Activity,
  Users,
  ShoppingBag,
  Clock,
  Radio,
  Terminal,
  Menu,
  FolderPlus,
} from "lucide-react";
import { TabId } from "./Sidebar";
import { Language } from "../utils/i18n";
import { motion } from "motion/react";

interface MobileBottomDockProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  isCustomer: boolean;
  onOpenMobileMenu: () => void;
  lang: Language;
  storePendingCount?: number;
  accountsCount?: number;
}

export const MobileBottomDock: React.FC<MobileBottomDockProps> = ({
  activeTab,
  onSelectTab,
  isCustomer,
  onOpenMobileMenu,
  lang,
  storePendingCount = 0,
  accountsCount = 0,
}) => {
  const isFa = lang === "fa";

  // Primary tabs for mobile dock
  const dockItems = isCustomer
    ? [
        { id: "self" as TabId, label: isFa ? "ساعت و سلف" : "Self Time", icon: Clock },
        { id: "tabchi" as TabId, label: isFa ? "تبچی" : "Tabchi", icon: Radio },
        { id: "batchCreator" as TabId, label: isFa ? "گروه‌ساز" : "Batch", icon: FolderPlus },
        { id: "logs" as TabId, label: isFa ? "لاگ‌ها" : "Logs", icon: Terminal },
      ]
    : [
        { id: "dashboard" as TabId, label: isFa ? "داشبورد" : "Dashboard", icon: Activity },
        { id: "accounts" as TabId, label: isFa ? "اکانت‌ها" : "Accounts", icon: Users, badge: accountsCount },
        { id: "self" as TabId, label: isFa ? "ساعت سلف" : "Self", icon: Clock },
        { id: "tabchi" as TabId, label: isFa ? "تبچی" : "Tabchi", icon: Radio },
        {
          id: "store" as TabId,
          label: isFa ? "فروشگاه" : "Store",
          icon: ShoppingBag,
          badge: storePendingCount > 0 ? storePendingCount : undefined,
        },
      ];

  return (
    <nav
      aria-label="Mobile Navigation Dock"
      className="md:hidden fixed bottom-3 inset-x-3 sm:inset-x-6 z-40 max-w-lg mx-auto"
    >
      <div className="glass-panel rounded-2xl p-1.5 border border-violet-500/35 shadow-[0_12px_45px_rgba(0,0,0,0.85),0_0_25px_rgba(139,92,246,0.22)] backdrop-blur-2xl bg-gradient-to-r from-[#0b0f24]/95 via-[#080c1d]/95 to-[#0b0f24]/95 flex items-center justify-around gap-1">
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all flex-1 min-w-0 cursor-pointer ${
                isActive
                  ? "text-cyan-300 font-bold bg-gradient-to-b from-violet-600/30 to-cyan-500/15 border border-violet-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-4 h-4 transition-transform ${
                    isActive ? "scale-110 text-cyan-300" : "text-slate-400"
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-0.2 min-w-[14px] text-[9px] font-mono font-bold rounded-full bg-rose-500 text-white flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 truncate max-w-full leading-none">
                {item.label}
              </span>
              {isActive && (
                <motion.span
                  layoutId="dock-active-dot"
                  className="w-1 h-1 rounded-full bg-cyan-400 mt-1 shadow-[0_0_6px_rgba(34,211,238,0.9)]"
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}

        {/* More Menu Drawer Trigger Button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onOpenMobileMenu}
          className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-400 hover:text-white transition-all flex-1 min-w-0 cursor-pointer"
          aria-label="Open full menu"
        >
          <Menu className="w-4 h-4 text-violet-400" />
          <span className="text-[10px] mt-1 truncate max-w-full leading-none">
            {isFa ? "منو کامل" : "More"}
          </span>
        </motion.button>
      </div>
    </nav>
  );
};
