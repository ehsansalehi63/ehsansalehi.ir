import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/mysql';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const report: string[] = [];
  try {
    // 0. Ensure tables exist
    await query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      isVerified BOOLEAN DEFAULT FALSE,
      isAdmin BOOLEAN DEFAULT FALSE,
      auth_id VARCHAR(255) NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

    await query(`CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      \`desc\` TEXT NOT NULL,
      tech VARCHAR(255) NOT NULL,
      link VARCHAR(255) NOT NULL,
      image_url TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

    // 1. Try copying projects & users from Supabase if env exists
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Copy Projects
        const { data: projects, error: projectsError } = await supabase.from('projects').select('*');
        if (projects && projects.length > 0) {
          let migratedProjects = 0;
          for (const p of projects) {
            const [existing] = await query('SELECT id FROM projects WHERE id = ? OR title = ?', [p.id, p.title]);
            if (!existing) {
              await query(
                'INSERT INTO projects (id, title, `desc`, tech, link, image_url, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                  p.id,
                  p.title,
                  p.desc || p.description || '',
                  p.tech || '',
                  p.link || '#',
                  p.image_url || '',
                  (p.createdAt || p.created_at || new Date().toISOString()).slice(0, 19).replace('T', ' ')
                ]
              );
              migratedProjects++;
            }
          }
          if (migratedProjects > 0) {
            report.push(`✅ تعداد ${migratedProjects} پروژه از Supabase به Hostinger MySQL منتقل شد.`);
          }
        }

        // Copy Users
        const { data: users, error: usersError } = await supabase.from('users').select('*');
        if (users && users.length > 0) {
          let migratedUsers = 0;
          for (const u of users) {
            const [existing] = await query('SELECT id FROM users WHERE email = ?', [u.email]);
            if (!existing) {
              await query(
                'INSERT INTO users (id, `name`, `email`, `password`, `isVerified`, `isAdmin`, `auth_id`, `createdAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                  u.id,
                  u.name || 'کاربر',
                  u.email,
                  u.password || '',
                  u.isVerified !== undefined ? u.isVerified : true,
                  u.isAdmin !== undefined ? u.isAdmin : false,
                  u.auth_id || null,
                  (u.createdAt || u.created_at || new Date().toISOString()).slice(0, 19).replace('T', ' ')
                ]
              );
              migratedUsers++;
            }
          }
          if (migratedUsers > 0) {
            report.push(`✅ تعداد ${migratedUsers} کاربر از Supabase به Hostinger MySQL منتقل شد.`);
          }
        }
      } catch (sbErr: any) {
        report.push(`⚠️ عدم امکان خواندن از Supabase: ${sbErr.message}`);
      }
    }

    // 2. GUARANTEE Admin user (`admin@ehsansalehi.ir`) exists and login works
    const adminEmail = 'admin@ehsansalehi.ir';
    const defaultPasswordHash = bcrypt.hashSync('admin123', 10);
    const [adminRow] = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [adminEmail]);

    if (!adminRow) {
      await query(
        'INSERT INTO users (`name`, `email`, `password`, `isVerified`, `isAdmin`, `createdAt`) VALUES (?, ?, ?, ?, ?, NOW())',
        ['مدیر سایت (احسان صالحی)', adminEmail, defaultPasswordHash, true, true]
      );
      report.push(`👑 حساب ادمین اصلی ساخته شد (ایمیل: ${adminEmail} | رمز: admin123).`);
    } else if (request.nextUrl.searchParams.has('reset_password')) {
      await query(
        'UPDATE users SET password = ?, isAdmin = true, isVerified = true WHERE email = ?',
        [defaultPasswordHash, adminEmail]
      );
      report.push(`🔄 رمز عبور حساب ${adminEmail} به admin123 بازنشانی شد.`);
    } else {
      report.push(`✔️ حساب مدیر سایت (${adminEmail}) در جدول کاربران فعال است. (اگر رمز را فراموش کرده‌اید، ?reset_password=true را به انتهای آدرس اضافه کنید).`);
    }

    // 3. GUARANTEE Projects exist so home page shows them (`projects.length > 0`)
    const [projectsCountRes] = await query<{ count: number }>('SELECT COUNT(*) as count FROM projects');
    const totalProjects = projectsCountRes?.count || 0;

    if (totalProjects === 0 || request.nextUrl.searchParams.has('seed_projects')) {
      const sampleProjects = [
        {
          title: 'سیستم اتوماسیون و مانیتورینگ شبکه تحت وب',
          desc: 'طراحی و پیاده‌سازی سامانه هوشمند مانیتورینگ تجهیزات شبکه با قابلیت هشدار لحظه‌ای، گزارش‌گیری پیشرفته و تحلیل ترافیک.',
          tech: 'Next.js, TypeScript, Node.js, MySQL, SNMP',
          link: 'https://ehsansalehi.ir',
          image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80'
        },
        {
          title: 'پلتفرم جامع خدمات مشاوره فناوری اطلاعات',
          desc: 'وب‌سایت رسمی احسان صالحی با معماری سرورلس، سیستم بلاگ پویا، یکپارچه‌سازی با هوش مصنوعی و بهینه‌سازی کامل سئو.',
          tech: 'Next.js 16, Tailwind CSS, MySQL, Vercel, OpenAI',
          link: 'https://ehsansalehi.ir',
          image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
        },
        {
          title: 'سامانه هوشمند پردازش و انتشار اخبار فناوری',
          desc: 'خزنده (Crawler) خودکار اخبار فناوری اطلاعات با قابلیت خلاصه‌سازی و ترجمه توسط هوش مصنوعی، درج واترمارک و انتشار در شبکه‌های اجتماعی.',
          tech: 'TypeScript, Next.js API, Jimp, GapGPT AI, RSS Parser',
          link: 'https://ehsansalehi.ir/news',
          image_url: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80'
        }
      ];

      for (const sp of sampleProjects) {
        const [existingP] = await query('SELECT id FROM projects WHERE title = ?', [sp.title]);
        if (!existingP) {
          await query(
            'INSERT INTO projects (title, `desc`, tech, link, image_url, createdAt) VALUES (?, ?, ?, ?, ?, NOW())',
            [sp.title, sp.desc, sp.tech, sp.link, sp.image_url]
          );
        }
      }
      report.push('📌 تعداد ۳ پروژه حرفه‌ای نمونه کار IT به جدول پروژه‌ها اضافه شدند تا صفحه اصلی سایت کامل و جذاب نمایش داده شود.');
    } else {
      report.push(`✔️ تعداد ${totalProjects} پروژه در جدول پروژه‌ها موجود است و در صفحه اصلی نمایش داده می‌شود.`);
    }

    return NextResponse.json({
      success: true,
      message: '🎉 بررسی و بازیابی اطلاعات و دسترسی مدیر سایت با موفقیت انجام شد.',
      report,
    });
  } catch (error: any) {
    console.error('❌ خطا در عملیات بازیابی و مهاجرت:', error);
    return NextResponse.json({ success: false, error: error.message || 'خطا در بازیابی اطلاعات' }, { status: 500 });
  }
}
