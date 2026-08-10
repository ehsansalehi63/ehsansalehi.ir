import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, verifyCron } from '../../../lib/auth';
import { pool } from '../../../lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 120;

type TestResult = {
  configured: boolean;
  ok: boolean;
  status?: number | string;
  message: string;
  detail?: unknown;
};

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Surrogate-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0',
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

function timeoutSignal(ms = 10000) {
  return AbortSignal.timeout(ms);
}

async function getAutomationSettings(): Promise<Record<string, string>> {
  try {
    await pool.execute(`CREATE TABLE IF NOT EXISTS automation_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

    const [rows] = await pool.execute('SELECT setting_key, setting_value FROM automation_settings');
    const settings: Record<string, string> = {};
    for (const row of rows as any[]) settings[row.setting_key] = row.setting_value || '';
    return settings;
  } catch {
    return {};
  }
}

function pick(settings: Record<string, string>, envNames: string[], settingNames: string[] = []): string {
  for (const name of envNames) {
    const value = process.env[name];
    if (value) return value;
  }
  for (const name of settingNames) {
    const value = settings[name];
    if (value) return value;
  }
  return '';
}

function notConfigured(label: string): TestResult {
  return { configured: false, ok: false, status: 'not-configured', message: `${label} تنظیم نشده است.` };
}

async function safeJson(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text.slice(0, 500);
  }
}

function summarizeApiResponse(data: any) {
  if (!data || typeof data !== 'object') return undefined;
  const summary: Record<string, unknown> = {};
  for (const key of ['ok', 'success', 'status', 'id', 'name', 'username', 'sub', 'localizedFirstName', 'localizedLastName', 'display_phone_number', 'verified_name']) {
    if (data[key] !== undefined) summary[key] = data[key];
  }
  if (data.error) summary.error = typeof data.error === 'object' ? (data.error.message || data.error.description || data.error.code || 'error') : data.error;
  if (data.description) summary.description = data.description;
  return Object.keys(summary).length ? summary : undefined;
}

async function getJson(url: string, init: RequestInit = {}, ms = 10000): Promise<{ response: Response; data: any }> {
  const response = await fetch(url, { ...init, signal: timeoutSignal(ms) });
  const data = await safeJson(response);
  return { response, data };
}

async function testDatabase(): Promise<TestResult> {
  try {
    const [rows] = await pool.execute('SELECT 1 AS ok, NOW() AS server_time');
    return { configured: true, ok: true, status: 'ok', message: 'اتصال MySQL سالم است.', detail: (rows as any[])[0] };
  } catch (error: any) {
    return { configured: true, ok: false, status: error?.code || 'error', message: 'اتصال MySQL ناموفق است.', detail: error?.message };
  }
}

async function testOpenAI(settings: Record<string, string>): Promise<TestResult> {
  const apiKey = pick(settings, ['OPENAI_API_KEY'], ['openai_api_key']).trim();
  if (!apiKey || apiKey.includes('placeholder')) return notConfigured('OPENAI_API_KEY');

  const baseURL = (pick(settings, ['OPENAI_BASE_URL'], ['openai_base_url']) || 'https://api.gapgpt.app/v1').replace(/\/+$/, '');
  const model = pick(settings, ['OPENAI_MODEL'], ['openai_model']) || 'gpt-4o-mini';

  try {
    const { response, data } = await getJson(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'فقط کلمه OK را برگردان.' }],
        max_tokens: 5,
        temperature: 0,
      }),
    }, 15000);

    const content = data?.choices?.[0]?.message?.content || '';
    return {
      configured: true,
      ok: response.ok && Boolean(content),
      status: response.status,
      message: response.ok ? 'اتصال API هوش مصنوعی سالم است.' : 'API هوش مصنوعی پاسخ خطا داد.',
      detail: response.ok ? { model, sample: String(content).slice(0, 20) } : summarizeApiResponse(data),
    };
  } catch (error: any) {
    return { configured: true, ok: false, status: 'exception', message: 'تست API هوش مصنوعی ناموفق شد.', detail: error?.message || String(error) };
  }
}

async function testTelegram(settings: Record<string, string>): Promise<TestResult> {
  const token = pick(settings, ['TELEGRAM_BOT_TOKEN'], ['telegram_bot_token']);
  if (!token) return notConfigured('Telegram');
  try {
    const { response, data } = await getJson(`https://api.telegram.org/bot${token}/getMe`);
    return { configured: true, ok: response.ok && data?.ok === true, status: response.status, message: response.ok && data?.ok ? 'بات تلگرام سالم است.' : 'تلگرام خطا داد.', detail: summarizeApiResponse(data) };
  } catch (error: any) {
    return { configured: true, ok: false, status: 'exception', message: 'تست تلگرام ناموفق شد.', detail: error?.message || String(error) };
  }
}

async function testLinkedIn(settings: Record<string, string>): Promise<TestResult> {
  const token = pick(settings, ['LINKEDIN_ACCESS_TOKEN'], ['linkedin_access_token']);
  if (!token) return notConfigured('LinkedIn');
  try {
    const { response, data } = await getJson('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { configured: true, ok: response.ok, status: response.status, message: response.ok ? 'توکن لینکدین سالم است.' : 'لینکدین خطا داد.', detail: summarizeApiResponse(data) };
  } catch (error: any) {
    return { configured: true, ok: false, status: 'exception', message: 'تست لینکدین ناموفق شد.', detail: error?.message || String(error) };
  }
}

async function testBale(settings: Record<string, string>): Promise<TestResult> {
  const token = pick(settings, ['BALE_BOT_TOKEN'], ['bale_bot_token', 'bale_token']);
  if (!token) return notConfigured('Bale');
  const domains = ['https://tapi.bale.ai', 'https://api.bale.ai', 'https://tumbleweed.bale.ai'];
  let last: TestResult | null = null;
  for (const domain of domains) {
    try {
      const { response, data } = await getJson(`${domain}/bot${token}/getMe`, {}, 7000);
      last = { configured: true, ok: response.ok && Boolean(data?.ok || data?.success || data?.result), status: response.status, message: response.ok ? 'بات بله سالم است.' : 'بله خطا داد.', detail: { domain, ...summarizeApiResponse(data) } };
      if (last.ok) return last;
    } catch (error: any) {
      last = { configured: true, ok: false, status: 'exception', message: 'تست بله ناموفق شد.', detail: { domain, error: error?.message || String(error) } };
    }
  }
  return last || notConfigured('Bale');
}

async function testEitaa(settings: Record<string, string>): Promise<TestResult> {
  const token = pick(settings, ['EITAA_BOT_TOKEN'], ['eitaa_bot_token', 'eitaa_token']);
  if (!token) return notConfigured('Eitaa');
  try {
    const { response, data } = await getJson(`https://eitaayar.ir/api/${token}/getMe`, {}, 7000);
    return { configured: true, ok: response.ok && Boolean(data?.ok || data?.success || data?.result), status: response.status, message: response.ok ? 'بات ایتا پاسخ داد.' : 'ایتا خطا داد.', detail: summarizeApiResponse(data) };
  } catch (error: any) {
    return { configured: true, ok: false, status: 'exception', message: 'تست ایتا ناموفق شد.', detail: error?.message || String(error) };
  }
}

async function testRubika(settings: Record<string, string>): Promise<TestResult> {
  const token = pick(settings, ['RUBIKA_BOT_TOKEN'], ['rubika_bot_token', 'rubika_token']);
  if (!token) return notConfigured('Rubika');
  try {
    const { response, data } = await getJson(`https://botapi.rubika.ir/v3/${token}/getMe`, {}, 7000);
    return { configured: true, ok: response.ok && Boolean(data?.ok || data?.status === 'OK' || data?.data), status: response.status, message: response.ok ? 'بات روبیکا پاسخ داد.' : 'روبیکا خطا داد.', detail: summarizeApiResponse(data) };
  } catch (error: any) {
    return { configured: true, ok: false, status: 'exception', message: 'تست روبیکا ناموفق شد.', detail: error?.message || String(error) };
  }
}

async function testFacebook(settings: Record<string, string>): Promise<TestResult> {
  const token = pick(settings, ['FB_PAGE_ACCESS_TOKEN'], ['fb_access_token']);
  const pageId = pick(settings, ['FB_PAGE_ID'], ['fb_page_id']);
  if (!token || !pageId) return notConfigured('Facebook Page');
  try {
    const { response, data } = await getJson(`https://graph.facebook.com/v19.0/${pageId}?fields=id,name&access_token=${encodeURIComponent(token)}`, {}, 10000);
    return { configured: true, ok: response.ok && Boolean(data?.id), status: response.status, message: response.ok ? 'اتصال فیس‌بوک سالم است.' : 'فیس‌بوک خطا داد.', detail: summarizeApiResponse(data) };
  } catch (error: any) {
    return { configured: true, ok: false, status: 'exception', message: 'تست فیس‌بوک ناموفق شد.', detail: error?.message || String(error) };
  }
}

async function testInstagram(settings: Record<string, string>): Promise<TestResult> {
  const token = pick(settings, ['INSTAGRAM_ACCESS_TOKEN', 'FB_PAGE_ACCESS_TOKEN'], ['instagram_access_token', 'fb_access_token']);
  const accountId = pick(settings, ['INSTAGRAM_ACCOUNT_ID'], ['instagram_account_id']);
  if (!token || !accountId) return notConfigured('Instagram');
  try {
    const { response, data } = await getJson(`https://graph.facebook.com/v19.0/${accountId}?fields=id,username&access_token=${encodeURIComponent(token)}`, {}, 10000);
    return { configured: true, ok: response.ok && Boolean(data?.id), status: response.status, message: response.ok ? 'اتصال اینستاگرام سالم است.' : 'اینستاگرام خطا داد.', detail: summarizeApiResponse(data) };
  } catch (error: any) {
    return { configured: true, ok: false, status: 'exception', message: 'تست اینستاگرام ناموفق شد.', detail: error?.message || String(error) };
  }
}

async function testWhatsApp(settings: Record<string, string>): Promise<TestResult> {
  const callMeBot = pick(settings, ['CALLMEBOT_API_KEY'], ['callmebot_key']);
  const greenInstance = pick(settings, ['GREEN_API_INSTANCE_ID'], ['green_api_instance']);
  const greenToken = pick(settings, ['GREEN_API_TOKEN'], ['green_api_token']);
  const cloudToken = pick(settings, ['WHATSAPP_ACCESS_TOKEN'], ['whatsapp_access_token']);
  const phoneNumberId = pick(settings, ['WHATSAPP_PHONE_NUMBER_ID'], ['whatsapp_phone_number_id']);

  if (greenInstance && greenToken) {
    try {
      const { response, data } = await getJson(`https://api.green-api.com/waInstance${greenInstance}/getStateInstance/${greenToken}`, {}, 10000);
      return { configured: true, ok: response.ok && Boolean(data?.stateInstance), status: response.status, message: response.ok ? 'Green API واتساپ پاسخ داد.' : 'Green API خطا داد.', detail: summarizeApiResponse(data) || data };
    } catch (error: any) {
      return { configured: true, ok: false, status: 'exception', message: 'تست Green API واتساپ ناموفق شد.', detail: error?.message || String(error) };
    }
  }

  if (cloudToken && phoneNumberId) {
    try {
      const { response, data } = await getJson(`https://graph.facebook.com/v19.0/${phoneNumberId}?fields=display_phone_number,verified_name&access_token=${encodeURIComponent(cloudToken)}`, {}, 10000);
      return { configured: true, ok: response.ok, status: response.status, message: response.ok ? 'WhatsApp Cloud API سالم است.' : 'WhatsApp Cloud API خطا داد.', detail: summarizeApiResponse(data) };
    } catch (error: any) {
      return { configured: true, ok: false, status: 'exception', message: 'تست WhatsApp Cloud API ناموفق شد.', detail: error?.message || String(error) };
    }
  }

  if (callMeBot) {
    return { configured: true, ok: true, status: 'configured-only', message: 'CallMeBot تنظیم شده است؛ تست بدون ارسال پیام رسمی ندارد، بنابراین فقط وجود کلید تأیید شد.' };
  }

  return notConfigured('WhatsApp');
}

async function testMakeTranslate(settings: Record<string, string>): Promise<TestResult> {
  const webhookUrl = (pick(settings, ['MAKE_TRANSLATE_WEBHOOK_URL'], ['make_translate_webhook_url']) || '').replace(/\/+$/, '');
  const authHeaderName = pick(settings, ['MAKE_TRANSLATE_AUTH_HEADER_NAME'], ['make_translate_auth_header_name']);
  const authHeaderValue = pick(settings, ['MAKE_TRANSLATE_AUTH_HEADER_VALUE'], ['make_translate_auth_header_value']);

  if (!webhookUrl) return notConfigured('Make Translate Bridge');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Make-Bridge-Source': 'ehsansalehi-site',
  };
  if (authHeaderName && authHeaderValue) headers[authHeaderName] = authHeaderValue;

  try {
    const { response, data } = await getJson(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'translate_news',
        title: 'Test English Headline',
        content: 'This is a short English article body used to verify the Make translation bridge.',
        sourceName: 'Integration Test',
        sentAt: new Date().toISOString(),
      }),
    }, 45000);

    return {
      configured: true,
      ok: response.ok && Boolean(data?.title && data?.summary && data?.content),
      status: response.status,
      message: response.ok ? 'Make Translate Bridge پاسخ داد.' : 'Make Translate Bridge خطا داد.',
      detail: response.ok ? { title: String(data?.title || '').slice(0, 40) } : summarizeApiResponse(data),
    };
  } catch (error: any) {
    return { configured: true, ok: false, status: 'exception', message: 'تست Make Translate Bridge ناموفق شد.', detail: error?.message || String(error) };
  }
}

