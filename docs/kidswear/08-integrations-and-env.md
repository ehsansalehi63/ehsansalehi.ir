# سند ۸ — سرویس‌ها، یکپارچه‌سازی‌ها و متغیرهای محیطی

## ۸٫۱ فهرست کامل سرویس‌های مورد نیاز

ستون «مرحله» نشان می‌دهد این سرویس از کدام مرحله زیرساخت (سند ۲) لازم می‌شود.

| دسته | سرویس | ضرورت | مرحله | یادداشت |
|---|---|---|---|---|
| زیرساخت | **هاست cPanel میزبان‌فا (ایران)** | 🔴 | ۱ | سایت، دیتابیس، پرداخت، پیامک |
| زیرساخت | **هاست cPanel هاستینگر (خارج)** | 🔴 | ۱ | موتور AI + انتشار شبکه‌های اجتماعی |
| زیرساخت | CDN ابرآروان | 🔴 | ۱ | سرعت + WAF + دسترس‌پذیری (پلن رایگان کافی) |
| زیرساخت | دامنه `.ir` + `.com` | 🔴 | ۱ | `.ir` برای اینماد |
| زیرساخت | فضای بکاپ ابری | 🟠 | ۱ | بکاپ خارج از هاست |
| زیرساخت | VPS کوچک (رندر ویدئو) | 🟡 | ۲ | فقط وقتی محرک ارتقا فعال شد |
| زیرساخت | VPS اصلی + Docker | 🟡 | ۳ | مهاجرت کامل |
| AI | **AgentRouter** | 🔴 | ۱ | متن، توضیح محصول، کپشن، مقاله، سناریو |
| AI | سرویس Vision (تشخیص تصویر) | 🔴 | ۱ | از طریق AgentRouter اگر مدل چندوجهی داشت، وگرنه جدا |
| AI | سرویس تولید/ویرایش تصویر | 🟠 | ۲ | عکس روی مانکن، بنر |
| AI | Speech-to-Text فارسی | 🟡 | ۲ | یادداشت صوتی فروشنده |
| پرداخت | زرین‌پال / زیبال / آیدی‌پی | 🔴 | ۱ | فاز ۱ واسط |
| پرداخت | درگاه مستقیم بانکی | 🟠 | ۱ | بعد از اینماد |
| پرداخت | پرداخت در محل (پست) | 🟠 | ۲ | نیازمند اینماد |
| پیامک | کاوه‌نگار / ملی‌پیامک / SMS.ir | 🔴 | ۱ | OTP، رهگیری، کمپین |
| لجستیک | تیپاکس / چاپار / پست | 🔴 | ۱ | API رهگیری |
| قانونی | اینماد | 🔴 | ۱ | الزامی برای فروشگاه |
| قانونی | جواز کسب اینترنتی | 🔴 | ۱ | اتحادیه کسب‌وکار مجازی |
| قانونی | سامانه مؤدیان | 🔴 | ۱ | صورتحساب الکترونیکی |
| سوشال | تلگرام Bot API | 🔴 | ۱ | ✅ کد آماده دارید |
| سوشال | اینستاگرام Graph API | 🔴 | ۱ | نیاز به اکانت Business + صفحه فیسبوک |
| سوشال | بله / ایتا / روبیکا Bot API | 🟠 | ۱ | ✅ کد آماده دارید |
| سوشال | واتساپ Business API / Green API | 🟠 | ۱ | ✅ کد آماده دارید |
| سوشال | پینترست API | 🟡 | ۱ | ROI عالی |
| سوشال | یوتیوب Data API | 🟡 | ۲ | شورتس |
| سوشال | آپارات | 🟡 | ۲ | سئوی ویدئویی فارسی |
| سوشال | لینکدین API | 🟡 | ۱ | ✅ کد آماده دارید |
| سئو | Google Search Console API | 🔴 | ۱ | رصد و ایندکس |
| سئو | Google Indexing API / IndexNow | 🟠 | ۱ | ایندکس سریع |
| سئو | Google Analytics 4 | 🔴 | ۱ | تحلیل |
| سئو | Google Business Profile | 🟠 | ۱ | سئوی لوکال |
| مارکت‌پلیس | ترب / ایمالز / باسلام | 🟠 | ۲ | فید محصول |
| ابزار | MeiliSearch | 🟠 | ۳ | جستجوی فارسی (فاز ۱: MySQL FULLTEXT) |
| ابزار | n8n | 🟠 | ۲ | ارکستراسیون (فاز ۱: کد در `lib/workflows/`) |
| ابزار | Uptime Kuma | 🟠 | ۲ | مانیتورینگ |
| ابزار | Microsoft Clarity | 🟡 | ۱ | هیت‌مپ رایگان |
| پرو آنلاین | موتور Fit (کد داخلی) | 🔴 | ۱ | سطح ۱ — بدون سرویس خارجی |
| پرو آنلاین | رندر آواتار Canvas/WebGL | 🟠 | ۱ | سطح ۲ — سمت-کاربر، رایگان |
| پرو آنلاین | سرویس Virtual Try-On (AI) | 🟡 | ۳ | سطح ۳ — ⚠️ فقط با رعایت کامل حریم خصوصی کودک |

