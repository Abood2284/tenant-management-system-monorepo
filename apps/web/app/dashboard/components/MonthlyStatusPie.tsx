// apps/web/app/(dashboard)/components/MonthlyStatusPieChart.tsx
"use client";

import * as React from "react";
import { Pie, PieChart, Cell, Sector } from "recharts";
import { CircleDollarSign } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import { ActiveShape } from "recharts/types/util/types";

interface MonthlyStatusPieChartProps {
  paid: number;
  unpaid: number;
}

const chartConfig = {
  paid: {
    label: "Paid",
    color: "hsl(var(--chart-1))",
  },
  unpaid: {
    label: "Unpaid",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

function renderActiveShape(props: any): React.ReactNode {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;

  // Your rendering logic here, for example:
  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.name} ({`${(percent * 100).toFixed(2)}%`})
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4} // make it slightly bigger
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
}

export function MonthlyStatusPieChart({
  paid,
  unpaid,
}: MonthlyStatusPieChartProps) {
  const totalValue = paid + unpaid;
  const chartData = [
    { name: "Paid", value: paid, fill: "var(--chart-5)" },
    { name: "Unpaid", value: unpaid, fill: "var(--chart-1)" },
  ];

  const chartConfig = {
    value: { label: "Amount" },
    Paid: { label: "Paid", color: "var(--chart-5)" },
    Unpaid: { label: "Unpaid", color: "var(--chart-1)" },
  } satisfies ChartConfig;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-start pb-0">
        <CardTitle>Rent Status This Month</CardTitle>
        <CardDescription>Paid vs. Unpaid for July 2025</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel={true}
                  active={false}
                  payload={[]}
                  coordinate={{ x: 0, y: 0 }}
                  accessibilityLayer={false}
                />
              }
            />
            <Pie data={chartData} dataKey="value" nameKey="name" stroke="0" />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-4">
        <div className="flex w-full items-center justify-between font-medium">
          <span>Total Due This Month</span>
          <span>₹{totalValue.toLocaleString()}</span>
        </div>
        <div className="w-full border-t border-dashed pt-2 text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: "var(--color-paid)" }}
              />
              <span>Paid</span>
            </div>
            <span>₹{paid.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: "var(--color-unpaid)" }}
              />
              <span>Unpaid</span>
            </div>
            <span>₹{unpaid.toLocaleString()}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
