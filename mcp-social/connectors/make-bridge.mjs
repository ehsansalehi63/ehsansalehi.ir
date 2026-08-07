import { getConnection, setConnection } from '../lib/store.mjs';

function bridgeHeaders(connection) {
  const headers = {
    'Content-Type': 'application/json',
    'X-MCP-Bridge-Source': 'arena-social-mcp',
  };

  if (connection?.bridgeAuthHeaderName && connection?.bridgeAuthHeaderValue) {
    headers[connection.bridgeAuthHeaderName] = connection.bridgeAuthHeaderValue;
  }

  return headers;
}

async function postBridge(url, connection, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: bridgeHeaders(connection),
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { ok: res.ok, raw: text };
  }

  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || data?.message || `Make bridge request failed (${res.status})`);
  }

  return data;
}

export async function configureMakeBridge(workspaceId, args) {
  const platforms = Array.isArray(args.platforms) && args.platforms.length
    ? args.platforms
    : ['instagram', 'facebook', 'linkedin', 'telegram'];

  const results = {};
  for (const platform of platforms) {
    results[platform] = await setConnection(workspaceId, platform, {
      connected: true,
      provider: 'make',
      accountLabel: args.connectionLabel || 'Make Bridge',
      scopes: ['bridge.publish'],
      publishWebhookUrl: args.publishWebhookUrl,
      testWebhookUrl: args.testWebhookUrl || null,
      bridgeAuthHeaderName: args.authHeaderName || null,
      bridgeAuthHeaderValue: args.authHeaderValue || null,
      meta: {
        bridgeMode: 'make',
        source: 'stored',
        note: args.note || null,
      },
      lastError: null,
    });
  }

  return {
    ok: true,
    provider: 'make',
    workspaceId,
    platforms,
    publishWebhookUrl: args.publishWebhookUrl,
    testWebhookUrl: args.testWebhookUrl || null,
    configured: Object.keys(results).length,
  };
}

export async function testMakeBridgeConnection(workspaceId, platform) {
  const connection = await getConnection(workspaceId, platform);
  if (!connection?.connected || !String(connection.provider || '').startsWith('make')) {
    return { ok: false, error: `${platform} is not configured to use Make bridge` };
  }

  const url = connection.testWebhookUrl || connection.publishWebhookUrl;
  if (!url) {
    return { ok: false, error: 'Make bridge webhook URL is missing' };
  }

  try {
    const data = await postBridge(url, connection, {
      action: 'test_connection',
      platform,
      workspaceId,
      sentAt: new Date().toISOString(),
    });
    if (connection.provider === 'make') {
      await setConnection(workspaceId, platform, { lastError: null });
    }
    return {
      ok: true,
      platform,
      provider: connection.provider,
      response: data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (connection.provider === 'make') {
      await setConnection(workspaceId, platform, { lastError: message });
    }
    return { ok: false, error: message };
  }
}

export async function publishViaMakeBridge(workspaceId, platform, payload) {
  const connection = await getConnection(workspaceId, platform);
  if (!connection?.connected || !String(connection.provider || '').startsWith('make')) {
    return { ok: false, error: `${platform} is not configured to use Make bridge` };
  }
  if (!connection.publishWebhookUrl) {
    return { ok: false, error: 'Make publish webhook URL is missing' };
  }

  try {
    const data = await postBridge(connection.publishWebhookUrl, connection, {
      action: 'publish',
      workspaceId,
      platform,
      title: payload.title,
      content: payload.content,
      imageUrl: payload.imageUrl || null,
      link: payload.link || null,
      dryRun: false,
      sentAt: new Date().toISOString(),
    });

    if (connection.provider === 'make') {
      await setConnection(workspaceId, platform, { lastError: null });
    }

    return {
      ok: true,
      platform,
      provider: connection.provider,
      result: data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (connection.provider === 'make') {
      await setConnection(workspaceId, platform, { lastError: message });
    }
    return { ok: false, error: message };
  }
}
