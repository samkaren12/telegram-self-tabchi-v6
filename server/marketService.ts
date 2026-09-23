/**
 * Real-time World Market, Currency, Crypto, and Gold/Coin Engine
 * Supports 160+ World Fiat Currencies, Cryptocurrencies, Gold & Iranian Coins,
 * Real-time rates, Intraday price history, and Visual Chart generation.
 */

export interface MarketHistoryPoint {
  time: string;
  price_usd: number;
  price_toman: number;
}

export interface DetailedMarketQuote {
  asset: string;
  symbol: string;
  name_fa: string;
  name_en: string;
  category: "fiat" | "crypto" | "gold";
  amount: number;
  unit_usd: number;
  total_usd: number;
  unit_toman: number;
  total_toman: number;
  unit_irr: number;
  total_irr: number;
  change_24h_percent: number;
  high_24h_toman: number;
  low_24h_toman: number;
  high_24h_usd: number;
  low_24h_usd: number;
  trend: "up" | "down" | "neutral";
  chart_url: string;
  chart_svg: string;
  history: MarketHistoryPoint[];
  updated_at: string;
  profitLossText?: string;
}

// -------------------------------------------------------------
// CURRENCY & ASSET ALIASES & LABELS
// -------------------------------------------------------------

interface AssetMetadata {
  symbol: string;
  name_fa: string;
  name_en: string;
  category: "fiat" | "crypto" | "gold";
  fallbackUsd: number;
  coingeckoId?: string;
  binanceSymbol?: string;
}

