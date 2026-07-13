import { NextResponse } from 'next/server';
import { MessageModel } from '@/lib/models/Message';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await MessageModel.getAll();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ General error (messages):', error);
    return NextResponse.json({ error: 'خطا در دریافت پیام‌ها' }, { status: 500 });
  }
}
