"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  UserPlus,
  PlusCircle,
  FileText,
} from "lucide-react";
import { TablePagination } from "@/components/ui/pagination";

// Types
interface DashboardMetrics {
  propertyName: string;
  totalUnits: number;
  occupiedUnits: number;
  totalTenants: number;
  rentCollected: number;
  outstandingAmount: number;
  thisMonthCollection: number;
  pendingPayments: number;
  occupancyRate: number;
}

interface OutstandingTenant {
  tenantId: string;
  tenantName: string | null;
  unitNumber: string | null;
  outstandingAmount: number;
}

interface RecentPayment {
  id: string;
  tenant: string | null;
  unit: string | null;
  amount: number | null;
  date: string | null;
  status: "paid" | "overdue";
}

function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [outstandingTenants, setOutstandingTenants] = useState<
    OutstandingTenant[]
  >([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state for both tables
  const [outstandingPage, setOutstandingPage] = useState(1);
  const [outstandingTotal, setOutstandingTotal] = useState(0);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const pageSize = 10;

  const fetchOutstandingTenants = useCallback(async (page: number) => {
    const res = await fetch(
      `http://localhost:8787/api/report/outstanding-tenants?page=${page}&limit=${pageSize}`
    );
    const result = (await res.json()) as {
      data: OutstandingTenant[];
      total?: number;
    };
    setOutstandingTenants(result.data);
    if (typeof result.total === "number") setOutstandingTotal(result.total);
  }, []);

  const fetchRecentPayments = useCallback(async (page: number) => {
    const res = await fetch(
      `http://localhost:8787/api/report/recent-payments?page=${page}&limit=${pageSize}`
    );
    const result = (await res.json()) as {
      data: RecentPayment[];
      total?: number;
    };
    setRecentPayments(result.data);
    if (typeof result.total === "number") setPaymentsTotal(result.total);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const summaryRes = await fetch(
          "http://localhost:8787/api/report/summary"
        );
        if (!summaryRes.ok)
          throw new Error("Failed to fetch dashboard summary");
        const summaryResult = (await summaryRes.json()) as {
          data: DashboardMetrics;
        };
        setMetrics(summaryResult.data);
        await Promise.all([fetchOutstandingTenants(1), fetchRecentPayments(1)]);
        setOutstandingPage(1);
        setPaymentsPage(1);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [fetchOutstandingTenants, fetchRecentPayments]);

  useEffect(() => {
    fetchOutstandingTenants(outstandingPage);
  }, [outstandingPage, fetchOutstandingTenants]);

  useEffect(() => {
    fetchRecentPayments(paymentsPage);
  }, [paymentsPage, fetchRecentPayments]);

  if (loading && outstandingPage === 1 && paymentsPage === 1) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg font-semibold text-prussian_blue-500">
          Loading Dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 bg-red-100 p-4 rounded-lg">
        <span className="font-bold">Error:</span> {error}
      </div>
    );
  }

  if (!metrics) {
    return <div>No data available.</div>;
  }

  return (
    <div className="space-y-2 h-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-prussian_blue-500">
          Welcome Back, Admin!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here’s a summary of your property management activities.
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-air_superiority_blue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-prussian_blue">
              Active Tenants
            </CardTitle>
            <Users className="h-4 w-4 text-air_superiority_blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-prussian_blue">
              {metrics.totalTenants}
            </div>
            <p className="text-xs text-muted-foreground">Currently residing</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-prussian_blue">
              Monthly Collection
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-prussian_blue">
              ₹{metrics.thisMonthCollection.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-fire_brick">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-prussian_blue">
              Outstanding
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-fire_brick" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fire_brick">
              ₹{metrics.outstandingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Pending payments</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-prussian_blue">
              Total Collected
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-prussian_blue">
              ₹{metrics.rentCollected.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-prussian_blue-500 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            asChild
            variant="outline"
            className="h-16 flex items-center justify-center gap-2 text-prussian_blue-500 border-prussian_blue-200 hover:bg-prussian_blue-500 hover:text-papaya_whip-500 transition-all duration-300 ease-in-out"
          >
            <Link href="/dashboard/tenants/new">
              <UserPlus className="h-6 w-6" />
              <span className="text-sm font-semibold">Add New Tenant</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-16 flex items-center justify-center gap-2 text-prussian_blue-500 border-prussian_blue-200 hover:bg-prussian_blue-500 hover:text-papaya_whip-500 transition-all duration-300 ease-in-out"
          >
            <Link href="/dashboard/transactions/new">
              <PlusCircle className="h-6 w-6" />
              <span className="text-sm font-semibold">Record Payment</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-16 flex items-center justify-center gap-2 text-prussian_blue-500 border-prussian_blue-200 hover:bg-prussian_blue-500 hover:text-papaya_whip-500 transition-all duration-300 ease-in-out"
          >
            <Link href="/dashboard/reports">
              <FileText className="h-6 w-6" />
              <span className="text-sm font-semibold">Generate Report</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Two Column Layout for Activities */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Payment Activity */}
        <Card className="flex flex-col h-[400px]">
          <CardHeader>
            <CardTitle className="text-lg text-prussian_blue-500">
              Recent Payment Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((payment, index) => (
                  <TableRow key={`${payment.id}-${index}`}>
                    <TableCell>
                      <div className="font-medium text-prussian_blue-500">
                        {payment.tenant}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {payment.unit}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-semibold text-prussian_blue-500">
                        ₹{payment.amount?.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(payment.date!).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          payment.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-fire_brick-500"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <div className="p-2 border-t">
            <TablePagination
              page={paymentsPage}
              pageSize={pageSize}
              total={paymentsTotal}
              onPageChange={setPaymentsPage}
            />
          </div>
        </Card>

        {/* Tenants with Outstanding Balances */}
        <Card className="flex flex-col h-[400px]">
          <CardHeader>
            <CardTitle className="text-lg text-prussian_blue-500">
              Tenants with Outstanding Balances
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstandingTenants.map((tenant) => (
                  <TableRow key={tenant.tenantId}>
                    <TableCell>
                      <div className="font-medium text-prussian_blue-500">
                        {tenant.tenantName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tenant.unitNumber}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-fire_brick-500">
                      ₹{tenant.outstandingAmount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <div className="p-2 border-t">
            <TablePagination
              page={outstandingPage}
              pageSize={pageSize}
              total={outstandingTotal}
              onPageChange={setOutstandingPage}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
