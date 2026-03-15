'use client';

import { useCallback, useEffect, useState } from 'react';

import api from '@/lib/api';
import type { Organization } from '@/types';

function parseOrganizations(payload: unknown): Organization[] {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.organizations)) {
      return record.organizations as Organization[];
    }
  }
  if (Array.isArray(payload)) {
    return payload as Organization[];
  }
  return [];
}

export function useOrgs() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrgs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/organization');
      setOrgs(parseOrganizations(response.data?.data));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load organizations';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrgs();
  }, [fetchOrgs]);

  const createOrg = useCallback(async (payload: { name: string; slug: string }) => {
    const response = await api.post('/organization', payload);
    const created = response.data?.data?.organization as Organization;

    if (created?._id) {
      setOrgs((current) => [created, ...current]);
    }

    return created;
  }, []);

  return {
    orgs,
    isLoading,
    error,
    refresh: fetchOrgs,
    createOrg,
    setOrgs,
  };
}
