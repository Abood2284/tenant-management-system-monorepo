"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  AlertTriangle,
  Calendar,
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

function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data
  const transactions = [
    {
      id: 1,
      tenant: "John Smith",
      property: "Sunset Apartments",
      amount: 13200,
      paymentDate: "2025-01-05",
      paymentMethod: "Online",
      transactionId: "TXN001",
      status: "Completed",
      billMonth: "January 2025",
    },
    {
      id: 2,
      tenant: "Mike Wilson",
      property: "Downtown Plaza",
      amount: 19800,
      paymentDate: "2024-12-28",
      paymentMethod: "Cash",
      transactionId: "TXN002",
      status: "Completed",
      billMonth: "December 2024",
    },
    {
      id: 3,
      tenant: "Sarah Johnson",
      property: "Oak Street Building",
      amount: 8000,
      paymentDate: "2024-12-15",
      paymentMethod: "Cheque",
      transactionId: "TXN003",
      status: "Pending",
      billMonth: "December 2024",
    },
  ];

  const outstandingPayments = [
    {
      tenant: "Sarah Johnson",
      property: "Oak Street Building",
      outstandingAmount: 8500,
      dueDate: "2025-01-05",
      daysPastDue: 2,
      penaltyFee: 75,
    },
    {
      tenant: "Alex Brown",
      property: "Riverside Complex",
      outstandingAmount: 22000,
      dueDate: "2024-12-30",
      daysPastDue: 8,
      penaltyFee: 100,
    },
  ];

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "Online":
        return <Smartphone className="h-4 w-4" />;
      case "Cash":
        return <Banknote className="h-4 w-4" />;
      case "Cheque":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-prussian_blue-500">
            Transactions
          </h1>
          <p className="text-muted-foreground mt-2">
            Record and manage tenant payments
          </p>
        </div>
        <Button className="bg-prussian_blue-500 hover:bg-prussian_blue-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Payment
        </Button>
      </div>

      {/* Outstanding Payments Alert */}
      <Card className="border-fire_brick-200 bg-fire_brick-50">
        <CardHeader>
          <CardTitle className="text-fire_brick-500 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Outstanding Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {outstandingPayments.map((payment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white rounded-lg border"
              >
                <div>
                  <div className="font-medium text-prussian_blue-500">
                    {payment.tenant}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {payment.property}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-fire_brick-500">
                    ₹{payment.outstandingAmount.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {payment.daysPastDue} days overdue • Penalty: ₹
                    {payment.penaltyFee}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search transactions by tenant, property, or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              className="text-prussian_blue-500 border-prussian_blue-500"
            >
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-prussian_blue-500">
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-sm">
                    {transaction.transactionId}
                  </TableCell>
                  <TableCell className="font-medium text-prussian_blue-500">
                    {transaction.tenant}
                  </TableCell>
                  <TableCell>{transaction.property}</TableCell>
                  <TableCell className="font-medium">
                    ₹{transaction.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(transaction.paymentMethod)}
                      <span>{transaction.paymentMethod}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-air_superiority_blue-500" />
                      {transaction.paymentDate}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.status === "Completed"
                          ? "default"
                          : "secondary"
                      }
                      className={
                        transaction.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-air_superiority_blue-500 border-air_superiority_blue-500"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-fire_brick-500 border-fire_brick-500 hover:bg-fire_brick-500 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
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

export default TransactionsPage;