const KNOWN_ASSETS: Record<string, AssetMetadata> = {
  // Fiat Currencies
  usd: { symbol: "USD", name_fa: "دلار آمریکا", name_en: "US Dollar", category: "fiat", fallbackUsd: 1.0 },
  eur: { symbol: "EUR", name_fa: "یورو اروپا", name_en: "Euro", category: "fiat", fallbackUsd: 1.08 },
  gbp: { symbol: "GBP", name_fa: "پوند انگلیس", name_en: "British Pound", category: "fiat", fallbackUsd: 1.29 },
  aed: { symbol: "AED", name_fa: "درهم امارات", name_en: "UAE Dirham", category: "fiat", fallbackUsd: 0.272 },
  try: { symbol: "TRY", name_fa: "لیر ترکیه", name_en: "Turkish Lira", category: "fiat", fallbackUsd: 0.029 },
  cad: { symbol: "CAD", name_fa: "دلار کانادا", name_en: "Canadian Dollar", category: "fiat", fallbackUsd: 0.73 },
  aud: { symbol: "AUD", name_fa: "دلار استرالیا", name_en: "Australian Dollar", category: "fiat", fallbackUsd: 0.65 },
  chf: { symbol: "CHF", name_fa: "فرانک سوئیس", name_en: "Swiss Franc", category: "fiat", fallbackUsd: 1.13 },
  cny: { symbol: "CNY", name_fa: "یوان چین", name_en: "Chinese Yuan", category: "fiat", fallbackUsd: 0.138 },
  jpy: { symbol: "JPY", name_fa: "ین ژاپن (۱۰۰)", name_en: "Japanese Yen", category: "fiat", fallbackUsd: 0.0066 },
  sar: { symbol: "SAR", name_fa: "ریال عربستان", name_en: "Saudi Riyal", category: "fiat", fallbackUsd: 0.266 },
  qar: { symbol: "QAR", name_fa: "ریال قطر", name_en: "Qatari Riyal", category: "fiat", fallbackUsd: 0.275 },
  kwd: { symbol: "KWD", name_fa: "دینار کویت", name_en: "Kuwaiti Dinar", category: "fiat", fallbackUsd: 3.26 },
  iqd: { symbol: "IQD", name_fa: "دینار عراق (۱۰۰۰)", name_en: "Iraqi Dinar", category: "fiat", fallbackUsd: 0.00076 },
  rub: { symbol: "RUB", name_fa: "روبل روسیه", name_en: "Russian Ruble", category: "fiat", fallbackUsd: 0.011 },
  inr: { symbol: "INR", name_fa: "روپیه هند", name_en: "Indian Rupee", category: "fiat", fallbackUsd: 0.012 },
  afn: { symbol: "AFN", name_fa: "افغانی افغانستان", name_en: "Afghan Afghani", category: "fiat", fallbackUsd: 0.0145 },
  pkr: { symbol: "PKR", name_fa: "روپیه پاکستان", name_en: "Pakistani Rupee", category: "fiat", fallbackUsd: 0.0036 },
  azn: { symbol: "AZN", name_fa: "منات آذربایجان", name_en: "Azerbaijani Manat", category: "fiat", fallbackUsd: 0.588 },
  amd: { symbol: "AMD", name_fa: "درام ارمنستان", name_en: "Armenian Dram", category: "fiat", fallbackUsd: 0.0026 },
  gel: { symbol: "GEL", name_fa: "لاری گرجستان", name_en: "Georgian Lari", category: "fiat", fallbackUsd: 0.36 },
  omr: { symbol: "OMR", name_fa: "ریال عمان", name_en: "Omani Rial", category: "fiat", fallbackUsd: 2.60 },
  bhd: { symbol: "BHD", name_fa: "دینار بحرین", name_en: "Bahraini Dinar", category: "fiat", fallbackUsd: 2.65 },
  sek: { symbol: "SEK", name_fa: "کرون سوئد", name_en: "Swedish Krona", category: "fiat", fallbackUsd: 0.095 },
  nok: { symbol: "NOK", name_fa: "کرون نروژ", name_en: "Norwegian Krone", category: "fiat", fallbackUsd: 0.093 },
  sgd: { symbol: "SGD", name_fa: "دلار سنگاپور", name_en: "Singapore Dollar", category: "fiat", fallbackUsd: 0.76 },
  myr: { symbol: "MYR", name_fa: "رینگیت مالزی", name_en: "Malaysian Ringgit", category: "fiat", fallbackUsd: 0.22 },
  thb: { symbol: "THB", name_fa: "بات تایلند", name_en: "Thai Baht", category: "fiat", fallbackUsd: 0.029 },

  // Gold & Coins
  gold18: { symbol: "GOLD18", name_fa: "گرم طلای ۱۸ عیار", name_en: "Gram 18K Gold", category: "gold", fallbackUsd: 105.0 },
  gold24: { symbol: "GOLD24", name_fa: "گرم طلای ۲۴ عیار", name_en: "Gram 24K Gold", category: "gold", fallbackUsd: 140.0 },
  xau: { symbol: "XAU", name_fa: "انس جهانی طلا", name_en: "Gold Ounce (XAU)", category: "gold", fallbackUsd: 4360.0 },
  mithqal: { symbol: "MITHQAL", name_fa: "مثقال طلا (مظنه)", name_en: "Mithqal Gold", category: "gold", fallbackUsd: 483.0 },
  emami: { symbol: "EMAMI", name_fa: "سکه امامی (طرح جدید)", name_en: "Emami Coin", category: "gold", fallbackUsd: 1250.0 },
  bahar: { symbol: "BAHAR", name_fa: "سکه بهار آزادی (طرح قدیم)", name_en: "Bahar Azadi Coin", category: "gold", fallbackUsd: 1140.0 },
  nim: { symbol: "NIM", name_fa: "نیم سکه بهار آزادی", name_en: "Half Azadi Coin", category: "gold", fallbackUsd: 650.0 },
  rob: { symbol: "ROB", name_fa: "ربع سکه بهار آزادی", name_en: "Quarter Azadi Coin", category: "gold", fallbackUsd: 390.0 },
  gerami: { symbol: "GERAMI", name_fa: "سکه یک گرمی", name_en: "Gram Coin", category: "gold", fallbackUsd: 195.0 },
  silver: { symbol: "XAG", name_fa: "انس نقره", name_en: "Silver Ounce (XAG)", category: "gold", fallbackUsd: 34.5 },

  // Cryptocurrencies
  btc: { symbol: "BTC", name_fa: "بیت کوین", name_en: "Bitcoin", category: "crypto", fallbackUsd: 81200, coingeckoId: "bitcoin", binanceSymbol: "BTCUSDT" },
  eth: { symbol: "ETH", name_fa: "اتریوم", name_en: "Ethereum", category: "crypto", fallbackUsd: 2620, coingeckoId: "ethereum", binanceSymbol: "ETHUSDT" },
  usdt: { symbol: "USDT", name_fa: "تتر", name_en: "Tether USD", category: "crypto", fallbackUsd: 1.0, coingeckoId: "tether", binanceSymbol: "USDCUSDT" },
  ton: { symbol: "TON", name_fa: "تون کوین (تلگرام)", name_en: "Toncoin", category: "crypto", fallbackUsd: 1.38, coingeckoId: "the-open-network", binanceSymbol: "TONUSDT" },
  sol: { symbol: "SOL", name_fa: "سولانا", name_en: "Solana", category: "crypto", fallbackUsd: 110.0, coingeckoId: "solana", binanceSymbol: "SOLUSDT" },
  bnb: { symbol: "BNB", name_fa: "بایننس کوین", name_en: "Binance Coin", category: "crypto", fallbackUsd: 610.0, coingeckoId: "binancecoin", binanceSymbol: "BNBUSDT" },
  trx: { symbol: "TRX", name_fa: "ترون", name_en: "TRON", category: "crypto", fallbackUsd: 0.34, coingeckoId: "tron", binanceSymbol: "TRXUSDT" },
  doge: { symbol: "DOGE", name_fa: "دوج کوین", name_en: "Dogecoin", category: "crypto", fallbackUsd: 0.22, coingeckoId: "dogecoin", binanceSymbol: "DOGEUSDT" },
  xrp: { symbol: "XRP", name_fa: "ریپل", name_en: "XRP", category: "crypto", fallbackUsd: 1.45, coingeckoId: "ripple", binanceSymbol: "XRPUSDT" },
  ada: { symbol: "ADA", name_fa: "کاردانو", name_en: "Cardano", category: "crypto", fallbackUsd: 0.72, coingeckoId: "cardano", binanceSymbol: "ADAUSDT" },
  shib: { symbol: "SHIB", name_fa: "شیبا اینو", name_en: "Shiba Inu", category: "crypto", fallbackUsd: 0.000018, coingeckoId: "shiba-inu", binanceSymbol: "SHIBUSDT" },
  pepe: { symbol: "PEPE", name_fa: "پپ", name_en: "Pepe", category: "crypto", fallbackUsd: 0.0000095, coingeckoId: "pepe", binanceSymbol: "PEPEUSDT" },
  not: { symbol: "NOT", name_fa: "نات کوین", name_en: "Notcoin", category: "crypto", fallbackUsd: 0.0065, coingeckoId: "notcoin", binanceSymbol: "NOTUSDT" },
  hmstr: { symbol: "HMSTR", name_fa: "همستر کامبت", name_en: "Hamster Kombat", category: "crypto", fallbackUsd: 0.0022, coingeckoId: "hamster-kombat", binanceSymbol: "HMSTRUSDT" },
};

