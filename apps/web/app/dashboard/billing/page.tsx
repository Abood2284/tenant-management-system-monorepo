// apps/web/app/dashboard/billing/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Printer,
  MessageSquare,
  Search,
  Receipt,
  Eye,
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
import { Input } from "@/components/ui/input";

// Types
interface Tenant {
  id: string;
  name: string;
  property: string;
}

interface ApiTenant {
  TENANT_ID: string;
  TENANT_NAME: string;
  PROPERTY_ID: string;
}

interface BillingHistory {
  id: string;
  tenant: string;
  property: string;
  month: string;
  rentAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstanding: number;
  status: string;
  paidDate: string | null;
  paymentMethod: string | null;
}

function getDefaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 3);
  // Format as yyyy-mm-dd
  const pad = (n: number) => n.toString().padStart(2, "0");
  const format = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { from: format(from), to: format(to) };
}

function BillingPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState("all");
  const [{ from: defaultFrom, to: defaultTo }] = useState(
    getDefaultDateRange()
  );
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTenants() {
      try {
        const workerUrl =
          process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";
        const response = await fetch(`${workerUrl}/api/tenant/list?limit=1000`);
        if (!response.ok) throw new Error("Failed to fetch tenants");
        const result = (await response.json()) as { data: ApiTenant[] };
        const formattedTenants = result.data.map((t: ApiTenant) => ({
          id: t.TENANT_ID,
          name: t.TENANT_NAME,
          property: t.PROPERTY_ID,
        }));
        setTenants(formattedTenants);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    }
    fetchTenants();
  }, []);

  async function fetchBillingHistory() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedTenant && selectedTenant !== "all")
        params.append("tenantId", selectedTenant);
      if (fromDate) params.append("dateFrom", fromDate);
      if (toDate) params.append("dateTo", toDate);
      params.append("limit", "1000");
      const workerUrl =
        process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";
      const response = await fetch(
        `${workerUrl}/api/transaction/list?${params.toString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch billing history");
      const result: any = await response.json();
      // Map API fields to BillingHistory
      const mapped = (result.transData || []).map((row: any) => ({
        id: row.ID,
        tenant: row.TENANT_NAME || row.tenant || "",
        property: row.PROPERTY_NAME || row.property || "",
        month: row.RENT_MONTH || row.month || "",
        rentAmount: row.TOTAL_RENT || row.rentAmount || 0,
        totalAmount: row.RECEIVED_AMOUNT || row.totalAmount || 0,
        paidAmount: row.RENT_ALLOCATED || row.paidAmount || 0,
        outstanding:
          (row.RENT_PENDING || 0) +
          (row.PENALTY_PENDING || 0) +
          (row.OUTSTANDING_PENDING || 0),
        status: row.status || (row.RENT_PENDING > 0 ? "Unpaid" : "Paid"),
        paidDate: row.PAYMENT_DATE || null,
        paymentMethod: row.PAYMENT_METHOD || null,
      }));
      setBillingHistory(mapped);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  }

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchBillingHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-prussian_blue-500">Billing</h1>
          <p className="text-muted-foreground mt-2">
            Manage tenant billing and transaction history
          </p>
        </div>
        <Button className="bg-prussian_blue-500 hover:bg-prussian_blue-600">
          <Receipt className="h-4 w-4 mr-2" />
          Generate Bill
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form
            className="grid grid-cols-1 md:grid-cols-5 gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              fetchBillingHistory();
            }}
          >
            <div>
              <label className="text-sm font-medium text-prussian_blue-500 mb-2 block">
                Select Tenant
              </label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="All tenants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenants</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id.toString()}>
                      {tenant.name} - {tenant.property}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-prussian_blue-500 mb-2 block">
                From Date
              </label>
              <Input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-prussian_blue-500 mb-2 block">
                To Date
              </label>
              <Input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full bg-air_superiority_blue-500 hover:bg-air_superiority_blue-600"
              >
                <Search className="h-4 w-4 mr-2" />
                Search Bills
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Billing History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-prussian_blue-500">
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-500">Error: {error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Rent Amount</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium text-prussian_blue-500">
                      {bill.tenant}
                    </TableCell>
                    <TableCell>{bill.property}</TableCell>
                    <TableCell>{bill.month}</TableCell>
                    <TableCell>₹{bill.rentAmount.toLocaleString()}</TableCell>
                    <TableCell>₹{bill.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <span
                        className={
                          bill.outstanding > 0
                            ? "text-fire_brick-500 font-medium"
                            : "text-green-600"
                        }
                      >
                        ₹{bill.outstanding.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          bill.status === "Paid" ? "default" : "secondary"
                        }
                        className={
                          bill.status === "Paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-air_superiority_blue-500 border-air_superiority_blue-500"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-air_superiority_blue-500 border-air_superiority_blue-500"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-air_superiority_blue-500 border-air_superiority_blue-500"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default BillingPage;
