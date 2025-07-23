"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Percent,
  Calendar,
  TrendingUp,
  History,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  PenaltyInterestMaster,
  PenaltyInterestHistory,
  PenaltyRateChangeRequest,
  TenantImpactPreview,
} from "@repo/types/api";
import {
  fetchCurrentPenaltyRate,
  fetchPenaltyHistory,
  fetchPenaltyImpactExample,
  getPenaltyRateImpact,
  updatePenaltyRate,
} from "@/lib/api";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EnhancedBillingSettingsProps {
  systemSettings: {
    defaultPenaltyPercent: number;
    gracePeriodDays: number;
    autoReminders: boolean;
    whatsappIntegration: boolean;
    emailNotifications: boolean;
    currency: string;
  };
  setSystemSettings: React.Dispatch<
    React.SetStateAction<{
      defaultPenaltyPercent: number;
      gracePeriodDays: number;
      autoReminders: boolean;
      whatsappIntegration: boolean;
      emailNotifications: boolean;
      currency: string;
    }>
  >;
}

interface ImpactMonth {
  month: string | null;
  outstanding: number;
  penaltyApplies: boolean;
  oldPenalty: number;
  newPenalty: number;
  difference: number;
}

interface ImpactExample {
  tenantName: string;
  propertyName: string;
  currentRate: number;
  newRate: number;
  months: ImpactMonth[];
}

