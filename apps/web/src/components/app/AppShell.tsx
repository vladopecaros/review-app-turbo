"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { FullPageSkeleton } from "@/components/app/FullPageSkeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useAuthStore } from "@/store/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { isAuthenticated, isLoading } = useAuthGuard();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);

  function closeDrawer() {
    setDrawerClosing(true);
    setTimeout(() => {
      setDrawerOpen(false);
      setDrawerClosing(false);
    }, 200);
  }
  const orgMatch = pathname.match(/^\/app\/orgs\/([^/]+)/);
  const orgId = orgMatch?.[1];

  useEffect(() => {
    closeDrawer();
  }, [pathname]);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await api.post("/auth/logout");
    } catch {
      // Clear local auth regardless of backend response (including 401).
    } finally {
      clearAuth();
      router.replace("/");
      setIsLoggingOut(false);
    }
  }

  if (isLoading || !isAuthenticated) {
    return <FullPageSkeleton />;
  }

  const navItems = [
    { href: "/app", label: t("appShell.dashboard") },
    ...(orgId
      ? [
          {
            href: `/app/orgs/${orgId}`,
            label: t("appShell.organization"),
          },
          {
            href: `/app/orgs/${orgId}/products`,
            label: t("appShell.products"),
          },
          {
            href: `/app/orgs/${orgId}/reviews`,
            label: t("appShell.reviews"),
          },
        ]
      : []),
    { href: "/security", label: t("nav.security") },
  ];

  const activeItem =
    navItems
      .filter(
        (item) =>
          pathname === item.href || pathname.startsWith(`${item.href}/`),
      )
      .sort((a, b) => b.href.length - a.href.length)[0] ?? null;

  const activeLabel =
    activeItem?.label ?? pathname.split("/").filter(Boolean).pop() ?? "app";

  return (
    <div className="min-h-screen">
      {/* Mobile-only sticky top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/5 bg-[rgba(8,11,15,0.85)] px-4 backdrop-blur-xl md:hidden">
        <Link
          href="/app"
          className="font-display text-lg font-semibold tracking-tight"
        >
          Reviewlico
        </Link>
        <div className="flex items-center gap-2">
          <p className="max-w-[120px] truncate text-xs text-[color:var(--text-muted)]">
            {user?.email ?? ""}
          </p>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-transparent hover:bg-white/5"
            aria-label="Open navigation menu"
          >
            <span className="relative block h-3.5 w-4">
              <span className="absolute left-0 top-0 h-0.5 w-4 bg-current" />
              <span className="absolute left-0 top-1.5 h-0.5 w-4 bg-current" />
              <span className="absolute left-0 top-3 h-0.5 w-4 bg-current" />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile drawer backdrop */}
      {drawerOpen ? (
        <button
          className={`fixed inset-0 z-40 bg-black/60 md:hidden ${drawerClosing ? "animate-fade-down" : "animate-fade-up"}`}
          onClick={closeDrawer}
          aria-label="Close navigation menu"
          aria-hidden="true"
          tabIndex={-1}
        />
      ) : null}

      {/* Mobile drawer panel */}
      {drawerOpen ? (
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 rounded-none border-r border-[color:var(--border)] surface-panel md:hidden ${drawerClosing ? "animate-fade-down" : "animate-fade-up"}`}
        >
          <div className="flex h-full flex-col p-4">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <Link
                  href="/app"
                  className="font-display text-xl font-semibold tracking-tight"
                  onClick={closeDrawer}
                >
                  Reviewlico
                </Link>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                  {t("appShell.product")}
                </p>
              </div>
              <button
                onClick={closeDrawer}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-[color:var(--text-muted)] hover:bg-white/5 hover:text-[color:var(--text)]"
                aria-label="Close navigation menu"
              >
                ✕
              </button>
            </div>

            <nav className="grid gap-2">
              {navItems.map((item) => {
                const active = activeItem?.href === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeDrawer}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm transition",
                      active
                        ? "border-blue-500/40 bg-blue-500/10 text-blue-100"
                        : "border-transparent text-[color:var(--text-muted)] hover:border-white/5 hover:bg-white/5 hover:text-[color:var(--text)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                {t("appShell.welcome")}
              </p>
              <p className="mt-1 truncate text-sm font-medium">
                {user?.email ?? "Unknown user"}
              </p>
            </div>
          </div>
        </aside>
      ) : null}

      {/* Desktop + content layout */}
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 sm:p-6 md:flex-row md:gap-6">
        <aside className="hidden surface-panel md:sticky md:top-6 md:block md:h-[calc(100vh-3rem)] md:w-72 md:shrink-0">
          <div className="flex h-full flex-col p-4">
            <div className="mb-6">
              <Link
                href="/app"
                className="font-display text-xl font-semibold tracking-tight"
              >
                Reviewlico
              </Link>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                {t("appShell.product")}
              </p>
            </div>

            <nav className="grid gap-2">
              {navItems.map((item) => {
                const active = activeItem?.href === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm transition",
                      active
                        ? "border-blue-500/40 bg-blue-500/10 text-blue-100"
                        : "border-transparent text-[color:var(--text-muted)] hover:border-white/5 hover:bg-white/5 hover:text-[color:var(--text)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                {t("appShell.welcome")}
              </p>
              <p className="mt-1 truncate text-sm font-medium">
                {user?.email ?? "Unknown user"}
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 overflow-x-hidden">
          <header className="surface-panel mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[color:var(--text-muted)]">
                {t("brand.tagline")}
              </p>
              <p className="mt-1 truncate text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                {activeLabel}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? t("appShell.loggingOut") : t("appShell.logout")}
            </Button>
          </header>
          <div className="space-y-4 pb-4 md:pb-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
