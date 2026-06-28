import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // دریافت همه کاربران به جز رمز عبور
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, isVerified, isAdmin, createdAt')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('❌ Supabase error (users GET):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('❌ General error (users GET):', error);
    return NextResponse.json({ error: 'خطا در دریافت کاربران' }, { status: 500 });
  }
}
