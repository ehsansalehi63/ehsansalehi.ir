# Arena Social MCP

MVP سرور MCP برای وصل کردن Arena.ai به کانکتورهای شبکه‌های اجتماعی.

## هدف MVP

این سرور به Arena اجازه می‌دهد از طریق MCP این کارها را انجام دهد:

- **حالت ساده (پیشنهادی): Make-Bridge** برای Instagram / Facebook / LinkedIn / Telegram
- حالت مستقیم OAuth برای LinkedIn و Instagram در صورت داشتن app credentials
- اتصال Telegram Bot با Bot Token + Chat ID
- مشاهده وضعیت اتصال‌ها
- تست زنده‌ی اتصال‌ها
- انتشار فوری روی چند شبکه
- زمان‌بندی پست
- مشاهده لاگ و diagnostics

## معماری

```text
Arena.ai (Host)
  -> MCP Client
    -> arena-social-mcp (Server)
      -> LinkedIn API
      -> Meta / Instagram Graph API
      -> Telegram Bot API
```

## ابزارهای MCP

- `social.connections.list`
- `social.connect.start`
- `social.connect.status`
- `social.make_bridge.configure`
- `social.telegram.connect`
- `social.disconnect`
- `social.refresh.token`
- `social.test.connection`
- `social.publish.post`
- `social.schedule.post`
- `social.publish.status`
- `social.cancel.scheduled_post`
- `social.diagnostics`

## Resources

- `social://connections`
- `social://scheduled-posts`
- `social://recent-deliveries`
- `social://diagnostics`

## Prompts

- `social.publish_multichannel`
- `social.connection_audit`

## راه‌اندازی سریع

```bash
cd mcp-social
cp .env.example .env
node server.mjs
```

پیش‌فرض:

- Health: `http://localhost:8787/health`
- MCP endpoint: `http://localhost:8787/mcp`
- LinkedIn OAuth callback: `http://localhost:8787/oauth/linkedin/callback`
- Instagram OAuth callback: `http://localhost:8787/oauth/instagram/callback`

## متغیرهای محیطی اصلی

### MCP / Arena

- `MCP_PUBLIC_BASE_URL`
- `MCP_BEARER_TOKEN`
- `MCP_DEFAULT_WORKSPACE_ID`
- `MCP_DEFAULT_PERMISSIONS`
- `MCP_ALLOW_UNAUTHENTICATED`

### Make-Bridge (مسیر ساده پیشنهادی)

- `MAKE_BRIDGE_ENABLED=true`
- `MAKE_BRIDGE_PLATFORMS=instagram,facebook,linkedin,telegram`
- `MAKE_BRIDGE_PUBLISH_WEBHOOK_URL`
- `MAKE_BRIDGE_TEST_WEBHOOK_URL` (اختیاری)
- `MAKE_BRIDGE_CONNECTION_LABEL`
- `MAKE_BRIDGE_AUTH_HEADER_NAME` (اختیاری)
- `MAKE_BRIDGE_AUTH_HEADER_VALUE` (اختیاری)

### LinkedIn

- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REDIRECT_URI`
- `LINKEDIN_SCOPES`

### Meta / Instagram

- `META_APP_ID`
- `META_APP_SECRET`
- `META_REDIRECT_URI`
- `META_SCOPES`
- `META_GRAPH_VERSION`

### Telegram

- Bot token per workspace از طریق tool `social.telegram.connect` ذخیره می‌شود.

## نحوه اتصال در Arena

وقتی Arena custom MCP server را پشتیبانی کند:

1. آدرس MCP را روی `POST /mcp` تنظیم کنید.
2. اگر bearer auth دارید، همان را در header `Authorization: Bearer ...` قرار دهید.
3. اگر permission header می‌دهید، از `X-MCP-Permissions` استفاده کنید.
4. اگر workspace header می‌دهید، از `X-MCP-Workspace-Id` استفاده کنید.

## جریان اتصال LinkedIn / Instagram

1. Arena tool `social.connect.start` را صدا می‌زند.
2. سرور یک `authUrl` برمی‌گرداند.
3. کاربر آن URL را در browser باز می‌کند.
4. provider به callback همین سرور برمی‌گردد.
5. tokenها در storage محلی MVP ذخیره می‌شوند.
6. Arena از `social.connect.status` یا `social.connections.list` وضعیت را می‌خواند.

## Make-Bridge flow (پیشنهادی برای Instagram/Facebook/LinkedIn/Telegram)

در این حالت، به‌جای ساختن App روی Meta/LinkedIn، از connectorهای آماده Make استفاده می‌کنید و MCP فقط به webhook سناریوی Make پست می‌زند.

نمونه تنظیم دستی از داخل Arena:

```json
{
  "name": "social.make_bridge.configure",
  "arguments": {
    "workspaceId": "default",
    "platforms": ["instagram", "facebook", "linkedin", "telegram"],
    "publishWebhookUrl": "https://hook.eu2.make.com/xxxx",
    "testWebhookUrl": "https://hook.eu2.make.com/yyyy",
    "connectionLabel": "Make Bridge"
  }
}
```

بعد از آن `social.test.connection` و `social.publish.post` از طریق Make کار می‌کنند.

## Telegram flow

Telegram در این MVP با OAuth نیست. Arena باید این tool را صدا بزند:

```json
{
  "name": "social.telegram.connect",
  "arguments": {
    "workspaceId": "default",
    "botToken": "123:ABC",
    "chatId": "@my_channel"
  }
}
```

## Import از تنظیمات قدیمی سایت

اگر MCP را به همان MySQL سایت وصل کنید، می‌توانید credentialهای قدیمی را از جدول `automation_settings` وارد کنید.

نمونه:

```json
{
  "name": "social.import.legacy_settings",
  "arguments": {
    "workspaceId": "default",
    "platforms": ["linkedin", "instagram", "telegram"],
    "verify": true
  }
}
```

این tool تنظیمات زیر را می‌خواند:

- `telegram_bot_token`
- `telegram_channel_id` / `telegram_chat_id`
- `linkedin_access_token`
- `linkedin_author_urn`
- `instagram_access_token` / `fb_access_token`
- `instagram_account_id`

## Storage در MVP / فاز بعدی

این نسخه الان **دو backend** دارد:

### 1) File backend
پیش‌فرض dev:

```text
mcp-social/data/db.json
```

### 2) MySQL backend
برای production اگر `MCP_STORAGE_BACKEND=mysql` یا یکی از envهای DB تنظیم شود، سرور به MySQL وصل می‌شود و جدول‌ها را از روی `schema.mysql.sql` می‌سازد.

چیزهایی که ذخیره می‌شوند:

- connection records
- token metadata
- oauth state
- scheduled jobs
- delivery logs
- tool grants (schema آماده شده)

### Encryption
اگر `MCP_SECRET_ENCRYPTION_KEY` را تنظیم کنید، secret blobهای ذخیره‌شده در MySQL با `AES-256-GCM` رمز می‌شوند.

## امنیت MVP

- Bearer auth برای خود MCP endpoint
- permission check per tool
- OAuth state/PKCE
- no-store headers
- tokenها در خروجی toolها برگردانده نمی‌شوند

## محدودیت‌های فعلی MVP

- File backend هنوز برای dev fallback باقی مانده است
- scheduling هنوز in-process است
- LinkedIn/Instagram publish فقط flow اصلی را پوشش می‌دهد
- Telegram secret هنوز از secure UI Vault استفاده نمی‌کند
- SSE/stream transport هنوز پیاده نشده و transport فعلی HTTP JSON-RPC است
- multi-user tenancy در حد `workspaceId` نرم‌افزاری است، نه IAM سازمانی

## نقشه راه refinement بعدی

1. webhook-signed callback / async delivery receipts
2. queue-based scheduler
3. granular tool grants persisted per workspace
4. secure UI vault / secret input flow
5. SSE / streamable HTTP transport کامل
6. publish template variants per platform
7. fallback/retry policy
8. richer audit trail and admin dashboard

## فایل‌های مهم

- `server.mjs` — هسته MCP + HTTP routes
- `lib/store.mjs` — storage MVP
- `lib/oauth.mjs` — PKCE/OAuth helpers
- `connectors/*.mjs` — connectorهای social
- `services/publisher.mjs` — publish orchestration
- `services/scheduler.mjs` — scheduler MVP
