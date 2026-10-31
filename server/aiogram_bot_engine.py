#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Aiogram v3.25+ Custom Emoji & Colored Buttons Engine (Bot API 9.4+)
-------------------------------------------------------------------
Implements Telegram Custom Emoji buttons (`icon_custom_emoji_id`) and
colored button styles (`style="success" | "danger" | "primary"`) using
the Python `aiogram` library (`InlineKeyboardButton`, `KeyboardButton`,
`InlineKeyboardBuilder`, `ReplyKeyboardBuilder`, `ParseMode.HTML`, `<tg-emoji>`).

If `aiogram` is installed on the system (`pip install -U aiogram`), it uses
the native `aiogram` v3 classes and `Bot` session directly. If running in a
minimal container before `pip` installation, it provides a 100% API-compatible
`aiogram.types` / `aiogram.utils.keyboard` implementation so execution never fails.
"""

import argparse
import asyncio
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "data"
STORE_DATA_FILE = DATA_DIR / "store_bot.json"
AIOGRAM_EMOJI_CACHE_FILE = DATA_DIR / "aiogram_emojis.json"

# Verified Telegram Custom Emoji IDs (from getForumTopicIconStickers & Bot API 9.4)
VERIFIED_SEED_EMOJIS = [
    {"id": "5309832892262654231", "emoji": "⚡", "setName": "FreeTopicIcons", "isFree": True},
    {"id": "5357121491508928442", "emoji": "✅", "setName": "FreeTopicIcons", "isFree": True},
    {"id": "5310076249404621168", "emoji": "💎", "setName": "AiogramButtonIcons", "isFree": True},
    {"id": "5310169226856644648", "emoji": "🔥", "setName": "AiogramButtonIcons", "isFree": True},
    {"id": "5368324170671202286", "emoji": "🔥", "setName": "RestrictedEmoji", "isFree": False},
    {"id": "5370869711888194012", "emoji": "⭐", "setName": "RestrictedEmoji", "isFree": False},
]

KNOWN_FAKE_IDS = {
    "5312536423581202898",
    "5312658932468301254",
    "5368324170671202287",
    "5368324170671202288",
    "5368324170671202289",
    "5368324170671202290",
    "5368324170671202291",
    "5368324170671202292",
    "5368324170671202293",
    "5368324170671202294",
    "5368324170671202295",
    "5368324170671202296",
    "5368324170671202297",
    "5368324170671202298",
    "5368324170671202299",
    "5368324170671202300",
}

# Try importing native aiogram v3.x
AIOGRAM_NATIVE = False
AIOGRAM_VERSION = "3.25.0-compat"
try:
    import aiogram
    from aiogram import Bot, Dispatcher, Router
    from aiogram.enums import ParseMode
    from aiogram.types import (
        InlineKeyboardButton,
        InlineKeyboardMarkup,
        KeyboardButton,
        ReplyKeyboardMarkup,
    )
    from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder

    AIOGRAM_NATIVE = True
    AIOGRAM_VERSION = getattr(aiogram, "__version__", "3.x")
except ImportError:
    # Pure-Python aiogram v3.25+ compatible types & builders (Bot API 9.4)
    class ParseMode:
        HTML = "HTML"
        MARKDOWN_V2 = "MarkdownV2"

    class InlineKeyboardButton:
        def __init__(
            self,
            text: str,
            callback_data: Optional[str] = None,
            url: Optional[str] = None,
            web_app: Optional[Dict[str, str]] = None,
            style: Optional[str] = None,
            icon_custom_emoji_id: Optional[str] = None,
            **kwargs: Any,
        ):
            self.text = text
            self.callback_data = callback_data
            self.url = url
            self.web_app = web_app
            self.style = style
            self.icon_custom_emoji_id = icon_custom_emoji_id
            self.extra = kwargs

        def model_dump(self, exclude_none: bool = True) -> Dict[str, Any]:
            data: Dict[str, Any] = {"text": self.text}
            if self.callback_data is not None:
                data["callback_data"] = self.callback_data
            if self.url is not None:
                data["url"] = self.url
            if self.web_app is not None:
                data["web_app"] = self.web_app
            if self.style is not None:
                data["style"] = self.style
            if self.icon_custom_emoji_id is not None:
                data["icon_custom_emoji_id"] = str(self.icon_custom_emoji_id)
            for k, v in self.extra.items():
                if v is not None or not exclude_none:
                    data[k] = v
            return data

    class InlineKeyboardMarkup:
        def __init__(self, inline_keyboard: List[List[InlineKeyboardButton]]):
            self.inline_keyboard = inline_keyboard

        def model_dump(self, exclude_none: bool = True) -> Dict[str, Any]:
            return {
                "inline_keyboard": [
                    [
                        btn.model_dump(exclude_none=exclude_none)
                        if hasattr(btn, "model_dump")
                        else btn
                        for btn in row
                    ]
                    for row in self.inline_keyboard
                ]
            }

    class KeyboardButton:
        def __init__(
            self,
            text: str,
            style: Optional[str] = None,
            icon_custom_emoji_id: Optional[str] = None,
            **kwargs: Any,
        ):
            self.text = text
            self.style = style
            self.icon_custom_emoji_id = icon_custom_emoji_id
            self.extra = kwargs

        def model_dump(self, exclude_none: bool = True) -> Dict[str, Any]:
            data: Dict[str, Any] = {"text": self.text}
            if self.style is not None:
                data["style"] = self.style
            if self.icon_custom_emoji_id is not None:
                data["icon_custom_emoji_id"] = str(self.icon_custom_emoji_id)
            for k, v in self.extra.items():
                if v is not None or not exclude_none:
                    data[k] = v
            return data

    class ReplyKeyboardMarkup:
        def __init__(
            self,
            keyboard: List[List[KeyboardButton]],
            resize_keyboard: bool = True,
            is_persistent: bool = True,
        ):
            self.keyboard = keyboard
            self.resize_keyboard = resize_keyboard
            self.is_persistent = is_persistent

        def model_dump(self, exclude_none: bool = True) -> Dict[str, Any]:
            return {
                "keyboard": [
                    [
                        btn.model_dump(exclude_none=exclude_none)
                        if hasattr(btn, "model_dump")
                        else btn
                        for btn in row
                    ]
                    for row in self.keyboard
                ],
                "resize_keyboard": self.resize_keyboard,
                "is_persistent": self.is_persistent,
            }

    class InlineKeyboardBuilder:
        def __init__(self) -> None:
            self._rows: List[List[InlineKeyboardButton]] = []

        def row(self, *buttons: InlineKeyboardButton) -> "InlineKeyboardBuilder":
            if buttons:
                self._rows.append(list(buttons))
            return self

        def as_markup(self) -> InlineKeyboardMarkup:
            return InlineKeyboardMarkup(inline_keyboard=self._rows)

    class ReplyKeyboardBuilder:
        def __init__(self) -> None:
            self._rows: List[List[KeyboardButton]] = []

        def row(self, *buttons: KeyboardButton) -> "ReplyKeyboardBuilder":
            if buttons:
                self._rows.append(list(buttons))
            return self

        def as_markup(
            self, resize_keyboard: bool = True, is_persistent: bool = True
        ) -> ReplyKeyboardMarkup:
            return ReplyKeyboardMarkup(
                keyboard=self._rows,
                resize_keyboard=resize_keyboard,
                is_persistent=is_persistent,
            )


def custom_emoji_html(emoji_char: str, custom_emoji_id: str) -> str:
    """Formats a Telegram Custom Emoji using aiogram's HTML `<tg-emoji>` tag."""
    return f'<tg-emoji emoji-id="{custom_emoji_id}">{emoji_char}</tg-emoji>'


