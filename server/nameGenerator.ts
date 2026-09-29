import { BatchNamingLanguage, BatchThemeTopic } from "../src/types.js";

interface NameThemeDictionary {
  prefixes: string[];
  bases: string[];
  suffixes: string[];
  abouts: string[];
}

const faDict: Record<BatchThemeTopic, NameThemeDictionary> = {
  crypto: {
    prefixes: ["کانال سیگنال", "آکادمی", "ترید برتر", "دنیای کریپتو", "هاب معاملاتی", "کانون رمزارز", "تحلیلگران"],
    bases: ["بیت‌کوین و تتر", "آلت‌کوین‌های پرپتانسیل", "کریپتو VIP", "سیگنال فیوچرز", "سبدگردانی دیجیتال", "بلاک‌چین ایران", "تکنیکال کریپتو"],
    suffixes: ["ایران", "VIP", "پرو", "رسمی", "پیشرو", "آنلاین", "پلاس"],
    abouts: [
      "مرجع تحلیل‌های تکنیکال و فاندامنتال بازار ارزهای دیجیتال و سیگنال‌های VIP.",
      "آموزش رایگان و تحلیل روزانه ارزهای پرنوسان و مدیریت سرمایه در فیوچرز.",
      "پوشش جدیدترین اخبار کریپتوکارنسی، ایردراپ‌ها و روندهای سودآور بازار جهانی.",
    ],
  },
  tech: {
    prefixes: ["کانون فناوری", "مرجع کدنویسی", "دنیای آی‌تی", "تک شو", "آکادمی هوش مصنوعی", "سایبر هاب"],
    bases: ["توسعه‌دهندگان وب", "برنامه‌نویسی پایتون و لینوکس", "هوش مصنوعی و یادگیری ماشین", "گجت‌ها و تکنولوژی", "شبکه و امنیت سایبری"],
    suffixes: ["نوین", "توسعه", "لبز", "کلاب", "۲۰۲۶", "مدرن"],
    abouts: [
      "جدیدترین اخبار دنیای تکنولوژی، معرفی ابزارهای مدرن برنامه‌نویسی و هوش مصنوعی.",
      "جامعه متخصصان فناوری، منابع آموزشی کاربردی و آموزش‌های ویدئویی تخصصی.",
    ],
  },
  business: {
    prefixes: ["کانون کارآفرینی", "بیزینس کلاب", "شبکه بازاریابی", "هاب تجارت", "آکادمی فروش"],
    bases: ["کسب‌و‌کار دیجیتال", "استارتاپ‌های موفق", "مارکتینگ و برندینگ", "سرمایه‌گذاری نوین", "فروش مستقیم"],
    suffixes: ["ایران", "نخبه", "برتر", "VIP", "پیشرو"],
    abouts: [
      "نکات کلیدی برای رشد سریع کسب‌و‌کار، توسعه فردی و استراتژی‌های مدرن فروش دیجیتال.",
      "آموزش مدیریت تیم، هوشمندی مالی و تبدیل ایده‌ها به جریان‌های درآمدی پایدار.",
    ],
  },
  gaming: {
    prefixes: ["کلاب گیمرها", "هاب بازی", "جامعه استریمرها", "گیم استیشن", "کانون بتل رویال"],
    bases: ["کالاف دیوتی و پابجی", "پلی‌استیشن و پی‌سی", "وارزون و جی‌تی‌ای", "گیمرهای حرفه‌ای", "استریم و هایلایت"],
    suffixes: ["ایران", "کلن", "تیم", "پرو", "آنلاین"],
    abouts: [
      "دورهمی گیمرهای حرفه‌ای، اخبار آپدیت‌های بازی‌ها و برگزاری روم‌های جایزه‌دار.",
      "بهترین هایلایت‌ها، آموزش تنظیمات کنترل و سنسیویتی و معرفی بازی‌های برتر.",
    ],
  },
  entertainment: {
    prefixes: ["کانال خنده", "دورهمی شاد", "کافه سرگرمی", "مجله تفریحی", "فان کلاب"],
    bases: ["جوک و چالش‌های روز", "ویدیوهای وایرال اینستا", "موسیقی و ریمیکس", "خاطره و نوستالژی", "تیک‌تاک و ریلز"],
    suffixes: ["ایران", "طنز", "پلاس", "ناب", "شیک"],
    abouts: [
      "بهترین و جدیدترین کلیپ‌های وایرال، میم‌های خنده‌دار و سرگرمی‌های روزانه.",
      "یک فنجان لبخند و انرژی مثبت با جذاب‌ترین محتواهای داغ شبکه‌های اجتماعی.",
    ],
  },
  vip: {
    prefixes: ["کلوب ویژه", "کانال خصوصی", "هاب طلایی", "انجمن اختصاصی", "حلقه مخفی"],
    bases: ["اعضای VIP و نخبگان", "سرمایه‌گذاری پرایوت", "لایف‌استایل لاکچری", "فرصت‌های ناب تجاری"],
    suffixes: ["VIP", "گلدن", "پریمیوم", "لوکس", "اکسکلوستیو"],
    abouts: [
      "کانال اختصاصی جهت اشتراک محتوای پریمیوم، ارتباط مستقیم و خدمات ویژه لایسنس.",
    ],
  },
  general: {
    prefixes: ["کانال جامع", "مجله عمومی", "شبکه اطلاع‌رسانی", "دورهمی همگانی", "پایگاه خبری"],
    bases: ["اخبار روز و دانستنی‌ها", "تبادل اطلاعات و گفتگو", "جامعه آنلاین فارسی", "رویدادها و مقالات"],
    suffixes: ["ایران", "رسمی", "مستقل", "پلاس", "برتر"],
    abouts: [
      "اطلاع‌رسانی سریع و همگانی پیرامون اخبار مهم، مطالب خواندنی و تعامل دوستانه اعضا.",
    ],
  },
};

