import { NextResponse } from 'next/server';
import { MessageModel } from '@/app/lib/models/Message';

export async function GET() {
  try {
    const messages = await MessageModel.getAll();
    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطا در دریافت پیام‌ها' }, { status: 500 });
  }
}
