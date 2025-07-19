"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building,
  ChevronDown,
  ChevronRight,
  Edit,
  MapPin,
  Settings,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Types
interface Property {
  PROPERTY_ID: string;
  PROPERTY_NAME: string;
  LANDLORD_NAME: string;
  ADDRESS: string;
  NUMBER_OF_BLOCKS: number;
}

interface Tenant {
  TENANT_ID: string;
  TENANT_NAME: string | null;
  PROPERTY_NUMBER: string | null;
  IS_ACTIVE: boolean | null;
  FLOOR_SORT_VALUE: number | null;
}

interface Unit {
  unitNumber: string;
  tenant: string | null;
  rent: number;
  status: "Occupied" | "Vacant";
  floor: number;
  tenantId: string;
}

// Type guards
const isPropertyArray = (data: unknown): data is Property[] =>
  Array.isArray(data) &&
  data.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "PROPERTY_ID" in item &&
      "PROPERTY_NAME" in item
  );

const isTenantArray = (data: unknown): data is Tenant[] =>
  Array.isArray(data) &&
  data.every(
    (item) =>
      typeof item === "object" && item !== null && "TENANT_ID" in item
  );

interface ApiResponse<T> {
  status: number;
  data: T;
}

function PropertiesPage() {
  const [property, setProperty] = useState<Property | null>(null);
  const [unitDetails, setUnitDetails] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFloors, setOpenFloors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const propResponse = await fetch(
          "http://localhost:8787/api/property/list"
        );
        if (!propResponse.ok) throw new Error("Failed to fetch properties");
        const propResult: ApiResponse<unknown> = await propResponse.json();

        if (!isPropertyArray(propResult.data) || propResult.data.length === 0) {
          throw new Error("No properties found.");
        }
        const currentProperty = propResult.data[0];
        setProperty(currentProperty);

        const tenantResponse = await fetch(
          `http://localhost:8787/api/tenant/list?propertyId=${currentProperty.PROPERTY_ID}`
        );
        if (!tenantResponse.ok) throw new Error("Failed to fetch tenants");
        const tenantResult: ApiResponse<unknown> = await tenantResponse.json();

        if (!isTenantArray(tenantResult.data)) {
          throw new Error("No tenants found.");
        }

        const activeTenants = tenantResult.data.filter((t) => t.IS_ACTIVE);
        const units: Unit[] = activeTenants.map((tenant) => ({
          unitNumber: tenant.PROPERTY_NUMBER || "N/A",
          tenant: tenant.TENANT_NAME,
          rent: 12000, // Mock rent
          status: "Occupied",
          floor: tenant.FLOOR_SORT_VALUE || 0,
          tenantId: tenant.TENANT_ID,
        }));
        setUnitDetails(units);

        const floors = [...new Set(units.map((u) => u.floor))];
        setOpenFloors(
          floors.reduce((acc, floor) => ({ ...acc, [floor]: true }), {})
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const groupedUnits = unitDetails.reduce<Record<number, Unit[]>>((acc, unit) => {
    (acc[unit.floor] = acc[unit.floor] || []).push(unit);
    return acc;
  }, {});

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!property) return <div>No property data available.</div>;

  const totalUnits = property.NUMBER_OF_BLOCKS;
  const occupiedUnits = unitDetails.length;
  const vacantUnits = totalUnits - occupiedUnits;

  const handleToggleFloor = (floor: number) => {
    setOpenFloors((prev) => ({ ...prev, [floor]: !prev[floor] }));
  };

  return (
    <div className="space-y-6 min-h-screen pb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-prussian-blue-500">
            Property Management
          </h1>
          <p className="text-air-superiority-blue-500 mt-2">
            Manage your property details and unit information
          </p>
        </div>
        <Button className="bg-prussian-blue-500 hover:bg-prussian-blue-600 text-papaya-whip-500">
          <Settings className="h-4 w-4 mr-2" />
          Property Settings
        </Button>
      </div>

      {/* Property Overview */}
      <Card className="border-l-4 border-l-prussian-blue-500 bg-papaya-whip-700">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl text-prussian-blue-500 flex items-center gap-2">
              <Building className="h-6 w-6 text-prussian-blue-500" />
              {property.PROPERTY_NAME}
            </CardTitle>
            <Badge
              variant="default"
              className="bg-fire-brick-100 text-fire-brick-500 border border-fire-brick-200"
            >
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-air-superiority-blue-500" />
                <span className="text-air-superiority-blue-500">Owner:</span>
                <span className="font-medium text-prussian-blue-500">
                  {property.LANDLORD_NAME}
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-air-superiority-blue-500 mt-0.5" />
                <span className="text-air-superiority-blue-500">Address:</span>
                <span className="text-prussian-blue-500">
                  {property.ADDRESS}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-papaya-whip-300 rounded-lg border border-papaya-whip-400">
                  <div className="text-2xl font-bold text-prussian-blue-500">
                    {totalUnits}
                  </div>
                  <div className="text-xs text-air-superiority-blue-500">
                    Total Units
                  </div>
                </div>
                <div className="text-center p-3 bg-air-superiority-blue-100 rounded-lg border border-air-superiority-blue-200">
                  <div className="text-2xl font-bold text-air-superiority-blue-500">
                    {occupiedUnits}
                  </div>
                  <div className="text-xs text-air-superiority-blue-500">
                    Occupied
                  </div>
                </div>
                <div className="text-center p-3 bg-fire-brick-100 rounded-lg border border-fire-brick-200">
                  <div className="text-2xl font-bold text-fire-brick-500">
                    {vacantUnits}
                  </div>
                  <div className="text-xs text-fire-brick-500">Vacant</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4 border-t border-prussian-blue-100">
            <Button
              variant="outline"
              className="text-air-superiority-blue-500 border-air-superiority-blue-500 hover:bg-air-superiority-blue-500 hover:text-papaya-whip-500"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Property Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Unit Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-prussian-blue-500">
            Unit Management
          </h2>
          <div className="text-sm text-air-superiority-blue-500">
            {occupiedUnits} of {totalUnits} units occupied
          </div>
        </div>
        {Object.entries(groupedUnits).map(([floor, units]) => (
          <div
            key={floor}
            className="bg-papaya-whip-700 rounded-xl border border-prussian-blue-100 overflow-hidden"
          >
            <button
              type="button"
              className="w-full bg-papaya-whip-300 px-6 py-4 border-b border-prussian-blue-100 flex items-center justify-between focus:outline-none hover:bg-papaya-whip-400 transition"
              onClick={() => handleToggleFloor(Number(floor))}
              aria-expanded={openFloors[Number(floor)]}
            >
              <span className="text-lg font-semibold text-prussian-blue-500 flex items-center gap-2">
                {openFloors[Number(floor)] ? (
                  <ChevronDown className="h-5 w-5 text-air-superiority-blue-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-air-superiority-blue-500" />
                )}
                Floor {floor}
              </span>
            </button>
            {openFloors[Number(floor)] && (
              <div className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Monthly Rent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((unit) => (
                      <TableRow key={unit.tenantId}>
                        <TableCell className="font-medium">
                          {unit.unitNumber}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              unit.status === "Occupied"
                                ? "default"
                                : "secondary"
                            }
                            className={`border ${
                              unit.status === "Occupied"
                                ? "bg-air-superiority-blue-200 text-prussian-blue-500 border-air-superiority-blue-300"
                                : "bg-fire-brick-200 text-fire-brick-500 border-fire-brick-300"
                            }`}
                          >
                            {unit.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{unit.tenant || "-"}</TableCell>
                        <TableCell>₹{unit.rent.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`border font-medium ${
                              unit.status === "Occupied"
                                ? "text-air-superiority-blue-500 border-air-superiority-blue-500 hover:bg-air-superiority-blue-500 hover:text-papaya-whip-500"
                                : "text-fire-brick-500 border-fire-brick-500 hover:bg-fire-brick-500 hover:text-papaya-whip-500"
                            }`}
                          >
                            {unit.status === "Occupied"
                              ? "Manage Tenant"
                              : "Find Tenant"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PropertiesPage;
