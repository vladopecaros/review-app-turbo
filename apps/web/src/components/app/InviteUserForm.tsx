'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import type { InvitedUserRole } from '@/types';

export function InviteUserForm({ orgId }: { orgId: string }) {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InvitedUserRole>('member');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setInviteLink(null);
    setCopied(false);

    try {
      const response = await api.post(`/organization/${orgId}/invite-user`, {
        invitedUserEmail: email,
        invitedUserRole: role,
      });

      const invitationId = response.data?.invitation?._id;
      if (!invitationId) {
        throw new Error('Missing invitation id in response');
      }

      const origin = window.location.origin;
      setInviteLink(`${origin}/app/invitations/${invitationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyLink() {
    if (!inviteLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setError(t('common.error'));
    }
  }

  return (
    <section className="surface-panel p-5">
      <h3 className="font-display text-xl font-semibold tracking-tight">{t('app.orgDetail.invite.title')}</h3>
      <form onSubmit={onSubmit} className="mt-4 grid gap-4">
        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
        ) : null}

        <div>
          <Label htmlFor="invite-user-email">{t('app.orgDetail.invite.userEmailLabel')}</Label>
          <Input
            id="invite-user-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="teammate@example.com"
            required
          />
        </div>

        <div>
          <Label htmlFor="invite-role">{t('app.orgDetail.invite.roleLabel')}</Label>
          <select
            id="invite-role"
            value={role}
            onChange={(event) => setRole(event.target.value as InvitedUserRole)}
            className="h-10 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm text-[color:var(--text)]"
          >
            <option value="admin">{t('app.orgDetail.invite.roleAdmin')}</option>
            <option value="member">{t('app.orgDetail.invite.roleMember')}</option>
          </select>
        </div>

        <Button type="submit" disabled={isSubmitting || !email.trim()}>
          {isSubmitting ? t('app.orgDetail.invite.submitting') : t('app.orgDetail.invite.submit')}
        </Button>
      </form>

      {inviteLink ? (
        <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          <p className="mb-2">{t('app.orgDetail.invite.successPrefix')}</p>
          <code className="block overflow-x-auto rounded-md bg-black/20 px-2 py-1 font-mono text-xs">{inviteLink}</code>
          <Button type="button" variant="outline" className="mt-3" onClick={copyLink}>
            {copied ? t('app.orgDetail.invite.copied') : t('app.orgDetail.invite.copyLink')}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
