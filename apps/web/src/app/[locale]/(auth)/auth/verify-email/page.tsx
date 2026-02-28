import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type VerifyPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

type VerifyState = 'success' | 'expired' | 'error' | 'missing';

async function resolveSearchParams(
  searchParams: VerifyPageProps['searchParams'],
): Promise<Record<string, string | string[] | undefined>> {
  return (await Promise.resolve(searchParams)) ?? {};
}

export default async function VerifyEmailPage({ searchParams }: VerifyPageProps) {
  const t = await getTranslations();
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const tokenParam = resolvedSearchParams.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  let state: VerifyState = 'missing';

  if (token) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      const url = new URL('/auth/verify-email', baseUrl);
      url.searchParams.set('token', token);

      const response = await fetch(url.toString(), {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 201 || response.ok) {
        state = 'success';
      } else if (response.status === 409) {
        const body = (await response.json().catch(() => ({}))) as { code?: string };
        state = body.code === 'EMAIL_VERIFICATION_EXPIRED_RESENT' ? 'expired' : 'error';
      } else {
        state = 'error';
      }
    } catch {
      state = 'error';
    }
  }

  const messageByState: Record<VerifyState, string> = {
    success: t('auth.verifyEmail.success'),
    expired: t('auth.verifyEmail.expired'),
    error: t('auth.verifyEmail.error'),
    missing: t('auth.verifyEmail.missingToken'),
  };

  const toneByState: Record<VerifyState, string> = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    expired: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    error: 'border-red-500/30 bg-red-500/10 text-red-200',
    missing: 'border-[color:var(--border)] bg-white/5 text-[color:var(--text)]',
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <Card className="w-full max-w-lg p-0">
        <CardHeader>
          <CardTitle className="font-display text-2xl">{t('auth.verifyEmail.title')}</CardTitle>
          <CardDescription>{t('brand.tagline')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`rounded-lg border px-4 py-3 text-sm ${toneByState[state]}`}>{messageByState[state]}</div>
          <Link href="/login">
            <Button className="w-full">{t('auth.verifyEmail.loginCta')}</Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
