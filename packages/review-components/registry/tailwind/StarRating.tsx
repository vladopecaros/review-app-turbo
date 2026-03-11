'use client';

import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md';
}

const STAR_POP_KEYFRAME = `@keyframes rcStarPop{0%{transform:scale(1)}40%{transform:scale(1.4)}100%{transform:scale(1)}}`;

export function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const [justSelected, setJustSelected] = useState(0);
  const interactive = typeof onChange !== 'undefined';
  const display = hovered > 0 ? hovered : value;

  const starSize = size === 'sm' ? 'text-base' : 'text-xl';

  function handleClick(star: number) {
    onChange!(star);
    setJustSelected(star);
    setTimeout(() => setJustSelected(0), 400);
  }

  return (
    <>
      {interactive ? <style>{STAR_POP_KEYFRAME}</style> : null}
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= display;
          const colorClass = filled ? 'text-yellow-400' : 'text-gray-600';

          if (interactive) {
            return (
              <button
                key={star}
                type="button"
                className={`${starSize} ${colorClass} cursor-pointer border-none bg-transparent p-0.5 leading-none transition-[color,filter,transform] duration-150 hover:scale-110 hover:drop-shadow-[0_0_5px_rgba(250,204,21,0.55)]`}
                style={justSelected === star ? { animation: 'rcStarPop 0.4s cubic-bezier(0.34,1.56,0.64,1)' } : undefined}
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
            <span key={star} className={`${starSize} ${colorClass} leading-none`}>
              {filled ? '★' : '☆'}
            </span>
          );
        })}
      </span>
    </>
  );
}