const enDict: Record<BatchThemeTopic, NameThemeDictionary> = {
  crypto: {
    prefixes: ["Crypto", "Alpha", "Whale", "Binance", "Bullish", "Satoshi", "Nexus"],
    bases: ["Signals & Trading", "Gems & Altcoins", "Futures Hub", "DeFi Pulse", "Blockchain Elite", "Capital Club"],
    suffixes: ["VIP", "Official", "Pro", "2026", "Global", "Network"],
    abouts: [
      "Daily technical analysis, high-probability trading signals, and global blockchain news.",
      "Exclusive insider crypto calls, risk-managed setups, and community discussions.",
    ],
  },
  tech: {
    prefixes: ["Tech", "Code", "Cyber", "Dev", "Neural", "Cloud", "Future"],
    bases: ["Engineers & Developers", "AI & Deep Learning", "Python & DevOps", "Innovations & Tools", "Hacker Lab"],
    suffixes: ["HQ", "Hub", "Community", "Core", "Global"],
    abouts: [
      "Curated resources, software engineering frameworks, and emerging artificial intelligence breakthroughs.",
    ],
  },
  business: {
    prefixes: ["Global", "Prime", "Apex", "Venture", "Market", "Empire"],
    bases: ["Entrepreneurs Club", "E-Commerce Titans", "Growth Marketing", "Investment Fund", "FinTech Circle"],
    suffixes: ["Group", "Network", "Elite", "Worldwide", "Pro"],
    abouts: [
      "High-value discussions on scaling online enterprises, deal flow, and business frameworks.",
    ],
  },
  gaming: {
    prefixes: ["Pixel", "Pro", "Cyber", "Gamer", "Vortex", "Respawn"],
    bases: ["Warzone & FPS Clan", "Esports Arena", "Streamers Lounge", "Console & PC Hub", "Battle Royale Squad"],
    suffixes: ["Legion", "Gaming", "Official", "Clan", "Zone"],
    abouts: [
      "Competitive esports scrims, game meta guides, tournament announcements, and voice squads.",
    ],
  },
  entertainment: {
    prefixes: ["Chill", "Daily", "Viral", "Meme", "Cosmic", "Vibe"],
    bases: ["Zone & Trends", "Music & Beats", "Humor Central", "Cinema & Series", "Midnight Lounge"],
    suffixes: ["Club", "Lounge", "Universe", "Vibes", "Daily"],
    abouts: [
      "Your daily dose of trending viral videos, memes, top playlist drops, and relaxed conversations.",
    ],
  },
  vip: {
    prefixes: ["Black", "Royal", "Private", "Golden", "Imperial", "Velvet"],
    bases: ["Society VIP", "Inner Circle", "High Roller Club", "Prestige Pass", "Executive Lounge"],
    suffixes: ["VIP", "Exclusive", "Private", "Limited", "Access"],
    abouts: [
      "Strictly private channel for verified subscribers and premier member perks.",
    ],
  },
  general: {
    prefixes: ["Global", "Metro", "United", "Omni", "Frontier"],
    bases: ["Community Network", "Discussion Forum", "Daily Digest", "World Connect", "Public Square"],
    suffixes: ["Official", "Channel", "Hub", "Worldwide"],
    abouts: [
      "A welcoming public forum for community announcements, open questions, and constructive chat.",
    ],
  },
};

