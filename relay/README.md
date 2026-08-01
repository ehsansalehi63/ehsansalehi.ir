# رله انتشار شبکه‌های اجتماعی

سرویس واسطی که روی **هاستینگر (خارج از ایران)** اجرا می‌شود تا کانال‌هایی که از IP ایران در دسترس نیستند — اینستاگرام، لینکدین، فیسبوک و منابع RSS تحریم‌شده — قابل استفاده شوند.

```
میزبان‌فا (ایران)                 هاستینگر Business (خارج)
├─ ehsansalehi.ir                ├─ رله (Node.js App)
├─ دیتابیس                       │   ├─ /publish   اینستاگرام، لینکدین، فیسبوک
├─ تلگرام، بله، ایتا ✅           │   ├─ /fetch     RSS تحریم‌شده
└─ پنل مدیریت                    │   ├─ /ai        پروکسی AgentRouter
        │                        │   └─ /diagnose  تشخیص دسترسی
        └──── HTTPS + HMAC ──────┘
```

**ویژگی‌ها:** بدون هیچ dependency، بدون دیتابیس، بدون داده مشتری. اگر رله از دسترس خارج شود، سایت اصلی و فروش دست‌نخورده کار می‌کند.

---

## ⚠️ مهم: خطای «Next.js framework» را چطور رفع کنیم

اگر هنگام ساخت اپ این خطا را دیدید:

> *The project is configured as a Next.js framework but lacks a `build` script...*

**علت:** هاستینگر `package.json` **ریشه مخزن** را دیده (که Next.js است) نه پوشه `relay` را.

**دو راه‌حل:**

### راه ۱ — آپلود ZIP (ساده‌ترین و مطمئن‌ترین) ⭐
فایل `relay-hostinger.zip` را آپلود کنید. چون فقط شامل فایل‌های رله است،
هاستینگر هیچ ردی از Next.js نمی‌بیند.

| تنظیم | مقدار |
|---|---|
| Framework | **Other** یا **Node.js** (هرگز Next.js) |
| Build command | خالی بگذارید یا `npm run build` |
| Entry / Startup file | `server.js` |
| Output directory | خالی بگذارید |

### راه ۲ — از گیت‌هاب
حتماً `Root directory` را روی `relay` بگذارید و Framework را **Other** انتخاب کنید.
اگر پنل اجازه تغییر Framework نداد، از راه ۱ استفاده کنید.

> نسخه فعلی `package.json` رله از قبل یک `build` script بی‌اثر دارد،
> پس حتی اگر پنل اصرار به اجرای build کند، بدون خطا رد می‌شود.

---

## نصب روی هاستینگر (پلن Business)

### گام ۱ — ساخت اپ Node.js

در hPanel:
```
Websites → Manage → Node.js App (یا Web Apps) → Create Application
```

| فیلد | مقدار |
|---|---|
| Node.js version | ۲۰ یا بالاتر |
| Application root | `relay` |
| Application URL | زیردامنه یا مسیر دلخواه |
| Application startup file | `server.js` |

### گام ۲ — آپلود فایل‌ها

چهار فایل لازم است:
```
relay/server.js      ← سرور اصلی
relay/app.js         ← نقطه ورود جایگزین (بعضی پنل‌ها دنبال این می‌گردند)
relay/package.json   ← شامل build script بی‌اثر
relay/.nvmrc         ← نسخه Node
```

با File Manager یا SSH آپلود کنید. **نیازی به `npm install` نیست** — رله عمداً بدون dependency نوشته شده تا روی هاست‌های محدود بدون دردسر اجرا شود.

### گام ۳ — تنظیم متغیرهای محیطی

در hPanel → Node.js App → Environment Variables:

```bash
# ═══ اجباری ═══
RELAY_SECRET=<یک رشته تصادفی ۳۲+ کاراکتری>
PORT=3001                     # معمولاً hPanel خودش تنظیم می‌کند

# ═══ اینستاگرام (مسیر Creator — بدون نیاز به صفحه فیسبوک) ═══
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_USER_ID=

# ═══ لینکدین ═══
LINKEDIN_ACCESS_TOKEN=
LINKEDIN_AUTHOR_URN=urn:li:person:XXXX

# ═══ فیسبوک (اختیاری) ═══
FB_PAGE_ACCESS_TOKEN=
FB_PAGE_ID=

# ═══ دروازه هوش مصنوعی ═══
OPENAI_API_KEY=<کلید واقعی AgentRouter>
OPENAI_BASE_URL=https://agentrouter.org/v1
AI_GATEWAY_KEY=<رمز دلخواه برای اجازه دسترسی سایت>
```

