# سند تحویل — برنچ arena/019fc27e-ehsansalehi-ir

**تاریخ:** ۲ مرداد ۱۴۰۵ (۲ اوت ۲۰۲۶)  
**برنچ قبلی:** `arena/019fb245-ehsansalehi-ir`  
**برنچ فعلی:** `arena/019fc27e-ehsansalehi-ir`

---

## ✅ کارهای انجام‌شده

### ۱) پوش کامیت‌های لوکال
- مرج برنچ `arena/019fb245` به برنچ فعلی
- حل کانفلیکت ورک‌فلو `deploy-mizbanfa.yml`
- پوش موفق به `origin/arena/019fc27e-ehsansalehi-ir`

### ۲) بازنویسی ورک‌فلوها با SSH
| ورک‌فلو | کارکرد | وضعیت |
|---|---|---|
| `deploy-mizbanfa.yml` | دیپلوی سایت به میزبان‌فا (SSH + FTP پشتیبان) | ✅ آماده |
| `deploy-relay-hostinger.yml` | دیپلوی رله PHP به هاستینگر (SSH) | ✅ آماده |
| `deploy-all.yml` | دیپلوی یکپارچه (سایت + رله + تست) | ✅ آماده |
| `test-chain.yml` | تست روزانه زنجیره سایت↔رله | ✅ آماده |

** Secrets لازم (همه آماده در GitHub):**

| Secret | کاربرد |
|---|---|
| `SSH_IP` | آدرس IP هاستینگر |
| `SSH_PORT` | پورت SSH |
| `SSH_USERNAME` | نام کاربری SSH |
| `SSH_PASSWORD` | رمز عبور SSH |
| `FTP_SERVER` | آدرس FTP میزبان‌فا |
| `FTP_USERNAME` | نام کاربری FTP |
| `FTP_PASSWORD` | رمز FTP |
| `HEALTH_URL` | https://ehsansalehi.ir/api/deploy/health |
| `RELAY_URL` | آدرس رله هاستینگر |
| `RELAY_SECRET` | رمز مشترک HMAC |
| `CRON_SECRET` | کلید تست سرتاسری |

### ۳) اسکریپت تست زنجیره
- `tools/test-chain.sh` — ۷ تست سرتاسری:
  1. سایت اصلی بالا است؟
  2. Health endpoint سایت کار می‌کند؟
  3. رله هاستینگر بالا است؟
  4. امضای HMAC پذیرفته می‌شود؟
  5. تست endpoint سرتاسری (relay-test)
  6. تست اتصال سرویس‌ها (integrations-test)
  7. تست اتصال SSH به هاستینگر

---

## ⚠️ کار باقیمانده — نصب ورک‌فلوها

GitHub App آرنا اجازه نوشتن در `.github/workflows/` را ندارد. **دو راه:**

### راه الف — دستی در GitHub UI
1. بروید به: https://github.com/ehsansalehi63/ehsansalehi.ir/new/arena/019fc27e-ehsansalehi-ir/.github/workflows
2. فایل‌های زیر را بسازید و محتوایشان را از `workflows/` کپی کنید:
   - `deploy-mizbanfa.yml`
   - `deploy-relay-hostinger.yml`
   - `deploy-all.yml`
   - `test-chain.yml`

### راه ب — با توکن شخصی
```bash
export GITHUB_TOKEN=ghp_XXXXX   # توکن شخصی شما
bash workflows/setup-github.sh
```

---

## 🏗️ معماری دیپلوی

```
Push to main
    │
    ├── deploy-mizbanfa.yml ─────► سایت (میزبان‌فا) از طریق SSH
    │     1. بیلد Next.js
    │     2. ساخت tar.gz (~15 مگابایت)
    │     3. SCP بسته به هاست
    │     4. SSH: استخراج + ری‌استارت
    │     5. تأیید نسخه
    │
    ├── deploy-relay-hostinger.yml ─► رله PHP (هاستینگر) از طریق SSH
    │     1. SCP فایل‌های relay.php + .htaccess
    │     2. تست /health
    │     3. بررسی امنیتی relay-config.php
    │
    └── deploy-all.yml ─────────► هر دو + تست زنجیره
          1. بیلد
          2. دیپلوی سایت
          3. دیپلوی رله
          4. تست سرتاسری
```

---

## 📋 چک‌لیست نهایی

- [x] کامیت‌ها پوش شدند
- [x] ورک‌فلوها با SSH بازنویسی شدند
- [x] اسکریپت تست زنجیره نوشته شد
- [ ] ورک‌فلوها در `.github/workflows/` نصب شوند (دستی یا با توکن)
- [ ] Secrets تأیید شوند
- [ ] تست اولیه ورک‌فلو `test-chain` اجرا شود
- [ ] تست اولیه دیپلوی `deploy-mizbanfa` اجرا شود
