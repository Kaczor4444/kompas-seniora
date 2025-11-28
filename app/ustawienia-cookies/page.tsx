'use client';

import { useEffect } from 'react';
import { reopenCookieBanner } from '@/components/CookieBanner';
import { useRouter } from 'next/navigation';

export default function CookieSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    reopenCookieBanner();
    router.push('/');
  }, [router]);

  return null;
}
