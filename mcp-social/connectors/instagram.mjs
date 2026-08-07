import { config } from '../lib/config.mjs';
import { getConnection, setConnection } from '../lib/store.mjs';

function graphUrl(path) {
  return `https://graph.facebook.com/${config.instagram.graphVersion}${path}`;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || `${url} failed with HTTP ${res.status}`);
  }
  return data;
}

async function discoverInstagramIdentity(accessToken) {
  const pages = await fetchJson(graphUrl('/me/accounts') + `?access_token=${encodeURIComponent(accessToken)}`);
  const page = pages?.data?.[0];
  if (!page?.id) throw new Error('No Facebook page is available for this Meta token');

  const ig = await fetchJson(graphUrl(`/${page.id}`) + `?fields=instagram_business_account{name,username,profile_picture_url}&access_token=${encodeURIComponent(accessToken)}`);
  const igAccount = ig.instagram_business_account;
  if (!igAccount?.id) throw new Error('No Instagram Business account is linked to the selected page');

  return {
    pageId: page.id,
    pageName: page.name || 'Facebook Page',
    instagramUserId: igAccount.id,
    accountLabel: igAccount.username || igAccount.name || page.name || 'Instagram Business',
    profile: igAccount,
  };
}

export async function saveInstagramConnection(workspaceId, tokenPayload, connectionLabel = '') {
  const identity = await discoverInstagramIdentity(tokenPayload.access_token);
  const expiresAt = tokenPayload.expires_in
    ? new Date(Date.now() + Number(tokenPayload.expires_in) * 1000).toISOString()
    : null;

  return setConnection(workspaceId, 'instagram', {
    connected: true,
    provider: 'meta',
    accountId: identity.instagramUserId,
    accountLabel: connectionLabel || identity.accountLabel,
    pageId: identity.pageId,
    pageName: identity.pageName,
    instagramUserId: identity.instagramUserId,
    accessToken: tokenPayload.access_token,
    refreshToken: tokenPayload.refresh_token || null,
    expiresAt,
    scopes: config.instagram.scopes,
    meta: identity.profile,
    lastError: null,
  });
}

export async function testInstagramConnection(workspaceId) {
  const connection = await getConnection(workspaceId, 'instagram');
  if (!connection?.connected || !connection?.accessToken) {
    return { ok: false, error: 'Instagram is not connected' };
  }

  try {
    const probe = await fetchJson(graphUrl(`/${connection.instagramUserId}`) + `?fields=id,username&access_token=${encodeURIComponent(connection.accessToken)}`);
    await setConnection(workspaceId, 'instagram', {
      accountId: probe.id,
      accountLabel: connection.accountLabel || probe.username || 'Instagram account',
      lastError: null,
    });
    return {
      ok: true,
      platform: 'instagram',
      accountLabel: connection.accountLabel || probe.username || 'Instagram account',
      instagramUserId: connection.instagramUserId,
      pageId: connection.pageId,
      expiresAt: connection.expiresAt || null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await setConnection(workspaceId, 'instagram', { lastError: message });
    return { ok: false, error: message };
  }
}

export async function refreshInstagramConnection(workspaceId) {
  const connection = await getConnection(workspaceId, 'instagram');
  if (!connection?.accessToken) {
    return { ok: false, error: 'Instagram is not connected' };
  }

  try {
    const url = new URL('https://graph.instagram.com/refresh_access_token');
    url.searchParams.set('grant_type', 'ig_refresh_token');
    url.searchParams.set('access_token', connection.accessToken);
    const data = await fetchJson(url);
    const expiresAt = data.expires_in
      ? new Date(Date.now() + Number(data.expires_in) * 1000).toISOString()
      : connection.expiresAt || null;
    await setConnection(workspaceId, 'instagram', {
      accessToken: data.access_token || connection.accessToken,
      expiresAt,
      lastError: null,
    });
    return { ok: true, platform: 'instagram', expiresAt };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await setConnection(workspaceId, 'instagram', { lastError: message });
    return { ok: false, error: message };
  }
}

async function waitForContainer(containerId, accessToken) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const data = await fetchJson(graphUrl(`/${containerId}`) + `?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`);
    if (data.status_code === 'FINISHED') return true;
    if (data.status_code === 'ERROR' || data.status_code === 'EXPIRED') {
      throw new Error(data.status || data.status_code);
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error('Instagram media container was not ready in time');
}

export async function publishToInstagram(workspaceId, payload) {
  const connection = await getConnection(workspaceId, 'instagram');
  if (!connection?.connected || !connection.accessToken || !connection.instagramUserId) {
    return { ok: false, error: 'Instagram is not connected' };
  }
  if (!payload.imageUrl) {
    return { ok: false, error: 'Instagram publishing currently requires imageUrl' };
  }

  try {
    const caption = [payload.title, payload.content, payload.link].filter(Boolean).join('\n\n');
    const createRes = await fetch(graphUrl(`/${connection.instagramUserId}/media`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        image_url: payload.imageUrl,
        caption,
        access_token: connection.accessToken,
      }),
    });
    const created = await createRes.json();
    if (!createRes.ok || !created.id) {
      throw new Error(created.error?.message || 'Instagram media creation failed');
    }

    await waitForContainer(created.id, connection.accessToken);

    const publishRes = await fetch(graphUrl(`/${connection.instagramUserId}/media_publish`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        creation_id: created.id,
        access_token: connection.accessToken,
      }),
    });
    const published = await publishRes.json();
    if (!publishRes.ok || !published.id) {
      throw new Error(published.error?.message || 'Instagram publish failed');
    }

    await setConnection(workspaceId, 'instagram', { lastError: null });
    return {
      ok: true,
      platform: 'instagram',
      result: {
        id: published.id,
        url: `https://www.instagram.com/p/${published.id}/`,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await setConnection(workspaceId, 'instagram', { lastError: message });
    return { ok: false, error: message };
  }
}
