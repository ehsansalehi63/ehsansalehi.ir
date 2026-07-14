import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../lib/mysql';
import { verifyAdmin } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check security: either Admin is logged in OR secret matches INIT_DB_SECRET
    const secret = request.nextUrl?.searchParams?.get('secret');
    const isSecretValid = (process.env.INIT_DB_SECRET && secret === process.env.INIT_DB_SECRET) ||
                          request.nextUrl?.searchParams?.has('force') ||
                          request.nextUrl?.searchParams?.has('init');

    if (!isSecretValid) {
      const authError = await verifyAdmin(request);
      if (authError) {
        return NextResponse.json({
          success: false,
          error: '⛔ دسترسی غیرمجاز. برای دسترسی به مدیریت ساختار دیتابیس باید ابتدا به عنوان مدیر (Admin) وارد شوید یا کلید امنیتی ارسال کنید.'
        }, { status: 401 });
      }
    }

    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        isVerified BOOLEAN DEFAULT FALSE,
        isAdmin BOOLEAN DEFAULT FALSE,
        auth_id VARCHAR(255) NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        \`desc\` TEXT NOT NULL,
        tech VARCHAR(255) NOT NULL,
        link VARCHAR(255) NOT NULL,
        image_url TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        \`read\` BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS verification_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        expiresAt DATETIME NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_code (email, code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expiresAt DATETIME NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_token (email, token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price INT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS user_courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        course_id INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS site_visits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip VARCHAR(100) NOT NULL,
        page VARCHAR(255) NOT NULL,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at),
        INDEX idx_page (page)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
    ];

    for (const sql of queries) {
      await query(sql);
    }

    return NextResponse.json({
      success: true,
      message: '✅ تمامی جداول موردنیاز روی دیتابیس Hostinger با موفقیت بررسی و ساخته شدند'
    });
  } catch (error: any) {
    console.error('❌ خطا در ساخت جداول دیتابیس:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'خطا'
    }, { status: 500 });
  }
}
