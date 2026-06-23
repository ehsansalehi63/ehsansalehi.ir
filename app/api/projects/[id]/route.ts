import { NextResponse } from 'next/server';
import { query } from '@/app/lib/mysql';
import { ProjectModel } from '@/app/lib/models/Project';

export async function PUT(request: Request, { params }: any) {
  try {
    const body = await request.json();
    const project = await ProjectModel.update(params.id, body);
    if (!project) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطا در ویرایش پروژه' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: any) {
  try {
    const project = await ProjectModel.delete(params.id);
    if (!project) {
      return NextResponse.json({ error: 'پروژه یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطا در حذف پروژه' }, { status: 500 });
  }
}
