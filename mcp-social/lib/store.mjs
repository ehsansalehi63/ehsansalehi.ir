import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { config } from './config.mjs';
import { currentStorageBackend, ensureMysqlSchema, getMysqlPool, mysqlDiagnostics } from './database.mjs';
import { deserializeSecretPayload, secretEncryptionEnabled, serializeSecretPayload } from './secrets.mjs';

const DB_PATH = path.join(config.dataDir, 'db.json');

const DEFAULT_DB = {
  connections: {},
  oauthStates: {},
  schedules: {},
  deliveries: {},
  jobs: {},
};

const CONNECTION_PUBLIC_FIELDS = new Set([
  'platform',
  'connected',
  'accountId',
  'accountLabel',
  'provider',
  'scopes',
  'meta',
  'expiresAt',
  'lastError',
  'createdAt',
  'updatedAt',
]);

function randomId() {
  return crypto.randomUUID();
}

function parseMaybeJson(value, fallback) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toIso(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function splitConnectionPayload(connection) {
  const core = {};
  const secret = {};
  for (const [key, value] of Object.entries(connection || {})) {
    if (value === undefined) continue;
    if (CONNECTION_PUBLIC_FIELDS.has(key)) core[key] = value;
    else secret[key] = value;
  }
  return { core, secret };
}

function normalizeMysqlConnection(row) {
  if (!row) return null;
  const secret = deserializeSecretPayload(row.secret_blob || '');
  return {
    platform: row.platform,
    connected: Boolean(row.connected),
    accountId: row.account_id || null,
    accountLabel: row.account_label || null,
    provider: row.provider || null,
    scopes: parseMaybeJson(row.scopes, []),
    meta: parseMaybeJson(row.meta, null),
    expiresAt: toIso(row.expires_at),
    lastError: row.last_error || null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    ...secret,
  };
}

function makeEnvBridgeConnections() {
  if (!config.makeBridge.enabled || !config.makeBridge.publishWebhookUrl) return {};

  const createdAt = new Date(0).toISOString();
  const updatedAt = new Date().toISOString();
  const meta = {
    bridgeMode: 'make',
    source: 'env',
    hasTestWebhook: Boolean(config.makeBridge.testWebhookUrl),
  };

  return Object.fromEntries(
    config.makeBridge.platforms.map((platform) => [platform, {
      platform,
      connected: true,
      accountLabel: config.makeBridge.connectionLabel,
      provider: 'make-env',
      scopes: ['bridge.publish'],
      meta,
      expiresAt: null,
      lastError: null,
      createdAt,
      updatedAt,
      publishWebhookUrl: config.makeBridge.publishWebhookUrl,
      testWebhookUrl: config.makeBridge.testWebhookUrl || null,
      bridgeAuthHeaderName: config.makeBridge.authHeaderName || null,
      bridgeAuthHeaderValue: config.makeBridge.authHeaderValue || null,
    }])
  );
}

function mergeBridgeConnections(storedConnections) {
  const envConnections = makeEnvBridgeConnections();
  return { ...envConnections, ...(storedConnections || {}) };
}

async function ensureFileDb() {
  await fs.mkdir(config.dataDir, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2));
  }
}

async function readFileDb() {
  await ensureFileDb();
  const raw = await fs.readFile(DB_PATH, 'utf8');
  try {
    return { ...DEFAULT_DB, ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULT_DB);
  }
}

async function writeFileDb(db) {
  await ensureFileDb();
  await fs.writeFile(DB_PATH, `${JSON.stringify(db, null, 2)}\n`);
}

async function withFileDb(mutator) {
  const db = await readFileDb();
  const result = await mutator(db);
  await writeFileDb(db);
  return result;
}

