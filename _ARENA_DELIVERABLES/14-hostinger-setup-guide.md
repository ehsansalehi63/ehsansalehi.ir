# راهنمای گام‌به‌گام: اتصال هاستینگر برای لینکدین و هوش مصنوعی

هدف: دو مشکل باقیمانده را حل کنیم.

| مشکل | وضعیت فعلی | بعد از این راهنما |
|---|---|---|
| **لینکدین** | `The operation was aborted due to timeout` | ✅ از طریق رله منتشر می‌شود |
| **هوش مصنوعی** | به `api.gapgpt.ir` وصل است، نه AgentRouter | ✅ به AgentRouter وصل می‌شود |

**زمان کل: حدود ۴۵ دقیقه.**

---

# 🅰 بخش اول — هوش مصنوعی (۵ دقیقه، بدون نیاز به هاستینگر)

این ساده‌ترین بخش است و **همین الان قابل انجام**. کد سایت شما از قبل آماده است و فقط سه متغیر می‌خواهد.

## گام ۱ — کلید AgentRouter را بردارید

وارد پنل AgentRouter شوید و کلید API را کپی کنید.

## گام ۲ — تست کنید که از میزبان‌فا در دسترس است

از کامپیوتر خودتان این را بزنید:

```bash
curl -s -o /dev/null -w "AgentRouter: %{http_code} در %{time_total}s\n" https://agentrouter.org/v1/models
```

- اگر کد `200` یا `401` برگشت → ✅ سرویس بالاست
- اگر `000` یا timeout → از رله استفاده می‌کنیم (بخش دوم)

## گام ۳ — متغیرها را در میزبان‌فا تنظیم کنید

**cPanel → Setup Node.js App → ویرایش اپ → Environment Variables:**

```bash
OPENAI_BASE_URL=https://agentrouter.org/v1
OPENAI_API_KEY=<کلید AgentRouter شما>
OPENAI_MODEL=claude-opus-4-6
```

> ⚠️ توجه: `/v1` در انتها **الزامی است** برای حالت OpenAI-compatible.

سپس **Restart** بزنید.

## گام ۴ — تأیید کنید

```bash
curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://ehsansalehi.ir/api/admin/integrations-test
```

در خروجی دنبال این بگردید:
```json
"openai": { "ok": true, "detail": { "model": "claude-opus-4-6" } }
```

اگر `model` عوض شده بود → ✅ **هوش مصنوعی حل شد.**

---

# 🅱 بخش دوم — رله روی هاستینگر (۴۰ دقیقه)

این بخش لینکدین را حل می‌کند و زیرساخت اینستاگرام را هم آماده می‌کند.

## گام ۱ — ساخت SECRET مشترک (۱ دقیقه)

روی کامپیوتر خودتان:

```bash
openssl rand -hex 32
```

خروجی یک رشته ۶۴ کاراکتری است. **کپی کنید و نگه دارید** — در هر دو هاست به آن نیاز دارید.

مثال (شما مقدار خودتان را بسازید):
```
a3f8e1c94b7d2056f8e1a3c94b7d2056f8e1a3c94b7d2056f8e1a3c94b7d2056
```

## گام ۲ — ساخت اپ در hPanel (۱۰ دقیقه)

روش جدید هاستینگر **Git-محور** است. دو راه دارید:

### راه الف) از گیت‌هاب (توصیه‌شده — آپدیت خودکار)

1. وارد **hPanel** شوید
2. از منوی کناری → **Websites**
3. دکمه **Add Website** را بزنید
4. گزینه **Node.js Web App** (یا **Deploy Web App**) را انتخاب کنید
5. **Import Git Repository** را بزنید
6. روی **Authorize** کلیک کنید تا هاستینگر به گیت‌هاب دسترسی بگیرد
7. مخزن `ehsansalehi63/ehsansalehi.ir` را انتخاب کنید
8. تنظیمات:

| فیلد | مقدار |
|---|---|
| Branch | `arena/019fb245-ehsansalehi-ir` |
| Framework | `Other` |
| **Root directory** | `relay` ← **مهم‌ترین فیلد** |
| Build command | *(خالی بگذارید)* |
| Entry file | `server.js` |
| Node version | ۲۰ یا بالاتر |

> ⚠️ **نکته حیاتی:** `Root directory` را حتماً `relay` بگذارید، وگرنه هاستینگر کل سایت Next.js را می‌بیند و build شکست می‌خورد.

### راه ب) آپلود ZIP (ساده‌تر، بدون گیت‌هاب)

1. دو فایل `relay/server.js` و `relay/package.json` را در یک ZIP بگذارید
2. در hPanel → Add Website → Node.js Web App
3. گزینه **Upload files** را بزنید و ZIP را آپلود کنید
4. Entry file: `server.js`

> رله عمداً **بدون هیچ dependency** نوشته شده — پس `npm install` لازم نیست و خطای تحریم npm پیش نمی‌آید.

## گام ۳ — تنظیم متغیرها در هاستینگر (۵ دقیقه)

در hPanel → اپ رله → **Environment Variables**:

