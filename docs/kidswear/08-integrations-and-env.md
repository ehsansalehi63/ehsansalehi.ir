# سند ۸ — سرویس‌ها، یکپارچه‌سازی‌ها و متغیرهای محیطی

## ۸٫۱ فهرست کامل سرویس‌های مورد نیاز

| دسته | سرویس | ضرورت | یادداشت |
|---|---|---|---|
| زیرساخت | Hostinger VPS (KVM 2/4) | 🔴 | میزبان اصلی اپ + AI + n8n |
| زیرساخت | VPS ایران (Relay) | 🔴 | پرداخت، پیامک، آینه بحران |
| زیرساخت | CDN ابرآروان | 🔴 | سرعت + WAF + دسترس‌پذیری |
| زیرساخت | دامنه `.ir` + `.com` | 🔴 | `.ir` برای اینماد |
| زیرساخت | Backblaze B2 / فضای بکاپ | 🟠 | بکاپ خارج از سرور |
| AI | **AgentRouter** | 🔴 | متن، توضیح محصول، کپشن، مقاله، سناریو |
| AI | سرویس Vision (تشخیص تصویر) | 🔴 | از طریق AgentRouter اگر مدل چندوجهی داشت، وگرنه جدا |
| AI | سرویس تولید/ویرایش تصویر | 🟠 | عکس روی مانکن، بنر |
| AI | Speech-to-Text فارسی | 🟡 | یادداشت صوتی فروشنده |
| پرداخت | زرین‌پال / زیبال / آیدی‌پی | 🔴 | فاز ۱ واسط |
| پرداخت | درگاه مستقیم بانکی | 🟠 | بعد از اینماد |
| پرداخت | پرداخت در محل (پست) | 🟠 | نیازمند اینماد |
| پیامک | کاوه‌نگار / ملی‌پیامک / SMS.ir | 🔴 | OTP، رهگیری، کمپین |
| لجستیک | تیپاکس / چاپار / پست | 🔴 | API رهگیری |
| قانونی | اینماد | 🔴 | الزامی برای فروشگاه |
| قانونی | جواز کسب اینترنتی | 🔴 | اتحادیه کسب‌وکار مجازی |
| قانونی | سامانه مؤدیان | 🔴 | صورتحساب الکترونیکی |
| سوشال | تلگرام Bot API | 🔴 | ✅ کد آماده دارید |
| سوشال | اینستاگرام Graph API | 🔴 | نیاز به اکانت Business + صفحه فیسبوک |
| سوشال | بله / ایتا / روبیکا Bot API | 🟠 | ✅ کد آماده دارید |
| سوشال | واتساپ Business API / Green API | 🟠 | ✅ کد آماده دارید |
| سوشال | پینترست API | 🟡 | ROI عالی |
| سوشال | یوتیوب Data API | 🟡 | شورتس |
| سوشال | آپارات | 🟡 | سئوی ویدئویی فارسی |
| سوشال | لینکدین API | 🟡 | ✅ کد آماده دارید |
| سئو | Google Search Console API | 🔴 | رصد و ایندکس |
| سئو | Google Indexing API / IndexNow | 🟠 | ایندکس سریع |
| سئو | Google Analytics 4 | 🔴 | تحلیل |
| سئو | Google Business Profile | 🟠 | سئوی لوکال |
| مارکت‌پلیس | ترب / ایمالز / باسلام | 🟠 | فید محصول |
| ابزار | MeiliSearch | 🟠 | جستجوی فارسی |
| ابزار | n8n | 🔴 | ارکستراسیون |
| ابزار | Uptime Kuma | 🟠 | مانیتورینگ |
| ابزار | Microsoft Clarity | 🟡 | هیت‌مپ رایگان |

## ۸٫۲ الگوی فایل `.env` (نمونه — هرگز در گیت کامیت نشود)

