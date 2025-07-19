"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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

interface MonthlyCollectionData {
  month: string;
  collected: number;
  pending: number;
  completion: number;
}

interface MonthlyCollectionBarChartProps {
  data: MonthlyCollectionData[];
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

export function MonthlyCollectionBarChart({
  data,
  title = "Monthly Collection Trends",
  description = "Collection vs pending amounts by month",
}: MonthlyCollectionBarChartProps) {
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
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="month"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
              hide
            />
            <XAxis dataKey="collected" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="collected"
              layout="vertical"
              fill="hsl(var(--chart-1))"
              radius={4}
            />
            <Bar
              dataKey="pending"
              layout="vertical"
              fill="hsl(var(--chart-2))"
              radius={4}
            />
          </BarChart>
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
