'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

    const track = async () => {
      try {
        await fetch('/api/track-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page: pathname }),
        });
      } catch {
        // ignore
      }
    };

    track();
  }, [pathname]);

  return null;
}
