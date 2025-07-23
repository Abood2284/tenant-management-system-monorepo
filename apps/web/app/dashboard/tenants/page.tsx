// apps/web/app/dashboard/tenants/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Edit, Trash2, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/pagination";
import { AddTenantModal } from "./components/AddTenantModal";
import { EditTenantModal } from "./components/EditTenantModal";
import { TenantsSkeleton } from "@/components/shared/tenants-skeleton";

// Types
interface Tenant {
  TENANT_ID: string;
  TENANT_NAME: string | null;
  PROPERTY_ID: string | null;
  PROPERTY_NUMBER: string | null;
  IS_ACTIVE: boolean | null;
  BUILDING_FOOR?: string | null;
  TENANT_MOBILE_NUMBER?: string | null;
  TENANCY_DATE?: string | null;
  TENANCY_END_DATE?: string | null;
}

interface Property {
  PROPERTY_ID: string;
  PROPERTY_NAME: string;
}

function TenantsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [currentTenants, setCurrentTenants] = useState(false);
  const [hasContact, setHasContact] = useState(false);
  const [expiringSoon, setExpiringSoon] = useState(false);
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const pageSize = 15;

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch tenants from backend with all filters
  const fetchTenants = useCallback(
    async (pageNum: number) => {
      try {
        const workerUrl =
          process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";
        setLoading(true);
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: pageSize.toString(),
        });
        if (statusFilter !== "all") params.append("status", statusFilter);
        if (propertyFilter !== "all")
          params.append("propertyId", propertyFilter);
        if (debouncedSearch) params.append("search", debouncedSearch);
        if (currentTenants) params.append("current", "true");
        if (hasContact) params.append("hasContact", "true");
        if (expiringSoon) params.append("expiringSoon", "true");
        const res = await fetch(`${workerUrl}/api/tenant/list?${params}`);
        if (!res.ok) throw new Error("Failed to fetch tenants");
        const { data, total: totalCount } = (await res.json()) as {
          data: Tenant[];
          total?: number;
        };
        setTenants(data);
        if (typeof totalCount === "number") setTotal(totalCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [
      statusFilter,
      propertyFilter,
      debouncedSearch,
      currentTenants,
      hasContact,
      expiringSoon,
      pageSize,
    ]
  );

  // Fetch properties on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const workerUrl =
          process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";
        const propRes = await fetch(`${workerUrl}/api/property/list`);
        if (!propRes.ok) throw new Error("Failed to fetch properties");
        const propJson = (await propRes.json()) as { data: Property[] };
        const propMap = (propJson.data || []).reduce(
          (acc, prop) => {
            acc[prop.PROPERTY_ID] = prop.PROPERTY_NAME;
            return acc;
          },
          {} as Record<string, string>
        );
        setProperties(propMap);
        await fetchTenants(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [fetchTenants]);

  // Refetch tenants when page, filters, or debounced search change
  useEffect(() => {
    fetchTenants(page);
  }, [
    page,
    statusFilter,
    propertyFilter,
    debouncedSearch,
    currentTenants,
    hasContact,
    expiringSoon,
    fetchTenants,
  ]);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setPage(1);
  }, [
    statusFilter,
    propertyFilter,
    debouncedSearch,
    currentTenants,
    hasContact,
    expiringSoon,
  ]);

  if (loading && tenants.length === 0) return <TenantsSkeleton />;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6 h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-prussian-blue-500">Tenants</h1>
          <p className="text-air-superiority-blue-500 mt-2">
            Manage all tenants across your properties.
          </p>
        </div>
        <Button
          onClick={() => setIsAddTenantModalOpen(true)}
          className="bg-prussian-blue-500 hover:bg-prussian-blue-600 text-papaya-whip-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Tenant
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 flex gap-4 items-center flex-wrap">
          <div className="relative max-w-xs w-full">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search tenants by name or unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 items-center ml-auto flex-wrap">
            {/* Property Filter Dropdown */}
            <Select
              value={propertyFilter}
              onValueChange={(value) => setPropertyFilter(value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Properties">
                  {propertyFilter === "all"
                    ? "All Properties"
                    : properties[propertyFilter] || "Unknown"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {Object.entries(properties).map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant={statusFilter === "active" ? "default" : "outline"}
              className={`rounded-md shadow-sm font-medium transition-colors ${statusFilter === "active" ? "bg-prussian-blue-500 text-white hover:bg-prussian-blue-600" : "border-prussian-blue-200 text-prussian-blue-700 hover:bg-prussian-blue-50"}`}
              onClick={() =>
                setStatusFilter(statusFilter === "active" ? "all" : "active")
              }
              aria-pressed={statusFilter === "active"}
            >
              Active
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "inactive" ? "default" : "outline"}
              className={`rounded-md shadow-sm font-medium transition-colors ${statusFilter === "inactive" ? "bg-prussian-blue-500 text-white hover:bg-prussian-blue-600" : "border-prussian-blue-200 text-prussian-blue-700 hover:bg-prussian-blue-50"}`}
              onClick={() =>
                setStatusFilter(
                  statusFilter === "inactive" ? "all" : "inactive"
                )
              }
              aria-pressed={statusFilter === "inactive"}
            >
              Inactive
            </Button>
            <Button
              size="sm"
              variant={currentTenants ? "default" : "outline"}
              className={`rounded-md shadow-sm font-medium transition-colors ${currentTenants ? "bg-prussian-blue-500 text-white hover:bg-prussian-blue-600" : "border-prussian-blue-200 text-prussian-blue-700 hover:bg-prussian-blue-50"}`}
              onClick={() => setCurrentTenants((v) => !v)}
              aria-pressed={currentTenants}
            >
              Current Tenants
            </Button>
            <Button
              size="sm"
              variant={hasContact ? "default" : "outline"}
              className={`rounded-md shadow-sm font-medium transition-colors ${hasContact ? "bg-prussian-blue-500 text-white hover:bg-prussian-blue-600" : "border-prussian-blue-200 text-prussian-blue-700 hover:bg-prussian-blue-50"}`}
              onClick={() => setHasContact((v) => !v)}
              aria-pressed={hasContact}
            >
              Has Contact
            </Button>
            <Button
              size="sm"
              variant={expiringSoon ? "default" : "outline"}
              className={`rounded-md shadow-sm font-medium transition-colors ${expiringSoon ? "bg-prussian-blue-500 text-white hover:bg-prussian-blue-600" : "border-prussian-blue-200 text-prussian-blue-700 hover:bg-prussian-blue-50"}`}
              onClick={() => setExpiringSoon((v) => !v)}
              aria-pressed={expiringSoon}
            >
              Expiring Soon
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-md font-medium text-prussian-blue-500 hover:bg-prussian-blue-50"
              onClick={() => {
                setStatusFilter("all");
                setCurrentTenants(false);
                setHasContact(false);
                setExpiringSoon(false);
              }}
            >
              Reset
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 rounded-md shadow-sm font-medium border-prussian-blue-200 text-prussian-blue-700 hover:bg-prussian-blue-50"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuCheckboxItem
                  checked={statusFilter === "all"}
                  onCheckedChange={() => setStatusFilter("all")}
                >
                  All Statuses
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilter === "active"}
                  onCheckedChange={() => setStatusFilter("active")}
                >
                  Active
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilter === "inactive"}
                  onCheckedChange={() => setStatusFilter("inactive")}
                >
                  Inactive
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex justify-end items-center mb-2">
        <span className="text-sm text-prussian-blue-500 font-medium bg-prussian-blue-50 rounded px-3 py-1 shadow-sm">
          {`Results: ${tenants.length} of ${total} results`}
        </span>
      </div>

      {/* Tenants Table */}
      <Card
        className={`flex flex-col h-[600px] transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}
      >
        <CardContent className="flex-1 overflow-y-auto p-0 px-6">
          {" "}
          {/* Added px-6 for horizontal padding */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Tenancy Start</TableHead>
                <TableHead>Tenancy End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.TENANT_ID}>
                  <TableCell className="font-medium text-prussian_blue-500">
                    {tenant.TENANT_NAME}
                  </TableCell>
                  <TableCell>{tenant.PROPERTY_NUMBER}</TableCell>
                  <TableCell>{tenant.BUILDING_FOOR || "-"}</TableCell>
                  <TableCell>{tenant.TENANT_MOBILE_NUMBER || "-"}</TableCell>
                  <TableCell>
                    {tenant.TENANCY_DATE
                      ? new Date(tenant.TENANCY_DATE).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {tenant.TENANCY_END_DATE
                      ? new Date(tenant.TENANCY_END_DATE).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={tenant.IS_ACTIVE ? "default" : "secondary"}
                      className={
                        tenant.IS_ACTIVE
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {tenant.IS_ACTIVE ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTenant(tenant)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <div className="p-4 border-t">
          <TablePagination
            className=""
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </Card>

      {/* Add Tenant Modal */}
      <AddTenantModal
        isOpen={isAddTenantModalOpen}
        onClose={() => setIsAddTenantModalOpen(false)}
        onSuccess={() => {
          setIsAddTenantModalOpen(false);
          // Refresh the data
          fetchTenants(page);
        }}
      />
      {/* Edit Tenant Modal */}
      <EditTenantModal
        isOpen={!!editingTenant}
        tenant={editingTenant}
        onClose={() => setEditingTenant(null)}
        onSuccess={() => {
          setEditingTenant(null);
          fetchTenants(page);
        }}
      />
    </div>
  );
}

export default TenantsPage;