برای ساخت `RELAY_SECRET`:
```bash
openssl rand -hex 32
```

### گام ۴ — تست

```bash
curl https://YOUR-RELAY-DOMAIN/health
```

خروجی مورد انتظار:
```json
{ "ok": true, "service": "social-relay", "secretConfigured": true }
```

### گام ۵ — اتصال سایت اصلی

در `.env` روی **میزبان‌فا**:
```bash
RELAY_URL=https://YOUR-RELAY-DOMAIN
RELAY_SECRET=<دقیقاً همان مقدار مرحله ۳>
INSTAGRAM_MODE=auto
ADMIN_TELEGRAM_CHAT_ID=<آیدی عددی تلگرام شما>
```

⚠️ `RELAY_SECRET` باید در **هر دو هاست دقیقاً یکسان** باشد، وگرنه امضا رد می‌شود.

---

## بررسی دسترسی رله

مهم‌ترین تست — می‌گوید کدام سرویس از هاستینگر در دسترس است:

```bash
SECRET="RELAY_SECRET-شما"
TS=$(date +%s)
SIG=$(printf '%s|{}' "$TS" | openssl dgst -sha256 -hmac "$SECRET" -r | cut -d' ' -f1)

curl -s -X POST https://YOUR-RELAY-DOMAIN/diagnose \
  -H "X-Relay-Timestamp: $TS" \
  -H "X-Relay-Signature: $SIG" \
  -H 'Content-Type: application/json' \
  -d '{}' | jq
```

---

## 🤖 دروازه هوش مصنوعی (OpenAI-compatible)

AgentRouter از IP ایران در دسترس نیست. به‌جای تغییر کد سایت، رله **دقیقاً مثل یک endpoint استاندارد OpenAI** رفتار می‌کند.

در سایت اصلی (میزبان‌فا) فقط این سه متغیر:

```bash
OPENAI_BASE_URL=https://YOUR-RELAY-DOMAIN/v1
OPENAI_API_KEY=<همان AI_GATEWAY_KEY>
<<<<<<< HEAD
OPENAI_MODEL=claude-opus-4-6
=======
OPENAI_MODEL=claude-opus-5
>>>>>>> 8b4e4d1 (feat(relay): auto-route claude-* models to Anthropic endpoint, fix double /v1 path, update model to claude-opus-5)
```

پکیج `openai` بدون هیچ تغییر کدی از رله استفاده می‌کند.

<<<<<<< HEAD
=======
### 🔀 مسیریابی خودکار مدل

AgentRouter دو endpoint جدا دارد و رله **خودکار** تشخیص می‌دهد کدام را صدا بزند:

| مدل | مسیر واقعی | یادداشت |
|---|---|---|
| `claude-opus-5`, `claude-*` | `https://agentrouter.org/v1/messages` (Anthropic) | رله درخواست و پاسخ را ترجمه می‌کند |
| `gpt-5.6`, `gpt-5.5`, `glm-5.2` | `https://agentrouter.org/v1/chat/completions` (OpenAI) | مستقیم پروکسی می‌شود |

شما فقط `OPENAI_MODEL` را تنظیم می‌کنید؛ بقیه خودکار است.
برای دیدن اینکه کدام مسیر رفته، هدر پاسخ `X-Relay-Route` را ببینید.

> ⚠️ **حالت stream** برای مدل‌های Claude از طریق رله پشتیبانی نمی‌شود.
> اگر `stream: true` بفرستید، خطای روشن ۴۰۰ می‌گیرید. کد فعلی سایت stream استفاده نمی‌کند.

>>>>>>> 8b4e4d1 (feat(relay): auto-route claude-* models to Anthropic endpoint, fix double /v1 path, update model to claude-opus-5)
### چرا این طراحی امن‌تر است

| مورد | توضیح |
|---|---|
| کلید واقعی AgentRouter | فقط روی رله می‌ماند — هرگز به سرور ایران نمی‌رود |
| کلید سایت (`AI_GATEWAY_KEY`) | فقط اجازه عبور می‌دهد؛ اگر لو رفت راحت عوض می‌شود |
| احراز هویت | هدر استاندارد `Authorization` (نه HMAC) چون پکیج openai نمی‌تواند امضا بسازد |

