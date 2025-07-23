import {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonButton,
} from "../ui/skeleton";

function TenantsHeaderSkeleton() {
  return (
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <SkeletonButton className="w-40" />
    </div>
  );
}

function TenantsFiltersSkeleton() {
  return (
    <SkeletonCard className="p-4">
      <div className="flex gap-4 items-center flex-wrap">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-2 items-center ml-auto flex-wrap">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </SkeletonCard>
  );
}

function TenantsTableSkeleton() {
  return (
    <SkeletonCard className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto p-0 px-6">
        <SkeletonTable rows={8} columns={8} />
      </div>
    </SkeletonCard>
  );
}

function TenantsSkeleton() {
  return (
    <div className="space-y-6 h-full">
      <TenantsHeaderSkeleton />
      <TenantsFiltersSkeleton />
      <div className="flex justify-end items-center mb-2">
        <Skeleton className="h-6 w-32" />
      </div>
      <TenantsTableSkeleton />
    </div>
  );
}

export {
  TenantsSkeleton,
  TenantsHeaderSkeleton,
  TenantsFiltersSkeleton,
  TenantsTableSkeleton,
};
