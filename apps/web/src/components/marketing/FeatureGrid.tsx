import { useTranslations } from 'next-intl';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { StyleVariantToggle } from './StyleVariantToggle';

type FeatureItem = {
  title: string;
  description: string;
  code?: string;
};

export function FeatureGrid() {
  const t = useTranslations();
  const items = t.raw('features.items') as FeatureItem[];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="mb-8 space-y-2">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t('features.title')}</h2>
        <p className="max-w-2xl text-[color:var(--text-muted)]">{t('features.subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <Card
            key={item.title}
            className="group border-[color:var(--border)] transition hover:-translate-y-0.5 hover:border-blue-400/40"
          >
            <CardHeader>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm font-semibold text-blue-200">
                {String(index + 1).padStart(2, '0')}
              </div>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
              {item.code ? (
                <div className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-2.5 py-1 transition-colors group-hover:border-blue-400/30 group-hover:bg-blue-500/5">
                  <span className="font-mono text-xs text-emerald-300">{item.code}</span>
                </div>
              ) : null}
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="mt-12 border-t border-white/5 pt-12">
        <StyleVariantToggle />
      </div>
    </section>
  );
}
