# نصب Workflowها (۳ دقیقه، دستی)

## چرا دستی؟

توکن GitHub App آرنا مجوز `workflows` ندارد. هر پوشی که فایل
`.github/workflows/*` داشته باشد با این خطا رد می‌شود:

```
refusing to allow a GitHub App to create or update workflow
`.github/workflows/...` without `workflows` permission
```

پس فایل‌ها اینجا آماده شده‌اند تا شما کپی کنید.

---

## راه ۱ — از رابط وب گیت‌هاب (بدون نصب چیزی)

برای هر کدام از سه فایل:

1. فایل را از همین پوشه باز کنید و **کل محتوا** را کپی کنید.
2. به این آدرس بروید:
   `https://github.com/ehsansalehi63/ehsansalehi.ir/new/main?filename=.github/workflows/NAME.yml`
   (به‌جای `NAME` نام فایل را بگذارید)
3. محتوا را Paste کنید → **Commit changes**.

| فایل | مسیر مقصد |
|---|---|
| `deploy-mizbanfa.yml` | `.github/workflows/deploy-mizbanfa.yml` (جایگزین فعلی) |
| `deploy-relay-ssh.yml` | `.github/workflows/deploy-relay-ssh.yml` (جدید) |
| `test-chain.yml` | `.github/workflows/test-chain.yml` (جدید) |

---

## راه ۲ — از ترمینال خودتان

روی کامپیوتر خودتان (که توکن شخصی دارید، نه توکن آرنا):

```bash
git clone https://github.com/ehsansalehi63/ehsansalehi.ir.git
cd ehsansalehi.ir
git checkout arena/019fc243-ehsansalehi-ir

mkdir -p .github/workflows
cp _ARENA_DELIVERABLES/workflows/deploy-mizbanfa.yml  .github/workflows/
cp _ARENA_DELIVERABLES/workflows/deploy-relay-ssh.yml .github/workflows/
cp _ARENA_DELIVERABLES/workflows/test-chain.yml       .github/workflows/

git add .github/workflows
git commit -m "ci: SSH relay deploy + chain test workflows"
git push origin arena/019fc243-ehsansalehi-ir
```

---

## راه‌حل دائمی (توصیه‌شده)

یک‌بار مجوز بدهید تا دیگر این مشکل پیش نیاید:

**Settings → GitHub Apps → Arena → Permissions → Workflows: Read and write**

بعد از آن، آرنا می‌تواند مستقیم workflowها را به‌روز کند.

---

## بعد از نصب

۱. مطمئن شوید این Secrets موجودند:

| Secret | سرور |
|---|---|
| `SSH_IP` `SSH_USERNAME` `SSH_PASSWORD` `SSH_PORT` | هاستینگر (رله) |
| `FTP_SERVER` `FTP_USERNAME` `FTP_PASSWORD` | میزبان‌فا (سایت) |
| `RELAY_URL` `RELAY_SECRET` `CRON_SECRET` | برای تست زنجیره |

۲. تست را اجرا کنید:
**Actions → Test Chain (site ↔ relay) → Run workflow**

گزارش کامل در بخش Summary همان اجرا نمایش داده می‌شود.
