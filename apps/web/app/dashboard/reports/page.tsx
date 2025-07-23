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
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building,
  Receipt,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Types
interface SummaryData {
  propertyName: string;
  totalUnits: number;
  occupiedUnits: number;
  totalTenants: number;
  rentCollected: number;
  outstandingAmount: number;
  thisMonthCollection: number;
  pendingPayments: number;
  occupancyRate: number;
}

interface PropertyWiseData {
  property: string;
  collected: number;
  pending: number;
  tenants: number;
}

function ReportsPage() {
  const [dateRange, setDateRange] = useState("this-month");
  const [reportType, setReportType] = useState("summary");
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [propertyWiseData, setPropertyWiseData] = useState<PropertyWiseData[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const workerUrl =
          process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";
        const summaryResponse = await fetch(`${workerUrl}/api/report/summary`);
        if (!summaryResponse.ok) {
          throw new Error("Failed to fetch summary data");
        }
        const summaryResult = (await summaryResponse.json()) as {
          data: SummaryData;
        };
        setSummaryData(summaryResult.data);

        const propertyWiseResponse = await fetch(
          `${workerUrl}/api/report/property-wise`
        );
        if (!propertyWiseResponse.ok) {
          throw new Error("Failed to fetch property-wise data");
        }
        const propertyWiseResult = (await propertyWiseResponse.json()) as {
          data: PropertyWiseData[];
        };
        setPropertyWiseData(propertyWiseResult.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading reports...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!summaryData || !propertyWiseData) return <div>No data available.</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-prussian_blue-500">Reports</h1>
          <p className="text-muted-foreground mt-2">
            Analyze rent collection, payments, and property performance
          </p>
        </div>
        <Button className="bg-prussian_blue-500 hover:bg-prussian_blue-600">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-prussian_blue-500 mb-2 block">
                Date Range
              </label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-prussian_blue-500 mb-2 block">
                Report Type
              </label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="property-wise">
                    Property-wise Report
                  </SelectItem>
                  <SelectItem value="tenant-wise">
                    Tenant-wise Report
                  </SelectItem>
                  <SelectItem value="payment-methods">
                    Payment Methods Report
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full bg-air_superiority_blue-500 hover:bg-air_superiority_blue-600">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Rent Collected
                </p>
                <p className="text-2xl font-bold text-prussian_blue-500">
                  ₹{summaryData.rentCollected.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">
                +8.2% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Collection Rate</p>
                <p className="text-2xl font-bold text-prussian_blue-500">
                  {summaryData.occupancyRate}%
                </p>
              </div>
              <div className="p-2 bg-air_superiority_blue-100 rounded-lg">
                <TrendingUp className="h-8 w-8 text-air_superiority_blue-500" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingDown className="h-4 w-4 text-fire_brick-500 mr-1" />
              <span className="text-sm text-fire_brick-500">
                -1.1% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Active Properties
                </p>
                <p className="text-2xl font-bold text-prussian_blue-500">
                  {summaryData.totalUnits}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Bills</p>
                <p className="text-2xl font-bold text-fire_brick-500">
                  {summaryData.pendingPayments}
                </p>
              </div>
              <div className="p-2 bg-fire_brick-100 rounded-lg">
                <Receipt className="h-8 w-8 text-fire_brick-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-prussian_blue-500">
            Monthly Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Monthly data is not directly from API yet, keeping mock. Remove this block to avoid TS errors. */}
          </div>
        </CardContent>
      </Card>

      {/* Property-wise Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-prussian_blue-500">
            Property-wise Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {propertyWiseData.map((property, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-prussian_blue-500">
                    {property.property}
                  </h3>
                  <Badge
                    variant="outline"
                    className="text-air_superiority_blue-500"
                  >
                    {property.tenants} tenants
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Collected:
                    </span>
                    <span className="font-medium text-green-600">
                      ₹{property.collected.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Pending:
                    </span>
                    <span className="font-medium text-fire_brick-500">
                      ₹{property.pending.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(property.collected / (property.collected + property.pending)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReportsPage;
