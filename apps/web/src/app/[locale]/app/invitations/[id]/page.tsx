'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { InvitationActions } from '@/components/app/InvitationActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function InvitationPage() {
  const t = useTranslations();
  const params = useParams<{ id: string }>();
  const invitationId = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!invitationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('app.invitation.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[color:var(--text-muted)]">{t('common.error')}</p>
          <Link href="/app">
            <Button variant="outline">{t('app.invitation.backToApp')}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-20 md:pb-0">
      <InvitationActions invitationId={invitationId} />
    </div>
  );
}
