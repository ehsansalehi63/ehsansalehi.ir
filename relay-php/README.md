# رله PHP — نصب در ۱۰ دقیقه

نسخه PHP رله، معادل کامل نسخه Node.js است ولی روی هاست اشتراکی **بدون هیچ تنظیمی** کار می‌کند.

## چرا PHP؟

| | Node.js روی hPanel | PHP |
|---|---|---|
| راه‌اندازی | تنظیم framework، entry file، output directory، port | فقط آپلود فایل |
| اگر تشخیص اشتباه شود | اصلاً اجرا نمی‌شود (مشکل فعلی) | همیشه کار می‌کند |
| قابلیت‌ها | همه | **دقیقاً همه** |
| امضای HMAC | ✅ | ✅ **کاملاً سازگار** |

> ✅ **تأیید شده:** امضای HMAC نسخه PHP بایت‌به‌بایت با نسخه Node یکسان است.
> یعنی کد سایت (`relayClient.ts`) **هیچ تغییری لازم ندارد**.

---

## 📦 گام ۱ — آپلود فایل‌ها

سه فایل را در **`public_html`** آپلود کنید:

```
public_html/
├── relay.php          ← رله اصلی
├── relay-config.php   ← کلیدها
└── .htaccess          ← مسیریابی
```

**روش:** hPanel → File Manager → وارد `public_html` شوید → Upload

> ⚠️ اگر از قبل اپ Node.js ساخته‌اید، **اول آن را حذف کنید** تا دامنه آزاد شود.
> در غیر این صورت `.htaccess` اپ Node بر این یکی اولویت می‌گیرد.

---

## 🔑 گام ۲ — تنظیم کلیدها

فایل `relay-config.php` را در File Manager ویرایش کنید:

```php
return [
    'relay_secret'      => 'یک-رشته-۶۴-کاراکتری',
    'ai_gateway_key'    => 'یک-رمز-دلخواه',
    'openai_api_key'    => 'کلید-واقعی-AgentRouter',
    'openai_base'       => 'https://agentrouter.org/v1',
    'anthropic_base'    => 'https://agentrouter.org',
    'linkedin_token'    => 'توکن-لینکدین',
    'linkedin_author'   => 'urn:li:person:XXXX',
];
```

برای ساخت `relay_secret` روی کامپیوتر خودتان:
```bash
openssl rand -hex 32
```

---

## ✅ گام ۳ — تست

```bash
curl https://your-domain.com/health
```

خروجی مورد انتظار:
```json
{
  "ok": true,
  "service": "social-relay-php",
  "php": "8.2.x",
  "secretConfigured": true,
  "aiGateway": { "enabled": true, "gateKeySet": true }
}
```

### اگر ۴۰۴ گرفتید
`.htaccess` کار نمی‌کند. از این آدرس جایگزین استفاده کنید:
```
https://your-domain.com/relay.php?path=health
```
اگر این کار کرد، همه‌جا از فرمت `?path=` استفاده کنید.

---

## 🔍 گام ۴ — تست دسترسی (مهم‌ترین)

```bash
SECRET="relay_secret شما"
URL="https://your-domain.com"

TS=$(date +%s)
SIG=$(printf '%s|{}' "$TS" | openssl dgst -sha256 -hmac "$SECRET" -r | cut -d' ' -f1)

curl -s -X POST "$URL/diagnose" \
  -H "X-Relay-Timestamp: $TS" \
  -H "X-Relay-Signature: $SIG" \
  -H 'Content-Type: application/json' -d '{}'
```

می‌گوید کدام سرویس از هاستینگر در دسترس است:
```json
"reachability": [
  { "name": "api.linkedin.com",    "ok": true, "ms": 210 },
  { "name": "agentrouter.org",     "ok": true, "ms": 340 },
  { "name": "graph.instagram.com", "ok": true, "ms": 180 }
]
```

---

## 🔗 گام ۵ — اتصال سایت

در **میزبان‌فا** → cPanel → Node.js App → Environment Variables:

