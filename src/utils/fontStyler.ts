const BASE_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BASE_LOWER = "abcdefghijklmnopqrstuvwxyz";
const BASE_DIGITS = "0123456789";

export type FontStyleId =
  | "bold"
  | "italic"
  | "bold_italic"
  | "monospace"
  | "double"
  | "sans"
  | "sans_bold"
  | "sans_italic"
  | "sans_bold_italic"
  | "gothic"
  | "gothic_bold"
  | "script"
  | "script_bold"
  | "circled"
  | "circled_dark"
  | "squared"
  | "squared_dark"
  | "small_caps"
  | "fullwidth"
  | "superscript"
  | "subscript"
  | "persian"
  | "persian_bold"
  | "cyber_brackets"
  | "normal"
  | "default";

const FONT_ALPHABETS: Record<string, [string, string, string[] | string]> = {
  bold: [
    "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙",
    "𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳",
    "𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗",
  ],
  italic: [
    "𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍",
    "𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧",
    "𝟢𝟣𝟤𝟥𝟦𝟧𝟨𝟩𝟪𝟫",
  ],
  bold_italic: [
    "𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁",
    "𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛",
    "𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗",
  ],
  double: [
    "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ",
    "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫",
    "𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡",
  ],
  monospace: [
    "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉",
    "𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣",
    "𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿",
  ],
  sans: [
    "𝖠𝖡𝖢𝖣𝖤𝖥𝖦𝖧𝖨𝖩𝖪𝖫𝖬𝖭𝖮𝖯𝖰𝖱𝖲𝖳𝖴𝖵𝖶𝖷𝖸𝖹",
    "𝖺𝖻𝖼𝖽𝖾𝖿𝗀𝗁𝗂𝗃𝗄𝗅𝗆𝗇𝗈𝗉𝗊𝗋𝗌𝗍𝗎𝗏𝗐𝗑𝗒𝗓",
    "𝟢𝟣𝟤𝟥𝟦𝟧𝟨𝟩𝟪𝟫",
  ],
  sans_bold: [
    "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭",
    "𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇",
    "𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵",
  ],
  sans_italic: [
    "𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡",
    "𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻",
    "𝟢𝟣𝟤𝟥𝟦𝟧𝟨𝟩𝟪𝟫",
  ],
  sans_bold_italic: [
    "𝘼𝘽𝘾𝘿𝙀𝙁𝙂𝙃𝙄𝙅𝙆𝙇𝙈𝙉𝙊𝙋𝙌𝙍𝙎𝙏𝙐𝙑𝙒𝙓𝙔𝙕",
    "𝙖𝙗𝙘𝙙𝙚𝙛𝙜𝙝𝙞𝙟𝙠𝙡𝙢𝙣𝙤𝙥𝙦𝙧𝙨𝙩𝙪𝙫𝙬𝙭𝙮𝙯",
    "𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵",
  ],
  gothic: [
    "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ",
    "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷",
    "𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡",
  ],
  gothic_bold: [
    "𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅",
    "𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟",
    "𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗",
  ],
  script: [
    "𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵",
    "𝒶𝒷𝒸𝒹ℯ𝒻ℊℎ𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏",
    "𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗",
  ],
  script_bold: [
    "𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩",
    "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃",
    "𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗",
  ],
  circled: [
    "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ",
    "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ",
    ["⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"],
  ],
  circled_dark: [
    "🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩",
    "🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩",
    ["⓿", "➊", "➋", "➌", "➍", "➎", "➏", "➐", "➑", "➒"],
  ],
  squared: [
    "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉",
    "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉",
    "𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿",
  ],
  squared_dark: [
    "🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉",
    "🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉",
    "𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵",
  ],
  small_caps: [
    "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ",
    "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ",
    "𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿",
  ],
  fullwidth: [
    "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ",
    "ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ",
    "０１２３４５６７８９",
  ],
  superscript: [
    "ᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾQᴿˢᵀᵁⱽᵂˣʸᶻ",
    "ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖqʳˢᵗᵘᵛʷˣʸᶻ",
    ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"],
  ],
  subscript: [
    "ₐ₈CDₑFGₕᵢⱼₖₗₘₙₒₚQᵣₛₜᵤᵥWₓYZ",
    "ₐbcdₑfgₕᵢⱼₖₗₘₙₒₚqᵣₛₜᵤᵥwₓyz",
    ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"],
  ],
  persian: [
    BASE_UPPER,
    BASE_LOWER,
    ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"],
  ],
  persian_bold: [
    "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭",
    "𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇",
    ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"],
  ],
  cyber_brackets: [
    "『A』『B』『C』『D』『E』『F』『G』『H』『I』『J』『K』『L』『M』『N』『O』『P』『Q』『R』『S』『T』『U』『V』『W』『X』『Y』『Z』",
    "『a』『b』『c』『d』『e』『f』『g』『h』『i』『j』『k』『l』『m』『n』『o』『p』『q』『r』『s』『t』『u』『v』『w』『x』『y』『z』",
    ["⟦0⟧", "⟦1⟧", "⟦2⟧", "⟦3⟧", "⟦4⟧", "⟦5⟧", "⟦6⟧", "⟦7⟧", "⟦8⟧", "⟦9⟧"],
  ],
};

