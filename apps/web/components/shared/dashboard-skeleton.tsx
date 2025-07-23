import {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonButton,
  SkeletonMetricCard,
} from "../ui/skeleton";

function DashboardHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
  );
}

function DashboardMetricsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonMetricCard key={i} />
      ))}
    </div>
  );
}

function QuickActionsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonButton key={i} className="h-16" />
        ))}
      </div>
    </div>
  );
}

function DashboardTableSkeleton() {
  return (
    <SkeletonCard className="flex flex-col h-[400px]">
      <div className="p-6 pb-2">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="flex-1 px-6 overflow-y-auto">
        <SkeletonTable rows={6} columns={3} />
      </div>
      <div className="p-2 border-t">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    </SkeletonCard>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 h-full">
      <DashboardHeaderSkeleton />
      <DashboardMetricsSkeleton />
      <QuickActionsSkeleton />
      <div className="grid gap-6 md:grid-cols-2">
        <DashboardTableSkeleton />
        <DashboardTableSkeleton />
      </div>
    </div>
  );
}

export {
  DashboardSkeleton,
  DashboardHeaderSkeleton,
  DashboardMetricsSkeleton,
  QuickActionsSkeleton,
  DashboardTableSkeleton,
};
