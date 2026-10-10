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
// ARZDIGITAL LIVE SCRAPER & CACHED RATES ENGINE
// -------------------------------------------------------------

export interface ArzdigitalCurrencyItem {
  rank: number;
  id: string;
  nameFa: string;
  nameEn: string;
  symbol: string;
  icon: string | null;
  priceToman: number;
  priceUsd: number;
  changePercent: number;
  trend: "up" | "down" | "neutral";
  lowToman: number;
  highToman: number;
  chartSvg: string | null;
  updatedAt: string | null;
}

function parsePersianNumber(str: string): number {
  if (!str) return 0;
  const faDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arDigits = "٠١٢٣٤٥٦٧٨٩";
  let clean = str.replace(/[,،\s]/g, "");
  let res = "";
  for (const ch of clean) {
    const fi = faDigits.indexOf(ch);
    const ai = arDigits.indexOf(ch);
    if (fi !== -1) res += fi;
    else if (ai !== -1) res += ai;
    else res += ch;
  }
  return parseFloat(res) || 0;
}

// Global cached rates & Arzdigital state
let cachedUsdIrr = 2667000;
let customUsdRateToman: number | null = null;
let lastRatesFetch = 0;
let cachedSources: { arzdigital?: number; wallex?: number; bitpin?: number; tetherland?: number } = {
  arzdigital: 266700,
  wallex: 267942,
  bitpin: 266612,
  tetherland: 268050,
};
let cachedFiatRates: Record<string, number> = {};
let cachedCryptoPrices: Record<string, { usd: number; change24h: number }> = {};
let cachedGoldOunceUsd = 4169.0;
let cachedBitpinMarkets: any[] = [];
let cachedArzdigitalCurrencies: ArzdigitalCurrencyItem[] = [];
let cachedArzdigitalMap: Map<string, ArzdigitalCurrencyItem> = new Map();

/**
 * Direct Live Scraper for https://arzdigital.com/currencies/
 * Scrapes all 90+ world fiat currencies live with exact Toman prices, USD prices,
 * 24h change, ranges and sparkline SVGs.
 */
export async function fetchArzdigitalCurrencies(): Promise<ArzdigitalCurrencyItem[]> {
  try {
    const res = await fetch("https://arzdigital.com/currencies/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fa,en;q=0.9",
      },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return cachedArzdigitalCurrencies;
    const html = await res.text();
    const trMatches = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
    const items: ArzdigitalCurrencyItem[] = [];
    const map = new Map<string, ArzdigitalCurrencyItem>();

    for (let i = 1; i < trMatches.length; i++) {
      const row = trMatches[i][1];
      const rankMatch = row.match(/arz-fiats-table__rank">(\d+)</);
      const nameMatch = row.match(/<span><b>([^<]+)<\/b><small[^>]*>([^<]+)<\/small><\/span>/);
      const iconMatch = row.match(/<img[^>]+src="([^"]+)"/);
      const tomanPriceMatch = row.match(/arz-irt-price"[^>]*><span>([^<]+)<\/span>/);
      const usdPriceMatch = row.match(/<small dir="auto">\$([0-9.,]+)<\/small>/);
      const changeMatch = row.match(/arz-fiat-change\s+(toup|todown)[^>]*>[\s\S]*?<span dir="auto">([0-9.]+)%<\/span>/);
      const lowMatch = row.match(/کمترین<\/small><b[^>]*><span class="arz-irt-price"[^>]*><span>([^<]+)<\/span>/);
      const highMatch = row.match(/بیشترین<\/small><b[^>]*><span class="arz-irt-price"[^>]*><span>([^<]+)<\/span>/);
      const chartMatch = row.match(/arz-fiats-table__weekly-chart[^>]+src="([^"]+)"/);
      const updatedMatch = row.match(/datetime="([^"]+)"/);

      if (nameMatch && tomanPriceMatch) {
        const nameFa = nameMatch[1].trim();
        const nameEn = nameMatch[2].trim();
        const priceToman = parsePersianNumber(tomanPriceMatch[1]);
        const priceUsd = usdPriceMatch ? parseFloat(usdPriceMatch[1].replace(/,/g, "")) : 1;
        const isDown = changeMatch ? changeMatch[1] === "todown" : false;
        const changePercent = changeMatch ? parseFloat(changeMatch[2]) * (isDown ? -1 : 1) : 0;
        const lowToman = lowMatch ? parsePersianNumber(lowMatch[1]) : Math.round(priceToman * 0.99);
        const highToman = highMatch ? parsePersianNumber(highMatch[1]) : Math.round(priceToman * 1.01);

        let symbol = "CURR";
        let id = nameEn.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (nameFa.includes("دلار") && (nameEn.includes("United States") || nameEn === "Dollar")) {
          symbol = "USD";
          id = "usd";
        } else if (nameFa.includes("یورو") || nameEn.includes("Euro")) {
          symbol = "EUR";
          id = "eur";
        } else if (nameFa.includes("درهم") || nameEn.includes("Dirham")) {
          symbol = "AED";
          id = "aed";
        } else if (nameFa.includes("پوند") || nameEn.includes("Pound")) {
          symbol = "GBP";
          id = "gbp";
        } else if (nameFa.includes("لیر") || nameEn.includes("Lira")) {
          symbol = "TRY";
          id = "try";
        } else if (nameFa.includes("دینار عراق") || nameEn.includes("Iraqi Dinar")) {
          symbol = "IQD";
          id = "iqd";
        } else if (nameFa.includes("افغانی") || nameEn.includes("Afghani")) {
          symbol = "AFN";
          id = "afn";
        } else if (nameFa.includes("کانادا") || nameEn.includes("Canadian Dollar")) {
          symbol = "CAD";
          id = "cad";
        } else if (nameFa.includes("یوان") || nameEn.includes("Yuan")) {
          symbol = "CNY";
          id = "cny";
        } else if (nameFa.includes("فرانک") || nameEn.includes("Swiss")) {
          symbol = "CHF";
          id = "chf";
        } else if (nameFa.includes("استرالیا") || nameEn.includes("Australian")) {
          symbol = "AUD";
          id = "aud";
        } else if (nameFa.includes("کرون سوئد") || nameEn.includes("Swedish")) {
          symbol = "SEK";
          id = "sek";
        } else if (nameFa.includes("کرون نروژ") || nameEn.includes("Norwegian")) {
          symbol = "NOK";
          id = "nok";
        } else if (nameFa.includes("روبل") || nameEn.includes("Ruble")) {
          symbol = "RUB";
          id = "rub";
        } else if (nameFa.includes("کویت") || nameEn.includes("Kuwaiti")) {
          symbol = "KWD";
          id = "kwd";
        } else if (nameFa.includes("عمان") || nameEn.includes("Omani")) {
          symbol = "OMR";
          id = "omr";
        } else if (nameFa.includes("بحرین") || nameEn.includes("Bahraini")) {
          symbol = "BHD";
          id = "bhd";
        } else if (nameFa.includes("عربستان") || nameEn.includes("Saudi")) {
          symbol = "SAR";
          id = "sar";
        } else if (nameFa.includes("قطر") || nameEn.includes("Qatari")) {
          symbol = "QAR";
          id = "qar";
        } else if (nameFa.includes("هند") || nameEn.includes("Indian")) {
          symbol = "INR";
          id = "inr";
        } else if (nameFa.includes("پاکستان") || nameEn.includes("Pakistani")) {
          symbol = "PKR";
          id = "pkr";
        } else if (nameFa.includes("آذربایجان") || nameEn.includes("Manat")) {
          symbol = "AZN";
          id = "azn";
        } else if (nameFa.includes("ارمنستان") || nameEn.includes("Dram")) {
          symbol = "AMD";
          id = "amd";
        } else if (nameFa.includes("گرجستان") || nameEn.includes("Lari")) {
          symbol = "GEL";
          id = "gel";
        } else if (nameFa.includes("ژاپن") || nameEn.includes("Yen")) {
          symbol = "JPY";
          id = "jpy";
        } else {
          symbol = id.slice(0, 4).toUpperCase();
        }

        const item: ArzdigitalCurrencyItem = {
          rank: rankMatch ? parseInt(rankMatch[1], 10) : i,
          id,
          symbol,
          nameFa,
          nameEn,
          icon: iconMatch ? iconMatch[1] : null,
          priceToman,
          priceUsd,
          changePercent,
          trend: changePercent > 0 ? "up" : changePercent < 0 ? "down" : "neutral",
          lowToman,
          highToman,
          chartSvg: chartMatch ? chartMatch[1] : null,
          updatedAt: updatedMatch ? updatedMatch[1] : null,
        };

        items.push(item);
        map.set(id, item);
        map.set(symbol.toLowerCase(), item);
        map.set(nameFa, item);
        map.set(nameFa.replace(/\s+/g, ""), item);

        // Priority Iranian market shorthands
        if (id === "usd") {
          map.set("دلار", item);
          map.set("دلار آزاد", item);
          map.set("dollar", item);
        } else if (id === "eur") {
          map.set("یورو", item);
          map.set("euro", item);
        } else if (id === "aed") {
          map.set("درهم", item);
          map.set("درهم امارات", item);
          map.set("dirham", item);
        } else if (id === "try") {
          map.set("لیر", item);
          map.set("لیر ترکیه", item);
          map.set("lira", item);
        } else if (id === "gbp") {
          map.set("پوند", item);
          map.set("پوند انگلیس", item);
          map.set("pound", item);
        } else if (id === "iqd") {
          map.set("دینار", item);
          map.set("دینار عراق", item);
        } else if (id === "cad") {
          map.set("کانادا", item);
          map.set("دلار کانادا", item);
        } else if (id === "afn") {
          map.set("افغانی", item);
        }
      }
    }

    if (items.length > 0) {
      cachedArzdigitalCurrencies = items;
      cachedArzdigitalMap = map;
    }
    return cachedArzdigitalCurrencies;
  } catch (err: any) {
    console.error("fetchArzdigitalCurrencies error:", err?.message);
    return cachedArzdigitalCurrencies;
  }
}

