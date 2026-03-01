'use client';

import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md';
}

export function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const [justSelected, setJustSelected] = useState(0);
  const interactive = typeof onChange !== 'undefined';
  const display = hovered > 0 ? hovered : value;

  const starsClass = ['rc-stars', size === 'sm' ? 'rc-stars--sm' : ''].filter(Boolean).join(' ');

  function handleClick(star: number) {
    onChange!(star);
    setJustSelected(star);
    setTimeout(() => setJustSelected(0), 400);
  }

  return (
    <span className={starsClass}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= display;
        const starClass = [
          'rc-star',
          filled ? 'rc-star--filled' : '',
          interactive ? 'rc-star--interactive' : '',
          interactive && justSelected === star ? 'rc-star--just-selected' : '',
        ]
          .filter(Boolean)
          .join(' ');

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              className={starClass}
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
              onClick={() => handleClick(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
            >
              ★
            </button>
          );
        }

        return (
          <span key={star} className={starClass}>
            {filled ? '★' : '☆'}
          </span>
        );
      })}
    </span>
  );
}
