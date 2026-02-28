import { useTranslations } from 'next-intl';

import { ApiKeySection } from '@/components/app/ApiKeySection';
import { InviteUserForm } from '@/components/app/InviteUserForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Organization } from '@/types';

export function OrgDetail({ org }: { org: Organization }) {
  const t = useTranslations();

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl tracking-tight">{org.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-[color:var(--text-muted)]">
          <p>
            <span className="text-[color:var(--text)]">{t('common.slug')}:</span> {org.slug}
          </p>
          <p className="truncate">
            <span className="text-[color:var(--text)]">{t('common.id')}:</span> {org._id}
          </p>
        </CardContent>
      </Card>

      <ApiKeySection orgId={org._id} />
      <InviteUserForm orgId={org._id} />
    </div>
  );
}