```bash
# ═══ اجباری ═══
RELAY_SECRET=<همان رشته ۶۴ کاراکتری گام ۱>

# ═══ لینکدین ═══
LINKEDIN_ACCESS_TOKEN=<توکن لینکدین شما>
LINKEDIN_AUTHOR_URN=urn:li:person:XXXXX

# ═══ پروکسی هوش مصنوعی (اختیاری — فقط اگر گام ۲ بخش الف شکست خورد) ═══
OPENAI_API_KEY=<کلید AgentRouter>
OPENAI_BASE_URL=https://agentrouter.org/v1

# ═══ اینستاگرام (فعلاً خالی — بعداً پر می‌شود) ═══
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_USER_ID=
```

سپس **Restart Application** بزنید.

## گام ۴ — تست رله (۲ دقیقه)

آدرس اپ را از hPanel بردارید (مثلاً `https://relay-abc.hostingersite.com`).

```bash
curl https://YOUR-RELAY-URL/health
```

خروجی مورد انتظار:
```json
{
  "ok": true,
  "service": "social-relay",
  "secretConfigured": true
}
```

اگر `secretConfigured: false` بود → متغیر `RELAY_SECRET` ذخیره نشده، دوباره تنظیم و Restart کنید.

## گام ۵ — ⭐ تست دسترسی (مهم‌ترین گام)

این تست می‌گوید **کدام سرویس واقعاً از هاستینگر باز است**:

```bash
SECRET="<RELAY_SECRET شما>"
RELAY="https://YOUR-RELAY-URL"

TS=$(date +%s)
SIG=$(printf '%s|{}' "$TS" | openssl dgst -sha256 -hmac "$SECRET" -r | cut -d' ' -f1)

curl -s -X POST "$RELAY/diagnose" \
  -H "X-Relay-Timestamp: $TS" \
  -H "X-Relay-Signature: $SIG" \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**خروجی را برای من بفرستید.** در آن می‌بینیم:

```json
"reachability": [
  { "name": "api.linkedin.com",    "ok": true, "ms": 210 },   ← باید true باشد
  { "name": "graph.instagram.com", "ok": true, "ms": 180 },
  { "name": "agentrouter.org",     "ok": true, "ms": 350 }
]
```

## گام ۶ — اتصال سایت اصلی (۵ دقیقه)

در **میزبان‌فا** → cPanel → Setup Node.js App → Environment Variables:

```bash
RELAY_URL=https://YOUR-RELAY-URL
RELAY_SECRET=<دقیقاً همان رشته گام ۱>
```

⚠️ اگر حتی یک کاراکتر فرق داشته باشد، امضا رد می‌شود و خطای «امضای نامعتبر» می‌گیرید.

سپس **Restart** بزنید.

## گام ۷ — دیپلوی کد جدید

کد رله و کلاینت در برنچ `arena/019fb245-ehsansalehi-ir` است. آن را در `main` مرج کنید تا دیپلوی خودکار اجرا شود.

## گام ۸ — تست نهایی لینکدین

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
□ کلید AgentRouter در میزبان‌فا تنظیم شد
□ OPENAI_BASE_URL روی agentrouter.org/v1 است
□ integrations-test مدل جدید را نشان می‌دهد
□ RELAY_SECRET ساخته و در جای امن ذخیره شد
□ اپ رله در hPanel ساخته شد (Root directory = relay)
□ متغیرهای رله تنظیم شدند
□ /health پاسخ ok می‌دهد
□ خروجی /diagnose گرفته و بررسی شد
□ RELAY_URL و RELAY_SECRET در میزبان‌فا تنظیم شدند
□ کد جدید دیپلوی شد
□ لینکدین در integrations-test سبز شد
```

---

# 🔧 عیب‌یابی

| خطا | علت | راه‌حل |
|---|---|---|
| `امضای نامعتبر` | SECRET در دو هاست یکسان نیست | دقیقاً کپی-پیست کنید، فاصله اضافه نباشد |
| `timestamp منقضی` | ساعت سرورها اختلاف دارد | معمولاً خودکار حل می‌شود |
| `اتصال به رله ناموفق` | URL غلط یا اپ خاموش | `/health` را در مرورگر باز کنید |
| build شکست می‌خورد | Root directory اشتباه | باید دقیقاً `relay` باشد |
| `secretConfigured: false` | متغیر ذخیره نشده | دوباره تنظیم + Restart |
| اپ خودبه‌خود می‌خوابد | محدودیت پلن اشتراکی | یک Cron هر ۱۰ دقیقه `/health` را صدا بزند |

## نگه داشتن اپ بیدار

برخی پلن‌های اشتراکی اپ بی‌استفاده را می‌خوابانند. یک Cron در میزبان‌فا بگذارید:

```cron
*/10 * * * * curl -fsS https://YOUR-RELAY-URL/health >/dev/null 2>&1
```

---

# 📌 نکته درباره اینستاگرام

رله از الان آماده اینستاگرام است، ولی توکن ندارید. تا آن موقع:

```bash
INSTAGRAM_MODE=semi
ADMIN_TELEGRAM_CHAT_ID=<آیدی عددی تلگرام شما>
```

با این تنظیم، پست‌ها به تلگرام شما می‌آیند و با یک لمس منتشر می‌کنید. **هیچ پستی گم نمی‌شود.**

هر وقت توکن گرفتید، فقط `INSTAGRAM_MODE=auto` کنید — بقیه کد تغییر نمی‌کند.
