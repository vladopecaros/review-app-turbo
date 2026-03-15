import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { RegisterForm } from './RegisterForm';

const { mockApiPost } = vi.hoisted(() => ({
  mockApiPost: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
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

function fillAndSubmit(email = 'new@example.com', password = 'password123') {
  fireEvent.change(screen.getByLabelText(/auth\.register\.email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/auth\.register\.password/i), { target: { value: password } });
  fireEvent.submit(screen.getByRole('button', { name: /auth\.register\.submit/i }).closest('form')!);
}

describe('RegisterForm', () => {
  it('renders email and password inputs', () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/auth\.register\.email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/auth\.register\.password/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<RegisterForm />);
    expect(screen.getByRole('button', { name: /auth\.register\.submit/i })).toBeInTheDocument();
  });

  it('calls api.post with email and password on submit', async () => {
    mockApiPost.mockResolvedValueOnce({ data: {} });

    render(<RegisterForm />);
    fillAndSubmit('new@example.com', 'mypassword');

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/auth/register', {
        email: 'new@example.com',
        password: 'mypassword',
      });
    });
  });

  it('shows success message after successful registration', async () => {
    mockApiPost.mockResolvedValueOnce({ data: {} });

    render(<RegisterForm />);
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText('auth.register.successMessage')).toBeInTheDocument();
    });
  });

  it('shows errorExists message on 409 response', async () => {
    const err = Object.assign(new Error('Conflict'), { response: { status: 409 } });
    mockApiPost.mockRejectedValueOnce(err);
    vi.spyOn(axios, 'isAxiosError').mockReturnValueOnce(true);

    render(<RegisterForm />);
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText('auth.register.errorExists')).toBeInTheDocument();
    });
  });

  it('shows generic error message on non-409 Axios error', async () => {
    const err = Object.assign(new Error('Server Error'), { response: { status: 500 } });
    mockApiPost.mockRejectedValueOnce(err);
    vi.spyOn(axios, 'isAxiosError').mockReturnValueOnce(true);

    render(<RegisterForm />);
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText('auth.register.errorDefault')).toBeInTheDocument();
    });
  });

  it('disables submit button while request is in flight', async () => {
    let resolve!: (v: unknown) => void;
    mockApiPost.mockReturnValueOnce(new Promise((r) => { resolve = r; }));

    render(<RegisterForm />);
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /auth\.register\.submitting/i })).toBeDisabled();
    });

    resolve({ data: {} });
  });
});
