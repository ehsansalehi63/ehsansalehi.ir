# چطور تست کنم هر دو طرف درست ست شده‌اند؟

دو طرف داریم و هر کدام تست جدا دارد:

```
میزبان‌فا (سایت)  ──────►  هاستینگر (رله)  ──────►  AgentRouter / لینکدین
      تست ب                    تست الف
```

---

# 🅰 تست الف — رله روی هاستینگر

## سریع‌ترین راه (۵ ثانیه)

این آدرس را در مرورگر باز کنید:

```
https://darkslategrey-woodcock-525023.hostingersite.com/health
```

### چه باید ببینید

```json
{
  "ok": true,
  "service": "social-relay-php",
  "php": "8.3.30",
  "secretConfigured": true,
  "aiGateway": {
    "enabled": true,      ← باید true باشد
    "gateKeySet": true    ← باید true باشد
  }
}
```

| فیلد | معنی |
|---|---|
| `secretConfigured: true` | `relay_secret` پر شده ✅ |
| `enabled: true` | `openai_api_key` (کلید AgentRouter) پر شده |
| `gateKeySet: true` | `ai_gateway_key` پر شده |

> اگر `false` دیدید → در File Manager هاستینگر، `public_html/relay-config.php` را ویرایش کنید.

## تست کامل با اسکریپت

```bash
curl -sO https://raw.githubusercontent.com/ehsansalehi63/ehsansalehi.ir/arena/019fb245-ehsansalehi-ir/_ARENA_DELIVERABLES/tools/check-relay-php.sh

bash check-relay-php.sh https://darkslategrey-woodcock-525023.hostingersite.com YOUR_RELAY_SECRET
```

خروجی، جدول دسترسی را نشان می‌دهد:
```
    [OK ] graph.instagram.com        180 ms
    [OK ] api.linkedin.com           210 ms
    [OK ] agentrouter.org            340 ms
```

## تست مستقیم هوش مصنوعی

```bash
curl -X POST https://darkslategrey-woodcock-525023.hostingersite.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_AI_GATEWAY_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"claude-opus-5","messages":[{"role":"user","content":"فقط بنویس OK"}]}'
```

اگر پاسخی مثل این گرفتید، دروازه AI کار می‌کند:
```json
{"choices":[{"message":{"content":"OK"}}],"model":"claude-opus-5"}
```

---

# 🅱 تست ب — سایت به رله وصل است؟

## گام ۱ — متغیرها را در میزبان‌فا بگذارید

**cPanel → Setup Node.js App → ویرایش اپ → Environment Variables:**

```bash
RELAY_URL=https://darkslategrey-woodcock-525023.hostingersite.com
RELAY_SECRET=<همان relay_secret که در relay-config.php گذاشتید>

OPENAI_BASE_URL=https://darkslategrey-woodcock-525023.hostingersite.com/v1
OPENAI_API_KEY=<همان ai_gateway_key — نه کلید AgentRouter!>
OPENAI_MODEL=claude-opus-5
```

سپس **Restart** بزنید.

> ⚠️ **مهم‌ترین نکته:** `OPENAI_API_KEY` در میزبان‌فا **کلید AgentRouter نیست**.
> همان `ai_gateway_key` است. کلید واقعی فقط روی هاستینگر می‌ماند و هرگز به سرور ایران نمی‌رود.

## گام ۲ — کد جدید را دیپلوی کنید

برنچ `arena/019fb245-ehsansalehi-ir` را در `main` مرج کنید (PR #5) تا endpoint تست ساخته شود.

## گام ۳ — ⭐ تست یکجای کل زنجیره

```
https://ehsansalehi.ir/api/admin/relay-test?key=YOUR_CRON_SECRET
```

این endpoint **۸ مرحله** را پشت سر هم چک می‌کند:

| مرحله | چه چیزی را بررسی می‌کند |
|---|---|
| ۱ | متغیرهای رله در سایت تنظیم شده‌اند؟ |
| ۲ | سایت می‌تواند به رله وصل شود؟ |
| ۳ | امضای HMAC پذیرفته می‌شود؟ |
| ۴ | رله → AgentRouter |
| ۵ | رله → لینکدین |
| ۶ | رله → اینستاگرام |
| ۷ | کدام کلیدها روی رله پر شده‌اند |
| ۸ | **تست واقعی AI** — یک پیام می‌فرستد و جواب می‌گیرد |

### خروجی موفق

```json
{
  "ok": true,
  "summary": "8 از 8 مرحله موفق",
  "verdict": "🎉 همه‌چیز درست است — سایت و رله به هم وصل‌اند",
  "steps": [
    { "step": "۱. متغیرهای رله در سایت", "ok": true },
    { "step": "۳. تأیید امضای HMAC", "ok": true, "ms": 420 },
    { "step": "۸. تست واقعی AI از مسیر رله", "ok": true,
      "detail": "پاسخ: «OK» | مدل: claude-opus-5 | مسیر: anthropic" }
  ]
}
```

اگر مرحله‌ای قرمز بود، فیلد `hint` دقیقاً می‌گوید چه کنید.

## گام ۴ — تست لینکدین

```bash
curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://ehsansalehi.ir/api/admin/integrations-test
```

قبل:
```json
"linkedin": { "ok": false, "detail": "The operation was aborted due to timeout" }
```

بعد:
```json
"linkedin": { "ok": true, "message": "توکن لینکدین سالم است." }
```

---

# ✅ چک‌لیست نهایی

```
روی هاستینگر (relay-config.php):
  □ relay_secret پر شده
  □ ai_gateway_key پر شده
  □ openai_api_key = کلید واقعی AgentRouter
  □ linkedin_token و linkedin_author پر شده
  □ /health می‌گوید enabled: true

روی میزبان‌فا (Environment Variables):
  □ RELAY_URL
  □ RELAY_SECRET (دقیقاً همان relay_secret)
  □ OPENAI_BASE_URL = آدرس رله + /v1
  □ OPENAI_API_KEY = همان ai_gateway_key
  □ OPENAI_MODEL = claude-opus-5
  □ Restart زده شد

تست نهایی:
  □ /api/admin/relay-test می‌گوید 8 از 8
  □ integrations-test لینکدین را سبز نشان می‌دهد
```

---

# 🔧 عیب‌یابی سریع

| خطا | علت | راه‌حل |
|---|---|---|
| مرحله ۲ ناموفق | آدرس رله غلط | `RELAY_URL/health` را در مرورگر باز کنید |
| مرحله ۳: «امضای نامعتبر» | دو کلید یکی نیستند | `RELAY_SECRET` و `relay_secret` را کاراکتربه‌کاراکتر مقایسه کنید |
| مرحله ۴ ناموفق | AgentRouter از هاستینگر مسدود | کلید یا آدرس را بررسی کنید |
| مرحله ۸: «کلید دروازه AI نامعتبر» | `OPENAI_API_KEY` سایت را کلید AgentRouter گذاشته‌اید | باید `ai_gateway_key` باشد |
| مرحله ۸: timeout | مدل کند است | طبیعی است، دوباره امتحان کنید |
