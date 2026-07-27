# اتوماسیون اخبار ساعتی

این پروژه اکنون دو Endpoint برای اجرای امن اتوماسیون دارد:

- تست اتصال‌ها بدون انتشار پست: `/api/admin/integrations-test`
- دریافت و ذخیره اخبار تازه: `/api/cron/news`
- انتشار اخبار ذخیره‌شده در شبکه‌های اجتماعی: `/api/social/post`

## اجرای فوری ۱۰ خبر

بعد از دیپلوی موفق و تنظیم `CRON_SECRET` در هاست، این دستور ۱۰ خبر تازه از منابع معتبر AI/Blockchain/Tech می‌گیرد، داخل سایت ذخیره می‌کند و سپس همان ۱۰ خبر ذخیره‌شده را برای شبکه‌های اجتماعی صف/منتشر می‌کند:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  "https://ehsansalehi.ir/api/admin/integrations-test"

curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  "https://ehsansalehi.ir/api/cron/news?force=true&count=10&feeds=22&perFeed=5&postSocial=false"

curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  "https://ehsansalehi.ir/api/social/post?limit=10"
```

> اگر هنوز DNS کامل propagate نشده، موقتاً روی سیستم اجراکننده Cron رکورد hosts بگذارید: `88.135.68.17 ehsansalehi.ir`.

## تنظیم Cron ساعتی در cPanel / Mizbanfa

برای اینکه هر ساعت ۱ تا ۲ خبر بدون نیاز به دخالت دستی منتشر شود، در cPanel بخش **Cron Jobs** یک Cron با زمان‌بندی زیر بسازید:

```cron
5 * * * * /usr/bin/curl -fsS -H "Authorization: Bearer YOUR_CRON_SECRET" "https://ehsansalehi.ir/api/cron/news?force=true&count=2&feeds=22&perFeed=4&postSocial=false" >/dev/null && /usr/bin/curl -fsS -H "Authorization: Bearer YOUR_CRON_SECRET" "https://ehsansalehi.ir/api/social/post?limit=2" >/dev/null
```

`YOUR_CRON_SECRET` باید همان مقدار متغیر محیطی `CRON_SECRET` در Node.js App باشد.

## اجرای دستی برای تست

```bash
curl -i -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://ehsansalehi.ir/api/admin/integrations-test"

curl -i -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://ehsansalehi.ir/api/cron/news?force=true&count=1&postSocial=false"

curl -i -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "https://ehsansalehi.ir/api/social/post?limit=1"
```

## نکته GitHub Actions

اگر بخواهید این کار از GitHub Actions انجام شود، باید یک workflow زمان‌بندی‌شده بسازید؛ ولی GitHub App آرنا مجوز `workflows` ندارد و Push فایل داخل `.github/workflows` را رد می‌کند. بنابراین اگر Cron هاست را نمی‌خواهید، این فایل را دستی از UI گیت‌هاب بسازید: `.github/workflows/hourly-news.yml`

```yaml
name: Hourly News Automation

on:
  schedule:
    - cron: '5 * * * *'
  workflow_dispatch:
    inputs:
      count:
        description: 'How many fresh news items to save before social posting'
        required: false
        default: '2'
      social_limit:
        description: 'How many pending news items to publish to social channels'
        required: false
        default: '2'

jobs:
  publish-news:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    env:
      SITE_URL: ${{ secrets.NEWS_SITE_URL || 'https://ehsansalehi.ir' }}
      COUNT: ${{ github.event.inputs.count || '2' }}
      SOCIAL_LIMIT: ${{ github.event.inputs.social_limit || '2' }}
    steps:
      - name: Test AI/social/RSS integrations (non-posting)
        run: |
          curl --fail --show-error --silent \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "$SITE_URL/api/admin/integrations-test"

      - name: Fetch fresh AI/blockchain/tech news into website
        run: |
          curl --fail --show-error --silent \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "$SITE_URL/api/cron/news?force=true&count=$COUNT&feeds=22&perFeed=4&postSocial=false"

      - name: Publish pending news to social networks
        run: |
          curl --fail --show-error --silent \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "$SITE_URL/api/social/post?limit=$SOCIAL_LIMIT"
```
