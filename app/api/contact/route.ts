import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { MessageModel } from '@/app/lib/models/Message';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'تمام فیلدها الزامی است' }, { status: 400 });
    }
    await MessageModel.create(name, email, message);

    const { error } = await resend.emails.send({
      from: `"فرم تماس سایت" <noreply@ehsansalehi.ir>`,
      to: ['info@ehsansalehi.ir'],
      subject: `تماس جدید از ${name}`,
      replyTo: email,
      html: `<div dir="rtl"><h2>📩 پیام جدید</h2><p><strong>نام:</strong> ${name}</p><p><strong>ایمیل:</strong> ${email}</p><p><strong>پیام:</strong><br/>${message.replace(/\n/g, '<br>')}</p></div>`,
    });

    if (error) {
      console.error('خطا در ارسال ایمیل:', error);
      return NextResponse.json({ error: 'خطا در ارسال ایمیل' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطا در ارسال پیام' }, { status: 500 });
  }
}
