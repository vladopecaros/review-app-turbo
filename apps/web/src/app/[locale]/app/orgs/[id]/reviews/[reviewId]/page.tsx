'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import type { Product, Review } from '@/types';

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-lg">
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

type LoadState = 'loading' | 'ready' | 'error';

export default function ReviewDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams<{ id: string; reviewId: string }>();
  const orgId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);
  const reviewId = useMemo(
    () => (Array.isArray(params.reviewId) ? params.reviewId[0] : params.reviewId),
    [params.reviewId],
  );

  const [review, setReview] = useState<Review | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!orgId || !reviewId) return;

    let cancelled = false;

    async function load() {
      setState('loading');
      setError(null);

      try {
        const [reviewResponse, productsResponse] = await Promise.all([
          api.get(`/organization/${orgId}/reviews/${reviewId}`),
          api.get(`/organization/${orgId}/products`),
        ]);

        if (cancelled) return;

        const fetchedReview = (reviewResponse.data?.review ?? null) as Review | null;
        const products = (productsResponse.data?.products ?? []) as Product[];

        setReview(fetchedReview);

        if (fetchedReview?.productId) {
          const matched = products.find((p) => p._id === fetchedReview.productId);
          setProductName(matched?.name ?? null);
        }

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
  }, [orgId, reviewId, t]);

  async function handleUpdateStatus(action: 'published' | 'rejected') {
    if (!review) return;

    const label = action === 'published' ? t('app.reviews.approve') : t('app.reviews.reject');
    const confirmed = window.confirm(`${label} this review by ${review.reviewerName}?`);
    if (!confirmed) return;

    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await api.patch(`/organization/${orgId}/reviews/${review._id}/status`, { status: action });
      setReview((prev) => (prev ? { ...prev, status: action } : prev));
      setSuccess(action === 'published' ? t('app.reviews.approveSuccess') : t('app.reviews.rejectSuccess'));

      setTimeout(() => {
        router.push(`/app/orgs/${orgId}/reviews`);
      }, 800);
    } catch (err) {
      setError(parseError(err, t('app.reviews.moderationError')));
    } finally {
      setIsUpdating(false);
    }
  }

  if (state === 'loading') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (state === 'error' || !review) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('app.reviews.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-red-200">{error ?? t('common.error')}</p>
          <Link href={`/app/orgs/${orgId}/reviews`}>
            <Button variant="outline">{t('app.reviews.detailBack')}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back link */}
      <div>
        <Link
          href={`/app/orgs/${orgId}/reviews`}
          className="text-sm text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition"
        >
          ← {t('app.reviews.detailBack')}
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <StarRating rating={review.rating} />
            <StatusBadge status={review.status} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => void handleUpdateStatus('published')}
              disabled={review.status === 'published' || isUpdating}
            >
              {t('app.reviews.approve')}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => void handleUpdateStatus('rejected')}
              disabled={review.status === 'rejected' || isUpdating}
            >
              {t('app.reviews.reject')}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {error ? <p className="text-sm text-red-200">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-200">{success}</p> : null}

          {/* Reviewer info */}
          <div className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <div>
                <span className="text-[color:var(--text-muted)]">{t('app.reviews.detailReviewer')}: </span>
                <span className="font-medium">{review.reviewerName}</span>
              </div>
              <div>
                <span className="text-[color:var(--text-muted)]">{t('app.reviews.detailEmail')}: </span>
                <span>{review.reviewerEmail}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <div>
                <span className="text-[color:var(--text-muted)]">{t('app.reviews.detailProduct')}: </span>
                <span>
                  {productName ?? (review.productId ? review.productId : t('app.reviews.orgLevelReview'))}
                </span>
              </div>
              <div>
                <span className="text-[color:var(--text-muted)]">{t('app.reviews.detailSubmitted')}: </span>
                <span>{formatDate(review.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Full review text */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--text)]">
              {review.text}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
