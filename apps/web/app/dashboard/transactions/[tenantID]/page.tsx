// apps/web/app/dashboard/transactions/[tenantID]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  RentAllocationPieChart,
  MonthlyTrendsAreaChart,
  TransactionHistoryTable,
  TenantDetailsCard,
  TenantSummaryHeader,
} from "./components";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Types for tenant data
interface TenantData {
  tenantName: string;
  propertyName: string;
  totalPaid: number;
  totalOutstanding: number;
  avgMonthlySpend: number;
  tenantDetails: {
    tenantName: string;
    propertyName: string;
    floor: string;
    propertyType: string;
    status: "active" | "inactive";
    rentAmount: number;
    rentBreakdown: {
      baseRent: number;
      maintenance: number;
      repairCess: number;
      misc: number;
    };
    penaltyPercentage: number;
    outstandingPercentage: number;
    notes: string;
    leaseStartDate: string;
    leaseEndDate: string;
  };
  monthlyData: Array<{
    month: string;
    collected: number;
    pending: number;
    completion: number;
  }>;
  allocationData: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  transactions: Array<{
    ID: string;
    RENT_MONTH: string;
    RECEIVED_AMOUNT: number;
    RENT_ALLOCATED: number;
    PENALTY_ALLOCATED: number;
    OUTSTANDING_ALLOCATED: number;
    PAYMENT_METHOD: number;
    PAYMENT_DATE: string;
    PAYMENT_TYPE: number;
  }>;
}

interface ApiResponse<T> {
  status: number;
  message?: string;
  data?: T;
  transData?: T[];
}

