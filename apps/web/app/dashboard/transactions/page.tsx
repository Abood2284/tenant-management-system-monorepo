// apps/web/app/dashboard/transactions/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  CreditCard,
  Banknote,
  Smartphone,
  AlertTriangle,
  Calendar,
  Filter,
  Download,
  X,
  ChevronDown,
  ChevronRight,
  User,
  Building,
  FileText,
  Clock,
  TrendingUp,
  BarChart3,
  Printer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TablePagination } from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import Link from "next/link";
import { AddPaymentModal } from "@/app/dashboard/transactions/[tenantID]/components/payment/AddPaymentModal";
import { DeleteTransactionButton } from "./components/DeleteTransactionButton";
import { TransactionsSkeleton } from "@/components/shared/transactions-skeleton";
import { DownloadReceiptButton } from "./components/DownloadReceiptButton";

// Types for API responses
interface Transaction {
  ID: string;
  TENANT_ID: string;
  RENT_MONTH: string;
  RECEIVED_AMOUNT: number;
  RENT_ALLOCATED: number;
  OUTSTANDING_ALLOCATED: number;
  PENALTY_ALLOCATED: number;
  PAYMENT_METHOD: number;
  PAYMENT_TYPE: number;
  PAYMENT_DATE: string;
  CHEQUE_NUMBER?: string | null;
  CHEQUE_DATE?: string | null;
  BANK_NAME?: string | null;
  BANK_BRANCH?: string | null;
  TRANSACTION_ID?: string | null;
  PAYMENT_GATEWAY?: string | null;
  NOTES?: string | null;
  CREATED_ON: string;
  UPDATED_ON: string | null;
  TENANT_NAME: string;
  PROPERTY_NAME: string;
  PROPERTY_ID?: string | null;
  TOTAL_RENT?: number; // Real rent amount from database
  RENT_PENDING?: number; // Real pending rent from database
  PENALTY_PENDING?: number; // Real pending penalty from database
  OUTSTANDING_PENDING?: number; // Real pending outstanding from database
  BASIC_RENT?: number;
  PROPERTY_TAX?: number;
  REPAIR_CESS?: number;
  MISC?: number;
}

interface UnpaidBalance {
  TENANT_ID: string;
  tenantName: string;
  propertyName: string;
  outstandingAmount: number;
  dueDate: string;
  penalty: number;
}

interface SummaryData {
  totalReceived: number;
  totalOutstanding: number;
}

interface ApiResponse<T> {
  status: number;
  message?: string;
  transData?: T[];
  unpaidData?: T[];
  summaryData?: T;
  total?: number;
}

// Real API function
const apiCall = async (
  endpoint: string,
  params: URLSearchParams
): Promise<ApiResponse<any>> => {
  const workerUrl =
    process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";
  const url = `${workerUrl}${endpoint}?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API responded with status: ${response.status}`);
  }

  const result = (await response.json()) as ApiResponse<any>;

  if (result.status !== 200) {
    throw new Error(result.message || "API request failed");
  }

  return result;
};

