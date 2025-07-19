"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Building,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

interface TenantMetricsSummaryProps {
  tenantName: string;
  propertyName: string;
  totalPaid: number;
  totalOutstanding: number;
  avgMonthlySpend: number;
  completionRate: number;
}

export function TenantMetricsSummary({
  tenantName,
  propertyName,
  totalPaid,
  totalOutstanding,
  avgMonthlySpend,
  completionRate,
}: TenantMetricsSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-prussian-blue-600" />
          <div>
            <CardTitle className="text-2xl">{tenantName}</CardTitle>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building className="h-4 w-4" />
              <span>{propertyName}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <Badge variant="default" className="text-sm">
            Total Paid: ₹{totalPaid.toLocaleString()}
          </Badge>
          <Badge variant="destructive" className="text-sm">
            Outstanding: ₹{totalOutstanding.toLocaleString()}
          </Badge>
          <Badge variant="secondary" className="text-sm">
            Avg. Monthly: ₹{avgMonthlySpend.toLocaleString()}
          </Badge>
          <Badge
            variant={
              completionRate >= 80
                ? "default"
                : completionRate >= 60
                  ? "secondary"
                  : "destructive"
            }
            className="text-sm"
          >
            {completionRate}% Complete
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
}
