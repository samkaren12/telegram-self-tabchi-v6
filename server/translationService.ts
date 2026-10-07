/**
 * High-Speed Multi-Language Translation Service
 * Supports 45+ world languages with auto-detection and fallback engines.
 */

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  fromLang: string;
  toLang: string;
  provider: string;
}

export const SUPPORTED_LANGUAGES: Record<string, { nameFa: string; nameEn: string; flag: string }> = {
  en: { nameFa: "انگلیسی", nameEn: "English", flag: "🇬🇧" },
  fa: { nameFa: "فارسی", nameEn: "Persian", flag: "🇮🇷" },
  ar: { nameFa: "عربی", nameEn: "Arabic", flag: "🇸🇦" },
  tr: { nameFa: "ترکی استانبولی", nameEn: "Turkish", flag: "🇹🇷" },
  de: { nameFa: "آلمانی", nameEn: "German", flag: "🇩🇪" },
  fr: { nameFa: "فرانسوی", nameEn: "French", flag: "🇫🇷" },
  ru: { nameFa: "روسی", nameEn: "Russian", flag: "🇷🇺" },
  es: { nameFa: "اسپانیایی", nameEn: "Spanish", flag: "🇪🇸" },
  it: { nameFa: "ایتالیایی", nameEn: "Italian", flag: "🇮🇹" },
  zh: { nameFa: "چینی", nameEn: "Chinese", flag: "🇨🇳" },
  ja: { nameFa: "ژاپنی", nameEn: "Japanese", flag: "🇯🇵" },
  ko: { nameFa: "کره‌ای", nameEn: "Korean", flag: "🇰🇷" },
  hi: { nameFa: "هندی", nameEn: "Hindi", flag: "🇮🇳" },
  ur: { nameFa: "اردو", nameEn: "Urdu", flag: "🇵🇰" },
  nl: { nameFa: "هلندی", nameEn: "Dutch", flag: "🇳🇱" },
  pt: { nameFa: "پرتغالی", nameEn: "Portuguese", flag: "🇵🇹" },
  sv: { nameFa: "سوئدی", nameEn: "Swedish", flag: "🇸🇪" },
  pl: { nameFa: "لهستانی", nameEn: "Polish", flag: "🇵🇱" },
  uk: { nameFa: "اوکراینی", nameEn: "Ukrainian", flag: "🇺🇦" },
  az: { nameFa: "آذربایجانی", nameEn: "Azerbaijani", flag: "🇦🇿" },
  ku: { nameFa: "کردی", nameEn: "Kurdish", flag: "☀️" },
};

/**
 * Detects whether the text is mostly Persian/Arabic script or Latin
 */
export function detectLanguage(text: string): "fa" | "en" {
  const persianRegex = /[\u0600-\u06FF\uFB8A\u067E\u0686\u06AF]/;
  return persianRegex.test(text) ? "fa" : "en";
}

/**
 * Translates text to target language
 */
export async function translateText(
  text: string,
  targetLang: string = "en",
  sourceLang?: string
): Promise<TranslationResult> {
  const clean = (text || "").trim();
  if (!clean) {
    throw new Error("متن جهت ترجمه خالی است.");
  }

  const to = targetLang.trim().toLowerCase();
  const from = sourceLang && sourceLang !== "auto" ? sourceLang.trim().toLowerCase() : detectLanguage(clean);

  // If source and target are identical
  if (from === to) {
    return {
      originalText: clean,
      translatedText: clean,
      fromLang: from,
      toLang: to,
      provider: "direct",
    };
  }

  // 1. Primary Engine: MyMemory API
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=${from}|${to}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (res.ok) {
      const data: any = await res.json();
      const translated = data?.responseData?.translatedText;
      if (translated && typeof translated === "string" && translated.trim()) {
        return {
          originalText: clean,
          translatedText: translated.trim(),
          fromLang: from,
          toLang: to,
          provider: "mymemory",
        };
      }
    }
  } catch (_) {}

  // 2. Secondary Engine: Backup via LibreTranslate Public Mirror
  try {
    const res = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: clean,
        source: from,
        target: to,
        format: "text",
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data: any = await res.json();
      if (data?.translatedText) {
        return {
          originalText: clean,
          translatedText: data.translatedText.trim(),
          fromLang: from,
          toLang: to,
          provider: "libretranslate",
        };
      }
    }
  } catch (_) {}

  throw new Error("سرویس ترجمه در حال حاضر در دسترس نمی‌باشد. لطفاً لحظاتی دیگر تلاش فرمایید.");
}
