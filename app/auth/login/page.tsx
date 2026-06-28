'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Toaster, toast } from 'sonner';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // بررسی توکن در ابتدای کار
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        if (userData.isAdmin) {
          window.location.href = '/admin';
        } else {
          window.location.href = '/dashboard';
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('ورود موفق ✅');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // ✅ هدایت با window.location.href (مطمئن‌ترین روش)
        setTimeout(() => {
          if (data.user.isAdmin) {
            window.location.href = '/admin';
          } else {
            window.location.href = '/dashboard';
          }
        }, 200);
      } else {
        toast.error(data.error || 'خطا در ورود');
      }
    } catch (error) {
      console.error('❌ خطا در لاگین:', error);
      toast.error('خطا در ارتباط با سرور');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0a',
      color: 'white',
      fontFamily: 'Vazirmatn, sans-serif',
      padding: '20px',
      direction: 'rtl',
    }}>
      <div style={{
        backgroundColor: '#18181b',
        padding: '40px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <h1 style={{ textAlign: 'center', fontSize: '24px', marginBottom: '8px' }}>ورود</h1>
        <p style={{ textAlign: 'center', color: '#a3a3a3', marginBottom: '24px', fontSize: '14px' }}>
          وارد حساب کاربری خود شوید
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="email"
            placeholder="آدرس ایمیل"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{
              padding: '12px 16px',
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#3f3f46'}
            required
          />
          <input
            type="password"
            placeholder="رمز عبور"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            style={{
              padding: '12px 16px',
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#3f3f46'}
            required
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              backgroundColor: '#2563eb',
              borderRadius: '8px',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#1d4ed8')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#2563eb')}
          >
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link
            href="/auth/forgot-password"
            style={{
              color: '#60a5fa',
              textDecoration: 'none',
              fontSize: '14px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#93c5fd'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#60a5fa'}
          >
            🔑 فراموشی رمز عبور؟
          </Link>
        </div>
        
        <p style={{ textAlign: 'center', marginTop: '16px', color: '#a3a3a3', fontSize: '14px' }}>
          ثبت نام نکرده‌اید؟{' '}
          <Link href="/auth/register" style={{ color: '#60a5fa', textDecoration: 'none' }}>
            ثبت نام
          </Link>
        </p>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
