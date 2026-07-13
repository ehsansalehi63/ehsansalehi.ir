import { NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await UserModel.getAll();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ General error:', error);
    return NextResponse.json({ error: 'خطا در دریافت کاربران' }, { status: 500 });
  }
}
