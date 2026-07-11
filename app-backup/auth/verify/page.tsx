'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';

// کامپوننت داخلی که useSearchParams را استفاده می‌کند
function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timer > 0 && !canResend) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, canResend]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast.error('کد باید ۶ رقمی باشد');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('حساب شما با موفقیت تأیید شد');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        toast.error(data.error || 'کد نامعتبر است');
      }
    } catch (error) {
      toast.error('خطا در ارتباط با سرور');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('کد جدید به ایمیل شما ارسال شد');
        setTimer(60);
        setCanResend(false);
      } else {
        toast.error(data.error || 'خطا در ارسال مجدد کد');
      }
    } catch (error) {
      toast.error('خطا در ارتباط با سرور');
    }
    setLoading(false);
  };

  if (!email) {
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
        <p>ایمیل نامعتبر است. لطفاً دوباره ثبت نام کنید.</p>
        <a href="/auth/register" style={{ color: '#60a5fa' }}>ثبت نام</a>
      </div>
    );
  }

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
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>تأیید کد</h1>
        <p style={{ color: '#a3a3a3', marginBottom: '24px', fontSize: '14px' }}>
          کد ۶ رقمی ارسال شده به <strong>{email}</strong> را وارد کنید
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="text"
            placeholder="کد ۶ رقمی"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            style={{
              padding: '16px',
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              color: 'white',
              fontSize: '24px',
              textAlign: 'center',
              letterSpacing: '8px',
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
            {loading ? 'در حال تأیید...' : 'تأیید کد'}
          </button>
        </form>

        <div style={{ marginTop: '16px' }}>
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: '#60a5fa',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                textDecoration: 'underline',
                opacity: loading ? 0.6 : 1,
              }}
            >
              ارسال مجدد کد
            </button>
          ) : (
            <p style={{ color: '#737373', fontSize: '14px' }}>
              ارسال مجدد کد در {timer} ثانیه
            </p>
          )}
        </div>

        <p style={{ marginTop: '16px', color: '#a3a3a3', fontSize: '14px' }}>
          قبلاً ثبت نام کرده‌اید؟{' '}
          <a href="/auth/login" style={{ color: '#60a5fa', textDecoration: 'none' }}>
            ورود
          </a>
        </p>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}

// صفحه اصلی که با Suspense احاطه شده است
export default function VerifyPage() {
  return (
    <Suspense fallback={
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
    }>
      <VerifyContent />
    </Suspense>
  );
}
