import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('❌ Supabase error (messages):', error);
      return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('❌ General error (messages):', error);
    return NextResponse.json({ error: 'خطا در دریافت پیام‌ها' }, { status: 500 });
  }
}
