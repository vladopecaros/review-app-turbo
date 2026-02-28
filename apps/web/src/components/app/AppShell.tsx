'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { FullPageSkeleton } from '@/components/app/FullPageSkeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuthStore } from '@/store/auth';

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { isAuthenticated, isLoading } = useAuthGuard();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const orgMatch = pathname.match(/^\/app\/orgs\/([^/]+)/);
  const orgId = orgMatch?.[1];

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await api.post('/auth/logout');
    } catch {
      // Clear local auth regardless of backend response (including 401).
    } finally {
      clearAuth();
      router.replace('/');
      setIsLoggingOut(false);
    }
  }

  if (isLoading || !isAuthenticated) {
    return <FullPageSkeleton />;
  }

  const navItems = [
    { href: '/app', label: t('appShell.dashboard') },
    ...(orgId
      ? [
          {
            href: `/app/orgs/${orgId}`,
            label: t('appShell.organization'),
          },
          {
            href: `/app/orgs/${orgId}/products`,
            label: t('appShell.products'),
          },
        ]
      : []),
    { href: '/security', label: t('nav.security') },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:gap-6">
        <aside className="surface-panel md:sticky md:top-6 md:h-[calc(100vh-3rem)] md:w-72 md:shrink-0">
          <div className="flex h-full flex-col p-4">
            <div className="mb-6">
              <Link href="/app" className="font-display text-xl font-semibold tracking-tight">
                Reviewlico
              </Link>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{t('appShell.product')}</p>
            </div>

            <nav className="grid gap-2">
              {(() => {
                const activeItem =
                  navItems
                    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
                    .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;

                return navItems.map((item) => {
                  const active = activeItem === item.href;
                  return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm transition',
                      active
                        ? 'border-blue-500/40 bg-blue-500/10 text-blue-100'
                        : 'border-transparent text-[color:var(--text-muted)] hover:border-white/5 hover:bg-white/5 hover:text-[color:var(--text)]',
                    )}
                  >
                    {item.label}
                  </Link>
                  );
                });
              })()}
            </nav>

            <div className="mt-auto rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted)]">{t('appShell.welcome')}</p>
              <p className="mt-1 truncate text-sm font-medium">{user?.email ?? 'Unknown user'}</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="surface-panel mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[color:var(--text-muted)]">{t('brand.tagline')}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{pathname}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? t('appShell.loggingOut') : t('appShell.logout')}
            </Button>
          </header>
          <div className="space-y-4">{children}</div>
        </div>
      </div>

      <nav
        className="fixed inset-x-4 bottom-4 z-30 grid gap-2 rounded-xl border border-white/10 bg-[rgba(12,16,22,0.92)] p-2 backdrop-blur md:hidden"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
      >
        {(() => {
          const activeItem =
            navItems
              .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
              .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;

          return navItems.map((item) => {
            const active = activeItem === item.href;
            return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: active ? 'secondary' : 'ghost', size: 'sm' }),
                'h-10 border-transparent text-xs',
              )}
            >
              {item.label}
            </Link>
            );
          });
        })()}
      </nav>
    </div>
  );
}
