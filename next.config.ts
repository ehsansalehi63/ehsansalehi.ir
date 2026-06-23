import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // eslint را حذف کنید (دیگر پشتیبانی نمی‌شود)
  // اگر نیاز به تنظیمات Turbopack دارید، اینجا اضافه کنید
  turbopack: {}, // فقط برای رفع خطا (خالی باشد)
};

export default nextConfig;
