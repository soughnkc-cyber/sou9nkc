"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

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

interface PriceDistributionData {
  range: string;
  count: number;
}

interface PriceDistributionPieProps {
  data: PriceDistributionData[];
}

const chartConfig = {
  count: {
    label: "Commandes",
  },
  range1: {
    label: "< 100 DH",
    color: "hsl(var(--chart-1))",
  },
  range2: {
    label: "100-500 DH",
    color: "hsl(var(--chart-2))",
  },
  range3: {
    label: "500-1000 DH",
    color: "hsl(var(--chart-3))",
  },
  range4: {
    label: "> 1000 DH",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export function PriceDistributionPie({ data }: PriceDistributionPieProps) {
  const chartData = React.useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: `var(--color-range${index + 1})`,
    }))
  }, [data])

  const totalOrders = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0)
  }, [chartData])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Distribution des Prix</CardTitle>
        <CardDescription>Répartition par tranche de prix</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="range"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalOrders.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Commandes
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
