'use client';

import { useTranslations } from 'next-intl';

import { CreateOrgForm } from '@/components/app/CreateOrgForm';
import { OrgList } from '@/components/app/OrgList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrgs } from '@/hooks/useOrgs';

export default function AppDashboardPage() {
  const t = useTranslations();
  const { orgs, isLoading, error, refresh, createOrg } = useOrgs();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-display text-2xl tracking-tight">{t('app.orgs.title')}</CardTitle>
            <p className="text-sm text-[color:var(--text-muted)]">{t('app.orgs.subtitle')}</p>
          </div>
          <Button variant="outline" onClick={() => void refresh()}>
            {t('app.orgs.refresh')}
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
          ) : null}
        </CardContent>
      </Card>

      <CreateOrgForm onCreate={createOrg} />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : (
        <OrgList orgs={orgs} />
      )}
    </div>
  );
}