const arDict: Record<BatchThemeTopic, NameThemeDictionary> = {
  crypto: {
    prefixes: ["عالم الكريبتو", "توصيات", "أكاديمية", "شبكة التداول", "نخبة العملات"],
    bases: ["الرقمية والبيتكوين", "صفقات فيوتشرز", "تحليلات الفوركس", "فرص الاستثمار", "البلوكشين العربي"],
    suffixes: ["VIP", "الرسمية", "العربية", "برو", "بلس"],
    abouts: ["تحليلات يومية احترافية لسوق العملات الرقمية وتوصيات دقيقة للمتداولين."],
  },
  tech: {
    prefixes: ["ملتقى التقنية", "عالم البرمجة", "المطورين", "واحة الذكاء الاصطناعي"],
    bases: ["تطوير الويب والتطبيقات", "الأمن السيبراني والشبكات", "أحدث الابتكارات", "أدوات الذكاء الاصطناعي"],
    suffixes: ["العربي", "تك", "لاب", "2026", "الرسمي"],
    abouts: ["كل ما هو جديد في عالم التكنولوجيا والبرمجيات وشروحات تقنية مبسطة."],
  },
  business: {
    prefixes: ["منتدى الأعمال", "رواد الأعمال", "شبكة التجارة", "نادي الاستثمار"],
    bases: ["التجارة الإلكترونية والتسويق", "المشاريع الناشئة والفرص", "إدارة الأموال والنمو"],
    suffixes: ["العربي", "VIP", "برو", "للريادة"],
    abouts: ["نصائح واستراتيجيات عملية لرواد الأعمال وأصحاب المشاريع الرقمية."],
  },
  gaming: {
    prefixes: ["مجتمع الجيمرز", "كلان الأساطير", "ديوانية الألعاب", "أبطال الساحة"],
    bases: ["ببجي وكود موبايل", "بلايستيشن وبي سي", "بطولات وتحديات", "ستريمرز العرب"],
    suffixes: ["العرب", "جيمنج", "الرسمي", "VIP"],
    abouts: ["تجمع اللاعبين المحترفين وبثوث الألعاب وبطولات أسبوعية حماسية."],
  },
  entertainment: {
    prefixes: ["قناة الضحك", "منوعات وترفيه", "فرفشة ووناسة", "كافيه الابتسامة"],
    bases: ["مقاطع وفيديوهات مميزة", "أجمل النكت والطرائف", "ترندات السوشيال ميديا"],
    suffixes: ["الكوميدي", "لايت", "العرب", "بلس"],
    abouts: ["أطرف الفيديوهات والمنوعات اليومية لرسم الابتسامة وقضاء وقت ممتع."],
  },
  vip: {
    prefixes: ["النادي الملكي", "القناة الخاصة", "النخبة الذهبية", "مجلس كبار الشخصيات"],
    bases: ["VIP الحصري", "المجتمع المتميز", "العضوية الخاصة"],
    suffixes: ["VIP", "الخاصة", "الحصرية"],
    abouts: ["مساحة حصرية مخصصة للمشتركين وأصحاب العضويات الذهبية."],
  },
  general: {
    prefixes: ["الملتقى العام", "الديوانية الكبرى", "مجلة المعرفة", "قناة المتابع"],
    bases: ["أخبار ومنوعات مفيدة", "حوارات ونقاشات هادفة", "معلومات وثقافة عامة"],
    suffixes: ["الرسمي", "العربي", "العام"],
    abouts: ["مساحة جامعة للحوار البناء وتبادل المعارف والأخبار العامة."],
  },
};

