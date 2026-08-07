# چک‌لیست Render برای Arena Social MCP

این سریع‌ترین مسیر برای بالا آوردن MCP روی Render است.

## ۱) Deploy از GitHub

- وارد Render شوید
- New +
- Blueprint را انتخاب کنید
- همین ریپو GitHub را وصل کنید
- فایل `render.yaml` ریشه repo را Render می‌خواند

> این blueprint فقط سرویس `arena-social-mcp` را از پوشه `mcp-social` deploy می‌کند.

---

## ۲) سرویس رایگان

فعلاً روی free plan تنظیم شده است.

نکته:
- برای MVP خوب است
- ولی free plan ممکن است sleep / cold start داشته باشد
- برای OAuth callback و publish تستی مشکلی ندارد، اما برای استفاده production جدی بهتر است بعداً paid شود

---

## ۳) envهایی که باید بعد از ساخت سرویس ست کنید

### عمومی

- `MCP_PUBLIC_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com`
- `MCP_BEARER_TOKEN` → Render خودش generate می‌کند
- `MCP_STORAGE_BACKEND=mysql`
- `MCP_SECRET_ENCRYPTION_KEY` → Render خودش generate می‌کند
- `MCP_DATABASE_URL=mysql://USER:PASS@HOST:3306/DBNAME`

### LinkedIn

- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REDIRECT_URI=https://YOUR-RENDER-SERVICE.onrender.com/oauth/linkedin/callback`

### Meta / Instagram

- `META_APP_ID`
- `META_APP_SECRET`
- `META_REDIRECT_URI=https://YOUR-RENDER-SERVICE.onrender.com/oauth/instagram/callback`

---

## ۴) اگر می‌خواهید از DB فعلی سایت استفاده شود

می‌توانید `MCP_DATABASE_URL` را به همان MySQL فعلی سایت بدهید.

بعد از بالا آمدن MCP، این tool را اجرا کنید:

- `social.import.legacy_settings`

نمونه:

```json
{
  "workspaceId": "default",
  "platforms": ["linkedin", "instagram", "telegram"],
  "verify": true
}
```

این tool تلاش می‌کند تنظیمات فعلی social را از `automation_settings` وارد کند.

---

## ۵) ثبت MCP در Arena

در Arena این مقادیر را لازم دارید:

- MCP URL:
  - `https://YOUR-RENDER-SERVICE.onrender.com/mcp`

- Header 1:
  - `Authorization: Bearer <MCP_BEARER_TOKEN>`

- Header 2:
  - `X-MCP-Workspace-Id: default`

- Header 3:
  - `X-MCP-Permissions: social.connections.read,social.connections.write,social.publish,social.schedule,social.diagnostics.read`

---

## ۶) تست اولیه بعد از deploy

### health

```bash
curl https://YOUR-RENDER-SERVICE.onrender.com/health
```

### initialize

```bash
curl -s https://YOUR-RENDER-SERVICE.onrender.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26"}}'
```

### tools/list

```bash
curl -s https://YOUR-RENDER-SERVICE.onrender.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

---

## ۷) اولین اتصال واقعی

### LinkedIn

Tool:
- `social.connect.start`
- `platform=linkedin`

### Instagram

Tool:
- `social.connect.start`
- `platform=instagram`

### Telegram

Tool:
- `social.telegram.connect`

---

## ۸) اگر خواستی فقط سریع MVP تست شود

ترتیب پیشنهادی من:
1. deploy روی Render
2. set کردن `MCP_DATABASE_URL`
3. ثبت MCP در Arena
4. اجرای `social.connections.list`
5. اجرای `social.import.legacy_settings`
6. اگر import کافی نبود، `social.connect.start`
7. بعد `social.publish.post` با `dryRun=true`
8. بعد publish واقعی
