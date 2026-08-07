import http from 'node:http';
import crypto from 'node:crypto';
import { URL } from 'node:url';
import { config, getWorkspaceId } from './lib/config.mjs';
import { authenticateRequest, ensurePermission } from './lib/permissions.mjs';
import {
  listConnections,
  getConnection,
  deleteConnection,
  consumeOAuthState,
  listSchedules,
  listDeliveries,
  diagnosticsSnapshot,
  getJob,
  cancelJob,
} from './lib/store.mjs';
import { createLinkedInAuthorization, exchangeLinkedInCode, createInstagramAuthorization, exchangeInstagramCode } from './lib/oauth.mjs';
import { saveLinkedInConnection, refreshLinkedInConnection } from './connectors/linkedin.mjs';
import { saveInstagramConnection, refreshInstagramConnection } from './connectors/instagram.mjs';
import { saveTelegramConnection } from './connectors/telegram.mjs';
import { configureMakeBridge } from './connectors/make-bridge.mjs';
import { publishPost, testPlatforms, SUPPORTED_PLATFORMS } from './services/publisher.mjs';
import { createScheduledPost, hydrateScheduler } from './services/scheduler.mjs';
import { importLegacyAutomationSettings } from './services/legacy-import.mjs';
import { TOOL_DEFS, getToolDef, RESOURCE_DEFS, PROMPT_DEFS } from './lib/tool-registry.mjs';

const workspaceBootstrap = new Set();

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

async function bootstrapWorkspace(workspaceId) {
  if (workspaceBootstrap.has(workspaceId)) return;
  workspaceBootstrap.add(workspaceId);
  await hydrateScheduler(workspaceId);
}

function sendJson(res, status, payload, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(JSON.stringify(payload));
}

