import { NextResponse } from 'next/server';
import { ProjectModel } from '@/app/lib/models/Project';

export async function GET() {
  try {
    const projects = await ProjectModel.findAll();
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطا در دریافت پروژه‌ها' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const project = await ProjectModel.create(body);
    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطا در ایجاد پروژه' }, { status: 500 });
  }
}
