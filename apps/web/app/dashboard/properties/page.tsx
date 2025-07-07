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
  MapPin,
  User,
  Calendar,
  Building,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

function PropertiesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data
  const properties = [
    {
      id: 1,
      name: "Sunset Apartments",
      landlord: "John Doe",
      address: "123 Main Street, Downtown",
      billingCycle: "Monthly",
      tenants: 8,
      totalUnits: 10,
      status: "Active",
      penaltyFee: 50,
    },
    {
      id: 2,
      name: "Oak Street Building",
      landlord: "Jane Smith",
      address: "456 Oak Street, Midtown",
      billingCycle: "Monthly",
      tenants: 12,
      totalUnits: 15,
      status: "Active",
      penaltyFee: 75,
    },
    {
      id: 3,
      name: "Downtown Plaza",
      landlord: "Mike Johnson",
      address: "789 Plaza Ave, City Center",
      billingCycle: "Quarterly",
      tenants: 5,
      totalUnits: 6,
      status: "Partial",
      penaltyFee: 100,
    },
  ];

  const filteredProperties = properties.filter(
    (property) =>
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.landlord.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-prussian_blue-500">
            Properties
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your properties and their details
          </p>
        </div>
        <Button className="bg-prussian_blue-500 hover:bg-prussian_blue-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search properties by name, landlord, or address..."
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

      {/* Properties Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg text-prussian_blue-500">
                  {property.name}
                </CardTitle>
                <Badge
                  variant={
                    property.status === "Active" ? "default" : "secondary"
                  }
                  className={
                    property.status === "Active"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {property.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-air_superiority_blue-500" />
                  <span className="text-muted-foreground">Landlord:</span>
                  <span className="font-medium text-prussian_blue-500">
                    {property.landlord}
                  </span>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-air_superiority_blue-500 mt-0.5" />
                  <span className="text-muted-foreground">Address:</span>
                  <span className="text-prussian_blue-500">
                    {property.address}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-air_superiority_blue-500" />
                  <span className="text-muted-foreground">Billing:</span>
                  <span className="text-prussian_blue-500">
                    {property.billingCycle}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-prussian_blue-500">
                    {property.tenants}
                  </div>
                  <div className="text-xs text-muted-foreground">Tenants</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-air_superiority_blue-500">
                    {property.totalUnits}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Units
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground">
                  Penalty Fee:
                  <span className="font-medium text-fire_brick-500 ml-1">
                    ₹{property.penaltyFee}
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

      {filteredProperties.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-prussian_blue-500">
              No properties found
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

export default PropertiesPage;
