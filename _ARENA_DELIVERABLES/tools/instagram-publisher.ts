/**
 * ═══════════════════════════════════════════════════════════════
 *  موتور انتشار اینستاگرام — سه‌حالته
 *
 *  حل مانع ۳: پروژه نباید منتظر تأیید App Review متا بماند.
 *
 *  حالت‌ها (با متغیر INSTAGRAM_MODE کنترل می‌شود):
 *    'semi'  → همه‌چیز آماده می‌شود، مدیر با یک لمس در تلگرام منتشر می‌کند
 *              ✅ از روز اول کار می‌کند، بدون هیچ وابستگی به متا
 *    'auto'  → انتشار مستقیم با Graph API
 *              ✅ اگر App Review پاس شد، فقط همین متغیر عوض می‌شود
 *    'off'   → غیرفعال
 *
 *  ⚠️ نکته معماری: این ماژول باید روی هاست خارجی (هاستینگر) اجرا شود،
 *     نه روی میزبان‌فا — چون متا درخواست از IP ایران را رد می‌کند.
 * ═══════════════════════════════════════════════════════════════
 */

export type InstagramMode = 'semi' | 'auto' | 'off';
export type PostKind = 'image' | 'carousel' | 'reel' | 'story';

export interface PublishRequest {
  kind: PostKind;
  /** آدرس عمومی تصاویر/ویدئو — باید از اینترنت قابل دسترسی باشند */
  mediaUrls: string[];
  caption: string;
  hashtags?: string[];
  /** شناسه محصول یا مقاله برای ردیابی */
  refId?: string | number;
  /** لینکی که در کپشن یا بایو قرار می‌گیرد */
  productUrl?: string;
}

export interface PublishResult {
  ok: boolean;
  mode: InstagramMode;
  /** در حالت auto: شناسه پست اینستاگرام. در حالت semi: شناسه صف */
  id?: string;
  url?: string;
  /** در حالت semi یعنی «در انتظار تأیید مدیر» */
  pending?: boolean;
  error?: string;
}

// ─── تنظیمات ────────────────────────────────────────────────
const MODE = (process.env.INSTAGRAM_MODE || 'semi') as InstagramMode;
const IG_USER_ID = process.env.INSTAGRAM_ACCOUNT_ID || '';
const IG_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.FB_PAGE_ACCESS_TOKEN || '';
const GRAPH = `https://graph.facebook.com/${process.env.META_API_VERSION || 'v21.0'}`;

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TG_ADMIN = process.env.ADMIN_TELEGRAM_CHAT_ID || '';

/** سقف متا: ۲۵ پست در ۲۴ ساعت برای هر اکانت */
const DAILY_LIMIT = Number(process.env.INSTAGRAM_DAILY_LIMIT || 20);

// ─── کمکی ───────────────────────────────────────────────────
function buildCaption(req: PublishRequest): string {
  const tags = (req.hashtags || []).map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ');
  const link = req.productUrl ? `\n\n🔗 ${req.productUrl}` : '';
  return `${req.caption}${link}${tags ? `\n\n${tags}` : ''}`.trim();
}

async function graphPost(path: string, body: Record<string, string>): Promise<any> {
  const res = await fetch(`${GRAPH}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...body, access_token: IG_TOKEN }),
    signal: AbortSignal.timeout(60_000),
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Graph API خطا ${res.status}`);
  }
  return json;
}

// ═══════════════════════════════════════════════════════════
//  حالت AUTO — انتشار مستقیم با Graph API
// ═══════════════════════════════════════════════════════════

