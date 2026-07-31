/**
 * ═══════════════════════════════════════════════════════════════════════
 *  رله انتشار شبکه‌های اجتماعی
 *
 *  روی هاستینگر (خارج از ایران) اجرا می‌شود و به‌عنوان واسط برای سرویس‌هایی
 *  عمل می‌کند که از IP ایران در دسترس نیستند: اینستاگرام، لینکدین، متا، برخی RSS.
 *
 *  اصول طراحی:
 *    • بدون هیچ dependency — فقط ماژول‌های داخلی Node
 *      (چون npm install روی هاست‌های تحریم‌شده دردسر دارد)
 *    • بدون دیتابیس، بدون داده مشتری — فقط عبوردهنده
 *    • احراز هویت با HMAC + timestamp (ضد replay)
 *    • اگر از دسترس خارج شود، سایت اصلی دست‌نخورده کار می‌کند
 *
 *  اجرا:
 *    node server.js
 *  یا در hPanel → Node.js App، فایل شروع را server.js بگذارید.
 * ═══════════════════════════════════════════════════════════════════════
 */
'use strict';

const http = require('http');
const crypto = require('crypto');
const { URL } = require('url');

// ─── تنظیمات ─────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT || 3001);
const SECRET = process.env.RELAY_SECRET || '';
const SIG_WINDOW_SEC = Number(process.env.RELAY_SIG_WINDOW || 300); // ۵ دقیقه
const MAX_BODY = 2 * 1024 * 1024; // ۲ مگابایت
const LOG_KEEP = 200;

const META_VER = process.env.META_API_VERSION || 'v21.0';
const IG_GRAPH = 'https://graph.instagram.com';        // مسیر Creator (بدون فیسبوک)
const FB_GRAPH = `https://graph.facebook.com/${META_VER}`;

// اعتبارنامه‌ها — همه اختیاری؛ هر کانالی که تنظیم نشده، غیرفعال می‌ماند
const CFG = {
  igToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
  igUserId: process.env.INSTAGRAM_USER_ID || process.env.INSTAGRAM_ACCOUNT_ID || '',
  liToken: process.env.LINKEDIN_ACCESS_TOKEN || '',
  liAuthor: process.env.LINKEDIN_AUTHOR_URN || '',
  fbToken: process.env.FB_PAGE_ACCESS_TOKEN || '',
  fbPageId: process.env.FB_PAGE_ID || '',
  aiKey: process.env.OPENAI_API_KEY || '',
  aiBase: (process.env.OPENAI_BASE_URL || 'https://agentrouter.org/v1').replace(/\/+$/, ''),
};

// ─── لاگ حلقوی در حافظه (بدون فایل، بدون دیتابیس) ────────────────────
const logs = [];
function log(level, msg, extra) {
  const entry = { t: new Date().toISOString(), level, msg, ...(extra || {}) };
  logs.push(entry);
  if (logs.length > LOG_KEEP) logs.shift();
  const line = `[${entry.t}] ${level.toUpperCase()} ${msg}`;
  if (level === 'error') console.error(line, extra || '');
  else console.log(line, extra || '');
}

// ─── ابزار ───────────────────────────────────────────────────────────
function json(res, status, obj) {
  const body = JSON.stringify(obj, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Relay': 'social-relay/1.0',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('حجم درخواست بیش از حد مجاز'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** مقایسه امن رشته‌ها — جلوگیری از timing attack */
function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * احراز هویت: امضای HMAC روی «timestamp|body»
 * سایت اصلی همین امضا را با همان SECRET می‌سازد.
 */
function verifySignature(req, rawBody) {
  if (!SECRET) return { ok: false, error: 'RELAY_SECRET روی رله تنظیم نشده' };

  const ts = req.headers['x-relay-timestamp'];
  const sig = req.headers['x-relay-signature'];
  if (!ts || !sig) return { ok: false, error: 'هدر امضا یا timestamp موجود نیست' };

  const drift = Math.abs(Math.floor(Date.now() / 1000) - Number(ts));
  if (!Number.isFinite(drift) || drift > SIG_WINDOW_SEC) {
    return { ok: false, error: `timestamp منقضی یا نامعتبر (اختلاف ${drift}s)` };
  }

  const expected = crypto.createHmac('sha256', SECRET).update(`${ts}|${rawBody}`).digest('hex');
  if (!safeEqual(expected, sig)) return { ok: false, error: 'امضای نامعتبر' };
  return { ok: true };
}

/** fetch با timeout و تلاش مجدد برای خطاهای گذرا */
async function httpJson(url, options = {}, { timeout = 45000, retries = 1 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...options, signal: AbortSignal.timeout(timeout) });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 500) }; }
      // فقط خطاهای سرور را دوباره تلاش کن
      if (res.status >= 500 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      lastErr = e;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastErr || new Error('درخواست ناموفق');
}