async function testMcpSocial(settings: Record<string, string>): Promise<TestResult> {
  const baseUrl = (pick(settings, ['MCP_SOCIAL_URL'], ['mcp_social_url']) || '').replace(/\/+$/, '');
  const token = pick(settings, ['MCP_SOCIAL_TOKEN'], ['mcp_social_token']);
  const workspaceId = pick(settings, ['MCP_SOCIAL_WORKSPACE_ID'], ['mcp_social_workspace_id']) || 'default';

  if (!baseUrl || !token) return notConfigured('MCP Social Bridge');

  try {
    await fetch(`${baseUrl}/health`, { signal: timeoutSignal(20000), cache: 'no-store' }).catch(() => null);

    const callOnce = async (ms: number) => getJson(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-MCP-Workspace-Id': workspaceId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'site-test',
        method: 'tools/call',
        params: {
          name: 'social.connections.list',
          arguments: { workspaceId },
        },
      }),
    }, ms);

    let response: Response;
    let data: any;
    try {
      ({ response, data } = await callOnce(20000));
    } catch {
      await fetch(`${baseUrl}/health`, { signal: timeoutSignal(25000), cache: 'no-store' }).catch(() => null);
      ({ response, data } = await callOnce(45000));
    }

    const structured = data?.result?.structuredContent;
    const connections = structured?.connections || {};
    return {
      configured: true,
      ok: response.ok && !data?.error,
      status: response.status,
      message: response.ok && !data?.error ? 'MCP Social Bridge پاسخ داد.' : 'MCP Social Bridge خطا داد.',
      detail: response.ok && !data?.error
        ? { workspaceId, connections: Object.keys(connections) }
        : summarizeApiResponse(data?.error || data),
    };
  } catch (error: any) {
    return { configured: true, ok: false, status: 'exception', message: 'تست MCP Social Bridge ناموفق شد.', detail: error?.message || String(error) };
  }
}

