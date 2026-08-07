import { config } from './config.mjs';

export function authenticateRequest(req) {
  const authHeader = req.headers.authorization || '';
  const bearer = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!config.allowUnauthenticated && config.bearerToken) {
    if (!bearer || bearer !== config.bearerToken) {
      return { ok: false, status: 401, error: 'Unauthorized MCP request' };
    }
  }

  const permissionHeader = req.headers['x-mcp-permissions'] || req.headers['x-arena-permissions'] || '';
  const permissions = String(permissionHeader || config.defaultPermissions.join(','))
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    ok: true,
    authType: bearer ? 'bearer' : 'anonymous',
    permissions,
    workspaceId: String(req.headers['x-mcp-workspace-id'] || config.defaultWorkspaceId),
  };
}

export function ensurePermission(auth, requiredPermission) {
  if (!requiredPermission) return { ok: true };
  if (auth.permissions.includes('*') || auth.permissions.includes(requiredPermission)) {
    return { ok: true };
  }
  return {
    ok: false,
    status: 403,
    error: `Missing required permission: ${requiredPermission}`,
  };
}
