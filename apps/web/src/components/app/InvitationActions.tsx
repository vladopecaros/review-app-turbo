'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export function InvitationActions({ invitationId }: { invitationId: string }) {
  const t = useTranslations();
  const [status, setStatus] = useState<'idle' | 'working' | 'accepted' | 'declined' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function respond(nextStatus: 'accepted' | 'declined') {
    setError(null);
    setStatus('working');

    try {
      const action = nextStatus === 'accepted' ? 'accept' : 'decline';
      await api.put(`/organization-memberships/invitations/${invitationId}/${action}`);
      setStatus(nextStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
      setStatus('error');
    }
  }

  const resolvedMessage =
    status === 'accepted'
      ? t('app.invitation.accepted')
      : status === 'declined'
        ? t('app.invitation.declined')
        : null;

  return (
    <div className="surface-panel p-5">
      <h2 className="font-display text-2xl font-semibold tracking-tight">{t('app.invitation.title')}</h2>
      <p className="mt-2 text-sm text-[color:var(--text-muted)]">{t('app.invitation.subtitle')}</p>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
        {t('common.id')}: {invitationId}
      </p>

      {resolvedMessage ? (
        <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {resolvedMessage}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
      ) : null}

      {status === 'idle' || status === 'working' || status === 'error' ? (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => respond('accepted')} disabled={status === 'working'}>
            {status === 'working' ? t('app.invitation.working') : t('app.invitation.accept')}
          </Button>
          <Button variant="outline" onClick={() => respond('declined')} disabled={status === 'working'}>
            {t('app.invitation.decline')}
          </Button>
        </div>
      ) : (
        <div className="mt-5">
          <Link href="/app">
            <Button variant="outline">{t('app.invitation.backToApp')}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