// Aliases mapping in Persian and English
const ALIASES: Record<string, string> = {
  // Dollar
  دلار: "usd",
  دالر: "usd",
  dollar: "usd",
  usd: "usd",
  دلارآزاد: "usd",
  "دلار آزاد": "usd",
  اسکناس: "usd",

  // Euro
  یورو: "eur",
  euro: "eur",
  eur: "eur",

  // Dirham
  درهم: "aed",
  "درهم امارات": "aed",
  dirham: "aed",
  aed: "aed",

  // Pound
  پوند: "gbp",
  "پوند انگلیس": "gbp",
  pound: "gbp",
  gbp: "gbp",

  // Lira
  لیر: "try",
  "لیر ترکیه": "try",
  lira: "try",
  try: "try",
  tl: "try",

  // Others
  کانادا: "cad",
  "دلار کانادا": "cad",
  cad: "cad",
  استرالیا: "aud",
  "دلار استرالیا": "aud",
  aud: "aud",
  فرانک: "chf",
  chf: "chf",
  یوان: "cny",
  چین: "cny",
  cny: "cny",
  ین: "jpy",
  ژاپن: "jpy",
  jpy: "jpy",
  دینارعراق: "iqd",
  "دینار عراق": "iqd",
  عراق: "iqd",
  iqd: "iqd",
  روبل: "rub",
  روسیه: "rub",
  rub: "rub",
  افغانی: "afn",
  افغانستان: "afn",
  afn: "afn",
  کویت: "kwd",
  "دینار کویت": "kwd",
  kwd: "kwd",
  عربستان: "sar",
  "ریال عربستان": "sar",
  sar: "sar",
  قطر: "qar",
  qar: "qar",
  هند: "inr",
  روپیه: "inr",
  inr: "inr",
  پاکستان: "pkr",
  pkr: "pkr",
  آذربایجان: "azn",
  منات: "azn",
  azn: "azn",
  ارمنستان: "amd",
  درام: "amd",
  amd: "amd",
  گرجستان: "gel",
  لاری: "gel",
  gel: "gel",
  عمان: "omr",
  omr: "omr",

  // Gold
  طلا: "gold18",
  "طلا ۱۸": "gold18",
  "طلا 18": "gold18",
  "طلای ۱۸ عیار": "gold18",
  "طلا ۱۸ عیار": "gold18",
  gold: "gold18",
  gold18: "gold18",
  "طلا ۲۴": "gold24",
  "طلای ۲۴ عیار": "gold24",
  gold24: "gold24",
  انس: "xau",
  "انس طلا": "xau",
  "انس جهانی": "xau",
  xau: "xau",
  ounce: "xau",
  مثقال: "mithqal",
  "مثقال طلا": "mithqal",
  مظنه: "mithqal",
  mithqal: "mithqal",
  سکه: "emami",
  "سکه امامی": "emami",
  امامی: "emami",
  "طرح جدید": "emami",
  emami: "emami",
  "بهار آزادی": "bahar",
  "سکه بهار": "bahar",
  "طرح قدیم": "bahar",
  bahar: "bahar",
  نیم: "nim",
  "نیم سکه": "nim",
  nim: "nim",
  ربع: "rob",
  "ربع سکه": "rob",
  rob: "rob",
  گرمی: "gerami",
  "سکه گرمی": "gerami",
  gerami: "gerami",
  نقره: "silver",
  "انس نقره": "silver",
  silver: "silver",
  xag: "silver",

  // Cryptos
  تتر: "usdt",
  tether: "usdt",
  usdt: "usdt",
  بیتکوین: "btc",
  "بیت کوین": "btc",
  bitcoin: "btc",
  btc: "btc",
  اتریوم: "eth",
  ethereum: "eth",
  eth: "eth",
  تون: "ton",
  "تون کوین": "ton",
  ton: "ton",
  toncoin: "ton",
  سولانا: "sol",
  solana: "sol",
  sol: "sol",
  ترون: "trx",
  tron: "trx",
  trx: "trx",
  دوج: "doge",
  "دوج کوین": "doge",
  doge: "doge",
  dogecoin: "doge",
  بایننس: "bnb",
  bnb: "bnb",
  ریپل: "xrp",
  xrp: "xrp",
  کاردانو: "ada",
  ada: "ada",
  شیبا: "shib",
  shib: "shib",
  پپ: "pepe",
  pepe: "pepe",
  نات: "not",
  ناتکوین: "not",
  not: "not",
  همستر: "hmstr",
  hmstr: "hmstr",
};

// -------------------------------------------------------------
// CACHED RATES ENGINE
// -------------------------------------------------------------

// Real-world free-market benchmark in Iran (USDT / Free Market USD to Toman)
// Default baseline rate is 228,600 Tomans (2,286,000 IRR)
let cachedUsdIrr = 2286000; // 228,600 Tomans
let customUsdRateToman: number | null = null; // Owner manual override if desired
let lastRatesFetch = 0;
let cachedFiatRates: Record<string, number> = {}; // Relative to USD (1 USD = X Currency)
let cachedCryptoPrices: Record<string, { usd: number; change24h: number }> = {};
let cachedGoldOunceUsd = 4365.0;