const FONT_MAPS: Record<string, Record<string, string>> = {};

for (const [style, [upper, lower, digits]] of Object.entries(FONT_ALPHABETS)) {
  const map: Record<string, string> = {};
  const upperArr = [...upper];
  const lowerArr = [...lower];
  const digitsArr = Array.isArray(digits) ? digits : [...digits];

  if (style === "cyber_brackets") {
    for (let i = 0; i < BASE_UPPER.length; i++) {
      map[BASE_UPPER[i]] = BASE_UPPER[i];
      map[BASE_LOWER[i]] = BASE_LOWER[i];
    }
    for (let i = 0; i < BASE_DIGITS.length; i++) {
      map[BASE_DIGITS[i]] = digitsArr[i] || BASE_DIGITS[i];
    }
  } else {
    for (let i = 0; i < BASE_UPPER.length; i++) {
      map[BASE_UPPER[i]] = upperArr[i] || BASE_UPPER[i];
    }
    for (let i = 0; i < BASE_LOWER.length; i++) {
      map[BASE_LOWER[i]] = lowerArr[i] || BASE_LOWER[i];
    }
    for (let i = 0; i < BASE_DIGITS.length; i++) {
      map[BASE_DIGITS[i]] = digitsArr[i] || BASE_DIGITS[i];
    }
  }

  if (style === "fullwidth") {
    map[":"] = "：";
  } else if (style === "superscript") {
    map[":"] = "˸";
  } else if (style === "persian_bold") {
    map[":"] = "∶";
  }

  FONT_MAPS[style] = map;
}

export const SELF_TIME_FONT_OPTIONS: Array<{
  id: FontStyleId;
  name: string;
  sample: string;
  badge?: string;
}> = [
  { id: "bold", name: "Bold Serif", sample: "𝟏𝟒:𝟒𝟓", badge: "محبوب" },
  { id: "sans_bold", name: "Bold Sans", sample: "𝟭𝟰:𝟰𝟱", badge: "جدید" },
  { id: "monospace", name: "Monospace", sample: "𝟷𝟺:𝟺𝟻" },
  { id: "double", name: "Double Struck", sample: "𝟙𝟜:𝟜𝟝", badge: "خاص" },
  { id: "sans", name: "Clean Sans", sample: "𝟣𝟦:𝟦𝟧" },
  { id: "circled_dark", name: "Dark Circle", sample: "➊➍:➍➎", badge: "VIP" },
  { id: "circled", name: "Light Circle", sample: "①④:④⑤", badge: "جدید" },
  { id: "persian", name: "اعداد فارسی", sample: "۱۴:۴۵", badge: "فارسی" },
  { id: "persian_bold", name: "فارسی ویژه", sample: "۱۴∶۴۵", badge: "جدید" },
  { id: "superscript", name: "Superscript (ریز بالا)", sample: "¹⁴˸⁴⁵", badge: "مینیمال" },
  { id: "subscript", name: "Subscript (ریز پایین)", sample: "₁₄:₄₅", badge: "مینیمال" },
  { id: "fullwidth", name: "Fullwidth (پهن نئونی)", sample: "１４：４５", badge: "نئونی" },
  { id: "cyber_brackets", name: "Cyber Digital", sample: "⟦1⟧⟦4⟧:⟦4⟧⟦5⟧", badge: "هکری" },
  { id: "squared", name: "Squared Box", sample: "𝟷𝟺:𝟺𝟻 [🄿🅁🄾]" },
  { id: "squared_dark", name: "Dark Squared", sample: "𝟭𝟰:𝟰𝟱 [🅿🆁🅾]", badge: "VIP" },
  { id: "script_bold", name: "Luxury Script", sample: "𝟏𝟒:𝟒𝟓 𝓢𝓪𝓶", badge: "لوکس" },
  { id: "gothic_bold", name: "Dark Gothic", sample: "𝟏𝟒:𝟒𝟓 𝕲𝖔𝖙𝖍" },
  { id: "gothic", name: "Classic Gothic", sample: "𝟙𝟜:𝟜𝟝 𝔊𝔬𝔱𝔥" },
  { id: "small_caps", name: "Small Caps", sample: "𝟷𝟺:𝟺𝟻 ᴄᴀᴘs" },
  { id: "italic", name: "Italic", sample: "𝟣𝟦:𝟦𝟧 𝐼𝑡𝑎𝑙𝑖𝑐" },
  { id: "normal", name: "ساده (استاندارد)", sample: "14:45" },
];