```bash
RELAY_URL=https://your-relay-domain.com
RELAY_SECRET=<دقیقاً همان relay_secret>

OPENAI_BASE_URL=https://your-relay-domain.com/v1
OPENAI_API_KEY=<همان ai_gateway_key>
OPENAI_MODEL=claude-opus-5
```

سپس **Restart** بزنید.

> ⚠️ `OPENAI_API_KEY` در میزبان‌فا **کلید AgentRouter نیست** — همان `ai_gateway_key` است.
> کلید واقعی فقط روی رله می‌ماند و هرگز به سرور ایران نمی‌رود.

---

## 🤖 دروازه هوش مصنوعی

رله دقیقاً مثل یک endpoint استاندارد OpenAI رفتار می‌کند:

```bash
curl -X POST https://your-relay-domain.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_AI_GATEWAY_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"claude-opus-5","messages":[{"role":"user","content":"سلام"}]}'
```

### مسیریابی خودکار مدل

| مدل | مسیر واقعی |
|---|---|
| `claude-opus-5`, `claude-*` | `agentrouter.org/v1/messages` (Anthropic) |
| `gpt-5.6`, `gpt-5.5`, `glm-5.2` | `agentrouter.org/v1/chat/completions` |

رله خودش تشخیص می‌دهد و ترجمه می‌کند. هدر `X-Relay-Route` نشان می‌دهد کدام مسیر رفته.

> حالت `stream` برای مدل‌های Claude پشتیبانی نمی‌شود (خطای روشن ۴۰۰). کد فعلی سایت stream استفاده نمی‌کند.

---

## 📋 مسیرهای API

| مسیر | کاربرد | احراز هویت |
|---|---|---|
| `GET /health` | زنده بودن | ندارد |
| `POST /v1/chat/completions` | دروازه AI | Bearer |
| `POST /publish` | انتشار اینستاگرام/لینکدین/فیسبوک | HMAC |
| `POST /fetch` | دریافت محتوای تحریم‌شده | HMAC |
| `POST /diagnose` | تشخیص دسترسی | HMAC |
| `POST /instagram/refresh-token` | تمدید توکن ۶۰ روزه | HMAC |

اگر `.htaccess` کار نکرد، به‌جای `/publish` از `/relay.php?path=publish` استفاده کنید.

---

## 🔒 امنیت

| لایه | توضیح |
|---|---|
| HMAC-SHA256 | امضا روی `timestamp\|body` |
| پنجره ۵ دقیقه | ضد replay attack |
| `hash_equals` | مقایسه timing-safe |
| محافظت SSRF | `/fetch` به شبکه داخلی دسترسی ندارد |
| جداسازی کلید | کلید AgentRouter هرگز به سرور ایران نمی‌رود |
| `.htaccess` | فایل `relay-config.php` از دسترسی مستقیم مسدود است |

**تست کنید که config قابل خواندن نباشد:**
```bash
curl https://your-domain.com/relay-config.php
```
باید ۴۰۳ بدهد یا خالی باشد — نه محتوای فایل.

---

## ⚠️ تمدید توکن اینستاگرام

توکن هر **۶۰ روز** منقضی می‌شود. یک Cron ماهانه در میزبان‌فا بگذارید، وگرنه انتشار بی‌صدا متوقف می‌شود.

---

## 🔧 عیب‌یابی

| مشکل | راه‌حل |
|---|---|
| `۴۰۴` روی `/health` | از `?path=health` استفاده کنید |
| `امضای نامعتبر` | `relay_secret` در دو طرف دقیقاً یکسان نیست |
| `timestamp منقضی` | ساعت سرورها اختلاف دارد |
| `کلید دروازه AI نامعتبر` | `ai_gateway_key` با `OPENAI_API_KEY` سایت یکی نیست |
| `cURL error` | ممکن است هاست allow_url_fopen را بسته باشد |
| صفحه سفید | لاگ خطای PHP را در hPanel ببینید |