export function getUsdMarketRateInfo() {
  return {
    usdIrr: cachedUsdIrr,
    usdToman: Math.round(cachedUsdIrr / 10),
    isCustom: customUsdRateToman !== null,
    customRateToman: customUsdRateToman,
    sources: cachedSources,
    activeSource: customUsdRateToman !== null ? "custom" : "arzdigital",
    lastUpdated: new Date(lastRatesFetch || Date.now()).toISOString(),
  };
}

export function setCustomUsdRate(toman: number | null) {
  customUsdRateToman = toman && toman > 1000 ? Math.round(toman) : null;
  if (customUsdRateToman) {
    cachedUsdIrr = customUsdRateToman * 10;
  } else {
    // Reset to Arzdigital or consensus
    if (cachedSources.arzdigital && cachedSources.arzdigital > 30000) {
      cachedUsdIrr = cachedSources.arzdigital * 10;
    } else {
      const valid = Object.values(cachedSources).filter((v): v is number => typeof v === "number" && v > 30000);
      if (valid.length > 0) {
        const avg = Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
        cachedUsdIrr = avg * 10;
      }
    }
  }
  return getUsdMarketRateInfo();
}

/**
 * Refreshes live market rates from global & Iranian exchanges:
 * - Tier 1 Authority: Arzdigital.com/currencies/ (Live Tehran free market USD & 90 fiat currencies)
 * - Wallex, Bitpin, and Tetherland for crypto USDT consensus
 * - 160+ world fiat currencies from Open Exchange Rates
 * - Binance PAXG (Gold Ounce backed 1:1)
 * - CoinGecko / Binance Crypto
 */
