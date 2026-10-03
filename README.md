<div align="center">

# ⚡ TELEGRAM SELF & TABCHI — HACKER EDITION v6 PRO
### **سامانه پیشرفته اتوماسیون سلف، تبچی، فروشگاه تلگرامی و دستیار هوشمند لینوکس**
#### **Full-Stack Telegram MTProto Automation • 24/7 PM2 Daemon • Dedicated Terminal CLI**

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-v18%20|%20v20%20LTS-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Telegram MTProto](https://img.shields.io/badge/Telegram-MTProto%20v2.0-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://telegram.org/)
[![PM2 24/7](https://img.shields.io/badge/Daemon-PM2%20Permanent%2024%2F7-2B037A?style=for-the-badge&logo=pm2&logoColor=white)](https://pm2.keymetrics.io/)
[![SSL / TLS](https://img.shields.io/badge/Security-SSL%20%26%20AutoRenew-00E676?style=for-the-badge&logo=letsencrypt&logoColor=black)](#-سیستم-گواهی-امنیتی-ssl-و-دامنه)
[![Terminal CLI](https://img.shields.io/badge/CLI-sudo%20selfandtabchi-FF6D00?style=for-the-badge&logo=gnubash&logoColor=white)](#-دستیار-خط-فرمان-ترمینال-sudo-selfandtabchi)

<br/>

<p align="center">
  <a href="#-فهرست-مطالب-table-of-contents"><b>🇮🇷 راهنمای فارسی</b></a> •
  <a href="#-دستیار-خط-فرمان-ترمینال-sudo-selfandtabchi"><b>💻 دستور sudo selfandtabchi</b></a> •
  <a href="#-سیستم-گواهی-امنیتی-ssl-و-دامنه"><b>🔒 دامنه و SSL</b></a> •
  <a href="#-english-documentation"><b>🇬🇧 English Documentation</b></a>
</p>

---

> **سیستم خودکار و دائم‌الاجرای مدیریت اکانت‌های تلگرام، مجهز به پنل وب اختصاصی، پروتکل رسمی MTProto، ورود مستقیم با شماره تلفن و کد تایید ۵ رقمی، تایید دو‌مرحله‌ای (2FA)، ساعت زنده روی پروفایل، تبچی پرسرعت، منشی هوشمند، ماژول فروشگاه پلن‌های تلگرام با دکمه‌های رنگی، و دستیار خط فرمان `sudo selfandtabchi` برای مدیریت مستقیم سرور.**

</div>

---

## 📑 فهرست مطالب (Table of Contents)

- [💻 دستیار خط فرمان ترمینال (sudo selfandtabchi)](#-دستیار-خط-فرمان-ترمینال-sudo-selfandtabchi)
  - [منوی عددی دستیار لینوکس](#منوی-عددی-دستیار-لینوکس)
  - [توضیح کامل هر گزینه و عملکرد آن](#توضیح-کامل-هر-گزینه-و-عملکرد-آن)
- [🚀 نصب سریع با یک کلیک (1-Click Universal Install)](#-نصب-سریع-با-یک-کلیک-1-click-universal-install)
- [🔒 سیستم گواهی امنیتی SSL و دامنه (Domain & SSL System)](#-سیستم-گواهی-امنیتی-ssl-و-دامنه)
- [🛍️ ماژول فروشگاه تلگرام با دکمه‌های رنگی (Store Bot Suite)](#-ماژول-فروشگاه-تلگرام-با-دکمههای-رنگی-store-bot-suite)
- [🌟 ویژگی‌های کلیدی سامانه (Key Features)](#-ویژگیهای-کلیدی-سامانه-key-features)
- [📊 جدول مقایسه امکانات (Feature Matrix)](#-جدول-مقایسه-امکانات-feature-matrix)
- [🔄 اجرای دائمی ۲۴/۷ در پس‌زمینه (Permanent 24/7 Daemon)](#-اجرای-دائمی-۲۴۷-در-پسزمینه-permanent-247-daemon)
- [📱 راهنمای جامع اتصال اکانت (MTProto Phone Login & 2FA)](#-راهنمای-جامع-اتصال-اکانت-mtproto-phone-login--2fa)
- [🕹️ دستورات کنترل از راه دور (Remote Commands Cheat-Sheet)](#-دستورات-کنترل-از-راه-دور-remote-commands-cheat-sheet)
- [🏗️ معماری و ساختار پروژه (Project Architecture)](#-معماری-و-ساختار-پروژه-project-architecture)
- [❓ سوالات متداول و عیب‌یابی (FAQ)](#-سوالات-متداول-و-عیبیابی-faq)
- [🇬🇧 English Documentation](#-english-documentation)
  - [Terminal CLI Assistant (sudo selfandtabchi)](#terminal-cli-assistant-sudo-selfandtabchi)
  - [SSL & Custom Domain Engine](#ssl--custom-domain-engine)
  - [Store Bot & Color Buttons](#store-bot--color-buttons)
- [📜 مجوز و سلب مسئولیت (License & Disclaimer)](#-مجوز-و-سلب-مسئولیت-license--disclaimer)

---

## 💻 دستیار خط فرمان ترمینال (`sudo selfandtabchi`)

هنگام نصب اسکریپت بر روی سرور مجازی (VPS)، یک باینری سراسری در مسیرهای استاندارد لینوکس (`/usr/local/bin/selfandtabchi` و `/usr/bin/selfandtabchi`) ثبت می‌شود.  
از این پس در هر زمان که به سرور SSH بزنید، کافی است دستور زیر را تایپ کنید:

```bash
sudo selfandtabchi
```

بلافاصله یک منوی گرافیکی و رنگی به زبان فارسی در ترمینال شما باز می‌شود:

```text
╔═══════════════════════════════════════════════════════════════════════════╗
║   ⚡ TELEGRAM SELF & TABCHI v6 - SERVER MANAGEMENT ASSISTANT               ║
║   سیستم یکپارچه مدیریت سرور، بروزرسانی، دامنه و گواهی امنیتی SSL           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ 🌐 آی‌پی عمومی سرور:   194.135.24.89                                     ║
║ 📊 وضعیت سرویس:       آنلاین و در حال اجرا (PM2)                           ║
║ 🔒 وضعیت SSL:         فعال (panel.mydomain.com - 365 روز اعتبار)          ║
║ 📁 مسیر پروژه:        /root/telegram-self-tabchi-v6                       ║
║ 🔗 لینک وب پنل:       http://194.135.24.89:3000 یا https://...:3443       ║
╚═══════════════════════════════════════════════════════════════════════════╝

لطفاً یکی از گزینه‌های زیر را با وارد کردن شماره انتخاب نمایید:

  [1] 🚀 شروع / راه‌اندازی مجدد سرویس (Start / Restart)
  [2] 🛑 توقف سرویس تلگرام (Stop Service)
  [3] 🔄 بروزرسانی اسکریپت به آخرین نسخه (Update Script)
  [4] 🌐 تنظیم و تغییر دامنه سرور (Set / Change Domain)
  [5] 🔒 دریافت و نصب گواهی SSL روی دامنه یا آی‌پی (Issue SSL Certificate)
  [6] 🛡️ فعال‌سازی سرویس تمدید خودکار SSL (Auto-Renewal Daemon)
  [7] 📜 مشاهده لاگ‌های زنده سیستم (View Live Logs)
  [8] 🔑 تغییر رمز ورود مالک و احراز هویت (Change Admin Password)
  [9] 🗑️ حذف کامل اسکریپت و پاکسازی سرور (Uninstall Script)
  [0] 🚪 خروج (Exit)

👉 شماره مورد نظر را وارد کرده و Enter بزنید: 
```

### منوی عددی دستیار لینوکس

| عدد (شماره) | نام عملیات | عملکرد دقیق |
| :---: | :--- | :--- |
| **`1`** | **شروع / ریستارت سرویس** | بررسی پروسه‌های فعال، آزادسازی پورت‌های مسدود شده، و اجرای مجدد دیمن در PM2. |
| **`2`** | **توقف سرویس تلگرام** | متوقف کردن سریع پردازش‌های در حال اجرای سلف و تبچی در پس‌زمینه. |
| **`3`** | **بروزرسانی خودکار اسکریپت** | دریافت آخرین نسخه از گیت‌هاب، نصب وابستگی‌های npm، کامپایل مجدد و بیلد پروژه بدون از دست رفتن سشن‌ها. |
| **`4`** | **تنظیم و تغییر دامنه** | اتصال ساب‌دامین یا دامنه اختصاصی به سرور، چنج دامنه قبلی و اتصال به منوی دریافت گواهی SSL. |
| **`5`** | **صدور گواهی امنیتی SSL** | امکان انتخاب صدور گواهی رسمی بین‌المللی Let's Encrypt برای دامنه یا ایجاد گواهی OpenSSL SAN اختصاصی برای IP سرور. |
| **`6`** | **سرویس تمدید خودکار SSL** | فعال‌سازی دیمن پس‌زمینه که هر ۱۲ ساعت تاریخ انقضای گواهی را چک کرده و به صورت خودکار آن را تمدید می‌کند. |
| **`7`** | **مشاهده لاگ‌های زنده** | استریم زنده خروجی کنسول و لاگ‌های ارسالی اکانت‌های تلگرام، تبچی و سلف در لحظه با `pm2 logs`. |
| **`8`** | **تغییر رمز عبور مالک** | تغییر سریع کلمه عبور ورود به پنل تحت‌وب به صورت مستقیم و امن از داخل ترمینال لینوکس. |
| **`9`** | **حذف کامل اسکریپت (Uninstall)** | با تایید عبارت `DELETE` تمام سرویس‌ها متوقف، پورت‌ها آزاد، فایل‌های پروژه و دستور باینری به طور تمیز از سرور پاکسازی می‌شوند. |
| **`0`** | **خروج** | بازگشت عادی به خط فرمان شل لینوکس. |

---

## 🚀 نصب سریع با یک کلیک (1-Click Universal Install)

تنها با وارد کردن دستور زیر در محیط ترمینال SSH سرور (Ubuntu, Debian, CentOS, AlmaLinux, Fedora)، پروژه دانلود، کامپایل و راه‌اندازی می‌گردد:

```bash
# نصب خودکار با یک دستور (شامل نصب Node.js، PM2، بیلد و ثبت دستور sudo selfandtabchi)
curl -fsSL https://raw.githubusercontent.com/samkaren12/telegram-self-tabchi-v6/main/install.sh | bash
```

> 💡 **نکته بسیار مهم:** پس از اتمام نصب، برنامه در دیمن پس‌زمینه PM2 قرار می‌گیرد و **می‌توانید با خیال راحت پنجره SSH، PuTTY یا سیستم خود را ببندید**؛ سرویس به صورت ۲۴ ساعته فعال خواهد بود.

---

## 🔒 سیستم گواهی امنیتی SSL و دامنه (Domain & SSL System)

این نسخه مجهز به موتور اختصاصی صدور گواهی SSL و پشتیبانی از دامنه اختصاصی است:

### ۱. اتصال دامنه اختصاصی (Custom Domain)
1. در پنل کلودفلر یا هاستینگ خود، یک رکورد **`A`** با مقدار آی‌پی عمومی سرور ایجاد کنید (مثال: `panel.yourdomain.com`).
2. دستور `sudo selfandtabchi` را بزنید و عدد **`4`** را انتخاب کنید، یا در پنل وب به بخش **مدیریت دامنه و SSL** بروید.
3. دامنه را وارد کنید؛ سرور بلافاصله به عنوان دامنه اصلی تنظیم می‌شود.

### ۲. دریافت گواهی SSL معتبر
- **برای دامنه اختصاصی:** با استفاده از ابزار یکپارچه **Let's Encrypt / Certbot** گواهی رسمی صادر می‌شود.
- **برای آی‌پی سرور (Direct IP):** گواهی اختصاصی پیشرفته **OpenSSL Multi-SAN** با پشتیبانی از ساب‌دامین‌های خودکار `nip.io` و `sslip.io` تولید شده و پنل روی پورت امن **`3443`** در دسترس قرار می‌گیرد:
  - `https://YOUR_DOMAIN:3443`
  - `https://YOUR_SERVER_IP:3443`
- **دیمن تمدید خودکار (Auto-Renew):** دیمن هوشمند در پس‌زمینه سرور اجرا شده و چنانچه اعتبار گواهی به زیر ۱۵ روز برسد، بدون نیاز به اقدام دستی آن را تمدید می‌کند.

---

## 🛍️ ماژول فروشگاه تلگرام با دکمه‌های رنگی (Store Bot Suite)

سامانه دارای سیستم فروش پلن‌های سلف، تبچی و پکیج‌های ترکیبی از طریق ربات تلگرام است:

### ویژگی‌های ربات فروشگاهی:
- 🎨 **۷ تم رنگی و بصری متنوع برای دکمه‌ها:**
  - 💎 **نئون سایبری (Cyber Neon):** رنگ‌های سبز، فیروزه‌ای و دیاموند
  - 🔮 **کهکشان بنفش (Galaxy Purple):** بنفش متالیک، ستاره‌ای و نئون
  - 👑 **طلایی لاکچری (Luxury Gold):** زرد کهربایی، تاج و طلای مات
  - ⚡ **کریپتو سایان (Crypto Cyan):** آبی اقیانوسی و تکنولوژی
  - 🔴 **آتشین رد (Fire Red):** تم قرمز نئونی، آتشین و پرانرژی
  - 🌲 **ماتریکس زمردی (Emerald Matrix):** سبز هکری، برگ زمرد و زیتونی
  - 🌈 **رنگین‌کمان شاد (Rainbow Vivid):** تلفیق پر جنب و جوش رنگ‌ها
- 🔄 **پشتیبانی از دو حالت کیبورد (Inline / Reply Keyboard):**
  - حالت **دکمه شیشه‌ای (Inline Buttons)** درون پیام‌های چت
  - حالت **کیبورد لمسی پایین صفحه (Bottom Reply Keyboard)**
  - دکمه سوئیچ آنی برای تغییر چیدمان دکمه‌ها توسط کاربر
- 💳 **درگاه‌های پرداخت چندگانه:**
  - کارت به کارت با ارسال فیش بانکی و تایید هوشمند
  - درگاه‌های ریالی زرین‌پال، آیدی‌پی، نکست‌پی
  - پرداخت تتری و ارزی کریپتو (USDT TRC20, TON, TRX)
- 🖥️ **شبیه‌ساز زنده تلگرام در پنل:** پیش‌نمایش گرافیکی و تست کلیک منوها در داشبورد قبل از تست روی تلگرام واقعی.

---

## 🌟 ویژگی‌های کلیدی سامانه (Key Features)

### 1. 🛡️ امنیت و احراز هویت استارتاپ (Startup Security)
* **قفل اختصاصی ورود به پنل:** محافظت از داشبورد با گذرواژه `selfsamkaren12` جهت جلوگیری از دسترسی‌های غیرمجاز.
* **دسترسی چندسطحی:** امکان تغییر نام‌کاربری و پسورد مالک در پنل وب و از طریق `sudo selfandtabchi`.
* **ذخیره‌سازی رمزنگاری‌شده سشن‌ها:** سشن‌های MTProto در دایرکتوری ایزوله نگهداری شده و پس از ریستارت سرور نیازی به لاگین مجدد ندارند.

### 2. ⚡ ماژول سلف فوق پیشرفته (Self Suite v6)
* 🕒 **ساعت زنده روی نام پروفایل (Live Profile Clock):** آپدیت لحظه‌ای نام‌خانوادگی اکانت به ساعت روز با فرمت دلخواه (`HH:mm` یا `HH:mm:ss`).
* ✍️ **استایل‌دهی فونت هوشمند (7 Font Styles):** استایل‌های Bold، Monospace، Sans، Double Struck، Gothic، Small Caps با تعیین **اسکوپ‌های مجزا** (ساعت، چت دستی، منشی، تبچی).
* 💬 **منشی هوشمند (Smart Auto-Reply):** پاسخ‌دهی خودکار به پیام‌های خصوصی با تنظیم تاخیر پاسخ (Anti-Spam Delay).
* 🔒 **عضویت اجباری کانال (Mandatory Channel Join):** الزام کاربران پی‌وی به عضویت در کانال‌های شما قبل از پاسخ‌دهی خودکار منشی.
* 🧮 **ماشین‌حساب هوشمند چت (Smart Calculator):** محاسبه در لحظه عبارات ریاضی در چت با فرمت `=1250 * 18 - 450`.
* 📈 **استعلام قیمت لحظه‌ای ارز و طلا (Live Market Quotes):** دریافت قیمت دلار، تتر، طلا، بیت‌کوین و اتریوم مستقیماً در متن گفتگو.
* 📢 **ارسال همگانی پی‌وی (PM Broadcaster):** ارسال پیام اطلاع‌رسانی به لیست افرادی که به اکانت شما پیام داده‌اند با قابلیت کنترل سرعت و توقف اضطراری.

### 3. 🚀 تبچی انبوه و هوشمند (Tabchi Broadcaster v6)
* 🎯 **دو حالت هدف‌گیری پیشرفته:** ارسال به **تمام سوپرگروه‌های عضو** یا **لیست اختصاصی از گروه‌ها/سوپرگروه‌ها**.
* 🔁 **تکرار نامحدود و چرخه‌ای:** ارسال مستمر ۲۴/۷ یا دوره‌ای (تنظیم تعداد دور دلخواه).
* 🛡️ **سیستم آنتی‌فلود و ایمنی تلگرام:** تاخیر خودکار بین ارسال‌ها، مکث‌های متغیر و مدیریت خطای `FloodWaitError` بدون دیلیت شدن اکانت.

### 4. 🤖 کنترل از راه دور تلگرام (Bot & Saved Messages)
* **کنترل با چت Saved Messages:** صدور فرمان به سلف و تبچی مستقیماً در Saved Messages خود اکانت بدون نیاز به ورود به مرورگر.
* **داشبورد رنگی ربات تلگرام (Color Grid Bot):** دکمه‌های شیشه‌ای ۳تایی با نشانگرهای رنگی برای روشن/خاموش کردن سرویس‌ها در یک نگاه.
* **ورود به پنل وب از داخل ربات:** دکمه اختصاصی Web App جهت ورود سریع به پنل مرورگر مستقیماً از درون تلگرام.

### 5. ⏳ سیستم مدیریت اشتراک و روزشمار مجزا (Subscription & Expiry Engine)
* **روزشمار مستقل برای هر اکانت:** تعیین زمان انقضا بر حسب روز (۷، ۱۵، ۳۰، ۶۰، ۹۰، ۱۸۰، ۳۶۵ روز یا عدد دلخواه) یا **اشتراک نامحدود (دائمی) ♾️**.
* **محافظت خودکار پس از انقضا:** در صورت پایان مهلت اشتراک، ماژول‌های سلف و تبچی آن شماره جهت جلوگیری از سوءاستفاده متوقف شده و نیاز به تمدید توسط مالک اعلام می‌شود.
* **مودال تمدید سریع در پنل وب:** امکان تمدید فوری، تغییر نوع پلن، مشاهده تاریخ دقیق انقضا و افزودن یادداشت/برچسب مشتری.

---

## 📊 جدول مقایسه امکانات (Feature Matrix)

| قابلیت / امکان | Hacker Edition v6 (این پروژه) | ربات‌های سنتی تلگرام | پروژه‌های متفرقه گیت‌هاب |
| :--- | :---: | :---: | :---: |
| **دستیار خط فرمان لینوکس (`sudo selfandtabchi`)** | ✅ منوی عددی فارسی کامل | ❌ ندارد | ❌ ندارد |
| **رابط وب و داشبورد زنده** | ✅ داشبورد React 19 مدرن | ❌ بدون پنل کاربری | ⚠️ فقط خط فرمان (CLI) |
| **ورود با شماره و کد مستقیم** | ✅ مستقیم از تلگرام MTProto | ❌ توکن بات ساده | ⚠️ نیاز به کدهای دستی |
| **پشتیبانی از رمز 2FA ابری** | ✅ پشتیبانی کامل با Hint | ❌ ندارد | ⚠️ باگ مکرر در احراز |
| **اجرای ۲۴/۷ حتی بعد از بستن ترمینال** | ✅ با دیمن PM2 و Systemd | ❌ قطع با بستن ترمینال | ❌ دستی |
| **گواهی SSL خودکار برای دامنه و IP** | ✅ Let's Encrypt و SAN دایمی | ❌ ندارد | ❌ ندارد |
| **ربات فروشگاهی با دکمه رنگی** | ✅ ۷ تم رنگی و سوئیچ کیبورد | ❌ ندارد | ❌ ندارد |
| **ساعت زنده روی پروفایل با ۷ استایل** | ✅ کاملاً خودکار و پایدار | ❌ ندارد | ⚠️ ساده بدون استایل |
| **عضویت اجباری کانال در پی‌وی** | ✅ بررسی مستقیم MTProto | ❌ محدود به ربات | ❌ ندارد |
| **استعلام زنده طلا، دلار و کریپتو** | ✅ با API زنده بدون قطعی | ❌ ندارد | ❌ ندارد |
| **تبچی با تفکیک سوپرگروه/گروه** | ✅ هوشمند با آنتی‌فلود | ❌ مسدود شدن سریع | ⚠️ خطر اسپم بالا |
| **روزشمار و مدیریت اشتراک هر اکانت** | ✅ روزشمار هوشمند + مودال تمدید | ❌ ندارد | ❌ ندارد |

---

## 🔄 اجرای دائمی ۲۴/۷ در پس‌زمینه (Permanent 24/7 Daemon)

برای مدیریت فرآیند پس‌زمینه از دستورات زیر استفاده کنید:

```bash
# روش پیشنهادی (سریع‌ترین): اجرای دستیار ترمینال
sudo selfandtabchi

# دستورات مستقیم PM2:
pm2 status                          # مشاهده وضعیت زنده و مصرف منابع
pm2 logs telegram-self-tabchi-v6   # مشاهده لاگ‌های زنده تلگرام در لحظه
pm2 restart telegram-self-tabchi-v6 # ریستارت کردن سرویس
pm2 stop telegram-self-tabchi-v6    # توقف کامل سرویس
pm2 startup && pm2 save            # فعال‌سازی استارت خودکار هنگام ریبوت VPS
```

### روش جایگزین با اسکریپت‌های توکار:
* **اجرای پس‌زمینه ۲۴/۷:** `./start.sh` (استفاده از دیمن مستقل `nohup` با ذخیره PID)
* **بررسی وضعیت و لاگ‌ها:** `./status.sh`
* **توقف سرویس:** `./stop.sh`

---

## 📱 راهنمای جامع اتصال اکانت (MTProto Phone Login & 2FA)

۱. وارد داشبورد به آدرس `http://YOUR_SERVER_IP:3000` (یا آدرس امن `https://YOUR_DOMAIN:3443`) شوید.  
۲. رمز عبور استارتاپ (`selfsamkaren12`) را وارد کنید.  
۳. دکمه **«اتصال حساب تلگرام»** را انتخاب کنید.  
۴. شماره تلفن بین‌المللی خود را به همراه کد کشور وارد کنید (مثال: `+989123456789`).  
۵. دکمه **«ارسال کد تایید تلگرام»** را بزنید. تلگرام یک کد ۵ رقمی درون اپلیکیشن یا از طریق پیامک برای شما ارسال می‌کند.  
۶. کد ۵ رقمی را وارد نمایید.  
۷. در صورتی که تایید دومرحله‌ای (Two-Step Verification) فعال باشد، فیلد رمز عبور ابری باز شده و راهنمای رمز (Hint) نیز به شما نمایش داده می‌شود.  
۸. پس از تایید، اکانت فوراً متصل شده و ماژول‌های سلف و تبچی برای آن فعال می‌شوند.

---

## 🕹️ دستورات کنترل از راه دور (Remote Commands Cheat-Sheet)

شما می‌توانید بدون ورود به پنل، در چت **Saved Messages (پیام‌های ذخیره‌شده)** اکانت تلگرام متصل، دستورات زیر را ارسال کنید:

| دستور (Command) | توضیحات عملکرد |
| :--- | :--- |
| `/help` یا `راهنما` | نمایش لیست کامل فرامین و راهنمای کنترل سلف و تبچی |
| `/status` یا `وضعیت` | دریافت وضعیت زنده، میزان آپتایم، تعداد پیام‌های تبچی و سلف |
| `/self on` | فعال‌سازی ماژول سلف، ساعت پروفایل و منشی |
| `/self off` | غیرفعال‌سازی موقت ماژول‌های سلف |
| `/clock on` | فعال کردن ساعت زنده روی نام پروفایل |
| `/clock off` | متوقف کردن ساعت پروفایل و بازگردانی نام قبلی |
| `/autoreply on` | روشن کردن منشی خودکار برای پی‌وی |
| `/autoreply off` | خاموش کردن منشی خودکار |
| `/font bold` | تغییر استایل قلم به ضخیم (Bold) |
| `/font mono` | تغییر استایل قلم به تک‌فاصله (Monospace) |
| `/font normal` | بازگردانی قلم به حالت عادی |
| `/tabchi start` | آغاز به کار کمپین تبچی در تمام گروه‌های عضو |
| `/tabchi stop` | توقف فوری ارسال تبلیغات تبچی |
| `/tabchi send <متن>` | تغییر متن تبلیغاتی تبچی و شروع ارسال فوری |
| `/sub` | مشاهده وضعیت و تعداد روزهای باقی‌مانده اشتراک اکانت |
| `/ping` | تست اتصال اکانت و سرعت پاسخگویی تلگرام |

---

## 🏗️ معماری و ساختار پروژه (Project Architecture)

```
telegram-self-tabchi-v6/
├── scripts/
│   └── selfandtabchi.sh       # اسکریپت باینری دستیار خط فرمان ترمینال (sudo selfandtabchi)
├── data/                       # پایگاه داده محلی سشن‌ها و گزارشات
│   ├── accounts.json          # مشخصات اکانت‌های متصل و کانفیگ ماژول‌ها
│   ├── bot_settings.json      # تنظیمات ربات اختصاصی تلگرام
│   ├── store_data.json        # تنظیمات، محصولات و درگاه‌های ربات فروشگاهی
│   ├── ssl/                   # فایل‌های گواهی SSL و کلید‌های خصوصی (Let's Encrypt / SAN)
│   │   └── ssl-config.json    # وضعیت دامنه و اعتبار سنجی خودکار
│   └── logs/                  # فایل‌های لاگ و خطایابی ۲۴/۷
├── dist/                      # بیلد نهایی و بهینه‌سازی‌شده سرور و کلاینت
│   ├── server.cjs             # سرور تجمیعی و قدرتمند بک‌اند
│   └── index.html             # پنل کاربری مدرن SPA
├── src/                       # سورس‌کد فرانت‌اند React 19 & Tailwind
│   ├── components/            # کامپوننت‌های ماژولار (Self, Tabchi, StoreBot, SSL, ...)
│   ├── types.ts               # تایپ‌های یکپارچه TypeScript
│   └── utils/i18n.ts          # سیستم دو زبانه (فارسی و انگلیسی)
├── server/                    # ماژول‌های هسته بک‌اند MTProto
│   ├── telegramManager.ts     # مدیریت نشست‌های GramJS و چرخه‌های ۲۴/۷
│   ├── storeBotManager.ts     # موتور مدیریت ربات فروشگاهی با دکمه‌های رنگی
│   ├── sslManager.ts          # موتور صدور گواهی SSL برای IP و دامنه
│   └── sslDaemon.ts           # دیمن پس‌زمینه بازرسی و تمدید خودکار گواهی
├── ecosystem.config.cjs       # کانفیگ رسمی PM2 جهت اجرای ابدی بدون خاموشی
├── install.sh                 # اسکریپت نصب خودکار و لینک باینری به /usr/local/bin
├── start.sh / stop.sh         # اسکریپت‌های مدیریت پس‌زمینه
├── status.sh                  # مانیتور وضعیت و لاگ‌ها
└── package.json               # وابستگی‌ها و اسکریپت‌های اجرایی
```

---

## ❓ سوالات متداول و عیب‌یابی (FAQ)

<details>
<summary><b>۱. دستور sudo selfandtabchi کار نمی‌کند، چه کنم؟</b></summary>
اگر به هر دلیلی اسکریپت را به روش دستی نصب کرده‌اید، می‌توانید دستور زیر را یک‌بار در ترمینال بزنید تا باینری لینک شود:
<pre><code>sudo chmod +x /root/telegram-self-tabchi-v6/scripts/selfandtabchi.sh
sudo ln -sf /root/telegram-self-tabchi-v6/scripts/selfandtabchi.sh /usr/local/bin/selfandtabchi</code></pre>
</details>

<details>
<summary><b>۲. آیا پس از بستن ترمینال یا قطع شدن اینترنت، ربات خاموش می‌شود؟</b></summary>
<b>خیر!</b> به دلیل استفاده از PM2 Daemon و فرآیند پس‌زمینه مجزا، سرور بر روی سرور مجازی شما کاملاً مستقل اجرا می‌شود. شما حتی می‌توانید رایانه یا گوشی خود را خاموش کنید؛ ربات و سلف به صورت ۲۴ ساعته فعال خواهند بود.
</details>

<details>
<summary><b>۳. چگونه پورت‌های ۳۰۰۰ و ۳۴۴۳ را در فایروال لینوکس (UFW) باز کنم؟</b></summary>

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 3443/tcp
sudo ufw allow 80/tcp
sudo ufw reload
```
سپس می‌توانید با مرورگر به `http://YOUR_SERVER_IP:3000` یا `https://YOUR_DOMAIN:3443` متصل شوید.
</details>

<details>
<summary><b>۴. چگونه رمز عبور استارتاپ پنل را تغییر دهم؟</b></summary>
کافی است دستور `sudo selfandtabchi` را در ترمینال وارد کرده و گزینه **`[8]`** را انتخاب کنید، یا در پنل وب روی دکمه «تغییر نام‌کاربری و رمز عبور اختصاصی مالک» کلیک نمایید.
</details>

---

<div id="-english-documentation"></div>

# 🇬🇧 English Documentation

## Overview & Architecture

**Telegram Self & Tabchi — Hacker Edition v6** is an enterprise-grade, high-concurrency automation suite and web dashboard for Telegram accounts. Powered by **React 19**, **Vite**, **Tailwind CSS**, and **GramJS (MTProto v2.0)**, it provides genuine Telegram MTProto protocol connectivity, eliminating the risks and constraints of generic bot tokens.

### Key Capabilities:
- **Terminal Assistant CLI (`sudo selfandtabchi`):** Direct terminal management menu for updates, uninstall, domain switching, SSL issuing, and live logs.
- **Direct MTProto Phone Login:** Real phone number authorization, SMS/Telegram app code receiver, and cloud Two-Step Verification (2FA) with password hint.
- **Autonomous Self Suite:** Live profile clock updates with 7 distinct typography styles, smart auto-responder with anti-flood delay, mandatory channel subscription enforcement, live crypto/currency quote query, and arithmetic expression solver.
- **Tabchi Broadcaster Engine:** Multi-target advertising module supporting all joined supergroups or custom curated group lists with scheduled repeat cycles.
- **Store Bot Module with Color Buttons:** 7 eye-catching visual themes with dual Inline & Reply keyboards and multi-gateway checkout.
- **SSL Certificate Engine:** Automatic Let's Encrypt for domains and OpenSSL SAN for direct server IP addresses on secure port `3443`.
- **24/7 Background Persistence:** Pre-configured PM2 cluster ensuring round-the-clock uptime even after closing SSH sessions.

---

## Terminal CLI Assistant (`sudo selfandtabchi`)

Once installed, manage your VPS server from anywhere via terminal:

```bash
sudo selfandtabchi
```

### Numbered Action Menu:
* **`[1] Start / Restart:`** Flush blocked ports and reload the background process.
* **`[2] Stop Service:`** Stop running Telegram engines.
* **`[3] Update Script:`** Fetch the latest repository code, install dependencies, rebuild assets, and reload cleanly.
* **`[4] Set / Change Domain:`** Link a custom domain or subdomain to the server IP.
* **`[5] Issue SSL Certificate:`** Issue official Let's Encrypt certificates or local High-Grade SAN certificates for raw IP addresses.
* **`[6] Auto-Renewal Daemon:`** Enable continuous background SSL health monitoring and automatic cert renewals.
* **`[7] View Live Logs:`** Real-time streaming logs from MTProto connections and broadcaster engine.
* **`[8] Change Admin Password:`** Fast and secure password reset directly from the shell.
* **`[9] Uninstall Script:`** Completely remove all processes, PM2 daemons, database records, and project files cleanly.
* **`[0] Exit:`** Return to standard shell.

---

## 1-Click Installation Command

Deploy instantly on Ubuntu / Debian / CentOS / AlmaLinux:

```bash
curl -fsSL https://raw.githubusercontent.com/samkaren12/telegram-self-tabchi-v6/main/install.sh | bash
```

---

## 📜 مجوز و سلب مسئولیت (License & Disclaimer)

**فارسی:**  
این پروژه برای اهداف آموزشی، پژوهشی و مدیریت شخصی حساب‌های تلگرام توسعه یافته است. استفاده از امکانات ارسال انبوه پیام باید مطابق با قوانین و راهنماهای رسمی تلگرام باشد. مسئولیت هرگونه استفاده نادرست، اسپم یا نقض قوانین کاربری تلگرام مستقیماً بر عهده کاربر است.

**English:**  
This project is licensed under the Hacker Edition v6 Permanent License. Developed strictly for educational, administrative, and research purposes. Users are solely responsible for compliance with Telegram's Terms of Service and anti-spam regulations.

---

<div align="center">
  <sub>Built with ❤️ by <b>SamKaren</b> • Dedicated to Advanced Telegram Automation & VPS Engineering</sub>
</div>
