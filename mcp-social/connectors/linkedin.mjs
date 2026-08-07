import { config } from '../lib/config.mjs';
import { refreshLinkedInAccessToken } from '../lib/oauth.mjs';
import { getConnection, setConnection } from '../lib/store.mjs';

function authHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'X-Restli-Protocol-Version': '2.0.0',
  };
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
    throw new Error(data.message || data.error_description || data.error || `${url} failed with HTTP ${res.status}`);
  }
  return data;
}

export async function discoverLinkedInIdentity(accessToken) {
  const userInfo = await fetchJson('https://api.linkedin.com/v2/userinfo', {
    headers: authHeaders(accessToken),
  }).catch(() => null);

  if (userInfo?.sub) {
    return {
      accountId: userInfo.sub,
      authorUrn: `urn:li:person:${userInfo.sub}`,
      accountLabel: userInfo.name || userInfo.localizedFirstName || userInfo.email || 'LinkedIn account',
      profile: userInfo,
    };
  }

  const me = await fetchJson('https://api.linkedin.com/v2/me', {
    headers: authHeaders(accessToken),
  });

  return {
    accountId: me.id,
    authorUrn: `urn:li:person:${me.id}`,
    accountLabel: [me.localizedFirstName, me.localizedLastName].filter(Boolean).join(' ') || config.linkedin.defaultAuthorUrn || 'LinkedIn account',
    profile: me,
  };
}

export async function saveLinkedInConnection(workspaceId, tokenPayload, connectionLabel = '') {
  const identity = await discoverLinkedInIdentity(tokenPayload.access_token);
  const expiresAt = tokenPayload.expires_in
    ? new Date(Date.now() + Number(tokenPayload.expires_in) * 1000).toISOString()
    : null;

  return setConnection(workspaceId, 'linkedin', {
    connected: true,
    accountId: identity.accountId,
    accountLabel: connectionLabel || identity.accountLabel,
    authorUrn: identity.authorUrn,
    accessToken: tokenPayload.access_token,
    refreshToken: tokenPayload.refresh_token || null,
    expiresAt,
    scopes: config.linkedin.scopes,
    provider: 'linkedin',
    meta: identity.profile,
    lastError: null,
  });
}

export async function testLinkedInConnection(workspaceId) {
  const connection = await getConnection(workspaceId, 'linkedin');
  if (!connection?.connected || !connection?.accessToken) {
    return { ok: false, error: 'LinkedIn is not connected' };
  }

  try {
    const identity = await discoverLinkedInIdentity(connection.accessToken);
    await setConnection(workspaceId, 'linkedin', {
      accountId: identity.accountId,
      accountLabel: connection.accountLabel || identity.accountLabel,
      authorUrn: connection.authorUrn || identity.authorUrn,
      meta: identity.profile,
      lastError: null,
    });
    return {
      ok: true,
      platform: 'linkedin',
      accountLabel: connection.accountLabel || identity.accountLabel,
      authorUrn: connection.authorUrn || identity.authorUrn,
      expiresAt: connection.expiresAt || null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await setConnection(workspaceId, 'linkedin', { lastError: message });
    return { ok: false, error: message };
  }
}

export async function refreshLinkedInConnection(workspaceId) {
  const connection = await getConnection(workspaceId, 'linkedin');
  if (!connection?.refreshToken) {
    return { ok: false, error: 'No LinkedIn refresh token is stored' };
  }

  try {
    const refreshed = await refreshLinkedInAccessToken(connection.refreshToken);
    await saveLinkedInConnection(workspaceId, refreshed, connection.accountLabel || '');
    return { ok: true, platform: 'linkedin', expiresIn: refreshed.expires_in || null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await setConnection(workspaceId, 'linkedin', { lastError: message });
    return { ok: false, error: message };
  }
}

async function registerImageUpload(accessToken, authorUrn) {
  return fetchJson('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: {
      ...authHeaders(accessToken),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: authorUrn,
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        }],
      },
    }),
  });
}

async function uploadLinkedInAsset(uploadUrl, accessToken, imageUrl) {
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error(`Image download failed (${imageRes.status})`);
  const mime = imageRes.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await imageRes.arrayBuffer());
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': mime,
    },
    body: buffer,
  });
  if (!res.ok) throw new Error(`LinkedIn image upload failed (${res.status})`);
}

export async function publishToLinkedIn(workspaceId, payload) {
  const connection = await getConnection(workspaceId, 'linkedin');
  if (!connection?.connected || !connection.accessToken) {
    return { ok: false, error: 'LinkedIn is not connected' };
  }

  const authorUrn = connection.authorUrn || config.linkedin.defaultAuthorUrn;
  if (!authorUrn) {
    return { ok: false, error: 'LinkedIn author URN is not known yet' };
  }

  try {
    const commentary = [payload.title, payload.content, payload.link].filter(Boolean).join('\n\n');
    const body = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: commentary },
          shareMediaCategory: payload.imageUrl ? 'IMAGE' : 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };

    if (payload.imageUrl) {
      const registered = await registerImageUpload(connection.accessToken, authorUrn);
      const upload = registered?.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'];
      const asset = registered?.value?.asset;
      if (!upload?.uploadUrl || !asset) throw new Error('LinkedIn upload registration returned no asset');
      await uploadLinkedInAsset(upload.uploadUrl, connection.accessToken, payload.imageUrl);
      body.specificContent['com.linkedin.ugc.ShareContent'].media = [{ status: 'READY', media: asset }];
    }

    const post = await fetchJson('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        ...authHeaders(connection.accessToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    await setConnection(workspaceId, 'linkedin', { lastError: null });
    return {
      ok: true,
      platform: 'linkedin',
      result: {
        id: post.id || null,
        authorUrn,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await setConnection(workspaceId, 'linkedin', { lastError: message });
    return { ok: false, error: message };
  }
}
