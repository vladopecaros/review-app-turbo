import { useCallback, useEffect, useReducer } from 'react';
import { fetchReviews, type FetchReviewsResult } from '../api';
import type { ReviewComponentConfig } from '../types';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: FetchReviewsResult }
  | { status: 'error'; message: string };

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: FetchReviewsResult }
  | { type: 'FETCH_ERROR'; message: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { status: 'loading' };
    case 'FETCH_SUCCESS':
      return { status: 'success', data: action.payload };
    case 'FETCH_ERROR':
      return { status: 'error', message: action.message };
    default:
      return state;
  }
}

export function useReviews(config: ReviewComponentConfig, page: number, limit: number) {
  const [state, dispatch] = useReducer(reducer, { status: 'idle' });
  const { apiUrl, apiKey, externalProductId } = config;

  const load = useCallback(() => {
    let cancelled = false;

    dispatch({ type: 'FETCH_START' });

    fetchReviews({ apiUrl, apiKey, externalProductId }, {
      externalProductId,
      page,
      limit,
    })
      .then((data) => {
        if (!cancelled) dispatch({ type: 'FETCH_SUCCESS', payload: data });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          dispatch({
            type: 'FETCH_ERROR',
            message: err instanceof Error ? err.message : 'Failed to load reviews',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, apiKey, externalProductId, page, limit]);

  useEffect(() => {
    return load();
  }, [load]);

  return { state, reload: load };
}
