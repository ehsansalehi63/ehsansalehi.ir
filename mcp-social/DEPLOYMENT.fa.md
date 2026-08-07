# استقرار Production برای Arena Social MCP

این سرویس یک HTTP MCP server است و برای اتصال Arena باید **public URL** و **OAuth callback URL** داشته باشد.

## گزینه پیشنهادی

برای MVP production این‌ها مناسب‌اند:

1. **Render**
2. **Railway**
3. هر VPS با Docker

> برای شروع سریع، Render یا Railway از cPanel ساده‌تر و مناسب‌ترند، چون callback و public HTTPS راحت‌تر می‌دهند.

---

## روش ۱ — Render

فایل‌های آماده:

- `render.yaml` در ریشه repo
- `mcp-social/render.yaml`
- `mcp-social/Dockerfile`
- `mcp-social/RENDER-CHECKLIST.fa.md`

### envهای لازم

- `MCP_PUBLIC_BASE_URL=https://your-render-domain.onrender.com`
- `MCP_BEARER_TOKEN=...`
- `MCP_STORAGE_BACKEND=mysql`
- `MCP_SECRET_ENCRYPTION_KEY=...`
- `MCP_DATABASE_URL=mysql://...`

> blueprint ریشه repo روی `plan: free` تنظیم شده تا MVP با کمترین هزینه بالا بیاید.
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REDIRECT_URI=https://your-domain/oauth/linkedin/callback`
- `META_APP_ID`
- `META_APP_SECRET`
- `META_REDIRECT_URI=https://your-domain/oauth/instagram/callback`

### Health

- `/health`

### MCP endpoint

- `/mcp`

---

## روش ۲ — Railway

فایل آماده:

- `railway.json`
- `Dockerfile`

همان envها را تنظیم کنید.

---

## روش ۳ — VPS با Docker

```bash
cd mcp-social
docker build -t arena-social-mcp .
docker run -d \
  --name arena-social-mcp \
  -p 8787:8787 \
  --env-file .env \
  arena-social-mcp
```

اگر پشت nginx یا caddy هستید، HTTPS و reverse proxy را روی این endpointها بگذارید:

- `/health`
- `/mcp`
- `/oauth/linkedin/start`
- `/oauth/linkedin/callback`
- `/oauth/instagram/start`
- `/oauth/instagram/callback`

---

## تنظیم Arena پس از deploy

- MCP URL: `https://your-domain/mcp`
- Header:
  - `Authorization: Bearer <MCP_BEARER_TOKEN>`
  - `X-MCP-Workspace-Id: default` یا workspace واقعی
  - `X-MCP-Permissions: social.connections.read,social.connections.write,social.publish,social.schedule,social.diagnostics.read`

---

## Redirect URIها

### LinkedIn

در LinkedIn App حتماً ثبت شود:

- `https://your-domain/oauth/linkedin/callback`

### Meta / Instagram

در Meta App حتماً ثبت شود:

- `https://your-domain/oauth/instagram/callback`

---

## اگر از دیتابیس فعلی سایت استفاده می‌کنید

می‌توانید MCP را به همان MySQL وصل کنید.

سپس با tool زیر، تنظیمات قدیمی social را import کنید:

- `social.import.legacy_settings`

این tool از جدول `automation_settings` می‌خواند و مقادیر LinkedIn / Instagram / Telegram را به connectionهای MCP تبدیل می‌کند.

---

## توصیه امنیتی

- `MCP_SECRET_ENCRYPTION_KEY` را حتماً تنظیم کنید.
- `MCP_BEARER_TOKEN` را قوی بگذارید.
- callback URLها فقط روی HTTPS باشند.
- لاگ عمومی tokenها را چاپ نکنید.
- در صورت امکان DB مخصوص MCP بسازید یا حداقل یوزر DB محدود بدهید.
