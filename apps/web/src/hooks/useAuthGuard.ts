'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export function useAuthGuard() {
  const router = useRouter();
  const { accessToken, hydrated, setAuth, clearAuth } = useAuthStore();
  const attemptedRefreshRef = useRef(false);
  const [refreshAttemptCompleted, setRefreshAttemptCompleted] = useState(false);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (accessToken) {
      return;
    }

    if (attemptedRefreshRef.current) {
      return;
    }

    attemptedRefreshRef.current = true;

    api
      .post('/auth/refresh')
      .then(({ data }) => {
        if (data?.user && data?.accessToken) {
          setAuth(data.user, data.accessToken);
          return;
        }

        throw new Error('Invalid refresh payload');
      })
      .catch(() => {
        clearAuth();
        router.replace('/login');
      })
      .finally(() => {
        setRefreshAttemptCompleted(true);
      });
  }, [accessToken, clearAuth, hydrated, router, setAuth]);

  const isLoading = !hydrated || (!accessToken && !refreshAttemptCompleted);

  return {
    isAuthenticated: Boolean(accessToken),
    isLoading,
  };
}
