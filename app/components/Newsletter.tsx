'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('لطفاً ایمیل معتبر وارد کنید');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('اشتراک شما با موفقیت ثبت شد ✅');
        setEmail('');
      } else {
        toast.error(data.error || 'خطا در ثبت اشتراک');
      }
    } catch {
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 px-4 glass border-y border-white/5 section-hidden">
      <div className="max-w-2xl mx-auto text-center">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent">
          📧 خبرنامه
        </h3>
        <p className="text-zinc-400 text-sm mt-2 mb-6">
          با عضویت در خبرنامه، از آخرین اخبار و مطالب جدید مطلع شوید.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="آدرس ایمیل شما"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:border-orange-500/50 outline-none transition-colors text-sm"
            required
          />
          <button type="submit" disabled={loading} className="px-6 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm whitespace-nowrap">
            {loading ? 'در حال ثبت...' : 'عضویت'}
          </button>
        </form>
      </div>
    </section>
  );
}
