import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongoose';
import { Message } from '@/app/lib/models/Message';

export async function GET() {
  try {
    await connectToDatabase();
    const messages = await Message.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در دریافت پیام‌ها' }, { status: 500 });
  }
}
