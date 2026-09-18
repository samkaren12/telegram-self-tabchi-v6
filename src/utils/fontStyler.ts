const BASE_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BASE_LOWER = "abcdefghijklmnopqrstuvwxyz";
const BASE_DIGITS = "0123456789";

const FONT_ALPHABETS: Record<string, [string, string, string]> = {
  bold: [
    "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙",
    "𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳",
    "𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗",
  ],
  italic: [
    "𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍",
    "𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧",
    BASE_DIGITS,
  ],
  bold_italic: [
    "𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝱲𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁",
    "𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛",
    BASE_DIGITS,
  ],
  double: [
    "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ",
    "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫",
    "𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡",
  ],
  monospace: [
    "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉",
    "𝚊𝚋𝚌𝚍𝒆𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣",
    "𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿",
  ],
  sans: [
    "𝖠𝖡𝖢𝖣𝖤𝖥𝖦𝖧𝖨𝖩𝖪𝖫𝖬𝖭𝖮𝖯𝖰𝖱𝖲𝖳𝖴𝖵𝖶𝖷𝖸𝖹",
    "𝖺𝖻𝖼𝖽𝖾𝖿𝗀𝗁𝗂𝗃𝗄𝗅𝗆𝗇𝗈𝗉𝗊𝗋𝗌𝗍𝗎𝗏𝗐𝗑𝗒𝗓",
    "𝟢𝟣𝟤𝟥𝟦𝟧𝟨𝟩𝟪𝟫",
  ],
  gothic: [
    "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ",
    "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷",
    BASE_DIGITS,
  ],
};

const FONT_MAPS: Record<string, Record<string, string>> = {};

for (const [style, [upper, lower, digits]] of Object.entries(FONT_ALPHABETS)) {
  const map: Record<string, string> = {};
  for (let i = 0; i < BASE_UPPER.length; i++) {
    map[BASE_UPPER[i]] = [...upper][i] || BASE_UPPER[i];
  }
  for (let i = 0; i < BASE_LOWER.length; i++) {
    map[BASE_LOWER[i]] = [...lower][i] || BASE_LOWER[i];
  }
  for (let i = 0; i < BASE_DIGITS.length; i++) {
    map[BASE_DIGITS[i]] = [...digits][i] || BASE_DIGITS[i];
  }
  FONT_MAPS[style] = map;
}

export function transformFont(text: string, style: string): string {
  if (!style || style === "normal" || !FONT_MAPS[style]) {
    return text;
  }
  const map = FONT_MAPS[style];
  return text
    .split("")
    .map((char) => map[char] || char)
    .join("");
}