// ═════════════════════════════════════════════════════════════════════
//  اینستاگرام
// ═════════════════════════════════════════════════════════════════════

/**
 * متا کانتینر رسانه را غیرهمزمان پردازش می‌کند.
 * انتشار قبل از رسیدن به FINISHED تقریباً همیشه شکست می‌خورد.
 */
async function waitForContainer(containerId, token, { maxTries = 30, delayMs = 3000 } = {}) {
  for (let i = 0; i < maxTries; i++) {
    await new Promise((r) => setTimeout(r, delayMs));
    try {
      const u = `${IG_GRAPH}/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(token)}`;
      const { data } = await httpJson(u, {}, { timeout: 20000, retries: 0 });
      if (data.status_code === 'FINISHED') return { ready: true, tries: i + 1 };
      if (data.status_code === 'ERROR' || data.status_code === 'EXPIRED') {
        return { ready: false, error: data.status || data.status_code };
      }
    } catch {
      // خطای گذرای شبکه — ادامه بده
    }
  }
  return { ready: false, error: 'کانتینر در زمان مجاز آماده نشد' };
}

async function publishInstagram(p) {
  const token = p.token || CFG.igToken;
  const userId = p.userId || CFG.igUserId;
  if (!token || !userId) throw new Error('توکن یا شناسه اینستاگرام تنظیم نشده');

  const media = Array.isArray(p.mediaUrls) ? p.mediaUrls.filter(Boolean) : [];
  if (!media.length) throw new Error('حداقل یک آدرس رسانه لازم است');

  const kind = p.kind || (media.length > 1 ? 'carousel' : 'image');
  const caption = p.caption || '';
  let containerId;

  if (kind === 'carousel' && media.length > 1) {
    // کاروسل: برای هر تصویر یک کانتینر فرزند، سپس یک والد
    const children = [];
    for (const url of media.slice(0, 10)) {
      const r = await httpJson(`${IG_GRAPH}/${userId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ image_url: url, is_carousel_item: 'true', access_token: token }),
      });
      if (!r.ok || !r.data.id) throw new Error(`کانتینر فرزند: ${r.data?.error?.message || r.status}`);
      children.push(r.data.id);
    }
    const parent = await httpJson(`${IG_GRAPH}/${userId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        media_type: 'CAROUSEL', children: children.join(','), caption, access_token: token,
      }),
    });
    if (!parent.ok || !parent.data.id) throw new Error(`کانتینر والد: ${parent.data?.error?.message}`);
    containerId = parent.data.id;
  } else {
    const params = { access_token: token };
    if (kind === 'reel') {
      params.media_type = 'REELS';
      params.video_url = media[0];
      params.caption = caption;
      params.share_to_feed = 'true';
    } else if (kind === 'story') {
      params.media_type = 'STORIES';
      params.image_url = media[0];
    } else {
      params.image_url = media[0];
      params.caption = caption;
    }
    const r = await httpJson(`${IG_GRAPH}/${userId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params),
    });
    if (!r.ok || !r.data.id) throw new Error(`ساخت کانتینر: ${r.data?.error?.message || r.status}`);
    containerId = r.data.id;
  }

  // ویدئو زمان بیشتری برای پردازش می‌خواهد
  const wait = await waitForContainer(containerId, token, {
    maxTries: kind === 'reel' ? 40 : 20,
    delayMs: kind === 'reel' ? 5000 : 3000,
  });
  if (!wait.ready) throw new Error(`کانتینر آماده نشد: ${wait.error}`);

  const pub = await httpJson(`${IG_GRAPH}/${userId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ creation_id: containerId, access_token: token }),
  });
  if (!pub.ok || !pub.data.id) throw new Error(`انتشار: ${pub.data?.error?.message || pub.status}`);

  return { id: pub.data.id, url: `https://www.instagram.com/p/${pub.data.id}/`, kind };
}

