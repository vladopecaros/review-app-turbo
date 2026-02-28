import { useTranslations } from 'next-intl';

import { Footer } from '@/components/marketing/Footer';
import { Navbar } from '@/components/marketing/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type SecuritySection = {
  title: string;
  body: string;
};

export default function SecurityPage() {
  const t = useTranslations();
  const sections = [
    t.raw('security.sections.auth') as SecuritySection,
    t.raw('security.sections.apiKey') as SecuritySection,
    t.raw('security.sections.https') as SecuritySection,
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:py-18">
        <div className="mb-8 space-y-3">
          <h1 className="font-display text-4xl font-semibold tracking-tight">{t('security.title')}</h1>
          <p className="max-w-3xl leading-7 text-[color:var(--text-muted)]">{t('security.intro')}</p>
        </div>

        <div className="grid gap-4">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription className="leading-7">{section.body}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0" />
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
