import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiKeySection } from './ApiKeySection';

const { mockApiPost } = vi.hoisted(() => ({
  mockApiPost: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/api', () => ({
  default: { post: mockApiPost },
}));

// Modal renders portals — provide a simple pass-through
vi.mock('@/components/ui/modal', () => ({
  Modal: ({ open, children, footer, title }: { open: boolean; children: React.ReactNode; footer: React.ReactNode; title: string }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
        {footer}
      </div>
    ) : null,
}));

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return { ...actual, copyToClipboard: vi.fn().mockResolvedValue(undefined) };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ApiKeySection', () => {
  it('renders the generate button', () => {
    render(<ApiKeySection orgId="org-1" />);
    expect(screen.getByRole('button', { name: /app\.orgDetail\.apiKey\.generate/i })).toBeInTheDocument();
  });

  it('opens confirmation modal when generate button is clicked', () => {
    render(<ApiKeySection orgId="org-1" />);
    fireEvent.click(screen.getByRole('button', { name: /app\.orgDetail\.apiKey\.generate/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls api.post on confirm and displays generated key', async () => {
    mockApiPost.mockResolvedValueOnce({ data: { data: { key: 'rk_test_abc123' } } });

    render(<ApiKeySection orgId="org-1" />);
    fireEvent.click(screen.getByRole('button', { name: /app\.orgDetail\.apiKey\.generate/i }));
    fireEvent.click(screen.getByRole('button', { name: /app\.orgDetail\.apiKey\.confirmAction/i }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/organization/org-1/api-keys');
      expect(screen.getByText('rk_test_abc123')).toBeInTheDocument();
    });
  });

  it('shows forbidden error on 403 response', async () => {
    const err = Object.assign(new Error('Forbidden'), { response: { status: 403 } });
    // isAxiosError check via actual axios
    Object.defineProperty(err, 'isAxiosError', { value: true });
    mockApiPost.mockRejectedValueOnce(err);

    render(<ApiKeySection orgId="org-1" />);
    fireEvent.click(screen.getByRole('button', { name: /app\.orgDetail\.apiKey\.generate/i }));
    fireEvent.click(screen.getByRole('button', { name: /app\.orgDetail\.apiKey\.confirmAction/i }));

    await waitFor(() => {
      expect(screen.getByText('app.orgDetail.apiKey.forbiddenError')).toBeInTheDocument();
    });
  });

  it('shows warning banner after key is generated', async () => {
    mockApiPost.mockResolvedValueOnce({ data: { data: { key: 'rk_test_xyz' } } });

    render(<ApiKeySection orgId="org-1" />);
    fireEvent.click(screen.getByRole('button', { name: /app\.orgDetail\.apiKey\.generate/i }));
    fireEvent.click(screen.getByRole('button', { name: /app\.orgDetail\.apiKey\.confirmAction/i }));

    await waitFor(() => {
      expect(screen.getByText('app.orgDetail.apiKey.warning')).toBeInTheDocument();
    });
  });
});
