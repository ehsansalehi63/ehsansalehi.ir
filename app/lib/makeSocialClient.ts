import { pool } from './db';

const MAKE_SOCIAL_WEBHOOK_URL = (process.env.MAKE_SOCIAL_WEBHOOK_URL || '').replace(/\/+$/, '');
const MAKE_SOCIAL_AUTH_HEADER_NAME = process.env.MAKE_SOCIAL_AUTH_HEADER_NAME || '';
const MAKE_SOCIAL_AUTH_HEADER_VALUE = process.env.MAKE_SOCIAL_AUTH_HEADER_VALUE || '';
const MAKE_SOCIAL_PLATFORMS = process.env.MAKE_SOCIAL_PLATFORMS || '';
const MAKE_SOCIAL_TIMEOUT_MS = Number(process.env.MAKE_SOCIAL_TIMEOUT_MS || 45000);

async function getAutomationSetting(key: string): Promise<string> {
  try {
    const [rows] = await pool.execute('SELECT setting_value FROM automation_settings WHERE setting_key = ? LIMIT 1', [key]);
    return (rows as any[])[0]?.setting_value || '';
  } catch {
    return '';
  }
}

function parsePlatforms(raw: string): string[] {
  return String(raw || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export async function getMakeSocialConfig() {
  const webhookUrl = MAKE_SOCIAL_WEBHOOK_URL || (await getAutomationSetting('make_social_webhook_url')) || '';
  const authHeaderName = MAKE_SOCIAL_AUTH_HEADER_NAME || (await getAutomationSetting('make_social_auth_header_name')) || '';
  const authHeaderValue = MAKE_SOCIAL_AUTH_HEADER_VALUE || (await getAutomationSetting('make_social_auth_header_value')) || '';
  const platformsRaw = MAKE_SOCIAL_PLATFORMS || (await getAutomationSetting('make_social_platforms')) || 'telegram,linkedin';
  const platforms = parsePlatforms(platformsRaw);

  return {
    webhookUrl: webhookUrl.replace(/\/+$/, ''),
    authHeaderName,
    authHeaderValue,
    platforms,
    configured: Boolean(webhookUrl),
  };
}

export async function isMakeSocialConfigured(): Promise<boolean> {
  const cfg = await getMakeSocialConfig();
  return cfg.configured;
}

async function postMake(webhookUrl: string, headers: Record<string, string>, body: any, timeoutMs: number) {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Make social webhook failed (${res.status})`);
  }
  return data;
}

export async function testMakeSocialBridge(platform?: string) {
  const cfg = await getMakeSocialConfig();
  if (!cfg.configured) return { ok: false, error: 'Make social webhook is not configured' };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Make-Bridge-Source': 'ehsansalehi-site',
  };
  if (cfg.authHeaderName && cfg.authHeaderValue) headers[cfg.authHeaderName] = cfg.authHeaderValue;

  try {
    const data = await postMake(cfg.webhookUrl, headers, {
      action: 'test_connection',
      workspaceId: 'default',
      platform: platform || cfg.platforms[0] || 'telegram',
      sentAt: new Date().toISOString(),
    }, MAKE_SOCIAL_TIMEOUT_MS);

    return {
      ok: Boolean(data?.ok ?? true),
      detail: data,
    };
  } catch (error: any) {
    return { ok: false, error: error?.message || String(error) };
  }
}

export async function publishViaMakeSocialBridge(payload: {
  title: string;
  content: string;
  imageUrl?: string | null;
  link?: string | null;
  platforms?: string[];
}) {
  const cfg = await getMakeSocialConfig();
  if (!cfg.configured) {
    return { ok: false, message: 'Make social webhook is not configured', results: {}, errors: { makeSocial: 'not configured' } };
  }

  const requestedPlatforms = Array.isArray(payload.platforms) && payload.platforms.length ? payload.platforms : cfg.platforms;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Make-Bridge-Source': 'ehsansalehi-site',
  };
  if (cfg.authHeaderName && cfg.authHeaderValue) headers[cfg.authHeaderName] = cfg.authHeaderValue;

  const results: Record<string, any> = {};
  const errors: Record<string, string> = {};

  for (const platform of requestedPlatforms) {
    try {
      const data = await postMake(cfg.webhookUrl, headers, {
        action: 'publish',
        workspaceId: 'default',
        platform,
        title: payload.title,
        content: payload.content,
        imageUrl: payload.imageUrl || null,
        link: payload.link || null,
        dryRun: false,
        sentAt: new Date().toISOString(),
      }, MAKE_SOCIAL_TIMEOUT_MS);
      results[platform] = { ok: Boolean(data?.ok ?? true), platform, result: data };
      if (!results[platform].ok) errors[platform] = data?.error || data?.message || 'unknown error';
    } catch (error: any) {
      results[platform] = { ok: false, platform, error: error?.message || String(error) };
      errors[platform] = error?.message || String(error);
    }
  }

  return {
    ok: Object.values(results).some((item: any) => item?.ok),
    results,
    errors,
  };
}
