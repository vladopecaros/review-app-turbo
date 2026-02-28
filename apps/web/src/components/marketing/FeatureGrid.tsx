import { useTranslations } from 'next-intl';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type FeatureItem = {
  title: string;
  description: string;
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
            </CardHeader>
            <CardContent className="pt-0" />
          </Card>
        ))}
      </div>
    </section>
  );
}
