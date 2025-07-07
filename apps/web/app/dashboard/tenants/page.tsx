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
  Phone,
  MapPin,
  Building,
  AlertCircle,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

function TenantsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data
  const tenants = [
    {
      id: 1,
      name: "John Smith",
      phone: "+91 9876543210",
      property: "Sunset Apartments",
      unit: "A-101",
      rentAmount: 12000,
      classification: "Residential",
      communicationMethod: "WhatsApp",
      status: "Active",
      lastPayment: "2025-01-01",
      outstanding: 0,
    },
    {
      id: 2,
      name: "Sarah Johnson",
      phone: "+91 9876543211",
      property: "Oak Street Building",
      unit: "B-205",
      rentAmount: 15000,
      classification: "Commercial",
      communicationMethod: "SMS",
      status: "Active",
      lastPayment: "2024-12-15",
      outstanding: 15000,
    },
    {
      id: 3,
      name: "Mike Wilson",
      phone: "+91 9876543212",
      property: "Downtown Plaza",
      unit: "C-302",
      rentAmount: 18000,
      classification: "Residential",
      communicationMethod: "WhatsApp",
      status: "Active",
      lastPayment: "2025-01-03",
      outstanding: 0,
    },
  ];

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.phone.includes(searchTerm) ||
      tenant.property.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-prussian_blue-500">Tenants</h1>
          <p className="text-muted-foreground mt-2">
            Manage your tenants and their information
          </p>
        </div>
        <Button className="bg-prussian_blue-500 hover:bg-prussian_blue-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Tenant
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search tenants by name, phone, or property..."
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

      {/* Tenants Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg text-prussian_blue-500">
                  {tenant.name}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge
                    variant={
                      tenant.status === "Active" ? "default" : "secondary"
                    }
                    className="bg-green-100 text-green-800"
                  >
                    {tenant.status}
                  </Badge>
                  {tenant.outstanding > 0 && (
                    <Badge className="bg-fire_brick-500 text-white">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-air_superiority_blue-500" />
                  <span className="text-prussian_blue-500">{tenant.phone}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-air_superiority_blue-500" />
                  <span className="text-prussian_blue-500">
                    {tenant.property}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-air_superiority_blue-500" />
                  <span className="text-muted-foreground">Unit:</span>
                  <span className="text-prussian_blue-500">{tenant.unit}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Monthly Rent
                  </div>
                  <div className="text-lg font-bold text-prussian_blue-500">
                    ₹{tenant.rentAmount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Outstanding
                  </div>
                  <div
                    className={`text-lg font-bold ${tenant.outstanding > 0 ? "text-fire_brick-500" : "text-green-600"}`}
                  >
                    ₹{tenant.outstanding.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline" className="text-xs">
                    {tenant.classification}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Communication:</span>
                  <span className="text-prussian_blue-500">
                    {tenant.communicationMethod}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Payment:</span>
                  <span className="text-prussian_blue-500">
                    {tenant.lastPayment}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-air_superiority_blue-500 border-air_superiority_blue-500"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-fire_brick-500 border-fire_brick-500 hover:bg-fire_brick-500 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-prussian_blue-500">
              No tenants found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default TenantsPage;
