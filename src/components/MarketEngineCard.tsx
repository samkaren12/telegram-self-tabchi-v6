import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  DollarSign,
  Coins,
  Bitcoin,
  Globe,
  Download,
  Copy,
  ExternalLink,
  Check,
  Calculator,
  Image as ImageIcon,
  Sparkles,
  Info,
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Table as TableIcon,
  BarChart2,
  ArrowUpRight,
  Eye,
  Layers,
} from "lucide-react";
import { MarketQuote } from "../types";

export interface ArzDigitalTableItem {
  rank: number;
  id: string;
  symbol: string;
  name_fa: string;
  name_en: string;
  category: "crypto" | "fiat" | "gold";
  price_usd: number;
  price_toman: number;
  price_irr: number;
  change_24h: number;
  high_24h_toman?: number;
  low_24h_toman?: number;
  high_24h_usd?: number;
  low_24h_usd?: number;
  icon?: string | null;
  chartSvg?: string | null;
  flag?: string;
  updatedAt?: string | null;
}

interface MarketEngineCardProps {
  lang: "fa" | "en";
  accountPhone?: string;
}

const FEATURED_ITEMS = [
  { id: "usd", symbol: "USD", nameFa: "دلار آمریکا", category: "fiat", icon: DollarSign },
  { id: "eur", symbol: "EUR", nameFa: "یورو اروپا", category: "fiat", icon: Globe },
  { id: "aed", symbol: "AED", nameFa: "درهم امارات", category: "fiat", icon: Globe },
  { id: "gbp", symbol: "GBP", nameFa: "پوند انگلیس", category: "fiat", icon: Globe },
  { id: "try", symbol: "TRY", nameFa: "لیر ترکیه", category: "fiat", icon: Globe },
  { id: "cad", symbol: "CAD", nameFa: "دلار کانادا", category: "fiat", icon: Globe },
  { id: "gold18", symbol: "GOLD18", nameFa: "گرم طلا ۱۸", category: "gold", icon: Coins },
  { id: "emami", symbol: "EMAMI", nameFa: "سکه امامی", category: "gold", icon: Coins },
  { id: "xau", symbol: "XAU", nameFa: "انس طلا", category: "gold", icon: Coins },
  { id: "btc", symbol: "BTC", nameFa: "بیت‌کوین", category: "crypto", icon: Bitcoin },
  { id: "eth", symbol: "ETH", nameFa: "اتریوم", category: "crypto", icon: Sparkles },
  { id: "usdt", symbol: "USDT", nameFa: "تتر", category: "crypto", icon: DollarSign },
  { id: "ton", symbol: "TON", nameFa: "تون‌کوین", category: "crypto", icon: Sparkles },
  { id: "sol", symbol: "SOL", nameFa: "سولانا", category: "crypto", icon: Sparkles },
  { id: "trx", symbol: "TRX", nameFa: "ترون", category: "crypto", icon: Sparkles },
];

