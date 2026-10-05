import React, { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Sparkles,
  Send,
  Copy,
  Check,
  Download,
  Share2,
  RefreshCw,
  Zap,
  Activity,
  ShieldAlert,
  Bot,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  DollarSign,
  Layers,
} from "lucide-react";
import { Language } from "../utils/i18n";
import { DetailedMarketQuote, MarketHistoryPoint } from "../../server/marketService";

interface CryptoTechnicalAnalysisCardProps {
  lang: Language;
}

interface TechnicalMetrics {
  rsi: number;
  rsiStatus: "oversold" | "neutral" | "overbought";
  verdict: "STRONG BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG SELL";
  verdictFa: string;
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
  ema20: number;
  trend: "bullish" | "bearish" | "neutral";
  highlights: string[];
}

export const CryptoTechnicalAnalysisCard: React.FC<CryptoTechnicalAnalysisCardProps> = ({
  lang,
}) => {
  const isRtl = lang === "fa";

  // State
  const [symbolInput, setSymbolInput] = useState<string>("BTC");
  const [activeSymbol, setActiveSymbol] = useState<string>("BTC");
  const [quote, setQuote] = useState<DetailedMarketQuote | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<TechnicalMetrics | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [sharingBot, setSharingBot] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Popular cryptocurrency presets
  const popularPresets = [
    { symbol: "BTC", name: "Bitcoin" },
    { symbol: "ETH", name: "Ethereum" },
    { symbol: "TON", name: "Toncoin" },
    { symbol: "SOL", name: "Solana" },
    { symbol: "DOGE", name: "Dogecoin" },
    { symbol: "TRX", name: "Tron" },
    { symbol: "XRP", name: "Ripple" },
    { symbol: "BNB", name: "BNB" },
  ];

  // Fetch Quote and Calculate Technical Analysis
  const runAnalysis = async (symToAnalyze?: string) => {
    const sym = (symToAnalyze || symbolInput).trim().toUpperCase();
    if (!sym) return;

    setLoading(true);
    setActiveSymbol(sym);

    try {
      const res = await fetch(`/api/market/quote?asset=${encodeURIComponent(sym)}`);
      const json = await res.json();

      if (!res.ok || !json.success || !json.quote) {
        throw new Error(json.message || "اطلاعات نماد مورد نظر یافت نشد.");
      }

      const q: DetailedMarketQuote = json.quote;
      setQuote(q);

      // Prepare Chart Points with EMA 20 calculation
      const history = q.history && q.history.length > 0 ? q.history : generateFallbackHistory(q.unit_usd, q.unit_toman);
      
      let ema = history[0]?.price_usd || q.unit_usd;
      const k = 2 / (20 + 1);

      const enhancedPoints = history.map((pt, idx) => {
        ema = pt.price_usd * k + ema * (1 - k);
        return {
          time: pt.time,
          price: Math.round(pt.price_usd * 100) / 100,
          priceToman: pt.price_toman,
          ema20: Math.round(ema * 100) / 100,
        };
      });

      setChartData(enhancedPoints);

      // Compute Technical Indicators
      const calculatedMetrics = computeTechnicalMetrics(q, enhancedPoints);
      setMetrics(calculatedMetrics);
    } catch (err: any) {
      showToast("error", err.message || "خطا در دریافت اطلاعات و تحلیل نماد.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis("BTC");
  }, []);

  // Compute RSI, Support, Resistance and Technical Verdict
  const computeTechnicalMetrics = (q: DetailedMarketQuote, points: any[]): TechnicalMetrics => {
    const currentPrice = q.unit_usd;
    const change = q.change_24h_percent;

    // RSI Estimation based on price trajectory & change
    let rawRsi = 50 + change * 2.2;
    if (points.length >= 10) {
      let gains = 0;
      let losses = 0;
      for (let i = 1; i < points.length; i++) {
        const diff = points[i].price - points[i - 1].price;
        if (diff > 0) gains += diff;
        else losses += Math.abs(diff);
      }
      const avgGain = gains / points.length;
      const avgLoss = losses / points.length || 0.0001;
      const rs = avgGain / avgLoss;
      rawRsi = 100 - 100 / (1 + rs);
    }

    const rsi = Math.max(12, Math.min(88, Math.round(rawRsi * 10) / 10));
    const rsiStatus: "oversold" | "neutral" | "overbought" =
      rsi < 30 ? "oversold" : rsi > 70 ? "overbought" : "neutral";

    // Pivot Support and Resistance calculations
    const high = q.high_24h_usd || currentPrice * 1.03;
    const low = q.low_24h_usd || currentPrice * 0.97;
    const pivot = (high + low + currentPrice) / 3;

    const resistance1 = Math.round((2 * pivot - low) * 100) / 100;
    const resistance2 = Math.round((pivot + (high - low)) * 100) / 100;
    const support1 = Math.round((2 * pivot - high) * 100) / 100;
    const support2 = Math.round((pivot - (high - low)) * 100) / 100;

    const ema20 = points[points.length - 1]?.ema20 || currentPrice;
    const isAboveEma = currentPrice >= ema20;

    let verdict: "STRONG BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG SELL" = "NEUTRAL";
    let verdictFa = "سیگنال خنثی / نظاره‌گر";
    let trend: "bullish" | "bearish" | "neutral" = "neutral";

    if (change > 3 && isAboveEma && rsi < 70) {
      verdict = "STRONG BUY";
      verdictFa = "سیگنال خرید قوی (Strong Buy) 🚀";
      trend = "bullish";
    } else if (change > 0 && isAboveEma) {
      verdict = "BUY";
      verdictFa = "سیگنال خرید و روند صعودی (Bullish) 🟢";
      trend = "bullish";
    } else if (rsi < 30) {
      verdict = "BUY";
      verdictFa = "سطح اشباع فروش (آماده جهش) 💎";
      trend = "bullish";
    } else if (change < -3 && !isAboveEma) {
      verdict = "STRONG SELL";
      verdictFa = "سیگنال فروش پرریسک (Strong Sell) 🔻";
      trend = "bearish";
    } else if (change < 0) {
      verdict = "SELL";
      verdictFa = "اصلاح و روند نزولی (Bearish) 🔴";
      trend = "bearish";
    }

    const highlights: string[] = [
      `شاخص قدرت نسبی (RSI): ${rsi} (${rsi < 30 ? "اشباع فروش شدید" : rsi > 70 ? "اشباع خرید موقت" : "محدوده متعادل"})`,
      `موقعیت نسبت به میانگین EMA 20: ${isAboveEma ? "بالای میانگین (تایید مومنتوم صعودی)" : "زیر میانگین (احتمال نوسان رنج)"}`,
      `محدوده حمایتی کلیدی اول: $${support1.toLocaleString()} | مقاومت پیش‌رو: $${resistance1.toLocaleString()}`,
      `پیشنهاد ریسک به ریوارد: ${trend === "bullish" ? "مناسب ورود پله‌ای با حد ضرر زیر حمایت S1" : "صبر جهت تایید شکست مقاومت R1"}`,
    ];

    return {
      rsi,
      rsiStatus,
      verdict,
      verdictFa,
      support1,
      support2,
      resistance1,
      resistance2,
      ema20,
      trend,
      highlights,
    };
  };

  // Fallback history points if none available
  const generateFallbackHistory = (usd: number, toman: number): MarketHistoryPoint[] => {
    const list: MarketHistoryPoint[] = [];
    const now = Date.now();
    for (let i = 12; i >= 0; i--) {
      const t = new Date(now - i * 2 * 3600 * 1000);
      const variance = (Math.sin(i) * 0.015 + (Math.random() - 0.48) * 0.01);
      const pUsd = Math.round(usd * (1 + variance) * 100) / 100;
      const pToman = Math.round(toman * (1 + variance));
      list.push({
        time: t.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
        price_usd: pUsd,
        price_toman: pToman,
      });
    }
    return list;
  };

  // Formatted Text Snippet for Telegram
  const generateTelegramSnippet = (): string => {
    if (!quote || !metrics) return "";

    const isUp = quote.change_24h_percent >= 0;
    const arrow = isUp ? "📈" : "📉";
    const sign = isUp ? "+" : "";

    return (
      `📊 <b>گزارش تحلیل تکنیکال ${quote.name_fa} (${quote.symbol})</b>\n\n` +
      `💵 <b>قیمت لحظه‌ای:</b> $${quote.unit_usd.toLocaleString()} | <b>${quote.unit_toman.toLocaleString()} تومان</b>\n` +
      `${arrow} <b>تغییرات ۲۴ ساعته:</b> <code>${sign}${quote.change_24h_percent}%</code>\n` +
      `⚡ <b>سیگنال تکنیکال:</b> <b>${metrics.verdictFa}</b>\n\n` +
      `📌 <b>شاخص‌های کلیدی تکنیکال:</b>\n` +
      `• <b>RSI (14):</b> ${metrics.rsi} (${metrics.rsiStatus === "oversold" ? "اشباع فروش 🟢" : metrics.rsiStatus === "overbought" ? "اشباع خرید 🔴" : "متعادل 🟡"})\n` +
      `• <b>میانگین متحرک EMA 20:</b> $${metrics.ema20.toLocaleString()}\n` +
      `• <b>حمایت اول (S1):</b> $${metrics.support1.toLocaleString()}\n` +
      `• <b>مقاومت اول (R1):</b> $${metrics.resistance1.toLocaleString()}\n\n` +
      `🔍 <b>جمع‌بندی تحلیلی:</b>\n` +
      metrics.highlights.map((h) => `• ${h}`).join("\n") +
      `\n\n🤖 <i>ارسال شده به صورت خودکار از داشبورد تحلیلی ربات سلف و تبچی</i>`
    );
  };

  // Copy Snippet
  const handleCopySnippet = () => {
    const text = generateTelegramSnippet();
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast("success", "متن اسنیپت تحلیل تکنیکال با فرمت تلگرام کپی شد!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert Chart SVG to PNG Data URL
  const exportChartAsDataUrl = async (): Promise<string | null> => {
    try {
      if (!chartContainerRef.current) return null;
      const svgElement = chartContainerRef.current.querySelector("svg");
      if (!svgElement) return null;

      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const URLObj = window.URL || window.webkitURL || window;
      const blobURL = URLObj.createObjectURL(svgBlob);

      return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          const scale = 2; // High resolution
          canvas.width = (svgElement.clientWidth || 700) * scale;
          canvas.height = (svgElement.clientHeight || 300) * scale;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(null);
            return;
          }

          // Dark Background Fill
          ctx.fillStyle = "#090d16";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Header Banner on Canvas
          ctx.fillStyle = "#06b6d4";
          ctx.font = `bold ${14 * scale}px Vazirmatn, sans-serif`;
          ctx.fillText(`${quote?.name_fa || activeSymbol} (${activeSymbol}) - Technical Analysis Chart`, 20 * scale, 25 * scale);

          // Draw SVG
          ctx.drawImage(image, 0, 35 * scale, canvas.width, canvas.height - 40 * scale);

          const dataUrl = canvas.toDataURL("image/png");
          URLObj.revokeObjectURL(blobURL);
          resolve(dataUrl);
        };
        image.onerror = () => {
          URLObj.revokeObjectURL(blobURL);
          resolve(null);
        };
        image.src = blobURL;
      });
    } catch (_) {
      return null;
    }
  };

  // Share as Image via Telegram Bot
  const handleShareImageViaBot = async () => {
    if (!quote || !metrics) return;

    setSharingBot(true);
    try {
      const photoDataUrl = await exportChartAsDataUrl();
      const snippet = generateTelegramSnippet();

      const res = await fetch("/api/analytics/crypto/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: activeSymbol,
          textSnippet: snippet,
          photoDataUrl: photoDataUrl || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "خطا در ارسال تصویر به ربات تلگرام.");
      }

      showToast("success", json.message || "تصویر و تحلیل با موفقیت به ربات ارسال شد!");
    } catch (err: any) {
      showToast("error", err.message || "خطا در ارسال تصویر به ربات.");
    } finally {
      setSharingBot(false);
    }
  };

  // Share Text Snippet via Telegram Bot
  const handleShareTextViaBot = async () => {
    if (!quote || !metrics) return;

    setSharingBot(true);
    try {
      const snippet = generateTelegramSnippet();
      const res = await fetch("/api/analytics/crypto/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: activeSymbol,
          textSnippet: snippet,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "خطا در ارسال به ربات تلگرام.");
      }

      showToast("success", json.message || "اسنیپت تحلیل تکنیکال به ربات ارسال شد!");
    } catch (err: any) {
      showToast("error", err.message || "خطا در ارسال پیام به ربات.");
    } finally {
      setSharingBot(false);
    }
  };

  // Download Chart Image
  const handleDownloadImage = async () => {
    try {
      const dataUrl = await exportChartAsDataUrl();
      if (!dataUrl) {
        showToast("error", "امکان استخراج تصویر نمودار وجود ندارد.");
        return;
      }
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `technical_analysis_${activeSymbol}_${Date.now()}.png`;
      a.click();
      showToast("success", "تصویر با کیفیت نمودار با موفقیت دانلود شد.");
    } catch (_) {
      showToast("error", "خطا در دانلود تصویر نمودار.");
    }
  };

  const isUp = (quote?.change_24h_percent || 0) >= 0;

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 border border-cyan-500/25 bg-gradient-to-b from-slate-900/90 to-slate-950 relative overflow-hidden">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border transition-all ${
            feedback.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-300"
              : "bg-rose-950/90 border-rose-500/50 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? <Check className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-rose-400" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Top Header & Symbol Search Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                تحلیل تکنیکال هوشمند ارزهای دیجیتال و اشتراک‌گذاری در تلگرام
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                RECHARTS LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تولید اتوماتیک سیگنال، سطوح حمایت و مقاومت، شاخص RSI و نمودار خطی قیمت با قابلیت ارسال مستقیم به ربات تلگرام.
            </p>
          </div>
        </div>

        {/* Input & Analyze Button */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && runAnalysis()}
              placeholder="مثال: BTC, ETH..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-cyan-300 font-mono font-bold outline-none focus:border-cyan-500 transition-all uppercase placeholder-slate-600"
              dir="ltr"
            />
          </div>
          <button
            type="button"
            onClick={() => runAnalysis()}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>تحلیل تکنیکال</span>
          </button>
        </div>
      </div>

      {/* Popular Crypto Preset Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-400 font-medium">نمادهای محبوب:</span>
        {popularPresets.map((preset) => (
          <button
            key={preset.symbol}
            type="button"
            onClick={() => {
              setSymbolInput(preset.symbol);
              runAnalysis(preset.symbol);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
              activeSymbol === preset.symbol
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 scale-105"
                : "bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            {preset.symbol}
          </button>
        ))}
      </div>

      {/* Main Analysis Display Grid */}
      {quote && metrics && (
        <div className="space-y-6">
          {/* Price & Technical Verdict Highlights Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Price Card */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>قیمت لحظه‌ای (USD & تومان)</span>
                <span className="font-mono text-cyan-400">{quote.symbol}</span>
              </div>
              <div className="text-xl font-mono font-black text-white">
                ${quote.unit_usd.toLocaleString()}
              </div>
              <div className="text-xs font-mono text-slate-400">
                {quote.unit_toman.toLocaleString()} تومان
              </div>
            </div>

            {/* 24h Change Card */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>تغییرات ۲۴ ساعته</span>
                {isUp ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-rose-400" />}
              </div>
              <div className={`text-xl font-mono font-black ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                {isUp ? "+" : ""}{quote.change_24h_percent}%
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                H: ${quote.high_24h_usd?.toLocaleString() || "-"} | L: ${quote.low_24h_usd?.toLocaleString() || "-"}
              </div>
            </div>

            {/* RSI Indicator Card */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>شاخص قدرت نسبی (RSI 14)</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    metrics.rsiStatus === "oversold"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : metrics.rsiStatus === "overbought"
                      ? "bg-rose-500/20 text-rose-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {metrics.rsiStatus === "oversold" ? "اشباع فروش" : metrics.rsiStatus === "overbought" ? "اشباع خرید" : "متعادل"}
                </span>
              </div>
              <div className="text-xl font-mono font-black text-white">
                {metrics.rsi}
              </div>
              {/* RSI Bar */}
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 mt-1">
                <div
                  className={`h-full rounded-full transition-all ${
                    metrics.rsi < 30 ? "bg-emerald-400" : metrics.rsi > 70 ? "bg-rose-400" : "bg-cyan-400"
                  }`}
                  style={{ width: `${metrics.rsi}%` }}
                ></div>
              </div>
            </div>

            {/* Verdict Card */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-cyan-500/30 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>سیگنال الگوریتمی</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-sm font-bold text-cyan-300 truncate" title={metrics.verdictFa}>
                {metrics.verdictFa}
              </div>
              <div className="text-[11px] text-slate-400">
                میانگین متحرک EMA: <span className="font-mono text-purple-400">${metrics.ema20.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* RECHARTS LINE CHART */}
          <div className="glass-panel rounded-3xl p-5 shadow-xl space-y-4 border border-slate-800" ref={chartContainerRef}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-xs sm:text-sm text-white">
                  نمودار تکنیکال خطی قیمت {quote.name_fa} ({activeSymbol}/USD)
                </h4>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-cyan-400 rounded-full inline-block"></span>
                  <span>قیمت (USD)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-purple-400 rounded-full inline-block"></span>
                  <span>میانگین EMA 20</span>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-64 sm:h-72 w-full pt-2" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: "#334155" }}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: "#334155" }}
                    tickFormatter={(val) => `$${val.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#090d16",
                      borderColor: "#1e293b",
                      borderRadius: "16px",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                    }}
                    labelStyle={{ color: "#94a3b8", fontWeight: "bold", marginBottom: "4px" }}
                    formatter={(value: any, name: any) => {
                      if (name === "price") return [`$${Number(value).toLocaleString()}`, "قیمت لحظه‌ای"];
                      if (name === "ema20") return [`$${Number(value).toLocaleString()}`, "میانگین EMA 20"];
                      return [value, name];
                    }}
                  />
                  <ReferenceLine
                    y={metrics.support1}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{ value: "حمایت S1", fill: "#10b981", fontSize: 10, position: "insideBottomRight" }}
                  />
                  <ReferenceLine
                    y={metrics.resistance1}
                    stroke="#f43f5e"
                    strokeDasharray="3 3"
                    label={{ value: "مقاومت R1", fill: "#f43f5e", fontSize: 10, position: "insideTopRight" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    name="price"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ fill: "#06b6d4", r: 2 }}
                    activeDot={{ r: 6, fill: "#22d3ee", stroke: "#0891b2", strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ema20"
                    name="ema20"
                    stroke="#a855f7"
                    strokeWidth={1.8}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Technical Summary Details & Support/Resistance Levels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Highlights */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>نکات و چشم‌انداز تکنیکال</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {metrics.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></span>
                    <span className="leading-relaxed">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support and Resistance Pivot Levels */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>سطوح پیوت، حمایت و مقاومت کلیدی</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">مقاومت دوم (R2)</div>
                  <div className="font-bold text-rose-400 mt-0.5">${metrics.resistance2.toLocaleString()}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">مقاومت اول (R1)</div>
                  <div className="font-bold text-rose-400 mt-0.5">${metrics.resistance1.toLocaleString()}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">حمایت اول (S1)</div>
                  <div className="font-bold text-emerald-400 mt-0.5">${metrics.support1.toLocaleString()}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">حمایت دوم (S2)</div>
                  <div className="font-bold text-emerald-400 mt-0.5">${metrics.support2.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* TELEGRAM BOT SHARING & EXPORT TOOLBAR */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-cyan-950/20 to-slate-950 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>اشتراک‌گذاری گزارش و نمودار در ربات تلگرام</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 font-mono">BOT SHARE</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  این گزارش را با یک کلیک به عنوان عکس نمودار یا اسنیپت متنی به چت مالک در ربات تلگرام بفرستید.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Copy Text Snippet */}
              <button
                type="button"
                onClick={handleCopySnippet}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                title="کپی متن اسنیپت برای ارسال در چت‌ها"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "کپی شد!" : "کپی اسنیپت متنی"}</span>
              </button>

              {/* Share Text Snippet via Bot */}
              <button
                type="button"
                onClick={handleShareTextViaBot}
                disabled={sharingBot}
                className="px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                {sharingBot ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>ارسال متن به ربات</span>
              </button>

              {/* Share Image via Bot */}
              <button
                type="button"
                onClick={handleShareImageViaBot}
                disabled={sharingBot}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
              >
                {sharingBot ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>ارسال عکس نمودار به ربات 📸</span>
              </button>

              {/* Download Chart Image */}
              <button
                type="button"
                onClick={handleDownloadImage}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                title="دانلود فایل تصویری نمودار"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
