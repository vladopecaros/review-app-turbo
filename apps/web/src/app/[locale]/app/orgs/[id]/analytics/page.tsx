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
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

import { InvitationActions } from '@/components/app/InvitationActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import type { Organization, Product } from '@/types';

type LoadState = 'loading' | 'ready' | 'invited' | 'error';
type Granularity = 'day' | 'week' | 'month';

interface AnalyticsSummary {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { rating: number; count: number }[];
}

interface TrendBucket {
  period: string;
  count: number;
  averageRating: number;
}

const RATING_COLORS: Record<number, string> = {
  5: '#22c55e',
  4: '#3b82f6',
  3: '#eab308',
  2: '#f97316',
  1: '#ef4444',
};

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#0d1117',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    fontSize: '12px',
  },
  labelStyle: { color: '#94a3b8' },
  itemStyle: { color: '#e2e8f0' },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
};

function buildQueryString(params: Record<string, string | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join('&');
  return parts ? `?${parts}` : '';
}

export default function AnalyticsPage() {
  const t = useTranslations();
  const params = useParams<{ id: string }>();
  const orgId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);

  const [org, setOrg] = useState<Organization | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<TrendBucket[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [state, setState] = useState<LoadState>('loading');
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [exportTruncated, setExportTruncated] = useState(false);

  const selectedExtId = useMemo(
    () => products.find((p) => p._id === selectedProductId)?.externalProductId ?? '',
    [products, selectedProductId],
  );

  const fetchSummaryAndTrends = useCallback(
    async (extProductId: string, start: string, end: string, gran: Granularity) => {
      if (!orgId) return;
      setFiltersLoading(true);
      setTrendsLoading(true);

      const sharedParams = {
        ...(extProductId ? { externalProductId: extProductId } : {}),
        ...(start ? { startDate: start } : {}),
        ...(end ? { endDate: end } : {}),
      };

      try {
        const [summaryRes, trendsRes] = await Promise.all([
          api.get(`/organization/${orgId}/analytics/summary${buildQueryString(sharedParams)}`),
          api.get(
            `/organization/${orgId}/analytics/trends${buildQueryString({ ...sharedParams, granularity: gran })}`,
          ),
        ]);
        setSummary(summaryRes.data?.data as AnalyticsSummary);
        setTrends((trendsRes.data?.data ?? []) as TrendBucket[]);
      } catch {
        // Keep previous data on filter error
      } finally {
        setFiltersLoading(false);
        setTrendsLoading(false);
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
        const orgRes = await api.get(`/organization/${orgId}`);

        if (cancelled) return;

        const payload = (orgRes.data?.organization ?? orgRes.data) as Organization;
        const membershipStatus = orgRes.data?.membershipStatus as 'active' | 'invited' | undefined;
        const pendingInvitationId = orgRes.data?.invitationId as string | null | undefined;

        setOrg(payload);

        if (membershipStatus === 'invited' && pendingInvitationId) {
          setInvitationId(pendingInvitationId);
          setState('invited');
          return;
        }

        const [productsRes, summaryRes, trendsRes] = await Promise.all([
          api.get(`/organization/${orgId}/products`),
          api.get(`/organization/${orgId}/analytics/summary`),
          api.get(`/organization/${orgId}/analytics/trends?granularity=day`),
        ]);

        if (cancelled) return;

        setProducts((productsRes.data?.products ?? productsRes.data ?? []) as Product[]);
        setSummary(summaryRes.data?.data as AnalyticsSummary);
        setTrends((trendsRes.data?.data ?? []) as TrendBucket[]);

        setInvitationId(null);
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

  async function handleProductChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const productId = e.target.value;
    setSelectedProductId(productId);
    const extId = products.find((p) => p._id === productId)?.externalProductId ?? '';
    await fetchSummaryAndTrends(extId, startDate, endDate, granularity);
  }

  async function handleDateChange(field: 'start' | 'end', value: string) {
    const newStart = field === 'start' ? value : startDate;
    const newEnd = field === 'end' ? value : endDate;
    if (field === 'start') setStartDate(value);
    else setEndDate(value);
    await fetchSummaryAndTrends(selectedExtId, newStart, newEnd, granularity);
  }

  async function handleGranularityChange(gran: Granularity) {
    setGranularity(gran);
    setTrendsLoading(true);
    try {
      const sharedParams = {
        ...(selectedExtId ? { externalProductId: selectedExtId } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        granularity: gran,
      };
      const res = await api.get(
        `/organization/${orgId}/analytics/trends${buildQueryString(sharedParams)}`,
      );
      setTrends((res.data?.data ?? []) as TrendBucket[]);
    } catch {
      // keep previous
    } finally {
      setTrendsLoading(false);
    }
  }

  function handleExport() {
    if (!orgId) return;
    const sharedParams = {
      ...(selectedExtId ? { externalProductId: selectedExtId } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    };
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
    const url = `${baseUrl}/organization/${orgId}/analytics/export${buildQueryString(sharedParams)}`;

    // Use a fetch with auth header to get the response, then create blob URL
    const token = (() => {
      try {
        const stored = localStorage.getItem('reviewlico-auth');
        if (!stored) return null;
        const parsed = JSON.parse(stored) as { state?: { accessToken?: string } };
        return parsed?.state?.accessToken ?? null;
      } catch {
        return null;
      }
    })();

    void fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async (res) => {
        if (res.headers.get('X-Export-Truncated') === 'true') setExportTruncated(true);
        const blob = await res.blob();
        const anchor = document.createElement('a');
        anchor.href = URL.createObjectURL(blob);
        anchor.download = 'reviews.csv';
        anchor.click();
        URL.revokeObjectURL(anchor.href);
      })
      .catch(() => {/* ignore */});
  }

  async function handleClearDates() {
    setStartDate('');
    setEndDate('');
    await fetchSummaryAndTrends(selectedExtId, '', '', granularity);
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
  const hasDates = startDate || endDate;

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

      {/* Filters row */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Product filter */}
        {products.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
              {t('app.analytics.productFilter')}
            </label>
            <select
              value={selectedProductId}
              onChange={handleProductChange}
              disabled={filtersLoading}
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

        {/* Date range */}
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
            {t('app.analytics.dateRange')}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              disabled={filtersLoading}
              onChange={(e) => void handleDateChange('start', e.target.value)}
              className="rounded-lg border border-[color:var(--border)] bg-black/30 px-3 py-2 text-sm text-[color:var(--text)] focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50"
            />
            <span className="text-xs text-[color:var(--text-muted)]">—</span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              disabled={filtersLoading}
              onChange={(e) => void handleDateChange('end', e.target.value)}
              className="rounded-lg border border-[color:var(--border)] bg-black/30 px-3 py-2 text-sm text-[color:var(--text)] focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50"
            />
            {hasDates && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleClearDates()}
                disabled={filtersLoading}
              >
                {t('app.analytics.clearDates')}
              </Button>
            )}
          </div>
        </div>

        {/* Export */}
        <div className="ml-auto flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.14em] text-transparent select-none">
            &nbsp;
          </span>
          <Button variant="outline" size="sm" onClick={handleExport}>
            {t('app.analytics.exportCsv')}
          </Button>
        </div>
      </div>

      {exportTruncated && (
        <p className="text-xs text-yellow-400">{t('app.analytics.exportTruncated')}</p>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
              {t('app.analytics.totalReviews')}
            </p>
            <p className="mt-2 font-display text-4xl font-semibold tracking-tight">
              {filtersLoading ? '—' : (summary?.totalReviews ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
              {t('app.analytics.averageRating')}
            </p>
            <p className="mt-2 font-display text-4xl font-semibold tracking-tight">
              {filtersLoading ? '—' : isEmpty ? '—' : summary.averageRating.toFixed(2)}
              {!filtersLoading && !isEmpty && (
                <span className="ml-2 text-lg text-yellow-400">★</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trends chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle>{t('app.analytics.trends')}</CardTitle>
          {/* Granularity toggle */}
          <div className="flex rounded-lg border border-[color:var(--border)] overflow-hidden text-xs">
            {(['day', 'week', 'month'] as Granularity[]).map((g) => (
              <button
                key={g}
                onClick={() => void handleGranularityChange(g)}
                disabled={trendsLoading}
                className={[
                  'px-3 py-1.5 transition-colors disabled:opacity-50',
                  granularity === g
                    ? 'bg-white/10 text-[color:var(--text)]'
                    : 'text-[color:var(--text-muted)] hover:bg-white/5',
                ].join(' ')}
              >
                {t(`app.analytics.granularity${g.charAt(0).toUpperCase() + g.slice(1)}` as Parameters<typeof t>[0])}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {trends.length === 0 ? (
            <p className="py-8 text-center text-sm text-[color:var(--text-muted)]">
              {t('app.analytics.trendsNoData')}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={trends}
                margin={{ top: 4, right: 20, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={tooltipStyle.contentStyle}
                  labelStyle={tooltipStyle.labelStyle}
                  itemStyle={tooltipStyle.itemStyle}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name={t('app.analytics.count')}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

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
                  contentStyle={tooltipStyle.contentStyle}
                  labelStyle={tooltipStyle.labelStyle}
                  itemStyle={tooltipStyle.itemStyle}
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