async function testRssFeeds(): Promise<TestResult> {
  const feeds = [
    'https://www.coindesk.com/arc/outboundfeeds/rss/',
    'https://cointelegraph.com/rss',
    'https://techcrunch.com/category/artificial-intelligence/feed/',
    'https://venturebeat.com/category/ai/feed/',
  ];

  const results = await Promise.allSettled(feeds.map(async (url) => {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EhsanSalehiNewsBot/1.0; +https://ehsansalehi.ir)' },
      signal: timeoutSignal(7000),
    });
    return { url, ok: response.ok, status: response.status };
  }));

  const checks = results.map((result, index) => result.status === 'fulfilled'
    ? result.value
    : { url: feeds[index], ok: false, status: 'exception' });
  const okCount = checks.filter((item) => item.ok).length;

  return {
    configured: true,
    ok: okCount > 0,
    status: `${okCount}/${feeds.length}`,
    message: okCount > 0 ? 'دسترسی RSS منابع خبری برقرار است.' : 'هیچ RSS خبری پاسخ سالم نداد.',
    detail: checks,
  };
}

export async function GET(request: NextRequest) {
  const cronAuthError = verifyCron(request);
  if (cronAuthError) {
    const adminAuthError = await verifyAdmin(request);
    if (adminAuthError) return adminAuthError;
  }

  const settings = await getAutomationSettings();
  const startedAt = Date.now();

  const [database, openai, makeTranslate, telegram, linkedin, bale, eitaa, rubika, facebook, instagram, whatsapp, mcpSocial, rssFeeds] = await Promise.all([
    testDatabase(),
    testOpenAI(settings),
    testMakeTranslate(settings),
    testTelegram(settings),
    testLinkedIn(settings),
    testBale(settings),
    testEitaa(settings),
    testRubika(settings),
    testFacebook(settings),
    testInstagram(settings),
    testWhatsApp(settings),
    testMcpSocial(settings),
    testRssFeeds(),
  ]);

  const tests = { database, openai, makeTranslate, telegram, linkedin, bale, eitaa, rubika, facebook, instagram, whatsapp, mcpSocial, rssFeeds };
  const configured = Object.values(tests).filter((test) => test.configured).length;
  const ok = Object.values(tests).filter((test) => test.ok).length;

  return json({
    success: true,
    checkedAt: new Date().toISOString(),
    summary: {
      configured,
      ok,
      total: Object.keys(tests).length,
    },
    tests,
    elapsedMs: Date.now() - startedAt,
    message: 'تست اتصال API هوش مصنوعی، دیتابیس، RSS و شبکه‌های اجتماعی انجام شد. این تست هیچ پستی منتشر نمی‌کند.',
  });
}
