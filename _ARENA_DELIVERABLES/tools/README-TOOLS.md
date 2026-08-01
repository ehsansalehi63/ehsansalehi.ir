# ابزارهای رفع چهار مانع

این پوشه شامل ابزارهای آماده اجرا برای حل موانع سند ۱۲ است.

## ترتیب استفاده

### گام ۱ — تشخیص وضعیت هاست
انتخاب کنید کدام روش در دسترس است:

**اگر Terminal یا SSH دارید:**
```bash
bash diagnose-host.sh > report.txt
```

**اگر ندارید (روش PHP):**
1. در `diagnose.php` مقدار `SECRET` را عوض کنید
2. با FTP در `public_html` آپلود کنید
3. باز کنید: `https://yourdomain.ir/diagnose.php?key=SECRET`
4. خروجی را کپی کنید
5. ⚠️ فایل را از هاست پاک کنید

خروجی را برای من بفرستید تا معماری را دقیق تنظیم کنیم.

---

### گام ۲ — راه‌اندازی مسیر دیپلوی

**روش A (ترجیحی) — cPanel API Token:**
1. cPanel → Security → Manage API Tokens → Create
2. توکن را در GitHub Secrets بگذارید:
   - `CPANEL_HOST`, `CPANEL_USER`, `CPANEL_TOKEN`, `CPANEL_APP_DIR`
3. تست:
```bash
export CPANEL_HOST=... CPANEL_USER=... CPANEL_TOKEN=... APP_DIR=...
export DEPLOY_METHOD=api
bash deploy-cpanel.sh bundle.tar.gz
```

**روش B — PHP Receiver (اگر API ندادند):**
1. در `deploy-receive.php` مقادیر `DEPLOY_SECRET` و `APP_DIR` را تنظیم کنید
2. با FTP آپلود کنید
3. تست: `curl "https://site.ir/deploy-receive.php?action=ping"`
4. در GitHub Secrets: `DEPLOY_URL`, `DEPLOY_SECRET`

---

### گام ۳ — Workflow گیت‌هاب
فایل `deploy-fast.yml` را **دستی** در GitHub UI بسازید:
```
.github/workflows/deploy-fast.yml
```
(چون GitHub App آرنا مجوز نوشتن در پوشه workflows ندارد)

---

### گام ۴ — اینستاگرام
`instagram-publisher.ts` را در `engine/social/` پروژه بگذارید.

تنظیم اولیه:
```bash
INSTAGRAM_MODE=semi          # از روز اول کار می‌کند
TELEGRAM_BOT_TOKEN=...
ADMIN_TELEGRAM_CHAT_ID=...
```

بعد از تأیید App Review متا، فقط این را عوض کنید:
```bash
INSTAGRAM_MODE=auto
```

---

### گام ۵ — قرارداد ایجنت
`AGENTS.md` را در **ریشه پروژه** کپی کنید.

---

## فهرست فایل‌ها

| فایل | کاربرد |
|---|---|
| `diagnose-host.sh` | تشخیص هاست با SSH/Terminal |
| `diagnose.php` | تشخیص هاست بدون SSH |
| `deploy-receive.php` | گیرنده دیپلوی روی هاست (جایگزین SSH) |
| `deploy-cpanel.sh` | اسکریپت دیپلوی از GitHub Actions |
| `deploy-fast.yml` | Workflow گیت‌هاب |
| `instagram-publisher.ts` | موتور انتشار سه‌حالته اینستاگرام |
| `AGENTS.md` | قرارداد ایجنت هوش مصنوعی |
