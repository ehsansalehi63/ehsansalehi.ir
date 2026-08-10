import { pool } from './db';

const MAKE_TRANSLATE_WEBHOOK_URL = (process.env.MAKE_TRANSLATE_WEBHOOK_URL || '').replace(/\/+$/, '');
const MAKE_TRANSLATE_AUTH_HEADER_NAME = process.env.MAKE_TRANSLATE_AUTH_HEADER_NAME || '';
const MAKE_TRANSLATE_AUTH_HEADER_VALUE = process.env.MAKE_TRANSLATE_AUTH_HEADER_VALUE || '';
const MAKE_TRANSLATE_TIMEOUT_MS = Number(process.env.MAKE_TRANSLATE_TIMEOUT_MS || 45000);

async function getAutomationSetting(key: string): Promise<string> {
  try {
    const [rows] = await pool.execute('SELECT setting_value FROM automation_settings WHERE setting_key = ? LIMIT 1', [key]);
    return (rows as any[])[0]?.setting_value || '';
  } catch {
    return '';
  }
}

export async function getMakeTranslateConfig() {
  const webhookUrl = MAKE_TRANSLATE_WEBHOOK_URL || (await getAutomationSetting('make_translate_webhook_url')) || '';
  const authHeaderName = MAKE_TRANSLATE_AUTH_HEADER_NAME || (await getAutomationSetting('make_translate_auth_header_name')) || '';
  const authHeaderValue = MAKE_TRANSLATE_AUTH_HEADER_VALUE || (await getAutomationSetting('make_translate_auth_header_value')) || '';

  return {
    webhookUrl: webhookUrl.replace(/\/+$/, ''),
    authHeaderName,
    authHeaderValue,
    configured: Boolean(webhookUrl),
  };
}

export async function isMakeTranslateConfigured(): Promise<boolean> {
  const cfg = await getMakeTranslateConfig();
  return cfg.configured;
}

type TranslatePayload = {
  title: string;
  content: string;
  sourceName: string;
};

export async function translateViaMake(payload: TranslatePayload): Promise<{ title: string; summary: string; content: string }> {
  const cfg = await getMakeTranslateConfig();
  if (!cfg.configured) throw new Error('Make translate webhook is not configured');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Make-Bridge-Source': 'ehsansalehi-site',
  };
  if (cfg.authHeaderName && cfg.authHeaderValue) {
    headers[cfg.authHeaderName] = cfg.authHeaderValue;
  }

  const res = await fetch(cfg.webhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'translate_news',
      title: payload.title,
      content: payload.content,
      sourceName: payload.sourceName,
      sentAt: new Date().toISOString(),
    }),
    signal: AbortSignal.timeout(MAKE_TRANSLATE_TIMEOUT_MS),
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Make translate webhook returned non-JSON response: ${text.slice(0, 200)}`);
  }

  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || data?.message || `Make translate webhook failed (${res.status})`);
  }

  const title = String(data?.title || '').trim();
  const summary = String(data?.summary || '').trim();
  const content = String(data?.content || '').trim();
  if (!title || !summary || !content) {
    throw new Error('Make translate webhook returned incomplete translation payload');
  }

  return { title, summary, content };
}
