import { NextResponse } from 'next/server';
import { pool } from '../../lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'ایمیل معتبر نیست' }, { status: 400 });
    }

    await pool.execute(
      'INSERT INTO subscribers (email, ip) VALUES (?, ?)',
      [email, request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown']
    );

    return NextResponse.json({ success: true, message: 'اشتراک ثبت شد' });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ success: false, error: 'این ایمیل قبلاً ثبت شده است' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'خطا در ثبت اشتراک' }, { status: 500 });
  }
}
