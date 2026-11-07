"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { en } from "@/lib/strings/en";

const config = {
  inquiries: { label: en.dashboard.chart.series, color: "var(--chart-4)" },
} satisfies ChartConfig;

export type ChartPoint = { day: string; label: string; inquiries: number };

// Bars for the last 30 days (DASH-2). Labels are already formatted on the server.
export function ActivityChart({ data, summary }: { data: ChartPoint[]; summary: string }) {
  return (
    <ChartContainer
      config={config}
      role="img"
      aria-label={summary}
      className="aspect-auto h-64 w-full"
    >
      <BarChart data={data} margin={{ left: 0, right: 0, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
          interval="preserveStartEnd"
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
        <Bar dataKey="inquiries" fill="var(--color-inquiries)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
