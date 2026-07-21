import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // تنظیم مسیر ریشه برای جلوگ
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
