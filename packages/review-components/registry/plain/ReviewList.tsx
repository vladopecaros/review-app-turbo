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

  const rootClass = ['rc-root', 'rc-list', className].filter(Boolean).join(' ');

  const pagination = state.status === 'success' ? state.data.pagination : null;

  function handleFormSuccess() {
    setFormVisible(false);
    if (page === 1) {
      reload();
    } else {
      setPage(1);
    }
  }

  return (
    <div className={rootClass}>
      <div className="rc-list__header">
        <h3 className="rc-list__title">{title}</h3>
        {showForm && !formVisible ? (
          <button
            type="button"
            className="rc-list__toggle-form"
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
        <div className="rc-cards">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rc-skeleton rc-skeleton--card" />
          ))}
        </div>
      ) : state.status === 'error' ? (
        <p className="rc-list__error">{state.message}</p>
      ) : state.status === 'success' && state.data.reviews.length === 0 ? (
        <p className="rc-list__empty">No reviews yet. Be the first!</p>
      ) : state.status === 'success' ? (
        <div className="rc-cards">
          {state.data.reviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>
      ) : null}

      {pagination && pagination.totalPages > 1 ? (
        <div className="rc-pagination">
          <button
            type="button"
            className="rc-pagination__btn"
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1 || state.status === 'loading'}
          >
            ← Previous
          </button>
          <span className="rc-pagination__info">
            Page {page} of {pagination.totalPages} · {pagination.total} reviews
          </span>
          <button
            type="button"
            className="rc-pagination__btn"
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
