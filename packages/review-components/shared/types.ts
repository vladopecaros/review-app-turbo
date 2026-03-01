export interface PublicReview {
  _id: string;
  externalProductId?: string;
  rating: number;
  text: string;
  reviewerName: string;
  createdAt?: string;
}

export interface ReviewPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReviewComponentConfig {
  /**
   * Base URL of the reviewlico API, e.g. "https://api.example.com".
   * If omitted, resolved from env vars in order:
   *   VITE_REVIEWLICO_API_URL → NEXT_PUBLIC_REVIEWLICO_API_URL → REVIEWLICO_API_URL
   * Note: only Vite and Next.js are supported. CRA is not supported.
   */
  apiUrl?: string;
  /**
   * Raw API key (rk_...) sent as the X-API-Key header.
   * This key is client-side and will be visible in the browser bundle — treat it as a public key.
   * If omitted, resolved from env vars in order:
   *   VITE_REVIEWLICO_API_KEY → NEXT_PUBLIC_REVIEWLICO_API_KEY → REVIEWLICO_API_KEY
   */
  apiKey?: string;
  /** Scope reviews to a specific product */
  externalProductId?: string;
}

export interface ReviewFormProps {
  config: ReviewComponentConfig;
  onSuccess?: (review: PublicReview) => void;
  onError?: (message: string) => void;
  /** Form heading. Default: "Write a Review" */
  title?: string;
  /** Submit button label. Default: "Submit Review" */
  submitLabel?: string;
  className?: string;
}

export interface ReviewListProps {
  config: ReviewComponentConfig;
  /** Reviews per page. Default: 10. Max: 100. */
  limit?: number;
  /** Section heading. Default: "Customer Reviews" */
  title?: string;
  /** Render an inline ReviewForm. Default: false */
  showForm?: boolean;
  className?: string;
}
