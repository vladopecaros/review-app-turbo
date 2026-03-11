import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { AuthNavActions } from './AuthNavActions';
import { MobileNavMenu } from './MobileNavMenu';

export function Navbar() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[rgba(8,11,15,0.72)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          Reviewlico
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-[color:var(--text-muted)] md:flex">
          <a href="#how-it-works" className="transition hover:text-[color:var(--text)]">
            How it works
          </a>
          <Link href="/security" className="transition hover:text-[color:var(--text)]">
            {t('nav.security')}
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <AuthNavActions />
        </div>

        <MobileNavMenu />
      </div>
    </header>
  );
}
