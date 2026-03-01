'use client';

import { useState } from 'react';
import type { ReviewListProps } from '../../shared/types';
import { useReviews } from '../../shared/hooks/useReviews';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';

function ReviewListInner({
  config,
  limit = 10,
  title = 'Customer Reviews',
  showForm = false,
  className,
}: ReviewListProps) {
  const [page, setPage] = useState(1);
  const [formVisible, setFormVisible] = useState(false);
  const { state, reload } = useReviews(config, page, limit);

  const pagination = state.status === 'success' ? state.data.pagination : null;

  function handleFormSuccess() {
    setFormVisible(false);
    if (page === 1) {
      reload();
    } else {
      setPage(1);
    }
  }

  const rootClass = ['flex flex-col gap-5', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-gray-100">{title}</h3>
        {showForm && !formVisible ? (
          <button
            type="button"
            className="rounded-lg border border-gray-700 px-3.5 py-1.5 text-sm text-gray-400 transition-colors hover:border-blue-500 hover:text-gray-100"
            onClick={() => setFormVisible(true)}
          >
            Write a review
          </button>
        ) : null}
      </div>

      {formVisible ? (
        <ReviewForm config={config} onSuccess={handleFormSuccess} />
      ) : null}

      {state.status === 'loading' ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-gray-700 bg-gray-800"
            />
          ))}
        </div>
      ) : state.status === 'error' ? (
        <p className="py-8 text-center text-sm text-red-400">{state.message}</p>
      ) : state.status === 'success' && state.data.reviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No reviews yet. Be the first!</p>
      ) : state.status === 'success' ? (
        <div className="flex flex-col gap-3">
          {state.data.reviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>
      ) : null}

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            type="button"
            className="rounded-lg border border-gray-700 px-3.5 py-1.5 text-sm text-gray-400 transition-colors hover:border-blue-500 hover:text-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1 || state.status === 'loading'}
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-400">
            Page {page} of {pagination.totalPages} · {pagination.total} reviews
          </span>
          <button
            type="button"
            className="rounded-lg border border-gray-700 px-3.5 py-1.5 text-sm text-gray-400 transition-colors hover:border-blue-500 hover:text-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= pagination.totalPages || state.status === 'loading'}
          >
            Next →
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ReviewList(props: ReviewListProps) {
  const { config } = props;
  const key = [
    config.apiUrl ?? '',
    config.apiKey ?? '',
    config.externalProductId ?? '',
  ].join('|');
  return <ReviewListInner key={key} {...props} />;
}
