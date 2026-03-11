'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { InvitationActions } from '@/components/app/InvitationActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import type { Organization, Product } from '@/types';

type LoadState = 'loading' | 'ready' | 'invited' | 'error';

interface AnalyticsSummary {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { rating: number; count: number }[];
}

const RATING_COLORS: Record<number, string> = {
  5: '#22c55e',
  4: '#3b82f6',
  3: '#eab308',
  2: '#f97316',
  1: '#ef4444',
};

export default function AnalyticsPage() {
  const t = useTranslations();
  const params = useParams<{ id: string }>();
  const orgId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);

  const [org, setOrg] = useState<Organization | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [state, setState] = useState<LoadState>('loading');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationId, setInvitationId] = useState<string | null>(null);

  const fetchSummary = useCallback(
    async (extProductId: string) => {
      if (!orgId) return;
      setSummaryLoading(true);
      try {
        const params = extProductId ? `?externalProductId=${encodeURIComponent(extProductId)}` : '';
        const res = await api.get(`/organization/${orgId}/analytics/summary${params}`);
        setSummary(res.data?.data as AnalyticsSummary);
      } catch {
        // Keep previous summary on filter error
      } finally {
        setSummaryLoading(false);
      }
    },
    [orgId],
  );

  useEffect(() => {
    if (!orgId) return;

    let cancelled = false;

    async function load() {
      setState('loading');
      setError(null);

      try {
        const [orgRes, productsRes, summaryRes] = await Promise.all([
          api.get(`/organization/${orgId}`),
          api.get(`/organization/${orgId}/products`),
          api.get(`/organization/${orgId}/analytics/summary`),
        ]);

        if (cancelled) return;

        const payload = (orgRes.data?.organization ?? orgRes.data) as Organization;
        const membershipStatus = orgRes.data?.membershipStatus as 'active' | 'invited' | undefined;
        const pendingInvitationId = orgRes.data?.invitationId as string | null | undefined;

        setOrg(payload);
        setProducts((productsRes.data?.products ?? productsRes.data ?? []) as Product[]);
        setSummary(summaryRes.data?.data as AnalyticsSummary);

        if (membershipStatus === 'invited' && pendingInvitationId) {
          setInvitationId(pendingInvitationId);
          setState('invited');
          return;
        }

        setInvitationId(null);
        setState('ready');
      } catch (err) {
        if (cancelled) return;
        setState('error');
        setError(err instanceof Error ? err.message : t('common.error'));
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [orgId, t]);

  async function handleProductChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const productId = e.target.value;
    setSelectedProductId(productId);
    const extId = products.find((p) => p._id === productId)?.externalProductId ?? '';
    await fetchSummary(extId);
  }

  if (state === 'loading') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (state === 'invited' && invitationId) {
    return (
      <div>
        <Card className="mb-5 pb-2">
          <CardHeader>
            <CardTitle>{t('app.analytics.title')}</CardTitle>
          </CardHeader>
          <CardContent>
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
          <CardTitle>{t('app.analytics.title')}</CardTitle>
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

  const chartData = (summary?.ratingDistribution ?? []).map((d) => ({
    name: d.rating === 1 ? t('app.analytics.star') : t('app.analytics.stars', { n: d.rating }),
    count: d.count,
    rating: d.rating,
  }));

  const isEmpty = !summary || summary.totalReviews === 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl tracking-tight">{org.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-[color:var(--text-muted)]">
          <p>{t('app.analytics.pageHint')}</p>
          <Link href={`/app/orgs/${org._id}`}>
            <Button variant="outline" size="sm">
              {t('app.analytics.backToOrganization')}
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Product filter */}
      {products.length > 0 && (
        <div className="flex-row md:flex items-center gap-3">
          <label className="text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
            {t('app.analytics.productFilter')}
          </label>
          <select
            value={selectedProductId}
            onChange={handleProductChange}
            disabled={summaryLoading}
            className="rounded-lg border border-[color:var(--border)] bg-black/30 px-3 py-2 text-sm text-[color:var(--text)] focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50"
          >
            <option value="">{t('app.analytics.allProducts')}</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.externalProductId})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
              {t('app.analytics.totalReviews')}
            </p>
            <p className="mt-2 font-display text-4xl font-semibold tracking-tight">
              {summaryLoading ? '—' : (summary?.totalReviews ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
              {t('app.analytics.averageRating')}
            </p>
            <p className="mt-2 font-display text-4xl font-semibold tracking-tight">
              {summaryLoading ? '—' : isEmpty ? '—' : summary.averageRating.toFixed(2)}
              {!summaryLoading && !isEmpty && (
                <span className="ml-2 text-lg text-yellow-400">★</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rating distribution */}
      <Card>
        <CardHeader>
          <CardTitle>{t('app.analytics.ratingDistribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isEmpty ? (
            <p className="py-8 text-center text-sm text-[color:var(--text-muted)]">
              {t('app.analytics.noData')}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 20, left: 56, bottom: 4 }}
              >
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={52}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1117',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={RATING_COLORS[entry.rating] ?? '#6b7280'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
