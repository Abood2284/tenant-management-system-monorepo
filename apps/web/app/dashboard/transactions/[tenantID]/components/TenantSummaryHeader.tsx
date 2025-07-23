"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Download, AlertTriangle, CheckCircle } from "lucide-react";

interface TenantSummaryHeaderProps {
  tenantName: string;
  propertyName: string;
  status: "active" | "inactive";
  totalPaid: number;
  totalOutstanding: number;
  avgMonthlySpend: number;
}

export function TenantSummaryHeader({
  tenantName,
  propertyName,
  status,
  totalPaid,
  totalOutstanding,
  avgMonthlySpend,
}: TenantSummaryHeaderProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "inactive":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Tenant Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-prussian-blue-900">
                {tenantName}
              </h1>
              <Badge
                variant="outline"
                className={`text-xs ${getStatusColor(status)}`}
              >
                <span className="flex items-center gap-1">
                  {getStatusIcon(status)}
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </Badge>
            </div>
            <p className="text-muted-foreground">{propertyName}</p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 lg:gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ₹{totalPaid.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Paid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                ₹{totalOutstanding.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Outstanding</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ₹{avgMonthlySpend.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Avg Monthly</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
