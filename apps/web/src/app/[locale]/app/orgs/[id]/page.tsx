'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import axios from 'axios';

import { OrgDetail } from '@/components/app/OrgDetail';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import type { Organization } from '@/types';

type LoadState = 'loading' | 'ready' | 'forbidden' | 'error';

export default function OrgDetailPage() {
  const t = useTranslations();
  const params = useParams<{ id: string }>();
  const orgId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);

  const [org, setOrg] = useState<Organization | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      return;
    }

    let cancelled = false;

    async function load() {
      setState('loading');
      setError(null);

      try {
        const response = await api.get(`/organization/${orgId}`);
        if (cancelled) {
          return;
        }

        const payload = (response.data?.organization ?? response.data) as Organization;
        setOrg(payload);
        setState('ready');
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setState('forbidden');
          return;
        }

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
      <div className="space-y-4 pb-20 md:pb-0">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  if (state === 'forbidden') {
    return (
      <Card className="pb-2">
        <CardHeader>
          <CardTitle>{t('app.orgDetail.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[color:var(--text-muted)]">{t('app.orgDetail.pending')}</p>
          <Link href="/app">
            <Button variant="outline">{t('app.invitation.backToApp')}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!orgId || state === 'error' || !org) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('app.orgDetail.title')}</CardTitle>
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
    <div className="pb-20 md:pb-0">
      <OrgDetail org={org} />
    </div>
  );
}
