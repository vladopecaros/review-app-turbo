import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

export function CtaBanner() {
  const t = useTranslations();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="surface-panel relative overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_90%_80%,rgba(34,197,94,0.08),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t('cta.headline')}</h2>
            <p className="mt-2 max-w-xl text-[color:var(--text-muted)]">{t('cta.sub')}</p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 sm:self-auto">
            <span className="select-none font-mono text-xs text-[color:var(--text-muted)]">$</span>
            <span className="font-mono text-xs text-emerald-300">{t('cta.command')}</span>
          </div>
          <Link href="/register">
            <Button size="lg">{t('cta.button')}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