function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [unpaidBalances, setUnpaidBalances] = useState<UnpaidBalance[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalReceived: 0,
    totalOutstanding: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [total, setTotal] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Date range state
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [appliedDateRange, setAppliedDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchData = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: pageSize.toString(),
          search: debouncedSearch,
          ...(appliedDateRange.from && {
            dateFrom: appliedDateRange.from.toISOString().split("T")[0],
          }),
          ...(appliedDateRange.to && {
            dateTo: appliedDateRange.to.toISOString().split("T")[0],
          }),
        });

        // Use real API calls
        const [transRes, unpaidRes, summaryRes] = await Promise.all([
          apiCall("/api/transaction/list", params),
          apiCall("/api/transaction/unpaid", new URLSearchParams()),
          apiCall("/api/transaction/summary", new URLSearchParams()),
        ]);

        setTransactions(transRes.transData || []);
        setTotal(transRes.total || 0);
        setUnpaidBalances(unpaidRes.unpaidData || []);
        setSummary(
          summaryRes.summaryData || { totalReceived: 0, totalOutstanding: 0 }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, pageSize, appliedDateRange]
  );

  useEffect(() => {
    fetchData(page);
  }, [page, debouncedSearch, appliedDateRange, fetchData]);

  // Payment method helpers
  const getPaymentMethodIcon = (method: number) => {
    switch (method) {
      case 1:
        return <Banknote className="h-4 w-4" />;
      case 2:
        return <CreditCard className="h-4 w-4" />;
      case 3:
        return <Smartphone className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentMethodName = (method: number) => {
    switch (method) {
      case 1:
        return "Cash";
      case 2:
        return "Cheque";
      case 3:
        return "Online";
      default:
        return "Unknown";
    }
  };

  // Payment type helpers
  const getPaymentTypeName = (type: number) => {
    switch (type) {
      case 1:
        return "Rent";
      case 2:
        return "Penalty";
      case 3:
        return "Outstanding";
      default:
        return "Mixed";
    }
  };

  // Date formatting helpers
  const formatRentMonth = (rentMonth: string) => {
    const date = new Date(rentMonth);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const getFinancialYear = (rentMonth: string) => {
    const date = new Date(rentMonth);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0-indexed to 1-indexed

    // Financial year starts from April (month 4)
    if (month >= 4) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };

  const getQuarter = (rentMonth: string) => {
    const date = new Date(rentMonth);
    const month = date.getMonth() + 1; // 0-indexed to 1-indexed

    if (month >= 4 && month <= 6) return "Q1";
    if (month >= 7 && month <= 9) return "Q2";
    if (month >= 10 && month <= 12) return "Q3";
    return "Q4"; // Jan-Mar
  };

  // Monthly summary helpers - now using real data
  const getMonthlySummary = (rentMonth: string) => {
    const monthTransactions = transactions.filter(
      (tx) => tx.RENT_MONTH === rentMonth
    );

    const totalRentCollected = monthTransactions.reduce(
      (sum, tx) => sum + tx.RENT_ALLOCATED,
      0
    );

    const totalExpectedRent = monthTransactions.length * 12000; // Assuming ₹12,000 per tenant
    const percentageCollected =
      totalExpectedRent > 0
        ? Math.round((totalRentCollected / totalExpectedRent) * 100)
        : 0;

    return {
      totalCollected: totalRentCollected,
      totalExpected: totalExpectedRent,
      percentage: percentageCollected,
      tenantCount: monthTransactions.length,
    };
  };

  // Tenant-specific monthly summary using real data
  const getTenantMonthlySummary = (tenantId: string, rentMonth: string) => {
    const tenantTransactions = transactions.filter(
      (tx) => tx.TENANT_ID === tenantId && tx.RENT_MONTH === rentMonth
    );

    if (tenantTransactions.length === 0) {
      return {
        totalCollected: 0,
        pendingAmount: 0,
        completionRate: 0,
        transactionCount: 0,
      };
    }

    // Use the first transaction's data (they should all be the same for the same tenant/month)
    const firstTx = tenantTransactions[0];
    const totalCollected = tenantTransactions.reduce(
      (sum, tx) => sum + tx.RECEIVED_AMOUNT,
      0
    );

    // Use real rent amount from database
    const totalExpected = firstTx.TOTAL_RENT || 0;
    const pendingAmount = Math.max(0, totalExpected - totalCollected);
    const completionRate =
      totalExpected > 0
        ? Math.round((totalCollected / totalExpected) * 100)
        : 0;

    return {
      totalCollected,
      pendingAmount,
      completionRate,
      transactionCount: tenantTransactions.length,
    };
  };

  const toggleRowExpansion = (transactionId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(transactionId)) {
      newExpandedRows.delete(transactionId);
    } else {
      newExpandedRows.add(transactionId);
    }
    setExpandedRows(newExpandedRows);
  };

  const clearDateRange = () => {
    setDateRange({ from: undefined, to: undefined });
    setAppliedDateRange({ from: undefined, to: undefined });
  };

  const getDateRangeText = () => {
    if (!appliedDateRange.from && !appliedDateRange.to)
      return "Select date range";
    if (appliedDateRange.from && appliedDateRange.to) {
      return `${format(appliedDateRange.from, "MMM dd")} - ${format(appliedDateRange.to, "MMM dd, yyyy")}`;
    }
    if (appliedDateRange.from)
      return `From ${format(appliedDateRange.from, "MMM dd, yyyy")}`;
    if (appliedDateRange.to)
      return `Until ${format(appliedDateRange.to, "MMM dd, yyyy")}`;
    return "Select date range";
  };

  const applyDateFilter = () => {
    setAppliedDateRange(dateRange);
    setIsDatePickerOpen(false);
  };

  if (loading) return <TransactionsSkeleton />;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-prussian-blue-500">
            Transactions
          </h1>
          <p className="text-air-superiority-blue-500 mt-2">
            Manage and track tenant payments
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            className="bg-prussian-blue-500 hover:bg-prussian-blue-600"
            onClick={() => setIsAddPaymentModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative w-80">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search by tenant name or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                aria-label="Search transactions"
              />
            </div>

            {/* Date Range Picker */}
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-64 justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {getDateRangeText()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Select Date Range</h4>
                    {(dateRange.from || dateRange.to) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearDateRange}
                        className="h-6 px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <CalendarComponent
                    mode="range"
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onSelect={(range) => {
                      if (range?.from) {
                        setDateRange({
                          from: range.from,
                          to: range.to,
                        });
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    numberOfMonths={2}
                    className="rounded-md"
                  />
                </div>
                <div className="p-3 border-t bg-muted/50">
                  <Button
                    onClick={applyDateFilter}
                    className="w-full"
                    size="sm"
                  >
                    Apply Filter
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <div className="text-sm text-muted-foreground">
              {total} transactions found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-prussian-blue-500">
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <caption className="sr-only">Payment transactions table</caption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Tenant</TableHead>
                  <TableHead scope="col">Rent Month</TableHead>
                  <TableHead scope="col">Financial Year</TableHead>
                  <TableHead scope="col">Quarter</TableHead>
                  <TableHead scope="col" className="text-right">
                    Total Amount
                  </TableHead>
                  <TableHead scope="col">Payment Type</TableHead>
                  <TableHead scope="col">Payment Method</TableHead>
                  <TableHead scope="col">Date</TableHead>
                  <TableHead scope="col" className="w-[50px]">
                    Details
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <React.Fragment key={tx.ID}>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{tx.TENANT_NAME}</div>
                          <div className="text-sm text-muted-foreground">
                            {tx.TENANT_ID.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <div className="font-medium cursor-help hover:text-prussian-blue-600">
                              {formatRentMonth(tx.RENT_MONTH)}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="max-w-xs">
                            <div className="space-y-2">
                              <div className="font-semibold">
                                {formatRentMonth(tx.RENT_MONTH)} Summary
                              </div>
                              {(() => {
                                const summary = getMonthlySummary(
                                  tx.RENT_MONTH
                                );
                                return (
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span>Total Collected:</span>
                                      <span className="font-medium">
                                        ₹
                                        {summary.totalCollected.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Expected:</span>
                                      <span className="font-medium">
                                        ₹
                                        {summary.totalExpected.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Tenants:</span>
                                      <span className="font-medium">
                                        {summary.tenantCount}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Collection Rate:</span>
                                      <span
                                        className={`font-medium ${
                                          summary.percentage >= 80
                                            ? "text-green-600"
                                            : summary.percentage >= 60
                                              ? "text-yellow-600"
                                              : "text-red-600"
                                        }`}
                                      >
                                        {summary.percentage}%
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {getFinancialYear(tx.RENT_MONTH)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getQuarter(tx.RENT_MONTH)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-semibold text-lg">
                          ₹{tx.RECEIVED_AMOUNT.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tx.PAYMENT_TYPE === 1 ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {getPaymentTypeName(tx.PAYMENT_TYPE)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(tx.PAYMENT_METHOD)}
                          <span className="text-sm">
                            {getPaymentMethodName(tx.PAYMENT_METHOD)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(tx.PAYMENT_DATE).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.CREATED_ON).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleRowExpansion(tx.ID)}
                          aria-expanded={expandedRows.has(tx.ID)}
                          aria-label={`${expandedRows.has(tx.ID) ? "Collapse" : "Expand"} details for ${tx.TENANT_NAME}`}
                        >
                          {expandedRows.has(tx.ID) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Details Row */}
                    {expandedRows.has(tx.ID) && (
                      <TableRow>
                        <TableCell colSpan={9} className="p-0">
                          <div className="relative ml-8 bg-gray-50 border-l-4 border-green-500 p-4">
                            {/* Green connecting line */}
                            <div className="absolute left-0 top-0 w-1 h-full bg-green-500 transform -translate-x-1"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {/* Transaction Details */}
                              <div className="space-y-3">
                                <h4 className="font-semibold text-sm text-prussian-blue-600 flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Transaction Details
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Transaction ID:
                                    </span>
                                    <span className="font-mono">{tx.ID}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Created:
                                    </span>
                                    <span>
                                      {new Date(tx.CREATED_ON).toLocaleString()}
                                    </span>
                                  </div>
                                  {tx.UPDATED_ON && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Updated:
                                      </span>
                                      <span>
                                        {new Date(
                                          tx.UPDATED_ON
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                  {tx.NOTES && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Notes:
                                      </span>
                                      <span className="text-right">
                                        {tx.NOTES}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Monthly Summary */}
                              <div className="space-y-3">
                                <h4 className="font-semibold text-sm text-prussian-blue-600 flex items-center gap-2">
                                  <BarChart3 className="h-4 w-4" />
                                  Monthly Summary
                                </h4>
                                {(() => {
                                  const summary = getTenantMonthlySummary(
                                    tx.TENANT_ID,
                                    tx.RENT_MONTH
                                  );
                                  return (
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground block text-xs">
                                          Collected:
                                        </span>
                                        <span className="block font-medium text-green-600">
                                          ₹
                                          {summary.totalCollected.toLocaleString()}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground block text-xs">
                                          Pending:
                                        </span>
                                        <span className="block font-medium text-orange-600">
                                          ₹
                                          {summary.pendingAmount.toLocaleString()}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground block text-xs">
                                          Completion:
                                        </span>
                                        <span
                                          className={`block font-medium ${
                                            summary.completionRate >= 80
                                              ? "text-green-600"
                                              : summary.completionRate >= 60
                                                ? "text-yellow-600"
                                                : "text-red-600"
                                          }`}
                                        >
                                          {summary.completionRate}%
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Payment Allocation */}
                              <div className="space-y-3">
                                <h4 className="font-semibold text-sm text-prussian-blue-600 flex items-center gap-2">
                                  <Building className="h-4 w-4" />
                                  Payment Allocation
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Rent Allocated:
                                    </span>
                                    <span className="font-medium">
                                      ₹{tx.RENT_ALLOCATED.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Penalty Allocated:
                                    </span>
                                    <span className="font-medium">
                                      ₹{tx.PENALTY_ALLOCATED.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Outstanding Allocated:
                                    </span>
                                    <span className="font-medium">
                                      ₹
                                      {tx.OUTSTANDING_ALLOCATED.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Pending Balances */}
                              <div className="space-y-3">
                                <h4 className="font-semibold text-sm text-prussian-blue-600 flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  Pending Balances
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Rent Pending:
                                    </span>
                                    <span
                                      className={`font-medium ${
                                        (tx.RENT_PENDING || 0) > 0
                                          ? "text-orange-600"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      ₹{(tx.RENT_PENDING || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Penalty Pending:
                                    </span>
                                    <span
                                      className={`font-medium ${
                                        (tx.PENALTY_PENDING || 0) > 0
                                          ? "text-red-600"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      ₹
                                      {(
                                        tx.PENALTY_PENDING || 0
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Outstanding Pending:
                                    </span>
                                    <span
                                      className={`font-medium ${
                                        (tx.OUTSTANDING_PENDING || 0) > 0
                                          ? "text-yellow-600"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      ₹
                                      {(
                                        tx.OUTSTANDING_PENDING || 0
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Rent Breakdown */}
                              <div className="space-y-3">
                                <h4 className="font-semibold text-sm text-prussian-blue-600 flex items-center gap-2">
                                  <CreditCard className="h-4 w-4" />
                                  Rent Breakdown
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Base Rent:
                                    </span>
                                    <span className="font-medium">
                                      ₹{(tx.BASIC_RENT || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Property Tax:
                                    </span>
                                    <span className="font-medium">
                                      ₹{(tx.PROPERTY_TAX || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Repair Cess:
                                    </span>
                                    <span className="font-medium">
                                      ₹{(tx.REPAIR_CESS || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Misc:
                                    </span>
                                    <span className="font-medium">
                                      ₹{(tx.MISC || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                                    <span className="text-muted-foreground">
                                      Total Rent:
                                    </span>
                                    <span className="font-bold text-lg">
                                      ₹{(tx.TOTAL_RENT || 0).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Enhanced Info Button */}
                              <div className="space-y-3">
                                <h4 className="font-semibold text-sm text-prussian-blue-600 flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4" />
                                  Analytics
                                </h4>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    asChild
                                  >
                                    <Link
                                      href={`/dashboard/transactions/${tx.TENANT_ID}`}
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      View Tenant Analytics
                                    </Link>
                                  </Button>
                                </div>
                                <div className="flex gap-2">
                                  <DownloadReceiptButton
                                    transactionId={tx.ID}
                                  />
                                  <DeleteTransactionButton
                                    transactionId={tx.ID}
                                    tenantName={tx.TENANT_NAME}
                                    propertyName={tx.PROPERTY_NAME}
                                    amount={tx.RECEIVED_AMOUNT}
                                    paymentDate={tx.PAYMENT_DATE}
                                    paymentMethod={tx.PAYMENT_METHOD}
                                    onSuccess={() => {
                                      // Refresh the data after successful deletion
                                      fetchData(page);
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4">
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        onSuccess={() => {
          setIsAddPaymentModalOpen(false);
          // Refresh the data
          fetchData(page);
        }}
      />
    </div>
  );
}

export default TransactionsPage;
