// apps/web/app/dashboard/transactions/[tenantID]/components/payment/AddPaymentModal.tsx
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
} from "lucide-react";
import type {
  Tenant,
  TenantPaymentData,
  PaymentEntry,
  PaymentMethod,
} from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toLocalISOString } from "@/lib/utils";

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "tenant" | "payment" | "allocation" | "review";

const WAIVER_NOTE_PREFIX = "Penalty for this Tenant Waived off by";

export function AddPaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: AddPaymentModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>("tenant");
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Tenant Selection
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantSearch, setTenantSearch] = useState("");

  // Step 2: Payment Details
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [receivedAmount, setReceivedAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(1);
  const [notes, setNotes] = useState("");

  // Cheque specific fields
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeDate, setChequeDate] = useState<Date | undefined>();
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");

  // Online specific fields
  const [transactionId, setTransactionId] = useState("");
  const [paymentGateway, setPaymentGateway] = useState("");

  // Step 3: Allocation
  const [tenantPaymentData, setTenantPaymentData] =
    useState<TenantPaymentData | null>(null);
  const [selectedRentMonth, setSelectedRentMonth] = useState<string>("");
  const [selectedPenaltyMonth, setSelectedPenaltyMonth] = useState<string>("");
  const [outstandingAllocated, setOutstandingAllocated] = useState("");
  const [isPenaltyManuallyWaived, setIsPenaltyManuallyWaived] = useState(false);

  // Add state for penaltyAllocatedInput
  const [penaltyAllocatedInput, setPenaltyAllocatedInput] = useState("");

  // Debounced search effect
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        loadTenants();
      }, 300); // 300ms delay

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, tenantSearch]);

  // Load tenant payment data when tenant is selected
  useEffect(() => {
    if (selectedTenant) {
      loadTenantPaymentData(selectedTenant.TENANT_ID);
    }
  }, [selectedTenant]);

  // === NEW EFFECT for handling penalty waiver note ===
  useEffect(() => {
    // This effect runs when the user checks/unchecks the manual waiver box
    const waiverNote = `NOTE: Penalty was waived off by admin123`;
    if (isPenaltyManuallyWaived) {
      if (notes.includes(waiverNote)) return;
      setNotes(notes ? `${notes}\n${waiverNote}` : waiverNote);
    } else {
      // Remove only the waiver note, leave user's note intact
      if (notes.includes(waiverNote)) {
        setNotes(
          notes.replace(`\n${waiverNote}`, "").replace(waiverNote, "").trim()
        );
      }
    }
  }, [isPenaltyManuallyWaived]);

  // Log allMonths when allocation step is active and data is available
  useEffect(() => {
    if (
      currentStep === "allocation" &&
      tenantPaymentData &&
      tenantPaymentData.allMonths
    ) {
      console.log("DEBUG allMonths:", tenantPaymentData.allMonths);
    }
  }, [currentStep, tenantPaymentData?.allMonths]);

  const loadTenants = async () => {
    try {
      setSearchLoading(true);
      setError(null);

      const workerUrl =
        process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";
      const response = await fetch(
        `${workerUrl}/api/tenant/list?search=${encodeURIComponent(
          tenantSearch
        )}`
      );

      if (!response.ok) {
        throw new Error(`Worker responded with status: ${response.status}`);
      }

      const workerResult = (await response.json()) as {
        status: number;
        data: Tenant[];
        message?: string;
      };

      if (workerResult.status !== 200) {
        throw new Error(workerResult.message || "Failed to fetch tenants");
      }

      setTenants(workerResult.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tenants");
    } finally {
      setSearchLoading(false);
    }
  };

  const loadTenantPaymentData = async (tenantId: string) => {
    try {
      setLoading(true);
      setError(null);

      const workerUrl =
        process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";
      const response = await fetch(
        `${workerUrl}/api/tenant/detail/${tenantId}`
      );

      if (!response.ok) {
        throw new Error(`Worker responded with status: ${response.status}`);
      }

      const workerResult = (await response.json()) as {
        status: number;
        data: TenantPaymentData;
        message?: string;
      };

      if (workerResult.status !== 200) {
        throw new Error(workerResult.message || "Failed to fetch tenant data");
      }

      setTenantPaymentData(workerResult.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch tenant data"
      );
    } finally {
      setLoading(false);
    }
  };

  // === REFACTORED ALLOCATION VALUES - Calculated dynamically ===
  const receivedAmountNum = parseInt(receivedAmount) || 0;

  const selectedMonthData =
    selectedRentMonth && tenantPaymentData?.allMonths
      ? tenantPaymentData.allMonths.find(
          (m) => m.RENT_MONTH === selectedRentMonth
        )
      : null;

  const rentAllocated = selectedMonthData?.RENT_PENDING || 0;

  const isPenaltyApplicable =
    selectedMonthData &&
    selectedMonthData.PENALTY_PENDING > 0 &&
    isPenaltyShouldApply(selectedMonthData, paymentDate);

  const penaltyDue =
    isPenaltyApplicable && !isPenaltyManuallyWaived
      ? selectedMonthData.PENALTY_PENDING || 0
      : 0;

  const unallocatedAfterRent = Math.max(0, receivedAmountNum - rentAllocated);

  const getUnallocatedAmount = () => {
    let rentAllocated = 0;
    let penaltyAllocated = 0;
    if (tenantPaymentData) {
      if (selectedRentMonth && selectedRentMonth !== "none") {
        rentAllocated = tenantPaymentData.allMonths
          ? tenantPaymentData.allMonths.find(
              (m) => m.RENT_MONTH === selectedRentMonth
            )?.RENT_PENDING || 0
          : tenantPaymentData.unpaidMonths.find(
              (m) => m.RENT_MONTH === selectedRentMonth
            )?.RENT_PENDING || 0;
      }
      if (selectedPenaltyMonth && selectedPenaltyMonth !== "none") {
        penaltyAllocated = tenantPaymentData.allMonths
          ? tenantPaymentData.allMonths.find(
              (m) => m.RENT_MONTH === selectedPenaltyMonth
            )?.PENALTY_PENDING || 0
          : tenantPaymentData.unpaidMonths.find(
              (m) => m.RENT_MONTH === selectedPenaltyMonth
            )?.PENALTY_PENDING || 0;
      }
    }
    const outstanding = parseInt(outstandingAllocated) || 0;
    return (
      parseInt(receivedAmount) -
      (rentAllocated + penaltyAllocated + outstanding)
    );
  };

  // Calculate penalty allocation for the selected month
  const penaltyMax = (() => {
    if (
      !selectedRentMonth ||
      selectedRentMonth === "none" ||
      !tenantPaymentData
    )
      return 0;
    const month = getSelectedMonth(selectedRentMonth);
    if (!month) return 0;
    return month.PENALTY_PENDING || 0;
  })();

  const penaltyApplies = (() => {
    if (
      !selectedRentMonth ||
      selectedRentMonth === "none" ||
      !tenantPaymentData
    )
      return false;
    const month = getSelectedMonth(selectedRentMonth);
    if (!month) return false;
    return isPenaltyShouldApply(month, paymentDate);
  })();

  // Compute the max penalty that can be allocated from unallocated amount
  const penaltyAutoAllocate = (() => {
    if (!penaltyApplies || isPenaltyManuallyWaived) return 0;
    const maxAlloc = Math.min(
      getUnallocatedAmount() + (parseInt(penaltyAllocatedInput) || 0),
      penaltyMax
    );
    return maxAlloc;
  })();

  const penaltyAllocated = Math.min(unallocatedAfterRent, penaltyDue);

  const unallocatedAfterPenalty = Math.max(
    0,
    unallocatedAfterRent - penaltyAllocated
  );

  const outstandingAllocatedNum = parseInt(outstandingAllocated) || 0;

  const totalAllocated =
    rentAllocated + penaltyAllocated + outstandingAllocatedNum;

  const finalUnallocated = receivedAmountNum - totalAllocated;

  const handleNext = () => {
    if (currentStep === "tenant" && selectedTenant) {
      setCurrentStep("payment");
    } else if (currentStep === "payment" && validatePaymentStep()) {
      setCurrentStep("allocation");
    } else if (currentStep === "allocation" && validateAllocationStep()) {
      setCurrentStep("review");
    }
  };

  const handleBack = () => {
    if (currentStep === "payment") {
      setCurrentStep("tenant");
    } else if (currentStep === "allocation") {
      setCurrentStep("payment");
    } else if (currentStep === "review") {
      setCurrentStep("allocation");
    }
  };

  const validatePaymentStep = () => {
    if (!paymentDate || !receivedAmount || !paymentMethod) return false;

    if (paymentMethod === 2) {
      // Cheque
      return !!(chequeNumber && chequeDate && bankName);
    }

    if (paymentMethod === 3) {
      // Online
      return !!transactionId;
    }

    return true;
  };

  // === REFACTORED VALIDATION - Much simpler now ===
  const validateAllocationStep = () => {
    if (outstandingAllocatedNum > unallocatedAfterPenalty) return false;
    return finalUnallocated >= 0;
  };

  const handleSubmit = async () => {
    if (!selectedTenant || !tenantPaymentData) {
      setError("Missing tenant or payment data");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // === NEW: Determine if a penalty was waived ===
      const penaltyExisted =
        selectedMonthData && selectedMonthData.PENALTY_PENDING > 0;
      const wasPenaltyWaived = penaltyExisted && penaltyAllocated === 0;

      const paymentEntry: PaymentEntry = {
        TENANT_ID: selectedTenant.TENANT_ID,
        RENT_MONTH: selectedRentMonth,
        RECEIVED_AMOUNT: parseInt(receivedAmount),
        RENT_ALLOCATED:
          selectedRentMonth && selectedRentMonth !== "none"
            ? (Array.isArray(tenantPaymentData.unpaidMonths)
                ? tenantPaymentData.unpaidMonths.find(
                    (m) => m.RENT_MONTH === selectedRentMonth
                  )?.RENT_PENDING
                : tenantPaymentData.allMonths?.find(
                    (m) => m.RENT_MONTH === selectedRentMonth
                  )?.RENT_PENDING) || 0
            : 0,
        PENALTY_ALLOCATED: getPenaltyAllocated(),
        OUTSTANDING_ALLOCATED: parseInt(outstandingAllocated) || 0,
        PAYMENT_METHOD: paymentMethod,
        PAYMENT_DATE: toLocalISOString(paymentDate),
        IS_PENALTY_WAIVED: wasPenaltyWaived || false,
        CHEQUE_DATE:
          paymentMethod === 2 && chequeDate
            ? toLocalISOString(chequeDate)
            : null,
        CHEQUE_NUMBER: paymentMethod === 2 ? chequeNumber : null,
        BANK_NAME: paymentMethod === 2 ? bankName : null,
        BANK_BRANCH: paymentMethod === 2 ? bankBranch : null,
        TRANSACTION_ID: paymentMethod === 3 ? transactionId : null,
        PAYMENT_GATEWAY: paymentMethod === 3 ? paymentGateway : null,
        NOTES: notes,
      };

      console.log("About to call API with:", paymentEntry);

      const workerUrl =
        process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";
      const response = await fetch(`${workerUrl}/api/transaction/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentEntry),
      });

      if (!response.ok) {
        throw new Error(`Worker responded with status: ${response.status}`);
      }

      const workerResult = (await response.json()) as {
        status: number;
        data: { success: boolean; message?: string };
        message?: string;
      };

      if (workerResult.status !== 200) {
        throw new Error(workerResult.message || "Failed to add payment");
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error("handleSubmit error:", error);
      setError("Failed to add payment");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep("tenant");
    setSelectedTenant(null);
    setTenantSearch("");
    setPaymentDate(new Date());
    setReceivedAmount("");
    setPaymentMethod(1);
    setNotes("");
    setChequeNumber("");
    setChequeDate(undefined);
    setBankName("");
    setBankBranch("");
    setTransactionId("");
    setPaymentGateway("");
    setSelectedRentMonth("none");
    setSelectedPenaltyMonth("none");
    setOutstandingAllocated("");
    setTenantPaymentData(null);
    setError(null);
  };

  const getPaymentMethodName = (method: PaymentMethod) => {
    switch (method) {
      case 1:
        return "Cash";
      case 2:
        return "Cheque";
      case 3:
        return "Online";
      default:
        return "Unknown";
    }
  };

  const getReceivedAmount = () => {
    return parseInt(receivedAmount) || 0;
  };

  const getMinimumRentAmount = () => {
    if (!tenantPaymentData) return 0;
    // Use allMonths if present, else fallback to unpaidMonths
    let rentPendings: number[] = [];
    if (tenantPaymentData.allMonths) {
      rentPendings = tenantPaymentData.allMonths
        .filter(
          (m) =>
            m.RENT_PENDING > 0 &&
            (typeof m.isPaid === "boolean" ? !m.isPaid : true)
        )
        .map((m) => m.RENT_PENDING);
    } else {
      rentPendings = tenantPaymentData.unpaidMonths
        .filter((m) => m.RENT_PENDING > 0)
        .map((m) => m.RENT_PENDING);
    }
    if (rentPendings.length === 0) return 0;
    const minRent = Math.min(...rentPendings);
    return minRent || 0;
  };

  // Helper to filter Q1 months of FY 2025-2026
  function isQ1FY2025_2026(monthStr: string) {
    // Q1 FY 2025-2026: April, May, June 2025
    const q1Months = ["2025-04", "2025-05", "2025-06"];
    return q1Months.some((m) => monthStr.startsWith(m));
  }

  // Helper to get selected month object from allMonths
  function getSelectedMonth(monthId: string) {
    return tenantPaymentData?.allMonths?.find((m) => m.RENT_MONTH === monthId);
  }

  // Helper to recalculate penaltyShouldApply based on selected paymentDate
  function isPenaltyShouldApply(month: any, paymentDate: Date) {
    if (!month.penaltyTriggerDate) return false;
    return paymentDate >= new Date(month.penaltyTriggerDate);
  }

  // Helper to get the actual penalty allocated for summary and calculations
  function getPenaltyAllocated() {
    if (isPenaltyManuallyWaived) return 0;
    if (penaltyApplies) {
      return penaltyAllocatedInput !== ""
        ? parseInt(penaltyAllocatedInput) || 0
        : penaltyAutoAllocate;
    }
    if (selectedPenaltyMonth && selectedPenaltyMonth !== "none") {
      const month = tenantPaymentData?.allMonths
        ? tenantPaymentData.allMonths.find(
            (m) => m.RENT_MONTH === selectedPenaltyMonth
          )
        : tenantPaymentData?.unpaidMonths.find(
            (m) => m.RENT_MONTH === selectedPenaltyMonth
          );
      return month?.PENALTY_PENDING || 0;
    }
    return 0;
  }

  if (!isOpen) return null;

  // DEBUG: Log totalDue before rendering
  if (tenantPaymentData)
    console.log("DEBUG totalDue:", tenantPaymentData.totalDue);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-prussian-blue-500">
              Add Payment Entry
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex mb-6">
            {["tenant", "payment", "allocation", "review"].map(
              (step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep === step
                        ? "bg-prussian-blue-500 text-white"
                        : index <
                            [
                              "tenant",
                              "payment",
                              "allocation",
                              "review",
                            ].indexOf(currentStep)
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {index <
                    ["tenant", "payment", "allocation", "review"].indexOf(
                      currentStep
                    ) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="ml-2 text-sm font-medium">
                    {step === "tenant" && "Select Tenant"}
                    {step === "payment" && "Payment Details"}
                    {step === "allocation" && "Allocate Payment"}
                    {step === "review" && "Review & Save"}
                  </span>
                  {index < 3 && <div className="w-16 h-0.5 bg-gray-200 mx-2" />}
                </div>
              )
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Step 1: Tenant Selection */}
          {currentStep === "tenant" && (
            <Card>
              <CardHeader>
                <CardTitle>Select Tenant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex gap-2">
                    <Input
                      id="tenant-search"
                      placeholder="Search by name or mobile number..."
                      value={tenantSearch}
                      onChange={(e) => setTenantSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loadTenants()}
                      disabled={searchLoading}
                    />
                    <Button
                      onClick={loadTenants}
                      variant="outline"
                      size="sm"
                      disabled={searchLoading}
                    >
                      {searchLoading ? "Searching..." : "Search"}
                    </Button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {tenants.length > 0 ? (
                    tenants.map((tenant) => (
                      <div
                        key={tenant.TENANT_ID}
                        className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                          selectedTenant?.TENANT_ID === tenant.TENANT_ID
                            ? "border-prussian-blue-500 bg-prussian-blue-50"
                            : "border-gray-200"
                        }`}
                        onClick={() => setSelectedTenant(tenant)}
                      >
                        <div className="font-medium">{tenant.TENANT_NAME}</div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>{tenant.PROPERTY_NAME}</div>
                          <div className="flex gap-4 text-xs text-gray-500">
                            {tenant.BUILDING_FOOR && (
                              <span>Bldg Flr: {tenant.BUILDING_FOOR}</span>
                            )}
                            {tenant.PROPERTY_TYPE && (
                              <span>Prp Type: {tenant.PROPERTY_TYPE}</span>
                            )}
                            {tenant.PROPERTY_NUMBER && (
                              <span>Prp Num: {tenant.PROPERTY_NUMBER}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      {searchLoading ? "Searching..." : "No tenants found"}
                    </div>
                  )}
                </div>

                {selectedTenant && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-medium text-green-800">
                      Selected: {selectedTenant.TENANT_NAME}
                    </div>
                    <div className="text-sm text-green-600">
                      {selectedTenant.PROPERTY_NAME}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Payment Details */}
          {currentStep === "payment" && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Label
                            className="pb-2 cursor-help"
                            htmlFor="payment-date"
                          >
                            Payment Date
                          </Label>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          The payment date determines if a penalty is applied or
                          waived. If the payment date is before the penalty
                          trigger (e.g., before the next quarter starts), no
                          penalty will be charged for that month. Enter the
                          actual date the payment was received.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {paymentDate
                            ? format(paymentDate, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={paymentDate}
                          onSelect={(date) => date && setPaymentDate(date)}
                          disabled={(date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label className="pb-2" htmlFor="received-amount">
                      Amount Received
                    </Label>
                    <Input
                      id="received-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div>
                  <Label className="pb-2" htmlFor="payment-method">
                    Payment Method
                  </Label>
                  <Select
                    value={paymentMethod.toString()}
                    onValueChange={(value) =>
                      setPaymentMethod(parseInt(value) as PaymentMethod)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Cash</SelectItem>
                      <SelectItem value="2">Cheque</SelectItem>
                      <SelectItem value="3">Online/Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Cheque specific fields */}
                {paymentMethod === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="pb-2" htmlFor="cheque-number">
                        Cheque Number *
                      </Label>
                      <Input
                        id="cheque-number"
                        value={chequeNumber}
                        onChange={(e) => setChequeNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="pb-2" htmlFor="cheque-date">
                        Cheque Date *
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {chequeDate
                              ? format(chequeDate, "PPP")
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={chequeDate}
                            onSelect={setChequeDate}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label className="pb-2" htmlFor="bank-name">
                        Bank Name *
                      </Label>
                      <Input
                        id="bank-name"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="pb-2" htmlFor="bank-branch">
                        Bank Branch
                      </Label>
                      <Input
                        id="bank-branch"
                        value={bankBranch}
                        onChange={(e) => setBankBranch(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Online specific fields */}
                {paymentMethod === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="pb-2" htmlFor="transaction-id">
                        Transaction ID *
                      </Label>
                      <Input
                        id="transaction-id"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="pb-2" htmlFor="payment-gateway">
                        Payment Gateway
                      </Label>
                      <Input
                        id="payment-gateway"
                        placeholder="e.g., Razorpay, PayU"
                        value={paymentGateway}
                        onChange={(e) => setPaymentGateway(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="pb-2" htmlFor="notes">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Allocation */}
          {currentStep === "allocation" && tenantPaymentData && (
            <Card>
              <CardHeader>
                <CardTitle>Allocate Payment</CardTitle>
                <div className="text-sm text-gray-600">
                  Available to allocate: ₹{receivedAmount}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tenant Summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium">
                    {tenantPaymentData.tenant.TENANT_NAME}
                  </div>
                  <div className="text-sm text-gray-600">
                    {tenantPaymentData.tenant.PROPERTY_NAME}
                  </div>
                  <div className="mt-2 text-sm">
                    Total Due: ₹{tenantPaymentData.totalDue.toLocaleString()}
                  </div>
                </div>

                {/* Allocation Rules Info */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 mb-2">
                    📋 Allocation Rules
                  </div>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div>
                      • <strong>Rent:</strong> Full payment required - no
                      partial payments
                    </div>
                    <div>
                      • <strong>Penalty:</strong> Full payment required - no
                      partial payments
                    </div>
                    <div>
                      • <strong>Outstanding:</strong> Partial payments allowed
                    </div>
                    <div>
                      • <strong>Available:</strong> ₹
                      {getReceivedAmount().toLocaleString()} received
                    </div>
                  </div>
                </div>

                {/* Rent Allocation */}
                {tenantPaymentData.allMonths &&
                  tenantPaymentData.allMonths.length > 0 && (
                    <div>
                      <Label className="pb-2">
                        Select Rent Month (Full Payment Required)
                      </Label>
                      <Select
                        value={selectedRentMonth}
                        onValueChange={setSelectedRentMonth}
                        disabled={getReceivedAmount() < getMinimumRentAmount()}
                      >
                        <SelectTrigger
                          className={
                            getReceivedAmount() < getMinimumRentAmount()
                              ? "bg-gray-100 text-gray-500"
                              : ""
                          }
                        >
                          <SelectValue placeholder="Select rent month" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48 overflow-y-auto">
                          <SelectItem value="none">
                            None (No rent allocation)
                          </SelectItem>
                          {tenantPaymentData.allMonths.map((month) => (
                            <SelectItem
                              key={month.RENT_MONTH}
                              value={month.RENT_MONTH}
                              disabled={month.isPaid}
                              className={
                                month.isPaid
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }
                            >
                              {format(new Date(month.RENT_MONTH), "MMMM yyyy")}{" "}
                              - ₹{month.RENT_PENDING.toLocaleString()}
                              {month.isPaid && " (Paid)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(getReceivedAmount() < getMinimumRentAmount() ||
                        getReceivedAmount() === 0) && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          ⚠️ Insufficient payment for rent. Rent requires full
                          payment - no partial payments allowed.
                          <br />
                          <span className="text-xs">
                            Received: ₹{getReceivedAmount().toLocaleString()} |
                            Min Rent: ₹{getMinimumRentAmount().toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                {/* Penalty Allocation */}
                {selectedRentMonth &&
                  selectedRentMonth !== "none" &&
                  (() => {
                    const month = getSelectedMonth(selectedRentMonth);
                    // Show this section only if a penalty amount exists for the selected month
                    if (!month || month.PENALTY_PENDING <= 0) {
                      return null;
                    }

                    const penaltyApplies = isPenaltyShouldApply(
                      month,
                      paymentDate
                    );

                    if (penaltyApplies) {
                      // Case 1: Penalty is DUE because payment is late
                      return (
                        <div>
                          <Label className="pb-2 flex items-center gap-2 text-destructive">
                            Penalty for this month
                          </Label>
                          <div className="p-3 border-destructive bg-red-50 rounded-md flex items-center justify-between">
                            <span className="font-medium text-destructive">
                              ₹{month.PENALTY_PENDING.toLocaleString()}
                            </span>
                            <span className="text-xs text-destructive">
                              (Full penalty must be paid)
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Reason: Payment date is on or after the penalty
                            trigger date (
                            {format(
                              new Date(month.penaltyTriggerDate),
                              "MMM d, yyyy"
                            )}
                            ).
                          </p>
                          {/* Waive Penalty Checkbox */}
                          <div className="flex items-center gap-2 mt-3">
                            <input
                              id="waive-penalty-checkbox"
                              type="checkbox"
                              checked={isPenaltyManuallyWaived}
                              onChange={(e) =>
                                setIsPenaltyManuallyWaived(e.target.checked)
                              }
                              className="accent-green-600 w-4 h-4"
                            />
                            <Label
                              htmlFor="waive-penalty-checkbox"
                              className="text-sm cursor-pointer"
                            >
                              Waive penalty for this month
                            </Label>
                          </div>
                          {isPenaltyManuallyWaived ? null : (
                            <div className="mt-3">
                              <Label
                                htmlFor="penalty-allocated-input"
                                className="text-sm"
                              >
                                Enter penalty amount to allocate (max ₹
                                {penaltyMax.toLocaleString()})
                              </Label>
                              <input
                                id="penalty-allocated-input"
                                type="number"
                                min={0}
                                max={penaltyMax}
                                value={
                                  penaltyAllocatedInput === ""
                                    ? penaltyAutoAllocate
                                    : penaltyAllocatedInput
                                }
                                onChange={(e) => {
                                  let val = parseInt(e.target.value) || 0;
                                  if (val > penaltyMax) val = penaltyMax;
                                  if (
                                    val >
                                    getUnallocatedAmount() +
                                      (parseInt(penaltyAllocatedInput) || 0)
                                  )
                                    val =
                                      getUnallocatedAmount() +
                                      (parseInt(penaltyAllocatedInput) || 0);
                                  setPenaltyAllocatedInput(val.toString());
                                }}
                                className="mt-1 w-full border rounded px-2 py-1 text-destructive"
                              />
                              <div className="text-xs text-gray-500 mt-1">
                                Auto-allocated up to available amount. If not
                                enough, allocate what is possible.
                              </div>
                            </div>
                          )}
                          {isPenaltyManuallyWaived && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                              Penalty will be waived off for this payment.
                              Please ensure you have admin rights to perform
                              this action.
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      // Case 2: Penalty is WAIVED because payment is on time
                      return (
                        <div>
                          <Label className="pb-2 flex items-center gap-2">
                            Penalty
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="p-3 border border-dashed rounded-md flex items-center justify-between cursor-help">
                                  <span className="text-gray-500 line-through">
                                    ₹{month.PENALTY_PENDING.toLocaleString()}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-green-600 border-green-300"
                                  >
                                    Waived
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Waived: Rent was paid before the penalty date
                                  of{" "}
                                  {format(
                                    new Date(month.penaltyTriggerDate),
                                    "PPP"
                                  )}
                                  .
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      );
                    }
                  })()}

                {/* Outstanding Allocation */}
                {(() => {
                  if (!selectedRentMonth || selectedRentMonth === "none")
                    return null;
                  const month = getSelectedMonth(selectedRentMonth);
                  const penaltyApplies =
                    month && isPenaltyShouldApply(month, paymentDate);
                  // Hide if outstanding is 0 or penalty is due but manually waived
                  if (
                    !month ||
                    month.OUTSTANDING_PENDING <= 0 ||
                    (penaltyApplies && isPenaltyManuallyWaived)
                  )
                    return null;
                  return (
                    <div>
                      <Label className="pb-2" htmlFor="outstanding-allocated">
                        Allocate to Outstanding (Partials Allowed)
                      </Label>
                      <Input
                        id="outstanding-allocated"
                        type="number"
                        placeholder="Enter amount"
                        value={outstandingAllocated}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          const maxAllowed =
                            getUnallocatedAmount() +
                            (parseInt(outstandingAllocated) || 0);
                          if (value <= maxAllowed) {
                            setOutstandingAllocated(e.target.value);
                          }
                        }}
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        disabled={(() => {
                          // If penalty is required and not fully allocated, disable outstanding
                          if (
                            selectedRentMonth &&
                            selectedRentMonth !== "none"
                          ) {
                            const month = getSelectedMonth(selectedRentMonth);
                            const penaltyApplies = isPenaltyShouldApply(
                              month,
                              paymentDate
                            );
                            if (
                              month &&
                              month.PENALTY_PENDING > 0 &&
                              penaltyApplies
                            ) {
                              return true;
                            }
                          }
                          return false;
                        })()}
                      />
                      {parseInt(outstandingAllocated) >
                        getUnallocatedAmount() && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          ⚠️ Cannot allocate more than ₹
                          {receivedAmount.toLocaleString()} to outstanding.
                        </div>
                      )}
                      {selectedRentMonth &&
                        selectedRentMonth !== "none" &&
                        (() => {
                          const month = getSelectedMonth(selectedRentMonth);
                          const penaltyApplies = isPenaltyShouldApply(
                            month,
                            paymentDate
                          );
                          if (
                            month &&
                            month.PENALTY_PENDING > 0 &&
                            penaltyApplies
                          ) {
                            return (
                              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                                Penalty must be paid before allocating to
                                outstanding for this month.
                              </div>
                            );
                          }
                          return null;
                        })()}
                    </div>
                  );
                })()}

                {/* Allocation Summary */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="font-medium text-blue-800 mb-2">
                    Allocation Summary
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Rent:</span>
                      <span>
                        ₹
                        {selectedRentMonth && selectedRentMonth !== "none"
                          ? (tenantPaymentData.allMonths
                              ? tenantPaymentData.allMonths
                                  .find(
                                    (m) => m.RENT_MONTH === selectedRentMonth
                                  )
                                  ?.RENT_PENDING.toLocaleString()
                              : tenantPaymentData.unpaidMonths
                                  .find(
                                    (m) => m.RENT_MONTH === selectedRentMonth
                                  )
                                  ?.RENT_PENDING.toLocaleString()) || "0"
                          : "0"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Penalty:</span>
                      <span>
                        ₹
                        {(() => {
                          if (isPenaltyManuallyWaived) return "0";
                          if (penaltyApplies)
                            return getPenaltyAllocated().toLocaleString();
                          if (
                            selectedPenaltyMonth &&
                            selectedPenaltyMonth !== "none"
                          ) {
                            const month = tenantPaymentData?.allMonths
                              ? tenantPaymentData.allMonths.find(
                                  (m) => m.RENT_MONTH === selectedPenaltyMonth
                                )
                              : tenantPaymentData?.unpaidMonths.find(
                                  (m) => m.RENT_MONTH === selectedPenaltyMonth
                                );
                            return (
                              month?.PENALTY_PENDING?.toLocaleString() || "0"
                            );
                          }
                          return "0";
                        })()}
                      </span>
                    </div>
                    {selectedRentMonth &&
                      selectedRentMonth !== "none" &&
                      (() => {
                        const month = getSelectedMonth(selectedRentMonth);
                        const penaltyApplies =
                          month && isPenaltyShouldApply(month, paymentDate);
                        if (
                          month &&
                          month.PENALTY_PENDING > 0 &&
                          penaltyApplies &&
                          isPenaltyManuallyWaived
                        ) {
                          return (
                            <div className="flex justify-between text-xs text-green-700">
                              <span></span>
                              <span>Penalty waived off for this payment</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    <div className="flex justify-between">
                      <span>Outstanding:</span>
                      <span>
                        ₹
                        {(parseInt(outstandingAllocated) || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t pt-1 mt-1">
                      <div className="flex justify-between font-medium">
                        <span>Total Allocated:</span>
                        <span>
                          ₹
                          {(() => {
                            let rent = 0,
                              penalty = getPenaltyAllocated(),
                              outstanding = parseInt(outstandingAllocated) || 0;
                            if (
                              selectedRentMonth &&
                              selectedRentMonth !== "none"
                            ) {
                              const month = getSelectedMonth(selectedRentMonth);
                              if (month) rent = month.RENT_PENDING || 0;
                            }
                            return (
                              rent +
                              penalty +
                              outstanding
                            ).toLocaleString();
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Unallocated:</span>
                        <span
                          className={
                            getUnallocatedAmount() > 0
                              ? "text-orange-600"
                              : "text-green-600"
                          }
                        >
                          ₹
                          {(() => {
                            // Unallocated = receivedAmount - (rent + penalty + outstanding)
                            let rent = 0,
                              penalty = getPenaltyAllocated(),
                              outstanding = parseInt(outstandingAllocated) || 0;
                            if (
                              selectedRentMonth &&
                              selectedRentMonth !== "none"
                            ) {
                              const month = getSelectedMonth(selectedRentMonth);
                              if (month) rent = month.RENT_PENDING || 0;
                            }
                            return `${(parseInt(receivedAmount) - (rent + penalty + outstanding)).toLocaleString()}`;
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review */}
          {currentStep === "review" && selectedTenant && tenantPaymentData && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Confirm</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Tenant</Label>
                    <div className="text-sm">{selectedTenant.TENANT_NAME}</div>
                    <div className="text-xs text-gray-600">
                      {selectedTenant.PROPERTY_NAME}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Payment Date</Label>
                    <div className="text-sm">{format(paymentDate, "PPP")}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Amount Received
                    </Label>
                    <div className="text-sm font-medium">
                      ₹{parseInt(receivedAmount).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Payment Method
                    </Label>
                    <div className="text-sm">
                      {getPaymentMethodName(paymentMethod)}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-sm font-medium">
                    Allocation Details
                  </Label>
                  <div className="space-y-2 mt-2">
                    {selectedRentMonth && selectedRentMonth !== "none" && (
                      <div className="flex justify-between text-sm">
                        <span>
                          Rent (
                          {format(new Date(selectedRentMonth), "MMMM yyyy")}):
                        </span>
                        <span>
                          ₹
                          {tenantPaymentData.allMonths
                            ? tenantPaymentData.allMonths
                                .find((m) => m.RENT_MONTH === selectedRentMonth)
                                ?.RENT_PENDING?.toLocaleString() || "0"
                            : tenantPaymentData.unpaidMonths
                                .find((m) => m.RENT_MONTH === selectedRentMonth)
                                ?.RENT_PENDING?.toLocaleString() || "0"}
                        </span>
                      </div>
                    )}
                    {selectedPenaltyMonth &&
                      selectedPenaltyMonth !== "none" && (
                        <div className="flex justify-between text-sm">
                          <span>
                            Penalty (
                            {format(
                              new Date(selectedPenaltyMonth),
                              "MMMM yyyy"
                            )}
                            ):
                          </span>
                          <span>
                            ₹
                            {(() => {
                              if (isPenaltyManuallyWaived) return "0";
                              if (penaltyApplies)
                                return (
                                  penaltyAllocatedInput || penaltyAutoAllocate
                                );
                              if (
                                selectedPenaltyMonth &&
                                selectedPenaltyMonth !== "none"
                              ) {
                                return (
                                  (tenantPaymentData.allMonths
                                    ? tenantPaymentData.allMonths
                                        .find(
                                          (m) =>
                                            m.RENT_MONTH ===
                                            selectedPenaltyMonth
                                        )
                                        ?.PENALTY_PENDING.toLocaleString()
                                    : tenantPaymentData.unpaidMonths
                                        .find(
                                          (m) =>
                                            m.RENT_MONTH ===
                                            selectedPenaltyMonth
                                        )
                                        ?.PENALTY_PENDING.toLocaleString()) ||
                                  "0"
                                );
                              }
                              return "0";
                            })()}
                          </span>
                        </div>
                      )}
                    {parseInt(outstandingAllocated) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Outstanding:</span>
                        <span>
                          ₹{parseInt(outstandingAllocated).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {getUnallocatedAmount() > 0 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="text-sm text-orange-800">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />₹
                      {getUnallocatedAmount().toLocaleString()} will remain
                      unallocated
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === "tenant"}
            >
              Back
            </Button>

            <div className="flex gap-2">
              {currentStep !== "review" ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    (currentStep === "tenant" && !selectedTenant) ||
                    (currentStep === "payment" && !validatePaymentStep()) ||
                    (currentStep === "allocation" && !validateAllocationStep())
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Saving..." : "Save Payment"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
