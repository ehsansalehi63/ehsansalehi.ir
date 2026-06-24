import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    await connection.query('SELECT 1');
    await connection.end();
    return NextResponse.json({ success: true, message: '✅ اتصال به دیتابیس برقرار است' });
  } catch (error) {
    console.error('❌ خطا در اتصال به دیتابیس:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطا' }, { status: 500 });
  }
}
