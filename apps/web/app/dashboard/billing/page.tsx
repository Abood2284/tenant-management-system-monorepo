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

// Types
interface Tenant {
  id: string;
  name: string;
  property: string;
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

function BillingPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTenants() {
      try {
        const response = await fetch("http://localhost:8787/api/tenant/list");
        if (!response.ok) {
          throw new Error("Failed to fetch tenants");
        }
        const result = (await response.json()) as { data: Tenant[] };
        const formattedTenants = result.data.map((t: any) => ({
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

  useEffect(() => {
    async function fetchBillingHistory() {
      if (!selectedTenant) return;
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:8787/api/billing/history/${selectedTenant}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch billing history");
        }
        const result = (await response.json()) as { data: BillingHistory[] };
        // TODO: We need to map the tenant and property names
        setBillingHistory(result.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchBillingHistory();
  }, [selectedTenant]);

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-prussian_blue-500 mb-2 block">
                Select Tenant
              </label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose tenant..." />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id.toString()}>
                      {tenant.name} - {tenant.property}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full bg-air_superiority_blue-500 hover:bg-air_superiority_blue-600">
                <Search className="h-4 w-4 mr-2" />
                Search Bills
              </Button>
            </div>
          </div>
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
