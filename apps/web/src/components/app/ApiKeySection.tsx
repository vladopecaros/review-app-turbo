'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { isAxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import api from '@/lib/api';

export function ApiKeySection({ orgId }: { orgId: string }) {
  const t = useTranslations();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function generateKey() {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await api.get(`/organization/${orgId}/create-api-key`);
      const key = response.data?.key;

      if (!key) {
        throw new Error('Missing API key in response');
      }

      setGeneratedKey(key);
      setIsConfirmOpen(false);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 403) {
        setError(t('app.orgDetail.apiKey.forbiddenError'));
      } else {
        setError(err instanceof Error ? err.message : t('common.error'));
      }
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyKey() {
    if (!generatedKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedKey);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1200);
    } catch {
      setError(t('common.error'));
    }
  }

  return (
    <section className="surface-panel p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-xl font-semibold tracking-tight">{t('app.orgDetail.apiKey.title')}</h3>
          <p className="mt-1 text-sm text-[color:var(--text-muted)]">{t('app.orgDetail.apiKey.description')}</p>
        </div>
        <Button onClick={() => setIsConfirmOpen(true)} disabled={isGenerating}>
          {t('app.orgDetail.apiKey.generate')}
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
      ) : null}

      {generatedKey ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {t('app.orgDetail.apiKey.warning')}
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
            {t('app.orgDetail.apiKey.generatedState')}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <code className="block min-w-0 flex-1 overflow-x-auto rounded-lg border border-[color:var(--border)] bg-black/30 px-3 py-2 text-sm font-mono text-blue-100 break-all sm:break-normal">
              {generatedKey}
            </code>
            <Button type="button" variant="outline" onClick={copyKey}>
              {copyState === 'copied' ? t('app.orgDetail.apiKey.copied') : t('common.copy')}
            </Button>
          </div>
        </div>
      ) : null}

      <Modal
        open={isConfirmOpen}
        onClose={() => (isGenerating ? undefined : setIsConfirmOpen(false))}
        title={t('app.orgDetail.apiKey.confirmTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsConfirmOpen(false)} disabled={isGenerating}>
              {t('common.cancel')}
            </Button>
            <Button onClick={generateKey} disabled={isGenerating}>
              {isGenerating ? t('common.loading') : t('app.orgDetail.apiKey.confirmAction')}
            </Button>
          </>
        }
      >
        <p>{t('app.orgDetail.apiKey.confirmBody')}</p>
      </Modal>
    </section>
  );
}
