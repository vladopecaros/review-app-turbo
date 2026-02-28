import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Organization } from '@/types';

export function OrgList({ orgs }: { orgs: Organization[] }) {
  const t = useTranslations();

  if (orgs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('app.orgs.empty')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[color:var(--text-muted)]">{t('app.orgs.createTitle')}</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {orgs.map((org) => (
        <Card key={org._id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="line-clamp-1">{org.name}</CardTitle>
          </CardHeader>
          <CardContent className="mt-auto space-y-4">
            <div className="space-y-1 text-sm text-[color:var(--text-muted)]">
              <p>
                <span className="text-[color:var(--text)]">{t('common.slug')}:</span> {org.slug}
              </p>
              <p className="truncate">
                <span className="text-[color:var(--text)]">{t('common.id')}:</span> {org._id}
              </p>
            </div>
            <Link href={`/app/orgs/${org._id}`}>
              <Button variant="outline" className="w-full">
                {t('app.orgs.view')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
