import mysql from 'mysql2/promise';

type DatabaseCandidate = {
  source: string;
  options: mysql.PoolOptions;
};

type DatabaseGlobal = {
  mysqlPool?: mysql.Pool;
  mysqlPoolPromise?: Promise<mysql.Pool>;
  mysqlPoolSource?: string;
};

const globalForPool = globalThis as unknown as DatabaseGlobal;

const ENV_GROUPS = {
  host: ['MYSQL_HOST', 'DB_HOST', 'DATABASE_HOST'],
  port: ['MYSQL_PORT', 'DB_PORT', 'DATABASE_PORT'],
  user: ['MYSQL_USER', 'DB_USER', 'DB_USERNAME', 'DATABASE_USER', 'DATABASE_USERNAME'],
  password: ['MYSQL_PASSWORD', 'DB_PASSWORD', 'DATABASE_PASSWORD'],
  database: ['MYSQL_DATABASE', 'MYSQL_DB', 'DB_NAME', 'DB_DATABASE', 'DATABASE_NAME'],
  socket: ['MYSQL_SOCKET', 'DB_SOCKET', 'DATABASE_SOCKET'],
} as const;

const ALL_DATABASE_ENV_NAMES = [
  'DATABASE_URL',
  ...Object.values(ENV_GROUPS).flat(),
] as const;

function envValue(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined && value !== '') return value;
  }
  return undefined;
}

function orderedNames(primary: readonly string[], all: readonly string[]): string[] {
  return [...primary, ...all.filter((name) => !primary.includes(name))];
}

function makeOptions(priorities: {
  host: readonly string[];
  port: readonly string[];
  user: readonly string[];
  password: readonly string[];
  database: readonly string[];
  socket: readonly string[];
}): mysql.PoolOptions {
  const portValue = envValue(orderedNames(priorities.port, ENV_GROUPS.port));
  const parsedPort = Number(portValue);
  const socketPath = envValue(orderedNames(priorities.socket, ENV_GROUPS.socket));

  return {
    host: envValue(orderedNames(priorities.host, ENV_GROUPS.host)) || 'localhost',
    port: Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3306,
    user: envValue(orderedNames(priorities.user, ENV_GROUPS.user)) || 'root',
    password: envValue(orderedNames(priorities.password, ENV_GROUPS.password)) || '',
    database: envValue(orderedNames(priorities.database, ENV_GROUPS.database)) || '',
    ...(socketPath ? { socketPath } : {}),
    waitForConnections: true,
    connectionLimit: 4,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 5000,
    charset: 'utf8mb4',
  };
}

