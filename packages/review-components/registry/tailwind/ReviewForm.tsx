'use client';

import { useEffect, useState } from 'react';
import type { ReviewFormProps } from '../../shared/types';
import { useSubmitReview } from '../../shared/hooks/useSubmitReview';
import { StarRating } from './StarRating';

const KEYFRAMES = `
@keyframes rcErrorIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
@keyframes rcShake{0%,100%{transform:translateX(0)}15%{transform:translateX(-6px)}30%{transform:translateX(5px)}45%{transform:translateX(-4px)}60%{transform:translateX(3px)}75%{transform:translateX(-2px)}}
@keyframes rcSuccessIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
@keyframes rcCheckBounce{0%{transform:scale(0);opacity:0}60%{transform:scale(1.3);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes rcSpin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

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
    if (state.status === 'success') {
      const t = setTimeout(() => onSuccess?.(state.review), 2000);
      return () => clearTimeout(t);
    }
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
    'h-10 w-full rounded-lg border border-[#1e2530] bg-[#0f1318] px-3 text-sm text-[#e8edf5] placeholder:text-[#8a98ab] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 transition-colors';
  const labelClass = 'text-sm font-medium text-[#e8edf5]';
  const errorClass = 'text-xs text-red-300';

  const rootClass = [
    'rounded-2xl border border-[#1e2530] p-5 flex flex-col gap-5',
    'bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0)),#0f1318]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (state.status === 'success') {
    return (
      <div className={rootClass}>
        <style>{KEYFRAMES}</style>
        <div
          className="flex flex-col items-center gap-3 py-8 text-center"
          style={{ animation: 'rcSuccessIn 0.4s ease-out both' }}
        >
          <span
            className="text-3xl leading-none text-green-400"
            style={{ animation: 'rcCheckBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.15s both', display: 'inline-block' }}
          >
            ✓
          </span>
          <p className="text-lg font-semibold tracking-tight text-green-300">Thank you!</p>
          <p className="text-sm text-[#8a98ab]">Your review has been submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <form className={rootClass} onSubmit={handleSubmit} noValidate>
      <style>{KEYFRAMES}</style>
      <h3 className="text-lg font-semibold tracking-tight text-[#e8edf5]">{title}</h3>

      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>Rating</span>
        <StarRating value={rating} onChange={setRating} />
        {errors.rating ? (
          <span key={errors.rating} className={errorClass} style={{ animation: 'rcErrorIn 0.25s ease-out both' }}>
            {errors.rating}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="rc-text">Review</label>
        <textarea
          id="rc-text"
          className={`${inputClass} !h-auto min-h-[7rem] resize-y py-2`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your experience…"
          rows={4}
        />
        {errors.text ? (
          <span key={errors.text} className={errorClass} style={{ animation: 'rcErrorIn 0.25s ease-out both' }}>
            {errors.text}
          </span>
        ) : null}
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
        {errors.reviewerName ? (
          <span key={errors.reviewerName} className={errorClass} style={{ animation: 'rcErrorIn 0.25s ease-out both' }}>
            {errors.reviewerName}
          </span>
        ) : null}
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
        {errors.reviewerEmail ? (
          <span key={errors.reviewerEmail} className={errorClass} style={{ animation: 'rcErrorIn 0.25s ease-out both' }}>
            {errors.reviewerEmail}
          </span>
        ) : null}
      </div>

      {state.status === 'error' ? (
        <p
          key={state.message}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
          style={{ animation: 'rcShake 0.5s ease-in-out' }}
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        className="self-start inline-flex h-9 items-center gap-2 rounded-lg border border-blue-500 bg-blue-500 px-3 text-sm font-medium text-white transition-colors hover:border-blue-600 hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:pointer-events-none disabled:opacity-50"
        disabled={state.status === 'submitting'}
      >
        {state.status === 'submitting' ? (
          <>
            <svg
              className="h-3.5 w-3.5 shrink-0"
              viewBox="0 0 14 14"
              fill="none"
              style={{ animation: 'rcSpin 0.8s linear infinite' }}
              aria-hidden="true"
            >
              <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
              <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Submitting…
          </>
        ) : submitLabel}
      </button>
    </form>
  );
}
