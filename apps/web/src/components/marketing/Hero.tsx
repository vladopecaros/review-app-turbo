import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function Hero() {
  const t = useTranslations();

  return (
    <section className="grid-lines relative overflow-hidden border-b border-white/5">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-24">
        <div className="space-y-6">
          <Badge className="animate-fade-up">{t('hero.badge')}</Badge>

          <div className="space-y-3">
            <h1 className="animate-fade-up-delay-1 font-display text-4xl font-bold leading-tight tracking-tight text-[color:var(--text)] sm:text-5xl lg:text-6xl">
              <span className="block">{t('hero.headlineLine1')}</span>
              <span className="block text-blue-300">{t('hero.headlineLine2')}</span>
            </h1>
            <p className="animate-fade-up-delay-2 max-w-xl text-base leading-7 text-[color:var(--text-muted)] sm:text-lg">
              {t('hero.sub')}
            </p>
          </div>

          <div className="animate-fade-up-delay-3 flex flex-col gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg">{t('hero.cta')}</Button>
            </Link>
            <Link href="/security">
              <Button variant="outline" size="lg">
                {t('hero.ctaSecondary')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="surface-panel code-fade animate-fade-up-delay-2 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[color:var(--border)] px-4 py-3 text-xs text-[color:var(--text-muted)]">
            <span>{t('hero.snippetTitle')}</span>
            <span className="font-mono">POST /reviews</span>
          </div>
          <pre className="overflow-x-auto p-4 text-sm leading-6 font-mono text-[color:var(--text)]">
            <code>
              <span className="text-blue-300">curl</span> <span className="text-zinc-300">-X</span> <span className="text-emerald-300">POST</span> <span className="text-zinc-300">https://api.reviewlico.dev/reviews</span>{'\n'}
              <span className="text-zinc-400">  -H</span>{' '}
              <span className="text-amber-200">{`'Authorization: Bearer <API_KEY>'`}</span>
              {'\n'}
              <span className="text-zinc-400">  -H</span>{' '}
              <span className="text-amber-200">{`'Content-Type: application/json'`}</span>
              {'\n'}
              <span className="text-zinc-400">  -d</span>{' '}
              <span className="text-zinc-100">{`'{"rating":5,"review":"Fast setup."}'`}</span>
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}