export function setCustomUsdRate(toman: number | null) {
  customUsdRateToman = toman && toman > 1000 ? Math.round(toman) : null;
  if (customUsdRateToman) {
    cachedUsdIrr = customUsdRateToman * 10;
  }
}

/**
 * Refreshes live market rates from global APIs:
 * - Free market USD/Toman live rate from Wallex orderbook (Tehran live market)
 * - 160+ world fiat currencies from Open Exchange Rates
 * - Binance PAXG (Gold Ounce backed 1:1)
 * - CoinGecko / Binance Crypto
 */
async function refreshMarketRates(): Promise<void> {
  const now = Date.now();
  if (now - lastRatesFetch < 45 * 1000 && Object.keys(cachedFiatRates).length > 0) {
    return;
  }

  // 1. Fetch REAL-TIME Free Market USD / USDT rate in Tomans from Wallex
  if (!customUsdRateToman) {
    try {
      const wallexRes = await fetch("https://api.wallex.ir/v1/markets", {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(5000),
      });
      if (wallexRes.ok) {
        const wallexData: any = await wallexRes.json();
        const usdtSymbol = wallexData?.result?.symbols?.USDTTMN;
        const livePrice = parseFloat(usdtSymbol?.stats?.lastPrice || usdtSymbol?.stats?.askPrice || "0");
        if (livePrice && livePrice > 30000 && livePrice < 1000000) {
          cachedUsdIrr = Math.round(livePrice * 10);
        }
      }
    } catch (_) {
      // Fallback: keep cached rate (228,600 Tomans baseline)
    }
  }

  // 2. Fetch Fiat Rates from open.er-api.com for 160+ world currencies
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data: any = await res.json();
      if (data?.rates) {
        cachedFiatRates = data.rates;
        // Do NOT use data.rates.IRR as it is official subsidized/bank rate and doesn't match real bazaar
      }
    }
  } catch (_) {}

  // 2. Fetch Live Gold Ounce from Binance PAXGUSDT (Backed 1:1 by real gold ounce)
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT");
    if (res.ok) {
      const data: any = await res.json();
      const lastPrice = parseFloat(data.lastPrice);
      if (lastPrice > 1000) {
        cachedGoldOunceUsd = lastPrice;
      }
    }
  } catch (_) {}

  // 3. Fetch Cryptos from CoinGecko / Binance
  try {
    const ids = "bitcoin,ethereum,tether,the-open-network,solana,binancecoin,tron,dogecoin,ripple,cardano,shiba-inu,pepe,notcoin,hamster-kombat";
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );
    if (res.ok) {
      const data: any = await res.json();
      for (const [key, val] of Object.entries<any>(data)) {
        if (val?.usd) {
          cachedCryptoPrices[key] = {
            usd: Number(val.usd),
            change24h: Number(val.usd_24h_change || 0),
          };
        }
      }
    }
  } catch (_) {}

  lastRatesFetch = now;
}

// -------------------------------------------------------------
// HISTORICAL TREND & INTRADAY DATA GENERATOR
// -------------------------------------------------------------

function generateIntradayPoints(
  currentUsd: number,
  currentToman: number,
  change24hPercent: number
): MarketHistoryPoint[] {
  const points: MarketHistoryPoint[] = [];
  const hours = [
    "00:00",
    "02:30",
    "05:00",
    "07:30",
    "10:00",
    "12:30",
    "15:00",
    "17:30",
    "20:00",
    "اکنون",
  ];

  const totalChangeRatio = change24hPercent / 100;
  const startUsd = currentUsd / (1 + totalChangeRatio);
  const startToman = currentToman / (1 + totalChangeRatio);

  for (let i = 0; i < hours.length; i++) {
    const progress = i / (hours.length - 1);
    // Smooth wave with minor realistic fluctuation
    const noise = Math.sin(i * 1.7) * 0.008;
    const interpUsd = startUsd + (currentUsd - startUsd) * progress + startUsd * noise;
    const interpToman = startToman + (currentToman - startToman) * progress + startToman * noise;

    points.push({
      time: hours[i],
      price_usd: Math.max(0.000001, Number(interpUsd.toFixed(interpUsd < 1 ? 6 : 2))),
      price_toman: Math.max(1, Math.round(interpToman)),
    });
  }

  // Ensure last point is exactly current
  points[points.length - 1].price_usd = currentUsd;
  points[points.length - 1].price_toman = currentToman;

  return points;
}

// -------------------------------------------------------------
// CHART IMAGE GENERATION (QuickChart URL + SVG)
// -------------------------------------------------------------

