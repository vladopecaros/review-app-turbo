'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { AuthNavActions } from './AuthNavActions';
import { Button } from '@/components/ui/button';

export function MobileNavMenu() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((value) => !value)}
        className="h-10 w-10 px-0"
      >
        <span className="sr-only">Menu</span>
        <span className="relative block h-3.5 w-4">
          <span className={`absolute left-0 top-0 h-0.5 w-4 bg-current transition ${open ? 'translate-y-1.5 rotate-45' : ''}`} />
          <span className={`absolute left-0 top-1.5 h-0.5 w-4 bg-current transition ${open ? 'opacity-0' : 'opacity-100'}`} />
          <span className={`absolute left-0 top-3 h-0.5 w-4 bg-current transition ${open ? '-translate-y-1.5 -rotate-45' : ''}`} />
        </span>
      </Button>

      {open ? (
        <div
          id="mobile-nav-panel"
          className="absolute left-4 right-4 top-16 surface-panel grid gap-2 p-3 animate-fade-up"
        >
          <Link href="/security" className="rounded-md px-3 py-2 text-sm hover:bg-white/5" onClick={() => setOpen(false)}>
            {t('nav.security')}
          </Link>
          <AuthNavActions mobile onAction={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
