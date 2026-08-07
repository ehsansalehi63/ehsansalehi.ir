# راهنمای Make-Bridge برای Arena Social MCP

این راهنما برای حالتی است که شما **Meta App / LinkedIn App** ندارید و می‌خواهید شبیه Base44 فقط داخل سرویس واسط Approve کنید.

## ایده اصلی

- Make connectorهای آماده خودش را دارد
- شما داخل Make اکانت Instagram / Facebook / LinkedIn / Telegram را connect می‌کنید
- MCP فقط به webhook سناریوی Make payload می‌فرستد
- Make از طرف شما publish می‌کند

---

## سناریوی پیشنهادی Make

### مرحله ۱ — ساخت webhook

- داخل Make یک **Scenario** جدید بسازید
- Trigger را روی **Custom Webhook** بگذارید
- URL webhook را کپی کنید

این URL همان چیزی است که باید در یکی از این دو جا قرار بگیرد:

- Render env: `MAKE_BRIDGE_PUBLISH_WEBHOOK_URL`
- یا tool: `social.make_bridge.configure`

---

## مرحله ۲ — Router

بعد از webhook یک **Router** بگذارید.

### Route A — Test
شرط:
- `action = test_connection`

در این route لازم نیست publish واقعی انجام شود.
فقط در انتها با **Webhook response** این JSON را برگردانید:

```json
{
  "ok": true,
  "platform": "{{1.platform}}",
  "message": "Connection looks healthy"
}
```

### Route B — Publish Instagram
شرط:
- `action = publish`
- `platform = instagram`

Module پیشنهادی:
- Instagram for Business (Facebook login) → Create a photo post

فیلدها:
- caption/text ← از `content` و `title`
- image url ← از `imageUrl`

در انتها Webhook response:

```json
{
  "ok": true,
  "platform": "instagram",
  "message": "Published successfully"
}
```

### Route C — Publish Facebook
شرط:
- `action = publish`
- `platform = facebook`

Module پیشنهادی:
- Facebook Pages → Create a post / photo post

### Route D — Publish LinkedIn
شرط:
- `action = publish`
- `platform = linkedin`

Module پیشنهادی:
- LinkedIn → Create a user image post / text post

### Route E — Publish Telegram
شرط:
- `action = publish`
- `platform = telegram`

Module پیشنهادی:
- Telegram Bot → Send a photo / send a text message

---

## پیشنهاد mapping محتوا

### title + content + link

می‌توانید داخل Make یک Text Aggregator یا compose ساده بسازید:

```text
{{1.title}}

{{1.content}}

{{1.link}}
```

برای Instagram اگر محدودیت متن دارید، content را کوتاه‌تر کنید.

---

## امنیت webhook

اگر خواستید کمی امن‌تر شود:

### روی Render / MCP
این envها را ست کنید:
- `MAKE_BRIDGE_AUTH_HEADER_NAME=X-Bridge-Token`
- `MAKE_BRIDGE_AUTH_HEADER_VALUE=YOUR_SECRET`

### داخل Make
در اولین step یا filter بررسی کنید که header درست باشد.

---

## تنظیم از داخل Arena

بعد از اینکه webhook Make را ساختید، از داخل Arena این tool را صدا بزنید:

### tool name
- `social.make_bridge.configure`

### arguments

```json
{
  "workspaceId": "default",
  "platforms": ["instagram", "facebook", "linkedin", "telegram"],
  "publishWebhookUrl": "https://hook.eu2.make.com/XXXX",
  "testWebhookUrl": "https://hook.eu2.make.com/YYYY",
  "connectionLabel": "Make Bridge"
}
```

اگر test webhook جدا ندارید، `testWebhookUrl` را حذف کنید.

---

## بعد از configure چه کار کنید؟

1. `social.connections.list`
2. `social.test.connection`
3. `social.publish.post` با `dryRun=true`
4. `social.publish.post` واقعی

---

## اگر اینستاگرام publish نکرد
چک کنید:
- اکانت Instagram شما Business / Creator باشد
- در Make با Facebook login همان اکانت صحیح را connect کرده باشید
- در route اینستاگرام image URL معتبر باشد
- Webhook response حتماً JSON معتبر برگرداند

---

## مزیت این مدل

- شما App credential دستی نمی‌دهید
- فقط داخل Make Approve می‌کنید
- تجربه‌اش به چیزی که در Base44 دیدید نزدیک‌تر است
- Arena فقط MCP را صدا می‌زند و نیاز به tokenهای Meta/LinkedIn ندارد
