// apps/web/app/dashboard/transactions/[tenantID]/components/RentAllocationPieChart.tsx
"use client";

import { PieChart, Pie, Cell } from "recharts";
import { CreditCard } from "lucide-react";

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
} from "@/components/ui/chart";

interface RentAllocationData {
  name: string;
  value: number;
  fill: string;
}

interface RentAllocationPieChartProps {
  data: RentAllocationData[];
  title?: string;
  description?: string;
}

const chartConfig = {
  rent: {
    label: "Rent",
    color: "hsl(var(--chart-1))",
  },
  penalty: {
    label: "Penalty",
    color: "hsl(var(--chart-2))",
  },
  outstanding: {
    label: "Outstanding",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function RentAllocationPieChart({
  data,
  title = "Rent Allocation Breakdown",
  description = "Distribution of payments across different categories",
}: RentAllocationPieChartProps) {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[350px] pb-0"
        >
          <PieChart>
            <ChartTooltip />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ name, value }: { name: string; value?: number }) => {
                const percentage = ((value || 0) / totalValue) * 100;
                return `${name} ${percentage.toFixed(0)}%`;
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardContent className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Total: ₹{totalValue.toLocaleString()}
        </div>
        <div className="text-muted-foreground leading-none">
          Showing allocation breakdown for all payments
        </div>
      </CardContent>
    </Card>
  );
}
