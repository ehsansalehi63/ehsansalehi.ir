import { NextResponse } from 'next/server';
import { ProjectModel } from '@/lib/models/Project';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await ProjectModel.getAll();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('❌ General error:', error);
    return NextResponse.json({ error: 'خطا در دریافت پروژه‌ها' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, desc, tech, link, image_url } = body;

    if (!title || !desc) {
      return NextResponse.json({ error: 'عنوان و توضیحات الزامی است' }, { status: 400 });
    }

    await ProjectModel.create({ title, desc, tech: tech || '', link: link || '', image_url: image_url || '' });
    const projects = await ProjectModel.getAll();

    return NextResponse.json({ success: true, data: projects[0] });
  } catch (error: any) {
    console.error('❌ General error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد پروژه' }, { status: 500 });
  }
}
