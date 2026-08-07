import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.mjs';

let mysqlPromise;
let poolPromise;
let activeSource = null;
let schemaEnsured = false;

const ENV_GROUPS = {
  host: ['MCP_DB_HOST', 'MYSQL_HOST', 'DB_HOST', 'DATABASE_HOST'],
  port: ['MCP_DB_PORT', 'MYSQL_PORT', 'DB_PORT', 'DATABASE_PORT'],
  user: ['MCP_DB_USER', 'MYSQL_USER', 'DB_USER', 'DB_USERNAME', 'DATABASE_USER', 'DATABASE_USERNAME'],
  password: ['MCP_DB_PASSWORD', 'MYSQL_PASSWORD', 'DB_PASSWORD', 'DATABASE_PASSWORD'],
  database: ['MCP_DB_NAME', 'MCP_DB_DATABASE', 'MYSQL_DATABASE', 'MYSQL_DB', 'DB_NAME', 'DB_DATABASE', 'DATABASE_NAME'],
  socket: ['MCP_DB_SOCKET', 'MYSQL_SOCKET', 'DB_SOCKET', 'DATABASE_SOCKET'],
  url: ['MCP_DATABASE_URL', 'DATABASE_URL'],
};

function envValue(names) {
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined && value !== '') return value;
  }
  return undefined;
}

function hasAny(names) {
  return names.some((name) => process.env[name] !== undefined && process.env[name] !== '');
}

function buildPoolOptions(names) {
  const portValue = Number(envValue(names.port));
  const socketPath = envValue(names.socket);
  return {
    host: envValue(names.host) || 'localhost',
    port: Number.isInteger(portValue) && portValue > 0 ? portValue : 3306,
    user: envValue(names.user) || 'root',
    password: envValue(names.password) || '',
    database: envValue(names.database) || '',
    ...(socketPath ? { socketPath } : {}),
    waitForConnections: true,
    connectionLimit: 6,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 5000,
    charset: 'utf8mb4',
  };
}

function parseDatabaseUrl(rawUrl) {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    const port = Number(url.port);
    return {
      host: url.hostname || 'localhost',
      port: Number.isInteger(port) && port > 0 ? port : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.replace(/^\//, '')),
      waitForConnections: true,
      connectionLimit: 6,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      connectTimeout: 5000,
      charset: 'utf8mb4',
    };
  } catch {
    return null;
  }
}

function getCandidates() {
  const candidates = [];

  const primaryUrl = envValue(['MCP_DATABASE_URL']);
  const sharedUrl = envValue(['DATABASE_URL']);
  if (primaryUrl) candidates.push({ source: 'MCP_DATABASE_URL', options: parseDatabaseUrl(primaryUrl) });
  if (!primaryUrl && sharedUrl) candidates.push({ source: 'DATABASE_URL', options: parseDatabaseUrl(sharedUrl) });

  if (hasAny(ENV_GROUPS.host) || hasAny(ENV_GROUPS.user) || hasAny(ENV_GROUPS.database) || hasAny(ENV_GROUPS.socket)) {
    candidates.push({
      source: 'ENV_GROUPS',
      options: buildPoolOptions(ENV_GROUPS),
    });
  }

  const seen = new Set();
  return candidates.filter((candidate) => {
    if (!candidate.options) return false;
    const fingerprint = JSON.stringify([
      candidate.options.host,
      candidate.options.port,
      candidate.options.user,
      candidate.options.password,
      candidate.options.database,
      candidate.options.socketPath,
    ]);
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
}

function requestedBackend() {
  return String(process.env.MCP_STORAGE_BACKEND || 'auto').toLowerCase();
}

export function mysqlRequested() {
  const backend = requestedBackend();
  if (backend === 'mysql') return true;
  if (backend === 'file') return false;
  return getCandidates().length > 0;
}

async function importMysql() {
  if (!mysqlPromise) {
    mysqlPromise = import('mysql2/promise').catch(() => null);
  }
  return mysqlPromise;
}

export async function getMysqlPool() {
  if (!mysqlRequested()) return null;
  if (!poolPromise) {
    poolPromise = (async () => {
      const mysql = await importMysql();
      if (!mysql) {
        if (requestedBackend() === 'mysql') {
          throw new Error('mysql2 package is required for MCP_STORAGE_BACKEND=mysql');
        }
        return null;
      }

      let lastError = null;
      for (const candidate of getCandidates()) {
        const pool = mysql.createPool(candidate.options);
        try {
          const conn = await pool.getConnection();
          try {
            await conn.ping();
          } finally {
            conn.release();
          }
          activeSource = candidate.source;
          return pool;
        } catch (error) {
          lastError = error;
          await pool.end().catch(() => undefined);
        }
      }

      if (requestedBackend() === 'mysql') {
        throw lastError || new Error('Unable to connect to MySQL for MCP storage');
      }
      return null;
    })().catch((error) => {
      poolPromise = undefined;
      throw error;
    });
  }
  return poolPromise;
}

export async function ensureMysqlSchema() {
  const pool = await getMysqlPool();
  if (!pool || schemaEnsured === true) return Boolean(pool);
  const schemaPath = new URL('../schema.mysql.sql', import.meta.url);
  const sql = await fs.readFile(schemaPath, 'utf8');
  const statements = sql
    .split(/;\s*(?:\n|$)/)
    .map((item) => item.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.execute(statement);
  }
  schemaEnsured = true;
  return true;
}

export async function currentStorageBackend() {
  const backend = requestedBackend();
  if (backend === 'file') return 'file';
  try {
    const pool = await getMysqlPool();
    if (pool) {
      await ensureMysqlSchema();
      return 'mysql';
    }
  } catch (error) {
    if (backend === 'mysql') throw error;
  }
  return 'file';
}

export async function mysqlDiagnostics() {
  const candidates = getCandidates();
  let mysqlPackagePresent = false;
  try {
    mysqlPackagePresent = Boolean(await importMysql());
  } catch {
    mysqlPackagePresent = false;
  }
  return {
    requestedBackend: requestedBackend(),
    mysqlRequested: mysqlRequested(),
    mysqlPackagePresent,
    candidateSources: candidates.map((item) => item.source),
    activeSource,
  };
}
