import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock the auth store before importing api
vi.mock('@/store/auth', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      accessToken: null,
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
    })),
  },
}));

// Mock window.location
const mockLocation = { href: '' };
Object.defineProperty(globalThis, 'window', {
  value: { location: mockLocation },
  writable: true,
});

describe('api Axios instance', () => {
  beforeEach(() => {
    mockLocation.href = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('adds Authorization header when accessToken is present', async () => {
    const { useAuthStore } = await import('@/store/auth');
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: null,
      accessToken: 'test-token-123',
      hydrated: true,
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
      setHydrated: vi.fn(),
    });

    // Re-import api to apply mocked store state
    const { default: api } = await import('./api');

    // Spy on request interceptor by checking what config gets built
    const interceptor = api.interceptors.request as unknown as {
      handlers: Array<{ fulfilled: (config: object) => object }>;
    };

    const firstHandler = interceptor.handlers.find(Boolean);
    if (firstHandler?.fulfilled) {
      const config = { headers: {} as Record<string, string> };
      firstHandler.fulfilled(config);
      expect(config.headers['Authorization']).toBe('Bearer test-token-123');
    }
  });

  it('does not add Authorization header when accessToken is null', async () => {
    const { useAuthStore } = await import('@/store/auth');
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: null,
      accessToken: null,
      hydrated: true,
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
      setHydrated: vi.fn(),
    });

    const { default: api } = await import('./api');

    const interceptor = api.interceptors.request as unknown as {
      handlers: Array<{ fulfilled: (config: object) => object }>;
    };

    const firstHandler = interceptor.handlers.find(Boolean);
    if (firstHandler?.fulfilled) {
      const config = { headers: {} as Record<string, string> };
      firstHandler.fulfilled(config);
      expect(config.headers['Authorization']).toBeUndefined();
    }
  });

  it('api instance has withCredentials true', async () => {
    const { default: api } = await import('./api');
    expect(api.defaults.withCredentials).toBe(true);
  });

  it('axios.isAxiosError correctly identifies axios errors', () => {
    const axiosError = new axios.AxiosError('test', '400');
    expect(axios.isAxiosError(axiosError)).toBe(true);
    expect(axios.isAxiosError(new Error('plain'))).toBe(false);
  });
});
