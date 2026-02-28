'use client';

import Link from 'next/link';
import { useState } from 'react';
import axios from 'axios';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';

export function RegisterForm() {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/register', { email, password });
      const accessToken = response.data?.accessToken ?? null;

      if (accessToken !== null) {
        // Backend should return null until email verification.
      }

      setSuccess(true);
      setPassword('');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;

        if (status === 409) {
          setError(t('auth.register.errorExists'));
        } else {
          setError(t('auth.register.errorDefault'));
        }
      } else {
        setError(t('auth.register.errorDefault'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {success ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {t('auth.register.successMessage')}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
      ) : null}

      <div>
        <Label htmlFor="register-email">{t('auth.register.email')}</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="register-password">{t('auth.register.password')}</Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('auth.register.submitting') : t('auth.register.submit')}
      </Button>

      <p className="text-sm text-[color:var(--text-muted)]">
        {t('auth.register.hasAccount')}{' '}
        <Link className="text-blue-300 hover:text-blue-200" href="/login">
          {t('auth.register.login')}
        </Link>
      </p>
    </form>
  );
}
