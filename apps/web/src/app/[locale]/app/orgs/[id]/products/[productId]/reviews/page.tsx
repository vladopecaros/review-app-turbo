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
import type { Organization, Product } from '@/types';

type LoadState = 'loading' | 'ready' | 'error';

export default function ProductReviewsPage() {
  const t = useTranslations();
  const params = useParams<{ id: string; productId: string }>();
  const orgId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);
  const externalProductId = useMemo(
    () => (Array.isArray(params.productId) ? params.productId[0] : params.productId),
    [params.productId],
  );

  const [org, setOrg] = useState<Organization | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId || !externalProductId) return;

    let cancelled = false;

    async function load() {
      setState('loading');
      setError(null);

      try {
        const [orgResponse, productsResponse] = await Promise.all([
          api.get(`/organization/${orgId}`),
          api.get(`/organization/${orgId}/products`),
        ]);

        if (cancelled) return;

        const orgPayload = (orgResponse.data?.organization ?? orgResponse.data) as Organization;
        const products = (productsResponse.data?.products ?? []) as Product[];
        const found =
          products.find((p) => p.externalProductId === externalProductId) ??
          null;

        setOrg(orgPayload);
        setProduct(found);
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
  }, [orgId, externalProductId, t]);

  if (state === 'loading') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (!orgId || !externalProductId || state === 'error' || !org) {
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
          <CardTitle className="font-display text-2xl tracking-tight">
            {product?.name ?? t('app.reviews.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-[color:var(--text-muted)]">
          <p>{t('app.reviews.productPageHint')}</p>
          <Link href={`/app/orgs/${org._id}/products`}>
            <Button variant="outline" size="sm">
              {t('app.reviews.backToProducts')}
            </Button>
          </Link>
        </CardContent>
      </Card>

      <ReviewSection orgId={org._id} externalProductId={externalProductId} />
    </div>
  );
}