function parseDatabaseUrl(): DatabaseCandidate | null {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    const port = Number(url.port);
    return {
      source: 'DATABASE_URL',
      options: {
        host: url.hostname || 'localhost',
        port: Number.isInteger(port) && port > 0 ? port : 3306,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: decodeURIComponent(url.pathname.replace(/^\//, '')),
        waitForConnections: true,
        connectionLimit: 4,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        connectTimeout: 5000,
        charset: 'utf8mb4',
      },
    };
  } catch {
    return null;
  }
}

function hasAny(names: readonly string[]): boolean {
  return names.some((name) => process.env[name] !== undefined && process.env[name] !== '');
}

function getDatabaseCandidates(): DatabaseCandidate[] {
  const candidates: DatabaseCandidate[] = [];
  const databaseUrlCandidate = parseDatabaseUrl();
  if (databaseUrlCandidate) candidates.push(databaseUrlCandidate);

  const families = [
    {
      source: 'MYSQL_*',
      match: ['MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE', 'MYSQL_DB', 'MYSQL_SOCKET'],
      priorities: {
        host: ['MYSQL_HOST'], port: ['MYSQL_PORT'], user: ['MYSQL_USER'], password: ['MYSQL_PASSWORD'],
        database: ['MYSQL_DATABASE', 'MYSQL_DB'], socket: ['MYSQL_SOCKET'],
      },
    },
    {
      source: 'DB_*',
      match: ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME', 'DB_DATABASE', 'DB_SOCKET'],
      priorities: {
        host: ['DB_HOST'], port: ['DB_PORT'], user: ['DB_USER', 'DB_USERNAME'], password: ['DB_PASSWORD'],
        database: ['DB_NAME', 'DB_DATABASE'], socket: ['DB_SOCKET'],
      },
    },
    {
      source: 'DATABASE_*',
      match: ['DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_USER', 'DATABASE_USERNAME', 'DATABASE_PASSWORD', 'DATABASE_NAME', 'DATABASE_SOCKET'],
      priorities: {
        host: ['DATABASE_HOST'], port: ['DATABASE_PORT'], user: ['DATABASE_USER', 'DATABASE_USERNAME'], password: ['DATABASE_PASSWORD'],
        database: ['DATABASE_NAME'], socket: ['DATABASE_SOCKET'],
      },
    },
  ] as const;

  for (const family of families) {
    if (hasAny(family.match)) {
      candidates.push({ source: family.source, options: makeOptions(family.priorities) });
    }
  }

  if (candidates.length === 0) {
    candidates.push({
      source: 'defaults',
      options: makeOptions({ host: [], port: [], user: [], password: [], database: [], socket: [] }),
    });
  }

  // Do not retry an identical credential set merely because it was exposed under two aliases.
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const options = candidate.options;
    const fingerprint = JSON.stringify([
      options.host,
      options.port,
      options.user,
      options.password,
      options.database,
      options.socketPath,
    ]);
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
}

async function initializePool(): Promise<mysql.Pool> {
  const candidates = getDatabaseCandidates();
  let lastError: unknown;

  for (const candidate of candidates) {
    const candidatePool = mysql.createPool(candidate.options);
    try {
      const connection = await candidatePool.getConnection();
      try {
        await connection.ping();
      } finally {
        connection.release();
      }

      globalForPool.mysqlPool = candidatePool;
      globalForPool.mysqlPoolSource = candidate.source;
      return candidatePool;
    } catch (error) {
      lastError = error;
      await candidatePool.end().catch(() => undefined);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unable to connect to MySQL');
}

async function getPool(): Promise<mysql.Pool> {
  if (globalForPool.mysqlPool) return globalForPool.mysqlPool;

  if (!globalForPool.mysqlPoolPromise) {
    globalForPool.mysqlPoolPromise = initializePool().catch((error) => {
      // A transient MySQL outage must not poison the Passenger process forever.
      globalForPool.mysqlPoolPromise = undefined;
      throw error;
    });
  }

  return globalForPool.mysqlPoolPromise;
}

async function execute(sql: any, values?: any): Promise<any> {
  const activePool = await getPool();
  return values === undefined ? activePool.execute(sql) : activePool.execute(sql, values);
}

// Every current caller only needs execute(). Keeping this small facade lets the app
// recover when cPanel still contains an old MYSQL_* password alongside the new DB_* set.
export const pool: Pick<mysql.Pool, 'execute'> = {
  execute: execute as mysql.Pool['execute'],
};

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

function distinctConfiguredValues(names: readonly string[]): number {
  return new Set(
    names
      .map((name) => process.env[name])
      .filter((value): value is string => value !== undefined && value !== '')
  ).size;
}

/** Safe to expose only from an authenticated diagnostics endpoint. Never includes values. */
export function getDatabaseEnvDiagnostics() {
  const candidates = getDatabaseCandidates();
  return {
    activeCredentialSource: globalForPool.mysqlPoolSource || null,
    candidateSources: candidates.map((candidate) => candidate.source),
    presentVariables: ALL_DATABASE_ENV_NAMES.filter((name) => Boolean(process.env[name])),
    databaseUrlValid: process.env.DATABASE_URL ? Boolean(parseDatabaseUrl()) : null,
    conflictingAliases: {
      host: distinctConfiguredValues(ENV_GROUPS.host) > 1,
      port: distinctConfiguredValues(ENV_GROUPS.port) > 1,
      user: distinctConfiguredValues(ENV_GROUPS.user) > 1,
      password: distinctConfiguredValues(ENV_GROUPS.password) > 1,
      database: distinctConfiguredValues(ENV_GROUPS.database) > 1,
    },
  };
}
