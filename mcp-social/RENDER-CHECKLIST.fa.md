# چک‌لیست Render برای Arena Social MCP — حالت Make-Bridge

این الان **ساده‌ترین و واقعی‌ترین مسیر** برای شماست:

- MCP روی Render بالا می‌آید
- Make نقش connector hub را بازی می‌کند
- شما داخل Make فقط Instagram / Facebook / LinkedIn / Telegram را **Approve / Connect** می‌کنید
- Arena از طریق MCP فقط دستور publish می‌دهد

---

## ۱) Deploy از GitHub

- وارد Render شوید
- **New +**
- **Blueprint** را انتخاب کنید
- همین ریپوی GitHub را وصل کنید
- Render فایل `render.yaml` ریشه repo را می‌خواند

> این blueprint فقط سرویس `arena-social-mcp` را از پوشه `mcp-social` deploy می‌کند.

---

## ۲) سرویس رایگان

فعلاً blueprint روی **free plan** تنظیم شده است.

نکته:
- برای MVP مناسب است
- ممکن است sleep / cold start داشته باشد
- برای تست connect/publish کافی است
- اگر بعداً استفاده سنگین شد، سرویس را paid می‌کنیم

---

## ۳) envهایی که بعد از ساخت سرویس باید ست شوند

### اجباری

- `MCP_PUBLIC_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com`
- `MAKE_BRIDGE_PUBLISH_WEBHOOK_URL=https://hook.eu2.make.com/XXXX`

### اختیاری ولی توصیه‌شده

- `MAKE_BRIDGE_TEST_WEBHOOK_URL=https://hook.eu2.make.com/YYYY`
- `MAKE_BRIDGE_AUTH_HEADER_NAME=X-Bridge-Token`
- `MAKE_BRIDGE_AUTH_HEADER_VALUE=YOUR_SECRET`

### envهایی که Render خودش آماده می‌کند یا از blueprint می‌آید

- `MCP_BEARER_TOKEN` → خودش generate می‌شود
- `MCP_STORAGE_BACKEND=file`
- `MAKE_BRIDGE_ENABLED=true`
- `MAKE_BRIDGE_PLATFORMS=instagram,facebook,linkedin,telegram`
- `MAKE_BRIDGE_CONNECTION_LABEL=Make Bridge`

> در این مسیر **نه DB لازم دارید، نه LinkedIn App، نه Meta App**.

---

## ۴) در Make چه بسازید؟

یک سناریو بسازید با این ساختار:

1. **Custom Webhook** trigger
2. **Router** بر اساس `action` و `platform`
3. برای هر پلتفرم action مناسب:
   - Instagram for Business (Facebook login)
   - Facebook Pages
   - LinkedIn
   - Telegram Bot
4. در انتها **Webhook Response** بدهید

### payloadی که MCP به Make می‌فرستد

برای publish:

```json
{
  "action": "publish",
  "workspaceId": "default",
  "platform": "instagram",
  "title": "عنوان پست",
  "content": "متن پست",
  "imageUrl": "https://...",
  "link": "https://...",
  "dryRun": false,
  "sentAt": "2026-08-07T11:00:00.000Z"
}
```

برای test:

```json
{
  "action": "test_connection",
  "platform": "instagram",
  "workspaceId": "default",
  "sentAt": "2026-08-07T11:00:00.000Z"
}
```

### پاسخ پیشنهادی Make به MCP

```json
{
  "ok": true,
  "platform": "instagram",
  "message": "Published successfully",
  "postUrl": "https://..."
}
```

یا برای تست:

```json
{
  "ok": true,
  "platform": "instagram",
  "message": "Connection looks healthy"
}
```

---

## ۵) ثبت MCP در Arena

در Arena این مقادیر را ثبت می‌کنید:

- MCP URL:
  - `https://YOUR-RENDER-SERVICE.onrender.com/mcp`

- Header 1:
  - `Authorization: Bearer <MCP_BEARER_TOKEN>`

- Header 2:
  - `X-MCP-Workspace-Id: default`

- Header 3:
  - `X-MCP-Permissions: social.connections.read,social.connections.write,social.publish,social.schedule,social.diagnostics.read`

---

## ۶) کانفیگ Make Bridge از داخل Arena

بعد از deploy، یکی از این دو راه را دارید:

### راه ۱ — فقط env
اگر `MAKE_BRIDGE_PUBLISH_WEBHOOK_URL` را در Render ست کرده باشید، MCP خودش connectionهای bridge را می‌بیند.

### راه ۲ — tool-based config
از داخل Arena این tool را صدا بزنید:

```json
{
  "workspaceId": "default",
  "platforms": ["instagram", "facebook", "linkedin", "telegram"],
  "publishWebhookUrl": "https://hook.eu2.make.com/XXXX",
  "testWebhookUrl": "https://hook.eu2.make.com/YYYY",
  "connectionLabel": "Make Bridge"
}
```

Tool:
- `social.make_bridge.configure`

---

## ۷) تست اولیه بعد از deploy

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

### diagnostics

```bash
curl -s https://YOUR-RENDER-SERVICE.onrender.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"social.diagnostics","arguments":{"workspaceId":"default"}}}'
```

---

## ۸) اولین تست واقعی در Arena

ترتیب پیشنهادی من:

1. deploy روی Render
2. ساخت سناریوی Make
3. ست کردن `MAKE_BRIDGE_PUBLISH_WEBHOOK_URL`
4. ثبت MCP در Arena
5. اجرای `social.connections.list`
6. اجرای `social.test.connection`
7. اجرای `social.publish.post` با `dryRun=true`
8. بعد publish واقعی

---

## ۹) اگر بعداً خواستی حرفه‌ای‌تر شود

بعداً می‌توانیم این را اضافه کنیم:
- DB واقعی
- queue scheduler
- history قوی‌تر
- webhook signing سخت‌گیرانه‌تر
- template per platform
- retry/fallback policy
