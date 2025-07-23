// apps/web/app/dashboard/tenants/components/AddTenantModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  X,
  Check,
  AlertTriangle,
  User,
  Building,
  CreditCard,
} from "lucide-react";
import { toLocalISOString } from "@/lib/utils";

interface Property {
  PROPERTY_ID: string;
  PROPERTY_NAME: string;
  ADDRESS: string;
  NUMBER_OF_BLOCKS: number;
}

interface TenantFormData {
  TENANT_NAME: string;
  PROPERTY_ID: string;
  PROPERTY_NUMBER: string;
  BUILDING_FOOR: string;
  PROPERTY_TYPE: string;
  TENANT_MOBILE_NUMBER: string;
  TENANCY_DATE: Date | undefined;
  TENANCY_END_DATE: Date | undefined;
  SALUTATION: string;
  NOTES: string;
  IS_ACTIVE: boolean;
  // Rent factors
  BASIC_RENT: number | null;
  PROPERTY_TAX: number | null;
  REPAIR_CESS: number | null;
  MISC: number | null;
}

interface AddTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "basic" | "property" | "rent" | "review";

export function AddTenantModal({
  isOpen,
  onClose,
  onSuccess,
}: AddTenantModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>("basic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);

  // Form data
  const [formData, setFormData] = useState<TenantFormData>({
    TENANT_NAME: "",
    PROPERTY_ID: "",
    PROPERTY_NUMBER: "",
    BUILDING_FOOR: "",
    PROPERTY_TYPE: "",
    TENANT_MOBILE_NUMBER: "",
    TENANCY_DATE: undefined,
    TENANCY_END_DATE: undefined,
    SALUTATION: "",
    NOTES: "",
    IS_ACTIVE: true,
    BASIC_RENT: null,
    PROPERTY_TAX: null,
    REPAIR_CESS: null,
    MISC: null,
  });

  // Load properties on mount
  useEffect(() => {
    if (isOpen) {
      loadProperties();
    }
  }, [isOpen]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      const workerUrl =
        process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";
      const response = await fetch(`${workerUrl}/api/property/list`);

      if (!response.ok) {
        throw new Error(`Worker responded with status: ${response.status}`);
      }

      const workerResult = (await response.json()) as {
        status: number;
        data: Property[];
        message?: string;
      };

      if (workerResult.status !== 200) {
        throw new Error(workerResult.message || "Failed to load properties");
      }

      setProperties(workerResult.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load properties"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === "basic" && validateBasicStep()) {
      setCurrentStep("property");
    } else if (currentStep === "property" && validatePropertyStep()) {
      setCurrentStep("rent");
    } else if (currentStep === "rent" && validateRentStep()) {
      setCurrentStep("review");
    }
  };

  const handleBack = () => {
    if (currentStep === "property") {
      setCurrentStep("basic");
    } else if (currentStep === "rent") {
      setCurrentStep("property");
    } else if (currentStep === "review") {
      setCurrentStep("rent");
    }
  };

  const validateBasicStep = () => {
    return !!(
      formData.TENANT_NAME.trim() &&
      formData.SALUTATION &&
      formData.TENANT_MOBILE_NUMBER.trim()
    );
  };

  const validatePropertyStep = () => {
    return !!(
      formData.PROPERTY_ID &&
      formData.PROPERTY_NUMBER.trim() &&
      formData.PROPERTY_TYPE &&
      formData.TENANCY_DATE
    );
  };

  const validateRentStep = () => {
    return formData.BASIC_RENT !== null && formData.BASIC_RENT > 0;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const workerUrl =
        process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";
      const response = await fetch(`${workerUrl}/api/tenant/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant: {
            TENANT_NAME: formData.TENANT_NAME,
            PROPERTY_ID: formData.PROPERTY_ID,
            PROPERTY_NUMBER: formData.PROPERTY_NUMBER,
            BUILDING_FOOR: formData.BUILDING_FOOR,
            PROPERTY_TYPE: formData.PROPERTY_TYPE,
            TENANT_MOBILE_NUMBER: formData.TENANT_MOBILE_NUMBER,
            TENANCY_DATE: formData.TENANCY_DATE
              ? toLocalISOString(formData.TENANCY_DATE)
              : undefined,
            TENANCY_END_DATE: formData.TENANCY_END_DATE
              ? toLocalISOString(formData.TENANCY_END_DATE)
              : undefined,
            SALUTATION: formData.SALUTATION,
            NOTES: formData.NOTES,
            IS_ACTIVE: formData.IS_ACTIVE,
          },
          rentFactors: {
            BASIC_RENT: formData.BASIC_RENT,
            PROPERTY_TAX: formData.PROPERTY_TAX,
            REPAIR_CESS: formData.REPAIR_CESS,
            MISC: formData.MISC,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Worker responded with status: ${response.status}`);
      }

      const result = (await response.json()) as {
        status: number;
        message?: string;
      };

      if (result.status !== 200) {
        throw new Error(result.message || "Failed to add tenant");
      }

      onSuccess();
      resetForm();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add tenant");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      TENANT_NAME: "",
      PROPERTY_ID: "",
      PROPERTY_NUMBER: "",
      BUILDING_FOOR: "",
      PROPERTY_TYPE: "",
      TENANT_MOBILE_NUMBER: "",
      TENANCY_DATE: undefined,
      TENANCY_END_DATE: undefined,
      SALUTATION: "",
      NOTES: "",
      IS_ACTIVE: true,
      BASIC_RENT: null,
      PROPERTY_TAX: null,
      REPAIR_CESS: null,
      MISC: null,
    });
    setCurrentStep("basic");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getTotalRent = () => {
    return (
      (formData.BASIC_RENT ?? 0) +
      (formData.PROPERTY_TAX ?? 0) +
      (formData.REPAIR_CESS ?? 0) +
      (formData.MISC ?? 0)
    );
  };

  const getSelectedProperty = () => {
    return properties.find((p) => p.PROPERTY_ID === formData.PROPERTY_ID);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-prussian-blue-500">
                Add New Tenant
              </h2>
              <p className="text-air-superiority-blue-500 mt-1">
                Step{" "}
                {currentStep === "basic"
                  ? 1
                  : currentStep === "property"
                    ? 2
                    : currentStep === "rent"
                      ? 3
                      : 4}{" "}
                of 4
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mt-6 space-x-2">
            {["basic", "property", "rent", "review"].map((step, index) => (
              <React.Fragment key={step}>
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    currentStep === step
                      ? "bg-prussian-blue-500 text-white"
                      : index <
                          ["basic", "property", "rent", "review"].indexOf(
                            currentStep
                          )
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index <
                  ["basic", "property", "rent", "review"].indexOf(
                    currentStep
                  ) ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && (
                  <div
                    className={`flex-1 h-1 rounded ${
                      index <
                      ["basic", "property", "rent", "review"].indexOf(
                        currentStep
                      )
                        ? "bg-green-500"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Step 1: Basic Information */}
          {currentStep === "basic" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="salutation">Salutation</Label>
                  <Select
                    value={formData.SALUTATION}
                    onValueChange={(value) =>
                      setFormData({ ...formData, SALUTATION: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select salutation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr.">Mr.</SelectItem>
                      <SelectItem value="Mrs.">Mrs.</SelectItem>
                      <SelectItem value="Ms.">Ms.</SelectItem>
                      <SelectItem value="Dr.">Dr.</SelectItem>
                      <SelectItem value="Prof.">Prof.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenantName">Tenant Name *</Label>
                  <Input
                    id="tenantName"
                    value={formData.TENANT_NAME}
                    onChange={(e) =>
                      setFormData({ ...formData, TENANT_NAME: e.target.value })
                    }
                    placeholder="Enter tenant name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Mobile Number *</Label>
                  <Input
                    id="mobileNumber"
                    value={formData.TENANT_MOBILE_NUMBER}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        TENANT_MOBILE_NUMBER: e.target.value,
                      })
                    }
                    placeholder="Enter mobile number"
                    type="tel"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive">Status</Label>
                  <Select
                    value={formData.IS_ACTIVE ? "active" : "inactive"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        IS_ACTIVE: value === "active",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.NOTES}
                  onChange={(e) =>
                    setFormData({ ...formData, NOTES: e.target.value })
                  }
                  placeholder="Additional notes about the tenant"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 2: Property Assignment */}
          {currentStep === "property" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="property">Property *</Label>
                  <Select
                    value={formData.PROPERTY_ID}
                    onValueChange={(value) =>
                      setFormData({ ...formData, PROPERTY_ID: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem
                          key={property.PROPERTY_ID}
                          value={property.PROPERTY_ID}
                        >
                          {property.PROPERTY_NAME}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyNumber">Unit/Property Number *</Label>
                  <Input
                    id="propertyNumber"
                    value={formData.PROPERTY_NUMBER}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        PROPERTY_NUMBER: e.target.value,
                      })
                    }
                    placeholder="Enter unit number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buildingFloor">Floor</Label>
                  <Input
                    id="buildingFloor"
                    value={formData.BUILDING_FOOR}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        BUILDING_FOOR: e.target.value,
                      })
                    }
                    placeholder="Enter floor number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select
                    value={formData.PROPERTY_TYPE}
                    onValueChange={(value) =>
                      setFormData({ ...formData, PROPERTY_TYPE: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Apartment">Apartment</SelectItem>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Shop">Shop</SelectItem>
                      <SelectItem value="Warehouse">Warehouse</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenancyDate">Tenancy Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.TENANCY_DATE ? (
                          format(formData.TENANCY_DATE, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.TENANCY_DATE}
                        onSelect={(date) =>
                          setFormData({ ...formData, TENANCY_DATE: date })
                        }
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenancyEndDate">Tenancy End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.TENANCY_END_DATE ? (
                          format(formData.TENANCY_END_DATE, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.TENANCY_END_DATE}
                        onSelect={(date) =>
                          setFormData({ ...formData, TENANCY_END_DATE: date })
                        }
                        disabled={(date) =>
                          date <= (formData.TENANCY_DATE || new Date())
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {getSelectedProperty() && (
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm text-prussian-blue-600 mb-2">
                      Selected Property Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <span className="ml-2 font-medium">
                          {getSelectedProperty()?.PROPERTY_NAME}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Address:</span>
                        <span className="ml-2 font-medium">
                          {getSelectedProperty()?.ADDRESS}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Blocks:</span>
                        <span className="ml-2 font-medium">
                          {getSelectedProperty()?.NUMBER_OF_BLOCKS}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: Rent Factors */}
          {currentStep === "rent" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="basicRent">Basic Rent *</Label>
                  <Input
                    id="basicRent"
                    type="number"
                    value={formData.BASIC_RENT ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        BASIC_RENT:
                          e.target.value === ""
                            ? null
                            : parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="propertyTax">Property Tax</Label>
                  <Input
                    id="propertyTax"
                    type="number"
                    value={formData.PROPERTY_TAX ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        PROPERTY_TAX:
                          e.target.value === ""
                            ? null
                            : parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repairCess">Repair Cess</Label>
                  <Input
                    id="repairCess"
                    type="number"
                    value={formData.REPAIR_CESS ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        REPAIR_CESS:
                          e.target.value === ""
                            ? null
                            : parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="misc">Miscellaneous</Label>
                  <Input
                    id="misc"
                    type="number"
                    value={formData.MISC ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        MISC:
                          e.target.value === ""
                            ? null
                            : parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="placeholder:text-gray-400"
                  />
                </div>
              </div>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm text-green-700 mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Total Monthly Rent
                  </h4>
                  <div className="text-2xl font-bold text-green-700">
                    ₹{getTotalRent().toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    Basic Rent: ₹{(formData.BASIC_RENT ?? 0).toLocaleString()} |
                    Tax: ₹{(formData.PROPERTY_TAX ?? 0).toLocaleString()} |
                    Cess: ₹{(formData.REPAIR_CESS ?? 0).toLocaleString()} |
                    Misc: ₹{(formData.MISC ?? 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === "review" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Tenant Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">
                        {formData.SALUTATION} {formData.TENANT_NAME}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mobile:</span>
                      <span className="font-medium">
                        {formData.TENANT_MOBILE_NUMBER}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge
                        variant={formData.IS_ACTIVE ? "default" : "secondary"}
                      >
                        {formData.IS_ACTIVE ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {formData.NOTES && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Notes:</span>
                        <span className="text-right">{formData.NOTES}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Property Assignment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Property:</span>
                      <span className="font-medium">
                        {getSelectedProperty()?.PROPERTY_NAME}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unit:</span>
                      <span className="font-medium">
                        {formData.PROPERTY_NUMBER}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Floor:</span>
                      <span className="font-medium">
                        {formData.BUILDING_FOOR || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">
                        {formData.PROPERTY_TYPE}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span className="font-medium">
                        {formData.TENANCY_DATE
                          ? format(formData.TENANCY_DATE, "MMM dd, yyyy")
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date:</span>
                      <span className="font-medium">
                        {formData.TENANCY_END_DATE
                          ? format(formData.TENANCY_END_DATE, "MMM dd, yyyy")
                          : "-"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Rent Structure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block">
                        Basic Rent:
                      </span>
                      <span className="block font-medium text-green-600">
                        ₹{(formData.BASIC_RENT ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">
                        Property Tax:
                      </span>
                      <span className="block font-medium text-blue-600">
                        ₹{(formData.PROPERTY_TAX ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">
                        Repair Cess:
                      </span>
                      <span className="block font-medium text-orange-600">
                        ₹{(formData.REPAIR_CESS ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">
                        Miscellaneous:
                      </span>
                      <span className="block font-medium text-purple-600">
                        ₹{(formData.MISC ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">
                        Total Monthly Rent:
                      </span>
                      <span className="text-2xl font-bold text-green-700">
                        ₹{getTotalRent().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={currentStep === "basic" ? handleClose : handleBack}
              disabled={loading}
            >
              {currentStep === "basic" ? "Cancel" : "Back"}
            </Button>

            <div className="flex gap-2">
              {currentStep !== "review" ? (
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  className="bg-prussian-blue-500 hover:bg-prussian-blue-600"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {loading ? "Adding Tenant..." : "Add Tenant"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
