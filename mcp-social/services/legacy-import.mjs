import { getMysqlPool } from '../lib/database.mjs';
import { setConnection } from '../lib/store.mjs';
import { saveTelegramConnection, testTelegramConnection } from '../connectors/telegram.mjs';
import { testLinkedInConnection } from '../connectors/linkedin.mjs';
import { testInstagramConnection } from '../connectors/instagram.mjs';

async function readAutomationSettings() {
  const pool = await getMysqlPool();
  if (!pool) {
    throw new Error('MySQL is not configured for MCP, so legacy import cannot read automation_settings');
  }

  const [tables] = await pool.execute("SHOW TABLES LIKE 'automation_settings'");
  if (!Array.isArray(tables) || tables.length === 0) {
    throw new Error('automation_settings table was not found in the configured database');
  }

  const [rows] = await pool.execute('SELECT setting_key, setting_value FROM automation_settings');
  const out = {};
  for (const row of rows || []) {
    out[row.setting_key] = row.setting_value || '';
  }
  return out;
}

function pick(settings, keys) {
  for (const key of keys) {
    const value = settings[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
}

async function importTelegram(workspaceId, settings, verify) {
  const botToken = pick(settings, ['telegram_bot_token']);
  const chatId = pick(settings, ['telegram_channel_id', 'telegram_chat_id']);
  if (!botToken || !chatId) {
    return { platform: 'telegram', imported: false, reason: 'missing telegram_bot_token or telegram_channel_id/chat_id' };
  }

  try {
    if (verify) {
      const saved = await saveTelegramConnection(workspaceId, {
        botToken,
        chatId,
        connectionLabel: 'Imported from automation_settings',
      });
      return {
        platform: 'telegram',
        imported: true,
        verified: true,
        accountLabel: saved.accountLabel || null,
        chatId: saved.chatId || chatId,
      };
    }

    await setConnection(workspaceId, 'telegram', {
      connected: true,
      provider: 'telegram',
      accountLabel: 'Imported from automation_settings',
      botToken,
      chatId,
      scopes: ['telegram.send'],
      lastError: null,
      meta: { importedFrom: 'automation_settings' },
    });
    return { platform: 'telegram', imported: true, verified: false, chatId };
  } catch (error) {
    return { platform: 'telegram', imported: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function importLinkedIn(workspaceId, settings, verify) {
  const accessToken = pick(settings, ['linkedin_access_token']);
  const authorUrn = pick(settings, ['linkedin_author_urn']);
  if (!accessToken) {
    return { platform: 'linkedin', imported: false, reason: 'missing linkedin_access_token' };
  }

  try {
    await setConnection(workspaceId, 'linkedin', {
      connected: true,
      provider: 'linkedin',
      accountLabel: authorUrn || 'Imported from automation_settings',
      authorUrn: authorUrn || null,
      accessToken,
      scopes: [],
      lastError: null,
      meta: { importedFrom: 'automation_settings' },
    });

    const verification = verify ? await testLinkedInConnection(workspaceId) : { ok: true };
    return {
      platform: 'linkedin',
      imported: true,
      verified: Boolean(verification.ok && verify),
      verification: verify ? verification : undefined,
    };
  } catch (error) {
    return { platform: 'linkedin', imported: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function importInstagram(workspaceId, settings, verify) {
  const accessToken = pick(settings, ['instagram_access_token', 'fb_access_token']);
  const instagramUserId = pick(settings, ['instagram_account_id']);
  if (!accessToken) {
    return { platform: 'instagram', imported: false, reason: 'missing instagram_access_token/fb_access_token' };
  }

  try {
    await setConnection(workspaceId, 'instagram', {
      connected: true,
      provider: 'meta',
      accountId: instagramUserId || null,
      instagramUserId: instagramUserId || null,
      accountLabel: instagramUserId ? `Instagram ${instagramUserId}` : 'Imported from automation_settings',
      accessToken,
      scopes: [],
      lastError: null,
      meta: { importedFrom: 'automation_settings' },
    });

    const verification = verify ? await testInstagramConnection(workspaceId) : { ok: true };
    return {
      platform: 'instagram',
      imported: true,
      verified: Boolean(verification.ok && verify),
      verification: verify ? verification : undefined,
    };
  } catch (error) {
    return { platform: 'instagram', imported: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function importLegacyAutomationSettings(workspaceId, { platforms = ['linkedin', 'instagram', 'telegram'], verify = true } = {}) {
  const settings = await readAutomationSettings();
  const normalized = Array.isArray(platforms) && platforms.length ? platforms : ['linkedin', 'instagram', 'telegram'];
  const results = [];

  for (const platform of normalized) {
    if (platform === 'telegram') results.push(await importTelegram(workspaceId, settings, verify));
    else if (platform === 'linkedin') results.push(await importLinkedIn(workspaceId, settings, verify));
    else if (platform === 'instagram') results.push(await importInstagram(workspaceId, settings, verify));
    else results.push({ platform, imported: false, reason: 'unsupported platform' });
  }

  return {
    ok: results.some((item) => item.imported),
    sourceTable: 'automation_settings',
    workspaceId,
    verify,
    results,
  };
}
