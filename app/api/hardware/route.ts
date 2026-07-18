import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Ensure hardware_products table exists
    await pool.execute(`CREATE TABLE IF NOT EXISTS hardware_products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      title_en VARCHAR(255) DEFAULT NULL,
      specs TEXT NOT NULL,
      specs_en TEXT DEFAULT NULL,
      condition_grade VARCHAR(50) DEFAULT 'Grade A++ اروپایی',
      price_estimate VARCHAR(100) DEFAULT 'استعلام قیمت لحظه‌ای',
      category VARCHAR(100) DEFAULT 'لپ‌تاپ مهندسی',
      image_url VARCHAR(500) DEFAULT '/images/og-image.jpg',
      badge VARCHAR(100) DEFAULT 'تاییدشده توسط مهندس صالحی',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

    const [rows] = await pool.execute('SELECT * FROM hardware_products WHERE is_active = TRUE ORDER BY id ASC');
    let products = rows as any[] || [];

    // اگر دیتابیس خالی بود، ۶ محصول گلچین‌شده مهندسی را به عنوان نمونه اولیه اضافه کن
    if (products.length === 0) {
      const defaultProducts = [
        {
          title: 'Lenovo ThinkPad X1 Carbon Gen 10 (Engineering Workstation)',
          title_en: 'Lenovo ThinkPad X1 Carbon Gen 10 (Engineering Workstation)',
          specs: 'پردازنده Core i7 1260P | حافظه رم 32GB LPDDR5 | هارد 1TB NVMe PCIe 4.0 | صفحه‌نمایش 14 اینچ 4K OLED | فوق‌العاده سبک با بدنه فیبر کربن مخصوص برنامه‌نویسان، معماران شبکه و مدیران IT',
          specs_en: 'Core i7 1260P | 32GB LPDDR5 RAM | 1TB NVMe PCIe 4.0 | 14" 4K OLED | Ultralight carbon fiber body designed for network architects & DevOps engineers.',
          condition_grade: 'Grade A++ (استوک در حد نو با کارتن)',
          price_estimate: 'حدود ۶۵ تا ۷۲ میلیون تومان (استعلام لحظه‌ای)',
          category: 'لپ‌تاپ مهندسی',
          image_url: 'https://ehsansalehi.ir/images/og-image.jpg',
          badge: '⭐ پیشنهاد اول برای برنامه‌نویسان'
        },
        {
          title: 'Apple MacBook Pro 16" M2 Pro (AI & Full-Stack Edition)',
          title_en: 'Apple MacBook Pro 16" M2 Pro (AI & Full-Stack Edition)',
          specs: 'پردازنده 12-Core CPU و 19-Core GPU | حافظه 32GB Unified Memory | هارد 1TB SSD | صفحه‌نمایش Liquid Retina XDR | باتری با شارژدهی ۲۲ ساعته مخصوص پردازش‌های سنگین هوش مصنوعی و توسعه وب',
          specs_en: '12-Core CPU & 19-Core GPU | 32GB Unified Memory | 1TB SSD | Liquid Retina XDR Display | 22-hour battery life optimized for heavy AI workflows.',
          condition_grade: 'Grade A++ (سیکل باتری زیر ۵۰)',
          price_estimate: 'حدود ۹۵ تا ۱۰۵ میلیون تومان (استعلام لحظه‌ای)',
          category: 'مک‌بوک پرو',
          image_url: 'https://ehsansalehi.ir/images/og-image.jpg',
          badge: '🔥 قدرتمندترین برای هوش مصنوعی'
        },
        {
          title: 'HP ZBook Fury 15 G8 Mobile Workstation',
          title_en: 'HP ZBook Fury 15 G8 Mobile Workstation',
          specs: 'پردازنده Intel Core i9 / Xeon 11950H | رم 64GB DDR4 (قابل ارتقا تا 128GB) | گرافیک مجزای NVIDIA RTX A3000 6GB GDDR6 | شبیه‌سازی سنگین شبکه‌های سیسکو (GNS3/EVE-NG) و رندرینگ',
          specs_en: 'Intel Core i9 11950H | 64GB DDR4 RAM | NVIDIA RTX A3000 6GB Workstation GPU | Ideal for complex GNS3/EVE-NG network simulation.',
          condition_grade: 'Grade A+ اروپایی',
          price_estimate: 'حدود ۶۸ تا ۷۵ میلیون تومان (استعلام لحظه‌ای)',
          category: 'ورک‌استیشن مهندسی',
          image_url: 'https://ehsansalehi.ir/images/og-image.jpg',
          badge: '🛡️ ممیزی‌شده با تست ۲۴ ساعته'
        },
        {
          title: 'ASUS ROG Zephyrus G14 (2023 AI Studio)',
          title_en: 'ASUS ROG Zephyrus G14 (2023 AI Studio)',
          specs: 'پردازنده AMD Ryzen 9 7940HS | رم 32GB DDR5 | گرافیک NVIDIA GeForce RTX 4060 8GB | وزن فقط ۱.۶ کیلوگرم با نمایشگر Nebula 165Hz | ترکیب بی‌نظیر قدرت گیمینگ و قابلیت حمل مهندسی',
          specs_en: 'AMD Ryzen 9 7940HS | 32GB DDR5 | RTX 4060 8GB | 1.6kg Ultralight Nebula 165Hz Display | Perfect balance of portability and CUDA AI power.',
          condition_grade: 'Grade A++ (اوپن باکس)',
          price_estimate: 'حدود ۷۸ تا ۸۵ میلیون تومان (استعلام لحظه‌ای)',
          category: 'لپ‌تاپ مهندسی / AI',
          image_url: 'https://ehsansalehi.ir/images/og-image.jpg',
          badge: '⚡ پرطرفدارترین گجت سال'
        },
        {
          title: 'Dell Precision 5570 Carbon Fiber Workstation',
          title_en: 'Dell Precision 5570 Carbon Fiber Workstation',
          specs: 'پردازنده Core i9 12900H 14-Core | حافظه 32GB DDR5 | گرافیک NVIDIA RTX A2000 8GB | طراحی بدون حاشیه InfinityEdge | کیفیتی هم‌تراز مک‌بوک در دنیای ویندوز برای مهندسان شبکه و امنیت',
          specs_en: 'Core i9 12900H 14-Core | 32GB DDR5 | NVIDIA RTX A2000 8GB | InfinityEdge Bezel-less design | Premium build quality for enterprise IT.',
          condition_grade: 'Grade A++ اروپایی',
          price_estimate: 'حدود ۷۰ تا ۷۷ میلیون تومان (استعلام لحظه‌ای)',
          category: 'ورک‌استیشن مهندسی',
          image_url: 'https://ehsansalehi.ir/images/og-image.jpg',
          badge: '💎 طراحی لوکس و مقاوم'
        },
        {
          title: 'Cisco Catalyst 3850-48XS-S Enterprise Fiber Switch',
          title_en: 'Cisco Catalyst 3850-48XS-S Enterprise Fiber Switch',
          specs: 'سوییچ ۴۸ پورت فیبر نوری 10G SFP+ همراه با ۴ پورت 40G QSFP+ | پشتیبانی از StackWise-480 | کاملاً تست‌شده همراه با کانفیگ اولیه رایگان و مشاوره معماری شبکه توسط مهندس احسان صالحی',
          specs_en: '48-Port 10G SFP+ Fiber Switch with 4x 40G QSFP+ | StackWise-480 enabled | Fully audited & tested with complimentary baseline network architecture consulting.',
          condition_grade: 'Grade A+ با تست کامل پورت‌ها',
          price_estimate: 'استعلام تلفنی / تلگرامی متناسب با ماژول‌ها',
          category: 'تجهیزات شبکه سیسکو',
          image_url: 'https://ehsansalehi.ir/images/og-image.jpg',
          badge: '🌐 ویژه پروژه‌های دیتاسنتر'
        }
      ];

      for (const p of defaultProducts) {
        await pool.execute(
          'INSERT INTO hardware_products (title, title_en, specs, specs_en, condition_grade, price_estimate, category, image_url, badge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [p.title, p.title_en, p.specs, p.specs_en, p.condition_grade, p.price_estimate, p.category, p.image_url, p.badge]
        );
      }

      const [newRows] = await pool.execute('SELECT * FROM hardware_products WHERE is_active = TRUE ORDER BY id ASC');
      products = newRows as any[] || [];
    }

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, phone, budget, useCase, notes } = body;

    await pool.execute(`CREATE TABLE IF NOT EXISTS hardware_inquiries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      budget VARCHAR(100),
      use_case VARCHAR(255),
      notes TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);

    await pool.execute(
      'INSERT INTO hardware_inquiries (name, phone, budget, use_case, notes) VALUES (?, ?, ?, ?, ?)',
      [name || 'ناشناس', phone || '', budget || '', useCase || '', notes || '']
    );

    return NextResponse.json({
      success: true,
      message: '✅ درخواست مشاوره خرید سخت‌افزار با موفقیت ثبت شد. مهندس احسان صالحی در اسرع وقت با شما تماس خواهند گرفت.'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
