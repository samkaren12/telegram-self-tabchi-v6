import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Language } from "../utils/i18n";

interface AccountStatusBadgeProps {
  isOnline: boolean;
  phone: string;
  lang: Language;
}

export const AccountStatusBadge: React.FC<AccountStatusBadgeProps> = ({
  isOnline,
  phone,
  lang,
}) => {
  const prevOnlineRef = useRef<boolean | undefined>(undefined);
  const [hasTransitionedToOnline, setHasTransitionedToOnline] = useState(false);

  useEffect(() => {
    // Check if the account just transitioned from offline (false) to online (true)
    if (prevOnlineRef.current !== undefined) {
      if (!prevOnlineRef.current && isOnline) {
        setHasTransitionedToOnline(true);
        const timer = setTimeout(() => {
          setHasTransitionedToOnline(false);
        }, 2400);
        return () => clearTimeout(timer);
      }
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline]);

  if (isOnline) {
    return (
      <motion.div
        key={`${phone}-online`}
        initial={false}
        animate={
          hasTransitionedToOnline
            ? {
                scale: [1, 1.22, 0.95, 1.12, 1],
                boxShadow: [
                  "0 0 0px rgba(16, 185, 129, 0)",
                  "0 0 25px rgba(16, 185, 129, 0.9)",
                  "0 0 10px rgba(16, 185, 129, 0.4)",
                  "0 0 4px rgba(16, 185, 129, 0.2)",
                ],
                borderColor: [
                  "rgba(16, 185, 129, 0.3)",
                  "rgba(52, 211, 153, 1)",
                  "rgba(16, 185, 129, 0.6)",
                  "rgba(16, 185, 129, 0.35)",
                ],
              }
            : {
                scale: 1,
                boxShadow: "0 0 8px rgba(16, 185, 129, 0.25)",
                borderColor: "rgba(16, 185, 129, 0.35)",
              }
        }
        transition={{
          duration: 1.4,
          ease: "easeInOut",
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/60 border text-emerald-300 shadow-sm relative overflow-hidden select-none"
        title={lang === "fa" ? "حساب آنلاین و متصل به MTProto" : "Worker Online & Connected"}
      >
        {/* Subtle holographic beam when transitioning */}
        <AnimatePresence>
          {hasTransitionedToOnline && (
            <motion.div
              initial={{ x: "-100%", opacity: 0.8 }}
              animate={{ x: "200%", opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Pulse Dot */}
        <span className="relative flex h-2 w-2">
          <motion.span
            animate={
              hasTransitionedToOnline
                ? {
                    scale: [1, 2.4, 1],
                    opacity: [0.9, 0.2, 0.9],
                  }
                : {
                    scale: [1, 1.8, 1],
                    opacity: [0.75, 0.15, 0.75],
                  }
            }
            transition={{
              duration: hasTransitionedToOnline ? 0.7 : 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
          />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        </span>

        <span className="font-mono text-emerald-300">
          {lang === "fa" ? "آنلاین" : "Online"}
        </span>

        {/* Transition badge label */}
        <AnimatePresence>
          {hasTransitionedToOnline && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6, x: -4 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.3 }}
              className="px-1.5 py-0.2 rounded-sm text-[9px] font-black bg-emerald-400 text-black tracking-wider shadow-[0_0_8px_#34d399]"
            >
              LIVE
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Offline State
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-900/80 border border-slate-700/60 text-slate-400 shadow-inner select-none"
      title={lang === "fa" ? "حساب قطع یا غیرفعال" : "Account Offline"}
    >
      <span className="w-2 h-2 rounded-full bg-slate-500" />
      <span className="font-mono text-slate-400">
        {lang === "fa" ? "آفلاین" : "Offline"}
      </span>
    </div>
  );
};
