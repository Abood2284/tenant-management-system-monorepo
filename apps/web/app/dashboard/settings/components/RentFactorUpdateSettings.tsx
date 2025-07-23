// apps/web/app/dashboard/settings/components/RentFactorUpdateSettings.tsx
"use client";

import { z } from "zod";
import { useState, Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { TrendingUp, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { X, Calendar } from "lucide-react";
import { format } from "date-fns";

// Zod schema for frontend validation
const updateRentFactorsSchema = z.object({
  basicRentPercentage: z.number().min(0, "Must be a positive number"),
  propertyTaxPercentage: z.number().min(0, "Must be a positive number"),
  repaircessPercentage: z.number().min(0, "Must be a positive number"),
  miscPercentage: z.number().min(0, "Must be a positive number"),
  effectiveFrom: z.date({ error: "Effective date is required" }),
});

interface UpdateRentFactorsValues
  extends z.infer<typeof updateRentFactorsSchema> {}

// This function calls the backend. Replace with your actual API client if you have one.
async function updateRentFactorsApi(data: UpdateRentFactorsValues) {
  const response = await fetch("/api/settings/tenant-factor-update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = (await response.json()) as { message: string };

  if (!response.ok) {
    throw new Error(result.message || "An unknown error occurred.");
  }

  return result;
}

export function RentFactorUpdateSettings() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(updateRentFactorsSchema),
    defaultValues: {
      basicRentPercentage: 0,
      propertyTaxPercentage: 0,
      repaircessPercentage: 0,
      miscPercentage: 0,
      effectiveFrom: undefined,
    },
  });

  async function onSubmit(data: UpdateRentFactorsValues) {
    setIsSubmitting(true);
    toast.info("Submitting rent factor update...");
    try {
      const result = await updateRentFactorsApi(data);
      toast.success(result.message);
      form.reset();
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-prussian_blue-500 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Bulk Rent Factor Update
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormDescription>
              Apply a percentage-based increment to all tenants' rent
              components. This action is recorded and will update all active
              tenancies from the effective date.
            </FormDescription>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="basicRentPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Basic Rent Increase (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="propertyTaxPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Tax Increase (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="repaircessPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repair Cess Increase (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="miscPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Misc. Charges Increase (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="effectiveFrom"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Effective From Date</FormLabel>
                  <Popover
                    open={isDatePickerOpen}
                    onOpenChange={setIsDatePickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-64 justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateRange.from
                          ? format(dateRange.from, "MMM dd, yyyy")
                          : "Select effective date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 border-b">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Select Effective Date</h4>
                          {dateRange.from && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDateRange({
                                  from: undefined,
                                  to: undefined,
                                });
                                field.onChange(undefined);
                              }}
                              className="h-6 px-2"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="p-3">
                        <CalendarComponent
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => {
                            setDateRange({ from: date, to: undefined });
                            field.onChange(date);
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return !date || date <= today;
                          }}
                          numberOfMonths={1}
                          className="rounded-md"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-prussian_blue-500 hover:bg-prussian_blue-600 w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting
                ? "Applying Update..."
                : "Apply Universal Increment"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
