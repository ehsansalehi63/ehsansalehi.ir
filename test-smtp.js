const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function test() {
  console.log('🔍 تست SMTP...');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);
  console.log('Pass:', process.env.SMTP_PASS ? '✅ تنظیم شده' : '❌ تنظیم نشده');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

  try {
    await transporter.verify();
    console.log('✅ اتصال SMTP برقرار است');

    // ارسال یک ایمیل تست
    await transporter.sendMail({
      from: `"تست" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: 'تست SMTP از Next.js',
      text: 'اگر این ایمیل را می‌بینید، SMTP کار می‌کند.',
    });
    console.log('✅ ایمیل تست ارسال شد');
  } catch (error) {
    console.error('❌ خطا در SMTP:', error.message);
    console.error('جزئیات:', error);
  }
}

test();
