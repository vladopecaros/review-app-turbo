import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { RedirectAuthenticated } from '@/components/auth/RedirectAuthenticated';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  const t = useTranslations();

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[color:var(--bg)] lg:grid-cols-[1.1fr_0.9fr]">
      <RedirectAuthenticated />
      <section className="hidden border-r border-white/5 p-8 lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="font-display text-lg font-semibold">Reviewlico</Link>
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">{t('auth.register.eyebrow')}</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">{t('auth.register.title')}</h1>
          <p className="max-w-md text-[color:var(--text-muted)]">{t('auth.register.subtitle')}</p>
        </div>
        <div className="text-sm text-[color:var(--text-muted)]">{t('brand.tagline')}</div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="surface-panel w-full max-w-md p-6 sm:p-7">
          <div className="mb-6 lg:hidden">
            <Link href="/" className="font-display text-lg font-semibold">Reviewlico</Link>
          </div>
          <div className="mb-6 space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">{t('auth.register.eyebrow')}</p>
            <h2 className="font-display text-2xl font-semibold tracking-tight">{t('auth.register.title')}</h2>
            <p className="text-sm text-[color:var(--text-muted)]">{t('auth.register.subtitle')}</p>
          </div>
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
