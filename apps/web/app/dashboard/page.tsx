"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Building,
  DollarSign,
  FileText,
  Info,
  MessageSquareWarning,
  Plus,
  User,
  UserPlus,
  Users,
} from "lucide-react";

import { AddPaymentModal } from "@/app/dashboard/transactions/[tenantID]/components/payment/AddPaymentModal";
import { AddTenantModal } from "@/app/dashboard/tenants/components/AddTenantModal";
import { DashboardSkeleton } from "@/components/shared/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  Tooltip,
} from "@/components/ui/tooltip";
import { MonthlyStatusPieChart } from "./components/MonthlyStatusPie";

export interface DashboardData {
  kpis: {
    totalOutstanding: number;
    rentCollectedThisMonth: number;
    rentPendingThisMonth: number;
    occupancyRate: number;
    activeTenants: number;
    totalUnits: number;
  };
  monthlyCollectionStatus: {
    collectedAmount: number;
    totalDue: number;
    percentage: number;
  };
  priorityActions: {
    highestDues: {
      tenantId: string;
      tenantName: string | null;
      totalDue: number;
      dueSince: string | null;
    }[];
    unpaidThisMonth: {
      tenantId: string;
      tenantName: string | null;
      unitNumber: string | null;
      rentPending: number | null;
    }[];
    unpaidThisMonthCount: number; // <-- add this
  };
  activityFeed: {
    id: string;
    tenantName: string | null;
    amount: number | null;
    date: string | null;
    type: string;
  }[];
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const workerUrl =
        process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";
      const res = await fetch(`${workerUrl}/api/report/dashboard`);
      if (!res.ok) {
        const errorData = (await res.json()) as {
          message: string;
        };
        throw new Error(errorData.message || "Failed to fetch dashboard data");
      }
      const result = (await res.json()) as {
        data: DashboardData;
      };
      setData(result.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSuccess = () => {
    setIsAddTenantModalOpen(false);
    setIsAddPaymentModalOpen(false);
    toast.success("Dashboard will refresh with new data.");
    fetchDashboardData();
  };

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data)
    return (
      <div className="text-red-500 bg-red-100 p-4 rounded-lg">
        <span className="font-bold">Error:</span>{" "}
        {error || "No data available."}
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-prussian-blue-500">
            Command Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time overview for July 2025.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Outstanding"
          value={`₹${data.kpis.totalOutstanding.toLocaleString()}`}
          subtitle="All pending dues"
          icon={AlertTriangle}
        />
        <KpiCard
          title="Rent Collected (This Mo)"
          value={`₹${data.kpis.rentCollectedThisMonth.toLocaleString()}`}
          subtitle="Revenue for July"
          icon={DollarSign}
        />
        <KpiCard
          title="Rent Pending (This Mo)"
          value={`₹${data.kpis.rentPendingThisMonth.toLocaleString()}`}
          subtitle={`${data.priorityActions.unpaidThisMonthCount} tenants unpaid`}
          icon={MessageSquareWarning}
        />
        <KpiCard
          title="Occupancy"
          value={`${data.kpis.occupancyRate}%`}
          subtitle={`${data.kpis.activeTenants}/${data.kpis.totalUnits} units`}
          icon={Users}
        />
      </div>

      {/* Monthly Collection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Rent Collection Status</CardTitle>
          <CardDescription>
            {`₹${data.monthlyCollectionStatus.collectedAmount.toLocaleString()} collected out of ₹${data.monthlyCollectionStatus.totalDue.toLocaleString()} due for July.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress
            value={data.monthlyCollectionStatus.percentage}
            className="h-3"
          />
        </CardContent>
      </Card>

      {/* Priority Action Center */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tenants with Highest Dues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TooltipProvider>
              {data.priorityActions.highestDues.map((tenant) => (
                <div
                  key={tenant.tenantId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{tenant.tenantName}</p>
                      {tenant.dueSince && (
                        <p className="text-xs text-muted-foreground">
                          Due since{" "}
                          {new Date(tenant.dueSince).toLocaleDateString(
                            "en-IN",
                            {
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm text-red-500 font-bold">
                        ₹{tenant.totalDue.toLocaleString()}
                      </p>
                      <div className="flex items-center justify-end gap-1">
                        <p className="text-xs text-muted-foreground">
                          Total Due
                        </p>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 cursor-pointer text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Pending Rent + Arrears + Penalties</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2 hidden sm:flex"
                    >
                      Send Reminder
                    </Button>
                  </div>
                </div>
              ))}
            </TooltipProvider>
          </CardContent>
        </Card>

        <MonthlyStatusPieChart
          paid={data.kpis.rentCollectedThisMonth}
          unpaid={data.kpis.rentPendingThisMonth}
        />
      </div>

      {/* Activity Feed */}
      <Tabs defaultValue="payments">
        <TabsList>
          <TabsTrigger value="payments">Recent Payments</TabsTrigger>
          <TabsTrigger value="debit_notes" disabled>
            Debit Notes
          </TabsTrigger>
          <TabsTrigger value="rent_changes" disabled>
            Rent Changes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="payments">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {data.activityFeed.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Banknote className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <p className="font-medium">
                      ₹{activity.amount?.toLocaleString()} payment from{" "}
                      {activity.tenantName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.date ?? "").toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setIsAddPaymentModalOpen(true)}>
            <DollarSign className="mr-2 h-4 w-4" />
            <span>Record Payment</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsAddTenantModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            <span>Add New Tenant</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <FileText className="mr-2 h-4 w-4" />
            <span>New Debit Note</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modals */}
      <AddTenantModal
        isOpen={isAddTenantModalOpen}
        onClose={() => setIsAddTenantModalOpen(false)}
        onSuccess={handleSuccess}
      />
      <AddPaymentModal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
