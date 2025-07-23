# Skeleton Components

This directory contains skeleton loading components that provide a better user experience during data loading states.

## Available Components

### Base Skeleton Components (`skeleton.tsx`)

- `Skeleton` - Basic skeleton element with pulse animation
- `SkeletonCard` - Card-shaped skeleton with proper styling
- `SkeletonTable` - Table skeleton with configurable rows and columns
- `SkeletonButton` - Button-shaped skeleton
- `SkeletonMetricCard` - Metric card skeleton for dashboard metrics

### Page-Specific Skeletons

#### Dashboard Skeleton (`dashboard-skeleton.tsx`)

- `DashboardSkeleton` - Complete dashboard loading state
- `DashboardHeaderSkeleton` - Header section skeleton
- `DashboardMetricsSkeleton` - Metrics cards skeleton
- `QuickActionsSkeleton` - Quick actions buttons skeleton
- `DashboardTableSkeleton` - Table skeleton for dashboard tables

#### Tenants Skeleton (`tenants-skeleton.tsx`)

- `TenantsSkeleton` - Complete tenants page loading state
- `TenantsHeaderSkeleton` - Header section skeleton
- `TenantsFiltersSkeleton` - Filters section skeleton
- `TenantsTableSkeleton` - Table skeleton for tenants table

#### Transactions Skeleton (`transactions-skeleton.tsx`)

- `TransactionsSkeleton` - Complete transactions page loading state
- `TransactionsHeaderSkeleton` - Header section skeleton
- `TransactionsFiltersSkeleton` - Filters section skeleton
- `TransactionsTableSkeleton` - Table skeleton for transactions table

## Usage Examples

### Basic Usage

```tsx
import { Skeleton } from "@/components/ui/skeleton";

function LoadingComponent() {
  return <Skeleton className="h-4 w-32" />;
}
```

### Dashboard Loading

```tsx
import { DashboardSkeleton } from "@/components/shared/dashboard-skeleton";

function DashboardPage() {
  if (loading) {
    return <DashboardSkeleton />;
  }
  // ... rest of component
}
```

### Tenants Loading

```tsx
import { TenantsSkeleton } from "@/components/shared/tenants-skeleton";

function TenantsPage() {
  if (loading) {
    return <TenantsSkeleton />;
  }
  // ... rest of component
}
```

### Transactions Loading

```tsx
import { TransactionsSkeleton } from "@/components/shared/transactions-skeleton";

function TransactionsPage() {
  if (loading) {
    return <TransactionsSkeleton />;
  }
  // ... rest of component
}
```

### Table Loading

```tsx
import { SkeletonTable } from "@/components/ui/skeleton";

function TableComponent() {
  if (loading) {
    return <SkeletonTable rows={5} columns={3} />;
  }
  // ... rest of component
}
```

## Customization

All skeleton components accept standard className props and can be customized with Tailwind classes:

```tsx
<Skeleton className="h-8 w-64 bg-gray-200" />
<SkeletonTable className="space-y-4" rows={10} columns={4} />
```

## Best Practices

1. **Use page-specific skeletons** for better UX that matches the actual content layout
2. **Show skeleton during initial load** but avoid for pagination unless necessary
3. **Match the actual content structure** - skeleton should represent the real layout
4. **Use appropriate sizes** - skeleton elements should match the expected content size
5. **Consider loading states** - differentiate between initial load and data refresh

## Implementation Pattern

```tsx
function MyPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <MyPageSkeleton />;
  }

  return <ActualContent data={data} />;
}
```
