# راه‌اندازی Arena.ai با Arena Social MCP

این راهنما برای وصل کردن همین MCP Server به Arena.ai است.

## مسیر پیشنهادی فعلی

برای شرایط شما، مسیر پیشنهادی این است:

- MCP روی Render
- اتصال به Arena از طریق `POST /mcp`
- publish واقعی از طریق **Make-Bridge**
- Connect/Approve حساب‌ها داخل Make

> یعنی Arena مستقیم Meta/LinkedIn app credential نمی‌خواهد.

---

## ۱) سرور را deploy کنید

حداقل این endpointها باید public باشند:

- `GET /health`
- `POST /mcp`

اگر بعداً خواستید direct OAuth هم داشته باشید، این‌ها هم لازم می‌شوند:

- `GET /oauth/linkedin/start`
- `GET /oauth/linkedin/callback`
- `GET /oauth/instagram/start`
- `GET /oauth/instagram/callback`

---

## ۲) متغیرهای محیطی برای مسیر ساده Make-Bridge

### عمومی

- `MCP_PUBLIC_BASE_URL=https://your-mcp-domain.com`
- `MCP_BEARER_TOKEN=...`
- `MCP_ALLOW_UNAUTHENTICATED=false`
- `MCP_STORAGE_BACKEND=file`

### Make-Bridge

- `MAKE_BRIDGE_ENABLED=true`
- `MAKE_BRIDGE_PLATFORMS=instagram,facebook,linkedin,telegram`
- `MAKE_BRIDGE_PUBLISH_WEBHOOK_URL=https://hook.eu2.make.com/XXXX`
- `MAKE_BRIDGE_TEST_WEBHOOK_URL=https://hook.eu2.make.com/YYYY` (اختیاری)
- `MAKE_BRIDGE_CONNECTION_LABEL=Make Bridge`
- `MAKE_BRIDGE_AUTH_HEADER_NAME` (اختیاری)
- `MAKE_BRIDGE_AUTH_HEADER_VALUE` (اختیاری)

> در این مسیر نه LinkedIn App لازم است و نه Meta App.

---

## ۳) MCP Server را در Arena ثبت کنید

اگر Arena custom MCP server می‌پذیرد، این اطلاعات را وارد کنید:

- MCP URL: `https://your-mcp-domain.com/mcp`
- Auth: `Bearer <MCP_BEARER_TOKEN>`
- Optional Headers:
  - `X-MCP-Workspace-Id: your-workspace-id`
  - `X-MCP-Permissions: social.connections.read,social.connections.write,social.publish,social.schedule,social.diagnostics.read`

---

## ۴) flow اتصال در عمل

### حالت ساده — Make-Bridge

اول اکانت‌های Instagram / Facebook / LinkedIn / Telegram را داخل Make connect می‌کنید.

بعد از آن، از داخل Arena این tool را صدا می‌زنید:

- `social.make_bridge.configure`

نمونه:

```json
{
  "workspaceId": "default",
  "platforms": ["instagram", "facebook", "linkedin", "telegram"],
  "publishWebhookUrl": "https://hook.eu2.make.com/XXXX",
  "testWebhookUrl": "https://hook.eu2.make.com/YYYY",
  "connectionLabel": "Make Bridge"
}
```

بعد از configure شدن:

- `social.connections.list`
- `social.test.connection`
- `social.publish.post`

از طریق Make کار می‌کنند.

### Telegram مستقیم

اگر بخواهید Telegram را مستقیم به MCP بدهید، این tool را صدا بزنید:

```json
{
  "workspaceId": "default",
  "botToken": "123:ABC",
  "chatId": "@your_channel"
}
```

Tool:
- `social.telegram.connect`

---

## ۵) ابزارهای اصلی روزمره

- `social.connections.list`
- `social.connect.status`
- `social.make_bridge.configure`
- `social.test.connection`
- `social.publish.post`
- `social.schedule.post`
- `social.publish.status`
- `social.cancel.scheduled_post`
- `social.diagnostics`

## ۶) ابزارهای اختیاری/پیشرفته

- `social.connect.start` (برای direct OAuth اگر بعداً app credential داشتید)
- `social.import.legacy_settings` (اگر MCP را به DB فعلی سایت وصل کنید)
- `social.refresh.token` (برای direct OAuth)

---

## ۷) توصیه برای فاز بعدی

بعد از تأیید MVP:

1. queue-based scheduler
2. webhook signing سخت‌گیرانه‌تر
3. persistent storage بهتر
4. template per platform
5. richer audit dashboard
