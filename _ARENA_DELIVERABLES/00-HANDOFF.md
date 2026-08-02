# 00 — HANDOFF (وضعیت فعلی پروژه)

> آخرین به‌روزرسانی: ۲۰۲۶-۰۸-۰۲ · برنچ: `arena/019fc243-ehsansalehi-ir`
>
> این فایل قبلاً وجود نداشت. در جلسه قبل به آن ارجاع داده شده بود
> ولی در هیچ برنچی ساخته نشده بود؛ اکنون ساخته شد.

---

## معماری در یک نگاه

```
میزبان‌فا (ایران)              هاستینگر (خارج)            بالادست
┌────────────────┐            ┌──────────────┐         ┌──────────────┐
│ ehsansalehi.ir │  HMAC      │  relay.php   │  HTTPS  │ AgentRouter  │
│ Next.js 16     │ ─────────► │  PHP 8.3     │ ──────► │ Instagram    │
│ cPanel+Passenger│  SHA-256   │  public_html │         │ LinkedIn     │
└────────────────┘            └──────────────┘         └──────────────┘
   دیپلوی: FTP                   دیپلوی: SSH
```

**چرا رله؟** سرور ایران به اینستاگرام/لینکدین/AgentRouter دسترسی ندارد.
رله روی هاستینگر این درخواست‌ها را عبور می‌دهد.

---

## Secrets — کدام برای کدام سرور

این نکته قبلاً باعث اشتباه شده بود، پس صریح می‌نویسم:

| Secret | مربوط به | کاربرد |
|---|---|---|
| `SSH_IP` `SSH_USERNAME` `SSH_PASSWORD` `SSH_PORT` | **هاستینگر** | دیپلوی رله PHP |
| `FTP_SERVER` `FTP_USERNAME` `FTP_PASSWORD` | **میزبان‌فا** | دیپلوی سایت |
| `CPANEL_HOST` `CPANEL_USER` `CPANEL_TOKEN` | **میزبان‌فا** | ری‌استارت Passenger |
| `RELAY_URL` `RELAY_SECRET` `CRON_SECRET` | هر دو | تست زنجیره |

> ⚠️ میزبان‌فا SSH ندارد → دیپلوی سایت با FTP انجام می‌شود، نه SSH.

---

## Workflowها

| فایل | کار | تریگر |
|---|---|---|
| `deploy-mizbanfa.yml` | build + FTP + ری‌استارت + تأیید نسخه | push روی main |
| `deploy-relay-ssh.yml` | آپلود `relay.php` با SSH | تغییر در `relay-php-upload/` |
| `test-chain.yml` | تست کل زنجیره | دستی + روزانه ۶ صبح |

> ⚠️ این سه فایل در `_ARENA_DELIVERABLES/workflows/` قرار دارند، نه در
> `.github/workflows/`. علتش مجوز نداشتن توکن آرنا است.
> دستور نصب: `_ARENA_DELIVERABLES/workflows/README.md`

### نکات مهم
- `deploy-relay-ssh.yml` هرگز `relay-config.php` را جایگزین نمی‌کند
  (کلیدها داخلش است). فقط `relay.php` و `.htaccess`.
- قبل از آپلود، `php -l` سینتکس را چک می‌کند.
- از هر دو، ۳ نسخه پشتیبان روی سرور نگه داشته می‌شود.

---

## تست زنجیره

```bash
RELAY_URL=https://xxx.hostingersite.com \
RELAY_SECRET=... CRON_SECRET=... \
bash tools/test-chain.sh
```

۴ مرحله را چک می‌کند: سایت زنده → رله زنده → امضای HMAC → زنجیره کامل از دید سایت.
اگر کلیدی ندهید، آن مرحله `WARN` می‌شود نه `FAIL`.

همین اسکریپت در `test-chain.yml` هم اجرا می‌شود (رانر گیت‌هاب اینترنت آزاد دارد).

---

## مسائل باز

### ۱. مجوز `workflows` توکن آرنا ⛔
مهم‌ترین بلاکر — **تأیید شد**: پوش با این خطا رد می‌شود:
`refusing to allow a GitHub App to ... without 'workflows' permission`

به همین دلیل سه فایل workflow در `_ARENA_DELIVERABLES/workflows/`
گذاشته شده‌اند تا شما کپی کنید (۳ دقیقه، راهنما کنار خودشان).

راه‌حل دائمی: Settings → GitHub Apps → Arena → Workflows: Read and write.

### ۲. تاریخچه `main` بازنویسی شده ⚠️
`main` فقط ۱ کامیت دارد (بدون جد مشترک با ۲۵۵ کامیت قبلی).
محتوا سالم است، فقط تاریخچه رفته. جزئیات و گزینه‌های بازیابی:
`18-main-history-report.md`.
**برنچ‌های `arena/*` را حذف نکنید** — تنها نسخه تاریخچه هستند.

### ۳. سندباکس آرنا اینترنت ندارد
فقط `github.com` در دسترس است. تست زنده سایت/رله از اینجا ممکن نیست؛
به همین دلیل تست به GitHub Actions منتقل شد.

---

## کارهای بعدی

1. سه فایل workflow را نصب کنید (`_ARENA_DELIVERABLES/workflows/README.md`).
2. `RELAY_URL` / `RELAY_SECRET` / `CRON_SECRET` را در Secrets اضافه کنید (اگر نیستند).
3. `test-chain.yml` را دستی اجرا کنید و گزارش را بخوانید.
4. تصمیم درباره تاریخچه `main` (گزینه ۲ در گزارش، بدون force-push).
5. محافظت از `main` در برابر force-push را فعال کنید.
