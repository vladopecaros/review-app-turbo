import type { PublicReview, ReviewComponentConfig, ReviewPagination } from './types';

/**
 * Resolves apiUrl and apiKey from props or env vars.
 * Fallback chain: config prop → VITE_REVIEWLICO_* (Vite) → NEXT_PUBLIC_REVIEWLICO_* (Next.js) → REVIEWLICO_* (generic)
 * Throws immediately if either value cannot be resolved — never attempts a fetch with missing config.
 */
function resolveConfig(config: ReviewComponentConfig): { apiUrl: string; apiKey: string } {
  // import.meta.env is Vite-only, inlined at build time.
  // The typeof guard prevents crashes in non-Vite builds (Next.js, Node).
  // Cast through unknown — ImportMeta is a closed type in strict TS so direct casts fail.
  const meta = import.meta as unknown as Record<string, unknown>;
  const viteEnv =
    typeof meta.env === 'object' && meta.env !== null
      ? (meta.env as Record<string, string | undefined>)
      : ({} as Record<string, string | undefined>);

  // Read NEXT_PUBLIC_* directly so Next.js can inline values at build time.
  // Keep a typeof guard so this stays safe in non-Node runtimes.
  const nextPublicApiUrl =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_REVIEWLICO_API_URL : undefined;
  const nextPublicApiKey =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_REVIEWLICO_API_KEY : undefined;
  const genericApiUrl =
    typeof process !== 'undefined' ? process.env.REVIEWLICO_API_URL : undefined;
  const genericApiKey =
    typeof process !== 'undefined' ? process.env.REVIEWLICO_API_KEY : undefined;

  const apiUrl =
    config.apiUrl ??
    viteEnv.VITE_REVIEWLICO_API_URL ??
    nextPublicApiUrl ??
    genericApiUrl;

  const apiKey =
    config.apiKey ??
    viteEnv.VITE_REVIEWLICO_API_KEY ??
    nextPublicApiKey ??
    genericApiKey;

  if (!apiUrl)
    throw new Error(
      '[reviewlico] apiUrl is required. Pass it as a prop or set one of: ' +
        'VITE_REVIEWLICO_API_URL, NEXT_PUBLIC_REVIEWLICO_API_URL, REVIEWLICO_API_URL',
    );
  if (!apiKey)
    throw new Error(
      '[reviewlico] apiKey is required. Pass it as a prop or set one of: ' +
        'VITE_REVIEWLICO_API_KEY, NEXT_PUBLIC_REVIEWLICO_API_KEY, REVIEWLICO_API_KEY',
    );

  return { apiUrl, apiKey };
}

async function apiFetch<T>(
  config: ReviewComponentConfig,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { apiUrl, apiKey } = resolveConfig(config);
  const url = `${apiUrl.replace(/\/$/, '')}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // ignore JSON parse errors on error bodies
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export interface FetchReviewsParams {
  externalProductId?: string;
  page?: number;
  limit?: number;
}

export interface FetchReviewsResult {
  reviews: PublicReview[];
  pagination: ReviewPagination;
}

export async function fetchReviews(
  config: ReviewComponentConfig,
  params: FetchReviewsParams,
): Promise<FetchReviewsResult> {
  const qs = new URLSearchParams();
  if (params.externalProductId) {
    qs.set('scope', 'product');
    qs.set('externalProductId', params.externalProductId);
  } else {
    qs.set('scope', 'all');
  }
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));

  return apiFetch<FetchReviewsResult>(config, `/public/reviews?${qs.toString()}`);
}

export interface CreateReviewPayload {
  rating: number;
  text: string;
  reviewerName: string;
  reviewerEmail: string;
  externalProductId?: string;
}

export async function createReview(
  config: ReviewComponentConfig,
  payload: CreateReviewPayload,
): Promise<PublicReview> {
  const result = await apiFetch<{ review: PublicReview }>(config, '/public/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return result.review;
}
