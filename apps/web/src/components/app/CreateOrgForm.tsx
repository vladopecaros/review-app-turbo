'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Organization } from '@/types';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function CreateOrgForm({
  onCreate,
}: {
  onCreate: (payload: { name: string; slug: string }) => Promise<Organization | undefined>;
}) {
  const t = useTranslations();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computedSlug = useMemo(() => slugify(name), [name]);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(computedSlug);
    }
  }, [computedSlug, slugTouched]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onCreate({ name: name.trim(), slug: slugify(slug || computedSlug) });
      setName('');
      setSlug('');
      setSlugTouched(false);
      setIsOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('common.error');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="surface-panel p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-xl font-semibold tracking-tight">{t('app.orgs.createTitle')}</h3>
          <p className="text-sm text-[color:var(--text-muted)]">{t('app.orgs.subtitle')}</p>
        </div>
        <Button onClick={() => setIsOpen((value) => !value)} variant={isOpen ? 'secondary' : 'default'}>
          {t('app.orgs.create')}
        </Button>
      </div>

      <form
        onSubmit={handleSubmit}
        className={cn(
          'grid gap-4 overflow-hidden transition-all',
          isOpen ? 'mt-4 max-h-[20rem] opacity-100' : 'max-h-0 opacity-0 pointer-events-none',
        )}
      >
        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
        ) : null}

        <div>
          <Label htmlFor="org-name">{t('app.orgs.nameLabel')}</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Acme Inc"
            required
          />
        </div>

        <div>
          <Label htmlFor="org-slug">{t('app.orgs.slugLabel')}</Label>
          <Input
            id="org-slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            placeholder="acme-inc"
            required
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting || !name.trim() || !slugify(slug || computedSlug)}>
            {isSubmitting ? t('app.orgs.submittingCreate') : t('app.orgs.submitCreate')}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
}