export const MarketEngineCard: React.FC<MarketEngineCardProps> = ({ lang }) => {
  // Top View Mode: "table" (Arzdigital Table) vs "quote" (Single Quote & Chart)
  const [activeViewMode, setActiveViewMode] = useState<"table" | "quote">("table");

  // Arzdigital Live Table State
  const [tableItems, setTableItems] = useState<ArzDigitalTableItem[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [tableCategory, setTableCategory] = useState<"all" | "fiat" | "crypto" | "gold">("all");
  const [tableSearch, setTableSearch] = useState("");

  // Single Quote & Calculator State
  const [selectedAsset, setSelectedAsset] = useState("usd");
  const [searchQuery, setSearchQuery] = useState("");
  const [amount, setAmount] = useState<number | string>(1);
  const [buyPrice, setBuyPrice] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "fiat" | "gold" | "crypto">("all");
  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartViewMode, setChartViewMode] = useState<"svg" | "image">("svg");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Rate info & Multi-source baseline controller
  const [rateInfo, setRateInfo] = useState<{
    usdToman: number;
    isCustom: boolean;
    customRateToman: number | null;
    sources?: Record<string, number>;
    activeSource: string;
    lastUpdated: string;
  } | null>(null);
  const [customRateInput, setCustomRateInput] = useState<string>("");
  const [savingCustomRate, setSavingCustomRate] = useState(false);
  const [rateNotice, setRateNotice] = useState<string | null>(null);
  const [showRateSettings, setShowRateSettings] = useState(false);

  const fetchTableData = async () => {
    setLoadingTable(true);
    try {
      const res = await fetch("/api/market/table");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.all)) {
          setTableItems(data.all);
        }
      }
    } catch (_) {
    } finally {
      setLoadingTable(false);
    }
  };

  const fetchRateInfo = async () => {
    try {
      const res = await fetch("/api/market/rate-info");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRateInfo(data);
          if (data.customRateToman) {
            setCustomRateInput(String(data.customRateToman));
          }
        }
      }
    } catch (_) {}
  };

  const handleSaveCustomRate = async (tomanVal: number | null) => {
    setSavingCustomRate(true);
    try {
      const res = await fetch("/api/market/custom-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toman: tomanVal }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRateInfo(data);
          setRateNotice(
            tomanVal
              ? `نرخ مبنای دلار با موفقیت روی ${tomanVal.toLocaleString("fa-IR")} تومان قفل شد.`
              : "نرخ مبنا به حالت اجماع زنده صرافی‌های معتبر بازنشانی گردید."
          );
          setTimeout(() => setRateNotice(null), 4000);
          // Refetch current quote with updated rate
          fetchQuote(selectedAsset, typeof amount === "number" ? amount : 1);
        }
      }
    } catch (_) {
    } finally {
      setSavingCustomRate(false);
    }
  };

  const fetchQuote = async (assetKey: string, amt: number = 1, buy?: number) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let url = `/api/market/quote?asset=${encodeURIComponent(assetKey)}&amount=${amt}`;
      if (buy && buy > 0) {
        url += `&buyPrice=${buy}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.quote) {
        setQuote(data.quote);
      } else {
        throw new Error(data.message || "Failed to fetch price quote");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در استعلام قیمت");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote("usd", 1);
    fetchRateInfo();
    fetchTableData();
  }, []);

  const handleSelectFeatured = (id: string) => {
    setSelectedAsset(id);
    setSearchQuery(id);
    const buyNum = buyPrice ? parseFloat(buyPrice) : undefined;
    const numAmt = amount === "" || isNaN(Number(amount)) || Number(amount) <= 0 ? 1 : Number(amount);
    fetchQuote(id, numAmt, buyNum);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim() || selectedAsset;
    const buyNum = buyPrice ? parseFloat(buyPrice) : undefined;
    const numAmt = amount === "" || isNaN(Number(amount)) || Number(amount) <= 0 ? 1 : Number(amount);
    fetchQuote(q, numAmt, buyNum);
  };

  const handleCopyChartUrl = () => {
    if (!quote?.chart_url) return;
    navigator.clipboard.writeText(quote.chart_url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const filteredFeatured = FEATURED_ITEMS.filter((item) => {
    if (categoryFilter === "all") return true;
    return item.category === categoryFilter;
  });

  const isUp = quote?.trend === "up";
  const isDown = quote?.trend === "down";

  return (
    <div className="space-y-6">
      {/* Top Banner / Pulse Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                {lang === "fa" ? "موتور هوشمند استعلام لحظه‌ای نرخ بازار و ارزها" : "Live Real-time Global Market & Currency Engine"}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {lang === "fa" ? "نرخ زنده و بروز" : "Live Market"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === "fa"
                ? "پشتیبانی از تمام ۱۶۰+ ارز فیات دنیا، مسکوکات و مظنه طلا، رمزارزها و تولید خودکار عکس نمودار"
                : "Supports 160+ world currencies, Iranian gold coins, crypto assets and auto-generated price charts"}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const numAmt = amount === "" || isNaN(Number(amount)) || Number(amount) <= 0 ? 1 : Number(amount);
            fetchQuote(searchQuery.trim() || selectedAsset, numAmt, buyPrice ? parseFloat(buyPrice) : undefined);
            fetchRateInfo();
            fetchTableData();
          }}
          disabled={loading || loadingTable}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all self-start sm:self-auto active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading || loadingTable ? "animate-spin" : ""}`} />
          <span>{lang === "fa" ? "بروزرسانی نرخ‌ها" : "Refresh Rates"}</span>
        </button>
      </div>

      {/* Exchange Rate Accuracy & Live Sources Panel */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">
              {lang === "fa" ? "نرخ مبنای زنده دلار و تتر در بازار آزاد تهران:" : "Tehran Free Market USD / USDT Live Benchmark:"}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {rateInfo?.usdToman?.toLocaleString("fa-IR") || "۲۶۶,۷۰۰"} تومان
            </span>
            {rateInfo?.isCustom ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {lang === "fa" ? "🔒 نرخ ثابت سفارشی" : "Custom Locked"}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {lang === "fa" ? "⚡ مرجع لحظه‌ای ارزدیجیتال" : "Live Arzdigital"}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowRateSettings(!showRateSettings)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showRateSettings ? (lang === "fa" ? "بستن تنظیمات نرخ" : "Close Settings") : (lang === "fa" ? "تنظیم دقیق و منابع" : "Sources & Tune")}</span>
          </button>
        </div>

        {/* Live Exchange Sources Breakdown */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
          <span className="text-slate-500">{lang === "fa" ? "منابع زنده بازار:" : "Live Sources:"}</span>
          {rateInfo?.sources?.arzdigital && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/40">
              <span className="text-emerald-300 font-bold">ارزدیجیتال (Arzdigital):</span>
              <span className="font-mono text-emerald-400 font-black">
                {rateInfo.sources.arzdigital.toLocaleString("fa-IR")} ت
              </span>
              <a
                href="https://arzdigital.com/currencies/"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 ml-0.5 inline-flex items-center gap-0.5"
                title="مشاهده صفحه نرخ ارز در ارزدیجیتال"
              >
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">
            <span className="text-slate-300">والکس (Wallex):</span>
            <span className="font-mono text-emerald-400 font-bold">
              {rateInfo?.sources?.wallex?.toLocaleString("fa-IR") || "۲۶۷,۹۰۰"} ت
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">
            <span className="text-slate-300">بیت‌پین (Bitpin):</span>
            <span className="font-mono text-emerald-400 font-bold">
              {rateInfo?.sources?.bitpin?.toLocaleString("fa-IR") || "۲۶۶,۸۰۰"} ت
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">
            <span className="text-slate-300">تترلند (Tetherland):</span>
            <span className="font-mono text-emerald-400 font-bold">
              {rateInfo?.sources?.tetherland?.toLocaleString("fa-IR") || "۲۶۷,۲۵۰"} ت
            </span>
          </div>
        </div>

        {/* Expandable Tuning Panel */}
        {showRateSettings && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 mt-2 animate-in fade-in duration-200">
            <div className="text-xs text-slate-300">
              {lang === "fa"
                ? "اگر تمایل دارید قیمت دلار و تمام ارزها طبق عدد دلخواه شما در ربات و پنل محاسبه شوند، نرخ را وارد کنید یا آن را روی حالت خودکار زنده بگذارید:"
                : "Set a custom fixed USD rate or reset to live exchange consensus:"}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={customRateInput}
                  onChange={(e) => setCustomRateInput(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={lang === "fa" ? "مثلاً ۲۶۶۷۰۰ (تومان)" : "e.g. 266700"}
                  dir="ltr"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <span className="absolute left-3 top-2 text-[11px] text-slate-500">تومان</span>
              </div>

              <button
                type="button"
                disabled={savingCustomRate || !customRateInput}
                onClick={() => handleSaveCustomRate(Number(customRateInput))}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {savingCustomRate ? (lang === "fa" ? "در حال ثبت..." : "Saving...") : (lang === "fa" ? "ثبت نرخ سفارشی" : "Save Custom")}
              </button>

              <button
                type="button"
                disabled={savingCustomRate}
                onClick={() => {
                  setCustomRateInput("");
                  handleSaveCustomRate(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all disabled:opacity-50"
              >
                {lang === "fa" ? "🔄 بازنشانی به نرخ زنده" : "Reset to Live"}
              </button>
            </div>

            {rateNotice && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{rateNotice}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mode Switcher: Live Arzdigital Table vs Quote Calculator */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
        <button
          type="button"
          onClick={() => {
            setActiveViewMode("table");
            if (tableItems.length === 0) fetchTableData();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
            activeViewMode === "table"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <TableIcon className="w-4 h-4 text-emerald-300" />
          <span>{lang === "fa" ? "تابلوی زنده ارزدیجیتال (مشابه arzdigital.com/currencies)" : "Live Arzdigital Market Table"}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 text-emerald-300 border border-emerald-500/30">
            {tableItems.length > 0 ? `${tableItems.length} ارز` : "۹۰+ ارز"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewMode("quote")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
            activeViewMode === "quote"
              ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <BarChart2 className="w-4 h-4 text-cyan-300" />
          <span>{lang === "fa" ? "ماشین‌حساب، استعلام و تولید عکس نمودار" : "Calculator & Chart Studio"}</span>
        </button>
      </div>

      {/* 1. ARZDIGITAL LIVE TABLE VIEW (مشابه arzdigital.com/currencies/) */}
      {activeViewMode === "table" && (
        <div className="space-y-4">
          {/* Controls Bar: Search & Category Filter */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Table Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder={lang === "fa" ? "جستجو در بین ۹۰+ ارز، دلار، یورو، لیر، دینار، تتر، بیت‌کوین..." : "Search across 90+ currencies..."}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-9 pl-8 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                {tableSearch && (
                  <button
                    onClick={() => setTableSearch("")}
                    className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-slate-200"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 text-[11px] bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none">
                {[
                  { id: "all", label: lang === "fa" ? `همه (${tableItems.length})` : `All (${tableItems.length})` },
                  { id: "fiat", label: lang === "fa" ? `ارزهای فیات (${tableItems.filter((i) => i.category === "fiat").length || "۹۰"})` : "Fiat Currencies" },
                  { id: "crypto", label: lang === "fa" ? `رمزارزها (${tableItems.filter((i) => i.category === "crypto").length})` : "Crypto" },
                  { id: "gold", label: lang === "fa" ? `طلا و سکه (${tableItems.filter((i) => i.category === "gold").length})` : "Gold" },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setTableCategory(c.id as any)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-semibold ${
                      tableCategory === c.id
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Official Source Notice Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 gap-2">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>
                  {lang === "fa"
                    ? "قیمت‌های این تابلو به صورت مستقیم و بدون واسطه از مرجع رسمی ارزدیجیتال (arzdigital.com/currencies/) استخراج و بروزرسانی می‌شوند."
                    : "Live prices extracted directly from Arzdigital (arzdigital.com/currencies/) with 100% real-time accuracy."}
                </span>
              </div>
              <a
                href="https://arzdigital.com/currencies/"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 flex-shrink-0"
              >
                <span>arzdigital.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            {loadingTable ? (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <div className="text-xs text-slate-300 font-medium">
                  {lang === "fa" ? "در حال دریافت آخرین نرخ‌ها از ارزدیجیتال..." : "Fetching live data from Arzdigital..."}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold text-[11px]">
                      <th className="py-3 px-3 text-center w-12">#</th>
                      <th className="py-3 px-4">{lang === "fa" ? "نام ارز" : "Asset"}</th>
                      <th className="py-3 px-4">{lang === "fa" ? "قیمت (تومان)" : "Price (Toman)"}</th>
                      <th className="py-3 px-4">{lang === "fa" ? "قیمت (دلار)" : "Price (USD)"}</th>
                      <th className="py-3 px-4 text-center">{lang === "fa" ? "تغییر ۲۴ ساعته" : "24h Change"}</th>
                      <th className="py-3 px-4 hidden md:table-cell">{lang === "fa" ? "دامنه نوسان امروز" : "24h Range"}</th>
                      <th className="py-3 px-4 text-center hidden sm:table-cell">{lang === "fa" ? "نمودار هفتگی" : "Weekly Chart"}</th>
                      <th className="py-3 px-3 text-center">{lang === "fa" ? "عملیات" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {tableItems
                      .filter((item) => {
                        if (tableCategory !== "all" && item.category !== tableCategory) return false;
                        if (!tableSearch.trim()) return true;
                        const q = tableSearch.trim().toLowerCase();
                        return (
                          item.name_fa.toLowerCase().includes(q) ||
                          item.name_en.toLowerCase().includes(q) ||
                          item.symbol.toLowerCase().includes(q)
                        );
                      })
                      .map((item) => {
                        const isProfit = item.change_24h > 0;
                        const isLoss = item.change_24h < 0;
                        return (
                          <tr
                            key={item.id + item.rank}
                            className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                            onClick={() => {
                              setSelectedAsset(item.id);
                              setSearchQuery(item.id);
                              fetchQuote(item.id, 1);
                              setActiveViewMode("quote");
                            }}
                          >
                            {/* Rank */}
                            <td className="py-3 px-3 text-center text-slate-500 font-sans">
                              {item.rank <= 3 ? (
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                                    item.rank === 1
                                      ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40"
                                      : item.rank === 2
                                      ? "bg-slate-300 text-slate-950 shadow-md shadow-slate-300/40"
                                      : "bg-amber-700 text-amber-100"
                                  }`}
                                >
                                  {item.rank}
                                </span>
                              ) : (
                                item.rank
                              )}
                            </td>

                            {/* Name & Icon */}
                            <td className="py-3 px-4 font-sans">
                              <div className="flex items-center gap-2.5">
                                {item.icon ? (
                                  <img
                                    src={item.icon}
                                    alt={item.name_fa}
                                    className="w-7 h-7 rounded-full bg-slate-800 p-0.5 object-cover flex-shrink-0"
                                    onError={(e: any) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-[10px] font-bold flex-shrink-0">
                                    {item.symbol.slice(0, 3)}
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                                    <span>{item.name_fa}</span>
                                    <span className="text-[10px] font-mono text-slate-500 font-normal">
                                      {item.symbol}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                                    {item.name_en}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Toman Price */}
                            <td className="py-3 px-4 font-black text-emerald-400 text-sm">
                              {item.price_toman.toLocaleString("fa-IR")}
                              <span className="text-[10px] font-normal text-slate-500 mr-1">تومان</span>
                            </td>

                            {/* USD Price */}
                            <td className="py-3 px-4 text-cyan-300 font-bold" dir="ltr">
                              ${item.price_usd.toLocaleString("en-US", { minimumFractionDigits: item.price_usd < 1 ? 4 : 2 })}
                            </td>

                            {/* 24h Change */}
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                  isProfit
                                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                    : isLoss
                                    ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                    : "bg-slate-800 text-slate-300"
                                }`}
                              >
                                {isProfit ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : isLoss ? (
                                  <TrendingDown className="w-3 h-3" />
                                ) : null}
                                <span dir="ltr">
                                  {isProfit ? "+" : ""}
                                  {item.change_24h}%
                                </span>
                              </span>
                            </td>

                            {/* Range Low/High */}
                            <td className="py-3 px-4 hidden md:table-cell text-[11px]">
                              {item.low_24h_toman && item.high_24h_toman ? (
                                <div className="space-y-0.5">
                                  <div className="text-emerald-400 flex items-center justify-between gap-1">
                                    <span className="text-slate-500 text-[10px]">سقف:</span>
                                    <span>{item.high_24h_toman.toLocaleString("fa-IR")}</span>
                                  </div>
                                  <div className="text-rose-400 flex items-center justify-between gap-1">
                                    <span className="text-slate-500 text-[10px]">کف:</span>
                                    <span>{item.low_24h_toman.toLocaleString("fa-IR")}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>

                            {/* Sparkline Chart */}
                            <td className="py-3 px-4 text-center hidden sm:table-cell">
                              {item.chartSvg ? (
                                <img
                                  src={item.chartSvg}
                                  alt={`chart-${item.symbol}`}
                                  className={`h-7 w-20 object-contain mx-auto ${
                                    isProfit ? "hue-rotate-[85deg]" : isLoss ? "hue-rotate-[320deg]" : ""
                                  }`}
                                  loading="lazy"
                                />
                              ) : (
                                <span className="text-[10px] text-slate-600 font-sans">---</span>
                              )}
                            </td>

                            {/* Action Button */}
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAsset(item.id);
                                  setSearchQuery(item.id);
                                  fetchQuote(item.id, 1);
                                  setActiveViewMode("quote");
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-[11px] font-sans font-bold transition-all shadow-sm"
                                title="مشاهده نمودار و استعلام"
                              >
                                <Eye className="w-3 h-3" />
                                <span className="hidden lg:inline">{lang === "fa" ? "نمودار" : "Chart"}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. SINGLE QUOTE CALCULATOR & CHART VIEW */}
      {activeViewMode === "quote" && (
        <div className="space-y-6">
          {/* Category Pills & Quick Selector */}
          <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">
            {lang === "fa" ? "دسته‌بندی دارایی‌ها و ارزهای محبوب:" : "Popular Assets & Categories:"}
          </span>
          <div className="flex items-center gap-1 text-[11px] bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(
              [
                { id: "all", label: lang === "fa" ? "همه" : "All" },
                { id: "fiat", label: lang === "fa" ? "ارزهای فیات" : "Fiat" },
                { id: "gold", label: lang === "fa" ? "طلا و سکه" : "Gold" },
                { id: "crypto", label: lang === "fa" ? "رمزارزها" : "Crypto" },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  categoryFilter === cat.id
                    ? "bg-emerald-600 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Assets Horizontal Scroller */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filteredFeatured.map((item) => {
            const isSelected = selectedAsset === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectFeatured(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                    : "bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-emerald-400" />
                <span>{item.nameFa}</span>
                <span className="text-[10px] font-mono text-slate-500">[{item.symbol}]</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Search & Amount Form */}
      <form onSubmit={handleSearchSubmit} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search Asset Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "fa" ? "جستجوی نام یا نماد (دلار، درهم، یورو، سکه، btc، eur، aed...)" : "Asset name or symbol..."}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Amount Input */}
          <div className="sm:col-span-3">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                let val = e.target.value.replace(/[^0-9.]/g, "");
                // Allow only one decimal point
                const parts = val.split(".");
                if (parts.length > 2) {
                  val = parts[0] + "." + parts.slice(1).join("");
                }
                setAmount(val);
              }}
              placeholder={lang === "fa" ? "تعداد / مقدار (مثلاً ۱)" : "Amount (e.g. 1)"}
              dir="ltr"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-100 text-center focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Buy Price (Optional for Profit/Loss) */}
          <div className="sm:col-span-3">
            <input
              type="text"
              inputMode="decimal"
              value={buyPrice}
              onChange={(e) => {
                let val = e.target.value.replace(/[^0-9.]/g, "");
                const parts = val.split(".");
                if (parts.length > 2) {
                  val = parts[0] + "." + parts.slice(1).join("");
                }
                setBuyPrice(val);
              }}
              placeholder={lang === "fa" ? "قیمت خرید $ (اختیاری)" : "Buy Price $ (optional)"}
              dir="ltr"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-100 text-center focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {lang === "fa"
                ? "پشتیبانی از نمادهای جهانی: USD, EUR, AED, GBP, TRY, CAD, AUD, JPY, CNY, SAR, QAR, KWD, IQD و..."
                : "Supports all global symbols: USD, EUR, AED, GBP, TRY, CAD, AUD, JPY, CNY, KWD, IQD..."}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 active:scale-95"
          >
            {loading ? (lang === "fa" ? "درحال استعلام..." : "Fetching...") : (lang === "fa" ? "استعلام قیمت زنده" : "Fetch Quote")}
          </button>
        </div>
      </form>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Main Quote Result & Chart Section */}
      {quote && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          {/* Quote Header Bar */}
          <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 font-mono text-sm">
                {quote.symbol.slice(0, 3)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-slate-100">
                    {quote.amount > 1 ? `${quote.amount} ` : ""}{quote.name_fa || quote.asset}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {quote.symbol}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  🕒 {lang === "fa" ? "بروزرسانی:" : "Updated:"} {quote.updated_at}
                </div>
              </div>
            </div>

            {/* 24h Change Badge */}
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono border ${
                  isUp
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                    : isDown
                    ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                    : "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                }`}
              >
                {isUp ? <TrendingUp className="w-4 h-4" /> : isDown ? <TrendingDown className="w-4 h-4" /> : null}
                <span>
                  {quote.change_24h_percent && quote.change_24h_percent >= 0 ? "+" : ""}
                  {quote.change_24h_percent || 0}%
                </span>
                <span className="text-[10px] opacity-75">۲۴ساعته</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-5">
            {/* Toman Price */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="text-[11px] text-slate-400">
                {lang === "fa" ? "معادل به تومان (بازار آزاد)" : "Total in Tomans"}
              </div>
              <div className="text-lg font-black text-emerald-400 font-mono">
                {quote.total_toman.toLocaleString("fa-IR")}
                <span className="text-xs font-normal text-slate-400 mr-1.5">تومان</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                واحد: {quote.unit_toman.toLocaleString("fa-IR")} تومان
              </div>
            </div>

            {/* USD Price */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="text-[11px] text-slate-400">
                {lang === "fa" ? "معادل دلاری (USD)" : "Total in USD"}
              </div>
              <div className="text-lg font-black text-cyan-400 font-mono" dir="ltr">
                ${quote.total_usd.toLocaleString("en-US", { minimumFractionDigits: quote.total_usd < 1 ? 4 : 2 })}
              </div>
              <div className="text-[10px] text-slate-500 font-mono" dir="ltr">
                Unit: ${quote.unit_usd.toLocaleString("en-US", { minimumFractionDigits: quote.unit_usd < 1 ? 4 : 2 })}
              </div>
            </div>

            {/* High & Low Today */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="text-[11px] text-slate-400">
                {lang === "fa" ? "دامنه نوسان امروز" : "24h High & Low"}
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400">سقف: {quote.high_24h_toman?.toLocaleString("fa-IR") || "-"}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-rose-400">کف: {quote.low_24h_toman?.toLocaleString("fa-IR") || "-"}</span>
              </div>
            </div>

            {/* IRR / Riyal Price */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="text-[11px] text-slate-400">
                {lang === "fa" ? "معادل به ریال ایران" : "Total in IRR"}
              </div>
              <div className="text-base font-bold text-slate-200 font-mono">
                {quote.total_irr.toLocaleString("fa-IR")}
                <span className="text-xs font-normal text-slate-500 mr-1">ریال</span>
              </div>
              {quote.profitLossText && (
                <div className="text-[10px] text-amber-300 font-semibold truncate" title={quote.profitLossText}>
                  {quote.profitLossText}
                </div>
              )}
            </div>
          </div>

          {/* VISUAL PRICE CHART & PHOTO ENGINE ("عکس نمودار قیمت هم بیاره") */}
          <div className="p-5 border-t border-slate-800 bg-slate-950/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <h5 className="text-xs font-bold text-slate-200">
                  {lang === "fa" ? "عکس و نمودار گرافیکی نوسانات قیمت ۲۴ ساعته:" : "24-Hour Price Trend Chart:"}
                </h5>
              </div>

              {/* Toggle SVG / Image View */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setChartViewMode("svg")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    chartViewMode === "svg"
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {lang === "fa" ? "نمودار برداری (SVG)" : "Vector SVG"}
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode("image")}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    chartViewMode === "image"
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>{lang === "fa" ? "عکس نمودار (PNG)" : "Photo PNG"}</span>
                </button>
              </div>
            </div>

            {/* Render Selected Chart */}
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#0b0f19] p-3 flex items-center justify-center min-h-[260px]">
              {chartViewMode === "svg" && quote.chart_svg ? (
                <div
                  className="w-full flex justify-center"
                  dangerouslySetInnerHTML={{ __html: quote.chart_svg }}
                />
              ) : (
                <div className="space-y-2 text-center w-full">
                  {quote.chart_url ? (
                    <img
                      src={quote.chart_url}
                      alt={`Chart for ${quote.symbol}`}
                      className="max-h-[300px] w-auto mx-auto rounded-lg shadow-lg border border-slate-800"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-xs text-slate-500">
                      {lang === "fa" ? "عکس نمودار موجود نیست" : "No chart image available"}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chart Action Buttons (Download, Copy Link, Open in New Tab) */}
            {quote.chart_url && (
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyChartUrl}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-all active:scale-95"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedUrl ? (lang === "fa" ? "کپی شد!" : "Copied!") : (lang === "fa" ? "کپی لینک عکس نمودار" : "Copy Image Link")}</span>
                </button>

                <a
                  href={quote.chart_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all active:scale-95"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{lang === "fa" ? "مشاهده عکس کامل" : "Open Full Image"}</span>
                </a>

                <a
                  href={`/api/market/chart/${encodeURIComponent(quote.symbol)}?format=png`}
                  download={`${quote.symbol}-chart.png`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === "fa" ? "دانلود عکس نمودار" : "Download Chart"}</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )}

      {/* Telegram Automation Usage Instructions */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{lang === "fa" ? "نحوه استفاده در چت تلگرام و ربات‌ها (دستورات خودکار):" : "Telegram Usage & Commands:"}</span>
        </div>
        <p className="text-xs text-slate-400">
          {lang === "fa"
            ? "وقتی ابزار استعلام نرخ در تنظیمات چت فعال باشد، با ارسال هر یک از دستورات زیر در پی‌وی یا گروه‌ها، اکانت سلف یا ربات تلگرام فوراً عکس نمودار قیمت به همراه جدول کامل نرخ زنده را ارسال می‌نماید:"
            : "When market tools are active, sending any of these commands in chats or to the bot will reply with the price chart photo and full quote:"}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            <div className="text-[10px] text-emerald-400 font-bold mb-1">استعلام ارزهای فیات:</div>
            <div>.price usd</div>
            <div className="text-slate-500">قیمت دلار | .price aed | .price eur</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            <div className="text-[10px] text-amber-400 font-bold mb-1">طلا، سکه و مظنه:</div>
            <div>قیمت سکه امامی</div>
            <div className="text-slate-500">.price gold | طلا ۱۸ عیار | .price xau</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            <div className="text-[10px] text-cyan-400 font-bold mb-1">رمزارزها و محاسبه سود:</div>
            <div>.price btc</div>
            <div className="text-slate-500">.price ton | خرید 90000 قیمت دلار</div>
          </div>
        </div>
      </div>
    </div>
  );
};