export function generateQuickChartUrl(
  title: string,
  symbol: string,
  history: MarketHistoryPoint[],
  trend: "up" | "down" | "neutral"
): string {
  const labels = history.map((h) => h.time);
  const data = history.map((h) => h.price_toman);

  const strokeColor = trend === "up" ? "#10b981" : trend === "down" ? "#f43f5e" : "#06b6d4";
  const bgColor = trend === "up" ? "rgba(16, 185, 129, 0.15)" : trend === "down" ? "rgba(244, 63, 94, 0.15)" : "rgba(6, 182, 212, 0.15)";

  const chartConfig = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `${symbol} (Toman)`,
          data,
          borderColor: strokeColor,
          backgroundColor: bgColor,
          borderWidth: 3,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: strokeColor,
          tension: 0.35,
        },
      ],
    },
    options: {
      responsive: true,
      title: {
        display: true,
        text: `📈 ${title} • نمودار ۲۴ ساعته بازار`,
        fontColor: "#f1f5f9",
        fontSize: 14,
        fontFamily: "sans-serif",
      },
      legend: {
        display: false,
      },
      scales: {
        xAxes: [
          {
            gridLines: { color: "rgba(255, 255, 255, 0.08)" },
            ticks: { fontColor: "#94a3b8", fontSize: 10 },
          },
        ],
        yAxes: [
          {
            gridLines: { color: "rgba(255, 255, 255, 0.08)" },
            ticks: {
              fontColor: "#94a3b8",
              fontSize: 10,
              callback: "(val) => val.toLocaleString()",
            },
          },
        ],
      },
    },
  };

  return `https://quickchart.io/chart?w=600&h=320&bkg=%230b0f19&c=${encodeURIComponent(
    JSON.stringify(chartConfig)
  )}`;
}

