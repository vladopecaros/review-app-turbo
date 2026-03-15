import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { LoginForm } from './LoginForm';

// vi.hoisted() creates refs that are available inside vi.mock() factories (which are hoisted)
const { mockPush, mockSetAuth, mockApiPost } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSetAuth: vi.fn(),
  mockApiPost: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({ setAuth: mockSetAuth }),
}));

vi.mock('@/lib/api', () => ({
  default: { post: mockApiPost },
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function fillAndSubmit(email = 'user@example.com', password = 'password123') {
  const emailInput = screen.getByLabelText(/auth\.login\.email/i);
  const passwordInput = screen.getByLabelText(/auth\.login\.password/i);
  fireEvent.change(emailInput, { target: { value: email } });
  fireEvent.change(passwordInput, { target: { value: password } });
  fireEvent.submit(emailInput.closest('form')!);
}

describe('LoginForm', () => {
  it('renders email and password inputs', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/auth\.login\.email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/auth\.login\.password/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: /auth\.login\.submit/i })).toBeInTheDocument();
  });

  it('calls api.post with email and password on submit', async () => {
    mockApiPost.mockResolvedValueOnce({
      data: { user: { id: '1', email: 'user@example.com' }, accessToken: 'token' },
    });

    render(<LoginForm />);
    fillAndSubmit('user@example.com', 'password123');

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/auth/login', {
        email: 'user@example.com',
        password: 'password123',
      });
    });
  });

  it('calls setAuth and redirects to /app on success', async () => {
    const mockUser = { id: '1', email: 'user@example.com' };
    mockApiPost.mockResolvedValueOnce({
      data: { user: mockUser, accessToken: 'token-xyz' },
    });

    render(<LoginForm />);
    fillAndSubmit();

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith(mockUser, 'token-xyz');
      expect(mockPush).toHaveBeenCalledWith('/app');
    });
  });

  it('shows error message on 401 response', async () => {
    const axiosError = Object.assign(new Error('Unauthorized'), {
      response: { status: 401 },
    });
    mockApiPost.mockRejectedValueOnce(axiosError);
    vi.spyOn(axios, 'isAxiosError').mockReturnValueOnce(true);

    render(<LoginForm />);
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText('auth.login.errorInvalid')).toBeInTheDocument();
    });
  });

  it('shows unverified error on 403 response', async () => {
    const axiosError = Object.assign(new Error('Forbidden'), {
      response: { status: 403 },
    });
    mockApiPost.mockRejectedValueOnce(axiosError);
    vi.spyOn(axios, 'isAxiosError').mockReturnValueOnce(true);

    render(<LoginForm />);
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText('auth.login.errorUnverified')).toBeInTheDocument();
    });
  });

  it('disables submit button while request is in flight', async () => {
    let resolvePost!: (value: unknown) => void;
    mockApiPost.mockReturnValueOnce(
      new Promise((r) => { resolvePost = r; }),
    );

    render(<LoginForm />);
    fillAndSubmit();

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /auth\.login\.submitting/i });
      expect(btn).toBeDisabled();
    });

    resolvePost({ data: { user: {}, accessToken: 'tok' } });
  });
});
