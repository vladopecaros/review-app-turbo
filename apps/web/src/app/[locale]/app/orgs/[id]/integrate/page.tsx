"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { InvitationActions } from "@/components/app/InvitationActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import type { Organization, Product } from "@/types";
import { copyToClipboard } from "@/lib/utils";

type LoadState = "loading" | "ready" | "invited" | "error";

function CodeBlock({ code }: { code: string }) {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await copyToClipboard(code);

    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg border border-[color:var(--border)] bg-black/40 p-4 pr-20 text-sm font-mono leading-relaxed text-blue-100">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2 text-xs"
        onClick={handleCopy}
      >
        {copied ? t("app.integrate.copied") : t("app.integrate.copy")}
      </Button>
    </div>
  );
}

export default function IntegratePage() {
  const t = useTranslations();
  const params = useParams<{ id: string }>();
  const orgId = useMemo(
    () => (Array.isArray(params.id) ? params.id[0] : params.id),
    [params.id],
  );

  const [org, setOrg] = useState<Organization | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [activeEnvTab, setActiveEnvTab] = useState<"nextjs" | "vite">("nextjs");

  useEffect(() => {
    if (!orgId) return;

    let cancelled = false;

    async function load() {
      setState("loading");
      setError(null);

      try {
        const orgRes = await api.get(`/organization/${orgId}`);

        if (cancelled) return;

        const payload = (orgRes.data?.organization ??
          orgRes.data) as Organization;
        const membershipStatus = orgRes.data?.membershipStatus as
          | "active"
          | "invited"
          | undefined;
        const pendingInvitationId = orgRes.data?.invitationId as
          | string
          | null
          | undefined;

        setOrg(payload);

        if (membershipStatus === "invited" && pendingInvitationId) {
          setInvitationId(pendingInvitationId);
          setState("invited");
          return;
        }

        const productsRes = await api.get(`/organization/${orgId}/products`);

        if (cancelled) return;

        setProducts(
          (productsRes.data?.products ?? productsRes.data ?? []) as Product[],
        );

        setInvitationId(null);
        setState("ready");
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setError(err instanceof Error ? err.message : t("common.error"));
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [orgId, t]);

  if (state === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (state === "invited" && invitationId) {
    return (
      <div>
        <Card className="mb-5 pb-2">
          <CardHeader>
            <CardTitle>{t("app.integrate.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[color:var(--text-muted)]">
              {t("app.orgDetail.pending")}
            </p>
          </CardContent>
        </Card>
        <InvitationActions invitationId={invitationId} />
      </div>
    );
  }

  if (!orgId || state === "error" || !org) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("app.integrate.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-red-200">{error ?? t("common.error")}</p>
          <Link href="/app">
            <Button variant="outline">{t("app.invitation.backToApp")}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const externalProductId =
    products.find((p) => p._id === selectedProductId)?.externalProductId ?? "";
  const productProp = externalProductId
    ? ` externalProductId="${externalProductId}"`
    : "";

  const envNextjs = `# .env.local\nNEXT_PUBLIC_REVIEWLICO_API_URL=https://your-api-url.com\nNEXT_PUBLIC_REVIEWLICO_API_KEY=your_api_key_here`;
  const envVite = `# .env\nVITE_REVIEWLICO_API_URL=https://your-api-url.com\nVITE_REVIEWLICO_API_KEY=your_api_key_here`;

  const reviewFormSnippet = `import { ReviewForm } from "./components/reviewlico/ReviewForm";\n\n<ReviewForm${productProp} />`;
  const reviewListSnippet = `import { ReviewList } from "./components/reviewlico/ReviewList";\n\n<ReviewList${productProp} />`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl tracking-tight">
            {org.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-[color:var(--text-muted)]">
          <p>{t("app.integrate.subtitle")}</p>
          <Link href={`/app/orgs/${org._id}`}>
            <Button variant="outline" size="sm">
              {t("app.integrate.backToOrganization")}
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle>{t("app.integrate.apiKeyTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[color:var(--text-muted)]">
            {t("app.integrate.apiKeyDescription")}
          </p>
          <Link href={`/app/orgs/${org._id}`}>
            <Button variant="outline" size="sm">
              {t("app.integrate.apiKeyLink")}
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* CLI Commands */}
      <Card>
        <CardHeader>
          <CardTitle>{t("app.integrate.cliTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[color:var(--text-muted)]">
            {t("app.integrate.cliDescription")}
          </p>
          <CodeBlock code="npx @reviewlico/cli init" />
          <CodeBlock code="npx @reviewlico/cli add ReviewForm" />
          <CodeBlock code="npx @reviewlico/cli add ReviewList" />
          <CodeBlock code="npx @reviewlico/cli add ReviewForm --styles tailwind" />
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle>{t("app.integrate.envTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[color:var(--text-muted)]">
            {t("app.integrate.envDescription")}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveEnvTab("nextjs")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeEnvTab === "nextjs"
                  ? "bg-blue-500/20 text-blue-200 border border-blue-500/40"
                  : "border border-transparent text-[color:var(--text-muted)] hover:bg-white/5 hover:text-[color:var(--text)]"
              }`}
            >
              {t("app.integrate.frameworkNextjs")}
            </button>
            <button
              onClick={() => setActiveEnvTab("vite")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeEnvTab === "vite"
                  ? "bg-blue-500/20 text-blue-200 border border-blue-500/40"
                  : "border border-transparent text-[color:var(--text-muted)] hover:bg-white/5 hover:text-[color:var(--text)]"
              }`}
            >
              {t("app.integrate.frameworkVite")}
            </button>
          </div>
          <CodeBlock code={activeEnvTab === "nextjs" ? envNextjs : envVite} />
        </CardContent>
      </Card>

      {/* Component Usage */}
      <Card>
        <CardHeader>
          <CardTitle>{t("app.integrate.usageTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[color:var(--text-muted)]">
            {t("app.integrate.usageDescription")}
          </p>

          {products.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                {t("app.integrate.productSelectLabel")}
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-lg border border-[color:var(--border)] bg-black/30 px-3 py-2 text-sm text-[color:var(--text)] focus:outline-none focus:ring-1 focus:ring-blue-500/50 sm:w-auto"
              >
                <option value="">{t("app.integrate.productSelectAll")}</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.externalProductId})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
              ReviewForm
            </p>
            <CodeBlock code={reviewFormSnippet} />
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
              ReviewList
            </p>
            <CodeBlock code={reviewListSnippet} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