export function EnhancedBillingSettings({
  systemSettings,
  setSystemSettings,
}: EnhancedBillingSettingsProps) {
  const [currentPenaltyRate, setCurrentPenaltyRate] =
    useState<PenaltyInterestMaster | null>(null);
  const [penaltyHistory, setPenaltyHistory] = useState<
    PenaltyInterestHistory[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [newRate, setNewRate] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [impactPreview, setImpactPreview] = useState<TenantImpactPreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [impactStep, setImpactStep] = useState(0);
  const [impactExample, setImpactExample] = useState<ImpactExample | null>(
    null
  );
  const [impactLoading, setImpactLoading] = useState(false);
  const [impactError, setImpactError] = useState<string | null>(null);

  useEffect(() => {
    loadPenaltyData();
  }, []);

  const loadPenaltyData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [currentRate, history] = await Promise.all([
        fetchCurrentPenaltyRate(),
        fetchPenaltyHistory(),
      ]);

      setCurrentPenaltyRate(currentRate);
      setPenaltyHistory(history);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load penalty data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateChange = async (rate: number) => {
    try {
      setError(null);
      // Only fetch impact if rate is different from current
      if (currentPenaltyRate && rate !== currentPenaltyRate.INTEREST_RATE) {
        const impact = await getPenaltyRateImpact(rate);
        setImpactPreview(impact);
      } else {
        setImpactPreview([]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load impact preview"
      );
      setImpactPreview([]);
    }
  };

  const handleUpdatePenaltyRate = async () => {
    if (!newRate || !effectiveFrom) {
      setError("Please fill in all required fields");
      return;
    }

    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError("Penalty percentage must be between 0 and 100");
      return;
    }

    const effectiveDate = new Date(effectiveFrom);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (effectiveDate < tomorrow) {
      setError("Effective date must be tomorrow or later");
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      const request: PenaltyRateChangeRequest = {
        newRate: rate,
        effectiveFrom: effectiveFrom,
      };

      await updatePenaltyRate(request);

      setSuccess("Penalty percentage updated successfully!");
      setShowUpdateForm(false);
      setNewRate("");
      setEffectiveFrom("");
      setImpactPreview([]);

      // Reload data
      await loadPenaltyData();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update penalty percentage"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenImpactModal = async () => {
    setImpactLoading(true);
    setImpactError(null);
    setImpactStep(0);
    setImpactExample(null);
    setShowImpactModal(true);
    try {
      const example = await fetchPenaltyImpactExample(
        Number(newRate || currentPenaltyRate?.INTEREST_RATE || 0)
      );
      setImpactExample(example);
    } catch {
      setImpactError("Failed to fetch penalty impact example");
    } finally {
      setImpactLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const sampleTenants = useMemo(() => {
    if (!impactPreview.length) return [];
    // Pick 3 random tenants
    const shuffled = [...impactPreview].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, [impactPreview]);
  const extraCount = impactPreview.length > 3 ? impactPreview.length - 3 : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-prussian_blue-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Loading penalty settings...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card className="bg-prussian_blue-50 border-prussian_blue-100">
        <CardContent className="py-4">
          <div className="text-prussian_blue-700 font-medium text-base">
            Penalty interest is applied to any month’s rent that remains unpaid
            by the start of the next quarter. Use the form below to update the
            penalty percentage for overdue payments.
          </div>
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>{success}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Penalty Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-prussian_blue-500 flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Current Penalty Percentage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentPenaltyRate ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">
                  Current Penalty %
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-prussian_blue-500">
                    {currentPenaltyRate.INTEREST_RATE}%
                  </span>
                  <Badge variant="outline" className="text-green-600">
                    Currently Active
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  This rate applies to all months unpaid by the start of the
                  next quarter.
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">
                  Effective From
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {formatDate(currentPenaltyRate.EFFECTIVE_FROM)}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">
                  Last Updated
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {currentPenaltyRate.UPDATED_ON
                      ? formatDate(currentPenaltyRate.UPDATED_ON)
                      : "Not updated"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                No penalty percentage configured
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => setShowUpdateForm(!showUpdateForm)}
              className="bg-prussian-blue-500 hover:bg-prussian-blue-600"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {showUpdateForm ? "Cancel Update" : "Change Penalty Percentage"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Penalty Percentage Update Form */}
      {showUpdateForm && (
        <Card className="border-2 border-prussian-blue-200 bg-prussian-blue-50">
          <CardHeader>
            <CardTitle className="text-prussian-blue-500 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Update Penalty Percentage
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Set the new penalty percentage and the date from which it should
              take effect. This will apply to all overdue rents from that date
              onward.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-rate" className="text-prussian-blue-500">
                  Penalty Percentage (%)
                </Label>
                <Input
                  id="new-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={newRate}
                  onChange={(e) => {
                    setNewRate(e.target.value);
                    if (e.target.value) {
                      handleRateChange(parseFloat(e.target.value));
                    }
                  }}
                  className="mt-1"
                  placeholder="e.g., 25"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {currentPenaltyRate?.INTEREST_RATE || 0}%
                </p>
              </div>
              <div>
                <Label
                  htmlFor="effective-from"
                  className="text-prussian-blue-500"
                >
                  Effective From Date
                </Label>
                <Input
                  id="effective-from"
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="mt-1"
                  min={
                    new Date(Date.now() + 86400000).toISOString().split("T")[0]
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Must be tomorrow or later
                </p>
              </div>
            </div>

            {/* Impact Preview */}
            {impactPreview.length > 0 && (
              <div className="space-y-3">
                <Label className="text-prussian_blue-500">Impact Preview</Label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-muted-foreground mb-3">
                    This change will affect {impactPreview.length} tenants with
                    overdue rents:
                  </p>
                  <div className="space-y-2">
                    {sampleTenants.map((tenant) => (
                      <div
                        key={tenant.tenantId}
                        className="border rounded p-2 bg-white"
                      >
                        <div className="font-medium text-prussian_blue-700">
                          {tenant.tenantName}{" "}
                          <span className="text-xs text-muted-foreground">
                            ({tenant.propertyName})
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Overdue Months:
                        </div>
                        <table className="w-full text-xs mb-2">
                          <thead>
                            <tr>
                              <th className="text-left">Month</th>
                              <th className="text-right">Outstanding</th>
                              <th className="text-right">Old Penalty</th>
                              <th className="text-right">New Penalty</th>
                              <th className="text-right">Diff</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tenant.months.map((m, i) => (
                              <tr key={i}>
                                <td>
                                  {m.month
                                    ? new Date(m.month).toLocaleDateString(
                                        "en-US",
                                        { month: "long", year: "numeric" }
                                      )
                                    : "-"}
                                </td>
                                <td className="text-right">
                                  ₹{m.outstandingAmount.toLocaleString()}
                                </td>
                                <td className="text-right">
                                  ₹{m.oldPenalty.toLocaleString()}
                                </td>
                                <td className="text-right">
                                  ₹{m.newPenalty.toLocaleString()}
                                </td>
                                <td
                                  className={`text-right ${m.difference > 0 ? "text-red-600" : m.difference < 0 ? "text-green-600" : ""}`}
                                >
                                  {m.difference >= 0 ? "+" : ""}₹
                                  {m.difference.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="text-xs">
                          <span className="font-medium">Total Impact:</span>{" "}
                          Old: ₹{tenant.totalOldPenalty.toLocaleString()} | New:
                          ₹{tenant.totalNewPenalty.toLocaleString()} | Diff:{" "}
                          <span
                            className={
                              tenant.totalDifference > 0
                                ? "text-red-600"
                                : tenant.totalDifference < 0
                                  ? "text-green-600"
                                  : ""
                            }
                          >
                            {tenant.totalDifference >= 0 ? "+" : ""}₹
                            {tenant.totalDifference.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {extraCount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        ... and {extraCount} more tenants affected
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenImpactModal}
                    >
                      Preview Penalty Impact
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleUpdatePenaltyRate}
                disabled={isUpdating || !newRate || !effectiveFrom}
                className="bg-prussian-blue-500 hover:bg-prussian-blue-600"
              >
                {isUpdating ? "Updating..." : "Update Penalty Percentage"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpdateForm(false);
                  setNewRate("");
                  setEffectiveFrom("");
                  setImpactPreview([]);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Penalty History */}
      {penaltyHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-prussian-blue-500 flex items-center gap-2">
              <History className="h-5 w-5" />
              Penalty Percentage History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {penaltyHistory.map((record) => (
                <div
                  key={record.ID}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="font-medium">
                        {record.INTEREST_RATE}%
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Effective: {formatDate(record.EFFECTIVE_FROM)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {record.CREATED_ON && formatDate(record.CREATED_ON)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Impact Preview Modal */}
      <AlertDialog open={showImpactModal} onOpenChange={setShowImpactModal}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Penalty Impact Example</AlertDialogTitle>
          </AlertDialogHeader>
          {impactLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading example...
            </div>
          ) : impactError ? (
            <div className="p-8 text-center text-red-600">{impactError}</div>
          ) : !impactExample ? (
            <div className="p-8 text-center text-muted-foreground">
              No suitable tenant found for example.
            </div>
          ) : (
            <>
              {/* Stepper */}
              <div className="flex gap-2 mb-4">
                {["Intro", "Example", "Summary"].map((label, idx) => (
                  <div key={label} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${impactStep === idx ? "bg-prussian_blue-500 text-white" : idx < impactStep ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"}`}
                    >
                      {idx + 1}
                    </div>
                    <span className="ml-2 text-sm font-medium">{label}</span>
                    {idx < 2 && <div className="w-8 h-0.5 bg-gray-200 mx-2" />}
                  </div>
                ))}
              </div>
              {/* Step 1: Intro */}
              {impactStep === 0 && (
                <div>
                  <div className="mb-4 text-base font-medium text-prussian_blue-700">
                    How Penalty is Applied
                  </div>
                  <div className="mb-4 text-sm text-muted-foreground">
                    Penalty interest is <b>only</b> applied to a month&apos;s
                    rent if it remains unpaid at the{" "}
                    <b>start of the next quarter</b>.
                    <br />
                    <br />
                    In the next step, you&apos;ll see a real example from a
                    random tenant in your system, showing exactly how penalty
                    would be calculated for their overdue months.
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImpactStep(1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
              {/* Step 2: Example */}
              {impactStep === 1 && impactExample && (
                <div>
                  <div className="mb-2 font-medium">
                    {impactExample.tenantName}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({impactExample.propertyName})
                    </span>
                  </div>
                  <div className="mb-2 text-sm text-muted-foreground">
                    Below is this tenant&apos;s recent payment history. Penalty
                    is only applied to months that are still unpaid at the start
                    of the next quarter.
                  </div>
                  <table className="w-full text-xs mb-2">
                    <thead>
                      <tr>
                        <th className="text-left">Month</th>
                        <th className="text-right">Outstanding</th>
                        <th className="text-center">Penalty Applies?</th>
                        <th className="text-right">Old Penalty</th>
                        <th className="text-right">New Penalty</th>
                        <th className="text-right">Diff</th>
                      </tr>
                    </thead>
                    <tbody>
                      {impactExample.months.map((m: ImpactMonth, i: number) => (
                        <tr key={i}>
                          <td>
                            {m.month
                              ? new Date(m.month).toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                })
                              : "-"}
                          </td>
                          <td className="text-right">
                            ₹{m.outstanding.toLocaleString()}
                          </td>
                          <td className="text-center">
                            {m.penaltyApplies ? (
                              <span className="text-green-700 font-medium">
                                Yes
                              </span>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </td>
                          <td className="text-right">
                            {m.penaltyApplies
                              ? `₹${m.oldPenalty.toLocaleString()}`
                              : "-"}
                          </td>
                          <td className="text-right">
                            {m.penaltyApplies
                              ? `₹${m.newPenalty.toLocaleString()}`
                              : "-"}
                          </td>
                          <td
                            className={`text-right ${m.difference > 0 ? "text-red-600" : m.difference < 0 ? "text-green-600" : ""}`}
                          >
                            {m.penaltyApplies
                              ? (m.difference >= 0 ? "+" : "") +
                                `₹${m.difference.toLocaleString()}`
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-xs mb-2">
                    <span className="font-medium">Current Penalty Rate:</span>{" "}
                    {impactExample.currentRate}%<br />
                    <span className="font-medium">New Penalty Rate:</span>{" "}
                    {impactExample.newRate}%
                  </div>
                  <div className="flex justify-between mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImpactStep(0)}
                    >
                      Back
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImpactStep(2)}
                    >
                      Summary
                    </Button>
                  </div>
                </div>
              )}
              {/* Step 3: Summary */}
              {impactStep === 2 && impactExample && (
                <div>
                  <div className="mb-2 font-medium">
                    Summary for {impactExample.tenantName}
                  </div>
                  <div className="text-sm mb-2">
                    This tenant would see the following change in penalty for
                    their overdue months if you update the penalty rate:
                  </div>
                  <table className="w-full text-xs mb-2">
                    <thead>
                      <tr>
                        <th className="text-left">Month</th>
                        <th className="text-right">Old Penalty</th>
                        <th className="text-right">New Penalty</th>
                        <th className="text-right">Diff</th>
                      </tr>
                    </thead>
                    <tbody>
                      {impactExample.months
                        .filter((m: ImpactMonth) => m.penaltyApplies)
                        .map((m: ImpactMonth, i: number) => (
                          <tr key={i}>
                            <td>
                              {m.month
                                ? new Date(m.month).toLocaleDateString(
                                    "en-US",
                                    { month: "long", year: "numeric" }
                                  )
                                : "-"}
                            </td>
                            <td className="text-right">
                              ₹{m.oldPenalty.toLocaleString()}
                            </td>
                            <td className="text-right">
                              ₹{m.newPenalty.toLocaleString()}
                            </td>
                            <td
                              className={`text-right ${m.difference > 0 ? "text-red-600" : m.difference < 0 ? "text-green-600" : ""}`}
                            >
                              {(m.difference >= 0 ? "+" : "") +
                                `₹${m.difference.toLocaleString()}`}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  <div className="text-xs mb-2">
                    <span className="font-medium">
                      Total Additional Penalty for this Tenant:
                    </span>{" "}
                    <span className="font-bold text-red-700">
                      ₹
                      {impactExample.months
                        .filter((m: ImpactMonth) => m.penaltyApplies)
                        .reduce(
                          (sum: number, m: ImpactMonth) => sum + m.difference,
                          0
                        )
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImpactStep(1)}
                    >
                      Back
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenImpactModal}
                    >
                      See Another Example
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowImpactModal(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
