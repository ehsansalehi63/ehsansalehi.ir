-- =====================================================================
-- اسکیمای پیشنهادی دیتابیس — فروشگاه پوشاک کودک و نوجوان
-- MySQL 8 / MariaDB 10.6+  |  utf8mb4_unicode_ci
-- این فایل «طرح» است، نه مهاجرت نهایی. در فاز اجرا به migration تبدیل می‌شود.
-- =====================================================================

SET NAMES utf8mb4;

-- ─────────────────────────────────────────────────────────────────────
-- ۱) کاتالوگ
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  parent_id     INT NULL,
  slug          VARCHAR(190) NOT NULL UNIQUE,
  name          VARCHAR(190) NOT NULL,
  gender        ENUM('boy','girl','unisex') DEFAULT 'unisex',
  age_min_month SMALLINT NULL,
  age_max_month SMALLINT NULL,
  seo_title     VARCHAR(190),
  seo_desc      VARCHAR(320),
  content_html  MEDIUMTEXT,          -- محتوای سئویی صفحه دسته
  sort_order    INT DEFAULT 0,
  is_active     TINYINT(1) DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_parent (parent_id),
  CONSTRAINT fk_cat_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS brands (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  slug       VARCHAR(190) NOT NULL UNIQUE,
  name       VARCHAR(190) NOT NULL,
  logo_url   VARCHAR(500),
  about      TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS suppliers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(190) NOT NULL,
  phone         VARCHAR(30),
  city          VARCHAR(90),
  lead_time_days SMALLINT DEFAULT 3,
  quality_score TINYINT DEFAULT 0,     -- 0..100 بر اساس مرجوعی و تأخیر
  notes         TEXT,
  is_active     TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  sku              VARCHAR(60) NOT NULL UNIQUE,
  slug             VARCHAR(220) NOT NULL UNIQUE,
  title            VARCHAR(220) NOT NULL,
  short_desc       VARCHAR(500),
  description_html MEDIUMTEXT,
  category_id      INT NULL,
  brand_id         INT NULL,
  supplier_id      INT NULL,
  gender           ENUM('boy','girl','unisex') DEFAULT 'unisex',
  age_min_month    SMALLINT,
  age_max_month    SMALLINT,
  season           ENUM('spring','summer','fall','winter','all') DEFAULT 'all',
  fabric           VARCHAR(120),
  colors_json      JSON,               -- ["سرمه‌ای","آبی"]
  features_json    JSON,               -- ["جیب‌دار","کمر کش"]
  style_tags_json  JSON,
  base_price       DECIMAL(12,0) NOT NULL,   -- ریال/تومان — واحد را ثابت نگه دارید
  compare_price    DECIMAL(12,0) NULL,       -- قیمت قبل از تخفیف
  cost_price       DECIMAL(12,0) NULL,       -- قیمت خرید (داخلی)
  weight_gram      INT DEFAULT 0,
  seo_title        VARCHAR(190),
  seo_desc         VARCHAR(320),
  faq_json         JSON,                     -- [{"q":"","a":""}]
  size_chart_json  JSON,
  ai_confidence    DECIMAL(4,3) DEFAULT NULL,
  ai_generated     TINYINT(1) DEFAULT 1,
  content_hash     CHAR(64),                 -- تشخیص محتوای تکراری
  status           ENUM('draft','review','active','archived') DEFAULT 'draft',
  published_at     DATETIME NULL,
  views            INT DEFAULT 0,
  sales_count      INT DEFAULT 0,
  rating_avg       DECIMAL(3,2) DEFAULT 0,
  rating_count     INT DEFAULT 0,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status_pub (status, published_at),
  INDEX idx_cat (category_id),
  INDEX idx_gender_age (gender, age_min_month, age_max_month),
  FULLTEXT KEY ft_search (title, short_desc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_variants (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id   BIGINT NOT NULL,
  size_label   VARCHAR(40) NOT NULL,     -- «۶-۷ سال» یا «۱۲۰»
  color        VARCHAR(60),
  barcode      VARCHAR(60),
  price_delta  DECIMAL(12,0) DEFAULT 0,
  stock        INT DEFAULT 0,
  reserved     INT DEFAULT 0,            -- رزرو هنگام افزودن به سبد
  height_cm_min SMALLINT, height_cm_max SMALLINT,
  weight_kg_min DECIMAL(4,1), weight_kg_max DECIMAL(4,1),
  UNIQUE KEY uq_variant (product_id, size_label, color),
  CONSTRAINT fk_var_prod FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_media (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id  BIGINT NOT NULL,
  kind        ENUM('image','video') DEFAULT 'image',
  role        ENUM('main','gallery','story','reel','pin','raw') DEFAULT 'gallery',
  url         VARCHAR(600) NOT NULL,
  width       INT, height INT,
  alt_text    VARCHAR(300),
  quality_score TINYINT,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_prod_role (product_id, role),
  CONSTRAINT fk_media_prod FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- ۲) مشتری و سفارش
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  phone         VARCHAR(20) NOT NULL UNIQUE,
  email         VARCHAR(190),
  full_name     VARCHAR(190),
  password_hash VARCHAR(255),
  city          VARCHAR(90),
  loyalty_points INT DEFAULT 0,
  loyalty_tier  ENUM('bronze','silver','gold') DEFAULT 'bronze',
  rfm_segment   VARCHAR(30),
  source        VARCHAR(60),            -- کانال جذب
  accepts_sms   TINYINT(1) DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_order_at DATETIME NULL,
  INDEX idx_segment (rfm_segment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ★ دارایی طلایی: پروفایل کودکان مشتری — موتور خرید مجدد
CREATE TABLE IF NOT EXISTS customer_children (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id  BIGINT NOT NULL,
  nickname     VARCHAR(90),
  gender       ENUM('boy','girl') NOT NULL,
  birth_date   DATE NULL,
  height_cm    SMALLINT NULL,
  weight_kg    DECIMAL(4,1) NULL,
  last_size    VARCHAR(40),
  size_updated_at DATE NULL,
  next_size_estimate_at DATE NULL,     -- پیش‌بینی زمان نیاز به سایز بعدی
  CONSTRAINT fk_child_cust FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_next_size (next_size_estimate_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS addresses (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  receiver    VARCHAR(190),
  phone       VARCHAR(20),
  province    VARCHAR(90), city VARCHAR(90),
  postal_code VARCHAR(20),
  line        VARCHAR(500),
  is_default  TINYINT(1) DEFAULT 0,
  CONSTRAINT fk_addr_cust FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_no       VARCHAR(30) NOT NULL UNIQUE,
  customer_id    BIGINT NULL,
  address_id     BIGINT NULL,
  status         ENUM('pending','paid','processing','shipped','delivered','cancelled','returned') DEFAULT 'pending',
  subtotal       DECIMAL(12,0) NOT NULL,
  discount       DECIMAL(12,0) DEFAULT 0,
  shipping_cost  DECIMAL(12,0) DEFAULT 0,
  tax            DECIMAL(12,0) DEFAULT 0,
  total          DECIMAL(12,0) NOT NULL,
  coupon_code    VARCHAR(60),
  payment_method ENUM('online','cod','wallet') DEFAULT 'online',
  payment_ref    VARCHAR(120),
  shipping_method VARCHAR(60),
  tracking_code  VARCHAR(90),
  utm_source     VARCHAR(90), utm_medium VARCHAR(90), utm_campaign VARCHAR(120),
  influencer_code VARCHAR(60),
  note           TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at        DATETIME NULL,
  INDEX idx_status_created (status, created_at),
  INDEX idx_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id   BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  variant_id BIGINT NULL,
  title_snapshot VARCHAR(220),
  size_label VARCHAR(40),
  qty        SMALLINT NOT NULL,
  unit_price DECIMAL(12,0) NOT NULL,
  total      DECIMAL(12,0) NOT NULL,
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS returns (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id   BIGINT NOT NULL,
  item_id    BIGINT NOT NULL,
  reason     ENUM('size_small','size_large','quality','wrong_item','changed_mind','damaged','other') NOT NULL,
  reason_note TEXT,
  status     ENUM('requested','approved','received','refunded','rejected') DEFAULT 'requested',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reason (reason)   -- برای اصلاح خودکار جدول سایز
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id  BIGINT NOT NULL,
  customer_id BIGINT NULL,
  order_id    BIGINT NULL,
  rating      TINYINT NOT NULL,
  title       VARCHAR(190),
  body        TEXT,
  size_fit    ENUM('small','true','large') NULL,   -- ورودی حیاتی برای توصیه‌گر سایز
  image_url   VARCHAR(600),
  status      ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_prod_status (product_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- ۳) اتوماسیون و محتوا
-- ─────────────────────────────────────────────────────────────────────

-- ورودی خام از فروشنده (عکس‌ها) — نقطه شروع پایپ‌لاین
CREATE TABLE IF NOT EXISTS ingest_jobs (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  source        ENUM('pwa','telegram','panel','api','app') NOT NULL,
  seller_id     BIGINT NULL,
  raw_images_json JSON NOT NULL,        -- آدرس فایل‌های خام
  voice_note_url VARCHAR(600) NULL,
  hint_text     TEXT,                   -- متن/کپشن فروشنده
  hint_price    DECIMAL(12,0) NULL,
  hint_stock    INT NULL,
  status        ENUM('queued','processing','vision_done','content_done','product_created','published','failed','needs_review') DEFAULT 'queued',
  product_id    BIGINT NULL,
  ai_result_json JSON,
  error_text    TEXT,
  attempts      TINYINT DEFAULT 0,
  duration_ms   INT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- صف انتشار شبکه‌های اجتماعی
CREATE TABLE IF NOT EXISTS social_queue (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  idempotency_key VARCHAR(190) NOT NULL UNIQUE,   -- product:channel:template
  channel       VARCHAR(40) NOT NULL,     -- instagram|telegram|bale|eitaa|rubika|pinterest|youtube|aparat|linkedin|whatsapp|x
  post_type     VARCHAR(40) NOT NULL,     -- post|story|reel|carousel|pin|short|video
  ref_type      ENUM('product','article','campaign','ugc') NOT NULL,
  ref_id        BIGINT NULL,
  caption       MEDIUMTEXT,
  hashtags      TEXT,
  media_json    JSON,                     -- آدرس تصاویر/ویدئو
  template      VARCHAR(60),
  tone          VARCHAR(40),
  scheduled_at  DATETIME NOT NULL,
  status        ENUM('draft','awaiting_review','scheduled','publishing','published','failed','skipped') DEFAULT 'scheduled',
  attempts      TINYINT DEFAULT 0,
  external_id   VARCHAR(190),             -- شناسه پست در پلتفرم
  external_url  VARCHAR(600),
  error_text    TEXT,
  published_at  DATETIME NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sched (status, scheduled_at),
  INDEX idx_channel (channel, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- آمار عملکرد پست‌ها — ورودی موتور یادگیری
CREATE TABLE IF NOT EXISTS social_stats (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  queue_id     BIGINT NOT NULL,
  captured_at  DATETIME NOT NULL,
  impressions  INT DEFAULT 0,
  reach        INT DEFAULT 0,
  likes        INT DEFAULT 0,
  comments     INT DEFAULT 0,
  shares       INT DEFAULT 0,
  saves        INT DEFAULT 0,
  clicks       INT DEFAULT 0,
  attributed_orders INT DEFAULT 0,
  attributed_revenue DECIMAL(14,0) DEFAULT 0,
  INDEX idx_queue (queue_id, captured_at),
  CONSTRAINT fk_stats_queue FOREIGN KEY (queue_id) REFERENCES social_queue(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- مقالات بلاگ (تولید خودکار)
CREATE TABLE IF NOT EXISTS articles (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  slug        VARCHAR(220) NOT NULL UNIQUE,
  title       VARCHAR(220) NOT NULL,
  excerpt     VARCHAR(500),
  body_html   LONGTEXT,
  cover_url   VARCHAR(600),
  cluster     VARCHAR(90),              -- خوشه موضوعی سئو
  primary_keyword VARCHAR(190),
  keywords_json JSON,
  faq_json    JSON,
  author_name VARCHAR(120),
  ai_generated TINYINT(1) DEFAULT 1,
  human_reviewed TINYINT(1) DEFAULT 0,
  content_hash CHAR(64),
  status      ENUM('draft','review','published','archived') DEFAULT 'draft',
  views       INT DEFAULT 0,
  published_at DATETIME NULL,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status_pub (status, published_at),
  INDEX idx_cluster (cluster)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- بانک موضوعات محتوایی (۳۰۰ موضوع از پیش تعریف‌شده)
CREATE TABLE IF NOT EXISTS content_bank (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  topic       VARCHAR(300) NOT NULL,
  cluster     VARCHAR(90),
  keyword     VARCHAR(190),
  content_type ENUM('guide','trend','health','style','interactive','ugc','fun') NOT NULL,
  season      VARCHAR(30),
  priority    TINYINT DEFAULT 5,
  used_at     DATETIME NULL,
  article_id  BIGINT NULL,
  INDEX idx_unused (used_at, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- تنظیمات اتوماسیون (سازگار با کد فعلی ehsansalehi.ir)
CREATE TABLE IF NOT EXISTS automation_settings (
  setting_key   VARCHAR(100) PRIMARY KEY,
  setting_value TEXT,
  is_secret     TINYINT(1) DEFAULT 0,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- لاگ مصرف AI برای کنترل هزینه
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  task_type    VARCHAR(60) NOT NULL,     -- vision|product_desc|caption|article|video_script
  model        VARCHAR(90),
  input_tokens INT, output_tokens INT,
  cost_usd     DECIMAL(10,5),
  duration_ms  INT,
  cached       TINYINT(1) DEFAULT 0,
  success      TINYINT(1) DEFAULT 1,
  ref_type     VARCHAR(40), ref_id BIGINT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_task_date (task_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- ۴) بازاریابی
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaigns (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  slug         VARCHAR(120) NOT NULL UNIQUE,
  name         VARCHAR(190) NOT NULL,
  occasion     VARCHAR(90),              -- back_to_school|nowruz|yalda|...
  starts_at    DATETIME, ends_at DATETIME,
  prep_days    SMALLINT DEFAULT 20,      -- چند روز قبل خودکار آماده شود
  budget       DECIMAL(14,0) DEFAULT 0,
  spent        DECIMAL(14,0) DEFAULT 0,
  revenue      DECIMAL(14,0) DEFAULT 0,
  status       ENUM('planned','preparing','running','ended') DEFAULT 'planned',
  config_json  JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupons (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(60) NOT NULL UNIQUE,
  type          ENUM('percent','fixed','free_shipping') DEFAULT 'percent',
  value         DECIMAL(12,0) NOT NULL,
  min_order     DECIMAL(12,0) DEFAULT 0,
  max_discount  DECIMAL(12,0) NULL,
  usage_limit   INT NULL, used_count INT DEFAULT 0,
  per_customer_limit SMALLINT DEFAULT 1,
  campaign_id   INT NULL,
  influencer_id INT NULL,
  starts_at     DATETIME, expires_at DATETIME,
  is_active     TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS influencers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(190),
  platform      VARCHAR(40),
  handle        VARCHAR(120),
  followers     INT,
  engagement_rate DECIMAL(5,2),
  tier          ENUM('nano','micro','macro','celeb') DEFAULT 'nano',
  contact       VARCHAR(190),
  deal_type     ENUM('product','cash','commission','hybrid') DEFAULT 'product',
  commission_pct DECIMAL(5,2) DEFAULT 0,
  coupon_code   VARCHAR(60),
  total_orders  INT DEFAULT 0,
  total_revenue DECIMAL(14,0) DEFAULT 0,
  total_cost    DECIMAL(14,0) DEFAULT 0,
  status        ENUM('prospect','contacted','active','paused','dropped') DEFAULT 'prospect',
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS backlinks (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  source_domain VARCHAR(190) NOT NULL,
  source_url    VARCHAR(600),
  target_url    VARCHAR(600),
  anchor_text   VARCHAR(300),
  link_type     ENUM('dofollow','nofollow','ugc','sponsored') DEFAULT 'dofollow',
  tactic        VARCHAR(90),            -- guest_post|directory|pr|social|resource
  authority     TINYINT NULL,
  status        ENUM('opportunity','outreach','pending','live','lost','toxic') DEFAULT 'opportunity',
  first_seen    DATE, last_checked DATE,
  notes         TEXT,
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS keyword_tracking (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  keyword       VARCHAR(190) NOT NULL,
  cluster       VARCHAR(90),
  target_url    VARCHAR(600),
  search_volume INT NULL,
  difficulty    TINYINT NULL,
  current_rank  SMALLINT NULL,
  best_rank     SMALLINT NULL,
  prev_rank     SMALLINT NULL,
  checked_at    DATE,
  UNIQUE KEY uq_kw (keyword)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- رصد قیمت رقبا
CREATE TABLE IF NOT EXISTS competitor_prices (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id  BIGINT NULL,
  competitor  VARCHAR(120),
  url         VARCHAR(600),
  title       VARCHAR(300),
  price       DECIMAL(12,0),
  in_stock    TINYINT(1),
  captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_prod_time (product_id, captured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- تقویم مناسبتی ایران — محرک کمپین خودکار
CREATE TABLE IF NOT EXISTS occasions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(60) NOT NULL UNIQUE,
  name_fa     VARCHAR(120) NOT NULL,
  jalali_month TINYINT, jalali_day TINYINT,
  is_range    TINYINT(1) DEFAULT 0,
  range_days  SMALLINT DEFAULT 0,
  importance  TINYINT DEFAULT 5,
  content_hint TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────
-- ۵) عملیات و امنیت
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(90) NOT NULL UNIQUE,
  email         VARCHAR(190),
  phone         VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('owner','admin','seller','support','viewer') DEFAULT 'viewer',
  is_active     TINYINT(1) DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT NULL,
  action     VARCHAR(90) NOT NULL,
  entity     VARCHAR(60), entity_id BIGINT,
  before_json JSON, after_json JSON,
  ip         VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity, entity_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  channel    ENUM('sms','telegram','push','email','inapp') NOT NULL,
  recipient  VARCHAR(190) NOT NULL,
  template   VARCHAR(90),
  payload_json JSON,
  status     ENUM('queued','sent','failed') DEFAULT 'queued',
  scheduled_at DATETIME NOT NULL,
  sent_at    DATETIME NULL,
  error_text TEXT,
  INDEX idx_sched (status, scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
