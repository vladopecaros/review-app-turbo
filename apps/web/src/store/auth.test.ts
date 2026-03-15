import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth';
import type { User } from '@/types';

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  role: 'user',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, hydrated: false });
});

describe('useAuthStore', () => {
  it('initializes with null user and accessToken', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.hydrated).toBe(false);
  });

  it('setAuth stores user and accessToken', () => {
    useAuthStore.getState().setAuth(mockUser, 'token-abc');
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('token-abc');
  });

  it('clearAuth resets user and accessToken to null', () => {
    useAuthStore.getState().setAuth(mockUser, 'token-abc');
    useAuthStore.getState().clearAuth();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  it('setHydrated sets the hydrated flag', () => {
    useAuthStore.getState().setHydrated(true);
    expect(useAuthStore.getState().hydrated).toBe(true);
  });

  it('setAuth does not affect hydrated flag', () => {
    useAuthStore.getState().setAuth(mockUser, 'token-abc');
    expect(useAuthStore.getState().hydrated).toBe(false);
  });
});
