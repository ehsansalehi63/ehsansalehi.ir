# استقرار Production برای Arena Social MCP

این سرویس یک HTTP MCP server است و برای اتصال Arena باید **public URL** داشته باشد.

## مسیر پیشنهادی فعلی: Render + Make-Bridge

برای شرایط فعلی شما، بهترین مسیر این است:

1. `arena-social-mcp` روی Render بالا بیاید
2. Make نقش connector hub را برای Instagram / Facebook / LinkedIn / Telegram بازی کند
3. Arena فقط به MCP وصل شود
4. MCP فقط به webhook سناریوی Make payload بفرستد

این مسیر باعث می‌شود **نیازی به Meta App یا LinkedIn App نداشته باشید**.

---

## روش ۱ — Render (پیشنهادی)

فایل‌های آماده:

- `render.yaml` در ریشه repo
- `mcp-social/render.yaml`
- `mcp-social/Dockerfile`
- `mcp-social/RENDER-CHECKLIST.fa.md`
- `mcp-social/MAKE-BRIDGE.fa.md`

### envهای لازم در حالت ساده

- `MCP_PUBLIC_BASE_URL=https://your-render-domain.onrender.com`
- `MAKE_BRIDGE_PUBLISH_WEBHOOK_URL=https://hook.eu2.make.com/XXXX`

### envهای اختیاری

- `MAKE_BRIDGE_TEST_WEBHOOK_URL=https://hook.eu2.make.com/YYYY`
- `MAKE_BRIDGE_AUTH_HEADER_NAME`
- `MAKE_BRIDGE_AUTH_HEADER_VALUE`

### envهایی که blueprint خودش تنظیم می‌کند

- `MCP_BEARER_TOKEN`
- `MCP_STORAGE_BACKEND=file`
- `MAKE_BRIDGE_ENABLED=true`
- `MAKE_BRIDGE_PLATFORMS=instagram,facebook,linkedin,telegram`
- `MAKE_BRIDGE_CONNECTION_LABEL=Make Bridge`

### Health

- `/health`

### MCP endpoint

- `/mcp`

---

## روش ۲ — Railway

ممکن است، اما چون free tier دائمی‌اش مثل Render راحت نیست، برای شروع پیشنهاد نمی‌شود.

---

## روش ۳ — VPS با Docker

اگر خواستید self-managed بروید:

```bash
cd mcp-social
docker build -t arena-social-mcp .
docker run -d \
  --name arena-social-mcp \
  -p 8787:8787 \
  --env-file .env \
  arena-social-mcp
```

---

## تنظیم Arena پس از deploy

- MCP URL: `https://your-domain/mcp`
- Header:
  - `Authorization: Bearer <MCP_BEARER_TOKEN>`
  - `X-MCP-Workspace-Id: default`
  - `X-MCP-Permissions: social.connections.read,social.connections.write,social.publish,social.schedule,social.diagnostics.read`

---

## سناریوی Make چه می‌کند؟

- Webhook ورودی می‌گیرد
- روی `action` و `platform` route می‌کند
- از connectorهای آماده Make برای publish استفاده می‌کند
- JSON استاندارد به MCP برمی‌گرداند

برای جزئیات کامل:
- `mcp-social/MAKE-BRIDGE.fa.md`

---

## اگر بعداً direct OAuth خواستید

MCP هنوز قابلیت direct OAuth برای LinkedIn و Instagram را هم نگه داشته است؛ ولی آن حالت app credential می‌خواهد و مسیر فعلی توصیه نمی‌شود.