```bash
# ─── پایه ─────────────────────────────────────────────
NODE_ENV=production
SITE_URL=https://example-shop.ir
SITE_NAME="نام برند"
TZ=Asia/Tehran

# ─── دیتابیس (سازگار با app/lib/mysql.ts فعلی) ────────
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USER=shop
MYSQL_PASSWORD=
MYSQL_DATABASE=kidswear

# ─── Redis / صف ───────────────────────────────────────
REDIS_URL=redis://redis:6379

# ─── فایل و رسانه ─────────────────────────────────────
S3_ENDPOINT=http://minio:9000
S3_BUCKET=media
S3_ACCESS_KEY=
S3_SECRET_KEY=
CDN_BASE_URL=https://cdn.example-shop.ir

# ─── AgentRouter (OpenAI-compatible) ──────────────────
OPENAI_BASE_URL=https://agentrouter.org/v1
OPENAI_API_KEY=
OPENAI_MODEL=claude-opus-4-6
AI_MODEL_CHEAP=            # مدل ارزان برای کپشن‌های ساده
AI_DAILY_BUDGET_USD=5      # سقف مصرف روزانه
AI_CACHE_TTL=86400

# ─── AgentRouter (Anthropic-compatible / Claude Code) ─
# توجه: بدون /v1
ANTHROPIC_BASE_URL=https://agentrouter.org
ANTHROPIC_AUTH_TOKEN=
ANTHROPIC_MODEL=claude-opus-4-6

# ─── سرویس تصویر و ویدئو ──────────────────────────────
IMAGE_GEN_PROVIDER=
IMAGE_GEN_API_KEY=
FFMPEG_PATH=/usr/bin/ffmpeg
VIDEO_MUSIC_DIR=/app/assets/music

# ─── امنیت ────────────────────────────────────────────
JWT_SECRET=
CRON_SECRET=
ENCRYPTION_KEY=            # AES-256 برای رمزنگاری توکن‌های سوشال
ADMIN_TELEGRAM_CHAT_ID=

# ─── پرداخت (از طریق Relay ایران) ─────────────────────
ZARINPAL_MERCHANT_ID=
PAYMENT_CALLBACK_URL=https://example-shop.ir/api/payment/callback
IRAN_RELAY_URL=https://relay.example-shop.ir
IRAN_RELAY_TOKEN=

# ─── پیامک ────────────────────────────────────────────
SMS_PROVIDER=kavenegar
SMS_API_KEY=
SMS_SENDER=
SMS_TEMPLATE_OTP=
SMS_TEMPLATE_ORDER=

# ─── لجستیک ───────────────────────────────────────────
TIPAX_API_KEY=
POST_API_KEY=

# ─── شبکه‌های اجتماعی (سازگار با socialPoster.ts فعلی) ─
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHANNEL_ID=
TELEGRAM_UPLOAD_BOT_TOKEN=     # ربات آپلود فروشنده (جدا)
TELEGRAM_SELLER_GROUP_ID=

INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_ACCOUNT_ID=
FB_PAGE_ACCESS_TOKEN=
FB_PAGE_ID=

BALE_BOT_TOKEN=
BALE_CHANNEL_ID=
EITAA_BOT_TOKEN=
EITAA_CHANNEL_ID=
RUBIKA_BOT_TOKEN=
RUBIKA_CHANNEL_ID=

WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
GREEN_API_INSTANCE_ID=
GREEN_API_TOKEN=

LINKEDIN_ACCESS_TOKEN=
LINKEDIN_COMPANY_ID=

PINTEREST_ACCESS_TOKEN=
PINTEREST_BOARD_MAP=           # JSON: {"پسرانه":"boardId", ...}
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REFRESH_TOKEN=
APARAT_USERNAME=
APARAT_PASSWORD=
X_API_KEY=
X_API_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_SECRET=

# ─── سئو و تحلیل ──────────────────────────────────────
GOOGLE_SITE_VERIFICATION=
GSC_SERVICE_ACCOUNT_JSON=
INDEXNOW_KEY=
GA4_MEASUREMENT_ID=
CLARITY_PROJECT_ID=

# ─── جستجو ────────────────────────────────────────────
MEILI_HOST=http://meilisearch:7700
MEILI_MASTER_KEY=

# ─── کنترل اتوماسیون ──────────────────────────────────
AUTOMATION_MODE=REVIEW        # AUTO | REVIEW | DRAFT | PAUSE
AUTO_PUBLISH_CHANNELS=telegram,bale,eitaa,rubika,pinterest
REVIEW_REQUIRED_CHANNELS=instagram,youtube,aparat
MAX_POSTS_PER_DAY_INSTAGRAM=2
MAX_POSTS_PER_DAY_TELEGRAM=4
POST_GOLDEN_HOURS=10:00-11:30,13:30-15:00,21:00-23:30
```

