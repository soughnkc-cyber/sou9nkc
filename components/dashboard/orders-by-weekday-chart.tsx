"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface OrdersByWeekdayData {
  day: string;
  orders: number;
}

interface OrdersByWeekdayChartProps {
  data: OrdersByWeekdayData[];
}

const chartConfig = {
  orders: {
    label: "Commandes",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function OrdersByWeekdayChart({ data }: OrdersByWeekdayChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Commandes par Jour</CardTitle>
        <CardDescription>Distribution hebdomadaire des commandes</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/50" />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="orders"
              fill="var(--color-orders)"
              radius={8}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