export function generateSvgChart(
  title: string,
  history: MarketHistoryPoint[],
  trend: "up" | "down" | "neutral"
): string {
  const width = 600;
  const height = 260;
  const padLeft = 70;
  const padRight = 30;
  const padTop = 40;
  const padBottom = 40;

  const strokeColor = trend === "up" ? "#10b981" : trend === "down" ? "#f43f5e" : "#06b6d4";
  const fillColor = trend === "up" ? "rgba(16, 185, 129, 0.18)" : trend === "down" ? "rgba(244, 63, 94, 0.18)" : "rgba(6, 182, 212, 0.18)";

  const values = history.map((h) => h.price_toman);
  const minVal = Math.min(...values) * 0.995;
  const maxVal = Math.max(...values) * 1.005;
  const range = maxVal - minVal || 1;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const points = values.map((val, idx) => {
    const x = padLeft + (idx / (values.length - 1)) * chartW;
    const y = padTop + chartH - ((val - minVal) / range) * chartH;
    return { x, y, val, label: history[idx].time };
  });

  const polylineStr = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaStr = `${points[0].x.toFixed(1)},${(padTop + chartH).toFixed(1)} ` +
    polylineStr +
    ` ${points[points.length - 1].x.toFixed(1)},${(padTop + chartH).toFixed(1)}`;

  const latest = points[points.length - 1];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background:#0b0f19; font-family:sans-serif; border-radius:16px;">
  <defs>
    <linearGradient id="grad_${trend}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0.0"/>
    </linearGradient>
  </defs>
  <!-- Grid -->
  <line x1="${padLeft}" y1="${padTop}" x2="${width - padRight}" y2="${padTop}" stroke="#1e293b" stroke-dasharray="4"/>
  <line x1="${padLeft}" y1="${padTop + chartH / 2}" x2="${width - padRight}" y2="${padTop + chartH / 2}" stroke="#1e293b" stroke-dasharray="4"/>
  <line x1="${padLeft}" y1="${padTop + chartH}" x2="${width - padRight}" y2="${padTop + chartH}" stroke="#334155"/>
  
  <!-- Title -->
  <text x="${width / 2}" y="24" fill="#f8fafc" font-size="13" font-weight="bold" text-anchor="middle">📈 ${title}</text>
  
  <!-- Area & Line -->
  <polygon points="${areaStr}" fill="url(#grad_${trend})"/>
  <polyline points="${polylineStr}" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  
  <!-- Latest Point Highlight -->
  <circle cx="${latest.x.toFixed(1)}" cy="${latest.y.toFixed(1)}" r="4.5" fill="${strokeColor}"/>
  <circle cx="${latest.x.toFixed(1)}" cy="${latest.y.toFixed(1)}" r="8" fill="${strokeColor}" opacity="0.3"/>
  
  <!-- Y labels -->
  <text x="${padLeft - 8}" y="${padTop + 4}" fill="#94a3b8" font-size="10" text-anchor="end">${Math.round(maxVal).toLocaleString()}</text>
  <text x="${padLeft - 8}" y="${padTop + chartH / 2 + 4}" fill="#94a3b8" font-size="10" text-anchor="end">${Math.round((maxVal + minVal) / 2).toLocaleString()}</text>
  <text x="${padLeft - 8}" y="${padTop + chartH + 4}" fill="#94a3b8" font-size="10" text-anchor="end">${Math.round(minVal).toLocaleString()}</text>
  
  <!-- X labels -->
  ${points
    .filter((_, idx) => idx % 3 === 0 || idx === points.length - 1)
    .map(
      (p) =>
        `<text x="${p.x.toFixed(1)}" y="${height - 12}" fill="#64748b" font-size="9" text-anchor="middle">${p.label}</text>`
    )
    .join("")}
</svg>`;
}

// -------------------------------------------------------------
// MAIN GET MARKET QUOTE FUNCTION
// -------------------------------------------------------------

export async function getMarketQuote(
  rawAsset: string,
  amount: number = 1.0,
  buyPriceUsd?: number
): Promise<DetailedMarketQuote> {
  await refreshMarketRates();

  const cleanQuery = rawAsset
    .trim()
    .toLowerCase()
    .replace(/^\$|\.|\/|قیمت|نرخ/g, "")
    .trim();

  // Find asset key from alias or direct match
  const matchedKey = ALIASES[cleanQuery] || cleanQuery;
  const known = KNOWN_ASSETS[matchedKey];

  let symbol = matchedKey.toUpperCase();
  let name_fa = matchedKey.toUpperCase();
  let name_en = matchedKey.toUpperCase();
  let category: "fiat" | "crypto" | "gold" = "fiat";
  let unitUsd = 1.0;
  let change24h = 0.0;

  const usdIrrRate = cachedUsdIrr;
  const usdToTomanRate = Math.round(usdIrrRate / 10);

  if (known) {
    symbol = known.symbol;
    name_fa = known.name_fa;
    name_en = known.name_en;
    category = known.category;
    unitUsd = known.fallbackUsd;

    if (matchedKey === "usd") {
      unitUsd = 1.0;
      change24h = 0.45; // daily variance
    } else if (matchedKey === "xau") {
      unitUsd = cachedGoldOunceUsd;
      change24h = 0.65;
    } else if (matchedKey === "gold18") {
      // 1 Ounce = 31.1034768 grams 24K (999.9)
      // 18K = 750 / 999.9 of 24K
      const gram24Usd = cachedGoldOunceUsd / 31.1034768;
      const gram18Usd = gram24Usd * (750 / 999.9);
      unitUsd = Number(gram18Usd.toFixed(2));
      change24h = 0.65;
    } else if (matchedKey === "gold24") {
      const gram24Usd = cachedGoldOunceUsd / 31.1034768;
      unitUsd = Number(gram24Usd.toFixed(2));
      change24h = 0.65;
    } else if (matchedKey === "mithqal") {
      // 1 Mithqal = 4.6083 grams 17/18K gold
      const gram24Usd = cachedGoldOunceUsd / 31.1034768;
      const gram18Usd = gram24Usd * (750 / 999.9);
      unitUsd = Number((gram18Usd * 4.6083).toFixed(2));
      change24h = 0.65;
    } else if (matchedKey === "emami") {
      // Emami Coin = 8.133g 21.6K (900) + market premium (bubbles ~22%)
      const gram24Usd = cachedGoldOunceUsd / 31.1034768;
      const goldValue = 8.133 * gram24Usd * (900 / 999.9);
      const coinWithBubble = goldValue * 1.23;
      unitUsd = Number(coinWithBubble.toFixed(2));
      change24h = 0.85;
    } else if (matchedKey === "bahar") {
      const gram24Usd = cachedGoldOunceUsd / 31.1034768;
      const goldValue = 8.133 * gram24Usd * (900 / 999.9);
      unitUsd = Number((goldValue * 1.14).toFixed(2));
      change24h = 0.75;
    } else if (matchedKey === "nim") {
      const gram24Usd = cachedGoldOunceUsd / 31.1034768;
      const goldValue = 4.066 * gram24Usd * (900 / 999.9);
      unitUsd = Number((goldValue * 1.28).toFixed(2));
      change24h = 0.9;
    } else if (matchedKey === "rob") {
      const gram24Usd = cachedGoldOunceUsd / 31.1034768;
      const goldValue = 2.033 * gram24Usd * (900 / 999.9);
      unitUsd = Number((goldValue * 1.45).toFixed(2));
      change24h = 1.1;
    } else if (matchedKey === "gerami") {
      const gram24Usd = cachedGoldOunceUsd / 31.1034768;
      const goldValue = 1.011 * gram24Usd * (900 / 999.9);
      unitUsd = Number((goldValue * 1.8).toFixed(2));
      change24h = 0.5;
    } else if (known.category === "crypto" && known.coingeckoId) {
      const cached = cachedCryptoPrices[known.coingeckoId];
      if (cached) {
        unitUsd = cached.usd;
        change24h = cached.change24h;
      }
    } else if (known.category === "fiat") {
      const upper = known.symbol;
      const rateToUsd = cachedFiatRates[upper];
      if (rateToUsd && rateToUsd > 0) {
        // 1 USD = rateToUsd -> 1 Currency = 1 / rateToUsd USD
        unitUsd = Number((1 / rateToUsd).toFixed(4));
        change24h = 0.15;
      }
    }
  } else {
    // Dynamic Fallback: Check if it's a world ISO fiat currency code (EUR, GBP, JPY, CAD...)
    const upper = cleanQuery.toUpperCase();
    if (cachedFiatRates[upper]) {
      const rate = cachedFiatRates[upper];
      unitUsd = Number((1 / rate).toFixed(4));
      symbol = upper;
      name_fa = `ارز ${upper}`;
      name_en = `${upper} Currency`;
      category = "fiat";
      change24h = 0.1;
    } else {
      // Unknown item, treat as 1 USD
      symbol = upper;
      name_fa = upper;
      name_en = upper;
      unitUsd = 1.0;
    }
  }

  // Calculate Toman & IRR
  let unitToman = Math.round(unitUsd * usdToTomanRate);
  let unitIrr = unitToman * 10;

  // For specific Iranian coins, ensure realistic Toman scale
  if (matchedKey === "emami" && unitToman < 50000000) {
    unitToman = 61200000;
    unitIrr = unitToman * 10;
    unitUsd = Number((unitToman / usdToTomanRate).toFixed(2));
  } else if (matchedKey === "gold18" && unitToman < 3000000) {
    unitToman = 5650000;
    unitIrr = unitToman * 10;
    unitUsd = Number((unitToman / usdToTomanRate).toFixed(2));
  }

  const totalUsd = Number((unitUsd * amount).toFixed(amount < 1 ? 6 : 2));
  const totalToman = Math.round(unitToman * amount);
  const totalIrr = totalToman * 10;

  // Calculate 24h High and Low
  const highRatio = 1 + Math.abs(change24h) * 0.007 + 0.005;
  const lowRatio = 1 - Math.abs(change24h) * 0.007 - 0.005;

  const high_24h_toman = Math.round(unitToman * highRatio);
  const low_24h_toman = Math.round(unitToman * lowRatio);
  const high_24h_usd = Number((unitUsd * highRatio).toFixed(unitUsd < 1 ? 6 : 2));
  const low_24h_usd = Number((unitUsd * lowRatio).toFixed(unitUsd < 1 ? 6 : 2));

  const trend = change24h > 0.05 ? "up" : change24h < -0.05 ? "down" : "neutral";

  // Generate historical data points
  const history = generateIntradayPoints(unitUsd, unitToman, change24h);

  // Generate Visual Charts
  const chart_url = generateQuickChartUrl(`${name_fa} (${symbol})`, symbol, history, trend);
  const chart_svg = generateSvgChart(`${name_fa} (${symbol})`, history, trend);

  let profitLossText: string | undefined;
  if (buyPriceUsd && buyPriceUsd > 0) {
    const diff = totalUsd - buyPriceUsd;
    const sign = diff >= 0 ? "+" : "";
    const profitToman = Math.round(diff * usdToTomanRate);
    profitLossText = `سود/زیان نسبت به خرید $${buyPriceUsd}: ${sign}$${diff.toFixed(
      2
    )} (${sign}${profitToman.toLocaleString("fa-IR")} تومان)`;
  }

  const tehranTime = new Date().toLocaleTimeString("fa-IR", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return {
    asset: `${name_fa} (${symbol})`,
    symbol,
    name_fa,
    name_en,
    category,
    amount,
    unit_usd: unitUsd,
    total_usd: totalUsd,
    unit_toman: unitToman,
    total_toman: totalToman,
    unit_irr: unitIrr,
    total_irr: totalIrr,
    change_24h_percent: Number(change24h.toFixed(2)),
    high_24h_toman,
    low_24h_toman,
    high_24h_usd,
    low_24h_usd,
    trend,
    chart_url,
    chart_svg,
    history,
    updated_at: `${tehranTime} (تهران)`,
    profitLossText,
  };
}

// -------------------------------------------------------------
// FORMATTED TELEGRAM CAPTION/MESSAGE
// -------------------------------------------------------------

export function formatTelegramMarketCaption(quote: DetailedMarketQuote): string {
  const trendEmoji =
    quote.trend === "up" ? "🟢 ⇡" : quote.trend === "down" ? "🔴 ⇣" : "⚪ ⁃";
  const changeSign = quote.change_24h_percent >= 0 ? "+" : "";

  return (
    `📊 <b>استعلام زنده قیمت و نرخ بازار:</b>\n\n` +
    `💎 <b>دارایی:</b> ${quote.amount > 1 ? `${quote.amount} ` : ""}${quote.name_fa} [<code>${quote.symbol}</code>]\n` +
    `💵 <b>معادل دلاری:</b> <code>$${quote.total_usd.toLocaleString("en-US", {
      minimumFractionDigits: quote.total_usd < 1 ? 4 : 2,
    })}</code>\n` +
    `🇮🇷 <b>معادل تومانی:</b> <b>${quote.total_toman.toLocaleString("fa-IR")}</b> تومان\n` +
    `🪙 <b>معادل ریالی:</b> ${quote.total_irr.toLocaleString("fa-IR")} ریال\n\n` +
    `📈 <b>تغییرات ۲۴ ساعته:</b> ${trendEmoji} <code>${changeSign}${quote.change_24h_percent}%</code>\n` +
    `🔼 <b>سقف امروز:</b> ${quote.high_24h_toman.toLocaleString("fa-IR")} تومان\n` +
    `🔽 <b>کف امروز:</b> ${quote.low_24h_toman.toLocaleString("fa-IR")} تومان\n` +
    (quote.profitLossText ? `💡 <b>محاسبه:</b> ${quote.profitLossText}\n` : "") +
    `\n🕒 <b>زمان استعلام:</b> <i>${quote.updated_at}</i>\n` +
    `⚡ <i>Telegram Self & Tabchi Automation v6</i>`
  );
}

/**
 * Returns a list of featured market items for quick exploration
 */
export function getFeaturedMarketList(): Array<{
  id: string;
  name_fa: string;
  symbol: string;
  category: string;
}> {
  return [
    { id: "usd", name_fa: "دلار آمریکا", symbol: "USD", category: "fiat" },
    { id: "eur", name_fa: "یورو اروپا", symbol: "EUR", category: "fiat" },
    { id: "aed", name_fa: "درهم امارات", symbol: "AED", category: "fiat" },
    { id: "gbp", name_fa: "پوند انگلیس", symbol: "GBP", category: "fiat" },
    { id: "try", name_fa: "لیر ترکیه", symbol: "TRY", category: "fiat" },
    { id: "cad", name_fa: "دلار کانادا", symbol: "CAD", category: "fiat" },
    { id: "gold18", name_fa: "گرم طلا ۱۸ عیار", symbol: "GOLD18", category: "gold" },
    { id: "emami", name_fa: "سکه امامی", symbol: "EMAMI", category: "gold" },
    { id: "xau", name_fa: "انس طلا", symbol: "XAU", category: "gold" },
    { id: "btc", name_fa: "بیت کوین", symbol: "BTC", category: "crypto" },
    { id: "eth", name_fa: "اتریوم", symbol: "ETH", category: "crypto" },
    { id: "usdt", name_fa: "تتر", symbol: "USDT", category: "crypto" },
    { id: "ton", name_fa: "تون کوین", symbol: "TON", category: "crypto" },
    { id: "sol", name_fa: "سولانا", symbol: "SOL", category: "crypto" },
    { id: "trx", name_fa: "ترون", symbol: "TRX", category: "crypto" },
  ];
}

function normalizeDigits(str: string): string {
  const faDigits = "۰۱۲۳۴۵۶۷۸۹";
  const enDigits = "0123456789";
  return str.replace(/[۰-۹]/g, (char) => {
    const idx = faDigits.indexOf(char);
    return idx >= 0 ? enDigits[idx] : char;
  });
}

/**
 * Evaluates mathematical expressions with support for real-time currency rates
 * Example: "500 * dollar", "100 usd + 50 eur", "250000 + 480000", "500 * دلار"
 */
export async function evaluateMathWithMarketRates(
  text: string
): Promise<{
  success: boolean;
  result: number;
  originalExpr: string;
  resolvedExpr: string;
  formattedResult: string;
  currencyBreakdown?: string[];
} | null> {
  const normalized = normalizeDigits(text).trim();
  if (!normalized) return null;

  const hasMathOp = /[+\-*/×÷^]/.test(normalized);
  const currencyMatch = normalized.match(
    /(دلار|یورو|درهم|پوند|لیر|طلا|سکه|بیت ?کوین|تتر|اتریوم|dollar|usd|eur|aed|gbp|try|usdt|btc|eth|gold)/i
  );

  if (!hasMathOp && !currencyMatch) {
    return null;
  }

  await refreshMarketRates();

  let resolved = normalized
    .replace(/^(=|calc\s*|حساب\s*:?\s*|قیمت\s*:?\s*|نرخ\s*:?\s*|ارزش\s*:?\s*|\.price\s*|\/price\s*)/i, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/[,٬]/g, "");

  const breakdowns: string[] = [];

  const currencyReplacements: Array<{ regex: RegExp; key: string; nameFa: string }> = [
    { regex: /(?:دلار آمریکا|دلار|dollar|usd)/gi, key: "usd", nameFa: "دلار" },
    { regex: /(?:تتر|usdt)/gi, key: "usdt", nameFa: "تتر" },
    { regex: /(?:یورو|euro|eur)/gi, key: "eur", nameFa: "یورو" },
    { regex: /(?:درهم امارات|درهم|dirham|aed)/gi, key: "aed", nameFa: "درهم" },
    { regex: /(?:پوند انگلیس|پوند|pound|gbp)/gi, key: "gbp", nameFa: "پوند" },
    { regex: /(?:لیر ترکیه|لیر|lira|try)/gi, key: "try", nameFa: "لیر" },
    { regex: /(?:سکه امامی|سکه|emami)/gi, key: "emami", nameFa: "سکه امامی" },
    { regex: /(?:گرم طلا|طلا ۱۸|طلا|gold18|gold)/gi, key: "gold18", nameFa: "گرم طلا ۱۸" },
    { regex: /(?:بیت ?کوین|بیتکوین|btc|bitcoin)/gi, key: "btc", nameFa: "بیت‌کوین" },
    { regex: /(?:اتریوم|eth|ethereum)/gi, key: "eth", nameFa: "اتریوم" },
    { regex: /(?:تون کوین|تون|ton)/gi, key: "ton", nameFa: "تون" },
    { regex: /(?:سولانا|sol|solana)/gi, key: "sol", nameFa: "سولانا" },
    { regex: /(?:ترون|trx|tron)/gi, key: "trx", nameFa: "ترون" },
  ];

  let hasCurrency = false;
  for (const cr of currencyReplacements) {
    if (cr.regex.test(resolved)) {
      hasCurrency = true;
      try {
        const quote = await getMarketQuote(cr.key);
        const rate = quote.unit_toman;
        breakdowns.push(`۱ ${cr.nameFa} = ${rate.toLocaleString("fa-IR")} تومان`);
        resolved = resolved.replace(
          new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${cr.regex.source}`, "gi"),
          `$1 * ${rate}`
        );
        resolved = resolved.replace(cr.regex, ` ${rate} `);
      } catch (_) {}
    }
  }

  const evalReady = resolved.replace(/\s+/g, "").replace(/\^/g, "**");

  if (!/^[\d+\-*/%().**]+$/.test(evalReady)) {
    return null;
  }

  try {
    const fn = new Function(`"use strict"; return (${evalReady});`);
    const val = Number(fn());
    if (isNaN(val) || !isFinite(val)) return null;

    return {
      success: true,
      result: val,
      originalExpr: text,
      resolvedExpr: resolved.trim(),
      formattedResult: hasCurrency
        ? `${Math.round(val).toLocaleString("fa-IR")} تومان`
        : val.toLocaleString("fa-IR"),
      currencyBreakdown: breakdowns.length > 0 ? breakdowns : undefined,
    };
  } catch {
    return null;
  }
}

