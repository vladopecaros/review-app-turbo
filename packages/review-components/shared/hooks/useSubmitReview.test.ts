import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSubmitReview } from './useSubmitReview';
import * as apiModule from '../api';
import type { ReviewComponentConfig } from '../types';

const config: ReviewComponentConfig = {
  apiUrl: 'http://localhost:3333',
  apiKey: 'rk_test',
  externalProductId: 'prod-1',
};

const mockReview = {
  _id: 'r1',
  rating: 4,
  text: 'Very good',
  reviewerName: 'Bob',
  createdAt: new Date().toISOString(),
};

const payload = {
  rating: 4,
  text: 'Very good',
  reviewerName: 'Bob',
  reviewerEmail: 'bob@example.com',
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useSubmitReview', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useSubmitReview(config));
    expect(result.current.state.status).toBe('idle');
  });

  it('transitions to submitting then success', async () => {
    vi.spyOn(apiModule, 'createReview').mockResolvedValueOnce(mockReview);

    const { result } = renderHook(() => useSubmitReview(config));

    await act(async () => {
      await result.current.submit(payload);
    });

    expect(result.current.state.status).toBe('success');
    if (result.current.state.status === 'success') {
      expect(result.current.state.review._id).toBe('r1');
    }
  });

  it('passes externalProductId from config to createReview', async () => {
    vi.spyOn(apiModule, 'createReview').mockResolvedValueOnce(mockReview);

    const { result } = renderHook(() => useSubmitReview(config));

    await act(async () => {
      await result.current.submit(payload);
    });

    expect(apiModule.createReview).toHaveBeenCalledWith(config, {
      ...payload,
      externalProductId: 'prod-1',
    });
  });

  it('transitions to error state on failure', async () => {
    vi.spyOn(apiModule, 'createReview').mockRejectedValueOnce(new Error('Submission failed'));

    const { result } = renderHook(() => useSubmitReview(config));

    await act(async () => {
      await result.current.submit(payload);
    });

    expect(result.current.state.status).toBe('error');
    if (result.current.state.status === 'error') {
      expect(result.current.state.message).toBe('Submission failed');
    }
  });

  it('reset returns state to idle', async () => {
    vi.spyOn(apiModule, 'createReview').mockResolvedValueOnce(mockReview);

    const { result } = renderHook(() => useSubmitReview(config));

    await act(async () => {
      await result.current.submit(payload);
    });

    expect(result.current.state.status).toBe('success');

    act(() => {
      result.current.reset();
    });

    expect(result.current.state.status).toBe('idle');
  });
});
