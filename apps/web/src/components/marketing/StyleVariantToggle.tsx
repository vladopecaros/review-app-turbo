'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';

type Variant = 'plain' | 'tailwind';

export function StyleVariantToggle() {
  const t = useTranslations();
  const [variant, setVariant] = useState<Variant>('plain');

  const info = {
    plain: {
      title: t('styleVariants.plain.title'),
      description: t('styleVariants.plain.description'),
    },
    tailwind: {
      title: t('styleVariants.tailwind.title'),
      description: t('styleVariants.tailwind.description'),
    },
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[0.45fr_0.55fr] lg:gap-12 lg:items-center">
      {/* Left — toggle + description */}
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-[color:var(--text-muted)]">
            {t('styleVariants.eyebrow')}
          </p>
          <Badge>{t('styleVariants.badge')}</Badge>
        </div>

        {/* Pill toggle */}
        <div className="inline-flex rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] p-1 gap-1">
          <button
            onClick={() => setVariant('plain')}
            className={[
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              variant === 'plain'
                ? 'bg-[color:var(--surface)] text-[color:var(--text)] shadow-sm'
                : 'text-[color:var(--text-muted)] hover:text-[color:var(--text)]',
            ].join(' ')}
          >
            Plain CSS
          </button>
          <button
            onClick={() => setVariant('tailwind')}
            className={[
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              variant === 'tailwind'
                ? 'bg-[color:var(--surface)] text-[color:var(--text)] shadow-sm'
                : 'text-[color:var(--text-muted)] hover:text-[color:var(--text)]',
            ].join(' ')}
          >
            Tailwind
          </button>
        </div>

        {/* Description — re-mounts on variant change to trigger fade-up */}
        <div key={variant} className="animate-fade-up space-y-1">
          <p className="text-sm font-semibold text-[color:var(--text)]">{info[variant].title}</p>
          <p className="text-sm leading-6 text-[color:var(--text-muted)]">{info[variant].description}</p>
        </div>
      </div>

      {/* Right — static ReviewForm mockup */}
      <div className="surface-panel overflow-hidden p-0">
        {/* Panel header — traffic lights + filename + variant badge */}
        <div className="flex items-center gap-2 border-b border-[color:var(--border)] px-4 py-3">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          <span className="ml-2 font-mono text-xs text-[color:var(--text-muted)]">ReviewForm.tsx</span>
          <Badge className="ml-auto text-xs">
            {variant === 'plain' ? 'plain CSS' : 'Tailwind'}
          </Badge>
        </div>

        {/* Static form mockup */}
        <div className="p-5 space-y-4">
          <p className="text-sm font-semibold text-[color:var(--text)]">Write a Review</p>

          {/* Star rating row — 4 filled, 1 empty */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fill={s <= 4 ? '#f59e0b' : 'var(--border)'}
                  d="M10 1l2.39 4.84L18 6.91l-4 3.9.94 5.51L10 13.77 5.06 16.32 6 10.81 2 6.91l5.61-.07z"
                />
              </svg>
            ))}
          </div>

          {/* Textarea mockup */}
          <div className="h-20 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-xs text-[color:var(--text-muted)]">
            Great product, fast shipping…
          </div>

          {/* Name + email row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex h-9 items-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 text-xs text-[color:var(--text-muted)]">
              Jane Smith
            </div>
            <div className="flex h-9 items-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 text-xs text-[color:var(--text-muted)]">
              jane@example.com
            </div>
          </div>

          {/* Submit button mockup */}
          <div className="inline-flex h-9 items-center rounded-lg bg-blue-500 px-4 text-xs font-medium text-white">
            Submit Review
          </div>
        </div>
      </div>
    </div>
  );
}
