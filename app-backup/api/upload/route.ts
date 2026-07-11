import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    console.log('🚀 شروع آپلود...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('❌ فایلی انتخاب نشده');
      return NextResponse.json({ error: 'فایلی انتخاب نشده' }, { status: 400 });
    }

    console.log('📁 نام فایل:', file.name);
    console.log('📏 حجم فایل:', file.size);

    if (!file.type.startsWith('image/')) {
      console.log('❌ فایل تصویر نیست:', file.type);
      return NextResponse.json({ error: 'فایل باید تصویر باشد' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `projects/${fileName}`;

    console.log('📤 آپلود به Supabase:', filePath);

    const { data, error } = await supabase.storage
      .from('projects')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from('projects')
      .getPublicUrl(filePath);

    console.log('✅ آپلود موفق:', urlData.publicUrl);
    return NextResponse.json({ success: true, url: urlData.publicUrl });
  } catch (error: any) {
    console.error('❌ General error:', error);
    return NextResponse.json({ error: 'خطا در آپلود' }, { status: 500 });
  }
}
