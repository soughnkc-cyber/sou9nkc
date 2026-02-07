"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"

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
import { useTranslations } from "next-intl"

interface TopProductData {
  name: string;
  count: number;
}

interface TopProductsChartProps {
  data: TopProductData[];
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  const t = useTranslations("Dashboard");

  const chartConfig = {
    count: {
      label: t('commandes'),
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig

  const chartData = data.map((item) => ({
    ...item,
    displayName: item.name.length > 20 ? item.name.slice(0, 17) + "..." : item.name,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('topProductsTitle')}</CardTitle>
        <CardDescription>{t('topProductsDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 0,
            }}
          >
            <YAxis
              dataKey="displayName"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={100}
            />
            <XAxis dataKey="count" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
