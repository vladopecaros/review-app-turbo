'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { ReviewSection } from '@/components/app/ReviewSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import type { Organization } from '@/types';

type LoadState = 'loading' | 'ready' | 'error';

export default function OrgReviewsPage() {
  const t = useTranslations();
  const params = useParams<{ id: string }>();
  const orgId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);

  const [org, setOrg] = useState<Organization | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;

    let cancelled = false;

    async function load() {
      setState('loading');
      setError(null);

      try {
        const response = await api.get(`/organization/${orgId}`);
        if (cancelled) return;

        const payload = (response.data?.organization ?? response.data) as Organization;
        setOrg(payload);
        setState('ready');
      } catch (err) {
        if (cancelled) return;
        setState('error');
        setError(err instanceof Error ? err.message : t('common.error'));
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [orgId, t]);

  if (state === 'loading') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (!orgId || state === 'error' || !org) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('app.reviews.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-red-200">{error ?? t('common.error')}</p>
          <Link href="/app">
            <Button variant="outline">{t('app.invitation.backToApp')}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl tracking-tight">{org.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-[color:var(--text-muted)]">
          <p>{t('app.reviews.pageHint')}</p>
          <Link href={`/app/orgs/${org._id}`}>
            <Button variant="outline" size="sm">
              {t('app.reviews.backToOrganization')}
            </Button>
          </Link>
        </CardContent>
      </Card>

      <ReviewSection orgId={org._id} />
    </div>
  );
}
