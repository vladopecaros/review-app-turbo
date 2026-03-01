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

  const rootClass = ['rc-root', 'rc-form', className].filter(Boolean).join(' ');

  if (state.status === 'success') {
    return (
      <div className={rootClass}>
        <div className="rc-form__success">
          <span className="rc-form__success-icon">✓</span>
          <p className="rc-form__success-heading">Thank you!</p>
          <p className="rc-form__success-message">Your review has been submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <form className={rootClass} onSubmit={handleSubmit} noValidate>
      <h3 className="rc-form__title">{title}</h3>

      <div className="rc-field">
        <span className="rc-label">Rating</span>
        <StarRating value={rating} onChange={setRating} />
        {errors.rating ? <span className="rc-field__error">{errors.rating}</span> : null}
      </div>

      <div className="rc-field">
        <label className="rc-label" htmlFor="rc-text">Review</label>
        <textarea
          id="rc-text"
          className="rc-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your experience…"
          rows={4}
        />
        {errors.text ? <span className="rc-field__error">{errors.text}</span> : null}
      </div>

      <div className="rc-field">
        <label className="rc-label" htmlFor="rc-name">Your name</label>
        <input
          id="rc-name"
          className="rc-input"
          type="text"
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          placeholder="Jane Smith"
        />
        {errors.reviewerName ? <span className="rc-field__error">{errors.reviewerName}</span> : null}
      </div>

      <div className="rc-field">
        <label className="rc-label" htmlFor="rc-email">Email address</label>
        <input
          id="rc-email"
          className="rc-input"
          type="email"
          value={reviewerEmail}
          onChange={(e) => setReviewerEmail(e.target.value)}
          placeholder="jane@example.com"
        />
        {errors.reviewerEmail ? <span className="rc-field__error">{errors.reviewerEmail}</span> : null}
      </div>

      {state.status === 'error' ? (
        <p className="rc-error-message">{state.message}</p>
      ) : null}

      <button
        type="submit"
        className="rc-button"
        disabled={state.status === 'submitting'}
      >
        {state.status === 'submitting' ? 'Submitting…' : submitLabel}
      </button>
    </form>
  );
}