/** توکن بلندمدت اینستاگرام هر ۶۰ روز منقضی می‌شود — این را ماهانه صدا بزنید */
async function refreshInstagramToken(token) {
  const t = token || CFG.igToken;
  if (!t) throw new Error('توکنی برای تمدید وجود ندارد');
  const u = `${IG_GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(t)}`;
  const { ok, data } = await httpJson(u, {}, { timeout: 30000 });
  if (!ok || !data.access_token) throw new Error(data?.error?.message || 'تمدید ناموفق');
  return {
    accessToken: data.access_token,
    expiresInDays: Math.round((data.expires_in || 0) / 86400),
    warning: 'توکن جدید را در متغیرهای محیطی جایگزین کنید',
  };
}

// ═════════════════════════════════════════════════════════════════════
//  لینکدین  (از ایران timeout می‌خورد — دلیل اصلی وجود این رله)
// ═════════════════════════════════════════════════════════════════════

async function publishLinkedIn(p) {
  const token = p.token || CFG.liToken;
  if (!token) throw new Error('توکن لینکدین تنظیم نشده');

  let author = p.author || CFG.liAuthor;
  if (!author) {
    const me = await httpJson('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!me.ok || !me.data.sub) throw new Error('شناسه نویسنده لینکدین یافت نشد');
    author = `urn:li:person:${me.data.sub}`;
  }

  const text = [p.caption, p.link].filter(Boolean).join('\n\n');
  const payload = {
    author,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: p.link ? 'ARTICLE' : 'NONE',
        ...(p.link ? { media: [{ status: 'READY', originalUrl: p.link }] } : {}),
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  };

  const r = await httpJson('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`لینکدین: ${r.data?.message || r.status}`);
  return { id: r.data.id || 'ok' };
}

// ═════════════════════════════════════════════════════════════════════
//  فیسبوک
// ═════════════════════════════════════════════════════════════════════

async function publishFacebook(p) {
  const token = p.token || CFG.fbToken;
  const pageId = p.pageId || CFG.fbPageId;
  if (!token || !pageId) throw new Error('توکن یا شناسه صفحه فیسبوک تنظیم نشده');

  const image = (p.mediaUrls || [])[0];
  const message = [p.caption, p.link].filter(Boolean).join('\n\n');
  const endpoint = image ? `${FB_GRAPH}/${pageId}/photos` : `${FB_GRAPH}/${pageId}/feed`;
  const body = image
    ? { url: image, caption: message, access_token: token }
    : { message, ...(p.link ? { link: p.link } : {}), access_token: token };

  const r = await httpJson(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  if (!r.ok) throw new Error(`فیسبوک: ${r.data?.error?.message || r.status}`);
  return { id: r.data.id || r.data.post_id };
}

// ═════════════════════════════════════════════════════════════════════
//  دریافت محتوای تحریم‌شده (RSS و غیره)
// ═════════════════════════════════════════════════════════════════════

async function fetchExternal(p) {
  if (!p.url) throw new Error('آدرس لازم است');
  let target;
  try { target = new URL(p.url); } catch { throw new Error('آدرس نامعتبر'); }
  if (!['http:', 'https:'].includes(target.protocol)) throw new Error('فقط http/https مجاز است');

  // جلوگیری از SSRF به شبکه داخلی
  const host = target.hostname.toLowerCase();
  const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1', 'metadata.google.internal'];
  if (blocked.includes(host) || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(host)) {
    throw new Error('دسترسی به شبکه داخلی مجاز نیست');
  }

  const res = await fetch(target.toString(), {
    headers: { 'User-Agent': p.userAgent || 'Mozilla/5.0 (compatible; SocialRelay/1.0)' },
    signal: AbortSignal.timeout(p.timeout || 30000),
  });
  const text = await res.text();
  if (text.length > MAX_BODY) throw new Error('پاسخ بیش از حد بزرگ است');
  return {
    status: res.status,
    contentType: res.headers.get('content-type') || '',
    length: text.length,
    body: text,
  };
}

// ═════════════════════════════════════════════════════════════════════
//  پروکسی AgentRouter (اگر از ایران در دسترس نبود)
// ═════════════════════════════════════════════════════════════════════

async function proxyAI(p) {
  const key = p.apiKey || CFG.aiKey;
  if (!key) throw new Error('کلید AI تنظیم نشده');
  const base = p.baseUrl || CFG.aiBase;
  const r = await httpJson(`${base}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(p.payload || {}),
  }, { timeout: 120000, retries: 0 });
  if (!r.ok) throw new Error(`AI: ${r.data?.error?.message || r.status}`);
  return r.data;
}

/**
 * ───────────────────────────────────────────────────────────────────
 *  پروکسی شفاف OpenAI-compatible
 *
 *  چرا؟ AgentRouter از IP ایران در دسترس نیست. به‌جای تغییر کد سایت،
 *  رله را طوری می‌سازیم که *دقیقاً* مثل یک endpoint استاندارد OpenAI
 *  رفتار کند. آنگاه در سایت فقط کافی است:
 *
 *      OPENAI_BASE_URL=https://relay.example.com/v1
 *
 *  و پکیج openai بدون هیچ تغییری از رله استفاده می‌کند.
 *
 *  ⚠️ این مسیر با کلید خودِ سایت (Bearer) احراز هویت می‌شود، نه HMAC —
 *     چون پکیج openai نمی‌تواند امضای HMAC بسازد.
 * ───────────────────────────────────────────────────────────────────
 */
async function openaiPassthrough(req, res, subPath, rawBody) {
  // کلید از هدر Authorization سایت می‌آید؛ اگر نبود از env رله
  const authHeader = req.headers['authorization'] || '';
  const incomingKey = authHeader.replace(/^Bearer\s+/i, '').trim();

  // دروازه امنیتی: کلید ورودی باید با AI_GATEWAY_KEY یا کلید واقعی یکی باشد
  const gateKey = process.env.AI_GATEWAY_KEY || '';
  if (gateKey) {
    if (!incomingKey || !safeEqual(incomingKey, gateKey)) {
      json(res, 401, { error: { message: 'کلید دروازه AI نامعتبر است', type: 'invalid_request_error' } });
      return;
    }
  } else if (!incomingKey) {
    json(res, 401, { error: { message: 'هدر Authorization لازم است', type: 'invalid_request_error' } });
    return;
  }

  // کلید واقعی upstream: همیشه از env رله (کلید سایت هرگز به بیرون نمی‌رود)
  const upstreamKey = CFG.aiKey || incomingKey;
  if (!upstreamKey) {
    json(res, 500, { error: { message: 'OPENAI_API_KEY روی رله تنظیم نشده', type: 'server_error' } });
    return;
  }

  const target = `${CFG.aiBase}${subPath}`;
  const t0 = Date.now();

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${upstreamKey}`,
        'Content-Type': 'application/json',
        Accept: req.headers['accept'] || 'application/json',
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : (rawBody || undefined),
      signal: AbortSignal.timeout(180000),
    });

    const text = await upstream.text();
    const ms = Date.now() - t0;

    if (upstream.ok) {
      log('info', 'AI پروکسی شد', { path: subPath, ms });
    } else {
      log('warn', 'AI خطا داد', { path: subPath, status: upstream.status, ms });
    }

    // پاسخ را بدون دستکاری برگردان تا پکیج openai آن را بشناسد
    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
      'X-Relay-Upstream-Ms': String(ms),
    });
    res.end(text);
  } catch (e) {
    const msg = e?.message || String(e);
    log('error', 'AI پروکسی ناموفق', { path: subPath, error: msg });
    json(res, 502, {
      error: { message: `رله نتوانست به AI وصل شود: ${msg}`, type: 'upstream_error' },
    });
  }
}