### تست

```bash
curl -s -X POST https://YOUR-RELAY-DOMAIN/v1/chat/completions \
  -H "Authorization: Bearer YOUR_AI_GATEWAY_KEY" \
  -H 'Content-Type: application/json' \
<<<<<<< HEAD
  -d '{"model":"claude-opus-4-6","messages":[{"role":"user","content":"بگو سلام"}]}'
=======
  -d '{"model":"claude-opus-5","messages":[{"role":"user","content":"بگو سلام"}]}'
>>>>>>> 8b4e4d1 (feat(relay): auto-route claude-* models to Anthropic endpoint, fix double /v1 path, update model to claude-opus-5)
```

---

## مسیرهای API

| مسیر | کاربرد | احراز هویت |
|---|---|---|
| `GET /health` | زنده بودن | ندارد |
| `POST /v1/chat/completions` | دروازه AI (OpenAI-compatible) | Bearer |
| `POST /publish` | انتشار در اینستاگرام، لینکدین، فیسبوک | HMAC |
| `POST /fetch` | دریافت محتوای تحریم‌شده | HMAC |
| `POST /ai` | پروکسی AgentRouter | HMAC |
| `POST /instagram/refresh-token` | تمدید توکن ۶۰ روزه | HMAC |
| `POST /diagnose` | تشخیص دسترسی | HMAC |
| `POST /logs` | ۵۰ لاگ اخیر | HMAC |

### نمونه انتشار

```json
POST /publish
{
  "channel": "instagram",
  "kind": "image",
  "mediaUrls": ["https://ehsansalehi.ir/images/post.jpg"],
  "caption": "متن پست\n\n#هشتگ",
  "link": "https://ehsansalehi.ir/news/123"
}
```

`kind` می‌تواند `image`، `carousel`، `reel` یا `story` باشد.

---

## امنیت

| لایه | توضیح |
|---|---|
| امضای HMAC-SHA256 | روی `timestamp\|body` — بدون secret هیچ درخواستی پذیرفته نمی‌شود |
| پنجره زمانی ۵ دقیقه | جلوگیری از replay attack |
| مقایسه timing-safe | جلوگیری از timing attack |
| محافظت SSRF | `/fetch` به شبکه داخلی دسترسی ندارد |
| سقف حجم ۲ مگابایت | جلوگیری از DoS |
| بدون داده مشتری | رله فقط عبوردهنده است |

---

## ⚠️ تمدید توکن اینستاگرام

توکن بلندمدت اینستاگرام **هر ۶۰ روز منقضی می‌شود**. اگر تمدید نشود، انتشار خودکار متوقف می‌شود.

یک Cron ماهانه روی میزبان‌فا بگذارید:
```cron
0 3 1 * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://ehsansalehi.ir/api/cron/refresh-tokens
```

یا مستقیماً از رله:
```bash
POST /instagram/refresh-token
```

خروجی، توکن جدید را برمی‌گرداند که باید در متغیرهای محیطی جایگزین شود.

---

## رفتار هنگام خطا

سیستم سه لایه دارد تا **هیچ پستی گم نشود**:

```
۱) رله        → اگر موفق: تمام
۲) تلاش مستقیم → فقط اگر رله تنظیم نشده باشد
۳) تلگرام مدیر → تصویر + کپشن آماده، انتشار با یک لمس
```

با `INSTAGRAM_MODE=semi` مستقیماً لایه ۳ فعال می‌شود — مناسب برای وقتی که هنوز توکن ندارید.

---

## عیب‌یابی

| مشکل | علت محتمل | راه‌حل |
|---|---|---|
| `امضای نامعتبر` | `RELAY_SECRET` در دو هاست یکسان نیست | مقادیر را دقیقاً مقایسه کنید |
| `timestamp منقضی` | ساعت سرورها اختلاف دارد | ساعت سرور را همگام کنید |
| `اتصال به رله ناموفق` | اپ اجرا نشده یا URL غلط | `/health` را مستقیم باز کنید |
| `کانتینر آماده نشد` | تصویر خیلی بزرگ یا فرمت اشتباه | JPG زیر ۸ مگابایت |
| اپ خودبه‌خود خاموش می‌شود | محدودیت منابع پلن اشتراکی | لاگ hPanel را ببینید |