export const GENERAL_FONT_OPTIONS: Array<{
  id: FontStyleId;
  label: string;
  sample: string;
}> = [
  { id: "bold", label: "Bold Serif", sample: "𝐁𝐨𝐥𝐝 𝟏𝟒:𝟒𝟓" },
  { id: "sans_bold", label: "Bold Sans", sample: "𝗕𝗼𝗹𝗱 𝟭𝟰:𝟰𝟱" },
  { id: "italic", label: "Italic", sample: "𝐼𝑡𝑎𝑙𝑖𝑐 𝟣𝟦:𝟦𝟧" },
  { id: "bold_italic", label: "Bold Italic", sample: "𝑩𝒐𝒍𝒅 𝑰𝒕𝒂𝒍𝒊𝒄" },
  { id: "sans_italic", label: "Sans Italic", sample: "𝘚𝘢𝘯𝘴 𝘐𝘵𝘢𝘭𝘪𝘤" },
  { id: "sans_bold_italic", label: "Sans Bold Italic", sample: "𝙎𝙖𝙣𝙨 𝘽𝙤𝙡𝙙" },
  { id: "monospace", label: "Monospace", sample: "𝙼𝚘𝚗𝚘 𝟷𝟺:𝟺𝟻" },
  { id: "double", label: "Double Struck", sample: "𝔻𝕠𝕦𝕓𝕝𝕖 𝟙𝟜:𝟜𝟝" },
  { id: "sans", label: "Clean Sans", sample: "𝖲𝖺𝗇𝗌 𝟣𝟦:𝟦𝟧" },
  { id: "script", label: "Calligraphy Script", sample: "𝒮𝒸𝓇𝒾𝓅𝓉 𝒯ℯ𝓍𝓉" },
  { id: "script_bold", label: "Luxury Bold Script", sample: "𝓑𝓸𝓵𝓭 𝓢𝓬𝓻𝓲𝓹𝓽" },
  { id: "gothic", label: "Gothic Fraktur", sample: "𝔊𝔬𝔱𝔥𝔦𝔠 𝟙𝟜:𝟜𝟝" },
  { id: "gothic_bold", label: "Dark Gothic Bold", sample: "𝕲𝖔𝖙𝖍𝖎𝖈 𝟏𝟒:𝟒𝟓" },
  { id: "small_caps", label: "Small Caps", sample: "sᴍᴀʟʟ ᴄᴀᴘs" },
  { id: "circled", label: "Circled Bubble", sample: "Ⓒⓘⓡⓒⓛⓔ ①④" },
  { id: "circled_dark", label: "Dark Bubble VIP", sample: "🅒🅘🅡🅒🅛🅔 ➊➍" },
  { id: "squared", label: "Squared Box", sample: "🅂🅀🅄🄰🅁🄴" },
  { id: "squared_dark", label: "Dark Squared", sample: "🆂🆀🆄🅰🆁🅴" },
  { id: "fullwidth", label: "Fullwidth Aesthetic", sample: "Ｆｕｌｌ １４：４５" },
  { id: "superscript", label: "Superscript Tiny", sample: "ˢᵘᵖᵉʳˢᶜʳⁱᵖᵗ ¹⁴˸⁴⁵" },
  { id: "subscript", label: "Subscript Tiny", sample: "ₛᵤbₛcᵣᵢₚₜ ₁₄:₄₅" },
  { id: "persian", label: "اعداد فارسی", sample: "ساعت ۱۴:۴۵" },
  { id: "persian_bold", label: "فارسی ویژه + بولد", sample: "𝐕𝐈𝐏 ۱۴∶۴۵" },
  { id: "cyber_brackets", label: "Cyber Digital", sample: "⟦1⟧⟦4⟧:⟦4⟧⟦5⟧" },
  { id: "normal", label: "Normal (ساده)", sample: "Normal 14:45" },
];

export function transformFont(text: string, style: string): string {
  if (!style || style === "normal" || style === "default" || !FONT_MAPS[style]) {
    return text;
  }
  const map = FONT_MAPS[style];
  return text
    .split("")
    .map((char) => map[char] || char)
    .join("");
}