function sendHtml(res, status, html) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(html);
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function rpcSuccess(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function rpcError(id, code, message, data = undefined) {
  return { jsonrpc: '2.0', id, error: { code, message, data } };
}

function mcpTextResult(text, structuredContent = undefined, isError = false) {
  return {
    content: [{ type: 'text', text }],
    structuredContent,
    isError,
  };
}

function promptMessages(messages, description = '') {
  return { description, messages };
}

async function buildConnectStart(platform, workspaceId, connectionLabel = '') {
  if (platform === 'linkedin') return createLinkedInAuthorization(workspaceId, connectionLabel);
  if (platform === 'instagram') return createInstagramAuthorization(workspaceId, connectionLabel);
  throw new Error(`Unsupported OAuth platform: ${platform}`);
}

async function handleToolCall(name, args, auth) {
  const workspaceId = getWorkspaceId(args.workspaceId || auth.workspaceId);
  await bootstrapWorkspace(workspaceId);

  switch (name) {
    case 'social.connections.list': {
      const connections = await listConnections(workspaceId);
      const publicConnections = Object.fromEntries(
        Object.entries(connections).map(([platform, value]) => [platform, {
          connected: Boolean(value?.connected),
          accountLabel: value?.accountLabel || null,
          expiresAt: value?.expiresAt || null,
          updatedAt: value?.updatedAt || null,
          scopes: value?.scopes || [],
          lastError: value?.lastError || null,
        }])
      );
      return mcpTextResult(`Found ${Object.keys(publicConnections).length} saved connection(s).`, { workspaceId, connections: publicConnections });
    }

    case 'social.connect.start': {
      const { platform, connectionLabel = '' } = args;
      const authStart = await buildConnectStart(platform, workspaceId, connectionLabel);
      return mcpTextResult(
        `Open this URL to connect ${platform}: ${authStart.url}`,
        {
          workspaceId,
          platform,
          authUrl: authStart.url,
          state: authStart.state,
          callbackUrl: `${config.publicBaseUrl}/oauth/${platform}/callback`,
        }
      );
    }

    case 'social.connect.status': {
      const connection = await getConnection(workspaceId, args.platform);
      if (!connection) {
        return mcpTextResult(`${args.platform} is not connected.`, { workspaceId, platform: args.platform, connected: false }, true);
      }
      return mcpTextResult(`${args.platform} is connected.`, {
        workspaceId,
        platform: args.platform,
        connected: true,
        provider: connection.provider || null,
        accountLabel: connection.accountLabel || null,
        expiresAt: connection.expiresAt || null,
        lastError: connection.lastError || null,
        bridgeMode: String(connection.provider || '').startsWith('make'),
      });
    }

    case 'social.make_bridge.configure': {
      const configured = await configureMakeBridge(workspaceId, args);
      return mcpTextResult('Make bridge configured.', configured);
    }

    case 'social.telegram.connect': {
      const saved = await saveTelegramConnection(workspaceId, args);
      return mcpTextResult('Telegram connection saved and verified.', {
        workspaceId,
        platform: 'telegram',
        connected: true,
        provider: saved.provider,
        accountLabel: saved.accountLabel,
        chatId: saved.chatId,
      });
    }

    case 'social.disconnect': {
      const current = await getConnection(workspaceId, args.platform);
      if (current && current.provider === 'make-env') {
        return mcpTextResult(
          `${args.platform} is configured from environment variables. Remove MAKE_BRIDGE_* envs to disconnect it.`,
          { workspaceId, platform: args.platform, disconnected: false, source: 'env' },
          true
        );
      }
      const existed = await deleteConnection(workspaceId, args.platform);
      return mcpTextResult(existed ? `${args.platform} disconnected.` : `${args.platform} had no saved connection.`, {
        workspaceId,
        platform: args.platform,
        disconnected: existed,
      });
    }

    case 'social.refresh.token': {
      const platform = args.platform;
      const result = platform === 'linkedin'
        ? await refreshLinkedInConnection(workspaceId)
        : await refreshInstagramConnection(workspaceId);
      return mcpTextResult(result.ok ? `${platform} token refreshed.` : `${platform} token refresh failed: ${result.error}`, result, !result.ok);
    }

    case 'social.test.connection': {
      if (args.platform) {
        const [platform] = [args.platform];
        const results = await testPlatforms(workspaceId, [platform]);
        const result = results[platform];
        return mcpTextResult(result.ok ? `${platform} connection is healthy.` : `${platform} connection check failed: ${result.error}`, result, !result.ok);
      }
      const results = await testPlatforms(workspaceId);
      return mcpTextResult('Completed connection checks.', { workspaceId, results });
    }

    case 'social.publish.post': {
      const payload = {
        title: args.title,
        content: args.content,
        imageUrl: args.imageUrl || null,
        link: args.link || null,
        platforms: args.platforms,
        dryRun: Boolean(args.dryRun),
      };
      const result = await publishPost(workspaceId, payload);
      return mcpTextResult(result.ok ? 'Publish workflow completed.' : 'Publish workflow completed with errors.', result, !result.ok);
    }

    case 'social.import.legacy_settings': {
      const imported = await importLegacyAutomationSettings(workspaceId, {
        platforms: args.platforms,
        verify: args.verify !== false,
      });
      return mcpTextResult(
        imported.ok ? 'Legacy social settings were imported.' : 'Legacy import finished with no imported connections.',
        imported,
        !imported.ok
      );
    }

    case 'social.schedule.post': {
      const record = await createScheduledPost(workspaceId, {
        title: args.title,
        content: args.content,
        imageUrl: args.imageUrl || null,
        link: args.link || null,
        platforms: args.platforms,
        runAt: args.runAt,
      });
      return mcpTextResult('Post scheduled.', record);
    }

    case 'social.publish.status': {
      const job = await getJob(args.jobId);
      if (!job) return mcpTextResult('Job not found.', { jobId: args.jobId }, true);
      return mcpTextResult(`Job ${job.id} is ${job.status}.`, job, false);
    }

    case 'social.cancel.scheduled_post': {
      const job = await cancelJob(args.jobId);
      if (!job) return mcpTextResult('Scheduled job not found.', { jobId: args.jobId }, true);
      return mcpTextResult('Scheduled job cancelled.', job);
    }

    case 'social.diagnostics': {
      const snapshot = await diagnosticsSnapshot(workspaceId);
      return mcpTextResult('Diagnostics snapshot ready.', snapshot);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function handleRpc(method, params, auth) {
  switch (method) {
    case 'initialize':
      return {
        protocolVersion: params?.protocolVersion || '2025-03-26',
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false, subscribe: false },
          prompts: { listChanged: false },
        },
        serverInfo: {
          name: 'arena-social-mcp',
          version: '0.1.0',
        },
      };

    case 'ping':
      return { pong: true, ts: new Date().toISOString() };

    case 'tools/list':
      return { tools: TOOL_DEFS.map(({ requiredPermission, ...tool }) => tool) };

    case 'tools/call': {
      const name = params?.name;
      const tool = getToolDef(name);
      if (!tool) throw Object.assign(new Error(`Unknown tool: ${name}`), { code: -32601 });
      const perm = ensurePermission(auth, tool.requiredPermission);
      if (!perm.ok) throw Object.assign(new Error(perm.error), { code: -32003, status: perm.status });
      return await handleToolCall(name, params?.arguments || {}, auth);
    }

    case 'resources/list':
      return { resources: RESOURCE_DEFS };

    case 'resources/read': {
      const workspaceId = getWorkspaceId(params?.arguments?.workspaceId || auth.workspaceId);
      await bootstrapWorkspace(workspaceId);
      const uri = params?.uri;
      if (uri === 'social://connections') {
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(await listConnections(workspaceId), null, 2) }] };
      }
      if (uri === 'social://scheduled-posts') {
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(await listSchedules(workspaceId), null, 2) }] };
      }
      if (uri === 'social://recent-deliveries') {
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(await listDeliveries(workspaceId), null, 2) }] };
      }
      if (uri === 'social://diagnostics') {
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(await diagnosticsSnapshot(workspaceId), null, 2) }] };
      }
      throw Object.assign(new Error(`Unknown resource: ${uri}`), { code: -32601 });
    }

    case 'prompts/list':
      return { prompts: PROMPT_DEFS };

    case 'prompts/get': {
      const name = params?.name;
      const args = params?.arguments || {};
      if (name === 'social.publish_multichannel') {
        const topic = args.topic || 'موضوع نامشخص';
        const cta = args.cta ? `CTA: ${args.cta}` : 'CTA: دعوت به بازدید از لینک';
        const link = args.link ? `Link: ${args.link}` : 'Link: اضافه نشده';
        return promptMessages([
          {
            role: 'user',
            content: [{ type: 'text', text: `برای موضوع «${topic}» یک پست چندشبکه‌ای بساز. نسخه لینکدین حرفه‌ای‌تر، نسخه اینستاگرام کوتاه‌تر و نسخه تلگرام واضح‌تر باشد.\n${cta}\n${link}` }],
          },
        ], 'Generate one coordinated social post pack.');
      }
      if (name === 'social.connection_audit') {
        return promptMessages([
          {
            role: 'user',
            content: [{ type: 'text', text: `اتصالات اجتماعی workspace ${args.workspaceId || auth.workspaceId} را بررسی کن، توکن‌های منقضی، اتصال‌های ناقص و پلتفرم‌های disconnected را گزارش بده و پیشنهاد اقدام بعدی بده.` }],
          },
        ], 'Audit current social connections.');
      }
      throw Object.assign(new Error(`Unknown prompt: ${name}`), { code: -32601 });
    }

    default:
      throw Object.assign(new Error(`Unknown method: ${method}`), { code: -32601 });
  }
}

