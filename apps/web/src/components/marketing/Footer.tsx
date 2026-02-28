import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-[color:var(--text-muted)] sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="font-display font-semibold text-[color:var(--text)]">Reviewlico</span>{' '}
          <span>© {new Date().getFullYear()} {t('footer.copyright')}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link className="hover:text-[color:var(--text)]" href="/security">
            {t('footer.security')}
          </Link>
          <Link className="hover:text-[color:var(--text)]" href="/login">
            {t('footer.login')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
