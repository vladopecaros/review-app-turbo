'use client';

import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md';
}

export function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const interactive = typeof onChange !== 'undefined';
  const display = hovered > 0 ? hovered : value;

  const starSize = size === 'sm' ? 'text-base' : 'text-xl';

  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= display;
        const colorClass = filled ? 'text-yellow-400' : 'text-gray-600';

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              className={`${starSize} ${colorClass} cursor-pointer border-none bg-transparent p-0.5 leading-none transition-transform hover:scale-110`}
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
            >
              ★
            </button>
          );
        }

        return (
          <span key={star} className={`${starSize} ${colorClass} leading-none`}>
            {filled ? '★' : '☆'}
          </span>
        );
      })}
    </span>
  );
}