async function mysqlQuery(sql, params = []) {
  await ensureMysqlSchema();
  const pool = await getMysqlPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function mysqlExecute(sql, params = []) {
  await ensureMysqlSchema();
  const pool = await getMysqlPool();
  return pool.execute(sql, params);
}

export async function listConnections(workspaceId) {
  if ((await currentStorageBackend()) === 'mysql') {
    const rows = await mysqlQuery(
      'SELECT * FROM mcp_social_connections WHERE workspace_id = ? ORDER BY platform',
      [workspaceId]
    );
    const out = {};
    for (const row of rows) {
      out[row.platform] = normalizeMysqlConnection(row);
    }
    return mergeBridgeConnections(out);
  }

  const db = await readFileDb();
  return mergeBridgeConnections(db.connections[workspaceId] || {});
}

export async function getConnection(workspaceId, platform) {
  if ((await currentStorageBackend()) === 'mysql') {
    const rows = await mysqlQuery(
      'SELECT * FROM mcp_social_connections WHERE workspace_id = ? AND platform = ? LIMIT 1',
      [workspaceId, platform]
    );
    const stored = normalizeMysqlConnection(rows[0] || null);
    return stored || makeEnvBridgeConnections()[platform] || null;
  }

  const db = await readFileDb();
  return db.connections?.[workspaceId]?.[platform] || makeEnvBridgeConnections()[platform] || null;
}

export async function setConnection(workspaceId, platform, connection) {
  if ((await currentStorageBackend()) === 'mysql') {
    const current = await getConnection(workspaceId, platform);
    const merged = {
      ...(current || {}),
      ...connection,
      platform,
      updatedAt: new Date().toISOString(),
      createdAt: current?.createdAt || new Date().toISOString(),
    };
    const { core, secret } = splitConnectionPayload(merged);

    await mysqlExecute(
      `INSERT INTO mcp_social_connections
        (workspace_id, platform, connected, account_id, account_label, provider, scopes, secret_blob, meta, expires_at, last_error)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         connected = VALUES(connected),
         account_id = VALUES(account_id),
         account_label = VALUES(account_label),
         provider = VALUES(provider),
         scopes = VALUES(scopes),
         secret_blob = VALUES(secret_blob),
         meta = VALUES(meta),
         expires_at = VALUES(expires_at),
         last_error = VALUES(last_error)`,
      [
        workspaceId,
        platform,
        core.connected ? 1 : 0,
        core.accountId || null,
        core.accountLabel || null,
        core.provider || null,
        JSON.stringify(core.scopes || []),
        serializeSecretPayload(secret),
        JSON.stringify(core.meta ?? null),
        core.expiresAt ? core.expiresAt.slice(0, 19).replace('T', ' ') : null,
        core.lastError || null,
      ]
    );

    return getConnection(workspaceId, platform);
  }

  return withFileDb(async (db) => {
    db.connections[workspaceId] ||= {};
    db.connections[workspaceId][platform] = {
      ...(db.connections[workspaceId][platform] || {}),
      ...connection,
      platform,
      updatedAt: new Date().toISOString(),
    };
    return db.connections[workspaceId][platform];
  });
}

export async function deleteConnection(workspaceId, platform) {
  if ((await currentStorageBackend()) === 'mysql') {
    const [, meta] = await mysqlExecute(
      'DELETE FROM mcp_social_connections WHERE workspace_id = ? AND platform = ?',
      [workspaceId, platform]
    );
    return Boolean(meta.affectedRows);
  }

  return withFileDb(async (db) => {
    const existed = Boolean(db.connections?.[workspaceId]?.[platform]);
    if (db.connections?.[workspaceId]) delete db.connections[workspaceId][platform];
    return existed;
  });
}

export async function saveOAuthState(statePayload) {
  const id = randomId();

  if ((await currentStorageBackend()) === 'mysql') {
    await mysqlExecute(
      'INSERT INTO mcp_social_oauth_states (state_id, workspace_id, platform, verifier, connection_label) VALUES (?, ?, ?, ?, ?)',
      [id, statePayload.workspaceId, statePayload.platform, statePayload.verifier || null, statePayload.connectionLabel || null]
    );
    return id;
  }

  await withFileDb(async (db) => {
    db.oauthStates[id] = {
      id,
      createdAt: new Date().toISOString(),
      ...statePayload,
    };
  });
  return id;
}

export async function consumeOAuthState(stateId) {
  if ((await currentStorageBackend()) === 'mysql') {
    const rows = await mysqlQuery('SELECT * FROM mcp_social_oauth_states WHERE state_id = ? LIMIT 1', [stateId]);
    if (!rows[0]) return null;
    await mysqlExecute('DELETE FROM mcp_social_oauth_states WHERE state_id = ?', [stateId]);
    return {
      id: rows[0].state_id,
      workspaceId: rows[0].workspace_id,
      platform: rows[0].platform,
      verifier: rows[0].verifier,
      connectionLabel: rows[0].connection_label,
      createdAt: toIso(rows[0].created_at),
    };
  }

  return withFileDb(async (db) => {
    const payload = db.oauthStates[stateId] || null;
    if (payload) delete db.oauthStates[stateId];
    return payload;
  });
}

function normalizeJobRecord(row) {
  if (!row) return null;
  const payload = parseMaybeJson(row.payload, {});
  const result = parseMaybeJson(row.result, null);
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    jobType: row.job_type,
    status: row.status,
    title: payload.title,
    content: payload.content,
    imageUrl: payload.imageUrl || null,
    link: payload.link || null,
    platforms: payload.platforms || [],
    runAt: toIso(row.run_at),
    startedAt: toIso(row.started_at),
    finishedAt: toIso(row.finished_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    result,
    cancelledAt: result?.cancelledAt || null,
  };
}

export async function createSchedule(workspaceId, schedule) {
  const jobId = randomId();

  if ((await currentStorageBackend()) === 'mysql') {
    await mysqlExecute(
      `INSERT INTO mcp_social_jobs
        (id, workspace_id, job_type, status, payload, run_at)
       VALUES (?, ?, 'scheduled', 'scheduled', ?, ?)`,
      [
        jobId,
        workspaceId,
        JSON.stringify({
          title: schedule.title,
          content: schedule.content,
          imageUrl: schedule.imageUrl || null,
          link: schedule.link || null,
          platforms: schedule.platforms || [],
        }),
        schedule.runAt ? schedule.runAt.slice(0, 19).replace('T', ' ') : null,
      ]
    );
    return getJob(jobId);
  }

  return withFileDb(async (db) => {
    db.schedules[workspaceId] ||= [];
    const record = {
      id: jobId,
      workspaceId,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...schedule,
    };
    db.schedules[workspaceId].push(record);
    db.jobs[jobId] = record;
    return record;
  });
}

export async function listSchedules(workspaceId) {
  if ((await currentStorageBackend()) === 'mysql') {
    const rows = await mysqlQuery(
      "SELECT * FROM mcp_social_jobs WHERE workspace_id = ? AND job_type = 'scheduled' ORDER BY run_at ASC, created_at ASC",
      [workspaceId]
    );
    return rows.map(normalizeJobRecord);
  }

  const db = await readFileDb();
  return db.schedules?.[workspaceId] || [];
}

export async function getJob(jobId) {
  if ((await currentStorageBackend()) === 'mysql') {
    const rows = await mysqlQuery('SELECT * FROM mcp_social_jobs WHERE id = ? LIMIT 1', [jobId]);
    return normalizeJobRecord(rows[0] || null);
  }

  const db = await readFileDb();
  return db.jobs?.[jobId] || null;
}

export async function updateJob(jobId, patch) {
  if ((await currentStorageBackend()) === 'mysql') {
    const current = await getJob(jobId);
    if (!current) return null;

    const next = {
      ...current,
      ...patch,
      result: patch.cancelledAt
        ? { ...(current.result || {}), ...(patch.result || {}), cancelledAt: patch.cancelledAt }
        : patch.result !== undefined
          ? patch.result
          : current.result,
      updatedAt: new Date().toISOString(),
    };

    await mysqlExecute(
      `UPDATE mcp_social_jobs
          SET status = ?, payload = ?, result = ?, run_at = ?, started_at = ?, finished_at = ?
        WHERE id = ?`,
      [
        next.status,
        JSON.stringify({
          title: next.title,
          content: next.content,
          imageUrl: next.imageUrl || null,
          link: next.link || null,
          platforms: next.platforms || [],
        }),
        next.result ? JSON.stringify(next.result) : null,
        next.runAt ? next.runAt.slice(0, 19).replace('T', ' ') : null,
        next.startedAt ? next.startedAt.slice(0, 19).replace('T', ' ') : null,
        next.finishedAt ? next.finishedAt.slice(0, 19).replace('T', ' ') : null,
        jobId,
      ]
    );
    return getJob(jobId);
  }

  return withFileDb(async (db) => {
    const current = db.jobs?.[jobId];
    if (!current) return null;
    const next = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    db.jobs[jobId] = next;
    const list = db.schedules?.[current.workspaceId] || [];
    const idx = list.findIndex((item) => item.id === jobId);
    if (idx >= 0) list[idx] = next;
    return next;
  });
}

export async function cancelJob(jobId) {
  return updateJob(jobId, { status: 'cancelled', cancelledAt: new Date().toISOString() });
}

export async function addDelivery(workspaceId, delivery) {
  if ((await currentStorageBackend()) === 'mysql') {
    const record = {
      id: randomId(),
      workspaceId,
      createdAt: new Date().toISOString(),
      ...delivery,
    };
    await mysqlExecute(
      `INSERT INTO mcp_social_deliveries
        (id, workspace_id, source, title, platforms, results, errors)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        workspaceId,
        record.source || 'mcp-social',
        record.title || null,
        JSON.stringify(record.platforms || []),
        JSON.stringify(record.results || {}),
        JSON.stringify(record.errors || {}),
      ]
    );
    return record;
  }

  return withFileDb(async (db) => {
    db.deliveries[workspaceId] ||= [];
    const record = {
      id: randomId(),
      workspaceId,
      createdAt: new Date().toISOString(),
      ...delivery,
    };
    db.deliveries[workspaceId].unshift(record);
    db.deliveries[workspaceId] = db.deliveries[workspaceId].slice(0, 100);
    return record;
  });
}

export async function listDeliveries(workspaceId) {
  if ((await currentStorageBackend()) === 'mysql') {
    const rows = await mysqlQuery(
      'SELECT * FROM mcp_social_deliveries WHERE workspace_id = ? ORDER BY created_at DESC LIMIT 100',
      [workspaceId]
    );
    return rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      source: row.source,
      title: row.title,
      platforms: parseMaybeJson(row.platforms, []),
      results: parseMaybeJson(row.results, {}),
      errors: parseMaybeJson(row.errors, {}),
      createdAt: toIso(row.created_at),
    }));
  }

  const db = await readFileDb();
  return db.deliveries?.[workspaceId] || [];
}

export async function diagnosticsSnapshot(workspaceId) {
  const [connections, schedules, deliveries, backend, dbDiag] = await Promise.all([
    listConnections(workspaceId),
    listSchedules(workspaceId),
    listDeliveries(workspaceId),
    currentStorageBackend(),
    mysqlDiagnostics(),
  ]);

  const platformSummary = Object.fromEntries(
    Object.entries(connections).map(([platform, value]) => [platform, {
      platform,
      connected: Boolean(value?.connected),
      updatedAt: value?.updatedAt || null,
      expiresAt: value?.expiresAt || null,
      accountLabel: value?.accountLabel || null,
      scopes: value?.scopes || [],
      lastError: value?.lastError || null,
    }])
  );

  return {
    workspaceId,
    storageBackend: backend,
    secretEncryptionEnabled: secretEncryptionEnabled(),
    database: dbDiag,
    connections: platformSummary,
    scheduledCount: schedules.filter((item) => item.status === 'scheduled').length,
    deliveryCount: deliveries.length,
    lastDelivery: deliveries[0] || null,
  };
}
