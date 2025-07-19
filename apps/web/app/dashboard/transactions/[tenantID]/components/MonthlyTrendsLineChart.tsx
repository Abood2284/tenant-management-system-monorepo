"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";

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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface MonthlyTrendsData {
  month: string;
  collected: number;
  pending: number;
  completion: number;
}

interface MonthlyTrendsLineChartProps {
  data: MonthlyTrendsData[];
  title?: string;
  description?: string;
}

const chartConfig = {
  collected: {
    label: "Collected",
    color: "hsl(var(--chart-1))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function MonthlyTrendsLineChart({
  data,
  title = "Monthly Collection Trends",
  description = "Line chart showing collection trends over time",
}: MonthlyTrendsLineChartProps) {
  const totalCollected = data.reduce((sum, item) => sum + item.collected, 0);
  const totalPending = data.reduce((sum, item) => sum + item.pending, 0);
  const avgCompletion =
    data.reduce((sum, item) => sum + item.completion, 0) / data.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="collected"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              name="Collected"
            />
            <Line
              type="monotone"
              dataKey="pending"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              name="Pending"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardContent className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Total Collected: ₹{totalCollected.toLocaleString()}
        </div>
        <div className="flex gap-2 leading-none font-medium">
          Total Pending: ₹{totalPending.toLocaleString()}
        </div>
        <div className="text-muted-foreground leading-none">
          Average completion rate: {avgCompletion.toFixed(1)}%
        </div>
      </CardContent>
    </Card>
  );
}