function oauthSuccessPage(platform, workspaceId, label) {
  return `<!doctype html><html lang="en"><meta charset="utf-8" /><title>${platform} connected</title><body style="font-family:system-ui;background:#0b1020;color:#fff;padding:40px;line-height:1.7"><h1>✅ ${platform} connected</h1><p>Workspace: <b>${workspaceId}</b></p><p>Account: <b>${label || 'connected'}</b></p><p>You can close this tab and return to Arena.ai.</p></body></html>`;
}

function oauthErrorPage(platform, message) {
  return `<!doctype html><html lang="en"><meta charset="utf-8" /><title>${platform} error</title><body style="font-family:system-ui;background:#200b0b;color:#fff;padding:40px;line-height:1.7"><h1>❌ ${platform} connection failed</h1><pre style="white-space:pre-wrap">${String(message)}</pre><p>Return to Arena.ai and retry the connection flow.</p></body></html>`;
}

async function handleOAuthCallback(req, res, platform, searchParams) {
  try {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) throw new Error(errorDescription || error);
    if (!code || !state) throw new Error('Missing code/state in OAuth callback');

    const pending = await consumeOAuthState(state);
    if (!pending || pending.platform !== platform) throw new Error('OAuth state is missing or expired');

    const workspaceId = getWorkspaceId(pending.workspaceId);

    if (platform === 'linkedin') {
      const tokens = await exchangeLinkedInCode({ code, verifier: pending.verifier });
      const saved = await saveLinkedInConnection(workspaceId, tokens, pending.connectionLabel || '');
      sendHtml(res, 200, oauthSuccessPage(platform, workspaceId, saved.accountLabel));
      return;
    }

    if (platform === 'instagram') {
      const tokens = await exchangeInstagramCode({ code });
      const saved = await saveInstagramConnection(workspaceId, tokens, pending.connectionLabel || '');
      sendHtml(res, 200, oauthSuccessPage(platform, workspaceId, saved.accountLabel));
      return;
    }

    throw new Error(`Unsupported OAuth platform: ${platform}`);
  } catch (error) {
    sendHtml(res, 400, oauthErrorPage(platform, error instanceof Error ? error.message : String(error)));
  }
}

