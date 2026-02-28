import { Skeleton } from '@/components/ui/skeleton';

export function FullPageSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Mobile top bar skeleton */}
      <div className="h-14 border-b border-white/5 bg-[rgba(8,11,15,0.85)] md:hidden" />
      <div className="mx-auto flex max-w-7xl gap-6 p-4 sm:p-6">
        <div className="hidden w-72 shrink-0 md:block">
          <Skeleton className="h-[calc(100vh-3rem)] w-full rounded-2xl" />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
