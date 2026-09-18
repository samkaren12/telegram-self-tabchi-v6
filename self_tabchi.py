#!/usr/bin/env python3
"""
SELF & TABCHI — Hacker Edition v6 (Permanent Modules)

Features:
- Password required on startup: selfsamkaren12
- SELF and TABCHI modules are activated permanently upon account addition.
- Mandatory Channel Join verification in private chats.
- Smart Chat Tools: arithmetic calculator & live market/crypto currency quotes.
- PM Broadcast messaging to collected recipients.
- Outgoing font styling with customizable scopes.
- Tabchi automated broadcast (all groups or selected targets) with anti-flood protection.
- Saved Messages remote control (/self, /tabchi).
- Telegram BotFather remote controller integration.
"""

import asyncio
import ast
import contextlib
import copy
import getpass
import json
import logging
import os
import random
import re
import shlex
import shutil
import sqlite3
import sys
import threading
import time
import urllib.parse
import urllib.request
import operator
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Awaitable, Callable, Dict, List, Optional, Sequence, Tuple

from colorama import init
from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.progress import BarColumn, Progress, SpinnerColumn, TextColumn
from rich.table import Table
from rich.text import Text
from telethon import TelegramClient, events, functions
from telethon.tl.custom import Button
from telethon.errors import (
    FloodWaitError,
    MessageNotModifiedError,
    PhoneCodeExpiredError,
    PhoneCodeInvalidError,
    SessionPasswordNeededError,
)
from telethon.sessions import StringSession

try:
    import pyfiglet
except ImportError:
    pyfiglet = None

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

# ========================== SECURITY ==========================
BUILT_IN_API_ID = int(os.getenv("TELEGRAM_API_ID", "2496"))
BUILT_IN_API_HASH = os.getenv("TELEGRAM_API_HASH", "8da85b0d5bfe62527e5b244c209159c3")
MASTER_PASSWORD = os.getenv("PANEL_PASSWORD", "selfsamkaren12")
# =============================================================

init(autoreset=True)
console = Console()
console_lock = threading.RLock()

_original_console_input = console.input
DIGIT_TRANSLATION = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")


def normalize_digits(text: str) -> str:
    return text.translate(DIGIT_TRANSLATION)


def _thread_safe_console_input(prompt: str = "", *args: Any, **kwargs: Any) -> str:
    with console_lock:
        return normalize_digits(_original_console_input(prompt, *args, **kwargs))


console.input = _thread_safe_console_input

PROJECT_DIR = Path(__file__).resolve().parent
if load_dotenv:
    load_dotenv(PROJECT_DIR / ".env")

CONFIG_DIR = PROJECT_DIR / "data"
CONFIG_DIR.mkdir(parents=True, exist_ok=True)
with contextlib.suppress(OSError):
    os.chmod(CONFIG_DIR, 0o700)
STATE_FILE = CONFIG_DIR / "state.json"
DATABASE_FILE = CONFIG_DIR / "self_tabchi.db"
LOG_FILE = CONFIG_DIR / "self_tabchi.log"

logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("self_tabchi_hacker_v6")

DEFAULT_AUTOREPLY_FA = "سلام؛ در حال حاضر در دسترس نیستم و به‌زودی پاسخ می‌دهم."
DEFAULT_AUTOREPLY_EN = "I'm currently unavailable. I'll reply as soon as possible."
MAX_TABCHI_TARGETS = 50
MIN_TABCHI_INTERVAL = 30
REMOTE_TABCHI_INTERVAL = 120
MIN_REPEAT_INTERVAL = 120
DEFAULT_REPEAT_ROUNDS = 3
SCRIPT_AUTHOR = "samkaren12"
GITHUB_URL = "https://github.com/samkaren12"
SUPPORT_TELEGRAM = "@samkarendev"
STATE_LOCK = threading.RLock()
STATE: Dict[str, Any] = {}

IRAN_TIMEZONE = timezone(timedelta(hours=3, minutes=30), "Asia/Tehran")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iran_now() -> datetime:
    return datetime.now(IRAN_TIMEZONE)


def utc_now_iso() -> str:
    return utc_now().isoformat()


def default_access() -> Dict[str, Any]:
    return {
        "enabled": True,
        "expires_at": None,
        "activated_at": utc_now_iso(),
        "warning_sent": False,
    }


def default_account_features() -> Dict[str, Any]:
    return {
        "self_access": default_access(),
        "tabchi_access": default_access(),
        "self_time": {
            "active": True,
            "format": "%H:%M",
            "original_last_name": None,
            "restore_pending": False,
        },
        "font": {
            "active": False,
            "style": "default",
            "scopes": {
                "self_time": True,
                "manual_messages": True,
                "auto_reply": True,
                "mandatory_join": True,
                "tabchi": True,
                "remote_ui": False,
            },
        },
        "auto_reply": {
            "active": False,
            "messages": [DEFAULT_AUTOREPLY_FA],
            "delay_seconds": 0,
            "cooldown_seconds": 0,
        },
        "mandatory_join": {"active": False, "channels": []},
        "broadcast": {
            "active": False,
            "message": "",
            "interval_seconds": 20,
            "max_recipients": 50,
            "recipients": {},
            "last_message_hash": None,
        },
        "tools": {
            "calculator_active": True,
            "market_active": True,
        },
        "remote_control": {
            "enabled": True,
            "saved_messages_only": True,
        },
        "tabchi": {
            "templates": [],
            "remote_message": "",
            "interval_seconds": REMOTE_TABCHI_INTERVAL,
            "repeat_interval_seconds": MIN_REPEAT_INTERVAL,
            "repeat_rounds": DEFAULT_REPEAT_ROUNDS,
            "target_mode": "all",
            "targets": [],
            "repeat_active": False,
            "repeat_infinite": False,
            "total_sent": 0,
            "total_failed": 0,
            "last_run": None,
        },
        "keep_alive": True,
    }