async function handleOAuthStart(res, platform, searchParams) {
  try {
    const workspaceId = getWorkspaceId(searchParams.get('workspaceId'));
    const connectionLabel = searchParams.get('connectionLabel') || '';
    const { url } = await buildConnectStart(platform, workspaceId, connectionLabel);
    res.writeHead(302, { Location: url });
    res.end();
  } catch (error) {
    sendHtml(res, 400, oauthErrorPage(platform, error instanceof Error ? error.message : String(error)));
  }
}

const server = http.createServer(async (req, res) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const url = new URL(req.url || '/', config.publicBaseUrl);

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, {
        ok: true,
        service: 'arena-social-mcp',
        ts: new Date().toISOString(),
        supportedPlatforms: SUPPORTED_PLATFORMS,
        publicBaseUrl: config.publicBaseUrl,
      });
      return;
    }

    if (req.method === 'GET' && /^\/oauth\/(linkedin|instagram)\/start$/.test(url.pathname)) {
      const platform = url.pathname.split('/')[2];
      await handleOAuthStart(res, platform, url.searchParams);
      return;
    }

    if (req.method === 'GET' && /^\/oauth\/(linkedin|instagram)\/callback$/.test(url.pathname)) {
      const platform = url.pathname.split('/')[2];
      await handleOAuthCallback(req, res, platform, url.searchParams);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/mcp') {
      const auth = authenticateRequest(req);
      if (!auth.ok) {
        sendJson(res, auth.status || 401, rpcError(null, -32001, auth.error));
        return;
      }

      const body = await readJsonBody(req);
      const calls = Array.isArray(body) ? body : [body];
      const responses = [];

      for (const call of calls) {
        if (!call || call.jsonrpc !== '2.0' || typeof call.method !== 'string') {
          responses.push(rpcError(call?.id ?? null, -32600, 'Invalid JSON-RPC request'));
          continue;
        }

        try {
          const result = await handleRpc(call.method, call.params || {}, auth);
          if (call.id !== undefined && call.id !== null) responses.push(rpcSuccess(call.id, result));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const code = Number(error?.code) || -32000;
          responses.push(rpcError(call.id ?? null, code, message));
        }
      }

      if (responses.length === 0) {
        res.writeHead(202).end();
        return;
      }

      sendJson(res, 200, Array.isArray(body) ? responses : responses[0]);
      return;
    }

    sendJson(res, 404, { ok: false, error: 'Not found' });
  } catch (error) {
    log(`[${requestId}] unhandled request error`, error);
    sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

await bootstrapWorkspace(config.defaultWorkspaceId);
server.listen(config.port, () => {
  log(`arena-social-mcp listening on ${config.publicBaseUrl}`);
  log(`MCP endpoint: ${config.publicBaseUrl}/mcp`);
});
