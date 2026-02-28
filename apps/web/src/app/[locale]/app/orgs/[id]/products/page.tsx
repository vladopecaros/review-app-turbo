'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { InvitationActions } from '@/components/app/InvitationActions';
import { ProductSection } from '@/components/app/ProductSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import type { Organization } from '@/types';

type LoadState = 'loading' | 'ready' | 'invited' | 'error';

export default function OrganizationProductsPage() {
  const t = useTranslations();
  const params = useParams<{ id: string }>();
  const orgId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);

  const [org, setOrg] = useState<Organization | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [invitationId, setInvitationId] = useState<string | null>(null);

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
        const membershipStatus = response.data?.membershipStatus as
          | 'active'
          | 'invited'
          | undefined;
        const pendingInvitationId = response.data?.invitationId as
          | string
          | null
          | undefined;

        setOrg(payload);

        if (membershipStatus === 'invited' && pendingInvitationId) {
          setInvitationId(pendingInvitationId);
          setState('invited');
          return;
        }

        setInvitationId(null);
        setState('ready');
      } catch (err) {
        if (cancelled) {
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
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (state === 'invited' && invitationId) {
    return (
      <div>
        <Card className="mb-5 pb-2">
          <CardHeader>
            <CardTitle>{t('app.orgDetail.products.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[color:var(--text-muted)]">{t('app.orgDetail.pending')}</p>
          </CardContent>
        </Card>
        <InvitationActions invitationId={invitationId} />
      </div>
    );
  }

  if (!orgId || state === 'error' || !org) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('app.orgDetail.products.title')}</CardTitle>
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
          <p>{t('app.orgDetail.products.pageHint')}</p>
          <Link href={`/app/orgs/${org._id}`}>
            <Button variant="outline" size="sm">
              {t('app.orgDetail.products.backToOrganization')}
            </Button>
          </Link>
        </CardContent>
      </Card>

      <ProductSection orgId={org._id} />
    </div>
  );
}
