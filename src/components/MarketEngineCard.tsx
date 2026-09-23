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
} from "lucide-react";
import { MarketQuote } from "../types";

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
          }}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all self-start sm:self-auto active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
          <span>{lang === "fa" ? "بروزرسانی نرخ" : "Refresh"}</span>
        </button>
      </div>

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
                const val = e.target.value.replace(/[^0-9.]/g, "");
                // Allow only one decimal point
                if ((val.match(/\./g) || []).length > 1) return;
                setAmount(val);
              }}
              placeholder={lang === "fa" ? "تعداد / مقدار" : "Amount"}
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
                const val = e.target.value.replace(/[^0-9.]/g, "");
                if ((val.match(/\./g) || []).length > 1) return;
                setBuyPrice(val);
              }}
              placeholder={lang === "fa" ? "قیمت خرید $ (اختیاری)" : "Buy Price $"}
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
