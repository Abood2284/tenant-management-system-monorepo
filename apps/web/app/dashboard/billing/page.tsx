"use client";

import { useState } from "react";
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

function BillingPage() {
  const [selectedTenant, setSelectedTenant] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  // Mock data
  const tenants = [
    { id: 1, name: "John Smith", property: "Sunset Apartments" },
    { id: 2, name: "Sarah Johnson", property: "Oak Street Building" },
    { id: 3, name: "Mike Wilson", property: "Downtown Plaza" },
  ];

  const billingHistory = [
    {
      id: 1,
      tenant: "John Smith",
      property: "Sunset Apartments",
      month: "January 2025",
      rentAmount: 12000,
      taxes: 1200,
      totalAmount: 13200,
      paidAmount: 13200,
      outstanding: 0,
      status: "Paid",
      paidDate: "2025-01-05",
      paymentMethod: "Online",
    },
    {
      id: 2,
      tenant: "Sarah Johnson",
      property: "Oak Street Building",
      month: "January 2025",
      rentAmount: 15000,
      taxes: 1500,
      totalAmount: 16500,
      paidAmount: 0,
      outstanding: 16500,
      status: "Pending",
      paidDate: null,
      paymentMethod: null,
    },
    {
      id: 3,
      tenant: "Mike Wilson",
      property: "Downtown Plaza",
      month: "December 2024",
      rentAmount: 18000,
      taxes: 1800,
      totalAmount: 19800,
      paidAmount: 19800,
      outstanding: 0,
      status: "Paid",
      paidDate: "2024-12-28",
      paymentMethod: "Cash",
    },
  ];

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
            <div>
              <label className="text-sm font-medium text-prussian_blue-500 mb-2 block">
                Select Month
              </label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose month..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-01">January 2025</SelectItem>
                  <SelectItem value="2024-12">December 2024</SelectItem>
                  <SelectItem value="2024-11">November 2024</SelectItem>
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
                      variant={bill.status === "Paid" ? "default" : "secondary"}
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
        </CardContent>
      </Card>
    </div>
  );
}

export default BillingPage;
