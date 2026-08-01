/**
 * ═══════════════════════════════════════════════════════════════════════
 *  کلاینت رله — سمت سایت اصلی (میزبان‌فا)
 *
 *  کانال‌هایی که از IP ایران در دسترس نیستند (اینستاگرام، لینکدین، فیسبوک)
 *  را از طریق رله روی هاستینگر منتشر می‌کند.
 *
 *  اصل طراحی: اگر رله در دسترس نبود، سایت نباید بشکند.
 *  فراخوانی‌کننده تصمیم می‌گیرد که fallback کند (مثلاً ارسال به تلگرام مدیر).
 * ═══════════════════════════════════════════════════════════════════════
 */
import crypto from 'crypto';

const RELAY_URL = (process.env.RELAY_URL || '').replace(/\/+$/, '');
const RELAY_SECRET = process.env.RELAY_SECRET || '';
const RELAY_TIMEOUT = Number(process.env.RELAY_TIMEOUT_MS || 120000);

export type RelayChannel = 'instagram' | 'linkedin' | 'facebook';

export interface RelayPublishRequest {
  channel: RelayChannel;
  kind?: 'image' | 'carousel' | 'reel' | 'story';
  mediaUrls?: string[];
  caption?: string;
  link?: string;
}

export interface RelayResponse<T = any> {
  ok: boolean;
  result?: T;
  error?: string;
  ms?: number;
}

/** آیا رله پیکربندی شده است؟ */
export function isRelayConfigured(): boolean {
  return Boolean(RELAY_URL && RELAY_SECRET);
}

/**
 * فراخوانی امن رله با امضای HMAC.
 * امضا روی «timestamp|body» محاسبه می‌شود — همان فرمولی که سرور رله انتظار دارد.
 */
async function callRelay<T = any>(
  path: string,
  payload: Record<string, unknown>,
  timeoutMs = RELAY_TIMEOUT
): Promise<RelayResponse<T>> {
  if (!isRelayConfigured()) {
    return { ok: false, error: 'RELAY_URL یا RELAY_SECRET تنظیم نشده است' };
  }

  const body = JSON.stringify(payload);
  const ts = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac('sha256', RELAY_SECRET)
    .update(`${ts}|${body}`)
    .digest('hex');

  try {
    const res = await fetch(`${RELAY_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Relay-Timestamp': ts,
        'X-Relay-Signature': signature,
      },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, error: `پاسخ نامعتبر از رله (${res.status}): ${text.slice(0, 200)}` };
    }

    if (!res.ok || !data.ok) {
      return { ok: false, error: data?.error || `رله خطا داد (${res.status})` };
    }
    return { ok: true, result: data.result, ms: data.ms };
  } catch (e: any) {
    const isTimeout = e?.name === 'TimeoutError';
    return {
      ok: false,
      error: isTimeout
        ? `رله در ${timeoutMs / 1000} ثانیه پاسخ نداد`
        : `اتصال به رله ناموفق: ${e?.message || e}`,
    };
  }
}

/** انتشار در کانالی که از ایران در دسترس نیست */
export async function publishViaRelay(
  req: RelayPublishRequest
): Promise<RelayResponse<{ id: string; url?: string }>> {
  return callRelay('/publish', req as unknown as Record<string, unknown>);
}

/** دریافت محتوای تحریم‌شده (RSS، مقاله، تصویر) از طریق رله */
export async function fetchViaRelay(
  url: string,
  timeout = 30000
): Promise<RelayResponse<{ status: number; contentType: string; body: string }>> {
  return callRelay('/fetch', { url, timeout }, timeout + 15000);
}

/** پروکسی درخواست AI در صورتی که AgentRouter از ایران در دسترس نباشد */
export async function aiViaRelay(payload: Record<string, unknown>): Promise<RelayResponse> {
  return callRelay('/ai', { payload }, 150000);
}

/** تمدید توکن اینستاگرام — هر ۶۰ روز منقضی می‌شود، ماهانه صدا بزنید */
export async function refreshInstagramTokenViaRelay(): Promise<
  RelayResponse<{ accessToken: string; expiresInDays: number }>
> {
  return callRelay('/instagram/refresh-token', {}, 45000);
}

/** بررسی سلامت رله و دسترسی آن به سرویس‌های خارجی */
export async function diagnoseRelay(): Promise<RelayResponse> {
  return callRelay('/diagnose', {}, 60000);
}

/** بررسی سریع زنده بودن رله (بدون احراز هویت) */
export async function pingRelay(): Promise<{ alive: boolean; ms: number; detail?: string }> {
  if (!RELAY_URL) return { alive: false, ms: 0, detail: 'RELAY_URL تنظیم نشده' };
  const t0 = Date.now();
  try {
    const res = await fetch(`${RELAY_URL}/health`, { signal: AbortSignal.timeout(15000) });
    const data = await res.json();
    return { alive: Boolean(data?.ok), ms: Date.now() - t0, detail: data?.version };
  } catch (e: any) {
    return { alive: false, ms: Date.now() - t0, detail: e?.message?.slice(0, 80) };
  }
}
