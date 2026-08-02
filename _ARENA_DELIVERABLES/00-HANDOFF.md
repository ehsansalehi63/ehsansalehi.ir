# سند تحویل — برنچ arena/019fc27e-ehsansalehi-ir

**تاریخ:** ۲ مرداد ۱۴۰۵ (۲ اوت ۲۰۲۶)  
**برنچ قبلی:** `arena/019fb245-ehsansalehi-ir`  
**برنچ فعلی:** `arena/019fc27e-ehsansalehi-ir`  
**PR:** https://github.com/ehsansalehi63/ehsansalehi.ir/pull/6

---

## ✅ کارهای انجام‌شده

### ۱) پوش کامیت‌های لوکال ✅
- مرج برنچ `arena/019fb245` به برنچ فعلی
- پوش موفق به `origin/arena/019fc27e-ehsansalehi-ir`
- PR #6 ایجاد شد

### ۲) بازنویسی ورک‌فلوها ✅

**قانون:** FTP فقط میزبان‌فا (سایت) | SSH فقط هاستینگر (رله)

| ورک‌فلو | پروتکل | مقصد | کارکرد |
|---|---|---|---|
| `deploy-mizbanfa.yml` | **FTP** | میزبان‌فا | دیپلوی سایت Next.js |
| `deploy-relay-hostinger.yml` | **SSH** | هاستینگر | دیپلوی رله PHP (شبکه‌های اجتماعی + هوش مصنوعی) |
| `deploy-all.yml` | FTP + SSH | هر دو | بیلد → سایت(FTP) → رله(SSH) → تست |
| `test-chain.yml` | SSH | هاستینگر | تست روزانه زنجیره + دسترسی |

**اکشن‌های SSH (هاستینگر فقط):**
- `appleboy/scp-action@v0.1.7` — آپلود فایل‌های رله
- `appleboy/ssh-action@v1.2.2` — اجرای دستور روی هاستینگر

**اکشن FTP (میزبان‌فا فقط):**
- `SamKirkland/FTP-Deploy-Action@v4.3.5` — همگام‌سازی فایل‌های سایت

### ۳) اسکریپت تست زنجیره ✅
- `tools/test-chain.sh` — ۷ تست سرتاسری
- `test-chain.yml` — تست روزانه + تست SSH و دسترسی از هاستینگر

---

## 🏗️ معماری دیپلوی

```
Push to main
    │
    ├── deploy-mizbanfa.yml ──── FTP ────► میزبان‌فا (سایت)
    │     1. بیلد Next.js
    │     2. آماده‌سازی standalone
    │     3. FTP sync به میزبان‌فا
    │     4. تأیید نسخه
    │
    ├── deploy-relay-hostinger.yml ── SSH ──► هاستینگر (رله)
    │     1. SCP فایل‌های relay.php + .htaccess
    │     2. ساخت relay-config.php (اگر نبود)
    │     3. تست /health
    │     4. بررسی امنیتی relay-config.php
    │
    └── deploy-all.yml ───────── FTP + SSH ──► هر دو + تست
          1. بیلد
          2. سایت → FTP → میزبان‌فا
          3. رله → SSH → هاستینگر
          4. تست سرتاسری زنجیره
```

---

## 🔑 Secrets لازم

| Secret | پروتکل | مقصد |
|---|---|---|
| `FTP_SERVER` | FTP | میزبان‌فا — آدرس FTP |
| `FTP_USERNAME` | FTP | میزبان‌فا — نام کاربری |
| `FTP_PASSWORD` | FTP | میزبان‌فا — رمز |
| `SSH_IP` | SSH | هاستینگر — آدرس IP |
| `SSH_PORT` | SSH | هاستینگر — پورت |
| `SSH_USERNAME` | SSH | هاستینگر — نام کاربری |
| `SSH_PASSWORD` | SSH | هاستینگر — رمز |
| `HEALTH_URL` | — | https://ehsansalehi.ir/api/deploy/health |
| `RELAY_URL` | — | آدرس رله هاستینگر |
| `RELAY_SECRET` | — | رمز مشترک HMAC |
| `CRON_SECRET` | — | کلید تست سرتاسری |

---

## ⚠️ نصب ورک‌فلوها

GitHub App آرنا اجازه نوشتن در `.github/workflows/` را ندارد.

**سه راه:**

### راه الف — دستی در GitHub UI (ساده‌ترین)
1. https://github.com/ehsansalehi63/ehsansalehi.ir/new/main/.github/workflows
2. فایل‌ها را از `workflows/` کپی کنید

### راه ب — با توکن شخصی
```bash
export GITHUB_TOKEN=ghp_XXXXX
bash workflows/setup-github.sh
```

### راه ج — مرج PR و سپس نصب
```bash
git pull origin main
bash workflows/install.sh
git add .github/workflows/
git commit -m 'ci: install workflows'
git push
```

---

## 📋 چک‌لیست

- [x] کامیت‌ها پوش شدند
- [x] ورک‌فلوها با FTP (میزبان‌فا) + SSH (هاستینگر) بازنویسی شدند
- [x] اسکریپت تست زنجیره نوشته شد
- [x] PR #6 ایجاد شد
- [ ] ورک‌فلوها در `.github/workflows/` نصب شوند
- [ ] تست اولیه دیپلوی سایت (FTP)
- [ ] تست اولیه دیپلوی رله (SSH)
- [ ] تست زنجیره کامل
