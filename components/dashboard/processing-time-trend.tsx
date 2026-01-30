"use client"

import { TrendingDown } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ProcessingTimeTrendData {
  date: string;
  avgTime: number;
}

interface ProcessingTimeTrendProps {
  data: ProcessingTimeTrendData[];
}

const chartConfig = {
  avgTime: {
    label: "Temps Moyen",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export function ProcessingTimeTrend({ data }: ProcessingTimeTrendProps) {
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const chartData = data.map((item) => ({
    ...item,
    dateFormatted: formatDate(item.date),
  }));

  return (
    <Card className="col-span-full border-none shadow-sm ring-1 ring-slate-100 overflow-hidden">
      <CardHeader className="border-b border-slate-50 bg-slate-50/30 pb-4">
        <div>
          <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Réactivité des Agents</CardTitle>
          <CardDescription className="font-medium text-slate-500">
            Temps de traitement moyen quotidien (minutes)
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[350px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 0,
              right: 20,
              top: 10,
              bottom: 0
            }}
          >
            <defs>
              <linearGradient id="fillAvgTime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-avgTime)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--color-avgTime)" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-slate-200" />
            <XAxis
              dataKey="dateFormatted"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={32}
              tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
            />
            <ChartTooltip
              cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="avgTime"
              type="natural"
              stroke="var(--color-avgTime)"
              strokeWidth={4}
              fill="url(#fillAvgTime)"
              fillOpacity={1}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: "var(--color-avgTime)" }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="bg-slate-50/30 border-t border-slate-50 py-4">
        <div className="flex w-full items-center justify-between text-sm">
            <div className="flex items-center gap-2 font-bold text-purple-600 transition-transform hover:translate-x-1 cursor-default">
              Optimisation de la performance <TrendingDown className="h-4 w-4" />
            </div>
            <div className="text-slate-400 font-medium italic text-[10px] uppercase tracking-widest">
              Performance Analytics
            </div>
        </div>
      </CardFooter>
    </Card>
  )
}
