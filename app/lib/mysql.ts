import mysql from 'mysql2/promise';

const globalForPool = globalThis as unknown as {
  mysqlPool: mysql.Pool | undefined;
};

export const pool =
  globalForPool.mysqlPool ??
  mysql.createPool({
    host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT) || 3306,
    user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || '',
    waitForConnections: true,
    connectionLimit: 4,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 15000,
  });

if (process.env.NODE_ENV !== 'production') globalForPool.mysqlPool = pool;

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}
