"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/pagination";

interface Transaction {
  ID: string;
  RENT_MONTH: string;
  RECEIVED_AMOUNT: number;
  RENT_ALLOCATED: number;
  PENALTY_ALLOCATED: number;
  OUTSTANDING_ALLOCATED: number;
  PAYMENT_METHOD: number;
  PAYMENT_DATE: string;
  PAYMENT_TYPE: number;
}

interface TransactionHistoryTableProps {
  transactions: Transaction[];
  title?: string;
}

export function TransactionHistoryTable({
  transactions,
  title = "Transaction History",
}: TransactionHistoryTableProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const getPaymentMethodName = (method: number) => {
    switch (method) {
      case 1:
        return "Credit Card";
      case 2:
        return "Cash";
      case 3:
        return "Online";
      default:
        return "Unknown";
    }
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Rent Month</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Type</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions
                .slice((page - 1) * pageSize, page * pageSize)
                .map((tx) => (
                  <TableRow key={tx.ID}>
                    <TableCell className="font-mono text-sm">
                      {tx.ID.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {new Date(tx.RENT_MONTH).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      ₹{tx.RECEIVED_AMOUNT.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getPaymentTypeName(tx.PAYMENT_TYPE)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {getPaymentMethodName(tx.PAYMENT_METHOD)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(tx.PAYMENT_DATE).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4">
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={transactions.length}
            onPageChange={setPage}
          />
        </div>
      </CardContent>
    </Card>
  );
}
