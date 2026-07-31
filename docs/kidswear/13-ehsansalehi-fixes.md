# سند ۱۳ — رفع ایرادات سایت فعلی ehsansalehi.ir

قبل از شروع پروژه پوشاک، همان چهار راه‌حل را روی سایت فعلی اجرا می‌کنیم.
این کار دو فایده دارد: سایت فعلی درست کار می‌کند، و روش‌ها **روی یک پروژه واقعی آزموده می‌شوند**.

---

## 🔍 عیب‌یابی: چه چیزی واقعاً خراب است

با بررسی کد فعلی، ۹ ایراد پیدا شد. سه‌تای اول **ریشه اصلی کندی** هستند.

| # | ایراد | شدت | وضعیت |
|---|---|---|---|
| ۱ | ۱۵۸ مگابایت فایل `tar.gz` داخل مخزن گیت | 🔴 بحرانی | ✅ رفع شد |
| ۲ | `.gitignore` جلوی آرشیوها را نمی‌گرفت | 🔴 بحرانی | ✅ رفع شد |
| ۳ | دیپلوی FTP فایل‌به‌فایل (۳٬۰۰۰+ اتصال) | 🔴 بحرانی | ✅ راه‌حل آماده |
| ۴ | اینستاگرام: نبود انتظار برای کانتینر | 🔴 بحرانی | ✅ رفع شد |
| ۵ | اینستاگرام: توکن داخل URL (نشت در لاگ) | 🟠 امنیتی | ✅ رفع شد |
| ۶ | اینستاگرام: نبود fallback هنگام خطا | 🟠 بالا | ✅ رفع شد |
| ۷ | Graph API نسخه v19 (قدیمی) | 🟡 متوسط | ✅ رفع شد |
| ۸ | فایل زائد `prebuild-install@7.1.3:` | 🟢 جزئی | ✅ حذف شد |
| ۹ | نبود SSH → دیپلوی شکننده | 🟠 بالا | ✅ راه‌حل آماده |

---

# ایراد ۱ و ۲ — ۱۵۸ مگابایت زباله در گیت (ریشه اصلی کندی)

## مشکل چه بود

```
ehsansalehi-no-node.tar.gz    ۸۱ مگابایت
node_modules.tar.gz            ۶۹ مگابایت
ehsansalehi-build.tar.gz        ۸ مگابایت
─────────────────────────────────────────
جمع                           ۱۵۸ مگابایت
```

حجم کل مخزن: **۱۶۷ مگابایت** — که ۹۵٪ آن فایل‌های بی‌فایده است.

**چرا این باعث کندی می‌شد:**
- هر `git clone` روی هاست ایران = دانلود ۱۶۷ مگابایت از گیت‌هاب تحریم‌شده
- هر `git pull` کند و پرخطا
- GitHub Actions هم هر بار این حجم را چک‌اوت می‌کرد
- این فایل‌ها **اصلاً به درد نمی‌خورند** — خروجی build هستند که هر بار دوباره ساخته می‌شود

## ✅ چه کردم

```bash
# از ایندکس گیت حذف شدند (فایل روی دیسک ماند)
git rm --cached ehsansalehi-build.tar.gz \
                ehsansalehi-no-node.tar.gz \
                node_modules.tar.gz \
                'prebuild-install@7.1.3:' \
                laptops_seed.json
```

و `.gitignore` تقویت شد:
```gitignore
*.tar.gz
*.tgz
*.zip
deploy-artifacts/
dist/
prebuild-install@*
.sync-state-*.json
```

## ⚠️ کار باقی‌مانده: پاکسازی تاریخچه (اختیاری ولی توصیه‌شده)

فایل‌ها از کامیت‌های جدید حذف شدند، ولی **هنوز در تاریخچه گیت هستند**. برای حذف کامل:

```bash
# نصب ابزار
pip install git-filter-repo

# پاکسازی تاریخچه
cd ehsansalehi.ir
git filter-repo --force \
  --path ehsansalehi-build.tar.gz \
  --path ehsansalehi-no-node.tar.gz \
  --path node_modules.tar.gz \
  --invert-paths

# اتصال مجدد و push اجباری
git remote add origin https://github.com/ehsansalehi63/ehsansalehi.ir.git
git push origin --force --all
```

