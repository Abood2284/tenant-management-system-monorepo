"use client";

import * as React from "react";
import {
  Bar,
  ComposedChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthlyData {
  month: string;
  collected: number;
  pending: number;
  completion: number;
}

interface MonthlyTrendsAreaChartProps {
  data: MonthlyData[];
  title?: string;
  description?: string;
}

const chartConfig = {
  collected: {
    label: "Collected",
    color: "hsl(142, 76%, 36%)", // Green
  },
  pending: {
    label: "Pending",
    color: "hsl(24, 95%, 53%)", // Orange
  },
  completion: {
    label: "Completion %",
    color: "hsl(221, 83%, 53%)", // Blue
  },
} satisfies ChartConfig;

export function MonthlyTrendsAreaChart({
  data,
  title = "Monthly Collection Trends",
  description = "Showing collected vs pending amounts over time",
}: MonthlyTrendsAreaChartProps) {
  const [timeRange, setTimeRange] = React.useState("90d");

  // Convert monthly data to chart format
  const chartData = data.map((item) => ({
    month: item.month,
    collected: item.collected,
    pending: item.pending,
    completion: item.completion,
    total: item.collected + item.pending,
  }));

  // Filter data based on time range
  const filteredData = React.useMemo(() => {
    if (timeRange === "all") return chartData;

    const now = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") daysToSubtract = 30;
    if (timeRange === "7d") daysToSubtract = 7;

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return chartData.filter((item) => new Date(item.month) >= startDate);
  }, [chartData, timeRange]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select time range"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">
              All time
            </SelectItem>
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <ComposedChart data={filteredData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `₹${value.toLocaleString()}`}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                        {payload.map((entry, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-1">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-xs text-muted-foreground">
                                {entry.name === "completion"
                                  ? "Completion"
                                  : entry.name === "collected"
                                    ? "Collected"
                                    : "Pending"}
                              </span>
                            </div>
                            <span className="text-xs font-medium">
                              {entry.name === "completion"
                                ? `${entry.value}%`
                                : `₹${Number(entry.value).toLocaleString()}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="collected"
              stackId="a"
              fill="hsl(142, 76%, 36%)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="pending"
              stackId="a"
              fill="hsl(24, 95%, 53%)"
              radius={[4, 4, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="completion"
              stroke="hsl(221, 83%, 53%)"
              strokeWidth={2}
              dot={false}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
