import { NextResponse } from 'next/server';
import { pool } from '../../lib/mysql';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await pool.execute('SHOW TABLES');
    return NextResponse.json({
      success: true,
      tables: rows,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
