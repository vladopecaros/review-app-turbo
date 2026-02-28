'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import type { Product } from '@/types';

type ProductFormState = {
  externalProductId: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
};

const defaultFormState: ProductFormState = {
  externalProductId: '',
  name: '',
  slug: '',
  description: '',
  active: true,
};

function parseError(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'message' in error.response.data &&
    typeof error.response.data.message === 'string'
  ) {
    return error.response.data.message;
  }

  return fallback;
}

function toFormState(product: Product): ProductFormState {
  return {
    externalProductId: product.externalProductId,
    name: product.name,
    slug: product.slug,
    description: product.description ?? '',
    active: product.active,
  };
}

export function ProductSection({ orgId }: { orgId: string }) {
  const t = useTranslations();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<ProductFormState>(defaultFormState);
  const loadRequestIdRef = useRef(0);
  const [editForm, setEditForm] = useState<ProductFormState>(defaultFormState);

  const editingProduct = useMemo(
    () => products.find((product) => product._id === editingProductId) ?? null,
    [editingProductId, products],
  );

  async function loadProducts() {
    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;

    setIsRefreshing(true);
    setError(null);

    try {
      const response = await api.get(`/organization/${orgId}/products`);
      const payload = (response.data?.products ?? []) as Product[];

      if (loadRequestIdRef.current !== requestId) {
        return;
      }

      setProducts(payload);
    } catch (err) {
      if (loadRequestIdRef.current !== requestId) {
        return;
      }

      setError(parseError(err, t('common.error')));
    } finally {
      if (loadRequestIdRef.current !== requestId) {
        return;
      }

      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    setIsLoading(true);
    setProducts([]);
    setEditingProductId(null);
    void loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsCreating(true);

    try {
      await api.post(`/organization/${orgId}/products`, {
        externalProductId: createForm.externalProductId,
        name: createForm.name,
        slug: createForm.slug,
        description: createForm.description || undefined,
        active: createForm.active,
      });

      setSuccess(t('app.orgDetail.products.createSuccess'));
      setCreateForm(defaultFormState);
      await loadProducts();
    } catch (err) {
      setError(parseError(err, t('app.orgDetail.products.createError')));
    } finally {
      setIsCreating(false);
    }
  }

  function startEdit(product: Product) {
    setEditingProductId(product._id);
    setEditForm(toFormState(product));
    setError(null);
    setSuccess(null);
  }

  function cancelEdit() {
    setEditingProductId(null);
    setEditForm(defaultFormState);
  }

  async function handleSave(productId: string, externalProductId: string) {
    setIsSaving(productId);
    setError(null);
    setSuccess(null);

    try {
      const encodedExternalProductId = encodeURIComponent(externalProductId);
      await api.put(`/organization/${orgId}/products/${encodedExternalProductId}`, {
        name: editForm.name,
        slug: editForm.slug,
        description: editForm.description || undefined,
        active: editForm.active,
      });

      setSuccess(t('app.orgDetail.products.updateSuccess'));
      cancelEdit();
      await loadProducts();
    } catch (err) {
      setError(parseError(err, t('app.orgDetail.products.updateError')));
    } finally {
      setIsSaving(null);
    }
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(t('app.orgDetail.products.deleteConfirm', { name: product.name }));
    if (!confirmed) {
      return;
    }

    setIsDeleting(product._id);
    setError(null);
    setSuccess(null);

    try {
      const encodedExternalProductId = encodeURIComponent(product.externalProductId);
      await api.delete(`/organization/${orgId}/products/${encodedExternalProductId}`);
      setSuccess(t('app.orgDetail.products.deleteSuccess'));
      await loadProducts();
    } catch (err) {
      setError(parseError(err, t('app.orgDetail.products.deleteError')));
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>{t('app.orgDetail.products.title')}</CardTitle>
        <Button variant="outline" size="sm" onClick={() => void loadProducts()} disabled={isRefreshing}>
          {isRefreshing ? t('common.loading') : t('app.orgDetail.products.refresh')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-[color:var(--text-muted)]">{t('app.orgDetail.products.description')}</p>

        {error ? <p className="text-sm text-red-200">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-200">{success}</p> : null}

        <form className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4" onSubmit={handleCreate}>
          <p className="text-sm font-medium text-[color:var(--text)]">{t('app.orgDetail.products.createTitle')}</p>

          <Input
            value={createForm.externalProductId}
            onChange={(event) =>
              setCreateForm((prev) => ({
                ...prev,
                externalProductId: event.target.value,
              }))
            }
            placeholder={t('app.orgDetail.products.externalProductIdLabel')}
            required
          />
          <Input
            value={createForm.name}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder={t('common.name')}
            required
          />
          <Input
            value={createForm.slug}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, slug: event.target.value }))}
            placeholder={t('common.slug')}
            required
          />
          <textarea
            className="min-h-20 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            value={createForm.description}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder={t('app.orgDetail.products.descriptionLabel')}
          />

          <label className="flex items-center gap-2 text-sm text-[color:var(--text-muted)]">
            <input
              type="checkbox"
              checked={createForm.active}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, active: event.target.checked }))}
            />
            {t('app.orgDetail.products.activeLabel')}
          </label>

          <Button type="submit" disabled={isCreating}>
            {isCreating ? t('app.orgDetail.products.creating') : t('app.orgDetail.products.create')}
          </Button>
        </form>

        {isLoading ? (
          <p className="text-sm text-[color:var(--text-muted)]">{t('app.orgDetail.products.loading')}</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-[color:var(--text-muted)]">{t('app.orgDetail.products.empty')}</p>
        ) : (
          <div className="grid gap-3">
            {products.map((product) => {
              const isEditing = editingProduct?._id === product._id;

              return (
                <div key={product._id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  {isEditing ? (
                    <div className="grid gap-3">
                      <Input value={editForm.name} onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))} required />
                      <Input value={editForm.slug} onChange={(event) => setEditForm((prev) => ({ ...prev, slug: event.target.value }))} required />
                      <textarea
                        className="min-h-20 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                        value={editForm.description}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
                        placeholder={t('app.orgDetail.products.descriptionLabel')}
                      />
                      <label className="flex items-center gap-2 text-sm text-[color:var(--text-muted)]">
                        <input
                          type="checkbox"
                          checked={editForm.active}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, active: event.target.checked }))}
                        />
                        {t('app.orgDetail.products.activeLabel')}
                      </label>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => void handleSave(product._id, product.externalProductId)}
                          disabled={isSaving === product._id}
                        >
                          {isSaving === product._id ? t('app.orgDetail.products.saving') : t('app.orgDetail.products.save')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-[color:var(--text-muted)]">{product.slug}</p>
                        </div>
                        <Badge className={product.active ? '' : 'border-zinc-500/40 bg-zinc-800/50 text-zinc-300'}>
                          {product.active ? t('app.orgDetail.products.active') : t('app.orgDetail.products.inactive')}
                        </Badge>
                      </div>

                      <p className="text-xs text-[color:var(--text-muted)]">
                        {t('app.orgDetail.products.externalProductIdLabel')}: {product.externalProductId}
                      </p>

                      {product.description ? <p className="text-sm text-[color:var(--text-muted)]">{product.description}</p> : null}

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(product)}>
                          {t('app.orgDetail.products.edit')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => void handleDelete(product)}
                          disabled={isDeleting === product._id}
                        >
                          {isDeleting === product._id ? t('app.orgDetail.products.deleting') : t('app.orgDetail.products.delete')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