// ═════════════════════════════════════════════════════════════════════
//  تشخیص وضعیت رله
// ═════════════════════════════════════════════════════════════════════

async function diagnose() {
  const probe = async (name, url) => {
    const t0 = Date.now();
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(12000) });
      return { name, ok: res.status < 500, status: res.status, ms: Date.now() - t0 };
    } catch (e) {
      return { name, ok: false, ms: Date.now() - t0, error: (e.message || '').slice(0, 60) };
    }
  };
  const targets = await Promise.all([
    probe('graph.instagram.com', 'https://graph.instagram.com'),
    probe('graph.facebook.com', 'https://graph.facebook.com'),
    probe('api.linkedin.com', 'https://api.linkedin.com'),
    probe('agentrouter.org', 'https://agentrouter.org'),
    probe('coindesk.com', 'https://www.coindesk.com'),
    probe('venturebeat.com', 'https://venturebeat.com'),
    probe('api.pinterest.com', 'https://api.pinterest.com'),
  ]);
  return {
    node: process.version,
    uptimeMin: +(process.uptime() / 60).toFixed(1),
    configured: {
      instagram: Boolean(CFG.igToken && CFG.igUserId),
      linkedin: Boolean(CFG.liToken),
      facebook: Boolean(CFG.fbToken && CFG.fbPageId),
      ai: Boolean(CFG.aiKey),
      secret: Boolean(SECRET),
    },
    reachability: targets,
  };
}

