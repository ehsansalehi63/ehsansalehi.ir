import { Suspense } from 'react';
import NewsContent from './NewsContent';

export default function NewsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={
          <div className="text-center text-zinc-400 py-20">
            در حال بارگذاری اخبار...
          </div>
        }>
          <NewsContent />
        </Suspense>
      </div>
    </main>
  );
}
