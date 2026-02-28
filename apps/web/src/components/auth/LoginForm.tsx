'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import axios from 'axios';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export function LoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken } = response.data ?? {};

      if (!user || !accessToken) {
        throw new Error('Missing auth response payload');
      }

      setAuth(user, accessToken);
      router.push('/app');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;

        if (status === 403) {
          setError(t('auth.login.errorUnverified'));
        } else if (status === 401) {
          setError(t('auth.login.errorInvalid'));
        } else {
          setError(t('auth.login.errorDefault'));
        }
      } else {
        setError(t('auth.login.errorDefault'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
      ) : null}

      <div>
        <Label htmlFor="login-email">{t('auth.login.email')}</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="login-password">{t('auth.login.password')}</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
      </Button>

      <p className="text-sm text-[color:var(--text-muted)]">
        {t('auth.login.noAccount')}{' '}
        <Link className="text-blue-300 hover:text-blue-200" href="/register">
          {t('auth.login.register')}
        </Link>
      </p>
    </form>
  );
}