## ۸٫۳ مدیریت کلیدها از پنل (بدون ری‌دیپلوی)

پروژه فعلی شما الگوی خیلی خوبی دارد: جدول `automation_settings` که مقادیر را از دیتابیس می‌خواند و اگر نبود از `process.env`. همین الگو را نگه می‌داریم و توسعه می‌دهیم:

```
اولویت خواندن تنظیمات:
  1. مقدار دیتابیس (قابل ویرایش از پنل ادمین) — رمزنگاری‌شده
  2. متغیر محیطی
  3. مقدار پیش‌فرض
```

مزیت: تیم غیرفنی می‌تواند توکن اینستاگرام منقضی‌شده را از پنل عوض کند، بدون دیپلوی.

## ۸٫۴ endpointهای سلامت و تست (الگوی موجود پروژه)

| مسیر | کاربرد |
|---|---|
| `GET /api/deploy/health` | نسخه، کامیت، زمان بیلد |
| `GET /api/deploy/health?db=1` | تست دیتابیس |
| `GET /api/admin/integrations-test` | تست همه اتصال‌ها بدون انتشار واقعی |
| `GET /api/admin/ai-test` | تست AgentRouter و اندازه‌گیری تأخیر |
| `POST /api/ingest/photos` | ورودی اصلی اتوماسیون |
| `GET /api/cron/daily-content` | تولید محتوای روزانه |
| `GET /api/cron/publish-queue` | پردازش صف انتشار |
| `GET /api/cron/price-watch` | رصد قیمت رقبا |
| `GET /api/cron/backup` | بکاپ |

همه cronها با هدر `Authorization: Bearer $CRON_SECRET` محافظت می‌شوند — دقیقاً الگوی فعلی شما.

## ۸٫۵ زمان‌بندی cron پیشنهادی

```cron
# پردازش صف انتشار — هر ۵ دقیقه
*/5 * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://SITE/api/cron/publish-queue

# تولید محتوای روزانه — ۶ صبح
0 6 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://SITE/api/cron/daily-content

# گزارش صبحگاهی مدیر — ۹ صبح
0 9 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://SITE/api/cron/daily-report

# رصد قیمت رقبا — هر ۶ ساعت
0 */6 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://SITE/api/cron/price-watch

# جمع‌آوری آمار پست‌ها — هر ۶ ساعت
30 */6 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://SITE/api/cron/social-stats

# ریتارگتینگ و سبد رهاشده — هر ساعت
15 * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://SITE/api/cron/retargeting

# بکاپ — ۳ بامداد
0 3 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://SITE/api/cron/backup

# گزارش سئوی هفتگی — شنبه ۱۰ صبح
0 10 * * 6 curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://SITE/api/cron/seo-report
```

## ۸٫۶ کنترل هزینه AI

| تکنیک | صرفه‌جویی تخمینی |
|---|---|
| کش پاسخ‌های مشابه در Redis | ۲۵-۴۰٪ |
| مدل ارزان برای کارهای ساده (کپشن، هشتگ) | ۳۰-۵۰٪ |
| Batch کردن درخواست‌ها | ۱۰-۱۵٪ |
| قالب‌های ثابت برای بخش‌های تکراری متن | ۲۰٪ |
| فشرده‌سازی تصویر قبل از ارسال به Vision | ۳۰٪ توکن تصویر |
| سقف روزانه و هشدار مصرف | جلوگیری از فاجعه |

جدول `ai_usage_log` هر فراخوانی را ثبت می‌کند: مدل، توکن ورودی/خروجی، هزینه، مدت، نوع کار. گزارش هفتگی هزینه به تفکیک نوع کار.
