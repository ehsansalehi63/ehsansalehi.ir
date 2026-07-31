/**
 * ═══════════════════════════════════════════════════════════════
 *  تشخیص وضعیت هاست — نسخه Next.js
 *
 *  چرا این و نه diagnose.php؟
 *  سایت ehsansalehi.ir یک اپ Node.js/Next.js است، نه PHP. همه درخواست‌ها
 *  به server.js می‌روند، پس فایل PHP اصلاً اجرا نمی‌شود و ۴۰۴ می‌گیرد.
 *
 *  استفاده:
 *    curl "https://ehsansalehi.ir/api/admin/diagnose?key=CRON_SECRET"
 *  یا در مرورگر باز کنید.
 *
 *  امنیت: با CRON_SECRET محافظت می‌شود (همان متغیری که برای cron دارید).
 *  هیچ مقدار حساسی برنمی‌گرداند — فقط می‌گوید کدام متغیر «تنظیم شده» یا نه.
 * ═══════════════════════════════════════════════════════════════
 */
import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Probe = { name: string; ok: boolean; ms: number; status?: number; note?: string };

/** بررسی دسترسی به یک سرویس بیرونی با اندازه‌گیری تأخیر */
async function probe(name: string, url: string, timeoutMs = 12000): Promise<Probe> {
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
    const ms = Date.now() - t0;
    return {
      name,
      ok: res.status > 0 && res.status < 500,
      ms,
      status: res.status,
      note: ms > 5000 ? 'کند' : undefined,
    };
  } catch (e: any) {
    return {
      name,
      ok: false,
      ms: Date.now() - t0,
      note: e?.name === 'TimeoutError' ? 'timeout' : (e?.message || 'ناموفق').slice(0, 60),
    };
  }
}

/** سرعت واقعی دانلود از گیت‌هاب */
async function downloadSpeed(): Promise<{ kbps: number; note: string }> {
  const url = 'https://raw.githubusercontent.com/nodejs/node/main/README.md';
  const t0 = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(35000) });
    const buf = await res.arrayBuffer();
    const sec = (Date.now() - t0) / 1000;
    const kbps = Math.round(buf.byteLength / 1024 / Math.max(sec, 0.001));
    let note = 'خوب';
    if (kbps < 50) note = 'غیرقابل استفاده — معماری معکوس الزامی';
    else if (kbps < 500) note = 'کند — از روش tar.gz استفاده کنید';
    return { kbps, note };
  } catch (e: any) {
    return { kbps: 0, note: 'ناموفق: ' + (e?.message || '').slice(0, 50) };
  }
}

function dirInfo(p: string) {
  try {
    const st = fs.statSync(p);
    return { exists: true, isDir: st.isDirectory() };
  } catch {
    return { exists: false, isDir: false };
  }
}

/** فقط می‌گوید تنظیم شده یا نه — هرگز مقدار را برنمی‌گرداند */
const isSet = (v?: string) => Boolean(v && v.trim().length > 0);

