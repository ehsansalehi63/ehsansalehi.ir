# سند تحویل — برنچ arena/019fc27e-ehsansalehi-ir

**تاریخ:** ۲ مرداد ۱۴۰۵ (۲ اوت ۲۰۲۶)  
**برنچ قبلی:** `arena/019fb245-ehsansalehi-ir`  
**برنچ فعلی:** `arena/019fc27e-ehsansalehi-ir`  
**PR:** https://github.com/ehsansalehi63/ehsansalehi.ir/pull/6

---

## ✅ کارهای انجام‌شده

### ۱) پوش کامیت‌های لوکال ✅
- مرج برنچ `arena/019fb245` به برنچ فعلی
- حل کانفلیکت ورک‌فلو `deploy-mizbanfa.yml`
- پوش موفق به `origin/arena/019fc27e-ehsansalehi-ir`
- PR #6 ایجاد شد

### ۲) بازنویسی ورک‌فلوها با SSH ✅
| ورک‌فلو | کارکرد | وضعیت |
|---|---|---|
| `deploy-mizbanfa.yml` | دیپلوی سایت به میزبان‌فا (SSH + FTP پشتیبان) | ✅ آماده |
| `deploy-relay-hostinger.yml` | دیپلوی رله PHP به هاستینگر (SSH) | ✅ آماده |
| `deploy-all.yml` | دیپلوی یکپارچه (سایت + رله + تست) | ✅ آماده |
| `test-chain.yml` | تست روزانه زنجیره سایت↔رله | ✅ آماده |

**اکشن‌های SSH استفاده‌شده:**
- `appleboy/scp-action@v0.1.7` — آپلود فایل
- `appleboy/ssh-action@v1.2.2` — اجرای دستور روی سرور

**Secrets لازم (همه آماده در GitHub):**

| Secret | کاربرد | منبع |
|---|---|---|
| `SSH_IP` | آدرس IP هاستینگر | ✅ در GitHub Secrets |
| `SSH_PORT` | پورت SSH | ✅ در GitHub Secrets |
| `SSH_USERNAME` | نام کاربری SSH | ✅ در GitHub Secrets |
| `SSH_PASSWORD` | رمز عبور SSH | ✅ در GitHub Secrets |
| `FTP_SERVER` | آدرس FTP میزبان‌فا | ✅ در GitHub Secrets |
| `FTP_USERNAME` | نام کاربری FTP | ✅ در GitHub Secrets |
| `FTP_PASSWORD` | رمز FTP | ✅ در GitHub Secrets |
| `HEALTH_URL` | https://ehsansalehi.ir/api/deploy/health | ✅ در GitHub Secrets |
| `RELAY_URL` | آدرس رله هاستینگر | ✅ در GitHub Secrets |
| `RELAY_SECRET` | رمز مشترک HMAC | ✅ در GitHub Secrets |
| `CRON_SECRET` | کلید تست سرتاسری | ✅ در GitHub Secrets |

### ۳) اسکریپت تست زنجیره ✅
- `tools/test-chain.sh` — ۷ تست سرتاسری:
  1. سایت اصلی بالا است؟
  2. Health endpoint سایت کار می‌کند؟
  3. رله هاستینگر بالا است؟
  4. امضای HMAC پذیرفته می‌شود؟
  5. تست endpoint سرتاسری (relay-test)
  6. تست اتصال سرویس‌ها (integrations-test)
  7. تست اتصال SSH به هاستینگر

### ۴) وضعیت دیپلوی فعلی
- آخرین ورک‌فلو روی main: `Fast Deploy (no SSH)` — **شکست** در مرحله `Deploy to cPanel`
- دلیل: cPanel API Token تنظیم نشده
- راه‌حل: ورک‌فلو جدید SSH از این مشکل رد می‌شود

---

## ⚠️ کار باقیمانده — نصب ورک‌فلوها

GitHub App آرنا اجازه نوشتن در `.github/workflows/` را ندارد. **سه راه:**

### راه الف — دستی در GitHub UI (ساده‌ترین)
1. بروید به: https://github.com/ehsansalehi63/ehsansalehi.ir/new/main/.github/workflows
2. فایل‌های زیر را بسازید و محتوایشان را از `workflows/` کپی کنید:
   - `deploy-mizbanfa.yml` ← جایگزین فایل قبلی
   - `deploy-relay-hostinger.yml` ← فایل جدید
   - `deploy-all.yml` ← فایل جدید
   - `test-chain.yml` ← جایگزین فایل قبلی

### راه ب — با توکن شخصی
```bash
export GITHUB_TOKEN=ghp_XXXXX   # توکن شخصی شما
bash workflows/setup-github.sh
```

### راه ج — مرج PR و سپس نصب
1. PR #6 را مرج کنید
2. در لوکال:
```bash
git pull origin main
bash workflows/install.sh
git add .github/workflows/
git commit -m 'ci: install SSH-based workflows'
git push
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
- [x] PR #6 ایجاد شد
- [ ] ورک‌فلوها در `.github/workflows/` نصب شوند (دستی یا با توکن)
- [ ] Secrets تأیید شوند
- [ ] تست اولیه ورک‌فلو `test-chain` اجرا شود
- [ ] تست اولیه دیپلوی `deploy-mizbanfa` اجرا شود
