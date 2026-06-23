'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/auth/login');
        }
      })
      .catch(() => {
        router.push('/auth/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('خروج موفق');
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        color: 'white',
        fontFamily: 'Vazirmatn, sans-serif',
      }}>
        <p>در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: 'white',
      fontFamily: 'Vazirmatn, sans-serif',
      padding: '80px 20px 20px',
      direction: 'rtl',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>داشبورد کاربری</h1>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              borderRadius: '8px',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            خروج
          </button>
        </div>

        <div style={{
          backgroundColor: '#18181b',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '24px',
        }}>
          <h2 style={{ marginBottom: '16px' }}>اطلاعات کاربری</h2>
          <p><strong>نام:</strong> {user?.name}</p>
          <p><strong>ایمیل:</strong> {user?.email}</p>
          <p><strong>وضعیت:</strong> {user?.isVerified ? '✅ تأیید شده' : '⏳ در انتظار تأیید'}</p>
          <p><strong>تاریخ ثبت نام:</strong> {new Date(user?.createdAt).toLocaleDateString('fa-IR')}</p>
        </div>

        <div style={{
          backgroundColor: '#18181b',
          padding: '24px',
          borderRadius: '16px',
        }}>
          <h2 style={{ marginBottom: '16px' }}>📊 آمار</h2>
          <p>تعداد پروژه‌ها: ۰</p>
          <p>پیام‌های دریافتی: ۰</p>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <a href="/" style={{ color: '#60a5fa', textDecoration: 'none' }}>
            بازگشت به صفحه اصلی
          </a>
        </div>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