// Real API function to fetch tenant data using enhanced API
const fetchTenantData = async (tenantID: string): Promise<TenantData> => {
  const workerUrl =
    process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";

  // Fetch enhanced tenant details
  const tenantResponse = await fetch(
    `${workerUrl}/api/tenant/detail/${tenantID}`
  );
  if (!tenantResponse.ok) {
    throw new Error(`Failed to fetch tenant details: ${tenantResponse.status}`);
  }

  const tenantResult = (await tenantResponse.json()) as ApiResponse<any>;
  if (tenantResult.status !== 200) {
    throw new Error(tenantResult.message || "Failed to fetch tenant details");
  }

  const data = tenantResult.data;
  const tenant = data?.tenant;
  const property = data?.property;
  const rentFactors = data?.rentFactors;
  const paymentHistory = data?.paymentHistory || [];
  const unpaidMonths = data?.unpaidMonths || [];
  const currentMonth = data?.currentMonth;
  const summary = data?.summary;

  // Calculate totals using real data
  const totalPaid = summary?.totalCollected || 0;
  const totalOutstanding = data?.totalDue || 0;
  const avgMonthlySpend =
    paymentHistory.length > 0 ? totalPaid / paymentHistory.length : 0;

  // Generate monthly data from payment history and unpaid months
  const monthlyData = [];

  // Add current month if available
  if (currentMonth) {
    const monthKey = new Date(currentMonth.RENT_MONTH).toLocaleDateString(
      "en-US",
      {
        month: "short",
        year: "numeric",
      }
    );

    const totalExpected = rentFactors?.totalRent || 0;
    const totalCollected =
      currentMonth.RENT_COLLECTED +
      currentMonth.PENALTY_PAID +
      currentMonth.OUTSTANDING_COLLECTED;
    const totalPending =
      currentMonth.RENT_PENDING +
      currentMonth.PENALTY_PENDING +
      currentMonth.OUTSTANDING_PENDING;
    const completion =
      totalExpected > 0
        ? Math.round((totalCollected / totalExpected) * 100)
        : 0;

    monthlyData.push({
      month: monthKey,
      collected: totalCollected,
      pending: totalPending,
      completion: completion,
    });
  }

  // Add unpaid months
  unpaidMonths.forEach((month: any) => {
    const monthKey = new Date(month.RENT_MONTH).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    const totalCollected =
      month.RENT_COLLECTED + month.PENALTY_PAID + month.OUTSTANDING_COLLECTED;
    const totalPending =
      month.RENT_PENDING + month.PENALTY_PENDING + month.OUTSTANDING_PENDING;
    const totalExpected = rentFactors?.totalRent || 0;
    const completion =
      totalExpected > 0
        ? Math.round((totalCollected / totalExpected) * 100)
        : 0;

    monthlyData.push({
      month: monthKey,
      collected: totalCollected,
      pending: totalPending,
      completion: completion,
    });
  });

  // Generate allocation data from summary
  const allocationData = [
    {
      name: "Rent",
      value: summary?.totalRentCollected || 0,
      fill: "var(--chart-1)",
    },
    {
      name: "Penalty",
      value: summary?.totalPenaltyCollected || 0,
      fill: "var(--chart-2)",
    },
    {
      name: "Outstanding",
      value: summary?.totalOutstandingCollected || 0,
      fill: "var(--chart-3)",
    },
  ];

  // Calculate percentages based on actual data
  const totalCollected = summary?.totalRentCollected || 0;
  const penaltyPercentage =
    totalCollected > 0
      ? Math.round(
          ((summary?.totalPenaltyCollected || 0) / totalCollected) * 100
        )
      : 0;
  const outstandingPercentage =
    totalCollected > 0
      ? Math.round(
          ((summary?.totalOutstandingCollected || 0) / totalCollected) * 100
        )
      : 0;

  // Construct tenant details with real data
  const tenantDetails = {
    tenantName: tenant?.TENANT_NAME || "Unknown",
    propertyName: property?.PROPERTY_NAME || tenant?.PROPERTY_NAME || "Unknown",
    floor: tenant?.BUILDING_FOOR || "N/A",
    propertyType: tenant?.PROPERTY_TYPE || "N/A",
    status: tenant?.IS_ACTIVE ? ("active" as const) : ("inactive" as const),
    rentAmount: rentFactors?.totalRent || 0,
    rentBreakdown: {
      baseRent: rentFactors?.BASIC_RENT || 0,
      maintenance: rentFactors?.PROPERTY_TAX || 0,
      repairCess: rentFactors?.REPAIR_CESS || 0,
      misc: rentFactors?.MISC || 0,
    },
    penaltyPercentage,
    outstandingPercentage,
    notes: `Property ID: ${property?.PROPERTY_ID || tenant?.PROPERTY_ID || "N/A"}`,
    leaseStartDate: tenant?.TENANCY_DATE || "N/A",
    leaseEndDate: tenant?.TENANCY_END_DATE || "N/A",
  };

  return {
    tenantName: tenant?.TENANT_NAME || "Unknown",
    propertyName: property?.PROPERTY_NAME || tenant?.PROPERTY_NAME || "Unknown",
    totalPaid,
    totalOutstanding,
    avgMonthlySpend,
    tenantDetails,
    monthlyData,
    allocationData,
    transactions: paymentHistory.map((tx: any) => ({
      ID: tx.ID,
      RENT_MONTH: tx.RENT_MONTH,
      RECEIVED_AMOUNT: tx.RECEIVED_AMOUNT,
      RENT_ALLOCATED: tx.RENT_ALLOCATED || 0,
      PENALTY_ALLOCATED: tx.PENALTY_ALLOCATED || 0,
      OUTSTANDING_ALLOCATED: tx.OUTSTANDING_ALLOCATED || 0,
      PAYMENT_METHOD: tx.PAYMENT_METHOD,
      PAYMENT_DATE: tx.PAYMENT_DATE,
      PAYMENT_TYPE: tx.PAYMENT_TYPE || 1, // Default to rent payment if not specified
    })),
  };
};

export default function TenantTransactionsPage() {
  const { tenantID } = useParams();
  const [data, setData] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedData = await fetchTenantData(tenantID as string);
        setData(fetchedData);
      } catch (error) {
        console.error("Error loading tenant data:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load tenant data"
        );
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [tenantID]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading tenant analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Tenant not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/transactions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transactions
          </Link>
        </Button>
      </div>

      {/* Summary Header */}
      <TenantSummaryHeader
        tenantName={data.tenantName}
        propertyName={data.propertyName}
        status={data.tenantDetails.status}
        totalPaid={data.totalPaid}
        totalOutstanding={data.totalOutstanding}
        avgMonthlySpend={data.avgMonthlySpend}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="xl:col-span-2 space-y-6">
          {/* Area Chart */}
          <MonthlyTrendsAreaChart
            data={data.monthlyData}
            title="Monthly Collection Trends"
            description="Showing collected vs pending amounts over time"
          />

          {/* Transaction History Table */}
          <TransactionHistoryTable
            transactions={data.transactions}
            title="Transaction History"
          />
        </div>

        {/* Right Column - Details and Breakdown */}
        <div className="space-y-6">
          {/* Rent Allocation Pie Chart */}
          <RentAllocationPieChart
            data={data.allocationData}
            title="Rent Allocation Breakdown"
            description="Distribution of payments across different categories"
          />

          {/* Tenant Details Card */}
          <TenantDetailsCard details={data.tenantDetails} />
        </div>
      </div>
    </div>
  );
}
