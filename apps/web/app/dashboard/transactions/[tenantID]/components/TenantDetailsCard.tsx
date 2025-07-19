// apps/web/app/dashboard/transactions/[tenantID]/components/TenantDetailsCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Building,
  MapPin,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Home,
  Layers,
} from "lucide-react";

interface TenantDetails {
  tenantName: string;
  propertyName: string;
  floor: string;
  propertyType: string;
  status: "active" | "inactive" | "pending";
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
}

interface TenantDetailsCardProps {
  details: TenantDetails;
}

export function TenantDetailsCard({ details }: TenantDetailsCardProps) {
  const totalRent = Object.values(details.rentBreakdown).reduce(
    (sum, amount) => sum + amount,
    0
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "inactive":
        return <AlertTriangle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Tenant Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-prussian-blue-600 flex items-center gap-2">
            <User className="h-4 w-4" />
            Basic Information
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">Name:</span>
              <span className="block font-medium">{details.tenantName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">
                Status:
              </span>
              <Badge
                variant="outline"
                className={`text-xs ${getStatusColor(details.status)}`}
              >
                <span className="flex items-center gap-1">
                  {getStatusIcon(details.status)}
                  {details.status.charAt(0).toUpperCase() +
                    details.status.slice(1)}
                </span>
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Property Information */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-prussian-blue-600 flex items-center gap-2">
            <Building className="h-4 w-4" />
            Property Information
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">
                Property:
              </span>
              <span className="block font-medium">{details.propertyName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">
                Property ID:
              </span>
              <span className="block font-medium font-mono text-xs">
                {details.notes.includes("Property ID:")
                  ? details.notes.split("Property ID: ")[1]
                  : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">
                Floor:
              </span>
              <span className="block font-medium">{details.floor}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Type:</span>
              <span className="block font-medium">{details.propertyType}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">
                Lease Period:
              </span>
              <span className="block font-medium text-xs">
                {new Date(details.leaseStartDate).toLocaleDateString()} -{" "}
                {new Date(details.leaseEndDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Rent Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-prussian-blue-600 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Rent Breakdown
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Base Rent:</span>
              <span className="font-medium">
                ₹{details.rentBreakdown.baseRent.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Property Tax:</span>
              <span className="font-medium">
                ₹{details.rentBreakdown.maintenance.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Repair Cess:</span>
              <span className="font-medium">
                ₹{details.rentBreakdown.repairCess.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Misc:</span>
              <span className="font-medium">
                ₹{details.rentBreakdown.misc.toLocaleString()}
              </span>
            </div>

            <Separator />
            <div className="flex justify-between items-center font-semibold">
              <span className="text-sm">Total Rent:</span>
              <span className="font-bold text-lg">
                ₹{totalRent.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Payment Statistics */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-prussian-blue-600 flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Payment Statistics
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {details.penaltyPercentage}%
              </div>
              <div className="text-xs text-orange-600">Penalty Rate</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {details.outstandingPercentage}%
              </div>
              <div className="text-xs text-red-600">Outstanding</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Notes */}
        {details.notes && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-prussian-blue-600 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </h4>
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              {details.notes}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
