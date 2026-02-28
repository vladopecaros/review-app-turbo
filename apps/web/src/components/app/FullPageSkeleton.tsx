import { Skeleton } from '@/components/ui/skeleton';

export function FullPageSkeleton() {
  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto flex max-w-7xl gap-6">
        <div className="hidden w-64 shrink-0 md:block">
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
