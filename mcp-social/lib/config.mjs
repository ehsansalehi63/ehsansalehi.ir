import path from 'node:path';

function readBool(name, defaultValue = false) {
  const raw = process.env[name];
  if (raw == null || raw === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(raw).toLowerCase());
}

function readList(name, fallback = '') {
  return String(process.env[name] ?? fallback)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const PORT = Number(process.env.PORT || 8787);
const PUBLIC_BASE_URL = String(process.env.MCP_PUBLIC_BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const DEFAULT_WORKSPACE_ID = process.env.MCP_DEFAULT_WORKSPACE_ID || 'default';
const DATA_DIR = path.resolve(process.cwd(), process.env.MCP_DATA_DIR || './data');

export const config = {
  port: PORT,
  publicBaseUrl: PUBLIC_BASE_URL,
  dataDir: DATA_DIR,
  bearerToken: process.env.MCP_BEARER_TOKEN || '',
  allowUnauthenticated: readBool('MCP_ALLOW_UNAUTHENTICATED', false),
  defaultWorkspaceId: DEFAULT_WORKSPACE_ID,
  defaultPermissions: readList(
    'MCP_DEFAULT_PERMISSIONS',
    'social.connections.read,social.connections.write,social.publish,social.schedule,social.diagnostics.read'
  ),
  webhookSigningSecret: process.env.WEBHOOK_SIGNING_SECRET || '',
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    redirectUri: process.env.LINKEDIN_REDIRECT_URI || `${PUBLIC_BASE_URL}/oauth/linkedin/callback`,
    scopes: readList('LINKEDIN_SCOPES', 'openid,profile,email,w_member_social,offline_access'),
    defaultAuthorUrn: process.env.LINKEDIN_DEFAULT_AUTHOR_URN || '',
  },
  instagram: {
    appId: process.env.META_APP_ID || '',
    appSecret: process.env.META_APP_SECRET || '',
    redirectUri: process.env.META_REDIRECT_URI || `${PUBLIC_BASE_URL}/oauth/instagram/callback`,
    scopes: readList('META_SCOPES', 'instagram_basic,pages_show_list,instagram_content_publish,business_management'),
    graphVersion: process.env.META_GRAPH_VERSION || 'v21.0',
  },
  telegram: {
    defaultParseMode: process.env.TELEGRAM_DEFAULT_PARSE_MODE || 'HTML',
  },
  makeBridge: {
    enabled: readBool('MAKE_BRIDGE_ENABLED', false),
    platforms: readList('MAKE_BRIDGE_PLATFORMS', 'instagram,facebook,linkedin,telegram'),
    publishWebhookUrl: process.env.MAKE_BRIDGE_PUBLISH_WEBHOOK_URL || '',
    testWebhookUrl: process.env.MAKE_BRIDGE_TEST_WEBHOOK_URL || '',
    connectionLabel: process.env.MAKE_BRIDGE_CONNECTION_LABEL || 'Make Bridge',
    authHeaderName: process.env.MAKE_BRIDGE_AUTH_HEADER_NAME || '',
    authHeaderValue: process.env.MAKE_BRIDGE_AUTH_HEADER_VALUE || '',
  },
};

export function getWorkspaceId(inputWorkspaceId) {
  return String(inputWorkspaceId || config.defaultWorkspaceId);
}
