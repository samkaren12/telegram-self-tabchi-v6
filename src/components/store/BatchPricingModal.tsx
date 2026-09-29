import React, { useState } from "react";
import {
  Calculator,
  Sliders,
  DollarSign,
  Coins,
  RefreshCw,
  CheckCircle2,
  Percent,
} from "lucide-react";
import { StorePlan } from "../../types";

interface BatchPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: StorePlan[];
  onBatchUpdated: (updatedPlans: StorePlan[]) => void;
  showToast: (type: "success" | "error", text: string) => void;
}

export function BatchPricingModal({
  isOpen,
  onClose,
  plans,
  onBatchUpdated,
  showToast,
}: BatchPricingModalProps) {
  const [mode, setMode] = useState<"percentage" | "rate">("percentage");
  const [percentageChange, setPercentageChange] = useState<number>(10);
  const [percentageType, setPercentageType] = useState<"increase" | "discount">("discount");
  const [exchangeRate, setExchangeRate] = useState<number>(95000);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleApply = async () => {
    setLoading(true);
    try {
      let multiplier: number | undefined;
      let usdRate: number | undefined;

      if (mode === "percentage") {
        multiplier = percentageType === "increase" ? 1 + percentageChange / 100 : 1 - percentageChange / 100;
      } else {
        usdRate = exchangeRate;
      }

      const res = await fetch("/api/store-bot/plans/batch-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ multiplier, usdRate }),
      });
      const json = await res.json();
      if (json.success) {
        onBatchUpdated(json.plans);
        showToast("success", "تعرفه‌ها با موفقیت بروزرسانی شدند.");
        onClose();
      } else {
        showToast("error", json.message || "خطا در بروزرسانی تعرفه‌ها");
      }
    } catch (_) {
      showToast("error", "خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">تنظیم هوشمند قیمت‌ها و نرخ ارز</h3>
              <p className="text-[11px] text-slate-400">تغییر دسته‌جمعی تعرفه پکیج‌ها یا محاسبه خودکار نرخ دلار</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            onClick={() => setMode("percentage")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === "percentage"
                ? "bg-cyan-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>تغییر درصدی (تخفیف/افزایش)</span>
          </button>
          <button
            onClick={() => setMode("rate")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === "rate"
                ? "bg-cyan-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>نرخ برابری تتر (USDT)</span>
          </button>
        </div>

        {mode === "percentage" ? (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPercentageType("discount")}
                className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                  percentageType === "discount"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                تخفیف همگانی (کاهش قیمت)
              </button>
              <button
                onClick={() => setPercentageType("increase")}
                className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                  percentageType === "increase"
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                افزایش تعرفه‌ها
              </button>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                میزان تغییر بر حسب درصد:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={percentageChange}
                  onChange={(e) => setPercentageChange(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-center outline-none focus:border-cyan-500"
                />
                <span className="text-slate-400 font-bold">٪</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span>پیش‌نمایش تغییر:</span>
              <p className="text-cyan-300 font-mono">
                {percentageType === "discount"
                  ? `تمامی تعرفه‌ها ${percentageChange}٪ ارزان‌تر خواهند شد.`
                  : `تمامی تعرفه‌ها ${percentageChange}٪ گران‌تر خواهند شد.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                نرخ برابری تتر (USDT) به تومان:
              </label>
              <input
                type="number"
                step="500"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value))}
                placeholder="مثال: 95000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-emerald-400 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span>عملکرد:</span>
              <p className="text-slate-300 leading-relaxed">
                قیمت دلاری (USDT) هر پکیج بر اساس تقسیم قیمت تومانی آن بر نرخ <strong>{exchangeRate.toLocaleString("fa-IR")} تومان</strong> مجدداً محاسبه و ثبت خواهد شد.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            انصراف
          </button>
          <button
            onClick={handleApply}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>اعمال روی تمام پکیج‌ها</span>
          </button>
        </div>
      </div>
    </div>
  );
}
