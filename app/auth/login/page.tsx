'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useI18n } from '../../components/I18nProvider';

export default function LoginPage() {
  const { lang } = useI18n();
  const isEn = lang === 'en';
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user?.isAdmin) {
          localStorage.setItem('admin_token', data.token);
          localStorage.setItem('admin_user', JSON.stringify(data.user));
          toast.success(isEn ? 'Admin Login successful! Redirecting to Admin Studio... 👑' : 'ورود مدیر کل موفق! انتقال به پنل فرماندهی... 👑');
          router.push('/admin');
        } else {
          toast.success(isEn ? 'Login successful! ✅' : 'ورود موفق ✅');
          router.push('/dashboard');
        }
      } else {
        toast.error(data.error || (isEn ? 'Invalid email or password' : 'ایمیل یا رمز عبور اشتباه است'));
      }
    } catch {
      toast.error(isEn ? 'Connection error' : 'خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4 font-vazir" dir={isEn ? 'ltr' : 'rtl'}>
      <div className="max-w-md w-full glass rounded-3xl p-8 border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent mb-2">
            {isEn ? 'Login to Account' : 'ورود به حساب کاربری'}
          </h1>
          <p className="text-zinc-400 text-sm">
            {isEn ? 'Welcome back! Enter your credentials to access your dashboard.' : 'خوش آمدید! برای ورود اطلاعات خود را وارد کنید.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">
              {isEn ? 'Email Address' : 'آدرس ایمیل'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isEn ? 'name@example.com' : 'name@example.com'}
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-2xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/60 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">
              {isEn ? 'Password' : 'رمز عبور'}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-2xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/60 transition"
            />
          </div>

          <div className="flex justify-between items-center text-xs">
            <Link href="/auth/forgot-password" className="text-orange-400 hover:underline">
              {isEn ? 'Forgot password?' : 'رمز عبور را فراموش کرده‌اید؟'}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-500/20 transition disabled:opacity-50"
          >
            {loading ? (isEn ? 'Signing in...' : 'در حال ورود...') : (isEn ? 'Sign In 🚀' : 'ورود به حساب 🚀')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-zinc-400">
          {isEn ? 'Don’t have an account?' : 'حساب کاربری ندارید؟'}{' '}
          <Link href="/auth/register" className="text-orange-400 font-bold hover:underline">
            {isEn ? 'Register Now' : 'ثبت نام کنید'}
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-xs text-zinc-500 hover:text-white transition">
            {isEn ? '← Back to Homepage' : '← بازگشت به صفحه اصلی'}
          </Link>
        </div>
      </div>
    </div>
  );
}
