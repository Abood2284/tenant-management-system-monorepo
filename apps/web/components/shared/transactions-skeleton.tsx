import { Skeleton, SkeletonCard, SkeletonButton } from "../ui/skeleton";

function TransactionsHeaderSkeleton() {
  return (
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-3">
        <SkeletonButton className="w-20" />
        <SkeletonButton className="w-32" />
      </div>
    </div>
  );
}

function TransactionsFiltersSkeleton() {
  return (
    <SkeletonCard className="p-4">
      <div className="flex gap-4 items-center">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-32" />
      </div>
    </SkeletonCard>
  );
}

function TransactionsTableSkeleton() {
  return (
    <SkeletonCard>
      <div className="p-6 pb-2">
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="p-6 pt-2">
        <div className="rounded-md border">
          <div className="space-y-3">
            {/* Table header */}
            <div className="flex gap-4 py-3 px-6 border-b">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24 ml-auto" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            {/* Table rows */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 py-3 px-6">
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
                <div className="flex-1 text-right">
                  <Skeleton className="h-5 w-20 ml-auto" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <div className="flex-1">
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="w-[50px]">
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>
    </SkeletonCard>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-6">
      <TransactionsHeaderSkeleton />
      <TransactionsFiltersSkeleton />
      <TransactionsTableSkeleton />
    </div>
  );
}

export {
  TransactionsSkeleton,
  TransactionsHeaderSkeleton,
  TransactionsFiltersSkeleton,
  TransactionsTableSkeleton,
};
