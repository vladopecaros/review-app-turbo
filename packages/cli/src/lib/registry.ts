export type Style = 'plain' | 'tailwind';

export interface RegistryEntry {
  description: string;
  /** Files sourced from registry/<style>/ */
  variantFiles: string[];
  /** Files sourced from shared/ — same regardless of style */
  sharedFiles: string[];
  /** CSS file name inside registry/plain/ — only copied when style === 'plain' */
  cssFile?: string;
}

export const REGISTRY: Record<string, RegistryEntry> = {
  ReviewForm: {
    description: 'Review submission form with star rating, text, name, and email fields',
    variantFiles: ['ReviewForm.tsx', 'StarRating.tsx'],
    sharedFiles: ['types.ts', 'api.ts', 'hooks/useSubmitReview.ts'],
    cssFile: 'review-components.css',
  },
  ReviewList: {
    description: 'Paginated list of published reviews with optional inline submission form',
    variantFiles: ['ReviewList.tsx', 'ReviewForm.tsx', 'ReviewCard.tsx', 'StarRating.tsx'],
    sharedFiles: ['types.ts', 'api.ts', 'hooks/useReviews.ts', 'hooks/useSubmitReview.ts'],
    cssFile: 'review-components.css',
  },
};

export function getComponentNames(): string[] {
  return Object.keys(REGISTRY);
}
