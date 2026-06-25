'use client';

import { useState } from 'react';
import { Toaster, toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('✅ لینک بازیابی به ایمیل شما ارسال شد');
        setEmail('');
      } else {
        toast.error(data.error || 'خطا در ارسال لینک');
      }
    } catch (error) {
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
        <h1 style={{ textAlign: 'center', fontSize: '24px', marginBottom: '8px' }}>🔑 فراموشی رمز عبور</h1>
        <p style={{ textAlign: 'center', color: '#a3a3a3', marginBottom: '24px', fontSize: '14px' }}>
          ایمیل خود را وارد کنید تا لینک بازیابی برای شما ارسال شود
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="email"
            placeholder="آدرس ایمیل"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            {loading ? 'در حال ارسال...' : 'ارسال لینک بازیابی'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '16px', color: '#a3a3a3', fontSize: '14px' }}>
          <a href="/auth/login" style={{ color: '#60a5fa', textDecoration: 'none' }}>بازگشت به صفحه ورود</a>
        </p>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
