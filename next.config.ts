import type { NextConfig } from 'next';

const NO_STORE_HEADERS = [
  { key: 'Cache-Control', value: 'private, no-store, no-cache, max-age=0, must-revalidate' },
  { key: 'CDN-Cache-Control', value: 'no-store' },
  { key: 'Surrogate-Control', value: 'no-store' },
  { key: 'Pragma', value: 'no-cache' },
  { key: 'Expires', value: '0' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  // تنظیم مسیر ریشه برای جلوگ
  outputFileTracingRoot: process.cwd(),
  async headers() {
    return [
      {
        source: '/',
        headers: NO_STORE_HEADERS,
      },
      {
        source: '/news',
        headers: NO_STORE_HEADERS,
      },
      {
        source: '/news/:path*',
        headers: NO_STORE_HEADERS,
      },
      {
        source: '/api/news/:path*',
        headers: NO_STORE_HEADERS,
      },
      {
        source: '/api/news',
        headers: NO_STORE_HEADERS,
      },
    ];
  },
};

export default nextConfig;
