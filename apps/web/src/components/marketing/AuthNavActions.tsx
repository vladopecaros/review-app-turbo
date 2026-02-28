'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';

type AuthNavActionsProps = {
  mobile?: boolean;
  onAction?: () => void;
};

export function AuthNavActions({ mobile = false, onAction }: AuthNavActionsProps) {
  const t = useTranslations();
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await api.post('/auth/logout');
    } catch {
      // Clear local auth even when backend returns 401.
    } finally {
      clearAuth();
      setIsLoggingOut(false);
      onAction?.();
      router.refresh();
    }
  }

  if (!hydrated) {
    return mobile ? (
      <div className="h-10 w-full rounded-lg border border-white/10 bg-white/5" />
    ) : (
      <div className="h-10 w-44 rounded-lg border border-white/10 bg-white/5" />
    );
  }

  if (accessToken) {
    return mobile ? (
      <div className="grid gap-2">
        <Link href="/app" onClick={onAction}>
          <Button className="w-full">{t('nav.dashboard')}</Button>
        </Link>
        <Button variant="ghost" onClick={handleLogout} disabled={isLoggingOut} className="w-full">
          {isLoggingOut ? t('common.loading') : t('common.logout')}
        </Button>
      </div>
    ) : (
      <>
        <Link href="/app" onClick={onAction}>
          <Button>{t('nav.dashboard')}</Button>
        </Link>
        <Button variant="ghost" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? t('common.loading') : t('common.logout')}
        </Button>
      </>
    );
  }

  return mobile ? (
    <div className="grid gap-2">
      <Link href="/login" className="rounded-md px-3 py-2 text-sm hover:bg-white/5" onClick={onAction}>
        {t('nav.login')}
      </Link>
      <Link href="/register" onClick={onAction}>
        <Button className="w-full">{t('nav.getStarted')}</Button>
      </Link>
    </div>
  ) : (
    <>
      <Link href="/login" onClick={onAction}>
        <Button variant="ghost">{t('nav.login')}</Button>
      </Link>
      <Link href="/register" onClick={onAction}>
        <Button>{t('nav.getStarted')}</Button>
      </Link>
    </>
  );
}
