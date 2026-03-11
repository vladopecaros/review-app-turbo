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

  const rootClass = ['flex flex-col gap-5 p-4 sm:p-6 mx-auto max-w-6xl', className].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold tracking-tight text-[#e8edf5]">{title}</h3>
        {showForm && !formVisible ? (
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-lg border border-[#1e2530] bg-transparent px-3 text-sm text-[#8a98ab] transition-colors hover:bg-white/5 hover:text-[#e8edf5]"
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
              className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      ) : state.status === 'error' ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-300">{state.message}</p>
      ) : state.status === 'success' && state.data.reviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#8a98ab]">No reviews yet. Be the first!</p>
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
            className="inline-flex h-9 items-center rounded-lg border border-[#1e2530] bg-transparent px-3 text-sm text-[#8a98ab] transition-colors hover:bg-white/5 hover:text-[#e8edf5] disabled:pointer-events-none disabled:opacity-40"
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1 || state.status === 'loading'}
          >
            ← Previous
          </button>
          <span className="text-xs text-[#8a98ab]">
            Page {page} of {pagination.totalPages} · {pagination.total} reviews
          </span>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-lg border border-[#1e2530] bg-transparent px-3 text-sm text-[#8a98ab] transition-colors hover:bg-white/5 hover:text-[#e8edf5] disabled:pointer-events-none disabled:opacity-40"
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
