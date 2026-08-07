import { config } from '../lib/config.mjs';
import { getConnection, setConnection } from '../lib/store.mjs';

async function callTelegram(token, method, payload = {}, isMultipart = false) {
  const url = `https://api.telegram.org/bot${token}/${method}`;
  const options = isMultipart
    ? { method: 'POST', body: payload }
    : {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      };
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.description || `Telegram ${method} failed (${res.status})`);
  }
  return data.result;
}

export async function saveTelegramConnection(workspaceId, { botToken, chatId, connectionLabel = '' }) {
  const me = await callTelegram(botToken, 'getMe');
  let chat = null;
  try {
    chat = await callTelegram(botToken, 'getChat', { chat_id: chatId });
  } catch {
    chat = null;
  }

  return setConnection(workspaceId, 'telegram', {
    connected: true,
    provider: 'telegram',
    accountId: me.id,
    accountLabel: connectionLabel || chat?.title || me.username || me.first_name || 'Telegram bot',
    botToken,
    chatId,
    botUsername: me.username || null,
    meta: { bot: me, chat },
    scopes: ['telegram.send'],
    lastError: null,
  });
}

export async function testTelegramConnection(workspaceId) {
  const connection = await getConnection(workspaceId, 'telegram');
  if (!connection?.connected || !connection.botToken || !connection.chatId) {
    return { ok: false, error: 'Telegram is not connected' };
  }

  try {
    const me = await callTelegram(connection.botToken, 'getMe');
    await setConnection(workspaceId, 'telegram', {
      accountLabel: connection.accountLabel || me.username || 'Telegram bot',
      botUsername: me.username || null,
      lastError: null,
    });
    return {
      ok: true,
      platform: 'telegram',
      accountLabel: connection.accountLabel || me.username || 'Telegram bot',
      chatId: connection.chatId,
      botUsername: me.username || null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await setConnection(workspaceId, 'telegram', { lastError: message });
    return { ok: false, error: message };
  }
}

export async function publishToTelegram(workspaceId, payload) {
  const connection = await getConnection(workspaceId, 'telegram');
  if (!connection?.connected || !connection.botToken || !connection.chatId) {
    return { ok: false, error: 'Telegram is not connected' };
  }

  const caption = [payload.title, payload.content, payload.link].filter(Boolean).join('\n\n');

  try {
    let result;
    if (payload.imageUrl) {
      result = await callTelegram(connection.botToken, 'sendPhoto', {
        chat_id: connection.chatId,
        photo: payload.imageUrl,
        caption,
        parse_mode: config.telegram.defaultParseMode,
      });
    } else {
      result = await callTelegram(connection.botToken, 'sendMessage', {
        chat_id: connection.chatId,
        text: caption,
        parse_mode: config.telegram.defaultParseMode,
        disable_web_page_preview: false,
      });
    }

    await setConnection(workspaceId, 'telegram', { lastError: null });
    return {
      ok: true,
      platform: 'telegram',
      result: {
        messageId: result.message_id,
        chatId: connection.chatId,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await setConnection(workspaceId, 'telegram', { lastError: message });
    return { ok: false, error: message };
  }
}