/** متا کانتینر را async پردازش می‌کند؛ باید منتظر آماده شدنش بمانیم */
async function waitForContainer(id: string, maxTries = 30): Promise<void> {
  for (let i = 0; i < maxTries; i++) {
    const res = await fetch(
      `${GRAPH}/${id}?fields=status_code,status&access_token=${IG_TOKEN}`,
      { signal: AbortSignal.timeout(20_000) },
    );
    const j = await res.json();
    if (j.status_code === 'FINISHED') return;
    if (j.status_code === 'ERROR' || j.status_code === 'EXPIRED') {
      throw new Error(`کانتینر ناموفق: ${j.status || j.status_code}`);
    }
    // ویدئو زمان بیشتری می‌برد
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error('کانتینر در زمان مجاز آماده نشد');
}

async function publishAuto(req: PublishRequest): Promise<PublishResult> {
  if (!IG_USER_ID || !IG_TOKEN) {
    return { ok: false, mode: 'auto', error: 'INSTAGRAM_ACCOUNT_ID یا TOKEN تنظیم نشده' };
  }

  const caption = buildCaption(req);
  let containerId: string;

  if (req.kind === 'carousel' && req.mediaUrls.length > 1) {
    // مرحله ۱: برای هر تصویر یک کانتینر فرزند
    const children: string[] = [];
    for (const url of req.mediaUrls.slice(0, 10)) {
      const c = await graphPost(`${IG_USER_ID}/media`, {
        image_url: url,
        is_carousel_item: 'true',
      });
      children.push(c.id);
    }
    // مرحله ۲: کانتینر والد
    const parent = await graphPost(`${IG_USER_ID}/media`, {
      media_type: 'CAROUSEL',
      children: children.join(','),
      caption,
    });
    containerId = parent.id;
  } else if (req.kind === 'reel') {
    const c = await graphPost(`${IG_USER_ID}/media`, {
      media_type: 'REELS',
      video_url: req.mediaUrls[0],
      caption,
      share_to_feed: 'true',
    });
    containerId = c.id;
  } else if (req.kind === 'story') {
    const c = await graphPost(`${IG_USER_ID}/media`, {
      media_type: 'STORIES',
      image_url: req.mediaUrls[0],
    });
    containerId = c.id;
  } else {
    const c = await graphPost(`${IG_USER_ID}/media`, {
      image_url: req.mediaUrls[0],
      caption,
    });
    containerId = c.id;
  }

  // مرحله ۳: منتظر آماده شدن، سپس انتشار
  await waitForContainer(containerId);
  const published = await graphPost(`${IG_USER_ID}/media_publish`, {
    creation_id: containerId,
  });

  return {
    ok: true,
    mode: 'auto',
    id: published.id,
    url: `https://www.instagram.com/p/${published.id}/`,
  };
}

// ═══════════════════════════════════════════════════════════
//  حالت SEMI — آماده‌سازی کامل + تأیید یک‌لمسی در تلگرام
//  ⭐ این حالت از روز اول کار می‌کند و به متا وابسته نیست
// ═══════════════════════════════════════════════════════════

async function publishSemi(req: PublishRequest): Promise<PublishResult> {
  if (!TG_TOKEN || !TG_ADMIN) {
    return { ok: false, mode: 'semi', error: 'TELEGRAM_BOT_TOKEN یا ADMIN_TELEGRAM_CHAT_ID تنظیم نشده' };
  }

  const queueId = `ig_${req.refId ?? Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const caption = buildCaption(req);
  const kindFa: Record<PostKind, string> = {
    image: 'پست تکی',
    carousel: 'کاروسل',
    reel: 'ریلز',
    story: 'استوری',
  };

  // ۱) رسانه‌ها را بفرست تا مدیر با یک لمس ذخیره کند
  if (req.mediaUrls.length > 1) {
    const media = req.mediaUrls.slice(0, 10).map((url, i) => ({
      type: req.kind === 'reel' ? 'video' : 'photo',
      media: url,
      ...(i === 0 ? { caption: `📸 ${kindFa[req.kind]} — ${queueId}` } : {}),
    }));
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMediaGroup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_ADMIN, media }),
      signal: AbortSignal.timeout(60_000),
    });
  } else {
    const method = req.kind === 'reel' ? 'sendVideo' : 'sendPhoto';
    const key = req.kind === 'reel' ? 'video' : 'photo';
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_ADMIN,
        [key]: req.mediaUrls[0],
        caption: `📸 ${kindFa[req.kind]} — ${queueId}`,
      }),
      signal: AbortSignal.timeout(60_000),
    });
  }

  // ۲) کپشن را جدا و در بلوک کد بفرست — با یک لمس کپی می‌شود
  const instructions =
    `📋 <b>آماده انتشار در اینستاگرام</b>\n` +
    `نوع: ${kindFa[req.kind]}  |  کد: <code>${queueId}</code>\n\n` +
    `👇 روی متن زیر بزنید تا کپی شود:\n\n` +
    `<pre>${caption.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!))}</pre>\n\n` +
    `⏱ حدود ۲۰ ثانیه: تصویر را ذخیره کنید، کپشن را کپی کنید، در اینستاگرام پست کنید.`;

  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TG_ADMIN,
      text: instructions,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ منتشر کردم', callback_data: `ig_done:${queueId}` },
            { text: '⏭ رد کن', callback_data: `ig_skip:${queueId}` },
          ],
          [
            { text: '✏️ کپشن دیگر', callback_data: `ig_regen:${queueId}` },
          ],
        ],
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  return { ok: true, mode: 'semi', id: queueId, pending: true };
}

// ═══════════════════════════════════════════════════════════
//  نقطه ورود اصلی
// ═══════════════════════════════════════════════════════════

export async function publishToInstagram(req: PublishRequest): Promise<PublishResult> {
  if (MODE === 'off') {
    return { ok: false, mode: 'off', error: 'انتشار اینستاگرام غیرفعال است' };
  }

  try {
    if (MODE === 'auto') {
      try {
        return await publishAuto(req);
      } catch (e: any) {
        // ⭐ نکته مهم: اگر انتشار خودکار شکست خورد (توکن منقضی، محدودیت،
        //    تحریم)، به‌جای از دست دادن پست، به حالت نیمه‌خودکار برمی‌گردیم.
        console.error('[instagram] auto ناموفق، بازگشت به semi:', e.message);
        const fallback = await publishSemi(req);
        return { ...fallback, error: `auto ناموفق (${e.message}) — به semi منتقل شد` };
      }
    }
    return await publishSemi(req);
  } catch (e: any) {
    return { ok: false, mode: MODE, error: e.message };
  }
}

/** بررسی سلامت اتصال — برای /api/admin/integrations-test */
export async function checkInstagramHealth(): Promise<{
  mode: InstagramMode;
  ready: boolean;
  details: string;
}> {
  if (MODE === 'off') return { mode: MODE, ready: false, details: 'غیرفعال' };

  if (MODE === 'semi') {
    const ready = Boolean(TG_TOKEN && TG_ADMIN);
    return {
      mode: MODE,
      ready,
      details: ready
        ? 'حالت نیمه‌خودکار آماده است — پست‌ها به تلگرام مدیر می‌روند'
        : 'TELEGRAM_BOT_TOKEN یا ADMIN_TELEGRAM_CHAT_ID تنظیم نشده',
    };
  }

  if (!IG_USER_ID || !IG_TOKEN) {
    return { mode: MODE, ready: false, details: 'شناسه یا توکن اینستاگرام تنظیم نشده' };
  }
  try {
    const res = await fetch(
      `${GRAPH}/${IG_USER_ID}?fields=username,followers_count&access_token=${IG_TOKEN}`,
      { signal: AbortSignal.timeout(20_000) },
    );
    const j = await res.json();
    if (j.error) return { mode: MODE, ready: false, details: j.error.message };
    return { mode: MODE, ready: true, details: `متصل به @${j.username}` };
  } catch (e: any) {
    return { mode: MODE, ready: false, details: `اتصال ناموفق: ${e.message}` };
  }
}

export { DAILY_LIMIT };