export async function GET(request: NextRequest) {
  // ─── احراز هویت ───────────────────────────────────────
  const key = request.nextUrl.searchParams.get('key') || '';
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const secret = process.env.CRON_SECRET || process.env.DB_DIAGNOSTICS_SECRET || '';

  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        error: 'CRON_SECRET روی سرور تنظیم نشده است',
        hint: 'در cPanel → Node.js App → Environment Variables مقدار CRON_SECRET را اضافه کنید',
      },
      { status: 503 }
    );
  }
  if (key !== secret && bearer !== secret) {
    return NextResponse.json(
      {
        ok: false,
        error: 'کلید نامعتبر',
        hint: 'از مقدار CRON_SECRET استفاده کنید: /api/admin/diagnose?key=YOUR_CRON_SECRET',
        keyLengthReceived: key.length,
      },
      { status: 403 }
    );
  }

  const cwd = process.cwd();

  // ─── بررسی موازی شبکه ─────────────────────────────────
  const [net, speed] = await Promise.all([
    Promise.all([
      probe('github.com', 'https://github.com'),
      probe('raw.githubusercontent.com', 'https://raw.githubusercontent.com'),
      probe('registry.npmjs.org', 'https://registry.npmjs.org'),
      probe('npm mirror (Iran)', 'https://mirror-npm.runflare.com'),
      probe('graph.facebook.com', 'https://graph.facebook.com'),
      probe('api.telegram.org', 'https://api.telegram.org'),
      probe('agentrouter.org', 'https://agentrouter.org'),
      probe('api.openai.com', 'https://api.openai.com'),
    ]),
    downloadSpeed(),
  ]);

  // ─── فایل‌سیستم ───────────────────────────────────────
  let writable = false;
  try {
    const t = path.join(cwd, `.wtest-${Date.now()}`);
    fs.writeFileSync(t, 'x');
    fs.unlinkSync(t);
    writable = true;
  } catch {}

  // ─── جمع‌بندی و توصیه ─────────────────────────────────
  const ghOk = net.find((n) => n.name === 'github.com')?.ok ?? false;
  const metaOk = net.find((n) => n.name === 'graph.facebook.com')?.ok ?? false;
  const tgOk = net.find((n) => n.name === 'api.telegram.org')?.ok ?? false;
  const arOk = net.find((n) => n.name === 'agentrouter.org')?.ok ?? false;

  const recommendations: string[] = [];
  if (speed.kbps < 500) {
    recommendations.push(
      'گیت‌هاب کند است → هرگز روی این هاست git/npm اجرا نکنید؛ فقط tar.gz آماده دریافت کنید'
    );
  }
  if (!metaOk) {
    recommendations.push(
      'graph.facebook.com در دسترس نیست → INSTAGRAM_MODE=semi بگذارید تا پست‌ها به تلگرام مدیر بروند'
    );
  }
  if (!arOk) {
    recommendations.push(
      'agentrouter.org در دسترس نیست → موتور AI باید روی هاست خارجی (هاستینگر) اجرا شود'
    );
  }
  if (tgOk) {
    recommendations.push('تلگرام در دسترس است → کانال اصلی انتشار خودکار روی همین هاست کار می‌کند');
  }
  if (!writable) {
    recommendations.push('پوشه اپ قابل نوشتن نیست → دیپلوی خودکار مشکل خواهد داشت');
  }

  return NextResponse.json(
    {
      ok: true,
      generatedAt: new Date().toISOString(),

      server: {
        node: process.version,
        platform: `${process.platform} ${process.arch}`,
        hostname: os.hostname(),
        uptimeHours: +(os.uptime() / 3600).toFixed(1),
        appUptimeMin: +(process.uptime() / 60).toFixed(1),
      },

      resources: {
        cpuCores: os.cpus().length,
        loadAvg: os.loadavg().map((n) => +n.toFixed(2)),
        totalMemMB: Math.round(os.totalmem() / 1048576),
        freeMemMB: Math.round(os.freemem() / 1048576),
        processHeapMB: Math.round(process.memoryUsage().heapUsed / 1048576),
      },

      paths: {
        cwd,
        writable,
        hasNodeModules: dirInfo(path.join(cwd, 'node_modules')).exists,
        hasNextDir: dirInfo(path.join(cwd, '.next')).exists,
        hasPublic: dirInfo(path.join(cwd, 'public')).exists,
        hasTmpRestart: dirInfo(path.join(cwd, 'tmp')).exists,
        hasEnvFile: dirInfo(path.join(cwd, '.env')).exists,
      },

      network: net,
      githubDownload: { kbps: speed.kbps, verdict: speed.note },

      // فقط وضعیت تنظیم بودن — نه خود مقدار
      envConfigured: {
        database: isSet(process.env.MYSQL_HOST) || isSet(process.env.DATABASE_URL),
        cronSecret: isSet(process.env.CRON_SECRET),
        jwtSecret: isSet(process.env.JWT_SECRET),
        openai: isSet(process.env.OPENAI_API_KEY),
        openaiBaseUrl: process.env.OPENAI_BASE_URL || '(پیش‌فرض)',
        telegram: isSet(process.env.TELEGRAM_BOT_TOKEN) && isSet(process.env.TELEGRAM_CHANNEL_ID),
        adminTelegramChat: isSet(process.env.ADMIN_TELEGRAM_CHAT_ID),
        instagram: isSet(process.env.INSTAGRAM_ACCESS_TOKEN) || isSet(process.env.FB_PAGE_ACCESS_TOKEN),
        instagramMode: process.env.INSTAGRAM_MODE || '(تنظیم نشده — پیش‌فرض auto)',
        metaApiVersion: process.env.META_API_VERSION || '(پیش‌فرض v21.0)',
        bale: isSet(process.env.BALE_BOT_TOKEN),
        eitaa: isSet(process.env.EITAA_BOT_TOKEN),
        rubika: isSet(process.env.RUBIKA_BOT_TOKEN),
        linkedin: isSet(process.env.LINKEDIN_ACCESS_TOKEN),
      },

      summary: {
        githubUsable: ghOk && speed.kbps >= 500,
        metaReachable: metaOk,
        telegramReachable: tgOk,
        agentRouterReachable: arOk,
        deployStrategy:
          speed.kbps < 500
            ? 'tar.gz + استخراج روی سرور (معماری معکوس)'
            : 'هر روشی کار می‌کند',
        instagramStrategy: metaOk ? 'auto قابل استفاده است' : 'semi (ارسال به تلگرام مدیر)',
      },

      recommendations,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json; charset=utf-8',
      },
    }
  );
}
