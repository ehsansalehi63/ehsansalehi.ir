import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/mysql';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const report: string[] = [];
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let migratedProjects = 0;
    let migratedUsers = 0;

    // 1. Check if Supabase env exists and try copying projects & users from Supabase
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Copy Projects from Supabase
        const { data: projects, error: projectsError } = await supabase.from('projects').select('*');
        if (projects && projects.length > 0) {
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
          report.push(`✅ تعداد ${migratedProjects} پروژه از Supabase به Hostinger MySQL منتقل شد.`);
        } else {
          report.push(`ℹ️ در جدول projects در Supabase رکورد یا داده‌ای یافت نشد (${projectsError?.message || '0 rows'}).`);
        }

        // Copy Users from Supabase
        const { data: users, error: usersError } = await supabase.from('users').select('*');
        if (users && users.length > 0) {
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
          report.push(`✅ تعداد ${migratedUsers} کاربر (شامل مدیران) از Supabase به Hostinger MySQL منتقل شد.`);
        } else {
          report.push(`ℹ️ در جدول users در Supabase کاربری یافت نشد (${usersError?.message || '0 rows'}).`);
        }
      } catch (sbErr: any) {
        report.push(`⚠️ خطا در اتصال به Supabase: ${sbErr.message}`);
      }
    } else {
      report.push('ℹ️ متغیرهای Supabase تنظیم نشده‌اند یا غیرفعال هستند.');
    }

    // 2. Fallback check: Ensure an initial Admin account exists in Hostinger MySQL (`admin@ehsansalehi.ir`)
    const [adminExists] = await query('SELECT id FROM users WHERE `isAdmin` = true LIMIT 1');
    if (!adminExists) {
      const defaultPasswordHash = bcrypt.hashSync('admin123', 10);
      await query(
        'INSERT INTO users (`name`, `email`, `password`, `isVerified`, `isAdmin`, `createdAt`) VALUES (?, ?, ?, ?, ?, NOW())',
        ['مدیر سایت (احسان صالحی)', 'admin@ehsansalehi.ir', defaultPasswordHash, true, true]
      );
      report.push('👑 حساب پیش‌فرض ادمین در دیتابیس ایجاد شد (ایمیل: admin@ehsansalehi.ir | رمز: admin123).');
    } else {
      report.push('✔️ حساب مدیر سایت در جدول users دیتابیس وجود دارد.');
    }

    // 3. Fallback check: If projects table in Hostinger MySQL is completely empty (`0 rows`), add initial projects if requested (`?seed=true` or automatically if 0 migrated)
    const [projectsCountRes] = await query<{ count: number }>('SELECT COUNT(*) as count FROM projects');
    const totalProjects = projectsCountRes?.count || 0;

    if (totalProjects === 0 || request.nextUrl.searchParams.has('seed')) {
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
          desc: 'وب‌سایت رسمی احسان صالحی رباطی با معماری سرورلس، سیستم بلاگ پویا، یکپارچه‌سازی با هوش مصنوعی و بهینه‌سازی کامل سئو.',
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
      report.push('📌 پروژه‌های نمونه اولیه به جدول پروژه‌ها اضافه شدند تا صفحه اصلی کامل نمایش داده شود.');
    } else {
      report.push(`✔️ تعداد ${totalProjects} پروژه هم‌اکنون در جدول projects دیتابیس هاستینگر موجود است.`);
    }

    return NextResponse.json({
      success: true,
      message: '🎉 بررسی، مهاجرت و بازیابی اطلاعات (کاربران و پروژه‌ها) با موفقیت انجام شد.',
      report,
    });
  } catch (error: any) {
    console.error('❌ خطا در عملیات بازیابی و مهاجرت:', error);
    return NextResponse.json({ success: false, error: error.message || 'خطا در بازیابی اطلاعات' }, { status: 500 });
  }
}