const ruDict: Record<BatchThemeTopic, NameThemeDictionary> = {
  crypto: {
    prefixes: ["Крипто", "Сигналы", "Академия", "Трейдинг", "Блокчейн"],
    bases: ["Биткоин и Альткоины", "Фьючерсы и Спот", "Инвестиции Pro", "DeFi Эксперт"],
    suffixes: ["VIP", "Официальный", "Россия", "2026", "Клуб"],
    abouts: ["Ежедневная аналитика крипторынка, торговые сетапы и актуальные инсайды."],
  },
  tech: {
    prefixes: ["IT Хаб", "Код и Баги", "Кибер", "Нейро", "Dev"],
    bases: ["Разработка и Python", "Искусственный Интеллект", "Системное Администрирование"],
    suffixes: ["HQ", "Сообщество", "Лаб", "Pro"],
    abouts: ["Полезные материалы по программированию, нейросетям и IT новостям."],
  },
  business: {
    prefixes: ["Бизнес", "Клуб Предпринимателей", "Стартап", "Венчур"],
    bases: ["Электронная Коммерция", "Инвестиции и Масштаб", "Маркетинг Практика"],
    suffixes: ["Элита", "VIP", "Россия"],
    abouts: ["Практические кейсы по запуску бизнеса, росту продаж и инвестициям."],
  },
  gaming: {
    prefixes: ["Гейминг", "Киберспорт", "Клан", "Игровой"],
    bases: ["CS2 и Дота", "Шутеры и Баттлрояли", "Стримы и Хайлайты"],
    suffixes: ["HQ", "Squad", "Россия", "Zone"],
    abouts: ["Новости игровой индустрии, совместные катки и турнирные сетки."],
  },
  entertainment: {
    prefixes: ["Мемы", "Юмор", "Вирусное", "Чилл", "Релакс"],
    bases: ["Лучшие Приколы", "Музыка и Вайб", "Тренды Сети"],
    suffixes: ["Клуб", "ТВ", "Daily"],
    abouts: ["Свежие мемы, позитивные ролики и отличное настроение на каждый день."],
  },
  vip: {
    prefixes: ["Закрытый Клуб", "VIP Пространство", "Приватный Хаб"],
    bases: ["Премиум Доступ", "Эксклюзивные Материалы"],
    suffixes: ["VIP", "Private", "Gold"],
    abouts: ["Канал для обладателей специального доступа и премиум участников."],
  },
  general: {
    prefixes: ["Инфо Хаб", "Городской Вестник", "Открытый Чат"],
    bases: ["Новости и События", "Общение и Знакомства"],
    suffixes: ["Официальный", "Канал", "Портал"],
    abouts: ["Открытое пространство для новостей, вопросов и живого общения участников."],
  },
};

export function generateBatchTitles(
  count: number,
  language: BatchNamingLanguage,
  topic: BatchThemeTopic,
  prefix = "",
  suffix = "",
  customList: string[] = []
): { title: string; about: string }[] {
  const results: { title: string; about: string }[] = [];

  // If user provided custom names in the text area, prioritize them!
  if (customList && customList.length > 0) {
    const cleanedCustom = customList.map((n) => n.trim()).filter(Boolean);
    for (let i = 0; i < count; i++) {
      const baseName = cleanedCustom[i % cleanedCustom.length];
      const numbering = count > cleanedCustom.length ? ` #${Math.floor(i / cleanedCustom.length) + 1}` : "";
      const fullTitle = `${prefix ? prefix + " " : ""}${baseName}${numbering}${suffix ? " " + suffix : ""}`.trim();
      results.push({
        title: fullTitle.slice(0, 128),
        about: `خوش آمدید به ${fullTitle} • ایجاد شده به صورت خودکار توسط پنل اتوماسیون تلگرام.`,
      });
    }
    return results;
  }

  // Choose appropriate dictionary
  const dictMap: Record<"fa" | "en" | "ar" | "ru", Record<BatchThemeTopic, NameThemeDictionary>> = {
    fa: faDict,
    en: enDict,
    ar: arDict,
    ru: ruDict,
  };

  const selectedLang = language === "mixed" ? null : language;

  const usedTitles = new Set<string>();

  for (let i = 1; i <= count; i++) {
    const langToUse: "fa" | "en" | "ar" | "ru" = selectedLang
      ? selectedLang
      : (["fa", "en", "ar", "ru"][i % 4] as any);

    const dict = dictMap[langToUse][topic] || dictMap[langToUse]["general"];
    const p = dict.prefixes[Math.floor(Math.random() * dict.prefixes.length)];
    const b = dict.bases[Math.floor(Math.random() * dict.bases.length)];
    const s = dict.suffixes[Math.floor(Math.random() * dict.suffixes.length)];
    const about = dict.abouts[Math.floor(Math.random() * dict.abouts.length)];

    let composedTitle = `${p} ${b} ${s}`.trim();

    if (prefix) composedTitle = `${prefix.trim()} ${composedTitle}`;
    if (suffix) composedTitle = `${composedTitle} ${suffix.trim()}`;

    // Guarantee uniqueness
    if (usedTitles.has(composedTitle)) {
      composedTitle = `${composedTitle} (${i})`;
    }
    usedTitles.add(composedTitle);

    results.push({
      title: composedTitle.slice(0, 128),
      about: about.slice(0, 255),
    });
  }

  return results;
}
