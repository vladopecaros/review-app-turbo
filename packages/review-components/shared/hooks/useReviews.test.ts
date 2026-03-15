import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useReviews } from './useReviews';
import * as apiModule from '../api';
import type { ReviewComponentConfig } from '../types';

const config: ReviewComponentConfig = {
  apiUrl: 'http://localhost:3333',
  apiKey: 'rk_test',
};

const mockResult = {
  reviews: [
    {
      _id: 'r1',
      rating: 5,
      text: 'Great product',
      reviewerName: 'Alice',
      createdAt: new Date().toISOString(),
    },
  ],
  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useReviews', () => {
  it('transitions to loading then success', async () => {
    vi.spyOn(apiModule, 'fetchReviews').mockResolvedValueOnce(mockResult);

    const { result } = renderHook(() => useReviews(config, 1, 10));

    expect(result.current.state.status).toBe('loading');

    await waitFor(() => {
      expect(result.current.state.status).toBe('success');
    });

    if (result.current.state.status === 'success') {
      expect(result.current.state.data.reviews).toHaveLength(1);
      expect(result.current.state.data.reviews[0].reviewerName).toBe('Alice');
    }
  });

  it('transitions to error when fetchReviews throws', async () => {
    vi.spyOn(apiModule, 'fetchReviews').mockRejectedValueOnce(new Error('Network failure'));

    const { result } = renderHook(() => useReviews(config, 1, 10));

    await waitFor(() => {
      expect(result.current.state.status).toBe('error');
    });

    if (result.current.state.status === 'error') {
      expect(result.current.state.message).toBe('Network failure');
    }
  });

  it('exposes a reload function that re-fetches', async () => {
    vi.spyOn(apiModule, 'fetchReviews')
      .mockResolvedValueOnce(mockResult)
      .mockResolvedValueOnce({ ...mockResult, reviews: [] });

    const { result } = renderHook(() => useReviews(config, 1, 10));

    await waitFor(() => expect(result.current.state.status).toBe('success'));

    result.current.reload();

    await waitFor(() => {
      if (result.current.state.status === 'success') {
        expect(result.current.state.data.reviews).toHaveLength(0);
      }
    });

    expect(apiModule.fetchReviews).toHaveBeenCalledTimes(2);
  });
});
