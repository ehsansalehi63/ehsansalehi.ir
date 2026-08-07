import crypto from 'node:crypto';
import { config } from './config.mjs';
import { saveOAuthState } from './store.mjs';

function base64url(buffer) {
  return Buffer.from(buffer).toString('base64url');
}

export function createPkcePair() {
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

export async function createLinkedInAuthorization(workspaceId, connectionLabel = '') {
  if (!config.linkedin.clientId) {
    throw new Error('LINKEDIN_CLIENT_ID is not configured');
  }

  const { verifier, challenge } = createPkcePair();
  const state = await saveOAuthState({
    workspaceId,
    platform: 'linkedin',
    verifier,
    connectionLabel,
  });

  const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.linkedin.clientId);
  url.searchParams.set('redirect_uri', config.linkedin.redirectUri);
  url.searchParams.set('scope', config.linkedin.scopes.join(' '));
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');

  return { url: url.toString(), state };
}

export async function exchangeLinkedInCode({ code, verifier }) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.linkedin.redirectUri,
    client_id: config.linkedin.clientId,
    code_verifier: verifier,
  });

  if (config.linkedin.clientSecret) {
    body.set('client_secret', config.linkedin.clientSecret);
  }

  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || `LinkedIn token exchange failed (${res.status})`);
  }

  return data;
}

export async function createInstagramAuthorization(workspaceId, connectionLabel = '') {
  if (!config.instagram.appId) {
    throw new Error('META_APP_ID is not configured');
  }

  const state = await saveOAuthState({
    workspaceId,
    platform: 'instagram',
    connectionLabel,
  });

  const url = new URL('https://www.facebook.com/v21.0/dialog/oauth');
  url.searchParams.set('client_id', config.instagram.appId);
  url.searchParams.set('redirect_uri', config.instagram.redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', config.instagram.scopes.join(','));

  return { url: url.toString(), state };
}

export async function exchangeInstagramCode({ code }) {
  const tokenUrl = new URL(`https://graph.facebook.com/${config.instagram.graphVersion}/oauth/access_token`);
  tokenUrl.searchParams.set('client_id', config.instagram.appId);
  tokenUrl.searchParams.set('client_secret', config.instagram.appSecret);
  tokenUrl.searchParams.set('redirect_uri', config.instagram.redirectUri);
  tokenUrl.searchParams.set('code', code);

  const res = await fetch(tokenUrl);
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error?.message || `Instagram token exchange failed (${res.status})`);
  }
  return data;
}

export async function refreshLinkedInAccessToken(refreshToken) {
  if (!config.linkedin.clientId || !config.linkedin.clientSecret) {
    throw new Error('LinkedIn refresh requires client id and client secret');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.linkedin.clientId,
    client_secret: config.linkedin.clientSecret,
  });

  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || `LinkedIn refresh failed (${res.status})`);
  }
  return data;
}
