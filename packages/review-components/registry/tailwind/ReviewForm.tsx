'use client';

import { useEffect, useState } from 'react';
import type { ReviewFormProps } from '../../shared/types';
import { useSubmitReview } from '../../shared/hooks/useSubmitReview';
import { StarRating } from './StarRating';

export function ReviewForm({
  config,
  onSuccess,
  onError,
  title = 'Write a Review',
  submitLabel = 'Submit Review',
  className,
}: ReviewFormProps) {
  const { state, submit } = useSubmitReview(config);

  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (state.status === 'success') onSuccess?.(state.review);
    if (state.status === 'error') onError?.(state.message);
  }, [state, onSuccess, onError]);

  function validate() {
    const next: Record<string, string> = {};
    if (rating === 0) next.rating = 'Please select a star rating.';
    if (!text.trim()) next.text = 'Review text is required.';
    if (text.trim().length > 5000) next.text = 'Review must be 5000 characters or less.';
    if (!reviewerName.trim()) next.reviewerName = 'Your name is required.';
    if (!reviewerEmail.trim()) next.reviewerEmail = 'Your email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reviewerEmail.trim())) {
      next.reviewerEmail = 'Enter a valid email address.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    void submit({
      rating,
      text: text.trim(),
      reviewerName: reviewerName.trim(),
      reviewerEmail: reviewerEmail.trim(),
    });
  }

  const inputClass =
    'w-full rounded-lg border border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-blue-500 transition-colors';
  const labelClass = 'text-xs font-medium text-gray-400';
  const errorClass = 'text-xs text-red-400';

  const rootClass = ['rounded-xl border border-gray-700 bg-gray-900 p-6 flex flex-col gap-5', className]
    .filter(Boolean)
    .join(' ');

  if (state.status === 'success') {
    return (
      <div className={rootClass}>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="text-3xl leading-none">✓</span>
          <p className="text-lg font-semibold text-green-400">Thank you!</p>
          <p className="text-sm text-gray-400">Your review has been submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <form className={rootClass} onSubmit={handleSubmit} noValidate>
      <h3 className="text-lg font-semibold text-gray-100">{title}</h3>

      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>Rating</span>
        <StarRating value={rating} onChange={setRating} />
        {errors.rating ? <span className={errorClass}>{errors.rating}</span> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="rc-text">Review</label>
        <textarea
          id="rc-text"
          className={`${inputClass} min-h-[7rem] resize-y`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your experience…"
          rows={4}
        />
        {errors.text ? <span className={errorClass}>{errors.text}</span> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="rc-name">Your name</label>
        <input
          id="rc-name"
          className={inputClass}
          type="text"
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          placeholder="Jane Smith"
        />
        {errors.reviewerName ? <span className={errorClass}>{errors.reviewerName}</span> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="rc-email">Email address</label>
        <input
          id="rc-email"
          className={inputClass}
          type="email"
          value={reviewerEmail}
          onChange={(e) => setReviewerEmail(e.target.value)}
          placeholder="jane@example.com"
        />
        {errors.reviewerEmail ? <span className={errorClass}>{errors.reviewerEmail}</span> : null}
      </div>

      {state.status === 'error' ? (
        <p className="text-sm text-red-400">{state.message}</p>
      ) : null}

      <button
        type="submit"
        className="self-start rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-55"
        disabled={state.status === 'submitting'}
      >
        {state.status === 'submitting' ? 'Submitting…' : submitLabel}
      </button>
    </form>
  );
}