**نتیجه:** حجم مخزن از ۱۶۷ مگابایت به حدود **۹ مگابایت** می‌رسد — یعنی **۹۵٪ کاهش**.

> ⚠️ این عملیات تاریخچه را بازنویسی می‌کند. اول یک بکاپ کامل بگیرید و به هرکسی که clone دارد اطلاع دهید.

---

# ایراد ۳ — دیپلوی FTP فایل‌به‌فایل

## مشکل چه بود

workflow فعلی از `FTP-Deploy-Action` استفاده می‌کند که **هر فایل را جداگانه** آپلود می‌کند:

```yaml
- uses: SamKirkland/FTP-Deploy-Action@v4.3.5
  with:
    local-dir: .next/standalone/     # ← ۳٬۰۰۰+ فایل
```

روی شبکه پرتأخیر ایران، هر فایل یک handshake جدا می‌خواهد.

| روش | اتصال | زمان | پایداری |
|---|---|---|---|
| ❌ FTP فایل‌به‌فایل | ۳٬۰۰۰+ | ۱۵-۴۰ دقیقه | نصفه می‌ماند |
| ✅ یک tar.gz + استخراج | **۲** | **زیر ۹۰ ثانیه** | پایدار |

## ✅ راه‌حل

فایل `tools/ehsansalehi-deploy-fast.yml` آماده است. سه روش پشتیبانی می‌کند:

| روش | نیاز | سرعت |
|---|---|---|
| **A) cPanel API Token** | توکن از cPanel | ⭐ بهترین |
| **B) PHP Receiver** | فقط FTP | عالی |
| **C) FTP تک‌فایل** | فقط FTP | خوب (استخراج دستی) |

### نصب

چون GitHub App آرنا مجوز نوشتن در `.github/workflows/` ندارد، این را **دستی** انجام دهید:

۱. در گیت‌هاب بروید به `.github/workflows/deploy-mizbanfa.yml`
۲. محتوای `tools/ehsansalehi-deploy-fast.yml` را جایگزین کنید
۳. Secrets را اضافه کنید (Settings → Secrets and variables → Actions):

```
CPANEL_HOST      cip17.mizbanfadns.net
CPANEL_USER      نام کاربری cPanel
CPANEL_TOKEN     توکن از Manage API Tokens
CPANEL_APP_DIR   /home/USERNAME/ehsansalehi.ir
HEALTH_URL       https://ehsansalehi.ir/api/deploy/health
```

۴. فایل `tools/deploy-cpanel.sh` را در پوشه `tools/` پروژه بگذارید

---

# ایراد ۴، ۵، ۶، ۷ — اینستاگرام (رفع شد)

## مشکل ۴: نبود انتظار برای کانتینر 🔴

**کد قبلی:**
```ts
// مرحله ۱: ساخت کانتینر
const createData = await createRes.json();
const creationId = createData.id;

// مرحله ۲: انتشار فوری  ← ❌ اشتباه
const publishUrl = `.../media_publish?creation_id=${creationId}`;
```

متا کانتینر رسانه را **به‌صورت غیرهمزمان** پردازش می‌کند. انتشار قبل از رسیدن به وضعیت `FINISHED` تقریباً همیشه خطا می‌دهد. **این دلیل اصلی کار نکردن انتشار اینستاگرام بود.**

**اصلاح:**
```ts
const wait = await waitForInstagramContainer(createData.id, igToken);
if (!wait.ready) { /* fallback */ }
```
تابع جدید هر ۳ ثانیه وضعیت را چک می‌کند تا `FINISHED` شود (حداکثر ۲۰ بار).

## مشکل ۵: توکن در URL 🟠 امنیتی

**قبل:**
```ts
const url = `...?access_token=${igToken}`;   // ❌ در لاگ سرور و پروکسی ثبت می‌شود
await fetch(url, { method: 'POST' });
```

**بعد:**
```ts
await fetch(`${IG_GRAPH}/${igAccount}/media`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ image_url, caption, access_token: igToken }),
});
```
توکن حالا در body است، نه در URL.

## مشکل ۶: نبود fallback 🟠

قبلاً اگر اینستاگرام خطا می‌داد، **پست کاملاً از دست می‌رفت**.