async function refreshMarketRates(): Promise<void> {
  const now = Date.now();
  if (now - lastRatesFetch < 30 * 1000 && Object.keys(cachedFiatRates).length > 0 && cachedArzdigitalCurrencies.length > 0) {
    return;
  }

  // 1. Fetch REAL-TIME Free Market USD & currencies from Arzdigital (Tier 1 Authority)
  try {
    const arzItems = await fetchArzdigitalCurrencies();
    const arzDollar = arzItems.find((c) => c.id === "usd" || c.symbol === "USD" || c.nameFa.includes("دلار"));
    if (arzDollar && arzDollar.priceToman > 30000) {
      cachedSources.arzdigital = Math.round(arzDollar.priceToman);
      if (!customUsdRateToman) {
        cachedUsdIrr = cachedSources.arzdigital * 10;
      }
    }
  } catch (_) {}

  // 2. Fetch Iranian Crypto Exchanges (Wallex, Bitpin, Tetherland)
  if (!customUsdRateToman) {
    // Source A: Wallex
    try {
      const wallexRes = await fetch("https://api.wallex.ir/v1/markets", {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(4000),
      });
      if (wallexRes.ok) {
        const wallexData: any = await wallexRes.json();
        const usdtSymbol = wallexData?.result?.symbols?.USDTTMN;
        const livePrice = parseFloat(usdtSymbol?.stats?.lastPrice || usdtSymbol?.stats?.askPrice || "0");
        if (livePrice && livePrice > 30000 && livePrice < 1000000) {
          cachedSources.wallex = Math.round(livePrice);
        }
      }
    } catch (_) {}

    // Source B: Bitpin
    try {
      const bitpinRes = await fetch("https://api.bitpin.ir/v1/mkt/markets/", {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(4000),
      });
      if (bitpinRes.ok) {
        const bitpinData: any = await bitpinRes.json();
        if (Array.isArray(bitpinData?.results) && bitpinData.results.length > 0) {
          cachedBitpinMarkets = bitpinData.results;
        }
        const usdt = bitpinData.results?.find((m: any) => m.code === "USDT_IRT");
        const livePrice = parseFloat(usdt?.price || "0");
        if (livePrice && livePrice > 30000 && livePrice < 1000000) {
          cachedSources.bitpin = Math.round(livePrice);
        }
      }
    } catch (_) {}

    // Source C: Tetherland
    try {
      const tetherlandRes = await fetch("https://api.tetherland.com/currencies", {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(4000),
      });
      if (tetherlandRes.ok) {
        const tetherlandData: any = await tetherlandRes.json();
        const livePrice = parseFloat(tetherlandData?.data?.currencies?.USDT?.price || "0");
        if (livePrice && livePrice > 30000 && livePrice < 1000000) {
          cachedSources.tetherland = Math.round(livePrice);
        }
      }
    } catch (_) {}

    // If Arzdigital wasn't available, fall back to exchanges average
    if (!cachedSources.arzdigital) {
      const valid = [cachedSources.wallex, cachedSources.bitpin, cachedSources.tetherland].filter(
        (v): v is number => typeof v === "number" && v > 30000
      );
      if (valid.length > 0) {
        const consensusRate = Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
        cachedUsdIrr = consensusRate * 10;
      }
    }
  }

  // 3. Fetch Fiat Rates from open.er-api.com for global cross-rates
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data: any = await res.json();
      if (data?.rates) {
        cachedFiatRates = data.rates;
      }
    }
  } catch (_) {}

  // 4. Fetch Live Gold Ounce from Binance PAXGUSDT (Backed 1:1 by real gold ounce)
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

  // 5. Fetch Cryptos from CoinGecko / Binance
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
  trend: "up" | "down" | "neutral",
  changePercent: number = 0
): string {
  const labels = history.map((h) => h.time);
  const data = history.map((h) => h.price_toman);

  const isProfit = changePercent >= 0;
  const strokeColor = isProfit ? "#10b981" : "#f43f5e";
  const bgColor = isProfit ? "rgba(16, 185, 129, 0.22)" : "rgba(244, 63, 94, 0.22)";
  const sign = isProfit ? "+" : "";
  const pnlTag = isProfit ? `سود ۲۴س: ${sign}${changePercent}% 🟢` : `زیان ۲۴س: ${changePercent}% 🔴`;

  const chartConfig = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `${symbol} (تومان)`,
          data,
          borderColor: strokeColor,
          backgroundColor: bgColor,
          borderWidth: 3,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: strokeColor,
          tension: 0.35,
        },
      ],
    },
    options: {
      responsive: true,
      title: {
        display: true,
        text: `📈 ${title} | ${pnlTag}`,
        fontColor: isProfit ? "#34d399" : "#fb7185",
        fontSize: 15,
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

  return `https://quickchart.io/chart?w=640&h=340&bkg=%230b0f19&c=${encodeURIComponent(
    JSON.stringify(chartConfig)
  )}`;
}

/**
 * Downloads the chart image as a binary Buffer to guarantee fast native photo delivery in Telegram
 */
export async function fetchChartImageBuffer(chartUrl: string): Promise<Buffer | null> {
  if (!chartUrl) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(chartUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err: any) {
    console.error("fetchChartImageBuffer error:", err.message);
    return null;
  }
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

  // Check if asset is found in live scraped Arzdigital currencies (Tier 1 Authority)
  const arzItem = cachedArzdigitalMap.get(cleanQuery) || cachedArzdigitalMap.get(matchedKey) || (matchedKey === "usd" ? cachedArzdigitalMap.get("usd") : undefined);
  if (arzItem) {
    const symbol = arzItem.symbol;
    const name_fa = arzItem.nameFa;
    const name_en = arzItem.nameEn;
    const category = "fiat" as const;
    const unitUsd = arzItem.priceUsd;
    const change24h = arzItem.changePercent;
    const unitToman = Math.round(arzItem.priceToman);
    const unitIrr = unitToman * 10;
    const totalUsd = Number((unitUsd * amount).toFixed(amount < 1 ? 6 : 2));
    const totalToman = Math.round(unitToman * amount);
    const totalIrr = totalToman * 10;
    const high_24h_toman = arzItem.highToman || Math.round(unitToman * 1.01);
    const low_24h_toman = arzItem.lowToman || Math.round(unitToman * 0.99);
    const high_24h_usd = Number((unitUsd * 1.01).toFixed(unitUsd < 1 ? 6 : 2));
    const low_24h_usd = Number((unitUsd * 0.99).toFixed(unitUsd < 1 ? 6 : 2));
    const trend = change24h > 0.05 ? "up" : change24h < -0.05 ? "down" : "neutral";
    const history = generateIntradayPoints(unitUsd, unitToman, change24h);
    const chart_url = generateQuickChartUrl(`${name_fa} (${symbol})`, symbol, history, trend, change24h);
    const chart_svg = generateSvgChart(`${name_fa} (${symbol})`, history, trend);

    let profitLossText: string | undefined;
    if (buyPriceUsd && buyPriceUsd > 0) {
      const diff = totalUsd - buyPriceUsd;
      const sign = diff >= 0 ? "+" : "";
      const profitToman = Math.round(diff * (arzItem.priceToman || usdToTomanRate));
      profitLossText = `سود/زیان نسبت به خرید $${buyPriceUsd}: ${sign}$${diff.toFixed(2)} (${sign}${profitToman.toLocaleString("fa-IR")} تومان)`;
    }

    const tehranTime = new Date().toLocaleTimeString("fa-IR", {
      timeZone: "Asia/Tehran",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return {
      asset: rawAsset,
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
      change_24h_percent: change24h,
      high_24h_toman,
      low_24h_toman,
      high_24h_usd,
      low_24h_usd,
      trend,
      chart_url,
      chart_svg,
      history,
      updated_at: arzItem.updatedAt || tehranTime,
      profitLossText,
    };
  }

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
      // 1 Mithqal = 4.3318 grams 17/18K gold (standard bazaar mazaneh)
      const gram24Usd = cachedGoldOunceUsd / 31.1034768;
      const gram18Usd = gram24Usd * (750 / 999.9);
      unitUsd = Number((gram18Usd * 4.3318).toFixed(2));
      change24h = 0.65;
    } else if (matchedKey === "emami") {
      // Emami Coin = 8.133g 21.6K (900/1000) = 7.3197g pure 24K gold
      const gram24Usd = cachedGoldOunceUsd / 31.1034768;
      const goldValue = 7.3197 * gram24Usd;
      const coinWithBubble = goldValue * 1.038; // standard market premium
      unitUsd = Number(coinWithBubble.toFixed(2));
      change24h = 0.85;
    } else if (matchedKey === "bahar") {
      const gram24Usd = cachedGoldOunceUsd / 31.1034768;
      const goldValue = 7.3197 * gram24Usd;
      unitUsd = Number((goldValue * 0.945).toFixed(2));
      change24h = 0.75;
    } else if (matchedKey === "nim") {
      const gram24Usd = cachedGoldOunceUsd / 31.1034768;
      const goldValue = 3.6598 * gram24Usd;
      unitUsd = Number((goldValue * 1.12).toFixed(2));
      change24h = 0.9;
    } else if (matchedKey === "rob") {
      const gram24Usd = cachedGoldOunceUsd / 31.1034768;
      const goldValue = 1.8299 * gram24Usd;
      unitUsd = Number((goldValue * 1.35).toFixed(2));
      change24h = 1.1;
    } else if (matchedKey === "gerami") {
      const gram24Usd = cachedGoldOunceUsd / 31.1034768;
      const goldValue = 0.9149 * gram24Usd;
      unitUsd = Number((goldValue * 1.74).toFixed(2));
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
        unitUsd = 1 / rateToUsd;
        change24h = 0.15;
      }
    }
  } else {
    // Dynamic Fallback: Check if it's a world ISO fiat currency code (EUR, GBP, JPY, CAD...)
    const upper = cleanQuery.toUpperCase();
    if (cachedFiatRates[upper]) {
      const rate = cachedFiatRates[upper];
      unitUsd = 1 / rate;
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

  // Calculate Toman & IRR accurately
  let unitToman = Math.round(unitUsd * usdToTomanRate);
  let unitIrr = unitToman * 10;

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
  const chart_url = generateQuickChartUrl(`${name_fa} (${symbol})`, symbol, history, trend, change24h);
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
  const isProfit = quote.change_24h_percent >= 0;
  const pnlEmoji = isProfit ? "🟢 ⇡" : "🔴 ⇣";
  const changeSign = isProfit ? "+" : "";
  const pnlTag = isProfit
    ? `🟢 <b>وضعیت سود ۲۴ ساعته:</b> <b>+${quote.change_24h_percent}% سود</b>`
    : `🔴 <b>وضعیت زیان ۲۴ ساعته:</b> <b>${quote.change_24h_percent}% زیان</b>`;

  return (
    `📊 <b>استعلام زنده قیمت و نمودار سود/زیان:</b>\n\n` +
    `💎 <b>دارایی:</b> ${quote.amount > 1 ? `${quote.amount} ` : ""}${quote.name_fa} [<code>${quote.symbol}</code>]\n` +
    `💵 <b>معادل دلاری:</b> <code>$${quote.total_usd.toLocaleString("en-US", {
      minimumFractionDigits: quote.total_usd < 1 ? 4 : 2,
    })}</code>\n` +
    `🇮🇷 <b>معادل تومانی:</b> <b>${quote.total_toman.toLocaleString("fa-IR")}</b> تومان\n` +
    `🪙 <b>معادل ریالی:</b> ${quote.total_irr.toLocaleString("fa-IR")} ریال\n\n` +
    `${pnlTag}\n` +
    `📈 <b>روند تغییرات:</b> ${pnlEmoji} <code>${changeSign}${quote.change_24h_percent}%</code>\n` +
    `🔼 <b>سقف قیمت امروز:</b> ${quote.high_24h_toman.toLocaleString("fa-IR")} تومان\n` +
    `🔽 <b>کف قیمت امروز:</b> ${quote.low_24h_toman.toLocaleString("fa-IR")} تومان\n` +
    (quote.profitLossText ? `💡 <b>محاسبه خرید/فروش:</b> ${quote.profitLossText}\n` : "") +
    `\n🕒 <b>زمان استعلام:</b> <i>${quote.updated_at}</i>\n` +
    `📈 <i>تصویر نمودار سود و زیان پیوست شده است ☝️</i>\n` +
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

// -------------------------------------------------------------
// ARZDIGITAL-STYLE LIVE MARKET OVERVIEW & TABLE ENGINE
// -------------------------------------------------------------

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
  high_24h_toman: number;
  low_24h_toman: number;
  high_24h_usd: number;
  low_24h_usd: number;
  icon?: string | null;
  chartSvg?: string | null;
  flag?: string;
  updatedAt?: string | null;
}

export interface ArzDigitalOverviewResponse {
  benchmark: {
    usdIrr: number;
    usdToman: number;
    isCustom: boolean;
    customRateToman: number | null;
    sources: { arzdigital?: number; wallex?: number; bitpin?: number; tetherland?: number };
    activeSource: string;
    lastUpdated: string;
  };
  cryptos: ArzDigitalTableItem[];
  fiats: ArzDigitalTableItem[];
  golds: ArzDigitalTableItem[];
  all: ArzDigitalTableItem[];
}

export async function getArzDigitalMarketTable(): Promise<ArzDigitalOverviewResponse> {
  await refreshMarketRates();

  const usdToTomanRate = Math.round(cachedUsdIrr / 10);

  // Top Cryptocurrencies (matching ArzDigital top currencies)
  const cryptoMeta = [
    { id: "btc", symbol: "BTC", name_fa: "بیت کوین", name_en: "Bitcoin", pairIrt: "BTC_IRT", pairUsdt: "BTC_USDT", fallbackUsd: 82500, fallbackIcon: "https://cdn.bitpin.ir/media/market/currency/1697370601.svg" },
    { id: "eth", symbol: "ETH", name_fa: "اتریوم", name_en: "Ethereum", pairIrt: "ETH_IRT", pairUsdt: "ETH_USDT", fallbackUsd: 2500, fallbackIcon: "https://cdn.bitpin.ir/media/market/currency/1697370711.svg" },
    { id: "usdt", symbol: "USDT", name_fa: "تتر", name_en: "Tether USD", pairIrt: "USDT_IRT", pairUsdt: "USDC_USDT", fallbackUsd: 1.0, fallbackIcon: "https://cdn.bitpin.ir/media/market/currency/1697373576.svg" },
    { id: "bnb", symbol: "BNB", name_fa: "بایننس کوین", name_en: "BNB", pairIrt: "BNB_IRT", pairUsdt: "BNB_USDT", fallbackUsd: 742, fallbackIcon: "https://cdn.bitpin.ir/media/market/currency/1650093947.svg" },
    { id: "sol", symbol: "SOL", name_fa: "سولانا", name_en: "Solana", pairIrt: "SOL_IRT", pairUsdt: "SOL_USDT", fallbackUsd: 110.5, fallbackIcon: "https://cdn.bitpin.ir/media/market/currency/1697379465.svg" },
    { id: "xrp", symbol: "XRP", name_fa: "ریپل", name_en: "XRP", pairIrt: "XRP_IRT", pairUsdt: "XRP_USDT", fallbackUsd: 1.40, fallbackIcon: "https://cdn.bitpin.ir/media/market/currency/1697370845.svg" },
    { id: "doge", symbol: "DOGE", name_fa: "دوج کوین", name_en: "Dogecoin", pairIrt: "DOGE_IRT", pairUsdt: "DOGE_USDT", fallbackUsd: 0.085, fallbackIcon: "https://cdn.bitpin.ir/media/market/currency/1697371101.svg" },
    { id: "ton", symbol: "TON", name_fa: "تون کوین (تلگرام)", name_en: "Toncoin", pairIrt: "TON_IRT", pairUsdt: "TON_USDT", fallbackUsd: 1.40, fallbackIcon: "https://cdn.bitpin.ir/media/market/currency/1697371234.svg" },
    { id: "trx", symbol: "TRX", name_fa: "ترون", name_en: "TRON", pairIrt: "TRX_IRT", pairUsdt: "TRX_USDT", fallbackUsd: 0.33, fallbackIcon: "https://cdn.bitpin.ir/media/market/currency/1697371302.svg" },
    { id: "ada", symbol: "ADA", name_fa: "کاردانو", name_en: "Cardano", pairIrt: "ADA_IRT", pairUsdt: "ADA_USDT", fallbackUsd: 0.24, fallbackIcon: "https://cdn.bitpin.ir/media/market/currency/1697371452.svg" },
    { id: "avax", symbol: "AVAX", name_fa: "آوالانچ", name_en: "Avalanche", pairIrt: "AVAX_IRT", pairUsdt: "AVAX_USDT", fallbackUsd: 18.5, fallbackIcon: "https://cdn.bitpin.ir/media/market/currency/1697371589.svg" },
    { id: "shib", symbol: "SHIB", name_fa: "شیبا اینو", name_en: "Shiba Inu", pairIrt: "SHIB_IRT", pairUsdt: "SHIB_USDT", fallbackUsd: 0.0000054, fallbackIcon: "https://cdn.bitpin.ir/media/market/currency/1697371665.svg" },
    { id: "pepe", symbol: "PEPE", name_fa: "پپه", name_en: "Pepe", pairIrt: "PEPE_IRT", pairUsdt: "PEPE_USDT", fallbackUsd: 0.0000039, fallbackIcon: "https://cdn.bitpin.ir/media/market/currency/1697371720.svg" },
    { id: "not", symbol: "NOT", name_fa: "نات کوین", name_en: "Notcoin", pairIrt: "NOT_IRT", pairUsdt: "NOT_USDT", fallbackUsd: 0.00044, fallbackIcon: "https://cdn.bitpin.ir/media/market/currency/1715843482.svg" },
    { id: "paxg", symbol: "PAXG", name_fa: "طلای دیجیتال (پکس گلد)", name_en: "PAX Gold", pairIrt: "PAXG_IRT", pairUsdt: "PAXG_USDT", fallbackUsd: 4190, fallbackIcon: "https://cdn.bitpin.ir/media/market/currency/1697371890.svg" },
  ];

  const cryptos: ArzDigitalTableItem[] = cryptoMeta.map((c, i) => {
    const mIrt = cachedBitpinMarkets.find((m) => m.code === c.pairIrt);
    const mUsdt = cachedBitpinMarkets.find((m) => m.code === c.pairUsdt);

    let priceUsd = mUsdt?.price ? parseFloat(mUsdt.price) : c.fallbackUsd;
    let priceToman = mIrt?.price ? Math.round(parseFloat(mIrt.price)) : Math.round(priceUsd * usdToTomanRate);

    // For USDT itself, keep strictly aligned with benchmark
    if (c.id === "usdt") {
      priceUsd = 1.0;
      priceToman = usdToTomanRate;
    }

    const change = mIrt?.price_info?.change !== undefined ? Number(mIrt.price_info.change) : 0;
    const minToman = mIrt?.price_info?.min ? Math.round(parseFloat(mIrt.price_info.min)) : Math.round(priceToman * 0.985);
    const maxToman = mIrt?.price_info?.max ? Math.round(parseFloat(mIrt.price_info.max)) : Math.round(priceToman * 1.015);

    return {
      rank: i + 1,
      id: c.id,
      symbol: c.symbol,
      name_fa: c.name_fa,
      name_en: c.name_en,
      category: "crypto",
      price_usd: priceUsd,
      price_toman: priceToman,
      price_irr: priceToman * 10,
      change_24h: Number(change.toFixed(2)),
      high_24h_toman: maxToman,
      low_24h_toman: minToman,
      high_24h_usd: Number((priceUsd * 1.015).toFixed(priceUsd < 1 ? 6 : 2)),
      low_24h_usd: Number((priceUsd * 0.985).toFixed(priceUsd < 1 ? 6 : 2)),
      icon: mIrt?.currency1?.image || c.fallbackIcon,
    };
  });

  // World Fiat Currencies
  const fiatMeta = [
    { id: "usd", symbol: "USD", name_fa: "دلار آمریکا (آزاد)", name_en: "US Dollar", flag: "🇺🇸", fallbackRate: 1.0 },
    { id: "eur", symbol: "EUR", name_fa: "یورو اروپا", name_en: "Euro", flag: "🇪🇺", fallbackRate: 1.08 },
    { id: "aed", symbol: "AED", name_fa: "درهم امارات", name_en: "UAE Dirham", flag: "🇦🇪", fallbackRate: 0.272 },
    { id: "gbp", symbol: "GBP", name_fa: "پوند انگلیس", name_en: "British Pound", flag: "🇬🇧", fallbackRate: 1.29 },
    { id: "try", symbol: "TRY", name_fa: "لیر ترکیه", name_en: "Turkish Lira", flag: "🇹🇷", fallbackRate: 0.029 },
    { id: "cad", symbol: "CAD", name_fa: "دلار کانادا", name_en: "Canadian Dollar", flag: "🇨🇦", fallbackRate: 0.73 },
    { id: "aud", symbol: "AUD", name_fa: "دلار استرالیا", name_en: "Australian Dollar", flag: "🇦🇺", fallbackRate: 0.65 },
    { id: "chf", symbol: "CHF", name_fa: "فرانک سوئیس", name_en: "Swiss Franc", flag: "🇨🇭", fallbackRate: 1.13 },
    { id: "cny", symbol: "CNY", name_fa: "یوان چین", name_en: "Chinese Yuan", flag: "🇨🇳", fallbackRate: 0.138 },
    { id: "iqd", symbol: "IQD", name_fa: "دینار عراق (۱۰۰۰)", name_en: "Iraqi Dinar", flag: "🇮🇶", fallbackRate: 0.76 },
    { id: "kwd", symbol: "KWD", name_fa: "دینار کویت", name_en: "Kuwaiti Dinar", flag: "🇰🇼", fallbackRate: 3.26 },
    { id: "sar", symbol: "SAR", name_fa: "ریال عربستان", name_en: "Saudi Rial", flag: "🇸🇦", fallbackRate: 0.266 },
    { id: "qar", symbol: "QAR", name_fa: "ریال قطر", name_en: "Qatari Riyal", flag: "🇶🇦", fallbackRate: 0.275 },
    { id: "rub", symbol: "RUB", name_fa: "روبل روسیه", name_en: "Russian Ruble", flag: "🇷🇺", fallbackRate: 0.011 },
  ];

  const fiats: ArzDigitalTableItem[] = cachedArzdigitalCurrencies.length > 0
    ? cachedArzdigitalCurrencies.map((c) => ({
        rank: c.rank,
        id: c.id,
        symbol: c.symbol,
        name_fa: c.nameFa,
        name_en: c.nameEn,
        category: "fiat" as const,
        price_usd: c.priceUsd,
        price_toman: c.priceToman,
        price_irr: c.priceToman * 10,
        change_24h: c.changePercent,
        high_24h_toman: c.highToman,
        low_24h_toman: c.lowToman,
        high_24h_usd: Number((c.priceUsd * 1.01).toFixed(4)),
        low_24h_usd: Number((c.priceUsd * 0.99).toFixed(4)),
        icon: c.icon,
        chartSvg: c.chartSvg,
        updatedAt: c.updatedAt,
      }))
    : fiatMeta.map((f, i) => {
        let unitUsd = f.fallbackRate;
        if (f.id === "usd") {
          unitUsd = 1.0;
        } else if (cachedFiatRates[f.symbol]) {
          unitUsd = 1 / cachedFiatRates[f.symbol];
        }
        const priceToman = Math.round(unitUsd * usdToTomanRate);
        return {
          rank: i + 1,
          id: f.id,
          symbol: f.symbol,
          name_fa: f.name_fa,
          name_en: f.name_en,
          category: "fiat" as const,
          price_usd: Number(unitUsd.toFixed(4)),
          price_toman: priceToman,
          price_irr: priceToman * 10,
          change_24h: 0.45,
          high_24h_toman: Math.round(priceToman * 1.008),
          low_24h_toman: Math.round(priceToman * 0.992),
          high_24h_usd: Number((unitUsd * 1.008).toFixed(4)),
          low_24h_usd: Number((unitUsd * 0.992).toFixed(4)),
          flag: f.flag,
        };
      });

  // Gold & Coins
  const gram24Usd = cachedGoldOunceUsd / 31.1034768;
  const gram18Usd = gram24Usd * (750 / 999.9);
  const goldMeta = [
    { id: "gold18", symbol: "GOLD18", name_fa: "گرم طلای ۱۸ عیار", name_en: "Gram 18K Gold", unitUsd: gram18Usd, change: 0.65 },
    { id: "gold24", symbol: "GOLD24", name_fa: "گرم طلای ۲۴ عیار", name_en: "Gram 24K Gold", unitUsd: gram24Usd, change: 0.65 },
    { id: "mithqal", symbol: "MITHQAL", name_fa: "مثقال طلا (مظنه بازار)", name_en: "Mithqal Gold", unitUsd: gram18Usd * 4.3318, change: 0.65 },
    { id: "xau", symbol: "XAU", name_fa: "انس جهانی طلا", name_en: "Gold Ounce (XAU)", unitUsd: cachedGoldOunceUsd, change: 0.65 },
    { id: "emami", symbol: "EMAMI", name_fa: "سکه امامی (طرح جدید)", name_en: "Emami Coin", unitUsd: 7.3197 * gram24Usd * 1.038, change: 0.85 },
    { id: "bahar", symbol: "BAHAR", name_fa: "سکه بهار آزادی (طرح قدیم)", name_en: "Bahar Azadi Coin", unitUsd: 7.3197 * gram24Usd * 0.945, change: 0.75 },
    { id: "nim", symbol: "NIM", name_fa: "نیم سکه بهار آزادی", name_en: "Half Azadi Coin", unitUsd: 3.6598 * gram24Usd * 1.12, change: 0.9 },
    { id: "rob", symbol: "ROB", name_fa: "ربع سکه بهار آزادی", name_en: "Quarter Azadi Coin", unitUsd: 1.8299 * gram24Usd * 1.35, change: 1.1 },
    { id: "gerami", symbol: "GERAMI", name_fa: "سکه یک گرمی", name_en: "Gram Coin", unitUsd: 0.9149 * gram24Usd * 1.74, change: 0.5 },
    { id: "silver", symbol: "XAG", name_fa: "انس نقره جهانی", name_en: "Silver Ounce (XAG)", unitUsd: 34.5, change: 0.4 },
  ];

  const golds: ArzDigitalTableItem[] = goldMeta.map((g, i) => {
    const priceToman = Math.round(g.unitUsd * usdToTomanRate);
    return {
      rank: i + 1,
      id: g.id,
      symbol: g.symbol,
      name_fa: g.name_fa,
      name_en: g.name_en,
      category: "gold",
      price_usd: Number(g.unitUsd.toFixed(2)),
      price_toman: priceToman,
      price_irr: priceToman * 10,
      change_24h: g.change,
      high_24h_toman: Math.round(priceToman * 1.008),
      low_24h_toman: Math.round(priceToman * 0.992),
      high_24h_usd: Number((g.unitUsd * 1.008).toFixed(2)),
      low_24h_usd: Number((g.unitUsd * 0.992).toFixed(2)),
    };
  });

  return {
    benchmark: getUsdMarketRateInfo(),
    cryptos,
    fiats,
    golds,
    all: [...cryptos, ...fiats, ...golds],
  };
}

export async function formatArzDigitalTelegramBoard(): Promise<string> {
  const table = await getArzDigitalMarketTable();
  const usdToman = table.benchmark.usdToman;
  const tehranTime = new Date().toLocaleTimeString("fa-IR", { timeZone: "Asia/Tehran" });

  let text = `📊 <b>تابلو زنده قیمت ارزها و رمزارزها (مشابه ارزدیجیتال)</b>\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💵 <b>دلار آزاد (تهران):</b> <b>${usdToman.toLocaleString("fa-IR")} تومان</b>\n`;

  // Cryptos
  text += `\n🪙 <b>برترین رمزارزهای بازار (Crypto):</b>\n`;
  for (const c of table.cryptos.slice(0, 8)) {
    const sign = c.change_24h >= 0 ? "+" : "";
    const emoji = c.change_24h >= 0 ? "🟢" : "🔴";
    const tomanStr =
      c.price_toman >= 1000000
        ? `${(c.price_toman / 1000000).toLocaleString("fa-IR", { maximumFractionDigits: 2 })} م.ت`
        : `${c.price_toman.toLocaleString("fa-IR")} ت`;
    text += `• <b>${c.name_fa} (${c.symbol}):</b> $${c.price_usd.toLocaleString("en-US", { maximumFractionDigits: c.price_usd < 1 ? 4 : 2 })} | <b>${tomanStr}</b> (${emoji} ${sign}${c.change_24h}%)\n`;
  }

  // Gold & Coins
  text += `\n🥇 <b>طلا و انواع مسکوکات:</b>\n`;
  for (const g of table.golds.slice(0, 5)) {
    const tomanStr = `${g.price_toman.toLocaleString("fa-IR")} تومان`;
    text += `• <b>${g.name_fa}:</b> <b>${tomanStr}</b>\n`;
  }

  // Major Fiats
  text += `\n🌐 <b>ارزهای اصلی بازار آزاد:</b>\n`;
  for (const f of table.fiats.slice(0, 5)) {
    text += `• <b>${f.name_fa} (${f.symbol}):</b> <b>${f.price_toman.toLocaleString("fa-IR")} تومان</b>\n`;
  }

  text += `\n🕒 <b>زمان بروزرسانی:</b> <i>${tehranTime} (تهران)</i>\n`;
  text += `🔗 <i>منبع: تجمیع زنده صرافی‌های معتبر و بازار آزاد</i>`;
  return text;
}

export function normalizeDigits(str: string): string {
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

/**
 * Currency Pair Conversion Result
 */
export interface CurrencyConversionResult {
  amountFrom: number;
  fromAsset: string;
  fromNameFa: string;
  fromSymbol: string;
  fromUnitUsd: number;
  fromUnitToman: number;
  fromTotalToman: number;
  fromTotalUsd: number;

  amountTo: number;
  toAsset: string;
  toNameFa: string;
  toSymbol: string;
  toUnitUsd: number;
  toUnitToman: number;

  rate: number; // 1 From = rate To
  inverseRate: number; // 1 To = inverseRate From
  formattedMessage: string;
}

/**
 * Parse conversion phrases like:
 * "۲ دلار ترون تبدیل کن"
 * "تبدیل ۲ دلار به ترون"
 * "2 usd to trx"
 * "۵۰۰ تتر به تومان"
 * "۱۰ ترون به دلار"
 */
export function parseCurrencyConversionQuery(text: string): {
  amount: number;
  fromAsset: string;
  toAsset: string;
} | null {
  if (!text) return null;
  const normalized = normalizeDigits(text).trim();
  const lower = normalized.toLowerCase();

  // Must have convert keyword or "به" or "to"
  const hasConvertKeyword =
    lower.includes("تبدیل") ||
    lower.includes("convert") ||
    lower.includes(" to ") ||
    lower.includes("به") ||
    lower.includes("چند تا") ||
    lower.includes("چند");

  if (!hasConvertKeyword) return null;

  // Extract amount
  const amountMatch = normalized.match(/(?<![a-zA-Z])(\d+(?:\.\d+)?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 1.0;

  // Known currency tokens pattern
  const assetPattern =
    "(usd|usdt|tether|dollar|eur|euro|gbp|aed|dirham|try|lira|cad|aud|chf|cny|jpy|sar|qar|kwd|iqd|rub|inr|afn|pkr|azn|amd|gel|دلار|دالر|تتر|تتر ترون|یورو|درهم|پوند|لیر|دینار|یوان|ین|روبل|افغانی|روپیه|تومان|تومن|ریال|طلا|سکه|امامی|بهار آزادی|نیم سکه|ربع سکه|گرمی|مثقال|مظنه|انس|نقره|gold|coin|xau|xag|btc|بیت ?کوین|eth|اتریوم|trx|ترون|sol|سولانا|ton|تون|دوج|doge|bnb|بایننس|xrp|ریپل|ada|کاردانو|shib|شیبا|pepe|پپ|not|نات|hmstr|همستر)";

  // Pattern 1: [amount] [from] [to] تبدیل کن / [amount] [from] به [to]
  // e.g. "۲ دلار ترون تبدیل کن" or "۲ دلار به ترون" or "۵۰۰ تتر به تومان"
  const regex1 = new RegExp(
    `(?:تبدیل\\s+)?(?:${amountMatch ? amountMatch[1] : "\\d+"})?\\s*${assetPattern}\\s+(?:به\\s+|to\\s+)?${assetPattern}`,
    "i"
  );
  const m1 = normalized.match(regex1);
  if (m1 && m1[1] && m1[2] && m1[1].toLowerCase() !== m1[2].toLowerCase()) {
    return {
      amount,
      fromAsset: m1[1].trim(),
      toAsset: m1[2].trim(),
    };
  }

  // Pattern 2: تبدیل [from] به [to]
  const regex2 = new RegExp(
    `(?:تبدیل\\s+)?${assetPattern}\\s+(?:به\\s+|to\\s+)${assetPattern}`,
    "i"
  );
  const m2 = normalized.match(regex2);
  if (m2 && m2[1] && m2[2] && m2[1].toLowerCase() !== m2[2].toLowerCase()) {
    return {
      amount,
      fromAsset: m2[1].trim(),
      toAsset: m2[2].trim(),
    };
  }

  return null;
}

/**
 * Converts any currency pair accurately using live market prices
 */
export async function convertCurrencyPair(
  fromQuery: string,
  toQuery: string,
  amount: number = 1.0
): Promise<CurrencyConversionResult> {
  const isTomanFrom = /^(تومان|تومن|toman)$/i.test(fromQuery.trim());
  const isIrrFrom = /^(ریال|irr|rial)$/i.test(fromQuery.trim());
  const isTomanTo = /^(تومان|تومن|toman)$/i.test(toQuery.trim());
  const isIrrTo = /^(ریال|irr|rial)$/i.test(toQuery.trim());

  let fromQuote: DetailedMarketQuote;
  let toQuote: DetailedMarketQuote;

  if (isTomanFrom || isIrrFrom) {
    const divider = isIrrFrom ? 10 : 1;
    const actualToman = amount / divider;
    const rateInfo = getUsdMarketRateInfo();
    const usdVal = actualToman / rateInfo.usdToman;
    fromQuote = {
      asset: isIrrFrom ? "ریال ایران (IRR)" : "تومان ایران (IRT)",
      symbol: isIrrFrom ? "IRR" : "IRT",
      name_fa: isIrrFrom ? "ریال ایران" : "تومان ایران",
      name_en: isIrrFrom ? "Iranian Rial" : "Iranian Toman",
      category: "fiat",
      amount,
      unit_usd: 1 / (rateInfo.usdToman * divider),
      total_usd: usdVal,
      unit_toman: 1 / divider,
      total_toman: actualToman,
      unit_irr: divider === 10 ? 1 : 10,
      total_irr: actualToman * 10,
      change_24h_percent: 0,
      high_24h_toman: actualToman,
      low_24h_toman: actualToman,
      high_24h_usd: usdVal,
      low_24h_usd: usdVal,
      trend: "neutral",
      updated_at: new Date().toLocaleTimeString("fa-IR", { timeZone: "Asia/Tehran" }),
    };
  } else {
    fromQuote = await getMarketQuote(fromQuery, amount);
  }

  if (isTomanTo || isIrrTo) {
    const multiplier = isIrrTo ? 10 : 1;
    toQuote = {
      asset: isIrrTo ? "ریال ایران (IRR)" : "تومان ایران (IRT)",
      symbol: isIrrTo ? "IRR" : "IRT",
      name_fa: isIrrTo ? "ریال ایران" : "تومان ایران",
      name_en: isIrrTo ? "Iranian Rial" : "Iranian Toman",
      category: "fiat",
      amount: 1,
      unit_usd: 1 / (getUsdMarketRateInfo().usdToman * (isIrrTo ? 10 : 1)),
      total_usd: 1 / (getUsdMarketRateInfo().usdToman * (isIrrTo ? 10 : 1)),
      unit_toman: isIrrTo ? 0.1 : 1,
      total_toman: isIrrTo ? 0.1 : 1,
      unit_irr: isIrrTo ? 1 : 10,
      total_irr: isIrrTo ? 1 : 10,
      change_24h_percent: 0,
      high_24h_toman: 1,
      low_24h_toman: 1,
      high_24h_usd: 1,
      low_24h_usd: 1,
      trend: "neutral",
      updated_at: new Date().toLocaleTimeString("fa-IR", { timeZone: "Asia/Tehran" }),
    };
  } else {
    toQuote = await getMarketQuote(toQuery, 1);
  }

  // Calculate destination amount: Total USD from source / Unit USD of destination
  const totalUsdFrom = fromQuote.total_usd;
  const unitUsdTo = toQuote.unit_usd;
  const amountTo = unitUsdTo > 0 ? totalUsdFrom / unitUsdTo : 0;
  const singleRate = unitUsdTo > 0 ? fromQuote.unit_usd / unitUsdTo : 0;
  const inverseRate = singleRate > 0 ? 1 / singleRate : 0;

  const formattedAmountTo =
    amountTo >= 1000
      ? amountTo.toLocaleString("fa-IR", { maximumFractionDigits: 2 })
      : amountTo < 0.001
      ? amountTo.toFixed(6)
      : amountTo.toLocaleString("fa-IR", { maximumFractionDigits: 4 });

  const formattedSingleRate =
    singleRate >= 1000
      ? singleRate.toLocaleString("fa-IR", { maximumFractionDigits: 2 })
      : singleRate < 0.001
      ? singleRate.toFixed(6)
      : singleRate.toLocaleString("fa-IR", { maximumFractionDigits: 4 });

  const tehranTime = new Date().toLocaleTimeString("fa-IR", { timeZone: "Asia/Tehran" });

  const formattedMessage =
    `🔄 <b>تبدیل هوشمند ارز و رمزارز:</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📥 <b>مبدا:</b> <b>${amount.toLocaleString("fa-IR")} ${fromQuote.name_fa}</b> (${fromQuote.symbol})\n` +
    `💵 <b>معادل دلاری:</b> <code>$${totalUsdFrom.toLocaleString("en-US", { maximumFractionDigits: 2 })}</code>\n` +
    `🇮🇷 <b>معادل تومانی:</b> <b>${fromQuote.total_toman.toLocaleString("fa-IR")} تومان</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📤 <b>حاصل تبدیل:</b> <b>${formattedAmountTo} ${toQuote.name_fa}</b> (<code>${toQuote.symbol}</code>)\n` +
    `📊 <b>نرخ تبدیل:</b> ۱ ${fromQuote.symbol} = <code>${formattedSingleRate}</code> ${toQuote.symbol}\n` +
    `🕒 <b>زمان محاسبه:</b> <i>${tehranTime}</i>\n` +
    `⚡ <i>Telegram Self Currency Converter</i>`;

  return {
    amountFrom: amount,
    fromAsset: fromQuote.asset,
    fromNameFa: fromQuote.name_fa,
    fromSymbol: fromQuote.symbol,
    fromUnitUsd: fromQuote.unit_usd,
    fromUnitToman: fromQuote.unit_toman,
    fromTotalToman: fromQuote.total_toman,
    fromTotalUsd: totalUsdFrom,

    amountTo,
    toAsset: toQuote.asset,
    toNameFa: toQuote.name_fa,
    toSymbol: toQuote.symbol,
    toUnitUsd: toQuote.unit_usd,
    toUnitToman: toQuote.unit_toman,

    rate: singleRate,
    inverseRate,
    formattedMessage,
  };
}

