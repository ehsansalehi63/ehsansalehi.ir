import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, isVerified, isAdmin, createdAt')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ General error:', error);
    return NextResponse.json({ error: 'خطا در دریافت کاربران' }, { status: 500 });
  }
}