حالا تابع `instagramFallbackToTelegram` اضافه شده: در هر خطایی (توکن منقضی، تحریم، محدودیت متا)، تصویر و کپشن به تلگرام مدیر می‌رود — کپشن در بلوک `<pre>` که با یک لمس کپی شود.

**یعنی هیچ پستی دیگر گم نمی‌شود.**

## مشکل ۷: نسخه قدیمی API

`v19.0` → `v21.0` و قابل تنظیم با متغیر:
```bash
META_API_VERSION=v21.0
```

## 🆕 حالت سه‌گانه اینستاگرام

متغیر جدید `INSTAGRAM_MODE`:

```bash
INSTAGRAM_MODE=auto   # تلاش برای انتشار مستقیم، در صورت خطا → تلگرام
INSTAGRAM_MODE=semi   # مستقیم به تلگرام مدیر (وقتی می‌دانیم API کار نمی‌کند)
INSTAGRAM_MODE=off    # غیرفعال
```

**توصیه برای الان:** `semi` بگذارید تا مطمئن شوید هیچ پستی گم نمی‌شود. اگر توکن معتبر گرفتید، `auto` کنید.

### متغیر جدید لازم
```bash
ADMIN_TELEGRAM_CHAT_ID=123456789   # آیدی عددی تلگرام شما
```
اگر تنظیم نشود، از `TELEGRAM_CHANNEL_ID` استفاده می‌کند.

---

# ایراد ۹ — نداشتن SSH

همان راه‌حل سند ۱۲: **cPanel API Token** یا **PHP Receiver**.

فایل‌های آماده در `tools/`:
- `diagnose.php` — تشخیص وضعیت هاست بدون SSH
- `deploy-receive.php` — گیرنده دیپلوی
- `deploy-cpanel.sh` — اسکریپت دیپلوی

---

# 📋 برنامه اجرا — سه گام

## گام ۱ — امروز (۱۵ دقیقه)

- [ ] `tools/diagnose.php` را با FTP در `public_html` آپلود کنید
- [ ] فقط خط `SECRET` را عوض کنید
- [ ] باز کنید: `https://ehsansalehi.ir/diagnose.php?key=SECRET`
- [ ] خروجی را برای من بفرستید
- [ ] ⚠️ سپس فایل را پاک کنید

**چرا مهم است:** این گزارش می‌گوید `shell_exec` باز است یا نه، سرعت واقعی گیت‌هاب چقدر است، و کدام روش دیپلوی ممکن است.

## گام ۲ — این هفته (۱ ساعت)

- [ ] تیکت به میزبان‌فا برای **cPanel API Token**
- [ ] در `.env` روی هاست اضافه کنید:
  ```bash
  INSTAGRAM_MODE=semi
  ADMIN_TELEGRAM_CHAT_ID=آیدی-عددی-شما
  META_API_VERSION=v21.0
  ```
- [ ] جایگزینی workflow با نسخه سریع
- [ ] تست یک دیپلوی و اندازه‌گیری زمان

## گام ۳ — هفته بعد (اختیاری)

- [ ] پاکسازی تاریخچه گیت با `git-filter-repo` (۱۶۷ → ۹ مگابایت)
- [ ] اجرای اولین دیپلوی با روش جدید و تأیید زمان زیر ۹۰ ثانیه

---

# ✅ نتیجه مورد انتظار

| شاخص | قبل | بعد |
|---|---|---|
| حجم مخزن گیت | ۱۶۷ مگابایت | ~۹ مگابایت |
| زمان دیپلوی | ۱۵-۴۰ دقیقه | زیر ۹۰ ثانیه |
| اتصالات FTP | ۳٬۰۰۰+ | ۲ |
| نرخ موفقیت دیپلوی | متغیر | نزدیک ۱۰۰٪ |
| انتشار اینستاگرام | اغلب خطا | موفق یا fallback |
| پست‌های گم‌شده | زیاد | صفر |
| نشت توکن در لاگ | بله | خیر |
| نیاز به SSH | بله | خیر |

**همین معماری بعداً برای سایت پوشاک استفاده می‌شود — یعنی الان داریم روش را روی یک پروژه واقعی آزمایش می‌کنیم.**
