/**
 * ═══════════════════════════════════════════════════════════════════════
 *  تست اتصال سایت به رله
 *
 *  با یک درخواست، کل زنجیره را بررسی می‌کند:
 *    میزبان‌فا  →  رله هاستینگر  →  AgentRouter / لینکدین / اینستاگرام
 *
 *  استفاده:
 *    https://ehsansalehi.ir/api/admin/relay-test?key=CRON_SECRET
 *
 *  هیچ پستی منتشر نمی‌کند و هیچ کلیدی را برنمی‌گرداند.
 * ═══════════════════════════════════════════════════════════════════════
 */
import { NextRequest, NextResponse } from 'next/server';
import { pingRelay, diagnoseRelay, isRelayConfigured } from '@/lib/relayClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Step = {
  step: string;
  ok: boolean;
  ms?: number;
  detail?: string;
  hint?: string;
};

/** فقط می‌گوید تنظیم شده یا نه — هرگز مقدار را برنمی‌گرداند */
const isSet = (v?: string) => Boolean(v && v.trim().length > 0);

export async function GET(request: NextRequest) {
  // ─── احراز هویت ───────────────────────────────────────
  const key = request.nextUrl.searchParams.get('key') || '';
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const secret = process.env.CRON_SECRET || '';

  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET روی سایت تنظیم نشده است' },
      { status: 503 },
    );
  }
  if (key !== secret && bearer !== secret) {
    return NextResponse.json(
      { ok: false, error: 'کلید نامعتبر — از مقدار CRON_SECRET استفاده کنید' },
      { status: 403 },
    );
  }

  const steps: Step[] = [];
  const relayUrl = process.env.RELAY_URL || '';
  const aiBase = process.env.OPENAI_BASE_URL || '';

  // ─── ۱) آیا متغیرها تنظیم شده‌اند؟ ────────────────────
  const configured = isRelayConfigured();
  steps.push({
    step: '۱. متغیرهای رله در سایت',
    ok: configured,
    detail: configured
      ? 'RELAY_URL و RELAY_SECRET تنظیم شده‌اند'
      : 'یکی از RELAY_URL یا RELAY_SECRET خالی است',
    hint: configured ? undefined : 'در cPanel → Node.js App → Environment Variables اضافه کنید',
  });

  // ─── ۲) آیا رله زنده است؟ ─────────────────────────────
  if (configured) {
    const ping = await pingRelay();
    steps.push({
      step: '۲. دسترسی سایت به رله',
      ok: ping.alive,
      ms: ping.ms,
      detail: ping.alive ? `رله پاسخ داد (نسخه ${ping.detail || '?'})` : ping.detail,
      hint: ping.alive ? undefined : 'آدرس RELAY_URL را در مرورگر باز کنید: ' + relayUrl + '/health',
    });

    // ─── ۳) آیا امضای HMAC پذیرفته می‌شود؟ ──────────────
    if (ping.alive) {
      const t0 = Date.now();
      const diag = await diagnoseRelay();
      steps.push({
        step: '۳. تأیید امضای HMAC',
        ok: diag.ok,
        ms: Date.now() - t0,
        detail: diag.ok ? 'امضا پذیرفته شد — کلیدها یکسان‌اند' : diag.error,
        hint: diag.ok
          ? undefined
          : 'RELAY_SECRET در سایت و relay_secret در relay-config.php باید دقیقاً یکی باشند',
      });

      // ─── ۴) رله به چه چیزی دسترسی دارد؟ ───────────────
      if (diag.ok && diag.result) {
        const r = diag.result as any;
        const reach: any[] = r.reachability || [];
        const find = (n: string) => reach.find((x) => x.name === n);

        for (const [label, host] of [
          ['۴. رله → AgentRouter', 'agentrouter.org'],
          ['۵. رله → لینکدین', 'api.linkedin.com'],
          ['۶. رله → اینستاگرام', 'graph.instagram.com'],
        ] as const) {
          const hit = find(host);
          steps.push({
            step: label,
            ok: Boolean(hit?.ok),
            ms: hit?.ms,
            detail: hit?.ok ? `در دسترس (${hit.status || 'OK'})` : hit?.error || 'بررسی نشد',
          });
        }

        // کلیدهای تنظیم‌شده روی رله
        const cfg = r.configured || {};
        steps.push({
          step: '۷. کلیدهای تنظیم‌شده روی رله',
          ok: Boolean(cfg.ai || cfg.linkedin || cfg.instagram),
          detail: [
            `AI: ${cfg.ai ? '✅' : '⬜'}`,
            `لینکدین: ${cfg.linkedin ? '✅' : '⬜'}`,
            `اینستاگرام: ${cfg.instagram ? '✅' : '⬜'}`,
          ].join('  '),
          hint: cfg.ai ? undefined : 'در relay-config.php روی هاستینگر پر کنید',
        });
      }
    }
  }

  // ─── ۸) تست واقعی هوش مصنوعی از مسیر رله ──────────────
  const aiViaRelay = aiBase.includes(relayUrl.replace(/^https?:\/\//, '')) && relayUrl !== '';
  if (aiViaRelay && isSet(process.env.OPENAI_API_KEY)) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${aiBase.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'claude-opus-5',
          messages: [{ role: 'user', content: 'فقط بنویس: OK' }],
          max_tokens: 16,
        }),
        signal: AbortSignal.timeout(90_000),
      });
      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content?.trim();
      const route = res.headers.get('x-relay-route') || '?';

      steps.push({
        step: '۸. تست واقعی AI از مسیر رله',
        ok: res.ok && Boolean(reply),
        ms: Date.now() - t0,
        detail: res.ok
          ? `پاسخ: «${reply}» | مدل: ${data?.model} | مسیر: ${route}`
          : data?.error?.message || `HTTP ${res.status}`,
        hint: res.ok
          ? undefined
          : 'OPENAI_API_KEY سایت باید همان ai_gateway_key رله باشد، نه کلید AgentRouter',
      });
    } catch (e: any) {
      steps.push({
        step: '۸. تست واقعی AI از مسیر رله',
        ok: false,
        ms: Date.now() - t0,
        detail: e?.message || String(e),
      });
    }
  } else {
    steps.push({
      step: '۸. تست واقعی AI از مسیر رله',
      ok: false,
      detail: aiBase
        ? `OPENAI_BASE_URL به رله اشاره نمی‌کند (فعلی: ${aiBase})`
        : 'OPENAI_BASE_URL تنظیم نشده',
      hint: `باید باشد: ${relayUrl || 'https://YOUR-RELAY'}/v1`,
    });
  }

  const passed = steps.filter((s) => s.ok).length;
  const allGreen = steps.every((s) => s.ok);

  return NextResponse.json(
    {
      ok: allGreen,
      summary: `${passed} از ${steps.length} مرحله موفق`,
      verdict: allGreen
        ? '🎉 همه‌چیز درست است — سایت و رله به هم وصل‌اند'
        : '⚠️ برخی مراحل ناموفق — به hint هر مرحله نگاه کنید',
      checkedAt: new Date().toISOString(),
      env: {
        relayUrl: relayUrl || '(تنظیم نشده)',
        openaiBaseUrl: aiBase || '(تنظیم نشده)',
        openaiModel: process.env.OPENAI_MODEL || '(پیش‌فرض)',
        instagramMode: process.env.INSTAGRAM_MODE || '(auto)',
        relaySecretSet: isSet(process.env.RELAY_SECRET),
        openaiKeySet: isSet(process.env.OPENAI_API_KEY),
      },
      steps,
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
