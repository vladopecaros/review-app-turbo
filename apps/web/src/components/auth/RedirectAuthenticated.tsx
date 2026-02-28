'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/store/auth';

export function RedirectAuthenticated() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated || !accessToken) {
      return;
    }

    router.replace('/app');
  }, [accessToken, hydrated, router]);

  return null;
}
