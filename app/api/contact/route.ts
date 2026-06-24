import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'تمام فیلدها الزامی است' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([{ name, email, message }])
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('❌ General error:', error);
    return NextResponse.json({ error: 'خطا در ارسال پیام' }, { status: 500 });
  }
}