## ۸٫۲ الگوی فایل `.env` (نمونه — هرگز در گیت کامیت نشود)

```bash
# ─── پایه ─────────────────────────────────────────────
NODE_ENV=production
SITE_URL=https://example-shop.ir
SITE_NAME="نام برند"
TZ=Asia/Tehran

# ─── انتخاب زیرساخت (کلید مهاجرت cPanel ↔ VPS) ───────
INFRA_STAGE=1                 # 1=cPanel | 2=hybrid | 3=vps
QUEUE_DRIVER=mysql            # mysql | redis
STORAGE_DRIVER=fs             # fs | s3
SEARCH_DRIVER=mysql           # mysql | meili
VIDEO_DRIVER=browser          # browser | cloud | ffmpeg
# تغییر این پنج مقدار = مهاجرت کامل زیرساخت، بدون تغییر یک خط کد

# ─── دیتابیس (سازگار با app/lib/mysql.ts فعلی) ────────
MYSQL_HOST=localhost          # روی cPanel معمولاً localhost
MYSQL_PORT=3306
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DATABASE=

# ─── موتور اتوماسیون روی هاستینگر (فراخوانی از میزبان‌فا) ─
ENGINE_BASE_URL=https://engine.example-shop.com
ENGINE_SHARED_SECRET=

# ─── Redis / صف (فقط مرحله ۲ و ۳) ─────────────────────
REDIS_URL=

# ─── فایل و رسانه ─────────────────────────────────────
UPLOAD_DIR=./public/uploads   # مرحله ۱: فایل‌سیستم cPanel
CDN_BASE_URL=https://cdn.example-shop.ir
S3_ENDPOINT=                  # مرحله ۳: MinIO
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=

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
REMBG_MODE=local              # local | api  (حذف پس‌زمینه)
VIDEO_CLOUD_API_KEY=          # مرحله ۱-۲: سرویس ابری رندر
FFMPEG_PATH=                  # فقط مرحله ۳
VIDEO_MUSIC_DIR=./assets/music

# ─── پرو آنلاین (سند ۱۱) ──────────────────────────────
TRYON_LEVEL=1                 # 1=fit only | 2=avatar | 3=ai photo
TRYON_AVATAR_ASSETS=/assets/avatar
TRYON_AI_ENDPOINT=            # فقط سطح ۳
TRYON_AI_KEY=
TRYON_PHOTO_RETENTION_HOURS=0 # 0 = حذف فوری عکس کودک (توصیه‌شده)
TRYON_REQUIRE_PARENT_CONSENT=true

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
