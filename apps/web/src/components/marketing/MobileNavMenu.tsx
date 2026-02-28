'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { AuthNavActions } from './AuthNavActions';
import { Button } from '@/components/ui/button';

export function MobileNavMenu() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  function close() {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 200);
  }

  return (
    <div className="relative md:hidden">
      <Button
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        variant="ghost"
        size="sm"
        onClick={() => (open ? close() : setOpen(true))}
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
        <>
          <button
            className="fixed inset-0 z-40"
            onClick={close}
            aria-hidden="true"
            tabIndex={-1}
          />
          <div
            id="mobile-nav-panel"
            className={`absolute right-0 top-full z-50 mt-2 w-48 surface-panel grid gap-2 p-3 ${closing ? 'animate-fade-down' : 'animate-fade-up'}`}
          >
            <Link href="/security" className="rounded-md px-3 py-2 text-sm hover:bg-white/5" onClick={close}>
              {t('nav.security')}
            </Link>
            <AuthNavActions mobile onAction={close} />
          </div>
        </>
      ) : null}
    </div>
  );
}
