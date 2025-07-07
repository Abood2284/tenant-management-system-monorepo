import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building,
  Users,
  DollarSign,
  AlertTriangle,
  Calendar,
  TrendingUp,
} from "lucide-react";

function DashboardPage() {
  // Mock data - in real app this would come from your backend
  const metrics = {
    totalProperties: 12,
    totalTenants: 45,
    rentCollected: 125000,
    outstandingAmount: 18500,
    thisMonthCollection: 42000,
    pendingPayments: 8,
  };

  const recentPayments = [
    {
      id: 1,
      tenant: "John Smith",
      property: "Sunset Apartments",
      amount: 1200,
      date: "2025-01-05",
      status: "paid",
    },
    {
      id: 2,
      tenant: "Sarah Johnson",
      property: "Oak Street Building",
      amount: 950,
      date: "2025-01-04",
      status: "overdue",
    },
    {
      id: 3,
      tenant: "Mike Wilson",
      property: "Downtown Plaza",
      amount: 1500,
      date: "2025-01-03",
      status: "paid",
    },
  ];

  return (
    <div className="space-y-8 ">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-prussian_blue-500">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here&apos;s an overview of your property management
          system.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-prussian_blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-prussian_blue-500">
              Total Properties
            </CardTitle>
            <Building className="h-4 w-4 text-air_superiority_blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-prussian_blue-500">
              {metrics.totalProperties}
            </div>
            <p className="text-xs text-muted-foreground">Managed properties</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-air_superiority_blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-prussian_blue-500">
              Total Tenants
            </CardTitle>
            <Users className="h-4 w-4 text-air_superiority_blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-prussian_blue-500">
              {metrics.totalTenants}
            </div>
            <p className="text-xs text-muted-foreground">Active tenants</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-prussian_blue-500">
              Rent Collected
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-prussian_blue-500">
              ₹{metrics.rentCollected.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total this year</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-fire_brick-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-prussian_blue-500">
              Outstanding
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-fire_brick-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fire_brick-500">
              ₹{metrics.outstandingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Pending payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-prussian_blue-500 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-air_superiority_blue-500" />
              This Month Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ₹{metrics.thisMonthCollection.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">January 2025</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-prussian_blue-500 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-fire_brick-500" />
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-fire_brick-500">
              {metrics.pendingPayments}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-prussian_blue-500">
            Recent Payment Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-prussian_blue-500">
                    {payment.tenant}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {payment.property}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-prussian_blue-500">
                    ₹{payment.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {payment.date}
                  </div>
                </div>
                <div className="ml-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      payment.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-fire_brick-500"
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;
