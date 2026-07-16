import { NextResponse } from 'next/server';
import { ProjectModel } from '@/lib/models/Project';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await ProjectModel.getAll();
    const processed = (data || []).map((p: any) => {
      let title_en = p.title_en;
      let desc_en = p.desc_en;
      if (!title_en || /[آ-ی]/.test(title_en)) {
        if (p.title.includes('شبکه') || p.title.includes('مانیتورینگ')) {
          title_en = 'Enterprise Web-Based Network Automation & Monitoring Platform';
          desc_en = 'Architected and deployed a high-security network monitoring system featuring instant alerting, advanced traffic analytics, and automated SNMP device tracking.';
        } else if (p.title.includes('پلتفرم') || p.title.includes('مشاوره')) {
          title_en = 'Full-Stack IT & Cyber Security Consulting Platform';
          desc_en = 'Official web application for Eng. Ehsan Salehi built with Next.js 16 serverless architecture, AI breaking news translations, and enterprise SEO optimization.';
        } else if (p.title.includes('سامانه') || p.title.includes('اخبار')) {
          title_en = 'AI-Driven Technology & Crypto News Publishing Engine';
          desc_en = 'Autonomous news crawler gathering global tech and cryptocurrency updates, translating and summarizing via OpenAI LLMs, applying custom watermarks, and syndicating to social networks.';
        } else {
          title_en = 'Cloud IT Infrastructure & System Engineering Solution';
          desc_en = 'Delivered high-performance corporate infrastructure, custom backend development, and security hardening for enterprise scalability.';
        }
      }
      return { ...p, title_en, desc_en };
    });
    return NextResponse.json({ success: true, data: processed });
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