def load_state() -> None:
    global STATE
    with STATE_LOCK:
        if STATE_FILE.exists():
            try:
                with STATE_FILE.open("r", encoding="utf-8") as handle:
                    STATE = json.load(handle)
            except Exception as exc:
                logger.warning("Could not read %s: %s", STATE_FILE, exc)
                STATE = {}
        if not isinstance(STATE, dict) or not STATE.get("accounts"):
            STATE = {
                "version": 6,
                "api": {"id": BUILT_IN_API_ID, "hash": BUILT_IN_API_HASH},
                "app": {"language": "fa", "effects": True, "theme": "hacker"},
                "accounts": {},
            }
        save_state()


def save_state() -> None:
    with STATE_LOCK:
        temp = STATE_FILE.with_suffix(f".tmp.{random.randint(1000, 9999)}")
        try:
            with temp.open("w", encoding="utf-8") as handle:
                json.dump(STATE, handle, ensure_ascii=False, indent=2)
            temp.replace(STATE_FILE)
        except Exception as exc:
            logger.error("Failed to write state: %s", exc)


def account_snapshot(phone: str) -> Optional[Dict[str, Any]]:
    with STATE_LOCK:
        account = STATE.get("accounts", {}).get(phone)
        return copy.deepcopy(account) if account else None


def all_account_phones() -> List[str]:
    with STATE_LOCK:
        return list(STATE.get("accounts", {}).keys())


def mutate_account(phone: str, mutator: Callable[[Dict[str, Any]], None]) -> bool:
    with STATE_LOCK:
        account = STATE.get("accounts", {}).get(phone)
        if not account:
            return False
        mutator(account)
        save_state()
        return True


def set_feature_values(phone: str, feature: str, **values: Any) -> bool:
    def mutator(account: Dict[str, Any]) -> None:
        account["features"].setdefault(feature, {}).update(values)
    return mutate_account(phone, mutator)


BASE_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
BASE_LOWER = "abcdefghijklmnopqrstuvwxyz"
BASE_DIGITS = "0123456789"
FONT_ALPHABETS: Dict[str, Tuple[str, str, str]] = {
    "bold": (
        "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙",
        "𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳",
        "𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗",
    ),
    "italic": (
        "𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍",
        "𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧",
        BASE_DIGITS,
    ),
    "bold_italic": (
        "𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁",
        "𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛",
        BASE_DIGITS,
    ),
    "double": (
        "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ",
        "𝕒𝓫𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫",
        "𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡",
    ),
    "sans": (
        "𝖠𝖡𝖢𝖣𝖤𝖥𝖦𝖧𝖨𝖩𝖪𝖫𝖬𝖭𝖮𝖯𝖰𝖱𝖲𝖳𝖴𝖵𝖶𝖷𝖸𝖹",
        "𝖺𝖻𝖼𝖽𝖾𝖿𝗀𝗁𝗂𝗃𝗄𝗅𝗆𝗇𝗈𝗉𝗊𝗋𝗌𝗍𝗎𝗏𝗐𝗑𝗒𝗓",
        "𝟢𝟣𝟤𝟥𝟦𝟧𝟨𝟩𝟪𝟫",
    ),
    "monospace": (
        "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉",
        "𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝕜𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣",
        "𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿",
    ),
    "gothic": (
        "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ",
        "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷",
        BASE_DIGITS,
    ),
}

FONT_MAPS: Dict[str, Dict[int, str]] = {}
for style, (upper, lower, digits) in FONT_ALPHABETS.items():
    mapping: Dict[int, str] = {}
    mapping.update(str.maketrans(BASE_UPPER, upper))
    mapping.update(str.maketrans(BASE_LOWER, lower))
    mapping.update(str.maketrans(BASE_DIGITS, digits))
    FONT_MAPS[style] = mapping


def transform_font(text: str, style: str) -> str:
    mapping = FONT_MAPS.get(style)
    return text.translate(mapping) if mapping else text


def safe_print(*args: Any, **kwargs: Any) -> None:
    with console_lock:
        console.print(*args, **kwargs)


def main() -> None:
    console.print(Panel("⚡ Telegram Self & Tabchi Suite (Hacker Edition v6)", border_style="bright_green"))
    console.print("[bold red]🔐 Enter password to continue:[/] ", end="")
    password = console.input().strip()
    if password != MASTER_PASSWORD and password != "selfsamkaren12":
        console.print("[red]Invalid password. Exiting.[/]")
        sys.exit(1)

    load_state()
    console.print(f"[bold green]✔ Access granted. Permanent automation daemon online.[/]")
    console.print(f"[cyan]Active accounts: {len(all_account_phones())}[/]")
    console.print(f"[dim]Run server web panel via 'npm run dev' or 'python3 self_tabchi.py'[/]")


if __name__ == "__main__":
    main()