// ═════════════════════════════════════════════════════════════════════
//  مسیریابی
// ═════════════════════════════════════════════════════════════════════

const CHANNELS = {
  instagram: publishInstagram,
  linkedin: publishLinkedIn,
  facebook: publishFacebook,
};

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  // سلامت — بدون احراز هویت تا مانیتورینگ ساده باشد
  if (path === '/health' || path === '/') {
    return json(res, 200, {
      ok: true,
      service: 'social-relay',
      version: '1.0',
      time: new Date().toISOString(),
      uptimeMin: +(process.uptime() / 60).toFixed(1),
      secretConfigured: Boolean(SECRET),
      aiGateway: {
        enabled: Boolean(CFG.aiKey),
        upstream: CFG.aiBase,
        gateKeySet: Boolean(process.env.AI_GATEWAY_KEY),
      },
    });
  }

  // ── پروکسی شفاف OpenAI: /v1/... ────────────────────────────
  // این مسیر HMAC نمی‌خواهد چون پکیج openai نمی‌تواند امضا بسازد.
  // به‌جایش با AI_GATEWAY_KEY محافظت می‌شود.
  if (path.startsWith('/v1/')) {
    let raw = '';
    if (!['GET', 'HEAD'].includes(req.method)) {
      try {
        raw = await readBody(req);
      } catch (e) {
        return json(res, 413, { error: { message: e.message, type: 'invalid_request_error' } });
      }
    }
    return openaiPassthrough(req, res, path, raw);
  }

  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, error: 'فقط POST مجاز است' });
  }

  let raw;
  try {
    raw = await readBody(req);
  } catch (e) {
    return json(res, 413, { ok: false, error: e.message });
  }

  const auth = verifySignature(req, raw);
  if (!auth.ok) {
    log('warn', 'احراز هویت ناموفق', { path, reason: auth.error });
    return json(res, 403, { ok: false, error: auth.error });
  }

  let body = {};
  if (raw) {
    try { body = JSON.parse(raw); } catch { return json(res, 400, { ok: false, error: 'JSON نامعتبر' }); }
  }

  const started = Date.now();
  try {
    switch (path) {
      case '/publish': {
        const channel = String(body.channel || '').toLowerCase();
        const fn = CHANNELS[channel];
        if (!fn) {
          return json(res, 400, {
            ok: false,
            error: `کانال ناشناخته: ${channel}`,
            supported: Object.keys(CHANNELS),
          });
        }
        const result = await fn(body);
        log('info', 'انتشار موفق', { channel, ms: Date.now() - started });
        return json(res, 200, { ok: true, channel, result, ms: Date.now() - started });
      }

      case '/fetch': {
        const result = await fetchExternal(body);
        return json(res, 200, { ok: true, result, ms: Date.now() - started });
      }

      case '/ai': {
        const result = await proxyAI(body);
        return json(res, 200, { ok: true, result, ms: Date.now() - started });
      }

      case '/instagram/refresh-token': {
        const result = await refreshInstagramToken(body.token);
        log('info', 'توکن اینستاگرام تمدید شد', { days: result.expiresInDays });
        return json(res, 200, { ok: true, result });
      }

      case '/diagnose':
        return json(res, 200, { ok: true, result: await diagnose() });

      case '/logs':
        return json(res, 200, { ok: true, count: logs.length, logs: logs.slice(-50) });

      default:
        return json(res, 404, {
          ok: false,
          error: 'مسیر یافت نشد',
          available: ['/health', '/v1/chat/completions (OpenAI-compatible)', '/publish', '/fetch', '/ai', '/instagram/refresh-token', '/diagnose', '/logs'],
        });
    }
  } catch (e) {
    const msg = e?.message || String(e);
    log('error', `خطا در ${path}`, { error: msg });
    return json(res, 502, { ok: false, error: msg, ms: Date.now() - started });
  }
}

// ─── راه‌اندازی ──────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  handle(req, res).catch((e) => {
    log('error', 'خطای پیش‌بینی‌نشده', { error: e?.message });
    if (!res.headersSent) json(res, 500, { ok: false, error: 'خطای داخلی رله' });
  });
});

server.headersTimeout = 190000;
server.requestTimeout = 180000;

server.listen(PORT, () => {
  log('info', `رله روی پورت ${PORT} فعال شد`);
  if (!SECRET) {
    log('error', '⚠️  RELAY_SECRET تنظیم نشده — همه درخواست‌ها رد می‌شوند!');
  }
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('unhandledRejection', (e) => log('error', 'promise رد شد', { error: String(e) }));
