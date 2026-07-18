'use client';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function VisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

    const track = async () => {
      try {
        const fullUrl = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
        const referrer = typeof document !== 'undefined' && document.referrer ? document.referrer : '';
        const sourceParam = searchParams?.get('source') || searchParams?.get('utm_source') || '';

        await fetch('/api/track-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: fullUrl,
            referrer: referrer,
            source: sourceParam || undefined,
          }),
        });
      } catch {
        // ignore
      }
    };

    track();
  }, [pathname, searchParams]);

  return null;
}
