'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('❌ Global Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-vazir flex flex-col items-center justify-center p-6 text-center" dir="rtl">
      <div className="glass rounded-2xl p-8 max-w-md w-full border border-red-500/20 shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
          ⚠️
        </div>
        <h2 className="text-2xl font-bold mb-3 text-red-400">خطایی در برقراری ارتباط رخ داد</h2>
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
          متأسفانه در پردازش یا خواندن اطلاعات از دیتابیس مشکلی موقتی به وجود آمد. لطفاً چند لحظه صبر کرده و مجدداً تلاش کنید.
        </p>
        <button
          onClick={() => reset()}
          className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition duration-300"
        >
          تلاش مجدد 🔄
        </button>
      </div>
    </div>
  );
}
