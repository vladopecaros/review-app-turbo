'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import axios from 'axios';
import api from '@/lib/api';
import type { Organization } from '@/types';

export type OrgPageState = 'loading' | 'ready' | 'invited' | 'error';

export interface UseOrgPageResult {
  orgId: string;
  org: Organization | null;
  state: OrgPageState;
  error: string | null;
  invitationId: string | null;
}

/**
 * Shared data-fetching hook for all org sub-pages.
 * Handles: org load, membership status check (active / invited), AbortController cleanup.
 */
export function useOrgPage(): UseOrgPageResult {
  const t = useTranslations();
  const params = useParams<{ id: string }>();
  const orgId = useMemo(
    () => (Array.isArray(params.id) ? params.id[0] : params.id),
    [params.id],
  );

  const [org, setOrg] = useState<Organization | null>(null);
  const [state, setState] = useState<OrgPageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [invitationId, setInvitationId] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;

    const controller = new AbortController();

    async function load() {
      setState('loading');
      setError(null);

      try {
        const response = await api.get(`/organization/${orgId}`, {
          signal: controller.signal,
        });

        const payload = response.data?.data?.organization as Organization;
        const membershipStatus = response.data?.data?.membershipStatus as
          | 'active'
          | 'invited'
          | undefined;
        const pendingInvitationId = response.data?.data?.invitationId as
          | string
          | null
          | undefined;

        setOrg(payload);

        if (membershipStatus === 'invited' && pendingInvitationId) {
          setInvitationId(pendingInvitationId);
          setState('invited');
          return;
        }

        setInvitationId(null);
        setState('ready');
      } catch (err) {
        if (axios.isCancel(err)) return;
        setState('error');
        setError(err instanceof Error ? err.message : t('common.error'));
      }
    }

    void load();

    return () => {
      controller.abort();
    };
  }, [orgId, t]);

  return { orgId, org, state, error, invitationId };
}
