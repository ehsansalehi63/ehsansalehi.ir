# راه‌اندازی Arena.ai با Arena Social MCP

این راهنما برای وصل کردن همین MCP Server به Arena.ai است.

## ۱) سرور را deploy کنید

حداقل این endpointها باید public باشند:

- `GET /health`
- `POST /mcp`
- `GET /oauth/linkedin/start`
- `GET /oauth/linkedin/callback`
- `GET /oauth/instagram/start`
- `GET /oauth/instagram/callback`

## ۲) متغیرهای محیطی را تنظیم کنید

### عمومی

- `MCP_PUBLIC_BASE_URL=https://your-mcp-domain.com`
- `MCP_BEARER_TOKEN=...`
- `MCP_ALLOW_UNAUTHENTICATED=false`

### LinkedIn

- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REDIRECT_URI=https://your-mcp-domain.com/oauth/linkedin/callback`

### Meta / Instagram

- `META_APP_ID`
- `META_APP_SECRET`
- `META_REDIRECT_URI=https://your-mcp-domain.com/oauth/instagram/callback`

## ۳) MCP Server را در Arena ثبت کنید

اگر Arena custom MCP server می‌پذیرد، این اطلاعات را وارد کنید:

- MCP URL: `https://your-mcp-domain.com/mcp`
- Auth: `Bearer <MCP_BEARER_TOKEN>`
- Optional Headers:
  - `X-MCP-Workspace-Id: your-workspace-id`
  - `X-MCP-Permissions: social.connections.read,social.connections.write,social.publish,social.schedule,social.diagnostics.read`

## ۴) flow اتصال در عمل

### LinkedIn / Instagram

از داخل Arena این tool را صدا بزنید:

- `social.connect.start`

نمونه ورودی:

```json
{
  "workspaceId": "default",
  "platform": "linkedin"
}
```

خروجی یک `authUrl` می‌دهد. همان را در browser باز کنید.

بعد از authorize شدن، provider به callback همین MCP برمی‌گردد و connection ذخیره می‌شود.

### Telegram

از داخل Arena این tool را صدا بزنید:

```json
{
  "workspaceId": "default",
  "botToken": "123:ABC",
  "chatId": "@your_channel"
}
```

## ۵) ابزارهای اصلی روزمره

- `social.connections.list`
- `social.connect.status`
- `social.test.connection`
- `social.publish.post`
- `social.schedule.post`
- `social.publish.status`
- `social.cancel.scheduled_post`
- `social.diagnostics`

## ۶) توصیه برای فاز بعدی

بعد از تأیید MVP:

1. scheduler را queue-based کنید.
2. permission grants را per-workspace در دیتابیس enforce کنید.
3. webhook signing و replay protection کامل‌تر کنید.
4. token rotation / refresh policies را کامل‌تر کنید.
