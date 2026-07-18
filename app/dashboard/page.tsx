'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Toaster, toast } from 'sonner';
import { BookOpen, Clock, CheckCircle, ShoppingBag, User, LogOut } from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  email: string;
  isVerified: boolean;
  isAdmin: boolean;
}

interface PurchasedCourse {
  id: number;
  title: string;
  description: string;
  image_url: string;
  price: number;
  purchased_at: string;
  progress: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [purchases, setPurchases] = useState<PurchasedCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchData = async () => {
      try {
        // دریافت اطلاعات کاربر
        const userRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          if (!userData.success) {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/auth/login');
            return;
          }
          setUser(userData.user);
        }

        // دریافت دوره‌های خریداری شده یا تخصصی
        const purchasesRes = await fetch('/api/user/purchases', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (purchasesRes.ok) {
          const purchasesData = await purchasesRes.json();
          if (purchasesData.success) {
            setPurchases(purchasesData.data || []);
          }
        }
      } catch (error) {
        console.warn('⚠️ وقفه در دریافت اطلاعات داشبورد:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('user');
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    toast.success('خروج موفق');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white font-vazir flex items-center justify-center">
        <p>در حال بارگذاری...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-vazir" dir="rtl">
      {/* هدر */}
      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-amber-400 to-blue-500 bg-clip-text text-transparent">
            احسان صالحی
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{user.name}</span>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/5 rounded-xl transition"
            >
              <LogOut size={18} className="text-red-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {/* بنر بزرگ و درخشان انتقال سریع ادمین به پنل مدیریت و سناریوساز */}
        {user.isAdmin && (
          <div className="mb-8 p-6 md:p-8 bg-gradient-to-r from-orange-600/30 via-[#181b26] to-blue-600/30 rounded-[32px] border-2 border-orange-500/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-5 text-right">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-3xl shrink-0 animate-bounce">
                ⚡
              </div>
              <div>
                <span className="bg-orange-500 text-black text-xs font-black px-3 py-1 rounded-full inline-block mb-1.5 shadow-md">
                  دسترسی مدیر کل (Admin VIP)
                </span>
                <h3 className="text-xl md:text-2xl font-black text-white">
                  شما با حساب مدیر سایت (احسان صالحی) وارد شده‌اید
                </h3>
                <p className="text-xs md:text-sm text-zinc-300 font-light mt-1">
                  برای کنترل سناریوساز خودکار (`Make Studio`)، سئوی هوشمند، مدیریت کاربران و پروژه‌ها وارد پنل فرماندهی شوید.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0 w-full md:w-auto justify-center">
              <Link
                href="/admin"
                className="w-full md:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-sm transition shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
              >
                <span>⚡ ورود به پنل مدیریت کل و سناریوساز 👑</span>
              </Link>
            </div>
          </div>
        )}

        {/* اطلاعات کاربر */}
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-blue-500 flex items-center justify-center text-2xl font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-zinc-400">{user.email}</p>
              <div className="flex gap-2 mt-1">
                <span className={`text-xs ${user.isVerified ? 'text-green-400' : 'text-red-400'}`}>
                  {user.isVerified ? '✅ تأیید شده' : '⏳ تأیید نشده'}
                </span>
                {user.isAdmin && (
                  <Link href="/admin" className="text-xs text-amber-400 hover:underline font-bold">
                    👑 ورود به پنل مدیریت
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* دوره‌های خریداری شده */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen size={20} className="text-blue-400" />
              دوره‌های من
            </h2>
            <Link href="/courses" className="text-sm text-blue-400 hover:underline">
              مشاهده همه دوره‌ها
            </Link>
          </div>

          {purchases.length === 0 ? (
            <div className="bg-zinc-900/30 p-8 rounded-2xl border border-white/5 text-center">
              <p className="text-zinc-500">شما هنوز هیچ دوره‌ای خریداری نکرده‌اید.</p>
              <Link href="/courses" className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition">
                مشاهده دوره‌ها
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {purchases.map((course) => (
                <div key={course.id} className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 hover:border-blue-500/30 transition">
                  <div className="aspect-video rounded-xl overflow-hidden bg-zinc-800 mb-3">
                    {course.image_url ? (
                      <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">📚</div>
                    )}
                  </div>
                  <h3 className="font-bold">{course.title}</h3>
                  <p className="text-sm text-zinc-400 line-clamp-2">{course.description}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle size={14} />
                      خریداری شده
                    </span>
                    <Link
                      href={`/courses/${course.id}`}
                      className="text-sm text-blue-400 hover:underline"
                    >
                      مشاهده دوره
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
}
