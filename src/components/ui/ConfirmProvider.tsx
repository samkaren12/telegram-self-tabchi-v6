import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  X,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  dir?: "rtl" | "ltr";
}

interface ToastItem {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  toast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx;
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<(ConfirmOptions & { isOpen: boolean }) | null>(null);
  const resolveRef = useRef<((val: boolean) => void) | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    const opts: ConfirmOptions =
      typeof options === "string" ? { message: options } : options;

    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setModalState({
        title: opts.title || "تأیید عملیات",
        message: opts.message,
        confirmText: opts.confirmText || "بله، انجام شود",
        cancelText: opts.cancelText || "انصراف",
        variant: opts.variant || "danger",
        dir: opts.dir || "rtl",
        isOpen: true,
      });
    });
  }, []);

  const handleClose = (result: boolean) => {
    setModalState((prev) => (prev ? { ...prev, isOpen: false } : null));
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
    setTimeout(() => {
      setModalState(null);
    }, 200);
  };

  const toast = useCallback(
    (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  return (
    <ConfirmContext.Provider value={{ confirm, toast }}>
      {children}

      {/* Global Animated Toast Container */}
      <div
        className="fixed top-5 left-1/2 -translate-x-1/2 z-[120] flex flex-col items-center gap-2.5 w-full max-w-md px-4 pointer-events-none"
        dir="rtl"
      >
        <AnimatePresence>
          {toasts.map((item) => {
            const isSuccess = item.type === "success";
            const isError = item.type === "error";
            const isWarn = item.type === "warning";

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -24, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.92 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className={`pointer-events-auto w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-xs font-bold ${
                  isSuccess
                    ? "bg-emerald-950/90 border-emerald-500/45 text-emerald-200 shadow-emerald-500/15"
                    : isError
                    ? "bg-rose-950/90 border-rose-500/45 text-rose-200 shadow-rose-500/15"
                    : isWarn
                    ? "bg-amber-950/90 border-amber-500/45 text-amber-200 shadow-amber-500/15"
                    : "bg-[#0d1328]/95 border-violet-500/45 text-violet-200 shadow-violet-500/15"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : isError ? (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : isWarn ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                  )}
                  <span className="leading-relaxed break-words">{item.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== item.id))}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Global Animated Confirmation Modal */}
      <AnimatePresence>
        {modalState && modalState.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => handleClose(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              dir={modalState.dir || "rtl"}
              className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0e152d] to-[#080c1b] border border-violet-500/30 p-6 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(139,92,246,0.18)] space-y-5 relative overflow-hidden"
            >
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  modalState.variant === "danger"
                    ? "bg-gradient-to-r from-rose-500 via-orange-500 to-rose-500"
                    : modalState.variant === "warning"
                    ? "bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400"
                    : "bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400"
                }`}
              />

              <div className="flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg ${
                    modalState.variant === "danger"
                      ? "bg-rose-500/15 border-rose-500/35 text-rose-400 shadow-rose-500/10"
                      : modalState.variant === "warning"
                      ? "bg-amber-500/15 border-amber-500/35 text-amber-400 shadow-amber-500/10"
                      : "bg-violet-500/15 border-violet-500/35 text-violet-400 shadow-violet-500/10"
                  }`}
                >
                  {modalState.variant === "danger" ? (
                    <ShieldAlert className="w-6 h-6" />
                  ) : modalState.variant === "warning" ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <Info className="w-6 h-6" />
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <h3 className="text-base font-extrabold text-white">
                    {modalState.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {modalState.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  {modalState.cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => handleClose(true)}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-lg ${
                    modalState.variant === "danger"
                      ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/25"
                      : modalState.variant === "warning"
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-amber-500/25"
                      : "saas-btn-primary"
                  }`}
                >
                  {modalState.confirmText}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};