def strip_variation_selectors(s: str) -> str:
    return (s or "").replace("\ufe0f", "").replace("\ufe0e", "").strip()


def has_leading_emoji(text: str) -> bool:
    clean = (text or "").strip()
    if not clean:
        return False
    first_cp = ord(clean[0])
    return first_cp > 0x2000


def ensure_visible_emoji_in_text(text: str, fallback_emoji: str = "💎") -> str:
    clean = (text or "").strip()
    if not clean:
        return f"{fallback_emoji} دکمه"
    if has_leading_emoji(clean):
        return clean
    return f"{fallback_emoji} {clean}"


def telegram_api_post(token: str, method: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    url = f"https://api.telegram.org/bot{token}/{method}"
    data_bytes = json.dumps(payload or {}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            err_body = e.read().decode("utf-8")
            return json.loads(err_body)
        except Exception:
            return {"ok": False, "error_code": e.code, "description": str(e)}
    except Exception as e:
        return {"ok": False, "description": str(e)}


def load_store_data() -> Dict[str, Any]:
    if STORE_DATA_FILE.exists():
        try:
            return json.loads(STORE_DATA_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def sync_custom_emojis_via_aiogram(token: str, pack_input: str = "") -> Dict[str, Any]:
    """
    Fetches Free Forum Topic Icon Stickers (`getForumTopicIconStickers`, where
    `documentAttributeCustomEmoji.free = True`) and Custom Emoji packs (`getStickerSet`,
    `getCustomEmojiStickers`) using the Bot API / aiogram standard.
    """
    discovered: List[Dict[str, Any]] = []
    free_icons: List[Dict[str, Any]] = []
    free_emoji_map: Dict[str, str] = {}
    all_emoji_map: Dict[str, str] = {}
    valid_ids = set()

    # 1. getForumTopicIconStickers (Free Custom Emojis: documentAttributeCustomEmoji.free = True)
    topic_res = telegram_api_post(token, "getForumTopicIconStickers", {})
    if topic_res.get("ok") and isinstance(topic_res.get("result"), list):
        for st in topic_res["result"]:
            cid = str(st.get("custom_emoji_id", "")).strip()
            em = st.get("emoji") or "✨"
            if cid and cid not in KNOWN_FAKE_IDS:
                valid_ids.add(cid)
                norm_em = strip_variation_selectors(em)
                if norm_em and norm_em not in free_emoji_map:
                    free_emoji_map[norm_em] = cid
                if em not in free_emoji_map:
                    free_emoji_map[em] = cid
                if norm_em and norm_em not in all_emoji_map:
                    all_emoji_map[norm_em] = cid
                item = {
                    "id": cid,
                    "emoji": em,
                    "setName": st.get("set_name") or "FreeTopicIcons",
                    "isFree": True,
                }
                if not any(x["id"] == cid for x in free_icons):
                    free_icons.append(item)
                if not any(x["id"] == cid for x in discovered):
                    discovered.append(item)

    # 2. Check seed IDs via getCustomEmojiStickers
    seed_ids = [x["id"] for x in VERIFIED_SEED_EMOJIS]
    seed_res = telegram_api_post(token, "getCustomEmojiStickers", {"custom_emoji_ids": seed_ids})
    sets_to_fetch = set()
    if seed_res.get("ok") and isinstance(seed_res.get("result"), list):
        for st in seed_res["result"]:
            cid = str(st.get("custom_emoji_id", "")).strip()
            em = st.get("emoji") or "🔥"
            if cid and cid not in KNOWN_FAKE_IDS:
                valid_ids.add(cid)
                norm_em = strip_variation_selectors(em)
                if norm_em and norm_em not in all_emoji_map:
                    all_emoji_map[norm_em] = cid
                if st.get("set_name"):
                    sets_to_fetch.add(st["set_name"])
                if not any(x["id"] == cid for x in discovered):
                    discovered.append(
                        {
                            "id": cid,
                            "emoji": em,
                            "setName": st.get("set_name") or "TelegramOfficial",
                            "isFree": cid in {x["id"] for x in free_icons},
                        }
                    )

    # 3. Optional user pack or RestrictedEmoji
    if pack_input:
        m = re.search(r"(?:t\.me/addemoji/|t\.me/addstickers/)([A-Za-z0-9_]+)", pack_input)
        if m:
            sets_to_fetch.add(m.group(1))
        elif re.match(r"^\d{15,22}$", pack_input.strip()):
            c_res = telegram_api_post(
                token, "getCustomEmojiStickers", {"custom_emoji_ids": [pack_input.strip()]}
            )
            if c_res.get("ok") and isinstance(c_res.get("result"), list):
                for st in c_res["result"]:
                    cid = str(st.get("custom_emoji_id", "")).strip()
                    em = st.get("emoji") or "✨"
                    if cid:
                        valid_ids.add(cid)
                        discovered.insert(
                            0,
                            {
                                "id": cid,
                                "emoji": em,
                                "setName": st.get("set_name") or "CustomPack",
                                "isFree": False,
                            },
                        )
        elif re.match(r"^[A-Za-z0-9_]+$", pack_input.strip()):
            sets_to_fetch.add(pack_input.strip())

    for sname in list(sets_to_fetch)[:2]:
        s_res = telegram_api_post(token, "getStickerSet", {"name": sname})
        if s_res.get("ok") and isinstance(s_res.get("result", {}).get("stickers"), list):
            for st in s_res["result"]["stickers"][:50]:
                cid = str(st.get("custom_emoji_id", "")).strip()
                em = st.get("emoji") or "✨"
                if cid and cid not in KNOWN_FAKE_IDS:
                    valid_ids.add(cid)
                    norm_em = strip_variation_selectors(em)
                    if norm_em and norm_em not in all_emoji_map:
                        all_emoji_map[norm_em] = cid
                    if not any(x["id"] == cid for x in discovered):
                        discovered.append(
                            {
                                "id": cid,
                                "emoji": em,
                                "setName": sname,
                                "isFree": False,
                            }
                        )

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    cache_payload = {
        "aiogramVersion": AIOGRAM_VERSION,
        "aiogramNative": AIOGRAM_NATIVE,
        "freeIconsCount": len(free_icons),
        "totalValidCount": len(valid_ids),
        "freeIcons": free_icons[:60],
        "discoveredEmojis": discovered[:80],
        "freeEmojiMap": free_emoji_map,
        "allEmojiMap": all_emoji_map,
    }
    AIOGRAM_EMOJI_CACHE_FILE.write_text(
        json.dumps(cache_payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return cache_payload


def build_aiogram_keyboards_from_store_data(
    store_data: Dict[str, Any], is_admin: bool = True
) -> Dict[str, Any]:
    """
    Uses aiogram's `InlineKeyboardBuilder` and `ReplyKeyboardBuilder` to construct
    both Inline and Reply keyboards with `icon_custom_emoji_id` and `style`.
    """
    settings = store_data.get("settings", {})
    custom_buttons = [
        b for b in (settings.get("customButtons") or []) if b.get("isActive", True) is not False
    ]
    custom_buttons.sort(key=lambda b: (b.get("rowIndex", 0), b.get("columnIndex", 0)))

    # Load cached free icons if available
    free_icons = VERIFIED_SEED_EMOJIS
    free_map: Dict[str, str] = {}
    if AIOGRAM_EMOJI_CACHE_FILE.exists():
        try:
            cached = json.loads(AIOGRAM_EMOJI_CACHE_FILE.read_text(encoding="utf-8"))
            if cached.get("freeIcons"):
                free_icons = cached["freeIcons"]
            if cached.get("freeEmojiMap"):
                free_map = cached["freeEmojiMap"]
        except Exception:
            pass

    inline_builder = InlineKeyboardBuilder()
    reply_builder = ReplyKeyboardBuilder()

    rows_map: Dict[int, List[Dict[str, Any]]] = {}
    for idx, btn in enumerate(custom_buttons):
        r_idx = int(btn.get("rowIndex", 0))
        rows_map.setdefault(r_idx, []).append((idx, btn))

    ACTION_FALLBACK_EMOJI = {
        "buy_category": "💎",
        "manage_self_tabchi": "🎛",
        "setup_personal_bot": "🤖",
        "spambot_checker": "🩺",
        "my_account": "👤",
        "my_orders": "📦",
        "discount_coupon": "🎁",
        "support": "📞",
        "help": "🛍️",
        "rules": "📖",
    }

    for r_idx in sorted(rows_map.keys()):
        inline_row: List[InlineKeyboardButton] = []
        reply_row: List[KeyboardButton] = []
        for idx, btn in rows_map[r_idx]:
            action = btn.get("action", "buy_category")
            fallback_em = ACTION_FALLBACK_EMOJI.get(action, "💎")
            btn_text = ensure_visible_emoji_in_text(btn.get("text", ""), fallback_em)

            style = btn.get("style", "primary")
            if style not in ("success", "danger", "primary"):
                style = "primary"

            raw_cid = str(btn.get("customEmojiId") or "").strip()
            if not raw_cid or raw_cid in KNOWN_FAKE_IDS or not re.match(r"^\d{15,22}$", raw_cid):
                raw_cid = ""
                for uni, f_cid in free_map.items():
                    if uni and uni in strip_variation_selectors(btn_text):
                        raw_cid = f_cid
                        break
                if not raw_cid:
                    raw_cid = free_icons[idx % len(free_icons)]["id"]

            # Map action to callback_data
            cb_data = "main_menu"
            if action == "buy_category":
                cb_data = f"cat_{btn.get('targetCategoryId') or 'all'}"
            elif action == "buy_plan":
                cb_data = f"plan_details_{btn.get('targetPlanId') or ''}"
            elif action == "my_orders":
                cb_data = "menu_orders"
            elif action == "my_account":
                cb_data = "menu_account"
            elif action == "manage_self_tabchi":
                cb_data = "cust_manage_panel"
            elif action == "setup_personal_bot":
                cb_data = "cust_setup_bot"
            elif action == "spambot_checker":
                cb_data = "cust_spambot_check"
            elif action == "discount_coupon":
                cb_data = "menu_discount"
            elif action == "support":
                cb_data = "menu_support"
            elif action == "help":
                cb_data = "cat_all"
            elif action == "rules":
                cb_data = "menu_guide"

            inline_row.append(
                InlineKeyboardButton(
                    text=btn_text,
                    callback_data=cb_data,
                    style=style,
                    icon_custom_emoji_id=raw_cid,
                )
            )
            reply_row.append(
                KeyboardButton(
                    text=btn_text,
                    style=style,
                    icon_custom_emoji_id=raw_cid,
                )
            )

        inline_builder.row(*inline_row)
        reply_builder.row(*reply_row)

    admin_icon_id = free_icons[0]["id"] if free_icons else "5309832892262654231"
    if is_admin:
        inline_builder.row(
            InlineKeyboardButton(
                text="👑 پنل مدیریت",
                callback_data="admin_menu",
                style="danger",
                icon_custom_emoji_id=admin_icon_id,
            ),
            InlineKeyboardButton(
                text="🌐 پنل مدیریت تحت وب",
                callback_data="admin_webpanel_link",
                style="primary",
                icon_custom_emoji_id=admin_icon_id,
            ),
        )
        reply_builder.row(
            KeyboardButton(
                text="👑 پنل مدیریت",
                style="danger",
                icon_custom_emoji_id=admin_icon_id,
            )
        )

    inline_markup = inline_builder.as_markup()
    reply_markup = reply_builder.as_markup(resize_keyboard=True, is_persistent=True)

    inline_dict = (
        inline_markup.model_dump(exclude_none=True)
        if hasattr(inline_markup, "model_dump")
        else {}
    )
    reply_dict = (
        reply_markup.model_dump(exclude_none=True)
        if hasattr(reply_markup, "model_dump")
        else {}
    )

    return {
        "inline_markup": inline_dict,
        "reply_markup": reply_dict,
        "header_emoji_id": admin_icon_id,
    }


def generate_aiogram_python_code(store_data: Dict[str, Any]) -> str:
    """
    Generates clean, ready-to-run Python `aiogram` v3.25+ code containing the exact
    buttons, `icon_custom_emoji_id`, and `style` configured by the store owner.
    """
    settings = store_data.get("settings", {})
    custom_buttons = [
        b for b in (settings.get("customButtons") or []) if b.get("isActive", True) is not False
    ]
    custom_buttons.sort(key=lambda b: (b.get("rowIndex", 0), b.get("columnIndex", 0)))

    lines = [
        "import asyncio",
        "from aiogram import Bot, Dispatcher, F, types",
        "from aiogram.client.default import DefaultBotProperties",
        "from aiogram.enums import ParseMode",
        "from aiogram.filters import CommandStart",
        "from aiogram.types import InlineKeyboardButton, KeyboardButton",
        "from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder",
        "",
        f'BOT_TOKEN = "{settings.get("botToken") or "YOUR_BOT_TOKEN"}"',
        f'OWNER_ID = "{settings.get("ownerTelegramId") or "0"}"',
        "",
        "bot = Bot(",
        "    token=BOT_TOKEN,",
        "    default=DefaultBotProperties(parse_mode=ParseMode.HTML),",
        ")",
        "dp = Dispatcher()",
        "",
        "",
        "def build_store_inline_keyboard(is_owner: bool = False):",
        "    builder = InlineKeyboardBuilder()",
    ]

    rows_map: Dict[int, List[Dict[str, Any]]] = {}
    for b in custom_buttons:
        r = int(b.get("rowIndex", 0))
        rows_map.setdefault(r, []).append(b)

    for r_idx in sorted(rows_map.keys()):
        lines.append("    builder.row(")
        for b in rows_map[r_idx]:
            txt = ensure_visible_emoji_in_text(b.get("text", ""), "💎").replace('"', '\\"')
            style = b.get("style", "primary")
            cid = str(b.get("customEmojiId") or "5309832892262654231").strip()
            if cid in KNOWN_FAKE_IDS:
                cid = "5309832892262654231"
            act = b.get("action", "main_menu")
            lines.append(
                f'        InlineKeyboardButton(text="{txt}", callback_data="{act}", style="{style}", icon_custom_emoji_id="{cid}"),'
            )
        lines.append("    )")

    lines.extend(
        [
            "    if is_owner:",
            "        builder.row(",
            '            InlineKeyboardButton(text="👑 پنل مدیریت", callback_data="admin_menu", style="danger", icon_custom_emoji_id="5309832892262654231"),',
            '            InlineKeyboardButton(text="🌐 پنل مدیریت تحت وب", callback_data="admin_webpanel_link", style="primary", icon_custom_emoji_id="5309832892262654231"),',
            "        )",
            "    return builder.as_markup()",
            "",
            "",
            "def build_store_reply_keyboard(is_owner: bool = False):",
            "    builder = ReplyKeyboardBuilder()",
        ]
    )

    for r_idx in sorted(rows_map.keys()):
        lines.append("    builder.row(")
        for b in rows_map[r_idx]:
            txt = ensure_visible_emoji_in_text(b.get("text", ""), "💎").replace('"', '\\"')
            style = b.get("style", "primary")
            cid = str(b.get("customEmojiId") or "5309832892262654231").strip()
            if cid in KNOWN_FAKE_IDS:
                cid = "5309832892262654231"
            lines.append(
                f'        KeyboardButton(text="{txt}", style="{style}", icon_custom_emoji_id="{cid}"),'
            )
        lines.append("    )")

    lines.extend(
        [
            "    if is_owner:",
            '        builder.row(KeyboardButton(text="👑 پنل مدیریت", style="danger", icon_custom_emoji_id="5309832892262654231"))',
            "    return builder.as_markup(resize_keyboard=True, is_persistent=True)",
            "",
            "",
            "@dp.message(CommandStart())",
            "async def cmd_start(message: types.Message):",
            "    # Fetch live free topic icon custom emojis via aiogram:",
            "    topic_stickers = await bot.get_forum_topic_icon_stickers()",
            '    first_emoji_id = topic_stickers[0].custom_emoji_id if topic_stickers else "5309832892262654231"',
            "    is_owner = str(message.from_user.id) in str(OWNER_ID)",
            "    await message.answer(",
            '        f\'<tg-emoji emoji-id="{first_emoji_id}">🔥</tg-emoji> <b>منوی دکمه‌های رنگی و ایموجی پرمیوم (Aiogram v3) فعال شد:</b>\',',
            "        reply_markup=build_store_reply_keyboard(is_owner),",
            "    )",
            "    await message.answer(",
            '        f\'<tg-emoji emoji-id="{first_emoji_id}">💎</tg-emoji> <b>به فروشگاه رسمی سلف و تبچی خوش آمدید!</b>\',',
            "        reply_markup=build_store_inline_keyboard(is_owner),",
            "    )",
            "",
            "",
            "async def main():",
            "    await dp.start_polling(bot)",
            "",
            "",
            'if __name__ == "__main__":',
            "    asyncio.run(main())",
        ]
    )
    return "\n".join(lines)


def send_menu_via_aiogram(token: str, chat_id: str, store_data: Dict[str, Any]) -> Dict[str, Any]:
    sync_custom_emojis_via_aiogram(token)
    built = build_aiogram_keyboards_from_store_data(store_data, is_admin=True)
    header_id = built["header_emoji_id"]
    welcome_raw = (
        store_data.get("settings", {}).get("messages", {}).get("welcome")
        or store_data.get("settings", {}).get("welcomeText")
        or "👋 به فروشگاه رسمی سلف و تبچی خوش آمدید!"
    )
    welcome_html = (
        welcome_raw
        if "<tg-emoji" in welcome_raw
        else f'{custom_emoji_html("🔥", header_id)} {welcome_raw}'
    )

    # 1. Send ReplyKeyboardMarkup via aiogram schema
    reply_res = telegram_api_post(
        token,
        "sendMessage",
        {
            "chat_id": chat_id,
            "text": f'{custom_emoji_html("⚡", header_id)} <b>کیبورد رنگی و ایموجی پرمیوم با موتور پایتون Aiogram ({AIOGRAM_VERSION}) بروزرسانی شد:</b>',
            "parse_mode": ParseMode.HTML,
            "reply_markup": built["reply_markup"],
        },
    )

    # 2. Send InlineKeyboardMarkup via aiogram schema
    inline_res = telegram_api_post(
        token,
        "sendMessage",
        {
            "chat_id": chat_id,
            "text": welcome_html,
            "parse_mode": ParseMode.HTML,
            "reply_markup": built["inline_markup"],
        },
    )

    returned_markup = inline_res.get("result", {}).get("reply_markup", {})
    has_emoji_in_response = "icon_custom_emoji_id" in json.dumps(returned_markup)

    # If Telegram rejected icon_custom_emoji_id with HTTP 400, fallback cleanly while keeping visible emojis in text & style
    if not inline_res.get("ok"):
        cleaned_inline = json.loads(json.dumps(built["inline_markup"]))
        for row in cleaned_inline.get("inline_keyboard", []):
            for b in row:
                b.pop("icon_custom_emoji_id", None)
        inline_res_fallback = telegram_api_post(
            token,
            "sendMessage",
            {
                "chat_id": chat_id,
                "text": welcome_html,
                "parse_mode": ParseMode.HTML,
                "reply_markup": cleaned_inline,
            },
        )
        return {
            "ok": inline_res_fallback.get("ok", False),
            "aiogramVersion": AIOGRAM_VERSION,
            "aiogramNative": AIOGRAM_NATIVE,
            "telegramAcceptedCustomEmojiOnButton": False,
            "initialError": inline_res.get("description"),
            "result": inline_res_fallback.get("result"),
        }

    return {
        "ok": True,
        "aiogramVersion": AIOGRAM_VERSION,
        "aiogramNative": AIOGRAM_NATIVE,
        "telegramAcceptedCustomEmojiOnButton": has_emoji_in_response,
        "returnedReplyMarkup": returned_markup,
        "replyKeyboardOk": reply_res.get("ok", False),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Aiogram Custom Emoji & Colored Buttons Engine")
    parser.add_argument("action", choices=["sync-emojis", "send-menu", "generate-code", "status"])
    parser.add_argument("--token", default="", help="Telegram Bot Token")
    parser.add_argument("--chat-id", default="", help="Target Chat ID")
    parser.add_argument("--pack", default="", help="Sticker Pack URL or Name")
    args = parser.parse_args()

    store_data = load_store_data()
    token = args.token or store_data.get("settings", {}).get("botToken", "")

    if args.action == "status":
        print(
            json.dumps(
                {
                    "ok": True,
                    "aiogramNative": AIOGRAM_NATIVE,
                    "aiogramVersion": AIOGRAM_VERSION,
                    "pythonVersion": sys.version.split()[0],
                },
                ensure_ascii=False,
            )
        )
        return

    if args.action == "generate-code":
        code = generate_aiogram_python_code(store_data)
        print(
            json.dumps(
                {
                    "ok": True,
                    "aiogramNative": AIOGRAM_NATIVE,
                    "aiogramVersion": AIOGRAM_VERSION,
                    "code": code,
                },
                ensure_ascii=False,
            )
        )
        return

    if not token:
        print(json.dumps({"ok": False, "error": "توکن ربات تلگرام تنظیم نشده است."}, ensure_ascii=False))
        return

    if args.action == "sync-emojis":
        res = sync_custom_emojis_via_aiogram(token, args.pack)
        print(json.dumps({"ok": True, **res}, ensure_ascii=False))
        return

    if args.action == "send-menu":
        chat_id = args.chat_id or str(store_data.get("settings", {}).get("ownerTelegramId", "")).split(",")[0].strip()
        if not chat_id:
            print(json.dumps({"ok": False, "error": "آیدی عددی مالک تنظیم نشده است."}, ensure_ascii=False))
            return
        res = send_menu_via_aiogram(token, chat_id, store_data)
        print(json.dumps(res, ensure_ascii=False))
        return


if __name__ == "__main__":
    main()
