import { pool } from './db';

const MCP_SOCIAL_URL = (process.env.MCP_SOCIAL_URL || '').replace(/\/+$/, '');
const MCP_SOCIAL_TOKEN = process.env.MCP_SOCIAL_TOKEN || '';
const MCP_SOCIAL_WORKSPACE_ID = process.env.MCP_SOCIAL_WORKSPACE_ID || '';
const MCP_SOCIAL_PLATFORMS = process.env.MCP_SOCIAL_PLATFORMS || '';
const MCP_SOCIAL_TIMEOUT_MS = Number(process.env.MCP_SOCIAL_TIMEOUT_MS || 45000);

type McpToolResult = {
  ok: boolean;
  deliveryId?: string;
  results?: Record<string, any>;
  errors?: Record<string, string>;
  message?: string;
};

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

export async function getMcpSocialConfig() {
  const url = MCP_SOCIAL_URL || (await getAutomationSetting('mcp_social_url')) || '';
  const token = MCP_SOCIAL_TOKEN || (await getAutomationSetting('mcp_social_token')) || '';
  const workspaceId = (await getAutomationSetting('mcp_social_workspace_id')) || MCP_SOCIAL_WORKSPACE_ID || 'default';
  const platformsRaw = (await getAutomationSetting('mcp_social_platforms')) || MCP_SOCIAL_PLATFORMS || 'telegram,linkedin';
  const platforms = parsePlatforms(platformsRaw);

  return {
    url: url.replace(/\/+$/, ''),
    token,
    workspaceId,
    platforms,
    configured: Boolean(url && token),
  };
}

export async function isMcpSocialConfigured(): Promise<boolean> {
  const cfg = await getMcpSocialConfig();
  return cfg.configured;
}

async function callMcpTool(name: string, args: Record<string, unknown>, timeoutMs = MCP_SOCIAL_TIMEOUT_MS): Promise<McpToolResult> {
  const cfg = await getMcpSocialConfig();
  if (!cfg.configured) {
    return { ok: false, message: 'MCP social bridge is not configured' };
  }

  try {
    const response = await fetch(`${cfg.url}/mcp`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'X-MCP-Workspace-Id': cfg.workspaceId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `site-${Date.now()}`,
        method: 'tools/call',
        params: {
          name,
          arguments: {
            workspaceId: cfg.workspaceId,
            ...args,
          },
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return { ok: false, message: `MCP HTTP ${response.status}` };
    }
    if (data?.error) {
      return { ok: false, message: data.error.message || 'MCP tool call failed' };
    }

    const result = data?.result || {};
    const structured = result?.structuredContent || {};

    return {
      ok: result?.isError ? false : Boolean(structured?.ok ?? true),
      deliveryId: structured?.deliveryId,
      results: structured?.results,
      errors: structured?.errors,
      message: result?.content?.[0]?.text || structured?.message || undefined,
    };
  } catch (error: any) {
    return { ok: false, message: error?.message || String(error) };
  }
}

export async function publishToMcpSocialBridge(payload: {
  title: string;
  content: string;
  imageUrl?: string | null;
  link?: string | null;
  platforms?: string[];
  dryRun?: boolean;
}) {
  const cfg = await getMcpSocialConfig();
  const requestedPlatforms = Array.isArray(payload.platforms) && payload.platforms.length
    ? payload.platforms
    : cfg.platforms;

  return callMcpTool('social.publish.post', {
    platforms: requestedPlatforms,
    title: payload.title,
    content: payload.content,
    imageUrl: payload.imageUrl || null,
    link: payload.link || null,
    dryRun: Boolean(payload.dryRun),
  });
}

export async function testMcpSocialBridge(platform?: string) {
  return callMcpTool('social.test.connection', platform ? { platform } : {});
}
