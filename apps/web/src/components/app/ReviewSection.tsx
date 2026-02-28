'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import type { Review, ReviewPagination } from '@/types';

function parseError(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'message' in error.response.data &&
    typeof error.response.data.message === 'string'
  ) {
    return error.response.data.message;
  }
  return fallback;
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const minutes = Math.round(diff / 60_000);
  if (Math.abs(minutes) < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.round(diff / 3_600_000);
  if (Math.abs(hours) < 24) return rtf.format(-hours, 'hour');
  const days = Math.round(diff / 86_400_000);
  if (Math.abs(days) < 30) return rtf.format(-days, 'day');
  const months = Math.round(diff / 2_592_000_000);
  if (Math.abs(months) < 12) return rtf.format(-months, 'month');
  return rtf.format(-Math.round(diff / 31_536_000_000), 'year');
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-600'}>
          {star <= rating ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

function StatusBadge({ status }: { status: Review['status'] }) {
  return (
    <Badge
      className={cn(
        'shrink-0',
        status === 'pending' && 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200',
        status === 'published' && 'border-green-500/40 bg-green-500/10 text-green-200',
        status === 'rejected' && 'border-red-500/40 bg-red-500/10 text-red-200',
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

type StatusFilter = 'published' | 'pending' | 'rejected' | undefined;

export function ReviewSection({ orgId, productId }: { orgId: string; productId?: string }) {
  const t = useTranslations();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pagination, setPagination] = useState<ReviewPagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadRequestIdRef = useRef(0);

  async function loadReviews(page: number, status: StatusFilter, rating: number | undefined) {
    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;

    setIsRefreshing(true);
    setError(null);

    try {
      const response = await api.get(`/organization/${orgId}/reviews`, {
        params: {
          scope: productId ? 'product' : 'all',
          productId: productId ?? undefined,
          status: status ?? undefined,
          rating: rating ?? undefined,
          page,
          limit: 20,
        },
      });

      if (loadRequestIdRef.current !== requestId) return;

      setReviews((response.data?.reviews ?? []) as Review[]);
      setPagination((response.data?.pagination ?? null) as ReviewPagination | null);
    } catch (err) {
      if (loadRequestIdRef.current !== requestId) return;
      setError(parseError(err, t('common.error')));
    } finally {
      if (loadRequestIdRef.current !== requestId) return;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    setIsLoading(true);
    setReviews([]);
    setPagination(null);
    void loadReviews(currentPage, statusFilter, ratingFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, productId]);

  function handleStatusChange(next: StatusFilter) {
    setStatusFilter(next);
    setCurrentPage(1);
    setIsLoading(true);
    setReviews([]);
    setPagination(null);
    void loadReviews(1, next, ratingFilter);
  }

  function handleRatingChange(next: number | undefined) {
    setRatingFilter(next);
    setCurrentPage(1);
    setIsLoading(true);
    setReviews([]);
    setPagination(null);
    void loadReviews(1, statusFilter, next);
  }

  function handlePageChange(next: number) {
    setCurrentPage(next);
    setIsLoading(true);
    setReviews([]);
    setPagination(null);
    void loadReviews(next, statusFilter, ratingFilter);
  }

  async function handleUpdateStatus(review: Review, action: 'published' | 'rejected') {
    const label = action === 'published' ? t('app.reviews.approve') : t('app.reviews.reject');
    const confirmed = window.confirm(`${label} this review by ${review.reviewerName}?`);
    if (!confirmed) return;

    setError(null);
    setSuccess(null);

    try {
      await api.patch(`/organization/${orgId}/reviews/${review._id}/status`, { status: action });
      setReviews((prev) => prev.map((r) => (r._id === review._id ? { ...r, status: action } : r)));
      setSuccess(action === 'published' ? t('app.reviews.approveSuccess') : t('app.reviews.rejectSuccess'));
    } catch (err) {
      setError(parseError(err, t('app.reviews.moderationError')));
    }
  }

  const statusOptions: { label: string; value: StatusFilter }[] = [
    { label: t('app.reviews.filterAll'), value: undefined },
    { label: t('app.reviews.filterPending'), value: 'pending' },
    { label: t('app.reviews.filterPublished'), value: 'published' },
    { label: t('app.reviews.filterRejected'), value: 'rejected' },
  ];

  const ratingOptions: { label: string; value: number | undefined }[] = [
    { label: t('app.reviews.filterRatingAll'), value: undefined },
    { label: t('app.reviews.filterRating1'), value: 1 },
    { label: t('app.reviews.filterRatingN', { n: 2 }), value: 2 },
    { label: t('app.reviews.filterRatingN', { n: 3 }), value: 3 },
    { label: t('app.reviews.filterRatingN', { n: 4 }), value: 4 },
    { label: t('app.reviews.filterRatingN', { n: 5 }), value: 5 },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>{t('app.reviews.title')}</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadReviews(currentPage, statusFilter, ratingFilter)}
          disabled={isRefreshing}
        >
          {isRefreshing ? t('common.loading') : t('app.reviews.refresh')}
        </Button>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-sm text-[color:var(--text-muted)]">{t('app.reviews.description')}</p>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => handleStatusChange(opt.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition',
                statusFilter === opt.value
                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-100'
                  : 'border-white/10 text-[color:var(--text-muted)] hover:border-white/20 hover:text-[color:var(--text)]',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Rating filter pills */}
        <div className="flex flex-wrap gap-2">
          {ratingOptions.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => handleRatingChange(opt.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition',
                ratingFilter === opt.value
                  ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-100'
                  : 'border-white/10 text-[color:var(--text-muted)] hover:border-white/20 hover:text-[color:var(--text)]',
              )}
            >
              {opt.value !== undefined
                ? `${'★'.repeat(opt.value)}${'☆'.repeat(5 - opt.value)}`
                : opt.label}
            </button>
          ))}
        </div>

        {error ? <p className="text-sm text-red-200">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-200">{success}</p> : null}

        {isLoading ? (
          <p className="text-sm text-[color:var(--text-muted)]">{t('app.reviews.loading')}</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-[color:var(--text-muted)]">
            {statusFilter || ratingFilter !== undefined
              ? t('app.reviews.emptyFiltered', { status: statusFilter ?? `${ratingFilter} stars` })
              : t('app.reviews.empty')}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <StarRating rating={review.rating} />
                  <StatusBadge status={review.status} />
                </div>

                {/* Reviewer info */}
                <div className="text-sm text-[color:var(--text-muted)]">
                  <span className="font-medium text-[color:var(--text)]">{review.reviewerName}</span>
                  {' · '}
                  <span>{review.reviewerEmail}</span>
                </div>

                {/* Truncated review text */}
                <p className="line-clamp-2 text-sm text-[color:var(--text)]">{review.text}</p>

                {/* Product context badge (only on org-wide view) */}
                {!productId ? (
                  <p className="text-xs text-[color:var(--text-muted)]">
                    {review.productId ? (
                      <Badge className="border-blue-500/20 bg-blue-500/5 text-blue-300 text-xs">
                        {t('app.reviews.scopeLabel')}
                      </Badge>
                    ) : (
                      <Badge className="border-white/10 bg-white/5 text-[color:var(--text-muted)] text-xs">
                        {t('app.reviews.orgLevelReview')}
                      </Badge>
                    )}
                  </p>
                ) : null}

                {/* Timestamp */}
                <p className="text-xs text-[color:var(--text-muted)]">
                  {formatRelative(review.createdAt)}
                </p>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3">
                  <Link href={`/app/orgs/${orgId}/reviews/${review._id}`}>
                    <Button size="sm" variant="outline">
                      {t('app.reviews.viewDetails')}
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => void handleUpdateStatus(review, 'published')}
                    disabled={review.status === 'published'}
                  >
                    {t('app.reviews.approve')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void handleUpdateStatus(review, 'rejected')}
                    disabled={review.status === 'rejected'}
                  >
                    {t('app.reviews.reject')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
            >
              {t('app.reviews.prevPage')}
            </Button>
            <p className="text-xs text-[color:var(--text-muted)]">
              {t('app.reviews.pageInfo', {
                page: currentPage,
                total: pagination.totalPages,
                count: pagination.total,
              })}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.totalPages || isLoading}
            >
              {t('app.reviews.nextPage')}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
